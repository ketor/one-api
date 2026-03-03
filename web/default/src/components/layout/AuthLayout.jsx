import React from 'react';
import { Link, Outlet } from 'react-router-dom';

const AuthLayout = () => {
  return (
    <div className='flex min-h-screen flex-col items-center justify-center bg-muted/40 px-4'>
      <div className='mb-8'>
        <Link to='/' className='flex items-center space-x-2'>
          <span className='text-2xl font-bold'>Alaya Code</span>
        </Link>
      </div>
      <div className='w-full max-w-md'>
        <div className='rounded-xl border bg-card p-6 shadow-sm'>
          <Outlet />
        </div>
      </div>
      <p className='mt-6 text-center text-sm text-muted-foreground'>
        &copy; {new Date().getFullYear()} 九章云极 DataCanvas. All rights reserved.
      </p>
    </div>
  );
};

export default AuthLayout;
