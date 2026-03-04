package model

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestCreateContactMessage(t *testing.T) {
	cleanTable(&ContactMessage{})

	msg := &ContactMessage{
		Name:    "张三",
		Email:   "zhangsan@example.com",
		Phone:   "13800138000",
		Message: "我想了解企业版",
	}
	err := CreateContactMessage(msg)
	assert.NoError(t, err)
	assert.NotZero(t, msg.Id)
	assert.Equal(t, ContactStatusUnread, msg.Status)
	assert.NotZero(t, msg.CreatedTime)
}

func TestCreateContactMessage_EmptyName(t *testing.T) {
	err := CreateContactMessage(&ContactMessage{
		Name:    "",
		Message: "test",
	})
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "name is required")
}

func TestCreateContactMessage_EmptyMessage(t *testing.T) {
	err := CreateContactMessage(&ContactMessage{
		Name:    "test",
		Message: "",
	})
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "message is required")
}

func TestGetContactMessages_Pagination(t *testing.T) {
	cleanTable(&ContactMessage{})

	for i := 0; i < 5; i++ {
		err := CreateContactMessage(&ContactMessage{
			Name:    "user",
			Message: "msg",
		})
		assert.NoError(t, err)
	}

	// First page
	msgs, err := GetContactMessages(0, 3)
	assert.NoError(t, err)
	assert.Len(t, msgs, 3)

	// Second page
	msgs, err = GetContactMessages(3, 3)
	assert.NoError(t, err)
	assert.Len(t, msgs, 2)

	// Order is by id desc
	allMsgs, _ := GetContactMessages(0, 10)
	assert.Greater(t, allMsgs[0].Id, allMsgs[1].Id)
}

func TestGetContactMessageCount(t *testing.T) {
	cleanTable(&ContactMessage{})

	count, err := GetContactMessageCount()
	assert.NoError(t, err)
	assert.Equal(t, int64(0), count)

	CreateContactMessage(&ContactMessage{Name: "a", Message: "b"})
	CreateContactMessage(&ContactMessage{Name: "c", Message: "d"})

	count, err = GetContactMessageCount()
	assert.NoError(t, err)
	assert.Equal(t, int64(2), count)
}

func TestUpdateContactMessageStatus(t *testing.T) {
	cleanTable(&ContactMessage{})

	msg := &ContactMessage{Name: "test", Message: "test"}
	CreateContactMessage(msg)

	err := UpdateContactMessageStatus(msg.Id, ContactStatusRead)
	assert.NoError(t, err)

	err = UpdateContactMessageStatus(msg.Id, ContactStatusReplied)
	assert.NoError(t, err)
}

func TestUpdateContactMessageStatus_InvalidStatus(t *testing.T) {
	cleanTable(&ContactMessage{})

	msg := &ContactMessage{Name: "test", Message: "test"}
	CreateContactMessage(msg)

	err := UpdateContactMessageStatus(msg.Id, 0)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "invalid status")

	err = UpdateContactMessageStatus(msg.Id, 4)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "invalid status")
}

func TestUpdateContactMessageStatus_NotFound(t *testing.T) {
	cleanTable(&ContactMessage{})

	err := UpdateContactMessageStatus(99999, ContactStatusRead)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "not found")
}
