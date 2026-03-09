# 架构

**分析日期：** 2026-03-09

## 模式概览

**整体：** 模块化分层架构，基于插件的工具系统

**关键特征：**
- 跨 6 个模块目录的清晰关注点分离
- 传输无关的 MCP 协议处理
- 基于工作流的高级操作
- 扩展断开时的降级工具定义
- 社交媒体平台的反检测绕过

## 分层

**入口点 (server.js)：**
- 用途：应用引导和传输初始化
- 位置： `/Users/lionad/Github/Lionad-Morotar/opendia/opendia-mcp/server.js`
- 包含：服务器启动、优雅关闭、CLI 参数处理
- 依赖：config、transports (websocket, http, stdio, tunnel)
- 使用者：Node.js 运行时（CLI 入口点）

**配置层 (src/config/)：**
- 用途：集中配置、端口管理、CLI 解析
- 位置： `/Users/lionad/Github/Lionad-Morotar/opendia/opendia-mcp/src/config/index.js`
- 包含：配置对象、端口冲突解决、进程管理
- 依赖：Node.js 内置模块 (net, child_process)
- 使用者：所有其他层

**传输层 (src/transports/)：**
- 用途：MCP 通信的多种传输实现
- 位置： `/Users/lionad/Github/Lionad-Morotar/opendia/opendia-mcp/src/transports/`
- 包含：
  - `websocket.js` - 浏览器扩展 WebSocket 服务器
  - `http.js` - 在线 AI 的 HTTP 服务器和 SSE 端点
  - `stdio.js` - Claude Desktop 的 STDIO 传输
  - `tunnel.js` - 外部访问的 ngrok 隧道
- 依赖：handlers/mcp、config、外部库 (ws, express, cors)
- 使用者：server.js 入口点

**处理器层 (src/handlers/)：**
- 用途：MCP 协议请求处理和路由
- 位置： `/Users/lionad/Github/Lionad-Morotar/opendia/opendia-mcp/src/handlers/mcp.js`
- 包含：JSON-RPC 请求分发、工具调用、状态管理
- 依赖：formatters、workflows、tools/fallback
- 使用者：所有传输层

**工作流层 (src/workflows/)：**
- 用途：作为 MCP 提示暴露的高级多步操作
- 位置： `/Users/lionad/Github/Lionad-Morotar/opendia/opendia-mcp/src/workflows/`
- 包含：
  - `index.js` - 工作流注册表和分发
  - `social.js` - 社交媒体发布工作流
  - `research.js` - 研究和书签工作流
  - `session.js` - 标签页管理和分析工作流
  - `form.js` - 表单分析和填充工作流
- 依赖：工具调用函数（从处理器注入）
- 使用者：handlers/mcp（用于 prompts/get 方法）

**格式化层 (src/formatters/)：**
- 用途：工具结果格式化为人类可读输出
- 位置： `/Users/lionad/Github/Lionad-Morotar/opendia/opendia-mcp/src/formatters/index.js`
- 包含：工具专用格式化器、元数据创建
- 依赖：无（纯格式化函数）
- 使用者：handlers/mcp（工具执行后）

**工具层 (src/tools/)：**
- 用途：扩展断开时的工具模式定义
- 位置： `/Users/lionad/Github/Lionad-Morotar/opendia/opendia-mcp/src/tools/fallback.js`
- 包含：工具模式、输入验证模式
- 依赖：无（静态定义）
- 使用者：handlers/mcp（扩展离线时的 tools/list）

**浏览器扩展 (opendia-extension/)：**
- 用途：客户端工具执行和页面交互
- 位置： `/Users/lionad/Github/Lionad-Morotar/opendia/opendia-extension/`
- 包含：
  - `src/background/background.js` - WebSocket 客户端、连接管理
  - `src/content/content.js` - DOM 操作、反检测绕过
  - `src/popup/popup.js` - 扩展界面
- 依赖：WebExtension API、MCP 服务器 WebSocket
- 使用者：终端用户浏览器

## 数据流

**MCP 请求流 (STDIO)：**

