package payment

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestRegisterAndGet(t *testing.T) {
	// Clean up providers for this test
	mu.Lock()
	oldProviders := providers
	providers = make(map[string]Provider)
	mu.Unlock()
	defer func() {
		mu.Lock()
		providers = oldProviders
		mu.Unlock()
	}()

	mock := NewMockProvider()
	Register(mock)

	p, err := Get("mock")
	assert.NoError(t, err)
	assert.Equal(t, "mock", p.Name())
}

func TestGet_NotFound(t *testing.T) {
	mu.Lock()
	oldProviders := providers
	providers = make(map[string]Provider)
	mu.Unlock()
	defer func() {
		mu.Lock()
		providers = oldProviders
		mu.Unlock()
	}()

	_, err := Get("nonexistent")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "not found")
}

func TestGetAll(t *testing.T) {
	mu.Lock()
	oldProviders := providers
	providers = make(map[string]Provider)
	mu.Unlock()
	defer func() {
		mu.Lock()
		providers = oldProviders
		mu.Unlock()
	}()

	Register(NewMockProvider())

	names := GetAll()
	assert.Len(t, names, 1)
	assert.Contains(t, names, "mock")
}

func TestGetAll_Empty(t *testing.T) {
	mu.Lock()
	oldProviders := providers
	providers = make(map[string]Provider)
	mu.Unlock()
	defer func() {
		mu.Lock()
		providers = oldProviders
		mu.Unlock()
	}()

	names := GetAll()
	assert.Empty(t, names)
}
