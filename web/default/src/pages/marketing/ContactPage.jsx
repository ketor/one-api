import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle, Mail, Clock, MessageSquare } from 'lucide-react';
import { API, showError } from '../../helpers';
import { FadeIn, BlurText } from '../../components/animations';

const ContactPage = () => {
  const { t } = useTranslation();
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.message.trim()) {
      showError(t('contact.validation_required'));
      return;
    }
    setSubmitting(true);
    try {
      const res = await API.post('/api/contact', form);
      if (res.data.success) {
        setSubmitted(true);
      } else {
        showError(res.data.message);
      }
    } catch (err) {
      showError(err.message);
    }
    setSubmitting(false);
  };

  if (submitted) {
    return (
      <div className='xyz-section-light'>
        <div className='max-w-xyz mx-auto'>
          <div className='xyz-section-light-inner px-5 py-32 flex flex-col items-center'>
            <CheckCircle className='h-16 w-16 text-green-500 mb-4' />
            <h2 className='text-2xl font-medium text-xyz-gray-10 mb-2'>{t('contact.success_title')}</h2>
            <p className='text-sm text-xyz-gray-6'>{t('contact.success')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='flex flex-col'>
      {/* Hero */}
      <section className='xyz-section-light py-20'>
        <div className='max-w-xyz mx-auto px-5 text-center'>
          <h1 className='text-[64px] font-medium leading-[76px] text-xyz-gray-10 mb-4'>
            <BlurText
              text={t('contact.title')}
              delay={80}
              animateBy='words'
              direction='bottom'
              className='justify-center'
              animationFrom={{ filter: 'blur(10px)', opacity: 0, y: 30 }}
              animationTo={[
                { filter: 'blur(5px)', opacity: 0.5, y: -5 },
                { filter: 'blur(0px)', opacity: 1, y: 0 },
              ]}
            />
          </h1>
          <FadeIn delay={0.3} distance={15}>
            <p className='text-xl font-light text-xyz-gray-6 max-w-2xl mx-auto'>
              {t('contact.subtitle')}
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Contact form + info */}
      <section className='bg-xyz-gray-10'>
        <div className='max-w-xyz mx-auto'>
          <div className='xyz-section-inner px-5 py-20'>
            <div className='grid md:grid-cols-2 gap-16 max-w-4xl mx-auto'>
              {/* Left: Form */}
              <FadeIn delay={0.1} direction='left' distance={30}>
                <form onSubmit={handleSubmit} className='space-y-5'>
                  <div>
                    <label className='block text-sm font-light text-xyz-white-6 mb-1.5'>{t('contact.name')} *</label>
                    <input
                      name='name'
                      value={form.name}
                      onChange={handleChange}
                      required
                      className='w-full h-10 px-3 bg-transparent border border-xyz-white-2 text-white text-sm font-light focus:border-xyz-blue-6 focus:outline-none transition-colors'
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-light text-xyz-white-6 mb-1.5'>{t('contact.email')}</label>
                    <input
                      name='email'
                      type='email'
                      value={form.email}
                      onChange={handleChange}
                      className='w-full h-10 px-3 bg-transparent border border-xyz-white-2 text-white text-sm font-light focus:border-xyz-blue-6 focus:outline-none transition-colors'
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-light text-xyz-white-6 mb-1.5'>{t('contact.phone')}</label>
                    <input
                      name='phone'
                      value={form.phone}
                      onChange={handleChange}
                      className='w-full h-10 px-3 bg-transparent border border-xyz-white-2 text-white text-sm font-light focus:border-xyz-blue-6 focus:outline-none transition-colors'
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-light text-xyz-white-6 mb-1.5'>{t('contact.message')} *</label>
                    <textarea
                      name='message'
                      value={form.message}
                      onChange={handleChange}
                      required
                      rows={5}
                      className='w-full px-3 py-2 bg-transparent border border-xyz-white-2 text-white text-sm font-light focus:border-xyz-blue-6 focus:outline-none transition-colors resize-none'
                    />
                  </div>
                  <button
                    type='submit'
                    disabled={submitting}
                    className='w-full h-10 bg-xyz-blue-6 text-white text-sm font-light transition-colors hover:bg-[#3451e6] disabled:opacity-50'
                  >
                    {submitting ? t('contact.submitting') : t('contact.submit')}
                  </button>
                </form>
              </FadeIn>

              {/* Right: Contact info */}
              <FadeIn delay={0.2} direction='right' distance={30}>
                <div className='space-y-8'>
                  <div className='flex items-start gap-4'>
                    <MessageSquare className='h-5 w-5 text-xyz-blue-5 mt-0.5 shrink-0' />
                    <div>
                      <h3 className='text-base font-medium text-white mb-1'>{t('contact.wechat_service')}</h3>
                      <p className='text-sm font-light text-xyz-white-5'>{t('contact.wechat_desc')}</p>
                    </div>
                  </div>
                  <div className='flex items-start gap-4'>
                    <Mail className='h-5 w-5 text-xyz-blue-5 mt-0.5 shrink-0' />
                    <div>
                      <h3 className='text-base font-medium text-white mb-1'>{t('contact.email_us')}</h3>
                      <a href='mailto:support@alayanew.com' className='text-sm font-light text-xyz-blue-5 no-underline hover:text-xyz-blue-4'>
                        support@alayanew.com
                      </a>
                    </div>
                  </div>
                  <div className='flex items-start gap-4'>
                    <Clock className='h-5 w-5 text-xyz-blue-5 mt-0.5 shrink-0' />
                    <div>
                      <h3 className='text-base font-medium text-white mb-1'>{t('contact.working_hours')}</h3>
                      <p className='text-sm font-light text-xyz-white-5'>{t('contact.hours_detail')}</p>
                    </div>
                  </div>
                </div>
              </FadeIn>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ContactPage;
