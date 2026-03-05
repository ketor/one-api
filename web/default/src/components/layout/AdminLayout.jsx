import React, { useContext } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { UserContext } from '../../context/User';
import { API, showSuccess } from '../../helpers';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback } from '../ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet';
import {
  LayoutDashboard,
  Key,
  BarChart3,
  Users,
  Network,
  Ticket,
  Settings,
  LogOut,
  Menu,
  ArrowLeft,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTranslation } from 'react-i18next';

const adminSidebarItemKeys = [
  { key: 'nav.admin.dashboard', to: '/admin/dashboard', icon: LayoutDashboard },
  { key: 'nav.admin.keys_audit', to: '/admin/keys', icon: Key },
  { key: 'nav.admin.usage_monitor', to: '/admin/usage', icon: BarChart3 },
  { key: 'nav.admin.user_management', to: '/admin/users', icon: Users },
  { key: 'nav.admin.channel_management', to: '/admin/channels', icon: Network },
  { key: 'nav.admin.redemption_management', to: '/admin/redemptions', icon: Ticket },
  { key: 'nav.admin.system_settings', to: '/admin/settings', icon: Settings },
];

const AdminSidebarNav = ({ className }) => {
  const location = useLocation();
  const { t } = useTranslation();

  return (
    <nav className={cn('flex flex-col gap-1', className)}>
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
    </nav>
  );
};

const AdminTopBar = () => {
  const [userState, userDispatch] = useContext(UserContext);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const logout = async () => {
    await API.get('/api/user/logout');
    showSuccess(t('messages.success.logout', '注销成功!'));
    userDispatch({ type: 'logout' });
    localStorage.removeItem('user');
    navigate('/login');
  };

  const username = userState.user?.username || 'Admin';
  const initial = username.charAt(0).toUpperCase();

  return (
    <header className='sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6'>
      <Sheet>
        <SheetTrigger asChild>
          <Button variant='outline' size='icon' className='shrink-0 md:hidden'>
            <Menu className='h-5 w-5' />
            <span className='sr-only'>Toggle menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side='left' className='flex flex-col'>
          <nav className='grid gap-2 text-lg font-medium'>
            <Link to='/admin/dashboard' className='flex items-center gap-2 text-lg font-semibold mb-4'>
              <span>{t('nav.admin.title', '管理后台')}</span>
            </Link>
            <AdminSidebarNav />
          </nav>
        </SheetContent>
      </Sheet>
      <Button variant='ghost' size='sm' asChild className='hidden md:inline-flex'>
        <Link to='/dashboard'>
          <ArrowLeft className='mr-2 h-4 w-4' />
          {t('nav.admin.back_to_console', '返回控制台')}
        </Link>
      </Button>
      <div className='flex-1' />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' className='relative h-8 w-8 rounded-full'>
            <Avatar className='h-8 w-8'>
              <AvatarFallback>{initial}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className='w-56' align='end' forceMount>
          <div className='flex items-center justify-start gap-2 p-2'>
            <div className='flex flex-col space-y-1 leading-none'>
              <p className='text-sm font-medium'>{username}</p>
              <p className='text-xs text-muted-foreground'>{t('nav.admin.role', '管理员')}</p>
            </div>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={logout}>
            <LogOut className='mr-2 h-4 w-4' />
            <span>{t('nav.logout', '退出登录')}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
};

const AdminLayout = () => {
  return (
    <div className='flex min-h-screen'>
      {/* Desktop sidebar */}
      <aside className='hidden md:flex md:w-64 md:flex-col md:border-r bg-sidebar-background'>
        <div className='flex h-14 items-center border-b px-4'>
          <Link to='/admin/dashboard' className='flex items-center gap-2 font-semibold'>
            <span>{t('nav.admin.title', '管理后台')}</span>
          </Link>
        </div>
        <div className='flex-1 overflow-y-auto p-4'>
          <AdminSidebarNav />
        </div>
      </aside>
      {/* Main content */}
      <div className='flex flex-1 flex-col'>
        <AdminTopBar />
        <main className='flex-1 overflow-y-auto p-4 sm:p-6'>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
