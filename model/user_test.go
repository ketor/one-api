package model

import (
	"testing"

	"github.com/songquanpeng/one-api/common"
	"github.com/stretchr/testify/assert"
)

func createTestUser(t *testing.T, username string, role int, status int) *User {
	t.Helper()
	hashedPw, err := common.Password2Hash("testpassword")
	assert.NoError(t, err)
	user := &User{
		Username:    username,
		Password:    hashedPw,
		DisplayName: username + "_display",
		Email:       username + "@test.com",
		Role:        role,
		Status:      status,
		Quota:       1000,
		UsedQuota:   200,
		AccessToken: username + "_access_token",
		AffCode:     username,
	}
	err = DB.Create(user).Error
	assert.NoError(t, err)
	assert.NotZero(t, user.Id)
	return user
}

func TestUserRoleConstants(t *testing.T) {
	assert.Equal(t, 0, RoleGuestUser)
	assert.Equal(t, 1, RoleCommonUser)
	assert.Equal(t, 10, RoleAdminUser)
	assert.Equal(t, 100, RoleRootUser)
}

func TestUserStatusConstants(t *testing.T) {
	assert.Equal(t, 1, UserStatusEnabled)
	assert.Equal(t, 2, UserStatusDisabled)
	assert.Equal(t, 3, UserStatusDeleted)
}

func TestGetUserById_SelectAll(t *testing.T) {
	cleanTable(&User{}, &Token{}, &Subscription{}, &Plan{})
	user := createTestUser(t, "getbyid_all", RoleCommonUser, UserStatusEnabled)

	got, err := GetUserById(user.Id, true)
	assert.NoError(t, err)
	assert.Equal(t, user.Id, got.Id)
	assert.Equal(t, "getbyid_all", got.Username)
	assert.NotEmpty(t, got.Password, "selectAll=true should include password")
	assert.NotEmpty(t, got.AccessToken, "selectAll=true should include access_token")
}

func TestGetUserById_SelectLimited(t *testing.T) {
	cleanTable(&User{}, &Token{}, &Subscription{}, &Plan{})
	user := createTestUser(t, "getbyid_lim", RoleCommonUser, UserStatusEnabled)

	got, err := GetUserById(user.Id, false)
	assert.NoError(t, err)
	assert.Equal(t, user.Id, got.Id)
	assert.Equal(t, "getbyid_lim", got.Username)
	assert.Empty(t, got.Password, "selectAll=false should omit password")
	assert.Empty(t, got.AccessToken, "selectAll=false should omit access_token")
}

func TestGetUserById_ZeroId(t *testing.T) {
	_, err := GetUserById(0, true)
	assert.Error(t, err)
}

func TestGetAllUsers_Pagination(t *testing.T) {
	cleanTable(&User{}, &Token{}, &Subscription{}, &Plan{})
	for i := 0; i < 5; i++ {
		createTestUser(t, "allusers"+string(rune('a'+i)), RoleCommonUser, UserStatusEnabled)
	}

	users, err := GetAllUsers(0, 3, "")
	assert.NoError(t, err)
	assert.Len(t, users, 3)

	users2, err := GetAllUsers(3, 3, "")
	assert.NoError(t, err)
	assert.Len(t, users2, 2)
}

func TestGetAllUsers_ExcludesDeleted(t *testing.T) {
	cleanTable(&User{}, &Token{}, &Subscription{}, &Plan{})
	createTestUser(t, "active_u", RoleCommonUser, UserStatusEnabled)
	createTestUser(t, "deleted_u", RoleCommonUser, UserStatusDeleted)

	users, err := GetAllUsers(0, 10, "")
	assert.NoError(t, err)
	assert.Len(t, users, 1)
	assert.Equal(t, "active_u", users[0].Username)
}

func TestGetAllUsers_OrderByQuota(t *testing.T) {
	cleanTable(&User{}, &Token{}, &Subscription{}, &Plan{})
	u1 := createTestUser(t, "quota_lo", RoleCommonUser, UserStatusEnabled)
	DB.Model(&User{}).Where("id = ?", u1.Id).Update("quota", 100)
	u2 := createTestUser(t, "quota_hi", RoleCommonUser, UserStatusEnabled)
	DB.Model(&User{}).Where("id = ?", u2.Id).Update("quota", 9999)

	users, err := GetAllUsers(0, 10, "quota")
	assert.NoError(t, err)
	assert.GreaterOrEqual(t, len(users), 2)
	assert.Equal(t, "quota_hi", users[0].Username)
}

