import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { API, copy, getLogo, showError, showNotice } from '../helpers';
import { useSearchParams } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';

const PasswordResetConfirm = () => {
  const { t } = useTranslation();
  const [inputs, setInputs] = useState({
    email: '',
    token: '',
  });
  const { email, token } = inputs;
  const [loading, setLoading] = useState(false);
  const [disableButton, setDisableButton] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const logo = getLogo();
  const [countdown, setCountdown] = useState(30);

  const [searchParams] = useSearchParams();
  useEffect(() => {
    let token = searchParams.get('token');
    let email = searchParams.get('email');
    setInputs({ token, email });
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

  async function handleSubmit(e) {
    setDisableButton(true);
    if (!email) return;
    setLoading(true);
    const res = await API.post(`/api/user/reset`, { email, token });
    const { success, message } = res.data;
    if (success) {
      let password = res.data.data;
      setNewPassword(password);
      await copy(password);
      showNotice(t('messages.notice.password_copied', { password }));
    } else {
      showError(message);
    }
    setLoading(false);
  }

  return (
    <div className='space-y-6'>
      <div className='flex flex-col items-center space-y-2'>
        {logo && <img src={logo} alt='logo' className='h-10' />}
        <h2 className='text-2xl font-semibold tracking-tight'>
          {t('auth.reset.confirm.title')}
        </h2>
      </div>
      <form className='space-y-4' onSubmit={(e) => { e.preventDefault(); handleSubmit(e); }}>
        <Input
          placeholder={t('auth.reset.email')}
          name='email'
          value={email}
          readOnly
        />
        {newPassword && (
          <Input
            placeholder={t('auth.reset.confirm.new_password')}
            name='newPassword'
            value={newPassword}
            readOnly
            className='cursor-pointer bg-muted'
            onClick={(e) => {
              e.target.select();
              navigator.clipboard.writeText(newPassword);
              showNotice(t('auth.reset.confirm.notice'));
            }}
          />
        )}
        <Button
          type='submit'
          className='w-full'
          disabled={loading || disableButton}
        >
          {disableButton
            ? t('auth.reset.confirm.button_disabled')
            : t('auth.reset.confirm.button')}
        </Button>
      </form>
      {newPassword && (
        <p className='text-center text-sm text-muted-foreground'>
          {t('auth.reset.confirm.notice')}
        </p>
      )}
    </div>
  );
};

export default PasswordResetConfirm;
