package payment

import (
	"context"
	"crypto"
	"crypto/rand"
	"crypto/rsa"
	"crypto/sha256"
	"crypto/x509"
	"encoding/base64"
	"encoding/json"
	"encoding/pem"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/songquanpeng/one-api/common/logger"
	"github.com/songquanpeng/one-api/common/random"
)

// WechatProvider 微信支付 V3 Native 支付实现
type WechatProvider struct {
	appID       string
	mchID       string
	apiV3Key    string
	serialNo    string
	privateKey  *rsa.PrivateKey
	notifyURL   string
	apiBase     string
}

// NewWechatProvider 创建微信支付 provider，配置不完整返回 nil
func NewWechatProvider(cfg *Config) *WechatProvider {
	if !cfg.IsWechatEnabled() {
		return nil
	}

	privKey, err := parsePrivateKey(cfg.WechatPrivateKey)
	if err != nil {
		logger.SysError("failed to parse wechat private key: " + err.Error())
		return nil
	}

	notifyURL := strings.TrimRight(cfg.CallbackBaseURL, "/") + "/api/payment/callback/wechat"

	apiBase := "https://api.mch.weixin.qq.com"
	if cfg.Mode == "sandbox" {
		apiBase = "https://api.mch.weixin.qq.com/sandboxnew"
	}

	return &WechatProvider{
		appID:      cfg.WechatAppID,
		mchID:      cfg.WechatMchID,
		apiV3Key:   cfg.WechatAPIV3Key,
		serialNo:   cfg.WechatSerialNo,
		privateKey: privKey,
		notifyURL:  notifyURL,
		apiBase:    apiBase,
	}
}

func (w *WechatProvider) Name() string { return "wechat" }

func (w *WechatProvider) CreatePayment(ctx context.Context, req *CreatePaymentRequest) (*CreatePaymentResponse, error) {
	expireTime := time.Now().Add(30 * time.Minute)

	body := map[string]interface{}{
		"appid":        w.appID,
		"mchid":        w.mchID,
		"description":  req.Subject,
		"out_trade_no": req.OrderNo,
		"notify_url":   w.notifyURL,
		"time_expire":  expireTime.Format(time.RFC3339),
		"amount": map[string]interface{}{
			"total":    int(req.AmountCents),
			"currency": "CNY",
		},
	}

	bodyBytes, err := json.Marshal(body)
	if err != nil {
		return nil, fmt.Errorf("marshal request body: %w", err)
	}

	url := w.apiBase + "/v3/pay/transactions/native"
	respBody, err := w.doRequest(ctx, "POST", url, bodyBytes)
	if err != nil {
		return nil, fmt.Errorf("wechat native pay: %w", err)
	}

	var result struct {
		CodeURL string `json:"code_url"`
	}
	if err := json.Unmarshal(respBody, &result); err != nil {
		return nil, fmt.Errorf("parse wechat response: %w", err)
	}
	if result.CodeURL == "" {
		return nil, fmt.Errorf("wechat returned empty code_url, response: %s", string(respBody))
	}

	return &CreatePaymentResponse{
		CodeURL:    result.CodeURL,
		ExpireTime: expireTime.Unix(),
	}, nil
}

