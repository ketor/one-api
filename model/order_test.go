package model

import (
	"fmt"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestGenerateOrderNo(t *testing.T) {
	orderNo := GenerateOrderNo()
	assert.True(t, strings.HasPrefix(orderNo, "ORD"), "order number should start with ORD, got: %s", orderNo)
	assert.Greater(t, len(orderNo), 3, "order number should be longer than prefix")
}

func TestCreateOrder_AutoGeneratesOrderNo(t *testing.T) {
	cleanTable(&Order{})

	order := &Order{
		UserId:      1,
		PlanId:      1,
		Type:        OrderTypeNewSubscription,
		AmountCents: 14000,
		Status:      OrderStatusPending,
	}
	err := CreateOrder(order)
	assert.NoError(t, err)
	assert.NotZero(t, order.Id)
	assert.True(t, strings.HasPrefix(order.OrderNo, "ORD"))
	assert.NotZero(t, order.CreatedTime)
	assert.NotZero(t, order.UpdatedTime)
}

func TestCreateOrder_PreservesExistingOrderNo(t *testing.T) {
	cleanTable(&Order{})

	order := &Order{
		OrderNo:     "CUSTOM-12345",
		UserId:      1,
		PlanId:      1,
		Type:        OrderTypeNewSubscription,
		AmountCents: 5000,
		Status:      OrderStatusPending,
	}
	err := CreateOrder(order)
	assert.NoError(t, err)
	assert.Equal(t, "CUSTOM-12345", order.OrderNo)
}

func TestGetOrderById(t *testing.T) {
	cleanTable(&Order{})

	order := &Order{
		UserId:      2,
		PlanId:      1,
		Type:        OrderTypeRenewal,
		AmountCents: 14000,
		Status:      OrderStatusPending,
	}
	err := CreateOrder(order)
	assert.NoError(t, err)

	fetched, err := GetOrderById(order.Id)
	assert.NoError(t, err)
	assert.Equal(t, order.OrderNo, fetched.OrderNo)
	assert.Equal(t, 2, fetched.UserId)
}

func TestGetOrderById_ZeroId(t *testing.T) {
	_, err := GetOrderById(0)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "id is empty")
}

func TestGetOrderByOrderNo(t *testing.T) {
	cleanTable(&Order{})

	order := &Order{
		OrderNo:     "ORD-LOOKUP-TEST",
		UserId:      3,
		PlanId:      1,
		Type:        OrderTypeNewSubscription,
		AmountCents: 7000,
		Status:      OrderStatusPending,
	}
	err := CreateOrder(order)
	assert.NoError(t, err)

	fetched, err := GetOrderByOrderNo("ORD-LOOKUP-TEST")
	assert.NoError(t, err)
	assert.Equal(t, order.Id, fetched.Id)
	assert.Equal(t, 3, fetched.UserId)
}

func TestGetOrderByOrderNo_Empty(t *testing.T) {
	_, err := GetOrderByOrderNo("")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "order no is empty")
}

func TestGetOrdersByUserId_Pagination(t *testing.T) {
	cleanTable(&Order{})

	userId := 10
	for i := 0; i < 5; i++ {
		order := &Order{
			OrderNo:     fmt.Sprintf("ORD-PAGE-TEST-%d", i),
			UserId:      userId,
			PlanId:      1,
			Type:        OrderTypeNewSubscription,
			AmountCents: int64(1000 * (i + 1)),
			Status:      OrderStatusPending,
		}
		err := CreateOrder(order)
		assert.NoError(t, err)
	}

	// Page 1: first 2 orders (ordered by id desc)
	page1, err := GetOrdersByUserId(userId, 0, 2)
	assert.NoError(t, err)
	assert.Len(t, page1, 2)

	// Page 2: next 2 orders
	page2, err := GetOrdersByUserId(userId, 2, 2)
	assert.NoError(t, err)
	assert.Len(t, page2, 2)

	// Page 3: last 1 order
	page3, err := GetOrdersByUserId(userId, 4, 2)
	assert.NoError(t, err)
	assert.Len(t, page3, 1)

	// All IDs should be unique and decreasing within pages
	assert.Greater(t, page1[0].Id, page1[1].Id)
	assert.Greater(t, page1[1].Id, page2[0].Id)
}

func TestUpdateOrderStatus_ValidTransitions(t *testing.T) {
	tests := []struct {
		name        string
		fromStatus  int
		toStatus    int
		shouldWork  bool
	}{
		{"Pending -> Paid", OrderStatusPending, OrderStatusPaid, true},
		{"Pending -> Cancelled", OrderStatusPending, OrderStatusCancelled, true},
		{"Pending -> Failed", OrderStatusPending, OrderStatusFailed, true},
		{"Paid -> Refunded", OrderStatusPaid, OrderStatusRefunded, true},
		{"Cancelled -> Paid", OrderStatusCancelled, OrderStatusPaid, false},
		{"Refunded -> Paid", OrderStatusRefunded, OrderStatusPaid, false},
		{"Failed -> Paid", OrderStatusFailed, OrderStatusPaid, false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			cleanTable(&Order{})

			order := &Order{
				UserId:      50,
				PlanId:      1,
				Type:        OrderTypeNewSubscription,
				AmountCents: 14000,
				Status:      tt.fromStatus,
			}
			err := CreateOrder(order)
			assert.NoError(t, err)

			err = UpdateOrderStatus(order.Id, tt.toStatus)
			if tt.shouldWork {
				assert.NoError(t, err, "transition %s should succeed", tt.name)
			} else {
				assert.Error(t, err, "transition %s should fail", tt.name)
			}
		})
	}
}

func TestUpdateOrderStatus_SetsPaidTime(t *testing.T) {
	cleanTable(&Order{})

	order := &Order{
		UserId:      60,
		PlanId:      1,
		Type:        OrderTypeNewSubscription,
		AmountCents: 14000,
		Status:      OrderStatusPending,
	}
	err := CreateOrder(order)
	assert.NoError(t, err)
	assert.Zero(t, order.PaidTime)

	err = UpdateOrderStatus(order.Id, OrderStatusPaid)
	assert.NoError(t, err)

	fetched, err := GetOrderById(order.Id)
	assert.NoError(t, err)
	assert.Equal(t, OrderStatusPaid, fetched.Status)
	assert.NotZero(t, fetched.PaidTime, "paid_time should be set when transitioning to Paid")
}

func TestUpdateOrderPayment(t *testing.T) {
	cleanTable(&Order{})

	order := &Order{
		UserId:      70,
		PlanId:      1,
		Type:        OrderTypeNewSubscription,
		AmountCents: 14000,
		Status:      OrderStatusPending,
	}
	err := CreateOrder(order)
	assert.NoError(t, err)

	err = UpdateOrderPayment(order.Id, "stripe", "txn_abc123")
	assert.NoError(t, err)

	fetched, err := GetOrderById(order.Id)
	assert.NoError(t, err)
	assert.Equal(t, "stripe", fetched.PaymentMethod)
	assert.Equal(t, "txn_abc123", fetched.PaymentTradeNo)
}
