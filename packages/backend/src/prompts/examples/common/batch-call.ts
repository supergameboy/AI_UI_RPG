/**
 * Tool 调用示例 - 批量调用示例
 * 展示批量并行调用的格式
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
 * 并行读取示例
 * 展示同时发起多个读取操作
 */
export const parallelReadExample: ToolCallExample = {
  name: 'parallel_read',
  description: '并行读取示例 - 同时发起多个读取操作',
  scenario: '同时获取玩家状态、背包和技能信息',
  toolCalls: [
    {
      toolType: ToolType.NUMERICAL,
      method: 'getCharacterStats',
      params: {
        characterId: 'player_001',
      },
      permission: 'read',
    },
    {
      toolType: ToolType.INVENTORY_DATA,
      method: 'getInventory',
      params: {
        saveId: 'save_001',
        characterId: 'player_001',
      },
      permission: 'read',
    },
    {
      toolType: ToolType.SKILL_DATA,
      method: 'getCharacterSkills',
      params: {
        characterId: 'player_001',
      },
      permission: 'read',
    },
    {
      toolType: ToolType.NPC_DATA,
      method: 'getParty',
      params: {
        characterId: 'player_001',
      },
      permission: 'read',
    },
  ],
  expectedOutput: `批量执行结果 (4 个调用):

[1] getCharacterStats - 成功
{
  "level": 8,
  "health": 140,
  "mana": 60,
  ...
}

[2] getInventory - 成功
{
  "capacity": 20,
  "used": 12,
  "items": [...]
}

[3] getCharacterSkills - 成功
{
  "skills": [
    { "id": "skill_fireball", "name": "火球术", ... },
    { "id": "skill_heal", "name": "治疗术", ... }
  ]
}

[4] getParty - 成功
{
  "members": [
    { "id": "companion_mage", "name": "法师同伴" }
  ]
}

执行统计:
- 总耗时: 25ms
- 成功: 4
- 失败: 0`,
  notes: [
    '批量调用并行执行提高效率',
    '每个调用独立返回结果',
    '适用于无依赖关系的操作',
  ],
};

/**
 * 混合读写批量示例
 * 展示同时包含读写的批量操作
 */
export const mixedBatchExample: ToolCallExample = {
  name: 'mixed_batch',
  description: '混合读写批量示例 - 同时包含读写的批量操作',
  scenario: '战斗结束时同时处理经验、物品掉落和状态更新',
  toolCalls: [
    {
      toolType: ToolType.COMBAT_DATA,
      method: 'endCombat',
      params: {
        combatId: 'combat_001',
        result: {
          victory: true,
          fled: false,
        },
      },
      permission: 'write',
    },
    {
      toolType: ToolType.NUMERICAL,
      method: 'addExperience',
      params: {
        characterId: 'player_001',
        amount: 500,
      },
      permission: 'write',
    },
    {
      toolType: ToolType.INVENTORY_DATA,
      method: 'addItem',
      params: {
        saveId: 'save_001',
        characterId: 'player_001',
        item: {
          id: 'item_goblin_tooth',
          name: '哥布林牙齿',
          type: 'material',
          rarity: 'common',
        },
        quantity: 3,
      },
      permission: 'write',
    },
    {
      toolType: ToolType.INVENTORY_DATA,
      method: 'addCurrency',
      params: {
        saveId: 'save_001',
        characterId: 'player_001',
        currency: 'gold',
        amount: 150,
      },
      permission: 'write',
    },
  ],
  expectedOutput: `批量执行结果 (4 个调用):

[1] endCombat - 成功
战斗已结束，胜利！

[2] addExperience - 成功
获得经验: +500
当前经验: 2900/3000

[3] addItem - 成功
获得物品: 哥布林牙齿 x3

[4] addCurrency - 成功
获得金币: +150
当前金币: 1,250

执行统计:
- 总耗时: 45ms
- 成功: 4
- 失败: 0`,
  notes: [
    '混合批量操作按顺序执行',
    '写入操作会记录日志',
    '部分失败不影响其他操作',
  ],
};

/**
 * 部分失败处理示例
 * 展示批量操作中部分失败的处理
 */
export const partialFailureExample: ToolCallExample = {
  name: 'partial_failure',
  description: '部分失败处理示例 - 批量操作中部分失败',
  scenario: '批量使用物品时部分物品不可用',
  toolCalls: [
    {
      toolType: ToolType.INVENTORY_DATA,
      method: 'useItem',
      params: {
        saveId: 'save_001',
        characterId: 'player_001',
        itemId: 'item_health_potion',
      },
      permission: 'write',
    },
    {
      toolType: ToolType.INVENTORY_DATA,
      method: 'useItem',
      params: {
        saveId: 'save_001',
        characterId: 'player_001',
        itemId: 'item_non_existent',
      },
      permission: 'write',
    },
    {
      toolType: ToolType.INVENTORY_DATA,
      method: 'useItem',
      params: {
        saveId: 'save_001',
        characterId: 'player_001',
        itemId: 'item_mana_potion',
      },
      permission: 'write',
    },
  ],
  expectedOutput: `批量执行结果 (3 个调用):

[1] useItem (health_potion) - 成功
使用治疗药水，恢复 50 生命值

[2] useItem (non_existent) - 失败
错误: ITEM_NOT_FOUND
消息: 物品不存在或数量不足

[3] useItem (mana_potion) - 成功
使用魔法药水，恢复 30 魔法值

执行统计:
- 总耗时: 35ms
- 成功: 2
- 失败: 1

警告: 部分操作失败，请检查错误详情`,
  notes: [
    'continueOnError 默认为 true',
    '失败的操作不影响其他操作',
    '响应中标记每个操作的成功状态',
  ],
};

