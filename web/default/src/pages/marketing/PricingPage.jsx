import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../../components/ui/accordion';
import { CheckCircle2, Minus, ArrowRight } from 'lucide-react';
import { cn } from '../../lib/utils';

const plans = [
  {
    name: 'Lite',
    description: '适合个人学习和轻度使用',
    price: '免费',
    priceSuffix: '',
    features: [
      '基础模型访问（Kimi、Qwen 等）',
      '5h 窗口限额：10 次请求',
      '超额暂停使用',
      '社区支持',
    ],
    cta: '免费注册',
    ctaVariant: 'outline',
    highlighted: false,
  },
  {
    name: 'Pro',
    description: '适合日常开发和中度使用',
    price: '¥140',
    priceSuffix: '/月',
    features: [
      '全部模型访问',
      '5h 窗口限额：45 次请求',
      '超额按 API 费率计费',
      '月消费上限可设置',
      '优先邮件支持',
    ],
    cta: '开始使用',
    ctaVariant: 'default',
    highlighted: true,
  },
  {
    name: 'Max 5x',
    description: '适合专业开发者和重度使用',
    price: '¥700',
    priceSuffix: '/月',
    features: [
      '全部模型 + 高级模型',
      '5h 窗口限额：225 次请求',
      '超额按 API 费率计费',
      '月消费上限可设置',
      '优先工单支持',
    ],
    cta: '开始使用',
    ctaVariant: 'outline',
    highlighted: false,
  },
  {
    name: 'Max 20x',
    description: '适合团队和企业用户',
    price: '¥1400',
    priceSuffix: '/月',
    features: [
      '全部模型 + 高级模型 + 独占实例',
      '5h 窗口限额：900 次请求',
      '超额按 API 费率计费',
      '月消费上限可设置',
      '专属客户经理',
    ],
    cta: '联系我们',
    ctaVariant: 'outline',
    highlighted: false,
  },
];

const comparisonFeatures = [
  {
    feature: '基础模型（Kimi、Qwen、GLM）',
    lite: true,
    pro: true,
    max5x: true,
    max20x: true,
  },
  {
    feature: '高级模型',
    lite: false,
    pro: true,
    max5x: true,
    max20x: true,
  },
  {
    feature: '独占实例',
    lite: false,
    pro: false,
    max5x: false,
    max20x: true,
  },
  {
    feature: '5h 窗口限额（请求次数）',
    lite: '10 次',
    pro: '45 次',
    max5x: '225 次',
    max20x: '900 次',
  },
  {
    feature: '超额策略',
    lite: '暂停使用',
    pro: '按 API 费率计费',
    max5x: '按 API 费率计费',
    max20x: '按 API 费率计费',
  },
  {
    feature: '月消费上限',
    lite: '-',
    pro: '可设置',
    max5x: '可设置',
    max20x: '可设置',
  },
  {
    feature: '加油包支持',
    lite: false,
    pro: true,
    max5x: true,
    max20x: true,
  },
  {
    feature: '优先支持',
    lite: false,
    pro: true,
    max5x: true,
    max20x: true,
  },
];

const faqs = [
  {
    question: '什么是 5 小时窗口？',
    answer:
      '5 小时窗口是我们的计费周期单位。系统每 5 小时为一个计费窗口，在窗口内你的 API 请求次数不超过窗口限额即可正常使用。窗口结束后次数自动重置。例如 Pro 套餐的窗口限额为 45 次请求，意味着每 5 小时内你可以发送 45 次 API 请求。',
  },
  {
    question: '额度是如何计算的？',
    answer:
      '窗口限额按请求次数计算，每发送一次 API 请求消耗一次。超出窗口限额后的请求将按 API 费率计费（Lite 套餐为暂停使用）。你可以在控制台的用量统计页面查看详细的请求记录和消费明细。',
  },
  {
    question: '超额后会怎样？',
    answer:
      'Lite 套餐在窗口请求次数用完后会暂停使用，直到下一个 5 小时窗口重置。Pro 及以上套餐超额后按 API 费率计费，服务不会中断。如果你需要更多请求次数，可以购买加油包临时提升额度。',
  },
  {
    question: '如何升级或降级套餐？',
    answer:
      '你可以随时在控制台的订阅管理页面升级或降级套餐。升级立即生效，按剩余天数差价计费。降级在当前计费周期结束后生效。',
  },
  {
    question: '什么是加油包？',
    answer:
      '加油包是一次性的额度充值，不受 5 小时窗口限制。购买后额度直接加到你的账户余额中，有效期 30 天。适合临时有大量 API 调用需求的场景。Pro 及以上套餐才能购买加油包。',
  },
];

