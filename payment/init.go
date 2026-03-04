package payment

import (
	"github.com/songquanpeng/one-api/common/logger"
)

// Init 根据配置初始化并注册支付 providers
func Init() {
	cfg := LoadConfig()

	logger.SysLogf("payment mode: %s", cfg.Mode)

	switch cfg.Mode {
	case "live", "sandbox":
		// 注册微信支付
		if wechat := NewWechatProvider(cfg); wechat != nil {
			Register(wechat)
			logger.SysLog("registered payment provider: wechat")
		}
		// 注册支付宝
		if alipay := NewAlipayProvider(cfg); alipay != nil {
			Register(alipay)
			logger.SysLog("registered payment provider: alipay")
		}
		// 即使是 live/sandbox 模式，如果没有配置任何 provider，也注册 mock
		if len(GetAll()) == 0 {
			logger.SysLog("no payment providers configured, falling back to mock")
			Register(NewMockProvider())
		}
	default:
		// mock mode (default)
		Register(NewMockProvider())
		logger.SysLog("registered payment provider: mock")
	}

	logger.SysLogf("available payment providers: %v", GetAll())
}
