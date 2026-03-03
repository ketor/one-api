import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Button } from '../ui/button';
import { Copy, Check } from 'lucide-react';
import { copy, showSuccess } from '../../helpers';

const ToolConfigSnippet = ({ apiKey }) => {
  const [copiedTab, setCopiedTab] = useState(null);
  const baseUrl = window.location.origin;
  const displayKey = apiKey || 'sk-your-api-key';

  const configs = {
    cursor: {
      title: 'Cursor',
      language: 'env',
      code: `# Cursor Settings > Models > OpenAI API Key
OPENAI_API_KEY=${displayKey}
OPENAI_BASE_URL=${baseUrl}/v1`,
    },
    claudeCode: {
      title: 'Claude Code',
      language: 'json',
      code: `// cc-switch 配置
{
  "name": "CodingPlan",
  "baseUrl": "${baseUrl}/anthropic/v1",
  "apiKey": "${displayKey}"
}`,
    },
    python: {
      title: 'Python',
      language: 'python',
      code: `from openai import OpenAI

client = OpenAI(
    api_key="${displayKey}",
    base_url="${baseUrl}/v1"
)

response = client.chat.completions.create(
    model="kimi-2.5",
    messages=[{"role": "user", "content": "Hello!"}]
)
print(response.choices[0].message.content)`,
    },
    nodejs: {
      title: 'Node.js',
      language: 'javascript',
      code: `import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: '${displayKey}',
  baseURL: '${baseUrl}/v1',
});

const response = await client.chat.completions.create({
  model: 'kimi-2.5',
  messages: [{ role: 'user', content: 'Hello!' }],
});
console.log(response.choices[0].message.content);`,
    },
    curl: {
      title: 'cURL',
      language: 'bash',
      code: `curl ${baseUrl}/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${displayKey}" \\
  -d '{
    "model": "kimi-2.5",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'`,
    },
  };

  const handleCopy = async (key) => {
    const ok = await copy(configs[key].code);
    if (ok) {
      setCopiedTab(key);
      showSuccess('已复制');
      setTimeout(() => setCopiedTab(null), 2000);
    }
  };

  return (
    <Card>
      <CardHeader className='pb-2'>
        <CardTitle className='text-sm font-medium'>工具配置速查</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue='cursor'>
          <TabsList className='w-full justify-start'>
            {Object.entries(configs).map(([key, config]) => (
              <TabsTrigger key={key} value={key} className='text-xs'>
                {config.title}
              </TabsTrigger>
            ))}
          </TabsList>
          {Object.entries(configs).map(([key, config]) => (
            <TabsContent key={key} value={key}>
              <div className='relative'>
                <Button
                  variant='ghost'
                  size='icon'
                  className='absolute top-2 right-2 h-6 w-6'
                  onClick={() => handleCopy(key)}
                >
                  {copiedTab === key ? (
                    <Check className='h-3 w-3 text-green-600' />
                  ) : (
                    <Copy className='h-3 w-3' />
                  )}
                </Button>
                <pre className='bg-muted rounded-md p-3 text-xs overflow-x-auto'>
                  <code>{config.code}</code>
                </pre>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ToolConfigSnippet;
