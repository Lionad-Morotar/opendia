/**
 * 工作流注册表
 * 所有 MCP 工作流的集中注册中心
 */

const { executePostToSocialWorkflow, executePostSelectedQuoteWorkflow } = require('./social');
const { executeResearchWorkflow } = require('./research');
const { executeSessionAnalysisWorkflow, executeOrganizeTabsWorkflow } = require('./session');
const { executeFillFormWorkflow } = require('./form');

/**
 * 用于 prompts/list 的可用工作流定义
 */
const workflowDefinitions = [
  {
    name: "post_to_social",
    description: "Post content to social media platforms with anti-detection bypass",
    arguments: [
      {
        name: "content",
        description: "The content to post",
        required: true
      },
      {
        name: "platform",
        description: "Target platform (twitter, linkedin, facebook)",
        required: false
      }
    ]
  },
  {
    name: "post_selected_quote",
    description: "Post currently selected text as a quote with commentary",
    arguments: [
      {
        name: "commentary",
        description: "Your commentary on the selected text",
        required: false
      }
    ]
  },
  {
    name: "research_workflow",
    description: "Research a topic using current page and bookmarking findings",
    arguments: [
      {
        name: "topic",
        description: "Research topic or query",
        required: true
      },
      {
        name: "depth",
        description: "Research depth: quick, thorough, comprehensive",
        required: false
      }
    ]
  },
  {
    name: "analyze_browsing_session",
    description: "Analyze current browsing session and provide insights",
    arguments: [
      {
        name: "focus",
        description: "Analysis focus: productivity, research, trends",
        required: false
      }
    ]
  },
  {
    name: "organize_tabs",
    description: "Organize and clean up browser tabs intelligently",
    arguments: [
      {
        name: "strategy",
        description: "Organization strategy: close_duplicates, group_by_domain, archive_old",
        required: false
      }
    ]
  },
  {
    name: "fill_form_assistant",
    description: "Analyze and help fill out forms on the current page",
    arguments: [
      {
        name: "form_type",
        description: "Type of form: contact, registration, survey, application",
        required: false
      }
    ]
  }
];

/**
 * 按名称执行工作流
 * @param {string} name - 工作流名称
 * @param {Object} args - 工作流参数
 * @param {Function} callBrowserTool - 浏览器工具调用函数
 * @returns {Promise<string>}
 */
async function executeWorkflow(name, args, callBrowserTool) {
  const workflows = {
    post_to_social: executePostToSocialWorkflow,
    post_selected_quote: executePostSelectedQuoteWorkflow,
    research_workflow: executeResearchWorkflow,
    analyze_browsing_session: executeSessionAnalysisWorkflow,
    organize_tabs: executeOrganizeTabsWorkflow,
    fill_form_assistant: executeFillFormWorkflow
  };

  const workflow = workflows[name];
  if (!workflow) {
    throw new Error(`Unknown workflow: ${name}`);
  }

  return await workflow(args, callBrowserTool);
}

module.exports = {
  workflowDefinitions,
  executeWorkflow,
  // 导出单个工作流供直接使用
  executePostToSocialWorkflow,
  executePostSelectedQuoteWorkflow,
  executeResearchWorkflow,
  executeSessionAnalysisWorkflow,
  executeOrganizeTabsWorkflow,
  executeFillFormWorkflow
};
