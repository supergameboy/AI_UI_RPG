/**
 * Tool 调用示例 - 装备穿戴示例
 * 展示装备穿戴流程和属性变化计算
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
 * 基础装备穿戴示例
 * 展示玩家穿戴装备的完整流程
 */
export const basicEquipExample: ToolCallExample = {
  name: 'basic_equip',
  description: '基础装备穿戴示例 - 玩家穿戴武器',
  scenario: '玩家从背包中装备一把新武器',
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
        itemId: 'item_iron_sword',
      },
      permission: 'read',
    },
    {
      toolType: ToolType.INVENTORY_DATA,
      method: 'checkEquipRequirements',
      params: {
        item: {
          id: 'item_iron_sword',
          name: '铁剑',
          type: 'weapon',
          slot: 'mainHand',
          requirements: {
            level: 5,
            strength: 10,
          },
          stats: {
            attack: 25,
            criticalRate: 5,
          },
        },
        playerStats: {
          level: 8,
          strength: 15,
        },
      },
      permission: 'read',
    },
    {
      toolType: ToolType.INVENTORY_DATA,
      method: 'equipItem',
      params: {
        saveId: 'save_001',
        characterId: 'player_001',
        itemId: 'item_iron_sword',
        targetSlot: 'mainHand',
        playerStats: {
          level: 8,
          strength: 15,
        },
      },
      permission: 'write',
    },
    {
      toolType: ToolType.INVENTORY_DATA,
      method: 'calculateStats',
      params: {
        saveId: 'save_001',
        characterId: 'player_001',
        baseStats: {
          attack: 10,
          defense: 5,
          criticalRate: 0,
        },
      },
      permission: 'read',
    },
  ],
  expectedOutput: `装备成功: 铁剑
装备槽位: 主手

属性变化:
- 攻击力: 10 -> 35 (+25)
- 暴击率: 0% -> 5% (+5%)

原装备 [木剑] 已放入背包`,
  notes: [
    '穿戴前检查装备需求是否满足',
    '穿戴后计算属性变化',
    '原装备会自动卸下放入背包',
  ],
};

/**
 * 更换装备示例
 * 展示更换已装备物品的流程
 */
export const replaceEquipExample: ToolCallExample = {
  name: 'replace_equip',
  description: '更换装备示例 - 更换已装备的物品',
  scenario: '玩家用更好的护甲替换当前护甲',
  toolCalls: [
    {
      toolType: ToolType.INVENTORY_DATA,
      method: 'getEquipment',
      params: {
        saveId: 'save_001',
        characterId: 'player_001',
        slot: 'chest',
      },
      permission: 'read',
    },
    {
      toolType: ToolType.INVENTORY_DATA,
      method: 'getItem',
      params: {
        saveId: 'save_001',
        characterId: 'player_001',
        itemId: 'item_steel_armor',
      },
      permission: 'read',
    },
    {
      toolType: ToolType.INVENTORY_DATA,
      method: 'equipItem',
      params: {
        saveId: 'save_001',
        characterId: 'player_001',
        itemId: 'item_steel_armor',
        targetSlot: 'chest',
      },
      permission: 'write',
    },
    {
      toolType: ToolType.INVENTORY_DATA,
      method: 'calculateStats',
      params: {
        saveId: 'save_001',
        characterId: 'player_001',
        baseStats: {
          defense: 20,
          health: 100,
        },
      },
      permission: 'read',
    },
  ],
  expectedOutput: `卸下装备: 皮甲
- 防御力 -10
- 生命值 -20

装备新物品: 钢铁护甲
- 防御力 +25
- 生命值 +50

最终属性变化:
- 防御力: 20 -> 35 (+15)
- 生命值: 100 -> 130 (+30)`,
  notes: [
    '更换装备会先卸下原装备',
    '显示属性变化的对比',
    '确保背包有空间存放卸下的装备',
  ],
};

/**
 * 卸下装备示例
 * 展示卸下装备的流程
 */