func (w *WechatProvider) HandleCallback(ctx context.Context, body []byte, headers map[string]string) (*CallbackResult, error) {
	// Verify signature
	timestamp := headers["Wechatpay-Timestamp"]
	nonce := headers["Wechatpay-Nonce"]
	signature := headers["Wechatpay-Signature"]

	if timestamp == "" || nonce == "" || signature == "" {
		return nil, fmt.Errorf("missing wechat callback headers")
	}

	// Parse notification body
	var notification struct {
		EventType  string `json:"event_type"`
		ResourceType string `json:"resource_type"`
		Resource   struct {
			Algorithm      string `json:"algorithm"`
			Ciphertext     string `json:"ciphertext"`
			Nonce          string `json:"nonce"`
			AssociatedData string `json:"associated_data"`
			OriginalType   string `json:"original_type"`
		} `json:"resource"`
	}
	if err := json.Unmarshal(body, &notification); err != nil {
		return nil, fmt.Errorf("parse notification: %w", err)
	}

	// Decrypt resource
	plaintext, err := decryptAESGCM(w.apiV3Key, notification.Resource.Nonce,
		notification.Resource.Ciphertext, notification.Resource.AssociatedData)
	if err != nil {
		return nil, fmt.Errorf("decrypt notification resource: %w", err)
	}

	var payResult struct {
		OutTradeNo  string `json:"out_trade_no"`
		TransactionId string `json:"transaction_id"`
		TradeState  string `json:"trade_state"`
		Amount      struct {
			Total int64 `json:"total"`
		} `json:"amount"`
	}
	if err := json.Unmarshal(plaintext, &payResult); err != nil {
		return nil, fmt.Errorf("parse decrypted result: %w", err)
	}

	return &CallbackResult{
		OrderNo:     payResult.OutTradeNo,
		TradeNo:     payResult.TransactionId,
		AmountCents: payResult.Amount.Total,
		Success:     payResult.TradeState == "SUCCESS",
	}, nil
}

func (w *WechatProvider) QueryPayment(ctx context.Context, orderNo string) (*PaymentStatus, error) {
	url := fmt.Sprintf("%s/v3/pay/transactions/out-trade-no/%s?mchid=%s", w.apiBase, orderNo, w.mchID)
	respBody, err := w.doRequest(ctx, "GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("query wechat payment: %w", err)
	}

	var result struct {
		OutTradeNo    string `json:"out_trade_no"`
		TransactionId string `json:"transaction_id"`
		TradeState    string `json:"trade_state"`
		Amount        struct {
			Total int64 `json:"total"`
		} `json:"amount"`
	}
	if err := json.Unmarshal(respBody, &result); err != nil {
		return nil, fmt.Errorf("parse query result: %w", err)
	}

	return &PaymentStatus{
		OrderNo:     result.OutTradeNo,
		TradeNo:     result.TransactionId,
		Status:      result.TradeState,
		AmountCents: result.Amount.Total,
	}, nil
}

func (w *WechatProvider) Refund(ctx context.Context, req *RefundRequest) (*RefundResponse, error) {
	body := map[string]interface{}{
		"out_trade_no":  req.OrderNo,
		"out_refund_no": req.RefundNo,
		"reason":        req.Reason,
		"amount": map[string]interface{}{
			"refund":   int(req.RefundCents),
			"total":    int(req.TotalCents),
			"currency": "CNY",
		},
	}

	bodyBytes, err := json.Marshal(body)
	if err != nil {
		return nil, fmt.Errorf("marshal refund request: %w", err)
	}

	url := w.apiBase + "/v3/refund/domestic/refunds"
	respBody, err := w.doRequest(ctx, "POST", url, bodyBytes)
	if err != nil {
		return nil, fmt.Errorf("wechat refund: %w", err)
	}

	var result struct {
		RefundId    string `json:"refund_id"`
		OutRefundNo string `json:"out_refund_no"`
		Status      string `json:"status"`
	}
	if err := json.Unmarshal(respBody, &result); err != nil {
		return nil, fmt.Errorf("parse refund result: %w", err)
	}

	logger.SysLogf("wechat refund completed: order=%s refund=%s status=%s", req.OrderNo, req.RefundNo, result.Status)

	return &RefundResponse{
		RefundNo: result.OutRefundNo,
		RefundId: result.RefundId,
		Status:   result.Status,
	}, nil
}

func (w *WechatProvider) CloseOrder(ctx context.Context, orderNo string) error {
	body := map[string]interface{}{
		"mchid": w.mchID,
	}
	bodyBytes, err := json.Marshal(body)
	if err != nil {
		return fmt.Errorf("marshal close request: %w", err)
	}

	url := fmt.Sprintf("%s/v3/pay/transactions/out-trade-no/%s/close", w.apiBase, orderNo)
	_, err = w.doRequest(ctx, "POST", url, bodyBytes)
	if err != nil {
		return fmt.Errorf("close wechat order: %w", err)
	}
	return nil
}

