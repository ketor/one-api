package model

import (
	"testing"

	"github.com/songquanpeng/one-api/common/helper"
	"github.com/stretchr/testify/assert"
)

func createTestToken(t *testing.T, userId int, name string, remainQuota int64) *Token {
	t.Helper()
	token := &Token{
		UserId:       userId,
		Key:          "sk-test-" + name,
		Status:       TokenStatusEnabled,
		Name:         name,
		CreatedTime:  helper.GetTimestamp(),
		AccessedTime: helper.GetTimestamp(),
		ExpiredTime:  -1,
		RemainQuota:  remainQuota,
		UsedQuota:    0,
	}
	err := DB.Create(token).Error
	assert.NoError(t, err)
	assert.NotZero(t, token.Id)
	return token
}

func TestTokenStatusConstants(t *testing.T) {
	assert.Equal(t, 1, TokenStatusEnabled)
	assert.Equal(t, 2, TokenStatusDisabled)
	assert.Equal(t, 3, TokenStatusExpired)
	assert.Equal(t, 4, TokenStatusExhausted)
}

func TestTokenInsert(t *testing.T) {
	cleanTable(&Token{}, &User{})
	token := &Token{
		UserId:      1,
		Key:         "sk-insert-test",
		Status:      TokenStatusEnabled,
		Name:        "insert_test",
		CreatedTime: helper.GetTimestamp(),
		ExpiredTime: -1,
		RemainQuota: 500,
	}
	err := token.Insert()
	assert.NoError(t, err)
	assert.NotZero(t, token.Id)

	got, err := GetTokenById(token.Id)
	assert.NoError(t, err)
	assert.Equal(t, "insert_test", got.Name)
	assert.Equal(t, int64(500), got.RemainQuota)
}

func TestTokenUpdate(t *testing.T) {
	cleanTable(&Token{}, &User{})
	token := createTestToken(t, 1, "update_tok", 1000)

	token.Name = "updated_name"
	token.Status = TokenStatusDisabled
	token.RemainQuota = 2000
	err := token.Update()
	assert.NoError(t, err)

	got, err := GetTokenById(token.Id)
	assert.NoError(t, err)
	assert.Equal(t, "updated_name", got.Name)
	assert.Equal(t, TokenStatusDisabled, got.Status)
	assert.Equal(t, int64(2000), got.RemainQuota)
}

func TestTokenDelete(t *testing.T) {
	cleanTable(&Token{}, &User{})
	token := createTestToken(t, 1, "delete_tok", 100)
	tokenId := token.Id

	err := token.Delete()
	assert.NoError(t, err)

	_, err = GetTokenById(tokenId)
	assert.Error(t, err)
}

func TestGetAllUserTokens_Pagination(t *testing.T) {
	cleanTable(&Token{}, &User{})
	userId := 42
	for i := 0; i < 5; i++ {
		createTestToken(t, userId, "pag_tok_"+string(rune('a'+i)), int64(i*100))
	}
	// Another user's token should not appear
	createTestToken(t, 99, "other_tok", 500)

	tokens, err := GetAllUserTokens(userId, 0, 3, "")
	assert.NoError(t, err)
	assert.Len(t, tokens, 3)

	tokens2, err := GetAllUserTokens(userId, 3, 3, "")
	assert.NoError(t, err)
	assert.Len(t, tokens2, 2)
}

func TestGetAllUserTokens_DefaultOrderById(t *testing.T) {
	cleanTable(&Token{}, &User{})
	userId := 10
	t1 := createTestToken(t, userId, "first_tok", 100)
	t2 := createTestToken(t, userId, "second_to", 200)

	tokens, err := GetAllUserTokens(userId, 0, 10, "")
	assert.NoError(t, err)
	assert.Len(t, tokens, 2)
	// Default order is id desc
	assert.Equal(t, t2.Id, tokens[0].Id)
	assert.Equal(t, t1.Id, tokens[1].Id)
}

func TestGetAllUserTokens_OrderByRemainQuota(t *testing.T) {
	cleanTable(&Token{}, &User{})
	userId := 11
	createTestToken(t, userId, "low_quota", 100)
	hi := createTestToken(t, userId, "hi_quota_", 9999)

	tokens, err := GetAllUserTokens(userId, 0, 10, "remain_quota")
	assert.NoError(t, err)
	assert.Equal(t, hi.Id, tokens[0].Id)
}

func TestGetAllUserTokens_OrderByUsedQuota(t *testing.T) {
	cleanTable(&Token{}, &User{})
	userId := 12
	t1 := createTestToken(t, userId, "used_lo", 100)
	DB.Model(t1).Update("used_quota", 10)
	t2 := createTestToken(t, userId, "used_hi", 100)
	DB.Model(t2).Update("used_quota", 5000)

	tokens, err := GetAllUserTokens(userId, 0, 10, "used_quota")
	assert.NoError(t, err)
	assert.Equal(t, t2.Id, tokens[0].Id)
}

