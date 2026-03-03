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

	var records []*model.UsageWindow
	query := model.DB.Where("user_id = ? AND request_time >= ? AND request_time <= ?",
		userId, startTimestamp, endTimestamp).
		Order("request_time desc").
		Limit(config.ItemsPerPage).
		Offset(p * config.ItemsPerPage)
	err := query.Find(&records).Error
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

	var totalRequests int64
	model.DB.Model(&model.UsageWindow{}).Where("request_time >= ?", dayStart).Count(&totalRequests)

	var totalTokens struct {
		Sum int64
	}
	model.DB.Model(&model.UsageWindow{}).
		Where("request_time >= ?", dayStart).
		Select("COALESCE(SUM(tokens_used), 0) as sum").
		Scan(&totalTokens)

	var totalQuota struct {
		Sum int64
	}
	model.DB.Model(&model.UsageWindow{}).
		Where("request_time >= ?", dayStart).
		Select("COALESCE(SUM(quota_used), 0) as sum").
		Scan(&totalQuota)

	var activeUsers int64
	model.DB.Model(&model.UsageWindow{}).
		Where("request_time >= ?", dayStart).
		Distinct("user_id").
		Count(&activeUsers)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data": gin.H{
			"total_requests_24h":  totalRequests,
			"total_tokens_24h":    totalTokens.Sum,
			"total_quota_24h":     totalQuota.Sum,
			"active_users_24h":    activeUsers,
		},
	})
}

type modelUsageStat struct {
	ModelName    string `json:"model_name"`
	RequestCount int64  `json:"request_count"`
	TotalTokens  int64  `json:"total_tokens"`
	TotalQuota   int64  `json:"total_quota"`
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

	var stats []modelUsageStat
	err := model.DB.Model(&model.UsageWindow{}).
		Where("request_time >= ? AND request_time <= ?", startTimestamp, endTimestamp).
		Select("model_name, COUNT(*) as request_count, COALESCE(SUM(tokens_used), 0) as total_tokens, COALESCE(SUM(quota_used), 0) as total_quota").
		Group("model_name").
		Order("request_count desc").
		Scan(&stats).Error
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

type topUserStat struct {
	UserId       int   `json:"user_id"`
	RequestCount int64 `json:"request_count"`
	TotalTokens  int64 `json:"total_tokens"`
	TotalQuota   int64 `json:"total_quota"`
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

	var stats []topUserStat
	err := model.DB.Model(&model.UsageWindow{}).
		Where("request_time >= ? AND request_time <= ?", startTimestamp, endTimestamp).
		Select("user_id, COUNT(*) as request_count, COALESCE(SUM(tokens_used), 0) as total_tokens, COALESCE(SUM(quota_used), 0) as total_quota").
		Group("user_id").
		Order("request_count desc").
		Limit(limit).
		Scan(&stats).Error
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
