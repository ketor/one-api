import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
import { Globe, LogOut, Menu } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SidebarNav } from './ConsoleSidebar';
import ThemeToggle from '../ThemeToggle';

const ConsoleTopBar = () => {
  const [userState, userDispatch] = useContext(UserContext);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'zh' ? 'en' : 'zh');
  };

  const logout = async () => {
    await API.get('/api/user/logout');
    showSuccess(t('nav.logout_success'));
    userDispatch({ type: 'logout' });
    localStorage.removeItem('user');
    navigate('/login');
  };

  const username = userState.user?.username || t('nav.user_default');
  const initial = username.charAt(0).toUpperCase();

  return (
    <header className='sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6'>
      <Sheet>
        <SheetTrigger asChild>
          <Button variant='outline' size='icon' className='shrink-0 md:hidden'>
            <Menu className='h-5 w-5' />
            <span className='sr-only'>{t('nav.toggle_menu')}</span>
          </Button>
        </SheetTrigger>
        <SheetContent side='left' className='flex flex-col'>
          <nav className='grid gap-2 text-lg font-medium'>
            <Link to='/' className='flex items-center gap-2 text-lg font-semibold mb-4'>
              <img src='/logo.svg' alt='Alaya Code' className='h-8' />
            </Link>
            <SidebarNav />
          </nav>
        </SheetContent>
      </Sheet>
      <div className='flex-1' />
      <ThemeToggle />
      <Button variant='ghost' size='sm' onClick={toggleLanguage} className='gap-1'>
        <Globe className='h-4 w-4' />
        <span className='text-xs'>{i18n.language === 'zh' ? 'EN' : '中文'}</span>
      </Button>
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
            </div>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={logout}>
            <LogOut className='mr-2 h-4 w-4' />
            <span>{t('nav.logout')}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
};

export default ConsoleTopBar;
