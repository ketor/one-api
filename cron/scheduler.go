package cron

import (
	"github.com/robfig/cron/v3"
	"github.com/songquanpeng/one-api/common/logger"
)

var scheduler *cron.Cron

func InitScheduler() {
	scheduler = cron.New(cron.WithSeconds())

	// Every minute: check expired subscriptions
	scheduler.AddFunc("0 */1 * * * *", CheckExpiredSubscriptions)

	// Daily at 2:00 AM: process auto renewals
	scheduler.AddFunc("0 0 2 * * *", ProcessAutoRenewals)

	// Every 30 minutes: cleanup pending orders that have timed out
	scheduler.AddFunc("0 */30 * * * *", CleanupPendingOrders)

	// Daily at midnight: process pending downgrades
	scheduler.AddFunc("0 0 0 * * *", ProcessPendingDowngrades)

	// Monthly on the 1st at midnight: reset monthly spending
	scheduler.AddFunc("0 0 0 1 * *", ResetMonthlySpending)

	scheduler.Start()
	logger.SysLog("cron scheduler started")
}

func StopScheduler() {
	if scheduler != nil {
		scheduler.Stop()
	}
}
