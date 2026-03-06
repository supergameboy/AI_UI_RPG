import type { Character } from './character';
import type { StoryTemplate, NPCDefinition, QuestDefinition } from './template';
import type { Skill } from './skill';
import type { Item } from './item';
import type { Quest } from './quest';
import type { NPC } from './npc';
import type { GameMap, MapLocation } from './map';

/**
 * Agent 初始化结果
 * 各 Agent 的 initialize 方法返回的统一格式
 */
export interface AgentInitializationResult {
  success: boolean;
  error?: string;
  data?: Record<string, unknown>;
}

/**
 * 游戏模板类型
 * 扩展 StoryTemplate 添加初始化所需的额外数据
 */
export interface GameTemplate extends StoryTemplate {
  // 初始数据配置（可选，用于初始化流程）
  initialData?: InitialDataConfig;
  
  // 初始任务（可选）
  initialQuests?: QuestDefinition[];
  
  // 初始 NPC（可选）
  initialNPCs?: NPCDefinition[];
  
  // 起始位置配置（可选）
  startingLocation?: {
    name: string;
    description: string;
  };
  
  // 世界配置（可选）
  worldConfig?: {
    name: string;
    description: string;
  };
}

/**
 * 初始化步骤枚举
 * 定义游戏初始化的各个阶段
 */
export enum InitializationStep {
  NUMERICAL = 'numerical',       // 数值初始化
  SKILLS = 'skills',             // 技能初始化
  INVENTORY = 'inventory',       // 背包初始化
  EQUIPMENT = 'equipment',       // 装备初始化
  QUESTS = 'quests',             // 任务初始化
  MAP = 'map',                   // 地图初始化
  NPCS = 'npcs',                 // NPC初始化
  SCENE = 'scene',               // 初始场景生成
}

/**
 * 初始化状态接口
 * 记录游戏初始化的进度和状态
 */
export interface InitializationStatus {
  saveId: string;
  currentStep: InitializationStep | null;
  completedSteps: InitializationStep[];
  failed: boolean;
  error?: string;
  startedAt: number;
  completedAt?: number;
}

/**
 * 初始化请求接口
 * 包含初始化游戏所需的数据
 */
export interface InitializationRequest {
  saveId: string;
  character: Character;
  template: GameTemplate;
}

/**
 * 初始化响应接口
 * 返回初始化的结果和状态
 */
export interface InitializationResponse {
  success: boolean;
  status: InitializationStatus;
  error?: string;
  /** 各步骤的初始化数据 */
  data?: InitializationData;
}

/**
 * 初始数据配置接口
 * 定义不同职业和背景的初始数据
 */
export interface InitialDataConfig {
  skills: {
    [classId: string]: string[];  // 职业ID -> 技能ID列表
  };
  items: {
    [backgroundId: string]: Array<{
      itemId: string;
      quantity: number;
    }>;
  };
  equipment: {
    [classId: string]: {
      [slot: string]: string;     // 槽位 -> 装备ID
    };
  };
  gold: {
    [backgroundId: string]: number;
  };
}

/**
 * 步骤结果接口
 * 记录单个初始化步骤的执行结果
 */
export interface StepResult {
  step: InitializationStep;
  success: boolean;
  error?: string;
  data?: unknown;
}

// ==================== 各步骤数据类型 ====================

/**
 * 数值初始化数据
 */
export interface NumericalStepData {
  attributes: Record<string, number>;
  derivedStats?: Record<string, number>;
}

/**
 * 技能初始化数据
 */
export interface SkillsStepData {
  learnedSkills: string[];
  failedSkills: string[];
}

/**
 * 背包初始化数据
 */
export interface InventoryStepData {
  addedItems: Array<{ itemId: string; quantity: number }>;
  failedItems: string[];
  initialGold: number;
}

/**
 * 装备初始化数据
 */
export interface EquipmentStepData {
  equippedItems: Array<{ slot: string; itemId: string }>;
  failedEquips: string[];
}

/**
 * 任务初始化数据
 */
export interface QuestsStepData {
  createdQuests: string[];
  failedQuests: string[];
}

/**
 * 地图初始化数据
 */
export interface MapStepData {
  world: {
    id: string;
    name: string;
    description?: string;
  };
}

/**
 * NPC初始化数据
 */
export interface NPCsStepData {
  npcIds: string[];
}

/**
 * 场景初始化数据
 */
export interface SceneStepData {
  location: {
    name: string;
    description?: string;
  };
  characterName: string;
}

/**
 * 初始化数据集合
 * 包含所有步骤的初始化数据
 */
export interface InitializationData {
  numerical?: NumericalStepData;
  skills?: SkillsStepData;
  inventory?: InventoryStepData;
  equipment?: EquipmentStepData;
  quests?: QuestsStepData;
  map?: MapStepData;
  npcs?: NPCsStepData;
  scene?: SceneStepData;
}
