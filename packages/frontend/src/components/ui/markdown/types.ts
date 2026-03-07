/**
 * 自定义 Markdown 解析器类型定义
 */

/**
 * Token 类型枚举
 */
export type TokenType =
  | 'heading'
  | 'paragraph'
  | 'list'
  | 'listItem'
  | 'table'
  | 'tableRow'
  | 'tableCell'
  | 'tableHeader'
  | 'code'
  | 'codeBlock'
  | 'blockquote'
  | 'bold'
  | 'italic'
  | 'text'
  | 'link'
  | 'actionLink'
  | 'itemLink'
  | 'materialLink'
  | 'tabLink'
  | 'component'
  | 'newline'
  | 'hr'
  | 'image';

/**
 * 自定义协议类型
 */
export type CustomProtocol = 'action' | 'item' | 'material' | 'tab';

/**
 * Token 接口
 */
export interface Token {
  type: TokenType;
  content?: string;
  level?: number;
  href?: string;
  protocol?: CustomProtocol | 'http' | 'https';
  attrs?: Record<string, string>;
  children?: Token[];
  ordered?: boolean;
  language?: string;
  src?: string;
  alt?: string;
}

/**
 * 解析选项
 */
export interface ParseOptions {
  parseComponents?: boolean;
  maxDepth?: number;
}

/**
 * 渲染选项
 */
export interface RenderOptions {
  onAction?: (action: { type: string; payload?: unknown }) => void;
  context?: Record<string, unknown>;
}
