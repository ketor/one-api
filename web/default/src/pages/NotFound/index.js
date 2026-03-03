import React from 'react';

const NotFound = () => (
  <div className='flex items-center justify-center py-20'>
    <div className='rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center'>
      <h2 className='text-lg font-semibold text-destructive'>页面不存在</h2>
      <p className='mt-2 text-sm text-muted-foreground'>请检查你的浏览器地址是否正确</p>
    </div>
  </div>
);

export default NotFound;
