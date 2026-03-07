/**
 * 游戏状态类型定义
 * 统一管理游戏运行时的状态数据
 */

import type { Character, InventoryItem, Skill } from './character';
import type { EquipmentState } from './item';
import type { Quest } from './quest';
import type { NPC } from './npc';
import type { GameMap } from './map';

// ==================== 动态 UI 类型 ====================

/**
 * 动态 UI 数据类型（通用，无类型区分）
 * 用于存储动态生成的 UI 内容
 */
export interface DynamicUIData {
  /** UI 实例 ID */
  id: string;
  /** Markdown 内容（决定展示形式） */
  markdown: string;
  /** 上下文数据 */
  context?: Record<string, unknown>;
}

// ==================== 日志类型 ====================

/**
 * 日志条目类型
 */
export type JournalEntryType = 'quest' | 'combat' | 'discovery' | 'dialog' | 'trade' | 'system';

/**
 * 日志条目
 */
export interface JournalEntry {
  /** 日志 ID */
  id: string;
  /** 时间戳 */
  timestamp: number;
  /** 日志类型 */
  type: JournalEntryType;
  /** 日志内容 */
  content: string;
}

// ==================== 游戏状态类型 ====================

/**
 * 统一游戏状态类型
 * 包含游戏运行时的所有状态数据
 */
export interface GameState {
  // ========== 角色数据 ==========
  /** 角色信息 */
  character: Character | null;

  // ========== 游戏状态数据 ==========
  /** 技能列表 */
  skills: Skill[];
  /** 背包物品 */
  inventory: InventoryItem[];
  /** 装备状态 */
  equipment: EquipmentState;
  /** 任务列表 */
  quests: Quest[];
  /** NPC 列表 */
  npcs: NPC[];
  /** 地图数据 */
  mapData: GameMap | null;
  /** 日志条目 */
  journalEntries: JournalEntry[];

  // ========== 动态 UI 数据 ==========
  /** 动态 UI 数据 */
  dynamicUI: DynamicUIData | null;
}

// ==================== API 请求/响应类型 ====================

/**
 * 更新游戏状态请求类型
 */
export interface UpdateGameStateRequest {
  /** 存档 ID */
  saveId: string;
  /** 要更新的游戏状态数据（部分更新） */
  data: Partial<GameState>;
}

/**
 * 游戏状态响应类型
 */
export interface GameStateResponse {
  success: boolean;
  data?: GameState;
  error?: {
    code: string;
    message: string;
  };
}

// ==================== 动态 UI 操作类型 ====================

/**
 * 动态 UI 操作消息类型
 * 用于前端与后端之间的动态 UI 交互
 */
export interface DynamicUIActionMessage {
  /** 消息类型标识 */
  type: 'dynamic_ui_action';
  /** 操作类型：'close', 'start_game', 'confirm_enhance' 等 */
  action: string;
  /** 动态 UI 实例 ID */
  dynamicUIId: string;
  /** 上下文数据 */
  context?: Record<string, unknown>;
  /** 操作附加数据 */
  data?: unknown;
}

// ==================== 游戏状态快照类型 ====================

/**
 * 游戏状态快照
 * 用于存档或回滚
 */
export interface GameStateSnapshot {
  /** 快照 ID */
  id: string;
  /** 存档 ID */
  saveId: string;
  /** 快照时间戳 */
  timestamp: number;
  /** 快照描述 */
  description?: string;
  /** 游戏状态数据 */
  state: GameState;
}

// ==================== 游戏状态差异类型 ====================

/**
 * 游戏状态差异
 * 用于增量更新
 */
export interface GameStateDiff {
  /** 字段路径 */
  path: string;
  /** 操作类型 */
  operation: 'set' | 'delete' | 'merge';
  /** 新值 */
  value?: unknown;
}

// ==================== 初始游戏状态 ====================

/**
 * 创建初始游戏状态
 */
export function createInitialGameState(): GameState {
  return {
    character: null,
    skills: [],
    inventory: [],
    equipment: {
      weapon: undefined,
      head: undefined,
      body: undefined,
      feet: undefined,
      accessories: [],
    },
    quests: [],
    npcs: [],
    mapData: null,
    journalEntries: [],
    dynamicUI: null,
  };
}
