package model

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestPlan_Insert(t *testing.T) {
	cleanTable(&Plan{})

	p := &Plan{
		Name:              "test-plan",
		DisplayName:       "Test Plan",
		Description:       "A test plan",
		PriceCentsMonthly: 1000,
		GroupName:         "default",
		Priority:          1,
		Status:            PlanStatusEnabled,
	}
	err := p.Insert()
	assert.NoError(t, err)
	assert.NotZero(t, p.Id)
	assert.NotZero(t, p.CreatedTime)
	assert.NotZero(t, p.UpdatedTime)
}

func TestPlan_Update(t *testing.T) {
	cleanTable(&Plan{})

	p := &Plan{
		Name:              "update-plan",
		DisplayName:       "Before Update",
		PriceCentsMonthly: 500,
		Status:            PlanStatusEnabled,
	}
	err := p.Insert()
	assert.NoError(t, err)

	originalUpdatedTime := p.UpdatedTime
	p.DisplayName = "After Update"
	p.PriceCentsMonthly = 999
	err = p.Update()
	assert.NoError(t, err)

	fetched, err := GetPlanById(p.Id)
	assert.NoError(t, err)
	assert.Equal(t, "After Update", fetched.DisplayName)
	assert.Equal(t, int64(999), fetched.PriceCentsMonthly)
	assert.GreaterOrEqual(t, fetched.UpdatedTime, originalUpdatedTime)
}

func TestPlan_Delete(t *testing.T) {
	cleanTable(&Plan{})

	p := &Plan{
		Name:   "delete-plan",
		Status: PlanStatusEnabled,
	}
	err := p.Insert()
	assert.NoError(t, err)

	err = p.Delete()
	assert.NoError(t, err)

	_, err = GetPlanById(p.Id)
	assert.Error(t, err)
}

func TestGetPlanById(t *testing.T) {
	cleanTable(&Plan{})

	p := &Plan{
		Name:        "byid-plan",
		DisplayName: "By ID",
		Status:      PlanStatusEnabled,
	}
	err := p.Insert()
	assert.NoError(t, err)

	fetched, err := GetPlanById(p.Id)
	assert.NoError(t, err)
	assert.Equal(t, p.Name, fetched.Name)
	assert.Equal(t, p.DisplayName, fetched.DisplayName)
}

func TestGetPlanByName(t *testing.T) {
	cleanTable(&Plan{})

	p := &Plan{
		Name:        "byname-plan",
		DisplayName: "By Name",
		Status:      PlanStatusEnabled,
	}
	err := p.Insert()
	assert.NoError(t, err)

	fetched, err := GetPlanByName("byname-plan")
	assert.NoError(t, err)
	assert.Equal(t, p.Id, fetched.Id)
	assert.Equal(t, "By Name", fetched.DisplayName)

	// Non-existent name
	_, err = GetPlanByName("nonexistent")
	assert.Error(t, err)
}

func TestGetAllPlans(t *testing.T) {
	cleanTable(&Plan{})

	plans := []*Plan{
		{Name: "plan-c", Priority: 2, Status: PlanStatusEnabled},
		{Name: "plan-a", Priority: 0, Status: PlanStatusEnabled},
		{Name: "plan-b", Priority: 1, Status: PlanStatusDisabled},
	}
	for _, p := range plans {
		assert.NoError(t, p.Insert())
	}

	all, err := GetAllPlans()
	assert.NoError(t, err)
	assert.Len(t, all, 3)
	// Should be ordered by priority asc
	assert.Equal(t, "plan-a", all[0].Name)
	assert.Equal(t, "plan-b", all[1].Name)
	assert.Equal(t, "plan-c", all[2].Name)
}

func TestGetEnabledPlans(t *testing.T) {
	cleanTable(&Plan{})

	plans := []*Plan{
		{Name: "enabled-1", Priority: 1, Status: PlanStatusEnabled},
		{Name: "disabled-1", Priority: 0, Status: PlanStatusDisabled},
		{Name: "enabled-2", Priority: 2, Status: PlanStatusEnabled},
	}
	for _, p := range plans {
		assert.NoError(t, p.Insert())
	}

	enabled, err := GetEnabledPlans()
	assert.NoError(t, err)
	assert.Len(t, enabled, 2)
	// Ordered by priority asc
	assert.Equal(t, "enabled-1", enabled[0].Name)
	assert.Equal(t, "enabled-2", enabled[1].Name)
}

func TestInitDefaultPlans(t *testing.T) {
	cleanTable(&Plan{})

	// First call should create 4 default plans
	InitDefaultPlans()

	all, err := GetAllPlans()
	assert.NoError(t, err)
	assert.Len(t, all, 4)

	expectedNames := map[string]bool{"glow": false, "star": false, "solar": false, "galaxy": false}
	for _, p := range all {
		if _, ok := expectedNames[p.Name]; ok {
			expectedNames[p.Name] = true
		}
		assert.NotZero(t, p.CreatedTime)
		assert.NotZero(t, p.UpdatedTime)
		assert.Equal(t, PlanStatusEnabled, p.Status)
	}
	for name, found := range expectedNames {
		assert.True(t, found, "default plan %s should exist", name)
	}

	// Second call should not create more plans
	InitDefaultPlans()
	all2, err := GetAllPlans()
	assert.NoError(t, err)
	assert.Len(t, all2, 4)
}

func TestInitDefaultPlans_NewFields(t *testing.T) {
	cleanTable(&Plan{})

	InitDefaultPlans()

	// Verify solar is featured
	solar, err := GetPlanByName("solar")
	assert.NoError(t, err)
	assert.True(t, solar.IsFeatured)
	assert.False(t, solar.IsContactSales)
	assert.Equal(t, "立即升级", solar.CtaText)
	assert.NotEmpty(t, solar.Features)
	assert.NotEmpty(t, solar.Tagline)

	// Verify galaxy is contact-sales
	galaxy, err := GetPlanByName("galaxy")
	assert.NoError(t, err)
	assert.True(t, galaxy.IsContactSales)
	assert.False(t, galaxy.IsFeatured)
	assert.Equal(t, "联系销售", galaxy.CtaText)

	// Verify glow is free
	glow, err := GetPlanByName("glow")
	assert.NoError(t, err)
	assert.Equal(t, int64(0), glow.PriceCentsMonthly)
	assert.Equal(t, "免费注册", glow.CtaText)
	assert.False(t, glow.IsFeatured)
	assert.False(t, glow.IsContactSales)

	// Verify star
	star, err := GetPlanByName("star")
	assert.NoError(t, err)
	assert.Equal(t, int64(9900), star.PriceCentsMonthly)
}

func TestPlan_UniqueNameConstraint(t *testing.T) {
	cleanTable(&Plan{})

	p1 := &Plan{Name: "unique-plan", Status: PlanStatusEnabled}
	err := p1.Insert()
	assert.NoError(t, err)

	p2 := &Plan{Name: "unique-plan", Status: PlanStatusEnabled}
	err = p2.Insert()
	assert.Error(t, err, "duplicate plan name should fail")
}
