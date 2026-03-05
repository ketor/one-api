# Product Upgrade — Agents Team 设计方案

## 项目背景

Alaya Code 产品需要进行一次全面升级，涵盖以下核心需求：

1. **UI 主题系统升级**：支持 Light/Dark/Auto 三种模式，默认 Auto，用户可在界面直接切换
2. **套餐配置标准化**：首页 4 档套餐 GLOW/STAR/SOLAR/GALAXY 与数据库默认配置不一致（当前 DB 默认是 lite/pro/max5x/max20x），需全部改为配置式，零硬编码
3. **支付网关集成**：当前所有订单直接标记"已支付"(payment_method="admin")，需接入微信支付和支付宝扫码支付
4. **订阅自动化**：无定时任务处理订阅过期、自动续费
5. **升级退款逻辑**：用户升级套餐时自动按比例退款剩余额度并收取新价格差额
6. **联系我们功能**：让用户能联系客服
7. **测试体系建设**：当前 25000+ 行 Go 代码仅 238 行测试（~0.02%），需达到行业标准
8. **安全加固**：默认密码 123456、硬编码数据库密码、无 CSRF 保护
9. **监控基础设施**：添加 Prometheus metrics 端点

## 关键发现（代码审计结果）

### 当前套餐不一致
| 位置 | 套餐名 | 价格 |
|------|--------|------|
| LandingPage.jsx (硬编码) | GLOW/STAR/SOLAR/GALAXY | 免费/¥99/¥299/联系我们 |
| PricingPage.jsx (从API读取) | 动态 | 动态 |
| InitDefaultPlans() (Go代码硬编码) | lite/pro/max5x/max20x | ¥0/¥140/¥700/¥1400 |
| MigratePlanWeeklyLimits() (Go代码硬编码) | lite/pro/max5x/max20x | 固定值 |

### 支付流程现状
- `controller/subscription.go` 中所有 Create/Upgrade/Renew 都直接设 `PaymentMethod: "admin"` 然后立即 `UpdateOrderStatus(Paid)`
- Order model 已预留 `PaymentMethod`/`PaymentTradeNo` 字段
- 升级时 `priceDiff = newPlan.Price - currentPlan.Price`，无按天比例计算

### 主题系统现状
- 仅 Dark 模式，CSS 变量在 `index.css` 的 `:root` 中定义
- 无 `.light` 或 `.dark` 类切换逻辑
- 无 `prefers-color-scheme` 媒体查询
- LandingPage 使用 xyz-section-light 类实现局部浅色区域

---

## 团队架构（6 个 Working Agent）

```
team-lead (协调者/你自己)
├── architect          — 架构师：全局设计 + 技术方案 + 任务拆分
├── backend-core       — 核心后端：配置系统、定时任务、安全加固、监控
├── backend-payment    — 支付后端：支付网关、账单、退款、订阅自动化
├── frontend           — 前端全栈：主题系统、支付UI、联系我们、套餐展示
├── qa                 — 测试工程师：单元测试、集成测试、CI 自动化
└── reviewer           — 审查员：代码审查、构建部署、端到端验证
```

---

## 岗位说明（HRBP 视角）

### 1. architect — 产品架构师
**职责范围**：
- 调研微信支付 / 支付宝 Native 支付 API
- 调研行业成熟产品（Stripe Billing、Paddle）的订阅计费最佳实践
- 设计整体技术架构：支付抽象层、配置系统、主题架构、定时任务框架
- 输出详细技术规范文档，拆分为可执行的 coding 任务
- **只设计不写代码**

**核心能力**：系统架构设计、支付领域知识、API 设计
**KPI**：产出完整且可执行的架构文档，其他 agent 无需回来确认即可直接编码
**交付物**：`/tmp/upgrade-architecture.md`

### 2. backend-core — 核心后端工程师
**职责范围**：
- 配置系统重构（Plan 默认数据改为 GLOW/STAR/SOLAR/GALAXY，去除所有硬编码）
- 数据库 migration（Plan 字段扩展、Option 表新增配置项）
- 定时任务框架（robfig/cron，订阅过期检查、自动续费）
- 安全加固（密码策略、CSRF token、环境变量化敏感配置）
- Prometheus metrics 端点
- "联系我们" 后端（留言存储 API）

**核心能力**：Go + Gin + GORM 开发、系统安全、基础设施
**KPI**：所有改动通过编译，无安全漏洞，配置系统零硬编码
**交付物**：修改后的 Go 代码

### 3. backend-payment — 支付后端工程师
**职责范围**：
- 支付网关抽象层设计与实现
- 微信支付 Native 支付（扫码支付）集成
- 支付宝当面付（扫码支付）集成
- 支付回调/webhook 处理
- 升级时按天比例退款 + 收取差额逻辑
- 订单状态机完善（超时取消、退款流程）

