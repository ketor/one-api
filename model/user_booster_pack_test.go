package model

import (
	"testing"

	"github.com/songquanpeng/one-api/common/helper"
	"github.com/stretchr/testify/assert"
)

func TestCreateUserBoosterPack(t *testing.T) {
	cleanTable(&UserBoosterPack{})

	ubp := &UserBoosterPack{
		UserId:        1,
		BoosterPackId: 10,
		OrderId:       100,
		RemainCount:   50,
		Status:        UserBoosterPackStatusActive,
		ExpireTime:    helper.GetTimestamp() + 86400,
	}
	err := CreateUserBoosterPack(ubp)
	assert.NoError(t, err)
	assert.NotZero(t, ubp.Id)
	assert.NotZero(t, ubp.CreatedTime)
	assert.NotZero(t, ubp.UpdatedTime)
}

func TestGetActiveUserBoosterPacks(t *testing.T) {
	cleanTable(&UserBoosterPack{})

	now := helper.GetTimestamp()
	userId := 42

	packs := []*UserBoosterPack{
		// Active, not expired
		{UserId: userId, BoosterPackId: 1, RemainCount: 10, Status: UserBoosterPackStatusActive, ExpireTime: now + 3600},
		// Active, no expiry (expire_time=0 means never expires)
		{UserId: userId, BoosterPackId: 2, RemainCount: 20, Status: UserBoosterPackStatusActive, ExpireTime: 0},
		// Active but expired
		{UserId: userId, BoosterPackId: 3, RemainCount: 5, Status: UserBoosterPackStatusActive, ExpireTime: now - 100},
		// Used up
		{UserId: userId, BoosterPackId: 4, RemainCount: 0, Status: UserBoosterPackStatusUsedUp, ExpireTime: now + 3600},
		// Different user
		{UserId: 99, BoosterPackId: 5, RemainCount: 10, Status: UserBoosterPackStatusActive, ExpireTime: now + 3600},
	}
	for _, p := range packs {
		err := CreateUserBoosterPack(p)
		assert.NoError(t, err)
	}

	active, err := GetActiveUserBoosterPacks(userId)
	assert.NoError(t, err)
	// Should return: not-expired + no-expiry = 2 packs
	assert.Len(t, active, 2)

	for _, p := range active {
		assert.Equal(t, userId, p.UserId)
		assert.Equal(t, UserBoosterPackStatusActive, p.Status)
	}
}

func TestGetUserBoosterPacksByUserId(t *testing.T) {
	cleanTable(&UserBoosterPack{})

	userId := 55
	for i := 0; i < 3; i++ {
		err := CreateUserBoosterPack(&UserBoosterPack{
			UserId:        userId,
			BoosterPackId: i + 1,
			RemainCount:   10,
			Status:        UserBoosterPackStatusActive,
		})
		assert.NoError(t, err)
	}
	// Different user
	err := CreateUserBoosterPack(&UserBoosterPack{
		UserId:        999,
		BoosterPackId: 1,
		RemainCount:   10,
		Status:        UserBoosterPackStatusActive,
	})
	assert.NoError(t, err)

	packs, err := GetUserBoosterPacksByUserId(userId)
	assert.NoError(t, err)
	assert.Len(t, packs, 3)

	// Verify ordered by id desc
	for i := 1; i < len(packs); i++ {
		assert.Greater(t, packs[i-1].Id, packs[i].Id)
	}
}

func TestGetUserBoosterPackById(t *testing.T) {
	cleanTable(&UserBoosterPack{})

	ubp := &UserBoosterPack{
		UserId:        7,
		BoosterPackId: 3,
		RemainCount:   15,
		Status:        UserBoosterPackStatusActive,
	}
	err := CreateUserBoosterPack(ubp)
	assert.NoError(t, err)

	fetched, err := GetUserBoosterPackById(ubp.Id)
	assert.NoError(t, err)
	assert.Equal(t, ubp.Id, fetched.Id)
	assert.Equal(t, 7, fetched.UserId)
	assert.Equal(t, 15, fetched.RemainCount)

	// Zero ID should error
	_, err = GetUserBoosterPackById(0)
	assert.Error(t, err)

	// Non-existent ID should error
	_, err = GetUserBoosterPackById(99999)
	assert.Error(t, err)
}

