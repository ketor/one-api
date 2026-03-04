package ratio

import (
	"encoding/json"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestGroupRatio_DefaultEntries(t *testing.T) {
	assert.Contains(t, GroupRatio, "default")
	assert.Contains(t, GroupRatio, "vip")
	assert.Contains(t, GroupRatio, "svip")

	assert.Equal(t, float64(1), GroupRatio["default"])
	assert.Equal(t, float64(1), GroupRatio["vip"])
	assert.Equal(t, float64(1), GroupRatio["svip"])
}

func TestGetGroupRatio_KnownGroup(t *testing.T) {
	ratio := GetGroupRatio("default")
	assert.Equal(t, float64(1), ratio)
}

func TestGetGroupRatio_UnknownGroup(t *testing.T) {
	// Unknown group should return 1 (default fallback)
	ratio := GetGroupRatio("nonexistent-group")
	assert.Equal(t, float64(1), ratio)
}

func TestGroupRatio2JSONString(t *testing.T) {
	jsonStr := GroupRatio2JSONString()
	assert.NotEmpty(t, jsonStr)

	var parsed map[string]float64
	err := json.Unmarshal([]byte(jsonStr), &parsed)
	assert.NoError(t, err)
	assert.Contains(t, parsed, "default")
	assert.Equal(t, float64(1), parsed["default"])
}

func TestUpdateGroupRatioByJSONString(t *testing.T) {
	// Save original state
	original := GroupRatio2JSONString()
	defer func() {
		_ = UpdateGroupRatioByJSONString(original)
	}()

	newRatios := `{"default": 1, "premium": 0.8}`
	err := UpdateGroupRatioByJSONString(newRatios)
	assert.NoError(t, err)

	ratio := GetGroupRatio("premium")
	assert.InDelta(t, 0.8, ratio, 1e-9)

	ratio = GetGroupRatio("default")
	assert.Equal(t, float64(1), ratio)
}

func TestUpdateGroupRatioByJSONString_InvalidJSON(t *testing.T) {
	original := GroupRatio2JSONString()
	defer func() {
		_ = UpdateGroupRatioByJSONString(original)
	}()

	err := UpdateGroupRatioByJSONString(`{invalid}`)
	assert.Error(t, err)
}
