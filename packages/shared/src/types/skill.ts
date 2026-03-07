/**
 * 技能系统类型定义
 * 用于前后端共享的技能相关类型
 */

// ==================== 基础类型 ====================

/**
 * 技能类型
 */
export type SkillType = 'active' | 'passive' | 'toggle';

/**
 * 技能分类
 */
export type SkillCategory = 'combat' | 'magic' | 'craft' | 'social' | 'exploration' | 'custom';

/**
 * 消耗类型
 */
export type CostType = 'mana' | 'health' | 'stamina' | 'custom';

/**
 * 技能目标类型
 */
export type TargetType = 'self' | 'single_enemy' | 'all_enemies' | 'single_ally' | 'all_allies' | 'area' | 'custom';

// ==================== 技能消耗 ====================

/**
 * 技能消耗
 */
export interface SkillCost {
  type: CostType;
  value: number;
  customResource?: string;
}

// ==================== 技能效果 ====================

/**
 * 技能效果
 */
export interface SkillEffect {
  type: string;
  value: number;
  duration?: number;
  condition?: string;
}

/**
 * 技能需求
 * 支持多种前置条件检查
 */
export interface SkillRequirement {
  /**
   * 需求类型
   * - level: 等级要求
   * - attribute: 属性要求（格式："属性名:数值"，如 "strength:15"）
   * - skill: 前置技能（技能ID）
   * - item: 物品需求（物品ID或名称）
   * - class: 职业限制（职业名称或数组）
   */
  type: 'level' | 'attribute' | 'skill' | 'item' | 'class';
  /**
   * 需求值
   * - level: 数字等级
   * - attribute: "属性名:数值" 格式字符串
   * - skill: 技能ID字符串
   * - item: 物品ID或名称
   * - class: 职业名称字符串或职业数组（JSON格式）
   */
  value: number | string;
}

// ==================== 技能范围 ====================

/**
 * 技能范围
 */
export interface SkillRange {
  type: 'melee' | 'ranged' | 'area';
  minDistance?: number;
  maxDistance?: number;
  areaRadius?: number;
}

// ==================== 核心技能接口 ====================

/**
 * 扩展技能接口（完整技能定义）
 */
export interface ExtendedSkill {
  id: string;
  name: string;
  description: string;
  type: SkillType;
  category: SkillCategory;
  costs: SkillCost[];
  cooldown: number;
  effects: SkillEffect[];
  requirements: SkillRequirement[];
  level: number;
  maxLevel: number;
  targetType: TargetType;
  range?: SkillRange;
  castTime?: number;
  channelTime?: number;
  isToggleOn?: boolean;
  tags?: string[];
}

// ==================== 冷却管理 ====================

/**
 * 技能冷却状态
 */
export interface SkillCooldownState {
  skillId: string;
  remainingTurns: number;
  totalCooldown: number;
  lastUsedAt: number;
}

// ==================== 学习和升级 ====================

/**
 * 技能学习参数
 */
export interface SkillLearnParams {
  skillId: string;
  characterId: string;
  source: 'trainer' | 'book' | 'quest' | 'event' | 'level_up';
}

/**
 * 技能升级参数
 */
export interface SkillUpgradeParams {
  skillId: string;
  characterId: string;
}

/**
 * 技能解锁参数
 */
export interface SkillUnlockParams {
  skillId: string;
  characterId: string;
  unlockMethod: 'requirement_met' | 'item_used' | 'special_event';
}

// ==================== 技能使用 ====================

/**
 * 技能使用参数
 */
export interface SkillUseParams {
  skillId: string;
  characterId: string;
  targetId?: string;
  targetPosition?: { x: number; y: number };
  context?: {
    combatId?: string;
    location?: string;
    additionalData?: Record<string, unknown>;
  };
}

/**
 * 技能效果计算结果
 */
export interface SkillEffectResult {
  skillId: string;
  characterId: string;
  targetId?: string;
  effects: {
    type: string;
    value: number;
    actualValue: number;
    isCritical?: boolean;
    isBlocked?: boolean;
    isResisted?: boolean;
  }[];
  totalCost: SkillCost[];
  cooldownApplied: number;
  success: boolean;
  message?: string;
}

/**
 * 技能消耗计算结果
 */
export interface SkillCostResult {
  canAfford: boolean;
  costs: {
    type: CostType;
    required: number;
    available: number;
    sufficient: boolean;
  }[];
  totalInsufficient: number;
}

// ==================== 技能模板 ====================

/**
 * 技能模板（用于生成新技能）
 */
export interface SkillTemplate {
  id: string;
  name: string;
  description: string;
  category: SkillCategory;
  type: SkillType;
  baseCosts: SkillCost[];
  baseCooldown: number;
  baseEffects: SkillEffect[];
  requirements: SkillRequirement[];
  maxLevel: number;
  scalingPerLevel: {
    costMultiplier: number;
    effectMultiplier: number;
    cooldownReduction: number;
  };
}

// ==================== 技能树 ====================

/**
 * 技能树节点
 */
export interface SkillTreeNode {
  skillId: string;
  prerequisites: string[];
  position: { x: number; y: number };
  unlocked: boolean;
  learned: boolean;
}

/**
 * 技能树
 */
export interface SkillTree {
  id: string;
  name: string;
  description: string;
  category: SkillCategory;
  nodes: SkillTreeNode[];
}

// ==================== 统计 ====================

/**
 * 技能统计
 */
export interface SkillStatistics {
  totalSkills: number;
  byCategory: Record<SkillCategory, number>;
  byType: Record<SkillType, number>;
  learnedSkills: number;
  maxLevelSkills: number;
  totalCooldowns: number;
}

// ==================== API 响应类型 ====================

/**
 * 技能 API 响应
 */
export interface SkillApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * 技能列表响应
 */
export interface SkillListResponse {
  skills: ExtendedSkill[];
  count: number;
}

/**
 * 技能冷却响应
 */
export interface SkillCooldownResponse {
  cooldowns: SkillCooldownState[];
  count: number;
}

/**
 * 技能可用性检查响应
 */
export interface SkillAvailabilityResponse {
  available: boolean;
  reason?: string;
  cooldownRemaining?: number;
  insufficientResources?: SkillCostResult;
}
