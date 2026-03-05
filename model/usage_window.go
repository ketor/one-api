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
		} else {
			// Set TTL to 8 days to ensure data availability for weekly counting
			ttl := time.Duration(8*24*3600) * time.Second
			common.RDB.Expire(ctx, key, ttl)
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

		// Check if the key exists before counting
		exists, existsErr := common.RDB.Exists(ctx, key).Result()
		if existsErr == nil && exists > 0 {
			// Key exists, count entries with score (timestamp) >= windowStart
			count, err := common.RDB.ZCount(ctx, key, strconv.FormatInt(windowStart, 10), "+inf").Result()
			if err == nil {
				return count, nil
			}
			logger.SysError(fmt.Sprintf("Redis ZCount usage_window error for user %d, falling back to DB: %s", userId, err.Error()))
		} else if existsErr != nil {
			logger.SysError(fmt.Sprintf("Redis Exists usage_window error for user %d, falling back to DB: %s", userId, existsErr.Error()))
		}
		// Key doesn't exist or Redis error: fallback to DB
	}

	// Database fallback
	var count int64
	err := DB.Model(&UsageWindow{}).
		Where("user_id = ? AND request_time >= ?", userId, windowStart).
		Count(&count).Error
	return count, err
}

// GetAlignedWindowStart returns the start timestamp for a fixed (aligned) window.
// Windows are aligned to epoch boundaries: windowStart = floor(now / duration) * duration.
// This ensures predictable, non-sliding windows with clear start/end times.
func GetAlignedWindowStart(windowDurationSec int64) int64 {
	now := time.Now().Unix()
	return (now / windowDurationSec) * windowDurationSec
}

// GetWeekStartTimestamp returns the Unix timestamp of Monday 00:00:00 local time for the current week.
func GetWeekStartTimestamp() int64 {
	now := time.Now()
	weekday := int(now.Weekday())
	if weekday == 0 {
		weekday = 7 // Sunday = 7
	}
	monday := now.AddDate(0, 0, -(weekday - 1))
	monday = time.Date(monday.Year(), monday.Month(), monday.Day(), 0, 0, 0, 0, now.Location())
	return monday.Unix()
}

// GetAlignedWindowUsageCount returns the number of requests within an aligned fixed window.
// Uses Redis sorted set if available, falls back to database query.
func GetAlignedWindowUsageCount(userId int, windowDurationSec int64) (int64, error) {
	windowStart := GetAlignedWindowStart(windowDurationSec)

	if common.RedisEnabled {
		key := fmt.Sprintf("usage_window:%d", userId)
		ctx := context.Background()

		exists, existsErr := common.RDB.Exists(ctx, key).Result()
		if existsErr == nil && exists > 0 {
			count, err := common.RDB.ZCount(ctx, key, strconv.FormatInt(windowStart, 10), "+inf").Result()
			if err == nil {
				return count, nil
			}
			logger.SysError(fmt.Sprintf("Redis ZCount aligned window error for user %d, falling back to DB: %s", userId, err.Error()))
		} else if existsErr != nil {
			logger.SysError(fmt.Sprintf("Redis Exists aligned window error for user %d, falling back to DB: %s", userId, existsErr.Error()))
		}
	}

	// Database fallback
	var count int64
	err := DB.Model(&UsageWindow{}).
		Where("user_id = ? AND request_time >= ?", userId, windowStart).
		Count(&count).Error
	return count, err
}

