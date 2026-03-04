import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const navigate = useNavigate();
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
      showError(t('console.subscription.load_failed'));
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
        if (res.data.data?.need_payment === true) {
          const orderNo = res.data.data?.order?.order_no;
          if (orderNo) {
            setDialogOpen(false);
            navigate(`/payment/${orderNo}`);
            return;
          }
          showError(t('console.subscription.order_create_failed'));
        } else {
          showSuccess(res.data.message || t('console.subscription.operation_success'));
          setDialogOpen(false);
          loadData();
        }
      } else {
        showError(res.data.message);
      }
    } catch (err) {
      showError(t('console.subscription.operation_failed'));
    }
    setActionLoading(false);
  };

  const handleCancelSubscription = async () => {
    try {
      const res = await API.post('/api/subscription/cancel');
      if (res.data.success) {
        showSuccess(res.data.message || t('console.subscription.auto_renew_cancelled'));
        loadData();
      } else {
        showError(res.data.message);
      }
    } catch (err) {
      showError(t('console.subscription.cancel_failed'));
    }
  };

  const handleRenew = async () => {
    try {
      const res = await API.post('/api/subscription/renew');
      if (res.data.success) {
        if (res.data.data?.need_payment === true) {
          const orderNo = res.data.data?.order?.order_no;
          if (orderNo) {
            navigate(`/payment/${orderNo}`);
            return;
          }
          showError(t('console.subscription.order_create_failed'));
        } else {
          showSuccess(t('console.subscription.renew_success'));
          loadData();
        }
      } else {
        showError(res.data.message);
      }
    } catch (err) {
      showError(t('console.subscription.renew_failed'));
    }
  };

  const actionLabels = {
    subscribe: t('console.subscription.actions.subscribe'),
    upgrade: t('console.subscription.actions.upgrade'),
    downgrade: t('console.subscription.actions.downgrade'),
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center py-20 text-muted-foreground'>
        {t('console.common.loading')}
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-2xl font-bold tracking-tight'>{t('console.subscription.title')}</h1>
        <p className='text-muted-foreground'>{t('console.subscription.subtitle')}</p>
      </div>

      {/* Current subscription */}
      {subscription ? (
        <Card>
          <CardHeader className='pb-2'>
            <div className='flex items-center justify-between'>
              <CardTitle className='text-sm font-medium'>{t('console.subscription.current')}</CardTitle>
              <Badge variant={subscription.status === 1 ? 'default' : 'secondary'}>
                {subscription.status === 1 ? t('console.subscription.status_active') : t('console.subscription.status_expired')}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
              <div>
                <p className='text-xs text-muted-foreground'>{t('console.subscription.plan_label')}</p>
                <p className='font-medium'>{currentPlan?.display_name || '-'}</p>
              </div>
              <div>
                <p className='text-xs text-muted-foreground'>{t('console.subscription.current_period')}</p>
                <p className='text-sm'>
                  {timestamp2string(subscription.current_period_start).split(' ')[0]} ~{' '}
                  {timestamp2string(subscription.current_period_end).split(' ')[0]}
                </p>
              </div>
              <div>
                <p className='text-xs text-muted-foreground'>{t('console.subscription.auto_renew')}</p>
                <p className='text-sm'>{subscription.auto_renew ? t('console.subscription.yes') : t('console.subscription.no')}</p>
              </div>
              <div>
                <p className='text-xs text-muted-foreground'>{t('console.subscription.monthly_spent')}</p>
                <p className='text-sm'>¥{(subscription.monthly_spent_cents / 100).toFixed(2)}</p>
              </div>
            </div>
            <div className='flex gap-2 mt-4'>
              {subscription.auto_renew ? (
                <Button variant='outline' size='sm' onClick={handleCancelSubscription}>
                  {t('console.subscription.cancel_auto_renew')}
                </Button>
              ) : (
                <Button variant='outline' size='sm' onClick={handleRenew}>
                  {t('console.subscription.renew')}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className='p-6 text-center text-muted-foreground'>
            {t('console.subscription.no_subscription')}
          </CardContent>
        </Card>
      )}

      {/* Quota info */}
      <QuotaUsageBar quotaInfo={quotaInfo} />

      {/* Plan comparison */}
      <div>
        <h2 className='text-lg font-semibold mb-4'>{t('console.subscription.select_plan')}</h2>
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
            <DialogTitle>{t('console.subscription.confirm_title', { action: actionLabels[dialogAction] })}</DialogTitle>
            <DialogDescription>
              {dialogAction === 'subscribe' && (
                <>{t('console.subscription.confirm_subscribe', { plan: selectedPlan?.display_name })}</>
              )}
              {dialogAction === 'upgrade' && (
                <>{t('console.subscription.confirm_upgrade', { from: currentPlan?.display_name, to: selectedPlan?.display_name })}</>
              )}
              {dialogAction === 'downgrade' && (
                <>{t('console.subscription.confirm_downgrade', { plan: selectedPlan?.display_name })}</>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant='outline' onClick={() => setDialogOpen(false)}>
              {t('console.common.cancel')}
            </Button>
            <Button onClick={handleConfirmAction} disabled={actionLoading}>
              {actionLoading ? t('console.common.processing') : t('console.subscription.confirm_btn', { action: actionLabels[dialogAction] })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SubscriptionPage;
