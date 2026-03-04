package cron

import (
	"os"
	"testing"

	"github.com/songquanpeng/one-api/common"
	"github.com/songquanpeng/one-api/model"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func TestMain(m *testing.M) {
	common.RedisEnabled = false

	db, err := gorm.Open(sqlite.Open("file::memory:?cache=shared"), &gorm.Config{})
	if err != nil {
		panic("failed to connect test database: " + err.Error())
	}
	err = db.AutoMigrate(&model.User{}, &model.Plan{}, &model.Subscription{},
		&model.Order{}, &model.ContactMessage{})
	if err != nil {
		panic("failed to migrate test database: " + err.Error())
	}
	model.DB = db

	code := m.Run()
	os.Exit(code)
}

// cleanTable truncates tables between tests
func cleanTable(tables ...interface{}) {
	for _, table := range tables {
		model.DB.Session(&gorm.Session{AllowGlobalUpdate: true}).Delete(table)
	}
}
