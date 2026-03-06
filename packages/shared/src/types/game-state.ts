import type { Character } from './character';
import type { ExtendedSkill, SkillCooldownState } from './skill';
import type { InventorySlot, EquipmentState } from './item';
import type { Quest } from './quest';
import type { NPC, NPCRelationship } from './npc';
import type { GameMap } from './map';

export type DynamicUIType =
  | 'welcome'
  | 'notification'
  | 'dialog'
  | 'enhancement'
  | 'warehouse'
  | 'shop'
  | 'custom';

export interface DynamicUIData {
  id: string;
  type: DynamicUIType;
  markdown: string;
  context?: Record<string, unknown>;
}

export interface JournalEntry {
  id: string;
  timestamp: number;
  type: 'story' | 'combat' | 'quest' | 'discovery' | 'dialogue' | 'system';
  title: string;
  content: string;
  tags?: string[];
  relatedQuestId?: string;
  relatedNpcId?: string;
  relatedLocationId?: string;
}

export interface SkillState {
  skills: ExtendedSkill[];
  cooldowns: SkillCooldownState[];
  skillPoints: number;
}

export interface InventoryGameState {
  slots: InventorySlot[];
  capacity: number;
  currency: Record<string, number>;
}

export interface QuestState {
  activeQuests: Quest[];
  completedQuestIds: string[];
  failedQuestIds: string[];
}

export interface NPCGameState {
  npcs: NPC[];
  relationships: Record<string, NPCRelationship>;
  partyMemberIds: string[];
}

export interface MapGameState {
  currentMapId: string | null;
  currentLocationId: string | null;
  visitedLocations: string[];
  discoveredAreas: string[];
  mapData: GameMap | null;
}

export interface GameState {
  character: Character | null;
  skills: SkillState;
  inventory: InventoryGameState;
  equipment: EquipmentState;
  quests: QuestState;
  npcs: NPCGameState;
  map: MapGameState;
  journal: JournalEntry[];
  dynamicUI: DynamicUIData | null;
}

export const DEFAULT_SKILL_STATE: SkillState = {
  skills: [],
  cooldowns: [],
  skillPoints: 0,
};

export const DEFAULT_INVENTORY_STATE: InventoryGameState = {
  slots: [],
  capacity: 50,
  currency: { gold: 0 },
};

export const DEFAULT_EQUIPMENT_STATE: EquipmentState = {
  weapon: undefined,
  head: undefined,
  body: undefined,
  feet: undefined,
  accessories: [],
  customSlots: undefined,
};

export const DEFAULT_QUEST_STATE: QuestState = {
  activeQuests: [],
  completedQuestIds: [],
  failedQuestIds: [],
};

export const DEFAULT_NPC_STATE: NPCGameState = {
  npcs: [],
  relationships: {},
  partyMemberIds: [],
};

export const DEFAULT_MAP_STATE: MapGameState = {
  currentMapId: null,
  currentLocationId: null,
  visitedLocations: [],
  discoveredAreas: [],
  mapData: null,
};

export const DEFAULT_GAME_STATE: GameState = {
  character: null,
  skills: DEFAULT_SKILL_STATE,
  inventory: DEFAULT_INVENTORY_STATE,
  equipment: DEFAULT_EQUIPMENT_STATE,
  quests: DEFAULT_QUEST_STATE,
  npcs: DEFAULT_NPC_STATE,
  map: DEFAULT_MAP_STATE,
  journal: [],
  dynamicUI: null,
};

export interface UpdateGameStateRequest {
  saveId: string;
  updates: Partial<GameState>;
  source?: string;
  reason?: string;
}

export interface UpdateGameStateResponse {
  success: boolean;
  appliedUpdates: Partial<GameState>;
  timestamp: number;
}

export interface DynamicUIRequest {
  type: 'generate_dynamic_ui';
  payload: {
    uiType: DynamicUIType;
    description: string;
    context: Record<string, unknown>;
  };
}

export interface DynamicUIResponse {
  dynamicUI: DynamicUIData;
}

export type GameStateUpdateSource = 'agent' | 'tool' | 'websocket' | 'user' | 'system';

export interface GameStateUpdateLog {
  id: string;
  timestamp: number;
  source: GameStateUpdateSource;
  sourceId?: string;
  updates: Partial<GameState>;
  reason?: string;
}
