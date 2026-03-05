import React from 'react';
import { Outlet } from 'react-router-dom';
import ConsoleSidebar from '../navigation/ConsoleSidebar';
import ConsoleTopBar from '../navigation/ConsoleTopBar';

const ConsoleLayout = () => {
  return (
    <div className='flex min-h-screen'>
      <ConsoleSidebar />
      <div className='flex flex-1 flex-col'>
        <ConsoleTopBar />
        <main className='flex-1 overflow-y-auto p-4 sm:p-6'>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default React.memo(ConsoleLayout);
