package controller

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/songquanpeng/one-api/common/ctxkey"
	"github.com/songquanpeng/one-api/common/helper"
	"github.com/songquanpeng/one-api/common/logger"
	"github.com/songquanpeng/one-api/model"
	"github.com/songquanpeng/one-api/payment"
)

// --- Request types ---

type createPaymentRequest struct {
	OrderNo       string `json:"order_no"`
	PaymentMethod string `json:"payment_method"` // "wechat", "alipay", "mock"
}

// --- Public API: Create Payment (authenticated) ---

// CreatePaymentOrder 为已有订单发起支付
// POST /api/payment/create
func CreatePaymentOrder(c *gin.Context) {
	userId := c.GetInt(ctxkey.Id)
	var req createPaymentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": "参数错误: " + err.Error()})
		return
	}

	if req.OrderNo == "" {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": "订单号不能为空"})
		return
	}
	if req.PaymentMethod == "" {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": "请选择支付方式"})
		return
	}

	// Validate order
	order, err := model.GetOrderByOrderNo(req.OrderNo)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": "订单不存在"})
		return
	}
	if order.UserId != userId {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": "无权操作此订单"})
		return
	}
	if order.Status != model.OrderStatusPending {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": "订单状态不允许支付"})
		return
	}

	// Get payment provider
	provider, err := payment.Get(req.PaymentMethod)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": "不支持的支付方式: " + req.PaymentMethod})
		return
	}

	// Get plan name for subject
	subject := "Alaya Code 订阅"
	if order.PlanId > 0 {
		plan, err := model.GetPlanById(order.PlanId)
		if err == nil {
			subject = fmt.Sprintf("Alaya Code %s 套餐", plan.DisplayName)
		}
	}

	// Create payment
	payResp, err := provider.CreatePayment(context.Background(), &payment.CreatePaymentRequest{
		OrderNo:     order.OrderNo,
		AmountCents: order.AmountCents,
		Subject:     subject,
		ClientIP:    c.ClientIP(),
	})
	if err != nil {
		logger.SysError(fmt.Sprintf("create payment failed for order %s: %s", order.OrderNo, err.Error()))
		c.JSON(http.StatusOK, gin.H{"success": false, "message": "创建支付失败: " + err.Error()})
		return
	}

	// Update order payment method
	_ = model.UpdateOrderPayment(order.Id, req.PaymentMethod, "")

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data": gin.H{
			"order_no":    order.OrderNo,
			"code_url":    payResp.CodeURL,
			"expire_time": payResp.ExpireTime,
		},
	})
}

// GetPaymentStatus 查询支付状态（前端轮询用）
// GET /api/payment/status/:order_no
func GetPaymentStatus(c *gin.Context) {
	userId := c.GetInt(ctxkey.Id)
	orderNo := c.Param("order_no")

	order, err := model.GetOrderByOrderNo(orderNo)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": "订单不存在"})
		return
	}
	if order.UserId != userId {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": "无权查看此订单"})
		return
	}

	// Already paid
	if order.Status == model.OrderStatusPaid {
		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"data": gin.H{
				"paid":   true,
				"status": "paid",
			},
		})
		return
	}

	// If still pending and has a payment method, try querying the provider
	if order.Status == model.OrderStatusPending && order.PaymentMethod != "" && order.PaymentMethod != "admin" {
		provider, err := payment.Get(order.PaymentMethod)
		if err == nil {
			status, err := provider.QueryPayment(context.Background(), order.OrderNo)
			if err == nil && status.Status == "SUCCESS" {
				// Payment succeeded but callback hasn't arrived yet, process it
				handlePaymentSuccess(order, status.TradeNo)
				c.JSON(http.StatusOK, gin.H{
					"success": true,
					"data": gin.H{
						"paid":   true,
						"status": "paid",
					},
				})
				return
			}
		}
	}

	status := "pending"
	switch order.Status {
	case model.OrderStatusCancelled:
		status = "cancelled"
	case model.OrderStatusFailed:
		status = "failed"
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"paid":         false,
			"status":       status,
			"order_no":     order.OrderNo,
			"amount_cents": order.AmountCents,
		},
	})
}

