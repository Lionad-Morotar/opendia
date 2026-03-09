/**
 * STDIO 传输层
 * 处理 MCP 通信的标准输入/输出
 */

const { handleMCPRequest } = require('../handlers/mcp');

let inputBuffer = "";

/**
 * 初始化 STDIO 传输层
 * @param {boolean} enabled - 是否启用 STDIO
 */
function initializeStdioTransport(enabled) {
  if (!enabled) {
    console.error('📡 STDIO 传输层已禁用（仅 SSE 模式）');
    return;
  }

  process.stdin.on("data", async (chunk) => {
    inputBuffer += chunk.toString();

    // 处理完整行
    const lines = inputBuffer.split("\n");
    inputBuffer = lines.pop() || "";

    for (const line of lines) {
      if (line.trim()) {
        try {
          const request = JSON.parse(line);
          const response = await handleMCPRequest(request);

          // 仅在生成响应时发送（不发送通知）
          if (response) {
            process.stdout.write(JSON.stringify(response) + "\n");
          }
        } catch (error) {
          console.error("处理请求时出错:", error);
        }
      }
    }
  });

  console.error('📡 STDIO 传输层已初始化');
}

module.exports = {
  initializeStdioTransport
};
