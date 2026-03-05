# 04 - 业务逻辑评审与重构报告

**评审范围**：模型中继 Relay、计费系统、订阅系统、渠道管理、配额系统、缓存策略、滚动窗口
**评审日期**：2026-03-05（第二轮深度评审）
**评审人**：business-reviewer

---

## 一、总体评价

| 模块 | 评级 | 说明 |
|------|------|------|
| 模型中继 Relay | 🟡 | 适配器架构清晰，38 适配器；竞态条件已修复，重试逻辑合理 |
| 计费系统 | 🟡 → 🟢 | GetSubscription/GetUsage 逻辑 bug 已修复；预扣/返还机制完整 |
| 订阅系统 | 🟡 → 🟢 | 生命周期完整；过期检查/缓存失效已完善 |
| 渠道管理 | 🟡 | 健康检测完善；Weight 字段未使用，负载均衡仅依赖 Priority |
| 配额系统 | 🟡 | 预扣/返还机制完整；批量更新有锁保护 |
| 缓存策略 | 🟡 → 🟢 | 新增 CacheInvalidateUserGroup；用户组变更后缓存及时失效 |
| 滚动窗口 | 🟢 | Redis Sorted Set + DB 双写；回退逻辑已修复 |

---

## 二、本轮新增修复（第二轮）

### 🔴 Fix 11: GetSubscription 逻辑 Bug (`controller/billing.go:28`)

**问题**：`GetSubscription` 中 `usedQuota` 获取被放在 `err != nil` 分支里，导致只有当 `GetUserQuota` 失败时才会去取 `usedQuota`。正常情况下 `usedQuota` 始终为 0，返回的 `quota = remainQuota + 0` 不完整。

**影响**：OpenAI 兼容的 `/v1/dashboard/billing/subscription` 接口返回错误的 `hard_limit_usd`。

```go
// Before (BUG):
remainQuota, err = model.GetUserQuota(userId)
if err != nil {  // 只在失败时获取 usedQuota
    usedQuota, err = model.GetUserUsedQuota(userId)
}

// After (FIXED):
remainQuota, err = model.GetUserQuota(userId)
if err == nil {  // 成功时继续获取 usedQuota
    usedQuota, err = model.GetUserUsedQuota(userId)
}
```

### 🔴 Fix 12: GetUsage 空指针 (`controller/billing.go:72`)

**问题**：`GetUsage` 中 `GetTokenById` 返回 error 时 `token` 为 nil，但下一行直接访问 `token.UsedQuota`，导致 nil pointer panic。

```go
// Before (PANIC):
token, err = model.GetTokenById(tokenId)
quota = token.UsedQuota  // token may be nil!

// After (SAFE):
token, err = model.GetTokenById(tokenId)
if err == nil {
    quota = token.UsedQuota
}
```

### 🟡 Fix 13: BoosterPack.Update() 零值问题 (`model/booster_pack.go:50-53`)

**问题**：`Update()` 使用 `DB.Model(bp).Updates(bp)` 更新，GORM 的 `Updates` 方法忽略零值字段。如将 `PriceCents` 改为 0（免费）或 `ExtraCount` 改为 0 则无法更新。

**修复**：改为 `DB.Save(bp)` 完整保存所有字段。

### 🟡 Fix 14: 用户组缓存未失效 (`model/subscription.go:166-179`)

**问题**：`UpdateUserGroupByPlan` 更新用户的 group 字段后，未清除 Redis 中的 `user_group:{userId}` 缓存。导致用户升级/降级后，新的 group 权限延迟 `SyncFrequency` 秒才生效。

**影响**：用户升级套餐后，在缓存过期前仍使用旧组的模型权限和计费比例。

**修复**：
1. 新增 `CacheInvalidateUserGroup(userId)` 函数（`model/cache.go`）
2. 在 `UpdateUserGroupByPlan` 成功后调用缓存失效

### 🟡 Fix 15: handlePaymentSuccess 幂等性注释完善 (`controller/payment.go:334`)

**问题**：`handlePaymentSuccess` 的幂等性依赖 `UpdateOrderStatus` 的原子转换（`WHERE status IN ?`），但代码注释不清晰，前置的 `order.Status == OrderStatusPaid` 检查是快速路径而非唯一保障。

**修复**：完善注释说明幂等性依赖原子状态转换。

---

## 三、第一轮已实施修复（保留）

### 🔴 Fix 1: relay.go 竞态条件 (`controller/relay.go:92-102`)
- `processChannelRelayError` goroutine 引用共享 `bizErr` 的 data race → 构造值类型副本

### 🔴 Fix 2: 订单状态转换竞态条件 (`model/order.go:102-131`)
- Check-then-act → 单条 SQL 原子 `WHERE id = ? AND status IN ?`

### 🔴 Fix 3: 订阅中间件未检查过期时间 (`middleware/subscription.go:41-48`)
- 未检查 `CurrentPeriodEnd` → 增加过期时间检查

### 🔴 Fix 4: PostConsumeTokenQuota 错误吞没 (`model/token.go:282-303`)
- 用户 quota 扣减 err 被覆盖 → 增加提前 return

### 🟡 Fix 5-9: 升级/续费/降级错误处理、图片订阅模式、日志参数、Redis 回退
- 详见第一轮报告

### 🟢 Fix 10: RecordUsageWindow Redis TTL
- 写入 Redis Sorted Set 后设置 TTL

---

## 四、现存问题与建议

### 🔴 高优先级

#### 4.1 PreConsumeTokenQuota 竞态条件 (`model/token.go:217-280`)

`PreConsumeTokenQuota` 先 `GetTokenById` 检查余额，再分别 `DecreaseTokenQuota` 和 `DecreaseUserQuota`。两步之间无事务，高并发下可超扣。

