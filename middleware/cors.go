package middleware

import (
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func CORS() gin.HandlerFunc {
	config := cors.DefaultConfig()
	// AllowAllOrigins and AllowCredentials cannot both be true (browser security).
	// Use AllowAllOrigins without credentials for public API compatibility.
	config.AllowAllOrigins = true
	config.AllowCredentials = false
	config.AllowMethods = []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}
	config.AllowHeaders = []string{"Authorization", "Content-Type", "X-Requested-With", "Accept", "Origin", "X-CSRF-Token"}
	return cors.New(config)
}
