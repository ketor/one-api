import React from 'react';
import { Outlet } from 'react-router-dom';
import { Button } from '../ui/button';
import { Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const AuthLayout = () => {
  const { t, i18n } = useTranslation();
  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'zh' ? 'en' : 'zh');
  };

  return (
    <div className='relative flex min-h-screen flex-col items-center justify-center bg-muted/40 px-4'>
      <div className='absolute top-4 right-4'>
        <Button variant='ghost' size='sm' onClick={toggleLanguage} className='gap-1'>
          <Globe className='h-4 w-4' />
          <span className='text-xs'>{i18n.language === 'zh' ? 'EN' : '中文'}</span>
        </Button>
      </div>
      <div className='w-full max-w-md'>
        <div className='rounded-xl border bg-card p-6 shadow-sm'>
          <Outlet />
        </div>
      </div>
      <p className='mt-6 text-center text-sm text-muted-foreground'>
        &copy; {new Date().getFullYear()} {t('auth.copyright')}
      </p>
    </div>
  );
};

export default AuthLayout;
