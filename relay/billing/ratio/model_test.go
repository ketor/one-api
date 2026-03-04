package ratio

import (
	"encoding/json"
	"testing"

	"github.com/stretchr/testify/assert"
)

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

func TestConstants(t *testing.T) {
	assert.Equal(t, float64(500), float64(USD), "USD should be 500")
	// RMB = USD / USD2RMB uses integer division: 500 / 7 = 71
	assert.Equal(t, float64(71), float64(RMB), "RMB should be USD/USD2RMB (integer division: 500/7=71)")
	assert.InDelta(t, 1.0/1000*float64(USD), MILLI_USD, 1e-9, "MILLI_USD should be USD/1000")
}

// ---------------------------------------------------------------------------
// ModelRatio map – spot-check key models
// ---------------------------------------------------------------------------

func TestModelRatio_KeyModels(t *testing.T) {
	tests := []struct {
		model    string
		expected float64
	}{
		{"gpt-4", 15},
		{"gpt-4-32k", 30},
		{"gpt-4o", 2.5},
		{"gpt-4o-mini", 0.075},
		{"gpt-3.5-turbo", 0.25},
		{"gpt-3.5-turbo-16k", 1.5},
		{"o1", 7.5},
		{"o1-mini", 1.5},
		{"o3-mini", 1.5},
		{"dall-e-2", 0.02 * USD},
		{"dall-e-3", 0.04 * USD},
	}
	for _, tt := range tests {
		t.Run(tt.model, func(t *testing.T) {
			ratio, ok := ModelRatio[tt.model]
			assert.True(t, ok, "ModelRatio should contain %s", tt.model)
			assert.InDelta(t, tt.expected, ratio, 1e-9)
		})
	}
}

func TestModelRatio_ClaudeModels(t *testing.T) {
	tests := []struct {
		model    string
		expected float64
	}{
		{"claude-3-opus-20240229", 15.0 / 1000 * USD},
		{"claude-3-5-sonnet-20241022", 3.0 / 1000 * USD},
		{"claude-3-haiku-20240307", 0.25 / 1000 * USD},
		{"claude-3-5-haiku-20241022", 1.0 / 1000 * USD},
		{"claude-instant-1.2", 0.8 / 1000 * USD},
		{"claude-2.0", 8.0 / 1000 * USD},
	}
	for _, tt := range tests {
		t.Run(tt.model, func(t *testing.T) {
			ratio, ok := ModelRatio[tt.model]
			assert.True(t, ok, "ModelRatio should contain %s", tt.model)
			assert.InDelta(t, tt.expected, ratio, 1e-9)
		})
	}
}

func TestModelRatio_GeminiModels(t *testing.T) {
	tests := []struct {
		model    string
		expected float64
	}{
		{"gemini-pro", 0.25 * MILLI_USD},
		{"gemini-1.5-pro", 1.25 * MILLI_USD},
		{"gemini-1.5-flash", 0.075 * MILLI_USD},
		{"gemini-2.0-flash", 0.15 * MILLI_USD},
	}
	for _, tt := range tests {
		t.Run(tt.model, func(t *testing.T) {
			ratio, ok := ModelRatio[tt.model]
			assert.True(t, ok, "ModelRatio should contain %s", tt.model)
			assert.InDelta(t, tt.expected, ratio, 1e-9)
		})
	}
}

func TestModelRatio_DeepseekModels(t *testing.T) {
	tests := []struct {
		model    string
		expected float64
	}{
		{"deepseek-chat", 0.14 * MILLI_USD},
		{"deepseek-reasoner", 0.55 * MILLI_USD},
	}
	for _, tt := range tests {
		t.Run(tt.model, func(t *testing.T) {
			ratio, ok := ModelRatio[tt.model]
			assert.True(t, ok, "ModelRatio should contain %s", tt.model)
			assert.InDelta(t, tt.expected, ratio, 1e-9)
		})
	}
}

