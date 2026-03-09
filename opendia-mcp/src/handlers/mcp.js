/**
 * MCP 请求处理器
 * 处理所有 MCP 协议请求 (JSON-RPC 2.0)
 */

const { formatToolResult } = require('../formatters');
const { workflowDefinitions, executeWorkflow } = require('../workflows');
const { getFallbackTools } = require('../tools/fallback');

// 全局状态（将被注入）
let chromeExtensionSocket = null;
let availableTools = [];
const pendingCalls = new Map();

/**
 * 设置 Chrome 扩展 socket
 * @param {WebSocket} socket - 浏览器扩展的 WebSocket 连接
 */
function setChromeExtensionSocket(socket) {
  chromeExtensionSocket = socket;
}

/**
 * 设置来自扩展的可用工具
 * @param {Array} tools - 来自扩展的可用工具
 */
function setAvailableTools(tools) {
  availableTools = tools;
}

/**
 * 获取可用工具
 * @returns {Array}
 */
function getAvailableTools() {
  return availableTools;
}

/**
 * 获取待处理调用映射
 * @returns {Map}
 */
function getPendingCalls() {
  return pendingCalls;
}

/**
 * 获取 Chrome 扩展 socket
 * @returns {WebSocket|null}
 */
function getChromeExtensionSocket() {
  return chromeExtensionSocket;
}

/**
 * 处理 MCP JSON-RPC 请求
 * @param {Object} request - JSON-RPC 请求对象
 * @returns {Promise<Object>}
 */
async function handleMCPRequest(request) {
  const { id, method, params } = request;

  try {
    let result;

    switch (method) {
      case "initialize":
        result = {
          protocolVersion: "2024-11-05",
          capabilities: {
            tools: {},
            resources: {},
            prompts: {}
          },
          serverInfo: {
            name: "opendia-mcp",
            version: "1.0.0",
          },
        };
        break;

      case "tools/list":
        console.error(
          `扩展已连接: ${
            chromeExtensionSocket &&
            chromeExtensionSocket.readyState === 1
          }, 可用工具: ${availableTools.length}`
        );

        // 如果扩展可用则返回扩展的工具，否则返回回退工具
        if (
          chromeExtensionSocket &&
          chromeExtensionSocket.readyState === 1 &&
          availableTools.length > 0
        ) {
          console.error(
            `从扩展返回 ${availableTools.length} 个工具`
          );
          result = {
            tools: availableTools.map((tool) => ({
              name: tool.name,
              description: tool.description,
              inputSchema: tool.inputSchema,
            })),
          };
        } else {
          // 返回基本回退工具
          console.error("扩展未连接，返回回退工具");
          result = {
            tools: getFallbackTools(),
          };
        }
        break;

      case "tools/call":
        if (
          !chromeExtensionSocket ||
          chromeExtensionSocket.readyState !== 1
        ) {
          // 扩展未连接 - 返回有用的错误信息
          result = {
            content: [
              {
                type: "text",
                text: "❌ Browser Extension not connected. Please install and activate the browser extension, then try again.\n\nSetup instructions:\n\nFor Chrome: \n1. Go to chrome://extensions/\n2. Enable Developer mode\n3. Click 'Load unpacked' and select the Chrome extension folder\n\nFor Firefox:\n1. Go to about:debugging#/runtime/this-firefox\n2. Click 'Load Temporary Add-on...'\n3. Select the manifest-firefox.json file\n\n🎯 Features: Anti-detection bypass for Twitter/X, LinkedIn, Facebook + universal automation",
              },
            ],
            isError: true,
          };
        } else {
          // 扩展已连接 - 尝试调用工具
          try {
            const toolResult = await callBrowserTool(
              params.name,
              params.arguments || {}
            );

            // 根据工具类型格式化响应
            const formattedResult = formatToolResult(params.name, toolResult);

            result = {
              content: [
                {
                  type: "text",
                  text: formattedResult,
                },
              ],
              isError: false,
            };
          } catch (error) {
            result = {
              content: [
                {
                  type: "text",
                  text: `❌ 工具执行失败: ${error.message}`,
                },
              ],
              isError: true,
            };
          }
        }
        break;

      case "resources/list":
        // 返回空资源列表
        result = { resources: [] };
        break;

      case "prompts/list":
        // 返回可用的工作流提示
        result = {
          prompts: workflowDefinitions
        };
        break;

      case "prompts/get":
        // 根据提示名称执行特定工作流
        const promptName = params.name;
        const promptArgs = params.arguments || {};

        try {
          const workflowResult = await executeWorkflow(
            promptName,
            promptArgs,
            callBrowserTool
          );

          result = {
            content: [
              {
                type: "text",
                text: workflowResult
              }
            ]
          };
        } catch (error) {
          result = {
            content: [
              {
                type: "text",
                text: `❌ 工作流执行失败: ${error.message}`
              }
            ],
            isError: true
          };
        }
        break;

      default:
        throw new Error(`未知方法: ${method}`);
    }

    return { jsonrpc: "2.0", id, result };
  } catch (error) {
    return {
      jsonrpc: "2.0",
      id,
      error: {
        code: -32603,
        message: error.message,
      },
    };
  }
}

/**
 * 通过 Chrome/Firefox 扩展调用浏览器工具
 * @param {string} toolName - 工具名称
 * @param {Object} args - 工具参数
 * @returns {Promise<Object>}
 */
async function callBrowserTool(toolName, args) {
  if (
    !chromeExtensionSocket ||
    chromeExtensionSocket.readyState !== 1
  ) {
    throw new Error(
      "浏览器扩展未连接。请确保扩展已安装并处于活动状态。"
    );
  }

  const callId = Date.now().toString();

  return new Promise((resolve, reject) => {
    pendingCalls.set(callId, { resolve, reject });

    chromeExtensionSocket.send(
      JSON.stringify({
        id: callId,
        method: toolName,
        params: args,
      })
    );

    // 30 秒后超时
    setTimeout(() => {
      if (pendingCalls.has(callId)) {
        pendingCalls.delete(callId);
        reject(new Error("工具调用超时"));
      }
    }, 30000);
  });
}

/**
 * 处理来自 Chrome/Firefox 扩展的工具响应
 * @param {Object} message - 来自扩展的响应消息
 */
function handleToolResponse(message) {
  const pending = pendingCalls.get(message.id);
  if (pending) {
    pendingCalls.delete(message.id);
    if (message.error) {
      pending.reject(new Error(message.error.message));
    } else {
      pending.resolve(message.result);
    }
  }
}

module.exports = {
  handleMCPRequest,
  handleToolResponse,
  callBrowserTool,
  setChromeExtensionSocket,
  setAvailableTools,
  getAvailableTools,
  getChromeExtensionSocket,
  getPendingCalls
};
