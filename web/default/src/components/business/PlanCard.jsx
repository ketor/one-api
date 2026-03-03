import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Check } from 'lucide-react';
import { cn } from '../../lib/utils';

const PlanCard = ({ plan, currentPlanId, onSelect, isUpgrade, isDowngrade, className }) => {
  const isCurrent = plan.id === currentPlanId;
  const priceDisplay = plan.price_cents_monthly === 0
    ? '免费'
    : `¥${(plan.price_cents_monthly / 100).toFixed(0)}/月`;

  const features = [
    `${plan.window_limit_count} 次请求 / ${plan.window_duration_sec / 3600}小时窗口`,
    plan.overage_rate_type === 'api' ? '超出后按量计费' : '超出后暂停服务',
    plan.monthly_spend_limit_cents > 0
      ? `月消费上限 ¥${(plan.monthly_spend_limit_cents / 100).toFixed(0)}`
      : '无月消费上限',
  ];

  return (
    <Card className={cn(
      'relative flex flex-col',
      isCurrent && 'border-primary',
      className
    )}>
      {isCurrent && (
        <Badge className='absolute -top-2 left-1/2 -translate-x-1/2' variant='default'>
          当前套餐
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
            当前套餐
          </Button>
        ) : (
          <Button
            className='w-full'
            variant={isUpgrade ? 'default' : 'outline'}
            onClick={() => onSelect && onSelect(plan)}
          >
            {isUpgrade ? '升级' : isDowngrade ? '降级' : '选择'}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default PlanCard;
