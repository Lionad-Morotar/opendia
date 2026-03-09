/**
 * 工具结果格式化器
 * 格式化工具执行结果以供显示
 */

function createMetadata(toolName, executionTime = 0) {
  return {
    tool: toolName,
    execution_time: executionTime,
    timestamp: new Date().toISOString(),
  };
}

function formatPageAnalyzeResult(result, metadata) {
  if (result.elements && result.elements.length > 0) {
    const platformInfo = result.summary?.anti_detection_platform
      ? `\n🎯 检测到反检测平台: ${result.summary.anti_detection_platform}`
      : "";

    const summary =
      `使用 ${result.method} 找到 ${result.elements.length} 个相关元素:${platformInfo}\n\n` +
      result.elements
        .map((el) => {
          const readyStatus = el.ready ? "✅ 就绪" : "⚠️ 未就绪";
          const stateInfo = el.state === "disabled" ? " (已禁用)" : "";
          return `• ${el.name} (${el.type}) - 置信度: ${el.conf}% ${readyStatus}${stateInfo}\n  元素 ID: ${el.id}`;
        })
        .join("\n\n");
    return `${summary}\n\n${JSON.stringify(metadata, null, 2)}`;
  } else {
    const intentHint = result.intent_hint || "未知";
    const platformInfo = result.summary?.anti_detection_platform
      ? `\n平台: ${result.summary.anti_detection_platform}`
      : "";
    return `未找到意图 "${intentHint}" 的相关元素${platformInfo}\n\n${JSON.stringify(
      metadata,
      null,
      2
    )}`;
  }
}

function formatContentSummary(summary, contentType) {
  switch (contentType) {
    case "article":
      return (
        `📰 文章: "${summary.title}"\n` +
        `📝 字数: ${summary.word_count}\n` +
        `⏱️ 阅读时间: ${summary.reading_time} 分钟\n` +
        `🖼️ 包含媒体: ${summary.has_images || summary.has_videos}\n` +
        `预览: ${summary.preview}`
      );

    case "search_results":
      return (
        `🔍 搜索结果摘要:\n` +
        `📊 总计结果: ${summary.total_results}\n` +
        `🏆 质量评分: ${summary.quality_score}/100\n` +
        `📈 平均相关度: ${Math.round(summary.avg_score * 100)}%\n` +
        `🌐 主要域名: ${summary.top_domains
          ?.map((d) => d.domain)
          .join(", ")}\n` +
        `📝 结果类型: ${summary.result_types?.join(", ")}`
      );

    case "posts":
      return (
        `📱 社交帖子摘要:\n` +
        `📊 帖子数量: ${summary.post_count}\n` +
        `📝 平均长度: ${summary.avg_length} 字符\n` +
        `❤️ 总互动数: ${summary.engagement_total}\n` +
        `🖼️ 含媒体帖子: ${summary.has_media_count}\n` +
        `👥 独立作者: ${summary.authors}\n` +
        `📋 帖子类型: ${summary.post_types?.join(", ")}`
      );

    default:
      return JSON.stringify(summary, null, 2);
  }
}

function formatContentExtractionResult(result, metadata) {
  const contentSummary = `使用 ${result.method} 提取 ${result.content_type} 内容:\n\n`;
  if (result.content) {
    let preview;
    if (typeof result.content === "string") {
      preview = result.content.substring(0, 500) + (result.content.length > 500 ? "..." : "");
    } else if (result.content && typeof result.content === "object") {
      if (result.content.content && result.content.content.length > 1000) {
        preview = JSON.stringify(result.content, null, 2);
      } else {
        preview = JSON.stringify(result.content, null, 2).substring(0, 500);
      }
    } else {
      preview = JSON.stringify(result.content, null, 2).substring(0, 500);
    }

    return `${contentSummary}${preview}\n\n${JSON.stringify(
      metadata,
      null,
      2
    )}`;
  } else if (result.summary) {
    const summaryText = formatContentSummary(
      result.summary,
      result.content_type
    );
    return `${contentSummary}${summaryText}\n\n${JSON.stringify(
      metadata,
      null,
      2
    )}`;
  } else {
    return `${contentSummary}未找到内容\n\n${JSON.stringify(
      metadata,
      null,
      2
    )}`;
  }
}

