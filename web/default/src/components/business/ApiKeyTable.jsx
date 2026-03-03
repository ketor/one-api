import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  API,
  copy,
  showError,
  showSuccess,
  showWarning,
  timestamp2string,
} from '../../helpers';
import { renderQuota } from '../../helpers/render';
import {
  Eye,
  EyeOff,
  Trash2,
  Plus,
  Search,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  Pencil,
  Copy,
  ExternalLink,
  Infinity,
} from 'lucide-react';

const ITEMS_PER_PAGE = 10;

function renderStatus(status) {
  switch (status) {
    case 1:
      return <Badge variant='default'>已启用</Badge>;
    case 2:
      return <Badge variant='destructive'>已禁用</Badge>;
    case 3:
      return <Badge variant='secondary'>已过期</Badge>;
    case 4:
      return <Badge variant='outline'>已耗尽</Badge>;
    default:
      return <Badge variant='outline'>未知</Badge>;
  }
}

const SORT_OPTIONS = [
  { value: '', label: '默认排序' },
  { value: 'name', label: '按名称' },
  { value: 'status', label: '按状态' },
  { value: 'used_quota', label: '按已用额度' },
  { value: 'remain_quota', label: '按剩余额度' },
  { value: 'created_time', label: '按创建时间' },
];

const ApiKeyTable = ({ isAdmin = false }) => {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [page, setPage] = useState(0);
  const [showKey, setShowKey] = useState({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [sortKey, setSortKey] = useState('');

  const loadTokens = async () => {
    setLoading(true);
    try {
      const orderParam = sortKey === 'used_quota' || sortKey === 'remain_quota' ? sortKey : '';
      const res = await API.get(`/api/token/?p=${page}&order=${orderParam}`);
      const { success, message, data } = res.data;
      if (success) {
        let result = data || [];
        if (sortKey && sortKey !== 'used_quota' && sortKey !== 'remain_quota') {
          result = sortTokensLocal(result, sortKey);
        }
        setTokens(result);
      } else {
        showError(message);
      }
    } catch (err) {
      showError('加载 API Key 失败');
    }
    setLoading(false);
  };

  const sortTokensLocal = (list, key) => {
    const sorted = [...list];
    sorted.sort((a, b) => {
      if (!isNaN(a[key])) {
        return a[key] - b[key];
      }
      return ('' + a[key]).localeCompare(b[key]);
    });
    return sorted;
  };

  const searchTokens = async () => {
    if (!searchKeyword) {
      loadTokens();
      return;
    }
    setLoading(true);
    try {
      const res = await API.get(`/api/token/search?keyword=${searchKeyword}`);
      const { success, message, data } = res.data;
      if (success) {
        setTokens(data || []);
      } else {
        showError(message);
      }
    } catch (err) {
      showError('搜索失败');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadTokens();
  }, [page, sortKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleToken = async (id, status) => {
    const newStatus = status === 1 ? 2 : 1;
    try {
      const res = await API.put('/api/token/?status_only=true', {
        id,
        status: newStatus,
      });
      if (res.data.success) {
        showSuccess('状态更新成功');
        loadTokens();
      } else {
        showError(res.data.message);
      }
    } catch (err) {
      showError('操作失败');
    }
  };

  const deleteToken = async () => {
    if (!deleteTarget) return;
    try {
      const res = await API.delete(`/api/token/${deleteTarget}`);
      if (res.data.success) {
        showSuccess('删除成功');
        setDeleteDialogOpen(false);
        setDeleteTarget(null);
        loadTokens();
      } else {
        showError(res.data.message);
      }
    } catch (err) {
      showError('删除失败');
    }
  };

  const toggleShowKey = (id) => {
    setShowKey((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const maskKey = (key) => {
    if (!key) return '';
    if (key.length <= 8) return key;
    return key.substring(0, 4) + '****' + key.substring(key.length - 4);
  };

  const getServerAddress = () => {
    let status = localStorage.getItem('status');
    let serverAddress = '';
    if (status) {
      status = JSON.parse(status);
      serverAddress = status.server_address;
    }
    if (serverAddress === '') {
      serverAddress = window.location.origin;
    }
    return serverAddress;
  };

  const onCopyConfigLink = async (type, key) => {
    const serverAddress = getServerAddress();
    const encodedServerAddress = encodeURIComponent(serverAddress);
    const chatLink = localStorage.getItem('chat_link');

    let url;
    switch (type) {
      case 'next': {
        const nextBase = chatLink || 'https://app.nextchat.dev';
        url = nextBase + `/#/?settings={"key":"sk-${key}","url":"${serverAddress}"}`;
        break;
      }
      case 'ama':
        url = `ama://set-api-key?server=${encodedServerAddress}&key=sk-${key}`;
        break;
      case 'opencat':
        url = `opencat://team/join?domain=${encodedServerAddress}&token=sk-${key}`;
        break;
      case 'lobechat': {
        const lobeBase = chatLink || '';
        url = lobeBase + `/?settings={"keyVaults":{"openai":{"apiKey":"sk-${key}","baseURL":"${serverAddress}/v1"}}}`;
        break;
      }
      case 'cursor':
        url = `OPENAI_API_KEY=sk-${key}\nOPENAI_BASE_URL=${serverAddress}/v1`;
        break;
      case 'claude-code':
        url = JSON.stringify({
          name: 'Alaya Code',
          baseUrl: `${serverAddress}/anthropic/v1`,
          apiKey: `sk-${key}`,
        }, null, 2);
        break;
      default:
        url = `sk-${key}`;
    }

    if (await copy(url)) {
      showSuccess('已复制');
    } else {
      showWarning('复制失败，请手动复制');
    }
  };

  const onOpenLink = (type, key) => {
    const serverAddress = getServerAddress();
    const encodedServerAddress = encodeURIComponent(serverAddress);
    const chatLink = localStorage.getItem('chat_link');

    let url;
    switch (type) {
      case 'next': {
        const nextBase = chatLink || 'https://app.nextchat.dev';
        url = nextBase + `/#/?settings={"key":"sk-${key}","url":"${serverAddress}"}`;
        break;
      }
      case 'ama':
        url = `ama://set-api-key?server=${encodedServerAddress}&key=sk-${key}`;
        break;
      case 'opencat':
        url = `opencat://team/join?domain=${encodedServerAddress}&token=sk-${key}`;
        break;
      case 'lobechat': {
        const lobeBase = chatLink || '';
        url = lobeBase + `/?settings={"keyVaults":{"openai":{"apiKey":"sk-${key}","baseURL":"${serverAddress}/v1"}}}`;
        break;
      }
      default: {
        const defaultBase = chatLink || 'https://app.nextchat.dev';
        url = defaultBase + `/#/?settings={"key":"sk-${key}","url":"${serverAddress}"}`;
      }
    }
    window.open(url, '_blank');
  };

  const renderExpiredTime = (expiredTime) => {
    if (expiredTime === -1) {
      return <span className='text-xs text-muted-foreground'>永不过期</span>;
    }
    const now = Math.floor(Date.now() / 1000);
    const isExpired = expiredTime > 0 && expiredTime < now;
    return (
      <span className={`text-xs ${isExpired ? 'text-destructive' : 'text-muted-foreground'}`}>
        {timestamp2string(expiredTime)}
      </span>
    );
  };

  return (
    <div className='space-y-4'>
      <div className='flex items-center gap-2 flex-wrap'>
        <div className='relative flex-1 min-w-[200px] max-w-sm'>
          <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
          <Input
            placeholder='搜索 API Key...'
            className='pl-8'
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && searchTokens()}
          />
        </div>
        <Button variant='outline' size='sm' onClick={searchTokens}>
          搜索
        </Button>
        <Select
          value={sortKey || '__default__'}
          onValueChange={(v) => setSortKey(v === '__default__' ? '' : v)}
        >
          <SelectTrigger className='w-[140px] h-9'>
            <SelectValue placeholder='排序方式' />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value || '__default__'} value={opt.value || '__default__'}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant='outline'
          size='icon'
          className='h-9 w-9'
          onClick={loadTokens}
          title='刷新'
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
        <div className='flex-1' />
        <Button size='sm' onClick={() => (window.location.href = '/token/add')}>
          <Plus className='h-4 w-4 mr-1' />
          创建 Key
        </Button>
      </div>

      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>名称</TableHead>
              <TableHead>Key</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>已用额度</TableHead>
              <TableHead>剩余额度</TableHead>
              <TableHead>创建时间</TableHead>
              <TableHead>过期时间</TableHead>
              <TableHead className='text-right'>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className='text-center py-8 text-muted-foreground'>
                  加载中...
                </TableCell>
              </TableRow>
            ) : tokens.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className='text-center py-8 text-muted-foreground'>
                  暂无 API Key
                </TableCell>
              </TableRow>
            ) : (
              tokens.map((token) => (
                <TableRow key={token.id}>
                  <TableCell className='font-medium'>{token.name || '未命名'}</TableCell>
                  <TableCell>
                    <div className='flex items-center gap-1'>
                      <code className='text-xs bg-muted px-1 py-0.5 rounded'>
                        {showKey[token.id] ? `sk-${token.key}` : maskKey(`sk-${token.key}`)}
                      </code>
                      <Button
                        variant='ghost'
                        size='icon'
                        className='h-6 w-6'
                        onClick={() => toggleShowKey(token.id)}
                        aria-label={showKey[token.id] ? '隐藏 Key' : '显示 Key'}
                      >
                        {showKey[token.id] ? (
                          <EyeOff className='h-3 w-3' />
                        ) : (
                          <Eye className='h-3 w-3' />
                        )}
                      </Button>
                      {/* Copy dropdown with config links */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant='ghost' size='icon' className='h-6 w-6' aria-label='复制选项'>
                            <Copy className='h-3 w-3' />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end'>
                          <DropdownMenuItem onClick={() => onCopyConfigLink('', token.key)}>
                            复制 Key
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => onCopyConfigLink('cursor', token.key)}>
                            复制 Cursor 配置
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onCopyConfigLink('claude-code', token.key)}>
                            复制 Claude Code 配置
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onCopyConfigLink('next', token.key)}>
                            复制 NextChat 链接
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onCopyConfigLink('lobechat', token.key)}>
                            复制 LobeChat 链接
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onCopyConfigLink('ama', token.key)}>
                            复制 AMA 链接
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onCopyConfigLink('opencat', token.key)}>
                            复制 OpenCat 链接
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => onOpenLink('next', token.key)}>
                            <ExternalLink className='h-3 w-3 mr-2' />
                            打开 NextChat
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onOpenLink('lobechat', token.key)}>
                            <ExternalLink className='h-3 w-3 mr-2' />
                            打开 LobeChat
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                  <TableCell>{renderStatus(token.status)}</TableCell>
                  <TableCell className='text-xs'>
                    {renderQuota(token.used_quota)}
                  </TableCell>
                  <TableCell className='text-xs'>
                    {token.unlimited_quota ? (
                      <Badge variant='secondary' className='gap-1'>
                        <Infinity className='h-3 w-3' />
                        无限
                      </Badge>
                    ) : (
                      renderQuota(token.remain_quota, undefined, 2)
                    )}
                  </TableCell>
                  <TableCell className='text-xs text-muted-foreground'>
                    {timestamp2string(token.created_time)}
                  </TableCell>
                  <TableCell>
                    {renderExpiredTime(token.expired_time)}
                  </TableCell>
                  <TableCell className='text-right'>
                    <div className='flex items-center justify-end gap-1'>
                      <Button
                        variant='ghost'
                        size='icon'
                        className='h-7 w-7'
                        asChild
                      >
                        <Link to={`/token/edit/${token.id}`} title='编辑'>
                          <Pencil className='h-4 w-4' />
                        </Link>
                      </Button>
                      <Button
                        variant='ghost'
                        size='icon'
                        className='h-7 w-7'
                        onClick={() => toggleToken(token.id, token.status)}
                        title={token.status === 1 ? '禁用' : '启用'}
                      >
                        {token.status === 1 ? (
                          <ToggleRight className='h-4 w-4 text-green-600' />
                        ) : (
                          <ToggleLeft className='h-4 w-4 text-muted-foreground' />
                        )}
                      </Button>
                      <Button
                        variant='ghost'
                        size='icon'
                        className='h-7 w-7'
                        onClick={() => {
                          setDeleteTarget(token.id);
                          setDeleteDialogOpen(true);
                        }}
                        aria-label='删除'
                      >
                        <Trash2 className='h-4 w-4 text-destructive' />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className='flex justify-center gap-2'>
        <Button
          variant='outline'
          size='sm'
          disabled={page === 0}
          onClick={() => setPage((p) => Math.max(0, p - 1))}
        >
          上一页
        </Button>
        <Button
          variant='outline'
          size='sm'
          disabled={tokens.length < ITEMS_PER_PAGE}
          onClick={() => setPage((p) => p + 1)}
        >
          下一页
        </Button>
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除此 API Key 吗？此操作不可撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant='outline' onClick={() => setDeleteDialogOpen(false)}>
              取消
            </Button>
            <Button variant='destructive' onClick={deleteToken}>
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ApiKeyTable;
