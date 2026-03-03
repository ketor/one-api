import React, { useEffect, useState } from 'react';
import { API, showError } from '../../helpers';
import StatCard from '../../components/business/StatCard';
import ModelUsageChart from '../../components/business/ModelUsageChart';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { Activity, Hash, DollarSign, Users } from 'lucide-react';

const AdminUsageMonitor = () => {
  const [overview, setOverview] = useState(null);
  const [modelStats, setModelStats] = useState([]);
  const [topUsers, setTopUsers] = useState([]);
  const [, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [overviewRes, modelRes, topUsersRes] = await Promise.all([
        API.get('/api/admin/usage/overview'),
        API.get('/api/admin/usage/by-model'),
        API.get('/api/admin/usage/top-users?limit=20'),
      ]);

      if (overviewRes.data.success) {
        setOverview(overviewRes.data.data);
      }
      if (modelRes.data.success) {
        setModelStats(modelRes.data.data || []);
      }
      if (topUsersRes.data.success) {
        setTopUsers(topUsersRes.data.data || []);
      }
    } catch (err) {
      showError('加载用量数据失败');
    }
    setLoading(false);
  };

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-2xl font-bold tracking-tight'>用量监控</h1>
        <p className='text-muted-foreground'>平台整体 API 调用统计和监控。</p>
      </div>

      {/* Overview stats */}
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

      {/* Model usage distribution */}
      <ModelUsageChart data={modelStats} title='模型用量分布（24h）' />

      {/* Top users */}
      <Card>
        <CardHeader className='pb-2'>
          <CardTitle className='text-sm font-medium'>用户用量排行（24h）</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='rounded-md border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>排名</TableHead>
                  <TableHead>用户 ID</TableHead>
                  <TableHead>请求数</TableHead>
                  <TableHead>Token 数</TableHead>
                  <TableHead>消耗额度</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className='text-center py-8 text-muted-foreground'>
                      暂无数据
                    </TableCell>
                  </TableRow>
                ) : (
                  topUsers.map((user, idx) => (
                    <TableRow key={user.user_id}>
                      <TableCell className='font-medium'>#{idx + 1}</TableCell>
                      <TableCell>{user.user_id}</TableCell>
                      <TableCell>{user.request_count?.toLocaleString()}</TableCell>
                      <TableCell>{user.total_tokens?.toLocaleString()}</TableCell>
                      <TableCell>{user.total_quota?.toLocaleString()}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminUsageMonitor;
