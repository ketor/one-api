import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { API, showError } from '../../helpers';
import { renderQuota } from '../../helpers/render';
import StatCard from '../../components/business/StatCard';
import QuotaUsageBar from '../../components/business/QuotaUsageBar';
import UsageChart from '../../components/business/UsageChart';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  BarChart3,
  Key,
  CreditCard,
  Rocket,
  Activity,
  Zap,
  Hash,
  DollarSign,
  RefreshCw,
} from 'lucide-react';

const BAR_COLORS = [
  '#1677ff', '#00B5D8', '#52c41a', '#faad14', '#ff4d4f',
  '#722ED1', '#13c2c2', '#2F54EB', '#eb2f96', '#fa8c16',
];

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' });
};

const DashboardPage = () => {
  const { t } = useTranslation();
  const [quotaInfo, setQuotaInfo] = useState(null);
  const [dashboardData, setDashboardData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [quotaRes, dashRes] = await Promise.all([
        API.get('/api/subscription/quota'),
        API.get('/api/user/dashboard'),
      ]);

      if (quotaRes.data.success) {
        setQuotaInfo(quotaRes.data.data);
      }

      if (dashRes.data.success) {
        setDashboardData(dashRes.data.data || []);
      }
    } catch (err) {
      showError(t('console.dashboard.load_failed'));
    }
    setLoading(false);
  };

  // Process time-series data for line charts (7 days)
  const processTimeSeriesData = () => {
    const dailyData = {};
    const maxDate = new Date();
    const minDate = new Date();
    minDate.setDate(minDate.getDate() - 6);

    for (let d = new Date(minDate); d <= maxDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      dailyData[dateStr] = { date: dateStr, requests: 0, tokens: 0, quota: 0 };
    }

    if (Array.isArray(dashboardData)) {
      dashboardData.forEach((item) => {
        if (dailyData[item.Day]) {
          dailyData[item.Day].requests += item.RequestCount || 0;
          dailyData[item.Day].tokens += (item.PromptTokens || 0) + (item.CompletionTokens || 0);
          dailyData[item.Day].quota += (item.Quota || 0) / 1000000;
        }
      });
    }

    return Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date));
  };

  // Process model distribution data for stacked bar chart
  const processModelData = () => {
    const timeData = {};
    const maxDate = new Date();
    const minDate = new Date();
    minDate.setDate(minDate.getDate() - 6);

    const models = Array.isArray(dashboardData)
      ? [...new Set(dashboardData.map((item) => item.ModelName))]
      : [];

    for (let d = new Date(minDate); d <= maxDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      timeData[dateStr] = { date: dateStr };
      models.forEach((model) => {
        timeData[dateStr][model] = 0;
      });
    }

    if (Array.isArray(dashboardData)) {
      dashboardData.forEach((item) => {
        if (timeData[item.Day]) {
          timeData[item.Day][item.ModelName] =
            (item.PromptTokens || 0) + (item.CompletionTokens || 0);
        }
      });
    }

    return { chartData: Object.values(timeData).sort((a, b) => a.date.localeCompare(b.date)), models };
  };

  const chartData = processTimeSeriesData();
  const { chartData: modelChartData, models } = processModelData();

  const todayStr = new Date().toISOString().split('T')[0];
  const todayData = Array.isArray(dashboardData)
    ? dashboardData.filter((item) => item.Day === todayStr)
    : [];
  const todayRequests = todayData.reduce((sum, item) => sum + (item.RequestCount || 0), 0);
  const todayTokens = todayData.reduce(
    (sum, item) => sum + (item.PromptTokens || 0) + (item.CompletionTokens || 0),
    0
  );
  const todayQuota = todayData.reduce((sum, item) => sum + (item.Quota || 0), 0);

  const quickLinks = [
    { name: t('console.dashboard.quick_links.api_keys'), to: '/keys', icon: Key },
    { name: t('console.dashboard.quick_links.subscription'), to: '/subscription', icon: CreditCard },
    { name: t('console.dashboard.quick_links.usage'), to: '/usage', icon: BarChart3 },
    { name: t('console.dashboard.quick_links.booster'), to: '/booster', icon: Rocket },
  ];

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>{t('console.dashboard.title')}</h1>
          <p className='text-muted-foreground'>{t('console.dashboard.subtitle')}</p>
        </div>
        <Button
          variant='outline'
          size='icon'
          onClick={loadData}
          title={t('console.common.refresh')}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Quota usage bar */}
      <QuotaUsageBar quotaInfo={quotaInfo} />

      {/* Stats */}
      <div className='grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'>
        <StatCard
          title={t('console.dashboard.today_requests')}
          value={todayRequests.toLocaleString()}
          icon={Activity}
        />
        <StatCard
          title={t('console.dashboard.today_tokens')}
          value={todayTokens.toLocaleString()}
          icon={Hash}
        />
        <StatCard
          title={t('console.dashboard.today_quota')}
          value={renderQuota(todayQuota)}
          icon={DollarSign}
        />
        <StatCard
          title={t('console.dashboard.current_plan')}
          value={quotaInfo?.plan_name || t('console.dashboard.none')}
          icon={Zap}
        />
      </div>

      {/* Quick links */}
      <Card>
        <CardHeader className='pb-2'>
          <CardTitle className='text-sm font-medium'>{t('console.dashboard.quick_access')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
            {quickLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Button
                  key={link.to}
                  variant='outline'
                  className='h-auto py-4 flex-col gap-2'
                  asChild
                >
                  <Link to={link.to}>
                    <Icon className='h-5 w-5' />
                    <span className='text-xs'>{link.name}</span>
                  </Link>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 7-day request trend */}
      <UsageChart
        data={chartData}
        title={t('console.dashboard.request_trend_7d')}
        dataKey='requests'
        color='#1677ff'
        height={250}
      />

      {/* 7-day token consumption trend */}
      <UsageChart
        data={chartData}
        title={t('console.dashboard.token_trend_7d')}
        dataKey='tokens'
        color='#13c2c2'
        height={250}
      />

      {/* 7-day quota consumption trend */}
      <Card>
        <CardHeader className='pb-2'>
          <CardTitle className='text-sm font-medium'>{t('console.dashboard.quota_trend_7d')}</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width='100%' height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray='3 3' vertical={false} opacity={0.1} />
              <XAxis
                dataKey='date'
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#A3AED0' }}
                tickFormatter={formatDate}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#A3AED0' }}
              />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--card))',
                  color: 'hsl(var(--card-foreground))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                }}
                labelFormatter={formatDate}
                formatter={(value) => [typeof value === 'number' ? value.toFixed(6) : value, t('console.dashboard.quota_label')]}
              />
              <Line
                type='monotone'
                dataKey='quota'
                stroke='#52c41a'
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Model usage distribution - stacked bar chart */}
      {models.length > 0 && (
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>{t('console.dashboard.model_distribution')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width='100%' height={300}>
              <BarChart data={modelChartData}>
                <CartesianGrid strokeDasharray='3 3' vertical={false} opacity={0.1} />
                <XAxis
                  dataKey='date'
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#A3AED0' }}
                  tickFormatter={formatDate}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#A3AED0' }}
                />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    color: 'hsl(var(--card-foreground))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  }}
                  labelFormatter={formatDate}
                />
                <Legend wrapperStyle={{ paddingTop: '10px' }} />
                {models.map((model, index) => (
                  <Bar
                    key={model}
                    dataKey={model}
                    stackId='a'
                    fill={BAR_COLORS[index % BAR_COLORS.length]}
                    name={model}
                    radius={index === models.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DashboardPage;
