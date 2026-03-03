import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API, showError, showSuccess } from '../../helpers';
import { renderQuota, renderQuotaWithPrompt } from '../../helpers/render';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { User, ArrowLeft } from 'lucide-react';

const EditUser = () => {
  const params = useParams();
  const userId = params.id;
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [inputs, setInputs] = useState({
    username: '',
    display_name: '',
    password: '',
    github_id: '',
    wechat_id: '',
    email: '',
    quota: 0,
    group: 'default',
  });
  const [groupOptions, setGroupOptions] = useState([]);

  const handleInputChange = (name, value) => {
    setInputs((prev) => ({ ...prev, [name]: value }));
  };

  const fetchGroups = async () => {
    try {
      const res = await API.get('/api/group/');
      setGroupOptions(res.data.data || []);
    } catch (error) {
      showError(error.message);
    }
  };

  const handleCancel = () => {
    if (userId) {
      navigate('/user');
    } else {
      navigate('/settings');
    }
  };

  const loadUser = async () => {
    try {
      let res;
      if (userId) {
        res = await API.get(`/api/user/${userId}`);
      } else {
        res = await API.get('/api/user/self');
      }
      const { success, message, data } = res.data;
      if (success) {
        data.password = '';
        setInputs(data);
      } else {
        showError(message);
      }
    } catch (err) {
      showError('加载用户信息失败');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadUser();
    if (userId) {
      fetchGroups();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async () => {
    setSaving(true);
    try {
      let res;
      if (userId) {
        const data = { ...inputs, id: parseInt(userId) };
        if (typeof data.quota === 'string') {
          data.quota = parseInt(data.quota);
        }
        res = await API.put('/api/user/', data);
      } else {
        res = await API.put('/api/user/self', inputs);
      }
      const { success, message } = res.data;
      if (success) {
        showSuccess('更新成功');
      } else {
        showError(message);
      }
    } catch (err) {
      showError('更新失败');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center py-20 text-muted-foreground'>
        加载中...
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center gap-4'>
        <Button variant='ghost' size='icon' onClick={handleCancel}>
          <ArrowLeft className='h-4 w-4' />
        </Button>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>
            {userId ? '编辑用户信息' : '编辑个人信息'}
          </h1>
          <p className='text-muted-foreground'>
            {userId ? `管理用户 #${userId} 的账户信息。` : '修改您的个人信息和密码。'}
          </p>
        </div>
      </div>

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className='text-sm font-medium flex items-center gap-2'>
            <User className='h-4 w-4' />
            基本信息
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid gap-4 sm:grid-cols-2'>
            <div className='space-y-2'>
              <Label>用户名</Label>
              <Input
                value={inputs.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                placeholder='请输入用户名'
                autoComplete='new-password'
              />
            </div>
            <div className='space-y-2'>
              <Label>显示名称</Label>
              <Input
                value={inputs.display_name}
                onChange={(e) => handleInputChange('display_name', e.target.value)}
                placeholder='请输入显示名称'
                autoComplete='new-password'
              />
            </div>
          </div>

          <div className='space-y-2'>
            <Label>密码（留空表示不修改）</Label>
            <Input
              type='password'
              value={inputs.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              placeholder='请输入新密码'
              autoComplete='new-password'
            />
          </div>

          {userId && (
            <div className='grid gap-4 sm:grid-cols-2'>
              <div className='space-y-2'>
                <Label>分组</Label>
                <Select
                  value={inputs.group}
                  onValueChange={(v) => handleInputChange('group', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='选择分组' />
                  </SelectTrigger>
                  <SelectContent>
                    {groupOptions.map((g) => (
                      <SelectItem key={g} value={g}>
                        {g}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className='space-y-2'>
                <Label>
                  剩余配额{renderQuotaWithPrompt(inputs.quota)}
                </Label>
                <Input
                  type='number'
                  value={inputs.quota}
                  onChange={(e) => handleInputChange('quota', e.target.value)}
                  placeholder='请输入配额'
                  autoComplete='new-password'
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bound Accounts (Read-only) */}
      <Card>
        <CardHeader>
          <CardTitle className='text-sm font-medium'>绑定信息（只读）</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid gap-4 sm:grid-cols-3'>
            <div className='space-y-2'>
              <Label>GitHub ID</Label>
              <Input
                value={inputs.github_id || ''}
                disabled
                className='bg-muted'
                placeholder='未绑定'
              />
            </div>
            <div className='space-y-2'>
              <Label>微信 ID</Label>
              <Input
                value={inputs.wechat_id || ''}
                disabled
                className='bg-muted'
                placeholder='未绑定'
              />
            </div>
            <div className='space-y-2'>
              <Label>邮箱</Label>
              <Input
                value={inputs.email || ''}
                disabled
                className='bg-muted'
                placeholder='未绑定'
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className='flex items-center gap-3'>
        <Button onClick={submit} disabled={saving}>
          {saving ? '保存中...' : '保存更改'}
        </Button>
        <Button variant='outline' onClick={handleCancel}>
          取消
        </Button>
      </div>
    </div>
  );
};

export default EditUser;
