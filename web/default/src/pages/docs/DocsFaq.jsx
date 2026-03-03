import React from 'react';
import { Link } from 'react-router-dom';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../../components/ui/accordion';

const faqCategories = [
  {
    title: '账号与注册',
    items: [
      {
        q: '注册需要什么信息？',
        a: '注册只需要邮箱地址和密码。我们也支持 GitHub 和微信快捷登录。注册后即可获得 Lite 套餐的免费额度开始使用。',
      },
      {
        q: '免费额度有多少？',
        a: 'Lite 套餐提供每 5 小时 10 次免费请求。足够个人学习和轻度使用。',
      },
      {
        q: '如何获取 API Key？',
        a: '登录控制台后，在 "API Keys" 页面点击 "创建 Key" 按钮即可。建议为不同的项目或工具创建独立的 Key，便于管理和追踪用量。',
      },
    ],
  },
  {
    title: '计费与套餐',
    items: [
      {
        q: '什么是 5 小时窗口？',
        a: '5 小时窗口是我们的计费周期。系统每 5 小时重置一次请求次数。在窗口期内，你的 API 请求次数不超过窗口限额即可正常使用。例如 Pro 套餐每 5 小时有 45 次请求额度。',
      },
      {
        q: '超额后会发生什么？',
        a: 'Lite 套餐超额后会暂停使用，直到下一个 5 小时窗口重置。Pro 及以上套餐超额后按 API 费率计费，服务不会中断。',
      },
      {
        q: '加油包是什么？',
        a: '加油包是一次性额度充值，不受 5 小时窗口限制，购买后直接加入账户余额，有效期 30 天。适合临时有大量调用需求的场景。Pro 及以上套餐可用。',
      },
      {
        q: '可以随时升降级吗？',
        a: '可以。升级立即生效，按剩余天数补差价。降级在当前计费周期结束后生效。你可以在控制台的 "订阅管理" 页面操作。',
      },
      {
        q: '支持哪些支付方式？',
        a: '目前支持微信支付和支付宝。企业用户可以联系我们申请对公转账。',
      },
    ],
  },
  {
    title: '使用与接口',
    items: [
      {
        q: '支持哪些模型？',
        a: '目前支持 Kimi 2.5、通义千问 Qwen 3.5、智谱 GLM 5、DeepSeek V3、豆包 Pro 等主流国产大模型。我们持续更新支持的模型，具体列表请查看 API 文档。',
      },
      {
        q: '接口和 OpenAI 完全兼容吗？',
        a: '是的，Alaya Code 100% 兼容 OpenAI API 格式，包括 Chat Completions、Embeddings、Models 等接口。你可以直接使用 OpenAI 官方 SDK，只需修改 base_url。',
      },
      {
        q: '支持流式输出吗？',
        a: '支持。在请求中设置 stream: true 即可启用 SSE 流式输出，与 OpenAI 的流式格式完全一致。',
      },
      {
        q: '响应延迟大吗？',
        a: '我们的服务器部署在国内，直连各大模型提供商的 API，通常延迟在 100-500ms 之间（不含模型生成时间）。实际体验与直接调用模型提供商的 API 基本一致。',
      },
      {
        q: '请求失败时如何处理？',
        a: '建议实现指数退避重试机制。常见的错误码包括 429（频率限制）、402（额度不足）、503（服务暂时不可用）。详细的错误码说明请查看错误处理文档。',
      },
    ],
  },
  {
    title: '安全与隐私',
    items: [
      {
        q: '你们会存储对话内容吗？',
        a: '不会。我们不存储任何 API 请求的输入和输出内容。我们只记录请求的元数据（时间、模型、token 数量）用于计费和统计。',
      },
      {
        q: 'API Key 安全吗？',
        a: 'API Key 使用加密存储，传输过程通过 HTTPS 加密。你可以随时在控制台禁用或删除 Key。建议定期轮换 Key，并为不同项目使用独立的 Key。',
      },
    ],
  },
];

const DocsFaq = () => {
  return (
    <div className='space-y-8'>
      <div>
        <h1 className='text-3xl font-bold tracking-tight'>常见问题</h1>
        <p className='mt-2 text-lg text-muted-foreground'>
          关于 Alaya Code 的常见问题和解答。
        </p>
      </div>

      {faqCategories.map((category) => (
        <div key={category.title} className='space-y-3'>
          <h2 className='text-2xl font-semibold'>{category.title}</h2>
          <Accordion type='single' collapsible>
            {category.items.map((item, i) => (
              <AccordionItem key={i} value={`${category.title}-${i}`}>
                <AccordionTrigger>{item.q}</AccordionTrigger>
                <AccordionContent>
                  <p className='text-muted-foreground'>{item.a}</p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      ))}

      <div className='rounded-lg border p-4'>
        <h3 className='font-semibold'>还有其他问题？</h3>
        <p className='mt-1 text-sm text-muted-foreground'>
          查看{' '}
          <Link to='/docs' className='text-primary hover:underline'>
            完整文档
          </Link>{' '}
          或{' '}
          <Link to='/docs/errors' className='text-primary hover:underline'>
            错误处理指南
          </Link>
          。你也可以在控制台提交工单联系我们。
        </p>
      </div>
    </div>
  );
};

export default DocsFaq;
