import type {
  ParsedOutput,
  ParsedToolCall,
  ParseError,
  ParserConfig,
  ToolType,
  ToolPermission,
} from '@ai-rpg/shared';
import { DEFAULT_PARSER_CONFIG, ToolType as ToolTypeEnum } from '@ai-rpg/shared';
import { gameLog } from './GameLogService';

/**
 * Agent 输出解析器服务
 * 负责解析 Agent 的输出内容，提取思考过程、JSON 结构化输出和 Tool 调用
 */
export class AgentOutputParser {
  private config: ParserConfig;

  constructor(config?: Partial<ParserConfig>) {
    this.config = {
      ...DEFAULT_PARSER_CONFIG,
      ...config,
      jsonRepair: {
        ...DEFAULT_PARSER_CONFIG.jsonRepair,
        ...config?.jsonRepair,
      },
    };
  }

  /**
   * 解析 Agent 输出
   * @param output Agent 的原始输出字符串
   * @returns 解析后的输出对象
   */
  parse(output: string): ParsedOutput {
    if (!output || typeof output !== 'string') {
      return {
        content: '',
        raw: output || '',
        parseErrors: [{
          type: 'unknown',
          message: 'Output is empty or not a string',
        }],
      };
    }

    const result: ParsedOutput = {
      content: '',
      raw: output,
    };

    const parseErrors: ParseError[] = [];
    let processedContent = output;

    // 1. 提取思考内容
    if (this.config.extractThinking) {
      const thinkingResult = this.extractThinking(processedContent);
      if (thinkingResult.content !== undefined) {
        result.thinking = thinkingResult.content;
        if (!this.config.preserveTags) {
          processedContent = thinkingResult.remaining;
        }
      }
      if (thinkingResult.error) {
        parseErrors.push(thinkingResult.error);
      }
    }

    // 2. 提取 Tool 调用
    if (this.config.extractToolCalls) {
      const toolCallsResult = this.extractToolCalls(processedContent);
      if (toolCallsResult.calls.length > 0) {
        result.toolCalls = toolCallsResult.calls;
        if (!this.config.preserveTags) {
          processedContent = toolCallsResult.remaining;
        }
      }
      parseErrors.push(...toolCallsResult.errors);
    }

    // 3. 提取 JSON
    if (this.config.extractJSON) {
      const jsonResult = this.extractJSON(processedContent);
      if (jsonResult.json !== undefined) {
        result.json = jsonResult.json;
        if (!this.config.preserveTags) {
          processedContent = jsonResult.remaining;
        }
      }
      if (jsonResult.error) {
        parseErrors.push(jsonResult.error);
      }
    }

    // 4. 清理最终内容
    result.content = this.cleanContent(processedContent);

    // 5. 添加解析错误（如果有）
    if (parseErrors.length > 0) {
      result.parseErrors = parseErrors;
      gameLog.warn('agent', 'Agent output parsing completed with errors', {
        errorCount: parseErrors.length,
        errors: parseErrors.map(e => e.message),
      });
    } else {
      gameLog.debug('agent', 'Agent output parsed successfully', {
        hasThinking: !!result.thinking,
        hasJSON: !!result.json,
        toolCallCount: result.toolCalls?.length || 0,
        contentLength: result.content.length,
      });
    }

    return result;
  }

  /**
   * 提取思考内容
   * @param output 输出字符串
   * @returns 提取结果
   */
  extractThinking(output: string): { content?: string; remaining: string; error?: ParseError } {
    const thinkingRegex = /<thinking>([\s\S]*?)<\/thinking>/gi;
    const thinkingParts: string[] = [];
    let remaining = output;
    let matchFound = false;

    let match: RegExpExecArray | null;
    while ((match = thinkingRegex.exec(output)) !== null) {
      matchFound = true;
      const content = match[1].trim();
      if (content) {
        thinkingParts.push(content);
      }
      // 移除匹配的标签
      remaining = remaining.replace(match[0], '');
    }

    if (!matchFound) {
      return { remaining: output };
    }

    const content = thinkingParts.join('\n\n');
    
    if (this.config.maxContentLength && content.length > this.config.maxContentLength) {
      return {
        content: content.substring(0, this.config.maxContentLength) + '... [truncated]',
        remaining,
      };
    }

    return { content, remaining };
  }