**核心能力**：支付系统开发、Go 开发、金融安全
**KPI**：支付流程端到端可用，金额计算精确，回调验签正确
**交付物**：payment/ 目录下的完整支付模块

### 4. frontend — 前端全栈工程师
**职责范围**：
- Light/Dark/Auto 主题系统（CSS 变量 + Tailwind + localStorage + system preference）
- 主题切换组件（Header 中的 Sun/Moon/Monitor 图标切换器）
- 支付页面 UI（QR 码展示、支付状态轮询、支付结果页）
- 联系我们页面（联系表单 + 微信客服二维码 + 邮箱）
- LandingPage 套餐数据改为从 API 获取（去除硬编码）
- PricingPage 优化（支持升级/降级按钮、价格差额展示）

**核心能力**：React 18 + TailwindCSS + Shadcn/ui、CSS 主题系统
**KPI**：三种主题模式切换流畅，支付 UI 用户体验良好
**交付物**：修改后的前端代码

### 5. qa — 测试工程师
**职责范围**：
- Go 后端单元测试（目标：核心业务逻辑 80%+ 覆盖率）
- 重点测试模块：plan、subscription、order、payment、cron
- React 前端组件测试（关键组件）
- API 集成测试（httptest）
- 测试自动化框架（Makefile target / GitHub Actions）
- 集成测试报告生成

**核心能力**：Go testing + testify、Jest + RTL、CI/CD
**KPI**：Go 核心模块单测覆盖率 ≥ 60%，所有 API 端点有集成测试
**交付物**：测试代码 + CI 配置 + 测试报告

### 6. reviewer — 代码审查 & 部署工程师
**职责范围**：
- 审查所有 agent 的代码变更（安全、质量、一致性）
- 检查是否有遗漏的硬编码、安全问题
- 构建验证（前端 build + Go build）
- 部署到测试服务器 172.30.14.10
- Playwright 截图验证所有页面
- 输出最终审查报告

**核心能力**：代码审查、安全审计、部署运维
**KPI**：上线后零 P0 bug
**交付物**：审查报告 + 部署完成

---

## 执行流程（5 个 Phase）

### Phase 1: 架构设计（architect 单独执行）
**时机**：团队启动后立即开始
**任务**：
1. 调研微信支付 Native 支付 API 和支付宝当面付 API
2. 调研 Stripe Billing / Paddle 等成熟产品的订阅计费架构
3. 设计支付抽象层接口（Provider pattern）
4. 设计按天比例退款算法
5. 设计主题系统 CSS 架构
6. 设计配置系统（Plan seed data 从配置文件读取）
7. 设计定时任务框架
8. 将所有设计拆分为具体 coding 任务，分配给各 agent
**产出**：`/tmp/upgrade-architecture.md`
**依赖**：无

### Phase 2: 基础设施 + 支付后端（backend-core + backend-payment 并行）
**时机**：Phase 1 完成后
**任务 — backend-core**：
- 配置系统重构（Plan seed + Option 表配置化）
- 定时任务框架 + 订阅过期检查 cron
- 安全加固（密码策略、CSRF）
- Prometheus metrics
- 联系我们 API

**任务 — backend-payment**：
- 支付网关抽象层
- 微信支付 Native 支付集成
- 支付宝当面付集成
- 支付回调处理
- 升级退款逻辑
- 订单超时取消

**依赖**：Phase 1（架构文档）

### Phase 3: 前端开发（frontend，依赖 Phase 2 的 API）
**时机**：Phase 2 启动后可部分并行（主题系统不依赖后端，支付 UI 依赖）
**任务**：
- Light/Dark/Auto 主题系统 + 切换组件
- LandingPage 套餐改为 API 驱动
- 支付页面 UI（QR 码、轮询、结果）
- 联系我们页面
- PricingPage 升级/降级流程 UI

**依赖**：主题系统无依赖可先行，支付 UI 依赖 Phase 2

### Phase 4: 测试（qa，依赖 Phase 2+3 完成）
**时机**：Phase 2 和 Phase 3 基本完成后
**任务**：
- 为所有新增 Go 代码编写单元测试
- 为核心 API 编写集成测试
- 前端关键组件测试
- 设置 CI 流水线
- 生成测试覆盖率报告

**依赖**：Phase 2 + Phase 3

### Phase 5: 审查与部署（reviewer，依赖 Phase 4）
**时机**：所有开发和测试完成后
**任务**：
- 代码审查（安全、质量、一致性）
- 前端 build + Go build
- 部署到 172.30.14.10
- Playwright 全页面截图验证
- 输出审查报告

**依赖**：Phase 4

---

## 协作机制

### 沟通协议
- Agent 之间通过 **SendMessage** 沟通
- 重要决策由 **team-lead** 仲裁
- 每个 agent 完成一个 Task 后必须 SendMessage 汇报

