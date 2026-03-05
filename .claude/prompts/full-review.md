# One-API 全面评审与重构

## 项目背景

这是一个 AI API 管理平台（One-API），前后端一体化架构：
- **前端**：3 套 React 主题（default 使用 Tailwind+Radix UI，berry 使用 MUI，air 使用 Semantic+Semi UI），当前主力主题为 `default`
- **后端**：Go + Gin 框架，GORM ORM，支持 SQLite/MySQL/PostgreSQL
- **核心功能**：40+ AI 模型适配、OpenAI/Anthropic 兼容 API 中继、用户/订阅/计费管理

## 构建与测试命令参考

```bash
# 后端构建
go build -trimpath -ldflags "-s -w" -o one-api

# 后端单测
go test -cover -coverprofile=coverage.txt ./...

# 前端构建（default 主题）
cd web/default && npm install && npm run build

# 前端全主题构建
cd web && bash build.sh

# 前端 lint（各主题目录下）
cd web/default && npx eslint src/
cd web/berry && npx eslint src/
cd web/air && npx eslint src/
```

## 任务

组建一个 agents team，对本项目进行**全面评审并直接实施重构**。每个 agent 负责一个专项领域，工作流程为：评审 → 修改代码 → 补充测试 → 验证构建。最终由 team lead 统一验证全量构建和测试。

## 工作流程（三阶段）

### 第一阶段：评审与分析
每个 agent 深入阅读负责领域的源代码，产出评审报告到 `/docs/review/` 目录。报告中标注每个问题的严重程度和具体文件位置。

### 第二阶段：代码重构
各 agent 根据评审报告，按优先级从高到低实施代码修改：
- **每次修改遵循最小变更原则**，一个 commit 解决一个问题
- 修改后立即在本地验证：后端跑 `go build ./...` 确认编译通过，前端跑 `npm run build` 确认构建通过
- 对修改的核心逻辑补充或更新单元测试
- 保持 API 接口向后兼容，如有 breaking change 必须在报告中明确标注

### 第三阶段：全量验证
Team lead 在所有 agent 完成后执行完整验证流程：
1. **后端编译**：`go build -trimpath -ldflags "-s -w" -o one-api`
2. **后端单测**：`go test -cover ./...`，确保全部通过，记录覆盖率
3. **前端构建**：三套主题全部 `npm run build`，确保零 error
4. **前端 lint**：三套主题 eslint 检查
5. **集成冒烟测试**：启动服务，验证核心 API 端点可达（健康检查、用户注册/登录、模型列表）
6. 产出最终验证报告 `/docs/review/00-final-report.md`

## Team 组成与职责

### 1. UI/UX 重构员（ui-reviewer）
聚焦 `web/default/` 主题：

**评审要点：**
- 颜色体系、间距、字体、圆角等设计 token 是否统一
- Radix UI + Tailwind 的组件封装是否合理，是否有重复造轮子
- 响应式设计：移动端适配情况，断点设计是否合理
- 交互体验：加载状态、空状态、错误状态是否完整，表单校验反馈是否友好
- 可访问性（a11y）：键盘导航、ARIA 标签、颜色对比度
- 国际化：i18n 覆盖率，是否有硬编码文案

**重构动作：**
- 提取统一的设计 token（Tailwind theme config）
- 补全缺失的加载/空/错误状态组件
- 修复 a11y 问题（添加 ARIA 标签、修复键盘导航）
- 将硬编码文案迁移到 i18n 文件
- 验证：`cd web/default && npm run build` 通过

**产出：**
- 评审报告：`/docs/review/01-ui-ux-review.md`
- 直接修改 `web/default/` 下的代码

### 2. 前端架构重构员（frontend-reviewer）
覆盖 `web/default/` 主题的代码架构：

**评审要点：**
- 目录结构：组件分层是否合理（pages/components/context/helpers）
- 状态管理：Context API 使用是否恰当，是否有 prop drilling、不必要的 re-render
- 路由设计：路由组织、懒加载、权限控制、404 处理
- API 层：Axios 封装、请求/响应拦截、错误处理、重试机制
- 性能：bundle 大小、代码分割、memo/useMemo/useCallback 使用
- 代码规范：命名一致性、组件粒度、复用性

**重构动作：**
- 优化 Context 拆分，消除不必要的 re-render
- 统一 API 层封装（请求拦截、错误处理、loading 状态）
- 补充缺失的路由守卫和 404 页面
- 对性能热点组件添加 React.memo / useMemo
- 验证：`cd web/default && npm run build` 通过

**产出：**
- 评审报告：`/docs/review/02-frontend-architecture-review.md`
- 直接修改 `web/default/` 下的代码

### 3. 后端架构重构员（backend-reviewer）
覆盖 Go 后端全部代码：

