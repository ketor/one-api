package model

import (
	"github.com/songquanpeng/one-api/common/helper"
)

const (
	BoosterPackStatusEnabled  = 1
	BoosterPackStatusDisabled = 2
)

type BoosterPack struct {
	Id              int    `json:"id" gorm:"primaryKey;autoIncrement"`
	Name            string `json:"name" gorm:"type:varchar(64);uniqueIndex"`
	DisplayName     string `json:"display_name" gorm:"type:varchar(128)"`
	Description     string `json:"description" gorm:"type:text"`
	PriceCents      int64  `json:"price_cents" gorm:"bigint"`
	ExtraCount      int    `json:"extra_count" gorm:"default:0"`
	ValidDurationSec int64 `json:"valid_duration_sec" gorm:"bigint;default:0"`
	AllowedModels   string `json:"allowed_models" gorm:"type:text"`
	Status          int    `json:"status" gorm:"default:1"`
	CreatedTime     int64  `json:"created_time" gorm:"bigint"`
	UpdatedTime     int64  `json:"updated_time" gorm:"bigint"`
}

func GetAllBoosterPacks() ([]*BoosterPack, error) {
	var packs []*BoosterPack
	err := DB.Order("id asc").Find(&packs).Error
	return packs, err
}

func GetEnabledBoosterPacks() ([]*BoosterPack, error) {
	var packs []*BoosterPack
	err := DB.Where("status = ?", BoosterPackStatusEnabled).Order("id asc").Find(&packs).Error
	return packs, err
}

func GetBoosterPackById(id int) (*BoosterPack, error) {
	var pack BoosterPack
	err := DB.First(&pack, "id = ?", id).Error
	return &pack, err
}

func (bp *BoosterPack) Insert() error {
	bp.CreatedTime = helper.GetTimestamp()
	bp.UpdatedTime = helper.GetTimestamp()
	return DB.Create(bp).Error
}

func (bp *BoosterPack) Update() error {
	bp.UpdatedTime = helper.GetTimestamp()
	return DB.Save(bp).Error
}

func (bp *BoosterPack) Delete() error {
	return DB.Delete(bp).Error
}
