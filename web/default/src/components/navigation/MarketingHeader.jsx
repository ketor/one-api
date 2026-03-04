import React from 'react';
import { Link } from 'react-router-dom';
import { Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MarketingHeader = () => {
  const { t, i18n } = useTranslation();
  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'zh' ? 'en' : 'zh');
  };

  return (
    <header className='fixed top-0 left-0 w-full h-16 flex items-center justify-between px-20 bg-xyz-gray-10 z-[999]'>
      {/* Left: Logo + Nav */}
      <div className='flex items-center gap-20'>
        <Link to='/' className='flex items-center gap-1 no-underline'>
          <img src='/logo.svg' alt='Alaya Code' className='h-11 w-11' />
          <span className='font-mono font-medium text-xl text-white'>
            Alaya Code
          </span>
        </Link>
        <nav className='flex items-center h-16'>
          <Link
            to='/'
            className='font-mono font-light text-xs text-xyz-white-8 no-underline px-6 h-16 flex items-center transition-colors hover:text-white'
          >
            {t('nav.product')}
          </Link>
          <Link
            to='/pricing'
            className='font-mono font-light text-xs text-xyz-white-8 no-underline px-6 h-16 flex items-center transition-colors hover:text-white'
          >
            {t('nav.pricing')}
          </Link>
          <Link
            to='/docs'
            className='font-mono font-light text-xs text-xyz-white-8 no-underline px-6 h-16 flex items-center transition-colors hover:text-white'
          >
            {t('nav.docs')}
          </Link>
        </nav>
      </div>

      {/* Right: Lang + Auth */}
      <div className='flex items-center h-16'>
        <button
          onClick={toggleLanguage}
          className='flex items-center gap-1.5 bg-transparent border-none cursor-pointer text-xyz-white-8 text-sm font-mono font-light px-4 h-full transition-colors hover:text-white'
        >
          <Globe className='h-5 w-5' />
          <span className='text-xs'>{i18n.language === 'zh' ? 'EN' : '中文'}</span>
        </button>
        <Link
          to='/login'
          className='font-mono font-light text-sm text-xyz-white-8 no-underline px-6 h-16 flex items-center transition-colors hover:text-white'
        >
          {t('nav.login')}
        </Link>
        <Link
          to='/register'
          className='font-mono font-light text-sm text-white no-underline bg-xyz-blue-6 w-40 h-16 flex items-center justify-center gap-2 transition-colors hover:bg-[#3451e6]'
        >
          {t('nav.register')}
          <svg width='14' height='12' viewBox='0 0 14 12' fill='none' className='rotate-[-45deg]'>
            <path d='M1 6H13M13 6L8 1M13 6L8 11' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round'/>
          </svg>
        </Link>
      </div>
    </header>
  );
};

export default MarketingHeader;