**评审要点：**
- 项目结构：controller/model/router/middleware/relay 分层是否清晰
- API 设计：RESTful 规范性、URL 命名、HTTP 方法使用、分页/过滤/排序
- 错误处理：错误码体系、错误信息一致性、panic recovery
- 认证授权：JWT 实现、Token 验证、权限粒度
- 数据库层：GORM 使用方式、N+1 查询、索引设计、事务管理
- 中间件：中间件链设计、限流策略、CORS 配置
- 配置管理：环境变量、配置加载

**重构动作：**
- 统一错误码和错误响应格式
- 修复潜在的 N+1 查询和缺失索引
- 补充关键业务逻辑的事务处理
- 为缺少测试的核心 controller/model 补充单元测试（使用 testify）
- 验证：`go build ./...` 编译通过，`go test ./...` 全部通过

**产出：**
- 评审报告：`/docs/review/03-backend-architecture-review.md`
- 直接修改 Go 源代码，新增 `*_test.go` 测试文件

### 4. 业务逻辑重构员（business-reviewer）
聚焦核心业务流程：

**评审要点：**
- 模型中继（Relay）：40+ 适配器的代码组织、接口抽象、错误重试与 fallback
- 计费系统：Token 计算准确性、计费公式、并发扣费安全性（竞态条件）
- 订阅系统：订阅生命周期管理、到期处理、升降级逻辑
- 渠道管理：渠道健康检测、负载均衡、优先级调度
- 配额系统：配额分配、超额处理、Booster Pack 逻辑
- 缓存策略：Redis 和内存缓存的使用场景、一致性、失效策略

**重构动作：**
- 修复计费系统中的竞态条件（加锁或使用数据库原子操作）
- 优化渠道调度策略，增强 fallback 机制
- 统一适配器接口，减少重复代码
- 为计费、配额扣减等关键路径补充单元测试
- 验证：`go build ./...` 编译通过，`go test ./...` 全部通过

**产出：**
- 评审报告：`/docs/review/04-business-logic-review.md`
- 直接修改 Go 源代码，新增测试文件

### 5. 安全与运维重构员（security-reviewer）

**评审要点：**
- 安全漏洞：SQL 注入、XSS、CSRF、SSRF 风险排查
- 认证安全：OAuth 实现、Session 安全、JWT 密钥管理
- API 安全：速率限制、输入校验、敏感数据脱敏、日志安全
- 依赖安全：Go 和 npm 依赖的已知漏洞
- Docker 安全：Dockerfile 最佳实践、镜像安全
- 运维就绪：健康检查、优雅关闭、日志规范、监控埋点

**重构动作：**
- 修复发现的安全漏洞（输入校验、XSS 防护、SSRF 防护）
- 加强敏感数据脱敏（日志中的 API Key、Token 等）
- 优化 Dockerfile（多阶段构建、非 root 用户、最小权限）
- 为安全相关逻辑补充测试用例
- 验证：`go build ./...` 编译通过，`go test ./...` 全部通过

**产出：**
- 评审报告：`/docs/review/05-security-ops-review.md`
- 直接修改相关源代码

## 评审报告格式

每份报告统一使用以下结构：

```markdown
# [领域] 评审报告

## 评审范围
涉及的文件和目录

## 评审总结
一段话概括当前状态和整体评价（用 🟢🟡🔴 标记健康度）

## 已实施的修改

### [修改1标题]
- **严重程度**：🔴 严重 / 🟡 中等 / 🟢 建议
- **位置**：文件路径:行号
- **原始问题**：问题描述
- **修改内容**：做了什么改动
- **验证结果**：编译/测试是否通过

## 待后续处理的问题
本轮未修改但值得关注的问题（附原因说明）

## 新增/修改的测试
列出新增或修改的测试文件及覆盖的场景
```

## 最终验证报告格式（Team Lead 产出）

```markdown
# One-API 全面评审与重构 - 最终报告

## 重构概览
各领域健康度对比（重构前 vs 重构后）

## 构建验证
- 后端编译：✅/❌
- 后端单测：✅/❌（覆盖率 X%，通过 X/X）
- 前端构建（default）：✅/❌
- 前端构建（berry）：✅/❌
- 前端构建（air）：✅/❌
- 前端 lint：✅/❌

## 冒烟测试
- 服务启动：✅/❌
- GET /api/status：✅/❌
- POST /api/user/login：✅/❌
- GET /v1/models：✅/❌

## 各领域修改汇总
按领域列出所有修改，标注风险等级

## Breaking Changes
如有 API 变更，在此列出

## 后续建议
分阶段的后续改进路线图
```

## 执行要求

1. 每个 agent 必须深入阅读源代码，每个发现引用具体的文件路径和代码行
2. 修改代码遵循最小变更原则，保持向后兼容
3. 每次修改后立即验证编译/构建通过
4. 核心逻辑修改必须有对应的单元测试
5. 前端修改只聚焦 `default` 主题，不动 `berry` 和 `air`（但最终需确认这两个主题构建不受影响）
6. 所有 agent 完成后，team lead 执行第三阶段全量验证并产出最终报告