### 冲突解决
- 文件修改冲突：backend-core 和 backend-payment 在修改相近文件时，backend-core 优先（基础设施先行）
- 设计分歧：以 architect 的架构文档为准
- 所有 agent 使用 **worktree 隔离** 避免直接冲突

### 自治原则
- 团队内部自行讨论解决所有问题，**不找用户确认**
- 对于外部依赖（如支付商户号），使用环境变量占位 + 完整的 mock/sandbox 实现
- 对于设计权衡，architect 有最终决定权

---

## 风险管理

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 微信/支付宝需要真实商户号 | 无法做真实支付测试 | 代码中使用 sandbox 模式，支持 mock provider 方便测试 |
| 主题切换破坏现有 UI | 用户体验倒退 | Dark 模式作为 fallback，Light 模式增量添加 |
| 支付金额计算错误 | 资金损失 | 所有金额使用 int64 分（cents）计算，单测覆盖所有边界 |
| 测试覆盖率目标过高 | 时间不够 | 优先覆盖核心路径（支付、订阅、计费），非核心模块 40% 即可 |

---

## 验收标准

### 功能验收
- [ ] 主题：Auto/Light/Dark 三种模式正常切换，刷新后保持选择
- [ ] 套餐：InitDefaultPlans 创建 GLOW/STAR/SOLAR/GALAXY，LandingPage 从 API 读取
- [ ] 支付：微信支付和支付宝扫码支付流程可用（sandbox 模式）
- [ ] 退款：升级套餐时正确计算按天比例退款
- [ ] 定时任务：过期订阅自动处理，到期前通知
- [ ] 联系我们：表单提交和微信客服二维码展示
- [ ] 测试：Go 核心模块覆盖率 ≥ 60%，所有 API 有集成测试

### 质量验收
- [ ] 零编译错误（Go + React）
- [ ] 零 P0 安全问题
- [ ] 所有页面在 Light 和 Dark 模式下可用
- [ ] 所有测试通过

---

## 快速启动命令

```
创建团队：
  TeamCreate: team_name="product-upgrade"

Phase 1 — 启动架构师：
  Agent: name="architect", subagent_type="general-purpose", team_name="product-upgrade"
    prompt: 参考 .claude/agents/upgrade-architect.md 执行架构设计

Phase 2 — 启动两个后端（等 Phase 1 完成，并行启动）：
  Agent: name="backend-core", subagent_type="general-purpose", team_name="product-upgrade", isolation="worktree"
    prompt: 参考 .claude/agents/upgrade-backend-core.md 执行核心后端开发
  Agent: name="backend-payment", subagent_type="general-purpose", team_name="product-upgrade", isolation="worktree"
    prompt: 参考 .claude/agents/upgrade-backend-payment.md 执行支付后端开发

Phase 3 — 启动前端（可与 Phase 2 部分并行）：
  Agent: name="frontend", subagent_type="general-purpose", team_name="product-upgrade", isolation="worktree"
    prompt: 参考 .claude/agents/upgrade-frontend.md 执行前端开发

Phase 4 — 启动测试（等 Phase 2+3 完成）：
  Agent: name="qa", subagent_type="general-purpose", team_name="product-upgrade", isolation="worktree"
    prompt: 参考 .claude/agents/upgrade-qa.md 执行测试开发

Phase 5 — 启动审查（等 Phase 4 完成）：
  Agent: name="reviewer", subagent_type="general-purpose", team_name="product-upgrade"
    prompt: 参考 .claude/agents/upgrade-reviewer.md 执行审查和部署
```

---

## 技术栈参考

| 领域 | 技术 |
|------|------|
| 支付 Go SDK | `github.com/go-pay/gopay` (支持微信+支付宝) |
| 定时任务 | `github.com/robfig/cron/v3` |
| 二维码生成 | `github.com/skip2/go-qrcode` |
| Prometheus | `github.com/prometheus/client_golang` |
| CSRF | `github.com/gin-contrib/csrf` 或自定义中间件 |
| 前端测试 | Jest + React Testing Library |
| Go 测试 | testing + testify + httptest |
| CI | GitHub Actions 或 Makefile |

## 关键文件索引

| 文件 | 用途 |
|------|------|
| `model/plan.go` | Plan 模型 + InitDefaultPlans() |
| `model/order.go` | Order 模型 + 状态机 |
| `model/subscription.go` | Subscription 模型 |
| `controller/subscription.go` | 订阅 CRUD + 升级降级 |
| `router/api-router.go` | 所有 API 路由注册 |
| `web/default/src/index.css` | CSS 变量定义（主题） |
| `web/default/tailwind.config.js` | Tailwind 配置 |
| `web/default/src/pages/marketing/LandingPage.jsx` | 首页（套餐硬编码） |
| `web/default/src/pages/marketing/PricingPage.jsx` | 定价页（从API读取） |
| `web/default/src/components/navigation/MarketingFooter.jsx` | 页脚 |
| `web/default/src/helpers/semantic-shim.js` | semantic-ui 兼容层 |
