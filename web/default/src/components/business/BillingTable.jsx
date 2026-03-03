import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { timestamp2string } from '../../helpers';

function renderOrderType(type) {
  const types = {
    1: '新订阅',
    2: '续费',
    3: '升级',
    4: '降级',
    5: '加油包',
  };
  return types[type] || '未知';
}

function renderOrderStatus(status) {
  switch (status) {
    case 1:
      return <Badge variant='secondary'>待支付</Badge>;
    case 2:
      return <Badge variant='default'>已支付</Badge>;
    case 3:
      return <Badge variant='outline'>已退款</Badge>;
    case 4:
      return <Badge variant='destructive'>已取消</Badge>;
    case 5:
      return <Badge variant='destructive'>失败</Badge>;
    default:
      return <Badge variant='outline'>未知</Badge>;
  }
}

const BillingTable = ({ orders, loading, page, onPageChange }) => {
  return (
    <div className='space-y-4'>
      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>订单号</TableHead>
              <TableHead>类型</TableHead>
              <TableHead>金额</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>支付方式</TableHead>
              <TableHead>创建时间</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className='text-center py-8 text-muted-foreground'>
                  加载中...
                </TableCell>
              </TableRow>
            ) : !orders || orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className='text-center py-8 text-muted-foreground'>
                  暂无订单记录
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className='font-mono text-xs'>{order.order_no}</TableCell>
                  <TableCell>{renderOrderType(order.type)}</TableCell>
                  <TableCell>¥{(order.amount_cents / 100).toFixed(2)}</TableCell>
                  <TableCell>{renderOrderStatus(order.status)}</TableCell>
                  <TableCell className='text-muted-foreground'>
                    {order.payment_method || '-'}
                  </TableCell>
                  <TableCell className='text-xs text-muted-foreground'>
                    {timestamp2string(order.created_time)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {onPageChange && (
        <div className='flex justify-center gap-2'>
          <Button
            variant='outline'
            size='sm'
            disabled={page === 0}
            onClick={() => onPageChange(Math.max(0, page - 1))}
          >
            上一页
          </Button>
          <Button
            variant='outline'
            size='sm'
            disabled={!orders || orders.length < 10}
            onClick={() => onPageChange(page + 1)}
          >
            下一页
          </Button>
        </div>
      )}
    </div>
  );
};

export default BillingTable;
