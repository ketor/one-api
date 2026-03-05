import React from 'react';
import { useTranslation } from 'react-i18next';

const NotFound = () => {
  const { t } = useTranslation();
  return (
    <div className='flex items-center justify-center py-20'>
      <div className='rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center'>
        <h2 className='text-lg font-semibold text-destructive'>
          {t('not_found.title', '页面不存在')}
        </h2>
        <p className='mt-2 text-sm text-muted-foreground'>
          {t('not_found.description', '请检查你的浏览器地址是否正确')}
        </p>
      </div>
    </div>
  );
};

export default NotFound;
