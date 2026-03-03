import React, { useEffect, useState, useCallback, useRef } from 'react';
import { API, showError, showSuccess, copy, timestamp2string } from '../../helpers';
import { renderQuota, renderColorLabel } from '../../helpers/render';
import StatCard from '../../components/business/StatCard';
import UsageChart from '../../components/business/UsageChart';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import {
  Activity,
  Timer,
  RefreshCw,
  Search,
  ArrowUpDown,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Zap,
} from 'lucide-react';

const LOG_TYPE_OPTIONS = [
  { value: '0', label: '全部类型' },
  { value: '1', label: '充值' },
  { value: '2', label: '消费' },
  { value: '3', label: '管理' },
  { value: '4', label: '系统' },
];

function renderLogType(type) {
  switch (type) {
    case 1:
      return <Badge variant='outline' className='bg-green-50 text-green-700 border-green-200'>充值</Badge>;
    case 2:
      return <Badge variant='outline' className='bg-blue-50 text-blue-700 border-blue-200'>消费</Badge>;
    case 3:
      return <Badge variant='outline' className='bg-orange-50 text-orange-700 border-orange-200'>管理</Badge>;
    case 4:
      return <Badge variant='outline' className='bg-purple-50 text-purple-700 border-purple-200'>系统</Badge>;
    default:
      return <Badge variant='outline'>未知</Badge>;
  }
}

