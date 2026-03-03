package model

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/songquanpeng/one-api/common"
	"github.com/songquanpeng/one-api/common/config"
	"github.com/songquanpeng/one-api/common/logger"
)

var (
	SubscriptionCacheSeconds = config.SyncFrequency
	PlanCacheSeconds         = config.SyncFrequency
)

// CacheGetActiveSubscription returns the active subscription for a user.
// Uses Redis cache if available, falls back to database.
func CacheGetActiveSubscription(userId int) (*Subscription, error) {
	if !common.RedisEnabled {
		return GetActiveSubscription(userId)
	}
	key := fmt.Sprintf("sub:%d", userId)
	cached, err := common.RedisGet(key)
	if err == nil {
		var sub Subscription
		if err := json.Unmarshal([]byte(cached), &sub); err == nil {
			return &sub, nil
		}
	}
	sub, err := GetActiveSubscription(userId)
	if err != nil {
		return nil, err
	}
	jsonBytes, err := json.Marshal(sub)
	if err == nil {
		err = common.RedisSet(key, string(jsonBytes), time.Duration(SubscriptionCacheSeconds)*time.Second)
		if err != nil {
			logger.SysError("Redis set subscription error: " + err.Error())
		}
	}
	return sub, nil
}

// CacheInvalidateSubscription removes the cached subscription for a user.
func CacheInvalidateSubscription(userId int) {
	if !common.RedisEnabled {
		return
	}
	key := fmt.Sprintf("sub:%d", userId)
	err := common.RedisDel(key)
	if err != nil {
		logger.SysError("Redis del subscription error: " + err.Error())
	}
}

// CacheGetPlanById returns a plan by ID.
// Uses Redis cache if available, falls back to database.
func CacheGetPlanById(planId int) (*Plan, error) {
	if !common.RedisEnabled {
		return GetPlanById(planId)
	}
	key := fmt.Sprintf("plan:%d", planId)
	cached, err := common.RedisGet(key)
	if err == nil {
		var plan Plan
		if err := json.Unmarshal([]byte(cached), &plan); err == nil {
			return &plan, nil
		}
	}
	plan, err := GetPlanById(planId)
	if err != nil {
		return nil, err
	}
	jsonBytes, err := json.Marshal(plan)
	if err == nil {
		err = common.RedisSet(key, string(jsonBytes), time.Duration(PlanCacheSeconds)*time.Second)
		if err != nil {
			logger.SysError("Redis set plan error: " + err.Error())
		}
	}
	return plan, nil
}

// CacheInvalidatePlan removes the cached plan.
func CacheInvalidatePlan(planId int) {
	if !common.RedisEnabled {
		return
	}
	key := fmt.Sprintf("plan:%d", planId)
	err := common.RedisDel(key)
	if err != nil {
		logger.SysError("Redis del plan error: " + err.Error())
	}
}
