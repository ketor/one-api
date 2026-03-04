package config

import "os"

// Payment configuration from environment variables.

// GetPaymentMode returns the payment mode: "live", "sandbox", or "mock" (default).
func GetPaymentMode() string {
	mode := os.Getenv("PAYMENT_MODE")
	if mode == "" {
		return "mock"
	}
	return mode
}

// IsPaymentEnabled returns true if payment mode is not empty and not "disabled".
func IsPaymentEnabled() bool {
	mode := GetPaymentMode()
	return mode != "" && mode != "disabled"
}

// IsPaymentLive returns true if using live payment mode.
func IsPaymentLive() bool {
	return GetPaymentMode() == "live"
}

// Wechat Pay configuration
func GetWechatMchId() string           { return os.Getenv("WECHAT_MCH_ID") }
func GetWechatMchSerialNo() string     { return os.Getenv("WECHAT_MCH_SERIAL_NO") }
func GetWechatApiV3Key() string        { return os.Getenv("WECHAT_API_V3_KEY") }
func GetWechatPrivateKeyPath() string  { return os.Getenv("WECHAT_PRIVATE_KEY_PATH") }
func GetWechatAppId() string           { return os.Getenv("WECHAT_APP_ID") }
func GetWechatNotifyUrl() string       { return os.Getenv("WECHAT_NOTIFY_URL") }

// Alipay configuration
func GetAlipayAppId() string           { return os.Getenv("ALIPAY_APP_ID") }
func GetAlipayPrivateKey() string      { return os.Getenv("ALIPAY_PRIVATE_KEY") }
func GetAlipayAppPublicCert() string   { return os.Getenv("ALIPAY_APP_PUBLIC_CERT") }
func GetAlipayPublicCert() string      { return os.Getenv("ALIPAY_PUBLIC_CERT") }
func GetAlipayRootCert() string        { return os.Getenv("ALIPAY_ROOT_CERT") }
func GetAlipayNotifyUrl() string       { return os.Getenv("ALIPAY_NOTIFY_URL") }