function formatElementClickResult(result, metadata) {
  return (
    `✅ 成功点击元素: ${
      result.element_name || result.element_id
    }\n` +
    `点击类型: ${result.click_type || "左键"}\n\n${JSON.stringify(
      metadata,
      null,
      2
    )}`
  );
}

function formatElementFillResult(result, metadata) {
  const methodEmojis = {
    twitter_direct_bypass: "🐦 Twitter Direct Bypass",
    linkedin_direct_bypass: "💼 LinkedIn Direct Bypass",
    facebook_direct_bypass: "📘 Facebook Direct Bypass",
    generic_direct_bypass: "🎯 Generic Direct Bypass",
    standard_fill: "🔧 Standard Fill",
    anti_detection_bypass: "🛡️ Anti-Detection Bypass",
  };

  const methodDisplay = methodEmojis[result.method] || result.method;
  const successIcon = result.success ? "✅" : "❌";

  let fillResult = `${successIcon} 元素填充${
    result.success ? "完成" : "失败"
  }，使用 ${methodDisplay}\n`;
  fillResult += `📝 目标: ${result.element_name || result.element_id}\n`;
  fillResult += `💬 输入: "${result.value}"\n`;

  if (result.actual_value) {
    fillResult += `📄 结果: "${result.actual_value}"\n`;
  }

  if (
    result.method?.includes("bypass") &&
    result.execCommand_result !== undefined
  ) {
    fillResult += `🔧 execCommand 成功: ${result.execCommand_result}\n`;
  }

  if (!result.success && result.method?.includes("bypass")) {
    fillResult += `\n⚠️ 直接绕过失败 - 页面可能具有增强检测。请尝试刷新页面。\n`;
  }

  return `${fillResult}\n${JSON.stringify(metadata, null, 2)}`;
}

function formatHistoryResult(result, metadata) {
  if (!result.history_items || result.history_items.length === 0) {
    return `🕒 未找到符合条件的历史记录\n\n${JSON.stringify(metadata, null, 2)}`;
  }

  const summary = `🕒 找到 ${result.history_items.length} 条历史记录 (${result.metadata.total_found} 条总计):\n\n`;

  const items = result.history_items.map((item, index) => {
    const visitInfo = `访问次数: ${item.visit_count}`;
    const timeInfo = new Date(item.last_visit_time).toLocaleDateString();
    const domainInfo = `[${item.domain}]`;

    return `${index + 1}. **${item.title}**\n   ${domainInfo} ${visitInfo} | 最后访问: ${timeInfo}\n   URL: ${item.url}`;
  }).join('\n\n');

  const searchSummary = result.metadata.search_params.keywords ?
    `\n🔍 搜索: "${result.metadata.search_params.keywords}"` : '';
  const dateSummary = result.metadata.search_params.date_range ?
    `\n📅 日期范围: ${result.metadata.search_params.date_range}` : '';
  const domainSummary = result.metadata.search_params.domains ?
    `\n🌐 域名: ${result.metadata.search_params.domains.join(', ')}` : '';
  const visitSummary = result.metadata.search_params.min_visit_count > 1 ?
    `\n📊 最少访问次数: ${result.metadata.search_params.min_visit_count}` : '';

  return `${summary}${items}${searchSummary}${dateSummary}${domainSummary}${visitSummary}\n\n${JSON.stringify(metadata, null, 2)}`;
}

