package model

import (
	"errors"

	"github.com/songquanpeng/one-api/common/helper"
)

const (
	ContactStatusUnread  = 1
	ContactStatusRead    = 2
	ContactStatusReplied = 3
)

type ContactMessage struct {
	Id          int    `json:"id" gorm:"primaryKey;autoIncrement"`
	Name        string `json:"name" gorm:"type:varchar(128);not null"`
	Email       string `json:"email" gorm:"type:varchar(256)"`
	Phone       string `json:"phone" gorm:"type:varchar(32)"`
	Message     string `json:"message" gorm:"type:text;not null"`
	Status      int    `json:"status" gorm:"default:1"`
	CreatedTime int64  `json:"created_time" gorm:"bigint"`
}

func CreateContactMessage(msg *ContactMessage) error {
	if msg.Name == "" {
		return errors.New("name is required")
	}
	if msg.Message == "" {
		return errors.New("message is required")
	}
	msg.Status = ContactStatusUnread
	msg.CreatedTime = helper.GetTimestamp()
	return DB.Create(msg).Error
}

func GetContactMessages(startIdx int, num int) ([]*ContactMessage, error) {
	var messages []*ContactMessage
	err := DB.Order("id desc").Limit(num).Offset(startIdx).Find(&messages).Error
	return messages, err
}

func GetContactMessageCount() (int64, error) {
	var count int64
	err := DB.Model(&ContactMessage{}).Count(&count).Error
	return count, err
}

func UpdateContactMessageStatus(id int, status int) error {
	if status < ContactStatusUnread || status > ContactStatusReplied {
		return errors.New("invalid status")
	}
	result := DB.Model(&ContactMessage{}).Where("id = ?", id).Update("status", status)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return errors.New("contact message not found")
	}
	return nil
}