export const unequipExample: ToolCallExample = {
  name: 'unequip_item',
  description: '卸下装备示例 - 卸下已装备的物品',
  scenario: '玩家卸下当前装备的饰品',
  toolCalls: [
    {
      toolType: ToolType.INVENTORY_DATA,
      method: 'getEquipment',
      params: {
        saveId: 'save_001',
        characterId: 'player_001',
        slot: 'accessory',
      },
      permission: 'read',
    },
    {
      toolType: ToolType.INVENTORY_DATA,
      method: 'unequipItem',
      params: {
        saveId: 'save_001',
        characterId: 'player_001',
        slot: 'accessory',
      },
      permission: 'write',
    },
    {
      toolType: ToolType.INVENTORY_DATA,
      method: 'calculateStats',
      params: {
        saveId: 'save_001',
        characterId: 'player_001',
        baseStats: {
          attack: 30,
          criticalRate: 10,
        },
      },
      permission: 'read',
    },
  ],
  expectedOutput: `卸下装备: 力量戒指
装备已放入背包

属性变化:
- 攻击力: 35 -> 30 (-5)
- 暴击率: 15% -> 10% (-5%)`,
  notes: [
    '卸下装备需要背包有空位',
    '卸下后属性会相应减少',
    '某些装备可能有卸下限制',
  ],
};

/**
 * 套装装备示例
 * 展示套装效果的激活
 */
export const setBonusExample: ToolCallExample = {
  name: 'set_bonus',
  description: '套装装备示例 - 激活套装效果',
  scenario: '玩家穿戴多件同套装装备激活套装效果',
  toolCalls: [
    {
      toolType: ToolType.INVENTORY_DATA,
      method: 'getEquipment',
      params: {
        saveId: 'save_001',
        characterId: 'player_001',
      },
      permission: 'read',
    },
    {
      toolType: ToolType.INVENTORY_DATA,
      method: 'equipItem',
      params: {
        saveId: 'save_001',
        characterId: 'player_001',
        itemId: 'item_dragon_helmet',
        targetSlot: 'head',
      },
      permission: 'write',
    },
    {
      toolType: ToolType.INVENTORY_DATA,
      method: 'calculateStats',
      params: {
        saveId: 'save_001',
        characterId: 'player_001',
        baseStats: {
          attack: 50,
          defense: 40,
          fireResistance: 0,
        },
      },
      permission: 'read',
    },
  ],
  expectedOutput: `装备: 龙鳞头盔
当前套装: 龙鳞套装 (3/4)

套装效果已激活:
[2件] 火焰抗性 +20%
[3件] 攻击力 +15, 防御力 +10

当前属性:
- 攻击力: 65 (基础 50 + 套装 15)
- 防御力: 50 (基础 40 + 套装 10)
- 火焰抗性: 20%`,
  notes: [
    '套装效果根据装备数量激活',
    '套装效果叠加显示',
    '集齐套装可能有额外奖励',
  ],
};

/**
 * 双持武器示例
 * 展示双持武器的特殊处理
 */
export const dualWieldExample: ToolCallExample = {
  name: 'dual_wield',
  description: '双持武器示例 - 双持武器的装备',
  scenario: '玩家在副手装备武器实现双持',
  toolCalls: [
    {
      toolType: ToolType.INVENTORY_DATA,
      method: 'getEquipment',
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
        itemId: 'item_dagger',
      },
      permission: 'read',
    },
    {
      toolType: ToolType.INVENTORY_DATA,
      method: 'equipItem',
      params: {
        saveId: 'save_001',
        characterId: 'player_001',
        itemId: 'item_dagger',
        targetSlot: 'offHand',
      },
      permission: 'write',
    },
    {
      toolType: ToolType.INVENTORY_DATA,
      method: 'calculateStats',
      params: {
        saveId: 'save_001',
        characterId: 'player_001',
        baseStats: {
          attack: 30,
          attackSpeed: 1.0,
        },
      },
      permission: 'read',
    },
  ],
  expectedOutput: `装备副手武器: 匕首
双持模式已激活

双持效果:
- 攻击速度: 1.0 -> 1.5 (+50%)
- 主手伤害: 100%
- 副手伤害: 75%
- 暴击率: +10%

当前属性:
- 攻击力: 45 (主手 30 + 副手 15)
- 攻击速度: 1.5`,
  notes: [
    '双持需要特定技能或天赋支持',
    '副手武器伤害通常有惩罚',
    '双持提供攻击速度加成',
  ],
};

/**
 * 导出所有装备示例
 */
export const equipExamples: ToolCallExample[] = [
  basicEquipExample,
  replaceEquipExample,
  unequipExample,
  setBonusExample,
  dualWieldExample,
];
