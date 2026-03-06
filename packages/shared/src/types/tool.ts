import type { AgentType } from './agent';

export enum ToolType {
  NUMERICAL = 'numerical',
  INVENTORY_DATA = 'inventory_data',
  SKILL_DATA = 'skill_data',
  MAP_DATA = 'map_data',
  NPC_DATA = 'npc_data',
  QUEST_DATA = 'quest_data',
  EVENT_DATA = 'event_data',
  DIALOGUE_DATA = 'dialogue_data',
  COMBAT_DATA = 'combat_data',
  STORY_DATA = 'story_data',
  UI_DATA = 'ui_data',
}

export interface ToolConfig {
  id: string;
  name: string;
  description: string;
  version: string;
}

export interface ToolResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  metadata?: {
    duration: number;
    cached: boolean;
  };
}

export interface ToolMethodMetadata {
  name: string;
  description: string;
  isRead: boolean;
  params: Record<string, unknown>;
  returns: string;
}

export interface ToolStatus {
  type: ToolType;
  name: string;
  status: 'idle' | 'busy' | 'error';
  lastCall: number;
  callCount: number;
  errorCount: number;
  averageDuration: number;
}

export type ToolPermission = 'read' | 'write';

export interface ToolCallContext {
  agentId: AgentType;
  requestId: string;
  timestamp: number;
  permission: ToolPermission;
}

export interface ToolCallMessage {
  id: string;
  type: 'tool_call';
  toolType: ToolType;
  method: string;
  params: Record<string, unknown>;
  context: ToolCallContext;
  metadata?: Record<string, unknown>;
}

export interface ToolResponseMessage {
  id: string;
  type: 'tool_response';
  callId: string;
  response: ToolResponse;
  context: ToolCallContext;
  duration: number;
}

export const TOOL_DESCRIPTIONS: Record<ToolType, string> = {
  [ToolType.NUMERICAL]: '数值计算工具，负责属性计算、伤害公式、经验曲线',
  [ToolType.INVENTORY_DATA]: '背包数据工具，负责物品 CRUD、堆叠逻辑、装备穿戴',
  [ToolType.SKILL_DATA]: '技能数据工具，负责技能 CRUD、冷却管理',
  [ToolType.MAP_DATA]: '地图数据工具，负责位置查询、移动验证、区域管理',
  [ToolType.NPC_DATA]: 'NPC 数据工具，负责 NPC CRUD、关系管理、队伍管理',
  [ToolType.QUEST_DATA]: '任务数据工具，负责任务 CRUD、进度追踪、奖励发放',
  [ToolType.EVENT_DATA]: '事件数据工具，负责事件 CRUD、条件检查、事件链',
  [ToolType.DIALOGUE_DATA]: '对话数据工具，负责对话历史管理、上下文构建',
  [ToolType.COMBAT_DATA]: '战斗数据工具，负责战斗状态管理、回合处理',
  [ToolType.STORY_DATA]: '故事数据工具，负责剧情节点管理、选择记录',
  [ToolType.UI_DATA]: 'UI 数据工具，负责 UI 状态管理、指令队列',
};

export const TOOL_READ_METHODS: Record<ToolType, string[]> = {
  [ToolType.NUMERICAL]: ['calculateStats', 'calculateDamage', 'calculateExp', 'calculateLevelUp'],
  [ToolType.INVENTORY_DATA]: ['getItem', 'listItems', 'getEquipment', 'hasItem'],
  [ToolType.SKILL_DATA]: ['getSkill', 'listSkills', 'isOnCooldown', 'getRemainingCooldown'],
  [ToolType.MAP_DATA]: ['getLocation', 'getArea', 'getConnections', 'canMoveTo', 'getTravelTime'],
  [ToolType.NPC_DATA]: ['getNPC', 'listNPCs', 'getRelationship', 'getPartyMembers'],
  [ToolType.QUEST_DATA]: ['getQuest', 'listQuests', 'getProgress', 'checkPrerequisites'],
  [ToolType.EVENT_DATA]: ['getEvent', 'listEvents', 'checkConditions', 'getTriggerHistory'],
  [ToolType.DIALOGUE_DATA]: ['getHistory', 'getContext', 'getEmotionHistory'],
  [ToolType.COMBAT_DATA]: ['getCombatState', 'getCurrentTurn', 'getCombatants'],
  [ToolType.STORY_DATA]: ['getNode', 'getChoices', 'getSummary', 'getPlotPoints'],
  [ToolType.UI_DATA]: ['getState', 'getQueue', 'getComponent'],
};

export const TOOL_WRITE_METHODS: Record<ToolType, string[]> = {
  [ToolType.NUMERICAL]: [],
  [ToolType.INVENTORY_DATA]: ['createCharacter', 'createItem', 'updateItem', 'deleteItem', 'equipItem', 'unequipItem'],
  [ToolType.SKILL_DATA]: ['createSkill', 'updateSkill', 'deleteSkill', 'startCooldown'],
  [ToolType.MAP_DATA]: ['createArea', 'updateArea', 'addConnection', 'updateLocation'],
  [ToolType.NPC_DATA]: ['createNPC', 'updateNPC', 'updateRelationship', 'addPartyMember', 'removePartyMember'],
  [ToolType.QUEST_DATA]: ['createQuest', 'updateProgress', 'completeQuest', 'grantRewards'],
  [ToolType.EVENT_DATA]: ['createEvent', 'recordTrigger', 'updateEvent'],
  [ToolType.DIALOGUE_DATA]: ['addHistory', 'recordEmotion', 'clearHistory'],
  [ToolType.COMBAT_DATA]: ['initCombat', 'applyEffect', 'removeEffect', 'endCombat', 'nextTurn'],
  [ToolType.STORY_DATA]: ['addNode', 'recordChoice', 'saveSummary', 'updateNode'],
  [ToolType.UI_DATA]: ['updateState', 'queueInstruction', 'clearQueue'],
};