func TestGetAllUsers_OrderByUsedQuota(t *testing.T) {
	cleanTable(&User{}, &Token{}, &Subscription{}, &Plan{})
	u1 := createTestUser(t, "uq_lo", RoleCommonUser, UserStatusEnabled)
	DB.Model(u1).Update("used_quota", 10)
	u2 := createTestUser(t, "uq_hi", RoleCommonUser, UserStatusEnabled)
	DB.Model(u2).Update("used_quota", 5000)

	users, err := GetAllUsers(0, 10, "used_quota")
	assert.NoError(t, err)
	assert.Equal(t, "uq_hi", users[0].Username)
}

func TestGetAllUsers_OrderByRequestCount(t *testing.T) {
	cleanTable(&User{}, &Token{}, &Subscription{}, &Plan{})
	u1 := createTestUser(t, "rc_lo", RoleCommonUser, UserStatusEnabled)
	DB.Model(u1).Update("request_count", 1)
	u2 := createTestUser(t, "rc_hi", RoleCommonUser, UserStatusEnabled)
	DB.Model(u2).Update("request_count", 999)

	users, err := GetAllUsers(0, 10, "request_count")
	assert.NoError(t, err)
	assert.Equal(t, "rc_hi", users[0].Username)
}

func TestSearchUsers_ByUsername(t *testing.T) {
	cleanTable(&User{}, &Token{}, &Subscription{}, &Plan{})
	createTestUser(t, "searchme1", RoleCommonUser, UserStatusEnabled)
	createTestUser(t, "searchme2", RoleCommonUser, UserStatusEnabled)
	createTestUser(t, "other_usr", RoleCommonUser, UserStatusEnabled)

	users, err := SearchUsers("searchme")
	assert.NoError(t, err)
	assert.Len(t, users, 2)
}

func TestIsUsernameAlreadyTaken(t *testing.T) {
	cleanTable(&User{}, &Token{}, &Subscription{}, &Plan{})
	createTestUser(t, "taken_usr", RoleCommonUser, UserStatusEnabled)

	assert.True(t, IsUsernameAlreadyTaken("taken_usr"))
	assert.False(t, IsUsernameAlreadyTaken("not_taken"))
}

func TestIsEmailAlreadyTaken(t *testing.T) {
	cleanTable(&User{}, &Token{}, &Subscription{}, &Plan{})
	createTestUser(t, "emailuser", RoleCommonUser, UserStatusEnabled)

	assert.True(t, IsEmailAlreadyTaken("emailuser@test.com"))
	assert.False(t, IsEmailAlreadyTaken("noone@test.com"))
}

func TestValidateAccessToken_Valid(t *testing.T) {
	cleanTable(&User{}, &Token{}, &Subscription{}, &Plan{})
	user := createTestUser(t, "vat_user", RoleCommonUser, UserStatusEnabled)

	got := ValidateAccessToken(user.AccessToken)
	assert.NotNil(t, got)
	assert.Equal(t, user.Id, got.Id)
}

func TestValidateAccessToken_WithBearerPrefix(t *testing.T) {
	cleanTable(&User{}, &Token{}, &Subscription{}, &Plan{})
	user := createTestUser(t, "bearer_u", RoleCommonUser, UserStatusEnabled)

	got := ValidateAccessToken("Bearer " + user.AccessToken)
	assert.NotNil(t, got)
	assert.Equal(t, user.Id, got.Id)
}

func TestValidateAccessToken_Invalid(t *testing.T) {
	cleanTable(&User{}, &Token{}, &Subscription{}, &Plan{})

	assert.Nil(t, ValidateAccessToken("nonexistent_token"))
	assert.Nil(t, ValidateAccessToken(""))
}

func TestIsAdmin(t *testing.T) {
	cleanTable(&User{}, &Token{}, &Subscription{}, &Plan{})
	admin := createTestUser(t, "admin_usr", RoleAdminUser, UserStatusEnabled)
	root := createTestUser(t, "root_usr", RoleRootUser, UserStatusEnabled)
	common_user := createTestUser(t, "common_us", RoleCommonUser, UserStatusEnabled)

	assert.True(t, IsAdmin(admin.Id))
	assert.True(t, IsAdmin(root.Id))
	assert.False(t, IsAdmin(common_user.Id))
	assert.False(t, IsAdmin(0))
}