// GetWeeklyUsageCount returns the number of requests since Monday 00:00:00 local time.
// Uses Redis sorted set if available, falls back to database query.
func GetWeeklyUsageCount(userId int) (int64, error) {
	weekStart := GetWeekStartTimestamp()

	if common.RedisEnabled {
		key := fmt.Sprintf("usage_window:%d", userId)
		ctx := context.Background()

		exists, existsErr := common.RDB.Exists(ctx, key).Result()
		if existsErr == nil && exists > 0 {
			count, err := common.RDB.ZCount(ctx, key, strconv.FormatInt(weekStart, 10), "+inf").Result()
			if err == nil {
				return count, nil
			}
			logger.SysError(fmt.Sprintf("Redis ZCount weekly window error for user %d, falling back to DB: %s", userId, err.Error()))
		} else if existsErr != nil {
			logger.SysError(fmt.Sprintf("Redis Exists weekly window error for user %d, falling back to DB: %s", userId, existsErr.Error()))
		}
	}

	// Database fallback
	var count int64
	err := DB.Model(&UsageWindow{}).
		Where("user_id = ? AND request_time >= ?", userId, weekStart).
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

// GetUsageHistory returns paginated usage window records for a user within a time range.
func GetUsageHistory(userId int, startTimestamp int64, endTimestamp int64, startIdx int, num int) ([]*UsageWindow, error) {
	var records []*UsageWindow
	err := DB.Where("user_id = ? AND request_time >= ? AND request_time <= ?",
		userId, startTimestamp, endTimestamp).
		Order("request_time desc").
		Limit(num).
		Offset(startIdx).
		Find(&records).Error
	return records, err
}

// ModelUsageStat represents aggregated usage statistics per model.
type ModelUsageStat struct {
	ModelName    string `json:"model_name" gorm:"column:model_name"`
	RequestCount int64  `json:"request_count" gorm:"column:request_count"`
	TotalTokens  int64  `json:"total_tokens" gorm:"column:total_tokens"`
	TotalQuota   int64  `json:"total_quota" gorm:"column:total_quota"`
}

// GetUsageByModel returns aggregated usage statistics grouped by model name.
func GetUsageByModel(startTimestamp int64, endTimestamp int64) ([]ModelUsageStat, error) {
	var stats []ModelUsageStat
	err := DB.Model(&UsageWindow{}).
		Where("request_time >= ? AND request_time <= ?", startTimestamp, endTimestamp).
		Select("model_name, COUNT(*) as request_count, COALESCE(SUM(tokens_used), 0) as total_tokens, COALESCE(SUM(quota_used), 0) as total_quota").
		Group("model_name").
		Order("request_count desc").
		Scan(&stats).Error
	return stats, err
}

// TopUserStat represents aggregated usage statistics per user.
type TopUserStat struct {
	UserId       int   `json:"user_id" gorm:"column:user_id"`
	RequestCount int64 `json:"request_count" gorm:"column:request_count"`
	TotalTokens  int64 `json:"total_tokens" gorm:"column:total_tokens"`
	TotalQuota   int64 `json:"total_quota" gorm:"column:total_quota"`
}

// GetTopUsers returns the top users by request count within a time range.
func GetTopUsers(startTimestamp int64, endTimestamp int64, limit int) ([]TopUserStat, error) {
	var stats []TopUserStat
	err := DB.Model(&UsageWindow{}).
		Where("request_time >= ? AND request_time <= ?", startTimestamp, endTimestamp).
		Select("user_id, COUNT(*) as request_count, COALESCE(SUM(tokens_used), 0) as total_tokens, COALESCE(SUM(quota_used), 0) as total_quota").
		Group("user_id").
		Order("request_count desc").
		Limit(limit).
		Scan(&stats).Error
	return stats, err
}

// PlatformUsageOverview represents platform-wide usage metrics.
type PlatformUsageOverview struct {
	TotalRequests int64 `json:"total_requests_24h"`
	TotalTokens   int64 `json:"total_tokens_24h"`
	TotalQuota    int64 `json:"total_quota_24h"`
	ActiveUsers   int64 `json:"active_users_24h"`
}

// GetPlatformUsageOverview returns platform-wide usage metrics for the last 24 hours.
func GetPlatformUsageOverview(since int64) (*PlatformUsageOverview, error) {
	overview := &PlatformUsageOverview{}

	if err := DB.Model(&UsageWindow{}).Where("request_time >= ?", since).Count(&overview.TotalRequests).Error; err != nil {
		return nil, err
	}

	var tokenSum struct{ Sum int64 }
	DB.Model(&UsageWindow{}).
		Where("request_time >= ?", since).
		Select("COALESCE(SUM(tokens_used), 0) as sum").
		Scan(&tokenSum)
	overview.TotalTokens = tokenSum.Sum

	var quotaSum struct{ Sum int64 }
	DB.Model(&UsageWindow{}).
		Where("request_time >= ?", since).
		Select("COALESCE(SUM(quota_used), 0) as sum").
		Scan(&quotaSum)
	overview.TotalQuota = quotaSum.Sum

	DB.Model(&UsageWindow{}).
		Where("request_time >= ?", since).
		Distinct("user_id").
		Count(&overview.ActiveUsers)

	return overview, nil
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
