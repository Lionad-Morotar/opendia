/**
 * 表单助手工作流
 * 用于表单分析和辅助的工作流
 */

/**
 * 执行表单填充工作流
 * @param {Object} args - 工作流参数
 * @param {Function} callBrowserTool - 浏览器工具调用函数
 * @returns {Promise<string>}
 */
async function executeFillFormWorkflow(args, callBrowserTool) {
  const { form_type = "auto" } = args;

  try {
    // 分析页面表单元素
    const formAnalysis = await callBrowserTool('page_analyze', {
      intent_hint: 'form submit',
      phase: 'detailed',
      focus_areas: ['forms', 'buttons'],
      max_results: 10
    });

    if (!formAnalysis.elements || formAnalysis.elements.length === 0) {
      throw new Error("当前页面未找到表单元素");
    }

    // 对表单元素分类
    const formElements = {
      inputs: formAnalysis.elements.filter(el => el.type === 'input'),
      textareas: formAnalysis.elements.filter(el => el.type === 'textarea'),
      selects: formAnalysis.elements.filter(el => el.type === 'select'),
      buttons: formAnalysis.elements.filter(el => el.type === 'button')
    };

    // 分析每个表单元素的类型和要求
    let result = `📝 **表单分析与填充助手**\n\n`;

    // 表单概览
    result += `🔍 **找到的表单元素:**\n`;
    result += `• **输入字段:** ${formElements.inputs.length}\n`;
    result += `• **文本区域:** ${formElements.textareas.length}\n`;
    result += `• **下拉选择:** ${formElements.selects.length}\n`;
    result += `• **按钮:** ${formElements.buttons.length}\n`;

    // 详细元素分析
    if (formElements.inputs.length > 0) {
      result += `\n📊 **输入字段分析:**\n`;
      formElements.inputs.forEach((input, index) => {
        const elementState = formAnalysis.elements.find(el => el.id === input.id);
        result += `${index + 1}. **${input.name}**\n`;
        result += `   • 元素 ID: ${input.id}\n`;
        result += `   • 就绪状态: ${elementState?.ready ? '是' : '否'}\n`;
        result += `   • 必填项: ${input.name.includes('*') ? '是' : '未知'}\n`;

        // 根据名称建议字段类型
        const fieldName = input.name.toLowerCase();
        if (fieldName.includes('email')) {
          result += `   • **建议类型:** 邮箱地址\n`;
        } else if (fieldName.includes('name')) {
          result += `   • **建议类型:** 姓名字段\n`;
        } else if (fieldName.includes('phone')) {
          result += `   • **建议类型:** 电话号码\n`;
        } else if (fieldName.includes('password')) {
          result += `   • **建议类型:** 密码\n`;
        } else {
          result += `   • **建议类型:** 通用文本输入\n`;
        }
      });
    }

    // 文本区域分析
    if (formElements.textareas.length > 0) {
      result += `\n📝 **文本区域分析:**\n`;
      formElements.textareas.forEach((textarea, index) => {
        result += `${index + 1}. **${textarea.name}**\n`;
        result += `   • 元素 ID: ${textarea.id}\n`;
        result += `   • **建议使用:** 长文本输入\n`;
      });
    }

    // 提交按钮
    if (formElements.buttons.length > 0) {
      result += `\n🔘 **提交按钮:**\n`;
      const submitButtons = formElements.buttons.filter(btn =>
        btn.name.toLowerCase().includes('submit') ||
        btn.name.toLowerCase().includes('send') ||
        btn.name.toLowerCase().includes('save')
      );

      submitButtons.forEach((button, index) => {
        result += `${index + 1}. **${button.name}** (ID: ${button.id})\n`;
      });
    }

    // 表单类型检测
    result += `\n🎯 **检测到的表单类型:**\n`;
    result += `• **自动检测:** 未知\n`;
    result += `• **用户指定:** ${form_type}\n`;

    // 填充建议
    result += `\n💡 **填充建议:**\n`;
    if (formElements.inputs.length > 0) {
      result += `• 从必填字段开始（标记为 *）\n`;
      result += `• 使用提供的元素 ID 进行精确填充\n`;
      result += `• 最终提交前测试表单验证\n`;
    }

    // 可填充元素
    const readyElements = formAnalysis.elements.filter(el => el.ready);
    result += `\n✅ **可填充:** ${readyElements.length} 个元素已准备好交互\n`;

    if (readyElements.length > 0) {
      result += `**下一步:**\n`;
      result += `1. 使用 element_fill 和提供的元素 ID\n`;
      result += `2. 先填充必填字段\n`;
      result += `3. 提交前检查表单\n`;
      result += `4. 准备好后点击适当的提交按钮\n`;
    }

    return result;

  } catch (error) {
    throw new Error(`表单分析工作流失败: ${error.message}`);
  }
}

module.exports = {
  executeFillFormWorkflow
};
