import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import ApiKeyTable from '../../components/business/ApiKeyTable';
import ToolConfigSnippet from '../../components/business/ToolConfigSnippet';
import { API } from '../../helpers';

const KeysPage = () => {
  const [firstKey, setFirstKey] = useState(null);

  useEffect(() => {
    loadFirstKey();
  }, []);

  const loadFirstKey = async () => {
    try {
      const res = await API.get('/api/token/?p=0');
      if (res.data.success && res.data.data && res.data.data.length > 0) {
        setFirstKey(`sk-${res.data.data[0].key}`);
      }
    } catch (err) {
      // ignore
    }
  };

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-2xl font-bold tracking-tight'>API 密钥</h1>
        <p className='text-muted-foreground'>
          管理您的 API Key，用于第三方工具对接。支持排序、搜索和一键复制配置。
        </p>
      </div>

      <Card>
        <CardHeader className='pb-2'>
          <CardTitle className='text-sm font-medium'>Key 列表</CardTitle>
        </CardHeader>
        <CardContent>
          <ApiKeyTable />
        </CardContent>
      </Card>

      <ToolConfigSnippet apiKey={firstKey} />
    </div>
  );
};

export default KeysPage;
