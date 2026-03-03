import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../../components/ui/accordion';
import { CheckCircle2, Minus, ArrowRight, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTranslation } from 'react-i18next';
import { API } from '../../helpers';

const CellValue = ({ value }) => {
  if (typeof value === 'boolean') {
    return value ? (
      <CheckCircle2 className='mx-auto h-4 w-4 text-green-500' />
    ) : (
      <Minus className='mx-auto h-4 w-4 text-muted-foreground' />
    );
  }
  return <span className='text-sm'>{value}</span>;
};

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
  const hours = plan.window_duration_sec / 3600;
  features.push(
    `${hours}h ${t('pricing.compare.window_limit')}: ${plan.window_limit_count} ${t('admin.plan.unit_requests')}`
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
      ctaVariant: highlighted ? 'default' : 'outline',
      highlighted,
    };
  });

  const comparisonFeatures = (() => {
    if (plans.length === 0) return [];
    const rows = [];

    // Window limit row
    const windowRow = { feature: t('pricing.compare.window_limit') };
    plans.forEach((p) => {
      windowRow[p.name] = `${p.window_limit_count}`;
    });
    rows.push(windowRow);

    // Weekly limit row
    const weeklyRow = { feature: t('pricing.compare.weekly_limit') };
    plans.forEach((p) => {
      weeklyRow[p.name] = p.weekly_limit_count > 0 ? `${p.weekly_limit_count}` : '-';
    });
    rows.push(weeklyRow);

    // Overage row
    const overageRow = { feature: t('pricing.compare.overage') };
    plans.forEach((p) => {
      overageRow[p.name] =
        p.overage_rate_type === 'api'
          ? t('pricing.compare.api_rate')
          : t('pricing.compare.pause');
    });
    rows.push(overageRow);

    // Monthly cap row
    const capRow = { feature: t('pricing.compare.monthly_cap') };
    plans.forEach((p) => {
      capRow[p.name] =
        p.overage_rate_type === 'api' ? t('pricing.compare.configurable') : '-';
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
      <div className='flex min-h-[60vh] items-center justify-center'>
        <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
      </div>
    );
  }

  if (error) {
    return (
      <div className='flex min-h-[60vh] flex-col items-center justify-center gap-4'>
        <p className='text-muted-foreground'>{t('admin.plan.load_error')}</p>
        <Button variant='outline' onClick={() => window.location.reload()}>
          {t('pricing.retry', '重试')}
        </Button>
      </div>
    );
  }

  return (
    <div className='flex flex-col'>
      {/* Hero */}
      <section className='border-b py-16'>
        <div className='container mx-auto max-w-screen-xl px-4 text-center'>
          <h1 className='text-4xl font-bold tracking-tight'>
            {t('pricing.hero.title')}
          </h1>
          <p className='mx-auto mt-4 max-w-2xl text-lg text-muted-foreground'>
            {t('pricing.hero.description')}
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className='border-b py-16'>
        <div className='container mx-auto max-w-screen-xl px-4'>
          <div className={cn(
            'grid gap-6',
            planCards.length <= 2 ? 'md:grid-cols-2' :
            planCards.length === 3 ? 'md:grid-cols-3' :
            'md:grid-cols-2 lg:grid-cols-4'
          )}>
            {planCards.map((plan) => (
              <Card
                key={plan.id}
                className={cn(
                  'flex flex-col',
                  plan.highlighted && 'border-primary shadow-lg'
                )}
              >
                <CardHeader>
                  <div className='flex items-center justify-between'>
                    <CardTitle className='text-xl'>{plan.name}</CardTitle>
                    {plan.highlighted && <Badge>{t('pricing.badge_recommended')}</Badge>}
                  </div>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className='mt-3'>
                    <span className='text-3xl font-bold'>{plan.price}</span>
                    {plan.priceSuffix && (
                      <span className='text-muted-foreground'>
                        {plan.priceSuffix}
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className='flex-1'>
                  <ul className='space-y-2.5'>
                    {plan.features.map((feature, i) => (
                      <li
                        key={i}
                        className='flex items-start gap-2 text-sm text-muted-foreground'
                      >
                        <CheckCircle2 className='mt-0.5 h-4 w-4 shrink-0 text-green-500' />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    variant={plan.ctaVariant}
                    className='w-full'
                    asChild
                  >
                    <Link to='/register'>{plan.cta}</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Comparison Table */}
      {plans.length > 0 && (
        <section className='border-b py-16'>
          <div className='container mx-auto max-w-screen-xl px-4'>
            <h2 className='mb-8 text-center text-2xl font-bold tracking-tight'>
              {t('pricing.compare.title')}
            </h2>
            <div className='overflow-x-auto'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className='w-[200px]'>{t('pricing.compare.feature')}</TableHead>
                    {plans.map((p) => (
                      <TableHead key={p.id} className='text-center'>
                        {p.display_name || p.name}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {comparisonFeatures.map((row) => (
                    <TableRow key={row.feature}>
                      <TableCell className='font-medium'>
                        {row.feature}
                      </TableCell>
                      {plans.map((p) => (
                        <TableCell key={p.id} className='text-center'>
                          <CellValue value={row[p.name]} />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </section>
      )}

      {/* FAQ Section */}
      <section className='border-b py-16'>
        <div className='container mx-auto max-w-screen-xl px-4'>
          <h2 className='mb-8 text-center text-2xl font-bold tracking-tight'>
            {t('pricing.faq.title')}
          </h2>
          <div className='mx-auto max-w-3xl'>
            <Accordion type='single' collapsible>
              {faqs.map((faq, i) => (
                <AccordionItem key={i} value={`faq-${i}`}>
                  <AccordionTrigger>{faq.question}</AccordionTrigger>
                  <AccordionContent>
                    <p className='text-muted-foreground'>{faq.answer}</p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className='py-16'>
        <div className='container mx-auto max-w-screen-xl px-4 text-center'>
          <h2 className='text-2xl font-bold tracking-tight'>
            {t('marketing.cta.title')}
          </h2>
          <p className='mx-auto mt-3 max-w-lg text-muted-foreground'>
            {t('pricing.cta.description')}
          </p>
          <div className='mt-8 flex justify-center gap-4'>
            <Button size='lg' asChild>
              <Link to='/register'>
                {t('marketing.cta.register')}
                <ArrowRight className='ml-1 h-4 w-4' />
              </Link>
            </Button>
            <Button size='lg' variant='outline' asChild>
              <Link to='/docs'>{t('marketing.cta.view_docs')}</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PricingPage;
