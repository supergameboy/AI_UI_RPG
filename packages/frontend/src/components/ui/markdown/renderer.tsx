/**
 * 自定义 Markdown 渲染器
 * 
 * 将 Token 数组渲染为 React 组件
 */

import React from 'react';
import type { Token } from './types';
import type { DynamicUIAction } from '../dynamic-ui/types';

// 动态 UI 组件
import { OptionsComponent } from '../dynamic-ui/OptionsComponent';
import { ProgressComponent } from '../dynamic-ui/ProgressComponent';
import { TabsComponent } from '../dynamic-ui/TabsComponent';
import { SystemNotifyComponent } from '../dynamic-ui/SystemNotifyComponent';
import { BadgeComponent } from '../dynamic-ui/BadgeComponent';
import { TooltipComponent } from '../dynamic-ui/TooltipComponent';
import { ConditionalComponent } from '../dynamic-ui/ConditionalComponent';
import { EnhancementComponent } from '../dynamic-ui/EnhancementComponent';
import { WarehouseComponent } from '../dynamic-ui/WarehouseComponent';

import styles from './styles.module.css';

/**
 * 动态 UI 组件映射
 */
const DYNAMIC_COMPONENTS: Record<string, React.ComponentType<{
  content: string;
  attrs: Record<string, string>;
  onAction?: (action: DynamicUIAction) => void;
  context?: Record<string, unknown>;
}>> = {
  'options': OptionsComponent,
  'progress': ProgressComponent,
  'tabs': TabsComponent,
  'system-notify': SystemNotifyComponent,
  'badge': BadgeComponent,
  'tooltip': TooltipComponent,
  'conditional': ConditionalComponent,
  'enhancement': EnhancementComponent,
  'warehouse': WarehouseComponent,
};

/**
 * 渲染选项
 */
interface RenderOptions {
  onAction?: (action: DynamicUIAction) => void;
  context?: Record<string, unknown>;
}

/**
 * 渲染子节点
 */
function renderChildren(children: Token[] | undefined, options: RenderOptions): React.ReactNode {
  if (!children || children.length === 0) return null;
  return children.map((child, index) => renderToken(child, index, options));
}

/**
 * 渲染单个 Token
 */