// CancelPaymentOrder 取消未支付订单
// POST /api/payment/cancel/:order_no
func CancelPaymentOrder(c *gin.Context) {
	userId := c.GetInt(ctxkey.Id)
	orderNo := c.Param("order_no")

	order, err := model.GetOrderByOrderNo(orderNo)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": "订单不存在"})
		return
	}
	if order.UserId != userId {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": "无权操作此订单"})
		return
	}
	if order.Status != model.OrderStatusPending {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": "只能取消待支付订单"})
		return
	}

	// Try to close order on payment platform
	if order.PaymentMethod != "" && order.PaymentMethod != "admin" {
		provider, err := payment.Get(order.PaymentMethod)
		if err == nil {
			_ = provider.CloseOrder(context.Background(), order.OrderNo)
		}
	}

	if err := model.UpdateOrderStatus(order.Id, model.OrderStatusCancelled); err != nil {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": "取消订单失败: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "message": "订单已取消"})
}

// GetAvailableProviders 返回可用支付方式列表
// GET /api/payment/providers
func GetAvailableProviders(c *gin.Context) {
	providers := payment.GetAll()
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    providers,
	})
}

// --- Callback handlers (public, no auth) ---

// HandleWechatCallback 微信支付回调
// POST /api/payment/callback/wechat
func HandleWechatCallback(c *gin.Context) {
	provider, err := payment.Get("wechat")
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"code": "FAIL", "message": "wechat provider not registered"})
		return
	}

	body, err := io.ReadAll(c.Request.Body)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"code": "FAIL", "message": "read body failed"})
		return
	}

	headers := map[string]string{
		"Wechatpay-Timestamp": c.GetHeader("Wechatpay-Timestamp"),
		"Wechatpay-Nonce":     c.GetHeader("Wechatpay-Nonce"),
		"Wechatpay-Signature": c.GetHeader("Wechatpay-Signature"),
		"Wechatpay-Serial":    c.GetHeader("Wechatpay-Serial"),
	}

	result, err := provider.HandleCallback(context.Background(), body, headers)
	if err != nil {
		logger.SysError("wechat callback handle failed: " + err.Error())
		c.JSON(http.StatusOK, gin.H{"code": "FAIL", "message": err.Error()})
		return
	}

	if result.Success {
		order, err := model.GetOrderByOrderNo(result.OrderNo)
		if err != nil {
			logger.SysError("wechat callback: order not found: " + result.OrderNo)
			c.JSON(http.StatusOK, gin.H{"code": "FAIL", "message": "order not found"})
			return
		}
		handlePaymentSuccess(order, result.TradeNo)
	}

	// 微信要求返回成功响应
	c.JSON(http.StatusOK, gin.H{"code": "SUCCESS", "message": "OK"})
}

// HandleAlipayCallback 支付宝回调
// POST /api/payment/callback/alipay
func HandleAlipayCallback(c *gin.Context) {
	provider, err := payment.Get("alipay")
	if err != nil {
		c.String(http.StatusOK, "fail")
		return
	}

	body, err := io.ReadAll(c.Request.Body)
	if err != nil {
		c.String(http.StatusOK, "fail")
		return
	}

	headers := make(map[string]string)
	result, err := provider.HandleCallback(context.Background(), body, headers)
	if err != nil {
		logger.SysError("alipay callback handle failed: " + err.Error())
		c.String(http.StatusOK, "fail")
		return
	}

	if result.Success {
		order, err := model.GetOrderByOrderNo(result.OrderNo)
		if err != nil {
			logger.SysError("alipay callback: order not found: " + result.OrderNo)
			c.String(http.StatusOK, "fail")
			return
		}
		handlePaymentSuccess(order, result.TradeNo)
	}

	// 支付宝要求返回 "success" 字符串
	c.String(http.StatusOK, "success")
}

