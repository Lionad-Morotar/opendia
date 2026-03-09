# 测试模式

**分析日期：** 2026-03-09

## 测试框架

**测试运行器：** 未配置
- `package.json` 测试脚本： `"echo \"Error: no test specified\" && exit 1"`
- 未检测到 Jest、Vitest、Mocha 或其他测试运行器

**断言库：** 未配置

**运行命令：**
```bash
# 无可用测试命令
npm test  # 返回错误 - 未配置测试
```

## 测试文件组织

**位置：** 无测试文件
- 未找到 `*.test.js` 或 `*.spec.js` 文件
- 无 `__tests__` 或 `test/` 目录

**现有验证：**
- `opendia-extension/test-extension.js` - 构建验证脚本（非单元测试）
- `opendia-extension/build.js` - 包含 `validateBuild()` 和 `validateAllBuilds()` 函数

## 测试结构

**无正式测试结构** - 项目缺乏自动化测试

**手动测试方法：**
```javascript
// 来自 test-extension.js - 验证检查
function testManifestStructure(browser) {
  // 读取构建的扩展清单
  // 验证结构
  // 将结果记录到控制台
}

function testBackgroundScript(browser) {
  // 读取后台脚本
  // 检查必需的模式
  // 仅记录，无断言
}
```

## 模拟

**框架：** 无

**使用的模式：**
- 未检测到模拟框架
- 扩展使用浏览器 API polyfill 实现跨浏览器兼容性
- 某些区域使用手动存根：
```javascript
// 用于测试的浏览器 API 抽象
const runtimeAPI = browser.runtime;
const tabsAPI = browser.tabs;
```

## 固定装置和工厂

**测试数据：** 无

**配置固定装置：**
- `opendia-mcp/.env.example` - 环境变量模板
- 清单文件： `manifest-chrome.json`, `manifest-firefox.json`

## 覆盖率

**要求：** 无强制要求

**覆盖率状态：** 0% - 无测试存在

## 测试类型

**单元测试：** 未实现

**集成测试：** 未实现

**端到端测试：** 未实现

**构建验证：**
```javascript
// 来自 build.js - 构建后运行
async function validateBuild(browser) {
  const buildDir = `dist/${browser}`;
  const manifestPath = path.join(buildDir, 'manifest.json');

  // 检查清单是否存在且为有效 JSON
  const manifest = await fs.readJson(manifestPath);

  // 检查必需文件是否存在
  const requiredFiles = [
    'src/background/background.js',
    'src/content/content.js',
    // ...
  ];

  // 浏览器特定验证
  if (browser === 'chrome') {
    if (manifest.manifest_version !== 3) {
      throw new Error('Chrome 构建必须使用清单版本 3');
    }
  }
}
```

## 常见测试模式（推荐）

**异步测试模式：**
```javascript
// 代码库中发现的异步操作模式
async function someAsyncOperation() {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('操作超时'));
    }, 30000);

    // 操作
    someCallback((result) => {
      clearTimeout(timeout);
      resolve(result);
    });
  });
}
```

**错误测试模式：**
```javascript
// 来自 mcp.js 的错误处理模式
try {
  const result = await operation();
  return { success: true, result };
} catch (error) {
  return {
    content: [{ type: "text", text: `❌ 错误：${error.message}` }],
    isError: true,
  };
}
```

## 测试缺口

**关键未测试区域：**
1. **MCP 协议处理器** (`src/handlers/mcp.js`) - 核心业务逻辑
2. **工作流执行** (`src/workflows/*.js`) - 所有工作流函数
3. **传输层** (`src/transports/*.js`) - WebSocket、HTTP、STDIO
4. **内容脚本** (`opendia-extension/src/content/content.js`) - 2897 行
5. **后台脚本** (`opendia-extension/src/background/background.js`) - 2046 行
6. **格式化器** (`src/formatters/index.js`) - 输出格式化

**风险评估：**
- 高风险：浏览器自动化逻辑无测试
- 高风险：反检测绕过机制无测试
- 中风险：MCP 协议合规性无测试
- 中风险：跨浏览器扩展兼容性无测试

## 推荐测试策略

**优先级 1 - 单元测试：**
```javascript
// 建议实现的示例测试结构
// src/handlers/mcp.test.js
describe('handleMCPRequest', () => {
  test('处理初始化请求', async () => {
    const request = { id: 1, method: 'initialize', params: {} };
    const response = await handleMCPRequest(request);
    expect(response.result.protocolVersion).toBe('2024-11-05');
  });

  test('扩展断开时返回降级工具', async () => {
    // 测试无扩展时的 tools/list
  });
});
```

**优先级 2 - 集成测试：**
- 使用模拟浏览器扩展的 WebSocket 传输
- HTTP/SSE 端点
- 使用模拟工具调用的工作流执行

**优先级 3 - 端到端测试：**
- 完整的 MCP 服务器启动和关闭
- 浏览器扩展构建和加载
- 跨浏览器兼容性验证

## 建议添加的测试命令

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:extension": "node opendia-extension/test-extension.js"
  }
}
```

---

*测试分析：2026-03-09*
