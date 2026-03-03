import React, { useEffect, useState } from 'react';
import { Progress } from '../ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

const QuotaUsageBar = ({ quotaInfo }) => {
  const [countdown, setCountdown] = useState('');

  useEffect(() => {
    if (!quotaInfo || !quotaInfo.has_subscription) return;

    const updateCountdown = () => {
      const windowSec = quotaInfo.window_duration || 18000;
      const hours = Math.floor(windowSec / 3600);
      const minutes = Math.floor((windowSec % 3600) / 60);
      setCountdown(`${hours}h ${minutes}m 窗口周期`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
  }, [quotaInfo]);

  if (!quotaInfo || !quotaInfo.has_subscription) {
    return (
      <Card>
        <CardContent className='p-6 text-center text-muted-foreground'>
          暂无活跃订阅
        </CardContent>
      </Card>
    );
  }

  const total = quotaInfo.window_limit + (quotaInfo.booster_extra || 0);
  const used = quotaInfo.window_used || 0;
  const remaining = quotaInfo.remaining || 0;
  const percentage = total > 0 ? Math.min((used / total) * 100, 100) : 0;

  return (
    <Card>
      <CardHeader className='pb-2'>
        <div className='flex items-center justify-between'>
          <CardTitle className='text-sm font-medium'>请求额度</CardTitle>
          <span className='text-xs text-muted-foreground'>{countdown}</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className='space-y-2'>
          <Progress value={percentage} className='h-2' />
          <div className='flex justify-between text-xs text-muted-foreground'>
            <span>已使用 {used} / {total}</span>
            <span>剩余 {remaining}</span>
          </div>
          {quotaInfo.booster_extra > 0 && (
            <p className='text-xs text-muted-foreground'>
              含加油包额度 +{quotaInfo.booster_extra}
            </p>
          )}
          {quotaInfo.overage_rate_type === 'api' && percentage >= 100 && (
            <p className='text-xs text-orange-600'>
              已超出窗口限制，后续请求按量计费
            </p>
          )}
          {quotaInfo.overage_rate_type === 'blocked' && percentage >= 100 && (
            <p className='text-xs text-red-600'>
              已达到窗口限制，请等待下个窗口或购买加油包
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuotaUsageBar;
