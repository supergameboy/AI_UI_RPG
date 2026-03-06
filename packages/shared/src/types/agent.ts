export enum AgentType {
  COORDINATOR = 'coordinator',
  STORY_CONTEXT = 'story_context',
  QUEST = 'quest',
  MAP = 'map',
  NPC_PARTY = 'npc_party',
  NUMERICAL = 'numerical',
  INVENTORY = 'inventory',
  SKILL = 'skill',
  UI = 'ui',
  COMBAT = 'combat',
  DIALOGUE = 'dialogue',
  EVENT = 'event',
}

export interface AgentConfig {
  provider: string;
  model: string;
  temperature: number;
  maxTokens: number;
  timeout: number;
  maxRetries: number;
}

/**
 * Agent 绑定配置
 * 定义 Agent 可以调用的其他 Agent 及其条件
 */
export interface AgentBinding {
  /** 目标 Agent 类型 */
  agentType: AgentType;
  /** 调用条件（可选，不设置则默认可调用） */
  condition?: {
    /** 消息类型匹配 */
    messageType?: string | string[];
    /** 上下文条件 */
    context?: Record<string, unknown>;
  };
  /** 调用优先级 */
  priority?: number;
  /** 是否启用 */
  enabled?: boolean;
}

export interface Agent {
  id: string;
  name: string;
  type: AgentType;
  description: string;
  capabilities: string[];
  /** 依赖的 Tool 类型列表 */
  tools: string[];
  /** 可调用的 Agent 绑定配置 */
  bindings: AgentBinding[];
  config: AgentConfig;
  memory: AgentMemorySystem;
  systemPrompt: string;
  status: 'idle' | 'processing' | 'waiting' | 'error';
}

export interface AgentMemorySystem {
  shortTerm: AgentMemory[];
  midTerm: AgentMemory[];
  longTerm: AgentMemory[];
  compressed: string;
}

export interface AgentMemory {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: number;
  importance: number;
  metadata?: Record<string, unknown>;
}

export type MessagePriority = 'low' | 'normal' | 'high' | 'critical';
export type MessageType = 'request' | 'response' | 'notification' | 'error' | 'tool_call' | 'tool_response';

import type { ToolType, ToolPermission } from './tool';

/**
 * Tool 调用消息载荷
 */
export interface ToolCallPayload {
  toolType: ToolType;
  method: string;
  params: Record<string, unknown>;
  permission: ToolPermission;
}

/**
 * Tool 响应消息载荷
 */
export interface ToolResponsePayload {
  toolType: ToolType;
  method: string;
  success: boolean;
  data?: unknown;
  error?: string;
  duration?: number;
}

export interface AgentMessage {
  id: string;
  timestamp: number;
  from: AgentType;
  to: AgentType | AgentType[];
  type: MessageType;
  payload: {
    action: string;
    data: Record<string, unknown>;
    context?: Record<string, unknown>;
  };
  metadata: {
    priority: MessagePriority;
    requiresResponse: boolean;
    timeout?: number;
    retryCount?: number;
  };
  correlationId?: string;
  /** Tool 调用载荷，当 type 为 'tool_call' 时使用 */
  toolCall?: ToolCallPayload;
  /** Tool 响应载荷，当 type 为 'tool_response' 时使用 */
  toolResponse?: ToolResponsePayload;
}

export interface AgentResponse {
  success: boolean;
  data?: unknown;
  error?: string;
  uiInstructions?: UIInstruction[];
  requiresFollowUp?: boolean;
}

export type UIInstructionType = 'update' | 'show' | 'hide' | 'animate' | 'notify' | 'dialog' | 'custom';

export interface UIInstruction {
  type: UIInstructionType;
  target: string;
  action: string;
  data: Record<string, unknown>;
  options?: {
    duration?: number;
    easing?: string;
    priority?: 'low' | 'normal' | 'high' | 'critical';
  };
}

