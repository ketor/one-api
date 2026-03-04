package middleware

import (
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

var (
	httpRequestsTotal = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "http_requests_total",
			Help: "Total number of HTTP requests",
		},
		[]string{"method", "path", "status"},
	)

	httpRequestDuration = prometheus.NewHistogramVec(
		prometheus.HistogramOpts{
			Name:    "http_request_duration_seconds",
			Help:    "HTTP request duration in seconds",
			Buckets: prometheus.DefBuckets,
		},
		[]string{"method", "path"},
	)

	activeSubscriptionsGauge = prometheus.NewGaugeVec(
		prometheus.GaugeOpts{
			Name: "subscription_active_total",
			Help: "Number of active subscriptions by plan",
		},
		[]string{"plan"},
	)

	ordersTotal = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "orders_total",
			Help: "Total number of orders by type and status",
		},
		[]string{"type", "status"},
	)

	paymentCallbacksTotal = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "payment_callbacks_total",
			Help: "Total number of payment callbacks",
		},
		[]string{"provider", "success"},
	)
)

func init() {
	prometheus.MustRegister(httpRequestsTotal)
	prometheus.MustRegister(httpRequestDuration)
	prometheus.MustRegister(activeSubscriptionsGauge)
	prometheus.MustRegister(ordersTotal)
	prometheus.MustRegister(paymentCallbacksTotal)
}

// PrometheusMetrics returns a Gin middleware that records HTTP request metrics.
func PrometheusMetrics() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		c.Next()
		duration := time.Since(start).Seconds()
		status := strconv.Itoa(c.Writer.Status())
		path := c.FullPath()
		if path == "" {
			path = "unknown"
		}
		httpRequestsTotal.WithLabelValues(c.Request.Method, path, status).Inc()
		httpRequestDuration.WithLabelValues(c.Request.Method, path).Observe(duration)
	}
}

// MetricsHandler returns the Prometheus metrics HTTP handler.
func MetricsHandler() gin.HandlerFunc {
	h := promhttp.Handler()
	return func(c *gin.Context) {
		h.ServeHTTP(c.Writer, c.Request)
	}
}

// RecordOrderCreated records a new order metric.
func RecordOrderCreated(orderType string) {
	ordersTotal.WithLabelValues(orderType, "created").Inc()
}

// RecordPaymentCallback records a payment callback metric.
func RecordPaymentCallback(provider string, success bool) {
	paymentCallbacksTotal.WithLabelValues(provider, strconv.FormatBool(success)).Inc()
}

// SetActiveSubscriptions sets the active subscriptions gauge for a plan.
func SetActiveSubscriptions(plan string, count float64) {
	activeSubscriptionsGauge.WithLabelValues(plan).Set(count)
}