const UsagePage = () => {
  const [quotaData, setQuotaData] = useState(null);
  const [dashboardData, setDashboardData] = useState([]);
  const [logs, setLogs] = useState([]);
  const [logPage, setLogPage] = useState(0);
  const [logType, setLogType] = useState('0');
  const [tokenName, setTokenName] = useState('');
  const [modelName, setModelName] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [availableModels, setAvailableModels] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [countdown, setCountdown] = useState('');
  const [sortKey, setSortKey] = useState('');
  const [sortDir, setSortDir] = useState('desc');
  const timerRef = useRef(null);
  const refreshRef = useRef(null);

  // Load subscription quota data
  const loadQuotaData = useCallback(async () => {
    try {
      const res = await API.get('/api/subscription/quota');
      if (res.data.success) {
        setQuotaData(res.data.data);
      }
    } catch (err) {
      // Subscription might not be available, fall back to window usage
      try {
        const res = await API.get('/api/usage/window');
        if (res.data.success) {
          setQuotaData({
            has_subscription: false,
            window_used: res.data.data.request_count || 0,
            window_limit: 0,
            window_duration_sec: res.data.data.window_duration_sec || 18000,
            window_start_time: 0,
          });
        }
      } catch (e) {
        // ignore
      }
    }
  }, []);

  // Load dashboard chart data
  const loadDashboardData = useCallback(async () => {
    try {
      const res = await API.get('/api/user/dashboard');
      if (res.data.success) {
        setDashboardData(res.data.data || []);
      }
    } catch (err) {
      // ignore
    }
  }, []);

  // Load available models for filter dropdown
  const loadAvailableModels = useCallback(async () => {
    try {
      const res = await API.get('/api/user/available_models');
      if (res.data.success && Array.isArray(res.data.data)) {
        setAvailableModels(res.data.data);
      }
    } catch (err) {
      // ignore
    }
  }, []);

  // Load logs using /api/log/self/
  const loadLogs = useCallback(async (page = 0) => {
    setLogsLoading(true);
    try {
      let url = `/api/log/self?p=${page}&type=${logType}`;
      if (tokenName) url += `&token_name=${encodeURIComponent(tokenName)}`;
      if (modelName) url += `&model_name=${encodeURIComponent(modelName)}`;
      if (startTime) {
        url += `&start_timestamp=${Math.floor(new Date(startTime).getTime() / 1000)}`;
      }
      if (endTime) {
        url += `&end_timestamp=${Math.floor(new Date(endTime).getTime() / 1000)}`;
      }
      const res = await API.get(url);
      if (res.data.success) {
        setLogs(res.data.data || []);
      }
    } catch (err) {
      showError('加载日志失败');
    }
    setLogsLoading(false);
  }, [logType, tokenName, modelName, startTime, endTime]);

  // Initial data load
  useEffect(() => {
    Promise.all([loadQuotaData(), loadDashboardData(), loadAvailableModels()]);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load logs when page or filters change
  useEffect(() => {
    loadLogs(logPage);
  }, [logPage, loadLogs]);

  // Auto-refresh quota every 30 seconds
  useEffect(() => {
    refreshRef.current = setInterval(() => {
      loadQuotaData();
    }, 30000);
    return () => clearInterval(refreshRef.current);
  }, [loadQuotaData]);

  // Countdown timer
  useEffect(() => {
    const updateCountdown = () => {
      if (!quotaData || !quotaData.window_start_time || !quotaData.window_duration_sec) {
        setCountdown('');
        return;
      }
      const windowEndMs = (quotaData.window_start_time + quotaData.window_duration_sec) * 1000;
      const now = Date.now();
      const remainMs = windowEndMs - now;
      if (remainMs <= 0) {
        setCountdown('即将重置');
        return;
      }
      const h = Math.floor(remainMs / 3600000);
      const m = Math.floor((remainMs % 3600000) / 60000);
      const s = Math.floor((remainMs % 60000) / 1000);
      setCountdown(`${h}h ${m}m ${s}s`);
    };

    updateCountdown();
    timerRef.current = setInterval(updateCountdown, 1000);
    return () => clearInterval(timerRef.current);
  }, [quotaData]);

  // Process chart data for 7-day trend
  const processChartData = () => {
    const dailyData = {};
    const maxDate = new Date();
    const minDate = new Date();
    minDate.setDate(minDate.getDate() - 6);

    for (let d = new Date(minDate); d <= maxDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      dailyData[dateStr] = { date: dateStr, requests: 0, tokens: 0 };
    }

    if (Array.isArray(dashboardData)) {
      dashboardData.forEach((item) => {
        if (dailyData[item.Day]) {
          dailyData[item.Day].requests += item.RequestCount || 0;
          dailyData[item.Day].tokens += (item.PromptTokens || 0) + (item.CompletionTokens || 0);
        }
      });
    }

    return Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date));
  };

  const chartData = processChartData();

  // Sort logs
  const handleSort = (key) => {
    let dir = 'desc';
    if (sortKey === key && sortDir === 'desc') {
      dir = 'asc';
    }
    setSortKey(key);
    setSortDir(dir);
  };

  const sortedLogs = [...logs].sort((a, b) => {
    if (!sortKey) return 0;
    const aVal = a[sortKey];
    const bVal = b[sortKey];
    if (typeof aVal === 'string') {
      return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    return sortDir === 'asc' ? (aVal || 0) - (bVal || 0) : (bVal || 0) - (aVal || 0);
  });

  // Handle search/filter
  const handleSearch = () => {
    setLogPage(0);
    loadLogs(0);
  };

  const handleReset = () => {
    setTokenName('');
    setModelName('');
    setStartTime('');
    setEndTime('');
    setLogType('0');
    setLogPage(0);
  };

  // Compute window usage status
  const windowHours = quotaData ? Math.floor(quotaData.window_duration_sec / 3600) : 5;
  const windowUsed = quotaData?.window_used || 0;
  const windowLimit = quotaData?.window_limit || 0;
  const usagePercent = windowLimit > 0 ? Math.min(100, (windowUsed / windowLimit) * 100) : 0;
  const isOverLimit = windowLimit > 0 && windowUsed >= windowLimit;
  const hasSubscription = quotaData?.has_subscription;

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>用量统计</h1>
          <p className='text-muted-foreground'>查看您的 API 调用用量和消费详情。</p>
        </div>
        <Button variant='outline' size='sm' onClick={() => { loadQuotaData(); loadDashboardData(); }}>
          <RefreshCw className='h-4 w-4 mr-1' />
          刷新
        </Button>
      </div>

      {/* 5-Hour Window Status Area */}
      {hasSubscription && (
        <Card className={isOverLimit ? 'border-destructive' : ''}>
          <CardHeader className='pb-3'>
            <div className='flex items-center justify-between'>
              <CardTitle className='text-sm font-medium flex items-center gap-2'>
                <Zap className='h-4 w-4' />
                {quotaData?.plan_name || '订阅'} - {windowHours}小时窗口配额
              </CardTitle>
              {isOverLimit ? (
                <Badge variant='destructive' className='flex items-center gap-1'>
                  <AlertTriangle className='h-3 w-3' />
                  已超额
                </Badge>
              ) : (
                <Badge variant='outline' className='flex items-center gap-1 bg-green-50 text-green-700 border-green-200'>
                  <CheckCircle2 className='h-3 w-3' />
                  正常
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className='grid gap-6 md:grid-cols-2'>
              {/* Usage Progress */}
              <div className='space-y-3'>
                <div className='flex items-end justify-between'>
                  <div>
                    <p className='text-3xl font-bold'>
                      {windowUsed}
                      <span className='text-lg font-normal text-muted-foreground'>
                        {windowLimit > 0 ? ` / ${windowLimit}` : ''}
                      </span>
                    </p>
                    <p className='text-sm text-muted-foreground'>次请求</p>
                  </div>
                  {windowLimit > 0 && (
                    <p className='text-sm font-medium'>
                      {usagePercent.toFixed(0)}%
                    </p>
                  )}
                </div>
                {windowLimit > 0 && (
                  <Progress
                    value={usagePercent}
                    className={`h-3 ${isOverLimit ? '[&>div]:bg-destructive' : ''}`}
                  />
                )}
              </div>

              {/* Countdown */}
              <div className='flex flex-col justify-center items-center rounded-lg bg-muted/50 p-4'>
                <div className='flex items-center gap-2 mb-1'>
                  <Timer className='h-4 w-4 text-muted-foreground' />
                  <p className='text-sm text-muted-foreground'>窗口重置倒计时</p>
                </div>
                <p className='text-2xl font-mono font-bold'>
                  {countdown || '--:--:--'}
                </p>
                <p className='text-xs text-muted-foreground mt-1'>每30秒自动刷新</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overview Stats (for non-subscription or additional info) */}
      {!hasSubscription && (
        <div className='grid gap-4 grid-cols-1 sm:grid-cols-3'>
          <StatCard
            title={`当前${windowHours}h窗口请求`}
            value={windowUsed.toLocaleString()}
            icon={Activity}
          />
          <StatCard
            title='窗口周期'
            value={`${windowHours} 小时`}
            icon={Clock}
          />
          <StatCard
            title='今日请求'
            value={chartData.length > 0 ? chartData[chartData.length - 1].requests.toLocaleString() : '0'}
            icon={Zap}
          />
        </div>
      )}

      {/* 7-Day Charts */}
      <div className='grid gap-4 grid-cols-1 lg:grid-cols-2'>
        <UsageChart
          data={chartData}
          title='近 7 天请求趋势'
          dataKey='requests'
          color='#4318FF'
          height={250}
        />
        <UsageChart
          data={chartData}
          title='近 7 天 Token 消耗'
          dataKey='tokens'
          color='#00B5D8'
          height={250}
        />
      </div>

      {/* Log Search and Filter */}
      <Card>
        <CardHeader className='pb-3'>
          <CardTitle className='text-sm font-medium flex items-center gap-2'>
            <Search className='h-4 w-4' />
            日志筛选
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'>
            <div className='space-y-1'>
              <label className='text-xs font-medium text-muted-foreground'>开始时间</label>
              <Input
                type='datetime-local'
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className='h-9'
              />
            </div>
            <div className='space-y-1'>
              <label className='text-xs font-medium text-muted-foreground'>结束时间</label>
              <Input
                type='datetime-local'
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className='h-9'
              />
            </div>
            <div className='space-y-1'>
              <label className='text-xs font-medium text-muted-foreground'>模型名称</label>
              <Select value={modelName} onValueChange={(v) => setModelName(v === '__all__' ? '' : v)}>
                <SelectTrigger className='h-9'>
                  <SelectValue placeholder='全部模型' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='__all__'>全部模型</SelectItem>
                  {availableModels.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-1'>
              <label className='text-xs font-medium text-muted-foreground'>Token 名称</label>
              <Input
                value={tokenName}
                onChange={(e) => setTokenName(e.target.value)}
                placeholder='输入 Token 名称'
                className='h-9'
              />
            </div>
          </div>
          <div className='flex items-center gap-2 mt-3'>
            <Select value={logType} onValueChange={setLogType}>
              <SelectTrigger className='w-[140px] h-9'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LOG_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size='sm' onClick={handleSearch}>
              <Search className='h-4 w-4 mr-1' />
              查询
            </Button>
            <Button size='sm' variant='outline' onClick={handleReset}>
              重置
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Log Details Table */}
      <Card>
        <CardHeader className='pb-2'>
          <CardTitle className='text-sm font-medium'>调用明细</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='rounded-md border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className='cursor-pointer select-none'
                    onClick={() => handleSort('created_at')}
                  >
                    <div className='flex items-center gap-1'>
                      时间
                      <ArrowUpDown className='h-3 w-3' />
                    </div>
                  </TableHead>
                  <TableHead
                    className='cursor-pointer select-none'
                    onClick={() => handleSort('type')}
                  >
                    <div className='flex items-center gap-1'>
                      类型
                      <ArrowUpDown className='h-3 w-3' />
                    </div>
                  </TableHead>
                  <TableHead
                    className='cursor-pointer select-none'
                    onClick={() => handleSort('model_name')}
                  >
                    <div className='flex items-center gap-1'>
                      模型
                      <ArrowUpDown className='h-3 w-3' />
                    </div>
                  </TableHead>
                  <TableHead>Token 名称</TableHead>
                  <TableHead
                    className='cursor-pointer select-none'
                    onClick={() => handleSort('prompt_tokens')}
                  >
                    <div className='flex items-center gap-1'>
                      提示 Token
                      <ArrowUpDown className='h-3 w-3' />
                    </div>
                  </TableHead>
                  <TableHead
                    className='cursor-pointer select-none'
                    onClick={() => handleSort('completion_tokens')}
                  >
                    <div className='flex items-center gap-1'>
                      完成 Token
                      <ArrowUpDown className='h-3 w-3' />
                    </div>
                  </TableHead>
                  <TableHead
                    className='cursor-pointer select-none'
                    onClick={() => handleSort('quota')}
                  >
                    <div className='flex items-center gap-1'>
                      消耗额度
                      <ArrowUpDown className='h-3 w-3' />
                    </div>
                  </TableHead>
                  <TableHead>详情</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logsLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className='text-center py-8 text-muted-foreground'>
                      加载中...
                    </TableCell>
                  </TableRow>
                ) : sortedLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className='text-center py-8 text-muted-foreground'>
                      暂无调用记录
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className='text-xs whitespace-nowrap'>
                        <span
                          className='cursor-pointer hover:text-primary'
                          onClick={async () => {
                            if (log.request_id && await copy(log.request_id)) {
                              showSuccess(`已复制请求 ID：${log.request_id}`);
                            }
                          }}
                          title={log.request_id ? `点击复制请求 ID: ${log.request_id}` : ''}
                        >
                          {timestamp2string(log.created_at)}
                        </span>
                      </TableCell>
                      <TableCell>{renderLogType(log.type)}</TableCell>
                      <TableCell className='text-sm'>
                        {log.model_name ? renderColorLabel(log.model_name) : '-'}
                      </TableCell>
                      <TableCell className='text-sm'>
                        {log.token_name ? renderColorLabel(log.token_name) : '-'}
                      </TableCell>
                      <TableCell className='text-sm'>
                        {log.prompt_tokens || '-'}
                      </TableCell>
                      <TableCell className='text-sm'>
                        {log.completion_tokens || '-'}
                      </TableCell>
                      <TableCell className='text-sm'>
                        {log.quota ? renderQuota(log.quota, (k) => k, 6) : '-'}
                      </TableCell>
                      <TableCell className='text-xs text-muted-foreground max-w-[200px] truncate'>
                        {log.content || '-'}
                        {log.elapsed_time > 0 && (
                          <Badge variant='outline' className='ml-1 text-[10px] px-1 py-0'>
                            {log.elapsed_time}ms
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <div className='flex justify-center gap-2 mt-4'>
            <Button
              variant='outline'
              size='sm'
              disabled={logPage === 0}
              onClick={() => setLogPage((p) => Math.max(0, p - 1))}
            >
              上一页
            </Button>
            <span className='flex items-center text-sm text-muted-foreground px-2'>
              第 {logPage + 1} 页
            </span>
            <Button
              variant='outline'
              size='sm'
              disabled={logs.length < 10}
              onClick={() => setLogPage((p) => p + 1)}
            >
              下一页
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UsagePage;
