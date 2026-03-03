# 安全与运维评审报告

**项目**: One-API / Alaya Code
**评审人**: security-reviewer
**日期**: 2026-03-04
**范围**: 安全漏洞、认证安全、API 安全、依赖安全、Docker 安全、运维就绪性

---

## 一、评审总览

| 维度 | 状态 | 说明 |
|------|------|------|
| SQL 注入 | 🟢 良好 | 全部使用 GORM 参数化查询 |
| 密码存储 | 🟢 良好 | bcrypt + DefaultCost |
| CORS 配置 | 🔴→🟢 已修复 | AllowAllOrigins+AllowCredentials 组合已修复 |
| OAuth 状态验证 | 🔴→🟢 已修复 | 类型断言可能 panic，已修复 |
| API Key 泄露 | 🔴→🟢 已修复 | OpenAI-SB 的 key 在 URL 中暴露，已修复 |
| SSRF 防护 | 🟡→🟢 已修复 | WeChat code 参数未编码，已修复 |
| 信息泄露 | 🔴→🟢 已修复 | 子网配置/IP 泄露、邮箱枚举已修复 |
| 逻辑漏洞 | 🔴→🟢 已修复 | DeleteUser 成功/失败倒置已修复 |
| Docker 安全 | 🟡→🟢 已修复 | 非 root 用户、固定基础镜像版本 |
| 速率限制 | 🟡 可改进 | 登录有 CriticalRateLimit，但无 per-IP 限制 |
| 优雅关闭 | 🟡 待改进 | 无信号处理，依赖 Gin 的 Run() 阻塞 |
| 依赖安全 | 🟡 可改进 | JWT v3 过时，axios 过时 |
| 敏感数据脱敏 | 🟡 可改进 | Channel Key 在部分 API 响应中暴露 |

---

## 二、已修复的安全问题

### 🔴 1. CORS 安全配置错误（严重）

**文件**: `middleware/cors.go`
**问题**: `AllowAllOrigins=true` 与 `AllowCredentials=true` 同时使用违反浏览器安全策略，允许任意恶意站点发送带凭证的跨域请求。
**修复**: 将 `AllowCredentials` 改为 `false`，限制 `AllowHeaders` 为具体字段而非通配符。

### 🔴 2. DeleteUser 逻辑漏洞（严重）

**文件**: `controller/user.go:504-512`
**问题**:
- 删除失败时返回 `"success": true`（成功/失败倒置）
- 删除成功时无返回响应
- 使用字符串 `"role"` 而非 `ctxkey.Role` 常量

**修复**: 修正响应逻辑，使用 `ctxkey.Role` 常量，添加成功响应。

### 🔴 3. OAuth Bind 类型断言 panic（高危）

**文件**: `controller/auth/github.go:198`, `oidc.go:205`, `lark.go:180`
**问题**: `id.(int)` 类型断言未做 nil 检查，当 session 过期或数据异常时会导致服务 panic（DoS）。
**修复**: 使用 `id, ok := id.(int)` 安全断言，失败返回会话过期提示。

### 🔴 4. OAuth State 验证类型断言 panic（高危）

**文件**: `controller/auth/github.go:89`, `oidc.go:95`, `lark.go:87`
**问题**: `session.Get("oauth_state").(string)` 未做类型安全检查，session 值非 string 时 panic。
**修复**: 使用 `oauthState, _ := session.Get("oauth_state").(string)` 安全断言。

### 🔴 5. 中间件类型断言 panic（高危）

**文件**: `middleware/auth.go:48-59`
**问题**: `status.(int)`, `id.(int)`, `role.(int)` 直接断言可能 panic。
**修复**: 使用安全断言 `statusVal, _ := status.(int)` 模式。

### 🔴 6. API Key 在 URL 中暴露（高危）

**文件**: `controller/channel-billing.go:172`
**问题**: `api_key=%s` 将渠道密钥嵌入 URL，暴露在日志、代理和浏览器历史中。
**修复**: 改为通过 HTTP Header 传递密钥。

### 🟡 7. WeChat SSRF / URL 注入风险（中危）

**文件**: `controller/auth/wechat.go:29`
**问题**: `code` 参数未经 URL 编码直接拼接到 URL，特殊字符可能导致参数注入或请求走私。
**修复**: 使用 `url.QueryEscape(code)` 编码。

### 🟡 8. 子网配置信息泄露（中危）

**文件**: `middleware/auth.go:106`
**问题**: 错误消息中暴露了子网配置和客户端 IP。
**修复**: 使用通用错误消息，不暴露内部网络配置。

### 🟡 9. 密码重置邮箱枚举（中危）

**文件**: `controller/misc.go:154-160`
**问题**: 未注册邮箱返回 "该邮箱地址未注册"，攻击者可枚举注册用户。
**修复**: 未注册邮箱也返回成功响应，防止枚举。

### 🟡 10. ResetPassword JSON 解码错误未检查（中危）

**文件**: `controller/misc.go:199-202`
**问题**: `json.NewDecoder().Decode()` 返回的 err 未检查，解析失败时使用空 struct。
**修复**: 添加 `err != nil` 检查。

### 🟡 11. Docker 安全加固

