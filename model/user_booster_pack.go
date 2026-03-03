package model

import (
	"errors"
	"fmt"

	"gorm.io/gorm"

	"github.com/songquanpeng/one-api/common/helper"
	"github.com/songquanpeng/one-api/common/logger"
)

const (
	UserBoosterPackStatusActive  = 1
	UserBoosterPackStatusUsedUp  = 2
	UserBoosterPackStatusExpired = 3
)

type UserBoosterPack struct {
	Id            int   `json:"id" gorm:"primaryKey;autoIncrement"`
	UserId        int   `json:"user_id" gorm:"index:idx_ubp_user;not null"`
	BoosterPackId int   `json:"booster_pack_id" gorm:"index;not null"`
	OrderId       int   `json:"order_id" gorm:"index"`
	RemainCount   int   `json:"remain_count" gorm:"default:0"`
	Status        int   `json:"status" gorm:"default:1;index:idx_ubp_user"`
	ExpireTime    int64 `json:"expire_time" gorm:"bigint;default:0"`
	CreatedTime   int64 `json:"created_time" gorm:"bigint"`
	UpdatedTime   int64 `json:"updated_time" gorm:"bigint"`
}

func GetActiveUserBoosterPacks(userId int) ([]*UserBoosterPack, error) {
	var packs []*UserBoosterPack
	now := helper.GetTimestamp()
	err := DB.Where("user_id = ? AND status = ? AND (expire_time = 0 OR expire_time > ?)",
		userId, UserBoosterPackStatusActive, now).
		Order("expire_time asc").
		Find(&packs).Error
	return packs, err
}

func GetUserBoosterPacksByUserId(userId int) ([]*UserBoosterPack, error) {
	var packs []*UserBoosterPack
	err := DB.Where("user_id = ?", userId).Order("id desc").Find(&packs).Error
	return packs, err
}

func GetUserBoosterPackById(id int) (*UserBoosterPack, error) {
	if id == 0 {
		return nil, errors.New("id is empty")
	}
	var pack UserBoosterPack
	err := DB.First(&pack, "id = ?", id).Error
	return &pack, err
}

func CreateUserBoosterPack(ubp *UserBoosterPack) error {
	ubp.CreatedTime = helper.GetTimestamp()
	ubp.UpdatedTime = helper.GetTimestamp()
	return DB.Create(ubp).Error
}

func DecrementBoosterPackCount(id int) error {
	now := helper.GetTimestamp()
	// Single SQL: decrement count and set status to UsedUp when count reaches 0
	result := DB.Model(&UserBoosterPack{}).
		Where("id = ? AND status = ? AND remain_count > 0", id, UserBoosterPackStatusActive).
		Updates(map[string]interface{}{
			"remain_count": gorm.Expr("remain_count - 1"),
			"status":       gorm.Expr("CASE WHEN remain_count - 1 <= 0 THEN ? ELSE ? END", UserBoosterPackStatusUsedUp, UserBoosterPackStatusActive),
			"updated_time": now,
		})
	if result.Error != nil {
		logger.SysError(fmt.Sprintf("failed to decrement booster pack %d: %s", id, result.Error.Error()))
		return result.Error
	}
	if result.RowsAffected == 0 {
		return errors.New("booster pack not available or already used up")
	}
	return nil
}

func ExpireUserBoosterPack(id int) error {
	now := helper.GetTimestamp()
	return DB.Model(&UserBoosterPack{}).Where("id = ?", id).Updates(map[string]interface{}{
		"status":       UserBoosterPackStatusExpired,
		"updated_time": now,
	}).Error
}

// GetUserBoosterExtraCount returns the total remaining extra request count from active booster packs.
func GetUserBoosterExtraCount(userId int) (int, error) {
	packs, err := GetActiveUserBoosterPacks(userId)
	if err != nil {
		return 0, err
	}
	total := 0
	for _, p := range packs {
		total += p.RemainCount
	}
	return total, nil
}
