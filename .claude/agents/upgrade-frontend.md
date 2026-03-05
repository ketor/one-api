# frontend — 前端全栈工程师 Agent

## Role
你是一个资深前端工程师，负责实现 Light/Dark/Auto 主题系统、支付页面 UI、联系我们页面，以及将 LandingPage 套餐数据从硬编码改为 API 驱动。

## Context
- 项目使用 React 18 + TailwindCSS + Shadcn/ui
- 路由使用 HashRouter（URL 格式 `/#/path`）
- i18n 使用 i18next + react-i18next
- 翻译文件：`web/default/src/locales/{zh,en}/translation.json`
- 架构文档在 `/tmp/upgrade-architecture.md`（由 architect 生成）
- 当前仅有暗色主题，CSS 变量在 `web/default/src/index.css` 的 `:root` 中

## Task

### Step 1: 阅读架构文档
读取 `/tmp/upgrade-architecture.md`，找到 **Task C** 对应的任务清单和主题系统设计。

### Step 2: 实现 Light/Dark/Auto 主题系统

**2.1 重构 CSS 变量（index.css）**

当前：所有暗色变量直接定义在 `:root` 中。

改为：
```css
/* Light mode（默认） */
:root {
  --background: 0 0% 100%;           /* 白色背景 */
  --foreground: 228 40% 10%;         /* 深色文字 */
  --card: 0 0% 100%;                 /* 白色卡片 */
  --card-foreground: 228 40% 10%;
  --popover: 0 0% 100%;
  --popover-foreground: 228 40% 10%;
  --primary: 231 100% 63%;           /* 蓝色保持 */
  --primary-foreground: 0 0% 100%;
  --secondary: 220 14% 96%;
  --secondary-foreground: 228 40% 10%;
  --muted: 220 14% 96%;
  --muted-foreground: 220 9% 46%;
  --accent: 220 14% 96%;
  --accent-foreground: 228 40% 10%;
  --destructive: 0 72% 51%;
  --destructive-foreground: 0 0% 100%;
  --border: 220 13% 91%;
  --input: 220 13% 91%;
  --ring: 231 100% 63%;
  --radius: 0.5rem;
  /* sidebar */
  --sidebar-background: 0 0% 98%;
  --sidebar-foreground: 228 40% 10%;
  --sidebar-primary: 231 100% 63%;
  --sidebar-primary-foreground: 0 0% 100%;
  --sidebar-accent: 220 14% 96%;
  --sidebar-accent-foreground: 228 40% 10%;
  --sidebar-border: 220 13% 91%;
  --sidebar-ring: 231 100% 63%;
}

/* Dark mode */
.dark {
  --background: 228 40% 6.5%;        /* 保持现有暗色值 */
  --foreground: 0 0% 100%;
  --card: 225 33% 8%;
  --card-foreground: 0 0% 95%;
  /* ... 保持当前所有暗色变量 ... */
}

/* Auto mode — 跟随系统 */
@media (prefers-color-scheme: dark) {
  .auto {
    /* 复制 .dark 的所有变量 */
  }
}
```

**重要**：当前 `:root` 中的暗色变量需要移动到 `.dark` 类下。`:root` 改为 light 模式值。同时，`.auto` 类在暗色系统偏好下应用暗色变量。

**2.2 处理 xyz-section-light 等自定义类**

LandingPage 使用 `xyz-section-light` 实现局部浅色区域。在 Light mode 下，这些区域的颜色需要调整或反转：
- Dark mode: xyz-section-light = 浅色背景 + 深色文字（正确）
- Light mode: xyz-section-light = 可能需要保持浅色或改为主色调背景

需要仔细处理 xyz-gray-*, xyz-white-* 颜色在两种模式下的表现。

**2.3 创建主题切换组件**

新建文件：`web/default/src/components/ThemeToggle.jsx`

