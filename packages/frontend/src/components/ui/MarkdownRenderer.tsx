import React, { useMemo, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import type { DynamicUIAction } from './dynamic-ui/types';
import { preprocessMarkdown, parseAttrs } from './dynamic-ui/utils';

// 动态 UI 组件
import { OptionsComponent } from './dynamic-ui/OptionsComponent';
import { ProgressComponent } from './dynamic-ui/ProgressComponent';
import { TabsComponent } from './dynamic-ui/TabsComponent';
import { SystemNotifyComponent } from './dynamic-ui/SystemNotifyComponent';
import { BadgeComponent } from './dynamic-ui/BadgeComponent';
import { TooltipComponent } from './dynamic-ui/TooltipComponent';
import { ConditionalComponent } from './dynamic-ui/ConditionalComponent';
import { EnhancementComponent } from './dynamic-ui/EnhancementComponent';
import { WarehouseComponent } from './dynamic-ui/WarehouseComponent';

import styles from './MarkdownRenderer.module.css';

export interface MarkdownRendererProps {
  content: string;
  onAction?: (action: DynamicUIAction) => void;
  className?: string;
  /** 条件渲染的上下文数据 */
  context?: Record<string, unknown>;
}

/**
 * Markdown 动态 UI 渲染器
 * 
 * 支持的扩展语法:
 * - :::options{...} [选项文本](action:action-id) :::
 * - :::progress{value=75 max=100 label="生命值"} :::
 * - :::tabs{...} [标签名](tab:tab-id) 内容 :::
 * - :::notify{type=welcome} 消息内容 :::
 * - :::badge{type=rarity color=gold} 徽章文本 :::
 * - [文本](tooltip:提示内容) - 内联悬浮提示
 * - :::conditional{condition="hasItem:key"} 条件内容 :::
 * - :::enhancement{...} 强化界面 :::
 * - :::warehouse{...} 仓库界面 :::
 */
export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  onAction,
  className,
  context = {},
}) => {
  // 预处理 Markdown 内容
  const processedContent = useMemo(() => {
    return preprocessMarkdown(content);
  }, [content]);

  // 处理动作回调
  const handleAction = useCallback((action: DynamicUIAction) => {
    onAction?.(action);
  }, [onAction]);

  // 自定义组件映射
  const components = useMemo(() => ({
    div: ({ node, className: divClassName, children, ...props }: React.HTMLAttributes<HTMLDivElement> & { node?: unknown }) => {
      const classList = divClassName?.split(' ') || [];
      
      // 检查是否是动态 UI 组件
      const dynamicUIClass = classList.find(c => c.startsWith('dynamic-ui-'));
      
      if (dynamicUIClass) {
        const componentName = dynamicUIClass.replace('dynamic-ui-', '');
        const attrsString = (props as React.HTMLAttributes<HTMLDivElement> & { 'data-attrs'?: string })['data-attrs'] || '';
        const attrs = parseAttrs(attrsString);
        const contentString = typeof children === 'string' ? children : '';
        
        // 根据组件名称渲染对应组件
        switch (componentName) {
          case 'options':
            return (
              <OptionsComponent
                content={contentString}
                attrs={attrs}
                onAction={handleAction}
              />
            );
          case 'progress':
            return (
              <ProgressComponent
                content={contentString}
                attrs={attrs}
                onAction={handleAction}
              />
            );
          case 'tabs':
            return (
              <TabsComponent
                content={contentString}
                attrs={attrs}
                onAction={handleAction}
              />
            );
          case 'notify':
          case 'system-notify':
            return (
              <SystemNotifyComponent
                content={contentString}
                attrs={attrs}
                onAction={handleAction}
              />
            );
          case 'badge':
            return (
              <BadgeComponent
                content={contentString}
                attrs={attrs}
                onAction={handleAction}
              />
            );
          case 'tooltip':
            return (
              <TooltipComponent
                content={contentString}
                attrs={attrs}
                onAction={handleAction}
              />
            );
          case 'conditional':
            return (
              <ConditionalComponent
                content={contentString}
                attrs={attrs}
                onAction={handleAction}
                context={context}
              />
            );
          case 'enhancement':
            return (
              <EnhancementComponent
                content={contentString}
                attrs={attrs}
                onAction={handleAction}
              />
            );
          case 'warehouse':
            return (
              <WarehouseComponent
                content={contentString}
                attrs={attrs}
                onAction={handleAction}
              />
            );
          default:
            // 未知组件，渲染为普通 div
            return (
              <div className={divClassName} {...props}>
                {children}
              </div>
            );
        }
      }
      
      // 普通 div
      return (
        <div className={divClassName} {...props}>
          {children}
        </div>
      );
    },
    // 处理内联 tooltip 链接
    a: ({ node, href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { node?: unknown }) => {
      if (href?.startsWith('tooltip:')) {
        const tooltipText = href.replace('tooltip:', '');
        return (
          <TooltipComponent
            content={typeof children === 'string' ? children : ''}
            attrs={{ text: tooltipText }}
            onAction={handleAction}
          />
        );
      }
      
      if (href?.startsWith('action:')) {
        const actionId = href.replace('action:', '');
        return (
          <button
            type="button"
            className={styles.actionLink}
            onClick={() => handleAction({ type: actionId })}
          >
            {children}
          </button>
        );
      }
      
      // 普通链接
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
          {children}
        </a>
      );
    },
  }), [handleAction, context]);

  return (
    <div className={[styles.container, className].filter(Boolean).join(' ')}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={components}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
