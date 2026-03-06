import React, { useMemo, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import styles from './MarkdownRenderer.module.css';
import {
  OptionsComponent,
  ProgressComponent,
  TabsComponent,
  SystemNotifyComponent,
  BadgeComponent,
  TooltipComponent,
  ConditionalComponent,
  EnhancementComponent,
  WarehouseComponent,
} from './extensions';
import type {
  ExtensionComponentProps,
  ProgressComponentProps,
  SystemNotifyComponentProps,
  BadgeComponentProps,
} from './extensions';

export interface MarkdownRendererProps {
  content: string;
  onAction?: (action: string, data?: unknown) => void;
  context?: Record<string, unknown>;
}

interface CustomBlockProps extends ExtensionComponentProps {
  type: string;
  attributes?: Record<string, string>;
  rawContent?: string;
}

const CustomBlock: React.FC<CustomBlockProps> = ({
  type,
  attributes = {},
  rawContent = '',
  onAction,
  context,
  children,
}) => {
  const commonProps = { onAction, context, children };

  switch (type) {
    case 'options':
      return <OptionsComponent rawContent={rawContent} {...commonProps} />;
    case 'progress':
      return (
        <ProgressComponent
          value={parseFloat(attributes.value || '0')}
          max={parseFloat(attributes.max || '100')}
          label={attributes.label}
          color={attributes.color as ProgressComponentProps['color']}
          {...commonProps}
        />
      );
    case 'tabs':
      return (
        <TabsComponent
          rawContent={rawContent}
          defaultTab={attributes.defaultTab}
          {...commonProps}
        />
      );
    case 'system-notify':
      return (
        <SystemNotifyComponent
          type={attributes.type as SystemNotifyComponentProps['type']}
          {...commonProps}
        />
      );
    case 'badge':
      return (
        <BadgeComponent
          color={attributes.color as BadgeComponentProps['color']}
          {...commonProps}
        />
      );
    case 'if':
      return (
        <ConditionalComponent
          condition={attributes.condition || 'true'}
          {...commonProps}
        />
      );
    case 'enhancement':
      return <EnhancementComponent {...commonProps} />;
    case 'warehouse':
      return <WarehouseComponent {...commonProps} />;
    default:
      return <div className={styles.customBlock}>{children}</div>;
  }
};

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  onAction,
  context = {},
}) => {
  const processedContent = useMemo(() => {
    let result = content;
    
    const blockRegex = /:::(\w+)(?:\{([^}]*)\})?\n([\s\S]*?)\n:::/g;
    result = result.replace(blockRegex, (_match, type, attrsStr, innerContent) => {
      const attributes: Record<string, string> = {};
      if (attrsStr) {
        const attrRegex = /(\w+)=(?:"([^"]*)"|(\S+))/g;
        let attrMatch;
        while ((attrMatch = attrRegex.exec(attrsStr)) !== null) {
          attributes[attrMatch[1]] = attrMatch[2] || attrMatch[3];
        }
      }
      
      const escapedContent = innerContent
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      
      return `<div data-custom-block="true" data-block-type="${type}" data-attributes="${encodeURIComponent(JSON.stringify(attributes))}" data-raw-content="${encodeURIComponent(innerContent)}">${escapedContent}</div>`;
    });

    const actionLinkRegex = /\[([^\]]+)\]\(action:([^)\s]+)\)/g;
    result = result.replace(actionLinkRegex, (_match, text, action) => {
      return `<span data-action-link="true" data-action="${action}">${text}</span>`;
    });

    const tooltipLinkRegex = /\[([^\]]+)\]\(tooltip:([^)]+)\)/g;
    result = result.replace(tooltipLinkRegex, (_match, text, tooltipText) => {
      return `<span data-tooltip="true" data-tooltip-text="${tooltipText}">${text}</span>`;
    });

    return result;
  }, [content]);

  const handleActionClick = useCallback(
    (action: string) => {
      onAction?.(action, context);
    },
    [onAction, context]
  );

  const components = useMemo(
    () => ({
      div: ({ node, children, ...props }: React.HTMLAttributes<HTMLDivElement> & { node?: { properties?: Record<string, unknown> } }) => {
        const properties = node?.properties || {};
        
        if (properties['dataCustomBlock']) {
          const blockType = properties['dataBlockType'] as string;
          const attributes = properties['dataAttributes']
            ? JSON.parse(decodeURIComponent(properties['dataAttributes'] as string))
            : {};
          const rawContent = properties['dataRawContent']
            ? decodeURIComponent(properties['dataRawContent'] as string)
            : '';
          
          return (
            <CustomBlock
              type={blockType}
              attributes={attributes}
              rawContent={rawContent}
              onAction={onAction}
              context={context}
            >
              {children}
            </CustomBlock>
          );
        }
        
        return <div {...props}>{children}</div>;
      },
      span: ({ node, children, ...props }: React.HTMLAttributes<HTMLSpanElement> & { node?: { properties?: Record<string, unknown> } }) => {
        const properties = node?.properties || {};
        
        if (properties['dataActionLink']) {
          const action = properties['dataAction'] as string;
          return (
            <span
              className={styles.actionLink}
              onClick={() => handleActionClick(action)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleActionClick(action);
                }
              }}
            >
              {children}
            </span>
          );
        }
        
        if (properties['dataTooltip']) {
          const tooltipText = properties['dataTooltipText'] as string;
          return (
            <TooltipComponent tooltipText={tooltipText}>
              <span className={styles.tooltipLink}>{children}</span>
            </TooltipComponent>
          );
        }
        
        return <span {...props}>{children}</span>;
      },
      a: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
        if (href?.startsWith('action:')) {
          const action = href.slice(7);
          return (
            <span
              className={styles.actionLink}
              onClick={() => handleActionClick(action)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleActionClick(action);
                }
              }}
            >
              {children}
            </span>
          );
        }
        
        if (href?.startsWith('tooltip:')) {
          const tooltipText = href.slice(8);
          return (
            <TooltipComponent tooltipText={tooltipText}>
              <span className={styles.tooltipLink}>{children}</span>
            </TooltipComponent>
          );
        }
        
        return (
          <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
            {children}
          </a>
        );
      },
    }),
    [onAction, context, handleActionClick]
  );

  return (
    <div className={styles.markdownRenderer}>
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