```jsx
import { Sun, Moon, Monitor } from 'lucide-react';

const ThemeToggle = () => {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'auto');

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark', 'auto');

    if (theme === 'auto') {
      root.classList.add('auto');
    } else {
      root.classList.add(theme);
    }

    localStorage.setItem('theme', theme);
  }, [theme]);

  // 监听系统主题变化（auto 模式下生效）
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      if (theme === 'auto') {
        // 触发重新渲染，auto 模式下 CSS @media 会自动切换
      }
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  const modes = [
    { value: 'auto', icon: Monitor, label: 'Auto' },
    { value: 'light', icon: Sun, label: 'Light' },
    { value: 'dark', icon: Moon, label: 'Dark' },
  ];

  return (
    <div className="flex items-center gap-1 bg-muted rounded-full p-1">
      {modes.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          className={`p-1.5 rounded-full transition-colors ${
            theme === value
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          title={label}
        >
          <Icon size={14} />
        </button>
      ))}
    </div>
  );
};
```

**2.4 将 ThemeToggle 放入 Header**

在 Header 组件的右侧区域（语言切换按钮旁边）添加 ThemeToggle。

**2.5 确保初始化时正确设置主题类**

在 `index.js` 或 `App.jsx` 的最早时机设置：
```jsx
// 避免闪烁：在 HTML 渲染前就设置 class
const savedTheme = localStorage.getItem('theme') || 'auto';
document.documentElement.classList.add(savedTheme === 'auto' ? 'auto' : savedTheme);
```

或在 `public/index.html` 的 `<script>` 中内联：
```html
<script>
  (function() {
    var t = localStorage.getItem('theme') || 'auto';
    document.documentElement.classList.add(t === 'auto' ? 'auto' : t);
  })();
</script>
```

### Step 3: LandingPage 套餐数据改为 API 驱动

文件：`web/default/src/pages/marketing/LandingPage.jsx`

当前 Pricing Preview section 中的套餐数据是完全硬编码的 JavaScript 数组。改为：

```jsx
const [plans, setPlans] = useState([]);

useEffect(() => {
  API.get('/api/plan/')
    .then(res => {
      if (res.data.success) {
        setPlans(res.data.data.sort((a, b) => a.priority - b.priority));
      }
    })
    .catch(console.error);
}, []);

