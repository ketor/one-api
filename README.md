<p align="center">
  <a href="https://github.com/ketor/one-api"><img src="https://raw.githubusercontent.com/songquanpeng/one-api/main/web/default/public/logo.png" width="150" height="150" alt="Alaya Code logo"></a>
</p>

<div align="center">

# Alaya Code

_基于 [One API](https://github.com/songquanpeng/one-api) 构建的 AI 编程助手订阅平台_

</div>

<p align="center">
  <a href="#功能特性">功能特性</a>
  ·
  <a href="#快速开始">快速开始</a>
  ·
  <a href="#部署指南">部署指南</a>
  ·
  <a href="#项目结构">项目结构</a>
  ·
  <a href="#环境变量">环境变量</a>
  ·
  <a href="#常见问题">常见问题</a>
</p>

> [!WARNING]
> 使用 root 用户初次登录系统后，务必修改默认密码 `123456`！

## 简介

Alaya Code 是一个面向开发者的 AI 编程助手订阅平台，基于 [One API](https://github.com/songquanpeng/one-api) 二次开发。通过标准的 OpenAI API 格式，提供对多种大模型的统一访问，同时增加了订阅计费、滚动窗口限额、加油包等商业化能力。

前端采用 React 18 + TailwindCSS + Shadcn/ui 构建现代化界面，后端基于 Go 1.20 + Gin + GORM。

## 功能特性

### 订阅计费系统（新增）
- **套餐管理**：支持创建多种订阅套餐（如 Lite / Pro），设置不同的价格和额度
- **5 小时滚动窗口限额**：基于 Redis 的实时额度控制，防止短时间内超额使用
- **加油包**：用户可购买额外额度包，叠加到当前窗口限额上
- **订单系统**：完整的订单创建、支付状态跟踪
- **账单记录**：用户可查看历史消费明细

### 多模型支持（继承自 One API）
- [OpenAI ChatGPT 系列](https://platform.openai.com/docs/guides/gpt/chat-completions-api)（支持 Azure OpenAI API）
- [Anthropic Claude 系列](https://anthropic.com)（支持 AWS Claude）
- [Google Gemini 系列](https://developers.generativeai.google)（支持 OpenAI 兼容模式）
- [DeepSeek](https://www.deepseek.com/)
- [字节跳动豆包大模型](https://www.volcengine.com/experience/ark)
- [阿里通义千问系列](https://help.aliyun.com/document_detail/2400395.html)
- [智谱 ChatGLM 系列](https://bigmodel.cn)
- [Mistral 系列](https://mistral.ai/)
- [Moonshot AI](https://platform.moonshot.cn/)
- [百度文心一言](https://cloud.baidu.com/doc/WENXINWORKSHOP/index.html)、[讯飞星火](https://www.xfyun.cn/doc/spark/Web.html)、[百川](https://platform.baichuan-ai.com)、[MINIMAX](https://api.minimax.chat/)、[Groq](https://wow.groq.com/)、[Ollama](https://github.com/ollama/ollama)、[Cohere](https://cohere.com/)、[xAI](https://x.ai/) 等 30+ 模型提供商

### 平台能力
- **渠道管理**：多渠道负载均衡，自动故障转移和重试
- **令牌管理**：设置过期时间、额度上限、IP 白名单、模型范围
- **用户分组**：支持用户分组与渠道分组，设置不同倍率
- **兑换码系统**：批量生成兑换码，用户自助充值
- **用量统计**：按天 / 按模型的详细用量和配额消耗图表
- **Stream 模式**：完整支持流式传输
- **多机部署**：支持主从架构，Redis 缓存

### 前端界面
- **现代化 UI**：TailwindCSS + Shadcn/ui 组件库，全中文界面
- **营销页面**：产品落地页、定价页
- **文档中心**：API 文档、SDK 指南、工具对接教程、错误码、FAQ
- **控制台**：数据看板、API 密钥管理、订阅管理、用量统计、账单、加油包、个人设置
- **管理后台**：用户管理、渠道管理、兑换码管理、日志、系统设置（与控制台统一侧边栏）
- **兼容层**：`semantic-shim.js` 桥接旧 Semantic UI 页面到 Tailwind 样式

## 快速开始

### 前置条件
- Go 1.20+
- Node.js 18+
- Redis（订阅窗口计数依赖）
- MySQL 或 SQLite

### 本地开发

```bash
# 克隆仓库
git clone git@github.com:ketor/one-api.git
cd one-api

# 构建前端
cd web/default
npm install
npm run build

# 构建后端（会嵌入前端静态文件）
cd ../..
go mod download
go build -ldflags "-s -w" -o one-api-server

# 运行（默认使用 SQLite）
./one-api-server --port 3000
```

访问 http://localhost:3000 ，初始账号 `root` / `123456`。

### 前端开发模式

```bash
cd web/default
npm start
# 前端开发服务器启动在 http://localhost:3001
# API 请求会代理到 http://localhost:3000
```

前端使用 [CRACO](https://github.com/dilanx/craco) 集成 PostCSS + TailwindCSS，配置文件：
- `web/default/craco.config.js` - CRACO 配置
- `web/default/tailwind.config.js` - Tailwind 配置

## 部署指南

### Docker Compose（推荐）

```bash
# 包含 MySQL + Redis，一键启动
docker-compose up -d
```

`docker-compose.yml` 包含三个服务：
- **one-api**：主应用，端口 3000
- **db**：MySQL 8.0，数据持久化到 `./data/mysql`
- **redis**：Redis 7，用于订阅窗口计数和缓存

### Docker 单独部署

```bash
# SQLite 模式
docker run --name one-api -d --restart always \
  -p 3000:3000 \
  -e TZ=Asia/Shanghai \
  -v /home/ubuntu/data/one-api:/data \
  justsong/one-api

# MySQL + Redis 模式
docker run --name one-api -d --restart always \
  -p 3000:3000 \
  -e SQL_DSN="root:123456@tcp(localhost:3306)/oneapi" \
  -e REDIS_CONN_STRING="redis://localhost:6379" \
  -e TZ=Asia/Shanghai \
  -v /home/ubuntu/data/one-api:/data \
  justsong/one-api
```

### Nginx 配置参考

```nginx
server {
   server_name your-domain.com;
   location / {
      client_max_body_size  64m;
      proxy_http_version 1.1;
      proxy_pass http://localhost:3000;
      proxy_set_header Host $host;
      proxy_set_header X-Forwarded-For $remote_addr;
      proxy_cache_bypass $http_upgrade;
      proxy_set_header Accept-Encoding gzip;
      proxy_read_timeout 300s;
   }
}
```

### 多机部署
1. 所有服务器 `SESSION_SECRET` 设置相同值
2. 必须设置 `SQL_DSN` 使用 MySQL，所有节点连接同一数据库
3. 从服务器设置 `NODE_TYPE=slave`
4. 设置 `SYNC_FREQUENCY` 定期从数据库同步配置
5. 各节点分别安装 Redis，设置 `REDIS_CONN_STRING`

## 项目结构

```
one-api/
├── common/                  # 公共工具和常量
├── controller/              # API 控制器
│   ├── subscription.go      # 订阅相关 API
│   ├── plan.go              # 套餐管理 API
│   ├── booster.go           # 加油包 API
│   ├── order.go             # 订单 API
│   ├── usage.go             # 用量统计 API
│   └── ...                  # One API 原有控制器
├── middleware/
│   ├── auth.go              # 认证中间件
│   └── subscription.go      # 订阅窗口限额中间件
├── model/
│   ├── subscription.go      # 订阅模型
│   ├── plan.go              # 套餐模型
│   ├── order.go             # 订单模型
│   ├── booster_pack.go      # 加油包模型
│   ├── usage_window.go      # 用量窗口模型
│   ├── cache_subscription.go # Redis 缓存层
│   └── ...                  # One API 原有模型
├── relay/                   # 模型请求中继
├── router/
│   ├── api.go               # API 路由定义
│   └── relay.go             # 中继路由
├── web/default/             # React 前端
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/          # Shadcn/ui 基础组件
│   │   │   ├── business/    # 业务组件（StatCard, QuotaUsageBar 等）
│   │   │   ├── layout/      # 布局组件（ConsoleLayout, AuthLayout 等）
│   │   │   └── navigation/  # 导航组件（ConsoleSidebar, ConsoleTopBar 等）
│   │   ├── pages/
│   │   │   ├── console/     # 用户控制台页面
│   │   │   ├── admin/       # 管理后台页面
│   │   │   ├── marketing/   # 营销页面（落地页、定价页）
│   │   │   ├── docs/        # 文档页面
│   │   │   └── ...          # One API 原有页面（Channel, Token 等）
│   │   ├── helpers/
│   │   │   └── semantic-shim.js  # Semantic UI → Tailwind 兼容层
│   │   └── lib/utils.js     # Tailwind 工具函数
│   ├── tailwind.config.js
│   └── craco.config.js
├── docker-compose.yml
├── Dockerfile
└── CodingPlan.md            # 产品设计文档
```

## 环境变量

> 支持从 `.env` 文件读取环境变量，参照 `.env.example`。

### 基础配置

| 变量 | 说明 | 示例 |
|------|------|------|
| `PORT` | 服务端口 | `3000` |
| `SQL_DSN` | 数据库连接（留空使用 SQLite） | `root:123456@tcp(localhost:3306)/oneapi` |
| `REDIS_CONN_STRING` | Redis 连接（订阅窗口必须） | `redis://localhost:6379` |
| `SESSION_SECRET` | 会话密钥（多机部署必须相同） | `random_string` |
| `TZ` | 时区 | `Asia/Shanghai` |

### 缓存与同步

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `MEMORY_CACHE_ENABLED` | 启用内存缓存 | `false` |
| `SYNC_FREQUENCY` | 数据库同步频率（秒） | `600` |
| `BATCH_UPDATE_ENABLED` | 批量更新聚合 | `false` |
| `BATCH_UPDATE_INTERVAL` | 批量更新间隔（秒） | `5` |

### 多机部署

| 变量 | 说明 | 示例 |
|------|------|------|
| `NODE_TYPE` | 节点类型 | `master` / `slave` |
| `FRONTEND_BASE_URL` | 从节点页面重定向地址 | `https://your-domain.com` |

### 渠道管理

| 变量 | 说明 | 示例 |
|------|------|------|
| `CHANNEL_UPDATE_FREQUENCY` | 渠道余额更新频率（分钟） | `1440` |
| `CHANNEL_TEST_FREQUENCY` | 渠道可用性检测频率（分钟） | `1440` |
| `RELAY_TIMEOUT` | 中继超时（秒） | `300` |
| `RELAY_PROXY` | 中继代理 | `http://proxy:8080` |

### 安全与限流

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `GLOBAL_API_RATE_LIMIT` | API 速率限制（3 分钟） | `180` |
| `GLOBAL_WEB_RATE_LIMIT` | Web 速率限制（3 分钟） | `60` |

完整环境变量说明请参考 `.env.example` 文件。

### 命令行参数

| 参数 | 说明 | 示例 |
|------|------|------|
| `--port` | 监听端口 | `--port 3000` |
| `--log-dir` | 日志目录 | `--log-dir ./logs` |
| `--version` | 打印版本号 | |
| `--help` | 帮助信息 | |

## API 端点

### 用户端 API

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/user/login` | 用户登录 |
| GET | `/api/user/self` | 获取当前用户信息 |
| PUT | `/api/user/self` | 更新个人信息 |
| GET | `/api/user/dashboard` | 用量看板数据 |
| GET | `/api/user/available_models` | 可用模型列表 |
| GET/POST | `/api/token/` | 令牌 CRUD |
| GET | `/api/log/self` | 个人日志 |
| GET | `/api/subscription/self` | 当前订阅详情 |
| GET | `/api/subscription/quota` | 窗口配额信息 |
| POST | `/api/user/topup` | 兑换码充值 |

### 管理端 API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET/POST | `/api/channel/` | 渠道 CRUD |
| GET/POST | `/api/user/` | 用户管理 |
| POST | `/api/user/manage` | 更新用户信息 |
| GET/POST | `/api/redemption/` | 兑换码管理 |
| GET | `/api/log/` | 全局日志 |
| GET/PUT | `/api/option/` | 系统设置 |

### 中继 API（OpenAI 兼容）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/v1/chat/completions` | 对话补全 |
| POST | `/v1/completions` | 文本补全 |
| POST | `/v1/embeddings` | 文本嵌入 |
| POST | `/v1/images/generations` | 图像生成 |
| GET | `/v1/models` | 模型列表 |

## 使用方法

1. 管理员在**渠道管理**中添加上游 API Key
2. 用户注册登录后，在**API 密钥**页面创建令牌
3. 在 IDE 或工具中配置：

```bash
# 环境变量方式
OPENAI_API_KEY="sk-xxxxxx"         # Alaya Code 生成的令牌
OPENAI_API_BASE="https://<HOST>/v1" # Alaya Code 部署地址
```

支持的工具：Cursor、Claude Code、VSCode + Cline / Continue、OpenCode 等所有兼容 OpenAI API 的工具。

## 常见问题

1. **额度怎么计算？**
   - 额度 = 分组倍率 × 模型倍率 ×（提示 token + 补全 token × 补全倍率）

2. **订阅窗口是什么？**
   - 默认 5 小时滚动窗口，在窗口时间内的总消耗不超过套餐限额 + 加油包额度。窗口期过后额度自动恢复。

3. **Redis 是必须的吗？**
   - 如果使用订阅计费功能（窗口限额），Redis 是必须的。如果只用基础的令牌 + 额度模式，可以不配置 Redis。

4. **如何从 One API 迁移？**
   - 数据库完全兼容，直接替换二进制文件即可。新增的订阅相关表会自动创建。

5. **提示无可用渠道？**
   - 检查用户分组和渠道分组设置是否匹配，以及渠道的模型列表是否包含请求的模型。

## 致谢

本项目基于 [One API](https://github.com/songquanpeng/one-api) 开源项目开发，感谢原作者 [songquanpeng](https://github.com/songquanpeng) 的贡献。

## 许可证

MIT License - 详见 [LICENSE](./LICENSE) 文件。