  /**
   * 提取 JSON 内容
   * @param output 输出字符串
   * @returns 提取结果
   */
  extractJSON(output: string): { json?: Record<string, unknown>; remaining: string; error?: ParseError } {
    let remaining = output;
    let json: Record<string, unknown> | undefined;

    // 1. 尝试提取 ```json 代码块
    const codeBlockResult = this.extractJSONFromCodeBlock(remaining);
    if (codeBlockResult.json) {
      json = codeBlockResult.json;
      remaining = codeBlockResult.remaining;
      return { json, remaining, error: codeBlockResult.error };
    }

    // 2. 尝试提取花括号包围的 JSON
    const braceResult = this.extractJSONFromBraces(remaining);
    if (braceResult.json) {
      json = braceResult.json;
      remaining = braceResult.remaining;
      return { json, remaining, error: braceResult.error };
    }

    // 3. 尝试提取数组格式的 JSON
    const arrayResult = this.extractJSONArray(remaining);
    if (arrayResult.json) {
      json = arrayResult.json;
      remaining = arrayResult.remaining;
      return { json, remaining, error: arrayResult.error };
    }

    return { remaining };
  }

  /**
   * 从 ```json 代码块提取 JSON
   */
  private extractJSONFromCodeBlock(output: string): {
    json?: Record<string, unknown>;
    remaining: string;
    error?: ParseError;
  } {
    const codeBlockRegex = /```json\s*([\s\S]*?)```/gi;
    const match = codeBlockRegex.exec(output);

    if (!match) {
      return { remaining: output };
    }

    const jsonStr = match[1].trim();
    const remaining = output.replace(match[0], '');

    const parseResult = this.tryParseJSON(jsonStr);
    if (parseResult.json) {
      return { json: parseResult.json, remaining };
    }

    return {
      remaining,
      error: {
        type: 'json_parse',
        message: `Failed to parse JSON from code block: ${parseResult.error}`,
        fragment: jsonStr.substring(0, 100),
      },
    };
  }

  /**
   * 从花括号提取 JSON
   */
  private extractJSONFromBraces(output: string): {
    json?: Record<string, unknown>;
    remaining: string;
    error?: ParseError;
  } {
    // 找到第一个 { 和匹配的 }
    const startIndex = output.indexOf('{');
    if (startIndex === -1) {
      return { remaining: output };
    }

    let braceCount = 0;
    let endIndex = -1;
    let inString = false;
    let escapeNext = false;

    for (let i = startIndex; i < output.length; i++) {
      const char = output[i];

      if (escapeNext) {
        escapeNext = false;
        continue;
      }

      if (char === '\\') {
        escapeNext = true;
        continue;
      }

      if (char === '"') {
        inString = !inString;
        continue;
      }

      if (!inString) {
        if (char === '{') {
          braceCount++;
        } else if (char === '}') {
          braceCount--;
          if (braceCount === 0) {
            endIndex = i;
            break;
          }
        }
      }
    }

    if (endIndex === -1) {
      return { remaining: output };
    }

    const jsonStr = output.substring(startIndex, endIndex + 1);
    const remaining = output.substring(0, startIndex) + output.substring(endIndex + 1);

    const parseResult = this.tryParseJSON(jsonStr);
    if (parseResult.json) {
      return { json: parseResult.json, remaining };
    }

    return {
      remaining: output,
      error: {
        type: 'json_parse',
        message: `Failed to parse JSON from braces: ${parseResult.error}`,
        fragment: jsonStr.substring(0, 100),
        position: { start: startIndex, end: endIndex },
      },
    };
  }

