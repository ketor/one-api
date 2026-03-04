package cron

import (
	"testing"

	"github.com/songquanpeng/one-api/common/helper"
	"github.com/songquanpeng/one-api/model"
	"github.com/stretchr/testify/assert"
)

func TestCleanupPendingOrders(t *testing.T) {
	cleanTable(&model.Order{})

	now := helper.GetTimestamp()

	// Old pending order (> 30 min ago) — should be cancelled
	oldOrder := &model.Order{
		UserId:      2001,
		PlanId:      1,
		Type:        model.OrderTypeNewSubscription,
		AmountCents: 9900,
		Status:      model.OrderStatusPending,
	}
	err := model.CreateOrder(oldOrder)
	assert.NoError(t, err)
	// Manually backdate created_time
	model.DB.Model(&model.Order{}).Where("id = ?", oldOrder.Id).
		Update("created_time", now-31*60)

	// Recent pending order (< 30 min ago) — should NOT be cancelled
	recentOrder := &model.Order{
		UserId:      2002,
		PlanId:      1,
		Type:        model.OrderTypeNewSubscription,
		AmountCents: 9900,
		Status:      model.OrderStatusPending,
	}
	err = model.CreateOrder(recentOrder)
	assert.NoError(t, err)

	// Already paid order — should NOT be touched
	paidOrder := &model.Order{
		UserId:      2003,
		PlanId:      1,
		Type:        model.OrderTypeNewSubscription,
		AmountCents: 9900,
		Status:      model.OrderStatusPaid,
	}
	err = model.CreateOrder(paidOrder)
	assert.NoError(t, err)
	model.DB.Model(&model.Order{}).Where("id = ?", paidOrder.Id).
		Update("created_time", now-60*60) // old but paid

	CleanupPendingOrders()

	fetched, _ := model.GetOrderById(oldOrder.Id)
	assert.Equal(t, model.OrderStatusCancelled, fetched.Status)

	fetched, _ = model.GetOrderById(recentOrder.Id)
	assert.Equal(t, model.OrderStatusPending, fetched.Status) // still pending

	fetched, _ = model.GetOrderById(paidOrder.Id)
	assert.Equal(t, model.OrderStatusPaid, fetched.Status) // unchanged
}
