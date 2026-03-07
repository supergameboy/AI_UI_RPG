/**
 * 动态 UI 工具函数
 */

/**
 * 解析属性字符串为对象
 * 例如: `{value=75 max=100 label="生命值"}` -> { value: '75', max: '100', label: '生命值' }
 */
export function parseAttrs(attrsString: string): Record<string, string> {
  const result: Record<string, string> = {};
  
  if (!attrsString || attrsString.trim() === '') {
    return result;
  }
  
  // 匹配 key=value 或 key="value with spaces" 格式
  const regex = /(\w+)=("(?:[^"\\]|\\.)*"|[^\s}]+)/g;
  let match;
  
  while ((match = regex.exec(attrsString)) !== null) {
    const key = match[1];
    let value = match[2];
    
    // 移除引号
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }
    
    result[key] = value;
  }
  
  return result;
}

/**
 * 解析选项格式 [文本](action:xxx)
 */
export function parseOptions(content: string): Array<{ text: string; action: string; disabled?: boolean }> {
  const options: Array<{ text: string; action: string; disabled?: boolean }> = [];
  const regex = /\[([^\]]+)\]\(action:([^)\s]+)(?:\s+disabled)?\)/g;
  let match;
  
  while ((match = regex.exec(content)) !== null) {
    options.push({
      text: match[1],
      action: match[2],
      disabled: content.includes('disabled'),
    });
  }
  
  return options;
}

/**
 * 解析标签页格式 [标签名](tab:xxx)
 */
export function parseTabs(content: string): Array<{ label: string; id: string; content: string }> {
  const tabs: Array<{ label: string; id: string; content: string }> = [];
  const lines = content.split('\n');
  let currentTab: { label: string; id: string; content: string } | null = null;
  let currentContent: string[] = [];
  
  for (const line of lines) {
    const match = line.match(/\[([^\]]+)\]\(tab:([^)\s]+)\)/);
    if (match) {
      if (currentTab) {
        currentTab.content = currentContent.join('\n').trim();
        tabs.push(currentTab);
      }
      currentTab = { label: match[1], id: match[2], content: '' };
      currentContent = [];
    } else if (currentTab) {
      currentContent.push(line);
    }
  }
  
  if (currentTab) {
    currentTab.content = currentContent.join('\n').trim();
    tabs.push(currentTab);
  }
  
  return tabs;
}

/**
 * 解析悬浮提示格式 [文本](tooltip:提示内容)
 */
export function parseTooltips(content: string): Array<{ text: string; tooltip: string }> {
  const tooltips: Array<{ text: string; tooltip: string }> = [];
  const regex = /\[([^\]]+)\]\(tooltip:([^)]+)\)/g;
  let match;
  
  while ((match = regex.exec(content)) !== null) {
    tooltips.push({
      text: match[1],
      tooltip: match[2],
    });
  }
  
  return tooltips;
}

/**
 * 预处理 Markdown 内容
 * 将 :::component-name{attrs}content::: 转换为带标记的 HTML
 */
export function preprocessMarkdown(content: string): string {
  // 匹配 :::component-name{attrs}content::: 格式
  return content.replace(
    /:::(\w+(?:-\w+)*)\s*(?:\{([^}]*)\})?([\s\S]*?):::/g,
    (_match, componentName, attrs, innerContent) => {
      const className = `dynamic-ui-${componentName}`;
      // 对属性进行 HTML 编码
      const encodedAttrs = (attrs || '').replace(/"/g, '&quot;');
      return `<div class="${className}" data-attrs="${encodedAttrs}">${innerContent}</div>`;
    }
  );
}

/**
 * 检查条件表达式
 */
export function evaluateCondition(condition: string, context?: Record<string, unknown>): boolean {
  if (!condition) return true;
  
  // 简单的条件解析
  // 支持: hasItem:xxx, level>=10, gold>=100 等
  try {
    // 如果有上下文，尝试评估
    if (context) {
      // 检查 hasItem 条件
      const hasItemMatch = condition.match(/hasItem:(\w+)/);
      if (hasItemMatch && context.items) {
        return (context.items as string[]).includes(hasItemMatch[1]);
      }
      
      // 检查数值比较
      const compareMatch = condition.match(/(\w+)(>=|<=|>|<|==)(\d+)/);
      if (compareMatch && context[compareMatch[1]] !== undefined) {
        const value = Number(context[compareMatch[1]]);
        const target = Number(compareMatch[3]);
        const op = compareMatch[2];
        
        switch (op) {
          case '>=': return value >= target;
          case '<=': return value <= target;
          case '>': return value > target;
          case '<': return value < target;
          case '==': return value === target;
        }
      }
    }
    
    // 默认返回 true
    return true;
  } catch {
    return true;
  }
}
