/**
 * Tool 调用示例 - 单次调用示例
 * 展示单次 Tool 调用的标准格式
 */

import type { ToolPermission } from '@ai-rpg/shared';
import { ToolType } from '@ai-rpg/shared';

/**
 * Tool 调用结构
 */
export interface ToolCall {
  toolType: ToolType;
  method: string;
  params: Record<string, unknown>;
  permission: ToolPermission;
}

/**
 * 示例定义
 */
export interface ToolCallExample {
  name: string;
  description: string;
  scenario: string;
  toolCalls: ToolCall[];
  expectedOutput: string;
  notes?: string[];
}

/**
 * 读取操作示例
 * 展示只读权限的单次调用
 */
export const readOperationExample: ToolCallExample = {
  name: 'read_operation',
  description: '读取操作示例 - 只读权限的单次调用',
  scenario: '查询角色的当前状态信息',
  toolCalls: [
    {
      toolType: ToolType.NUMERICAL,
      method: 'getCharacterStats',
      params: {
        characterId: 'player_001',
      },
      permission: 'read',
    },
  ],
  expectedOutput: `{
  "success": true,
  "data": {
    "characterId": "player_001",
    "name": "勇者",
    "level": 8,
    "experience": 2400,
    "attributes": {
      "strength": 15,
      "agility": 12,
      "intelligence": 10,
      "vitality": 14
    },
    "derivedStats": {
      "maxHealth": 140,
      "maxMana": 60,
      "attack": 35,
      "defense": 25
    },
    "statusEffects": []
  },
  "metadata": {
    "duration": 5,
    "cached": false
  }
}`,
  notes: [
    '读取操作使用 read 权限',
    '响应包含 success、data 和 metadata',
    'metadata 包含执行时间和缓存状态',
  ],
};

/**
 * 写入操作示例
 * 展示写入权限的单次调用
 */
export const writeOperationExample: ToolCallExample = {
  name: 'write_operation',
  description: '写入操作示例 - 写入权限的单次调用',
  scenario: '为角色添加经验值',
  toolCalls: [
    {
      toolType: ToolType.NUMERICAL,
      method: 'addExperience',
      params: {
        characterId: 'player_001',
        amount: 500,
      },
      permission: 'write',
    },
  ],
  expectedOutput: `{
  "success": true,
  "data": {
    "previousExperience": 2400,
    "addedExperience": 500,
    "currentExperience": 2900,
    "experienceToNextLevel": 3000,
    "leveledUp": false,
    "newLevel": null
  },
  "metadata": {
    "duration": 12,
    "cached": false
  }
}`,
  notes: [
    '写入操作使用 write 权限',
    '写入操作会被记录到日志',
    '响应包含操作前后的状态对比',
  ],
};

/**
 * 带参数验证的调用示例
 * 展示包含复杂参数的调用
 */
export const complexParamsExample: ToolCallExample = {
  name: 'complex_params',
  description: '带参数验证的调用示例 - 包含复杂参数的调用',
  scenario: '计算复杂的伤害结果',
  toolCalls: [
    {
      toolType: ToolType.NUMERICAL,
      method: 'calculateDamage',
      params: {
        params: {
          attackerId: 'player_001',
          targetId: 'enemy_dragon_001',
          baseDamage: 100,
          damageType: 'physical',
          critical: true,
          criticalMultiplier: 2.0,
          modifiers: [
            { type: 'add', value: 20, source: 'weapon_bonus' },
            { type: 'multiply', value: 1.5, source: 'skill_multiplier' },
            { type: 'add', value: -30, source: 'target_armor' },
          ],
          elementalBonus: {
            type: 'fire',
            value: 25,
          },
        },
      },
      permission: 'read',
    },
  ],
  expectedOutput: `{
  "success": true,
  "data": {
    "baseDamage": 100,
    "criticalMultiplier": 2.0,
    "isCritical": true,
    "modifiersApplied": [
      { "type": "add", "value": 20, "description": "武器加成" },
      { "type": "multiply", "value": 1.5, "description": "技能倍率" },
      { "type": "add", "value": -30, "description": "目标护甲减免" }
    ],
    "elementalBonus": {
      "type": "fire",
      "value": 25
    },
    "finalDamage": 275,
    "breakdown": {
      "baseAfterCrit": 200,
      "afterWeaponBonus": 220,
      "afterSkillMultiplier": 330,
      "afterArmorReduction": 300,
      "afterElemental": 275
    }
  }
}`,
  notes: [
    '复杂参数使用嵌套对象结构',
    '参数会被验证和类型检查',
    '响应包含详细的计算过程',
  ],
};

