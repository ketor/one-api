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
	"net/url"
	"sort"
	"strings"
	"time"

	"github.com/songquanpeng/one-api/common/logger"
)

// AlipayProvider 支付宝当面付实现
type AlipayProvider struct {
	appID      string
	privateKey *rsa.PrivateKey
	publicKey  *rsa.PublicKey // 支付宝公钥，用于验签
	notifyURL  string
	gatewayURL string
}

// NewAlipayProvider 创建支付宝 provider，配置不完整返回 nil
func NewAlipayProvider(cfg *Config) *AlipayProvider {
	if !cfg.IsAlipayEnabled() {
		return nil
	}

	privKey, err := parsePrivateKey(cfg.AlipayPrivateKey)
	if err != nil {
		logger.SysError("failed to parse alipay private key: " + err.Error())
		return nil
	}

	notifyURL := strings.TrimRight(cfg.CallbackBaseURL, "/") + "/api/payment/callback/alipay"

	gatewayURL := "https://openapi.alipay.com/gateway.do"
	if cfg.Mode == "sandbox" {
		gatewayURL = "https://openapi-sandbox.dl.alipaydev.com/gateway.do"
	}

	provider := &AlipayProvider{
		appID:      cfg.AlipayAppID,
		privateKey: privKey,
		notifyURL:  notifyURL,
		gatewayURL: gatewayURL,
	}

	// Parse alipay public key if provided
	if cfg.AlipayPublicCert != "" {
		pubKey, err := parseAlipayPublicKey(cfg.AlipayPublicCert)
		if err != nil {
			logger.SysError("failed to parse alipay public key: " + err.Error())
		} else {
			provider.publicKey = pubKey
		}
	}

	return provider
}

func (a *AlipayProvider) Name() string { return "alipay" }

