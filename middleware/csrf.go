package middleware

import (
	"crypto/rand"
	"encoding/hex"
	"net/http"
	"strings"

	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
)

const csrfTokenKey = "csrf_token"
const csrfHeaderName = "X-CSRF-Token"

// generateCSRFToken creates a random CSRF token.
func generateCSRFToken() string {
	b := make([]byte, 32)
	rand.Read(b)
	return hex.EncodeToString(b)
}

// CSRFProtection is a middleware that validates CSRF tokens for state-changing requests.
// It exempts:
// - Requests with Bearer token authentication (API clients)
// - Payment callback routes (external webhook calls)
// - GET, HEAD, OPTIONS requests
func CSRFProtection() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Only check state-changing methods
		if c.Request.Method == "GET" || c.Request.Method == "HEAD" || c.Request.Method == "OPTIONS" {
			c.Next()
			return
		}

		// Exempt API token authenticated requests (Bearer token)
		authHeader := c.GetHeader("Authorization")
		if strings.HasPrefix(authHeader, "Bearer ") {
			c.Next()
			return
		}

		// Exempt payment callback routes
		path := c.Request.URL.Path
		if strings.HasPrefix(path, "/api/payment/callback/") {
			c.Next()
			return
		}

		// Validate CSRF token from session
		session := sessions.Default(c)
		sessionToken := session.Get(csrfTokenKey)
		if sessionToken == nil {
			c.Next()
			return
		}

		requestToken := c.GetHeader(csrfHeaderName)
		if requestToken == "" {
			requestToken = c.PostForm("_csrf")
		}

		if requestToken == "" || requestToken != sessionToken.(string) {
			c.JSON(http.StatusForbidden, gin.H{
				"success": false,
				"message": "CSRF token validation failed",
			})
			c.Abort()
			return
		}

		c.Next()
	}
}

// SetCSRFToken generates and stores a CSRF token in the session, returning it in a response header.
func SetCSRFToken(c *gin.Context) {
	session := sessions.Default(c)
	token := generateCSRFToken()
	session.Set(csrfTokenKey, token)
	session.Save()
	c.Header(csrfHeaderName, token)
}
