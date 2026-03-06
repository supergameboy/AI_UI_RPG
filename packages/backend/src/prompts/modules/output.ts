/**
 * 输出格式模块
 * 包含 JSON 输出格式、思考标记格式、Tool 调用格式等输出相关的提示词模板
 */

import type { PromptModule } from './types';

/**
 * JSON 输出格式说明
 */
export const jsonOutputFormat: PromptModule = {
  name: 'output_json_format',
  description: 'JSON 输出格式说明',
  category: 'output',
  version: '1.0.0',
  variables: [
    {
      name: 'schema',
      type: 'object',
      required: false,
      description: '输出 JSON Schema',
    },
    {
      name: 'example',
      type: 'object',
      required: false,
      description: '输出示例',
    },
  ],
  content: `# 输出格式要求

你必须以 JSON 格式输出响应。请确保输出是有效的 JSON。

## 输出格式

{{#if schema}}
### JSON Schema

\`\`\`json
{{json schema}}
\`\`\`
{{/if}}

{{#if example}}
### 示例输出

\`\`\`json
{{json example}}
\`\`\`
{{/if}}

## 注意事项

1. 输出必须是有效的 JSON 格式
2. 所有字符串必须使用双引号
3. 不要在 JSON 中添加注释
4. 确保所有必需字段都包含在输出中
5. 数值类型不要用引号包裹`,
};

/**
 * 思考标记格式说明
 */
export const thinkingFormat: PromptModule = {
  name: 'output_thinking_format',
  description: '思考标记格式说明，用于展示 AI 的推理过程',
  category: 'output',
  version: '1.0.0',
  content: `# 思考过程格式

在给出最终答案之前，你可以使用思考标记来展示你的推理过程。

## 格式说明

使用 \`<think\>\` 和 \`</think\>\` 标签包裹你的思考过程：

\`\`\`
<think
这里是你的思考过程...
分析玩家意图...
考虑可能的响应...
决定最佳行动方案...
</think
\`\`\`

## 使用场景

1. **复杂决策**: 需要权衡多个选项时
2. **问题分析**: 需要分解问题时
3. **策略规划**: 需要制定行动计划时
4. **冲突解决**: 需要协调多个因素时

## 注意事项

- 思考过程对玩家不可见
- 思考内容应简洁明了
- 最终答案在思考标签之外给出
- 不要在思考中包含敏感信息`,
};

/**
 * 结构化响应格式
 */
export const structuredResponseFormat: PromptModule = {
  name: 'output_structured_response',
  description: '结构化响应格式说明',
  category: 'output',
  version: '1.0.0',
  variables: [
    {
      name: 'responseType',
      type: 'string',
      required: false,
      default: 'general',
      description: '响应类型',
    },
  ],
  content: `# 结构化响应格式

## 基本结构

\`\`\`json
{
  "success": true,
  "data": {
    "message": "响应消息",
    "details": {}
  },
  "uiInstructions": [],
  "requiresFollowUp": false
}
\`\`\`

## 字段说明

### success (必需)
- 类型: boolean
- 说明: 表示操作是否成功

### data (必需)
- 类型: object
- 说明: 响应数据主体

### uiInstructions (可选)
- 类型: array
- 说明: UI 指令列表，用于更新前端界面

### requiresFollowUp (可选)
- 类型: boolean
- 说明: 是否需要后续处理

## UI 指令格式

\`\`\`json
{
  "type": "update|show|hide|animate|notify|dialog|custom",
  "target": "目标组件ID",
  "action": "操作名称",
  "data": {},
  "options": {
    "duration": 300,
    "easing": "ease-in-out",
    "priority": "normal"
  }
}
\`\`\``,
};

/**
 * 对话输出格式
 */
export const dialogueOutputFormat: PromptModule = {
  name: 'output_dialogue_format',
  description: '对话输出格式说明',
  category: 'output',
  version: '1.0.0',
  content: `# 对话输出格式

## 基本格式

\`\`\`json
{
  "content": "NPC的对话内容",
  "emotion": "neutral",
  "options": [
    {
      "text": "选项文本",
      "type": "continue",
      "effects": {}
    }
  ],
  "metadata": {
    "npcId": "npc_001",
    "dialogueType": "normal"
  }
}
\`\`\`

## 字段说明

### content (必需)
- 类型: string
- 说明: NPC 的对话文本

### emotion (可选)
- 类型: string
- 可选值: neutral, happy, angry, sad, surprised, fearful, disgusted
- 说明: NPC 的情绪状态

### options (可选)
- 类型: array
- 说明: 玩家可选择的对话选项

### 选项类型

- **continue**: 继续对话
- **accept**: 接受（任务/交易等）
- **reject**: 拒绝
- **inquire**: 询问更多信息
- **leave**: 结束对话

## 示例

\`\`\`json
{
  "content": "欢迎来到我的店铺，有什么我可以帮助你的吗？",
  "emotion": "happy",
  "options": [
    {
      "text": "我想买一些物品",
      "type": "continue"
    },
    {
      "text": "我想出售一些东西",
      "type": "continue"
    },
    {
      "text": "只是随便看看",
      "type": "leave"
    }
  ]
}
\`\`\``,
};

/**
 * 战斗输出格式
 */
