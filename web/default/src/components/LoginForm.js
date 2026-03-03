import React, { useContext, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { UserContext } from '../context/User';
import { API, getLogo, showError, showSuccess, showWarning } from '../helpers';
import { onGitHubOAuthClicked, onLarkOAuthClicked } from './utils';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Github } from 'lucide-react';
import larkIcon from '../images/lark.svg';

const LoginForm = () => {
  const { t } = useTranslation();
  const [inputs, setInputs] = useState({
    username: '',
    password: '',
    wechat_verification_code: '',
  });
  const [searchParams] = useSearchParams();
  const [submitted, setSubmitted] = useState(false);
  const { username, password } = inputs;
  const [userState, userDispatch] = useContext(UserContext);
  let navigate = useNavigate();
  const [status, setStatus] = useState({});
  const logo = getLogo();

  useEffect(() => {
    if (searchParams.get('expired')) {
      showError(t('messages.error.login_expired'));
    }
    let status = localStorage.getItem('status');
    if (status) {
      status = JSON.parse(status);
      setStatus(status);
    }
  }, []);

  const [showWeChatLoginModal, setShowWeChatLoginModal] = useState(false);

  const onWeChatLoginClicked = () => {
    setShowWeChatLoginModal(true);
  };

  const onSubmitWeChatVerificationCode = async () => {
    const res = await API.get(
      `/api/oauth/wechat?code=${inputs.wechat_verification_code}`
    );
    const { success, message, data } = res.data;
    if (success) {
      userDispatch({ type: 'login', payload: data });
      localStorage.setItem('user', JSON.stringify(data));
      navigate('/');
      showSuccess(t('messages.success.login'));
      setShowWeChatLoginModal(false);
    } else {
      showError(message);
    }
  };

  function handleChange(e) {
    const { name, value } = e.target;
    setInputs((inputs) => ({ ...inputs, [name]: value }));
  }

  async function handleSubmit(e) {
    setSubmitted(true);
    if (username && password) {
      const res = await API.post(`/api/user/login`, {
        username,
        password,
      });
      const { success, message, data } = res.data;
      if (success) {
        userDispatch({ type: 'login', payload: data });
        localStorage.setItem('user', JSON.stringify(data));
        if (username === 'root' && password === '123456') {
          navigate('/user/edit');
          showSuccess(t('messages.success.login'));
          showWarning(t('messages.error.root_password'));
        } else {
          navigate('/token');
          showSuccess(t('messages.success.login'));
        }
      } else {
        showError(message);
      }
    }
  }

  return (
    <div className='space-y-6'>
      <div className='flex flex-col items-center space-y-2'>
        {logo && <img src={logo} alt='logo' className='h-10' />}
        <h2 className='text-2xl font-semibold tracking-tight'>
          {t('auth.login.title')}
        </h2>
      </div>
      <form className='space-y-4' onSubmit={(e) => { e.preventDefault(); handleSubmit(e); }}>
        <div className='space-y-2'>
          <Input
            placeholder={t('auth.login.username')}
            name='username'
            value={username}
            onChange={handleChange}
          />
        </div>
        <div className='space-y-2'>
          <Input
            placeholder={t('auth.login.password')}
            name='password'
            type='password'
            value={password}
            onChange={handleChange}
          />
        </div>
        <Button type='submit' className='w-full'>
          {t('auth.login.button')}
        </Button>
      </form>

      <Separator />
      <div className='flex items-center justify-between text-sm text-muted-foreground'>
        <div>
          {t('auth.login.forgot_password')}
          <Link to='/reset' className='ml-1 text-primary hover:underline'>
            {t('auth.login.reset_password')}
          </Link>
        </div>
        <div>
          {t('auth.login.no_account')}
          <Link to='/register' className='ml-1 text-primary hover:underline'>
            {t('auth.login.register')}
          </Link>
        </div>
      </div>

      {(status.github_oauth || status.wechat_login || status.lark_client_id) && (
        <>
          <div className='relative'>
            <div className='absolute inset-0 flex items-center'>
              <Separator />
            </div>
            <div className='relative flex justify-center text-xs uppercase'>
              <span className='bg-card px-2 text-muted-foreground'>
                {t('auth.login.other_methods')}
              </span>
            </div>
          </div>
          <div className='flex justify-center gap-3'>
            {status.github_oauth && (
              <Button
                variant='outline'
                size='icon'
                className='rounded-full'
                onClick={() => onGitHubOAuthClicked(status.github_client_id)}
              >
                <Github className='h-4 w-4' />
              </Button>
            )}
            {status.wechat_login && (
              <Button
                variant='outline'
                size='icon'
                className='rounded-full'
                onClick={onWeChatLoginClicked}
              >
                <svg viewBox='0 0 24 24' className='h-4 w-4 fill-current'>
                  <path d='M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 0 1-.023-.156.49.49 0 0 1 .201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-6.656-6.088V8.89c-.135-.007-.27-.018-.407-.033zm-2.53 3.274c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.97-.982z' />
                </svg>
              </Button>
            )}
            {status.lark_client_id && (
              <Button
                variant='outline'
                size='icon'
                className='rounded-full'
                onClick={() => onLarkOAuthClicked(status.lark_client_id)}
              >
                <img src={larkIcon} alt='Lark' className='h-4 w-4' />
              </Button>
            )}
          </div>
        </>
      )}

      <Dialog open={showWeChatLoginModal} onOpenChange={setShowWeChatLoginModal}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>{t('auth.login.wechat.scan_tip')}</DialogTitle>
          </DialogHeader>
          <div className='space-y-4'>
            {status.wechat_qrcode && (
              <img src={status.wechat_qrcode} alt='WeChat QR Code' className='w-full' />
            )}
            <Input
              placeholder={t('auth.login.wechat.code_placeholder')}
              name='wechat_verification_code'
              value={inputs.wechat_verification_code}
              onChange={handleChange}
            />
            <Button className='w-full' onClick={onSubmitWeChatVerificationCode}>
              {t('auth.login.button')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LoginForm;
