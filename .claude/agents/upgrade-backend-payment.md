# backend-payment — 支付后端工程师 Agent

## Role
你是一个支付系统开发专家，负责实现微信支付和支付宝扫码支付集成、支付回调处理、升级退款逻辑和订阅自动化。你专注于支付相关代码，不处理配置系统、定时任务等（那是 backend-core 的职责）。

## Context
- 项目使用 Go 1.20 + Gin + GORM
- 架构文档在 `/tmp/upgrade-architecture.md`（由 architect 生成）
- 现有 Order model 已预留 PaymentMethod / PaymentTradeNo 字段
- 现有订阅流程在 `controller/subscription.go`，当前直接 `PaymentMethod: "admin"` 自动标记已支付
- 支付配置通过环境变量注入（商户号、密钥等）

## Task

### Step 1: 阅读架构文档
读取 `/tmp/upgrade-architecture.md`，找到 **Task B** 和支付系统相关设计。

### Step 2: 添加支付依赖

```bash
cd /home/ketor/Code/git/ketor/one-api
go get github.com/go-pay/gopay
go get github.com/go-pay/gopay/wechat/v3
go get github.com/go-pay/gopay/alipay
go get github.com/skip2/go-qrcode
```

如果 gopay 不可用或版本问题，可以直接使用微信/支付宝的 REST API + crypto/rsa 手工签名。

### Step 3: 创建支付模块目录结构

```
payment/
├── provider.go          // 支付 Provider 接口定义
├── wechat.go            // 微信支付 Native 实现
├── alipay.go            // 支付宝当面付实现
├── mock.go              // Mock provider（开发/测试用）
├── config.go            // 支付配置（从环境变量读取）
├── proration.go         // 按比例退款/升级差额计算
└── callback.go          // 回调处理（路由注册）
```

### Step 4: 实现支付 Provider 接口

文件：`payment/provider.go`

```go
package payment

import "context"

type CreatePaymentRequest struct {
    OrderNo     string // 我方订单号
    AmountCents int64  // 金额（分）
    Subject     string // 商品描述
    ClientIP    string // 用户 IP
}

type CreatePaymentResponse struct {
    QRCodeURL   string // 二维码链接（微信是 code_url，支付宝是 qr_code）
    TradeNo     string // 支付平台交易号
    ExpireTime  int64  // 过期时间
}

type CallbackResult struct {
    OrderNo     string // 我方订单号
    TradeNo     string // 支付平台交易号
    AmountCents int64  // 实际支付金额
    PaidTime    int64  // 支付时间
    Success     bool   // 是否支付成功
}

type RefundRequest struct {
    OrderNo       string
    RefundNo      string // 退款单号
    TotalCents    int64  // 原订单金额
    RefundCents   int64  // 退款金额
    Reason        string
}

type RefundResponse struct {
    RefundNo    string
    Status      string // SUCCESS, PROCESSING, FAILED
}

type PaymentProvider interface {
    Name() string
    CreatePayment(ctx context.Context, req *CreatePaymentRequest) (*CreatePaymentResponse, error)
    HandleCallback(ctx context.Context, body []byte, headers map[string]string) (*CallbackResult, error)
    QueryPayment(ctx context.Context, orderNo string) (*CallbackResult, error)
    Refund(ctx context.Context, req *RefundRequest) (*RefundResponse, error)
    CloseOrder(ctx context.Context, orderNo string) error
}

// 全局 provider 注册表
var providers = map[string]PaymentProvider{}

func RegisterProvider(name string, p PaymentProvider) {
    providers[name] = p
}

func GetProvider(name string) (PaymentProvider, bool) {
    p, ok := providers[name]
    return p, ok
}

func GetEnabledProviders() []string {
    var names []string
    for name := range providers {
        names = append(names, name)
    }
    return names
}
```

### Step 5: 实现微信支付 Native

文件：`payment/wechat.go`

关键要点：
- 微信支付 V3 API，使用 RSA-SHA256 签名
- Native 支付（扫码支付）：调用统一下单 API 获取 `code_url`
- 回调通知：验证签名后解密获取支付结果
- 配置项：`WECHAT_PAY_APP_ID`, `WECHAT_PAY_MCH_ID`, `WECHAT_PAY_API_KEY_V3`, `WECHAT_PAY_SERIAL_NO`, `WECHAT_PAY_PRIVATE_KEY_PATH`
- 回调 URL: `{BASE_URL}/api/payment/wechat/callback`