// ---------------------------------------------------------------------------
// GetModelRatio
// ---------------------------------------------------------------------------

func TestGetModelRatio_KnownModels(t *testing.T) {
	tests := []struct {
		model       string
		channelType int
		expected    float64
	}{
		{"gpt-4", 0, 15},
		{"gpt-4o", 0, 2.5},
		{"gpt-3.5-turbo", 0, 0.25},
		{"gpt-4o-mini", 0, 0.075},
	}
	for _, tt := range tests {
		t.Run(tt.model, func(t *testing.T) {
			ratio := GetModelRatio(tt.model, tt.channelType)
			assert.InDelta(t, tt.expected, ratio, 1e-9)
		})
	}
}

func TestGetModelRatio_UnknownModel(t *testing.T) {
	// Unknown models should return the default of 30
	ratio := GetModelRatio("totally-unknown-model-xyz", 0)
	assert.Equal(t, float64(30), ratio)
}

func TestGetModelRatio_ChannelSpecificLookup(t *testing.T) {
	// llama3-8b-8192 with channel type 33 has a channel-specific entry
	ratio := GetModelRatio("llama3-8b-8192", 33)
	expected := 0.0003 / 0.002
	assert.InDelta(t, expected, ratio, 1e-9)
}

func TestGetModelRatio_QwenInternetSuffix(t *testing.T) {
	// qwen models with -internet suffix should strip it
	ratioBase := GetModelRatio("qwen-turbo", 0)
	ratioInternet := GetModelRatio("qwen-turbo-internet", 0)
	assert.InDelta(t, ratioBase, ratioInternet, 1e-9)
}

func TestGetModelRatio_CommandInternetSuffix(t *testing.T) {
	ratioBase := GetModelRatio("command-r", 0)
	ratioInternet := GetModelRatio("command-r-internet", 0)
	assert.InDelta(t, ratioBase, ratioInternet, 1e-9)
}

// ---------------------------------------------------------------------------
// CompletionRatio map – spot-check
// ---------------------------------------------------------------------------

func TestCompletionRatio_MapEntries(t *testing.T) {
	tests := []struct {
		model    string
		expected float64
	}{
		{"whisper-1", 0},
		{"deepseek-chat", 0.28 / 0.14},
		{"deepseek-reasoner", 2.19 / 0.55},
		{"llama3-8b-8192(33)", 0.0006 / 0.0003},
		{"llama3-70b-8192(33)", 0.0035 / 0.00265},
	}
	for _, tt := range tests {
		t.Run(tt.model, func(t *testing.T) {
			ratio, ok := CompletionRatio[tt.model]
			assert.True(t, ok, "CompletionRatio should contain %s", tt.model)
			assert.InDelta(t, tt.expected, ratio, 1e-9)
		})
	}
}

// ---------------------------------------------------------------------------
// GetCompletionRatio
// ---------------------------------------------------------------------------

func TestGetCompletionRatio_GPT35Family(t *testing.T) {
	tests := []struct {
		model    string
		expected float64
	}{
		{"gpt-3.5-turbo", 3},
		{"gpt-3.5-turbo-0125", 3},
		{"gpt-3.5-turbo-1106", 2},
		{"gpt-3.5-turbo-0613", 4.0 / 3.0},
		{"gpt-3.5-turbo-16k", 4.0 / 3.0},
	}
	for _, tt := range tests {
		t.Run(tt.model, func(t *testing.T) {
			ratio := GetCompletionRatio(tt.model, 0)
			assert.InDelta(t, tt.expected, ratio, 1e-9)
		})
	}
}

