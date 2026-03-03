import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Check } from 'lucide-react';
import { cn } from '../../lib/utils';

const PlanCard = ({ plan, currentPlanId, onSelect, isUpgrade, isDowngrade, className }) => {
  const { t } = useTranslation();
  const isCurrent = plan.id === currentPlanId;
  const priceDisplay = plan.price_cents_monthly === 0
    ? t('console.plan.free')
    : t('console.plan.per_month', { price: (plan.price_cents_monthly / 100).toFixed(0) });

  const features = [
    t('console.plan.requests_per_window', { count: plan.window_limit_count, hours: plan.window_duration_sec / 3600 }),
    ...(plan.weekly_limit_count > 0
      ? [t('console.plan.weekly_limit', { count: plan.weekly_limit_count })]
      : []),
    plan.overage_rate_type === 'api' ? t('console.plan.overage_pay_per_use') : t('console.plan.overage_blocked'),
    plan.monthly_spend_limit_cents > 0
      ? t('console.plan.monthly_limit', { amount: (plan.monthly_spend_limit_cents / 100).toFixed(0) })
      : t('console.plan.no_monthly_limit'),
  ];

  return (
    <Card className={cn(
      'relative flex flex-col',
      isCurrent && 'border-primary',
      className
    )}>
      {isCurrent && (
        <Badge className='absolute -top-2 left-1/2 -translate-x-1/2' variant='default'>
          {t('console.plan.current')}
        </Badge>
      )}
      <CardHeader className='text-center pb-2'>
        <CardTitle className='text-lg'>{plan.display_name || plan.name}</CardTitle>
        {plan.description && (
          <p className='text-sm text-muted-foreground'>{plan.description}</p>
        )}
      </CardHeader>
      <CardContent className='flex-1 text-center'>
        <div className='text-3xl font-bold mb-4'>{priceDisplay}</div>
        <ul className='space-y-2 text-sm text-left'>
          {features.map((feature, i) => (
            <li key={i} className='flex items-start gap-2'>
              <Check className='h-4 w-4 text-primary mt-0.5 shrink-0' />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        {isCurrent ? (
          <Button variant='outline' className='w-full' disabled>
            {t('console.plan.current')}
          </Button>
        ) : (
          <Button
            className='w-full'
            variant={isUpgrade ? 'default' : 'outline'}
            onClick={() => onSelect && onSelect(plan)}
          >
            {isUpgrade ? t('console.plan.upgrade') : isDowngrade ? t('console.plan.downgrade') : t('console.plan.select')}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default PlanCard;