// MockPaymentConfirm Mock 支付确认（仅开发环境）
// POST /api/payment/mock/confirm
func MockPaymentConfirm(c *gin.Context) {
	cfg := payment.GetConfig()
	if !cfg.IsMockEnabled() {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": "mock payment is not enabled"})
		return
	}

	var req struct {
		OrderNo string `json:"order_no"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": "参数错误"})
		return
	}

	order, err := model.GetOrderByOrderNo(req.OrderNo)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": "订单不存在"})
		return
	}
	if order.Status != model.OrderStatusPending {
		c.JSON(http.StatusOK, gin.H{"success": false, "message": "订单状态不允许确认"})
		return
	}

	handlePaymentSuccess(order, "MOCK_"+order.OrderNo)

	c.JSON(http.StatusOK, gin.H{"success": true, "message": "mock payment confirmed"})
}

// --- Internal payment success handler ---

// handlePaymentSuccess 支付成功后的统一处理逻辑（幂等）
func handlePaymentSuccess(order *model.Order, tradeNo string) {
	// Idempotency: skip if already paid
	if order.Status == model.OrderStatusPaid {
		return
	}

	// Update order status to paid
	err := model.UpdateOrderStatus(order.Id, model.OrderStatusPaid)
	if err != nil {
		logger.SysError(fmt.Sprintf("handlePaymentSuccess: update order %d status failed: %s", order.Id, err.Error()))
		return
	}

	// Update payment trade no
	if tradeNo != "" {
		_ = model.UpdateOrderPayment(order.Id, order.PaymentMethod, tradeNo)
	}

	// Execute business logic based on order type
	switch order.Type {
	case model.OrderTypeNewSubscription:
		activateNewSubscription(order)
	case model.OrderTypeRenewal:
		processRenewal(order)
	case model.OrderTypeUpgrade:
		processUpgrade(order)
	case model.OrderTypeBoosterPack:
		// Booster pack activation handled elsewhere
		logger.SysLogf("booster pack order %s paid", order.OrderNo)
	default:
		logger.SysLogf("order %s paid, type %d, no auto processing", order.OrderNo, order.Type)
	}
}

// activateNewSubscription 激活新订阅
func activateNewSubscription(order *model.Order) {
	now := helper.GetTimestamp()
	periodEnd := now + 30*24*3600 // 30 days

	sub := &model.Subscription{
		UserId:             order.UserId,
		PlanId:             order.PlanId,
		Status:             model.SubscriptionStatusActive,
		CurrentPeriodStart: now,
		CurrentPeriodEnd:   periodEnd,
		AutoRenew:          true,
	}

	if err := model.CreateSubscription(sub); err != nil {
		logger.SysError(fmt.Sprintf("activateNewSubscription: create subscription failed for order %s: %s", order.OrderNo, err.Error()))
		return
	}

	model.UpdateUserGroupByPlan(order.UserId, order.PlanId)
	logger.SysLogf("subscription activated for user %d, plan %d, order %s", order.UserId, order.PlanId, order.OrderNo)
}

// processRenewal 处理续费
func processRenewal(order *model.Order) {
	sub, err := model.GetActiveSubscription(order.UserId)
	if err != nil {
		logger.SysError(fmt.Sprintf("processRenewal: no active subscription for user %d", order.UserId))
		return
	}

	now := helper.GetTimestamp()
	if sub.CurrentPeriodEnd > now {
		sub.CurrentPeriodEnd = sub.CurrentPeriodEnd + 30*24*3600
	} else {
		sub.CurrentPeriodStart = now
		sub.CurrentPeriodEnd = now + 30*24*3600
	}
	sub.AutoRenew = true
	sub.MonthlySpentCents = 0
	sub.UpdatedTime = helper.GetTimestamp()

	if err := model.UpdateSubscription(sub); err != nil {
		logger.SysError(fmt.Sprintf("processRenewal: update subscription failed: %s", err.Error()))
		return
	}

	logger.SysLogf("subscription renewed for user %d, order %s, new end: %s",
		order.UserId, order.OrderNo, time.Unix(sub.CurrentPeriodEnd, 0).Format("2006-01-02"))
}

// processUpgrade 处理升级
func processUpgrade(order *model.Order) {
	sub, err := model.GetActiveSubscription(order.UserId)
	if err != nil {
		logger.SysError(fmt.Sprintf("processUpgrade: no active subscription for user %d", order.UserId))
		return
	}

	// Update subscription plan
	sub.PlanId = order.PlanId
	sub.MonthlySpentCents = 0
	sub.UpdatedTime = helper.GetTimestamp()

	if err := model.UpdateSubscription(sub); err != nil {
		logger.SysError(fmt.Sprintf("processUpgrade: update subscription failed: %s", err.Error()))
		return
	}

	// Update user group
	model.UpdateUserGroupByPlan(order.UserId, order.PlanId)
	logger.SysLogf("subscription upgraded for user %d to plan %d, order %s", order.UserId, order.PlanId, order.OrderNo)
}
