import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';

const DocsSdk = () => {
  return (
    <div className='space-y-8'>
      <div>
        <h1 className='text-3xl font-bold tracking-tight'>SDK 接入指南</h1>
        <p className='mt-2 text-lg text-muted-foreground'>
          Alaya Code 兼容 OpenAI SDK，你可以使用 Python 或 Node.js 官方 SDK 直接接入。
        </p>
      </div>

      <Tabs defaultValue='python'>
        <TabsList>
          <TabsTrigger value='python'>Python</TabsTrigger>
          <TabsTrigger value='nodejs'>Node.js</TabsTrigger>
        </TabsList>

        <TabsContent value='python' className='space-y-6 pt-4'>
          <div className='space-y-3'>
            <h2 className='text-2xl font-semibold'>安装</h2>
            <pre className='overflow-x-auto rounded-md bg-zinc-950 p-3 text-sm text-zinc-100'>
              <code>pip install openai</code>
            </pre>
          </div>

          <div className='space-y-3'>
            <h2 className='text-2xl font-semibold'>基本用法</h2>
            <pre className='overflow-x-auto rounded-md bg-zinc-950 p-3 text-sm text-zinc-100'>
              <code>{`from openai import OpenAI

client = OpenAI(
    api_key="sk-your-api-key",
    base_url="https://api.alayanew.com/v1"
)

# 非流式调用
response = client.chat.completions.create(
    model="kimi-2.5",
    messages=[
        {"role": "system", "content": "你是一个有帮助的助手"},
        {"role": "user", "content": "用 Python 写一个快速排序"}
    ],
    temperature=0.7
)

print(response.choices[0].message.content)`}</code>
            </pre>
          </div>

          <div className='space-y-3'>
            <h2 className='text-2xl font-semibold'>流式调用</h2>
            <pre className='overflow-x-auto rounded-md bg-zinc-950 p-3 text-sm text-zinc-100'>
              <code>{`stream = client.chat.completions.create(
    model="qwen-3.5",
    messages=[
        {"role": "user", "content": "请解释什么是 RAG"}
    ],
    stream=True
)

for chunk in stream:
    if chunk.choices[0].delta.content is not None:
        print(chunk.choices[0].delta.content, end="")`}</code>
            </pre>
          </div>

          <div className='space-y-3'>
            <h2 className='text-2xl font-semibold'>Embeddings</h2>
            <pre className='overflow-x-auto rounded-md bg-zinc-950 p-3 text-sm text-zinc-100'>
              <code>{`response = client.embeddings.create(
    model="text-embedding-v3",
    input="你好世界"
)

embedding = response.data[0].embedding
print(f"维度: {len(embedding)}")`}</code>
            </pre>
          </div>

          <div className='space-y-3'>
            <h2 className='text-2xl font-semibold'>使用环境变量</h2>
            <pre className='overflow-x-auto rounded-md bg-zinc-950 p-3 text-sm text-zinc-100'>
              <code>{`# .env 文件
OPENAI_API_KEY=sk-your-api-key
OPENAI_API_BASE=https://api.alayanew.com/v1`}</code>
            </pre>
            <pre className='overflow-x-auto rounded-md bg-zinc-950 p-3 text-sm text-zinc-100'>
              <code>{`import os
from openai import OpenAI

# SDK 会自动读取 OPENAI_API_KEY 和 OPENAI_API_BASE 环境变量
client = OpenAI()

response = client.chat.completions.create(
    model="kimi-2.5",
    messages=[{"role": "user", "content": "你好"}]
)
print(response.choices[0].message.content)`}</code>
            </pre>
          </div>
        </TabsContent>

        <TabsContent value='nodejs' className='space-y-6 pt-4'>
          <div className='space-y-3'>
            <h2 className='text-2xl font-semibold'>安装</h2>
            <pre className='overflow-x-auto rounded-md bg-zinc-950 p-3 text-sm text-zinc-100'>
              <code>npm install openai</code>
            </pre>
          </div>

          <div className='space-y-3'>
            <h2 className='text-2xl font-semibold'>基本用法</h2>
            <pre className='overflow-x-auto rounded-md bg-zinc-950 p-3 text-sm text-zinc-100'>
              <code>{`import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: 'sk-your-api-key',
  baseURL: 'https://api.alayanew.com/v1',
});

async function main() {
  const response = await client.chat.completions.create({
    model: 'kimi-2.5',
    messages: [
      { role: 'system', content: '你是一个有帮助的助手' },
      { role: 'user', content: '用 JavaScript 写一个防抖函数' },
    ],
    temperature: 0.7,
  });

  console.log(response.choices[0].message.content);
}

main();`}</code>
            </pre>
          </div>

          <div className='space-y-3'>
            <h2 className='text-2xl font-semibold'>流式调用</h2>
            <pre className='overflow-x-auto rounded-md bg-zinc-950 p-3 text-sm text-zinc-100'>
              <code>{`const stream = await client.chat.completions.create({
  model: 'qwen-3.5',
  messages: [
    { role: 'user', content: '请解释什么是 RAG' },
  ],
  stream: true,
});

for await (const chunk of stream) {
  const content = chunk.choices[0]?.delta?.content || '';
  process.stdout.write(content);
}`}</code>
            </pre>
          </div>

          <div className='space-y-3'>
            <h2 className='text-2xl font-semibold'>使用环境变量</h2>
            <pre className='overflow-x-auto rounded-md bg-zinc-950 p-3 text-sm text-zinc-100'>
              <code>{`# .env 文件
OPENAI_API_KEY=sk-your-api-key
OPENAI_BASE_URL=https://api.alayanew.com/v1`}</code>
            </pre>
            <pre className='overflow-x-auto rounded-md bg-zinc-950 p-3 text-sm text-zinc-100'>
              <code>{`// SDK 会自动读取 OPENAI_API_KEY 环境变量
const client = new OpenAI({
  baseURL: process.env.OPENAI_BASE_URL,
});`}</code>
            </pre>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DocsSdk;