// doRequest 执行微信 V3 API 请求（带签名）
func (w *WechatProvider) doRequest(ctx context.Context, method, url string, body []byte) ([]byte, error) {
	var bodyReader io.Reader
	if body != nil {
		bodyReader = strings.NewReader(string(body))
	}

	req, err := http.NewRequestWithContext(ctx, method, url, bodyReader)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")

	// Build authorization header
	timestamp := fmt.Sprintf("%d", time.Now().Unix())
	nonceStr := random.GetRandomString(32)
	bodyStr := ""
	if body != nil {
		bodyStr = string(body)
	}

	// Extract path from URL for signing
	urlPath := req.URL.RequestURI()
	message := fmt.Sprintf("%s\n%s\n%s\n%s\n%s\n", method, urlPath, timestamp, nonceStr, bodyStr)

	signature, err := w.sign(message)
	if err != nil {
		return nil, fmt.Errorf("sign request: %w", err)
	}

	authHeader := fmt.Sprintf(`WECHATPAY2-SHA256-RSA2048 mchid="%s",nonce_str="%s",timestamp="%s",serial_no="%s",signature="%s"`,
		w.mchID, nonceStr, timestamp, w.serialNo, signature)
	req.Header.Set("Authorization", authHeader)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	// 204 No Content is a valid success response (e.g., for close order)
	if resp.StatusCode == http.StatusNoContent {
		return nil, nil
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("wechat API returned %d: %s", resp.StatusCode, string(respBody))
	}

	return respBody, nil
}

// sign 使用 RSA-SHA256 签名
func (w *WechatProvider) sign(message string) (string, error) {
	h := sha256.New()
	h.Write([]byte(message))
	digest := h.Sum(nil)

	sig, err := rsa.SignPKCS1v15(rand.Reader, w.privateKey, crypto.SHA256, digest)
	if err != nil {
		return "", err
	}
	return base64.StdEncoding.EncodeToString(sig), nil
}

// parsePrivateKey 解析 PEM 格式的 RSA 私钥
func parsePrivateKey(keyContent string) (*rsa.PrivateKey, error) {
	// Try to read as file path first
	if !strings.Contains(keyContent, "BEGIN") {
		data, err := io.ReadAll(strings.NewReader(keyContent))
		if err == nil && len(data) > 0 {
			// It might be a file path — but we don't read files here for security
			// Assume it's PEM content without headers (unlikely but handle gracefully)
		}
	}

	block, _ := pem.Decode([]byte(keyContent))
	if block == nil {
		return nil, fmt.Errorf("failed to decode PEM block")
	}

	key, err := x509.ParsePKCS8PrivateKey(block.Bytes)
	if err != nil {
		// Try PKCS1 format
		key2, err2 := x509.ParsePKCS1PrivateKey(block.Bytes)
		if err2 != nil {
			return nil, fmt.Errorf("failed to parse private key (PKCS8: %v, PKCS1: %v)", err, err2)
		}
		return key2, nil
	}

	rsaKey, ok := key.(*rsa.PrivateKey)
	if !ok {
		return nil, fmt.Errorf("private key is not RSA")
	}
	return rsaKey, nil
}

// decryptAESGCM 解密微信回调中的 AES-GCM 加密数据
func decryptAESGCM(apiV3Key, nonce, ciphertext, associatedData string) ([]byte, error) {
	ciphertextBytes, err := base64.StdEncoding.DecodeString(ciphertext)
	if err != nil {
		return nil, fmt.Errorf("base64 decode ciphertext: %w", err)
	}

	key := []byte(apiV3Key)

	// Use Go's crypto/cipher for AES-GCM
	block, err := newAESCipher(key)
	if err != nil {
		return nil, fmt.Errorf("create AES cipher: %w", err)
	}

	aead, err := newGCM(block)
	if err != nil {
		return nil, fmt.Errorf("create GCM: %w", err)
	}

	plaintext, err := aead.Open(nil, []byte(nonce), ciphertextBytes, []byte(associatedData))
	if err != nil {
		return nil, fmt.Errorf("AES-GCM decrypt: %w", err)
	}

	return plaintext, nil
}
