#!/usr/bin/env node

/**
 * OpenDia MCP 服务器
 * 浏览器自动化 MCP 服务器，支持反检测绕过
 *
 * 模块化架构：
 * - src/config/ - 配置管理
 * - src/handlers/ - MCP 请求处理器
 * - src/formatters/ - 工具结果格式化器
 * - src/workflows/ - 工作流实现
 * - src/tools/ - 工具定义
 * - src/transports/ - 传输层 (WebSocket, HTTP, STDIO)
 */

const { config, initializePorts } = require('./src/config');
const { initializeWebSocketServer } = require('./src/transports/websocket');
const { startHTTPServer } = require('./src/transports/http');
const { initializeStdioTransport } = require('./src/transports/stdio');
const { startTunnel, cleanupTunnel } = require('./src/transports/tunnel');

/**
 * 启动 MCP 服务器
 */
async function startServer() {
  console.error("🚀 Enhanced Browser MCP Server with Anti-Detection Features");
  console.error(`📊 Default ports: WebSocket=${config.WS_PORT}, HTTP=${config.HTTP_PORT}`);

  // 初始化端口（终止现有进程，解决冲突）
  await initializePorts();

  // 初始化浏览器扩展的 WebSocket 服务器
  initializeWebSocketServer(config.WS_PORT);
  console.error(`✅ 端口已解析: WebSocket=${config.WS_PORT}, HTTP=${config.HTTP_PORT}`);

  // 启动 HTTP 服务器用于 SSE 和健康检查
  const httpServer = startHTTPServer(config.HTTP_PORT);
  console.error(`🔌 浏览器扩展连接地址: ws://localhost:${config.WS_PORT}`);
  console.error("🎯 功能: 反检测绕过 + 智能自动化");

  // 如果请求了 ngrok 隧道则启动
  await startTunnel(config.HTTP_PORT);

  // 初始化 STDIO 传输（如果不是仅 SSE 模式）
  initializeStdioTransport(!config.sseOnly);

  // 显示传输信息
  if (config.sseOnly) {
    console.error('📡 传输模式: 仅 SSE (stdio 已禁用)');
    console.error(`💡 配置 Claude Desktop: http://localhost:${config.HTTP_PORT}/sse`);
  } else {
    console.error('📡 传输模式: 混合 (stdio + SSE)');
    console.error('💡 Claude Desktop: 使用现有配置即可');
    console.error('💡 在线 AI: 使用上述 SSE 端点');
  }

  // 显示端口配置帮助
  console.error('');
  console.error('🔧 端口配置:');
  console.error(`   当前: WebSocket=${config.WS_PORT}, HTTP=${config.HTTP_PORT}`);
  console.error('   自定义: npx opendia --ws-port=6000 --http-port=6001');
  console.error('   或: npx opendia --port=6000 (使用 6000 和 6001)');
  console.error('   注意: 现有进程会自动终止');
  console.error('');
}

// 退出时清理
process.on('SIGINT', async () => {
  console.error('🔄 正在关闭...');
  cleanupTunnel();
  process.exit();
});

// 启动服务器
startServer().catch(error => {
  console.error('❌ 服务器启动失败:', error.message);
  process.exit(1);
});