export const combatOutputFormat: PromptModule = {
  name: 'output_combat_format',
  description: '战斗输出格式说明',
  category: 'output',
  version: '1.0.0',
  content: `# 战斗输出格式

## 战斗行动格式

\`\`\`json
{
  "action": "attack|skill|item|defend|flee",
  "target": "目标ID",
  "skillId": "技能ID（使用技能时）",
  "itemId": "物品ID（使用物品时）",
  "damage": {
    "physical": 0,
    "magical": 0,
    "true": 0
  },
  "effects": [
    {
      "type": "buff|debuff|dot|hot",
      "name": "效果名称",
      "duration": 3,
      "value": 10
    }
  ],
  "message": "行动描述",
  "uiInstructions": []
}
\`\`\`

## 战斗状态更新格式

\`\`\`json
{
  "type": "combat_update",
  "data": {
    "turn": 5,
    "currentActor": "player",
    "combatants": [
      {
        "id": "player_001",
        "name": "玩家",
        "currentHp": 80,
        "maxHp": 100,
        "status": "normal"
      }
    ],
    "log": [
      "玩家使用了普通攻击，造成 20 点伤害"
    ]
  }
}
\`\`\`

## 战斗结束格式

\`\`\`json
{
  "type": "combat_end",
  "data": {
    "result": "victory|defeat|flee",
    "rewards": {
      "experience": 100,
      "gold": 50,
      "items": ["sword_001"]
    },
    "message": "战斗胜利！"
  }
}
\`\`\``,
};

/**
 * 错误响应格式
 */
export const errorOutputFormat: PromptModule = {
  name: 'output_error_format',
  description: '错误响应格式说明',
  category: 'output',
  version: '1.0.0',
  content: `# 错误响应格式

## 基本格式

\`\`\`json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述",
    "details": {}
  }
}
\`\`\`

## 标准错误码

### 通用错误
- **BAD_REQUEST**: 请求格式错误
- **UNAUTHORIZED**: 未授权
- **FORBIDDEN**: 禁止访问
- **NOT_FOUND**: 资源不存在
- **INTERNAL_ERROR**: 内部错误

### 游戏逻辑错误
- **INVALID_ACTION**: 无效操作
- **INSUFFICIENT_RESOURCES**: 资源不足
- **COOLDOWN_ACTIVE**: 冷却中
- **REQUIREMENT_NOT_MET**: 条件不满足
- **LOCATION_RESTRICTED**: 位置限制

### 数据错误
- **VALIDATION_ERROR**: 数据验证失败
- **DATABASE_ERROR**: 数据库错误
- **CACHE_ERROR**: 缓存错误

## 示例

\`\`\`json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_RESOURCES",
    "message": "金币不足",
    "details": {
      "required": 100,
      "current": 50
    }
  }
}
\`\`\``,
};

/**
 * 流式输出格式
 */
export const streamOutputFormat: PromptModule = {
  name: 'output_stream_format',
  description: '流式输出格式说明',
  category: 'output',
  version: '1.0.0',
  content: `# 流式输出格式

## 数据块格式

流式输出使用 Server-Sent Events (SSE) 格式：

\`\`\`
event: message
data: {"type": "content", "content": "文本内容"}

event: message
data: {"type": "tool_call", "tool": "xxx", "method": "yyy"}

event: done
data: {"type": "complete", "usage": {"input": 100, "output": 50}}
\`\`\`

## 事件类型

### content
- 内容块，包含生成的文本

### tool_call
- 工具调用，包含工具名称和方法

### thinking
- 思考过程（可选显示）

### done
- 输出完成，包含使用统计

### error
- 错误信息

## 示例流程

\`\`\`
event: message
data: {"type": "thinking", "content": "分析玩家意图..."}

event: message
data: {"type": "content", "content": "你看到"}

event: message
data: {"type": "content", "content": "前方有一座古老的城堡"}

event: message
data: {"type": "tool_call", "tool": "map_data", "method": "getLocationInfo"}

event: done
data: {"type": "complete", "usage": {"input": 150, "output": 80}}
\`\`\``,
};

/**
 * 多部分响应格式
 */
export const multipartResponseFormat: PromptModule = {
  name: 'output_multipart_format',
  description: '多部分响应格式说明，用于复杂场景',
  category: 'output',
  version: '1.0.0',
  content: `# 多部分响应格式

用于需要同时返回多种类型数据的复杂场景。

## 格式结构

\`\`\`json
{
  "parts": [
    {
      "type": "narration",
      "content": "场景描述文本"
    },
    {
      "type": "dialogue",
      "content": "NPC对话",
      "speaker": "npc_001"
    },
    {
      "type": "action",
      "action": "update_location",
      "data": {"locationId": "loc_002"}
    },
    {
      "type": "ui",
      "instruction": {
        "type": "show",
        "target": "quest_panel",
        "data": {}
      }
    }
  ],
  "metadata": {
    "requiresFollowUp": true,
    "suggestedActions": ["explore", "talk", "rest"]
  }
}
\`\`\`

## 部分类型

### narration
- 场景描述、事件叙述

### dialogue
- NPC 对话内容

### action
- 游戏状态变更操作

### ui
- UI 更新指令

### combat
- 战斗相关数据

### notification
- 通知消息

## 使用场景

1. **场景转换**: 同时描述场景和更新位置
2. **任务触发**: 同时显示对话和更新任务
3. **战斗开始**: 同时描述战斗和初始化战斗状态
4. **多NPC互动**: 同时处理多个NPC的对话`,
};

/**
 * 所有输出格式模块列表
 */
export const outputModules: PromptModule[] = [
  jsonOutputFormat,
  thinkingFormat,
  structuredResponseFormat,
  dialogueOutputFormat,
  combatOutputFormat,
  errorOutputFormat,
  streamOutputFormat,
  multipartResponseFormat,
];

/**
 * 根据名称获取输出格式模块
 */
export function getOutputModule(name: string): PromptModule | undefined {
  return outputModules.find(m => m.name === name);
}

/**
 * 获取所有输出格式模块
 */
export function getAllOutputModules(): PromptModule[] {
  return [...outputModules];
}
