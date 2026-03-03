import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '../ui/button';
import {
  LayoutDashboard,
  Key,
  CreditCard,
  BarChart3,
  Receipt,
  Rocket,
  Settings,
  Shield,
  Users,
  Network,
  Ticket,
  Wrench,
  FileText,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { API, isAdmin } from '../../helpers';
import { useTranslation } from 'react-i18next';

const sidebarItemKeys = [
  { key: 'nav.sidebar.dashboard', to: '/dashboard', icon: LayoutDashboard },
  { key: 'nav.sidebar.api_keys', to: '/keys', icon: Key },
  { key: 'nav.sidebar.subscription', to: '/subscription', icon: CreditCard },
  { key: 'nav.sidebar.usage', to: '/usage', icon: BarChart3 },
  { key: 'nav.sidebar.billing', to: '/billing', icon: Receipt },
  { key: 'nav.sidebar.booster', to: '/booster', icon: Rocket },
  { key: 'nav.sidebar.settings', to: '/settings', icon: Settings },
];

const adminSidebarItemKeys = [
  { key: 'nav.sidebar.admin_dashboard', to: '/admin/dashboard', icon: LayoutDashboard },
  { key: 'nav.sidebar.user_management', to: '/user', icon: Users },
  { key: 'nav.sidebar.plan_management', to: '/admin/plans', icon: CreditCard },
  { key: 'nav.sidebar.channel_management', to: '/channel', icon: Network },
  { key: 'nav.sidebar.redemption', to: '/redemption', icon: Ticket },
  { key: 'nav.sidebar.logs', to: '/log', icon: FileText },
  { key: 'nav.sidebar.system_settings', to: '/setting', icon: Wrench },
];

export const SidebarNav = ({ className }) => {
  const location = useLocation();
  const userIsAdmin = isAdmin();
  const { t } = useTranslation();

  return (
    <nav className={cn('flex flex-col gap-1', className)}>
      {sidebarItemKeys.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.to;
        return (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent',
              isActive
                ? 'bg-accent text-accent-foreground font-medium'
                : 'text-muted-foreground'
            )}
          >
            <Icon className='h-4 w-4' />
            {t(item.key)}
          </Link>
        );
      })}
      {userIsAdmin && (
        <>
          <div className='my-2 border-t' />
          <div className='flex items-center gap-2 px-3 py-1'>
            <Shield className='h-4 w-4 text-muted-foreground' />
            <span className='text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
              {t('nav.sidebar.admin_section')}
            </span>
          </div>
          {adminSidebarItemKeys.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent',
                  isActive
                    ? 'bg-accent text-accent-foreground font-medium'
                    : 'text-muted-foreground'
                )}
              >
                <Icon className='h-4 w-4' />
                {t(item.key)}
              </Link>
            );
          })}
        </>
      )}
    </nav>
  );
};

const ConsoleSidebar = () => {
  const [planName, setPlanName] = useState('');
  const { t } = useTranslation();

  useEffect(() => {
    API.get('/api/subscription/self')
      .then((res) => {
        if (res.data.success && res.data.data) {
          setPlanName(res.data.data.plan_name || t('nav.sidebar.free_plan'));
        } else {
          setPlanName(t('nav.sidebar.free_plan'));
        }
      })
      .catch(() => {
        setPlanName(t('nav.sidebar.free_plan'));
      });
  }, [t]);

  return (
    <aside className='hidden md:flex md:w-64 md:flex-col md:border-r bg-sidebar-background'>
      <div className='flex h-14 items-center border-b px-4'>
        <Link to='/' className='flex items-center gap-2 font-semibold'>
          <span>Alaya Code</span>
        </Link>
      </div>
      <div className='flex-1 overflow-y-auto p-4'>
        <SidebarNav />
      </div>
      <div className='border-t p-4'>
        <div className='rounded-lg bg-muted p-3'>
          <p className='text-xs font-medium text-muted-foreground'>
            {t('nav.sidebar.current_plan')}
          </p>
          <p className='text-sm font-semibold'>{planName || t('nav.sidebar.loading')}</p>
          <Button variant='outline' size='sm' className='mt-2 w-full' asChild>
            <Link to='/subscription'>{t('nav.sidebar.upgrade')}</Link>
          </Button>
        </div>
      </div>
    </aside>
  );
};

export default ConsoleSidebar;
