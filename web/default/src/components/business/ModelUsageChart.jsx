import React from 'react';
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
  '#4318FF', '#00B5D8', '#6C63FF', '#05CD99', '#FFB547',
  '#FF5E7D', '#41B883', '#7983FF', '#FF8F6B', '#49BEFF',
];

const ModelUsageChart = ({ data, title = '模型用量分布', height = 350 }) => {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader className='pb-2'>
          <CardTitle className='text-sm font-medium'>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex items-center justify-center h-48 text-muted-foreground'>
            暂无数据
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className='pb-2'>
        <CardTitle className='text-sm font-medium'>{title}</CardTitle>
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
                background: '#fff',
                border: 'none',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              }}
            />
            <Legend />
            <Bar dataKey='request_count' name='请求数' fill={COLORS[0]} radius={[4, 4, 0, 0]} />
            <Bar dataKey='total_tokens' name='Token 数' fill={COLORS[1]} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default ModelUsageChart;
