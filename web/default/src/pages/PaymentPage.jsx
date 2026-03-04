import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { QRCodeSVG } from 'qrcode.react';
import { Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';
import { API, showError } from '../helpers';
import { Button } from '../components/ui/button';

const PaymentPage = () => {
  const { orderNo } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [qrUrl, setQrUrl] = useState('');
  const [status, setStatus] = useState('loading'); // loading | selecting | paying | success | timeout | error
  const [method, setMethod] = useState('wechat');
  const [countdown, setCountdown] = useState(30 * 60); // 30 minutes
  const pollRef = useRef(null);
  const timerRef = useRef(null);

  // Fetch order details
  useEffect(() => {
    if (!orderNo) return;
    API.get(`/api/payment/status/${orderNo}`)
      .then((res) => {
        if (res.data.success) {
          const data = res.data.data;
          setOrder(data);
          if (data.status === 'paid') {
            setStatus('success');
          } else if (data.qr_code_url) {
            setQrUrl(data.qr_code_url);
            setStatus('paying');
          } else {
            setStatus('selecting');
          }
        } else {
          setStatus('error');
          showError(res.data.message);
        }
      })
      .catch(() => setStatus('error'));
  }, [orderNo]);

  // Polling for payment status
  const startPolling = useCallback((no) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const res = await API.get(`/api/payment/status/${no}`);
        if (res.data.success && res.data.data.status === 'paid') {
          clearInterval(pollRef.current);
          clearInterval(timerRef.current);
          setStatus('success');
        }
      } catch {}
    }, 3000);
    // Countdown timer
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(pollRef.current);
          clearInterval(timerRef.current);
          setStatus('timeout');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    if (status === 'paying' && orderNo) {
      startPolling(orderNo);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status, orderNo, startPolling]);

  const handlePay = async () => {
    try {
      const res = await API.post('/api/payment/create', {
        order_no: orderNo,
        payment_method: method,
      });
      if (res.data.success) {
        setQrUrl(res.data.data.qr_code_url);
        setStatus('paying');
        setCountdown(30 * 60);
      } else {
        showError(res.data.message);
      }
    } catch (err) {
      showError(err.message);
    }
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (status === 'loading') {
    return (
      <div className='flex min-h-[60vh] items-center justify-center'>
        <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className='flex min-h-[60vh] flex-col items-center justify-center gap-4'>
        <XCircle className='h-12 w-12 text-destructive' />
        <p className='text-muted-foreground'>{t('payment.error')}</p>
        <Button variant='outline' onClick={() => navigate('/billing')}>
          {t('payment.back_to_billing')}
        </Button>
      </div>
    );
  }

  return (
    <div className='max-w-lg mx-auto py-12 px-5'>
      <h1 className='text-2xl font-medium mb-8'>{t('payment.title')}</h1>

      {/* Order summary */}
      {order && (
        <div className='border border-border rounded p-4 mb-6'>
          <div className='flex justify-between text-sm mb-2'>
            <span className='text-muted-foreground'>{t('payment.order_no')}</span>
            <span className='font-mono'>{order.order_no || orderNo}</span>
          </div>
          <div className='flex justify-between text-sm'>
            <span className='text-muted-foreground'>{t('payment.amount')}</span>
            <span className='font-medium text-lg'>¥{(order.amount_cents || 0) / 100}</span>
          </div>
        </div>
      )}

      {/* Method selection */}
      {status === 'selecting' && (
        <div>
          <h2 className='text-lg font-medium mb-4'>{t('payment.select_method')}</h2>
          <div className='grid grid-cols-2 gap-3 mb-6'>
            <button
              onClick={() => setMethod('wechat')}
              className={`p-4 border rounded text-center transition-colors ${
                method === 'wechat' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
              }`}
            >
              <span className='text-2xl block mb-1'>💬</span>
              <span className='text-sm'>{t('payment.wechat_pay')}</span>
            </button>
            <button
              onClick={() => setMethod('alipay')}
              className={`p-4 border rounded text-center transition-colors ${
                method === 'alipay' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
              }`}
            >
              <span className='text-2xl block mb-1'>💰</span>
              <span className='text-sm'>{t('payment.alipay')}</span>
            </button>
          </div>
          <Button onClick={handlePay} className='w-full'>
            {t('payment.confirm_pay')}
          </Button>
        </div>
      )}

      {/* QR Code display */}
      {status === 'paying' && qrUrl && (
        <div className='flex flex-col items-center'>
          <p className='text-sm text-muted-foreground mb-4'>{t('payment.scan_to_pay')}</p>
          <div className='p-4 bg-white rounded'>
            <QRCodeSVG value={qrUrl} size={200} />
          </div>
          <div className='flex items-center gap-2 mt-4 text-sm text-muted-foreground'>
            <Clock className='h-4 w-4' />
            <span>{t('payment.waiting')}</span>
            <span className='font-mono'>{formatTime(countdown)}</span>
          </div>
        </div>
      )}

      {/* Success */}
      {status === 'success' && (
        <div className='flex flex-col items-center py-8'>
          <CheckCircle className='h-16 w-16 text-green-500 mb-4' />
          <h2 className='text-xl font-medium mb-2'>{t('payment.success')}</h2>
          <p className='text-sm text-muted-foreground mb-6'>{t('payment.success_desc')}</p>
          <Button onClick={() => navigate('/subscription')}>
            {t('payment.view_subscription')}
          </Button>
        </div>
      )}

      {/* Timeout */}
      {status === 'timeout' && (
        <div className='flex flex-col items-center py-8'>
          <XCircle className='h-16 w-16 text-destructive mb-4' />
          <h2 className='text-xl font-medium mb-2'>{t('payment.timeout')}</h2>
          <Button variant='outline' onClick={() => { setStatus('selecting'); setCountdown(30 * 60); }}>
            {t('payment.retry')}
          </Button>
        </div>
      )}
    </div>
  );
};

export default PaymentPage;
