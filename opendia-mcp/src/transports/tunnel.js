/**
 * 隧道传输层
 * 处理 ngrok 隧道设置，用于在线 AI 访问
 */

const { spawn } = require('child_process');
const { config } = require('../config');

/**
 * 启动 ngrok 隧道
 * @param {number} httpPort - 要隧道的 HTTP 端口
 * @returns {Promise<string|null>} - 隧道 URL，失败返回 null
 */
async function startTunnel(httpPort) {
  if (!config.enableTunnel) {
    return null;
  }

  try {
    console.error('🔄 正在启动自动隧道...');

    // 直接使用系统 ngrok 二进制文件
    const ngrokProcess = spawn('ngrok', ['http', httpPort, '--log', 'stdout'], {
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let tunnelUrl = null;

    // 等待隧道 URL
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        ngrokProcess.kill();
        reject(new Error('隧道启动超时'));
      }, 10000);

      ngrokProcess.stdout.on('data', (data) => {
        const output = data.toString();
        const match = output.match(/url=https:\/\/[^\s]+/);
        if (match) {
          tunnelUrl = match[0].replace('url=', '');
          clearTimeout(timeout);
          resolve();
        }
      });

      ngrokProcess.stderr.on('data', (data) => {
        const error = data.toString();
        if (error.includes('error') || error.includes('failed')) {
          clearTimeout(timeout);
          ngrokProcess.kill();
          reject(new Error(error.trim()));
        }
      });

      ngrokProcess.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });

    if (tunnelUrl) {
      console.error('');
      console.error('🎉 OPENDIA READY!');
      console.error('📋 复制此 URL 用于在线 AI 服务:');
      console.error(`🔗 ${tunnelUrl}/sse`);
      console.error('');
      console.error('💡 ChatGPT: 设置 → 连接器 → 自定义连接器');
      console.error('💡 Claude Web: 添加为外部 MCP 服务器（如支持）');
      console.error('');
      console.error('🏠 本地访问仍然可用:');
      console.error(`🔗 http://localhost:${httpPort}/sse`);
      console.error('');

      // 存储 ngrok 进程用于清理
      global.ngrokProcess = ngrokProcess;
      return tunnelUrl;
    } else {
      throw new Error('无法提取隧道 URL');
    }

  } catch (error) {
    console.error('❌ 隧道启动失败:', error.message);
    console.error('');
    console.error('💡 手动 NGROK 选项:');
    console.error(`  1. 运行: ngrok http ${httpPort}`);
    console.error('  2. 使用 ngrok URL + /sse');
    console.error('');
    console.error('💡 或使用本地 URL:');
    console.error(`  🔗 http://localhost:${httpPort}/sse`);
    console.error('');
    return null;
  }
}

/**
 * 退出时清理隧道
 */
function cleanupTunnel() {
  if (config.enableTunnel && global.ngrokProcess) {
    console.error('🔄 正在关闭隧道...');
    try {
      global.ngrokProcess.kill('SIGTERM');
    } catch (error) {
      // 忽略清理错误
    }
  }
}

module.exports = {
  startTunnel,
  cleanupTunnel
};
