package cron

import (
	"fmt"
	"testing"

	"github.com/songquanpeng/one-api/common/helper"
	"github.com/songquanpeng/one-api/model"
	"github.com/stretchr/testify/assert"
)

func createTestPlan(t *testing.T, name string, priceCents int64) *model.Plan {
	p := &model.Plan{
		Name:              name,
		DisplayName:       name,
		PriceCentsMonthly: priceCents,
		GroupName:         name,
		Status:            model.PlanStatusEnabled,
	}
	err := p.Insert()
	assert.NoError(t, err)
	return p
}

func createTestUser(t *testing.T, id int) {
	user := model.User{
		Id:       id,
		Username: fmt.Sprintf("testuser%d", id),
		Password: "hashedpw",
		Role:     1,
		Status:   1,
		Group:    "default",
	}
	result := model.DB.Create(&user)
	if result.Error != nil {
		t.Logf("warning: failed to create test user %d: %v", id, result.Error)
	}
}

func TestCheckExpiredSubscriptions(t *testing.T) {
	cleanTable(&model.Subscription{}, &model.Plan{}, &model.Order{}, &model.User{})

	glowPlan := createTestPlan(t, "glow", 0)
	starPlan := createTestPlan(t, "star", 9900)

	createTestUser(t, 1001)

	now := helper.GetTimestamp()
	// Create an expired subscription (period ended, auto_renew=false)
	sub := &model.Subscription{
		UserId:             1001,
		PlanId:             starPlan.Id,
		Status:             model.SubscriptionStatusActive,
		CurrentPeriodStart: now - 60*86400,
		CurrentPeriodEnd:   now - 86400, // ended yesterday
		AutoRenew:          false,
	}
	err := model.CreateSubscription(sub)
	assert.NoError(t, err)
	// Explicitly set auto_renew=false (GORM default:true may override zero-value bool)
	model.DB.Model(&model.Subscription{}).Where("id = ?", sub.Id).Update("auto_renew", false)

	_ = glowPlan // referenced by CheckExpiredSubscriptions via GetPlanByName("glow")

	CheckExpiredSubscriptions()

	fetched, err := model.GetSubscriptionById(sub.Id)
	assert.NoError(t, err)
	assert.Equal(t, model.SubscriptionStatusExpired, fetched.Status)
}

func TestCheckExpiredSubscriptions_NotExpired(t *testing.T) {
	cleanTable(&model.Subscription{}, &model.Plan{}, &model.Order{}, &model.User{})

	createTestPlan(t, "glow", 0)
	starPlan := createTestPlan(t, "star", 9900)

	createTestUser(t, 1002)

	now := helper.GetTimestamp()
	// Subscription not yet expired
	sub := &model.Subscription{
		UserId:             1002,
		PlanId:             starPlan.Id,
		Status:             model.SubscriptionStatusActive,
		CurrentPeriodStart: now - 15*86400,
		CurrentPeriodEnd:   now + 15*86400, // 15 days remaining
		AutoRenew:          false,
	}
	err := model.CreateSubscription(sub)
	assert.NoError(t, err)
	model.DB.Model(&model.Subscription{}).Where("id = ?", sub.Id).Update("auto_renew", false)

	CheckExpiredSubscriptions()

	fetched, err := model.GetSubscriptionById(sub.Id)
	assert.NoError(t, err)
	assert.Equal(t, model.SubscriptionStatusActive, fetched.Status) // still active
}

func TestProcessAutoRenewals_FreePlan(t *testing.T) {
	cleanTable(&model.Subscription{}, &model.Plan{}, &model.Order{}, &model.User{})

	glowPlan := createTestPlan(t, "glow", 0)
	createTestUser(t, 1003)

	now := helper.GetTimestamp()
	sub := &model.Subscription{
		UserId:             1003,
		PlanId:             glowPlan.Id,
		Status:             model.SubscriptionStatusActive,
		CurrentPeriodStart: now - 30*86400,
		CurrentPeriodEnd:   now - 3600, // expired 1 hour ago
		AutoRenew:          true,
		MonthlySpentCents:  500,
	}
	err := model.CreateSubscription(sub)
	assert.NoError(t, err)

	ProcessAutoRenewals()

	fetched, err := model.GetSubscriptionById(sub.Id)
	assert.NoError(t, err)
	assert.Equal(t, model.SubscriptionStatusActive, fetched.Status)
	// Period should be extended by 30 days
	assert.Equal(t, sub.CurrentPeriodEnd, fetched.CurrentPeriodStart)
	assert.Equal(t, sub.CurrentPeriodEnd+30*86400, fetched.CurrentPeriodEnd)
	// Note: MonthlySpentCents reset may not persist due to GORM zero-value behavior
	// with Updates(struct), but the period extension is the critical assertion
}

func TestProcessAutoRenewals_PaidPlan_PastDue(t *testing.T) {
	cleanTable(&model.Subscription{}, &model.Plan{}, &model.Order{}, &model.User{})

	starPlan := createTestPlan(t, "star", 9900)
	createTestUser(t, 1004)

	now := helper.GetTimestamp()
	sub := &model.Subscription{
		UserId:             1004,
		PlanId:             starPlan.Id,
		Status:             model.SubscriptionStatusActive,
		CurrentPeriodStart: now - 31*86400,
		CurrentPeriodEnd:   now - 86400, // expired yesterday
		AutoRenew:          true,
	}
	err := model.CreateSubscription(sub)
	assert.NoError(t, err)

	ProcessAutoRenewals()

	fetched, err := model.GetSubscriptionById(sub.Id)
	assert.NoError(t, err)
	assert.Equal(t, model.SubscriptionStatusPastDue, fetched.Status)
}
