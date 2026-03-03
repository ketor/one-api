package controller

import (
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/songquanpeng/one-api/common/config"
	"github.com/songquanpeng/one-api/common/ctxkey"
	"github.com/songquanpeng/one-api/common/helper"
	"github.com/songquanpeng/one-api/model"
)

func GetSelfSubscription(c *gin.Context) {
	userId := c.GetInt(ctxkey.Id)
	sub, err := model.GetActiveSubscription(userId)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "",
			"data":    nil,
		})
		return
	}
	plan, err := model.GetPlanById(sub.PlanId)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "无法获取套餐信息",
		})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data": gin.H{
			"subscription": sub,
			"plan":         plan,
		},
	})
}

type createSubscriptionRequest struct {
	PlanId int `json:"plan_id"`
}

func CreateSubscription(c *gin.Context) {
	userId := c.GetInt(ctxkey.Id)
	var req createSubscriptionRequest
	err := c.ShouldBindJSON(&req)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	if req.PlanId == 0 {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "套餐ID不能为空",
		})
		return
	}

	// Check no active subscription
	existingSub, _ := model.GetActiveSubscription(userId)
	if existingSub != nil && existingSub.Id != 0 {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "您已有活跃的订阅，请先取消当前订阅",
		})
		return
	}

	// Get plan
	plan, err := model.GetPlanById(req.PlanId)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "套餐不存在",
		})
		return
	}
	if plan.Status != model.PlanStatusEnabled {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "该套餐已停用",
		})
		return
	}

	// Create order
	order := &model.Order{
		UserId:        userId,
		PlanId:        plan.Id,
		Type:          model.OrderTypeNewSubscription,
		AmountCents:   plan.PriceCentsMonthly,
		Status:        model.OrderStatusPending,
		PaymentMethod: "admin",
	}
	err = model.CreateOrder(order)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "创建订单失败: " + err.Error(),
		})
		return
	}

	// First batch: direct activation (admin recharge mode)
	err = model.UpdateOrderStatus(order.Id, model.OrderStatusPaid)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "更新订单状态失败: " + err.Error(),
		})
		return
	}

	// Create subscription
	now := helper.GetTimestamp()
	periodEnd := now + 30*24*3600 // 30 days
	sub := &model.Subscription{
		UserId:             userId,
		PlanId:             plan.Id,
		Status:             model.SubscriptionStatusActive,
		CurrentPeriodStart: now,
		CurrentPeriodEnd:   periodEnd,
		AutoRenew:          true,
	}
	err = model.CreateSubscription(sub)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "创建订阅失败: " + err.Error(),
		})
		return
	}

	// Update user group
	model.UpdateUserGroupByPlan(userId, plan.Id)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data": gin.H{
			"subscription": sub,
			"order":        order,
		},
	})
}

type upgradeSubscriptionRequest struct {
	PlanId int `json:"plan_id"`
}

func UpgradeSubscription(c *gin.Context) {
	userId := c.GetInt(ctxkey.Id)
	var req upgradeSubscriptionRequest
	err := c.ShouldBindJSON(&req)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	// Get active subscription
	sub, err := model.GetActiveSubscription(userId)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "未找到活跃订阅",
		})
		return
	}

	// Get new plan
	newPlan, err := model.GetPlanById(req.PlanId)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "目标套餐不存在",
		})
		return
	}
	if newPlan.Status != model.PlanStatusEnabled {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "目标套餐已停用",
		})
		return
	}

	// Get current plan
	currentPlan, err := model.GetPlanById(sub.PlanId)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "当前套餐信息获取失败",
		})
		return
	}

	if newPlan.Priority <= currentPlan.Priority {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "升级目标套餐等级必须高于当前套餐",
		})
		return
	}

	// Create upgrade order
	priceDiff := newPlan.PriceCentsMonthly - currentPlan.PriceCentsMonthly
	if priceDiff < 0 {
		priceDiff = 0
	}
	order := &model.Order{
		UserId:        userId,
		PlanId:        newPlan.Id,
		Type:          model.OrderTypeUpgrade,
		AmountCents:   priceDiff,
		Status:        model.OrderStatusPending,
		PaymentMethod: "admin",
	}
	err = model.CreateOrder(order)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "创建订单失败: " + err.Error(),
		})
		return
	}

	// Direct activation
	model.UpdateOrderStatus(order.Id, model.OrderStatusPaid)

	// Update subscription
	sub.PlanId = newPlan.Id
	sub.UpdatedTime = helper.GetTimestamp()
	err = model.UpdateSubscription(sub)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "更新订阅失败: " + err.Error(),
		})
		return
	}

	// Update user group
	model.UpdateUserGroupByPlan(userId, newPlan.Id)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data": gin.H{
			"subscription": sub,
			"order":        order,
		},
	})
}

type downgradeSubscriptionRequest struct {
	PlanId int `json:"plan_id"`
}

