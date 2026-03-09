# 代码库结构

**分析日期：** 2026-03-09

## 目录布局

```
opendia/
├── opendia-mcp/                 # MCP 服务器 (Node.js)
│   ├── server.js                # 入口点 (79 行)
│   ├── package.json             # 依赖：express, ws, cors
│   ├── src/
│   │   ├── config/              # 配置管理
│   │   │   └── index.js         # 端口处理、CLI 参数
│   │   ├── handlers/            # MCP 协议处理器
│   │   │   └── mcp.js           # JSON-RPC 请求路由
│   │   ├── formatters/          # 结果格式化
│   │   │   └── index.js         # 工具输出格式化器
│   │   ├── tools/               # 工具定义
│   │   │   └── fallback.js      # 离线工具模式
│   │   ├── transports/          # 通信层
│   │   │   ├── websocket.js     # 扩展 WebSocket
│   │   │   ├── http.js          # HTTP/SSE 服务器
│   │   │   ├── stdio.js         # STDIO 传输
│   │   │   └── tunnel.js        # ngrok 隧道
│   │   └── workflows/           # 高级操作
│   │       ├── index.js         # 工作流注册表
│   │       ├── social.js        # 社交媒体工作流
│   │       ├── research.js      # 研究工作流
│   │       ├── session.js       # 标签页管理
│   │       └── form.js          # 表单助手
│   └── node_modules/
│
├── opendia-extension/           # 浏览器扩展
│   ├── manifest.json            # Chrome MV3 / Firefox MV2
│   ├── manifest-chrome.json     # Chrome 专用
│   ├── manifest-firefox.json    # Firefox 专用
│   ├── package.json             # webextension-polyfill
│   ├── build.js                 # 跨浏览器构建脚本
│   ├── src/
│   │   ├── background/          # Service Worker / 后台
│   │   │   └── background.js    # WebSocket 客户端、工具注册表
│   │   ├── content/             # 内容脚本
│   │   │   └── content.js       # DOM 自动化、反检测
│   │   ├── popup/               # 扩展弹出界面
│   │   │   └── popup.js         # 用户界面
│   │   └── polyfill/            # 浏览器兼容性
│   │       └── browser-polyfill.min.js
│   ├── icons/                   # 扩展图标 (16-128px)
│   └── releases/                # 构建的扩展包
│
├── .planning/                   # GSD 规划文档
│   └── codebase/                # 代码库分析
│       ├── ARCHITECTURE.md
│       └── STRUCTURE.md
│
├── build-dxt.sh                 # DXT 构建脚本
├── opendia.dxt                  # 编译的 DXT 包
└── README.md
```

## 目录用途

**opendia-mcp/src/config/：**
- 用途：服务器配置和端口管理
- 包含：CLI 解析、端口冲突解决、进程清理
- 关键文件： `/Users/lionad/Github/Lionad-Morotar/opendia/opendia-mcp/src/config/index.js`

**opendia-mcp/src/handlers/：**
- 用途：MCP 协议实现
- 包含：JSON-RPC 路由、工具执行、状态管理
- 关键文件： `/Users/lionad/Github/Lionad-Morotar/opendia/opendia-mcp/src/handlers/mcp.js`

**opendia-mcp/src/formatters/：**
- 用途：人类可读的输出格式化
- 包含：20+ 工具的专用格式化器
- 关键文件： `/Users/lionad/Github/Lionad-Morotar/opendia/opendia-mcp/src/formatters/index.js`

**opendia-mcp/src/tools/：**
- 用途：离线模式的工具模式定义
- 包含：扩展断开时的降级工具定义
- 关键文件： `/Users/lionad/Github/Lionad-Morotar/opendia/opendia-mcp/src/tools/fallback.js`

**opendia-mcp/src/transports/：**
- 用途：多种 MCP 传输实现
- 包含：WebSocket、HTTP/SSE、STDIO、ngrok 隧道
- 关键文件： `/Users/lionad/Github/Lionad-Morotar/opendia/opendia-mcp/src/transports/` 中的所有文件

**opendia-mcp/src/workflows/：**
- 用途：高级多步操作
- 包含：6 个工作流（社交、研究、会话、表单等）
- 关键文件： `/Users/lionad/Github/Lionad-Morotar/opendia/opendia-mcp/src/workflows/index.js` (注册表)

**opendia-extension/src/background/：**
- 用途：扩展后台进程
- 包含：WebSocket 客户端、连接管理、工具注册
- 关键文件： `/Users/lionad/Github/Lionad-Morotar/opendia/opendia-extension/src/background/background.js`

**opendia-extension/src/content/：**
- 用途：页面自动化和 DOM 操作
- 包含：反检测绕过、元素交互、内容提取
- 关键文件： `/Users/lionad/Github/Lionad-Morotar/opendia/opendia-extension/src/content/content.js`

