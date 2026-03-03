import React, { useEffect, useState } from 'react';
import { API, showError, showSuccess, timestamp2string } from '../../helpers';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '../../components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { Rocket } from 'lucide-react';

const BoosterPage = () => {
  const [boosterPacks, setBoosterPacks] = useState([]);
  const [myBoosters, setMyBoosters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [selectedPack, setSelectedPack] = useState(null);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [packsRes, myRes] = await Promise.all([
        API.get('/api/booster/'),
        API.get('/api/booster/self'),
      ]);

      if (packsRes.data.success) {
        setBoosterPacks(packsRes.data.data || []);
      }
      if (myRes.data.success) {
        setMyBoosters(myRes.data.data || []);
      }
    } catch (err) {
      showError('加载加油包信息失败');
    }
    setLoading(false);
  };

  const handlePurchase = async () => {
    if (!selectedPack) return;
    setPurchasing(true);
    try {
      const res = await API.post('/api/booster/purchase', {
        booster_pack_id: selectedPack.id,
      });
      if (res.data.success) {
        showSuccess('购买成功');
        setPurchaseDialogOpen(false);
        loadData();
      } else {
        showError(res.data.message);
      }
    } catch (err) {
      showError('购买失败');
    }
    setPurchasing(false);
  };

  function renderBoosterStatus(status) {
    switch (status) {
      case 1:
        return <Badge variant='default'>使用中</Badge>;
      case 2:
        return <Badge variant='secondary'>已用完</Badge>;
      case 3:
        return <Badge variant='outline'>已过期</Badge>;
      default:
        return <Badge variant='outline'>未知</Badge>;
    }
  }

  if (loading) {
    return (
      <div className='flex items-center justify-center py-20 text-muted-foreground'>
        加载中...
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-2xl font-bold tracking-tight'>加油包</h1>
        <p className='text-muted-foreground'>购买额外请求额度，突破窗口限制。</p>
      </div>

      {/* Available booster packs */}
      <div>
        <h2 className='text-lg font-semibold mb-4'>可购加油包</h2>
        {boosterPacks.length === 0 ? (
          <Card>
            <CardContent className='p-6 text-center text-muted-foreground'>
              暂无可购加油包
            </CardContent>
          </Card>
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
            {boosterPacks.map((pack) => (
              <Card key={pack.id}>
                <CardHeader className='pb-2 text-center'>
                  <Rocket className='h-8 w-8 mx-auto text-primary mb-2' />
                  <CardTitle className='text-lg'>
                    {pack.display_name || pack.name}
                  </CardTitle>
                  {pack.description && (
                    <p className='text-sm text-muted-foreground'>{pack.description}</p>
                  )}
                </CardHeader>
                <CardContent className='text-center'>
                  <p className='text-3xl font-bold'>
                    ¥{(pack.price_cents / 100).toFixed(0)}
                  </p>
                  <p className='text-sm text-muted-foreground mt-2'>
                    +{pack.extra_count} 次额外请求
                  </p>
                  {pack.valid_duration_sec > 0 && (
                    <p className='text-xs text-muted-foreground'>
                      有效期 {Math.floor(pack.valid_duration_sec / 86400)} 天
                    </p>
                  )}
                </CardContent>
                <CardFooter>
                  <Button
                    className='w-full'
                    onClick={() => {
                      setSelectedPack(pack);
                      setPurchaseDialogOpen(true);
                    }}
                  >
                    购买
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* My booster packs */}
      <Card>
        <CardHeader className='pb-2'>
          <CardTitle className='text-sm font-medium'>我的加油包</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='rounded-md border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>加油包</TableHead>
                  <TableHead>剩余次数</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>过期时间</TableHead>
                  <TableHead>购买时间</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {myBoosters.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className='text-center py-8 text-muted-foreground'>
                      暂无加油包
                    </TableCell>
                  </TableRow>
                ) : (
                  myBoosters.map((bp) => (
                    <TableRow key={bp.id}>
                      <TableCell className='font-medium'>#{bp.booster_pack_id}</TableCell>
                      <TableCell>{bp.remain_count}</TableCell>
                      <TableCell>{renderBoosterStatus(bp.status)}</TableCell>
                      <TableCell className='text-xs text-muted-foreground'>
                        {bp.expire_time > 0 ? timestamp2string(bp.expire_time) : '永不过期'}
                      </TableCell>
                      <TableCell className='text-xs text-muted-foreground'>
                        {timestamp2string(bp.created_time)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Purchase dialog */}
      <Dialog open={purchaseDialogOpen} onOpenChange={setPurchaseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认购买</DialogTitle>
            <DialogDescription>
              确定要购买 {selectedPack?.display_name || selectedPack?.name} 加油包吗？
              价格: ¥{selectedPack ? (selectedPack.price_cents / 100).toFixed(2) : '0'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant='outline' onClick={() => setPurchaseDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handlePurchase} disabled={purchasing}>
              {purchasing ? '处理中...' : '确认购买'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BoosterPage;
