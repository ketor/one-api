package cron

import (
	"fmt"

	"github.com/songquanpeng/one-api/common/helper"
	"github.com/songquanpeng/one-api/common/logger"
	"github.com/songquanpeng/one-api/model"
)

// CheckExpiredSubscriptions finds active subscriptions past their period end
// and marks them as expired.
func CheckExpiredSubscriptions() {
	now := helper.GetTimestamp()
	var subs []model.Subscription
	err := model.DB.Where("status = ? AND current_period_end < ? AND auto_renew = ?",
		model.SubscriptionStatusActive, now, false).Find(&subs).Error
	if err != nil {
		logger.SysError("cron: failed to query expired subscriptions: " + err.Error())
		return
	}
	for _, sub := range subs {
		if err := model.ExpireSubscription(sub.Id); err != nil {
			logger.SysError(fmt.Sprintf("cron: failed to expire subscription %d: %s", sub.Id, err.Error()))
			continue
		}
		// Downgrade user to free tier (glow)
		glowPlan, err := model.GetPlanByName("glow")
		if err != nil {
			logger.SysError("cron: failed to get glow plan: " + err.Error())
			continue
		}
		if err := model.UpdateUserGroupByPlan(sub.UserId, glowPlan.Id); err != nil {
			logger.SysError(fmt.Sprintf("cron: failed to update user %d group: %s", sub.UserId, err.Error()))
		}
		logger.SysLog(fmt.Sprintf("cron: expired subscription %d for user %d", sub.Id, sub.UserId))
	}
}

// ProcessAutoRenewals handles subscriptions that are about to expire with auto_renew=true.
// For free plans: directly extend the period.
// For paid plans: mark as PastDue (payment system will handle actual renewal).
func ProcessAutoRenewals() {
	now := helper.GetTimestamp()
	oneDayLater := now + 86400
	var subs []model.Subscription
	err := model.DB.Where("status = ? AND current_period_end < ? AND auto_renew = ?",
		model.SubscriptionStatusActive, oneDayLater, true).Find(&subs).Error
	if err != nil {
		logger.SysError("cron: failed to query auto-renewal subscriptions: " + err.Error())
		return
	}
	for _, sub := range subs {
		plan, err := model.GetPlanById(sub.PlanId)
		if err != nil {
			logger.SysError(fmt.Sprintf("cron: failed to get plan %d: %s", sub.PlanId, err.Error()))
			continue
		}
		if plan.PriceCentsMonthly == 0 {
			// Free plan: directly extend by 30 days
			sub.CurrentPeriodStart = sub.CurrentPeriodEnd
			sub.CurrentPeriodEnd = sub.CurrentPeriodEnd + 30*86400
			sub.MonthlySpentCents = 0
			if err := model.UpdateSubscription(&sub); err != nil {
				logger.SysError(fmt.Sprintf("cron: failed to renew free subscription %d: %s", sub.Id, err.Error()))
			} else {
				logger.SysLog(fmt.Sprintf("cron: renewed free subscription %d for user %d", sub.Id, sub.UserId))
			}
		} else {
			// Paid plan: mark as PastDue so payment system can process
			if sub.CurrentPeriodEnd < now {
				model.DB.Model(&model.Subscription{}).Where("id = ?", sub.Id).Updates(map[string]interface{}{
					"status":       model.SubscriptionStatusPastDue,
					"updated_time": now,
				})
				logger.SysLog(fmt.Sprintf("cron: marked subscription %d as past due for user %d", sub.Id, sub.UserId))
			}
		}
	}
}

// ProcessPendingDowngrades processes downgrade orders that should take effect
// when the current billing period ends.
func ProcessPendingDowngrades() {
	now := helper.GetTimestamp()
	var orders []model.Order
	err := model.DB.Where("type = ? AND status = ?",
		model.OrderTypeDowngrade, model.OrderStatusPaid).Find(&orders).Error
	if err != nil {
		logger.SysError("cron: failed to query pending downgrades: " + err.Error())
		return
	}
	for _, order := range orders {
		sub, err := model.GetActiveSubscription(order.UserId)
		if err != nil {
			continue
		}
		if sub.CurrentPeriodEnd > now {
			continue // Not yet time to downgrade
		}
		// Execute downgrade
		sub.PlanId = order.PlanId
		sub.CurrentPeriodStart = now
		sub.CurrentPeriodEnd = now + 30*86400
		sub.MonthlySpentCents = 0
		if err := model.UpdateSubscription(sub); err != nil {
			logger.SysError(fmt.Sprintf("cron: failed to downgrade subscription %d: %s", sub.Id, err.Error()))
			continue
		}
		if err := model.UpdateUserGroupByPlan(order.UserId, order.PlanId); err != nil {
			logger.SysError(fmt.Sprintf("cron: failed to update user %d group after downgrade: %s", order.UserId, err.Error()))
		}
		// Mark order as completed by cancelling it (it was already paid/processed)
		model.UpdateOrderStatus(order.Id, model.OrderStatusCancelled)
		logger.SysLog(fmt.Sprintf("cron: processed downgrade for user %d to plan %d", order.UserId, order.PlanId))
	}
}
