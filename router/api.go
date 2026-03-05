package router

import (
	"github.com/songquanpeng/one-api/controller"
	"github.com/songquanpeng/one-api/controller/auth"
	"github.com/songquanpeng/one-api/middleware"
	"github.com/songquanpeng/one-api/payment"

	"github.com/gin-contrib/gzip"
	"github.com/gin-gonic/gin"
)

func SetApiRouter(router *gin.Engine) {
	apiRouter := router.Group("/api")
	apiRouter.Use(gzip.Gzip(gzip.DefaultCompression))
	apiRouter.Use(middleware.GlobalAPIRateLimit())
	{
		apiRouter.GET("/status", controller.GetStatus)
		apiRouter.GET("/models", middleware.UserAuth(), controller.DashboardListModels)
		apiRouter.GET("/notice", controller.GetNotice)
		apiRouter.GET("/about", controller.GetAbout)
		apiRouter.GET("/home_page_content", controller.GetHomePageContent)
		apiRouter.GET("/verification", middleware.CriticalRateLimit(), middleware.TurnstileCheck(), controller.SendEmailVerification)
		apiRouter.GET("/reset_password", middleware.CriticalRateLimit(), middleware.TurnstileCheck(), controller.SendPasswordResetEmail)
		apiRouter.POST("/user/reset", middleware.CriticalRateLimit(), controller.ResetPassword)
		apiRouter.GET("/oauth/github", middleware.CriticalRateLimit(), auth.GitHubOAuth)
		apiRouter.GET("/oauth/oidc", middleware.CriticalRateLimit(), auth.OidcAuth)
		apiRouter.GET("/oauth/lark", middleware.CriticalRateLimit(), auth.LarkOAuth)
		apiRouter.GET("/oauth/state", middleware.CriticalRateLimit(), auth.GenerateOAuthCode)
		apiRouter.GET("/oauth/wechat", middleware.CriticalRateLimit(), auth.WeChatAuth)
		apiRouter.GET("/oauth/wechat/bind", middleware.CriticalRateLimit(), middleware.UserAuth(), auth.WeChatBind)
		apiRouter.GET("/oauth/email/bind", middleware.CriticalRateLimit(), middleware.UserAuth(), controller.EmailBind)
		apiRouter.POST("/topup", middleware.AdminAuth(), controller.AdminTopUp)

		userRoute := apiRouter.Group("/user")
		{
			userRoute.POST("/register", middleware.CriticalRateLimit(), middleware.TurnstileCheck(), controller.Register)
			userRoute.POST("/login", middleware.CriticalRateLimit(), controller.Login)
			userRoute.GET("/logout", controller.Logout)

			selfRoute := userRoute.Group("/")
			selfRoute.Use(middleware.UserAuth())
			{
				selfRoute.GET("/dashboard", controller.GetUserDashboard)
				selfRoute.GET("/self", controller.GetSelf)
				selfRoute.PUT("/self", controller.UpdateSelf)
				selfRoute.DELETE("/self", controller.DeleteSelf)
				selfRoute.GET("/token", controller.GenerateAccessToken)
				selfRoute.GET("/aff", controller.GetAffCode)
				selfRoute.POST("/topup", controller.TopUp)
				selfRoute.GET("/available_models", controller.GetUserAvailableModels)
			}

			adminRoute := userRoute.Group("/")
			adminRoute.Use(middleware.AdminAuth())
			{
				adminRoute.GET("/", controller.GetAllUsers)
				adminRoute.GET("/search", controller.SearchUsers)
				adminRoute.GET("/:id", controller.GetUser)
				adminRoute.POST("/", controller.CreateUser)
				adminRoute.POST("/manage", controller.ManageUser)
				adminRoute.PUT("/", controller.UpdateUser)
				adminRoute.PUT("/:id/plan", controller.AdminUpdateUserPlan)
				adminRoute.DELETE("/:id", controller.DeleteUser)
			}
		}
		optionRoute := apiRouter.Group("/option")
		optionRoute.Use(middleware.RootAuth())
		{
			optionRoute.GET("/", controller.GetOptions)
			optionRoute.PUT("/", controller.UpdateOption)
		}
		channelRoute := apiRouter.Group("/channel")
		channelRoute.Use(middleware.AdminAuth())
		{
			channelRoute.GET("/", controller.GetAllChannels)
			channelRoute.GET("/search", controller.SearchChannels)
			channelRoute.GET("/models", controller.ListAllModels)
			channelRoute.GET("/:id", controller.GetChannel)
			channelRoute.GET("/test", controller.TestChannels)
			channelRoute.GET("/test/:id", controller.TestChannel)
			channelRoute.GET("/update_balance", controller.UpdateAllChannelsBalance)
			channelRoute.GET("/update_balance/:id", controller.UpdateChannelBalance)
			channelRoute.POST("/", controller.AddChannel)
			channelRoute.PUT("/", controller.UpdateChannel)
			channelRoute.DELETE("/disabled", controller.DeleteDisabledChannel)
			channelRoute.DELETE("/:id", controller.DeleteChannel)
		}
		tokenRoute := apiRouter.Group("/token")
		tokenRoute.Use(middleware.UserAuth())
		{
			tokenRoute.GET("/", controller.GetAllTokens)
			tokenRoute.GET("/search", controller.SearchTokens)
			tokenRoute.GET("/:id", controller.GetToken)
			tokenRoute.POST("/", controller.AddToken)
			tokenRoute.PUT("/", controller.UpdateToken)
			tokenRoute.DELETE("/:id", controller.DeleteToken)
		}
		redemptionRoute := apiRouter.Group("/redemption")
		redemptionRoute.Use(middleware.AdminAuth())
		{
			redemptionRoute.GET("/", controller.GetAllRedemptions)
			redemptionRoute.GET("/search", controller.SearchRedemptions)
			redemptionRoute.GET("/:id", controller.GetRedemption)
			redemptionRoute.POST("/", controller.AddRedemption)
			redemptionRoute.PUT("/", controller.UpdateRedemption)
			redemptionRoute.DELETE("/:id", controller.DeleteRedemption)
		}
		logRoute := apiRouter.Group("/log")
		logRoute.GET("/", middleware.AdminAuth(), controller.GetAllLogs)
		logRoute.DELETE("/", middleware.AdminAuth(), controller.DeleteHistoryLogs)
		logRoute.GET("/stat", middleware.AdminAuth(), controller.GetLogsStat)
		logRoute.GET("/self/stat", middleware.UserAuth(), controller.GetLogsSelfStat)
		logRoute.GET("/search", middleware.AdminAuth(), controller.SearchAllLogs)
		logRoute.GET("/self", middleware.UserAuth(), controller.GetUserLogs)
		logRoute.GET("/self/search", middleware.UserAuth(), controller.SearchUserLogs)
		groupRoute := apiRouter.Group("/group")
		groupRoute.Use(middleware.AdminAuth())
		{
			groupRoute.GET("/", controller.GetGroups)
		}

		// Plan routes (public)
		planRoute := apiRouter.Group("/plan")
		{
			planRoute.GET("/", controller.GetPlans)
			planRoute.GET("/:id", controller.GetPlan)
		}

		// Booster pack routes (public listing)
		boosterRoute := apiRouter.Group("/booster")
		{
			boosterRoute.GET("/", controller.GetBoosterPacks)

			// User-authenticated booster routes
			boosterUserRoute := boosterRoute.Group("/")
			boosterUserRoute.Use(middleware.UserAuth())
			{
				boosterUserRoute.POST("/purchase", controller.PurchaseBoosterPack)
				boosterUserRoute.GET("/self", controller.GetSelfBoosterPacks)
			}
		}

		// Subscription routes (user-authenticated)
		subscriptionRoute := apiRouter.Group("/subscription")
		subscriptionRoute.Use(middleware.UserAuth())
		{
			subscriptionRoute.GET("/self", controller.GetSelfSubscription)
			subscriptionRoute.POST("/", controller.CreateSubscription)
			subscriptionRoute.PUT("/upgrade", controller.UpgradeSubscription)
			subscriptionRoute.PUT("/downgrade", controller.DowngradeSubscription)
			subscriptionRoute.POST("/cancel", controller.CancelSubscription)
			subscriptionRoute.POST("/renew", controller.RenewSubscription)
			subscriptionRoute.GET("/quota", controller.GetWindowQuota)
		}

		// Order routes (user-authenticated)
		orderRoute := apiRouter.Group("/order")
		orderRoute.Use(middleware.UserAuth())
		{
			orderRoute.GET("/self", controller.GetSelfOrders)
			orderRoute.GET("/self/:id", controller.GetSelfOrder)
		}

		// Usage routes (user-authenticated)
		usageRoute := apiRouter.Group("/usage")
		usageRoute.Use(middleware.UserAuth())
		{
			usageRoute.GET("/window", controller.GetWindowUsage)
			usageRoute.GET("/monthly", controller.GetMonthlyUsage)
			usageRoute.GET("/history", controller.GetUsageHistory)
		}

		// Admin routes for subscription management
		adminSubRoute := apiRouter.Group("/admin/subscription")
		adminSubRoute.Use(middleware.AdminAuth())
		{
			adminSubRoute.GET("/", controller.GetAllSubscriptions)
			adminSubRoute.PUT("/:id", controller.AdminUpdateSubscription)
		}

		// Admin routes for order management
		adminOrderRoute := apiRouter.Group("/admin/order")
		adminOrderRoute.Use(middleware.AdminAuth())
		{
			adminOrderRoute.GET("/", controller.GetAllOrders)
			adminOrderRoute.GET("/:id", controller.GetOrder)
		}

		// Admin routes for plan management
		adminPlanRoute := apiRouter.Group("/admin/plan")
		adminPlanRoute.Use(middleware.AdminAuth())
		{
			adminPlanRoute.GET("/", controller.GetAllAdminPlans)
			adminPlanRoute.POST("/", controller.CreatePlan)
			adminPlanRoute.PUT("/", controller.UpdatePlan)
			adminPlanRoute.DELETE("/:id", controller.DeletePlan)
		}

		// Admin routes for booster pack management
		adminBoosterRoute := apiRouter.Group("/admin/booster")
		adminBoosterRoute.Use(middleware.AdminAuth())
		{
			adminBoosterRoute.GET("/", controller.GetAllAdminBoosterPacks)
			adminBoosterRoute.POST("/", controller.CreateBoosterPack)
			adminBoosterRoute.PUT("/", controller.UpdateBoosterPack)
			adminBoosterRoute.DELETE("/:id", controller.DeleteBoosterPack)
		}

		// Contact routes (public, with rate limit)
		apiRouter.POST("/contact", middleware.CriticalRateLimit(), controller.SubmitContactMessage)

		// Admin routes for contact message management
		adminContactRoute := apiRouter.Group("/admin/contact")
		adminContactRoute.Use(middleware.AdminAuth())
		{
			adminContactRoute.GET("/", controller.GetContactMessages)
			adminContactRoute.PUT("/:id", controller.UpdateContactStatus)
		}

		// Payment callback routes (public, no auth required)
		paymentCallbackRoute := apiRouter.Group("/payment/callback")
		{
			paymentCallbackRoute.POST("/wechat", controller.HandleWechatCallback)
			paymentCallbackRoute.POST("/alipay", controller.HandleAlipayCallback)
		}

		// Payment routes (user-authenticated)
		paymentRoute := apiRouter.Group("/payment")
		paymentRoute.Use(middleware.UserAuth())
		{
			paymentRoute.POST("/create", controller.CreatePaymentOrder)
			paymentRoute.GET("/status/:order_no", controller.GetPaymentStatus)
			paymentRoute.POST("/cancel/:order_no", controller.CancelPaymentOrder)
			paymentRoute.GET("/providers", controller.GetAvailableProviders)
		}

		// Mock payment confirm (only when mock mode enabled, requires auth)
		if payment.GetConfig().IsMockEnabled() {
			apiRouter.POST("/payment/mock/confirm", middleware.UserAuth(), controller.MockPaymentConfirm)
		}

		// Admin routes for usage analytics
		adminUsageRoute := apiRouter.Group("/admin/usage")
		adminUsageRoute.Use(middleware.AdminAuth())
		{
			adminUsageRoute.GET("/overview", controller.GetPlatformUsageOverview)
			adminUsageRoute.GET("/by-model", controller.GetUsageByModel)
			adminUsageRoute.GET("/top-users", controller.GetTopUsers)
		}
	}
}
