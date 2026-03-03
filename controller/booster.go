package controller

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/songquanpeng/one-api/common/ctxkey"
	"github.com/songquanpeng/one-api/common/helper"
	"github.com/songquanpeng/one-api/model"
)

func GetBoosterPacks(c *gin.Context) {
	packs, err := model.GetEnabledBoosterPacks()
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data":    packs,
	})
}

func GetBoosterPack(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "无效的加油包ID",
		})
		return
	}
	pack, err := model.GetBoosterPackById(id)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data":    pack,
	})
}

type purchaseBoosterRequest struct {
	BoosterPackId int `json:"booster_pack_id"`
}

func PurchaseBoosterPack(c *gin.Context) {
	userId := c.GetInt(ctxkey.Id)
	var req purchaseBoosterRequest
	err := c.ShouldBindJSON(&req)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	if req.BoosterPackId == 0 {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "加油包ID不能为空",
		})
		return
	}

	pack, err := model.GetBoosterPackById(req.BoosterPackId)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "加油包不存在",
		})
		return
	}
	if pack.Status != model.BoosterPackStatusEnabled {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "该加油包已停用",
		})
		return
	}

	// Create order
	order := &model.Order{
		UserId:        userId,
		BoosterPackId: pack.Id,
		Type:          model.OrderTypeBoosterPack,
		AmountCents:   pack.PriceCents,
		Status:        model.OrderStatusPending,
		PaymentMethod: "admin",
	}
	err = model.CreateOrder(order)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "创建订单失败: " + err.Error(),
		})
		return
	}

	// Direct activation (admin recharge mode)
	model.UpdateOrderStatus(order.Id, model.OrderStatusPaid)

	// Calculate expire time
	var expireTime int64
	if pack.ValidDurationSec > 0 {
		expireTime = helper.GetTimestamp() + pack.ValidDurationSec
	}

	// Create user booster pack
	ubp := &model.UserBoosterPack{
		UserId:        userId,
		BoosterPackId: pack.Id,
		OrderId:       order.Id,
		RemainCount:   pack.ExtraCount,
		Status:        model.UserBoosterPackStatusActive,
		ExpireTime:    expireTime,
	}
	err = model.CreateUserBoosterPack(ubp)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "创建加油包记录失败: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data": gin.H{
			"order":        order,
			"booster_pack": ubp,
		},
	})
}

func GetSelfBoosterPacks(c *gin.Context) {
	userId := c.GetInt(ctxkey.Id)
	packs, err := model.GetUserBoosterPacksByUserId(userId)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data":    packs,
	})
}

// Admin CRUD

func GetAllAdminBoosterPacks(c *gin.Context) {
	packs, err := model.GetAllBoosterPacks()
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data":    packs,
	})
}

func CreateBoosterPack(c *gin.Context) {
	pack := model.BoosterPack{}
	err := c.ShouldBindJSON(&pack)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	if pack.Name == "" {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "加油包名称不能为空",
		})
		return
	}
	cleanPack := model.BoosterPack{
		Name:             pack.Name,
		DisplayName:      pack.DisplayName,
		Description:      pack.Description,
		PriceCents:       pack.PriceCents,
		ExtraCount:       pack.ExtraCount,
		ValidDurationSec: pack.ValidDurationSec,
		AllowedModels:    pack.AllowedModels,
		Status:           pack.Status,
	}
	err = cleanPack.Insert()
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data":    cleanPack,
	})
}

func UpdateBoosterPack(c *gin.Context) {
	pack := model.BoosterPack{}
	err := c.ShouldBindJSON(&pack)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	if pack.Id == 0 {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "加油包ID不能为空",
		})
		return
	}
	cleanPack, err := model.GetBoosterPackById(pack.Id)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	cleanPack.Name = pack.Name
	cleanPack.DisplayName = pack.DisplayName
	cleanPack.Description = pack.Description
	cleanPack.PriceCents = pack.PriceCents
	cleanPack.ExtraCount = pack.ExtraCount
	cleanPack.ValidDurationSec = pack.ValidDurationSec
	cleanPack.AllowedModels = pack.AllowedModels
	cleanPack.Status = pack.Status

	err = cleanPack.Update()
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data":    cleanPack,
	})
}

func DeleteBoosterPack(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "无效的加油包ID",
		})
		return
	}
	pack, err := model.GetBoosterPackById(id)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	err = pack.Delete()
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
	})
}
