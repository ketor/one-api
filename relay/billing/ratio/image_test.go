package ratio

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

// ---------------------------------------------------------------------------
// ImageSizeRatios
// ---------------------------------------------------------------------------

func TestImageSizeRatios_DallE2(t *testing.T) {
	sizes, ok := ImageSizeRatios["dall-e-2"]
	assert.True(t, ok)
	assert.Equal(t, float64(1), sizes["256x256"])
	assert.Equal(t, 1.125, sizes["512x512"])
	assert.Equal(t, 1.25, sizes["1024x1024"])
	assert.Len(t, sizes, 3)
}

func TestImageSizeRatios_DallE3(t *testing.T) {
	sizes, ok := ImageSizeRatios["dall-e-3"]
	assert.True(t, ok)
	assert.Equal(t, float64(1), sizes["1024x1024"])
	assert.Equal(t, float64(2), sizes["1024x1792"])
	assert.Equal(t, float64(2), sizes["1792x1024"])
	assert.Len(t, sizes, 3)
}

func TestImageSizeRatios_AliModels(t *testing.T) {
	for _, model := range []string{"ali-stable-diffusion-xl", "ali-stable-diffusion-v1.5"} {
		t.Run(model, func(t *testing.T) {
			sizes, ok := ImageSizeRatios[model]
			assert.True(t, ok)
			// All Ali sizes have ratio 1
			for size, ratio := range sizes {
				assert.Equal(t, float64(1), ratio, "size %s should have ratio 1", size)
			}
		})
	}
}

func TestImageSizeRatios_WanxV1(t *testing.T) {
	sizes, ok := ImageSizeRatios["wanx-v1"]
	assert.True(t, ok)
	assert.Len(t, sizes, 3)
	assert.Equal(t, float64(1), sizes["1024x1024"])
	assert.Equal(t, float64(1), sizes["720x1280"])
	assert.Equal(t, float64(1), sizes["1280x720"])
}

func TestImageSizeRatios_Step1xMedium(t *testing.T) {
	sizes, ok := ImageSizeRatios["step-1x-medium"]
	assert.True(t, ok)
	assert.Len(t, sizes, 6)
	for _, size := range []string{"256x256", "512x512", "768x768", "1024x1024", "1280x800", "800x1280"} {
		assert.Equal(t, float64(1), sizes[size])
	}
}

// ---------------------------------------------------------------------------
// ImageGenerationAmounts
// ---------------------------------------------------------------------------

func TestImageGenerationAmounts(t *testing.T) {
	tests := []struct {
		model string
		min   int
		max   int
	}{
		{"dall-e-2", 1, 10},
		{"dall-e-3", 1, 1},
		{"ali-stable-diffusion-xl", 1, 4},
		{"ali-stable-diffusion-v1.5", 1, 4},
		{"wanx-v1", 1, 4},
		{"cogview-3", 1, 1},
		{"step-1x-medium", 1, 1},
	}
	for _, tt := range tests {
		t.Run(tt.model, func(t *testing.T) {
			amounts, ok := ImageGenerationAmounts[tt.model]
			assert.True(t, ok, "ImageGenerationAmounts should contain %s", tt.model)
			assert.Equal(t, tt.min, amounts[0], "min amount")
			assert.Equal(t, tt.max, amounts[1], "max amount")
		})
	}
}

// ---------------------------------------------------------------------------
// ImagePromptLengthLimitations
// ---------------------------------------------------------------------------

func TestImagePromptLengthLimitations(t *testing.T) {
	tests := []struct {
		model    string
		expected int
	}{
		{"dall-e-2", 1000},
		{"dall-e-3", 4000},
		{"ali-stable-diffusion-xl", 4000},
		{"ali-stable-diffusion-v1.5", 4000},
		{"wanx-v1", 4000},
		{"cogview-3", 833},
		{"step-1x-medium", 4000},
	}
	for _, tt := range tests {
		t.Run(tt.model, func(t *testing.T) {
			limit, ok := ImagePromptLengthLimitations[tt.model]
			assert.True(t, ok, "ImagePromptLengthLimitations should contain %s", tt.model)
			assert.Equal(t, tt.expected, limit)
		})
	}
}

// ---------------------------------------------------------------------------
// ImageOriginModelName
// ---------------------------------------------------------------------------

func TestImageOriginModelName(t *testing.T) {
	assert.Equal(t, "stable-diffusion-xl", ImageOriginModelName["ali-stable-diffusion-xl"])
	assert.Equal(t, "stable-diffusion-v1.5", ImageOriginModelName["ali-stable-diffusion-v1.5"])
	assert.Len(t, ImageOriginModelName, 2)
}