```go
token := GetTokenById(tokenId)               // T1: read quota=100
if token.RemainQuota < quota { return err }   // T1: 100 >= 50, pass
                                               // T2: read quota=100, also pass
DecreaseTokenQuota(tokenId, quota)            // T1: quota -> 50
                                               // T2: quota -> 0 (or negative)
```

**建议**：使用数据库级 `WHERE remain_quota >= ?` 条件更新。

#### 4.2 渠道 Weight 字段未使用 (`model/cache.go:227-255`)

`Channel.Weight` 已定义但在选择算法中未使用。

#### 4.3 降级任务无后台执行机制

`DowngradeSubscription` 创建订单后返回"将在当前计费周期结束后生效"，但无定时任务实际执行。

### 🟡 中优先级

#### 4.4 缓存无 Singleflight 防惊群
#### 4.5 Audio 接口缺少订阅模式支持
#### 4.6 Image 接口无预扣/返还机制
#### 4.7 Subscription 周期硬编码30天
#### 4.8 `CacheUpdateUserQuota` 递归调用

### 🟢 低优先级

#### 4.9 OrderNo 潜在碰撞
#### 4.10 批量更新窗口内数据丢失风险
#### 4.11 测试覆盖率极低

---

## 五、模块详细分析

### 5.1 模型中继 Relay

**架构**：统一 `Adaptor` 接口 + 38 适配器（18 全功能 + 20 轻量级），工厂模式按 APIType 分发。

**关键流程**：
```
请求验证 → 模型名映射 → 比例计算 → 预扣 quota → 适配器转换 →
上游请求 → 响应处理 → 实际计费/退回预扣
```

**重试机制**：
- 429 / 5xx 自动重试（`config.RetryTimes` 次）
- 跳过已失败的同一渠道
- 重试时降低 Priority（`ignoreFirstPriority=true`）

**适配器接口**：
```go
type Adaptor interface {
    Init(meta *meta.Meta)
    GetRequestURL(meta *meta.Meta) (string, error)
    SetupRequestHeader(c *gin.Context, req *http.Request, meta *meta.Meta) error
    ConvertRequest(c *gin.Context, relayMode int, request *model.GeneralOpenAIRequest) (any, error)
    ConvertImageRequest(request *model.ImageRequest) (any, error)
    DoRequest(c *gin.Context, meta *meta.Meta, requestBody io.Reader) (*http.Response, error)
    DoResponse(c *gin.Context, resp *http.Response, meta *meta.Meta) (usage *model.Usage, err *model.ErrorWithStatusCode)
    GetModelList() []string
    GetChannelName() string
}
```

### 5.2 计费系统

**三路计费**：
1. **无订阅**：传统 Token/User Quota 扣减
2. **订阅+窗口内**：免费使用，仅记录 usage window
3. **订阅+超额**：按 Quota 计费 + 更新 `MonthlySpentCents`

**公式**：
```
preConsumedQuota = (PreConsumedQuota + promptTokens + maxTokens) × modelRatio × groupRatio
actualQuota = ceil((promptTokens + completionTokens × completionRatio) × modelRatio × groupRatio)
```

### 5.3 订阅系统

**生命周期**：创建 → 活跃 → 续费/升级/降级 → 取消/过期

**状态**：Active(1), Expired(2), Cancelled(3), PastDue(4)

**防重复**：`CreateSubscription` 使用事务 check-and-insert

**缓存失效**：所有 mutation 后调用 `CacheInvalidateSubscription(userId)` + `CacheInvalidateUserGroup(userId)`

### 5.4 渠道管理

**选择算法**：Group → Model → 按 Priority 排序 → 最高 Priority 组内均匀随机

**内存缓存**：`group2model2channels map[string]map[string][]*Channel`，RWMutex 保护

### 5.5 配额系统

**批量更新**：5 种类型各有独立 map + mutex，定时聚合写入 DB

**原子操作**：所有 quota 增减使用 `gorm.Expr("field + ?", delta)`

### 5.6 滚动窗口

**双层存储**：DB `usage_windows` + Redis Sorted Set（score=timestamp）

**三种窗口**：Aligned（固定边界）、Sliding（滑动）、Weekly（周一00:00起）

---

## 六、本轮修改文件清单

| 文件 | 修改类型 | 说明 |
|------|----------|------|
| `controller/billing.go` | 🔴 Bug Fix | 修复 GetSubscription 逻辑 bug（err != nil → err == nil）|
| `controller/billing.go` | 🔴 Bug Fix | 修复 GetUsage nil pointer panic |
| `model/booster_pack.go` | 🟡 Bug Fix | Update() 改用 DB.Save() 支持零值更新 |
| `model/subscription.go` | 🟡 Enhancement | UpdateUserGroupByPlan 后失效用户组缓存 |
| `model/cache.go` | 🟡 Enhancement | 新增 CacheInvalidateUserGroup 函数 |
| `controller/payment.go` | 🟢 Enhancement | 完善 handlePaymentSuccess 幂等性注释 |

---

## 七、构建验证

```
$ go build ./...
# 编译通过，无错误

$ go test ./...
# model, relay, payment, billing 等测试通过
# 唯一失败: common/image TestDecode (pre-existing JPEG decode bug, 非本次修改)
```

---

## 八、建议后续事项

1. **高优先级**：为 `PreConsumeTokenQuota` 实现数据库级原子扣减（WHERE remain_quota >= ?）
2. **高优先级**：实现降级定时任务（检查到期降级订单并执行 plan 切换）
3. **中优先级**：为 Audio 接口添加订阅模式支持
4. **中优先级**：引入 singleflight 缓存保护
5. **低优先级**：实现 Weight 加权渠道选择
6. **低优先级**：为核心计费/配额路径补充单元测试