function formatSelectedTextResult(result, metadata) {
  if (!result.has_selection) {
    return `📝 未选择文本\n\n${result.message || "当前页面未选择文本"}\n\n${JSON.stringify(metadata, null, 2)}`;
  }

  const textPreview = result.selected_text.length > 200
    ? result.selected_text.substring(0, 200) + "..."
    : result.selected_text;

  let summary = `📝 选中文本 (${result.character_count} 个字符):\n\n"${textPreview}"`;

  if (result.truncated) {
    summary += `\n\n⚠️ 文本已截断以适应长度限制`;
  }

  if (result.selection_metadata) {
    const meta = result.selection_metadata;
    summary += `\n\n📊 选择详情:`;
    summary += `\n• 字数: ${meta.word_count}`;
    summary += `\n• 行数: ${meta.line_count}`;
    summary += `\n• 位置: ${Math.round(meta.position.x)}, ${Math.round(meta.position.y)}`;

    if (meta.parent_element.tag_name) {
      summary += `\n• 父元素: <${meta.parent_element.tag_name}>`;
      if (meta.parent_element.class_name) {
        summary += ` class="${meta.parent_element.class_name}"`;
      }
    }

    if (meta.page_info) {
      summary += `\n• 页面: ${meta.page_info.title}`;
      summary += `\n• 域名: ${meta.page_info.domain}`;
    }
  }

  return `${summary}\n\n${JSON.stringify(metadata, null, 2)}`;
}

function formatScrollResult(result, metadata) {
  if (!result.success) {
    return `📜 滚动失败: ${result.error || "未知错误"}\n\n${JSON.stringify(metadata, null, 2)}`;
  }

  let summary = `📜 页面滚动成功`;

  if (result.direction) {
    summary += ` ${result.direction}`;
  }

  if (result.amount && result.amount !== "custom") {
    summary += ` (${result.amount})`;
  } else if (result.pixels) {
    summary += ` (${result.pixels}px)`;
  }

  if (result.element_scrolled) {
    summary += `\n🎯 滚动到元素: ${result.element_scrolled}`;
  }

  if (result.scroll_position) {
    summary += `\n📍 新位置: x=${result.scroll_position.x}, y=${result.scroll_position.y}`;
  }

  if (result.page_dimensions) {
    const { width, height, scrollWidth, scrollHeight } = result.page_dimensions;
    summary += `\n📐 页面大小: ${width}x${height} (可滚动: ${scrollWidth}x${scrollHeight})`;
  }

  if (result.wait_time) {
    summary += `\n⏱️ 滚动后等待了 ${result.wait_time}ms`;
  }

  return `${summary}\n\n${JSON.stringify(metadata, null, 2)}`;
}

function formatLinksResult(result, metadata) {
  if (!result.links || result.links.length === 0) {
    return `🔗 页面上未找到链接\n\n${JSON.stringify(metadata, null, 2)}`;
  }

  const summary = `🔗 找到 ${result.returned} 个链接 (页面上共 ${result.total_found} 个):\n`;
  const currentDomain = result.current_domain ? `\n🌐 当前域名: ${result.current_domain}` : '';

  const linksList = result.links.map((link, index) => {
    const typeIcon = link.type === 'internal' ? '🏠' : '🌐';
    const linkText = link.text.length > 50 ? link.text.substring(0, 50) + '...' : link.text;
    const displayText = linkText || '[无文本]';
    const title = link.title ? `\n   标题: ${link.title}` : '';
    const domain = link.domain ? ` [${link.domain}]` : '';

    return `${index + 1}. ${typeIcon} **${displayText}**${domain}${title}\n   URL: ${link.url}`;
  }).join('\n\n');

  const filterInfo = [];
  if (result.links.some(l => l.type === 'internal') && result.links.some(l => l.type === 'external')) {
    const internal = result.links.filter(l => l.type === 'internal').length;
    const external = result.links.filter(l => l.type === 'external').length;
    filterInfo.push(`📊 内部: ${internal}, 外部: ${external}`);
  }

  const filterSummary = filterInfo.length > 0 ? `\n${filterInfo.join('\n')}` : '';

  return `${summary}${currentDomain}${filterSummary}\n\n${linksList}\n\n${JSON.stringify(metadata, null, 2)}`;
}

