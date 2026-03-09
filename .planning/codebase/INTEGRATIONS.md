# 外部集成

**分析日期：** 2026-03-09

## API 与外部服务

**隧道服务：**
- **ngrok** - 用于在线 AI 服务访问的外部隧道
  - 用法：通过 `--tunnel` 标志可选创建隧道
  - 命令： `ngrok http <port> --log stdout`
  - 输出：SSE 端点的公共 HTTPS URL
  - 要求：ngrok 必须全局安装在系统上
  - 实现： `opendia-mcp/src/transports/tunnel.js`

**浏览器 API：**
- **WebExtension API** - 跨浏览器扩展平台
  - Chrome：使用 Service Worker 的 Manifest V3
  - Firefox：使用后台页面的 Manifest V2
  - Polyfill：webextension-polyfill 用于 API 标准化

## 数据存储

**数据库：**
- 无 - 无持久化数据库集成

**浏览器存储：**
- **chrome.storage.local** / **browser.storage.local**
  - 用法：安全模式状态持久化
  - 键： `safetyMode` (布尔值)
  - 实现： `opendia-extension/src/background/background.js`

**文件存储：**
- 仅本地文件系统（Node.js fs 模块）
- 构建输出到 `dist/` 目录
- 无云存储集成

**缓存：**
- 仅内存缓存
- 端口配置缓存 (`lastKnownPorts`)
- 待处理 MCP 调用 Map (`pendingCalls`)

## 认证与身份

**认证提供者：**
- 无 - 无认证系统
- 浏览器扩展权限授予访问权限
- 仅本地通信（本地主机 WebSocket/HTTP）

**权限模型：**
- 浏览器扩展请求广泛权限：
  - `tabs`, `activeTab`, `storage`
  - `scripting`, `webNavigation`
  - `notifications`, `bookmarks`, `history`
  - `host_permissions: ["<all_urls>"]`

## 监控与可观测性

**错误追踪：**
- 无 - 无外部错误追踪服务
- 服务器使用控制台日志输出到 stderr
- 扩展使用浏览器控制台进行调试

**日志：**
- 服务器： `console.error()` 用于操作日志
- 扩展： `console.log()` / `console.error()`
- 无结构化日志或日志聚合

**健康检查：**
- HTTP 端点： `GET /health`
- 返回：状态、连接状态、可用工具、端口
- 端口发现： `GET /ports` 用于扩展自动配置

## CI/CD 与部署

**托管：**
- MCP 服务器：本地/自托管（Node.js 进程）
- 扩展：浏览器扩展商店（手动提交）
- 无自动化部署管道

**CI 管道：**
- 未检测到

**分发：**
- npm 注册表： `@lionad/opendia` 包
- GitHub Releases：扩展包
- 构建脚本： `npm run package:chrome` / `npm run package:firefox`

## 环境配置

**必需的环境变量：**
- `PORT` - HTTP 服务器端口（默认：3000）
- `HEALTH_PORT` - 健康检查端口（默认：3001）
- `NODE_ENV` - 环境模式

**密钥位置：**
- `.env` 文件（示例在 `.env.example`）
- 配置中未检测到敏感密钥

**默认端口：**
- WebSocket：5555（可通过 `--ws-port` 配置）
- HTTP：5556（可通过 `--http-port` 配置）
- 如果端口被占用则自动递增

## Webhook 与回调

**入站：**
- 无 - 无入站 webhook

**出站：**
- 无 - 无出站 webhook

**内部通信：**
- WebSocket：浏览器扩展 <-> MCP 服务器
- 协议：WebSocket 上的自定义 JSON 消息
- SSE：在线 AI 服务 <-> MCP 服务器（出站）
- STDIO：Claude Desktop <-> MCP 服务器（本地）

## 网络架构

**本地通信：**
```
Claude Desktop <--STDIO--> MCP 服务器 <--WebSocket--> 浏览器扩展
                                    <--HTTP/SSE--> 在线 AI 服务
```

**外部访问（使用 --tunnel）：**
```
在线 AI 服务 <--HTTPS/ngrok--> MCP 服务器 <--WebSocket--> 浏览器扩展
```

**端口配置：**
- WebSocket： `ws://localhost:5555` (默认)
- HTTP： `http://localhost:5556` (默认)
- SSE： `http://localhost:5556/sse`
- 健康检查： `http://localhost:5556/health`
- 端口： `http://localhost:5556/ports`

## 安全考虑

**网络安全：**
- 默认仅本地主机
- SSE 端点启用 CORS (`*` 来源)
- HTTP 端点无认证
- 扩展具有广泛的主机权限 (`<all_urls>`)

**数据流：**
- 所有浏览器数据通过本地 WebSocket 传输
- 除通过 ngrok 隧道（可选）外，无数据发送到外部服务
- 页面内容、Cookie、历史记录对扩展可访问

---

*集成审计：2026-03-09*
