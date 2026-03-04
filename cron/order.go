package cron

import (
	"fmt"

	"github.com/songquanpeng/one-api/common/helper"
	"github.com/songquanpeng/one-api/common/logger"
	"github.com/songquanpeng/one-api/model"
)

// CleanupPendingOrders cancels orders that have been pending for more than 30 minutes.
func CleanupPendingOrders() {
	expireThreshold := helper.GetTimestamp() - 30*60
	var orders []model.Order
	err := model.DB.Where("status = ? AND created_time < ?",
		model.OrderStatusPending, expireThreshold).Find(&orders).Error
	if err != nil {
		logger.SysError("cron: failed to query pending orders: " + err.Error())
		return
	}
	for _, order := range orders {
		if err := model.UpdateOrderStatus(order.Id, model.OrderStatusCancelled); err != nil {
			logger.SysError(fmt.Sprintf("cron: failed to cancel order %d: %s", order.Id, err.Error()))
		} else {
			logger.SysLog(fmt.Sprintf("cron: cancelled timed-out order %s", order.OrderNo))
		}
	}
}