function formatTabCreateResult(result, metadata) {
  // 处理批量操作
  if (result.batch_operation) {
    const { summary, created_tabs, settings_used, warnings, errors } = result;

    let output = `🚀 批量标签页创建完成
📊 摘要: ${summary.successful}/${summary.total_requested} 个标签页创建成功
⏱️ 执行时间: ${summary.execution_time_ms}ms
📦 处理块数: ${summary.chunks_processed}

`;

    if (warnings && warnings.length > 0) {
      output += `⚠️ 警告:\n${warnings.map(w => `   • ${w}`).join('\n')}\n\n`;
    }

    if (created_tabs && created_tabs.length > 0) {
      output += `✅ 创建的标签页:\n`;
      created_tabs.forEach((tab, index) => {
        output += `   ${index + 1}. ${tab.title || '新标签页'} (ID: ${tab.tab_id})\n`;
        output += `      🌐 ${tab.actual_url || tab.url}\n`;
        if (tab.active) output += `      🎯 活跃标签页\n`;
      });
      output += '\n';
    }

    if (errors && errors.length > 0) {
      output += `❌ 错误:\n`;
      errors.forEach((error, index) => {
        output += `   ${index + 1}. ${error.url}: ${error.error}\n`;
      });
      output += '\n';
    }

    if (settings_used) {
      output += `⚙️ 使用的设置:\n`;
      output += `   • 块大小: ${settings_used.chunk_size}\n`;
      output += `   • 块间延迟: ${settings_used.delay_between_chunks}ms\n`;
      output += `   • 标签页间延迟: ${settings_used.delay_between_tabs}ms\n`;
    }

    return output + `\n${JSON.stringify(metadata, null, 2)}`;
  }

  // 处理单个标签页操作
  if (result.success) {
    return `✅ 新标签页创建成功
🆔 标签页 ID: ${result.tab_id}
🌐 URL: ${result.url || 'about:blank'}
🎯 激活状态: ${result.active ? '是' : '否'}
📝 标题: ${result.title || '新标签页'}
${result.warning ? `⚠️ 警告: ${result.warning}` : ''}

${JSON.stringify(metadata, null, 2)}`;
  } else {
    return `❌ 创建标签页失败: ${result.error || '未知错误'}

${JSON.stringify(metadata, null, 2)}`;
  }
}

function formatTabCloseResult(result, metadata) {
  if (result.success) {
    const tabText = result.count === 1 ? '个标签页' : '个标签页';
    return `✅ 成功关闭 ${result.count} ${tabText}
🆔 关闭的标签页 ID: ${result.closed_tabs.join(', ')}

${JSON.stringify(metadata, null, 2)}`;
  } else {
    return `❌ 关闭标签页失败: ${result.error || '未知错误'}

${JSON.stringify(metadata, null, 2)}`;
  }
}

function formatTabListResult(result, metadata) {
  if (!result.success || !result.tabs || result.tabs.length === 0) {
    return `📋 未找到标签页

${JSON.stringify(metadata, null, 2)}`;
  }

  const summary = `📋 找到 ${result.count} 个打开的标签页:
🎯 活跃标签页: ${result.active_tab || '无'}

`;

  const tabsList = result.tabs.map((tab, index) => {
    const activeIcon = tab.active ? '🟢' : '⚪';
    const statusInfo = tab.status ? ` [${tab.status}]` : '';
    const pinnedInfo = tab.pinned ? ' 📌' : '';

    return `${index + 1}. ${activeIcon} **${tab.title}**${pinnedInfo}${statusInfo}
   🆔 ID: ${tab.id} | 🌐 ${tab.url}`;
  }).join('\n\n');

  return `${summary}${tabsList}

${JSON.stringify(metadata, null, 2)}`;
}

function formatTabSwitchResult(result, metadata) {
  if (result.success) {
    return `✅ 成功切换到标签页
🆔 标签页 ID: ${result.tab_id}
📝 标题: ${result.title}
🌐 URL: ${result.url}
🏠 窗口 ID: ${result.window_id}

${JSON.stringify(metadata, null, 2)}`;
  } else {
    return `❌ 切换标签页失败: ${result.error || '未知错误'}

${JSON.stringify(metadata, null, 2)}`;
  }
}

