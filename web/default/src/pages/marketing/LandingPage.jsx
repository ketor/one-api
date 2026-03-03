import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import {
  Zap,
  Shield,
  Globe,
  ArrowRight,
  Code2,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

const typewriterLines = [
  '$ export OPENAI_API_BASE=https://api.codingplan.com/v1',
  '$ export OPENAI_API_KEY=sk-xxxxxxxx',
  '$ curl $OPENAI_API_BASE/chat/completions \\',
  '    -H "Authorization: Bearer $OPENAI_API_KEY" \\',
  '    -d \'{"model":"kimi-2.5","messages":[{"role":"user","content":"Hello"}]}\'',
  '',
  '{"choices":[{"message":{"content":"Hello! How can I help you?"}}]}',
];

const TerminalAnimation = () => {
  const [visibleLines, setVisibleLines] = useState(0);

  useEffect(() => {
    if (visibleLines < typewriterLines.length) {
      const timer = setTimeout(
        () => setVisibleLines((v) => v + 1),
        visibleLines === 0 ? 500 : 400
      );
      return () => clearTimeout(timer);
    }
  }, [visibleLines]);

  return (
    <div className='overflow-hidden rounded-lg border bg-zinc-950 text-zinc-100 shadow-2xl'>
      <div className='flex items-center gap-2 border-b border-zinc-800 px-4 py-3'>
        <div className='h-3 w-3 rounded-full bg-red-500' />
        <div className='h-3 w-3 rounded-full bg-yellow-500' />
        <div className='h-3 w-3 rounded-full bg-green-500' />
        <span className='ml-2 text-xs text-zinc-500'>terminal</span>
      </div>
      <div className='p-4 font-mono text-sm leading-relaxed'>
        {typewriterLines.slice(0, visibleLines).map((line, i) => (
          <div key={i} className={line === '' ? 'h-4' : ''}>
            {line.startsWith('$') ? (
              <>
                <span className='text-green-400'>$ </span>
                <span className='text-zinc-300'>{line.slice(2)}</span>
              </>
            ) : line.startsWith('{') ? (
              <span className='text-emerald-400'>{line}</span>
            ) : (
              <span className='text-zinc-400'>{line}</span>
            )}
          </div>
        ))}
        {visibleLines < typewriterLines.length && (
          <span className='inline-block h-4 w-2 animate-pulse bg-zinc-400' />
        )}
      </div>
    </div>
  );
};

const models = [
  {
    name: 'Kimi 2.5',
    provider: 'Moonshot AI',
    context: '200K',
    highlight: '长文本理解',
    description: '支持 200K 超长上下文，擅长文档分析、长篇翻译和复杂推理任务',
    badge: '热门',
  },
  {
    name: 'Qwen 3.5',
    provider: '阿里通义',
    context: '128K',
    highlight: '中文能力',
    description: '业界领先的中文理解与生成能力，代码和数学表现出色',
    badge: '推荐',
  },
  {
    name: 'GLM 5',
    provider: '智谱 AI',
    context: '128K',
    highlight: '代码生成',
    description: '强大的代码理解与生成能力，支持多种编程语言和框架',
    badge: '新',
  },
];

const tools = [
  {
    name: 'Cursor',
    description: 'AI 代码编辑器，直接对接 CodingPlan API',
    config: 'Settings > Models > OpenAI API Base',
  },
  {
    name: 'Claude Code',
    description: 'Anthropic 命令行 AI 助手',
    config: 'ANTHROPIC_BASE_URL 环境变量',
  },
  {
    name: 'VSCode + Cline',
    description: 'VSCode 中的 AI 编程插件',
    config: 'Extension Settings > API Base URL',
  },
  {
    name: 'OpenCode',
    description: '开源终端 AI 编程助手',
    config: 'config.yaml > base_url',
  },
];

const LandingPage = () => {
  return (
    <div className='flex flex-col'>
      {/* Hero Section */}
      <section className='relative overflow-hidden border-b bg-gradient-to-b from-background to-muted/30'>
        <div className='container mx-auto max-w-screen-xl px-4 py-20 md:py-28'>
          <div className='grid items-center gap-12 lg:grid-cols-2'>
            <div className='space-y-6'>
              <Badge variant='secondary' className='px-3 py-1'>
                <Sparkles className='mr-1 h-3 w-3' />
                OpenAI 兼容接口 &middot; 国产大模型聚合
              </Badge>
              <h1 className='text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl'>
                面向开发者的
                <br />
                <span className='text-primary'>AI Coding 助手平台</span>
              </h1>
              <p className='max-w-lg text-lg text-muted-foreground'>
                CodingPlan 聚合 Kimi、通义千问、智谱 GLM 等国产大模型，提供 OpenAI 兼容接口。
                无需切换 SDK，一行配置即可接入 Cursor、Claude Code 等 AI 工具链。
              </p>
              <div className='flex flex-wrap gap-3'>
                <Button size='lg' asChild>
                  <Link to='/register'>
                    立即开始
                    <ArrowRight className='ml-1 h-4 w-4' />
                  </Link>
                </Button>
                <Button size='lg' variant='outline' asChild>
                  <Link to='/pricing'>查看定价</Link>
                </Button>
              </div>
              <div className='flex items-center gap-6 text-sm text-muted-foreground'>
                <span className='flex items-center gap-1'>
                  <CheckCircle2 className='h-4 w-4 text-green-500' />
                  免费试用
                </span>
                <span className='flex items-center gap-1'>
                  <CheckCircle2 className='h-4 w-4 text-green-500' />
                  按量计费
                </span>
                <span className='flex items-center gap-1'>
                  <CheckCircle2 className='h-4 w-4 text-green-500' />
                  无需翻墙
                </span>
              </div>
            </div>
            <div className='hidden lg:block'>
              <TerminalAnimation />
            </div>
          </div>
        </div>
      </section>

      {/* Models Section */}
      <section className='border-b py-20'>
        <div className='container mx-auto max-w-screen-xl px-4'>
          <div className='mx-auto mb-12 max-w-2xl text-center'>
            <h2 className='text-3xl font-bold tracking-tight'>
              接入顶级国产大模型
            </h2>
            <p className='mt-3 text-lg text-muted-foreground'>
              一个 API 聚合多家大模型，按需切换，按量付费
            </p>
          </div>
          <div className='grid gap-6 md:grid-cols-3'>
            {models.map((model) => (
              <Card key={model.name} className='relative overflow-hidden'>
                <CardHeader>
                  <div className='flex items-center justify-between'>
                    <Badge variant='outline'>{model.badge}</Badge>
                    <span className='text-xs text-muted-foreground'>
                      {model.provider}
                    </span>
                  </div>
                  <CardTitle className='mt-2 text-xl'>{model.name}</CardTitle>
                  <CardDescription>
                    <span className='font-medium text-primary'>
                      {model.context}
                    </span>{' '}
                    上下文 &middot; {model.highlight}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className='text-sm text-muted-foreground'>
                    {model.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className='mt-8 text-center'>
            <Button variant='outline' asChild>
              <Link to='/docs'>
                查看全部支持的模型
                <ArrowRight className='ml-1 h-4 w-4' />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Tools Integration Section */}
      <section className='border-b bg-muted/30 py-20'>
        <div className='container mx-auto max-w-screen-xl px-4'>
          <div className='mx-auto mb-12 max-w-2xl text-center'>
            <h2 className='text-3xl font-bold tracking-tight'>
              无缝对接你的 AI 工具
            </h2>
            <p className='mt-3 text-lg text-muted-foreground'>
              兼容 OpenAI API 格式，主流 AI 编程工具一行配置即可接入
            </p>
          </div>
          <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-4'>
            {tools.map((tool) => (
              <Card key={tool.name}>
                <CardHeader>
                  <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10'>
                    <Code2 className='h-5 w-5 text-primary' />
                  </div>
                  <CardTitle className='text-lg'>{tool.name}</CardTitle>
                </CardHeader>
                <CardContent className='space-y-2'>
                  <p className='text-sm text-muted-foreground'>
                    {tool.description}
                  </p>
                  <code className='block rounded bg-muted px-2 py-1 text-xs'>
                    {tool.config}
                  </code>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview Section */}
      <section className='border-b py-20'>
        <div className='container mx-auto max-w-screen-xl px-4'>
          <div className='mx-auto mb-12 max-w-2xl text-center'>
            <h2 className='text-3xl font-bold tracking-tight'>
              简单透明的定价
            </h2>
            <p className='mt-3 text-lg text-muted-foreground'>
              从免费试用开始，按需升级
            </p>
          </div>
          <div className='mx-auto grid max-w-3xl gap-6 md:grid-cols-2'>
            <Card>
              <CardHeader>
                <CardTitle>Lite</CardTitle>
                <CardDescription>适合个人学习和轻度使用</CardDescription>
                <div className='mt-2'>
                  <span className='text-3xl font-bold'>免费</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className='space-y-2 text-sm text-muted-foreground'>
                  <li className='flex items-center gap-2'>
                    <CheckCircle2 className='h-4 w-4 text-green-500' />
                    基础模型访问
                  </li>
                  <li className='flex items-center gap-2'>
                    <CheckCircle2 className='h-4 w-4 text-green-500' />
                    10 次请求 / 5 小时
                  </li>
                  <li className='flex items-center gap-2'>
                    <CheckCircle2 className='h-4 w-4 text-green-500' />
                    社区支持
                  </li>
                </ul>
                <Button variant='outline' className='mt-6 w-full' asChild>
                  <Link to='/register'>免费注册</Link>
                </Button>
              </CardContent>
            </Card>
            <Card className='border-primary'>
              <CardHeader>
                <div className='flex items-center justify-between'>
                  <CardTitle>Pro</CardTitle>
                  <Badge>推荐</Badge>
                </div>
                <CardDescription>适合日常开发和中度使用</CardDescription>
                <div className='mt-2'>
                  <span className='text-3xl font-bold'>&#xA5;140</span>
                  <span className='text-muted-foreground'>/月</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className='space-y-2 text-sm text-muted-foreground'>
                  <li className='flex items-center gap-2'>
                    <CheckCircle2 className='h-4 w-4 text-green-500' />
                    全部模型访问
                  </li>
                  <li className='flex items-center gap-2'>
                    <CheckCircle2 className='h-4 w-4 text-green-500' />
                    45 次请求 / 5 小时
                  </li>
                  <li className='flex items-center gap-2'>
                    <CheckCircle2 className='h-4 w-4 text-green-500' />
                    超额按 API 费率计费
                  </li>
                </ul>
                <Button className='mt-6 w-full' asChild>
                  <Link to='/register'>开始使用</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
          <div className='mt-8 text-center'>
            <Button variant='link' asChild>
              <Link to='/pricing'>
                查看全部套餐对比
                <ArrowRight className='ml-1 h-4 w-4' />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className='py-20'>
        <div className='container mx-auto max-w-screen-xl px-4'>
          <div className='mx-auto mb-12 max-w-2xl text-center'>
            <h2 className='text-3xl font-bold tracking-tight'>
              为什么选择 CodingPlan
            </h2>
          </div>
          <div className='grid gap-8 md:grid-cols-3'>
            <div className='space-y-3'>
              <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10'>
                <Globe className='h-5 w-5 text-primary' />
              </div>
              <h3 className='font-semibold'>国内直连</h3>
              <p className='text-sm text-muted-foreground'>
                无需翻墙，国内服务器直连国产大模型，低延迟高稳定性。
              </p>
            </div>
            <div className='space-y-3'>
              <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10'>
                <Zap className='h-5 w-5 text-primary' />
              </div>
              <h3 className='font-semibold'>OpenAI 兼容</h3>
              <p className='text-sm text-muted-foreground'>
                100% 兼容 OpenAI API 格式，现有代码零改动迁移。
              </p>
            </div>
            <div className='space-y-3'>
              <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10'>
                <Shield className='h-5 w-5 text-primary' />
              </div>
              <h3 className='font-semibold'>安全可靠</h3>
              <p className='text-sm text-muted-foreground'>
                数据加密传输，不存储对话内容，企业级安全保障。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className='border-t bg-muted/30 py-20'>
        <div className='container mx-auto max-w-screen-xl px-4 text-center'>
          <h2 className='text-3xl font-bold tracking-tight'>
            准备好开始了吗？
          </h2>
          <p className='mx-auto mt-3 max-w-lg text-lg text-muted-foreground'>
            免费注册，几分钟内即可在你的 AI 工具中使用国产大模型。
          </p>
          <div className='mt-8 flex justify-center gap-4'>
            <Button size='lg' asChild>
              <Link to='/register'>
                免费注册
                <ArrowRight className='ml-1 h-4 w-4' />
              </Link>
            </Button>
            <Button size='lg' variant='outline' asChild>
              <Link to='/docs'>查看文档</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
