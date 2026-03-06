/**
 * Tool 调用示例 - 技能使用示例
 * 展示如何调用 SkillDataTool 使用技能
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
 * 基础技能使用示例
 * 展示玩家使用攻击技能的完整流程
 */
export const basicSkillUseExample: ToolCallExample = {
  name: 'basic_skill_use',
  description: '基础技能使用示例 - 玩家使用攻击技能',
  scenario: '玩家在战斗中使用"烈焰斩"技能攻击敌人',
  toolCalls: [
    {
      toolType: ToolType.SKILL_DATA,
      method: 'getSkill',
      params: {
        skillId: 'skill_flame_slash',
        characterId: 'player_001',
      },
      permission: 'read',
    },
    {
      toolType: ToolType.SKILL_DATA,
      method: 'checkSkillAvailability',
      params: {
        skillId: 'skill_flame_slash',
        characterId: 'player_001',
      },
      permission: 'read',
    },
    {
      toolType: ToolType.SKILL_DATA,
      method: 'useSkill',
      params: {
        params: {
          skillId: 'skill_flame_slash',
          characterId: 'player_001',
          targetId: 'enemy_orc_001',
          combatId: 'combat_001',
        },
      },
      permission: 'write',
    },
    {
      toolType: ToolType.COMBAT_DATA,
      method: 'applyEffect',
      params: {
        combatId: 'combat_001',
        unitId: 'enemy_orc_001',
        effect: {
          id: 'effect_burn_001',
          type: 'burn',
          name: '灼烧',
          duration: 3,
          value: 5,
          source: 'skill_flame_slash',
          stackable: true,
        },
      },
      permission: 'write',
    },
  ],
  expectedOutput: `使用技能"烈焰斩"！
造成 45 点火焰伤害
敌人被灼烧，每回合受到 5 点伤害，持续 3 回合
技能进入冷却: 3 回合`,
  notes: [
    '使用技能前必须检查可用性（冷却、资源消耗等）',
    '技能效果可能包含状态效果，需要单独应用',
    '技能使用后会进入冷却期',
  ],
};

/**
 * 技能冷却检查示例
 * 展示如何检查和管理技能冷却
 */
export const skillCooldownExample: ToolCallExample = {
  name: 'skill_cooldown_check',
  description: '技能冷却检查示例 - 检查角色所有技能的冷却状态',
  scenario: '玩家查看当前可用的技能列表',
  toolCalls: [
    {
      toolType: ToolType.SKILL_DATA,
      method: 'getCharacterSkills',
      params: {
        characterId: 'player_001',
      },
      permission: 'read',
    },
    {
      toolType: ToolType.SKILL_DATA,
      method: 'getCharacterCooldowns',
      params: {
        characterId: 'player_001',
      },
      permission: 'read',
    },
    {
      toolType: ToolType.SKILL_DATA,
      method: 'checkSkillAvailability',
      params: {
        skillId: 'skill_fireball',
        characterId: 'player_001',
      },
      permission: 'read',
    },
    {
      toolType: ToolType.SKILL_DATA,
      method: 'checkSkillAvailability',
      params: {
        skillId: 'skill_heal',
        characterId: 'player_001',
      },
      permission: 'read',
    },
  ],
  expectedOutput: `技能冷却状态:
- 烈焰斩: 可用
- 火球术: 冷却中 (剩余 2 回合)
- 治疗术: 可用
- 闪避: 可用`,
  notes: [
    'getCharacterCooldowns 返回所有技能的冷却状态',
    'checkSkillAvailability 返回单个技能的详细可用性信息',
    '冷却中的技能不可使用',
  ],
};

/**
 * 技能学习示例
 * 展示角色学习新技能的流程
 */
export const skillLearnExample: ToolCallExample = {
  name: 'skill_learn',
  description: '技能学习示例 - 角色学习新技能',
  scenario: '玩家升级后学习新的技能',
  toolCalls: [
    {
      toolType: ToolType.SKILL_DATA,
      method: 'getTemplate',
      params: {
        templateId: 'template_ice_shield',
      },
      permission: 'read',
    },
    {
      toolType: ToolType.SKILL_DATA,
      method: 'learnSkill',
      params: {
        params: {
          characterId: 'player_001',
          templateId: 'template_ice_shield',
          source: 'level_up',
        },
      },
      permission: 'write',
    },
    {
      toolType: ToolType.SKILL_DATA,
      method: 'getSkill',
      params: {
        skillId: 'skill_ice_shield_player001',
        characterId: 'player_001',
      },
      permission: 'read',
    },
  ],
  expectedOutput: `成功学习新技能"冰霜护盾"！
技能等级: 1
技能类型: 防御
效果: 创建一个吸收 50 点伤害的护盾，持续 3 回合`,
  notes: [
    '学习技能前可以先查看模板了解技能详情',
    'learnSkill 会创建技能实例并关联到角色',
    '新学习的技能等级通常为 1',
  ],
};

/**
 * 技能升级示例
 * 展示提升技能等级的流程
 */
export const skillUpgradeExample: ToolCallExample = {
  name: 'skill_upgrade',
  description: '技能升级示例 - 提升技能等级',
  scenario: '玩家使用技能点提升技能等级',
  toolCalls: [
    {
      toolType: ToolType.SKILL_DATA,
      method: 'getSkill',
      params: {
        skillId: 'skill_fireball',
        characterId: 'player_001',
      },
      permission: 'read',
    },
    {
      toolType: ToolType.SKILL_DATA,
      method: 'upgradeSkill',
      params: {
        params: {
          skillId: 'skill_fireball',
          characterId: 'player_001',
          newLevel: 3,
        },
      },
      permission: 'write',
    },
  ],
  expectedOutput: `技能"火球术"升级成功！
等级: 2 -> 3
伤害: 40 -> 55
范围: 单体 -> 小范围
消耗: 20 -> 25 法力`,
  notes: [
    '升级前需要检查角色是否有足够的技能点',
    '技能升级会提升效果数值',
    '某些技能在特定等级会解锁新效果',
  ],
};

/**
 * 技能冷却重置示例
 * 展示如何重置或减少技能冷却
 */
export const skillCooldownResetExample: ToolCallExample = {
  name: 'skill_cooldown_reset',
  description: '技能冷却重置示例 - 重置或减少技能冷却',
  scenario: '玩家使用道具或效果减少技能冷却时间',
  toolCalls: [
    {
      toolType: ToolType.SKILL_DATA,
      method: 'getCharacterCooldowns',
      params: {
        characterId: 'player_001',
      },
      permission: 'read',
    },
    {
      toolType: ToolType.SKILL_DATA,
      method: 'reduceCooldown',
      params: {
        characterId: 'player_001',
        skillId: 'skill_fireball',
        amount: 2,
      },
      permission: 'write',
    },
    {
      toolType: ToolType.SKILL_DATA,
      method: 'resetCooldown',
      params: {
        characterId: 'player_001',
        skillId: 'skill_heal',
      },
      permission: 'write',
    },
  ],
  expectedOutput: `冷却时间更新:
- 火球术: 冷却减少 2 回合，剩余 0 回合 -> 可用
- 治疗术: 冷却已重置 -> 可用`,
  notes: [
    'reduceCooldown 减少指定回合数的冷却',
    'resetCooldown 完全重置冷却',
    '不指定 skillId 时影响所有技能',
  ],
};

/**
 * 导出所有技能示例
 */
export const skillExamples: ToolCallExample[] = [
  basicSkillUseExample,
  skillCooldownExample,
  skillLearnExample,
  skillUpgradeExample,
  skillCooldownResetExample,
];
