import React from 'react';
import { Badge } from '../../components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';

const errorCodes = [
  {
    code: 400,
    status: 'Bad Request',
    description: '请求格式错误',
    cause: '请求体 JSON 格式错误或缺少必需字段（如 model、messages）',
    solution: '检查请求体格式是否正确，确保必需字段完整',
  },
  {
    code: 401,
    status: 'Unauthorized',
    description: '认证失败',
    cause: 'API Key 无效、过期或未提供',
    solution: '检查 Authorization Header 格式和 API Key 是否正确',
  },
  {
    code: 402,
    status: 'Payment Required',
    description: '额度不足',
    cause: '账户余额不足或已达到月消费上限',
    solution: '升级套餐或购买加油包补充额度',
  },
  {
    code: 403,
    status: 'Forbidden',
    description: '权限不足',
    cause: '当前套餐不支持请求的模型或功能',
    solution: '升级到支持该模型的套餐',
  },
  {
    code: 404,
    status: 'Not Found',
    description: '资源不存在',
    cause: '请求的接口路径或模型名称不存在',
    solution: '检查 URL 路径和模型名称是否正确',
  },
  {
    code: 429,
    status: 'Too Many Requests',
    description: '请求频率过高',
    cause: '超过套餐的 RPM 或 TPM 限制',
    solution: '降低请求频率或升级套餐。响应头中包含 Retry-After 字段',
  },
  {
    code: 500,
    status: 'Internal Server Error',
    description: '服务器内部错误',
    cause: '服务端异常',
    solution: '重试请求。如果持续出现，请联系技术支持',
  },
  {
    code: 502,
    status: 'Bad Gateway',
    description: '上游服务异常',
    cause: '模型提供商的 API 暂时不可用',
    solution: '稍后重试，或切换到其他模型',
  },
  {
    code: 503,
    status: 'Service Unavailable',
    description: '服务暂时不可用',
    cause: '系统维护或过载',
    solution: '稍后重试',
  },
];

const DocsErrors = () => {
  return (
    <div className='space-y-8'>
      <div>
        <h1 className='text-3xl font-bold tracking-tight'>错误处理</h1>
        <p className='mt-2 text-lg text-muted-foreground'>
          了解 CodingPlan API 的错误码和推荐的处理方式。
        </p>
      </div>

      {/* Error Response Format */}
      <div className='space-y-3'>
        <h2 className='text-2xl font-semibold'>错误响应格式</h2>
        <p className='text-muted-foreground'>
          当 API 请求失败时，响应体包含以下格式的错误信息：
        </p>
        <pre className='overflow-x-auto rounded-md bg-zinc-950 p-3 text-sm text-zinc-100'>
          <code>{`{
  "error": {
    "message": "具体的错误描述信息",
    "type": "error_type",
    "code": "error_code"
  }
}`}</code>
        </pre>
      </div>

      {/* Error Codes Table */}
      <div className='space-y-3'>
        <h2 className='text-2xl font-semibold'>错误码列表</h2>
        <div className='overflow-x-auto'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='w-[80px]'>状态码</TableHead>
                <TableHead className='w-[120px]'>状态</TableHead>
                <TableHead className='w-[120px]'>说明</TableHead>
                <TableHead>常见原因</TableHead>
                <TableHead>处理方式</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {errorCodes.map((error) => (
                <TableRow key={error.code}>
                  <TableCell>
                    <Badge
                      variant={error.code >= 500 ? 'destructive' : error.code >= 400 ? 'secondary' : 'default'}
                    >
                      {error.code}
                    </Badge>
                  </TableCell>
                  <TableCell className='font-mono text-xs'>
                    {error.status}
                  </TableCell>
                  <TableCell className='font-medium'>
                    {error.description}
                  </TableCell>
                  <TableCell className='text-muted-foreground'>
                    {error.cause}
                  </TableCell>
                  <TableCell className='text-muted-foreground'>
                    {error.solution}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Retry Strategy */}
      <div className='space-y-3'>
        <h2 className='text-2xl font-semibold'>重试策略</h2>
        <p className='text-muted-foreground'>
          对于 429 和 5xx 错误，建议实现指数退避重试：
        </p>
        <pre className='overflow-x-auto rounded-md bg-zinc-950 p-3 text-sm text-zinc-100'>
          <code>{`async function callWithRetry(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.status === 429 || error.status >= 500) {
        // 指数退避: 1s, 2s, 4s
        const delay = Math.pow(2, i) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error; // 非重试类错误直接抛出
    }
  }
  throw new Error('Max retries exceeded');
}`}</code>
        </pre>
      </div>

      {/* Rate Limit Headers */}
      <div className='space-y-3'>
        <h2 className='text-2xl font-semibold'>速率限制响应头</h2>
        <p className='text-muted-foreground'>
          API 响应包含以下速率限制相关的 HTTP Header：
        </p>
        <div className='overflow-x-auto'>
          <table className='w-full text-sm'>
            <thead>
              <tr className='border-b'>
                <th className='pb-2 text-left font-medium'>Header</th>
                <th className='pb-2 text-left font-medium'>说明</th>
              </tr>
            </thead>
            <tbody className='text-muted-foreground'>
              <tr className='border-b'>
                <td className='py-2 font-mono text-foreground'>x-ratelimit-limit-requests</td>
                <td className='py-2'>每分钟最大请求数</td>
              </tr>
              <tr className='border-b'>
                <td className='py-2 font-mono text-foreground'>x-ratelimit-remaining-requests</td>
                <td className='py-2'>当前分钟内剩余请求数</td>
              </tr>
              <tr className='border-b'>
                <td className='py-2 font-mono text-foreground'>x-ratelimit-reset-requests</td>
                <td className='py-2'>请求限制重置时间</td>
              </tr>
              <tr>
                <td className='py-2 font-mono text-foreground'>retry-after</td>
                <td className='py-2'>429 错误时建议的等待秒数</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Troubleshooting */}
      <div className='space-y-3'>
        <h2 className='text-2xl font-semibold'>常见排查步骤</h2>
        <div className='space-y-2 rounded-lg border p-4'>
          <ol className='ml-4 list-decimal space-y-2 text-sm text-muted-foreground'>
            <li>
              <strong>确认 API Key 正确：</strong>在控制台检查 Key 是否处于启用状态，
              复制 Key 时注意不要多余的空格。
            </li>
            <li>
              <strong>检查 Base URL：</strong>确保 URL 为{' '}
              <code className='rounded bg-muted px-1'>https://api.codingplan.com/v1</code>
              （注意末尾的 /v1）。
            </li>
            <li>
              <strong>检查模型名称：</strong>使用{' '}
              <code className='rounded bg-muted px-1'>GET /v1/models</code>{' '}
              接口查看当前可用的模型列表。
            </li>
            <li>
              <strong>检查额度：</strong>在控制台的用量统计页面查看当前窗口的额度使用情况。
            </li>
            <li>
              <strong>查看请求日志：</strong>在控制台的日志页面可以查看所有 API 请求的详细记录。
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default DocsErrors;
