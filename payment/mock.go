package payment

import (
	"context"
	"encoding/json"
	"fmt"
	"time"
)

// MockProvider 开发/测试用的 Mock 支付 provider
type MockProvider struct{}

func NewMockProvider() *MockProvider {
	return &MockProvider{}
}

func (m *MockProvider) Name() string { return "mock" }

func (m *MockProvider) CreatePayment(ctx context.Context, req *CreatePaymentRequest) (*CreatePaymentResponse, error) {
	if req.OrderNo == "" {
		return nil, fmt.Errorf("order_no is required")
	}
	if req.AmountCents <= 0 {
		return nil, fmt.Errorf("amount must be positive")
	}
	return &CreatePaymentResponse{
		CodeURL:    fmt.Sprintf("mock://pay/%s?amount=%d", req.OrderNo, req.AmountCents),
		TradeNo:    "MOCK_" + req.OrderNo,
		ExpireTime: time.Now().Add(30 * time.Minute).Unix(),
	}, nil
}

func (m *MockProvider) HandleCallback(ctx context.Context, body []byte, headers map[string]string) (*CallbackResult, error) {
	var data map[string]interface{}
	if err := json.Unmarshal(body, &data); err != nil {
		return nil, fmt.Errorf("invalid callback body: %w", err)
	}

	orderNo, _ := data["order_no"].(string)
	if orderNo == "" {
		return nil, fmt.Errorf("order_no not found in callback body")
	}

	var amountCents int64
	if v, ok := data["amount_cents"].(float64); ok {
		amountCents = int64(v)
	}

	return &CallbackResult{
		OrderNo:     orderNo,
		TradeNo:     "MOCK_" + orderNo,
		AmountCents: amountCents,
		Success:     true,
	}, nil
}

func (m *MockProvider) QueryPayment(ctx context.Context, orderNo string) (*PaymentStatus, error) {
	return &PaymentStatus{
		OrderNo:     orderNo,
		TradeNo:     "MOCK_" + orderNo,
		Status:      "NOTPAY",
		AmountCents: 0,
	}, nil
}

func (m *MockProvider) Refund(ctx context.Context, req *RefundRequest) (*RefundResponse, error) {
	return &RefundResponse{
		RefundNo: req.RefundNo,
		RefundId: "MOCK_REFUND_" + req.RefundNo,
		Status:   "SUCCESS",
	}, nil
}

func (m *MockProvider) CloseOrder(ctx context.Context, orderNo string) error {
	return nil
}
