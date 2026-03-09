# 技术栈

**分析日期：** 2026-03-09

## 编程语言

**主要语言：**
- JavaScript (ES2020+) - 所有源代码
- Node.js (>=16.0.0) - MCP 服务器运行时

**次要语言：**
- JSON - 配置文件
- HTML - 浏览器扩展弹出界面

## 运行时环境

**运行环境：**
- Node.js >=16.0.0（在 `opendia-mcp/package.json` 中指定）
- Chrome 扩展 Manifest V3 / Firefox Manifest V2

**包管理器：**
- npm（两个模块都有 lockfile）
- `opendia-mcp/package-lock.json`
- `opendia-extension/package-lock.json`

## 框架

**核心（MCP 服务器）：**
- Express.js ^4.21.2 - HTTP 服务器和 SSE 传输
- WebSocket (ws) ^8.18.0 - WebSocket 服务器，用于浏览器扩展通信
- CORS ^2.8.5 - 跨域请求处理

**浏览器扩展：**
- WebExtension API（Chrome 使用 Manifest V3，Firefox 使用 V2）
- webextension-polyfill ^0.12.0 - 跨浏览器兼容层

**构建/开发：**
- 自定义 Node.js 构建脚本 (`opendia-extension/build.js`)
- web-ext ^8.8.0 - Firefox 扩展打包和测试
- fs-extra ^11.3.0 - 增强的文件系统操作

## 关键依赖

**MCP 服务器 (`opendia-mcp/`)：**
| 包名 | 版本 | 用途 |
|---------|---------|---------|
| express | ^4.21.2 | HTTP 服务器、SSE 端点、健康检查 |
| ws | ^8.18.0 | 浏览器扩展 WebSocket 服务器 |
| cors | ^2.8.5 | SSE 端点的 CORS 中间件 |

**浏览器扩展 (`opendia-extension/`)：**
| 包名 | 版本 | 用途 |
|---------|---------|---------|
| webextension-polyfill | ^0.12.0 | 跨浏览器 API 兼容性 |

**开发依赖：**
| 包名 | 版本 | 用途 |
|---------|---------|---------|
| web-ext | ^8.8.0 | Firefox 扩展构建/测试工具 |
| fs-extra | ^11.3.0 | 构建脚本文件操作 |

## 配置

**环境变量（MCP 服务器）：**
- `PORT` - HTTP 服务器端口（默认：3000）
- `HEALTH_PORT` - 健康检查端口（默认：3001）
- `NODE_ENV` - 环境模式（development/production）

**CLI 参数（MCP 服务器）：**
- `--tunnel` / `--auto-tunnel` - 启用 ngrok 隧道
- `--sse-only` - 禁用 STDIO，仅使用 SSE
- `--ws-port=N` - WebSocket 端口（默认：5555）
- `--http-port=N` - HTTP 端口（默认：5556）
- `--port=N` - 同时设置两个端口（N 和 N+1）

**构建配置：**
- `opendia-extension/build.js` - 自定义构建编排
- `manifest-chrome.json` - Chrome MV3 清单
- `manifest-firefox.json` - Firefox MV2 清单

## 平台要求

**开发环境：**
- Node.js >=16.0.0
- npm 或兼容的包管理器
- ngrok（可选，用于隧道功能）- 需要全局安装
- Chrome 或 Firefox 浏览器用于测试

**生产环境：**
- Node.js 运行时用于 MCP 服务器
- Chrome (MV3) 或 Firefox (MV2) 用于扩展
- WebSocket 通信需要本地网络访问
- （可选）ngrok 用于外部 AI 服务访问

## 架构说明

**MCP 协议：**
- 实现模型上下文协议（MCP）JSON-RPC 2.0
- 支持多种传输：STDIO、WebSocket、HTTP/SSE
- 工具定义从浏览器扩展动态注册

**浏览器扩展架构：**
- 内容脚本注入到所有页面 (`<all_urls>`)
- 后台 Service Worker (Chrome) / 后台页面 (Firefox)
- WebSocket 客户端连接到本地 MCP 服务器
- 基于模式的 DOM 交互，具有反检测功能

---

*技术栈分析：2026-03-09*
