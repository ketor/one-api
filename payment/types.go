package payment

// CreatePaymentRequest 创建支付请求
type CreatePaymentRequest struct {
	OrderNo     string // 商户订单号
	AmountCents int64  // 金额，单位：分
	Subject     string // 商品标题，如 "Alaya Code STAR 套餐"
	NotifyURL   string // 回调通知 URL
	ClientIP    string // 客户端 IP（微信要求）
}

// CreatePaymentResponse 创建支付响应
type CreatePaymentResponse struct {
	CodeURL    string `json:"code_url"`    // 二维码链接（微信 code_url / 支付宝 qr_code）
	TradeNo    string `json:"trade_no"`    // 支付平台交易号（如有）
	ExpireTime int64  `json:"expire_time"` // 支付过期时间戳
}

// CallbackResult 回调解析结果
type CallbackResult struct {
	OrderNo     string // 商户订单号
	TradeNo     string // 支付平台交易号
	AmountCents int64  // 实付金额（分）
	Success     bool   // 支付是否成功
}

// PaymentStatus 支付状态查询结果
type PaymentStatus struct {
	OrderNo     string
	TradeNo     string
	Status      string // "SUCCESS", "NOTPAY", "CLOSED", "REFUND"
	AmountCents int64
}

// RefundRequest 退款请求
type RefundRequest struct {
	OrderNo     string
	TradeNo     string
	RefundNo    string // 商户退款单号
	TotalCents  int64  // 原订单金额
	RefundCents int64  // 退款金额
	Reason      string
}

// RefundResponse 退款响应
type RefundResponse struct {
	RefundNo string
	RefundId string // 支付平台退款ID
	Status   string // SUCCESS, PROCESSING, FAILED
}