func TestGetUserBoosterExtraCount(t *testing.T) {
	cleanTable(&UserBoosterPack{})

	now := helper.GetTimestamp()
	userId := 77

	packs := []*UserBoosterPack{
		{UserId: userId, BoosterPackId: 1, RemainCount: 10, Status: UserBoosterPackStatusActive, ExpireTime: now + 3600},
		{UserId: userId, BoosterPackId: 2, RemainCount: 25, Status: UserBoosterPackStatusActive, ExpireTime: 0},
		// Expired - should not be counted
		{UserId: userId, BoosterPackId: 3, RemainCount: 100, Status: UserBoosterPackStatusActive, ExpireTime: now - 100},
		// Used up - should not be counted
		{UserId: userId, BoosterPackId: 4, RemainCount: 0, Status: UserBoosterPackStatusUsedUp, ExpireTime: now + 3600},
	}
	for _, p := range packs {
		err := CreateUserBoosterPack(p)
		assert.NoError(t, err)
	}

	total, err := GetUserBoosterExtraCount(userId)
	assert.NoError(t, err)
	assert.Equal(t, 35, total) // 10 + 25

	// User with no packs
	total, err = GetUserBoosterExtraCount(99999)
	assert.NoError(t, err)
	assert.Equal(t, 0, total)
}

func TestDecrementBoosterPackCount(t *testing.T) {
	cleanTable(&UserBoosterPack{})

	// Create a pack with remain_count = 2
	ubp := &UserBoosterPack{
		UserId:        88,
		BoosterPackId: 1,
		RemainCount:   2,
		Status:        UserBoosterPackStatusActive,
	}
	err := CreateUserBoosterPack(ubp)
	assert.NoError(t, err)

	// First decrement: 2 -> 1, status stays active
	err = DecrementBoosterPackCount(ubp.Id)
	assert.NoError(t, err)

	fetched, err := GetUserBoosterPackById(ubp.Id)
	assert.NoError(t, err)
	assert.Equal(t, 1, fetched.RemainCount)
	assert.Equal(t, UserBoosterPackStatusActive, fetched.Status)

	// Second decrement: 1 -> 0, status becomes UsedUp
	err = DecrementBoosterPackCount(ubp.Id)
	assert.NoError(t, err)

	fetched, err = GetUserBoosterPackById(ubp.Id)
	assert.NoError(t, err)
	assert.Equal(t, 0, fetched.RemainCount)
	assert.Equal(t, UserBoosterPackStatusUsedUp, fetched.Status)

	// Third decrement: should fail because status is UsedUp and count is 0
	err = DecrementBoosterPackCount(ubp.Id)
	assert.Error(t, err)
}

func TestDecrementBoosterPackCountNonExistent(t *testing.T) {
	cleanTable(&UserBoosterPack{})

	err := DecrementBoosterPackCount(99999)
	assert.Error(t, err)
}

func TestExpireUserBoosterPack(t *testing.T) {
	cleanTable(&UserBoosterPack{})

	ubp := &UserBoosterPack{
		UserId:        33,
		BoosterPackId: 1,
		RemainCount:   10,
		Status:        UserBoosterPackStatusActive,
	}
	err := CreateUserBoosterPack(ubp)
	assert.NoError(t, err)

	err = ExpireUserBoosterPack(ubp.Id)
	assert.NoError(t, err)

	fetched, err := GetUserBoosterPackById(ubp.Id)
	assert.NoError(t, err)
	assert.Equal(t, UserBoosterPackStatusExpired, fetched.Status)
}
