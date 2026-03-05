# 前端架构评审报告

**评审范围**: `web/default/src/` 目录
**评审日期**: 2026-03-05（第二轮深度评审）
**评审人**: frontend-architect
**构建验证**: `npx react-scripts build` 通过

---

## 评审总结

| 维度 | 评分 | 说明 |
|------|------|------|
| 目录结构 | ⭐⭐⭐⭐ | 分层清晰，layout/navigation/business/ui 四层组件划分合理 |
| 状态管理 | ⭐⭐⭐ | Context+useReducer 模式正确，但缺少自定义 Hook 封装 |
| 路由设计 | ⭐⭐⭐⭐ | 懒加载全覆盖，PrivateRoute/AdminRoute 权限控制完善 |
| API 层 | ⭐⭐⭐ | 缺少请求拦截器注入 Auth Token、超时配置 |
| 性能 | ⭐⭐⭐ | 懒加载好，但 React.memo/useCallback 覆盖不足 |
| 代码规范 | ⭐⭐⭐ | 可用但有小 bug（Footer 轮询）和死代码 |

---

## 🔴 严重问题

### 1. API 层缺少请求拦截器注入 Auth Token

**文件**: `helpers/api.js`、`helpers/auth-header.js`
**问题**: `authHeader()` 函数已定义但从未被 API 实例使用。API 请求不会自动携带 Authorization header。
**修复**: ✅ 添加请求拦截器自动注入 Bearer token + 30s 超时配置。

### 2. 响应拦截器 401 处理分散

**文件**: `helpers/api.js`、`helpers/utils.js:96-113`
**问题**: 401 重定向逻辑在 `showError()` 函数内部，而不是在 API 拦截器中统一处理。拦截器调用 `showError()` 后还 `reject(error)`，调用方 `.catch()` 可能再次显示错误。
**修复**: ✅ 401 由拦截器统一处理，清理 localStorage 并跳转登录页。

---

## 🟡 高优先级问题

### 3. Footer.js 轮询 localStorage 有闭包 bug

**文件**: `components/Footer.js:9,20-21`
**问题**: `remainCheckTimes` 声明为组件函数体内的 `let` 变量，在 `setInterval` 回调闭包中捕获的始终是初始值 `5`。递减操作永远不会终止定时器。
**修复**: ✅ 改用 `useRef` 追踪剩余次数。

### 4. NotFound 页面硬编码中文

**文件**: `pages/NotFound/index.js`
**问题**: "页面不存在" 和 "请检查你的浏览器地址是否正确" 硬编码中文，未使用 i18n。
**修复**: ✅ 添加 i18n 支持。

### 5. 布局组件缺少 React.memo

**文件**: 所有 `components/layout/*.jsx`
**问题**: 布局组件在路由切换时可能不必要地重新渲染。
**修复**: ✅ MarketingLayout / ConsoleLayout / AuthLayout / DocsLayout 添加 React.memo。

### 6. 导航组件缺少 useCallback

**文件**: `components/navigation/ConsoleTopBar.jsx`、`components/navigation/ConsoleSidebar.jsx`
**问题**: `logout` 函数在每次渲染时重新创建。
**修复**: ✅ 添加 useCallback 优化。

### 7. Context Provider 全局挂载

**文件**: `index.js:17-35`
**问题**: `SubscriptionProvider`、`UsageProvider`、`BillingProvider` 在根级别加载，但仅在 Console 页面使用。
**状态**: 记录但未改（改动涉及面广，需要仔细测试）。

### 8. `helpers/history.js` 死代码

**文件**: `helpers/history.js`
**问题**: 导出 `createBrowserHistory()` 但应用使用 HashRouter。该导出通过 `helpers/index.js` 对外暴露但实际无使用。
**状态**: 记录（被 barrel export 引用，删除需确认无副作用）。

### 9. 缺少自定义 Hook 封装

**问题**: 使用方需要 `useContext(UserContext)` + 解构 `[state, dispatch]`，无封装。
**修复**: ✅ 创建 `hooks/useAuth.js` 提供简洁的认证状态访问。

---

## 🟢 中优先级问题（记录未改）

| # | 问题 | 文件 | 说明 |
|---|------|------|------|
| 10 | 文件扩展名不一致 | 全局 | .js/.jsx 混用 |
| 11 | 缺少 Error Boundary | App.js | 组件异常会白屏 |
| 12 | AdminLayout.jsx 死代码 | components/layout/ | 已定义但路由未使用 |
| 13 | `moment` 依赖可移除 | package.json | ~70KB，未被 import |
| 14 | `dangerouslySetInnerHTML` | 6处 | 需 DOMPurify 清洗 |
| 15 | 模块级可变状态 | utils.js/helper.js | channelModels/channelMap |
| 16 | AdminLayout 硬编码中文 | AdminLayout.jsx | 管理后台菜单未 i18n |

---

## 已实施的重构清单

### 第一轮（2026-03-04）
- [x] 全面懒加载：所有页面改为 `React.lazy()` 动态导入
- [x] 全局 Suspense fallback
- [x] 新增 `AdminRoute` 组件
- [x] API 拦截器正确 reject Promise
- [x] PrivateRoute 使用 `useLocation()`
- [x] 修复 semantic-shim 动态 Tailwind 类名
- [x] 移除未用导入和 console.log

### 第二轮（2026-03-05）
- [x] API 请求拦截器：自动注入 Authorization header
- [x] API 超时配置：30s 默认超时
- [x] API 401 统一处理：拦截器中清理并跳转
- [x] Footer.js 轮询 bug 修复（useRef）
- [x] NotFound 页面 i18n 支持
- [x] 布局组件 React.memo 优化
- [x] 导航组件 useCallback 优化
- [x] 创建 `hooks/useAuth.js` 自定义 Hook

---

## 后续建议（未实施）

| 优先级 | 建议 | 预估工作量 |
|--------|------|-----------|
| P1 | 将 Subscription/Usage/Billing Provider 移到 ConsoleLayout | 低 |
| P1 | 添加 React Error Boundary | 低 |
| P2 | 统一文件扩展名为 .jsx | 中 |
| P2 | 移除 `moment` + `history` 包 | 低 |
| P2 | AdminLayout 菜单 i18n 化 | 低 |
| P3 | 为 dangerouslySetInnerHTML 添加 DOMPurify | 低 |
| P3 | 将 channelModels 缓存改为 React 状态管理 | 中 |