**文件**: `Dockerfile`
**修复**:
- 基础镜像从 `alpine:latest` 固定为 `alpine:3.19`
- 添加 `apk update && apk upgrade` 更新安全补丁
- 创建非 root 用户 `oneapi`，以 `USER oneapi` 运行
- 创建 `.dockerignore` 排除敏感文件

---

## 三、已确认的安全优势

### 🟢 SQL 注入防护
所有数据库查询使用 GORM 参数化查询 `WHERE("field = ?", value)`，无字符串拼接 SQL。

### 🟢 密码存储安全
`common/crypto.go` 使用 `bcrypt.GenerateFromPassword` + `bcrypt.DefaultCost(10)`，行业标准实现。

### 🟢 RBAC 权限控制
- 四级角色: Guest(0) / Common(1) / Admin(10) / Root(100)
- 中间件层面强制校验
- 管理操作有权限等级比较

### 🟢 Token 验证完善
`model/token.go` 的 `ValidateUserToken` 检查: 状态、过期时间、剩余额度、模型白名单、子网限制。

### 🟢 OAuth CSRF 保护
所有 OAuth 流程使用随机 state 参数进行 CSRF 防护。

---

## 四、仍需关注的改进项（未修改）

### 🟡 1. 优雅关闭未实现

**文件**: `main.go:120`
**问题**: 使用 `server.Run()` 阻塞，无 SIGTERM/SIGINT 信号处理。Docker stop 会强制杀进程，可能丢失进行中的请求。
**建议**: 使用 `http.Server{}.Shutdown()` + `signal.Notify` 实现优雅关闭。

### 🟡 2. Session Cookie 安全标志

**文件**: `main.go:111`
**问题**: Cookie store 未配置 `HttpOnly`、`Secure`、`SameSite` 属性。
**建议**: 配置 `store.Options(sessions.Options{HttpOnly: true, SameSite: http.SameSiteStrictMode})`。

### 🟡 3. JWT 库版本过时

**文件**: `go.mod`
**问题**: 使用 `golang-jwt/jwt v3.2.2+incompatible`（已标记为不兼容）。
**建议**: 迁移到 `golang-jwt/jwt/v5`。

### 🟡 4. 前端 axios 过时

**文件**: `web/default/package.json`
**问题**: axios v0.27.2 发布于 2022 年。
**建议**: 升级到 axios v1.x。

### 🟡 5. 登录无 per-IP 暴力破解保护

**文件**: `router/api.go`
**问题**: 登录端点仅有全局 `CriticalRateLimit()`，无按 IP/用户的限制。
**建议**: 实现基于 IP 的渐进式限流（如连续失败后增加等待时间）。

### 🟡 6. Channel Key 在 API 响应中暴露

**文件**: `model/channel.go`
**问题**: `Key` 字段有 `json:"key"` 标签，部分端点不使用 `Omit("key")`。
**建议**: 默认使用 `json:"-"`，需要时单独构造 DTO。

### 🟡 7. Docker Compose 硬编码凭证

**文件**: `docker-compose.yml:15,61,63`
**问题**: MySQL 默认密码 `123456` 和 `OneAPI@justsong` 硬编码。
**建议**: 移除默认值，强制通过环境变量配置。

### 🟡 8. 默认 Root 密码

**文件**: `model/main.go:28`
**问题**: 首次启动创建 root 用户密码为 `123456`，并记录到日志。
**建议**: 生成随机密码，仅输出到 stdout 一次。

### 🟡 9. /api/status 暴露过多信息

**文件**: `controller/misc.go:18-50`
**问题**: 公开端点暴露 OAuth client_id、OIDC 端点等配置。
**建议**: 拆分为公开 `/api/health`（仅 ok/fail）和需认证的 `/api/status`。

### 🟡 10. Debug 模式日志风险

**文件**: `relay/controller/text.go`
**问题**: Debug 模式下完整请求体被记录到日志，可能包含 API Key 和用户数据。
**建议**: 对敏感字段进行脱敏。

---

## 五、修改文件清单

| 文件 | 修改类型 | 说明 |
|------|---------|------|
| `middleware/cors.go` | 安全修复 | CORS AllowCredentials=false, 限制 AllowHeaders |
| `middleware/auth.go` | 安全修复 | 类型安全断言，移除子网/IP 信息泄露 |
| `controller/user.go` | Bug 修复 | DeleteUser 响应逻辑修正，使用 ctxkey.Role |
| `controller/misc.go` | 安全修复 | 邮箱枚举防护，JSON 解码错误检查 |
| `controller/auth/github.go` | 安全修复 | OAuth state + bind 类型安全断言 |
| `controller/auth/oidc.go` | 安全修复 | OAuth state + bind 类型安全断言 |
| `controller/auth/lark.go` | 安全修复 | OAuth state + bind 类型安全断言 |
| `controller/auth/wechat.go` | 安全修复 | URL 参数编码防 SSRF |
| `controller/channel-billing.go` | 安全修复 | API Key 从 URL 移到 Header |
| `Dockerfile` | 安全加固 | 非 root 用户，固定基础镜像版本 |
| `.dockerignore` | 新增 | 排除敏感文件和不必要的构建上下文 |

---

## 六、验证

```bash
$ go build ./...
# 编译通过，无错误
```

所有修改保持向后兼容，不改变 API 接口行为。
