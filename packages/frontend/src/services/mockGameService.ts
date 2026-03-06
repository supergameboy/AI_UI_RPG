import type {
  GameState,
  Character,
  SkillState,
  InventoryGameState,
  EquipmentState,
  QuestState,
  NPCGameState,
  MapGameState,
  JournalEntry,
  DynamicUIData,
} from '@ai-rpg/shared';
import {
  mockCharacter,
  mockSkillState,
  mockInventoryState,
  mockEquipmentState,
  mockQuestState,
  mockNPCState,
  mockMapState,
  mockJournalEntries,
  mockDynamicUI,
} from '../data/mockGameData';

export const mockGameService = {
  loadMockData(): Partial<GameState> {
    return {
      character: this.loadMockCharacter(),
      skills: this.loadMockSkills(),
      inventory: this.loadMockInventory(),
      equipment: this.loadMockEquipment(),
      quests: this.loadMockQuests(),
      npcs: this.loadMockNPCs(),
      map: this.loadMockMap(),
      journal: this.loadMockJournal(),
      dynamicUI: this.loadMockDynamicUI(),
    };
  },

  loadMockCharacter(): Character {
    return mockCharacter;
  },

  loadMockSkills(): SkillState {
    return mockSkillState;
  },

  loadMockInventory(): InventoryGameState {
    return mockInventoryState;
  },

  loadMockEquipment(): EquipmentState {
    return mockEquipmentState;
  },

  loadMockQuests(): QuestState {
    return mockQuestState;
  },

  loadMockNPCs(): NPCGameState {
    return mockNPCState;
  },

  loadMockMap(): MapGameState {
    return mockMapState;
  },

  loadMockJournal(): JournalEntry[] {
    return mockJournalEntries;
  },

  loadMockDynamicUI(): DynamicUIData | null {
    return mockDynamicUI;
  },

  loadMockDataWithoutDynamicUI(): Partial<GameState> {
    const data = this.loadMockData();
    return {
      ...data,
      dynamicUI: null,
    };
  },

  loadMockDataForPanel(panel: string): unknown {
    switch (panel) {
      case 'character':
        return this.loadMockCharacter();
      case 'skills':
        return this.loadMockSkills();
      case 'inventory':
        return this.loadMockInventory();
      case 'equipment':
        return this.loadMockEquipment();
      case 'quests':
        return this.loadMockQuests();
      case 'npcs':
        return this.loadMockNPCs();
      case 'map':
        return this.loadMockMap();
      case 'journal':
        return this.loadMockJournal();
      case 'dynamicUI':
        return this.loadMockDynamicUI();
      default:
        return null;
    }
  },
};

export default mockGameService;
