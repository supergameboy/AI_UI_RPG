import type { CombatUnitStats } from '@ai-rpg/shared';

// ==================== 战斗行为常量 ====================

/**
 * 默认逃跑概率（基础概率）
 */
export const BASE_FLEE_CHANCE = 0.3;

/**
 * 速度/幸运对逃跑成功率的影响系数
 * 每点速度或幸运增加的逃跑概率
 */
export const FLEE_STAT_MODIFIER = 0.02;

/**
 * 简单AI防御概率
 */
export const EASY_AI_DEFEND_CHANCE = 0.3;

/**
 * 暴击率系数（基于幸运值）
 * 实际暴击率 = luck * CRITICAL_RATE_MODIFIER
 */
export const CRITICAL_RATE_MODIFIER = 0.01;

/**
 * 闪避率系数（基于速度值）
 * 实际闪避率 = speed * EVADE_RATE_MODIFIER
 */
export const EVADE_RATE_MODIFIER = 0.005;

/**
 * 魔法暴击率系数（基于幸运值）
 * 魔法暴击率略低于物理暴击
 */
export const MAGIC_CRITICAL_RATE_MODIFIER = 0.008;

/**
 * 暴击伤害倍率
 */
export const CRITICAL_DAMAGE_MULTIPLIER = 1.5;

/**
 * 魔法暴击伤害倍率
 */
export const MAGIC_CRITICAL_DAMAGE_MULTIPLIER = 1.3;

/**
 * 防御减伤比例
 */
export const DEFEND_DAMAGE_REDUCTION = 0.5;

/**
 * 防御时魔法减伤比例
 */
export const DEFEND_MAGIC_DAMAGE_REDUCTION = 0.7;

/**
 * 魔法伤害基础倍率（相对物理攻击）
 */
export const MAGIC_DAMAGE_MULTIPLIER = 1.2;

/**
 * 低血量阈值比例（用于AI决策）
 */
export const LOW_HP_THRESHOLD = 0.3;

// ==================== 默认玩家属性 ====================

/**
 * 默认玩家战斗属性
 * 当 CombatInitParams 中未提供玩家属性时使用
 */
export const DEFAULT_PLAYER_COMBAT_STATS: CombatUnitStats = {
  maxHp: 100,
  currentHp: 100,
  maxMp: 50,
  currentMp: 50,
  attack: 10,
  defense: 5,
  speed: 10,
  luck: 5,
};

/**
 * 默认玩家等级
 */
export const DEFAULT_PLAYER_LEVEL = 1;

/**
 * 默认玩家名称
 */
export const DEFAULT_PLAYER_NAME = 'Player';

/**
 * 默认玩家技能列表（空）
 */
export const DEFAULT_PLAYER_SKILLS: string[] = [];

/**
 * 玩家初始化数据接口
 * 用于 CombatInitParams 中传递玩家属性
 */
export interface PlayerInitData {
  /** 玩家ID */
  id: string;
  /** 玩家名称 */
  name?: string;
  /** 玩家等级 */
  level?: number;
  /** 战斗属性 */
  stats?: Partial<CombatUnitStats>;
  /** 已学会的技能ID列表 */
  skills?: string[];
}

/**
 * 合并玩家属性与默认值
 * @param playerData 玩家初始化数据
 * @returns 完整的战斗属性
 */
export function mergePlayerCombatStats(
  playerData?: PlayerInitData
): { name: string; level: number; stats: CombatUnitStats; skills: string[] } {
  const stats: CombatUnitStats = {
    maxHp: playerData?.stats?.maxHp ?? DEFAULT_PLAYER_COMBAT_STATS.maxHp,
    currentHp: playerData?.stats?.currentHp ?? playerData?.stats?.maxHp ?? DEFAULT_PLAYER_COMBAT_STATS.currentHp,
    maxMp: playerData?.stats?.maxMp ?? DEFAULT_PLAYER_COMBAT_STATS.maxMp,
    currentMp: playerData?.stats?.currentMp ?? playerData?.stats?.maxMp ?? DEFAULT_PLAYER_COMBAT_STATS.currentMp,
    attack: playerData?.stats?.attack ?? DEFAULT_PLAYER_COMBAT_STATS.attack,
    defense: playerData?.stats?.defense ?? DEFAULT_PLAYER_COMBAT_STATS.defense,
    speed: playerData?.stats?.speed ?? DEFAULT_PLAYER_COMBAT_STATS.speed,
    luck: playerData?.stats?.luck ?? DEFAULT_PLAYER_COMBAT_STATS.luck,
  };

  return {
    name: playerData?.name ?? DEFAULT_PLAYER_NAME,
    level: playerData?.level ?? DEFAULT_PLAYER_LEVEL,
    stats,
    skills: playerData?.skills ?? DEFAULT_PLAYER_SKILLS,
  };
}
