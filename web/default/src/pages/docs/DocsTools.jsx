import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import { useTranslation } from 'react-i18next';

const DocsTools = () => {
  const { t } = useTranslation();

  return (
    <div className='space-y-8'>
      <div>
        <h1 className='text-3xl font-bold tracking-tight'>{t('docs.tools.title')}</h1>
        <p className='mt-2 text-lg text-muted-foreground'>
          {t('docs.tools.description')}
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
              <CardTitle>{t('docs.tools.cursor_title')}</CardTitle>
              <CardDescription>
                {t('docs.tools.cursor_desc')}
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <h3 className='font-semibold'>{t('docs.tools.cursor_step1')}</h3>
                <p className='text-sm text-muted-foreground'>
                  {t('docs.tools.cursor_step1_desc')}
                </p>
              </div>

              <div className='space-y-2'>
                <h3 className='font-semibold'>{t('docs.tools.cursor_step2')}</h3>
                <p className='text-sm text-muted-foreground'>
                  {t('docs.tools.cursor_step2_desc')}
                </p>
                <ul className='ml-4 list-disc space-y-1 text-sm text-muted-foreground'>
                  <li>
                    <strong>Model Name:</strong>{' '}
                    <code className='rounded bg-muted px-1 text-foreground'>kimi-2.5</code>
                  </li>
                  <li>
                    <strong>API Key:</strong> {t('docs.tools.your_api_key')}
                  </li>
                  <li>
                    <strong>API Base URL:</strong>{' '}
                    <code className='rounded bg-muted px-1 text-foreground'>
                      https://api.alayanew.com/v1
                    </code>
                  </li>
                </ul>
              </div>

              <div className='space-y-2'>
                <h3 className='font-semibold'>{t('docs.tools.cursor_step3')}</h3>
                <p className='text-sm text-muted-foreground'>
                  {t('docs.tools.cursor_step3_desc')}
                </p>
              </div>

              <div className='rounded-md bg-muted/50 p-3'>
                <p className='text-sm'>
                  <strong>{t('docs.tools.tip')}:</strong> {t('docs.tools.cursor_tip')}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='claude-code' className='space-y-6 pt-4'>
          <Card>
            <CardHeader>
              <CardTitle>{t('docs.tools.claude_title')}</CardTitle>
              <CardDescription>
                {t('docs.tools.claude_desc')}
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <h3 className='font-semibold'>{t('docs.tools.claude_method1')}</h3>
                <p className='text-sm text-muted-foreground'>
                  {t('docs.tools.claude_method1_desc')}
                </p>
                <pre className='overflow-x-auto rounded-md bg-zinc-950 p-3 text-sm text-zinc-100'>
                  <code>{`# ~/.bashrc or ~/.zshrc
export ANTHROPIC_BASE_URL=https://api.alayanew.com/anthropic
export ANTHROPIC_API_KEY=sk-your-api-key`}</code>
                </pre>
              </div>

              <div className='space-y-2'>
                <h3 className='font-semibold'>{t('docs.tools.claude_method2')}</h3>
                <pre className='overflow-x-auto rounded-md bg-zinc-950 p-3 text-sm text-zinc-100'>
                  <code>{`ANTHROPIC_BASE_URL=https://api.alayanew.com/anthropic \\
ANTHROPIC_API_KEY=sk-your-api-key \\
claude`}</code>
                </pre>
              </div>

              <div className='space-y-2'>
                <h3 className='font-semibold'>{t('docs.tools.verify_connection')}</h3>
                <pre className='overflow-x-auto rounded-md bg-zinc-950 p-3 text-sm text-zinc-100'>
                  <code>{`# Start Claude Code
claude

# Test with a question
> Hello, please introduce yourself`}</code>
                </pre>
              </div>

              <div className='rounded-md bg-muted/50 p-3'>
                <p className='text-sm'>
                  <strong>{t('docs.tools.note')}:</strong> {t('docs.tools.claude_note')}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='cline' className='space-y-6 pt-4'>
          <Card>
            <CardHeader>
              <CardTitle>{t('docs.tools.cline_title')}</CardTitle>
              <CardDescription>
                {t('docs.tools.cline_desc')}
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <h3 className='font-semibold'>{t('docs.tools.cline_step1')}</h3>
                <p className='text-sm text-muted-foreground'>
                  {t('docs.tools.cline_step1_desc')}
                </p>
              </div>

              <div className='space-y-2'>
                <h3 className='font-semibold'>{t('docs.tools.cline_step2')}</h3>
                <p className='text-sm text-muted-foreground'>
                  {t('docs.tools.cline_step2_desc')}
                </p>
              </div>

              <div className='space-y-2'>
                <h3 className='font-semibold'>{t('docs.tools.cline_step3')}</h3>
                <p className='text-sm text-muted-foreground'>{t('docs.tools.cline_step3_desc')}</p>
                <ul className='ml-4 list-disc space-y-1 text-sm text-muted-foreground'>
                  <li>
                    <strong>API Base URL:</strong>{' '}
                    <code className='rounded bg-muted px-1 text-foreground'>
                      https://api.alayanew.com/v1
                    </code>
                  </li>
                  <li>
                    <strong>API Key:</strong> {t('docs.tools.your_api_key')}
                  </li>
                  <li>
                    <strong>Model ID:</strong>{' '}
                    <code className='rounded bg-muted px-1 text-foreground'>kimi-2.5</code>
                  </li>
                </ul>
              </div>

              <div className='space-y-2'>
                <h3 className='font-semibold'>{t('docs.tools.cline_step4')}</h3>
                <p className='text-sm text-muted-foreground'>
                  {t('docs.tools.cline_step4_desc')}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='opencode' className='space-y-6 pt-4'>
          <Card>
            <CardHeader>
              <CardTitle>{t('docs.tools.opencode_title')}</CardTitle>
              <CardDescription>
                {t('docs.tools.opencode_desc')}
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <h3 className='font-semibold'>{t('docs.tools.opencode_config')}</h3>
                <p className='text-sm text-muted-foreground'>
                  {t('docs.tools.opencode_config_desc')}
                </p>
                <pre className='overflow-x-auto rounded-md bg-zinc-950 p-3 text-sm text-zinc-100'>
                  <code>{`# ~/.opencode/config.yaml
providers:
  alayacode:
    type: openai
    base_url: https://api.alayanew.com/v1
    api_key: sk-your-api-key
    models:
      - kimi-2.5
      - qwen-3.5
      - glm-5

default_provider: alayacode
default_model: kimi-2.5`}</code>
                </pre>
              </div>

              <div className='space-y-2'>
                <h3 className='font-semibold'>{t('docs.tools.opencode_env')}</h3>
                <pre className='overflow-x-auto rounded-md bg-zinc-950 p-3 text-sm text-zinc-100'>
                  <code>{`export OPENAI_API_BASE=https://api.alayanew.com/v1
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
        <h2 className='text-2xl font-semibold'>{t('docs.tools.general_tips')}</h2>
        <div className='space-y-2 rounded-lg border p-4'>
          <ul className='ml-4 list-disc space-y-2 text-sm text-muted-foreground'>
            <li>{t('docs.tools.tip1')}</li>
            <li>{t('docs.tools.tip2')}</li>
            <li>{t('docs.tools.tip3')}</li>
            <li>{t('docs.tools.tip4')}</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DocsTools;
