package controller

import (
	"net/http"
	"regexp"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/songquanpeng/one-api/model"
)

var emailRegexp = regexp.MustCompile(`^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$`)

type SubmitContactRequest struct {
	Name    string `json:"name"`
	Email   string `json:"email"`
	Phone   string `json:"phone"`
	Message string `json:"message"`
}

func SubmitContactMessage(c *gin.Context) {
	var req SubmitContactRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "无效的请求参数",
		})
		return
	}
	if req.Name == "" || req.Message == "" {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "姓名和留言不能为空",
		})
		return
	}
	if len(req.Name) > 100 || len(req.Email) > 200 || len(req.Phone) > 30 || len(req.Message) > 5000 {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "输入内容超出长度限制",
		})
		return
	}
	if req.Email != "" && !emailRegexp.MatchString(req.Email) {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "邮箱格式不正确",
		})
		return
	}
	msg := &model.ContactMessage{
		Name:    req.Name,
		Email:   req.Email,
		Phone:   req.Phone,
		Message: req.Message,
	}
	if err := model.CreateContactMessage(msg); err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "留言提交成功",
	})
}

func GetContactMessages(c *gin.Context) {
	p, _ := strconv.Atoi(c.Query("p"))
	if p < 0 {
		p = 0
	}
	perPage := 20
	messages, err := model.GetContactMessages(p*perPage, perPage)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	total, _ := model.GetContactMessageCount()
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data":    messages,
		"total":   total,
	})
}

func UpdateContactStatus(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "无效的ID",
		})
		return
	}
	var req struct {
		Status int `json:"status"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "无效的请求参数",
		})
		return
	}
	if err := model.UpdateContactMessageStatus(id, req.Status); err != nil {
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
