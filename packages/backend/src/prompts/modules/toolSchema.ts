/**
 * Tool Schema 模块
 * 包含 Tool 相关的提示词模板
 */

import type { PromptModule } from './types';

/**
 * Tool 列表描述模板
 */
export const toolListTemplate: PromptModule = {
  name: 'tool_list',
  description: 'Tool 列表描述模板',
  category: 'tool',
  version: '1.0.0',
  variables: [
    {
      name: 'tools',
      type: 'array',
      required: true,
      description: 'Tool 列表',
    },
    {
      name: 'includeDescriptions',
      type: 'boolean',
      required: false,
      default: true,
      description: '是否包含详细描述',
    },
  ],
  content: `# 可用工具列表

以下是你可以使用的工具：

{{#each tools}}
## {{this.name}}

{{#if ../includeDescriptions}}
{{this.description}}
{{/if}}

**类型**: {{this.type}}
**权限**: {{this.permissions}}

{{#if this.methods}}
**可用方法**:
{{#each this.methods}}
- \`{{this.name}}\`: {{this.description}}
{{/each}}
{{/if}}

{{/each}}

## 使用说明

1. 每个工具都有特定的权限要求（read/write/admin）
2. 调用工具时需要指定方法名和参数
3. 工具调用结果将返回给你进行后续处理`,
};

/**
 * 单个 Tool 描述模板
 */
export const toolDescriptionTemplate: PromptModule = {
  name: 'tool_description',
  description: '单个 Tool 详细描述模板',
  category: 'tool',
  version: '1.0.0',
  variables: [
    {
      name: 'toolName',
      type: 'string',
      required: true,
      description: 'Tool 名称',
    },
    {
      name: 'toolDescription',
      type: 'string',
      required: true,
      description: 'Tool 描述',
    },
    {
      name: 'methods',
      type: 'array',
      required: false,
      default: [],
      description: 'Tool 方法列表',
    },
    {
      name: 'permissions',
      type: 'array',
      required: false,
      default: ['read'],
      description: '所需权限',
    },
  ],
  content: `# 工具: {{toolName}}

## 描述

{{toolDescription}}

## 权限要求

{{#each permissions}}
- {{this}}
{{/each}}

## 可用方法

{{#each methods}}
### {{this.name}}

{{this.description}}

**参数**:
{{#each this.params}}
- \`{{this.name}}\` ({{this.type}}{{#if this.required}}, 必需{{/if}}): {{this.description}}
{{/each}}

**返回**: {{this.returnType}}

{{/each}}`,
};

/**
 * Tool 调用格式说明
 */
export const toolCallFormat: PromptModule = {
  name: 'tool_call_format',
  description: 'Tool 调用格式说明',
  category: 'tool',
  version: '1.0.0',
  content: `# Tool 调用格式

## 调用方式

当你需要使用工具时，请使用以下格式：

\`\`\`json
{
  "tool_call": {
    "tool": "工具名称",
    "method": "方法名称",
    "params": {
      "参数名": "参数值"
    }
  }
}
\`\`\`

## 示例

### 查询玩家位置
\`\`\`json
{
  "tool_call": {
    "tool": "map_data",
    "method": "getPlayerLocation",
    "params": {
      "playerId": "player_001"
    }
  }
}
\`\`\`

### 更新背包物品
\`\`\`json
{
  "tool_call": {
    "tool": "inventory_data",
    "method": "addItem",
    "params": {
      "playerId": "player_001",
      "itemId": "sword_001",
      "quantity": 1
    }
  }
}
\`\`\`

## 注意事项

1. 确保工具名称和方法名称正确
2. 参数必须符合方法要求的格式
3. 某些方法需要特定权限
4. 工具调用是同步的，结果会立即返回`,
};

/**
 * Tool 错误处理说明
 */
export const toolErrorHandling: PromptModule = {
  name: 'tool_error_handling',
  description: 'Tool 错误处理说明',
  category: 'tool',
  version: '1.0.0',
  content: `# Tool 错误处理

## 常见错误类型

### 1. 工具不存在
\`\`\`json
{
  "success": false,
  "error": {
    "code": "TOOL_NOT_FOUND",
    "message": "工具 'xxx' 不存在"
  }
}
\`\`\`

### 2. 方法不存在
\`\`\`json
{
  "success": false,
  "error": {
    "code": "METHOD_NOT_FOUND",
    "message": "工具 'xxx' 没有方法 'yyy'"
  }
}
\`\`\`

### 3. 参数错误
\`\`\`json
{
  "success": false,
  "error": {
    "code": "INVALID_PARAMS",
    "message": "参数验证失败",
    "details": {
      "field": "playerId",
      "reason": "必需参数缺失"
    }
  }
}
\`\`\`

### 4. 权限不足
\`\`\`json
{
  "success": false,
  "error": {
    "code": "PERMISSION_DENIED",
    "message": "没有权限执行此操作"
  }
}
\`\`\`

## 错误处理策略

1. **工具不存在**: 检查工具名称拼写，或使用替代方案
2. **方法不存在**: 查阅工具文档，确认可用方法
3. **参数错误**: 根据错误信息修正参数
4. **权限不足**: 联系协调者获取权限或调整策略`,
};

/**
 * Tool Schema 定义模板
 */
export const toolSchemaTemplate: PromptModule = {
  name: 'tool_schema',
  description: 'Tool Schema 定义模板，用于生成工具的 JSON Schema',
  category: 'tool',
  version: '1.0.0',
  variables: [
    {
      name: 'toolName',
      type: 'string',
      required: true,
      description: 'Tool 名称',
    },
    {
      name: 'methods',
      type: 'array',
      required: true,
      description: '方法列表及其参数定义',
    },
  ],
  content: `{
  "name": "{{toolName}}",
  "methods": [
    {{#each methods}}
    {
      "name": "{{this.name}}",
      "description": "{{this.description}}",
      "parameters": {
        "type": "object",
        "properties": {
          {{#each this.params}}
          "{{this.name}}": {
            "type": "{{this.type}}",
            "description": "{{this.description}}"
          }{{#unless @last}},{{/unless}}
          {{/each}}
        },
        "required": [{{#each this.params}}{{#if this.required}}"{{this.name}}"{{#unless @last}}, {{/unless}}{{/if}}{{/each}}]
      }
    }{{#unless @last}},{{/unless}}
    {{/each}}
  ]
}`,
};

/**
 * 所有 Tool Schema 模块列表
 */
export const toolSchemaModules: PromptModule[] = [
  toolListTemplate,
  toolDescriptionTemplate,
  toolCallFormat,
  toolErrorHandling,
  toolSchemaTemplate,
];

/**
 * 根据名称获取 Tool Schema 模块
 */
export function getToolSchemaModule(name: string): PromptModule | undefined {
  return toolSchemaModules.find(m => m.name === name);
}

/**
 * 获取所有 Tool Schema 模块
 */
export function getAllToolSchemaModules(): PromptModule[] {
  return [...toolSchemaModules];
}
