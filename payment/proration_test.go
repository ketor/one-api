package payment

import "testing"

func TestCalculateUpgradeAmount_NormalUpgrade(t *testing.T) {
	// 30-day period, used 15 days, upgrading from ¥99 to ¥299
	periodStart := int64(0)
	periodEnd := int64(30 * 24 * 3600)
	now := int64(15 * 24 * 3600) // halfway through

	amount, credit, err := CalculateUpgradeAmount(9900, 29900, periodStart, periodEnd, now)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// credit = 9900 * 15days / 30days = 4950
	if credit != 4950 {
		t.Errorf("expected credit 4950, got %d", credit)
	}

	// newCost = 29900 * 15days / 30days = 14950
	// amount = 14950 - 4950 = 10000
	if amount != 10000 {
		t.Errorf("expected amount 10000, got %d", amount)
	}
}

func TestCalculateUpgradeAmount_FreeToStar(t *testing.T) {
	// Free plan (0) to Star (9900), 15 days remaining
	periodStart := int64(0)
	periodEnd := int64(30 * 24 * 3600)
	now := int64(15 * 24 * 3600)

	amount, credit, err := CalculateUpgradeAmount(0, 9900, periodStart, periodEnd, now)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if credit != 0 {
		t.Errorf("expected credit 0, got %d", credit)
	}

	// newCost = 9900 * 15/30 = 4950
	if amount != 4950 {
		t.Errorf("expected amount 4950, got %d", amount)
	}
}

func TestCalculateUpgradeAmount_StartOfPeriod(t *testing.T) {
	// At the very start of period
	periodStart := int64(1000)
	periodEnd := int64(1000 + 30*24*3600)
	now := int64(1000) // period just started

	amount, credit, err := CalculateUpgradeAmount(9900, 29900, periodStart, periodEnd, now)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// Full period remaining: credit = 9900, newCost = 29900
	if credit != 9900 {
		t.Errorf("expected credit 9900, got %d", credit)
	}
	if amount != 20000 {
		t.Errorf("expected amount 20000, got %d", amount)
	}
}

func TestCalculateUpgradeAmount_EndOfPeriod(t *testing.T) {
	// Near end of period (1 second remaining)
	periodStart := int64(0)
	periodEnd := int64(30 * 24 * 3600)
	now := periodEnd - 1

	amount, _, err := CalculateUpgradeAmount(9900, 29900, periodStart, periodEnd, now)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// Almost no time remaining, amounts should be near zero
	if amount > 10 {
		t.Errorf("expected near-zero amount, got %d", amount)
	}
}

func TestCalculateUpgradeAmount_PastEnd(t *testing.T) {
	// Past the period end
	periodStart := int64(0)
	periodEnd := int64(30 * 24 * 3600)
	now := periodEnd + 100

	amount, credit, err := CalculateUpgradeAmount(9900, 29900, periodStart, periodEnd, now)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// No remaining time, both should be 0
	if amount != 0 {
		t.Errorf("expected amount 0, got %d", amount)
	}
	if credit != 0 {
		t.Errorf("expected credit 0, got %d", credit)
	}
}

func TestCalculateUpgradeAmount_SamePrice(t *testing.T) {
	periodStart := int64(0)
	periodEnd := int64(30 * 24 * 3600)
	now := int64(15 * 24 * 3600)

	amount, credit, err := CalculateUpgradeAmount(9900, 9900, periodStart, periodEnd, now)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if amount != 0 {
		t.Errorf("expected amount 0, got %d", amount)
	}
	if credit != 4950 {
		t.Errorf("expected credit 4950, got %d", credit)
	}
}

func TestCalculateUpgradeAmount_Downgrade(t *testing.T) {
	// Downgrade: new plan cheaper than current
	periodStart := int64(0)
	periodEnd := int64(30 * 24 * 3600)
	now := int64(15 * 24 * 3600)

	amount, _, err := CalculateUpgradeAmount(29900, 9900, periodStart, periodEnd, now)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// Downgrade returns 0 (no charge, no refund cash)
	if amount != 0 {
		t.Errorf("expected amount 0 for downgrade, got %d", amount)
	}
}

func TestCalculateUpgradeAmount_InvalidPeriod(t *testing.T) {
	_, _, err := CalculateUpgradeAmount(9900, 29900, 100, 50, 75)
	if err == nil {
		t.Error("expected error for invalid period")
	}
}

func TestCalculateUpgradeAmount_BeforePeriodStart(t *testing.T) {
	_, _, err := CalculateUpgradeAmount(9900, 29900, 100, 200, 50)
	if err == nil {
		t.Error("expected error for time before period start")
	}
}
