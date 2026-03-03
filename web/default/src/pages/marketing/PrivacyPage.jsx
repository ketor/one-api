import React from 'react';
import { useTranslation } from 'react-i18next';

const PrivacyPage = () => {
  const { t } = useTranslation();

  return (
    <div className='container mx-auto max-w-screen-md px-4 py-12'>
      <h1 className='text-3xl font-bold mb-2'>{t('privacy.title')}</h1>
      <p className='text-sm text-muted-foreground mb-8'>
        {t('privacy.last_updated')}
      </p>

      <div className='prose prose-sm max-w-none space-y-6'>
        <section>
          <h2 className='text-xl font-semibold mb-3'>{t('privacy.s1_title')}</h2>
          <p className='text-muted-foreground leading-relaxed'>{t('privacy.s1_p1')}</p>
        </section>

        <section>
          <h2 className='text-xl font-semibold mb-3'>{t('privacy.s2_title')}</h2>
          <p className='text-muted-foreground leading-relaxed'>{t('privacy.s2_p1')}</p>
          <ul className='list-disc pl-6 text-muted-foreground space-y-1 mt-2'>
            <li>{t('privacy.s2_li1')}</li>
            <li>{t('privacy.s2_li2')}</li>
            <li>{t('privacy.s2_li3')}</li>
            <li>{t('privacy.s2_li4')}</li>
          </ul>
        </section>

        <section>
          <h2 className='text-xl font-semibold mb-3'>{t('privacy.s3_title')}</h2>
          <p className='text-muted-foreground leading-relaxed'>{t('privacy.s3_p1')}</p>
          <ul className='list-disc pl-6 text-muted-foreground space-y-1 mt-2'>
            <li>{t('privacy.s3_li1')}</li>
            <li>{t('privacy.s3_li2')}</li>
            <li>{t('privacy.s3_li3')}</li>
            <li>{t('privacy.s3_li4')}</li>
          </ul>
        </section>

        <section>
          <h2 className='text-xl font-semibold mb-3'>{t('privacy.s4_title')}</h2>
          <p className='text-muted-foreground leading-relaxed'>{t('privacy.s4_p1')}</p>
          <p className='text-muted-foreground leading-relaxed mt-2'>{t('privacy.s4_p2')}</p>
        </section>

        <section>
          <h2 className='text-xl font-semibold mb-3'>{t('privacy.s5_title')}</h2>
          <p className='text-muted-foreground leading-relaxed'>{t('privacy.s5_p1')}</p>
        </section>

        <section>
          <h2 className='text-xl font-semibold mb-3'>{t('privacy.s6_title')}</h2>
          <p className='text-muted-foreground leading-relaxed'>{t('privacy.s6_p1')}</p>
        </section>

        <section>
          <h2 className='text-xl font-semibold mb-3'>{t('privacy.s7_title')}</h2>
          <p className='text-muted-foreground leading-relaxed'>{t('privacy.s7_p1')}</p>
          <ul className='list-disc pl-6 text-muted-foreground space-y-1 mt-2'>
            <li>{t('privacy.s7_li1')}</li>
            <li>{t('privacy.s7_li2')}</li>
            <li>{t('privacy.s7_li3')}</li>
            <li>{t('privacy.s7_li4')}</li>
          </ul>
        </section>

        <section>
          <h2 className='text-xl font-semibold mb-3'>{t('privacy.s8_title')}</h2>
          <p className='text-muted-foreground leading-relaxed'>{t('privacy.s8_p1')}</p>
        </section>

        <section>
          <h2 className='text-xl font-semibold mb-3'>{t('privacy.s9_title')}</h2>
          <p className='text-muted-foreground leading-relaxed'>{t('privacy.s9_p1')}</p>
        </section>

        <section>
          <h2 className='text-xl font-semibold mb-3'>{t('privacy.s10_title')}</h2>
          <p className='text-muted-foreground leading-relaxed'>{t('privacy.s10_p1')}</p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPage;
