import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { API, copy, showError, showInfo, showSuccess } from '../../helpers';
import { renderQuota } from '../../helpers/render';
import { UserContext } from '../../context/User';
import { onGitHubOAuthClicked, onLarkOAuthClicked } from '../../components/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Separator } from '../../components/ui/separator';
import { Badge } from '../../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import {
  User,
  Key,
  Link2,
  Shield,
  Trash2,
  Copy,
  RefreshCw,
  Gift,
  Github,
  Mail,
  MessageSquare,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';

const SettingsPage = () => {
  const [, userDispatch] = useContext(UserContext);
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [systemToken, setSystemToken] = useState('');
  const [affLink, setAffLink] = useState('');
  const [redemptionCode, setRedemptionCode] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');
  const [status, setStatus] = useState({});

  // Email binding dialog
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [emailCode, setEmailCode] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailCountdown, setEmailCountdown] = useState(0);

  // WeChat binding dialog
  const [wechatDialogOpen, setWechatDialogOpen] = useState(false);
  const [wechatCode, setWechatCode] = useState('');

  useEffect(() => {
    loadUser();
    const stored = localStorage.getItem('status');
    if (stored) {
      setStatus(JSON.parse(stored));
    }
  }, []);

  // Email countdown timer
  useEffect(() => {
    if (emailCountdown <= 0) return;
    const timer = setInterval(() => {
      setEmailCountdown((c) => c - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [emailCountdown]);

  const loadUser = async () => {
    try {
      const res = await API.get('/api/user/self');
      if (res.data.success) {
        setUser(res.data.data);
        setDisplayName(res.data.data.display_name || '');
      }
    } catch (err) {
      showError('加载用户信息失败');
    }
  };

  const handleUpdateProfile = async () => {
    setLoading(true);
    try {
      const body = { display_name: displayName };
      if (password) {
        if (password !== confirmPassword) {
          showError('两次输入的密码不一致');
          setLoading(false);
          return;
        }
        if (password.length < 8) {
          showError('密码长度不能少于 8 位');
          setLoading(false);
          return;
        }
        body.password = password;
      }
      const res = await API.put('/api/user/self', body);
      if (res.data.success) {
        showSuccess('更新成功');
        setPassword('');
        setConfirmPassword('');
        loadUser();
      } else {
        showError(res.data.message);
      }
    } catch (err) {
      showError('更新失败');
    }
    setLoading(false);
  };

  const handleGenerateToken = async () => {
    try {
      const res = await API.get('/api/user/token');
      if (res.data.success) {
        const token = res.data.data;
        setSystemToken(token);
        await copy(token);
        showSuccess('系统令牌已生成并复制到剪贴板');
        loadUser();
      } else {
        showError(res.data.message);
      }
    } catch (err) {
      showError('生成令牌失败');
    }
  };

  const handleCopyToken = async () => {
    const token = systemToken || user?.access_token;
    if (token) {
      if (await copy(token)) {
        showSuccess('令牌已复制到剪贴板');
      }
    }
  };

  const handleGetAffLink = async () => {
    try {
      const res = await API.get('/api/user/aff');
      if (res.data.success) {
        const link = `${window.location.origin}/register?aff=${res.data.data}`;
        setAffLink(link);
        await copy(link);
        showSuccess('邀请链接已复制到剪贴板');
      } else {
        showError(res.data.message);
      }
    } catch (err) {
      showError('获取邀请链接失败');
    }
  };

  const handleTopUp = async () => {
    if (!redemptionCode.trim()) {
      showInfo('请输入兑换码');
      return;
    }
    setIsRedeeming(true);
    try {
      const res = await API.post('/api/user/topup', { key: redemptionCode.trim() });
      if (res.data.success) {
        showSuccess('兑换成功！');
        setRedemptionCode('');
        loadUser();
      } else {
        showError(res.data.message);
      }
    } catch (err) {
      showError('兑换失败');
    }
    setIsRedeeming(false);
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmName !== user?.username) {
      showError('请输入正确的用户名以确认删除');
      return;
    }
    try {
      const res = await API.delete('/api/user/self');
      if (res.data.success) {
        showSuccess('账户已删除');
        await API.get('/api/user/logout');
        userDispatch({ type: 'logout' });
        localStorage.removeItem('user');
        navigate('/login');
      } else {
        showError(res.data.message);
      }
    } catch (err) {
      showError('删除失败');
    }
  };

  // --- Email Binding ---
  const sendEmailVerification = async () => {
    if (!emailInput) return;
    setEmailLoading(true);
    try {
      const res = await API.get(`/api/verification?email=${emailInput}`);
      if (res.data.success) {
        showSuccess('验证码已发送，请检查邮箱');
        setEmailCountdown(30);
      } else {
        showError(res.data.message);
      }
    } catch (err) {
      showError('发送验证码失败');
    }
    setEmailLoading(false);
  };

  const bindEmail = async () => {
    if (!emailCode) return;
    setEmailLoading(true);
    try {
      const res = await API.get(
        `/api/oauth/email/bind?email=${emailInput}&code=${emailCode}`
      );
      if (res.data.success) {
        showSuccess('邮箱绑定成功');
        setEmailDialogOpen(false);
        setEmailInput('');
        setEmailCode('');
        loadUser();
      } else {
        showError(res.data.message);
      }
    } catch (err) {
      showError('绑定失败');
    }
    setEmailLoading(false);
  };

  // --- WeChat Binding ---
  const bindWeChat = async () => {
    if (!wechatCode) return;
    try {
      const res = await API.get(`/api/oauth/wechat/bind?code=${wechatCode}`);
      if (res.data.success) {
        showSuccess('微信绑定成功');
        setWechatDialogOpen(false);
        setWechatCode('');
        loadUser();
      } else {
        showError(res.data.message);
      }
    } catch (err) {
      showError('绑定失败');
    }
  };

  const currentToken = systemToken || user?.access_token;

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-2xl font-bold tracking-tight'>设置</h1>
        <p className='text-muted-foreground'>管理您的账户设置和偏好。</p>
      </div>

      {/* Personal Info */}
      <Card>
        <CardHeader>
          <CardTitle className='text-sm font-medium flex items-center gap-2'>
            <User className='h-4 w-4' />
            个人信息
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid gap-4 sm:grid-cols-2'>
            <div className='space-y-2'>
              <Label>用户名</Label>
              <Input value={user?.username || ''} disabled />
            </div>
            <div className='space-y-2'>
              <Label>邮箱</Label>
              <Input value={user?.email || '未绑定'} disabled />
            </div>
          </div>
          <div className='space-y-2'>
            <Label>显示名称</Label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder='输入显示名称'
            />
          </div>

          <Separator />

          <div className='grid gap-4 sm:grid-cols-2'>
            <div className='space-y-2'>
              <Label>新密码（留空表示不修改）</Label>
              <Input
                type='password'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder='输入新密码'
              />
            </div>
            <div className='space-y-2'>
              <Label>确认新密码</Label>
              <Input
                type='password'
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder='再次输入新密码'
              />
            </div>
          </div>

          <Button onClick={handleUpdateProfile} disabled={loading}>
            {loading ? '保存中...' : '保存更改'}
          </Button>
        </CardContent>
      </Card>

      {/* System Token */}
      <Card>
        <CardHeader>
          <CardTitle className='text-sm font-medium flex items-center gap-2'>
            <Key className='h-4 w-4' />
            系统令牌 (Access Token)
          </CardTitle>
          <CardDescription>
            用于 API 调用认证。生成新令牌会使旧令牌失效。
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-3'>
          {currentToken && (
            <div className='flex items-center gap-2'>
              <div className='flex-1 bg-muted rounded-md p-3'>
                <code className='text-xs break-all'>{currentToken}</code>
              </div>
              <Button variant='outline' size='icon' onClick={handleCopyToken} title='复制'>
                <Copy className='h-4 w-4' />
              </Button>
            </div>
          )}
          <Button variant='outline' onClick={handleGenerateToken}>
            <RefreshCw className='h-4 w-4 mr-2' />
            生成新令牌
          </Button>
        </CardContent>
      </Card>

      {/* Invite Link */}
      <Card>
        <CardHeader>
          <CardTitle className='text-sm font-medium flex items-center gap-2'>
            <Link2 className='h-4 w-4' />
            邀请链接
          </CardTitle>
          <CardDescription>
            分享邀请链接给朋友，他们注册后您将获得奖励。
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-3'>
          {affLink && (
            <div className='flex items-center gap-2'>
              <div className='flex-1 bg-muted rounded-md p-3'>
                <code className='text-xs break-all'>{affLink}</code>
              </div>
              <Button variant='outline' size='icon' onClick={async () => {
                if (await copy(affLink)) showSuccess('已复制');
              }} title='复制'>
                <Copy className='h-4 w-4' />
              </Button>
            </div>
          )}
          {!affLink && user?.aff_code && (
            <p className='text-sm text-muted-foreground'>
              邀请码: <code className='bg-muted px-1 rounded'>{user.aff_code}</code>
            </p>
          )}
          <Button variant='outline' onClick={handleGetAffLink}>
            <Link2 className='h-4 w-4 mr-2' />
            获取并复制邀请链接
          </Button>
        </CardContent>
      </Card>

      {/* Account Binding */}
      <Card>
        <CardHeader>
          <CardTitle className='text-sm font-medium flex items-center gap-2'>
            <Shield className='h-4 w-4' />
            账户绑定
          </CardTitle>
          <CardDescription>
            绑定第三方账户以增强安全性和便捷登录。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='grid gap-3 sm:grid-cols-2'>
            {/* GitHub */}
            <div className='flex items-center justify-between rounded-lg border p-3'>
              <div className='flex items-center gap-3'>
                <Github className='h-5 w-5' />
                <div>
                  <p className='text-sm font-medium'>GitHub</p>
                  <p className='text-xs text-muted-foreground'>
                    {user?.github_id ? '已绑定' : '未绑定'}
                  </p>
                </div>
              </div>
              {user?.github_id ? (
                <Badge variant='outline' className='bg-green-50 text-green-700 border-green-200'>
                  <CheckCircle2 className='h-3 w-3 mr-1' />
                  已绑定
                </Badge>
              ) : status.github_oauth ? (
                <Button variant='outline' size='sm' onClick={() => onGitHubOAuthClicked(status.github_client_id)}>
                  绑定
                </Button>
              ) : (
                <Badge variant='outline' className='text-muted-foreground'>
                  <XCircle className='h-3 w-3 mr-1' />
                  未启用
                </Badge>
              )}
            </div>

            {/* Email */}
            <div className='flex items-center justify-between rounded-lg border p-3'>
              <div className='flex items-center gap-3'>
                <Mail className='h-5 w-5' />
                <div>
                  <p className='text-sm font-medium'>邮箱</p>
                  <p className='text-xs text-muted-foreground'>
                    {user?.email ? user.email : '未绑定'}
                  </p>
                </div>
              </div>
              {user?.email ? (
                <Badge variant='outline' className='bg-green-50 text-green-700 border-green-200'>
                  <CheckCircle2 className='h-3 w-3 mr-1' />
                  已绑定
                </Badge>
              ) : (
                <Button variant='outline' size='sm' onClick={() => setEmailDialogOpen(true)}>
                  绑定
                </Button>
              )}
            </div>

            {/* WeChat */}
            <div className='flex items-center justify-between rounded-lg border p-3'>
              <div className='flex items-center gap-3'>
                <MessageSquare className='h-5 w-5' />
                <div>
                  <p className='text-sm font-medium'>微信</p>
                  <p className='text-xs text-muted-foreground'>
                    {user?.wechat_id ? '已绑定' : '未绑定'}
                  </p>
                </div>
              </div>
              {user?.wechat_id ? (
                <Badge variant='outline' className='bg-green-50 text-green-700 border-green-200'>
                  <CheckCircle2 className='h-3 w-3 mr-1' />
                  已绑定
                </Badge>
              ) : status.wechat_login ? (
                <Button variant='outline' size='sm' onClick={() => setWechatDialogOpen(true)}>
                  绑定
                </Button>
              ) : (
                <Badge variant='outline' className='text-muted-foreground'>
                  <XCircle className='h-3 w-3 mr-1' />
                  未启用
                </Badge>
              )}
            </div>

            {/* Lark */}
            <div className='flex items-center justify-between rounded-lg border p-3'>
              <div className='flex items-center gap-3'>
                <ExternalLink className='h-5 w-5' />
                <div>
                  <p className='text-sm font-medium'>飞书</p>
                  <p className='text-xs text-muted-foreground'>
                    {user?.lark_id ? '已绑定' : '未绑定'}
                  </p>
                </div>
              </div>
              {user?.lark_id ? (
                <Badge variant='outline' className='bg-green-50 text-green-700 border-green-200'>
                  <CheckCircle2 className='h-3 w-3 mr-1' />
                  已绑定
                </Badge>
              ) : status.lark_client_id ? (
                <Button variant='outline' size='sm' onClick={() => onLarkOAuthClicked(status.lark_client_id)}>
                  绑定
                </Button>
              ) : (
                <Badge variant='outline' className='text-muted-foreground'>
                  <XCircle className='h-3 w-3 mr-1' />
                  未启用
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top-up / Redemption */}
      <Card>
        <CardHeader>
          <CardTitle className='text-sm font-medium flex items-center gap-2'>
            <Gift className='h-4 w-4' />
            兑换码充值
          </CardTitle>
          <CardDescription>
            使用兑换码充值您的账户额度。
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex items-center gap-4 rounded-lg bg-muted/50 p-4'>
            <div>
              <p className='text-sm text-muted-foreground'>当前配额余额</p>
              <p className='text-2xl font-bold'>
                {user ? renderQuota(user.quota, (key, opts) => {
                  if (key === 'common.quota.display_short') return `$${opts.amount}`;
                  return '';
                }) : '--'}
              </p>
            </div>
          </div>
          <div className='flex gap-2'>
            <Input
              value={redemptionCode}
              onChange={(e) => setRedemptionCode(e.target.value)}
              placeholder='输入兑换码'
              className='flex-1'
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleTopUp();
              }}
              onPaste={(e) => {
                e.preventDefault();
                const text = e.clipboardData.getData('text');
                setRedemptionCode(text.trim());
              }}
            />
            <Button onClick={handleTopUp} disabled={isRedeeming}>
              {isRedeeming ? '兑换中...' : '兑换'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className='border-destructive/50'>
        <CardHeader>
          <CardTitle className='text-sm font-medium flex items-center gap-2 text-destructive'>
            <AlertTriangle className='h-4 w-4' />
            危险操作
          </CardTitle>
          <CardDescription>
            以下操作不可撤销，请谨慎操作。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='flex items-center justify-between rounded-lg border border-destructive/30 p-4'>
            <div>
              <p className='text-sm font-medium'>删除账户</p>
              <p className='text-xs text-muted-foreground'>
                永久删除您的账户和所有数据，此操作不可恢复。
              </p>
            </div>
            <Button
              variant='destructive'
              size='sm'
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className='h-4 w-4 mr-1' />
              删除账户
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Account Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2 text-destructive'>
              <AlertTriangle className='h-5 w-5' />
              确认删除账户
            </DialogTitle>
            <DialogDescription>
              此操作将永久删除您的账户，包括所有令牌、日志和配置数据。此操作不可撤销。
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-3 py-2'>
            <p className='text-sm'>
              请输入您的用户名 <code className='bg-muted px-1.5 py-0.5 rounded font-bold'>{user?.username}</code> 以确认删除：
            </p>
            <Input
              value={deleteConfirmName}
              onChange={(e) => setDeleteConfirmName(e.target.value)}
              placeholder='输入用户名确认'
            />
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => {
              setShowDeleteDialog(false);
              setDeleteConfirmName('');
            }}>
              取消
            </Button>
            <Button
              variant='destructive'
              onClick={handleDeleteAccount}
              disabled={deleteConfirmName !== user?.username}
            >
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Email Binding Dialog */}
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>绑定邮箱</DialogTitle>
            <DialogDescription>输入邮箱地址并验证以完成绑定。</DialogDescription>
          </DialogHeader>
          <div className='space-y-4 py-2'>
            <div className='flex gap-2'>
              <Input
                className='flex-1'
                type='email'
                placeholder='输入邮箱地址'
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
              />
              <Button
                variant='outline'
                onClick={sendEmailVerification}
                disabled={emailCountdown > 0 || emailLoading || !emailInput}
              >
                {emailCountdown > 0 ? `${emailCountdown}s` : '获取验证码'}
              </Button>
            </div>
            <Input
              placeholder='输入验证码'
              value={emailCode}
              onChange={(e) => setEmailCode(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setEmailDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={bindEmail} disabled={emailLoading || !emailCode}>
              {emailLoading ? '绑定中...' : '确认绑定'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* WeChat Binding Dialog */}
      <Dialog open={wechatDialogOpen} onOpenChange={setWechatDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>绑定微信</DialogTitle>
            <DialogDescription>扫描二维码后输入验证码完成绑定。</DialogDescription>
          </DialogHeader>
          <div className='space-y-4 py-2'>
            {status.wechat_qrcode && (
              <div className='flex justify-center'>
                <img
                  src={status.wechat_qrcode}
                  alt='WeChat QR Code'
                  className='max-w-[200px] rounded-md'
                />
              </div>
            )}
            <Input
              placeholder='输入微信验证码'
              value={wechatCode}
              onChange={(e) => setWechatCode(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setWechatDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={bindWeChat} disabled={!wechatCode}>
              确认绑定
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SettingsPage;
