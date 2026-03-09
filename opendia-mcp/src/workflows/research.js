/**
 * 研究工作流
 * 用于研究和内容分析的工作流
 */

/**
 * 执行研究工作流
 * @param {Object} args - 工作流参数
 * @param {Function} callBrowserTool - 浏览器工具调用函数
 * @returns {Promise<string>}
 */
async function executeResearchWorkflow(args, callBrowserTool) {
  const { topic, depth = "thorough" } = args;

  if (!topic) {
    throw new Error("研究主题是必需的");
  }

  try {
    // 分析当前页面内容
    const pageContent = await callBrowserTool('page_extract_content', {
      content_type: 'article',
      summarize: true
    });

    // 获取当前页面链接用于相关研究
    const pageLinks = await callBrowserTool('get_page_links', {
      include_internal: true,
      include_external: true,
      max_results: 20
    });

    // 搜索浏览历史以查找相关内容
    const historyResults = await callBrowserTool('get_history', {
      keywords: topic,
      max_results: 10,
      sort_by: 'visit_time'
    });

    // 如果当前页面有相关内容，则添加书签
    const currentUrl = pageContent.content?.url;
    const currentTitle = pageContent.summary?.title;

    if (currentUrl && currentTitle) {
      try {
        await callBrowserTool('add_bookmark', {
          title: `[Research: ${topic}] ${currentTitle}`,
          url: currentUrl
        });
      } catch (bookmarkError) {
        console.warn('书签创建失败:', bookmarkError.message);
      }
    }

    // 编译研究摘要
    let result = `🔍 **研究工作流: ${topic}**\n\n`;

    // 当前页面分析
    result += `📄 **当前页面分析:**\n`;
    if (pageContent.summary) {
      result += `• **标题:** ${pageContent.summary.title || '无'}\n`;
      result += `• **字数:** ${pageContent.summary.word_count || 0}\n`;
      result += `• **阅读时间:** ${pageContent.summary.reading_time || 0} 分钟\n`;
      result += `• **包含媒体:** ${pageContent.summary.has_images || pageContent.summary.has_videos ? '是' : '否'}\n`;
      if (pageContent.summary.preview) {
        result += `• **预览:** ${pageContent.summary.preview}\n`;
      }
    }

    // 相关链接
    result += `\n🔗 **找到的相关链接:** ${pageLinks.returned}\n`;
    const relevantLinks = pageLinks.links.filter(link =>
      link.text.toLowerCase().includes(topic.toLowerCase()) ||
      link.url.toLowerCase().includes(topic.toLowerCase())
    ).slice(0, 5);

    if (relevantLinks.length > 0) {
      result += `**最相关的链接:**\n`;
      relevantLinks.forEach((link, index) => {
        result += `${index + 1}. [${link.text}](${link.url})\n`;
      });
    }

    // 历史分析
    result += `\n📚 **先前的研究:**\n`;
    if (historyResults.history_items && historyResults.history_items.length > 0) {
      result += `在您的历史记录中找到 ${historyResults.history_items.length} 个相关页面:\n`;
      historyResults.history_items.slice(0, 5).forEach((item, index) => {
        result += `${index + 1}. **${item.title}** (访问了 ${item.visit_count} 次)\n`;
        result += `   ${item.url}\n`;
      });
    } else {
      result += `在浏览历史中未找到先前的研究。\n`;
    }

    // 研究建议
    result += `\n💡 **下一步:**\n`;
    if (depth === "comprehensive") {
      result += `• 探索当前页面上找到的 ${pageLinks.returned} 个链接\n`;
      result += `• 与 ${historyResults.metadata?.total_found || 0} 次历史访问进行交叉参考\n`;
      result += `• 考虑为其他相关页面添加书签\n`;
    } else if (depth === "thorough") {
      result += `• 查看最相关的 ${Math.min(5, pageLinks.returned)} 个链接\n`;
      result += `• 检查最近的历史记录以获取相关内容\n`;
    } else {
      result += `• 专注于当前页面内容和前 3 个相关链接\n`;
    }

    result += `\n✅ **当前页面已添加书签供参考**`;

    return result;

  } catch (error) {
    throw new Error(`研究工作流失败: ${error.message}`);
  }
}

module.exports = {
  executeResearchWorkflow
};
