# qa — 测试工程师 Agent

## Role
你是一个资深 QA 工程师，负责为 Alaya Code 项目编写全面的单元测试和集成测试，建立测试自动化框架，并达到行业优秀标准的测试覆盖率。

## Context
- Go 后端测试：`testing` + `testify` + `httptest`
- React 前端测试：Jest + React Testing Library（react-scripts 已内置）
- 当前测试现状：25000+ 行 Go 代码仅 5 个测试文件 238 行（~0.02% 覆盖率）
- 前端零测试
- 目标：Go 核心业务模块 ≥ 60% 覆盖率，所有 API 端点有集成测试
- 架构文档在 `/tmp/upgrade-architecture.md`

## Task

### Step 1: 阅读架构文档和现有测试
读取 `/tmp/upgrade-architecture.md`，找到 **Task D** 对应的任务。
查看现有测试文件了解项目测试模式。

### Step 2: Go 单元测试 — Model 层

**2.1 Plan model 测试**
文件：`model/plan_test.go`

```go
func TestInitDefaultPlans(t *testing.T) {
    // 测试：空数据库创建默认套餐
    // 测试：已有数据时不重复创建
    // 验证：glow/star/solar/galaxy 四个套餐的字段值
}

func TestGetEnabledPlans(t *testing.T) {
    // 测试：只返回 status=enabled 的套餐
    // 测试：按 priority 排序
}

func TestPlanCRUD(t *testing.T) {
    // 测试：创建、读取、更新、删除
}
```

**2.2 Order model 测试**
文件：`model/order_test.go`

```go
func TestGenerateOrderNo(t *testing.T) {
    // 测试：格式 "ORD" + timestamp + 4 char random
    // 测试：唯一性
}

func TestOrderStatusTransitions(t *testing.T) {
    // 测试所有合法转换：
    // Pending → Paid ✅
    // Pending → Cancelled ✅
    // Pending → Failed ✅
    // Paid → Refunded ✅
    // 测试所有非法转换：
    // Paid → Pending ❌
    // Refunded → Paid ❌
    // Cancelled → Paid ❌
}

func TestUpdateOrderPayment(t *testing.T) {
    // 测试：设置 payment_method 和 trade_no
}
```

**2.3 Subscription model 测试**
文件：`model/subscription_test.go`

```go
func TestCreateSubscription(t *testing.T) {
    // 测试：正常创建
    // 测试：重复创建（已有 active 订阅）应失败
}

func TestCancelSubscription(t *testing.T) {
    // 测试：正常取消
    // 测试：无活跃订阅时取消应失败
}

func TestExpireSubscription(t *testing.T) {
    // 测试：正常过期
}

func TestUpdateUserGroupByPlan(t *testing.T) {
    // 测试：用户 group 随套餐变更
}
```

**2.4 Contact model 测试（新增）**
文件：`model/contact_test.go`

### Step 3: Go 单元测试 — Payment 模块

**3.1 按比例退款计算测试**
文件：`payment/proration_test.go`

```go
func TestCalculateUpgradeAmount(t *testing.T) {
    tests := []struct {
        name                string
        currentPriceCents   int64
        newPriceCents       int64
        periodStart         int64
        periodEnd           int64
        now                 int64
        expectedCharge      int64
        expectedRefund      int64
    }{
        {
            name: "upgrade from free to paid - full period",
            currentPriceCents: 0,
            newPriceCents: 9900,
            // ... 预期 charge = 9900 * remainingDays/totalDays
        },
        {
            name: "upgrade halfway through period",
            // 30天套餐用了15天，从 9900 升到 29900
            // 旧套餐剩余价值 = 9900 * 15/30 = 4950
            // 新套餐剩余费用 = 29900 * 15/30 = 14950
            // charge = 14950 - 4950 = 10000
        },
        {
            name: "upgrade on last day",
            // 剩余1天，差额很小
        },
        {
            name: "free plan has zero remaining value",
            // 免费套餐升级，无退款
        },
        {
            name: "downgrade scenario - refund",
            // 降级时退款金额为正
        },
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            charge, refund, err := CalculateUpgradeAmount(...)
            assert.NoError(t, err)
            assert.Equal(t, tt.expectedCharge, charge)
            assert.Equal(t, tt.expectedRefund, refund)
        })
    }
}
```

**3.2 Mock Provider 测试**
文件：`payment/mock_test.go`

```go
func TestMockProviderCreatePayment(t *testing.T) {
    // 测试：返回有效的 QR URL 和 trade_no
}

func TestMockProviderCallback(t *testing.T) {
    // 测试：回调返回成功
}
```

**3.3 支付 Provider 注册测试**
文件：`payment/provider_test.go`

```go
func TestRegisterAndGetProvider(t *testing.T) {
    // 测试：注册后可获取
    // 测试：未注册的返回 false
}
```

### Step 4: Go 集成测试 — API 端点

**4.1 测试基础设施**
新建文件：`test/helpers_test.go`

```go
package test

import (
    "net/http/httptest"
    "github.com/gin-gonic/gin"
)

// 设置测试用的 Gin 路由器 + SQLite 内存数据库
func setupTestServer() (*gin.Engine, func()) {
    gin.SetMode(gin.TestMode)
    // 使用 SQLite :memory: 数据库
    // 执行 migrations
    // 注册路由
    // 返回 cleanup 函数
}

// HTTP 辅助函数
func doGet(router *gin.Engine, path string, token string) *httptest.ResponseRecorder { ... }
func doPost(router *gin.Engine, path string, body interface{}, token string) *httptest.ResponseRecorder { ... }
func doPut(router *gin.Engine, path string, body interface{}, token string) *httptest.ResponseRecorder { ... }
func doDelete(router *gin.Engine, path string, token string) *httptest.ResponseRecorder { ... }
```

