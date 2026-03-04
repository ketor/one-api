package controller

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/songquanpeng/one-api/common/helper"
	"github.com/songquanpeng/one-api/model"
)

func GetPlans(c *gin.Context) {
	plans, err := model.GetEnabledPlans()
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
		"data":    plans,
	})
}

func GetPlan(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "无效的套餐ID",
		})
		return
	}
	plan, err := model.GetPlanById(id)
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
		"data":    plan,
	})
}

func GetAllAdminPlans(c *gin.Context) {
	plans, err := model.GetAllPlans()
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
		"data":    plans,
	})
}

func CreatePlan(c *gin.Context) {
	plan := model.Plan{}
	err := c.ShouldBindJSON(&plan)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	if plan.Name == "" {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "套餐名称不能为空",
		})
		return
	}
	cleanPlan := model.Plan{
		Name:                   plan.Name,
		DisplayName:            plan.DisplayName,
		Description:            plan.Description,
		Tagline:                plan.Tagline,
		PriceCentsMonthly:      plan.PriceCentsMonthly,
		WindowLimitCount:       plan.WindowLimitCount,
		WindowDurationSec:      plan.WindowDurationSec,
		WeeklyLimitCount:       plan.WeeklyLimitCount,
		MonthlySpendLimitCents: plan.MonthlySpendLimitCents,
		OverageRateType:        plan.OverageRateType,
		AllowedModels:          plan.AllowedModels,
		GroupName:              plan.GroupName,
		Features:               plan.Features,
		CtaText:                plan.CtaText,
		IsFeatured:             plan.IsFeatured,
		IsContactSales:         plan.IsContactSales,
		Priority:               plan.Priority,
		Status:                 plan.Status,
	}
	if cleanPlan.WindowDurationSec == 0 {
		cleanPlan.WindowDurationSec = 18000
	}
	if cleanPlan.OverageRateType == "" {
		cleanPlan.OverageRateType = model.OverageRateTypeAPI
	}
	err = cleanPlan.Insert()
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
		"data":    cleanPlan,
	})
}

func UpdatePlan(c *gin.Context) {
	plan := model.Plan{}
	err := c.ShouldBindJSON(&plan)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	if plan.Id == 0 {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "套餐ID不能为空",
		})
		return
	}
	cleanPlan, err := model.GetPlanById(plan.Id)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	cleanPlan.Name = plan.Name
	cleanPlan.DisplayName = plan.DisplayName
	cleanPlan.Description = plan.Description
	cleanPlan.Tagline = plan.Tagline
	cleanPlan.PriceCentsMonthly = plan.PriceCentsMonthly
	cleanPlan.WindowLimitCount = plan.WindowLimitCount
	cleanPlan.WindowDurationSec = plan.WindowDurationSec
	cleanPlan.WeeklyLimitCount = plan.WeeklyLimitCount
	cleanPlan.MonthlySpendLimitCents = plan.MonthlySpendLimitCents
	cleanPlan.OverageRateType = plan.OverageRateType
	cleanPlan.AllowedModels = plan.AllowedModels
	cleanPlan.GroupName = plan.GroupName
	cleanPlan.Features = plan.Features
	cleanPlan.CtaText = plan.CtaText
	cleanPlan.IsFeatured = plan.IsFeatured
	cleanPlan.IsContactSales = plan.IsContactSales
	cleanPlan.Priority = plan.Priority
	cleanPlan.Status = plan.Status
	cleanPlan.UpdatedTime = helper.GetTimestamp()

	err = cleanPlan.Update()
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	model.CacheInvalidatePlan(cleanPlan.Id)
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data":    cleanPlan,
	})
}

func DeletePlan(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "无效的套餐ID",
		})
		return
	}
	plan, err := model.GetPlanById(id)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	// Check for active subscriptions using this plan
	activeCount, err := model.CountActiveSubscriptionsByPlanId(id)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	if activeCount > 0 {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "该套餐有活跃用户正在使用，请先迁移用户后再删除",
		})
		return
	}
	err = plan.Delete()
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	model.CacheInvalidatePlan(id)
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
	})
}
