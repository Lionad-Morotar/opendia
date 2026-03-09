/**
 * 社交媒体工作流
 * 用于发布到社交媒体平台的工作流
 */

/**
 * 执行发布到社交媒体工作流
 * @param {Object} args - 工作流参数
 * @param {Function} callBrowserTool - 浏览器工具调用函数
 * @returns {Promise<string>}
 */
async function executePostToSocialWorkflow(args, callBrowserTool) {
  const { content, platform = "auto" } = args;

  if (!content) {
    throw new Error("社交媒体发布需要内容");
  }

  try {
    // 分析当前页面以确定平台并找到发布元素
    const pageAnalysis = await callBrowserTool('page_analyze', {
      intent_hint: 'post_create',
      phase: 'discover',
      max_results: 3
    });

    if (!pageAnalysis.elements || pageAnalysis.elements.length === 0) {
      throw new Error("当前页面未找到发布元素。请导航到社交媒体平台。");
    }

    // 找到最适合发布的文本区域元素
    const textareaElement = pageAnalysis.elements.find(el =>
      el.type === 'textarea' || el.name.toLowerCase().includes('post') || el.name.toLowerCase().includes('tweet')
    );

    if (!textareaElement) {
      throw new Error("当前页面未找到合适的发布文本区域");
    }

    // 使用反检测绕过填充内容
    const fillResult = await callBrowserTool('element_fill', {
      element_id: textareaElement.id,
      value: content,
      clear_first: true
    });

    if (!fillResult.success) {
      throw new Error(`填充内容失败: ${fillResult.actual_value}`);
    }

    // 查找提交按钮
    const submitElement = pageAnalysis.elements.find(el =>
      el.type === 'button' && (el.name.toLowerCase().includes('post') || el.name.toLowerCase().includes('tweet') || el.name.toLowerCase().includes('share'))
    );

    let result = `✅ 成功发布内容到社交媒体！\n\n`;
    result += `📝 **发布内容:** "${content}"\n`;
    result += `🎯 **检测到的平台:** ${pageAnalysis.summary?.anti_detection_platform || '通用'}\n`;
    result += `🔧 **使用方法:** ${fillResult.method}\n`;
    result += `📊 **填充成功:** ${fillResult.success ? '是' : '否'}\n`;

    if (submitElement) {
      result += `\n💡 **下一步:** 点击 "${submitElement.name}" 按钮发布您的帖子。`;
    } else {
      result += `\n💡 **下一步:** 查找 "发布" 或 "推文" 按钮来发布您的内容。`;
    }

    return result;

  } catch (error) {
    throw new Error(`社交媒体发布失败: ${error.message}`);
  }
}

/**
 * 执行发布选中引用工作流
 * @param {Object} args - 工作流参数
 * @param {Function} callBrowserTool - 浏览器工具调用函数
 * @returns {Promise<string>}
 */
async function executePostSelectedQuoteWorkflow(args, callBrowserTool) {
  const { commentary = "" } = args;

  try {
    // 从当前页面获取选中的文本
    const selectedText = await callBrowserTool('get_selected_text', {
      include_metadata: true,
      max_length: 1000
    });

    if (!selectedText.has_selection) {
      throw new Error("当前没有选中文本。请先选择一些文本。");
    }

    // 使用评论格式化引用
    let quoteContent = `"${selectedText.selected_text}"`;
    if (selectedText.selection_metadata?.page_info?.title) {
      quoteContent += `\n\n— ${selectedText.selection_metadata.page_info.title}`;
    }
    if (selectedText.selection_metadata?.page_info?.url) {
      quoteContent += `\n${selectedText.selection_metadata.page_info.url}`;
    }
    if (commentary) {
      quoteContent += `\n\n${commentary}`;
    }

    // 使用格式化的引用执行发布工作流
    const postResult = await executePostToSocialWorkflow({ content: quoteContent }, callBrowserTool);

    let result = `🎯 **选中引用发布工作流**\n\n`;
    result += `📝 **选中文本:** "${selectedText.selected_text.substring(0, 100)}${selectedText.selected_text.length > 100 ? '...' : ''}"\n`;
    result += `📄 **来源:** ${selectedText.selection_metadata?.page_info?.title || '当前页面'}\n`;
    result += `💬 **评论:** ${commentary || '无'}\n`;
    result += `📊 **字符数:** ${quoteContent.length}\n\n`;
    result += postResult;

    return result;

  } catch (error) {
    throw new Error(`引用发布工作流失败: ${error.message}`);
  }
}

module.exports = {
  executePostToSocialWorkflow,
  executePostSelectedQuoteWorkflow
};
