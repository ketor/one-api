import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';

const DocsTools = () => {
  return (
    <div className='space-y-8'>
      <div>
        <h1 className='text-3xl font-bold tracking-tight'>工具对接教程</h1>
        <p className='mt-2 text-lg text-muted-foreground'>
          CodingPlan 兼容 OpenAI API，可直接对接主流 AI 编程工具。以下是各工具的配置方法。
        </p>
      </div>

      <Tabs defaultValue='cursor'>
        <TabsList className='flex-wrap'>
          <TabsTrigger value='cursor'>Cursor</TabsTrigger>
          <TabsTrigger value='claude-code'>Claude Code</TabsTrigger>
          <TabsTrigger value='cline'>VSCode + Cline</TabsTrigger>
          <TabsTrigger value='opencode'>OpenCode</TabsTrigger>
        </TabsList>

        <TabsContent value='cursor' className='space-y-6 pt-4'>
          <Card>
            <CardHeader>
              <CardTitle>Cursor 配置</CardTitle>
              <CardDescription>
                Cursor 是一款基于 VSCode 的 AI 代码编辑器，支持自定义 API 端点。
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <h3 className='font-semibold'>步骤 1：打开设置</h3>
                <p className='text-sm text-muted-foreground'>
                  打开 Cursor，点击右上角齿轮图标，或使用快捷键{' '}
                  <code className='rounded bg-muted px-1'>Ctrl+,</code> (Windows/Linux) /{' '}
                  <code className='rounded bg-muted px-1'>Cmd+,</code> (macOS)。
                </p>
              </div>

              <div className='space-y-2'>
                <h3 className='font-semibold'>步骤 2：配置模型</h3>
                <p className='text-sm text-muted-foreground'>
                  在设置页面找到 "Models" 选项，点击 "Add Model"：
                </p>
                <ul className='ml-4 list-disc space-y-1 text-sm text-muted-foreground'>
                  <li>
                    <strong>Model Name:</strong>{' '}
                    <code className='rounded bg-muted px-1'>kimi-2.5</code>
                  </li>
                  <li>
                    <strong>API Key:</strong> 你的 CodingPlan API Key
                  </li>
                  <li>
                    <strong>API Base URL:</strong>{' '}
                    <code className='rounded bg-muted px-1'>
                      https://api.codingplan.com/v1
                    </code>
                  </li>
                </ul>
              </div>

              <div className='space-y-2'>
                <h3 className='font-semibold'>步骤 3：验证连接</h3>
                <p className='text-sm text-muted-foreground'>
                  配置完成后，打开一个代码文件，使用{' '}
                  <code className='rounded bg-muted px-1'>Ctrl+K</code> 或{' '}
                  <code className='rounded bg-muted px-1'>Ctrl+L</code>{' '}
                  调用 AI 功能，确认响应正常。
                </p>
              </div>

              <div className='rounded-md bg-muted/50 p-3'>
                <p className='text-sm'>
                  <strong>提示：</strong>你可以添加多个模型（如 kimi-2.5、qwen-3.5），
                  在使用时按需切换。
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='claude-code' className='space-y-6 pt-4'>
          <Card>
            <CardHeader>
              <CardTitle>Claude Code 配置</CardTitle>
              <CardDescription>
                Claude Code 是 Anthropic 的命令行 AI 助手，支持自定义 API 端点。
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <h3 className='font-semibold'>方法 1：环境变量</h3>
                <p className='text-sm text-muted-foreground'>
                  在你的 shell 配置文件中添加以下环境变量：
                </p>
                <pre className='overflow-x-auto rounded-md bg-zinc-950 p-3 text-sm text-zinc-100'>
                  <code>{`# ~/.bashrc 或 ~/.zshrc
export ANTHROPIC_BASE_URL=https://api.codingplan.com/anthropic
export ANTHROPIC_API_KEY=sk-your-api-key`}</code>
                </pre>
              </div>

              <div className='space-y-2'>
                <h3 className='font-semibold'>方法 2：直接指定</h3>
                <pre className='overflow-x-auto rounded-md bg-zinc-950 p-3 text-sm text-zinc-100'>
                  <code>{`ANTHROPIC_BASE_URL=https://api.codingplan.com/anthropic \\
ANTHROPIC_API_KEY=sk-your-api-key \\
claude`}</code>
                </pre>
              </div>

              <div className='space-y-2'>
                <h3 className='font-semibold'>验证连接</h3>
                <pre className='overflow-x-auto rounded-md bg-zinc-950 p-3 text-sm text-zinc-100'>
                  <code>{`# 启动 Claude Code
claude

# 在交互界面中输入任意问题测试连接
> 你好，请介绍一下自己`}</code>
                </pre>
              </div>

              <div className='rounded-md bg-muted/50 p-3'>
                <p className='text-sm'>
                  <strong>注意：</strong>Claude Code 使用 Anthropic API 格式（x-api-key），
                  CodingPlan 已完全兼容此格式。
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='cline' className='space-y-6 pt-4'>
          <Card>
            <CardHeader>
              <CardTitle>VSCode + Cline 配置</CardTitle>
              <CardDescription>
                Cline 是 VSCode 中流行的 AI 编程扩展，支持自定义 OpenAI 兼容端点。
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <h3 className='font-semibold'>步骤 1：安装 Cline</h3>
                <p className='text-sm text-muted-foreground'>
                  在 VSCode 扩展商店中搜索 "Cline" 并安装。
                </p>
              </div>

              <div className='space-y-2'>
                <h3 className='font-semibold'>步骤 2：打开设置</h3>
                <p className='text-sm text-muted-foreground'>
                  点击 VSCode 侧边栏的 Cline 图标，点击齿轮图标打开设置。
                </p>
              </div>

              <div className='space-y-2'>
                <h3 className='font-semibold'>步骤 3：配置 API</h3>
                <p className='text-sm text-muted-foreground'>选择 "OpenAI Compatible" 作为 Provider，填入以下信息：</p>
                <ul className='ml-4 list-disc space-y-1 text-sm text-muted-foreground'>
                  <li>
                    <strong>API Base URL:</strong>{' '}
                    <code className='rounded bg-muted px-1'>
                      https://api.codingplan.com/v1
                    </code>
                  </li>
                  <li>
                    <strong>API Key:</strong> 你的 CodingPlan API Key
                  </li>
                  <li>
                    <strong>Model ID:</strong>{' '}
                    <code className='rounded bg-muted px-1'>kimi-2.5</code>
                  </li>
                </ul>
              </div>

              <div className='space-y-2'>
                <h3 className='font-semibold'>步骤 4：验证</h3>
                <p className='text-sm text-muted-foreground'>
                  在 Cline 面板中输入任意问题，确认能正常获取响应。
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='opencode' className='space-y-6 pt-4'>
          <Card>
            <CardHeader>
              <CardTitle>OpenCode 配置</CardTitle>
              <CardDescription>
                OpenCode 是一款开源的终端 AI 编程助手，支持自定义 API 端点。
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <h3 className='font-semibold'>配置文件</h3>
                <p className='text-sm text-muted-foreground'>
                  编辑 OpenCode 配置文件{' '}
                  <code className='rounded bg-muted px-1'>~/.opencode/config.yaml</code>：
                </p>
                <pre className='overflow-x-auto rounded-md bg-zinc-950 p-3 text-sm text-zinc-100'>
                  <code>{`# ~/.opencode/config.yaml
providers:
  codingplan:
    type: openai
    base_url: https://api.codingplan.com/v1
    api_key: sk-your-api-key
    models:
      - kimi-2.5
      - qwen-3.5
      - glm-5

default_provider: codingplan
default_model: kimi-2.5`}</code>
                </pre>
              </div>

              <div className='space-y-2'>
                <h3 className='font-semibold'>环境变量方式</h3>
                <pre className='overflow-x-auto rounded-md bg-zinc-950 p-3 text-sm text-zinc-100'>
                  <code>{`export OPENAI_API_BASE=https://api.codingplan.com/v1
export OPENAI_API_KEY=sk-your-api-key
opencode`}</code>
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* General Tips */}
      <div className='space-y-3'>
        <h2 className='text-2xl font-semibold'>通用提示</h2>
        <div className='space-y-2 rounded-lg border p-4'>
          <ul className='ml-4 list-disc space-y-2 text-sm text-muted-foreground'>
            <li>
              所有支持 OpenAI API 的工具都可以通过修改 Base URL 来对接 CodingPlan。
            </li>
            <li>
              如果工具只支持 <code className='rounded bg-muted px-1'>OPENAI_API_KEY</code>{' '}
              环境变量，直接将 CodingPlan 的 Key 设为该环境变量即可。
            </li>
            <li>
              某些工具可能需要手动指定模型名称。请确保使用 CodingPlan 支持的模型 ID。
            </li>
            <li>
              如果遇到连接问题，请检查 API Base URL 是否以{' '}
              <code className='rounded bg-muted px-1'>/v1</code> 结尾（部分工具需要，部分不需要）。
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DocsTools;
