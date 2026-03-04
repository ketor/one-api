package payment

import (
	"crypto/aes"
	"crypto/cipher"
)

// newAESCipher wraps aes.NewCipher for testability
func newAESCipher(key []byte) (cipher.Block, error) {
	return aes.NewCipher(key)
}

// newGCM wraps cipher.NewGCM for testability
func newGCM(block cipher.Block) (cipher.AEAD, error) {
	return cipher.NewGCM(block)
}