func (a *AlipayProvider) CreatePayment(ctx context.Context, req *CreatePaymentRequest) (*CreatePaymentResponse, error) {
	// 当面付预创建 alipay.trade.precreate
	bizContent := map[string]interface{}{
		"subject":         req.Subject,
		"out_trade_no":    req.OrderNo,
		"total_amount":    fmt.Sprintf("%.2f", float64(req.AmountCents)/100),
		"timeout_express": "30m",
	}
	bizContentBytes, _ := json.Marshal(bizContent)

	params := map[string]string{
		"app_id":      a.appID,
		"method":      "alipay.trade.precreate",
		"charset":     "utf-8",
		"sign_type":   "RSA2",
		"timestamp":   time.Now().Format("2006-01-02 15:04:05"),
		"version":     "1.0",
		"notify_url":  a.notifyURL,
		"biz_content": string(bizContentBytes),
	}

	// Sign
	sign, err := a.signParams(params)
	if err != nil {
		return nil, fmt.Errorf("sign alipay request: %w", err)
	}
	params["sign"] = sign

	// Build form POST
	values := url.Values{}
	for k, v := range params {
		values.Set(k, v)
	}

	resp, err := http.PostForm(a.gatewayURL, values)
	if err != nil {
		return nil, fmt.Errorf("alipay precreate request: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("read alipay response: %w", err)
	}

	var result struct {
		AlipayTradePrecreateResponse struct {
			Code    string `json:"code"`
			Msg     string `json:"msg"`
			QRCode  string `json:"qr_code"`
			SubCode string `json:"sub_code"`
			SubMsg  string `json:"sub_msg"`
		} `json:"alipay_trade_precreate_response"`
	}
	if err := json.Unmarshal(respBody, &result); err != nil {
		return nil, fmt.Errorf("parse alipay response: %w", err)
	}

	r := result.AlipayTradePrecreateResponse
	if r.Code != "10000" {
		return nil, fmt.Errorf("alipay precreate failed: %s %s %s", r.Code, r.SubCode, r.SubMsg)
	}

	return &CreatePaymentResponse{
		CodeURL:    r.QRCode,
		ExpireTime: time.Now().Add(30 * time.Minute).Unix(),
	}, nil
}

func (a *AlipayProvider) HandleCallback(ctx context.Context, body []byte, headers map[string]string) (*CallbackResult, error) {
	// Parse form-encoded callback body
	values, err := url.ParseQuery(string(body))
	if err != nil {
		return nil, fmt.Errorf("parse callback body: %w", err)
	}

	// Verify signature
	sign := values.Get("sign")
	signType := values.Get("sign_type")
	if sign == "" {
		return nil, fmt.Errorf("missing sign in callback")
	}

	// Build verification string (exclude sign and sign_type)
	params := make(map[string]string)
	for k := range values {
		if k == "sign" || k == "sign_type" {
			continue
		}
		params[k] = values.Get(k)
	}

	if a.publicKey != nil && signType == "RSA2" {
		if err := a.verifySign(params, sign); err != nil {
			return nil, fmt.Errorf("verify callback signature: %w", err)
		}
	}

	tradeStatus := values.Get("trade_status")
	orderNo := values.Get("out_trade_no")
	tradeNo := values.Get("trade_no")

	// Parse amount (alipay uses yuan with 2 decimal places)
	amountStr := values.Get("total_amount")
	amountCents := parseYuanToCents(amountStr)

	return &CallbackResult{
		OrderNo:     orderNo,
		TradeNo:     tradeNo,
		AmountCents: amountCents,
		Success:     tradeStatus == "TRADE_SUCCESS" || tradeStatus == "TRADE_FINISHED",
	}, nil
}

func (a *AlipayProvider) QueryPayment(ctx context.Context, orderNo string) (*PaymentStatus, error) {
	bizContent := map[string]interface{}{
		"out_trade_no": orderNo,
	}
	bizContentBytes, _ := json.Marshal(bizContent)

	params := map[string]string{
		"app_id":      a.appID,
		"method":      "alipay.trade.query",
		"charset":     "utf-8",
		"sign_type":   "RSA2",
		"timestamp":   time.Now().Format("2006-01-02 15:04:05"),
		"version":     "1.0",
		"biz_content": string(bizContentBytes),
	}

	sign, err := a.signParams(params)
	if err != nil {
		return nil, fmt.Errorf("sign alipay query: %w", err)
	}
	params["sign"] = sign

	values := url.Values{}
	for k, v := range params {
		values.Set(k, v)
	}

	resp, err := http.PostForm(a.gatewayURL, values)
	if err != nil {
		return nil, fmt.Errorf("alipay query request: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var result struct {
		AlipayTradeQueryResponse struct {
			Code       string `json:"code"`
			TradeNo    string `json:"trade_no"`
			OutTradeNo string `json:"out_trade_no"`
			TradeStatus string `json:"trade_status"`
			TotalAmount string `json:"total_amount"`
		} `json:"alipay_trade_query_response"`
	}
	if err := json.Unmarshal(respBody, &result); err != nil {
		return nil, fmt.Errorf("parse query result: %w", err)
	}

	r := result.AlipayTradeQueryResponse
	status := "NOTPAY"
	switch r.TradeStatus {
	case "TRADE_SUCCESS", "TRADE_FINISHED":
		status = "SUCCESS"
	case "TRADE_CLOSED":
		status = "CLOSED"
	case "WAIT_BUYER_PAY":
		status = "NOTPAY"
	}

	return &PaymentStatus{
		OrderNo:     r.OutTradeNo,
		TradeNo:     r.TradeNo,
		Status:      status,
		AmountCents: parseYuanToCents(r.TotalAmount),
	}, nil
}

func (a *AlipayProvider) Refund(ctx context.Context, req *RefundRequest) (*RefundResponse, error) {
	bizContent := map[string]interface{}{
		"out_trade_no":   req.OrderNo,
		"out_request_no": req.RefundNo,
		"refund_amount":  fmt.Sprintf("%.2f", float64(req.RefundCents)/100),
		"refund_reason":  req.Reason,
	}
	bizContentBytes, _ := json.Marshal(bizContent)

	params := map[string]string{
		"app_id":      a.appID,
		"method":      "alipay.trade.refund",
		"charset":     "utf-8",
		"sign_type":   "RSA2",
		"timestamp":   time.Now().Format("2006-01-02 15:04:05"),
		"version":     "1.0",
		"biz_content": string(bizContentBytes),
	}

	sign, err := a.signParams(params)
	if err != nil {
		return nil, fmt.Errorf("sign alipay refund: %w", err)
	}
	params["sign"] = sign

	values := url.Values{}
	for k, v := range params {
		values.Set(k, v)
	}

	resp, err := http.PostForm(a.gatewayURL, values)
	if err != nil {
		return nil, fmt.Errorf("alipay refund request: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var result struct {
		AlipayTradeRefundResponse struct {
			Code       string `json:"code"`
			Msg        string `json:"msg"`
			TradeNo    string `json:"trade_no"`
			FundChange string `json:"fund_change"`
		} `json:"alipay_trade_refund_response"`
	}
	if err := json.Unmarshal(respBody, &result); err != nil {
		return nil, fmt.Errorf("parse refund result: %w", err)
	}

	r := result.AlipayTradeRefundResponse
	status := "FAILED"
	if r.Code == "10000" && r.FundChange == "Y" {
		status = "SUCCESS"
	} else if r.Code == "10000" {
		status = "PROCESSING"
	}

	logger.SysLogf("alipay refund completed: order=%s refund=%s status=%s", req.OrderNo, req.RefundNo, status)

	return &RefundResponse{
		RefundNo: req.RefundNo,
		RefundId: r.TradeNo,
		Status:   status,
	}, nil
}

func (a *AlipayProvider) CloseOrder(ctx context.Context, orderNo string) error {
	bizContent := map[string]interface{}{
		"out_trade_no": orderNo,
	}
	bizContentBytes, _ := json.Marshal(bizContent)

	params := map[string]string{
		"app_id":      a.appID,
		"method":      "alipay.trade.close",
		"charset":     "utf-8",
		"sign_type":   "RSA2",
		"timestamp":   time.Now().Format("2006-01-02 15:04:05"),
		"version":     "1.0",
		"biz_content": string(bizContentBytes),
	}

	sign, err := a.signParams(params)
	if err != nil {
		return fmt.Errorf("sign alipay close: %w", err)
	}
	params["sign"] = sign

	values := url.Values{}
	for k, v := range params {
		values.Set(k, v)
	}

	resp, err := http.PostForm(a.gatewayURL, values)
	if err != nil {
		return fmt.Errorf("alipay close request: %w", err)
	}
	resp.Body.Close()

	return nil
}

// signParams 对参数进行 RSA2(SHA256WithRSA) 签名
func (a *AlipayProvider) signParams(params map[string]string) (string, error) {
	// Sort keys
	keys := make([]string, 0, len(params))
	for k := range params {
		keys = append(keys, k)
	}
	sort.Strings(keys)

	// Build sign string
	var buf strings.Builder
	for i, k := range keys {
		if i > 0 {
			buf.WriteByte('&')
		}
		buf.WriteString(k)
		buf.WriteByte('=')
		buf.WriteString(params[k])
	}

	signStr := buf.String()
	h := sha256.New()
	h.Write([]byte(signStr))
	digest := h.Sum(nil)

	sig, err := rsa.SignPKCS1v15(rand.Reader, a.privateKey, crypto.SHA256, digest)
	if err != nil {
		return "", err
	}
	return base64.StdEncoding.EncodeToString(sig), nil
}

// verifySign 验证支付宝回调签名
func (a *AlipayProvider) verifySign(params map[string]string, sign string) error {
	// Sort keys
	keys := make([]string, 0, len(params))
	for k := range params {
		keys = append(keys, k)
	}
	sort.Strings(keys)

	var buf strings.Builder
	for i, k := range keys {
		if i > 0 {
			buf.WriteByte('&')
		}
		buf.WriteString(k)
		buf.WriteByte('=')
		buf.WriteString(params[k])
	}

	signBytes, err := base64.StdEncoding.DecodeString(sign)
	if err != nil {
		return fmt.Errorf("decode sign: %w", err)
	}

	h := sha256.New()
	h.Write([]byte(buf.String()))
	digest := h.Sum(nil)

	return rsa.VerifyPKCS1v15(a.publicKey, crypto.SHA256, digest, signBytes)
}

// parseAlipayPublicKey 解析支付宝公钥
func parseAlipayPublicKey(keyContent string) (*rsa.PublicKey, error) {
	// If it doesn't look like PEM, wrap it
	if !strings.Contains(keyContent, "BEGIN") {
		keyContent = "-----BEGIN PUBLIC KEY-----\n" + keyContent + "\n-----END PUBLIC KEY-----"
	}

	block, _ := pem.Decode([]byte(keyContent))
	if block == nil {
		return nil, fmt.Errorf("failed to decode PEM block")
	}

	pub, err := x509.ParsePKIXPublicKey(block.Bytes)
	if err != nil {
		return nil, fmt.Errorf("parse public key: %w", err)
	}

	rsaPub, ok := pub.(*rsa.PublicKey)
	if !ok {
		return nil, fmt.Errorf("public key is not RSA")
	}
	return rsaPub, nil
}

// parseYuanToCents 将元字符串转为分
func parseYuanToCents(yuanStr string) int64 {
	if yuanStr == "" {
		return 0
	}
	// Parse as float then convert to cents to handle "1.00" format
	var yuan float64
	fmt.Sscanf(yuanStr, "%f", &yuan)
	return int64(yuan * 100)
}