export interface AgentLog {
  id: string;
  timestamp: number;
  agentType: AgentType;
  direction: 'in' | 'out';
  message: AgentMessage;
  processingTime?: number;
  status: 'pending' | 'success' | 'error' | 'timeout';
  error?: string;
  /** Tool 调用相关信息 */
  toolCall?: {
    toolType: ToolType;
    method: string;
    duration?: number;
  };
}

export interface AgentStatus {
  type: AgentType;
  status: 'idle' | 'processing' | 'waiting' | 'error';
  lastActivity: number;
  messagesProcessed: number;
  errors: number;
  averageProcessingTime: number;
}

export const DEFAULT_AGENT_CONFIG: AgentConfig = {
  provider: 'deepseek',
  model: 'deepseek-chat',
  temperature: 0.7,
  maxTokens: 2048,
  timeout: 30000,
  maxRetries: 3,
};

export const AGENT_DESCRIPTIONS: Record<AgentType, string> = {
  [AgentType.COORDINATOR]: '统筹管理智能体，负责接收玩家输入、分析意图、分配任务、整合结果',
  [AgentType.STORY_CONTEXT]: '故事上下文智能体，负责维护故事主线、记录玩家选择、生成剧情摘要',
  [AgentType.QUEST]: '任务管理智能体，负责生成任务、追踪进度、处理完成和失败',
  [AgentType.MAP]: '地图管理智能体，负责管理游戏世界地图、生成区域、处理玩家移动',
  [AgentType.NPC_PARTY]: 'NPC和队伍管理智能体，负责管理NPC信息、控制行为对话、处理关系和好感度',
  [AgentType.NUMERICAL]: '数值管理智能体，负责属性计算、战斗数值、经验值和等级管理',
  [AgentType.INVENTORY]: '背包系统智能体，负责物品管理、装备系统、交易处理',
  [AgentType.SKILL]: '技能管理智能体，负责技能管理、学习和升级、效果计算、冷却管理',
  [AgentType.UI]: 'UI管理智能体，负责解析其他智能体输出、生成UI指令、管理动态组件',
  [AgentType.COMBAT]: '战斗管理智能体，负责战斗流程管理、回合处理、战斗AI',
  [AgentType.DIALOGUE]: '对话管理智能体，负责对话生成、对话选项、对话历史管理',
  [AgentType.EVENT]: '事件管理智能体，负责随机事件、触发条件、事件链管理',
};

export const AGENT_CAPABILITIES: Record<AgentType, string[]> = {
  [AgentType.COORDINATOR]: ['intent_analysis', 'task_allocation', 'conflict_resolution', 'result_integration'],
  [AgentType.STORY_CONTEXT]: ['plot_management', 'choice_recording', 'summary_generation', 'consistency_check'],
  [AgentType.QUEST]: ['quest_generation', 'progress_tracking', 'reward_distribution', 'quest_chain_management'],
  [AgentType.MAP]: ['location_generation', 'movement_handling', 'connection_management', 'exploration_tracking'],
  [AgentType.NPC_PARTY]: ['npc_management', 'relationship_handling', 'behavior_generation', 'party_management'],
  [AgentType.NUMERICAL]: ['attribute_calculation', 'damage_calculation', 'level_management', 'balance_adjustment'],
  [AgentType.INVENTORY]: ['item_management', 'equipment_handling', 'trading', 'inventory_organization'],
  [AgentType.SKILL]: ['skill_management', 'effect_calculation', 'cooldown_management', 'skill_upgrade'],
  [AgentType.UI]: ['instruction_parsing', 'component_rendering', 'notification_handling', 'dynamic_ui'],
  [AgentType.COMBAT]: ['combat_flow', 'turn_management', 'combat_ai', 'result_processing'],
  [AgentType.DIALOGUE]: ['dialogue_generation', 'option_generation', 'history_management', 'context_awareness'],
  [AgentType.EVENT]: ['event_generation', 'condition_checking', 'event_chain', 'random_events'],
};
