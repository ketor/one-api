package model

import (
	"os"
	"testing"

	"github.com/songquanpeng/one-api/common"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func TestMain(m *testing.M) {
	setupTestDB()
	code := m.Run()
	os.Exit(code)
}

func setupTestDB() {
	// Disable Redis to prevent nil pointer dereference in cache invalidation calls
	common.RedisEnabled = false

	var err error
	DB, err = gorm.Open(sqlite.Open("file::memory:?cache=shared"), &gorm.Config{})
	if err != nil {
		panic("failed to connect test database: " + err.Error())
	}
	// Run migrations for all models needed in tests
	err = DB.AutoMigrate(&User{}, &Token{}, &Channel{}, &Plan{}, &Subscription{},
		&Order{}, &BoosterPack{}, &UserBoosterPack{}, &UsageWindow{},
		&Option{}, &Redemption{}, &Ability{}, &Log{}, &ContactMessage{})
	if err != nil {
		panic("failed to migrate test database: " + err.Error())
	}
}

// cleanTable truncates a table between tests
func cleanTable(tables ...interface{}) {
	for _, table := range tables {
		DB.Session(&gorm.Session{AllowGlobalUpdate: true}).Delete(table)
	}
}
