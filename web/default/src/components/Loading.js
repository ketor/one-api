import React from 'react';

const Loading = ({ prompt: name = 'page' }) => {
  return (
    <div className='flex items-center justify-center' style={{ height: 100 }}>
      <div className='flex flex-col items-center gap-2'>
        <div className='h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent' />
        <span className='text-sm text-muted-foreground'>加载{name}中...</span>
      </div>
    </div>
  );
};

export default Loading;
