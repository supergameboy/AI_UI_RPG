// ==================== 声望类型定义 ====================

/**
 * 声望类型
 * - faction: 阵营声望（如：王国、商会、盗贼公会等）
 * - npc: NPC好感度
 * - organization: 组织声望（如：骑士团、法师公会等）
 * - deity: 神祇声望（信仰度）
 */
export type ReputationType = 'faction' | 'npc' | 'organization' | 'deity';

/**
 * 声望等级
 */
export type ReputationRank = 'hated' | 'hostile' | 'unfriendly' | 'neutral' | 'friendly' | 'honored' | 'revered' | 'exalted';

/**
 * 声望等级配置
 */
export interface ReputationRankConfig {
  rank: ReputationRank;
  minValue: number;
  maxValue: number;
  label: string;
  description: string;
}

/**
 * 声望定义
 */
export interface ReputationDefinition {
  id: string;
  name: string;
  type: ReputationType;
  description: string;
  icon?: string;
  relatedNpc?: string[];
  relatedLocation?: string[];
  oppositeReputation?: string; // 对立声望ID
}

/**
 * 角色声望状态
 */
export interface CharacterReputation {
  reputationId: string;
  value: number;
  rank: ReputationRank;
  lastModified: number;
  history: ReputationChangeRecord[];
}

/**
 * 声望变更记录
 */
export interface ReputationChangeRecord {
  timestamp: number;
  change: number;
  reason: string;
  source: 'quest' | 'dialogue' | 'combat' | 'event' | 'item' | 'system';
  relatedId?: string; // 相关的任务ID、对话ID等
}

/**
 * 声望奖励配置
 */
export interface ReputationReward {
  reputationId: string;
  value: number;
  reason?: string;
}

/**
 * 声望效果
 */
export interface ReputationEffect {
  reputationId: string;
  minRank: ReputationRank;
  effects: {
    type: 'discount' | 'unlock' | 'bonus' | 'access' | 'dialogue' | 'quest';
    value: number | string | boolean;
    description: string;
  }[];
}

/**
 * 声望等级阈值配置
 */
export const REPUTATION_RANKS: ReputationRankConfig[] = [
  { rank: 'hated', minValue: -30000, maxValue: -15001, label: '仇恨', description: '该阵营对你充满敌意' },
  { rank: 'hostile', minValue: -15000, maxValue: -6001, label: '敌对', description: '该阵营视你为敌人' },
  { rank: 'unfriendly', minValue: -6000, maxValue: -3001, label: '不友善', description: '该阵营对你态度冷淡' },
  { rank: 'neutral', minValue: -3000, maxValue: 3000, label: '中立', description: '该阵营对你没有特别的态度' },
  { rank: 'friendly', minValue: 3001, maxValue: 9000, label: '友善', description: '该阵营对你有好感' },
  { rank: 'honored', minValue: 9001, maxValue: 21000, label: '尊敬', description: '该阵营对你十分尊重' },
  { rank: 'revered', minValue: 21001, maxValue: 42000, label: '崇敬', description: '该阵营视你为英雄' },
  { rank: 'exalted', minValue: 42001, maxValue: 999999, label: '崇拜', description: '该阵营对你顶礼膜拜' },
];

/**
 * 根据声望值获取等级
 */
export function getReputationRank(value: number): ReputationRank {
  for (const config of REPUTATION_RANKS) {
    if (value >= config.minValue && value <= config.maxValue) {
      return config.rank;
    }
  }
  return 'neutral';
}

/**
 * 获取声望等级配置
 */
export function getReputationRankConfig(rank: ReputationRank): ReputationRankConfig {
  return REPUTATION_RANKS.find(c => c.rank === rank) || REPUTATION_RANKS[3]; // 默认返回中立
}

// ==================== 自定义奖励类型 ====================

/**
 * 自定义奖励类型
 */
export type CustomRewardType = 
  | 'script'        // 脚本式奖励
  | 'trigger'       // 触发器式奖励
  | 'unlock'        // 解锁奖励（技能、地图、功能等）
  | 'flag'          // 标记奖励（设置游戏标记）
  | 'teleport'      // 传送奖励
  | 'buff'          // 增益效果
  | 'title'         // 称号奖励
  | 'achievement';  // 成就奖励

/**
 * 自定义奖励定义
 */
export interface CustomRewardDefinition {
  type: CustomRewardType;
  config: Record<string, unknown>;
}

/**
 * 脚本奖励配置
 */
export interface ScriptRewardConfig {
  scriptId: string;
  params?: Record<string, unknown>;
}

/**
 * 触发器奖励配置
 */
export interface TriggerRewardConfig {
  eventType: string;
  eventData: Record<string, unknown>;
  delay?: number;
}

/**
 * 解锁奖励配置
 */
export interface UnlockRewardConfig {
  unlockType: 'skill' | 'map' | 'feature' | 'quest' | 'item';
  targetId: string;
  permanent: boolean;
}

/**
 * 标记奖励配置
 */
export interface FlagRewardConfig {
  flagName: string;
  value: unknown;
}

/**
 * 增益效果奖励配置
 */
export interface BuffRewardConfig {
  buffId: string;
  duration?: number;
  stacks?: number;
}

/**
 * 称号奖励配置
 */
export interface TitleRewardConfig {
  titleId: string;
  titleName: string;
  description?: string;
}

/**
 * 自定义奖励执行结果
 */
export interface CustomRewardResult {
  success: boolean;
  type: CustomRewardType;
  message?: string;
  data?: Record<string, unknown>;
  error?: string;
}
