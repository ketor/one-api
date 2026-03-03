import React, { useEffect, useState } from 'react';
import { API, showError, showSuccess } from '../../helpers';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '../../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const emptyPlan = {
  name: '',
  display_name: '',
  price_cents_monthly: 0,
  window_limit_count: 0,
  window_duration_sec: 18000,
  weekly_limit_count: 0,
  overage_rate_type: 'blocked',
  monthly_spend_limit_cents: 0,
  priority: 0,
  status: 1,
};

const AdminPlanManagement = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...emptyPlan });
  const [saving, setSaving] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    setLoading(true);
    try {
      const res = await API.get('/api/admin/plan/');
      if (res.data.success) {
        setPlans(res.data.data || []);
      } else {
        showError(t('admin.plan.load_error'));
      }
    } catch (err) {
      showError(t('admin.plan.load_error'));
    }
    setLoading(false);
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyPlan });
    setDialogOpen(true);
  };

  const openEdit = (plan) => {
    setEditing(plan);
    setForm({
      ...plan,
      price_cents_monthly: plan.price_cents_monthly / 100,
      monthly_spend_limit_cents: (plan.monthly_spend_limit_cents || 0) / 100,
      window_duration_sec: (plan.window_duration_sec || 18000) / 3600,
    });
    setDialogOpen(true);
  };

  const openDelete = (plan) => {
    setEditing(plan);
    setDeleteDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        price_cents_monthly: Math.round(form.price_cents_monthly * 100),
        monthly_spend_limit_cents: Math.round(form.monthly_spend_limit_cents * 100),
        window_duration_sec: Math.round(form.window_duration_sec * 3600),
        window_limit_count: Number(form.window_limit_count),
        weekly_limit_count: Number(form.weekly_limit_count),
        priority: Number(form.priority),
      };

      let res;
      if (editing) {
        payload.id = editing.id;
        res = await API.put('/api/admin/plan/', payload);
      } else {
        res = await API.post('/api/admin/plan/', payload);
      }

      if (res.data.success) {
        showSuccess(t('admin.plan.save_success'));
        setDialogOpen(false);
        loadPlans();
      } else {
        showError(res.data.message || t('admin.plan.load_error'));
      }
    } catch (err) {
      showError(err.message);
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!editing) return;
    try {
      const res = await API.delete(`/api/admin/plan/${editing.id}`);
      if (res.data.success) {
        showSuccess(t('admin.plan.delete_success'));
        setDeleteDialogOpen(false);
        setEditing(null);
        loadPlans();
      } else {
        showError(res.data.message || t('admin.plan.load_error'));
      }
    } catch (err) {
      showError(err.message);
    }
  };

  const updateForm = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const formatYuan = (cents) => {
    return (cents / 100).toFixed(2);
  };

  const formatHours = (seconds) => {
    return (seconds / 3600).toFixed(1);
  };

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>{t('admin.plan.title')}</h1>
          <p className='text-muted-foreground'>{t('admin.plan.description')}</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className='mr-2 h-4 w-4' />
          {t('admin.plan.create')}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('admin.plan.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className='text-muted-foreground'>{t('admin.common.loading')}</p>
          ) : plans.length === 0 ? (
            <p className='text-muted-foreground'>{t('admin.common.no_data')}</p>
          ) : (
            <div className='overflow-x-auto'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('admin.plan.col_name')}</TableHead>
                    <TableHead>{t('admin.plan.col_display_name')}</TableHead>
                    <TableHead>{t('admin.plan.col_price')}</TableHead>
                    <TableHead>{t('admin.plan.col_window_limit')}</TableHead>
                    <TableHead>{t('admin.plan.col_window_duration')}</TableHead>
                    <TableHead>{t('admin.plan.col_weekly_limit')}</TableHead>
                    <TableHead>{t('admin.plan.col_overage')}</TableHead>
                    <TableHead>{t('admin.plan.col_status')}</TableHead>
                    <TableHead>{t('admin.plan.col_actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plans.map((plan) => (
                    <TableRow key={plan.id}>
                      <TableCell className='font-medium'>{plan.name}</TableCell>
                      <TableCell>{plan.display_name}</TableCell>
                      <TableCell>
                        {formatYuan(plan.price_cents_monthly)} {t('admin.plan.unit_yuan')}
                      </TableCell>
                      <TableCell>
                        {plan.window_limit_count} {t('admin.plan.unit_requests')}
                      </TableCell>
                      <TableCell>
                        {formatHours(plan.window_duration_sec)} {t('admin.plan.unit_hours')}
                      </TableCell>
                      <TableCell>
                        {plan.weekly_limit_count} {t('admin.plan.unit_requests')}
                      </TableCell>
                      <TableCell>
                        {plan.overage_rate_type === 'api'
                          ? t('admin.plan.overage_api')
                          : t('admin.plan.overage_blocked')}
                      </TableCell>
                      <TableCell>
                        <Badge variant={plan.status === 1 ? 'default' : 'secondary'}>
                          {plan.status === 1
                            ? t('admin.plan.status_enabled')
                            : t('admin.plan.status_disabled')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className='flex items-center gap-2'>
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() => openEdit(plan)}
                          >
                            <Pencil className='h-3.5 w-3.5' />
                          </Button>
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() => openDelete(plan)}
                          >
                            <Trash2 className='h-3.5 w-3.5' />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-[500px]'>
          <DialogHeader>
            <DialogTitle>
              {editing ? t('admin.plan.edit') : t('admin.plan.create')}
            </DialogTitle>
            <DialogDescription />
          </DialogHeader>
          <div className='grid gap-4 py-4'>
            {!editing && (
              <div className='grid gap-2'>
                <Label>{t('admin.plan.col_name')}</Label>
                <Input
                  value={form.name}
                  onChange={(e) => updateForm('name', e.target.value)}
                />
              </div>
            )}
            <div className='grid gap-2'>
              <Label>{t('admin.plan.col_display_name')}</Label>
              <Input
                value={form.display_name}
                onChange={(e) => updateForm('display_name', e.target.value)}
              />
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <div className='grid gap-2'>
                <Label>{t('admin.plan.col_price')}</Label>
                <Input
                  type='number'
                  min='0'
                  step='0.01'
                  value={form.price_cents_monthly}
                  onChange={(e) =>
                    updateForm('price_cents_monthly', parseFloat(e.target.value) || 0)
                  }
                />
              </div>
              <div className='grid gap-2'>
                <Label>{t('admin.plan.col_monthly_cap')}</Label>
                <Input
                  type='number'
                  min='0'
                  step='0.01'
                  value={form.monthly_spend_limit_cents}
                  onChange={(e) =>
                    updateForm('monthly_spend_limit_cents', parseFloat(e.target.value) || 0)
                  }
                />
              </div>
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <div className='grid gap-2'>
                <Label>{t('admin.plan.col_window_limit')}</Label>
                <Input
                  type='number'
                  min='0'
                  value={form.window_limit_count}
                  onChange={(e) =>
                    updateForm('window_limit_count', parseInt(e.target.value) || 0)
                  }
                />
              </div>
              <div className='grid gap-2'>
                <Label>{t('admin.plan.col_window_duration')}</Label>
                <Input
                  type='number'
                  min='0'
                  step='0.5'
                  value={form.window_duration_sec}
                  onChange={(e) =>
                    updateForm('window_duration_sec', parseFloat(e.target.value) || 0)
                  }
                />
              </div>
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <div className='grid gap-2'>
                <Label>{t('admin.plan.col_weekly_limit')}</Label>
                <Input
                  type='number'
                  min='0'
                  value={form.weekly_limit_count}
                  onChange={(e) =>
                    updateForm('weekly_limit_count', parseInt(e.target.value) || 0)
                  }
                />
              </div>
              <div className='grid gap-2'>
                <Label>{t('admin.plan.col_priority')}</Label>
                <Input
                  type='number'
                  min='0'
                  value={form.priority}
                  onChange={(e) =>
                    updateForm('priority', parseInt(e.target.value) || 0)
                  }
                />
              </div>
            </div>
            <div className='grid gap-2'>
              <Label>{t('admin.plan.col_overage')}</Label>
              <Select
                value={form.overage_rate_type}
                onValueChange={(v) => updateForm('overage_rate_type', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='api'>{t('admin.plan.overage_api')}</SelectItem>
                  <SelectItem value='blocked'>{t('admin.plan.overage_blocked')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className='flex items-center gap-3'>
              <Label>{t('admin.plan.col_status')}</Label>
              <button
                type='button'
                role='switch'
                aria-checked={form.status === 1}
                onClick={() => updateForm('status', form.status === 1 ? 2 : 1)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors ${
                  form.status === 1 ? 'bg-primary' : 'bg-input'
                }`}
              >
                <span
                  className={`pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform ${
                    form.status === 1 ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
              <span className='text-sm text-muted-foreground'>
                {form.status === 1
                  ? t('admin.plan.status_enabled')
                  : t('admin.plan.status_disabled')}
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setDialogOpen(false)}>
              {t('admin.plan.cancel')}
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {t('admin.plan.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin.plan.delete')}</DialogTitle>
            <DialogDescription>
              {t('admin.plan.delete_confirm', {
                name: editing?.display_name || editing?.name,
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant='outline' onClick={() => setDeleteDialogOpen(false)}>
              {t('admin.plan.cancel')}
            </Button>
            <Button variant='destructive' onClick={handleDelete}>
              {t('admin.plan.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPlanManagement;
