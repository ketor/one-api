package helper

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestValidatePassword_Valid(t *testing.T) {
	tests := []string{
		"abcdef12",     // exactly 8 chars
		"Password1",    // mixed case
		"a1bcdefgh",    // letter at start, digit in middle
		"12345678a",    // digit heavy with one letter
		"abcdefg1234",  // longer password
	}
	for _, pw := range tests {
		ok, msg := ValidatePassword(pw)
		assert.True(t, ok, "password %q should be valid, got: %s", pw, msg)
		assert.Empty(t, msg)
	}
}

func TestValidatePassword_TooShort(t *testing.T) {
	ok, msg := ValidatePassword("abc123")
	assert.False(t, ok)
	assert.Contains(t, msg, "8")

	ok, msg = ValidatePassword("")
	assert.False(t, ok)
	assert.Contains(t, msg, "8")

	ok, msg = ValidatePassword("abcdef7")
	assert.False(t, ok) // 7 chars
}

func TestValidatePassword_NoDigit(t *testing.T) {
	ok, msg := ValidatePassword("abcdefgh")
	assert.False(t, ok)
	assert.Contains(t, msg, "数字")
}

func TestValidatePassword_NoLetter(t *testing.T) {
	ok, msg := ValidatePassword("12345678")
	assert.False(t, ok)
	assert.Contains(t, msg, "字母")
}
