package model

import (
	"context"
	"fmt"
	"strconv"
	"time"

	"github.com/go-redis/redis/v8"
	"github.com/songquanpeng/one-api/common"
	"github.com/songquanpeng/one-api/common/helper"
	"github.com/songquanpeng/one-api/common/logger"
)

type UsageWindow struct {
	Id          int64  `json:"id" gorm:"primaryKey;autoIncrement"`
	UserId      int    `json:"user_id" gorm:"index:idx_user_time;not null"`
	RequestTime int64  `json:"request_time" gorm:"bigint;index:idx_user_time"`
	ModelName   string `json:"model_name" gorm:"type:varchar(128)"`
	TokensUsed  int    `json:"tokens_used" gorm:"default:0"`
	QuotaUsed   int64  `json:"quota_used" gorm:"bigint;default:0"`
}

func RecordUsageWindow(userId int, modelName string, tokensUsed int, quotaUsed int64) error {
	now := helper.GetTimestamp()
	record := &UsageWindow{
		UserId:      userId,
		RequestTime: now,
		ModelName:   modelName,
		TokensUsed:  tokensUsed,
		QuotaUsed:   quotaUsed,
	}
	err := DB.Create(record).Error
	if err != nil {
		logger.SysError(fmt.Sprintf("failed to record usage window for user %d: %s", userId, err.Error()))
		return err
	}

	// Also add to Redis sorted set if enabled
	if common.RedisEnabled {
		key := fmt.Sprintf("usage_window:%d", userId)
		ctx := context.Background()
		member := fmt.Sprintf("%d", record.Id)
		err = common.RDB.ZAdd(ctx, key, &redis.Z{Score: float64(now), Member: member}).Err()
		if err != nil {
			logger.SysError(fmt.Sprintf("Redis ZAdd usage_window error for user %d: %s", userId, err.Error()))
		}
	}
	return nil
}

// GetWindowUsageCount returns the number of requests within the given window duration.
// Uses Redis sorted set if available, falls back to database query.
func GetWindowUsageCount(userId int, windowDurationSec int64) (int64, error) {
	now := helper.GetTimestamp()
	windowStart := now - windowDurationSec

	if common.RedisEnabled {
		key := fmt.Sprintf("usage_window:%d", userId)
		ctx := context.Background()

		// Count entries with score (timestamp) >= windowStart
		count, err := common.RDB.ZCount(ctx, key, strconv.FormatInt(windowStart, 10), "+inf").Result()
		if err == nil && count > 0 {
			return count, nil
		}
		if err != nil {
			logger.SysError(fmt.Sprintf("Redis ZCount usage_window error for user %d, falling back to DB: %s", userId, err.Error()))
		}
		// Redis returned 0 or error: fallback to DB to handle cases where
		// Redis sorted set may not have been populated yet
	}

	// Database fallback
	var count int64
	err := DB.Model(&UsageWindow{}).
		Where("user_id = ? AND request_time >= ?", userId, windowStart).
		Count(&count).Error
	return count, err
}

// CleanExpiredWindows removes usage window records older than the specified duration.
func CleanExpiredWindows(maxAgeSec int64) error {
	cutoff := helper.GetTimestamp() - maxAgeSec
	result := DB.Where("request_time < ?", cutoff).Delete(&UsageWindow{})
	if result.Error != nil {
		logger.SysError("failed to clean expired usage windows: " + result.Error.Error())
		return result.Error
	}
	logger.SysLog(fmt.Sprintf("cleaned %d expired usage window records", result.RowsAffected))

	// Also clean Redis sorted sets
	if common.RedisEnabled {
		// We cannot easily enumerate all user keys, so Redis entries
		// will expire naturally via ZRemRangeByScore when accessed,
		// or via a scheduled cleanup job.
	}
	return nil
}

// CleanUserExpiredWindows removes expired entries from a specific user's Redis sorted set.
func CleanUserExpiredWindows(userId int, windowDurationSec int64) {
	if !common.RedisEnabled {
		return
	}
	key := fmt.Sprintf("usage_window:%d", userId)
	cutoff := helper.GetTimestamp() - windowDurationSec
	ctx := context.Background()
	err := common.RDB.ZRemRangeByScore(ctx, key, "-inf", strconv.FormatInt(cutoff, 10)).Err()
	if err != nil {
		logger.SysError(fmt.Sprintf("Redis ZRemRangeByScore error for user %d: %s", userId, err.Error()))
	}
}

// ExpireUserWindowKey sets a TTL on the user's usage window Redis key.
func ExpireUserWindowKey(userId int, windowDurationSec int64) {
	if !common.RedisEnabled {
		return
	}
	key := fmt.Sprintf("usage_window:%d", userId)
	ctx := context.Background()
	// Set TTL to 2x window duration to ensure data availability
	ttl := time.Duration(windowDurationSec*2) * time.Second
	err := common.RDB.Expire(ctx, key, ttl).Err()
	if err != nil {
		logger.SysError(fmt.Sprintf("Redis Expire error for usage_window key user %d: %s", userId, err.Error()))
	}
}
