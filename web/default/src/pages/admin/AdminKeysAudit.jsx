import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { API, showError, showSuccess } from '../../helpers';
import {
  renderGroup,
  renderNumber,
  renderQuota,
} from '../../helpers/render';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '../../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import {
  Search,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  ShieldCheck,
  ShieldMinus,
  Ban,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const ITEMS_PER_PAGE = 10;

function renderRole(role) {
  switch (role) {
    case 1:
      return <Badge variant='secondary'>普通用户</Badge>;
    case 10:
      return <Badge variant='default'>管理员</Badge>;
    case 100:
      return <Badge variant='destructive'>超级管理员</Badge>;
    default:
      return <Badge variant='outline'>未知</Badge>;
  }
}

function renderStatus(status) {
  switch (status) {
    case 1:
      return <Badge className='bg-green-100 text-green-800 border-green-300 hover:bg-green-100'>正常</Badge>;
    case 2:
      return <Badge variant='destructive'>已封禁</Badge>;
    default:
      return <Badge variant='outline'>未知</Badge>;
  }
}

const AdminKeysAudit = () => {
  const [users, setUsers] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [orderBy, setOrderBy] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get(`/api/user/?p=${page}&order=${orderBy}`);
      const { success, message, data } = res.data;
      if (success) {
        setUsers(data || []);
      } else {
        showError(message);
      }
    } catch (err) {
      showError('加载用户列表失败');
    }
    setLoading(false);
  }, [page, orderBy]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const searchUsers = async () => {
    if (!searchKeyword) {
      setPage(0);
      loadUsers();
      return;
    }
    setLoading(true);
    try {
      const res = await API.get(`/api/user/search?keyword=${searchKeyword}`);
      const { success, message, data } = res.data;
      if (success) {
        setUsers(data || []);
        setPage(0);
      } else {
        showError(message);
      }
    } catch (err) {
      showError('搜索失败');
    }
    setLoading(false);
  };

  const manageUser = async (username, action, idx) => {
    try {
      const res = await API.post('/api/user/manage', { username, action });
      const { success, message } = res.data;
      if (success) {
        showSuccess('操作成功');
        if (action === 'delete') {
          setUsers((prev) => prev.filter((_, i) => i !== idx));
        } else {
          const user = res.data.data;
          setUsers((prev) => {
            const next = [...prev];
            next[idx] = { ...next[idx], status: user.status, role: user.role };
            return next;
          });
        }
      } else {
        showError(message);
      }
    } catch (err) {
      showError('操作失败');
    }
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    manageUser(deleteTarget.username, 'delete', deleteTarget.idx);
    setDeleteDialogOpen(false);
    setDeleteTarget(null);
  };

  const handleOrderByChange = (value) => {
    setOrderBy(value === '__default__' ? '' : value);
    setPage(0);
  };

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>用户管理</h1>
          <p className='text-muted-foreground'>
            管理平台所有用户，包括角色、状态和配额。
          </p>
        </div>
        <Button asChild>
          <Link to='/user/add'>
            <Plus className='h-4 w-4 mr-1' />
            创建用户
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className='pb-2'>
          <CardTitle className='text-sm font-medium'>用户列表</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex items-center gap-2 mb-4'>
            <div className='relative flex-1 max-w-sm'>
              <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
              <Input
                placeholder='搜索用户名...'
                className='pl-8'
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchUsers()}
              />
            </div>
            <Button variant='outline' size='sm' onClick={searchUsers}>
              搜索
            </Button>
            <Select value={orderBy || '__default__'} onValueChange={handleOrderByChange}>
              <SelectTrigger className='w-[160px]'>
                <SelectValue placeholder='排序方式' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='__default__'>默认排序</SelectItem>
                <SelectItem value='quota'>按剩余配额</SelectItem>
                <SelectItem value='used_quota'>按已用配额</SelectItem>
                <SelectItem value='request_count'>按请求次数</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className='rounded-md border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='w-[60px]'>ID</TableHead>
                  <TableHead>用户名</TableHead>
                  <TableHead>显示名</TableHead>
                  <TableHead>分组</TableHead>
                  <TableHead>角色</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>剩余配额</TableHead>
                  <TableHead>已用配额</TableHead>
                  <TableHead>请求数</TableHead>
                  <TableHead className='w-[60px]'>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={10} className='text-center py-8 text-muted-foreground'>
                      加载中...
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className='text-center py-8 text-muted-foreground'>
                      暂无数据
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user, idx) => (
                    <TableRow key={user.id}>
                      <TableCell className='font-mono text-xs'>{user.id}</TableCell>
                      <TableCell className='font-medium'>{user.username}</TableCell>
                      <TableCell>{user.display_name || '-'}</TableCell>
                      <TableCell>{renderGroup(user.group)}</TableCell>
                      <TableCell>{renderRole(user.role)}</TableCell>
                      <TableCell>{renderStatus(user.status)}</TableCell>
                      <TableCell className='font-mono text-sm'>
                        {renderQuota(user.quota, (key, opts) => {
                          if (key === 'common.quota.display_short') return `$${opts.amount}`;
                          return '';
                        })}
                      </TableCell>
                      <TableCell className='font-mono text-sm'>
                        {renderQuota(user.used_quota, (key, opts) => {
                          if (key === 'common.quota.display_short') return `$${opts.amount}`;
                          return '';
                        })}
                      </TableCell>
                      <TableCell className='font-mono text-sm'>
                        {renderNumber(user.request_count)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant='ghost' size='icon' className='h-8 w-8'>
                              <MoreHorizontal className='h-4 w-4' />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align='end'>
                            <DropdownMenuItem asChild>
                              <Link to={`/user/edit/${user.id}`} className='flex items-center'>
                                <Pencil className='h-4 w-4 mr-2' />
                                编辑
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              disabled={user.role === 100}
                              onClick={() => manageUser(user.username, 'promote', idx)}
                            >
                              <ShieldCheck className='h-4 w-4 mr-2' />
                              升级角色
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={user.role === 100}
                              onClick={() => manageUser(user.username, 'demote', idx)}
                            >
                              <ShieldMinus className='h-4 w-4 mr-2' />
                              降级角色
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              disabled={user.role === 100}
                              onClick={() =>
                                manageUser(
                                  user.username,
                                  user.status === 1 ? 'disable' : 'enable',
                                  idx
                                )
                              }
                            >
                              {user.status === 1 ? (
                                <>
                                  <Ban className='h-4 w-4 mr-2' />
                                  禁用
                                </>
                              ) : (
                                <>
                                  <CheckCircle className='h-4 w-4 mr-2' />
                                  启用
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              disabled={user.role === 100}
                              className='text-destructive focus:text-destructive'
                              onClick={() => {
                                setDeleteTarget({ username: user.username, idx });
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className='h-4 w-4 mr-2' />
                              删除
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className='flex items-center justify-between mt-4'>
            <p className='text-sm text-muted-foreground'>
              第 {page + 1} 页 {users.length > 0 && `· 当前 ${users.length} 条`}
            </p>
            <div className='flex gap-2'>
              <Button
                variant='outline'
                size='sm'
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                <ChevronLeft className='h-4 w-4 mr-1' />
                上一页
              </Button>
              <Button
                variant='outline'
                size='sm'
                disabled={users.length < ITEMS_PER_PAGE}
                onClick={() => setPage((p) => p + 1)}
              >
                下一页
                <ChevronRight className='h-4 w-4 ml-1' />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除用户</DialogTitle>
            <DialogDescription>
              确定要删除用户 <strong>{deleteTarget?.username}</strong> 吗？此操作不可撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant='outline' onClick={() => setDeleteDialogOpen(false)}>
              取消
            </Button>
            <Button variant='destructive' onClick={confirmDelete}>
              <Trash2 className='h-4 w-4 mr-1' />
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminKeysAudit;