**opendia-extension/src/popup/：**
- 用途：扩展用户界面
- 包含：弹出界面逻辑
- 关键文件： `/Users/lionad/Github/Lionad-Morotar/opendia/opendia-extension/src/popup/popup.js`

## 关键文件位置

**入口点：**
- `/Users/lionad/Github/Lionad-Morotar/opendia/opendia-mcp/server.js` - MCP 服务器 CLI 入口
- `/Users/lionad/Github/Lionad-Morotar/opendia/opendia-extension/src/background/background.js` - 扩展后台
- `/Users/lionad/Github/Lionad-Morotar/opendia/opendia-extension/src/content/content.js` - 扩展内容脚本

**配置：**
- `/Users/lionad/Github/Lionad-Morotar/opendia/opendia-mcp/package.json` - 服务器依赖
- `/Users/lionad/Github/Lionad-Morotar/opendia/opendia-extension/manifest.json` - 扩展清单
- `/Users/lionad/Github/Lionad-Morotar/opendia/opendia-mcp/src/config/index.js` - 运行时配置

**核心逻辑：**
- `/Users/lionad/Github/Lionad-Morotar/opendia/opendia-mcp/src/handlers/mcp.js` - MCP 协议处理器
- `/Users/lionad/Github/Lionad-Morotar/opendia/opendia-mcp/src/workflows/index.js` - 工作流注册表
- `/Users/lionad/Github/Lionad-Morotar/opendia/opendia-extension/src/content/content.js` - 浏览器自动化

**测试：**
- `/Users/lionad/Github/Lionad-Morotar/opendia/opendia-extension/test-extension.js` - 扩展测试脚本

## 命名规范

**文件：**
- 小写带下划线： `fallback.js`, `social.js`
- 模块入口使用索引文件： config/、formatters/、workflows/ 中的 `index.js`
- 描述性名称匹配用途： `websocket.js`, `tunnel.js`

**目录：**
- 小写复数： `handlers/`, `formatters/`, `workflows/`, `transports/`
- 概念单数： `config/`, `tools/`

**函数：**
- 驼峰命名法： `handleMCPRequest()`, `formatToolResult()`, `executeWorkflow()`
- 异步前缀由上下文暗示（名称中无 "async"）
- 动词开头： `initializeWebSocketServer()`, `startHTTPServer()`

**变量：**
- 驼峰命名法： `chromeExtensionSocket`, `pendingCalls`
- 常量：大写下划线命名法： `WS_PORT`, `HTTP_PORT`
- 全局状态：描述性名词： `config`, `wss`

## 添加新代码的位置

**新 MCP 工具：**
1. 添加工具模式到 `/Users/lionad/Github/Lionad-Morotar/opendia/opendia-mcp/src/tools/fallback.js`
2. 添加格式化器到 `/Users/lionad/Github/Lionad-Morotar/opendia/opendia-mcp/src/formatters/index.js`
3. 在 `/Users/lionad/Github/Lionad-Morotar/opendia/opendia-extension/src/content/content.js` 中实现工具
4. 在 `/Users/lionad/Github/Lionad-Morotar/opendia/opendia-extension/src/background/background.js` 中注册工具

**新工作流：**
1. 在 `/Users/lionad/Github/Lionad-Morotar/opendia/opendia-mcp/src/workflows/` 中创建工作流文件
2. 从新文件导出执行器函数
3. 在 `/Users/lionad/Github/Lionad-Morotar/opendia/opendia-mcp/src/workflows/index.js` 中注册：
   - 添加到 `workflowDefinitions` 数组
   - 添加到 `executeWorkflow()` 中的 `workflows` 对象
4. 从 index.js 导入和导出

**新传输：**
1. 在 `/Users/lionad/Github/Lionad-Morotar/opendia/opendia-mcp/src/transports/` 中创建传输文件
2. 导出初始化函数
3. 从 `/Users/lionad/Github/Lionad-Morotar/opendia/opendia-mcp/server.js` 导入和调用
4. 如需要，添加到 SIGINT 处理器的清理

**新格式化器：**
1. 添加格式化器函数到 `/Users/lionad/Github/Lionad-Morotar/opendia/opendia-mcp/src/formatters/index.js`
2. 在 `formatToolResult()` 格式化器对象中注册
3. 导出函数供直接使用

## 特殊目录

**node_modules/：**
- 用途：NPM 依赖
- 生成：是 (npm install)
- 提交：否（在 .gitignore 中）

**.planning/codebase/：**
- 用途：GSD 代码库分析文档
- 生成：否（手动维护）
- 提交：是

**opendia-extension/releases/：**
- 用途：构建的扩展包
- 生成：是（构建脚本）
- 提交：否（应在 .gitignore 中）

**opendia-extension/dist/（隐式）：**
- 用途：Chrome/Firefox 构建输出
- 生成：是 (build.js)
- 提交：否

---

*结构分析：2026-03-09*