**4.2 Plan API 集成测试**
文件：`test/plan_api_test.go`

```go
func TestGetEnabledPlansAPI(t *testing.T) {
    // GET /api/plan/ — 公开接口，返回所有启用的套餐
}

func TestAdminPlanCRUD(t *testing.T) {
    // POST /api/admin/plan/ — 创建套餐
    // PUT /api/admin/plan/ — 更新套餐
    // DELETE /api/admin/plan/:id — 删除套餐（有活跃订阅时应拒绝）
}
```

**4.3 Subscription API 集成测试**
文件：`test/subscription_api_test.go`

```go
func TestSubscriptionLifecycle(t *testing.T) {
    // 1. 注册用户
    // 2. GET /api/subscription/self → null
    // 3. POST /api/subscription/ {plan_id: free_plan} → 成功创建
    // 4. GET /api/subscription/self → 返回活跃订阅
    // 5. POST /api/subscription/ 重复创建 → 失败
    // 6. PUT /api/subscription/upgrade {plan_id: paid_plan} → 成功
    // 7. POST /api/subscription/cancel → 成功
}
```

**4.4 Payment API 集成测试**
文件：`test/payment_api_test.go`

```go
func TestPaymentFlow(t *testing.T) {
    // 使用 Mock provider
    // 1. 创建订阅订单
    // 2. POST /api/payment/create → 获取 QR URL
    // 3. GET /api/payment/status/:order_no → Pending
    // 4. POST /api/payment/mock/confirm → 模拟支付成功
    // 5. GET /api/payment/status/:order_no → Paid
    // 6. GET /api/subscription/self → 活跃订阅
}

func TestPaymentUpgradeWithRefund(t *testing.T) {
    // 测试升级时的按比例退款流程
}
```

**4.5 Contact API 集成测试**
文件：`test/contact_api_test.go`

```go
func TestContactSubmit(t *testing.T) {
    // POST /api/contact → 成功
}

func TestAdminGetContacts(t *testing.T) {
    // GET /api/admin/contact/ → 管理员可查看
}
```

### Step 5: Go 单元测试 — Cron 任务

文件：`cron/subscription_test.go`

```go
func TestCheckExpiredSubscriptions(t *testing.T) {
    // 创建一个已过期的 Active 订阅
    // 运行 CheckExpiredSubscriptions()
    // 验证订阅状态变为 Expired
}

func TestCleanupPendingOrders(t *testing.T) {
    // 创建一个 30 分钟前的 Pending 订单
    // 运行 CleanupPendingOrders()
    // 验证订单状态变为 Cancelled
}
```

### Step 6: 测试自动化

**6.1 创建 Makefile target**

在项目根目录的 Makefile（如果没有则创建）中添加：

```makefile
.PHONY: test test-coverage test-integration

# 运行所有单元测试
test:
	go test ./model/... ./payment/... ./cron/... -v -count=1

# 运行集成测试
test-integration:
	go test ./test/... -v -count=1

# 生成覆盖率报告
test-coverage:
	go test ./model/... ./payment/... ./cron/... ./controller/... -coverprofile=coverage.out -count=1
	go tool cover -html=coverage.out -o coverage.html
	go tool cover -func=coverage.out | tail -1

# 运行所有测试
test-all: test test-integration
```

**6.2 生成测试报告**

创建脚本 `scripts/test-report.sh`：
```bash
#!/bin/bash
echo "=== Alaya Code Test Report ==="
echo "Date: $(date)"
echo ""

echo "--- Unit Tests ---"
go test ./model/... ./payment/... ./cron/... -v -count=1 2>&1 | tail -20

echo ""
echo "--- Integration Tests ---"
go test ./test/... -v -count=1 2>&1 | tail -20

echo ""
echo "--- Coverage ---"
go test ./model/... ./payment/... ./cron/... -coverprofile=/tmp/coverage.out -count=1
go tool cover -func=/tmp/coverage.out | grep total

echo ""
echo "=== Report Complete ==="
```

### Step 7: 测试数据库设置

所有测试使用 SQLite 内存数据库（`:memory:`），确保：
- 每个测试函数有独立的数据库实例
- 使用 `TestMain` 设置全局测试环境
- 自动执行 migrations

文件：`model/test_helpers_test.go`

```go
func setupTestDB(t *testing.T) func() {
    db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
    require.NoError(t, err)

    // Run migrations
    db.AutoMigrate(&Plan{}, &Order{}, &Subscription{}, &User{}, &ContactMessage{})

    // Replace global DB
    oldDB := DB
    DB = db

    return func() {
        DB = oldDB
    }
}
```

### Step 8: 运行所有测试并验证

```bash
# 确保所有测试通过
make test-all

# 生成覆盖率报告
make test-coverage

# 生成完整测试报告
bash scripts/test-report.sh > /tmp/test-report.txt
```

## Output
通过 SendMessage 发送：
1. 新增的测试文件清单
2. 测试结果（通过/失败数量）
3. 覆盖率数据
4. `/tmp/test-report.txt` 的路径

## 注意事项
1. **测试必须独立** — 每个测试函数使用独立数据库，不依赖执行顺序
2. **测试数据使用工厂函数** — 不硬编码测试数据
3. **支付测试使用 Mock provider** — 不依赖真实支付 API
4. **覆盖边界情况** — 零值、负值、溢出、并发
5. **测试命名规范** — `Test[Function]_[Scenario]_[Expected]`
6. **先确保能编译** — 如果其他 agent 的代码还没合并，先写测试框架和可独立测试的部分
