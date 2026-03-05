package model

import (
	"errors"
	"fmt"

	"github.com/songquanpeng/one-api/common/helper"
	"github.com/songquanpeng/one-api/common/random"
)

const (
	OrderTypeNewSubscription = 1
	OrderTypeRenewal         = 2
	OrderTypeUpgrade         = 3
	OrderTypeDowngrade       = 4
	OrderTypeBoosterPack     = 5
	OrderTypeAdminChange     = 6
)

const (
	OrderStatusPending   = 1
	OrderStatusPaid      = 2
	OrderStatusRefunded  = 3
	OrderStatusCancelled = 4
	OrderStatusFailed    = 5
)

type Order struct {
	Id             int    `json:"id" gorm:"primaryKey;autoIncrement"`
	OrderNo        string `json:"order_no" gorm:"type:varchar(64);uniqueIndex"`
	UserId         int    `json:"user_id" gorm:"index;not null"`
	PlanId         int    `json:"plan_id" gorm:"index"`
	BoosterPackId  int    `json:"booster_pack_id" gorm:"default:0"`
	Type           int    `json:"type" gorm:"default:1"`
	AmountCents    int64  `json:"amount_cents" gorm:"bigint"`
	Status         int    `json:"status" gorm:"default:1;index"`
	PaymentMethod  string `json:"payment_method" gorm:"type:varchar(32)"`
	PaymentTradeNo    string `json:"payment_trade_no" gorm:"type:varchar(128)"`
	RefundAmountCents int64  `json:"refund_amount_cents" gorm:"bigint;default:0"`
	ExpireTime        int64  `json:"expire_time" gorm:"bigint;default:0"`
	PaidTime          int64  `json:"paid_time" gorm:"bigint;default:0"`
	CreatedTime       int64  `json:"created_time" gorm:"bigint"`
	UpdatedTime       int64  `json:"updated_time" gorm:"bigint"`
}

func GenerateOrderNo() string {
	return fmt.Sprintf("ORD%s%s", helper.GetTimeString(), random.GetRandomString(4))
}

func CreateOrder(order *Order) error {
	if order.OrderNo == "" {
		order.OrderNo = GenerateOrderNo()
	}
	order.CreatedTime = helper.GetTimestamp()
	order.UpdatedTime = helper.GetTimestamp()
	return DB.Create(order).Error
}

func GetOrdersByUserId(userId int, startIdx int, num int) ([]*Order, error) {
	var orders []*Order
	err := DB.Where("user_id = ?", userId).Order("id desc").Limit(num).Offset(startIdx).Find(&orders).Error
	return orders, err
}

func GetOrderById(id int) (*Order, error) {
	if id == 0 {
		return nil, errors.New("id is empty")
	}
	var order Order
	err := DB.First(&order, "id = ?", id).Error
	return &order, err
}

func GetOrderByOrderNo(orderNo string) (*Order, error) {
	if orderNo == "" {
		return nil, errors.New("order no is empty")
	}
	var order Order
	err := DB.First(&order, "order_no = ?", orderNo).Error
	return &order, err
}

// validOrderTransitions defines allowed status transitions.
var validOrderTransitions = map[int][]int{
	OrderStatusPending:   {OrderStatusPaid, OrderStatusCancelled, OrderStatusFailed},
	OrderStatusPaid:      {OrderStatusRefunded},
	OrderStatusRefunded:  {},
	OrderStatusCancelled: {},
	OrderStatusFailed:    {},
}

func isValidOrderTransition(from, to int) bool {
	allowed, ok := validOrderTransitions[from]
	if !ok {
		return false
	}
	for _, s := range allowed {
		if s == to {
			return true
		}
	}
	return false
}

func UpdateOrderStatus(id int, newStatus int) error {
	// Build the list of allowed source statuses for this transition
	var allowedFromStatuses []int
	for fromStatus, toStatuses := range validOrderTransitions {
		for _, s := range toStatuses {
			if s == newStatus {
				allowedFromStatuses = append(allowedFromStatuses, fromStatus)
			}
		}
	}
	if len(allowedFromStatuses) == 0 {
		return fmt.Errorf("no valid transition to status %d", newStatus)
	}

	now := helper.GetTimestamp()
	updates := map[string]interface{}{
		"status":       newStatus,
		"updated_time": now,
	}
	if newStatus == OrderStatusPaid {
		updates["paid_time"] = now
	}
	// Atomic check-and-update: only update if current status allows this transition
	result := DB.Model(&Order{}).Where("id = ? AND status IN ?", id, allowedFromStatuses).Updates(updates)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return fmt.Errorf("order %d status transition to %d failed: current status does not allow this transition", id, newStatus)
	}
	return nil
}

func UpdateOrderPayment(id int, paymentMethod string, paymentTradeNo string) error {
	return DB.Model(&Order{}).Where("id = ?", id).Updates(map[string]interface{}{
		"payment_method":   paymentMethod,
		"payment_trade_no": paymentTradeNo,
		"updated_time":     helper.GetTimestamp(),
	}).Error
}

// GetAllOrders returns paginated orders for admin listing.
func GetAllOrders(startIdx int, num int) ([]*Order, error) {
	var orders []*Order
	err := DB.Order("id desc").Limit(num).Offset(startIdx).Find(&orders).Error
	return orders, err
}
