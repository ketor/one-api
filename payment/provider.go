package payment

import (
	"context"
	"fmt"
	"sync"
)

// Provider 支付服务商接口
type Provider interface {
	// Name 返回 provider 名称 ("wechat", "alipay", "mock")
	Name() string
	// CreatePayment 创建支付，返回二维码链接等
	CreatePayment(ctx context.Context, req *CreatePaymentRequest) (*CreatePaymentResponse, error)
	// HandleCallback 处理支付回调（验签+解析）
	HandleCallback(ctx context.Context, body []byte, headers map[string]string) (*CallbackResult, error)
	// QueryPayment 主动查询支付状态
	QueryPayment(ctx context.Context, orderNo string) (*PaymentStatus, error)
	// Refund 发起退款
	Refund(ctx context.Context, req *RefundRequest) (*RefundResponse, error)
	// CloseOrder 关闭/取消未支付订单
	CloseOrder(ctx context.Context, orderNo string) error
}

var (
	providers = make(map[string]Provider)
	mu        sync.RWMutex
)

// Register 注册支付 provider
func Register(p Provider) {
	mu.Lock()
	defer mu.Unlock()
	providers[p.Name()] = p
}

// Get 获取支付 provider
func Get(name string) (Provider, error) {
	mu.RLock()
	defer mu.RUnlock()
	p, ok := providers[name]
	if !ok {
		return nil, fmt.Errorf("payment provider %q not found", name)
	}
	return p, nil
}

// GetAll 获取所有已注册的 provider 名称
func GetAll() []string {
	mu.RLock()
	defer mu.RUnlock()
	names := make([]string, 0, len(providers))
	for name := range providers {
		names = append(names, name)
	}
	return names
}
