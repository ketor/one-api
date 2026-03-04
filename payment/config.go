package payment

import (
	"os"
	"strconv"
)

// Config 支付配置
type Config struct {
	// 回调基础 URL（必须是公网可访问的地址）
	CallbackBaseURL string

	// 支付模式: "live", "sandbox", "mock"
	Mode string

	// 微信支付配置
	WechatAppID      string
	WechatMchID      string
	WechatAPIV3Key   string
	WechatSerialNo   string
	WechatPrivateKey string // PEM 内容或文件路径

	// 支付宝配置
	AlipayAppID          string
	AlipayPrivateKey     string // PEM 内容
	AlipayAppPublicCert  string // 文件路径
	AlipayPublicCert     string // 文件路径
	AlipayRootCert       string // 文件路径

	// 订单超时时间（分钟）
	OrderTimeoutMinutes int
}

var globalConfig *Config

// LoadConfig 从环境变量读取支付配置
func LoadConfig() *Config {
	timeoutMinutes := 30
	if v := os.Getenv("PAYMENT_ORDER_TIMEOUT_MINUTES"); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n > 0 {
			timeoutMinutes = n
		}
	}

	cfg := &Config{
		CallbackBaseURL: os.Getenv("PAYMENT_CALLBACK_BASE_URL"),
		Mode:            os.Getenv("PAYMENT_MODE"),

		WechatAppID:      os.Getenv("WECHAT_APP_ID"),
		WechatMchID:      os.Getenv("WECHAT_MCH_ID"),
		WechatAPIV3Key:   os.Getenv("WECHAT_API_V3_KEY"),
		WechatSerialNo:   os.Getenv("WECHAT_MCH_SERIAL_NO"),
		WechatPrivateKey: os.Getenv("WECHAT_PRIVATE_KEY"),

		AlipayAppID:         os.Getenv("ALIPAY_APP_ID"),
		AlipayPrivateKey:    os.Getenv("ALIPAY_PRIVATE_KEY"),
		AlipayAppPublicCert: os.Getenv("ALIPAY_APP_PUBLIC_CERT"),
		AlipayPublicCert:    os.Getenv("ALIPAY_PUBLIC_CERT"),
		AlipayRootCert:      os.Getenv("ALIPAY_ROOT_CERT"),

		OrderTimeoutMinutes: timeoutMinutes,
	}

	if cfg.Mode == "" {
		cfg.Mode = "mock"
	}

	globalConfig = cfg
	return cfg
}

// GetConfig 获取全局支付配置
func GetConfig() *Config {
	if globalConfig == nil {
		return LoadConfig()
	}
	return globalConfig
}

// IsWechatEnabled 检查微信支付是否已配置
func (c *Config) IsWechatEnabled() bool {
	return c.WechatAppID != "" && c.WechatMchID != "" && c.WechatAPIV3Key != ""
}

// IsAlipayEnabled 检查支付宝是否已配置
func (c *Config) IsAlipayEnabled() bool {
	return c.AlipayAppID != "" && c.AlipayPrivateKey != ""
}

// IsMockEnabled 检查 Mock 模式是否启用
func (c *Config) IsMockEnabled() bool {
	return c.Mode == "mock"
}