  /**
   * 提取 JSON 数组
   */
  private extractJSONArray(output: string): {
    json?: Record<string, unknown>;
    remaining: string;
    error?: ParseError;
  } {
    const startIndex = output.indexOf('[');
    if (startIndex === -1) {
      return { remaining: output };
    }

    let bracketCount = 0;
    let endIndex = -1;
    let inString = false;
    let escapeNext = false;

    for (let i = startIndex; i < output.length; i++) {
      const char = output[i];

      if (escapeNext) {
        escapeNext = false;
        continue;
      }

      if (char === '\\') {
        escapeNext = true;
        continue;
      }

      if (char === '"') {
        inString = !inString;
        continue;
      }

      if (!inString) {
        if (char === '[') {
          bracketCount++;
        } else if (char === ']') {
          bracketCount--;
          if (bracketCount === 0) {
            endIndex = i;
            break;
          }
        }
      }
    }

    if (endIndex === -1) {
      return { remaining: output };
    }

    const jsonStr = output.substring(startIndex, endIndex + 1);
    const remaining = output.substring(0, startIndex) + output.substring(endIndex + 1);

    const parseResult = this.tryParseJSON(jsonStr);
    if (parseResult.json) {
      // 将数组包装为对象
      return { json: { items: parseResult.json }, remaining };
    }

    return {
      remaining: output,
      error: {
        type: 'json_parse',
        message: `Failed to parse JSON array: ${parseResult.error}`,
        fragment: jsonStr.substring(0, 100),
        position: { start: startIndex, end: endIndex },
      },
    };
  }

  /**
   * 尝试解析 JSON，支持修复
   */
  private tryParseJSON(str: string): { json?: Record<string, unknown>; error?: string } {
    // 首先尝试直接解析
    try {
      const parsed = JSON.parse(str);
      return { json: parsed as Record<string, unknown> };
    } catch {
      // 直接解析失败，尝试修复
    }

    // 如果启用了 JSON 修复
    if (this.config.jsonRepair.enabled) {
      const repaired = this.repairJSON(str);
      if (repaired) {
        try {
          const parsed = JSON.parse(repaired);
          gameLog.debug('agent', 'JSON repaired successfully', {
            originalLength: str.length,
            repairedLength: repaired.length,
          });
          return { json: parsed as Record<string, unknown> };
        } catch {
          // 修复后仍然失败
        }
      }
    }

    return { error: 'Failed to parse JSON' };
  }

