import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

const COLORS = [
  '#1677ff', '#00B5D8', '#52c41a', '#faad14', '#ff4d4f',
  '#722ED1', '#13c2c2', '#2F54EB', '#eb2f96', '#fa8c16',
];

const ModelUsageChart = ({ data, title, height = 350 }) => {
  const { t } = useTranslation();
  const displayTitle = title || t('console.model_chart.title');

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader className='pb-2'>
          <CardTitle className='text-sm font-medium'>{displayTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex items-center justify-center h-48 text-muted-foreground'>
            {t('console.model_chart.no_data')}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className='pb-2'>
        <CardTitle className='text-sm font-medium'>{displayTitle}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width='100%' height={height}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray='3 3' vertical={false} opacity={0.1} />
            <XAxis
              dataKey='model_name'
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#A3AED0' }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#A3AED0' }}
            />
            <Tooltip
              contentStyle={{
                background: '#0f1728',
                border: '1px solid rgba(255,255,255,0.10)',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                color: '#fff',
              }}
              labelStyle={{ color: 'rgba(255,255,255,0.80)' }}
              itemStyle={{ color: 'rgba(255,255,255,0.70)' }}
            />
            <Legend />
            <Bar dataKey='request_count' name={t('console.model_chart.request_count')} fill={COLORS[0]} radius={[4, 4, 0, 0]} />
            <Bar dataKey='total_tokens' name={t('console.model_chart.token_count')} fill={COLORS[1]} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default ModelUsageChart;
