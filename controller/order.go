package controller

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/songquanpeng/one-api/common/config"
	"github.com/songquanpeng/one-api/common/ctxkey"
	"github.com/songquanpeng/one-api/model"
)

func GetSelfOrders(c *gin.Context) {
	userId := c.GetInt(ctxkey.Id)
	p, _ := strconv.Atoi(c.Query("p"))
	if p < 0 {
		p = 0
	}
	orders, err := model.GetOrdersByUserId(userId, p*config.ItemsPerPage, config.ItemsPerPage)
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
		"data":    orders,
	})
}

func GetSelfOrder(c *gin.Context) {
	userId := c.GetInt(ctxkey.Id)
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "无效的订单ID",
		})
		return
	}
	order, err := model.GetOrderById(id)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	if order.UserId != userId {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "无权查看此订单",
		})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data":    order,
	})
}

func GetAllOrders(c *gin.Context) {
	p, _ := strconv.Atoi(c.Query("p"))
	if p < 0 {
		p = 0
	}
	orders, err := model.GetAllOrders(p*config.ItemsPerPage, config.ItemsPerPage)
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
		"data":    orders,
	})
}

func GetOrder(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "无效的订单ID",
		})
		return
	}
	order, err := model.GetOrderById(id)
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
		"data":    order,
	})
}
