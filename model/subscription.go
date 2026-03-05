package model

import (
	"errors"
	"fmt"

	"gorm.io/gorm"

	"github.com/songquanpeng/one-api/common/helper"
	"github.com/songquanpeng/one-api/common/logger"
)

const (
	SubscriptionStatusActive    = 1
	SubscriptionStatusExpired   = 2
	SubscriptionStatusCancelled = 3
	SubscriptionStatusPastDue   = 4
)

type Subscription struct {
	Id                 int   `json:"id" gorm:"primaryKey;autoIncrement"`
	UserId             int   `json:"user_id" gorm:"index:idx_user_status;not null"`
	PlanId             int   `json:"plan_id" gorm:"index;not null"`
	Status             int   `json:"status" gorm:"default:1;index:idx_user_status"`
	CurrentPeriodStart int64 `json:"current_period_start" gorm:"bigint"`
	CurrentPeriodEnd   int64 `json:"current_period_end" gorm:"bigint"`
	MonthlySpentCents  int64 `json:"monthly_spent_cents" gorm:"bigint;default:0"`
	AutoRenew          bool  `json:"auto_renew" gorm:"default:true"`
	CreatedTime        int64 `json:"created_time" gorm:"bigint"`
	UpdatedTime        int64 `json:"updated_time" gorm:"bigint"`
	CancelledTime      int64 `json:"cancelled_time" gorm:"bigint;default:0"`
}

func GetActiveSubscription(userId int) (*Subscription, error) {
	if userId == 0 {
		return nil, errors.New("user id is empty")
	}
	var sub Subscription
	err := DB.Where("user_id = ? AND status = ?", userId, SubscriptionStatusActive).First(&sub).Error
	return &sub, err
}

func GetSubscriptionsByUserId(userId int) ([]*Subscription, error) {
	var subs []*Subscription
	err := DB.Where("user_id = ?", userId).Order("id desc").Find(&subs).Error
	return subs, err
}

func GetSubscriptionById(id int) (*Subscription, error) {
	if id == 0 {
		return nil, errors.New("id is empty")
	}
	var sub Subscription
	err := DB.First(&sub, "id = ?", id).Error
	return &sub, err
}

// GetAllSubscriptions returns paginated subscriptions for admin listing.
func GetAllSubscriptions(startIdx int, num int) ([]*Subscription, error) {
	var subs []*Subscription
	err := DB.Order("id desc").Limit(num).Offset(startIdx).Find(&subs).Error
	return subs, err
}

func GetActiveSubscriptionsByUserIds(userIds []int) (map[int]*Subscription, error) {
	var subs []*Subscription
	err := DB.Where("user_id IN ? AND status = ?", userIds, SubscriptionStatusActive).Find(&subs).Error
	if err != nil {
		return nil, err
	}
	result := make(map[int]*Subscription)
	for _, sub := range subs {
		result[sub.UserId] = sub
	}
	return result, nil
}

func CountActiveSubscriptionsByPlanId(planId int) (int64, error) {
	var count int64
	err := DB.Model(&Subscription{}).
		Where("plan_id = ? AND status = ?", planId, SubscriptionStatusActive).
		Count(&count).Error
	return count, err
}

func CreateSubscription(sub *Subscription) error {
	sub.CreatedTime = helper.GetTimestamp()
	sub.UpdatedTime = helper.GetTimestamp()
	err := DB.Transaction(func(tx *gorm.DB) error {
		// Check for existing active subscription to prevent duplicates
		var count int64
		if err := tx.Model(&Subscription{}).
			Where("user_id = ? AND status = ?", sub.UserId, SubscriptionStatusActive).
			Count(&count).Error; err != nil {
			return err
		}
		if count > 0 {
			return errors.New("user already has an active subscription")
		}
		return tx.Create(sub).Error
	})
	if err == nil {
		CacheInvalidateSubscription(sub.UserId)
	}
	return err
}

func UpdateSubscription(sub *Subscription) error {
	sub.UpdatedTime = helper.GetTimestamp()
	err := DB.Save(sub).Error
	if err == nil {
		CacheInvalidateSubscription(sub.UserId)
	}
	return err
}

func CancelSubscription(userId int) error {
	if userId == 0 {
		return errors.New("user id is empty")
	}
	now := helper.GetTimestamp()
	result := DB.Model(&Subscription{}).
		Where("user_id = ? AND status = ?", userId, SubscriptionStatusActive).
		Updates(map[string]interface{}{
			"status":         SubscriptionStatusCancelled,
			"cancelled_time": now,
			"updated_time":   now,
		})
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return errors.New("no active subscription found")
	}
	CacheInvalidateSubscription(userId)
	return nil
}

func ExpireSubscription(id int) error {
	sub, err := GetSubscriptionById(id)
	if err != nil {
		return err
	}
	now := helper.GetTimestamp()
	err = DB.Model(&Subscription{}).Where("id = ?", id).Updates(map[string]interface{}{
		"status":       SubscriptionStatusExpired,
		"updated_time": now,
	}).Error
	if err == nil {
		CacheInvalidateSubscription(sub.UserId)
	}
	return err
}

func ResetMonthlySpent(id int) error {
	return DB.Model(&Subscription{}).Where("id = ?", id).Update("monthly_spent_cents", 0).Error
}

func IncreaseMonthlySpent(id int, cents int64) error {
	if cents < 0 {
		return errors.New("cents cannot be negative")
	}
	err := DB.Model(&Subscription{}).Where("id = ?", id).
		UpdateColumn("monthly_spent_cents", gorm.Expr("monthly_spent_cents + ?", cents)).Error
	if err != nil {
		logger.SysError(fmt.Sprintf("failed to increase monthly spent for subscription %d: %s", id, err.Error()))
	}
	return err
}

// UpdateUserGroupByPlan updates the user's group to match the plan's group name.
// Should be called when subscription changes (upgrade, downgrade, cancel).
func UpdateUserGroupByPlan(userId int, planId int) error {
	plan, err := GetPlanById(planId)
	if err != nil {
		return fmt.Errorf("failed to get plan %d: %w", planId, err)
	}
	if plan.GroupName == "" {
		return nil
	}
	err = DB.Model(&User{}).Where("id = ?", userId).Update("group", plan.GroupName).Error
	if err != nil {
		logger.SysError(fmt.Sprintf("failed to update group for user %d to %s: %s", userId, plan.GroupName, err.Error()))
	} else {
		// Invalidate user group cache so the new group takes effect immediately
		CacheInvalidateUserGroup(userId)
	}
	return err
}
