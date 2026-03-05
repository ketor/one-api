import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { API, getLogo, showError, showInfo, showSuccess } from '../helpers';
import { Button } from './ui/button';
import { Input } from './ui/input';
import Turnstile from 'react-turnstile';

const PasswordResetForm = () => {
  const { t } = useTranslation();
  const [inputs, setInputs] = useState({
    email: '',
  });
  const { email } = inputs;
  const [loading, setLoading] = useState(false);
  const [turnstileEnabled, setTurnstileEnabled] = useState(false);
  const [turnstileSiteKey, setTurnstileSiteKey] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [disableButton, setDisableButton] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const logo = getLogo();

  useEffect(() => {
    let status = localStorage.getItem('status');
    if (status) {
      status = JSON.parse(status);
      if (status.turnstile_check) {
        setTurnstileEnabled(true);
        setTurnstileSiteKey(status.turnstile_site_key);
      }
    }
  }, []);

  useEffect(() => {
    let countdownInterval = null;
    if (disableButton && countdown > 0) {
      countdownInterval = setInterval(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else if (countdown === 0) {
      setDisableButton(false);
      setCountdown(30);
    }
    return () => clearInterval(countdownInterval);
  }, [disableButton, countdown]);

  function handleChange(e) {
    const { name, value } = e.target;
    setInputs((inputs) => ({ ...inputs, [name]: value }));
  }

  async function handleSubmit(e) {
    setDisableButton(true);
    if (!email) return;
    if (turnstileEnabled && turnstileToken === '') {
      showInfo(t('messages.error.turnstile_wait'));
      return;
    }
    setLoading(true);
    const res = await API.get(
      `/api/reset_password?email=${email}&turnstile=${turnstileToken}`
    );
    const { success, message } = res.data;
    if (success) {
      showSuccess(t('auth.reset.notice'));
      setInputs({ ...inputs, email: '' });
    } else {
      showError(message);
      setDisableButton(false);
      setCountdown(30);
    }
    setLoading(false);
  }

  return (
    <div className='space-y-6'>
      <div className='flex flex-col items-center space-y-2'>
        {logo && <img src={logo} alt='logo' className='h-10' />}
        <h2 className='text-2xl font-semibold tracking-tight'>
          {t('auth.reset.title')}
        </h2>
      </div>
      <form className='space-y-4' onSubmit={(e) => { e.preventDefault(); handleSubmit(e); }}>
        <Input
          placeholder={t('auth.reset.email')}
          name='email'
          value={email}
          onChange={handleChange}
        />
        {turnstileEnabled && (
          <div className='flex justify-center'>
            <Turnstile
              sitekey={turnstileSiteKey}
              onVerify={(token) => {
                setTurnstileToken(token);
              }}
            />
          </div>
        )}
        <Button
          type='submit'
          className='w-full'
          disabled={loading || disableButton}
        >
          {disableButton
            ? t('auth.register.get_code_retry', { countdown })
            : t('auth.reset.button')}
        </Button>
      </form>
      <p className='text-center text-sm text-muted-foreground'>
        {t('auth.reset.notice')}
      </p>
    </div>
  );
};

export default PasswordResetForm;
