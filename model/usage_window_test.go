package model

import (
	"testing"
	"time"

	"github.com/songquanpeng/one-api/common"
	"github.com/songquanpeng/one-api/common/helper"
	"github.com/stretchr/testify/assert"
)

func TestRecordUsageWindow(t *testing.T) {
	common.RedisEnabled = false
	cleanTable(&UsageWindow{})

	err := RecordUsageWindow(1, "gpt-4", 500, 1000)
	assert.NoError(t, err)

	// Verify the record exists in DB
	var count int64
	DB.Model(&UsageWindow{}).Where("user_id = ?", 1).Count(&count)
	assert.Equal(t, int64(1), count)

	// Verify fields
	var record UsageWindow
	DB.Where("user_id = ?", 1).First(&record)
	assert.Equal(t, 1, record.UserId)
	assert.Equal(t, "gpt-4", record.ModelName)
	assert.Equal(t, 500, record.TokensUsed)
	assert.Equal(t, int64(1000), record.QuotaUsed)
	assert.NotZero(t, record.RequestTime)
}

func TestGetWindowUsageCount(t *testing.T) {
	common.RedisEnabled = false
	cleanTable(&UsageWindow{})

	now := helper.GetTimestamp()
	userId := 10

	// Insert records at various times
	records := []UsageWindow{
		{UserId: userId, RequestTime: now, ModelName: "gpt-4", TokensUsed: 100},
		{UserId: userId, RequestTime: now - 100, ModelName: "gpt-4", TokensUsed: 200},
		{UserId: userId, RequestTime: now - 500, ModelName: "gpt-4", TokensUsed: 300},
		{UserId: userId, RequestTime: now - 5000, ModelName: "gpt-4", TokensUsed: 400},    // outside 3600 window
		{UserId: userId, RequestTime: now - 100000, ModelName: "gpt-4", TokensUsed: 500},   // way outside
		{UserId: 999, RequestTime: now, ModelName: "gpt-4", TokensUsed: 100},                // different user
	}
	for _, r := range records {
		err := DB.Create(&r).Error
		assert.NoError(t, err)
	}

	// 1-hour window: should include first 3 records
	count, err := GetWindowUsageCount(userId, 3600)
	assert.NoError(t, err)
	assert.Equal(t, int64(3), count)

	// 200-second window: should include first 2 records
	count, err = GetWindowUsageCount(userId, 200)
	assert.NoError(t, err)
	assert.Equal(t, int64(2), count)

	// Very large window: all records for user
	count, err = GetWindowUsageCount(userId, 999999)
	assert.NoError(t, err)
	assert.Equal(t, int64(5), count)
}

func TestGetAlignedWindowStart(t *testing.T) {
	windowDuration := int64(18000) // 5 hours

	result := GetAlignedWindowStart(windowDuration)
	now := time.Now().Unix()

	// Result should be <= current time
	assert.LessOrEqual(t, result, now)

	// Result should be divisible by windowDuration
	assert.Equal(t, int64(0), result%windowDuration)

	// Result should be within one window of now
	assert.Greater(t, result+windowDuration, now)

	// Test with a 1-hour window
	hourWindow := int64(3600)
	hourResult := GetAlignedWindowStart(hourWindow)
	assert.Equal(t, int64(0), hourResult%hourWindow)
	assert.LessOrEqual(t, hourResult, now)
	assert.Greater(t, hourResult+hourWindow, now)
}

func TestGetWeekStartTimestamp(t *testing.T) {
	weekStart := GetWeekStartTimestamp()
	now := time.Now()
	nowUnix := now.Unix()

	// Should be <= current time
	assert.LessOrEqual(t, weekStart, nowUnix)

	// Convert back to time to verify it's a Monday at 00:00:00
	monday := time.Unix(weekStart, 0)
	assert.Equal(t, time.Monday, monday.Weekday())
	assert.Equal(t, 0, monday.Hour())
	assert.Equal(t, 0, monday.Minute())
	assert.Equal(t, 0, monday.Second())

	// Should be within the last 7 days
	assert.Greater(t, weekStart, nowUnix-7*86400)
}