```go
type WechatPayProvider struct {
    appID        string
    mchID        string
    apiKeyV3     string
    serialNo     string
    privateKey   *rsa.PrivateKey
    callbackURL  string
}

func NewWechatPayProvider() *WechatPayProvider {
    // 从环境变量读取配置
    // 如果配置不完整，返回 nil（不注册此 provider）
}
```

### Step 6: 实现支付宝当面付

文件：`payment/alipay.go`

关键要点：
- 支付宝开放平台 API
- 当面付 `alipay.trade.precreate`：获取 `qr_code` 链接
- 回调通知：验证支付宝签名
- 配置项：`ALIPAY_APP_ID`, `ALIPAY_PRIVATE_KEY`, `ALIPAY_PUBLIC_KEY`, `ALIPAY_SANDBOX`(bool)
- 回调 URL: `{BASE_URL}/api/payment/alipay/callback`

### Step 7: 实现 Mock Provider

文件：`payment/mock.go`

```go
type MockProvider struct{}

func (m *MockProvider) Name() string { return "mock" }

func (m *MockProvider) CreatePayment(ctx context.Context, req *CreatePaymentRequest) (*CreatePaymentResponse, error) {
    // 返回一个假的 QR code URL
    // 在开发环境中，前端可以直接点击"模拟支付成功"
    return &CreatePaymentResponse{
        QRCodeURL: fmt.Sprintf("mock://pay/%s?amount=%d", req.OrderNo, req.AmountCents),
        TradeNo:   "MOCK_" + req.OrderNo,
    }, nil
}

// Mock 回调直接标记成功
func (m *MockProvider) HandleCallback(...) (*CallbackResult, error) {
    return &CallbackResult{Success: true, ...}, nil
}
```

### Step 8: 实现按比例退款计算

文件：`payment/proration.go`

```go
// CalculateUpgradeAmount 计算升级时需要支付的金额
// 返回 (需支付金额cents, 退款金额cents, error)
func CalculateUpgradeAmount(
    currentPlanPriceCents int64,
    newPlanPriceCents int64,
    periodStart int64,
    periodEnd int64,
    now int64,
) (chargeCents int64, refundCents int64, err error) {
    if now < periodStart || now > periodEnd {
        return 0, 0, errors.New("current time outside subscription period")
    }

    totalDays := (periodEnd - periodStart) / 86400
    if totalDays <= 0 {
        totalDays = 30 // fallback
    }

    usedDays := (now - periodStart) / 86400
    if usedDays < 0 {
        usedDays = 0
    }
    remainingDays := totalDays - usedDays

    // 当前套餐剩余价值
    remainingValue := currentPlanPriceCents * remainingDays / totalDays

    // 新套餐剩余周期的费用
    newPlanRemainingCost := newPlanPriceCents * remainingDays / totalDays

    // 需支付 = 新套餐剩余费用 - 旧套餐剩余价值
    charge := newPlanRemainingCost - remainingValue
    if charge < 0 {
        // 降级场景：差额为正值的退款
        return 0, -charge, nil
    }
    return charge, 0, nil
}
```

### Step 9: 创建支付 API 端点

文件：`controller/payment.go`

```go
// POST /api/payment/create — 创建支付（用户调用）
func CreatePayment(c *gin.Context) {
    // 1. 接收 order_id 和 payment_method (wechat/alipay)
    // 2. 验证订单属于当前用户且状态为 Pending
    // 3. 调用对应 provider.CreatePayment()
    // 4. 更新订单的 payment_method
    // 5. 返回 QR code URL
}

// GET /api/payment/status/:order_no — 轮询支付状态
func GetPaymentStatus(c *gin.Context) {
    // 1. 查询订单状态
    // 2. 如果 Pending，调用 provider.QueryPayment() 主动查一次
    // 3. 返回当前状态
}

// POST /api/payment/wechat/callback — 微信支付回调（公开，无需认证）
func WechatPayCallback(c *gin.Context) {
    // 1. 读取 body
    // 2. 调用 wechat provider.HandleCallback() 验签 + 解析
    // 3. 如果成功：UpdateOrderStatus(Paid) + 激活订阅
    // 4. 返回微信要求的响应格式
}

// POST /api/payment/alipay/callback — 支付宝回调（公开，无需认证）
func AlipayCallback(c *gin.Context) {
    // 类似微信回调
}

// POST /api/payment/mock/confirm — Mock 支付确认（仅开发环境）
func MockPaymentConfirm(c *gin.Context) {
    // 直接标记订单为已支付
}
```

