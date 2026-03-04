package model

import (
	"fmt"

	"github.com/songquanpeng/one-api/common/helper"
	"github.com/songquanpeng/one-api/common/logger"
)

const (
	PlanStatusEnabled  = 1
	PlanStatusDisabled = 2
)

const (
	OverageRateTypeAPI     = "api"
	OverageRateTypeBlocked = "blocked"
)

type Plan struct {
	Id                     int    `json:"id" gorm:"primaryKey;autoIncrement"`
	Name                   string `json:"name" gorm:"type:varchar(64);uniqueIndex"`
	DisplayName            string `json:"display_name" gorm:"type:varchar(128)"`
	Description            string `json:"description" gorm:"type:text"`
	Tagline                string `json:"tagline" gorm:"type:varchar(256)"`
	PriceCentsMonthly      int64  `json:"price_cents_monthly" gorm:"bigint"`
	WindowLimitCount       int    `json:"window_limit_count" gorm:"default:0"`
	WindowDurationSec      int64  `json:"window_duration_sec" gorm:"bigint;default:18000"`
	WeeklyLimitCount       int    `json:"weekly_limit_count" gorm:"default:0"`
	MonthlySpendLimitCents int64  `json:"monthly_spend_limit_cents" gorm:"bigint;default:0"`
	OverageRateType        string `json:"overage_rate_type" gorm:"type:varchar(32);default:'api'"`
	AllowedModels          string `json:"allowed_models" gorm:"type:text"`
	GroupName              string `json:"group_name" gorm:"type:varchar(64)"`
	Features               string `json:"features" gorm:"type:text"`
	CtaText                string `json:"cta_text" gorm:"type:varchar(64)"`
	IsFeatured             bool   `json:"is_featured" gorm:"default:false"`
	IsContactSales         bool   `json:"is_contact_sales" gorm:"default:false"`
	Priority               int    `json:"priority" gorm:"default:0"`
	Status                 int    `json:"status" gorm:"default:1"`
	CreatedTime            int64  `json:"created_time" gorm:"bigint"`
	UpdatedTime            int64  `json:"updated_time" gorm:"bigint"`
}

func GetAllPlans() (plans []*Plan, err error) {
	err = DB.Order("priority asc").Find(&plans).Error
	return plans, err
}

func GetEnabledPlans() (plans []*Plan, err error) {
	err = DB.Where("status = ?", PlanStatusEnabled).Order("priority asc").Find(&plans).Error
	return plans, err
}

func GetPlanById(id int) (*Plan, error) {
	var plan Plan
	err := DB.First(&plan, "id = ?", id).Error
	return &plan, err
}

func GetPlanByName(name string) (*Plan, error) {
	var plan Plan
	err := DB.First(&plan, "name = ?", name).Error
	return &plan, err
}

func (p *Plan) Insert() error {
	p.CreatedTime = helper.GetTimestamp()
	p.UpdatedTime = helper.GetTimestamp()
	return DB.Create(p).Error
}

func (p *Plan) Update() error {
	p.UpdatedTime = helper.GetTimestamp()
	return DB.Save(p).Error
}

func (p *Plan) Delete() error {
	return DB.Delete(p).Error
}

func InitDefaultPlans() {
	var count int64
	DB.Model(&Plan{}).Count(&count)
	if count > 0 {
		return
	}
	logger.SysLog("no plans found, creating default plans")
	now := helper.GetTimestamp()
	defaultPlans := []Plan{
		{
			Name:              "glow",
			DisplayName:       "GLOW",
			Description:       "Free plan for personal developers",
			Tagline:           "个人开发者入门",
			PriceCentsMonthly: 0,
			WindowLimitCount:  100,
			WindowDurationSec: 86400,
			WeeklyLimitCount:  500,
			OverageRateType:   OverageRateTypeBlocked,
			AllowedModels:     "kimi-2.5,qwen-3.5,glm-5,deepseek-v3,deepseek-r1",
			GroupName:         "glow",
			Features:          `["5 个模型可用","100 次/天调用","社区支持"]`,
			CtaText:           "免费注册",
			IsFeatured:        false,
			IsContactSales:    false,
			Priority:          0,
			Status:            PlanStatusEnabled,
			CreatedTime:       now,
			UpdatedTime:       now,
		},
		{
			Name:              "star",
			DisplayName:       "STAR",
			Description:       "Professional plan for independent developers",
			Tagline:           "独立开发者进阶",
			PriceCentsMonthly: 9900,
			WindowLimitCount:  5000,
			WindowDurationSec: 86400,
			WeeklyLimitCount:  25000,
			OverageRateType:   OverageRateTypeAPI,
			AllowedModels:     "",
			GroupName:         "star",
			Features:          `["20+ 模型可用","5,000 次/天调用","邮件支持"]`,
			CtaText:           "开始使用",
			IsFeatured:        false,
			IsContactSales:    false,
			Priority:          1,
			Status:            PlanStatusEnabled,
			CreatedTime:       now,
			UpdatedTime:       now,
		},
		{
			Name:              "solar",
			DisplayName:       "SOLAR",
			Description:       "Best for team collaboration",
			Tagline:           "团队协作首选",
			PriceCentsMonthly: 29900,
			WindowLimitCount:  50000,
			WindowDurationSec: 86400,
			WeeklyLimitCount:  200000,
			OverageRateType:   OverageRateTypeAPI,
			AllowedModels:     "",
			GroupName:         "solar",
			Features:          `["全部模型可用","50,000 次/天调用","专属客服"]`,
			CtaText:           "立即升级",
			IsFeatured:        true,
			IsContactSales:    false,
			Priority:          2,
			Status:            PlanStatusEnabled,
			CreatedTime:       now,
			UpdatedTime:       now,
		},
		{
			Name:              "galaxy",
			DisplayName:       "GALAXY",
			Description:       "Enterprise-grade custom solution",
			Tagline:           "企业级定制方案",
			PriceCentsMonthly: 0,
			WindowLimitCount:  0,
			WindowDurationSec: 86400,
			WeeklyLimitCount:  0,
			OverageRateType:   OverageRateTypeAPI,
			AllowedModels:     "",
			GroupName:         "galaxy",
			Features:          `["无限模型 & 调用","私有化部署","SLA 保障"]`,
			CtaText:           "联系销售",
			IsFeatured:        false,
			IsContactSales:    true,
			Priority:          3,
			Status:            PlanStatusEnabled,
			CreatedTime:       now,
			UpdatedTime:       now,
		},
	}
	for _, plan := range defaultPlans {
		if err := DB.Create(&plan).Error; err != nil {
			logger.SysError("failed to create default plan " + plan.Name + ": " + err.Error())
		}
	}
	logger.SysLog("default plans created")
}

// MigratePlanWeeklyLimits updates existing plans in the database to have weekly limits
// if they currently have none set (weekly_limit_count = 0).
func MigratePlanWeeklyLimits() {
	weeklyLimits := map[string]int{
		"glow":  500,
		"star":  25000,
		"solar": 200000,
		// legacy plans
		"lite":   200,
		"pro":    1000,
		"max5x":  5000,
		"max20x": 20000,
	}
	for name, limit := range weeklyLimits {
		result := DB.Model(&Plan{}).Where("name = ? AND weekly_limit_count = 0", name).
			Update("weekly_limit_count", limit)
		if result.Error != nil {
			logger.SysError("failed to migrate weekly limit for plan " + name + ": " + result.Error.Error())
		} else if result.RowsAffected > 0 {
			logger.SysLog("migrated weekly limit for plan " + name + ": " + fmt.Sprintf("%d", limit))
		}
	}
}