function formatElementStateResult(result, metadata) {
  const element = result.element_name || result.element_id || '未知元素';
  const state = result.state || {};

  let summary = `🔍 元素状态: ${element}

📊 **交互就绪状态**: ${state.interaction_ready ? '✅ 就绪' : '❌ 未就绪'}

**详细状态:**
• 已禁用: ${state.disabled ? '❌ 是' : '✅ 否'}
• 可见: ${state.visible ? '✅ 是' : '❌ 否'}
• 可点击: ${state.clickable ? '✅ 是' : '❌ 否'}
• 可聚焦: ${state.focusable ? '✅ 是' : '❌ 否'}
• 有文本: ${state.hasText ? '✅ 是' : '❌ 否'}
• 为空: ${state.isEmpty ? '❌ 是' : '✅ 否'}`;

  if (result.current_value) {
    summary += `
📝 **当前值**: "${result.current_value}"`;
  }

  return `${summary}

${JSON.stringify(metadata, null, 2)}`;
}

function formatPageStyleResult(result, metadata) {
  const statusText = result.success ? '成功应用' : '应用失败';

  let summary = `🎨 页面样式${statusText}\n\n`;

  summary += `📄 **操作详情:**
`;
  summary += `• **模式:** ${result.mode || '未知'}\n`;

  if (result.theme) {
    summary += `• **主题:** ${result.theme}\n`;
  }

  if (result.applied_css !== undefined) {
    summary += `• **已应用 CSS:** ${result.applied_css} 个字符\n`;
  }

  if (result.description) {
    summary += `• **结果:** ${result.description}\n`;
  }

  if (result.remember_enabled) {
    summary += `• **已保存:** 此域名的样式偏好已保存\n`;
  }

  if (result.effect_duration) {
    summary += `• **效果持续时间:** ${result.effect_duration} 秒\n`;
  }

  if (result.mood) {
    summary += `• **应用的氛围:** "${result.mood}"\n`;
  }

  if (result.intensity) {
    summary += `• **强度:** ${result.intensity}\n`;
  }

  if (!result.success && result.error) {
    summary += `\n❌ **错误:** ${result.error}\n`;
  }

  if (result.warning) {
    summary += `\n⚠️ **警告:** ${result.warning}\n`;
  }

  summary += `
💡 **提示:** 使用 mode="reset" 恢复原始页面样式`;

  return `${summary}\n\n${JSON.stringify(metadata, null, 2)}`;
}

/**
 * 主格式化函数 - 根据工具名称分发到特定的格式化器
 */
function formatToolResult(toolName, result) {
  const metadata = createMetadata(toolName, result.execution_time || 0);

  const formatters = {
    page_analyze: formatPageAnalyzeResult,
    page_extract_content: formatContentExtractionResult,
    element_click: formatElementClickResult,
    element_fill: formatElementFillResult,
    page_navigate: (r, m) => `✅ Successfully navigated to: ${r.url || "unknown URL"}\n\n${JSON.stringify(m, null, 2)}`,
    page_wait_for: (r, m) => `✅ Condition met: ${r.condition_type || "unknown"}\nWait time: ${r.wait_time || 0}ms\n\n${JSON.stringify(m, null, 2)}`,
    get_history: formatHistoryResult,
    get_selected_text: formatSelectedTextResult,
    page_scroll: formatScrollResult,
    get_page_links: formatLinksResult,
    tab_create: formatTabCreateResult,
    tab_close: formatTabCloseResult,
    tab_list: formatTabListResult,
    tab_switch: formatTabSwitchResult,
    element_get_state: formatElementStateResult,
    page_style: formatPageStyleResult,
  };

  const formatter = formatters[toolName];
  if (formatter) {
    return formatter(result, metadata);
  }

  // 遗留工具或未知工具
  return JSON.stringify(result, null, 2);
}

module.exports = {
  formatToolResult,
  formatPageAnalyzeResult,
  formatContentExtractionResult,
  formatElementClickResult,
  formatElementFillResult,
  formatHistoryResult,
  formatSelectedTextResult,
  formatScrollResult,
  formatLinksResult,
  formatTabCreateResult,
  formatTabCloseResult,
  formatTabListResult,
  formatTabSwitchResult,
  formatElementStateResult,
  formatPageStyleResult,
};
