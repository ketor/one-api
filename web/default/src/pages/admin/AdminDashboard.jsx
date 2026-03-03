import React, { useEffect, useState } from 'react';
import { API, showError } from '../../helpers';
import StatCard from '../../components/business/StatCard';
import ModelUsageChart from '../../components/business/ModelUsageChart';
import { Activity, Users, Hash, DollarSign } from 'lucide-react';

const AdminDashboard = () => {
  const [overview, setOverview] = useState(null);
  const [modelStats, setModelStats] = useState([]);
  const [, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [overviewRes, modelRes] = await Promise.all([
        API.get('/api/admin/usage/overview'),
        API.get('/api/admin/usage/by-model'),
      ]);

      if (overviewRes.data.success) {
        setOverview(overviewRes.data.data);
      }
      if (modelRes.data.success) {
        setModelStats(modelRes.data.data || []);
      }
    } catch (err) {
      showError('加载数据失败');
    }
    setLoading(false);
  };

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-2xl font-bold tracking-tight'>数据看板</h1>
        <p className='text-muted-foreground'>平台整体运营数据概览。</p>
      </div>

      <div className='grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'>
        <StatCard
          title='24h 请求总量'
          value={overview?.total_requests_24h?.toLocaleString() || '0'}
          icon={Activity}
        />
        <StatCard
          title='24h Token 总量'
          value={overview?.total_tokens_24h?.toLocaleString() || '0'}
          icon={Hash}
        />
        <StatCard
          title='24h 消耗额度'
          value={overview?.total_quota_24h?.toLocaleString() || '0'}
          icon={DollarSign}
        />
        <StatCard
          title='24h 活跃用户'
          value={overview?.active_users_24h?.toLocaleString() || '0'}
          icon={Users}
        />
      </div>

      <ModelUsageChart data={modelStats} title='模型用量分布（24h）' />
    </div>
  );
};

export default AdminDashboard;
