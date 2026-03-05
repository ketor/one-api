package controller

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/songquanpeng/one-api/common/config"
	"github.com/songquanpeng/one-api/common/ctxkey"
	"github.com/songquanpeng/one-api/common/helper"
	"github.com/songquanpeng/one-api/model"
)

func GetWindowUsage(c *gin.Context) {
	userId := c.GetInt(ctxkey.Id)

	// Try to get window duration from active subscription's plan
	var windowDuration int64 = 18000 // default 5h
	sub, err := model.GetActiveSubscription(userId)
	if err == nil {
		plan, planErr := model.GetPlanById(sub.PlanId)
		if planErr == nil && plan.WindowDurationSec > 0 {
			windowDuration = plan.WindowDurationSec
		}
	}

	count, err := model.GetWindowUsageCount(userId, windowDuration)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "获取窗口用量失败: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data": gin.H{
			"window_duration_sec": windowDuration,
			"request_count":       count,
		},
	})
}

func GetMonthlyUsage(c *gin.Context) {
	userId := c.GetInt(ctxkey.Id)

	sub, err := model.GetActiveSubscription(userId)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "",
			"data": gin.H{
				"has_subscription":  false,
				"monthly_spent":     0,
				"monthly_limit":     0,
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

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data": gin.H{
			"has_subscription":  true,
			"monthly_spent":     sub.MonthlySpentCents,
			"monthly_limit":     plan.MonthlySpendLimitCents,
			"period_start":      sub.CurrentPeriodStart,
			"period_end":        sub.CurrentPeriodEnd,
		},
	})
}

func GetUsageHistory(c *gin.Context) {
	userId := c.GetInt(ctxkey.Id)
	p, _ := strconv.Atoi(c.Query("p"))
	if p < 0 {
		p = 0
	}

	startTimestamp, _ := strconv.ParseInt(c.Query("start_timestamp"), 10, 64)
	endTimestamp, _ := strconv.ParseInt(c.Query("end_timestamp"), 10, 64)

	if endTimestamp == 0 {
		endTimestamp = helper.GetTimestamp()
	}
	if startTimestamp == 0 {
		startTimestamp = endTimestamp - 30*24*3600 // default last 30 days
	}

	records, err := model.GetUsageHistory(userId, startTimestamp, endTimestamp, p*config.ItemsPerPage, config.ItemsPerPage)
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
		"data":    records,
	})
}

// Admin usage endpoints

func GetPlatformUsageOverview(c *gin.Context) {
	now := helper.GetTimestamp()
	dayStart := now - 24*3600

	overview, err := model.GetPlatformUsageOverview(dayStart)
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
		"data":    overview,
	})
}

func GetUsageByModel(c *gin.Context) {
	startTimestamp, _ := strconv.ParseInt(c.Query("start_timestamp"), 10, 64)
	endTimestamp, _ := strconv.ParseInt(c.Query("end_timestamp"), 10, 64)

	now := helper.GetTimestamp()
	if endTimestamp == 0 {
		endTimestamp = now
	}
	if startTimestamp == 0 {
		startTimestamp = now - 24*3600
	}

	stats, err := model.GetUsageByModel(startTimestamp, endTimestamp)
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
		"data":    stats,
	})
}

func GetTopUsers(c *gin.Context) {
	startTimestamp, _ := strconv.ParseInt(c.Query("start_timestamp"), 10, 64)
	endTimestamp, _ := strconv.ParseInt(c.Query("end_timestamp"), 10, 64)
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	if limit <= 0 || limit > 100 {
		limit = 20
	}

	now := helper.GetTimestamp()
	if endTimestamp == 0 {
		endTimestamp = now
	}
	if startTimestamp == 0 {
		startTimestamp = now - 24*3600
	}

	stats, err := model.GetTopUsers(startTimestamp, endTimestamp, limit)
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
		"data":    stats,
	})
}
