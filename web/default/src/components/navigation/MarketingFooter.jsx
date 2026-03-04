import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const MarketingFooter = () => {
  const { t } = useTranslation();

  return (
    <footer className='bg-xyz-gray-10 border-t border-xyz-white-1'>
      <div className='max-w-xyz mx-auto px-5 py-16'>
        <div className='grid grid-cols-2 gap-8 md:grid-cols-4'>
          <div>
            <h3 className='mb-4 text-xs font-medium text-xyz-white-6 uppercase tracking-wider'>
              {t('marketing_footer.product')}
            </h3>
            <ul className='space-y-3 list-none p-0'>
              <li>
                <Link to='/' className='text-sm font-light text-xyz-white-5 no-underline transition-colors hover:text-white'>
                  {t('marketing_footer.overview')}
                </Link>
              </li>
              <li>
                <Link to='/pricing' className='text-sm font-light text-xyz-white-5 no-underline transition-colors hover:text-white'>
                  {t('marketing_footer.pricing')}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className='mb-4 text-xs font-medium text-xyz-white-6 uppercase tracking-wider'>
              {t('marketing_footer.docs_title')}
            </h3>
            <ul className='space-y-3 list-none p-0'>
              <li>
                <Link to='/docs' className='text-sm font-light text-xyz-white-5 no-underline transition-colors hover:text-white'>
                  {t('marketing_footer.quick_start')}
                </Link>
              </li>
              <li>
                <Link to='/docs/api' className='text-sm font-light text-xyz-white-5 no-underline transition-colors hover:text-white'>
                  {t('marketing_footer.api_docs')}
                </Link>
              </li>
              <li>
                <Link to='/docs/sdk' className='text-sm font-light text-xyz-white-5 no-underline transition-colors hover:text-white'>
                  {t('marketing_footer.sdk_guide')}
                </Link>
              </li>
              <li>
                <Link to='/docs/tools' className='text-sm font-light text-xyz-white-5 no-underline transition-colors hover:text-white'>
                  {t('marketing_footer.tools')}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className='mb-4 text-xs font-medium text-xyz-white-6 uppercase tracking-wider'>
              {t('marketing_footer.legal')}
            </h3>
            <ul className='space-y-3 list-none p-0'>
              <li>
                <Link to='/terms' className='text-sm font-light text-xyz-white-5 no-underline transition-colors hover:text-white'>
                  {t('marketing_footer.terms')}
                </Link>
              </li>
              <li>
                <Link to='/privacy' className='text-sm font-light text-xyz-white-5 no-underline transition-colors hover:text-white'>
                  {t('marketing_footer.privacy')}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className='mb-4 text-xs font-medium text-xyz-white-6 uppercase tracking-wider'>
              {t('marketing_footer.support')}
            </h3>
            <ul className='space-y-3 list-none p-0'>
              <li>
                <Link to='/docs' className='text-sm font-light text-xyz-white-5 no-underline transition-colors hover:text-white'>
                  {t('marketing_footer.help_center')}
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className='mt-16 pt-8 border-t border-xyz-white-1'>
          <p className='text-xs font-light text-xyz-white-4'>
            &copy; {new Date().getFullYear()} {t('marketing_footer.copyright')}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default MarketingFooter;
