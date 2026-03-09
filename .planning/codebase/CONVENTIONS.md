# 编码规范

**分析日期：** 2026-03-09

## 命名规范

**文件：**
- 文件名使用短横线命名法： `websocket.js`, `fallback.js`, `social.js`
- 入口文件：聚合导出使用 `index.js`，模块使用描述性名称
- 示例： `src/workflows/index.js`, `src/transports/http.js`, `src/tools/fallback.js`

**函数：**
- 函数名使用驼峰命名法： `handleMCPRequest()`, `executeWorkflow()`, `formatToolResult()`
- 异步函数以动作动词开头： `executeResearchWorkflow()`, `startHTTPServer()`, `initializePorts()`
- 私有/内部函数使用描述性名称： `setupWebSocketHandlers()`, `handlePortConflict()`

**变量：**
- 局部变量使用驼峰命名法： `chromeExtensionSocket`, `pendingCalls`, `toolResult`
- 常量/配置使用大写下划线命名法： `WS_PORT`, `HTTP_PORT`, `MCP_SERVER_URL`
- 布尔标志使用描述性名称： `safetyModeEnabled`, `enableTunnel`, `sseOnly`

**类型/类：**
- 类名使用帕斯卡命名法： `ConnectionManager`
- 未检测到显式 TypeScript 接口（纯 JavaScript 项目）

## 代码风格

**格式化：**
- 项目根目录未检测到 ESLint 或 Prettier 配置
- 整个代码库使用一致的 2 空格缩进
- 字符串使用单引号（主要模式）
- 始终使用分号

**主要风格模式：**
```javascript
// 函数声明使用 JSDoc
/**
 * 执行研究工作流
 * @param {Object} args - 工作流参数
 * @param {Function} callBrowserTool - 浏览器工具调用函数
 * @returns {Promise<string>}
 */
async function executeResearchWorkflow(args, callBrowserTool) {
  // 实现
}

// 参数中使用对象解构
async function executePostToSocialWorkflow(args, callBrowserTool) {
  const { content, platform = "auto" } = args;
  // ...
}

// 复杂字符串使用模板字面量
let result = `🔍 **研究工作流：${topic}**\n\n`;
```

## 导入组织

**顺序：**
1. Node.js 内置模块： `const net = require('net');`
2. 第三方依赖： `const WebSocket = require("ws");`
3. 内部模块： `const { config } = require('../config');`

**路径别名：**
- 未配置路径别名
- 使用相对路径： `../handlers/mcp`, `../config`, `./social`

**聚合文件：**
- `src/workflows/index.js` - 导出所有工作流函数
- `src/config/index.js` - 导出配置和工具函数
- 模式：同时导出命名导出和组合对象

## 错误处理

**模式：**
```javascript
// 带含义错误消息的 try-catch
try {
  const toolResult = await callBrowserTool(params.name, params.arguments || {});
  // ...
} catch (error) {
  result = {
    content: [{ type: "text", text: `❌ 工具执行失败：${error.message}` }],
    isError: true,
  };
}

// 带提前返回的验证
if (!content) {
  throw new Error("社交媒体发布需要内容");
}

// Promise 错误处理
return new Promise((resolve, reject) => {
  exec(`lsof -ti:${port}`, (error, stdout) => {
    if (error || !stdout.trim()) {
      resolve(false);
      return;
    }
    // ...
  });
});
```

**错误响应格式：**
- 使用带 `isError` 标志的结构化错误对象
- 用户输出中包含表情符号前缀以进行视觉区分： `❌`, `⚠️`, `✅`
- 始终在面向用户的输出中包含错误消息

## 日志记录

**框架：** 服务器端使用 `console.error`（stderr）

**模式：**
```javascript
// 带表情符号前缀的状态消息
console.error("🚀 增强型浏览器 MCP 服务器，带反检测功能");
console.error(`📊 默认端口：WebSocket=${config.WS_PORT}, HTTP=${config.HTTP_PORT}`);
console.error('✅ 现有进程已终止');
console.error('⚠️ 检测到端口冲突');

// 用于调试的结构化日志
console.error(`扩展已连接：${chromeExtensionSocket?.readyState === 1}`);
```

**日志级别：**
- `console.error` - 所有日志记录（输出到 stderr，保持 stdout 干净用于 MCP）
- MCP 服务器代码中不使用 console.log

## 注释

**何时添加注释：**
- 文件头说明模块用途
- 所有导出函数使用 JSDoc
- 复杂逻辑或解决方案的内联注释

**模式：**
```javascript
/**
 * MCP 请求处理器
 * 处理所有 MCP 协议请求（JSON-RPC 2.0）
 */

/**
 * 检查端口是否正在使用
 * @param {number} port - 要检查的端口
 * @returns {Promise<boolean>}
 */
async function checkPortInUse(port) {
  // ...
}
```

## 函数设计

**大小：**
- 函数通常聚焦单一职责（20-50 行）
- 大文件按职责拆分（格式化器、工作流）
- 复杂操作分解为更小的函数

**参数：**
- 选项对象使用解构
- 可选参数使用默认值： `platform = "auto"`
- 回调注入模式： `callBrowserTool` 传递给工作流

**返回值：**
- 异步函数返回 Promise
- 相似函数使用一致的返回结构
- 格式化器返回带 markdown 格式的字符串

## 模块设计

**导出：**
```javascript
// 特定函数的命名导出
module.exports = {
  handleMCPRequest,
  handleToolResponse,
  callBrowserTool,
  setChromeExtensionSocket,
  // ...
};

// 组合工作流导出
module.exports = {
  workflowDefinitions,
  executeWorkflow,
  // 导出单个工作流供直接使用
  executePostToSocialWorkflow,
  executeResearchWorkflow,
  // ...
};
```

**模块分类：**
- `src/config/` - 配置和 CLI 解析
- `src/handlers/` - 请求处理逻辑
- `src/formatters/` - 输出格式化
- `src/workflows/` - 业务逻辑工作流
- `src/tools/` - 工具定义
- `src/transports/` - 通信层

## 扩展特定模式

**跨浏览器兼容性：**
```javascript
// 文件开头的 polyfill 模式
if (typeof browser === 'undefined' && typeof chrome !== 'undefined') {
  globalThis.browser = chrome;
}

// API 抽象层
const runtimeAPI = browser.runtime;
const tabsAPI = browser.tabs;
const storageAPI = browser.storage;
```

**消息传递：**
```javascript
// 标准消息格式
runtimeAPI.sendMessage({ action: "getStatus" }, (response) => {
  if (runtimeAPI.lastError) {
    handleError();
    return;
  }
  // 处理响应
});
```

## 字符串格式化

**输出格式：**
- 使用表情符号作为视觉状态指示器
- 输出字符串中使用 Markdown 格式
- JSON 元数据附加到格式化输出

```javascript
// 结果格式化模式
let result = `✅ **操作完成**\n\n`;
result += `• **项目：** ${value}\n`;
result += `• **计数：** ${count}\n\n`;
result += `${JSON.stringify(metadata, null, 2)}`;
```

---

*规范分析：2026-03-09*