export function renderToken(token: Token, index: number, options: RenderOptions): React.ReactNode {
  const { onAction, context } = options;
  
  switch (token.type) {
    case 'heading': {
      const HeadingTag = `h${token.level}` as keyof JSX.IntrinsicElements;
      return React.createElement(
        HeadingTag,
        { key: index, className: styles[`heading${token.level}`] },
        renderChildren(token.children, options)
      );
    }
    
    case 'paragraph':
      return (
        <p key={index} className={styles.paragraph}>
          {renderChildren(token.children, options)}
        </p>
      );
    
    case 'text':
      return <span key={index}>{token.content}</span>;
    
    case 'bold':
      return (
        <strong key={index} className={styles.bold}>
          {renderChildren(token.children, options)}
        </strong>
      );
    
    case 'italic':
      return (
        <em key={index} className={styles.italic}>
          {renderChildren(token.children, options)}
        </em>
      );
    
    case 'code':
      return (
        <code key={index} className={styles.inlineCode}>
          {token.content}
        </code>
      );
    
    case 'codeBlock':
      return (
        <pre key={index} className={styles.codeBlock}>
          <code className={token.language ? styles[`language-${token.language}`] : ''}>
            {token.content}
          </code>
        </pre>
      );
    
    case 'blockquote':
      return (
        <blockquote key={index} className={styles.blockquote}>
          {renderChildren(token.children, options)}
        </blockquote>
      );
    
    case 'list':
      const ListTag = token.ordered ? 'ol' : 'ul';
      return React.createElement(
        ListTag,
        { key: index, className: styles.list },
        renderChildren(token.children, options)
      );
    
    case 'listItem':
      return (
        <li key={index} className={styles.listItem}>
          {renderChildren(token.children, options)}
        </li>
      );
    
    case 'table':
      return (
        <table key={index} className={styles.table}>
          <tbody>
            {renderChildren(token.children, options)}
          </tbody>
        </table>
      );
    
    case 'tableRow':
      return (
        <tr key={index} className={styles.tableRow}>
          {renderChildren(token.children, options)}
        </tr>
      );
    
    case 'tableHeader':
      return (
        <th key={index} className={styles.tableHeader}>
          {renderChildren(token.children, options)}
        </th>
      );
    
    case 'tableCell':
      return (
        <td key={index} className={styles.tableCell}>
          {renderChildren(token.children, options)}
        </td>
      );
    
    case 'hr':
      return <hr key={index} className={styles.hr} />;
    
    case 'link':
      return (
        <a
          key={index}
          href={token.href}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.link}
        >
          {token.content}
        </a>
      );
    
    case 'actionLink':
      return (
        <button
          key={index}
          type="button"
          className={styles.actionButton}
          onClick={() => onAction?.({ type: token.href || '' })}
        >
          {token.content}
        </button>
      );
    
    case 'itemLink':
      return (
        <button
          key={index}
          type="button"
          className={styles.itemButton}
          onClick={() => onAction?.({
            type: 'item_click',
            payload: { itemId: token.href },
          })}
        >
          {token.content}
        </button>
      );
    
    case 'materialLink':
      return (
        <span key={index} className={styles.materialText}>
          {token.content}
        </span>
      );
    
    case 'tabLink':
      return (
        <span key={index} className={styles.tabText}>
          {token.content}
        </span>
      );
    
    case 'component': {
      const componentName = token.content || '';
      const Component = DYNAMIC_COMPONENTS[componentName];
      
      if (!Component) {
        return (
          <div key={index} className={styles.unknownComponent}>
            <code>:::{componentName}</code>
            {renderChildren(token.children, options)}
          </div>
        );
      }
      
      // 将 children tokens 转换回 Markdown 字符串
      const contentString = tokensToMarkdown(token.children || []);
      
      return (
        <Component
          key={index}
          content={contentString}
          attrs={token.attrs || {}}
          onAction={onAction}
          context={context}
        />
      );
    }
    
    default:
      return null;
  }
}

/**
 * 将 Token 数组转换回 Markdown 字符串
 */
function tokensToMarkdown(tokens: Token[]): string {
  return tokens.map(token => {
    switch (token.type) {
      case 'text':
        return token.content || '';
      case 'bold':
        return `**${tokensToMarkdown(token.children || [])}**`;
      case 'italic':
        return `*${tokensToMarkdown(token.children || [])}*`;
      case 'code':
        return `\`${token.content}\``;
      case 'actionLink':
        return `[${token.content}](action:${token.href})`;
      case 'itemLink':
        return `[${token.content}](item:${token.href})`;
      case 'materialLink':
        return `[${token.content}](material:${token.href})`;
      case 'tabLink':
        return `[${token.content}](tab:${token.href})`;
      case 'link':
        return `[${token.content}](${token.href})`;
      case 'paragraph':
        return tokensToMarkdown(token.children || []) + '\n';
      case 'heading':
        return `${'#'.repeat(token.level || 1)} ${tokensToMarkdown(token.children || [])}\n`;
      case 'listItem':
        return `- ${tokensToMarkdown(token.children || [])}\n`;
      case 'newline':
        return '\n';
      case 'component':
        const attrsStr = token.attrs ? Object.entries(token.attrs).map(([k, v]) => `${k}="${v}"`).join(' ') : '';
        return `:::${token.content}${attrsStr ? `{${attrsStr}}` : ''}\n${tokensToMarkdown(token.children || [])}\n:::\n`;
      default:
        return tokensToMarkdown(token.children || []);
    }
  }).join('');
}

/**
 * 渲染 Token 数组
 */
export function renderTokens(tokens: Token[], options: RenderOptions): React.ReactNode {
  return tokens.map((token, index) => renderToken(token, index, options));
}
