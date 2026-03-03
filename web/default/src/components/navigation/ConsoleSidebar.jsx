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

const sidebarItems = [
  { name: '数据看板', to: '/dashboard', icon: LayoutDashboard },
  { name: 'API 密钥', to: '/keys', icon: Key },
  { name: '订阅管理', to: '/subscription', icon: CreditCard },
  { name: '用量统计', to: '/usage', icon: BarChart3 },
  { name: '账单记录', to: '/billing', icon: Receipt },
  { name: '加油包', to: '/booster', icon: Rocket },
  { name: '设置', to: '/settings', icon: Settings },
];

const adminSidebarItems = [
  { name: '数据看板', to: '/admin/dashboard', icon: LayoutDashboard },
  { name: '用户管理', to: '/user', icon: Users },
  { name: '渠道管理', to: '/channel', icon: Network },
  { name: '兑换码', to: '/redemption', icon: Ticket },
  { name: '日志', to: '/log', icon: FileText },
  { name: '系统设置', to: '/setting', icon: Wrench },
];

export const SidebarNav = ({ className }) => {
  const location = useLocation();
  const userIsAdmin = isAdmin();

  return (
    <nav className={cn('flex flex-col gap-1', className)}>
      {sidebarItems.map((item) => {
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
            {item.name}
          </Link>
        );
      })}
      {userIsAdmin && (
        <>
          <div className='my-2 border-t' />
          <div className='flex items-center gap-2 px-3 py-1'>
            <Shield className='h-4 w-4 text-muted-foreground' />
            <span className='text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
              管理后台
            </span>
          </div>
          {adminSidebarItems.map((item) => {
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
                {item.name}
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

  useEffect(() => {
    API.get('/api/subscription/self')
      .then((res) => {
        if (res.data.success && res.data.data) {
          setPlanName(res.data.data.plan_name || '免费版');
        } else {
          setPlanName('免费版');
        }
      })
      .catch(() => {
        setPlanName('免费版');
      });
  }, []);

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
            当前套餐
          </p>
          <p className='text-sm font-semibold'>{planName || '加载中...'}</p>
          <Button variant='outline' size='sm' className='mt-2 w-full' asChild>
            <Link to='/subscription'>升级套餐</Link>
          </Button>
        </div>
      </div>
    </aside>
  );
};

export default ConsoleSidebar;
