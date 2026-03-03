import React, { useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { API, showError, showNotice, timestamp2string } from '../../helpers';
import { StatusContext } from '../../context/Status';
import { marked } from 'marked';
import { UserContext } from '../../context/User';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Info, GitBranch, Github, Clock, Mail, Shield } from 'lucide-react';

const Home = () => {
  const { t } = useTranslation();
  const [statusState] = useContext(StatusContext);
  const [homePageContentLoaded, setHomePageContentLoaded] = useState(false);
  const [homePageContent, setHomePageContent] = useState('');
  const [userState] = useContext(UserContext);

  const displayNotice = async () => {
    const res = await API.get('/api/notice');
    const { success, message, data } = res.data;
    if (success) {
      let oldNotice = localStorage.getItem('notice');
      if (data !== oldNotice && data !== '') {
        const htmlNotice = marked(data);
        showNotice(htmlNotice, true);
        localStorage.setItem('notice', data);
      }
    } else {
      showError(message);
    }
  };

  const displayHomePageContent = async () => {
    setHomePageContent(localStorage.getItem('home_page_content') || '');
    const res = await API.get('/api/home_page_content');
    const { success, message, data } = res.data;
    if (success) {
      let content = data;
      if (!data.startsWith('https://')) {
        content = marked.parse(data);
      }
      setHomePageContent(content);
      localStorage.setItem('home_page_content', content);
    } else {
      showError(message);
      setHomePageContent(t('home.loading_failed'));
    }
    setHomePageContentLoaded(true);
  };

  const getStartTimeString = () => {
    const timestamp = statusState?.status?.start_time;
    return timestamp2string(timestamp);
  };

  useEffect(() => {
    displayNotice().then();
    displayHomePageContent().then();
  }, []);

  const StatusItem = ({ icon: Icon, label, value }) => (
    <div className='flex items-center gap-2'>
      <Icon className='h-4 w-4 text-muted-foreground' />
      <span className='font-medium'>{label}</span>
      <span>{value}</span>
    </div>
  );

  const ConfigItem = ({ icon: Icon, label, enabled }) => (
    <div className='flex items-center gap-2'>
      <Icon className='h-4 w-4 text-muted-foreground' />
      <span className='font-medium'>{label}</span>
      <Badge variant={enabled ? 'default' : 'secondary'}>
        {enabled
          ? t('home.system_status.config.enabled')
          : t('home.system_status.config.disabled')}
      </Badge>
    </div>
  );

  return (
    <>
      {homePageContentLoaded && homePageContent === '' ? (
        <div className='container mx-auto max-w-5xl space-y-6 py-8 px-4'>
          <Card>
            <CardHeader>
              <CardTitle>{t('home.welcome.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className='leading-relaxed'>
                <p>{t('home.welcome.description')}</p>
                {!userState.user && <p className='mt-2'>{t('home.welcome.login_notice')}</p>}
              </CardDescription>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{t('home.system_status.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='grid gap-6 md:grid-cols-2'>
                <Card>
                  <CardHeader>
                    <CardTitle className='text-base'>
                      {t('home.system_status.info.title')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-3'>
                    <StatusItem
                      icon={Info}
                      label={t('home.system_status.info.name')}
                      value={statusState?.status?.system_name}
                    />
                    <StatusItem
                      icon={GitBranch}
                      label={t('home.system_status.info.version')}
                      value={statusState?.status?.version || 'unknown'}
                    />
                    <div className='flex items-center gap-2'>
                      <Github className='h-4 w-4 text-muted-foreground' />
                      <span className='font-medium'>
                        {t('home.system_status.info.source')}
                      </span>
                      <a
                        href='https://github.com/songquanpeng/one-api'
                        target='_blank'
                        rel='noreferrer'
                        className='text-primary hover:underline'
                      >
                        {t('home.system_status.info.source_link')}
                      </a>
                    </div>
                    <StatusItem
                      icon={Clock}
                      label={t('home.system_status.info.start_time')}
                      value={getStartTimeString()}
                    />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className='text-base'>
                      {t('home.system_status.config.title')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-3'>
                    <ConfigItem
                      icon={Mail}
                      label={t('home.system_status.config.email_verify')}
                      enabled={statusState?.status?.email_verification}
                    />
                    <ConfigItem
                      icon={Github}
                      label={t('home.system_status.config.github_oauth')}
                      enabled={statusState?.status?.github_oauth}
                    />
                    <ConfigItem
                      icon={Info}
                      label={t('home.system_status.config.wechat_login')}
                      enabled={statusState?.status?.wechat_login}
                    />
                    <ConfigItem
                      icon={Shield}
                      label={t('home.system_status.config.turnstile')}
                      enabled={statusState?.status?.turnstile_check}
                    />
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <>
          {homePageContent.startsWith('https://') ? (
            <iframe
              src={homePageContent}
              style={{ width: '100%', height: '100vh', border: 'none' }}
            />
          ) : (
            <div
              className='prose prose-neutral mx-auto max-w-5xl py-8 px-4'
              dangerouslySetInnerHTML={{ __html: homePageContent }}
            />
          )}
        </>
      )}
    </>
  );
};

export default Home;
