package payment

import "errors"

// CalculateUpgradeAmount 计算升级需支付的差额（按秒比例）
// 返回 (需支付金额cents, 旧套餐剩余价值cents, error)
//
// 参考 Stripe Billing proration 模型：
// - 计算当前套餐剩余周期价值（credit）
// - 计算新套餐剩余周期费用
// - 差额 = 新套餐剩余 - 旧套餐剩余
func CalculateUpgradeAmount(
	currentPlanPriceCents int64, // 当前套餐月价（分）
	newPlanPriceCents int64, // 新套餐月价（分）
	periodStart int64, // 当前周期开始时间戳（秒）
	periodEnd int64, // 当前周期结束时间戳（秒）
	now int64, // 当前时间戳（秒）
) (amountCents int64, creditCents int64, err error) {
	if periodEnd <= periodStart {
		return 0, 0, errors.New("invalid period: end must be after start")
	}
	if now < periodStart {
		return 0, 0, errors.New("current time is before period start")
	}

	totalSeconds := periodEnd - periodStart
	usedSeconds := now - periodStart
	if usedSeconds < 0 {
		usedSeconds = 0
	}
	remainingSeconds := totalSeconds - usedSeconds
	if remainingSeconds < 0 {
		remainingSeconds = 0
	}

	// 当前套餐剩余价值 = 月价 × 剩余时间 / 总时间
	creditCents = currentPlanPriceCents * remainingSeconds / totalSeconds

	// 新套餐剩余周期费用 = 新月价 × 剩余时间 / 总时间
	newPeriodCost := newPlanPriceCents * remainingSeconds / totalSeconds

	// 用户需要支付的差额
	amountCents = newPeriodCost - creditCents
	if amountCents < 0 {
		// 降级场景：不退现金，下个周期生效
		amountCents = 0
	}

	return amountCents, creditCents, nil
}