func TestGetAlignedWindowUsageCount(t *testing.T) {
	common.RedisEnabled = false
	cleanTable(&UsageWindow{})

	now := helper.GetTimestamp()
	userId := 20

	// Insert a record at the current time
	err := DB.Create(&UsageWindow{
		UserId:      userId,
		RequestTime: now,
		ModelName:   "gpt-4",
		TokensUsed:  100,
	}).Error
	assert.NoError(t, err)

	// Insert a very old record
	err = DB.Create(&UsageWindow{
		UserId:      userId,
		RequestTime: now - 999999,
		ModelName:   "gpt-4",
		TokensUsed:  200,
	}).Error
	assert.NoError(t, err)

	// With a 1-hour aligned window, the recent record should be counted
	count, err := GetAlignedWindowUsageCount(userId, 3600)
	assert.NoError(t, err)
	assert.GreaterOrEqual(t, count, int64(1))

	// The old record should not be counted in a small window
	count, err = GetAlignedWindowUsageCount(userId, 3600)
	assert.NoError(t, err)
	assert.LessOrEqual(t, count, int64(1))
}

func TestGetWeeklyUsageCount(t *testing.T) {
	common.RedisEnabled = false
	cleanTable(&UsageWindow{})

	now := helper.GetTimestamp()
	userId := 30

	// Insert a record at the current time (should be counted)
	err := DB.Create(&UsageWindow{
		UserId:      userId,
		RequestTime: now,
		ModelName:   "gpt-4",
		TokensUsed:  100,
	}).Error
	assert.NoError(t, err)

	// Insert another recent record
	err = DB.Create(&UsageWindow{
		UserId:      userId,
		RequestTime: now - 3600,
		ModelName:   "gpt-3.5-turbo",
		TokensUsed:  50,
	}).Error
	assert.NoError(t, err)

	// Insert an old record (more than a week ago, should not be counted)
	err = DB.Create(&UsageWindow{
		UserId:      userId,
		RequestTime: now - 8*86400,
		ModelName:   "gpt-4",
		TokensUsed:  999,
	}).Error
	assert.NoError(t, err)

	count, err := GetWeeklyUsageCount(userId)
	assert.NoError(t, err)
	// At minimum, the two recent records should be counted (they're within this week)
	assert.GreaterOrEqual(t, count, int64(2))
}

func TestCleanExpiredWindows(t *testing.T) {
	common.RedisEnabled = false
	cleanTable(&UsageWindow{})

	now := helper.GetTimestamp()
	userId := 40

	// Insert recent records
	err := DB.Create(&UsageWindow{
		UserId:      userId,
		RequestTime: now,
		ModelName:   "gpt-4",
	}).Error
	assert.NoError(t, err)

	err = DB.Create(&UsageWindow{
		UserId:      userId,
		RequestTime: now - 100,
		ModelName:   "gpt-4",
	}).Error
	assert.NoError(t, err)

	// Insert old records that should be cleaned
	err = DB.Create(&UsageWindow{
		UserId:      userId,
		RequestTime: now - 100000,
		ModelName:   "gpt-4",
	}).Error
	assert.NoError(t, err)

	err = DB.Create(&UsageWindow{
		UserId:      userId,
		RequestTime: now - 200000,
		ModelName:   "gpt-4",
	}).Error
	assert.NoError(t, err)

	// Clean records older than 50000 seconds
	err = CleanExpiredWindows(50000)
	assert.NoError(t, err)

	// Only the 2 recent records should remain
	var count int64
	DB.Model(&UsageWindow{}).Where("user_id = ?", userId).Count(&count)
	assert.Equal(t, int64(2), count)
}

func TestRecordUsageWindowMultipleRecords(t *testing.T) {
	common.RedisEnabled = false
	cleanTable(&UsageWindow{})

	// Record multiple usages for the same user
	for i := 0; i < 5; i++ {
		err := RecordUsageWindow(1, "gpt-4", 100+i, int64(200+i))
		assert.NoError(t, err)
	}

	var count int64
	DB.Model(&UsageWindow{}).Where("user_id = ?", 1).Count(&count)
	assert.Equal(t, int64(5), count)
}
