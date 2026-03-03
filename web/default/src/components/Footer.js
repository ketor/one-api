import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getFooterHTML, getSystemName } from '../helpers';

const Footer = () => {
  const { t } = useTranslation();
  const systemName = getSystemName();
  const [footer, setFooter] = useState(getFooterHTML());
  let remainCheckTimes = 5;

  const loadFooter = () => {
    let footer_html = localStorage.getItem('footer_html');
    if (footer_html) {
      setFooter(footer_html);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      if (remainCheckTimes <= 0) {
        clearInterval(timer);
        return;
      }
      remainCheckTimes--;
      loadFooter();
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className='border-t py-4'>
      <div className='container mx-auto text-center text-muted-foreground'>
        {footer ? (
          <div
            className='text-sm'
            dangerouslySetInnerHTML={{ __html: footer }}
          ></div>
        ) : (
          <div className='text-sm'>
            <a href='https://github.com/songquanpeng/one-api' target='_blank' rel='noreferrer'>
              {systemName} {process.env.REACT_APP_VERSION}{' '}
            </a>
            {t('footer.built_by')}{' '}
            <a href='https://github.com/songquanpeng' target='_blank' rel='noreferrer'>
              {t('footer.built_by_name')}
            </a>{' '}
            {t('footer.license')}{' '}
            <a href='https://opensource.org/licenses/mit-license.php'>
              {t('footer.mit')}
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default Footer;