func TestGetCompletionRatio_GPT4Family(t *testing.T) {
	tests := []struct {
		model    string
		expected float64
	}{
		{"gpt-4", 2},
		{"gpt-4-0613", 2},
		{"gpt-4-32k", 2},
		{"gpt-4-turbo", 3},
		{"gpt-4-turbo-2024-04-09", 3},
		{"gpt-4-1106-preview", 3},
		{"gpt-4o", 4},
		{"gpt-4o-2024-08-06", 4},
		{"gpt-4o-2024-05-13", 3},
		{"gpt-4o-mini", 4},
	}
	for _, tt := range tests {
		t.Run(tt.model, func(t *testing.T) {
			ratio := GetCompletionRatio(tt.model, 0)
			assert.InDelta(t, tt.expected, ratio, 1e-9)
		})
	}
}

func TestGetCompletionRatio_O1Family(t *testing.T) {
	tests := []struct {
		model    string
		expected float64
	}{
		{"o1", 4},
		{"o1-preview", 4},
		{"o1-mini", 4},
	}
	for _, tt := range tests {
		t.Run(tt.model, func(t *testing.T) {
			ratio := GetCompletionRatio(tt.model, 0)
			assert.InDelta(t, tt.expected, ratio, 1e-9)
		})
	}
}

func TestGetCompletionRatio_ClaudeFamily(t *testing.T) {
	// claude-3 prefix -> 5
	assert.InDelta(t, float64(5), GetCompletionRatio("claude-3-opus-20240229", 0), 1e-9)
	assert.InDelta(t, float64(5), GetCompletionRatio("claude-3-5-sonnet-20241022", 0), 1e-9)
	// claude- prefix (non claude-3) -> 3
	assert.InDelta(t, float64(3), GetCompletionRatio("claude-instant-1.2", 0), 1e-9)
	assert.InDelta(t, float64(3), GetCompletionRatio("claude-2.0", 0), 1e-9)
}

func TestGetCompletionRatio_OtherProviders(t *testing.T) {
	tests := []struct {
		model    string
		expected float64
	}{
		{"chatgpt-4o-latest", 3},
		{"mistral-large-latest", 3},
		{"gemini-1.5-pro", 3},
		{"deepseek-v3", 2},
		{"command-r", 3},
		{"command-r-plus", 5},
		{"command", 2},
		{"grok-beta", 3},
	}
	for _, tt := range tests {
		t.Run(tt.model, func(t *testing.T) {
			ratio := GetCompletionRatio(tt.model, 0)
			assert.InDelta(t, tt.expected, ratio, 1e-9)
		})
	}
}

func TestGetCompletionRatio_MapOverridesDefaults(t *testing.T) {
	// deepseek-chat has an explicit entry in CompletionRatio map
	ratio := GetCompletionRatio("deepseek-chat", 0)
	assert.InDelta(t, 0.28/0.14, ratio, 1e-9)
}

func TestGetCompletionRatio_ChannelSpecific(t *testing.T) {
	// llama3-8b-8192 with channel type 33 has a channel-specific completion ratio
	ratio := GetCompletionRatio("llama3-8b-8192", 33)
	assert.InDelta(t, 0.0006/0.0003, ratio, 1e-9)
}

func TestGetCompletionRatio_DefaultFallback(t *testing.T) {
	// Unknown model with no prefix match returns 1
	ratio := GetCompletionRatio("totally-unknown-model-xyz", 0)
	assert.Equal(t, float64(1), ratio)
}

func TestGetCompletionRatio_QwenInternetSuffix(t *testing.T) {
	// qwen models with -internet suffix should strip it before lookup
	ratio := GetCompletionRatio("qwen-turbo-internet", 0)
	// qwen-turbo has no explicit completion ratio entry and no prefix match -> 1
	assert.Equal(t, float64(1), ratio)
}

// ---------------------------------------------------------------------------
// DefaultModelRatio / DefaultCompletionRatio init copies
// ---------------------------------------------------------------------------

func TestDefaultModelRatio_CopiedFromModelRatio(t *testing.T) {
	// DefaultModelRatio should be a copy made at init time
	assert.NotNil(t, DefaultModelRatio)
	assert.Contains(t, DefaultModelRatio, "gpt-4")
	assert.InDelta(t, float64(15), DefaultModelRatio["gpt-4"], 1e-9)
}

