import type { AgentType } from './agent';

export interface BindingMatch {
  messageType?: string | '*';
  context?: {
    inCombat?: boolean;
    inDialogue?: boolean;
    location?: string;
    [key: string]: unknown;
  };
  custom?: {
    field: string;
    operator: 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains' | 'matches';
    value: unknown;
  }[];
}

export interface Binding {
  id: string;
  agentId: AgentType;
  match: BindingMatch;
  priority: number;
  enabled: boolean;
  description?: string;
  createdAt: number;
  updatedAt: number;
}

export interface BindingConfig {
  bindings: Binding[];
  defaultAgentId: AgentType;
  version: string;
}

export interface BindingRouterOptions {
  cacheEnabled: boolean;
  cacheTTL: number;
  logEnabled: boolean;
}

export interface BindingRouteResult {
  binding: Binding | null;
  agentId: AgentType;
  matched: boolean;
  matchDetails?: {
    matchedConditions: string[];
    score: number;
  };
}

export interface BindingTestRequest {
  messageType: string;
  context: Record<string, unknown>;
}

export interface BindingTestResult {
  matched: boolean;
  agentId: AgentType | null;
  binding: Binding | null;
  allMatches: BindingRouteResult[];
}

export const DEFAULT_BINDING_ROUTER_OPTIONS: BindingRouterOptions = {
  cacheEnabled: true,
  cacheTTL: 60000,
  logEnabled: true,
};

export const DEFAULT_BINDINGS: Binding[] = [
  {
    id: 'game_init',
    agentId: 'coordinator' as AgentType,
    match: { messageType: 'game_init' },
    priority: 100,
    enabled: true,
    description: '游戏初始化',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'dialogue_request',
    agentId: 'dialogue' as AgentType,
    match: { messageType: 'dialogue_request' },
    priority: 10,
    enabled: true,
    description: '对话请求',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'npc_interaction',
    agentId: 'dialogue' as AgentType,
    match: { messageType: 'npc_interaction' },
    priority: 8,
    enabled: true,
    description: 'NPC 交互',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'combat_action',
    agentId: 'combat' as AgentType,
    match: { messageType: 'combat_action' },
    priority: 10,
    enabled: true,
    description: '战斗行动',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'combat_context',
    agentId: 'combat' as AgentType,
    match: { context: { inCombat: true } },
    priority: 5,
    enabled: true,
    description: '战斗上下文',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'generate_item',
    agentId: 'inventory' as AgentType,
    match: { messageType: 'generate_item' },
    priority: 10,
    enabled: true,
    description: '生成物品',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'generate_skill',
    agentId: 'skill' as AgentType,
    match: { messageType: 'generate_skill' },
    priority: 10,
    enabled: true,
    description: '生成技能',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'generate_area',
    agentId: 'map' as AgentType,
    match: { messageType: 'generate_area' },
    priority: 10,
    enabled: true,
    description: '生成地图区域',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'quest_event',
    agentId: 'quest' as AgentType,
    match: { messageType: 'quest_event' },
    priority: 10,
    enabled: true,
    description: '任务事件',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'default_fallback',
    agentId: 'coordinator' as AgentType,
    match: { messageType: '*' },
    priority: 0,
    enabled: true,
    description: '默认回退',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];