const CellValue = ({ value }) => {
  if (typeof value === 'boolean') {
    return value ? (
      <CheckCircle2 className='mx-auto h-4 w-4 text-green-500' />
    ) : (
      <Minus className='mx-auto h-4 w-4 text-muted-foreground' />
    );
  }
  return <span className='text-sm'>{value}</span>;
};

const PricingPage = () => {
  return (
    <div className='flex flex-col'>
      {/* Hero */}
      <section className='border-b py-16'>
        <div className='container mx-auto max-w-screen-xl px-4 text-center'>
          <h1 className='text-4xl font-bold tracking-tight'>
            简单透明的定价
          </h1>
          <p className='mx-auto mt-4 max-w-2xl text-lg text-muted-foreground'>
            从免费开始，按需升级。所有套餐均包含 OpenAI 兼容 API 接口，
            支持主流 AI 编程工具无缝接入。
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className='border-b py-16'>
        <div className='container mx-auto max-w-screen-xl px-4'>
          <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-4'>
            {plans.map((plan) => (
              <Card
                key={plan.name}
                className={cn(
                  'flex flex-col',
                  plan.highlighted && 'border-primary shadow-lg'
                )}
              >
                <CardHeader>
                  <div className='flex items-center justify-between'>
                    <CardTitle className='text-xl'>{plan.name}</CardTitle>
                    {plan.highlighted && <Badge>推荐</Badge>}
                  </div>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className='mt-3'>
                    <span className='text-3xl font-bold'>{plan.price}</span>
                    {plan.priceSuffix && (
                      <span className='text-muted-foreground'>
                        {plan.priceSuffix}
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className='flex-1'>
                  <ul className='space-y-2.5'>
                    {plan.features.map((feature, i) => (
                      <li
                        key={i}
                        className='flex items-start gap-2 text-sm text-muted-foreground'
                      >
                        <CheckCircle2 className='mt-0.5 h-4 w-4 shrink-0 text-green-500' />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    variant={plan.ctaVariant}
                    className='w-full'
                    asChild
                  >
                    <Link to='/register'>{plan.cta}</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className='border-b py-16'>
        <div className='container mx-auto max-w-screen-xl px-4'>
          <h2 className='mb-8 text-center text-2xl font-bold tracking-tight'>
            功能对比
          </h2>
          <div className='overflow-x-auto'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='w-[200px]'>功能</TableHead>
                  <TableHead className='text-center'>Lite</TableHead>
                  <TableHead className='text-center'>Pro</TableHead>
                  <TableHead className='text-center'>Max 5x</TableHead>
                  <TableHead className='text-center'>Max 20x</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {comparisonFeatures.map((row) => (
                  <TableRow key={row.feature}>
                    <TableCell className='font-medium'>
                      {row.feature}
                    </TableCell>
                    <TableCell className='text-center'>
                      <CellValue value={row.lite} />
                    </TableCell>
                    <TableCell className='text-center'>
                      <CellValue value={row.pro} />
                    </TableCell>
                    <TableCell className='text-center'>
                      <CellValue value={row.max5x} />
                    </TableCell>
                    <TableCell className='text-center'>
                      <CellValue value={row.max20x} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className='border-b py-16'>
        <div className='container mx-auto max-w-screen-xl px-4'>
          <h2 className='mb-8 text-center text-2xl font-bold tracking-tight'>
            常见问题
          </h2>
          <div className='mx-auto max-w-3xl'>
            <Accordion type='single' collapsible>
              {faqs.map((faq, i) => (
                <AccordionItem key={i} value={`faq-${i}`}>
                  <AccordionTrigger>{faq.question}</AccordionTrigger>
                  <AccordionContent>
                    <p className='text-muted-foreground'>{faq.answer}</p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className='py-16'>
        <div className='container mx-auto max-w-screen-xl px-4 text-center'>
          <h2 className='text-2xl font-bold tracking-tight'>
            准备好开始了吗？
          </h2>
          <p className='mx-auto mt-3 max-w-lg text-muted-foreground'>
            免费注册，立即获取 API Key，几分钟内即可在你的 AI 工具中使用。
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

export default PricingPage;
