import { AgentType } from './agent';

export type PromptVariableType = 
  | 'game_state' 
  | 'player' 
  | 'world' 
  | 'context' 
  | 'custom';

export interface PromptVariable {
  name: string;
  type: PromptVariableType;
  description: string;
  defaultValue?: string;
  required: boolean;
}

export interface PromptTemplate {
  id: string;
  agentType: AgentType;
  name: string;
  description: string;
  content: string;
  variables: PromptVariable[];
  metadata: {
    createdAt: number;
    updatedAt: number;
    version: number;
    author?: string;
    tags?: string[];
  };
}

export interface PromptVersion {
  id: string;
  templateId: string;
  version: number;
  content: string;
  variables: PromptVariable[];
  createdAt: number;
  createdBy?: string;
  changeNote?: string;
}

export interface PromptTestResult {
  id: string;
  templateId: string;
  version: number;
  testInput: string;
  testOutput: string;
  metrics: {
    responseTime: number;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  evaluation?: {
    score: number;
    feedback: string;
    criteria: Record<string, number>;
  };
  createdAt: number;
}

export interface PromptContext {
  gameState?: {
    currentChapter?: number;
    currentLocation?: string;
    gameTime?: string;
    fullState?: Record<string, unknown>;
  };
  player?: {
    name?: string;
    class?: string;
    level?: number;
    attributes?: Record<string, number>;
  };
  world?: {
    name?: string;
    era?: string;
    magicSystem?: string;
    customSettings?: Record<string, string>;
  };
  context?: {
    recentHistory?: string;
    activeQuests?: string[];
    nearbyNPCs?: string[];
    availableActions?: string[];
  };
  custom?: Record<string, unknown>;
}

export const BUILTIN_VARIABLES: PromptVariable[] = [
  { name: 'game_state', type: 'game_state', description: '完整游戏状态JSON', required: false },
  { name: 'current_chapter', type: 'game_state', description: '当前章节', required: false },
  { name: 'current_location', type: 'game_state', description: '当前位置', required: false },
  { name: 'game_time', type: 'game_state', description: '游戏内时间', required: false },
  { name: 'player_name', type: 'player', description: '玩家名称', required: false },
  { name: 'player_class', type: 'player', description: '玩家职业', required: false },
  { name: 'player_level', type: 'player', description: '玩家等级', required: false },
  { name: 'player_attributes', type: 'player', description: '玩家属性', required: false },
  { name: 'world_name', type: 'world', description: '世界名称', required: false },
  { name: 'world_era', type: 'world', description: '时代背景', required: false },
  { name: 'magic_system', type: 'world', description: '魔法系统描述', required: false },
  { name: 'custom_settings', type: 'world', description: '自定义设定', required: false },
  { name: 'recent_history', type: 'context', description: '最近对话历史', required: false },
  { name: 'active_quests', type: 'context', description: '活跃任务列表', required: false },
  { name: 'nearby_npcs', type: 'context', description: '附近NPC列表', required: false },
  { name: 'available_actions', type: 'context', description: '可用行动列表', required: false },
];

export const VARIABLE_PATTERN = /\{\{(\w+)\}\}/g;