1. Claude Desktop 通过 STDIN 发送 JSON-RPC 请求
2. `src/transports/stdio.js` 读取并解析行
3. `src/handlers/mcp.js` 路由到适当的处理器
4. 如果是工具调用： `callBrowserTool()` 通过 WebSocket 发送到扩展
5. 扩展在浏览器中执行，返回结果
6. `src/formatters/index.js` 格式化结果
7. 响应写入 STDOUT

**MCP 请求流 (在线 AI 的 SSE)：**

1. 在线 AI 服务 POST 到 `/sse` 端点
2. `src/transports/http.js` 接收请求
3. `src/handlers/mcp.js` 通过 `handleMCPRequest()` 处理
4. 工具执行流经与 STDIO 相同的路径
5. 响应作为 HTTP JSON 返回

**工作流执行流：**

1. 客户端使用工作流名称调用 `prompts/get`
2. `src/handlers/mcp.js` 调用 `executeWorkflow()`
3. `src/workflows/index.js` 分发到特定工作流
4. 工作流顺序执行多个浏览器工具调用
5. 结果编译为格式化的字符串响应

**浏览器扩展注册：**

1. 扩展通过 WebSocket 连接到 `src/transports/websocket.js`
2. 发送带可用工具数组的 `register` 消息
3. `src/handlers/mcp.js` 通过 `setAvailableTools()` 存储工具
4. 后续 `tools/list` 调用返回扩展工具

## 关键抽象

**MCP 协议处理器：**
- 用途：实现模型上下文协议 JSON-RPC 接口
- 示例： `/Users/lionad/Github/Lionad-Morotar/opendia/opendia-mcp/src/handlers/mcp.js`
- 模式：基于 switch 的方法分发和异步处理器

**传输接口：**
- 用途：抽象 MCP 通信通道
- 示例：stdio.js、http.js、websocket.js
- 模式：每个传输调用 `handleMCPRequest()` 并管理 I/O

**工作流注册表：**
- 用途：可插拔的高级操作
- 示例： `/Users/lionad/Github/Lionad-Morotar/opendia/opendia-mcp/src/workflows/index.js`
- 模式：工作流名称到执行器函数的对象映射

**工具格式化器注册表：**
- 用途：工具特定的结果格式化
- 示例： `/Users/lionad/Github/Lionad-Morotar/opendia/opendia-mcp/src/formatters/index.js`
- 模式：工具名称到格式化器函数的对象映射

**反检测绕过：**
- 用途：社交媒体的平台特定 DOM 操作
- 示例： `/Users/lionad/Github/Lionad-Morotar/opendia/opendia-extension/src/content/content.js`
- 模式：带有专用选择器和方法的平台配置映射

## 入口点

**CLI 入口点：**
- 位置： `/Users/lionad/Github/Lionad-Morotar/opendia/opendia-mcp/server.js`
- 触发： `npx opendia` 或 `node server.js`
- 职责：解析 CLI 参数、初始化端口、启动传输

**浏览器扩展入口点：**
- 后台： `/Users/lionad/Github/Lionad-Morotar/opendia/opendia-extension/src/background/background.js`
- 内容脚本： `/Users/lionad/Github/Lionad-Morotar/opendia/opendia-extension/src/content/content.js`
- 弹出窗口： `/Users/lionad/Github/Lionad-Morotar/opendia/opendia-extension/src/popup/popup.js`

## 错误处理

**策略：** 优雅降级和信息性消息

**模式：**
- 扩展断开：在错误消息中返回有用的设置说明
- 端口冲突：自动递增以找到可用端口
- 工具超时：30 秒超时和拒绝
- 工作流错误：包装上下文并重新抛出

**错误流：**
1. 传输层捕获 I/O 错误
2. 处理器捕获协议错误
3. 格式化器将工具错误包装在格式化消息中
4. 客户端接收带 `isError: true` 的结构化错误

## 横切关注点

**日志记录：** 服务器端使用 console.error（stderr），扩展使用 console.log
**验证：** 通过 tool inputSchema 进行 JSON Schema 验证，工作流中手动验证
**认证：** 无（仅限本地服务器，依赖本地主机安全）
**状态管理：** 待处理调用的内存 Map，全局 socket 引用

---

*架构分析：2026-03-09*
