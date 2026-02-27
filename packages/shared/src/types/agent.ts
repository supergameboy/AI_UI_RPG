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
}

export interface Agent {
  id: string;
  name: string;
  type: AgentType;
  description: string;

  capabilities: string[];

  memory: {
    shortTerm: AgentMemory[];
    longTerm: AgentMemory[];
    compressed: string;
  };

  prompts: {
    system: string;
    user?: string;
  };

  status: 'idle' | 'processing' | 'waiting' | 'error';
}

export interface AgentMemory {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: number;
  importance: number;
}

export interface AgentMessage {
  id: string;
  from: AgentType;
  to: AgentType | AgentType[];
  type: 'request' | 'response' | 'broadcast' | 'error';
  action: string;
  payload: Record<string, unknown>;
  timestamp: number;
  priority: 'low' | 'normal' | 'high' | 'urgent';
}

export interface AgentResponse {
  success: boolean;
  data?: unknown;
  error?: string;
  uiInstructions?: UIInstruction[];
}

export interface UIInstruction {
  type: 'update' | 'show' | 'hide' | 'navigate' | 'notify' | 'play_sound';
  target: string;
  action: string;
  data: Record<string, unknown>;
}