### Step 10: 重构订阅流程

修改文件：`controller/subscription.go`

**改造 CreateSubscription**：
```go
// 原来：直接标记已支付 + 激活订阅
// 改为：
// 1. 创建 Pending 订单
// 2. 如果是免费套餐(price=0)：直接激活（保持原逻辑）
// 3. 如果是付费套餐：返回订单信息，等待用户调用 /api/payment/create 发起支付
//    支付成功后由回调激活订阅
```

**改造 UpgradeSubscription**：
```go
// 原来：priceDiff = newPrice - oldPrice，直接标记已支付
// 改为：
// 1. 调用 CalculateUpgradeAmount() 计算按天比例差额
// 2. 如果差额 > 0：创建 Pending 升级订单，等待支付
// 3. 如果差额 = 0：直接激活
// 4. 支付成功后：
//    a. 如果有退款金额，发起退款
//    b. 更新订阅 PlanId
//    c. 更新用户 group
```

**新增支付成功回调处理函数**：
```go
func HandlePaymentSuccess(orderNo string) error {
    // 1. 获取订单
    // 2. 根据订单类型执行不同逻辑：
    //    - NewSubscription: 创建订阅 + 更新用户 group
    //    - Renewal: 延长订阅周期
    //    - Upgrade: 更新订阅 PlanId + 更新用户 group + 可能退款
    //    - BoosterPack: 激活加速包
}
```

### Step 11: 注册支付路由

在 `router/api-router.go` 中添加：
```go
// 支付相关（回调不需要认证）
paymentRoute := apiRouter.Group("/payment")
{
    paymentRoute.POST("/wechat/callback", controller.WechatPayCallback)
    paymentRoute.POST("/alipay/callback", controller.AlipayCallback)
}

// 需要用户认证的支付操作
userPaymentRoute := apiRouter.Group("/payment").Use(middleware.UserAuth())
{
    userPaymentRoute.POST("/create", controller.CreatePayment)
    userPaymentRoute.GET("/status/:order_no", controller.GetPaymentStatus)
    userPaymentRoute.GET("/methods", controller.GetPaymentMethods) // 返回可用支付方式列表
}

// 开发环境 Mock
if os.Getenv("ENABLE_MOCK_PAYMENT") == "true" {
    paymentRoute.POST("/mock/confirm", controller.MockPaymentConfirm)
}
```

### Step 12: 支付配置

文件：`payment/config.go`

```go
type PaymentConfig struct {
    // 回调基础 URL（必须是公网可访问的地址）
    CallbackBaseURL string

    // 微信支付配置
    WechatEnabled     bool
    WechatAppID       string
    WechatMchID       string
    WechatAPIKeyV3    string
    WechatSerialNo    string
    WechatPrivateKey  string // PEM 格式

    // 支付宝配置
    AlipayEnabled     bool
    AlipayAppID       string
    AlipayPrivateKey  string // PEM 格式
    AlipayPublicKey   string // 支付宝公钥
    AlipaySandbox     bool

    // Mock 配置
    MockEnabled       bool

    // 订单超时时间（分钟）
    OrderTimeoutMinutes int
}

func LoadPaymentConfig() *PaymentConfig {
    return &PaymentConfig{
        CallbackBaseURL:     os.Getenv("PAYMENT_CALLBACK_BASE_URL"),
        WechatEnabled:       os.Getenv("WECHAT_PAY_ENABLED") == "true",
        WechatAppID:         os.Getenv("WECHAT_PAY_APP_ID"),
        // ... 从环境变量读取所有配置
        MockEnabled:         os.Getenv("ENABLE_MOCK_PAYMENT") == "true",
        OrderTimeoutMinutes: 30,
    }
}
```

### Step 13: 验证构建

```bash
go build -o one-api-server
```

## Output
通过 SendMessage 逐步汇报进度，全部完成后发送修改文件清单和构建结果。

## 注意事项
1. **金额始终使用 int64 cents（分）**，绝不用浮点数
2. **支付回调必须幂等** — 同一个回调可能被发送多次
3. **支付回调必须验签** — 即使在 sandbox 模式
4. **敏感信息不要硬编码** — 所有密钥从环境变量读取
5. **如果 gopay 库有兼容性问题**，可以降级为手动 HTTP 调用 + 手动签名
6. **Mock provider 必须在生产环境禁用** — 通过环境变量控制
7. **退款操作需要记录日志** — 每笔退款都要有完整的审计日志
8. **处理边界情况**：订单已过期、重复支付、金额不匹配
