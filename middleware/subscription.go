package middleware

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/songquanpeng/one-api/common/ctxkey"
	"github.com/songquanpeng/one-api/common/logger"
	"github.com/songquanpeng/one-api/model"
)

// SubscriptionCheck checks the user's subscription status and enforces rate limits.
// It sets context keys: subscription_mode, within_window, subscription_id, plan_id.
//
// Logic:
//   - No active subscription: subscription_mode=false, proceed with existing Quota billing.
//   - Active subscription + within window limit: subscription_mode=true, within_window=true.
//   - Active subscription + over window limit + blocked overage: return 429.
//   - Active subscription + over window limit + api overage: subscription_mode=true, within_window=false,
//     proceed with Quota billing, and check monthly spend limit.
func SubscriptionCheck() func(c *gin.Context) {
	return func(c *gin.Context) {
		ctx := c.Request.Context()
		userId := c.GetInt(ctxkey.Id)
		if userId == 0 {
			c.Next()
			return
		}

		sub, err := model.CacheGetActiveSubscription(userId)
		if err != nil {
			// No active subscription found, use legacy Quota mode
			logger.Debugf(ctx, "user %d has no active subscription, using quota mode", userId)
			c.Set(ctxkey.SubscriptionMode, false)
			c.Next()
			return
		}

		plan, err := model.CacheGetPlanById(sub.PlanId)
		if err != nil {
			logger.SysError(fmt.Sprintf("failed to get plan %d for user %d: %s", sub.PlanId, userId, err.Error()))
			// Fallback to quota mode if plan lookup fails
			c.Set(ctxkey.SubscriptionMode, false)
			c.Next()
			return
		}

		c.Set(ctxkey.SubscriptionMode, true)
		c.Set(ctxkey.SubscriptionId, sub.Id)
		c.Set(ctxkey.PlanId, plan.Id)

		// If plan has no window limit, always within window
		if plan.WindowLimitCount <= 0 {
			c.Set(ctxkey.WithinWindow, true)
			// Override user group based on plan
			if plan.GroupName != "" {
				c.Set(ctxkey.Group, plan.GroupName)
			}
			c.Next()
			return
		}

		// Count usage within the window
		windowCount, err := model.GetWindowUsageCount(userId, plan.WindowDurationSec)
		if err != nil {
			logger.SysError(fmt.Sprintf("failed to get window usage for user %d: %s", userId, err.Error()))
			// On error, be lenient and allow the request
			c.Set(ctxkey.WithinWindow, true)
			if plan.GroupName != "" {
				c.Set(ctxkey.Group, plan.GroupName)
			}
			c.Next()
			return
		}

		// Effective limit includes booster pack extra count
		effectiveLimit := plan.WindowLimitCount
		boosterExtra, err := model.GetUserBoosterExtraCount(userId)
		if err != nil {
			logger.SysError(fmt.Sprintf("failed to get booster extra count for user %d: %s", userId, err.Error()))
		} else {
			effectiveLimit += boosterExtra
		}

		if int(windowCount) < effectiveLimit {
			// Within window limit (including booster packs)
			c.Set(ctxkey.WithinWindow, true)
			if plan.GroupName != "" {
				c.Set(ctxkey.Group, plan.GroupName)
			}
			logger.Debugf(ctx, "user %d within window: %d/%d (base %d + booster %d)", userId, windowCount, effectiveLimit, plan.WindowLimitCount, boosterExtra)
			c.Next()
			return
		}

		// Over window limit
		logger.Debugf(ctx, "user %d over window limit: %d/%d, overage type: %s", userId, windowCount, effectiveLimit, plan.OverageRateType)

		if plan.OverageRateType == model.OverageRateTypeBlocked {
			abortWithMessage(c, http.StatusTooManyRequests,
				fmt.Sprintf("已超出套餐窗口限制（%d次/%ds），请稍后再试或升级套餐",
					plan.WindowLimitCount, plan.WindowDurationSec))
			return
		}

		// API overage mode: check monthly spend limit
		if plan.MonthlySpendLimitCents > 0 && sub.MonthlySpentCents >= plan.MonthlySpendLimitCents {
			abortWithMessage(c, http.StatusTooManyRequests,
				fmt.Sprintf("已超出月度消费上限（%d分），请等待下月重置或升级套餐",
					plan.MonthlySpendLimitCents))
			return
		}

		// API overage: proceed with Quota billing
		c.Set(ctxkey.WithinWindow, false)
		if plan.GroupName != "" {
			c.Set(ctxkey.Group, plan.GroupName)
		}
		c.Next()
	}
}
