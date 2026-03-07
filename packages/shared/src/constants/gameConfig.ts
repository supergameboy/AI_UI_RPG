/**
 * 游戏配置常量
 * 集中管理游戏中的硬编码数值
 */

/**
 * 战斗失败后恢复生命值的百分比
 */
export const COMBAT_REVIVE_HEALTH_PERCENT = 0.3;

/**
 * 每级经验值基础值
 * 升级所需经验 = level * EXPERIENCE_PER_LEVEL_BASE
 */
export const EXPERIENCE_PER_LEVEL_BASE = 100;

/**
 * 默认资源值
 * 用于技能消耗计算等场景的默认资源上限
 */
export const DEFAULT_RESOURCE_VALUES = {
  mana: 100,
  health: 100,
  stamina: 100,
} as const;

/**
 * 默认资源值类型
 */
export type DefaultResourceValues = typeof DEFAULT_RESOURCE_VALUES;
