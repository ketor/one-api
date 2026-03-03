import React from 'react';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Copy } from 'lucide-react';
import { copy, showSuccess, showError } from '../../helpers';

const ApiKeyCopyButton = ({ tokenKey }) => {
  const baseUrl = window.location.origin;

  const copyFormats = [
    {
      label: '复制 Key',
      getValue: () => tokenKey,
    },
    {
      label: 'Cursor 配置',
      getValue: () => `OPENAI_API_KEY=${tokenKey}\nOPENAI_BASE_URL=${baseUrl}/v1`,
    },
    {
      label: 'Claude Code (cc-switch)',
      getValue: () => JSON.stringify({
        name: 'CodingPlan',
        baseUrl: `${baseUrl}/anthropic/v1`,
        apiKey: tokenKey,
      }, null, 2),
    },
    {
      label: 'OpenAI SDK',
      getValue: () => `from openai import OpenAI\nclient = OpenAI(api_key="${tokenKey}", base_url="${baseUrl}/v1")`,
    },
  ];

  const handleCopy = async (format) => {
    const text = format.getValue();
    const ok = await copy(text);
    if (ok) {
      showSuccess(`已复制: ${format.label}`);
    } else {
      showError('复制失败');
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' size='icon' className='h-6 w-6'>
          <Copy className='h-3 w-3' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        {copyFormats.map((format, i) => (
          <DropdownMenuItem key={i} onClick={() => handleCopy(format)}>
            {format.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ApiKeyCopyButton;
