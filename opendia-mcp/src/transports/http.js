/**
 * HTTP/SSE 传输层
 * 处理 HTTP 端点和服务器发送事件（SSE），用于在线 AI 服务
 */

const express = require('express');
const cors = require('cors');
const { handleMCPRequest, getAvailableTools } = require('../handlers/mcp');
const { config } = require('../config');

const app = express();

// 中间件
app.use(cors());
app.use(express.json());

/**
 * 初始化 HTTP 路由
 */
function initializeHTTPRoutes() {
  // 在线 AI 的 SSE 端点
  app.route('/sse')
    .get((req, res) => {
      // SSE 连接流
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control, Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      });

      res.write(`data: ${JSON.stringify({
        type: 'connection',
        status: 'connected',
        server: config.name,
        version: config.version
      })}\n\n`);

      // 心跳保持连接
      const heartbeat = setInterval(() => {
        res.write(`data: ${JSON.stringify({
          type: 'heartbeat',
          timestamp: Date.now()
        })}\n\n`);
      }, 30000);

      req.on('close', () => {
        clearInterval(heartbeat);
        console.error('SSE 客户端已断开');
      });

      console.error('SSE 客户端已连接');
    })
    .post(async (req, res) => {
      // 来自在线 AI 的 MCP 请求
      console.error('通过 SSE 收到 MCP 请求:', req.body);

      try {
        const result = await handleMCPRequest(req.body);
        res.json({
          jsonrpc: "2.0",
          id: req.body.id,
          result: result
        });
      } catch (error) {
        res.status(500).json({
          jsonrpc: "2.0",
          id: req.body.id,
          error: { code: -32603, message: error.message }
        });
      }
    });

  // CORS 预检处理器
  app.options('*', (req, res) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Cache-Control');
    res.sendStatus(200);
  });

  // 健康检查端点
  app.get('/health', (req, res) => {
    const { getChromeExtensionSocket } = require('../handlers/mcp');
    const chromeExtensionSocket = getChromeExtensionSocket ? getChromeExtensionSocket() : null;

    res.json({
      status: 'ok',
      chromeExtensionConnected: chromeExtensionSocket !== null,
      availableTools: getAvailableTools().length,
      transport: config.sseOnly ? 'sse-only' : 'hybrid',
      tunnelEnabled: config.enableTunnel,
      ports: {
        websocket: config.WS_PORT,
        http: config.HTTP_PORT
      },
      features: config.features
    });
  });

  // Chrome/Firefox 扩展的端口发现端点
  app.get('/ports', (req, res) => {
    res.json({
      websocket: config.WS_PORT,
      http: config.HTTP_PORT,
      websocketUrl: `ws://localhost:${config.WS_PORT}`,
      httpUrl: `http://localhost:${config.HTTP_PORT}`,
      sseUrl: `http://localhost:${config.HTTP_PORT}/sse`
    });
  });
}

/**
 * 获取 Express 应用实例
 * @returns {Express}
 */
function getApp() {
  return app;
}

/**
 * 启动 HTTP 服务器
 * @param {number} port - HTTP 端口
 * @returns {http.Server}
 */
function startHTTPServer(port) {
  initializeHTTPRoutes();
  return app.listen(port, () => {
    console.error(`🌐 HTTP/SSE 服务器运行在端口 ${port}`);
  });
}

module.exports = {
  getApp,
  initializeHTTPRoutes,
  startHTTPServer
};
