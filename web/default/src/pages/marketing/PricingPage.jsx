import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { API } from '../../helpers';
import { BlurText, FadeIn, StaggerIn } from '../../components/animations';

const formatPrice = (cents) => {
  const yuan = cents / 100;
  return yuan === 0 ? null : `¥${yuan}`;
};

const buildFeatures = (plan, t) => {
  const features = [];
  if (plan.price_cents_monthly === 0) {
    features.push(t('pricing.plans.lite_f1'));
  } else {
    features.push(t('pricing.plans.pro_f1'));
  }
  features.push(
    `${t('pricing.compare.window_limit')}: ${plan.window_limit_count} ${t('admin.plan.unit_requests')}`
  );
  if (plan.weekly_limit_count > 0) {
    features.push(
      `${t('pricing.compare.weekly_limit')}: ${plan.weekly_limit_count} ${t('admin.plan.unit_requests')}`
    );
  }
  features.push(
    plan.overage_rate_type === 'api'
      ? t('pricing.compare.api_rate')
      : t('pricing.compare.pause')
  );
  if (plan.overage_rate_type === 'api') {
    features.push(t('pricing.plans.pro_f4'));
  }
  return features;
};

const PricingPage = () => {
  const { t } = useTranslation();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await API.get('/api/plan/');
        if (res.data.success) {
          const sorted = (res.data.data || []).sort(
            (a, b) => (a.priority || 0) - (b.priority || 0)
          );
          setPlans(sorted);
        } else {
          setError(res.data.message);
        }
      } catch (err) {
        setError(err.message);
      }
      setLoading(false);
    };
    fetchPlans();
  }, []);

  const planCards = plans.map((plan) => {
    const price = formatPrice(plan.price_cents_monthly);
    const highlighted = plan.name === 'pro';
    return {
      id: plan.id,
      name: plan.display_name || plan.name,
      description: plan.description || '',
      price: price || t('pricing.plans.free'),
      priceSuffix: price ? t('pricing.plans.per_month') : '',
      features: buildFeatures(plan, t),
      cta: price ? t('pricing.plans.get_started') : t('pricing.plans.free_register'),
      highlighted,
    };
  });

  /* Comparison rows */
  const comparisonFeatures = (() => {
    if (plans.length === 0) return [];
    const rows = [];

    const windowRow = { feature: t('pricing.compare.window_limit') };
    plans.forEach((p) => { windowRow[p.name] = `${p.window_limit_count}`; });
    rows.push(windowRow);

    const weeklyRow = { feature: t('pricing.compare.weekly_limit') };
    plans.forEach((p) => { weeklyRow[p.name] = p.weekly_limit_count > 0 ? `${p.weekly_limit_count}` : '-'; });
    rows.push(weeklyRow);

    const overageRow = { feature: t('pricing.compare.overage') };
    plans.forEach((p) => {
      overageRow[p.name] = p.overage_rate_type === 'api' ? t('pricing.compare.api_rate') : t('pricing.compare.pause');
    });
    rows.push(overageRow);

    const capRow = { feature: t('pricing.compare.monthly_cap') };
    plans.forEach((p) => {
      capRow[p.name] = p.overage_rate_type === 'api' ? t('pricing.compare.configurable') : '-';
    });
    rows.push(capRow);

    return rows;
  })();

  const faqs = [
    { question: t('pricing.faq.q1'), answer: t('pricing.faq.a1') },
    { question: t('pricing.faq.q2'), answer: t('pricing.faq.a2') },
    { question: t('pricing.faq.q3'), answer: t('pricing.faq.a3') },
    { question: t('pricing.faq.q4'), answer: t('pricing.faq.a4') },
    { question: t('pricing.faq.q5'), answer: t('pricing.faq.a5') },
  ];

  if (loading) {
    return (
      <div className='flex min-h-[60vh] items-center justify-center xyz-section-light'>
        <Loader2 className='h-8 w-8 animate-spin text-xyz-gray-5' />
      </div>
    );
  }

  if (error) {
    return (
      <div className='flex min-h-[60vh] flex-col items-center justify-center gap-4 xyz-section-light'>
        <p className='text-xyz-gray-6'>{t('admin.plan.load_error')}</p>
        <button
          onClick={() => window.location.reload()}
          className='border border-xyz-gray-4 text-xyz-gray-10 text-sm font-light h-10 px-6 bg-transparent cursor-pointer transition-colors hover:border-xyz-gray-7'
        >
          {t('pricing.retry', '重试')}
        </button>
      </div>
    );
  }

  return (
    <div className='flex flex-col'>

      {/* ══════ Hero (白底 LIGHT) ══════ */}
      <section className='xyz-section-light py-20'>
        <div className='max-w-xyz mx-auto px-5 text-center'>
          <h1 className='text-[64px] font-medium leading-[76px] text-xyz-gray-10 mb-4'>
            <BlurText
              text={t('pricing.hero.title')}
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
              {t('pricing.hero.description')}
            </p>
          </FadeIn>
        </div>
      </section>

      {/* ══════ Plan Cards (深色 DARK) ══════ */}
      <section className='bg-xyz-gray-10'>
        <div className='max-w-xyz mx-auto'>
          <div className='xyz-section-inner px-5 py-20'>
            <StaggerIn
              staggerDelay={0.12}
              direction='up'
              distance={40}
              className={`grid gap-0 ${
                planCards.length <= 2 ? 'md:grid-cols-2' :
                planCards.length === 3 ? 'md:grid-cols-3' :
                'md:grid-cols-2 lg:grid-cols-4'
              }`}
            >
              {planCards.map((plan) => (
                <div
                  key={plan.id}
                  className={`flex flex-col border p-8 transition-all duration-300 ${
                    plan.highlighted
                      ? 'border-xyz-blue-6 bg-[rgba(67,98,255,0.05)]'
                      : 'border-xyz-white-2 hover:border-xyz-white-5'
                  }`}
                >
                  <div className='flex items-center justify-between mb-2'>
                    <h3 className='text-2xl font-medium text-white'>{plan.name}</h3>
                    {plan.highlighted && (
                      <span className='text-xs font-medium text-xyz-blue-5 border border-xyz-blue-6/30 px-2 py-0.5'>
                        {t('pricing.badge_recommended')}
                      </span>
                    )}
                  </div>
                  <p className='text-sm font-light text-xyz-white-6 mb-4'>{plan.description}</p>
                  <div className='mb-6'>
                    <span className='text-4xl font-medium text-white'>{plan.price}</span>
                    {plan.priceSuffix && (
                      <span className='text-sm font-light text-xyz-white-5 ml-1'>{plan.priceSuffix}</span>
                    )}
                  </div>
                  <ul className='space-y-3 mb-8 list-none p-0 flex-1'>
                    {plan.features.map((feature, i) => (
                      <li key={i} className='flex items-start gap-2 text-sm font-light text-xyz-white-6'>
                        <span className='w-1.5 h-1.5 rounded-full bg-green-400 mt-1.5 shrink-0' />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link
                    to='/register'
                    className={`block w-full text-center text-sm font-light h-10 leading-10 no-underline transition-colors ${
                      plan.highlighted
                        ? 'bg-xyz-blue-6 text-white hover:bg-[#3451e6]'
                        : 'border border-xyz-white-3 text-white hover:border-xyz-white-5'
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              ))}
            </StaggerIn>
          </div>
        </div>
      </section>

      {/* ══════ Comparison Table (白底 LIGHT) ══════ */}
      {plans.length > 0 && (
        <section className='xyz-section-light'>
          <div className='max-w-xyz mx-auto'>
            <div className='xyz-section-light-inner px-5 py-20'>
              <FadeIn>
                <h2 className='text-3xl font-medium text-xyz-gray-10 text-center mb-12'>
                  <BlurText
                    text={t('pricing.compare.title')}
                    delay={60}
                    animateBy='words'
                    direction='bottom'
                    className='justify-center'
                    animationFrom={{ filter: 'blur(10px)', opacity: 0, y: 30 }}
                    animationTo={[
                      { filter: 'blur(5px)', opacity: 0.5, y: -5 },
                      { filter: 'blur(0px)', opacity: 1, y: 0 },
                    ]}
                  />
                </h2>
              </FadeIn>
              <FadeIn delay={0.2} distance={30}>
                <div className='overflow-x-auto'>
                  <table className='w-full'>
                    <thead>
                      <tr className='border-b border-xyz-gray-3'>
                        <th className='text-left text-sm font-medium text-xyz-gray-6 py-4 pr-8 w-[200px]'>
                          {t('pricing.compare.feature')}
                        </th>
                        {plans.map((p) => (
                          <th key={p.id} className='text-center text-sm font-medium text-xyz-gray-10 py-4 px-4'>
                            {p.display_name || p.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {comparisonFeatures.map((row, rowIdx) => (
                        <motion.tr
                          key={row.feature}
                          className='border-b border-xyz-gray-2'
                          initial={{ opacity: 0, x: -20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true, amount: 0.5 }}
                          transition={{ duration: 0.4, delay: rowIdx * 0.08 }}
                        >
                          <td className='text-sm font-light text-xyz-gray-8 py-4 pr-8'>
                            {row.feature}
                          </td>
                          {plans.map((p) => (
                            <td key={p.id} className='text-center text-sm font-light text-xyz-gray-6 py-4 px-4'>
                              {row[p.name]}
                            </td>
                          ))}
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </FadeIn>
            </div>
          </div>
        </section>
      )}

      {/* ══════ FAQ (深色 DARK) ══════ */}
      <section className='bg-xyz-gray-10'>
        <div className='max-w-xyz mx-auto'>
          <div className='xyz-section-inner px-5 py-20'>
            <FadeIn>
              <h2 className='text-3xl font-medium text-white text-center mb-12'>
                <BlurText
                  text={t('pricing.faq.title')}
                  delay={60}
                  animateBy='words'
                  direction='bottom'
                  className='justify-center'
                />
              </h2>
            </FadeIn>
            <div className='max-w-3xl mx-auto space-y-0'>
              {faqs.map((faq, i) => (
                <FaqItem key={i} question={faq.question} answer={faq.answer} index={i} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════ CTA (白底 LIGHT) ══════ */}
      <section className='xyz-section-light'>
        <div className='max-w-xyz mx-auto'>
          <div className='xyz-section-light-inner px-5 py-20 text-center'>
            <FadeIn>
              <h2 className='text-3xl font-medium text-xyz-gray-10 mb-4'>
                <BlurText
                  text={t('marketing.cta.title')}
                  delay={60}
                  animateBy='words'
                  direction='bottom'
                  className='justify-center'
                  animationFrom={{ filter: 'blur(10px)', opacity: 0, y: 30 }}
                  animationTo={[
                    { filter: 'blur(5px)', opacity: 0.5, y: -5 },
                    { filter: 'blur(0px)', opacity: 1, y: 0 },
                  ]}
                />
              </h2>
            </FadeIn>
            <FadeIn delay={0.2} distance={15}>
              <p className='text-lg font-light text-xyz-gray-6 max-w-lg mx-auto mb-10'>
                {t('pricing.cta.description')}
              </p>
            </FadeIn>
            <FadeIn delay={0.4} distance={20}>
              <div className='flex justify-center gap-4'>
                <Link
                  to='/register'
                  className='inline-flex items-center justify-center gap-2 bg-xyz-blue-6 text-white text-base font-light h-10 px-6 no-underline transition-colors hover:bg-[#3451e6]'
                >
                  {t('marketing.cta.register')}
                  <svg width='14' height='12' viewBox='0 0 14 12' fill='none' className='rotate-[-45deg]'>
                    <path d='M1 6H13M13 6L8 1M13 6L8 11' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round'/>
                  </svg>
                </Link>
                <Link
                  to='/docs'
                  className='inline-flex items-center justify-center gap-2 border border-xyz-gray-4 text-xyz-gray-10 text-base font-light h-10 px-6 no-underline transition-colors hover:border-xyz-gray-7'
                >
                  {t('marketing.cta.view_docs')}
                </Link>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>
    </div>
  );
};

/* ── FAQ accordion item (Dark theme) ── */
const FaqItem = ({ question, answer, index }) => {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      className='border border-xyz-white-2 transition-colors duration-300'
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
    >
      <button
        onClick={() => setOpen(!open)}
        className='w-full flex items-center justify-between p-5 bg-transparent border-none cursor-pointer text-left'
      >
        <span className='text-base font-medium text-white'>{question}</span>
        <motion.span
          className='text-xyz-white-5 text-xl ml-4 shrink-0'
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.2 }}
        >
          +
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            className='overflow-hidden'
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <p className='px-5 pb-5 text-sm font-light text-xyz-white-6 leading-relaxed'>
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default PricingPage;