func TestDefaultCompletionRatio_CopiedFromCompletionRatio(t *testing.T) {
	assert.NotNil(t, DefaultCompletionRatio)
	assert.Contains(t, DefaultCompletionRatio, "whisper-1")
	assert.InDelta(t, float64(0), DefaultCompletionRatio["whisper-1"], 1e-9)
}

// ---------------------------------------------------------------------------
// JSON serialization round-trip helpers
// ---------------------------------------------------------------------------

func TestModelRatio2JSONString(t *testing.T) {
	jsonStr := ModelRatio2JSONString()
	assert.NotEmpty(t, jsonStr)

	var parsed map[string]float64
	err := json.Unmarshal([]byte(jsonStr), &parsed)
	assert.NoError(t, err)
	assert.InDelta(t, float64(15), parsed["gpt-4"], 1e-9)
}

func TestCompletionRatio2JSONString(t *testing.T) {
	jsonStr := CompletionRatio2JSONString()
	assert.NotEmpty(t, jsonStr)

	var parsed map[string]float64
	err := json.Unmarshal([]byte(jsonStr), &parsed)
	assert.NoError(t, err)
	assert.Contains(t, parsed, "whisper-1")
}

func TestUpdateModelRatioByJSONString(t *testing.T) {
	// Save original state
	original := ModelRatio2JSONString()
	defer func() {
		_ = UpdateModelRatioByJSONString(original)
	}()

	newRatios := `{"test-model": 42.0}`
	err := UpdateModelRatioByJSONString(newRatios)
	assert.NoError(t, err)

	ratio := GetModelRatio("test-model", 0)
	assert.InDelta(t, 42.0, ratio, 1e-9)
}

func TestUpdateCompletionRatioByJSONString(t *testing.T) {
	original := CompletionRatio2JSONString()
	defer func() {
		_ = UpdateCompletionRatioByJSONString(original)
	}()

	newRatios := `{"test-model": 5.0}`
	err := UpdateCompletionRatioByJSONString(newRatios)
	assert.NoError(t, err)

	ratio, ok := CompletionRatio["test-model"]
	assert.True(t, ok)
	assert.InDelta(t, 5.0, ratio, 1e-9)
}

func TestAddNewMissingRatio(t *testing.T) {
	// Start with a partial ratio map
	partial := `{"gpt-4": 99.0}`
	result := AddNewMissingRatio(partial)

	var parsed map[string]float64
	err := json.Unmarshal([]byte(result), &parsed)
	assert.NoError(t, err)

	// The user-provided value should be preserved
	assert.InDelta(t, 99.0, parsed["gpt-4"], 1e-9)
	// Missing models from DefaultModelRatio should be added
	assert.Contains(t, parsed, "gpt-3.5-turbo")
}

func TestAddNewMissingRatio_InvalidJSON(t *testing.T) {
	// Invalid JSON should return the original string
	invalid := `{not json}`
	result := AddNewMissingRatio(invalid)
	assert.Equal(t, invalid, result)
}

// ---------------------------------------------------------------------------
// Replicate models in ModelRatio
// ---------------------------------------------------------------------------

func TestModelRatio_ReplicateImageModels(t *testing.T) {
	tests := []struct {
		model    string
		expected float64
	}{
		{"black-forest-labs/flux-schnell", 0.003 * USD},
		{"black-forest-labs/flux-dev", 0.025 * USD},
		{"black-forest-labs/flux-pro", 0.055 * USD},
		{"black-forest-labs/flux-1.1-pro", 0.04 * USD},
	}
	for _, tt := range tests {
		t.Run(tt.model, func(t *testing.T) {
			ratio, ok := ModelRatio[tt.model]
			assert.True(t, ok, "ModelRatio should contain %s", tt.model)
			assert.InDelta(t, tt.expected, ratio, 1e-9)
		})
	}
}
