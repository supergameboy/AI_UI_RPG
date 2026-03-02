/**
 * 数值系统类型定义
 * 包含属性计算、伤害计算、治疗计算、等级系统等相关类型
 */

import type { StatusEffect } from './character';

// ==================== 基础类型 ====================

/** 基础属性名称 */
export type BaseAttributeName = 'strength' | 'dexterity' | 'constitution' | 'intelligence' | 'wisdom' | 'charisma';

/** 派生属性名称 */
export type DerivedAttributeName = 'maxHp' | 'maxMp' | 'attack' | 'defense' | 'speed' | 'luck' | 'critRate' | 'critDamage' | 'dodgeRate' | 'blockRate';

/** 伤害类型 */
export type DamageType = 'physical' | 'magical' | 'true';

/** 成长曲线类型 */
export type GrowthCurveType = 'linear' | 'exponential' | 'custom';

// ==================== 属性成长配置 ====================

/** 属性成长配置 */
export interface AttributeGrowthConfig {
  baseValue: number;
  growthType: GrowthCurveType;
  growthRate: number;
  customFormula?: (level: number, baseValue: number, growthRate: number) => number;
}

/** 派生属性公式配置 */
export interface DerivedAttributeFormula {
  name: string;
  baseValue: number;
  scalingAttributes: Array<{
    attribute: BaseAttributeName;
    multiplier: number;
  }>;
  levelScaling?: number;
}

// ==================== 伤害计算 ====================

/** 伤害计算参数 */
export interface DamageCalculationParams {
  attacker: {
    level: number;
    baseAttack: number;
    critRate: number;
    critDamage: number;
    penetration?: number;
  };
  defender: {
    level: number;
    defense: number;
    dodgeRate: number;
    blockRate: number;
    blockReduction?: number;
  };
  damageType: DamageType;
  baseDamage: number;
  skillMultiplier?: number;
  isCritical?: boolean;
}

/** 伤害计算结果 */
export interface DamageResult {
  finalDamage: number;
  isCritical: boolean;
  isDodged: boolean;
  isBlocked: boolean;
  blockedDamage: number;
  damageType: DamageType;
  breakdown: {
    baseDamage: number;
    skillMultiplier: number;
    criticalMultiplier: number;
    defenseReduction: number;
    penetrationReduction: number;
  };
}

// ==================== 治疗计算 ====================

/** 治疗计算参数 */
export interface HealingCalculationParams {
  healer: {
    level: number;
    intelligence: number;
    wisdom: number;
    healingBonus?: number;
  };
  target: {
    level: number;
    currentHp: number;
    maxHp: number;
    healingReceivedBonus?: number;
  };
  baseHealing: number;
  skillMultiplier?: number;
}

/** 治疗计算结果 */
export interface HealingResult {
  finalHealing: number;
  overhealing: number;
  breakdown: {
    baseHealing: number;
    skillMultiplier: number;
    attributeBonus: number;
    healingBonus: number;
  };
}

// ==================== 等级系统 ====================

/** 等级经验配置 */
export interface LevelExperienceConfig {
  maxLevel: number;
  baseExperience: number;
  experienceGrowthType: GrowthCurveType;
  experienceGrowthRate: number;
  customFormula?: (level: number) => number;
}

/** 等级提升结果 */
export interface LevelUpResult {
  previousLevel: number;
  newLevel: number;
  attributeGains: Record<BaseAttributeName, number>;
  derivedAttributeGains: Record<string, number>;
  unlockedSkills: string[];
  experienceRemaining: number;
}

// ==================== 属性修改 ====================

/** 属性修改请求 */
export interface AttributeModification {
  targetId: string;
  attribute: BaseAttributeName | DerivedAttributeName;
  value: number;
  type: 'add' | 'subtract' | 'set' | 'multiply';
  source: string;
  duration?: number;
}

// ==================== 战斗统计 ====================

/** 战斗统计 */
export interface CombatStatistics {
  totalDamageDealt: number;
  totalDamageTaken: number;
  totalHealingDone: number;
  totalHealingReceived: number;
  criticalHits: number;
  dodgedAttacks: number;
  blockedAttacks: number;
  averageDamagePerHit: number;
}

// ==================== 角色快照 ====================

/** 角色数值快照 */
export interface CharacterSnapshot {
  timestamp: number;
  level: number;
  experience: number;
  baseAttributes: Record<BaseAttributeName, number>;
  derivedAttributes: Record<DerivedAttributeName, number>;
  statusEffects: StatusEffect[];
}

// ==================== API 响应类型 ====================

/** 数值 API 通用响应 */
export interface NumericalApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/** 属性计算请求 */
export interface CalculateAttributesRequest {
  level: number;
  race?: string;
  class?: string;
  customGrowth?: Partial<Record<BaseAttributeName, AttributeGrowthConfig>>;
}

/** 属性计算响应 */
export interface CalculateAttributesResponse {
  attributes: Record<BaseAttributeName, number>;
  level: number;
}

