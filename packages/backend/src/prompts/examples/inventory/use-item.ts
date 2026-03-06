/**
 * Tool 调用示例 - 使用物品示例
 * 展示如何调用 InventoryDataTool 使用物品
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
 * 使用消耗品示例
 * 展示玩家使用药水等消耗品
 */
export const useConsumableExample: ToolCallExample = {
  name: 'use_consumable',
  description: '使用消耗品示例 - 玩家使用治疗药水',
  scenario: '玩家在战斗中使用治疗药水恢复生命值',
  toolCalls: [
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
      toolType: ToolType.INVENTORY_DATA,
      method: 'getItem',
      params: {
        saveId: 'save_001',
        characterId: 'player_001',
        itemId: 'item_health_potion',
        slotIndex: 5,
      },
      permission: 'read',
    },
    {
      toolType: ToolType.INVENTORY_DATA,
      method: 'useItem',
      params: {
        saveId: 'save_001',
        characterId: 'player_001',
        itemId: 'item_health_potion',
        slotIndex: 5,
      },
      permission: 'write',
    },
    {
      toolType: ToolType.NUMERICAL,
      method: 'applyHealing',
      params: {
        targetId: 'player_001',
        healing: 50,
        source: 'item_health_potion',
      },
      permission: 'write',
    },
  ],
  expectedOutput: `使用物品: 治疗药水
效果: 恢复 50 点生命值
当前生命值: 80/100
物品剩余数量: 2`,
  notes: [
    '使用物品前检查背包确认物品存在',
    '消耗品使用后会减少数量',
    '物品效果通过 NumericalTool 应用',
  ],
};

/**
 * 使用增益物品示例
 * 展示使用提供增益效果的物品
 */
export const useBuffItemExample: ToolCallExample = {
  name: 'use_buff_item',
  description: '使用增益物品示例 - 使用提供临时增益的物品',
  scenario: '玩家使用力量药剂获得临时攻击力提升',
  toolCalls: [
    {
      toolType: ToolType.INVENTORY_DATA,
      method: 'getItem',
      params: {
        saveId: 'save_001',
        characterId: 'player_001',
        itemId: 'item_strength_potion',
      },
      permission: 'read',
    },
    {
      toolType: ToolType.INVENTORY_DATA,
      method: 'useItem',
      params: {
        saveId: 'save_001',
        characterId: 'player_001',
        itemId: 'item_strength_potion',
      },
      permission: 'write',
    },
    {
      toolType: ToolType.NUMERICAL,
      method: 'applyStatusEffect',
      params: {
        characterId: 'player_001',
        effect: {
          id: 'effect_strength_boost_001',
          type: 'buff',
          name: '力量提升',
          attribute: 'strength',
          value: 10,
          duration: 300000, // 5 分钟
          source: 'item_strength_potion',
        },
      },
      permission: 'write',
    },
  ],
  expectedOutput: `使用物品: 力量药剂
效果: 力量 +10，持续 5 分钟
当前力量: 25 (基础 15 + 增益 10)
增益剩余时间: 4:59`,
  notes: [
    '增益物品会添加状态效果',
    '状态效果有持续时间限制',
    '增益效果可以叠加或刷新',
  ],
};

/**
 * 对目标使用物品示例
 * 展示对其他目标使用物品
 */
export const useItemOnTargetExample: ToolCallExample = {
  name: 'use_item_on_target',
  description: '对目标使用物品示例 - 对队友使用物品',
  scenario: '玩家对受伤的队友使用治疗药水',
  toolCalls: [
    {
      toolType: ToolType.NPC_DATA,
      method: 'getParty',
      params: {
        characterId: 'player_001',
      },
      permission: 'read',
    },
    {
      toolType: ToolType.NUMERICAL,
      method: 'getCharacter',
      params: {
        characterId: 'companion_mage',
      },
      permission: 'read',
    },
    {
      toolType: ToolType.INVENTORY_DATA,
      method: 'useItem',
      params: {
        saveId: 'save_001',
        characterId: 'player_001',
        itemId: 'item_health_potion',
        targetId: 'companion_mage',
      },
      permission: 'write',
    },
    {
      toolType: ToolType.NUMERICAL,
      method: 'applyHealing',
      params: {
        targetId: 'companion_mage',
        healing: 50,
        source: 'player_001',
      },
      permission: 'write',
    },
  ],
  expectedOutput: `对队友 [法师] 使用治疗药水
治疗效果: 恢复 50 点生命值
法师当前生命值: 65/80
物品已从背包移除`,
  notes: [
    'targetId 指定物品作用目标',
    '对队友使用物品消耗玩家自己的物品',
    '某些物品只能对特定目标使用',
  ],
};

/**
 * 使用特殊物品示例
 * 展示使用有特殊效果的物品
 */
export const useSpecialItemExample: ToolCallExample = {
  name: 'use_special_item',
  description: '使用特殊物品示例 - 使用有特殊效果的物品',
  scenario: '玩家使用传送卷轴传送到指定地点',
  toolCalls: [
    {
      toolType: ToolType.INVENTORY_DATA,
      method: 'getItem',
      params: {
        saveId: 'save_001',
        characterId: 'player_001',
        itemId: 'item_teleport_scroll',
      },
      permission: 'read',
    },
    {
      toolType: ToolType.INVENTORY_DATA,
      method: 'useItem',
      params: {
        saveId: 'save_001',
        characterId: 'player_001',
        itemId: 'item_teleport_scroll',
        targetId: 'location_town_square',
      },
      permission: 'write',
    },
  ],
  expectedOutput: `使用物品: 传送卷轴
效果: 传送到城镇广场
目标地点: 城镇广场
物品已消耗

传送完成！你出现在城镇广场中央。`,
  notes: [
    '特殊物品可能有独特的效果',
    'targetId 可以是地点 ID',
    '某些特殊物品使用需要确认',
  ],
};

/**
 * 物品堆叠使用示例
 * 展示使用堆叠物品
 */
export const useStackableItemExample: ToolCallExample = {
  name: 'use_stackable_item',
  description: '物品堆叠使用示例 - 使用可堆叠物品',
  scenario: '玩家使用多支箭矢或多个材料',
  toolCalls: [
    {
      toolType: ToolType.INVENTORY_DATA,
      method: 'getItem',
      params: {
        saveId: 'save_001',
        characterId: 'player_001',
        itemId: 'item_arrow',
        slotIndex: 10,
      },
      permission: 'read',
    },
    {
      toolType: ToolType.INVENTORY_DATA,
      method: 'useItem',
      params: {
        saveId: 'save_001',
        characterId: 'player_001',
        itemId: 'item_arrow',
        slotIndex: 10,
        quantity: 5,
      },
      permission: 'write',
    },
  ],
  expectedOutput: `使用物品: 铁箭 x5
剩余数量: 45
用途: 装备到箭袋`,
  notes: [
    '堆叠物品可以指定使用数量',
    '使用后自动更新堆叠数量',
    '数量为 0 时自动移除物品槽',
  ],
};

/**
 * 导出所有使用物品示例
 */
export const useItemExamples: ToolCallExample[] = [
  useConsumableExample,
  useBuffItemExample,
  useItemOnTargetExample,
  useSpecialItemExample,
  useStackableItemExample,
];
