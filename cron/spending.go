package cron

import (
	"github.com/songquanpeng/one-api/common/logger"
	"github.com/songquanpeng/one-api/model"
)

// ResetMonthlySpending resets the monthly_spent_cents for all active subscriptions.
// Runs on the 1st of each month.
func ResetMonthlySpending() {
	result := model.DB.Model(&model.Subscription{}).
		Where("status = ?", model.SubscriptionStatusActive).
		Update("monthly_spent_cents", 0)
	if result.Error != nil {
		logger.SysError("cron: failed to reset monthly spending: " + result.Error.Error())
		return
	}
	logger.SysLog("cron: reset monthly spending for all active subscriptions")
}
