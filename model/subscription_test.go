package model

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func newTestSubscription(userId, planId int) *Subscription {
	return &Subscription{
		UserId:             userId,
		PlanId:             planId,
		Status:             SubscriptionStatusActive,
		CurrentPeriodStart: 1000000,
		CurrentPeriodEnd:   2000000,
		AutoRenew:          true,
	}
}

func TestCreateSubscription(t *testing.T) {
	cleanTable(&Subscription{})

	sub := newTestSubscription(100, 1)
	err := CreateSubscription(sub)
	assert.NoError(t, err)
	assert.NotZero(t, sub.Id)
	assert.NotZero(t, sub.CreatedTime)
	assert.NotZero(t, sub.UpdatedTime)
}

func TestCreateSubscription_DuplicatePrevention(t *testing.T) {
	cleanTable(&Subscription{})

	sub1 := newTestSubscription(200, 1)
	err := CreateSubscription(sub1)
	assert.NoError(t, err)

	sub2 := newTestSubscription(200, 2)
	err = CreateSubscription(sub2)
	assert.Error(t, err, "duplicate active subscription for same user should fail")
	assert.Contains(t, err.Error(), "already has an active subscription")
}

func TestGetActiveSubscription(t *testing.T) {
	cleanTable(&Subscription{})

	sub := newTestSubscription(300, 1)
	err := CreateSubscription(sub)
	assert.NoError(t, err)

	fetched, err := GetActiveSubscription(300)
	assert.NoError(t, err)
	assert.Equal(t, sub.Id, fetched.Id)
	assert.Equal(t, SubscriptionStatusActive, fetched.Status)
}

func TestGetActiveSubscription_ZeroUserId(t *testing.T) {
	_, err := GetActiveSubscription(0)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "user id is empty")
}

func TestGetSubscriptionById(t *testing.T) {
	cleanTable(&Subscription{})

	sub := newTestSubscription(400, 1)
	err := CreateSubscription(sub)
	assert.NoError(t, err)

	fetched, err := GetSubscriptionById(sub.Id)
	assert.NoError(t, err)
	assert.Equal(t, 400, fetched.UserId)
}

func TestGetSubscriptionById_ZeroId(t *testing.T) {
	_, err := GetSubscriptionById(0)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "id is empty")
}

func TestGetSubscriptionsByUserId(t *testing.T) {
	cleanTable(&Subscription{})

	// Create multiple subscriptions for same user (different statuses)
	sub1 := newTestSubscription(500, 1)
	err := CreateSubscription(sub1)
	assert.NoError(t, err)

	// Cancel the first, then create another
	err = CancelSubscription(500)
	assert.NoError(t, err)

	sub2 := newTestSubscription(500, 2)
	err = CreateSubscription(sub2)
	assert.NoError(t, err)

	subs, err := GetSubscriptionsByUserId(500)
	assert.NoError(t, err)
	assert.Len(t, subs, 2)
	// Ordered by id desc, so sub2 first
	assert.Equal(t, sub2.Id, subs[0].Id)
	assert.Equal(t, sub1.Id, subs[1].Id)
}

func TestCountActiveSubscriptionsByPlanId(t *testing.T) {
	cleanTable(&Subscription{})

	// Create 3 active subscriptions for plan 10
	for i := 600; i < 603; i++ {
		sub := newTestSubscription(i, 10)
		assert.NoError(t, CreateSubscription(sub))
	}
	// Create 1 active subscription for plan 11
	sub := newTestSubscription(700, 11)
	assert.NoError(t, CreateSubscription(sub))

	count, err := CountActiveSubscriptionsByPlanId(10)
	assert.NoError(t, err)
	assert.Equal(t, int64(3), count)

	count, err = CountActiveSubscriptionsByPlanId(11)
	assert.NoError(t, err)
	assert.Equal(t, int64(1), count)

	count, err = CountActiveSubscriptionsByPlanId(999)
	assert.NoError(t, err)
	assert.Equal(t, int64(0), count)
}

func TestCancelSubscription(t *testing.T) {
	cleanTable(&Subscription{})

	sub := newTestSubscription(800, 1)
	err := CreateSubscription(sub)
	assert.NoError(t, err)

	err = CancelSubscription(800)
	assert.NoError(t, err)

	fetched, err := GetSubscriptionById(sub.Id)
	assert.NoError(t, err)
	assert.Equal(t, SubscriptionStatusCancelled, fetched.Status)
	assert.NotZero(t, fetched.CancelledTime)
}

func TestCancelSubscription_NoActiveSubscription(t *testing.T) {
	cleanTable(&Subscription{})

	err := CancelSubscription(999)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "no active subscription found")
}

func TestExpireSubscription(t *testing.T) {
	cleanTable(&Subscription{})

	sub := newTestSubscription(900, 1)
	err := CreateSubscription(sub)
	assert.NoError(t, err)

	err = ExpireSubscription(sub.Id)
	assert.NoError(t, err)

	fetched, err := GetSubscriptionById(sub.Id)
	assert.NoError(t, err)
	assert.Equal(t, SubscriptionStatusExpired, fetched.Status)
}

func TestIncreaseMonthlySpent(t *testing.T) {
	cleanTable(&Subscription{})

	sub := newTestSubscription(1000, 1)
	err := CreateSubscription(sub)
	assert.NoError(t, err)
	assert.Equal(t, int64(0), sub.MonthlySpentCents)

	err = IncreaseMonthlySpent(sub.Id, 500)
	assert.NoError(t, err)

	err = IncreaseMonthlySpent(sub.Id, 300)
	assert.NoError(t, err)

	fetched, err := GetSubscriptionById(sub.Id)
	assert.NoError(t, err)
	assert.Equal(t, int64(800), fetched.MonthlySpentCents)
}

func TestIncreaseMonthlySpent_NegativeValue(t *testing.T) {
	cleanTable(&Subscription{})

	sub := newTestSubscription(1100, 1)
	err := CreateSubscription(sub)
	assert.NoError(t, err)

	err = IncreaseMonthlySpent(sub.Id, -100)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "cents cannot be negative")
}

func TestResetMonthlySpent(t *testing.T) {
	cleanTable(&Subscription{})

	sub := newTestSubscription(1200, 1)
	err := CreateSubscription(sub)
	assert.NoError(t, err)

	err = IncreaseMonthlySpent(sub.Id, 1000)
	assert.NoError(t, err)

	err = ResetMonthlySpent(sub.Id)
	assert.NoError(t, err)

	fetched, err := GetSubscriptionById(sub.Id)
	assert.NoError(t, err)
	assert.Equal(t, int64(0), fetched.MonthlySpentCents)
}
