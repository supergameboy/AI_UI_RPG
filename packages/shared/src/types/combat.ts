import type { StatusEffect } from './character';

// ==================== 战斗类型定义 ====================

/**
 * 战斗状态
 */
export enum CombatState {
  PREPARING = 'preparing',     // 准备中
  IN_PROGRESS = 'in_progress', // 进行中
  PLAYER_TURN = 'player_turn', // 玩家回合
  ENEMY_TURN = 'enemy_turn',   // 敌人回合
  ENDED = 'ended',             // 已结束
}

/**
 * 行动类型
 */
export enum ActionType {
  ATTACK = 'attack',     // 攻击
  SKILL = 'skill',       // 技能
  ITEM = 'item',         // 物品
  DEFEND = 'defend',     // 防御
  FLEE = 'flee',         // 逃跑
}

/**
 * 战斗AI难度
 */
export enum CombatDifficulty {
  EASY = 'easy',         // 简单
  NORMAL = 'normal',     // 普通
  HARD = 'hard',         // 困难
}

/**
 * 战斗单位类型
 */
export type CombatUnitType = 'player' | 'ally' | 'enemy';

/**
 * 战斗单位属性
 */
export interface CombatUnitStats {
  maxHp: number;
  currentHp: number;
  maxMp: number;
  currentMp: number;
  attack: number;
  defense: number;
  speed: number;
  luck: number;
}

/**
 * 战斗单位
 */
export interface CombatUnit {
  id: string;
  name: string;
  type: CombatUnitType;
  level: number;
  stats: CombatUnitStats;
  skills: string[];
  statusEffects: StatusEffect[];
  isDefending: boolean;
  isAlive: boolean;
  position: { x: number; y: number };
  customData?: Record<string, unknown>;
}

/**
 * 战斗行动
 */
export interface CombatAction {
  id: string;
  actorId: string;
  type: ActionType;
  targetId?: string;
  targetIds?: string[];
  skillId?: string;
  itemId?: string;
  damage?: number;
  healing?: number;
  effects?: StatusEffect[];
  success: boolean;
  message: string;
  timestamp: number;
}

/**
 * 战斗回合记录
 */
export interface CombatTurn {
  turnNumber: number;
  phase: 'player' | 'enemy';
  actions: CombatAction[];
  timestamp: number;
}

/**
 * 战斗结果
 */
export interface CombatResult {
  combatId: string;
  victory: boolean;
  fled: boolean;
  totalTurns: number;
  duration: number;
  rewards?: {
    experience: number;
    gold: number;
    items: string[];
    skillPoints?: number;
  };
  statistics: {
    totalDamageDealt: number;
    totalDamageTaken: number;
    totalHealing: number;
    criticalHits: number;
    skillsUsed: number;
    itemsUsed: number;
  };
}

/**
 * 战斗环境
 */
export interface CombatEnvironment {
  terrain: string;
  weather?: string;
  modifiers?: Record<string, number>;
}

/**
 * 战斗实例（序列化版本，用于跨进程传输）
 */
export interface CombatInstanceData {
  id: string;
  state: CombatState;
  difficulty: CombatDifficulty;
  turnOrder: string[];
  currentTurnIndex: number;
  turnNumber: number;
  units: Array<[string, CombatUnit]>;
  turnHistory: CombatTurn[];
  startTime: number;
  endTime?: number;
  result?: CombatResult;
  environment?: CombatEnvironment;
}

/**
 * 盟友初始化数据
 */
export interface AllyInitData {
  id: string;
  name: string;
  type: 'ally';
  stats: CombatUnitStats;
  skills?: string[];
}

/**
 * 敌人初始化数据
 */
export interface EnemyInitData {
  id: string;
  name: string;
  type: 'enemy';
  level: number;
  stats: CombatUnitStats;
  skills?: string[];
  aiPattern?: string;
}

/**
 * 战斗初始化参数
 */
export interface CombatInitParams {
  playerId: string;
  allies?: AllyInitData[];
  enemies: EnemyInitData[];
  difficulty?: CombatDifficulty;
  environment?: CombatEnvironment;
}
