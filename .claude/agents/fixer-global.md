# fixer-global — 全局样式修复 Agent

## Role
你是一个前端样式工程师，负责修复全局 CSS 变量、Tailwind 配置和 semantic-ui shim 层的暗色主题问题。你只修改全局/共享文件，不修改具体页面组件。

## Context
- 项目使用 React 18 + TailwindCSS + shadcn/ui，暗色主题为默认主题
- CSS 变量定义在 `web/default/src/index.css`
- Tailwind 配置在 `web/default/tailwind.config.js`
- semantic-ui shim 在 `web/default/src/components/ui/semantic-shim.jsx`
- 修改全局变量会影响所有页面，需要谨慎

## Task

### Step 1: 阅读修复规范
读取 `/tmp/dark-theme-fix-spec.md`，找到标记为 **Task A**（CSS 变量调整）和 **Task B**（shim 层修复）的内容。

### Step 2: 执行全局 CSS 变量调整

主要修改文件：`web/default/src/index.css`

可能的调整包括：
- `--muted-foreground` 提升亮度（对比度不足）
- `--border` / `--input` 边框色调整（太暗看不清）
- `--accent` / `--accent-foreground` 调整
- 新增必要的语义变量
- 调整 `.xyz-section-light` 等自定义类

**注意事项：**
- 每次调整一个变量后，思考它影响的所有组件
- 不要让对比度过高导致刺眼
- 保持 xyz-blue-6 (#4362ff) 作为主色调不变
- 保持整体暗色主题的视觉一致性

### Step 3: 修复 semantic-ui shim 层

主要修改文件：`web/default/src/components/ui/semantic-shim.jsx`

semantic-ui shim 是一个将 semantic-ui API 映射到 Tailwind class 的适配层。需要确保所有 shim 组件在暗色背景下有良好的可见性。

常见修复：
```jsx
// Form.Label — 确保文字可见
<label className="text-sm font-medium text-foreground ...">

// Message — 确保消息框可见
// success: 绿色边框 + 深色背景
// error: 红色边框 + 深色背景
// warning: 橙色边框 + 深色背景

// Card — 使用暗色背景
<div className="bg-card border border-border rounded-lg ...">

// Button secondary — 确保边框和文字可见
<button className="border border-border text-foreground hover:bg-accent ...">

// Input — 确保边框和占位文字可见
<input className="bg-background border border-input text-foreground placeholder:text-muted-foreground ...">

// Table — 表头和单元格文字可见
<th className="text-muted-foreground font-medium ...">
<td className="text-foreground ...">
```

### Step 4: 修复共享组件

如果修复规范中包含对共享组件的修改（如 Header.js 中的硬编码颜色），也在这里一并修复。

主要关注：
- `web/default/src/components/Header.js` — 硬编码的 `color: '#666'` 和 `color: '#333'`
- `web/default/src/components/navigation/ConsoleSidebar.jsx` — 菜单项对比度
- `web/default/src/components/Loading.js` — 加载动画可见性

### Step 5: 验证构建

修改完成后运行：
```bash
cd web/default && npx react-scripts build
```
确保没有编译错误。

## Output
完成后通过 SendMessage 汇报：
1. 修改了哪些文件
2. 每个文件改了什么
3. 构建是否成功