func TestIsUserEnabled(t *testing.T) {
	cleanTable(&User{}, &Token{}, &Subscription{}, &Plan{})
	enabled := createTestUser(t, "enabled_u", RoleCommonUser, UserStatusEnabled)
	disabled := createTestUser(t, "disabled_", RoleCommonUser, UserStatusDisabled)

	ok, err := IsUserEnabled(enabled.Id)
	assert.NoError(t, err)
	assert.True(t, ok)

	ok, err = IsUserEnabled(disabled.Id)
	assert.NoError(t, err)
	assert.False(t, ok)

	_, err = IsUserEnabled(0)
	assert.Error(t, err)
}

func TestGetUserQuota(t *testing.T) {
	cleanTable(&User{}, &Token{}, &Subscription{}, &Plan{})
	user := createTestUser(t, "quota_usr", RoleCommonUser, UserStatusEnabled)

	quota, err := GetUserQuota(user.Id)
	assert.NoError(t, err)
	assert.Equal(t, int64(1000), quota)
}

func TestGetUserUsedQuota(t *testing.T) {
	cleanTable(&User{}, &Token{}, &Subscription{}, &Plan{})
	user := createTestUser(t, "uquota_us", RoleCommonUser, UserStatusEnabled)

	used, err := GetUserUsedQuota(user.Id)
	assert.NoError(t, err)
	assert.Equal(t, int64(200), used)
}

func TestIncreaseUserQuota(t *testing.T) {
	cleanTable(&User{}, &Token{}, &Subscription{}, &Plan{})
	user := createTestUser(t, "incq_user", RoleCommonUser, UserStatusEnabled)

	err := increaseUserQuota(user.Id, 500)
	assert.NoError(t, err)

	quota, err := GetUserQuota(user.Id)
	assert.NoError(t, err)
	assert.Equal(t, int64(1500), quota)
}

func TestDecreaseUserQuota(t *testing.T) {
	cleanTable(&User{}, &Token{}, &Subscription{}, &Plan{})
	user := createTestUser(t, "decq_user", RoleCommonUser, UserStatusEnabled)

	err := decreaseUserQuota(user.Id, 300)
	assert.NoError(t, err)

	quota, err := GetUserQuota(user.Id)
	assert.NoError(t, err)
	assert.Equal(t, int64(700), quota)
}

func TestUserDelete(t *testing.T) {
	cleanTable(&User{}, &Token{}, &Subscription{}, &Plan{})
	user := createTestUser(t, "del_user1", RoleCommonUser, UserStatusEnabled)

	err := user.Delete()
	assert.NoError(t, err)

	got, err := GetUserById(user.Id, true)
	assert.NoError(t, err)
	assert.Equal(t, UserStatusDeleted, got.Status)
	assert.Contains(t, got.Username, "deleted_")
}

func TestUserDelete_ZeroId(t *testing.T) {
	user := &User{Id: 0}
	err := user.Delete()
	assert.Error(t, err)
}

func TestDeleteUserById(t *testing.T) {
	cleanTable(&User{}, &Token{}, &Subscription{}, &Plan{})
	user := createTestUser(t, "delubyid1", RoleCommonUser, UserStatusEnabled)

	err := DeleteUserById(user.Id)
	assert.NoError(t, err)

	got, err := GetUserById(user.Id, true)
	assert.NoError(t, err)
	assert.Equal(t, UserStatusDeleted, got.Status)
}

func TestDeleteUserById_ZeroId(t *testing.T) {
	err := DeleteUserById(0)
	assert.Error(t, err)
}

func TestGetUsernameById(t *testing.T) {
	cleanTable(&User{}, &Token{}, &Subscription{}, &Plan{})
	user := createTestUser(t, "getname_u", RoleCommonUser, UserStatusEnabled)

	name := GetUsernameById(user.Id)
	assert.Equal(t, "getname_u", name)
}

func TestGetUsernameById_NotFound(t *testing.T) {
	cleanTable(&User{}, &Token{}, &Subscription{}, &Plan{})
	name := GetUsernameById(99999)
	assert.Empty(t, name)
}

func TestGetRootUserEmail(t *testing.T) {
	cleanTable(&User{}, &Token{}, &Subscription{}, &Plan{})
	createTestUser(t, "root_emai", RoleRootUser, UserStatusEnabled)

	email := GetRootUserEmail()
	assert.Equal(t, "root_emai@test.com", email)
}

func TestGetRootUserEmail_NoRoot(t *testing.T) {
	cleanTable(&User{}, &Token{}, &Subscription{}, &Plan{})
	createTestUser(t, "common_em", RoleCommonUser, UserStatusEnabled)

	email := GetRootUserEmail()
	assert.Empty(t, email)
}