/** 派生属性计算请求 */
export interface CalculateDerivedRequest {
  baseAttributes: Record<BaseAttributeName, number>;
  level: number;
  equipment?: Record<string, unknown>;
  buffs?: StatusEffect[];
}

/** 派生属性计算响应 */
export interface CalculateDerivedResponse {
  derivedAttributes: Record<DerivedAttributeName, number>;
  level: number;
}

/** 经验值添加请求 */
export interface AddExperienceRequest {
  characterId: string;
  amount: number;
  source?: string;
}

/** 经验值添加响应 */
export interface AddExperienceResponse {
  characterId: string;
  previousExp: number;
  currentExp: number;
  expGained: number;
  previousLevel: number;
  currentLevel: number;
  levelUps: LevelUpResult[];
}

/** 等级检查响应 */
export interface LevelCheckResponse {
  characterId: string;
  currentLevel: number;
  currentExp: number;
  expNeeded: number;
  canLevelUp: boolean;
  expToNextLevel: number;
}

/** 角色统计响应 */
export interface CharacterStatsResponse {
  characterId: string;
  level: number;
  experience: number;
  baseAttributes: Record<BaseAttributeName, number>;
  derivedAttributes: {
    maxHp: number;
    currentHp: number;
    maxMp: number;
    currentMp: number;
    attack: number;
    defense: number;
    speed: number;
    luck: number;
    critRate?: number;
    critDamage?: number;
    dodgeRate?: number;
    blockRate?: number;
  };
  statusEffects: StatusEffect[];
  expProgress: number;
  expNeeded: number;
  statusEffectCount: number;
}

// ==================== 默认配置常量 ====================

/** 基础属性成长默认配置 */
export const DEFAULT_ATTRIBUTE_GROWTH: Record<BaseAttributeName, AttributeGrowthConfig> = {
  strength: { baseValue: 10, growthType: 'linear', growthRate: 2 },
  dexterity: { baseValue: 10, growthType: 'linear', growthRate: 2 },
  constitution: { baseValue: 10, growthType: 'linear', growthRate: 2 },
  intelligence: { baseValue: 10, growthType: 'linear', growthRate: 2 },
  wisdom: { baseValue: 10, growthType: 'linear', growthRate: 2 },
  charisma: { baseValue: 10, growthType: 'linear', growthRate: 1 },
};

/** 派生属性公式 */
export const DERIVED_ATTRIBUTE_FORMULAS: DerivedAttributeFormula[] = [
  {
    name: 'maxHp',
    baseValue: 100,
    scalingAttributes: [{ attribute: 'constitution', multiplier: 10 }],
    levelScaling: 5,
  },
  {
    name: 'maxMp',
    baseValue: 50,
    scalingAttributes: [{ attribute: 'intelligence', multiplier: 5 }, { attribute: 'wisdom', multiplier: 3 }],
    levelScaling: 3,
  },
  {
    name: 'attack',
    baseValue: 10,
    scalingAttributes: [{ attribute: 'strength', multiplier: 2 }],
    levelScaling: 1,
  },
  {
    name: 'defense',
    baseValue: 5,
    scalingAttributes: [{ attribute: 'constitution', multiplier: 1 }, { attribute: 'dexterity', multiplier: 0.5 }],
    levelScaling: 0.5,
  },
  {
    name: 'speed',
    baseValue: 100,
    scalingAttributes: [{ attribute: 'dexterity', multiplier: 2 }],
    levelScaling: 0,
  },
  {
    name: 'luck',
    baseValue: 0,
    scalingAttributes: [{ attribute: 'charisma', multiplier: 0.5 }],
    levelScaling: 0,
  },
  {
    name: 'critRate',
    baseValue: 5,
    scalingAttributes: [{ attribute: 'dexterity', multiplier: 0.3 }, { attribute: 'charisma', multiplier: 0.05 }],
    levelScaling: 0,
  },
  {
    name: 'critDamage',
    baseValue: 150,
    scalingAttributes: [{ attribute: 'strength', multiplier: 0.5 }],
    levelScaling: 0,
  },
  {
    name: 'dodgeRate',
    baseValue: 5,
    scalingAttributes: [{ attribute: 'dexterity', multiplier: 0.3 }],
    levelScaling: 0,
  },
  {
    name: 'blockRate',
    baseValue: 5,
    scalingAttributes: [{ attribute: 'constitution', multiplier: 0.2 }, { attribute: 'strength', multiplier: 0.1 }],
    levelScaling: 0,
  },
];

/** 等级经验默认配置 */
export const DEFAULT_LEVEL_CONFIG: LevelExperienceConfig = {
  maxLevel: 100,
  baseExperience: 100,
  experienceGrowthType: 'exponential',
  experienceGrowthRate: 1.15,
};

/** 默认格挡减伤比例 */
export const DEFAULT_BLOCK_REDUCTION = 0.5;
