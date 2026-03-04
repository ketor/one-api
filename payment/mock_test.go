package payment

import (
	"context"
	"encoding/json"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestMockProvider_Name(t *testing.T) {
	m := NewMockProvider()
	assert.Equal(t, "mock", m.Name())
}

func TestMockProvider_CreatePayment(t *testing.T) {
	m := NewMockProvider()
	ctx := context.Background()

	resp, err := m.CreatePayment(ctx, &CreatePaymentRequest{
		OrderNo:     "ORD123",
		AmountCents: 9900,
		Subject:     "Test Plan",
	})
	assert.NoError(t, err)
	assert.Contains(t, resp.CodeURL, "mock://pay/ORD123")
	assert.Contains(t, resp.CodeURL, "amount=9900")
	assert.Equal(t, "MOCK_ORD123", resp.TradeNo)
	assert.NotZero(t, resp.ExpireTime)
}

func TestMockProvider_CreatePayment_EmptyOrderNo(t *testing.T) {
	m := NewMockProvider()
	ctx := context.Background()

	_, err := m.CreatePayment(ctx, &CreatePaymentRequest{
		OrderNo:     "",
		AmountCents: 9900,
	})
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "order_no is required")
}

func TestMockProvider_CreatePayment_ZeroAmount(t *testing.T) {
	m := NewMockProvider()
	ctx := context.Background()

	_, err := m.CreatePayment(ctx, &CreatePaymentRequest{
		OrderNo:     "ORD123",
		AmountCents: 0,
	})
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "amount must be positive")
}

func TestMockProvider_HandleCallback(t *testing.T) {
	m := NewMockProvider()
	ctx := context.Background()

	body, _ := json.Marshal(map[string]interface{}{
		"order_no":     "ORD456",
		"amount_cents": float64(5000),
	})

	result, err := m.HandleCallback(ctx, body, nil)
	assert.NoError(t, err)
	assert.Equal(t, "ORD456", result.OrderNo)
	assert.Equal(t, "MOCK_ORD456", result.TradeNo)
	assert.True(t, result.Success)
	assert.Equal(t, int64(5000), result.AmountCents)
}

func TestMockProvider_HandleCallback_InvalidJSON(t *testing.T) {
	m := NewMockProvider()
	ctx := context.Background()

	_, err := m.HandleCallback(ctx, []byte("not json"), nil)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "invalid callback body")
}

func TestMockProvider_HandleCallback_MissingOrderNo(t *testing.T) {
	m := NewMockProvider()
	ctx := context.Background()

	body, _ := json.Marshal(map[string]interface{}{
		"amount_cents": float64(5000),
	})

	_, err := m.HandleCallback(ctx, body, nil)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "order_no not found")
}

func TestMockProvider_QueryPayment(t *testing.T) {
	m := NewMockProvider()
	ctx := context.Background()

	status, err := m.QueryPayment(ctx, "ORD789")
	assert.NoError(t, err)
	assert.Equal(t, "NOTPAY", status.Status)
	assert.Equal(t, "ORD789", status.OrderNo)
}

func TestMockProvider_Refund(t *testing.T) {
	m := NewMockProvider()
	ctx := context.Background()

	resp, err := m.Refund(ctx, &RefundRequest{
		RefundNo:    "REF001",
		TotalCents:  9900,
		RefundCents: 4950,
	})
	assert.NoError(t, err)
	assert.Equal(t, "SUCCESS", resp.Status)
	assert.Equal(t, "MOCK_REFUND_REF001", resp.RefundId)
}

func TestMockProvider_CloseOrder(t *testing.T) {
	m := NewMockProvider()
	ctx := context.Background()

	err := m.CloseOrder(ctx, "ORD999")
	assert.NoError(t, err)
}
