import React, { useMemo } from 'react';
import type { DynamicUIAction } from './dynamic-ui/types';
import { tokenize, renderTokens } from './markdown';

import styles from './MarkdownRenderer.module.css';

/**
 * Markdown 渲染器属性
 */
export interface MarkdownRendererProps {
  content: string;
  onAction?: (action: DynamicUIAction) => void;
  context?: Record<string, unknown>;
}

/**
 * Markdown 渲染器
 * 
 * 使用自定义解析器，支持：
 * - 标准 Markdown 语法
 * - 自定义协议链接（action:, item:, material:, tab:）
 * - 动态 UI 组件（:::component-name{attrs}...:::）
 */
export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  onAction,
  context,
}) => {
  // 解析 Markdown 内容
  const tokens = useMemo(() => tokenize(content), [content]);
  
  // 渲染 Tokens
  const rendered = useMemo(() => 
    renderTokens(tokens, { onAction, context }),
    [tokens, onAction, context]
  );
  
  return (
    <div className={styles.container}>
      {rendered}
    </div>
  );
};

export default MarkdownRenderer;