func DowngradeSubscription(c *gin.Context) {
	userId := c.GetInt(ctxkey.Id)
	var req downgradeSubscriptionRequest
	err := c.ShouldBindJSON(&req)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	sub, err := model.GetActiveSubscription(userId)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "未找到活跃订阅",
		})
		return
	}

	newPlan, err := model.GetPlanById(req.PlanId)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "目标套餐不存在",
		})
		return
	}
	if newPlan.Status != model.PlanStatusEnabled {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "目标套餐已停用",
		})
		return
	}

	currentPlan, err := model.GetPlanById(sub.PlanId)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "当前套餐信息获取失败",
		})
		return
	}

	if newPlan.Priority >= currentPlan.Priority {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "降级目标套餐等级必须低于当前套餐",
		})
		return
	}

	// Create downgrade order (takes effect at next period)
	order := &model.Order{
		UserId:        userId,
		PlanId:        newPlan.Id,
		Type:          model.OrderTypeDowngrade,
		AmountCents:   newPlan.PriceCentsMonthly,
		Status:        model.OrderStatusPaid,
		PaymentMethod: "admin",
	}
	err = model.CreateOrder(order)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "创建订单失败: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": fmt.Sprintf("降级将在当前计费周期结束后生效（%s）",
			time.Unix(sub.CurrentPeriodEnd, 0).Format("2006-01-02")),
		"data": gin.H{
			"order":         order,
			"effective_at":  sub.CurrentPeriodEnd,
			"target_plan":   newPlan,
		},
	})
}

func CancelSubscription(c *gin.Context) {
	userId := c.GetInt(ctxkey.Id)
	sub, err := model.GetActiveSubscription(userId)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "未找到活跃订阅",
		})
		return
	}

	sub.AutoRenew = false
	sub.UpdatedTime = helper.GetTimestamp()
	err = model.UpdateSubscription(sub)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "取消自动续费失败: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": fmt.Sprintf("已取消自动续费，订阅将在 %s 到期",
			time.Unix(sub.CurrentPeriodEnd, 0).Format("2006-01-02")),
		"data": sub,
	})
}

func RenewSubscription(c *gin.Context) {
	userId := c.GetInt(ctxkey.Id)
	sub, err := model.GetActiveSubscription(userId)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "未找到活跃订阅",
		})
		return
	}

	plan, err := model.GetPlanById(sub.PlanId)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "套餐信息获取失败",
		})
		return
	}

	// Create renewal order
	order := &model.Order{
		UserId:        userId,
		PlanId:        plan.Id,
		Type:          model.OrderTypeRenewal,
		AmountCents:   plan.PriceCentsMonthly,
		Status:        model.OrderStatusPending,
		PaymentMethod: "admin",
	}
	err = model.CreateOrder(order)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "创建订单失败: " + err.Error(),
		})
		return
	}

	// Direct activation
	model.UpdateOrderStatus(order.Id, model.OrderStatusPaid)

	// Extend subscription period
	now := helper.GetTimestamp()
	if sub.CurrentPeriodEnd > now {
		sub.CurrentPeriodEnd = sub.CurrentPeriodEnd + 30*24*3600
	} else {
		sub.CurrentPeriodStart = now
		sub.CurrentPeriodEnd = now + 30*24*3600
	}
	sub.AutoRenew = true
	sub.MonthlySpentCents = 0
	sub.UpdatedTime = helper.GetTimestamp()
	err = model.UpdateSubscription(sub)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "更新订阅失败: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data": gin.H{
			"subscription": sub,
			"order":        order,
		},
	})
}

func GetWindowQuota(c *gin.Context) {
	userId := c.GetInt(ctxkey.Id)

	sub, err := model.GetActiveSubscription(userId)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "",
			"data": gin.H{
				"has_subscription": false,
			},
		})
		return
	}

	plan, err := model.GetPlanById(sub.PlanId)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "套餐信息获取失败",
		})
		return
	}

	// Get current window usage
	windowCount, err := model.GetWindowUsageCount(userId, plan.WindowDurationSec)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "获取用量信息失败",
		})
		return
	}

	// Get booster extra count
	boosterExtra, _ := model.GetUserBoosterExtraCount(userId)

	remaining := int64(plan.WindowLimitCount) + int64(boosterExtra) - windowCount
	if remaining < 0 {
		remaining = 0
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data": gin.H{
			"has_subscription":  true,
			"plan_name":         plan.DisplayName,
			"window_limit":      plan.WindowLimitCount,
			"window_duration":   plan.WindowDurationSec,
			"window_used":       windowCount,
			"booster_extra":     boosterExtra,
			"remaining":         remaining,
			"monthly_spent":     sub.MonthlySpentCents,
			"monthly_limit":     plan.MonthlySpendLimitCents,
			"overage_rate_type": plan.OverageRateType,
		},
	})
}

func GetAllSubscriptions(c *gin.Context) {
	p, _ := strconv.Atoi(c.Query("p"))
	if p < 0 {
		p = 0
	}
	var subscriptions []*model.Subscription
	err := model.DB.Order("id desc").Limit(config.ItemsPerPage).Offset(p * config.ItemsPerPage).Find(&subscriptions).Error
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data":    subscriptions,
	})
}

func AdminUpdateSubscription(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "无效的订阅ID",
		})
		return
	}
	sub, err := model.GetSubscriptionById(id)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	var updateData model.Subscription
	err = c.ShouldBindJSON(&updateData)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	if updateData.PlanId != 0 {
		sub.PlanId = updateData.PlanId
	}
	if updateData.Status != 0 {
		sub.Status = updateData.Status
	}
	if updateData.CurrentPeriodEnd != 0 {
		sub.CurrentPeriodEnd = updateData.CurrentPeriodEnd
	}
	sub.AutoRenew = updateData.AutoRenew
	sub.UpdatedTime = helper.GetTimestamp()

	err = model.UpdateSubscription(sub)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data":    sub,
	})
}
