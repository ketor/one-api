import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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
  Clock,
  RefreshCw,
} from 'lucide-react';

const BAR_COLORS = [
  '#4318FF', '#00B5D8', '#6C63FF', '#05CD99', '#FFB547',
  '#FF5E7D', '#41B883', '#7983FF', '#FF8F6B', '#49BEFF',
];

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' });
};

const DashboardPage = () => {
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
      showError('加载数据失败');
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
    { name: 'API 密钥', to: '/keys', icon: Key },
    { name: '订阅管理', to: '/subscription', icon: CreditCard },
    { name: '用量统计', to: '/usage', icon: BarChart3 },
    { name: '加油包', to: '/booster', icon: Rocket },
  ];

  // Window status summary
  const renderWindowSummary = () => {
    if (!quotaInfo || !quotaInfo.has_subscription) return null;

    const total = quotaInfo.window_limit + (quotaInfo.booster_extra || 0);
    const used = quotaInfo.window_used || 0;
    const remaining = quotaInfo.remaining || 0;
    const percentage = total > 0 ? Math.min((used / total) * 100, 100) : 0;
    const windowSec = quotaInfo.window_duration || 18000;
    const hours = Math.floor(windowSec / 3600);

    return (
      <Card>
        <CardHeader className='pb-2'>
          <div className='flex items-center gap-2'>
            <Clock className='h-4 w-4 text-muted-foreground' />
            <CardTitle className='text-sm font-medium'>
              {hours}小时窗口状态
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-2 sm:grid-cols-4 gap-4'>
            <div>
              <p className='text-xs text-muted-foreground'>窗口总额</p>
              <p className='text-lg font-bold'>{total.toLocaleString()}</p>
            </div>
            <div>
              <p className='text-xs text-muted-foreground'>已使用</p>
              <p className='text-lg font-bold'>{used.toLocaleString()}</p>
            </div>
            <div>
              <p className='text-xs text-muted-foreground'>剩余</p>
              <p className='text-lg font-bold text-green-600'>{remaining.toLocaleString()}</p>
            </div>
            <div>
              <p className='text-xs text-muted-foreground'>使用率</p>
              <p className={`text-lg font-bold ${percentage >= 90 ? 'text-red-600' : percentage >= 70 ? 'text-orange-500' : 'text-green-600'}`}>
                {percentage.toFixed(1)}%
              </p>
            </div>
          </div>
          {quotaInfo.booster_extra > 0 && (
            <p className='text-xs text-muted-foreground mt-2'>
              含加油包额度 +{quotaInfo.booster_extra}
            </p>
          )}
          {quotaInfo.plan_name && (
            <p className='text-xs text-muted-foreground mt-1'>
              当前套餐: {quotaInfo.plan_name}
            </p>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>数据看板</h1>
          <p className='text-muted-foreground'>欢迎回来，这是您的使用概览。</p>
        </div>
        <Button
          variant='outline'
          size='icon'
          onClick={loadData}
          title='刷新'
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Quota usage bar */}
      <QuotaUsageBar quotaInfo={quotaInfo} />

      {/* Stats */}
      <div className='grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'>
        <StatCard
          title='今日请求'
          value={todayRequests.toLocaleString()}
          icon={Activity}
        />
        <StatCard
          title='今日 Token'
          value={todayTokens.toLocaleString()}
          icon={Hash}
        />
        <StatCard
          title='今日配额消费'
          value={renderQuota(todayQuota)}
          icon={DollarSign}
        />
        <StatCard
          title='当前套餐'
          value={quotaInfo?.plan_name || '无'}
          icon={Zap}
        />
      </div>

      {/* Window status summary */}
      {renderWindowSummary()}

      {/* Quick links */}
      <Card>
        <CardHeader className='pb-2'>
          <CardTitle className='text-sm font-medium'>快捷入口</CardTitle>
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
        title='近 7 天请求趋势'
        dataKey='requests'
        color='#4318FF'
        height={250}
      />

      {/* 7-day token consumption trend */}
      <UsageChart
        data={chartData}
        title='近 7 天 Token 消耗趋势'
        dataKey='tokens'
        color='#6C63FF'
        height={250}
      />

      {/* 7-day quota consumption trend */}
      <Card>
        <CardHeader className='pb-2'>
          <CardTitle className='text-sm font-medium'>近 7 天配额消费趋势</CardTitle>
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
                  background: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                }}
                labelFormatter={formatDate}
                formatter={(value) => [typeof value === 'number' ? value.toFixed(6) : value, '配额']}
              />
              <Line
                type='monotone'
                dataKey='quota'
                stroke='#00B5D8'
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
            <CardTitle className='text-sm font-medium'>模型使用分布 (Token)</CardTitle>
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
                    background: '#fff',
                    border: 'none',
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
