/**
 * 会话管理工作流
 * 用于浏览会话分析和标签页组织的工作流
 */

/**
 * 执行会话分析工作流
 * @param {Object} args - 工作流参数
 * @param {Function} callBrowserTool - 浏览器工具调用函数
 * @returns {Promise<string>}
 */
async function executeSessionAnalysisWorkflow(args, callBrowserTool) {
  const { focus = "productivity" } = args;

  try {
    // Get all open tabs
    const tabList = await callBrowserTool('tab_list', {
      current_window_only: false,
      include_details: true
    });

    // 获取最近的浏览历史
    const recentHistory = await callBrowserTool('get_history', {
      max_results: 50,
      sort_by: 'visit_time',
      sort_order: 'desc'
    });

    // 分析当前页面
    const currentPageContent = await callBrowserTool('page_extract_content', {
      content_type: 'article',
      summarize: true
    });

    // 处理标签页数据
    const tabs = tabList.tabs || [];
    const domains = [...new Set(tabs.map(tab => {
      try {
        return new URL(tab.url).hostname;
      } catch {
        return 'unknown';
      }
    }))];

    // 按域名类型对标签页分类
    const socialMediaDomains = ['twitter.com', 'x.com', 'linkedin.com', 'facebook.com', 'instagram.com'];
    const productivityDomains = ['docs.google.com', 'notion.so', 'obsidian.md', 'github.com'];
    const newsDomains = ['news.google.com', 'bbc.com', 'cnn.com', 'reuters.com'];

    const categorizedTabs = {
      social: tabs.filter(tab => socialMediaDomains.some(domain => tab.url.includes(domain))),
      productivity: tabs.filter(tab => productivityDomains.some(domain => tab.url.includes(domain))),
      news: tabs.filter(tab => newsDomains.some(domain => tab.url.includes(domain))),
      other: tabs.filter(tab =>
        !socialMediaDomains.some(domain => tab.url.includes(domain)) &&
        !productivityDomains.some(domain => tab.url.includes(domain)) &&
        !newsDomains.some(domain => tab.url.includes(domain))
      )
    };

    // 编译分析结果
    let result = `📊 **浏览会话分析**\n\n`;

    // 会话概览
    result += `🎯 **会话概览:**\n`;
    result += `• **打开的标签页总数:** ${tabs.length}\n`;
    result += `• **唯一域名:** ${domains.length}\n`;
    result += `• **活跃标签页:** ${tabList.active_tab ? '是' : '否'}\n`;
    result += `• **最近历史项目:** ${recentHistory.metadata?.total_found || 0}\n`;

    // 标签页分类
    result += `\n📂 **标签页分类:**\n`;
    result += `• **社交媒体:** ${categorizedTabs.social.length} 个标签页\n`;
    result += `• **生产力工具:** ${categorizedTabs.productivity.length} 个标签页\n`;
    result += `• **新闻/资讯:** ${categorizedTabs.news.length} 个标签页\n`;
    result += `• **其他:** ${categorizedTabs.other.length} 个标签页\n`;

    // 域名分析
    result += `\n🌐 **主要域名:**\n`;
    const domainCounts = {};
    tabs.forEach(tab => {
      try {
        const domain = new URL(tab.url).hostname;
        domainCounts[domain] = (domainCounts[domain] || 0) + 1;
      } catch {}
    });

    Object.entries(domainCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .forEach(([domain, count]) => {
        result += `• **${domain}:** ${count} 个标签页\n`;
      });

    // 专注模式特定分析
    if (focus === "productivity") {
      result += `\n💼 **生产力分析:**\n`;
      const duplicateTabs = tabs.filter((tab, index) =>
        tabs.findIndex(t => t.url === tab.url) !== index
      );
      result += `• **重复标签页:** ${duplicateTabs.length}\n`;
      result += `• **生产力工具:** ${categorizedTabs.productivity.length}\n`;
      result += `• **社交媒体干扰:** ${categorizedTabs.social.length}\n`;

      if (categorizedTabs.productivity.length > 0) {
        result += `\n**活跃的生产力工具:**\n`;
        categorizedTabs.productivity.slice(0, 3).forEach(tab => {
          result += `• ${tab.title}\n`;
        });
      }
    } else if (focus === "research") {
      result += `\n🔍 **研究分析:**\n`;
      result += `• **信息来源:** ${categorizedTabs.news.length + categorizedTabs.other.length}\n`;
      result += `• **研究深度:** ${recentHistory.metadata?.total_found > 20 ? '深入' : '浅层'}\n`;

      if (currentPageContent.summary) {
        result += `• **当前页面类型:** ${currentPageContent.content_type || '未知'}\n`;
        result += `• **阅读时间:** ${currentPageContent.summary.reading_time || 0} 分钟\n`;
      }
    }

    // 建议
    result += `\n💡 **建议:**\n`;
    if (tabs.length > 20) {
      result += `• 考虑关闭一些标签页以提高性能\n`;
    }
    if (domainCounts['twitter.com'] > 3 || domainCounts['x.com'] > 3) {
      result += `• 检测到多个社交媒体标签页 - 考虑合并\n`;
    }
    if (categorizedTabs.productivity.length > 0 && categorizedTabs.social.length > 0) {
      result += `• 生产力标签页和社交标签页混合 - 考虑分开浏览会话\n`;
    }

    result += `\n📈 **会话评分:** ${Math.round(((categorizedTabs.productivity.length + categorizedTabs.news.length) / tabs.length) * 100)}% 生产力`;

    return result;

  } catch (error) {
    throw new Error(`会话分析工作流失败: ${error.message}`);
  }
}

/**
 * 执行组织标签页工作流
 * @param {Object} args - 工作流参数
 * @param {Function} callBrowserTool - 浏览器工具调用函数
 * @returns {Promise<string>}
 */
async function executeOrganizeTabsWorkflow(args, callBrowserTool) {
  const { strategy = "close_duplicates" } = args;

  try {
    // 获取所有打开的标签页
    const tabList = await callBrowserTool('tab_list', {
      current_window_only: false,
      include_details: true
    });

    const tabs = tabList.tabs || [];
    let result = `🗂️ **标签页组织工作流**\n\n`;
    result += `📊 **从 ${tabs.length} 个标签页开始**\n\n`;

    let closedTabs = [];

    if (strategy === "close_duplicates") {
      // 查找并关闭重复标签页
      const seenUrls = new Set();
      const duplicates = [];

      tabs.forEach(tab => {
        if (seenUrls.has(tab.url)) {
          duplicates.push(tab);
        } else {
          seenUrls.add(tab.url);
        }
      });

      // 关闭重复标签页（保留第一个）
      if (duplicates.length > 0) {
        const tabIds = duplicates.map(tab => tab.id);
        const closeResult = await callBrowserTool('tab_close', {
          tab_ids: tabIds
        });

        if (closeResult.success) {
          closedTabs = duplicates;
          result += `✅ **关闭了 ${duplicates.length} 个重复标签页:**\n`;
          duplicates.forEach(tab => {
            result += `• ${tab.title}\n`;
          });
        }
      } else {
        result += `✅ **未找到重复标签页**\n`;
      }

    } else if (strategy === "group_by_domain") {
      // 按域名分组标签页
      const domainGroups = {};
      tabs.forEach(tab => {
        try {
          const domain = new URL(tab.url).hostname;
          if (!domainGroups[domain]) {
            domainGroups[domain] = [];
          }
          domainGroups[domain].push(tab);
        } catch {
          if (!domainGroups['unknown']) {
            domainGroups['unknown'] = [];
          }
          domainGroups['unknown'].push(tab);
        }
      });

      result += `📂 **按域名分组标签页:**\n`;
      Object.entries(domainGroups).forEach(([domain, domainTabs]) => {
        result += `• **${domain}:** ${domainTabs.length} tabs\n`;
        domainTabs.slice(0, 3).forEach(tab => {
          result += `  - ${tab.title}\n`;
        });
        if (domainTabs.length > 3) {
          result += `  - ... 还有 ${domainTabs.length - 3} 个\n`;
        }
      });

    } else if (strategy === "archive_old") {
      // 查找最近不活跃的标签页
      const staleTabsToClose = tabs.filter(tab =>
        tab.status === 'complete' &&
        !tab.active &&
        !tab.pinned &&
        tab.index > 10 // Assume tabs at the end are less active
      ).slice(0, 10); // Limit to 10 tabs max

      if (staleTabsToClose.length > 0) {
        const tabIds = staleTabsToClose.map(tab => tab.id);
        const closeResult = await callBrowserTool('tab_close', {
          tab_ids: tabIds
        });

        if (closeResult.success) {
          closedTabs = staleTabsToClose;
          result += `✅ **归档了 ${staleTabsToClose.length} 个旧标签页:**\n`;
          staleTabsToClose.forEach(tab => {
            result += `• ${tab.title}\n`;
          });
        }
      } else {
        result += `✅ **没有旧标签页需要归档**\n`;
      }
    }

    // 最终摘要
    const remainingTabs = tabs.length - closedTabs.length;
    result += `\n📈 **组织结果:**\n`;
    result += `• **关闭的标签页:** ${closedTabs.length}\n`;
    result += `• **剩余标签页:** ${remainingTabs}\n`;
    result += `• **组织策略:** ${strategy}\n`;

    if (remainingTabs > 15) {
      result += `\n💡 **建议:** 考虑运行其他组织策略以进一步减少标签页数量。`;
    } else {
      result += `\n✅ **标签页组织完成!** 您的浏览会话现在更加有条理。`;
    }

    return result;

  } catch (error) {
    throw new Error(`标签页组织工作流失败: ${error.message}`);
  }
}

module.exports = {
  executeSessionAnalysisWorkflow,
  executeOrganizeTabsWorkflow
};
