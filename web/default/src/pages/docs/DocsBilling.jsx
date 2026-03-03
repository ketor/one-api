import React from 'react';
import { Link } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { useTranslation } from 'react-i18next';

const DocsBilling = () => {
  const { t } = useTranslation();

  return (
    <div className='space-y-8'>
      <div>
        <h1 className='text-3xl font-bold tracking-tight'>{t('docs.billing.title')}</h1>
        <p className='mt-2 text-lg text-muted-foreground'>
          {t('docs.billing.description')}
        </p>
      </div>

      {/* Plans overview */}
      <div className='space-y-4'>
        <h2 className='text-2xl font-semibold'>{t('docs.billing.plans_title')}</h2>
        <p className='text-muted-foreground'>{t('docs.billing.plans_desc')}</p>
        <div className='overflow-x-auto'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('docs.billing.col_plan')}</TableHead>
                <TableHead>{t('docs.billing.col_price')}</TableHead>
                <TableHead>{t('docs.billing.col_window_limit')}</TableHead>
                <TableHead>{t('docs.billing.col_weekly_limit')}</TableHead>
                <TableHead>{t('docs.billing.col_models')}</TableHead>
                <TableHead>{t('docs.billing.col_overage')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className='font-medium'>Lite</TableCell>
                <TableCell>{t('docs.billing.plan_lite_price')}</TableCell>
                <TableCell>{t('docs.billing.plan_lite_window')}</TableCell>
                <TableCell>{t('docs.billing.plan_lite_weekly')}</TableCell>
                <TableCell>{t('docs.billing.plan_lite_models')}</TableCell>
                <TableCell>{t('docs.billing.plan_lite_overage')}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className='font-medium'>Pro</TableCell>
                <TableCell>{t('docs.billing.plan_pro_price')}</TableCell>
                <TableCell>{t('docs.billing.plan_pro_window')}</TableCell>
                <TableCell>{t('docs.billing.plan_pro_weekly')}</TableCell>
                <TableCell>{t('docs.billing.plan_pro_models')}</TableCell>
                <TableCell>{t('docs.billing.plan_pro_overage')}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className='font-medium'>Max 5x</TableCell>
                <TableCell>{t('docs.billing.plan_max5x_price')}</TableCell>
                <TableCell>{t('docs.billing.plan_max5x_window')}</TableCell>
                <TableCell>{t('docs.billing.plan_max5x_weekly')}</TableCell>
                <TableCell>{t('docs.billing.plan_max5x_models')}</TableCell>
                <TableCell>{t('docs.billing.plan_max5x_overage')}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className='font-medium'>Max 20x</TableCell>
                <TableCell>{t('docs.billing.plan_max20x_price')}</TableCell>
                <TableCell>{t('docs.billing.plan_max20x_window')}</TableCell>
                <TableCell>{t('docs.billing.plan_max20x_weekly')}</TableCell>
                <TableCell>{t('docs.billing.plan_max20x_models')}</TableCell>
                <TableCell>{t('docs.billing.plan_max20x_overage')}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        <p className='text-sm text-muted-foreground'>
          {t('docs.billing.plans_compare_hint')}{' '}
          <Link to='/pricing' className='text-primary hover:underline'>
            {t('docs.billing.plans_compare_link')}
          </Link>
        </p>
      </div>

      {/* Window quota mechanism */}
      <div className='space-y-4'>
        <h2 className='text-2xl font-semibold'>{t('docs.billing.window_title')}</h2>
        <p className='text-muted-foreground'>{t('docs.billing.window_desc')}</p>
        <div className='space-y-3'>
          <div className='rounded-lg border p-4'>
            <h3 className='font-semibold'>{t('docs.billing.window_how_title')}</h3>
            <ul className='mt-2 list-disc pl-6 text-sm text-muted-foreground space-y-1'>
              <li>{t('docs.billing.window_how_1')}</li>
              <li>{t('docs.billing.window_how_2')}</li>
              <li>{t('docs.billing.window_how_3')}</li>
              <li>{t('docs.billing.window_how_4')}</li>
            </ul>
          </div>
          <div className='rounded-lg border p-4'>
            <h3 className='font-semibold'>{t('docs.billing.window_example_title')}</h3>
            <p className='mt-2 text-sm text-muted-foreground'>
              {t('docs.billing.window_example_desc')}
            </p>
          </div>
        </div>
      </div>

      {/* Overage policy */}
      <div className='space-y-4'>
        <h2 className='text-2xl font-semibold'>{t('docs.billing.overage_title')}</h2>
        <p className='text-muted-foreground'>{t('docs.billing.overage_desc')}</p>
        <div className='overflow-x-auto'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('docs.billing.col_plan')}</TableHead>
                <TableHead>{t('docs.billing.overage_col_behavior')}</TableHead>
                <TableHead>{t('docs.billing.overage_col_detail')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className='font-medium'>Lite</TableCell>
                <TableCell>{t('docs.billing.overage_lite_behavior')}</TableCell>
                <TableCell className='text-muted-foreground'>{t('docs.billing.overage_lite_detail')}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className='font-medium'>Pro / Max</TableCell>
                <TableCell>{t('docs.billing.overage_pro_behavior')}</TableCell>
                <TableCell className='text-muted-foreground'>{t('docs.billing.overage_pro_detail')}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Monthly spending cap */}
      <div className='space-y-4'>
        <h2 className='text-2xl font-semibold'>{t('docs.billing.cap_title')}</h2>
        <p className='text-muted-foreground'>{t('docs.billing.cap_desc')}</p>
        <ul className='list-disc pl-6 text-sm text-muted-foreground space-y-1'>
          <li>{t('docs.billing.cap_1')}</li>
          <li>{t('docs.billing.cap_2')}</li>
          <li>{t('docs.billing.cap_3')}</li>
        </ul>
      </div>

      {/* Booster packs */}
      <div className='space-y-4'>
        <h2 className='text-2xl font-semibold'>{t('docs.billing.booster_title')}</h2>
        <p className='text-muted-foreground'>{t('docs.billing.booster_desc')}</p>
        <div className='rounded-lg border p-4'>
          <ul className='list-disc pl-6 text-sm text-muted-foreground space-y-1'>
            <li>{t('docs.billing.booster_1')}</li>
            <li>{t('docs.billing.booster_2')}</li>
            <li>{t('docs.billing.booster_3')}</li>
            <li>{t('docs.billing.booster_4')}</li>
          </ul>
        </div>
      </div>

      {/* Subscription management */}
      <div className='space-y-4'>
        <h2 className='text-2xl font-semibold'>{t('docs.billing.sub_title')}</h2>
        <div className='space-y-3'>
          <div className='rounded-lg border p-4'>
            <h3 className='font-semibold'>{t('docs.billing.sub_upgrade_title')}</h3>
            <p className='mt-2 text-sm text-muted-foreground'>{t('docs.billing.sub_upgrade_desc')}</p>
          </div>
          <div className='rounded-lg border p-4'>
            <h3 className='font-semibold'>{t('docs.billing.sub_downgrade_title')}</h3>
            <p className='mt-2 text-sm text-muted-foreground'>{t('docs.billing.sub_downgrade_desc')}</p>
          </div>
          <div className='rounded-lg border p-4'>
            <h3 className='font-semibold'>{t('docs.billing.sub_cancel_title')}</h3>
            <p className='mt-2 text-sm text-muted-foreground'>{t('docs.billing.sub_cancel_desc')}</p>
          </div>
          <div className='rounded-lg border p-4'>
            <h3 className='font-semibold'>{t('docs.billing.sub_renew_title')}</h3>
            <p className='mt-2 text-sm text-muted-foreground'>{t('docs.billing.sub_renew_desc')}</p>
          </div>
        </div>
      </div>

      {/* Billing cycle */}
      <div className='space-y-4'>
        <h2 className='text-2xl font-semibold'>{t('docs.billing.cycle_title')}</h2>
        <p className='text-muted-foreground'>{t('docs.billing.cycle_desc')}</p>
        <ul className='list-disc pl-6 text-sm text-muted-foreground space-y-1'>
          <li>{t('docs.billing.cycle_1')}</li>
          <li>{t('docs.billing.cycle_2')}</li>
          <li>{t('docs.billing.cycle_3')}</li>
        </ul>
      </div>

      {/* Where to check */}
      <div className='rounded-lg border p-4'>
        <h3 className='font-semibold'>{t('docs.billing.check_title')}</h3>
        <p className='mt-1 text-sm text-muted-foreground'>
          {t('docs.billing.check_desc_prefix')}{' '}
          <Link to='/usage' className='text-primary hover:underline'>
            {t('docs.billing.check_usage_link')}
          </Link>
          {t('docs.billing.check_desc_middle')}{' '}
          <Link to='/subscription' className='text-primary hover:underline'>
            {t('docs.billing.check_sub_link')}
          </Link>
          {t('docs.billing.check_desc_suffix')}
        </p>
      </div>
    </div>
  );
};

export default DocsBilling;