/**
 * 错误处理示例
 * 展示调用失败时的响应格式
 */
export const errorHandlingExample: ToolCallExample = {
  name: 'error_handling',
  description: '错误处理示例 - 调用失败时的响应',
  scenario: '尝试对不存在的角色进行操作',
  toolCalls: [
    {
      toolType: ToolType.NUMERICAL,
      method: 'getCharacter',
      params: {
        characterId: 'non_existent_player',
      },
      permission: 'read',
    },
  ],
  expectedOutput: `{
  "success": false,
  "error": {
    "code": "CHARACTER_NOT_FOUND",
    "message": "Character not found: non_existent_player",
    "details": {
      "characterId": "non_existent_player",
      "suggestion": "请检查角色ID是否正确"
    }
  }
}`,
  notes: [
    '错误响应 success 为 false',
    'error 对象包含错误码和消息',
    'details 提供额外的错误信息',
  ],
};

/**
 * 权限不足示例
 * 展示权限验证失败的响应
 */
export const permissionDeniedExample: ToolCallExample = {
  name: 'permission_denied',
  description: '权限不足示例 - 权限验证失败',
  scenario: '使用只读权限尝试写入操作',
  toolCalls: [
    {
      toolType: ToolType.INVENTORY_DATA,
      method: 'addItem',
      params: {
        saveId: 'save_001',
        characterId: 'player_001',
        item: {
          id: 'item_gold',
          name: '金币',
          type: 'currency',
          value: 100,
        },
        quantity: 100,
      },
      permission: 'read',
    },
  ],
  expectedOutput: `{
  "success": false,
  "error": {
    "code": "PERMISSION_DENIED",
    "message": "Method 'addItem' is a write method but only read permission was granted",
    "details": {
      "method": "addItem",
      "permission": "read",
      "requiredPermission": "write"
    }
  }
}`,
  notes: [
    '写入方法需要 write 权限',
    '权限验证在执行前进行',
    '错误信息说明需要的权限',
  ],
};

/**
 * 缓存命中示例
 * 展示缓存命中时的响应
 */
export const cacheHitExample: ToolCallExample = {
  name: 'cache_hit',
  description: '缓存命中示例 - 响应来自缓存',
  scenario: '重复查询相同数据时命中缓存',
  toolCalls: [
    {
      toolType: ToolType.SKILL_DATA,
      method: 'getAllTemplates',
      params: {},
      permission: 'read',
    },
  ],
  expectedOutput: `{
  "success": true,
  "data": [
    { "id": "template_fireball", "name": "火球术", ... },
    { "id": "template_heal", "name": "治疗术", ... },
    ...
  ],
  "metadata": {
    "duration": 1,
    "cached": true,
    "cacheAge": 45000
  }
}`,
  notes: [
    '缓存命中时 cached 为 true',
    'duration 通常非常短',
    'cacheAge 表示缓存存在时间',
  ],
};

/**
 * 导出所有单次调用示例
 */
export const singleCallExamples: ToolCallExample[] = [
  readOperationExample,
  writeOperationExample,
  complexParamsExample,
  errorHandlingExample,
  permissionDeniedExample,
  cacheHitExample,
];
