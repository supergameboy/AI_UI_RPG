/**
 * 自定义 Markdown 词法分析器
 * 
 * 将 Markdown 文本转换为 Token 数组
 */

import type { Token, CustomProtocol } from './types';

/**
 * 自定义协议正则表达式
 */
const CUSTOM_PROTOCOL_REGEX = /^(action|item|material|tab):(.+)$/;

/**
 * 解析链接 URL，识别自定义协议
 */
function parseLinkUrl(url: string): { protocol: CustomProtocol | 'http' | 'https' | null; href: string } {
  const customMatch = url.match(CUSTOM_PROTOCOL_REGEX);
  if (customMatch) {
    return {
      protocol: customMatch[1] as CustomProtocol,
      href: customMatch[2],
    };
  }
  
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return {
      protocol: url.startsWith('http://') ? 'http' : 'https',
      href: url,
    };
  }
  
  return { protocol: null, href: url };
}

/**
 * 解析行内元素（粗体、斜体、链接、代码）
 */
function parseInlineElements(text: string): Token[] {
  const tokens: Token[] = [];
  let remaining = text;
  
  while (remaining.length > 0) {
    // 查找最近的特殊标记
    const boldIndex = remaining.indexOf('**');
    const italicIndex = remaining.indexOf('*');
    const linkIndex = remaining.indexOf('[');
    const codeIndex = remaining.indexOf('`');
    const componentIndex = remaining.indexOf(':::');
    
    // 找到最近的标记
    const indices: Array<{ index: number; type: string }> = [
      { index: boldIndex, type: 'bold' },
      { index: italicIndex, type: 'italic' },
      { index: linkIndex, type: 'link' },
      { index: codeIndex, type: 'code' },
      { index: componentIndex, type: 'component' },
    ].filter(item => item.index !== -1);
    
    if (indices.length === 0) {
      // 没有更多特殊标记，添加剩余文本
      if (remaining.length > 0) {
        tokens.push({ type: 'text', content: remaining });
      }
      break;
    }
    
    // 按位置排序，找到最近的
    indices.sort((a, b) => a.index - b.index);
    const nearest = indices[0];
    
    // 添加标记前的文本
    if (nearest.index > 0) {
      tokens.push({ type: 'text', content: remaining.slice(0, nearest.index) });
    }
    
    // 处理标记
    if (nearest.type === 'bold') {
      const match = remaining.slice(nearest.index).match(/^\*\*([^*]+)\*\*/);
      if (match) {
        tokens.push({
          type: 'bold',
          children: parseInlineElements(match[1]),
        });
        remaining = remaining.slice(nearest.index + match[0].length);
        continue;
      }
    }
    
    if (nearest.type === 'italic') {
      const match = remaining.slice(nearest.index).match(/^\*([^*]+)\*/);
      if (match) {
        tokens.push({
          type: 'italic',
          children: parseInlineElements(match[1]),
        });
        remaining = remaining.slice(nearest.index + match[0].length);
        continue;
      }
    }
    
    if (nearest.type === 'code') {
      const match = remaining.slice(nearest.index).match(/^`([^`]+)`/);
      if (match) {
        tokens.push({
          type: 'code',
          content: match[1],
        });
        remaining = remaining.slice(nearest.index + match[0].length);
        continue;
      }
    }
    
    if (nearest.type === 'link') {
      const match = remaining.slice(nearest.index).match(/^\[([^\]]+)\]\(([^)]+)\)/);
      if (match) {
        const { protocol, href } = parseLinkUrl(match[2]);
        const linkToken: Token = {
          type: 'link',
          content: match[1],
          href,
          protocol: protocol || undefined,
        };
        
        // 根据协议类型设置 token 类型
        if (protocol === 'action') {
          linkToken.type = 'actionLink';
        } else if (protocol === 'item') {
          linkToken.type = 'itemLink';
        } else if (protocol === 'material') {
          linkToken.type = 'materialLink';
        } else if (protocol === 'tab') {
          linkToken.type = 'tabLink';
        }
        
        tokens.push(linkToken);
        remaining = remaining.slice(nearest.index + match[0].length);
        continue;
      }
    }
    
    // 处理行内组件 :::component-name{attrs}content:::
    if (nearest.type === 'component') {
      // 匹配 :::component-name{attrs}content::: 格式
      const componentMatch = remaining.slice(nearest.index).match(/^:::(\w+(?:-\w+)*)\s*(?:\{([^}]*)\})?([^:]*?):::/);
      if (componentMatch) {
        const componentName = componentMatch[1];
        const attrsString = componentMatch[2] || '';
        const componentContent = componentMatch[3] || '';
        
        // 解析属性
        const attrs: Record<string, string> = {};
        const attrRegex = /(\w+)=("[^"]*"|[^\s}]+)/g;
        let attrMatch;
        while ((attrMatch = attrRegex.exec(attrsString)) !== null) {
          let value = attrMatch[2];
          if (value.startsWith('"') && value.endsWith('"')) {
            value = value.slice(1, -1);
          }
          attrs[attrMatch[1]] = value;
        }
        
        tokens.push({
          type: 'component',
          content: componentName,
          attrs,
          children: componentContent ? [{ type: 'text', content: componentContent }] : [],
        });
        remaining = remaining.slice(nearest.index + componentMatch[0].length);
        continue;
      }
    }
    
    // 如果没有匹配到任何模式，跳过当前字符
    tokens.push({ type: 'text', content: remaining[0] });
    remaining = remaining.slice(1);
  }
  
  return tokens;
}

/**
 * 解析表格行
 */
function parseTableRow(line: string, isHeader: boolean): Token {
  const cells = line
    .split('|')
    .map(cell => cell.trim())
    .filter(cell => cell.length > 0);
  
  return {
    type: 'tableRow',
    children: cells.map(cell => ({
      type: isHeader ? 'tableHeader' : 'tableCell',
      children: parseInlineElements(cell),
    })),
  };
}

/**
 * 检查是否是表格分隔行
 */
function isTableSeparator(line: string): boolean {
  return /^\|?[\s-:|]+\|?$/.test(line.trim());
}

/**
 * 词法分析器
 * 将 Markdown 文本转换为 Token 数组
 */
export function tokenize(markdown: string): Token[] {
  const tokens: Token[] = [];
  const lines = markdown.split('\n');
  let i = 0;
  
  while (i < lines.length) {
    const line = lines[i];
    
    // 空行
    if (line.trim() === '') {
      i++;
      continue;
    }
    
    // 标题
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      tokens.push({
        type: 'heading',
        level: headingMatch[1].length,
        children: parseInlineElements(headingMatch[2]),
      });
      i++;
      continue;
    }
    
    // 水平线
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
      tokens.push({ type: 'hr' });
      i++;
      continue;
    }
    
    // 代码块
    if (line.startsWith('```')) {
      const language = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      
      tokens.push({
        type: 'codeBlock',
        language,
        content: codeLines.join('\n'),
      });
      i++; // 跳过结束的 ```
      continue;
    }
    
    // 引用
    if (line.startsWith('> ')) {
      tokens.push({
        type: 'blockquote',
        children: parseInlineElements(line.slice(2)),
      });
      i++;
      continue;
    }
    
    // 无序列表
    const unorderedMatch = line.match(/^[-*]\s+(.+)$/);
    if (unorderedMatch) {
      const listItems: Token[] = [];
      
      while (i < lines.length) {
        const itemMatch = lines[i].match(/^[-*]\s+(.+)$/);
        if (!itemMatch) break;
        listItems.push({
          type: 'listItem',
          children: parseInlineElements(itemMatch[1]),
        });
        i++;
      }
      
      tokens.push({
        type: 'list',
        ordered: false,
        children: listItems,
      });
      continue;
    }
    
    // 有序列表
    const orderedMatch = line.match(/^\d+\.\s+(.+)$/);
    if (orderedMatch) {
      const listItems: Token[] = [];
      
      while (i < lines.length) {
        const itemMatch = lines[i].match(/^\d+\.\s+(.+)$/);
        if (!itemMatch) break;
        listItems.push({
          type: 'listItem',
          children: parseInlineElements(itemMatch[1]),
        });
        i++;
      }
      
      tokens.push({
        type: 'list',
        ordered: true,
        children: listItems,
      });
      continue;
    }
    
    // 表格
    if (line.startsWith('|')) {
      const tableRows: Token[] = [];
      let isHeader = true;
      
      while (i < lines.length && lines[i].startsWith('|')) {
        if (!isTableSeparator(lines[i])) {
          tableRows.push(parseTableRow(lines[i], isHeader));
          isHeader = false;
        }
        i++;
      }
      
      tokens.push({
        type: 'table',
        children: tableRows,
      });
      continue;
    }
    
    // 动态 UI 组件 :::component-name{attrs}
    const componentMatch = line.match(/^:::(\w+(?:-\w+)*)\s*(?:\{([^}]*)\})?$/);
    if (componentMatch) {
      const componentName = componentMatch[1];
      const attrsString = componentMatch[2] || '';
      
      // 解析属性
      const attrs: Record<string, string> = {};
      const attrRegex = /(\w+)=("[^"]*"|[^\s}]+)/g;
      let attrMatch;
      while ((attrMatch = attrRegex.exec(attrsString)) !== null) {
        let value = attrMatch[2];
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.slice(1, -1);
        }
        attrs[attrMatch[1]] = value;
      }
      
      // 查找结束标记 :::
      const contentLines: string[] = [];
      let depth = 1;
      i++;
      
      while (i < lines.length && depth > 0) {
        const currentLine = lines[i];
        if (currentLine.match(/^:::(\w+(?:-\w+)*)/)) {
          depth++;
          contentLines.push(currentLine);
        } else if (currentLine.trim() === ':::') {
          depth--;
          if (depth > 0) {
            contentLines.push(currentLine);
          }
        } else {
          contentLines.push(currentLine);
        }
        i++;
      }
      
      tokens.push({
        type: 'component',
        content: componentName,
        attrs,
        children: tokenize(contentLines.join('\n')),
      });
      continue;
    }
    
    // 普通段落
    tokens.push({
      type: 'paragraph',
      children: parseInlineElements(line),
    });
    i++;
  }
  
  return tokens;
}
