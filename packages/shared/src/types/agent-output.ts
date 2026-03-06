import type { ToolType, ToolPermission } from './tool';

/**
 * 解析后的 Tool 调用
 */
export interface ParsedToolCall {
  /** Tool 类型 */
  toolType: ToolType;
  /** 方法名 */
  method: string;
  /** 调用参数 */
  params: Record<string, unknown>;
  /** 权限类型 */
  permission: ToolPermission;
}

/**
 * 解析后的 Agent 输出
 */
export interface ParsedOutput {
  /** 思考过程（从 <thinking> 标签提取） */
  thinking?: string;
  /** JSON 结构化输出 */
  json?: Record<string, unknown>;
  /** Tool 调用列表 */
  toolCalls?: ParsedToolCall[];
  /** 纯文本内容（去除标签和 JSON 后的内容） */
  content: string;
  /** 原始输出 */
  raw: string;
  /** 解析过程中的错误 */
  parseErrors?: ParseError[];
}

/**
 * 解析错误
 */
export interface ParseError {
  /** 错误类型 */
  type: 'json_parse' | 'tool_call_parse' | 'thinking_parse' | 'unknown';
  /** 错误消息 */
  message: string;
  /** 原始内容片段 */
  fragment?: string;
  /** 位置信息 */
  position?: {
    start: number;
    end: number;
  };
}

/**
 * JSON 修复选项
 */
export interface JSONRepairOptions {
  /** 是否尝试修复 JSON */
  enabled: boolean;
  /** 最大修复尝试次数 */
  maxAttempts: number;
  /** 是否允许部分解析 */
  allowPartial: boolean;
}

/**
 * 解析器配置
 */
export interface ParserConfig {
  /** 是否提取思考内容 */
  extractThinking: boolean;
  /** 是否提取 JSON */
  extractJSON: boolean;
  /** 是否提取 Tool 调用 */
  extractToolCalls: boolean;
  /** JSON 修复选项 */
  jsonRepair: JSONRepairOptions;
  /** 是否保留原始内容中的标签 */
  preserveTags: boolean;
  /** 最大内容长度（用于截断超长内容） */
  maxContentLength: number;
}

/**
 * 默认解析器配置
 */
export const DEFAULT_PARSER_CONFIG: ParserConfig = {
  extractThinking: true,
  extractJSON: true,
  extractToolCalls: true,
  jsonRepair: {
    enabled: true,
    maxAttempts: 3,
    allowPartial: true,
  },
  preserveTags: false,
  maxContentLength: 10000,
};
