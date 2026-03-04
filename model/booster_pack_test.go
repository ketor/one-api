package model

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestBoosterPackInsert(t *testing.T) {
	cleanTable(&BoosterPack{})

	bp := &BoosterPack{
		Name:             "test-pack",
		DisplayName:      "Test Pack",
		Description:      "A test booster pack",
		PriceCents:       999,
		ExtraCount:       100,
		ValidDurationSec: 86400,
		AllowedModels:    "gpt-4,gpt-3.5-turbo",
		Status:           BoosterPackStatusEnabled,
	}
	err := bp.Insert()
	assert.NoError(t, err)
	assert.NotZero(t, bp.Id)
	assert.NotZero(t, bp.CreatedTime)
	assert.NotZero(t, bp.UpdatedTime)
	assert.Equal(t, bp.CreatedTime, bp.UpdatedTime)
}

func TestBoosterPackUpdate(t *testing.T) {
	cleanTable(&BoosterPack{})

	bp := &BoosterPack{
		Name:        "update-pack",
		DisplayName: "Before Update",
		PriceCents:  500,
		ExtraCount:  50,
		Status:      BoosterPackStatusEnabled,
	}
	err := bp.Insert()
	assert.NoError(t, err)

	originalUpdatedTime := bp.UpdatedTime
	bp.DisplayName = "After Update"
	bp.PriceCents = 1000

	err = bp.Update()
	assert.NoError(t, err)
	assert.GreaterOrEqual(t, bp.UpdatedTime, originalUpdatedTime)

	// Verify changes persisted
	fetched, err := GetBoosterPackById(bp.Id)
	assert.NoError(t, err)
	assert.Equal(t, "After Update", fetched.DisplayName)
	assert.Equal(t, int64(1000), fetched.PriceCents)
}

func TestBoosterPackDelete(t *testing.T) {
	cleanTable(&BoosterPack{})

	bp := &BoosterPack{
		Name:   "delete-pack",
		Status: BoosterPackStatusEnabled,
	}
	err := bp.Insert()
	assert.NoError(t, err)

	err = bp.Delete()
	assert.NoError(t, err)

	_, err = GetBoosterPackById(bp.Id)
	assert.Error(t, err, "should not find deleted pack")
}

func TestGetBoosterPackById(t *testing.T) {
	cleanTable(&BoosterPack{})

	bp := &BoosterPack{
		Name:        "get-by-id",
		DisplayName: "Get By ID",
		PriceCents:  750,
		ExtraCount:  25,
		Status:      BoosterPackStatusEnabled,
	}
	err := bp.Insert()
	assert.NoError(t, err)

	fetched, err := GetBoosterPackById(bp.Id)
	assert.NoError(t, err)
	assert.Equal(t, bp.Id, fetched.Id)
	assert.Equal(t, "get-by-id", fetched.Name)
	assert.Equal(t, "Get By ID", fetched.DisplayName)
	assert.Equal(t, int64(750), fetched.PriceCents)

	// Non-existent ID
	_, err = GetBoosterPackById(99999)
	assert.Error(t, err)
}

func TestGetAllBoosterPacks(t *testing.T) {
	cleanTable(&BoosterPack{})

	packs := []*BoosterPack{
		{Name: "pack-a", Status: BoosterPackStatusEnabled},
		{Name: "pack-b", Status: BoosterPackStatusDisabled},
		{Name: "pack-c", Status: BoosterPackStatusEnabled},
	}
	for _, p := range packs {
		err := p.Insert()
		assert.NoError(t, err)
	}

	all, err := GetAllBoosterPacks()
	assert.NoError(t, err)
	assert.Len(t, all, 3)

	// Verify ordered by id asc
	for i := 1; i < len(all); i++ {
		assert.Less(t, all[i-1].Id, all[i].Id)
	}
}

func TestGetEnabledBoosterPacks(t *testing.T) {
	cleanTable(&BoosterPack{})

	packs := []*BoosterPack{
		{Name: "enabled-1", Status: BoosterPackStatusEnabled},
		{Name: "disabled-1", Status: BoosterPackStatusDisabled},
		{Name: "enabled-2", Status: BoosterPackStatusEnabled},
		{Name: "disabled-2", Status: BoosterPackStatusDisabled},
	}
	for _, p := range packs {
		err := p.Insert()
		assert.NoError(t, err)
	}

	enabled, err := GetEnabledBoosterPacks()
	assert.NoError(t, err)
	assert.Len(t, enabled, 2)

	for _, p := range enabled {
		assert.Equal(t, BoosterPackStatusEnabled, p.Status)
	}

	// Verify ordered by id asc
	assert.Less(t, enabled[0].Id, enabled[1].Id)
}