/**
 * 依赖链式调用示例
 * 展示有依赖关系的链式调用
 */
export const chainedCallExample: ToolCallExample = {
  name: 'chained_call',
  description: '依赖链式调用示例 - 有依赖关系的调用',
  scenario: '先查询状态，再根据结果执行操作',
  toolCalls: [
    {
      toolType: ToolType.NUMERICAL,
      method: 'checkLevelUp',
      params: {
        characterId: 'player_001',
      },
      permission: 'read',
    },
    {
      toolType: ToolType.NUMERICAL,
      method: 'setLevel',
      params: {
        characterId: 'player_001',
        level: 9,
        recalculateAttributes: true,
      },
      permission: 'write',
    },
    {
      toolType: ToolType.NUMERICAL,
      method: 'recalculateAll',
      params: {
        characterId: 'player_001',
      },
      permission: 'write',
    },
    {
      toolType: ToolType.SKILL_DATA,
      method: 'learnSkill',
      params: {
        params: {
          characterId: 'player_001',
          templateId: 'template_new_skill_level9',
          source: 'level_up',
        },
      },
      permission: 'write',
    },
  ],
  expectedOutput: `链式执行结果:

步骤 1: checkLevelUp
结果: 可以升级！经验值已满足

步骤 2: setLevel
结果: 等级提升 8 -> 9

步骤 3: recalculateAll
结果: 属性已重新计算
- 生命值: 140 -> 155
- 魔法值: 60 -> 70
- 攻击力: 35 -> 40

步骤 4: learnSkill
结果: 学习新技能 [旋风斩]

升级完成！`,
  notes: [
    '链式调用按顺序执行',
    '前一步的结果可用于后续步骤',
    '任何步骤失败会中断链式调用',
  ],
};

/**
 * 批量创建示例
 * 展示批量创建多个实体
 */
export const batchCreateExample: ToolCallExample = {
  name: 'batch_create',
  description: '批量创建示例 - 批量创建多个实体',
  scenario: '初始化新存档时创建多个 NPC',
  toolCalls: [
    {
      toolType: ToolType.NPC_DATA,
      method: 'createNPC',
      params: {
        saveId: 'save_002',
        data: {
          name: '村庄长老',
          type: 'quest_giver',
          locationId: 'location_village',
          dialogue: { greeting: '欢迎来到我们的村庄...' },
        },
      },
      permission: 'write',
    },
    {
      toolType: ToolType.NPC_DATA,
      method: 'createNPC',
      params: {
        saveId: 'save_002',
        data: {
          name: '铁匠',
          type: 'merchant',
          locationId: 'location_village',
          shopType: 'blacksmith',
        },
      },
      permission: 'write',
    },
    {
      toolType: ToolType.NPC_DATA,
      method: 'createNPC',
      params: {
        saveId: 'save_002',
        data: {
          name: '药剂师',
          type: 'merchant',
          locationId: 'location_village',
          shopType: 'potion',
        },
      },
      permission: 'write',
    },
    {
      toolType: ToolType.NPC_DATA,
      method: 'createNPC',
      params: {
        saveId: 'save_002',
        data: {
          name: '旅店老板',
          type: 'service',
          locationId: 'location_village',
          services: ['rest', 'save'],
        },
      },
      permission: 'write',
    },
  ],
  expectedOutput: `批量创建结果 (4 个 NPC):

[1] 村庄长老 - 创建成功
ID: npc_village_elder_save002

[2] 铁匠 - 创建成功
ID: npc_blacksmith_save002

[3] 药剂师 - 创建成功
ID: npc_alchemist_save002

[4] 旅店老板 - 创建成功
ID: npc_innkeeper_save002

执行统计:
- 总耗时: 120ms
- 成功: 4
- 失败: 0

村庄 NPC 初始化完成！`,
  notes: [
    '批量创建适用于初始化场景',
    '每个创建操作独立执行',
    '失败不影响已创建的实体',
  ],
};

/**
 * 超时处理示例
 * 展示批量操作的超时处理
 */
export const timeoutExample: ToolCallExample = {
  name: 'timeout_handling',
  description: '超时处理示例 - 批量操作的超时处理',
  scenario: '设置超时限制的批量操作',
  toolCalls: [
    {
      toolType: ToolType.COMBAT_DATA,
      method: 'initCombat',
      params: {
        saveId: 'save_001',
        params: {
          type: 'boss',
          enemies: ['boss_dragon'],
        },
      },
      permission: 'write',
    },
    {
      toolType: ToolType.NUMERICAL,
      method: 'getCombatStatistics',
      params: {
        characterId: 'player_001',
      },
      permission: 'read',
    },
  ],
  expectedOutput: `批量执行结果 (带超时限制 5000ms):

[1] initCombat - 成功 (耗时: 1200ms)
战斗初始化成功
combatId: combat_boss_001

[2] getCombatStatistics - 成功 (耗时: 50ms)
返回战斗统计数据

执行统计:
- 总耗时: 1250ms
- 超时: 无
- 成功: 2
- 失败: 0`,
  notes: [
    '可以设置单个调用的超时时间',
    '超时后返回 TIMEOUT 错误',
    '超时不影响其他并行调用',
  ],
};

/**
 * 导出所有批量调用示例
 */
export const batchCallExamples: ToolCallExample[] = [
  parallelReadExample,
  mixedBatchExample,
  partialFailureExample,
  chainedCallExample,
  batchCreateExample,
  timeoutExample,
];
