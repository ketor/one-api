import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet';
import { Menu } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const docsSidebarItemKeys = [
  { key: 'docs.sidebar.quick_start', to: '/docs' },
  { key: 'docs.sidebar.api_docs', to: '/docs/api' },
  { key: 'docs.sidebar.sdk', to: '/docs/sdk' },
  { key: 'docs.sidebar.tools', to: '/docs/tools' },
  { key: 'docs.sidebar.billing', to: '/docs/billing' },
  { key: 'docs.sidebar.errors', to: '/docs/errors' },
  { key: 'docs.sidebar.faq', to: '/docs/faq' },
];

const DocsSidebarNav = ({ className }) => {
  const location = useLocation();
  const { t } = useTranslation();

  return (
    <nav className={cn('flex flex-col gap-1', className)}>
      {docsSidebarItemKeys.map((item) => {
        const isActive = location.pathname === item.to;
        return (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              'rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent',
              isActive
                ? 'bg-accent text-accent-foreground font-medium'
                : 'text-muted-foreground'
            )}
          >
            {t(item.key)}
          </Link>
        );
      })}
    </nav>
  );
};

const DocsLayout = () => {
  const { t } = useTranslation();

  return (
    <div className='flex min-h-screen flex-col'>
      {/* Header */}
      <header className='sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
        <div className='container mx-auto flex h-14 max-w-screen-xl items-center px-4'>
          <Link to='/' className='mr-6 flex items-center space-x-2'>
            <span className='text-xl font-bold'>Alaya Code</span>
          </Link>
          <nav className='hidden md:flex items-center space-x-6 text-sm font-medium'>
            <Link
              to='/docs'
              className='transition-colors text-foreground'
            >
              {t('nav.docs')}
            </Link>
          </nav>
          <div className='ml-auto flex items-center space-x-2'>
            <Button variant='ghost' size='sm' asChild>
              <Link to='/login'>{t('nav.login')}</Link>
            </Button>
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant='outline' size='icon' className='shrink-0 md:hidden ml-2'>
                <Menu className='h-5 w-5' />
              </Button>
            </SheetTrigger>
            <SheetContent side='left'>
              <div className='mt-6'>
                <DocsSidebarNav />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>
      {/* Content */}
      <div className='container mx-auto flex max-w-screen-xl flex-1 px-4'>
        {/* Desktop sidebar */}
        <aside className='hidden md:block md:w-64 md:shrink-0 md:border-r md:pr-6 md:pt-6'>
          <DocsSidebarNav />
        </aside>
        {/* Main content */}
        <main className='flex-1 py-6 md:pl-6'>
          <div className='prose prose-neutral max-w-none'>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DocsLayout;
