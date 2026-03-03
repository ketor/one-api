import React from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';

const DocsApi = () => {
  return (
    <div className='space-y-8'>
      <div>
        <h1 className='text-3xl font-bold tracking-tight'>API 文档</h1>
        <p className='mt-2 text-lg text-muted-foreground'>
          CodingPlan 提供 OpenAI 兼容接口和 Anthropic 兼容接口，支持主流 AI 应用无缝接入。
        </p>
      </div>

      {/* Base URL */}
      <div className='space-y-3'>
        <h2 className='text-2xl font-semibold'>Base URL</h2>
        <pre className='overflow-x-auto rounded-md bg-zinc-950 p-3 text-sm text-zinc-100'>
          <code>https://api.codingplan.com</code>
        </pre>
      </div>

      {/* Authentication */}
      <div className='space-y-3'>
        <h2 className='text-2xl font-semibold'>认证方式</h2>
        <p className='text-muted-foreground'>
          所有 API 请求需要在 HTTP Header 中携带 API Key 进行认证：
        </p>
        <pre className='overflow-x-auto rounded-md bg-zinc-950 p-3 text-sm text-zinc-100'>
          <code>Authorization: Bearer sk-your-api-key-here</code>
        </pre>
        <p className='text-sm text-muted-foreground'>
          你可以在{' '}
          <Link to='/keys' className='text-primary hover:underline'>
            控制台 &gt; API Keys
          </Link>{' '}
          页面创建和管理 API Key。
        </p>
      </div>

      {/* API Endpoints */}
      <div className='space-y-6'>
        <h2 className='text-2xl font-semibold'>接口列表</h2>

        <Tabs defaultValue='openai'>
          <TabsList>
            <TabsTrigger value='openai'>OpenAI 兼容接口</TabsTrigger>
            <TabsTrigger value='anthropic'>Anthropic 兼容接口</TabsTrigger>
          </TabsList>

          <TabsContent value='openai' className='space-y-6 pt-4'>
            {/* Chat Completions */}
            <div className='space-y-3 rounded-lg border p-4'>
              <div className='flex items-center gap-2'>
                <Badge className='bg-green-600 text-white'>POST</Badge>
                <code className='text-sm font-semibold'>/v1/chat/completions</code>
              </div>
              <p className='text-sm text-muted-foreground'>
                创建聊天补全，支持流式和非流式响应。这是最常用的接口。
              </p>
              <h4 className='text-sm font-semibold'>请求示例</h4>
              <pre className='overflow-x-auto rounded-md bg-zinc-950 p-3 text-sm text-zinc-100'>
                <code>{`curl https://api.codingplan.com/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer sk-xxx" \\
  -d '{
    "model": "kimi-2.5",
    "messages": [
      {"role": "system", "content": "你是一个有帮助的助手"},
      {"role": "user", "content": "你好"}
    ],
    "temperature": 0.7,
    "stream": false
  }'`}</code>
              </pre>
              <h4 className='text-sm font-semibold'>响应示例</h4>
              <pre className='overflow-x-auto rounded-md bg-zinc-950 p-3 text-sm text-zinc-100'>
                <code>{`{
  "id": "chatcmpl-xxx",
  "object": "chat.completion",
  "created": 1234567890,
  "model": "kimi-2.5",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "你好！有什么我可以帮助你的吗？"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 20,
    "completion_tokens": 15,
    "total_tokens": 35
  }
}`}</code>
              </pre>
              <h4 className='text-sm font-semibold'>常用参数</h4>
              <div className='overflow-x-auto'>
                <table className='w-full text-sm'>
                  <thead>
                    <tr className='border-b'>
                      <th className='pb-2 text-left font-medium'>参数</th>
                      <th className='pb-2 text-left font-medium'>类型</th>
                      <th className='pb-2 text-left font-medium'>说明</th>
                    </tr>
                  </thead>
                  <tbody className='text-muted-foreground'>
                    <tr className='border-b'>
                      <td className='py-2 font-mono text-foreground'>model</td>
                      <td className='py-2'>string</td>
                      <td className='py-2'>模型名称，如 kimi-2.5、qwen-3.5</td>
                    </tr>
                    <tr className='border-b'>
                      <td className='py-2 font-mono text-foreground'>messages</td>
                      <td className='py-2'>array</td>
                      <td className='py-2'>对话消息列表</td>
                    </tr>
                    <tr className='border-b'>
                      <td className='py-2 font-mono text-foreground'>temperature</td>
                      <td className='py-2'>number</td>
                      <td className='py-2'>温度参数，0-2，默认 1</td>
                    </tr>
                    <tr className='border-b'>
                      <td className='py-2 font-mono text-foreground'>stream</td>
                      <td className='py-2'>boolean</td>
                      <td className='py-2'>是否启用流式响应，默认 false</td>
                    </tr>
                    <tr>
                      <td className='py-2 font-mono text-foreground'>max_tokens</td>
                      <td className='py-2'>integer</td>
                      <td className='py-2'>最大生成 token 数</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Embeddings */}
            <div className='space-y-3 rounded-lg border p-4'>
              <div className='flex items-center gap-2'>
                <Badge className='bg-green-600 text-white'>POST</Badge>
                <code className='text-sm font-semibold'>/v1/embeddings</code>
              </div>
              <p className='text-sm text-muted-foreground'>
                创建文本向量嵌入。
              </p>
              <pre className='overflow-x-auto rounded-md bg-zinc-950 p-3 text-sm text-zinc-100'>
                <code>{`curl https://api.codingplan.com/v1/embeddings \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer sk-xxx" \\
  -d '{
    "model": "text-embedding-v3",
    "input": "你好世界"
  }'`}</code>
              </pre>
            </div>

            {/* Models */}
            <div className='space-y-3 rounded-lg border p-4'>
              <div className='flex items-center gap-2'>
                <Badge className='bg-blue-600 text-white'>GET</Badge>
                <code className='text-sm font-semibold'>/v1/models</code>
              </div>
              <p className='text-sm text-muted-foreground'>
                列出当前可用的模型列表。
              </p>
              <pre className='overflow-x-auto rounded-md bg-zinc-950 p-3 text-sm text-zinc-100'>
                <code>{`curl https://api.codingplan.com/v1/models \\
  -H "Authorization: Bearer sk-xxx"`}</code>
              </pre>
            </div>
          </TabsContent>

          <TabsContent value='anthropic' className='space-y-6 pt-4'>
            <div className='space-y-3 rounded-lg border p-4'>
              <div className='flex items-center gap-2'>
                <Badge className='bg-green-600 text-white'>POST</Badge>
                <code className='text-sm font-semibold'>/anthropic/v1/messages</code>
              </div>
              <p className='text-sm text-muted-foreground'>
                Anthropic Messages API 兼容接口。适用于 Claude Code 等使用 Anthropic SDK 的工具。
              </p>
              <pre className='overflow-x-auto rounded-md bg-zinc-950 p-3 text-sm text-zinc-100'>
                <code>{`curl https://api.codingplan.com/anthropic/v1/messages \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: sk-xxx" \\
  -H "anthropic-version: 2023-06-01" \\
  -d '{
    "model": "kimi-2.5",
    "max_tokens": 1024,
    "messages": [
      {"role": "user", "content": "你好"}
    ]
  }'`}</code>
              </pre>
              <p className='mt-2 text-sm text-muted-foreground'>
                注意：Anthropic 兼容接口使用 <code className='rounded bg-muted px-1'>x-api-key</code> 头部
                而非 <code className='rounded bg-muted px-1'>Authorization: Bearer</code>。
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Rate Limits */}
      <div className='space-y-3'>
        <h2 className='text-2xl font-semibold'>速率限制</h2>
        <p className='text-muted-foreground'>
          API 请求受到速率限制保护，具体限制取决于你的套餐等级：
        </p>
        <div className='overflow-x-auto'>
          <table className='w-full text-sm'>
            <thead>
              <tr className='border-b'>
                <th className='pb-2 text-left font-medium'>套餐</th>
                <th className='pb-2 text-left font-medium'>RPM (每分钟请求数)</th>
                <th className='pb-2 text-left font-medium'>TPM (每分钟 Token 数)</th>
              </tr>
            </thead>
            <tbody className='text-muted-foreground'>
              <tr className='border-b'>
                <td className='py-2 font-medium text-foreground'>Lite</td>
                <td className='py-2'>20</td>
                <td className='py-2'>40,000</td>
              </tr>
              <tr className='border-b'>
                <td className='py-2 font-medium text-foreground'>Pro</td>
                <td className='py-2'>60</td>
                <td className='py-2'>200,000</td>
              </tr>
              <tr className='border-b'>
                <td className='py-2 font-medium text-foreground'>Max 5x</td>
                <td className='py-2'>120</td>
                <td className='py-2'>500,000</td>
              </tr>
              <tr>
                <td className='py-2 font-medium text-foreground'>Max 20x</td>
                <td className='py-2'>300</td>
                <td className='py-2'>1,000,000</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DocsApi;
