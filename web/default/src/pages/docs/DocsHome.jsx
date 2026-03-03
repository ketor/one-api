import React from 'react';
import { Link } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import { BookOpen, Code2, Wrench, HelpCircle, AlertTriangle, Wallet } from 'lucide-react';

const quickLinks = [
  {
    icon: BookOpen,
    title: 'API 概述',
    description: '了解 Alaya Code API 的基本概念和请求格式',
    to: '/docs/api-overview',
  },
  {
    icon: Code2,
    title: 'SDK 接入',
    description: 'Python 和 Node.js SDK 快速接入指南',
    to: '/docs/sdk',
  },
  {
    icon: Wrench,
    title: '工具对接',
    description: 'Cursor、Claude Code、VSCode+Cline 配置教程',
    to: '/docs/tools',
  },
  {
    icon: Wallet,
    title: '计费说明',
    description: '了解套餐、窗口限额和计费规则',
    to: '/docs/billing',
  },
  {
    icon: AlertTriangle,
    title: '错误处理',
    description: '常见错误码和排查指南',
    to: '/docs/error-handling',
  },
  {
    icon: HelpCircle,
    title: '常见问题',
    description: '使用过程中的常见问题解答',
    to: '/docs/faq',
  },
];

const DocsHome = () => {
  return (
    <div className='space-y-8'>
      <div>
        <h1 className='text-3xl font-bold tracking-tight'>快速开始</h1>
        <p className='mt-2 text-lg text-muted-foreground'>
          几分钟内开始使用 Alaya Code API 调用国产大模型。
        </p>
      </div>

      {/* Step by step guide */}
      <div className='space-y-6'>
        <h2 className='text-2xl font-semibold'>三步接入</h2>

        <div className='space-y-4'>
          <div className='rounded-lg border p-4'>
            <h3 className='font-semibold'>
              <span className='mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground'>
                1
              </span>
              注册账号并获取 API Key
            </h3>
            <p className='mt-2 text-sm text-muted-foreground'>
              访问{' '}
              <Link to='/register' className='text-primary hover:underline'>
                注册页面
              </Link>{' '}
              创建账号，然后在控制台的{' '}
              <Link to='/keys' className='text-primary hover:underline'>
                API Keys
              </Link>{' '}
              页面创建一个新的 API Key。
            </p>
          </div>

          <div className='rounded-lg border p-4'>
            <h3 className='font-semibold'>
              <span className='mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground'>
                2
              </span>
              配置 API 地址
            </h3>
            <p className='mt-2 text-sm text-muted-foreground'>
              将 API Base URL 设置为 Alaya Code 的接口地址：
            </p>
            <pre className='mt-2 overflow-x-auto rounded-md bg-zinc-950 p-3 text-sm text-zinc-100'>
              <code>{`# 设置环境变量
export OPENAI_API_BASE=https://api.alayanew.com/v1
export OPENAI_API_KEY=sk-your-api-key-here`}</code>
            </pre>
          </div>

          <div className='rounded-lg border p-4'>
            <h3 className='font-semibold'>
              <span className='mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground'>
                3
              </span>
              发送第一个请求
            </h3>
            <p className='mt-2 text-sm text-muted-foreground'>
              使用 curl 或你喜欢的编程语言发送请求：
            </p>
            <pre className='mt-2 overflow-x-auto rounded-md bg-zinc-950 p-3 text-sm text-zinc-100'>
              <code>{`curl https://api.alayanew.com/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer sk-your-api-key-here" \\
  -d '{
    "model": "kimi-2.5",
    "messages": [
      {"role": "user", "content": "你好，请介绍一下自己"}
    ]
  }'`}</code>
            </pre>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className='space-y-4'>
        <h2 className='text-2xl font-semibold'>文档导航</h2>
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          {quickLinks.map((link) => (
            <Link key={link.to} to={link.to} className='block'>
              <Card className='h-full transition-colors hover:bg-accent/50'>
                <CardHeader className='pb-2'>
                  <div className='flex items-center gap-2'>
                    <link.icon className='h-5 w-5 text-primary' />
                    <CardTitle className='text-base'>{link.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>{link.description}</CardDescription>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Supported Models */}
      <div className='space-y-4'>
        <h2 className='text-2xl font-semibold'>支持的模型</h2>
        <div className='overflow-x-auto'>
          <table className='w-full text-sm'>
            <thead>
              <tr className='border-b'>
                <th className='pb-2 text-left font-medium'>模型</th>
                <th className='pb-2 text-left font-medium'>提供商</th>
                <th className='pb-2 text-left font-medium'>上下文长度</th>
                <th className='pb-2 text-left font-medium'>特点</th>
              </tr>
            </thead>
            <tbody className='text-muted-foreground'>
              <tr className='border-b'>
                <td className='py-2 font-mono text-foreground'>kimi-2.5</td>
                <td className='py-2'>Moonshot AI</td>
                <td className='py-2'>200K</td>
                <td className='py-2'>超长上下文，文档分析</td>
              </tr>
              <tr className='border-b'>
                <td className='py-2 font-mono text-foreground'>qwen-3.5</td>
                <td className='py-2'>阿里通义</td>
                <td className='py-2'>128K</td>
                <td className='py-2'>中文理解，代码生成</td>
              </tr>
              <tr className='border-b'>
                <td className='py-2 font-mono text-foreground'>glm-5</td>
                <td className='py-2'>智谱 AI</td>
                <td className='py-2'>128K</td>
                <td className='py-2'>代码生成，多语言</td>
              </tr>
              <tr className='border-b'>
                <td className='py-2 font-mono text-foreground'>deepseek-v3</td>
                <td className='py-2'>DeepSeek</td>
                <td className='py-2'>128K</td>
                <td className='py-2'>推理能力强</td>
              </tr>
              <tr>
                <td className='py-2 font-mono text-foreground'>doubao-pro</td>
                <td className='py-2'>字节跳动</td>
                <td className='py-2'>128K</td>
                <td className='py-2'>通用对话</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className='text-sm text-muted-foreground'>
          更多模型持续更新中。完整模型列表请查看{' '}
          <Link to='/docs/api-overview' className='text-primary hover:underline'>
            API 概述
          </Link>
          。
        </p>
      </div>
    </div>
  );
};

export default DocsHome;
