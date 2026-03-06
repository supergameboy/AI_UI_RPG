/**
 * Tool 调用示例 - 攻击示例
 * 展示如何调用 CombatDataTool 和 NumericalTool 进行战斗攻击
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
 * 基础攻击示例
 * 展示玩家对敌人进行普通攻击的完整流程
 */
export const basicAttackExample: ToolCallExample = {
  name: 'basic_attack',
  description: '基础攻击示例 - 玩家对敌人进行普通攻击',
  scenario: '玩家在战斗中对敌人发起普通攻击，需要计算伤害并应用效果',
  toolCalls: [
    {
      toolType: ToolType.COMBAT_DATA,
      method: 'getCombatState',
      params: {
        combatId: 'combat_001',
      },
      permission: 'read',
    },
    {
      toolType: ToolType.COMBAT_DATA,
      method: 'getCurrentTurn',
      params: {
        combatId: 'combat_001',
      },
      permission: 'read',
    },
    {
      toolType: ToolType.NUMERICAL,
      method: 'calculateDamage',
      params: {
        params: {
          attackerId: 'player_001',
          targetId: 'enemy_goblin_001',
          baseDamage: 25,
          damageType: 'physical',
          critical: false,
          modifiers: [
            { type: 'add', value: 5, source: 'weapon_bonus' },
            { type: 'multiply', value: 1.1, source: 'strength_bonus' },
          ],
        },
      },
      permission: 'read',
    },
    {
      toolType: ToolType.NUMERICAL,
      method: 'applyDamage',
      params: {
        targetId: 'enemy_goblin_001',
        damage: 33,
        damageType: 'physical',
        source: 'player_001',
      },
      permission: 'write',
    },
    {
      toolType: ToolType.COMBAT_DATA,
      method: 'nextTurn',
      params: {
        combatId: 'combat_001',
      },
      permission: 'write',
    },
  ],
  expectedOutput: `攻击成功！造成 33 点物理伤害。
敌人剩余生命值: 67/100
进入下一回合...`,
  notes: [
    '攻击前需要先获取战斗状态确认当前回合',
    '伤害计算需要考虑武器加成和属性加成',
    '伤害应用后需要推进到下一回合',
    '所有数值计算应使用 NumericalTool 保证一致性',
  ],
};

/**
 * 暴击攻击示例
 * 展示暴击攻击的特殊处理流程
 */
export const criticalAttackExample: ToolCallExample = {
  name: 'critical_attack',
  description: '暴击攻击示例 - 触发暴击的高伤害攻击',
  scenario: '玩家攻击触发暴击，需要计算暴击伤害倍率',
  toolCalls: [
    {
      toolType: ToolType.COMBAT_DATA,
      method: 'getCombatUnits',
      params: {
        combatId: 'combat_001',
      },
      permission: 'read',
    },
    {
      toolType: ToolType.NUMERICAL,
      method: 'calculateDamage',
      params: {
        params: {
          attackerId: 'player_001',
          targetId: 'enemy_orc_001',
          baseDamage: 30,
          damageType: 'physical',
          critical: true,
          criticalMultiplier: 2.0,
          modifiers: [
            { type: 'add', value: 10, source: 'weapon_enchant' },
            { type: 'multiply', value: 1.5, source: 'critical_bonus' },
          ],
        },
      },
      permission: 'read',
    },
    {
      toolType: ToolType.NUMERICAL,
      method: 'applyDamage',
      params: {
        targetId: 'enemy_orc_001',
        damage: 90,
        damageType: 'physical',
        source: 'player_001',
      },
      permission: 'write',
    },
  ],
  expectedOutput: `暴击！造成 90 点物理伤害！
敌人受到重创，剩余生命值: 10/150`,
  notes: [
    '暴击时 critical 参数设为 true',
    '暴击倍率可通过 criticalMultiplier 调整',
    '暴击伤害通常为基础伤害的 1.5-2 倍',
  ],
};

/**
 * 多目标攻击示例
 * 展示范围攻击对多个目标的处理
 */
export const multiTargetAttackExample: ToolCallExample = {
  name: 'multi_target_attack',
  description: '多目标攻击示例 - 范围攻击同时命中多个敌人',
  scenario: '玩家使用范围技能攻击多个敌人',
  toolCalls: [
    {
      toolType: ToolType.COMBAT_DATA,
      method: 'getCombatUnits',
      params: {
        combatId: 'combat_001',
      },
      permission: 'read',
    },
    {
      toolType: ToolType.NUMERICAL,
      method: 'calculateDamage',
      params: {
        params: {
          attackerId: 'player_001',
          targetId: 'enemy_group_001',
          baseDamage: 20,
          damageType: 'magical',
          critical: false,
          areaOfEffect: true,
          targetCount: 3,
        },
      },
      permission: 'read',
    },
    {
      toolType: ToolType.NUMERICAL,
      method: 'applyDamage',
      params: {
        targetId: 'enemy_goblin_001',
        damage: 20,
        damageType: 'magical',
        source: 'player_001',
      },
      permission: 'write',
    },
    {
      toolType: ToolType.NUMERICAL,
      method: 'applyDamage',
      params: {
        targetId: 'enemy_goblin_002',
        damage: 20,
        damageType: 'magical',
        source: 'player_001',
      },
      permission: 'write',
    },
    {
      toolType: ToolType.NUMERICAL,
      method: 'applyDamage',
      params: {
        targetId: 'enemy_goblin_003',
        damage: 20,
        damageType: 'magical',
        source: 'player_001',
      },
      permission: 'write',
    },
  ],
  expectedOutput: `范围攻击命中 3 个目标！
- 敌人1 受到 20 点魔法伤害
- 敌人2 受到 20 点魔法伤害
- 敌人3 受到 20 点魔法伤害
总计造成 60 点伤害`,
  notes: [
    '范围攻击需要对每个目标分别调用 applyDamage',
    '可以考虑使用批量调用优化性能',
    '某些范围技能可能有伤害衰减机制',
  ],
};

/**
 * 导出所有攻击示例
 */
export const attackExamples: ToolCallExample[] = [
  basicAttackExample,
  criticalAttackExample,
  multiTargetAttackExample,
];
