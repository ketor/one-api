import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../ui/button';

const MarketingHeader = () => {
  return (
    <header className='sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
      <div className='container mx-auto flex h-14 max-w-screen-xl items-center px-4'>
        <Link to='/' className='mr-6 flex items-center space-x-2'>
          <span className='text-xl font-bold'>Alaya Code</span>
        </Link>
        <nav className='flex items-center space-x-6 text-sm font-medium'>
          <Link
            to='/'
            className='transition-colors hover:text-foreground/80 text-foreground/60'
          >
            产品
          </Link>
          <Link
            to='/pricing'
            className='transition-colors hover:text-foreground/80 text-foreground/60'
          >
            定价
          </Link>
          <Link
            to='/docs'
            className='transition-colors hover:text-foreground/80 text-foreground/60'
          >
            文档
          </Link>
        </nav>
        <div className='ml-auto flex items-center space-x-2'>
          <Button variant='ghost' size='sm' asChild>
            <Link to='/login'>登录</Link>
          </Button>
          <Button size='sm' asChild>
            <Link to='/register'>注册</Link>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default MarketingHeader;
