package cron

import (
	"testing"

	"github.com/songquanpeng/one-api/model"
	"github.com/stretchr/testify/assert"
)

func TestResetMonthlySpending(t *testing.T) {
	cleanTable(&model.Subscription{})

	// Active subscription with spending
	sub1 := &model.Subscription{
		UserId:             3001,
		PlanId:             1,
		Status:             model.SubscriptionStatusActive,
		CurrentPeriodStart: 1000000,
		CurrentPeriodEnd:   2000000,
	}
	err := model.CreateSubscription(sub1)
	assert.NoError(t, err)
	model.IncreaseMonthlySpent(sub1.Id, 5000)

	// Cancelled subscription — should NOT be reset
	sub2 := &model.Subscription{
		UserId:             3002,
		PlanId:             1,
		Status:             model.SubscriptionStatusActive,
		CurrentPeriodStart: 1000000,
		CurrentPeriodEnd:   2000000,
	}
	err = model.CreateSubscription(sub2)
	assert.NoError(t, err)
	model.IncreaseMonthlySpent(sub2.Id, 3000)
	model.CancelSubscription(3002) // cancel it

	ResetMonthlySpending()

	fetched1, _ := model.GetSubscriptionById(sub1.Id)
	assert.Equal(t, int64(0), fetched1.MonthlySpentCents)

	fetched2, _ := model.GetSubscriptionById(sub2.Id)
	assert.Equal(t, int64(3000), fetched2.MonthlySpentCents) // unchanged, was cancelled
}
