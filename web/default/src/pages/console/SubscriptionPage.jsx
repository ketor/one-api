import React, { useEffect, useState } from 'react';
import { API, showError, showSuccess } from '../../helpers';
import { timestamp2string } from '../../helpers';
import PlanComparisonGrid from '../../components/business/PlanComparisonGrid';
import QuotaUsageBar from '../../components/business/QuotaUsageBar';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '../../components/ui/dialog';

const SubscriptionPage = () => {
  const [subscription, setSubscription] = useState(null);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [plans, setPlans] = useState([]);
  const [quotaInfo, setQuotaInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogAction, setDialogAction] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [subRes, planRes, quotaRes] = await Promise.all([
        API.get('/api/subscription/self'),
        API.get('/api/plan/'),
        API.get('/api/subscription/quota'),
      ]);

      if (subRes.data.success && subRes.data.data) {
        setSubscription(subRes.data.data.subscription);
        setCurrentPlan(subRes.data.data.plan);
      }
      if (planRes.data.success) {
        setPlans(planRes.data.data || []);
      }
      if (quotaRes.data.success) {
        setQuotaInfo(quotaRes.data.data);
      }
    } catch (err) {
      showError('加载订阅信息失败');
    }
    setLoading(false);
  };

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
    if (!subscription) {
      setDialogAction('subscribe');
    } else if (plan.priority > (currentPlan?.priority || 0)) {
      setDialogAction('upgrade');
    } else {
      setDialogAction('downgrade');
    }
    setDialogOpen(true);
  };

  const handleConfirmAction = async () => {
    if (!selectedPlan) return;
    setActionLoading(true);
    try {
      let res;
      if (dialogAction === 'subscribe') {
        res = await API.post('/api/subscription/', { plan_id: selectedPlan.id });
      } else if (dialogAction === 'upgrade') {
        res = await API.put('/api/subscription/upgrade', { plan_id: selectedPlan.id });
      } else if (dialogAction === 'downgrade') {
        res = await API.put('/api/subscription/downgrade', { plan_id: selectedPlan.id });
      }

      if (res.data.success) {
        showSuccess(res.data.message || '操作成功');
        setDialogOpen(false);
        loadData();
      } else {
        showError(res.data.message);
      }
    } catch (err) {
      showError('操作失败');
    }
    setActionLoading(false);
  };

  const handleCancelSubscription = async () => {
    try {
      const res = await API.post('/api/subscription/cancel');
      if (res.data.success) {
        showSuccess(res.data.message || '已取消自动续费');
        loadData();
      } else {
        showError(res.data.message);
      }
    } catch (err) {
      showError('取消失败');
    }
  };

  const handleRenew = async () => {
    try {
      const res = await API.post('/api/subscription/renew');
      if (res.data.success) {
        showSuccess('续费成功');
        loadData();
      } else {
        showError(res.data.message);
      }
    } catch (err) {
      showError('续费失败');
    }
  };

  const actionLabels = {
    subscribe: '订阅',
    upgrade: '升级',
    downgrade: '降级',
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center py-20 text-muted-foreground'>
        加载中...
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-2xl font-bold tracking-tight'>订阅管理</h1>
        <p className='text-muted-foreground'>管理您的套餐订阅。</p>
      </div>

      {/* Current subscription */}
      {subscription ? (
        <Card>
          <CardHeader className='pb-2'>
            <div className='flex items-center justify-between'>
              <CardTitle className='text-sm font-medium'>当前订阅</CardTitle>
              <Badge variant={subscription.status === 1 ? 'default' : 'secondary'}>
                {subscription.status === 1 ? '活跃' : '已过期'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
              <div>
                <p className='text-xs text-muted-foreground'>套餐</p>
                <p className='font-medium'>{currentPlan?.display_name || '-'}</p>
              </div>
              <div>
                <p className='text-xs text-muted-foreground'>当前周期</p>
                <p className='text-sm'>
                  {timestamp2string(subscription.current_period_start).split(' ')[0]} ~{' '}
                  {timestamp2string(subscription.current_period_end).split(' ')[0]}
                </p>
              </div>
              <div>
                <p className='text-xs text-muted-foreground'>自动续费</p>
                <p className='text-sm'>{subscription.auto_renew ? '是' : '否'}</p>
              </div>
              <div>
                <p className='text-xs text-muted-foreground'>本月消费</p>
                <p className='text-sm'>¥{(subscription.monthly_spent_cents / 100).toFixed(2)}</p>
              </div>
            </div>
            <div className='flex gap-2 mt-4'>
              {subscription.auto_renew ? (
                <Button variant='outline' size='sm' onClick={handleCancelSubscription}>
                  取消自动续费
                </Button>
              ) : (
                <Button variant='outline' size='sm' onClick={handleRenew}>
                  续费
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className='p-6 text-center text-muted-foreground'>
            您还没有订阅任何套餐，请在下方选择一个套餐开始使用。
          </CardContent>
        </Card>
      )}

      {/* Quota info */}
      <QuotaUsageBar quotaInfo={quotaInfo} />

      {/* Plan comparison */}
      <div>
        <h2 className='text-lg font-semibold mb-4'>选择套餐</h2>
        <PlanComparisonGrid
          plans={plans}
          currentPlanId={currentPlan?.id}
          currentPlanPriority={currentPlan?.priority}
          onSelect={handleSelectPlan}
        />
      </div>

      {/* Confirm dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认{actionLabels[dialogAction]}</DialogTitle>
            <DialogDescription>
              {dialogAction === 'subscribe' && (
                <>确定要订阅 {selectedPlan?.display_name} 套餐吗？</>
              )}
              {dialogAction === 'upgrade' && (
                <>确定要从 {currentPlan?.display_name} 升级到 {selectedPlan?.display_name}？</>
              )}
              {dialogAction === 'downgrade' && (
                <>确定要降级到 {selectedPlan?.display_name}？降级将在当前计费周期结束后生效。</>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant='outline' onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleConfirmAction} disabled={actionLoading}>
              {actionLoading ? '处理中...' : `确认${actionLabels[dialogAction]}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SubscriptionPage;
