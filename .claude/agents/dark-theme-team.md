# Dark Theme Visibility Fix — Agents Team 设计方案

## 问题背景

项目切换为暗黑色主题后，大量页面存在文字可见性差的问题：
- 硬编码的浅色文字颜色（#666, #333）在深色背景上几乎不可见
- `--muted-foreground` 对比度不足（55% lightness on #090e1a 背景）
- Legacy semantic-ui shim 页面没有暗色主题适配
- 部分页面混用 bg-white / text-black 等浅色类名

项目共 51 个路由：24 个 shadcn/ui 页面 + 18 个 semantic-ui shim 页面 + 其他。

---

## 团队架构（6 个 Agent）

```
team-lead (你自己)
├── scout-public      — 公开页面视觉审计（marketing, docs, auth）
├── scout-console     — 控制台页面视觉审计（console, admin，需登录）
├── designer          — 色彩规范设计师（只设计不写代码）
├── fixer-global      — 全局样式修复（CSS/Tailwind/shim 层）
├── fixer-component   — 组件级修复（逐页面修改 JSX/className）
└── verifier          — QA 验证（对比修复前后截图）
```

---

## 执行流程（4 个 Phase）

### Phase 1: 视觉审计（scout-public + scout-console 并行）
- **并行执行**
- scout-public: 截图 16 个公开页面，审计问题
- scout-console: 登录后截图 23 个控制台/管理页面，审计问题
- **产出**: `/tmp/audit-public-report.md` + `/tmp/audit-console-report.md`

### Phase 2: 色彩规范设计（designer，依赖 Phase 1 完成）
- 分析两份审计报告
- 设计统一的色彩修复规范
- 拆分为可执行的 coding 任务
- **产出**: `/tmp/dark-theme-fix-spec.md`

### Phase 3: 实现修复（fixer-global + fixer-component，部分并行）
- fixer-global 先行：修改全局 CSS 变量 + shim 层（影响面广的先改）
- fixer-component 紧随：逐页面修复组件级问题
- 两者可以部分并行（fixer-component 可以先修不依赖全局变量的页面）
- **产出**: 修改后的代码

### Phase 4: 验证（verifier，依赖 Phase 3 完成）
- 构建并部署到测试服务器
- 重新截图所有页面
- 逐页面对比修复前后效果
- 检查回归问题
- **产出**: `/tmp/dark-theme-verify-report.md`

---

## 快速启动命令

```
创建团队：
  TeamCreate: team_name="dark-theme-fix"

Phase 1 — 启动两个 scout（并行）：
  Agent: name="scout-public", subagent_type="general-purpose", team_name="dark-theme-fix"
    prompt: 参考 .claude/agents/scout-public.md 执行视觉审计
  Agent: name="scout-console", subagent_type="general-purpose", team_name="dark-theme-fix"
    prompt: 参考 .claude/agents/scout-console.md 执行视觉审计

Phase 2 — 启动 designer（等 Phase 1 完成）：
  Agent: name="designer", subagent_type="general-purpose", team_name="dark-theme-fix"
    prompt: 参考 .claude/agents/designer.md 设计修复规范

Phase 3 — 启动两个 fixer（等 Phase 2 完成）：
  Agent: name="fixer-global", subagent_type="general-purpose", team_name="dark-theme-fix"
    prompt: 参考 .claude/agents/fixer-global.md 修复全局样式
  Agent: name="fixer-component", subagent_type="general-purpose", team_name="dark-theme-fix"
    prompt: 参考 .claude/agents/fixer-component.md 修复组件样式

Phase 4 — 启动 verifier（等 Phase 3 完成）：
  Agent: name="verifier", subagent_type="general-purpose", team_name="dark-theme-fix"
    prompt: 参考 .claude/agents/verifier.md 验证修复效果
```

---

## Agent Prompt 文件

| Agent | Prompt 文件 | 权限 |
|-------|------------|------|
| scout-public | `.claude/agents/scout-public.md` | 只读 + Playwright |
| scout-console | `.claude/agents/scout-console.md` | 只读 + Playwright |
| designer | `.claude/agents/designer.md` | 只读（不修改代码） |
| fixer-global | `.claude/agents/fixer-global.md` | 读写（全局样式文件） |
| fixer-component | `.claude/agents/fixer-component.md` | 读写（页面组件文件） |
| verifier | `.claude/agents/verifier.md` | 只读 + Playwright + 构建部署 |

---

## 关键技术信息

- **HashRouter**: URL 格式为 `http://172.30.14.10:3000/#/path`
- **Playwright**: 已安装在 `/tmp/node_modules/playwright`，需要先滚动触发 `whileInView` 动画
- **管理员账号**: root / 123456
- **测试服务器**: 172.30.14.10:3000（SSH: mengsz@172.30.14.10）
- **构建**: `cd web/default && npm install --legacy-peer-deps && npx react-scripts build`
- **部署**: `cp -r web/default/build/* web/build/default/ && go build -o one-api-server`
