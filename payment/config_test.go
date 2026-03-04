package payment

import (
	"os"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestLoadConfig_Defaults(t *testing.T) {
	// Clear all payment env vars
	envVars := []string{
		"PAYMENT_MODE", "PAYMENT_CALLBACK_BASE_URL", "PAYMENT_ORDER_TIMEOUT_MINUTES",
		"WECHAT_APP_ID", "WECHAT_MCH_ID", "WECHAT_API_V3_KEY",
		"ALIPAY_APP_ID", "ALIPAY_PRIVATE_KEY",
	}
	for _, v := range envVars {
		os.Unsetenv(v)
	}

	// Reset global config
	globalConfig = nil
	cfg := LoadConfig()

	assert.Equal(t, "mock", cfg.Mode)
	assert.Equal(t, 30, cfg.OrderTimeoutMinutes)
}

func TestLoadConfig_CustomMode(t *testing.T) {
	os.Setenv("PAYMENT_MODE", "live")
	defer os.Unsetenv("PAYMENT_MODE")

	globalConfig = nil
	cfg := LoadConfig()
	assert.Equal(t, "live", cfg.Mode)
}

func TestLoadConfig_CustomTimeout(t *testing.T) {
	os.Setenv("PAYMENT_ORDER_TIMEOUT_MINUTES", "15")
	defer os.Unsetenv("PAYMENT_ORDER_TIMEOUT_MINUTES")

	globalConfig = nil
	cfg := LoadConfig()
	assert.Equal(t, 15, cfg.OrderTimeoutMinutes)
}

func TestLoadConfig_InvalidTimeout(t *testing.T) {
	os.Setenv("PAYMENT_ORDER_TIMEOUT_MINUTES", "abc")
	defer os.Unsetenv("PAYMENT_ORDER_TIMEOUT_MINUTES")

	globalConfig = nil
	cfg := LoadConfig()
	assert.Equal(t, 30, cfg.OrderTimeoutMinutes) // falls back to default
}

func TestLoadConfig_NegativeTimeout(t *testing.T) {
	os.Setenv("PAYMENT_ORDER_TIMEOUT_MINUTES", "-5")
	defer os.Unsetenv("PAYMENT_ORDER_TIMEOUT_MINUTES")

	globalConfig = nil
	cfg := LoadConfig()
	assert.Equal(t, 30, cfg.OrderTimeoutMinutes) // falls back to default
}

func TestGetConfig_LazyInit(t *testing.T) {
	globalConfig = nil
	os.Unsetenv("PAYMENT_MODE")

	cfg := GetConfig()
	assert.NotNil(t, cfg)
	assert.Equal(t, "mock", cfg.Mode)
}

func TestConfig_IsWechatEnabled(t *testing.T) {
	cfg := &Config{
		WechatAppID:    "app123",
		WechatMchID:    "mch123",
		WechatAPIV3Key: "key123",
	}
	assert.True(t, cfg.IsWechatEnabled())

	// Missing one field
	cfg.WechatMchID = ""
	assert.False(t, cfg.IsWechatEnabled())
}

func TestConfig_IsAlipayEnabled(t *testing.T) {
	cfg := &Config{
		AlipayAppID:      "app456",
		AlipayPrivateKey: "pk456",
	}
	assert.True(t, cfg.IsAlipayEnabled())

	cfg.AlipayPrivateKey = ""
	assert.False(t, cfg.IsAlipayEnabled())
}

func TestConfig_IsMockEnabled(t *testing.T) {
	cfg := &Config{Mode: "mock"}
	assert.True(t, cfg.IsMockEnabled())

	cfg.Mode = "live"
	assert.False(t, cfg.IsMockEnabled())
}