  /**
   * 尝试修复 JSON
   */
  private repairJSON(str: string): string | null {
    let repaired = str;

    // 1. 移除尾部逗号
    repaired = repaired.replace(/,\s*([}\]])/g, '$1');

    // 2. 修复未转义的换行符
    repaired = repaired.replace(/\n/g, '\\n');
    repaired = repaired.replace(/\r/g, '\\r');
    repaired = repaired.replace(/\t/g, '\\t');

    // 3. 修复单引号为双引号
    repaired = repaired.replace(/'/g, '"');

    // 4. 修复缺少引号的键名
    repaired = repaired.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');

    // 5. 移除注释
    repaired = repaired.replace(/\/\*[\s\S]*?\*\//g, '');
    repaired = repaired.replace(/\/\/.*$/gm, '');

    // 6. 修复布尔值和 null
    repaired = repaired.replace(/\bTrue\b/g, 'true');
    repaired = repaired.replace(/\bFalse\b/g, 'false');
    repaired = repaired.replace(/\bNone\b/g, 'null');

    return repaired !== str ? repaired : null;
  }

  /**
   * 提取 Tool 调用
   * @param output 输出字符串
   * @returns 提取结果
   */
  extractToolCalls(output: string): {
    calls: ParsedToolCall[];
    remaining: string;
    errors: ParseError[];
  } {
    const calls: ParsedToolCall[] = [];
    const errors: ParseError[] = [];
    let remaining = output;

    // 1. 提取 XML 格式的 Tool 调用
    const xmlResult = this.extractXMLToolCalls(remaining);
    calls.push(...xmlResult.calls);
    errors.push(...xmlResult.errors);
    remaining = xmlResult.remaining;

    // 2. 提取 JSON 格式的 Tool 调用
    const jsonResult = this.extractJSONToolCalls(remaining);
    calls.push(...jsonResult.calls);
    errors.push(...jsonResult.errors);
    remaining = jsonResult.remaining;

    // 3. 提取函数调用格式
    const funcResult = this.extractFunctionCallToolCalls(remaining);
    calls.push(...funcResult.calls);
    errors.push(...funcResult.errors);
    remaining = funcResult.remaining;

    return { calls, remaining, errors };
  }

  /**
   * 提取 XML 格式的 Tool 调用
   * 格式: <tool_call tool="xxx" method="xxx" permission="read|write">params</tool_call}
   */
  private extractXMLToolCalls(output: string): {
    calls: ParsedToolCall[];
    remaining: string;
    errors: ParseError[];
  } {
    const calls: ParsedToolCall[] = [];
    const errors: ParseError[] = [];
    let remaining = output;

    // 匹配 <tool_call ...>...</tool_call} 格式
    const toolCallRegex = /<tool_call\s+([^>]+)>([\s\S]*?)<\/tool_call>/gi;
    
    let match: RegExpExecArray | null;
    while ((match = toolCallRegex.exec(output)) !== null) {
      const attrsStr = match[1];
      const paramsStr = match[2].trim();

      // 解析属性
      const toolTypeMatch = attrsStr.match(/tool=["']([^"']+)["']/i);
      const methodMatch = attrsStr.match(/method=["']([^"']+)["']/i);
      const permissionMatch = attrsStr.match(/permission=["']([^"']+)["']/i);

      if (!toolTypeMatch || !methodMatch) {
        errors.push({
          type: 'tool_call_parse',
          message: 'Missing required attributes (tool or method)',
          fragment: match[0].substring(0, 100),
        });
        continue;
      }

      const toolType = toolTypeMatch[1] as ToolType;
      const method = methodMatch[1];
      const permission = (permissionMatch?.[1] || 'read') as ToolPermission;

      // 验证 ToolType
      if (!Object.values(ToolTypeEnum).includes(toolType)) {
        errors.push({
          type: 'tool_call_parse',
          message: `Invalid tool type: ${toolType}`,
          fragment: match[0].substring(0, 100),
        });
        continue;
      }

      // 解析参数
      let params: Record<string, unknown> = {};
      if (paramsStr) {
        try {
          params = JSON.parse(paramsStr);
        } catch {
          // 尝试作为键值对解析
          params = this.parseKeyValueParams(paramsStr);
        }
      }

      calls.push({ toolType, method, params, permission });
      remaining = remaining.replace(match[0], '');
    }

    return { calls, remaining, errors };
  }

  /**
   * 提取 JSON 格式的 Tool 调用
   * 格式: {"tool_call": {"tool": "xxx", "method": "xxx", "params": {}, "permission": "read"}}
   */
  private extractJSONToolCalls(output: string): {
    calls: ParsedToolCall[];
    remaining: string;
    errors: ParseError[];
  } {
    const calls: ParsedToolCall[] = [];
    const errors: ParseError[] = [];
    let remaining = output;

    // 匹配包含 tool_call 的 JSON 对象
    const jsonToolCallRegex = /\{[^{}]*"tool_call"\s*:\s*\{[^{}]*\}[^{}]*\}/gi;
    
    let match: RegExpExecArray | null;
    while ((match = jsonToolCallRegex.exec(output)) !== null) {
      try {
        const parsed = JSON.parse(match[0]);
        const toolCall = parsed.tool_call;

        if (toolCall && toolCall.tool && toolCall.method) {
          const toolType = toolCall.tool as ToolType;
          
          // 验证 ToolType
          if (!Object.values(ToolTypeEnum).includes(toolType)) {
            errors.push({
              type: 'tool_call_parse',
              message: `Invalid tool type: ${toolType}`,
              fragment: match[0].substring(0, 100),
            });
            continue;
          }

          calls.push({
            toolType,
            method: toolCall.method,
            params: toolCall.params || {},
            permission: (toolCall.permission || 'read') as ToolPermission,
          });
          remaining = remaining.replace(match[0], '');
        }
      } catch {
        errors.push({
          type: 'tool_call_parse',
          message: 'Failed to parse JSON tool call',
          fragment: match[0].substring(0, 100),
        });
      }
    }

    // 匹配 tool_calls 数组格式
    const jsonArrayRegex = /"tool_calls"\s*:\s*\[[\s\S]*?\]/gi;
    
    let arrayMatch: RegExpExecArray | null;
    while ((arrayMatch = jsonArrayRegex.exec(output)) !== null) {
      try {
        // 提取数组部分
        const arrayStart = arrayMatch[0].indexOf('[');
        const arrayEnd = arrayMatch[0].lastIndexOf(']');
        const arrayStr = arrayMatch[0].substring(arrayStart, arrayEnd + 1);
        const parsedArray = JSON.parse(arrayStr);

        if (Array.isArray(parsedArray)) {
          for (const item of parsedArray) {
            if (item.tool && item.method) {
              const toolType = item.tool as ToolType;
              
              if (!Object.values(ToolTypeEnum).includes(toolType)) {
                errors.push({
                  type: 'tool_call_parse',
                  message: `Invalid tool type: ${toolType}`,
                  fragment: JSON.stringify(item).substring(0, 100),
                });
                continue;
              }

              calls.push({
                toolType,
                method: item.method,
                params: item.params || {},
                permission: (item.permission || 'read') as ToolPermission,
              });
            }
          }
          remaining = remaining.replace(arrayMatch[0], '');
        }
      } catch {
        errors.push({
          type: 'tool_call_parse',
          message: 'Failed to parse tool_calls array',
          fragment: arrayMatch[0].substring(0, 100),
        });
      }
    }

    return { calls, remaining, errors };
  }

  /**
   * 提取函数调用格式的 Tool 调用
   * 格式: tool_type.method(params) 或 TOOL_TYPE.method(params)
   */
  private extractFunctionCallToolCalls(output: string): {
    calls: ParsedToolCall[];
    remaining: string;
    errors: ParseError[];
  } {
    const calls: ParsedToolCall[] = [];
    const errors: ParseError[] = [];
    let remaining = output;

    // 匹配函数调用格式: tool_type.method({...}) 或 tool_type.method(...)
    const funcCallRegex = /([a-z_]+)\.([a-zA-Z_][a-zA-Z0-9_]*)\s*\(([\s\S]*?)\)/gi;
    
    let match: RegExpExecArray | null;
    while ((match = funcCallRegex.exec(output)) !== null) {
      const toolTypeStr = match[1].toLowerCase();
      const method = match[2];
      const paramsStr = match[3].trim();

      // 尝试匹配 ToolType
      const toolType = this.matchToolType(toolTypeStr);
      if (!toolType) {
        continue; // 不是有效的 tool 调用，跳过
      }

      // 解析参数
      let params: Record<string, unknown> = {};
      if (paramsStr) {
        try {
          params = JSON.parse(paramsStr);
        } catch {
          params = this.parseKeyValueParams(paramsStr);
        }
      }

      // 根据方法名推断权限
      const permission = this.inferPermission(toolType, method);

      calls.push({ toolType, method, params, permission });
      remaining = remaining.replace(match[0], '');
    }

    return { calls, remaining, errors };
  }

  /**
   * 匹配 ToolType
   */
  private matchToolType(str: string): ToolType | null {
    const normalized = str.toLowerCase().replace(/-/g, '_');
    
    const mapping: Record<string, ToolType> = {
      'numerical': ToolTypeEnum.NUMERICAL,
      'inventory': ToolTypeEnum.INVENTORY_DATA,
      'inventory_data': ToolTypeEnum.INVENTORY_DATA,
      'skill': ToolTypeEnum.SKILL_DATA,
      'skill_data': ToolTypeEnum.SKILL_DATA,
      'map': ToolTypeEnum.MAP_DATA,
      'map_data': ToolTypeEnum.MAP_DATA,
      'npc': ToolTypeEnum.NPC_DATA,
      'npc_data': ToolTypeEnum.NPC_DATA,
      'quest': ToolTypeEnum.QUEST_DATA,
      'quest_data': ToolTypeEnum.QUEST_DATA,
      'event': ToolTypeEnum.EVENT_DATA,
      'event_data': ToolTypeEnum.EVENT_DATA,
      'dialogue': ToolTypeEnum.DIALOGUE_DATA,
      'dialogue_data': ToolTypeEnum.DIALOGUE_DATA,
      'combat': ToolTypeEnum.COMBAT_DATA,
      'combat_data': ToolTypeEnum.COMBAT_DATA,
      'story': ToolTypeEnum.STORY_DATA,
      'story_data': ToolTypeEnum.STORY_DATA,
      'ui': ToolTypeEnum.UI_DATA,
      'ui_data': ToolTypeEnum.UI_DATA,
    };

    return mapping[normalized] || null;
  }

  /**
   * 根据方法名推断权限
   */
  private inferPermission(_toolType: ToolType, method: string): ToolPermission {
    const readMethods = [
      'get', 'list', 'find', 'search', 'check', 'is', 'has', 'can',
      'calculate', 'query', 'fetch', 'read',
    ];
    
    const methodLower = method.toLowerCase();
    const isRead = readMethods.some(m => methodLower.startsWith(m));
    
    return isRead ? 'read' : 'write';
  }

  /**
   * 解析键值对参数
   */
  private parseKeyValueParams(str: string): Record<string, unknown> {
    const params: Record<string, unknown> = {};
    const pairs = str.split(',');
    
    for (const pair of pairs) {
      const [key, ...valueParts] = pair.split(':');
      if (key && valueParts.length > 0) {
        const value = valueParts.join(':').trim();
        params[key.trim()] = this.parseValue(value);
      }
    }
    
    return params;
  }

  /**
   * 解析单个值
   */
  private parseValue(value: string): unknown {
    const trimmed = value.trim();
    
    // 布尔值
    if (trimmed === 'true') return true;
    if (trimmed === 'false') return false;
    
    // null
    if (trimmed === 'null') return null;
    
    // 数字
    const num = Number(trimmed);
    if (!isNaN(num)) return num;
    
    // 字符串（移除引号）
    if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
        (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
      return trimmed.slice(1, -1);
    }
    
    return trimmed;
  }

  /**
   * 清理内容
   */
  private cleanContent(content: string): string {
    let cleaned = content;
    
    // 移除多余的空白
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
    cleaned = cleaned.replace(/[ \t]{2,}/g, ' ');
    
    // 移除开头和结尾的空白
    cleaned = cleaned.trim();
    
    // 截断超长内容
    if (this.config.maxContentLength && cleaned.length > this.config.maxContentLength) {
      cleaned = cleaned.substring(0, this.config.maxContentLength) + '... [truncated]';
    }
    
    return cleaned;
  }

  /**
   * 验证输出格式
   * @param output 解析后的输出
   * @param schema 可选的 JSON Schema
   * @returns 是否验证通过
   */
  validateOutput(output: ParsedOutput, schema?: object): boolean {
    // 基本验证
    if (!output.raw) {
      return false;
    }

    // 如果有解析错误，检查是否严重
    if (output.parseErrors && output.parseErrors.length > 0) {
      // 如果有 JSON 解析错误但没有 JSON 内容，可能不严重
      const hasJsonError = output.parseErrors.some((e: ParseError) => e.type === 'json_parse');
      if (hasJsonError && !output.json) {
        // 没有 JSON 但期望有 JSON，验证失败
        if (schema) {
          return false;
        }
      }
    }

    // Schema 验证
    if (schema && output.json) {
      return this.validateJSONSchema(output.json, schema);
    }

    return true;
  }

  /**
   * 简单的 JSON Schema 验证
   */
  private validateJSONSchema(data: Record<string, unknown>, schema: object): boolean {
    const schemaObj = schema as Record<string, unknown>;
    
    if (!schemaObj || typeof schemaObj !== 'object') {
      return true;
    }

    // 检查 required 字段
    const required = schemaObj.required as string[] | undefined;
    if (Array.isArray(required)) {
      for (const field of required) {
        if (!(field in data)) {
          gameLog.warn('agent', `Schema validation failed: missing required field '${field}'`);
          return false;
        }
      }
    }

    // 检查类型
    const type = schemaObj.type as string | undefined;
    if (type) {
      const actualType = Array.isArray(data) ? 'array' : typeof data;
      if (actualType !== type) {
        gameLog.warn('agent', `Schema validation failed: expected type '${type}', got '${actualType}'`);
        return false;
      }
    }

    return true;
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<ParserConfig>): void {
    this.config = {
      ...this.config,
      ...config,
      jsonRepair: {
        ...this.config.jsonRepair,
        ...config.jsonRepair,
      },
    };
  }

  /**
   * 获取当前配置
   */
  getConfig(): ParserConfig {
    return { ...this.config };
  }
}

// 单例实例
let agentOutputParser: AgentOutputParser | null = null;

/**
 * 获取 AgentOutputParser 单例
 */
export function getAgentOutputParser(): AgentOutputParser {
  if (!agentOutputParser) {
    agentOutputParser = new AgentOutputParser();
  }
  return agentOutputParser;
}

/**
 * 初始化 AgentOutputParser
 */
export function initializeAgentOutputParser(config?: Partial<ParserConfig>): AgentOutputParser {
  agentOutputParser = new AgentOutputParser(config);
  return agentOutputParser;
}
