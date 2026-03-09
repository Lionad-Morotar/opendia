#!/usr/bin/env node

/**
 * OpenDia MCP 服务器配置
 * 端口、CLI 参数和功能标志的集中配置管理
 */

const net = require('net');
const { exec } = require('child_process');

// 解析命令行参数
const args = process.argv.slice(2);

const config = {
  // 功能标志
  enableTunnel: args.includes('--tunnel') || args.includes('--auto-tunnel'),
  sseOnly: args.includes('--sse-only'),
  killExisting: args.includes('--kill-existing'),

  // 端口配置
  WS_PORT: parseInt(
    args.find(arg => arg.startsWith('--ws-port='))?.split('=')[1] ||
    args.find(arg => arg.startsWith('--port='))?.split('=')[1] ||
    5555
  ),
  HTTP_PORT: parseInt(
    args.find(arg => arg.startsWith('--http-port='))?.split('=')[1] ||
    (args.find(arg => arg.startsWith('--port='))?.split('=')[1]
      ? parseInt(args.find(arg => arg.startsWith('--port=')).split('=')[1]) + 1
      : 5556)
  ),

  // 服务器元数据
  version: '1.0.0',
  name: 'OpenDia MCP Server',

  // 健康检查端点的功能列表
  features: [
    'Anti-detection bypass for Twitter/X, LinkedIn, Facebook',
    'Two-phase intelligent page analysis',
    'Smart content extraction with summarization',
    'Element state detection and interaction readiness',
    'Performance analytics and token optimization',
    'SSE transport for online AI services'
  ]
};

/**
 * 检查端口是否被占用
 * @param {number} port - 要检查的端口
 * @returns {Promise<boolean>}
 */
async function checkPortInUse(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.once('close', () => resolve(false));
      server.close();
    });
    server.on('error', () => resolve(true));
  });
}

/**
 * 从指定端口开始查找可用端口
 * @param {number} startPort - 起始端口号
 * @returns {Promise<number>}
 */
async function findAvailablePort(startPort) {
  let port = startPort;
  while (await checkPortInUse(port)) {
    console.error(`  Port ${port} in use, trying ${port + 1}...`);
    port++;
  }
  return port;
}

/**
 * 检查端口上的进程是否为 OpenDia 进程
 * @param {number} port - 要检查的端口
 * @returns {Promise<boolean>}
 */
async function checkIfOpenDiaProcess(port) {
  return new Promise((resolve) => {
    exec(`lsof -ti:${port}`, (error, stdout) => {
      if (error || !stdout.trim()) {
        resolve(false);
        return;
      }

      const pids = stdout.trim().split('\n');
      let checked = 0;
      let isOpenDia = false;

      pids.forEach(pid => {
        exec(`ps -p ${pid} -o command=`, (err, cmdOutput) => {
          checked++;
          if (!err && cmdOutput.includes('opendia')) {
            isOpenDia = true;
          }
          if (checked === pids.length) {
            resolve(isOpenDia);
          }
        });
      });

      if (pids.length === 0) {
        resolve(false);
      }
    });
  });
}

/**
 * 终止端口上现有的 OpenDia 进程
 * @param {number} port - 要终止进程的端口
 * @returns {Promise<boolean>}
 */
async function killExistingOpenDia(port) {
  const isOpenDia = await checkIfOpenDiaProcess(port);
  if (!isOpenDia) {
    return false;
  }

  return new Promise((resolve) => {
    exec(`lsof -ti:${port} | xargs kill -9 2>/dev/null || true`, () => {
      resolve(true);
    });
  });
}

/**
 * 通过查找可用端口来处理端口冲突
 * @param {number} preferredPort - 首选端口
 * @param {string} serviceName - 服务名称（用于日志）
 * @returns {Promise<number>}
 */
async function handlePortConflict(preferredPort, serviceName) {
  const inUse = await checkPortInUse(preferredPort);
  if (!inUse) {
    return preferredPort;
  }

  console.error(`⚠️  ${serviceName} 端口 ${preferredPort} 已被占用`);
  const newPort = await findAvailablePort(preferredPort + 1);
  console.error(`✅ ${serviceName} 将使用端口 ${newPort}`);
  return newPort;
}

/**
 * 初始化并解析所有端口配置
 */
async function initializePorts() {
  // 启动时终止现有的 OpenDia 进程
  console.error('🔧 检查现有的 OpenDia 进程...');
  const wsKilled = await killExistingOpenDia(config.WS_PORT);
  const httpKilled = await killExistingOpenDia(config.HTTP_PORT);

  if (wsKilled || httpKilled) {
    console.error('✅ 现有进程已终止');
    await new Promise(resolve => setTimeout(resolve, 2000));
  } else {
    console.error('ℹ️  未找到现有的 OpenDia 进程');
  }

  // 解析端口冲突
  config.WS_PORT = await handlePortConflict(config.WS_PORT, 'WebSocket');
  config.HTTP_PORT = await handlePortConflict(config.HTTP_PORT, 'HTTP');

  // 确保 HTTP 端口与 WebSocket 端口不冲突
  if (config.HTTP_PORT === config.WS_PORT) {
    config.HTTP_PORT = await findAvailablePort(config.WS_PORT + 1);
    console.error(`🔄 HTTP 端口已调整为 ${config.HTTP_PORT} 以避免与 WebSocket 冲突`);
  }
}

module.exports = {
  config,
  checkPortInUse,
  findAvailablePort,
  checkIfOpenDiaProcess,
  killExistingOpenDia,
  handlePortConflict,
  initializePorts
};
