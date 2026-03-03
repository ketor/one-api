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
	PriceCentsMonthly      int64  `json:"price_cents_monthly" gorm:"bigint"`
	WindowLimitCount       int    `json:"window_limit_count" gorm:"default:0"`
	WindowDurationSec      int64  `json:"window_duration_sec" gorm:"bigint;default:18000"`
	WeeklyLimitCount       int    `json:"weekly_limit_count" gorm:"default:0"`
	MonthlySpendLimitCents int64  `json:"monthly_spend_limit_cents" gorm:"bigint;default:0"`
	OverageRateType        string `json:"overage_rate_type" gorm:"type:varchar(32);default:'api'"`
	AllowedModels          string `json:"allowed_models" gorm:"type:text"`
	GroupName              string `json:"group_name" gorm:"type:varchar(64)"`
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
			Name:                   "lite",
			DisplayName:            "Lite",
			Description:            "Free plan with limited usage",
			PriceCentsMonthly:      0,
			WindowLimitCount:       10,
			WindowDurationSec:      18000,
			WeeklyLimitCount:       200,
			MonthlySpendLimitCents: 0,
			OverageRateType:        OverageRateTypeBlocked,
			AllowedModels:          "",
			GroupName:              "default",
			Priority:               0,
			Status:                 PlanStatusEnabled,
			CreatedTime:            now,
			UpdatedTime:            now,
		},
		{
			Name:                   "pro",
			DisplayName:            "Pro",
			Description:            "Professional plan",
			PriceCentsMonthly:      14000,
			WindowLimitCount:       45,
			WindowDurationSec:      18000,
			WeeklyLimitCount:       1000,
			MonthlySpendLimitCents: 0,
			OverageRateType:        OverageRateTypeAPI,
			AllowedModels:          "",
			GroupName:              "default",
			Priority:               1,
			Status:                 PlanStatusEnabled,
			CreatedTime:            now,
			UpdatedTime:            now,
		},
		{
			Name:                   "max5x",
			DisplayName:            "Max 5x",
			Description:            "Max plan with 5x usage",
			PriceCentsMonthly:      70000,
			WindowLimitCount:       225,
			WindowDurationSec:      18000,
			WeeklyLimitCount:       5000,
			MonthlySpendLimitCents: 0,
			OverageRateType:        OverageRateTypeAPI,
			AllowedModels:          "",
			GroupName:              "default",
			Priority:               2,
			Status:                 PlanStatusEnabled,
			CreatedTime:            now,
			UpdatedTime:            now,
		},
		{
			Name:                   "max20x",
			DisplayName:            "Max 20x",
			Description:            "Max plan with 20x usage",
			PriceCentsMonthly:      140000,
			WindowLimitCount:       900,
			WindowDurationSec:      18000,
			WeeklyLimitCount:       20000,
			MonthlySpendLimitCents: 0,
			OverageRateType:        OverageRateTypeAPI,
			AllowedModels:          "",
			GroupName:              "default",
			Priority:               3,
			Status:                 PlanStatusEnabled,
			CreatedTime:            now,
			UpdatedTime:            now,
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
