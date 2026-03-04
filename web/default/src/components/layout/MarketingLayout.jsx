import React from 'react';
import { Outlet } from 'react-router-dom';
import MarketingHeader from '../navigation/MarketingHeader';
import MarketingFooter from '../navigation/MarketingFooter';

const MarketingLayout = () => {
  return (
    <div className='flex min-h-screen flex-col bg-xyz-gray-10'>
      <MarketingHeader />
      <main className='flex-1 pt-16'>
        <Outlet />
      </main>
      <MarketingFooter />
    </div>
  );
};

export default MarketingLayout;
