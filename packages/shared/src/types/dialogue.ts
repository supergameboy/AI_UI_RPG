import type { WorldSetting } from './template';

export type DialogueType = 'normal' | 'quest' | 'trade' | 'combat' | 'romance' | 'system';
export type MessageRole = 'user' | 'assistant' | 'system' | 'narrator';

export interface DialogueMessage {
  id: string;
  role: MessageRole;
  content: string;
  type: DialogueType;
  timestamp: number;
  npcId?: string;
  npcName?: string;
  metadata?: {
    location?: string;
    questId?: string;
    emotion?: string;
    [key: string]: unknown;
  };
}

export interface DialogueOption {
  id: string;
  text: string;
  type: DialogueType;
  disabled?: boolean;
  disabledReason?: string;
  metadata?: {
    questId?: string;
    npcId?: string;
    action?: string;
    [key: string]: unknown;
  };
}

export interface DialogueState {
  messages: DialogueMessage[];
  options: DialogueOption[];
  isLoading: boolean;
  currentNpcId?: string;
  context?: {
    location?: string;
    recentEvents?: string[];
    activeQuests?: string[];
  };
}

export interface InitialSceneRequest {
  characterId: string;
  saveId?: string;
  templateId: string;
  characterName: string;
  characterRace: string;
  characterClass: string;
  characterBackground?: string;
  worldSetting?: string | WorldSetting;
}

export interface InitialSceneResponse {
  success: boolean;
  message: DialogueMessage;
  options: DialogueOption[];
  context?: {
    location: string;
    timeOfDay: string;
    weather?: string;
    atmosphere?: string;
  };
}

export interface SendDialogueRequest {
  characterId: string;
  saveId?: string;
  message: string;
  optionId?: string;
  npcId?: string;
  context?: {
    location?: string;
    recentMessages?: Array<{ role: string; content: string; timestamp: number }>;
  };
}

export interface SendDialogueResponse {
  success: boolean;
  message: DialogueMessage;
  options: DialogueOption[];
  stateChanges?: {
    health?: number;
    mana?: number;
    gold?: number;
    experience?: number;
    relationship?: {
      npcId: string;
      change: number;
    };
  };
}

export interface GetOptionsRequest {
  characterId: string;
  saveId?: string;
  npcId?: string;
  context?: {
    location?: string;
    inCombat?: boolean;
  };
}

export interface GetOptionsResponse {
  success: boolean;
  options: DialogueOption[];
}

export interface DialogueHistoryRequest {
  characterId: string;
  saveId?: string;
  limit?: number;
  offset?: number;
  npcId?: string;
}

export interface DialogueHistoryResponse {
  success: boolean;
  messages: DialogueMessage[];
  total: number;
  hasMore: boolean;
}