func TestSearchUserTokens(t *testing.T) {
	cleanTable(&Token{}, &User{})
	userId := 20
	createTestToken(t, userId, "search_aa", 100)
	createTestToken(t, userId, "search_bb", 200)
	createTestToken(t, userId, "other_cc_", 300)

	tokens, err := SearchUserTokens(userId, "search")
	assert.NoError(t, err)
	assert.Len(t, tokens, 2)
}

func TestSearchUserTokens_OtherUser(t *testing.T) {
	cleanTable(&Token{}, &User{})
	createTestToken(t, 20, "match_tok", 100)

	tokens, err := SearchUserTokens(99, "match")
	assert.NoError(t, err)
	assert.Len(t, tokens, 0)
}

func TestGetTokenById(t *testing.T) {
	cleanTable(&Token{}, &User{})
	token := createTestToken(t, 1, "getbyid_t", 500)

	got, err := GetTokenById(token.Id)
	assert.NoError(t, err)
	assert.Equal(t, token.Id, got.Id)
	assert.Equal(t, "getbyid_t", got.Name)
}

func TestGetTokenById_ZeroId(t *testing.T) {
	_, err := GetTokenById(0)
	assert.Error(t, err)
}

func TestGetTokenByIds(t *testing.T) {
	cleanTable(&Token{}, &User{})
	token := createTestToken(t, 5, "byids_tok", 100)

	got, err := GetTokenByIds(token.Id, 5)
	assert.NoError(t, err)
	assert.Equal(t, token.Id, got.Id)
	assert.Equal(t, 5, got.UserId)
}

func TestGetTokenByIds_WrongUser(t *testing.T) {
	cleanTable(&Token{}, &User{})
	token := createTestToken(t, 5, "wronguser", 100)

	_, err := GetTokenByIds(token.Id, 999)
	assert.Error(t, err)
}

func TestGetTokenByIds_ZeroId(t *testing.T) {
	_, err := GetTokenByIds(0, 1)
	assert.Error(t, err)
}

func TestGetTokenByIds_ZeroUserId(t *testing.T) {
	_, err := GetTokenByIds(1, 0)
	assert.Error(t, err)
}

func TestDeleteTokenById(t *testing.T) {
	cleanTable(&Token{}, &User{})
	token := createTestToken(t, 7, "deltokbyi", 100)

	err := DeleteTokenById(token.Id, 7)
	assert.NoError(t, err)

	_, err = GetTokenById(token.Id)
	assert.Error(t, err)
}

func TestDeleteTokenById_WrongUser(t *testing.T) {
	cleanTable(&Token{}, &User{})
	token := createTestToken(t, 7, "deltokwu_", 100)

	err := DeleteTokenById(token.Id, 999)
	assert.Error(t, err)

	// Token should still exist
	got, err := GetTokenById(token.Id)
	assert.NoError(t, err)
	assert.Equal(t, token.Id, got.Id)
}

func TestDeleteTokenById_ZeroValues(t *testing.T) {
	err := DeleteTokenById(0, 1)
	assert.Error(t, err)

	err = DeleteTokenById(1, 0)
	assert.Error(t, err)
}

func TestIncreaseTokenQuota(t *testing.T) {
	cleanTable(&Token{}, &User{})
	token := createTestToken(t, 1, "incq_tok_", 1000)
	DB.Model(token).Update("used_quota", 500)

	err := increaseTokenQuota(token.Id, 200)
	assert.NoError(t, err)

	got, err := GetTokenById(token.Id)
	assert.NoError(t, err)
	assert.Equal(t, int64(1200), got.RemainQuota)
	assert.Equal(t, int64(300), got.UsedQuota)
}

func TestDecreaseTokenQuota(t *testing.T) {
	cleanTable(&Token{}, &User{})
	token := createTestToken(t, 1, "decq_tok_", 1000)

	err := decreaseTokenQuota(token.Id, 300)
	assert.NoError(t, err)

	got, err := GetTokenById(token.Id)
	assert.NoError(t, err)
	assert.Equal(t, int64(700), got.RemainQuota)
	assert.Equal(t, int64(300), got.UsedQuota)
}

func TestTokenGetModels_Nil(t *testing.T) {
	token := &Token{Models: nil}
	assert.Equal(t, "", token.GetModels())
}

func TestTokenGetModels_NilReceiver(t *testing.T) {
	var token *Token
	assert.Equal(t, "", token.GetModels())
}

func TestTokenGetModels_WithValue(t *testing.T) {
	models := "gpt-4,gpt-3.5-turbo"
	token := &Token{Models: &models}
	assert.Equal(t, "gpt-4,gpt-3.5-turbo", token.GetModels())
}
