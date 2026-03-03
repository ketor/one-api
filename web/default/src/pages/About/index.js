import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { API, showError } from '../../helpers';
import { marked } from 'marked';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';

const About = () => {
  const { t } = useTranslation();
  const [about, setAbout] = useState('');
  const [aboutLoaded, setAboutLoaded] = useState(false);

  const displayAbout = async () => {
    setAbout(localStorage.getItem('about') || '');
    const res = await API.get('/api/about');
    const { success, message, data } = res.data;
    if (success) {
      let aboutContent = data;
      if (!data.startsWith('https://')) {
        aboutContent = marked.parse(data);
      }
      setAbout(aboutContent);
      localStorage.setItem('about', aboutContent);
    } else {
      showError(message);
      setAbout(t('about.loading_failed'));
    }
    setAboutLoaded(true);
  };

  useEffect(() => {
    displayAbout().then();
  }, []);

  return (
    <>
      {aboutLoaded && about === '' ? (
        <div className='container mx-auto max-w-5xl py-8 px-4'>
          <Card>
            <CardHeader>
              <CardTitle>{t('about.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{t('about.description')}</p>
              <p className='mt-2'>
                {t('about.repository')}
                <a
                  href='https://github.com/songquanpeng/one-api'
                  className='ml-1 text-primary hover:underline'
                >
                  https://github.com/songquanpeng/one-api
                </a>
              </p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <>
          {about.startsWith('https://') ? (
            <iframe
              src={about}
              style={{ width: '100%', height: '100vh', border: 'none' }}
            />
          ) : (
            <div className='container mx-auto max-w-5xl py-8 px-4'>
              <Card>
                <CardContent className='pt-6'>
                  <div
                    className='prose prose-neutral max-w-none'
                    dangerouslySetInnerHTML={{ __html: about }}
                  />
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </>
  );
};

export default About;
