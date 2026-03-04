package helper

import (
	"unicode"
)

const PasswordMinLength = 8

// ValidatePassword checks that a password meets minimum security requirements:
// - At least 8 characters
// - Contains at least one letter
// - Contains at least one digit
func ValidatePassword(password string) (bool, string) {
	if len(password) < PasswordMinLength {
		return false, "密码长度至少为8位"
	}
	hasLetter := false
	hasDigit := false
	for _, ch := range password {
		if unicode.IsLetter(ch) {
			hasLetter = true
		}
		if unicode.IsDigit(ch) {
			hasDigit = true
		}
	}
	if !hasLetter {
		return false, "密码必须包含至少一个字母"
	}
	if !hasDigit {
		return false, "密码必须包含至少一个数字"
	}
	return true, ""
}
