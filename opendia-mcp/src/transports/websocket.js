/**
 * WebSocket 传输层
 * 处理来自浏览器扩展的 WebSocket 连接
 */

const WebSocket = require("ws");
const {
  setChromeExtensionSocket,
  setAvailableTools,
  handleToolResponse
} = require('../handlers/mcp');

let wss = null;

/**
 * 初始化 WebSocket 服务器
 * @param {number} port - WebSocket 端口
 * @returns {WebSocket.Server}
 */
function initializeWebSocketServer(port) {
  wss = new WebSocket.Server({ port });
  setupWebSocketHandlers();
  return wss;
}

/**
 * 设置 WebSocket 连接处理器
 */
function setupWebSocketHandlers() {
  wss.on("connection", (ws) => {
    console.error("浏览器扩展已连接");
    setChromeExtensionSocket(ws);

    // 设置 ping/pong 保持连接
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
      }
    }, 30000);

    ws.on("message", (data) => {
      try {
        const message = JSON.parse(data);

        if (message.type === "register") {
          setAvailableTools(message.tools);
          console.error(
            `✅ 已从扩展注册 ${message.tools.length} 个浏览器工具`
          );
          console.error(
            `🎯 带反检测绕过的增强工具: ${message.tools
              .map((t) => t.name)
              .join(", ")}`
          );
        } else if (message.type === "ping") {
          // 响应 ping 发送 pong
          ws.send(JSON.stringify({ type: "pong", timestamp: Date.now() }));
        } else if (message.id) {
          // 处理工具响应
          handleToolResponse(message);
        }
      } catch (error) {
        console.error("处理消息时出错:", error);
      }
    });

    ws.on("close", () => {
      console.error("浏览器扩展已断开");
      setChromeExtensionSocket(null);
      setAvailableTools([]);
      clearInterval(pingInterval);
    });

    ws.on("error", (error) => {
      console.error("WebSocket 错误:", error);
    });

    ws.on("pong", () => {
      // 扩展在线
    });
  });
}

/**
 * 获取 WebSocket 服务器实例
 * @returns {WebSocket.Server}
 */
function getWebSocketServer() {
  return wss;
}

module.exports = {
  initializeWebSocketServer,
  setupWebSocketHandlers,
  getWebSocketServer
};