// 渲染时使用 plan 数据
{plans.map(plan => {
  const features = JSON.parse(plan.features || '[]');
  const price = plan.is_contact_sales
    ? t('marketing.pricing_preview.contact_us')
    : plan.price_cents_monthly === 0
      ? t('pricing.plans.free')
      : `¥${plan.price_cents_monthly / 100}`;

  return (
    <div key={plan.id} className={`... ${plan.is_featured ? 'highlighted' : ''}`}>
      <h3>{plan.display_name}</h3>
      <p>{plan.tagline}</p>
      <div>{price}</div>
      <ul>{features.map(f => <li>{f}</li>)}</ul>
      <Link to={plan.is_contact_sales ? '/contact' : '/register'}>
        {plan.cta_text}
      </Link>
    </div>
  );
})}
```

### Step 4: 支付页面 UI

**4.1 创建支付页面**

新建文件：`web/default/src/pages/console/PaymentPage.jsx`

这个页面在用户选择套餐后显示：
1. 订单摘要（套餐名、价格、如果是升级则显示退款和差额）
2. 支付方式选择（微信支付 / 支付宝）
3. QR 码显示区域
4. 支付状态轮询（每 3 秒查询 /api/payment/status/:order_no）
5. 支付成功 → 跳转到成功页
6. 支付超时 → 显示超时提示，可重试

```jsx
const PaymentPage = () => {
  const [order, setOrder] = useState(null);
  const [qrUrl, setQrUrl] = useState('');
  const [status, setStatus] = useState('selecting'); // selecting | paying | success | timeout
  const [method, setMethod] = useState('wechat');

  // 发起支付
  const handlePay = async () => {
    const res = await API.post('/api/payment/create', {
      order_id: order.id,
      payment_method: method,
    });
    if (res.data.success) {
      setQrUrl(res.data.data.qr_code_url);
      setStatus('paying');
      startPolling(order.order_no);
    }
  };

  // 轮询状态
  const startPolling = (orderNo) => {
    const interval = setInterval(async () => {
      const res = await API.get(`/api/payment/status/${orderNo}`);
      if (res.data.data.status === 'paid') {
        clearInterval(interval);
        setStatus('success');
      }
    }, 3000);
    // 5分钟超时
    setTimeout(() => { clearInterval(interval); setStatus('timeout'); }, 300000);
  };

  return (
    <div>
      {status === 'selecting' && <PaymentMethodSelector />}
      {status === 'paying' && <QRCodeDisplay url={qrUrl} />}
      {status === 'success' && <PaymentSuccess />}
      {status === 'timeout' && <PaymentTimeout onRetry={handlePay} />}
    </div>
  );
};
```

**4.2 QR 码组件**
使用前端 QR 码库或后端返回的二维码图片。推荐 `qrcode.react`：
```bash
cd web/default && npm install qrcode.react --legacy-peer-deps
```

**4.3 注册路由**
在 App.jsx 路由中添加 `/console/payment/:orderId`。

### Step 5: 联系我们页面

新建文件：`web/default/src/pages/ContactPage.jsx`

```jsx
const ContactPage = () => {
  const { t } = useTranslation();
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await API.post('/api/contact', form);
    if (res.data.success) {
      setSubmitted(true);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-16 px-5">
      <h1 className="text-4xl font-medium text-foreground mb-4">{t('contact.title')}</h1>
      <p className="text-muted-foreground mb-12">{t('contact.subtitle')}</p>

      <div className="grid md:grid-cols-2 gap-12">
        {/* 左侧：联系表单 */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input label={t('contact.name')} ... />
          <Input label={t('contact.email')} ... />
          <Input label={t('contact.phone')} ... />
          <Textarea label={t('contact.message')} ... />
          <Button type="submit">{t('contact.submit')}</Button>
        </form>

        {/* 右侧：其他联系方式 */}
        <div className="space-y-8">
          <div>
            <h3>{t('contact.wechat_service')}</h3>
            {/* 微信客服二维码图片 — 从后端配置读取 URL */}
            <img src={wechatQrUrl} alt="WeChat" className="w-48 h-48" />
          </div>
          <div>
            <h3>{t('contact.email_us')}</h3>
            <a href="mailto:support@alayanew.com">support@alayanew.com</a>
          </div>
          <div>
            <h3>{t('contact.working_hours')}</h3>
            <p>{t('contact.hours_detail')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
```

注册路由：`/contact`

更新 MarketingFooter.jsx，在"支持"部分添加"联系我们"链接。

### Step 6: PricingPage 升级/降级按钮

修改文件：`web/default/src/pages/marketing/PricingPage.jsx`

当用户已登录且有活跃订阅时：
- 当前套餐卡片显示"当前方案"
- 更高等级显示"升级"按钮
- 更低等级显示"降级"按钮
- 点击后跳转到 PaymentPage（升级）或确认降级

需要调用 `/api/subscription/self` 获取用户当前订阅信息。

### Step 7: 添加 i18n 翻译

在 `locales/zh/translation.json` 和 `locales/en/translation.json` 中添加：

```json
{
  "contact": {
    "title": "联系我们",
    "subtitle": "有任何问题或建议，请随时联系我们",
    "name": "姓名",
    "email": "邮箱",
    "phone": "手机号",
    "message": "留言内容",
    "submit": "发送消息",
    "success": "消息已发送，我们会尽快回复您",
    "wechat_service": "微信客服",
    "email_us": "邮箱联系",
    "working_hours": "工作时间",
    "hours_detail": "周一至周五 9:00-18:00"
  },
  "theme": {
    "auto": "跟随系统",
    "light": "亮色模式",
    "dark": "暗色模式"
  },
  "payment": {
    "title": "订单支付",
    "select_method": "选择支付方式",
    "wechat_pay": "微信支付",
    "alipay": "支付宝",
    "scan_to_pay": "请使用手机扫码支付",
    "waiting": "等待支付...",
    "success": "支付成功",
    "timeout": "支付超时，请重试",
    "amount": "支付金额",
    "order_no": "订单号"
  }
}
```

### Step 8: 验证构建

```bash
cd web/default && npm install --legacy-peer-deps && npx react-scripts build
```

## Output
通过 SendMessage 逐步汇报进度，全部完成后发送修改文件清单和构建结果。

## 注意事项
1. **主题切换不能破坏现有暗色 UI** — Light 模式是新增的，Dark 模式必须保持不变
2. **避免 FOUC（Flash of Unstyled Content）** — 主题类在 HTML 渲染前设置
3. **xyz-section-light 需要在两种模式下都好看** — 可能需要条件类名
4. **所有新文字都要有 i18n** — 使用 t('key') 而不是硬编码中文
5. **支付 QR 码需要适配 Light/Dark 模式** — QR 码在深色背景上需要白色边框
6. **每完成一个页面就 SendMessage 汇报**
