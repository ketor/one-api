import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { API, getLogo, showError, showInfo, showSuccess } from '../helpers';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Separator } from './ui/separator';
import Turnstile from 'react-turnstile';

const RegisterForm = () => {
  const { t } = useTranslation();
  const [inputs, setInputs] = useState({
    username: '',
    password: '',
    password2: '',
    email: '',
    verification_code: '',
  });
  const { username, password, password2 } = inputs;
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [turnstileEnabled, setTurnstileEnabled] = useState(false);
  const [turnstileSiteKey, setTurnstileSiteKey] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [disableButton, setDisableButton] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const logo = getLogo();
  let affCode = new URLSearchParams(window.location.search).get('aff');
  if (affCode) {
    localStorage.setItem('aff', affCode);
  }

  useEffect(() => {
    let status = localStorage.getItem('status');
    if (status) {
      status = JSON.parse(status);
      setShowEmailVerification(status.email_verification);
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

  let navigate = useNavigate();

  function handleChange(e) {
    const { name, value } = e.target;
    setInputs((inputs) => ({ ...inputs, [name]: value }));
  }

  async function handleSubmit(e) {
    if (password.length < 8) {
      showInfo(t('messages.error.password_length'));
      return;
    }
    if (password !== password2) {
      showInfo(t('messages.error.password_mismatch'));
      return;
    }
    if (username && password) {
      if (turnstileEnabled && turnstileToken === '') {
        showInfo(t('messages.error.turnstile_wait'));
        return;
      }
      setLoading(true);
      if (!affCode) {
        affCode = localStorage.getItem('aff');
      }
      inputs.aff_code = affCode;
      const res = await API.post(
        `/api/user/register?turnstile=${turnstileToken}`,
        inputs
      );
      const { success, message } = res.data;
      if (success) {
        navigate('/login');
        showSuccess(t('messages.success.register'));
      } else {
        showError(message);
      }
      setLoading(false);
    }
  }

  const sendVerificationCode = async () => {
    if (inputs.email === '') return;
    if (turnstileEnabled && turnstileToken === '') {
      showInfo(t('messages.error.turnstile_wait'));
      return;
    }
    setDisableButton(true);
    setLoading(true);
    const res = await API.get(
      `/api/verification?email=${inputs.email}&turnstile=${turnstileToken}`
    );
    const { success, message } = res.data;
    if (success) {
      showSuccess(t('messages.success.verification_code'));
    } else {
      showError(message);
      setDisableButton(false);
      setCountdown(30);
    }
    setLoading(false);
  };

  return (
    <div className='space-y-6'>
      <div className='flex flex-col items-center space-y-2'>
        {logo && <img src={logo} alt='logo' className='h-10' />}
        <h2 className='text-2xl font-semibold tracking-tight'>
          {t('auth.register.title')}
        </h2>
      </div>
      <form className='space-y-4' onSubmit={(e) => { e.preventDefault(); handleSubmit(e); }}>
        <Input
          placeholder={t('auth.register.username')}
          onChange={handleChange}
          name='username'
        />
        <Input
          placeholder={t('auth.register.password')}
          onChange={handleChange}
          name='password'
          type='password'
        />
        <Input
          placeholder={t('auth.register.confirm_password')}
          onChange={handleChange}
          name='password2'
          type='password'
        />

        {showEmailVerification && (
          <>
            <div className='flex gap-2'>
              <Input
                placeholder={t('auth.register.email')}
                onChange={handleChange}
                name='email'
                type='email'
                className='flex-1'
              />
              <Button
                type='button'
                variant='outline'
                onClick={sendVerificationCode}
                disabled={loading || disableButton}
              >
                {disableButton
                  ? t('auth.register.get_code_retry', { countdown })
                  : t('auth.register.get_code')}
              </Button>
            </div>
            <Input
              placeholder={t('auth.register.verification_code')}
              onChange={handleChange}
              name='verification_code'
            />
          </>
        )}

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
          disabled={loading}
        >
          {loading ? t('auth.register.registering', '注册中...') : t('auth.register.button')}
        </Button>
      </form>

      <Separator />
      <div className='text-center text-sm text-muted-foreground'>
        {t('auth.register.has_account')}
        <Link to='/login' className='ml-1 text-primary hover:underline'>
          {t('auth.register.login')}
        </Link>
      </div>
    </div>
  );
};

export default RegisterForm;
