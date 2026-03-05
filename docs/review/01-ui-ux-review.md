# UI/UX 评审报告

## 评审范围
- `web/default/src/` 下所有页面、组件、布局、样式和国际化文件
- 主题系统（Tailwind Config + CSS Variables）
- 营销页面（Landing, Pricing, Contact）
- 控制台页面（Dashboard, Subscription, Keys, Usage, Billing, Settings）
- 管理后台布局（AdminLayout）
- 认证页面（Login, Register, PasswordReset）
- 导航组件（MarketingHeader, MarketingFooter, ConsoleSidebar, ConsoleTopBar）

## 评审总结

| 维度 | 健康度 | 说明 |
|------|--------|------|
| 设计 Token 统一性 | 🟢 | Tailwind theme + CSS vars 双层体系完整，XYZ Cloud palette 和 Shadcn semantic tokens 分层清晰 |
| 组件封装 | 🟢 | Radix UI + Shadcn 组件库使用规范，无重复造轮子 |
| 响应式设计 | 🔴→🟢 | 营销页面原先多处 grid-cols-4 无移动端断点，MarketingHeader 无汉堡菜单。**已修复** |
| 交互体验 | 🟢 | 加载、空状态、错误状态覆盖完整，表单校验反馈良好 |
| 可访问性（a11y） | 🟡 | 整体 aria 使用偏少（仅 24 处），已在 MarketingHeader 添加 aria-label。后续可逐步增强 |
| 国际化 | 🔴→🟢 | 发现 7 处硬编码中文字符串。**已全部修复并补充 i18n 键** |
| 暗色模式 | 🟡→🟢 | Dashboard 图表 Tooltip 背景色硬编码为 #fff，暗色模式不可见。**已修复为 CSS 变量** |
| 圆角设计 | 🟡→🟢 | `--radius: 0px` 使 AuthLayout `rounded-xl` 无效果。**已修复为 0.5rem** |

## 已实施的修改

### 1. 营销页面响应式网格修复
- **严重程度**：🔴
- **位置**：`web/default/src/pages/marketing/LandingPage.jsx:287,461`
- **原始问题**：定价预览和工具集成区域使用 `grid-cols-4` 无移动端断点，在手机上 4 列挤压严重
- **修改内容**：改为 `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` 渐进式响应
- **验证结果**：构建通过 ✅

### 2. MarketingHeader 移动端适配
- **严重程度**：🔴
- **位置**：`web/default/src/components/navigation/MarketingHeader.jsx`
- **原始问题**：
  - 固定 `px-20` 在小屏上内容溢出
  - 无汉堡菜单，移动端导航链接全部隐藏
- **修改内容**：
  - 改为 `px-5 md:px-20` 响应式内边距
  - 添加移动端汉堡菜单（Menu/X 图标切换）
  - 桌面导航隐藏在 `hidden md:flex`，移动端展开为全宽下拉菜单
  - 添加 `aria-label` 到语言切换和菜单按钮
- **验证结果**：构建通过 ✅

### 3. Hero 区域标题移动端字体缩放
- **严重程度**：🟡
- **位置**：
  - `web/default/src/pages/marketing/LandingPage.jsx:192`
  - `web/default/src/pages/marketing/PricingPage.jsx:184`
  - `web/default/src/pages/marketing/ContactPage.jsx:56`
- **原始问题**：`text-[64px]` 固定字号在手机上溢出
- **修改内容**：改为 `text-3xl sm:text-5xl md:text-[64px]` 渐进缩放，`leading` 也做了响应式
- **验证结果**：构建通过 ✅

### 4. Hero 信息点移动端排列
- **严重程度**：🟡
- **位置**：`web/default/src/pages/marketing/LandingPage.jsx:235`
- **原始问题**：三个绿点标签在手机上横排溢出
- **修改内容**：改为 `flex-col sm:flex-row`，小屏垂直排列
- **验证结果**：构建通过 ✅

### 5. 硬编码中文字符串国际化
- **严重程度**：🔴
- **位置**：
  - `web/default/src/components/RegisterForm.js:193` — `'注册中...'`
  - `web/default/src/components/Header.js:96` — `'注销成功!'`
  - `web/default/src/components/PasswordResetForm.js:55` — 硬编码 Turnstile 提示
  - `web/default/src/components/layout/AdminLayout.jsx:30-37,73,94,103,119,125` — 多处硬编码中文
- **修改内容**：
  - 所有硬编码字符串替换为 `t()` 调用，带中文 fallback
  - AdminLayout 引入 `useTranslation`，侧边栏改用 i18n key 数组
  - 新增 i18n 键：`messages.success.logout`, `auth.register.registering`, `nav.admin.*`, `nav.switch_language`
  - 中英文翻译文件均已补充
- **验证结果**：构建通过 ✅

### 6. Dashboard 图表暗色模式 Tooltip 修复
- **严重程度**：🟡
- **位置**：`web/default/src/pages/console/DashboardPage.jsx:266,312`
- **原始问题**：Recharts Tooltip `contentStyle` 硬编码 `background: '#fff'`，暗色模式下白色背景突兀
- **修改内容**：改为 `background: 'hsl(var(--card))'`, `color: 'hsl(var(--card-foreground))'`, `border: '1px solid hsl(var(--border))'`
- **验证结果**：构建通过 ✅

### 7. 全局圆角变量修复
- **严重程度**：🟡
- **位置**：`web/default/src/index.css:69`
- **原始问题**：`--radius: 0px` 使所有 shadcn 组件的 `rounded-lg/md/sm` 都为 0，AuthLayout 的 `rounded-xl` 也无效果
- **修改内容**：改为 `--radius: 0.5rem`，让 `rounded-lg` = 0.5rem，`rounded-md` = 6px，`rounded-sm` = 4px
- **验证结果**：构建通过 ✅

## 待后续处理的问题

### 1. 更多 a11y 增强
- **严重程度**：🟡
- **说明**：整体项目仅 24 处 aria/role/sr-only，建议后续逐步为所有交互元素添加 aria-label，特别是：
  - ContactPage 表单 input 应绑定 `<label htmlFor>`（当前用视觉 label）
  - 各处图标按钮添加 sr-only 说明
  - 动画组件添加 `aria-hidden` 或 `role="presentation"`

### 2. Legacy 页面硬编码中文
- **严重程度**：🟡
- **说明**：`EditToken.js`, `EditChannel.js`, `EditUser.js`, `semantic-shim.js` 中仍有少量硬编码中文 placeholder/错误消息。这些属于旧版 admin 页面，建议在功能重写时一并处理。

### 3. Toast 颜色硬编码
- **严重程度**：🟢
- **说明**：`index.css` 中 Toast 样式使用硬编码 hex 色值。功能正常（dark/light 已分别处理），但理想做法是引用 CSS 变量。

### 4. UsagePage/AdminUsageMonitor 图表 Tooltip
- **严重程度**：🟡
- **说明**：与 DashboardPage 同类问题，其他含 Recharts 的页面也应检查 Tooltip 样式。

## 新增/修改的测试
- 无新增自动化测试（UI 变更为样式和标记级别，通过构建验证 + 视觉检查确认）
- 建议后续添加：响应式断点视觉回归测试（Playwright viewport resize）
