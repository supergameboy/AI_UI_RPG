/**
 * 模拟游戏服务
 * 用于前端开发和测试，提供模拟数据访问接口
 */

import type {
  Character,
  Skill,
  Item,
  EquipmentState,
  InventoryItem,
  Quest,
  NPC,
  NPCRelationship,
  GameMap,
  CombatInstanceData,
  StatusEffect,
  GlobalContext,
  DialogueOption,
  DynamicUIData,
} from '@ai-rpg/shared';
import {
  mockGameState,
  mockCharacter,
  mockSkills,
  mockItems,
  mockEquipmentState,
  mockInventoryItems,
  mockQuests,
  mockNPCs,
  mockNpcRelationships,
  mockGameMap,
  mockCombatInstance,
  mockStatusEffects,
  mockGlobalContext,
  mockDialogueOptions,
  mockJournalEntries,
  mockDynamicUI,
  emptyMockData,
  invalidMockData,
  type MockGameState,
  type MockJournalEntry,
} from '../data/mockGameData';

/**
 * 模拟游戏服务接口
 */
export interface MockGameService {
  /**
   * 加载完整模拟数据
   */
  loadMockData(): MockGameState;

  /**
   * 获取特定类型的模拟数据
   */
  getMockData<K extends keyof MockGameState>(key: K): MockGameState[K];

  /**
   * 获取角色数据
   */
  getCharacter(): Character | null;

  /**
   * 获取技能列表
   */
  getSkills(): Skill[];

  /**
   * 获取物品列表
   */
  getItems(): Item[];

  /**
   * 获取装备状态
   */
  getEquipment(): EquipmentState;

  /**
   * 获取背包物品
   */
  getInventory(): InventoryItem[];

  /**
   * 获取任务列表
   */
  getQuests(): Quest[];

  /**
   * 获取指定状态的任务
   */
  getQuestsByStatus(status: Quest['status']): Quest[];

  /**
   * 获取 NPC 列表
   */
  getNPCs(): NPC[];

  /**
   * 获取指定 ID 的 NPC
   */
  getNPCById(id: string): NPC | undefined;

  /**
   * 获取 NPC 关系数据
   */
  getNPCRelationships(): Record<string, NPCRelationship>;

  /**
   * 获取与指定 NPC 的关系
   */
  getNPCRelationship(npcId: string): NPCRelationship | undefined;

  /**
   * 获取地图数据
   */
  getMap(): GameMap | null;

  /**
   * 获取战斗数据
   */
  getCombat(): CombatInstanceData | null;

  /**
   * 获取状态效果列表
   */
  getStatusEffects(): StatusEffect[];

  /**
   * 获取全局上下文
   */
  getGlobalContext(): GlobalContext | null;

  /**
   * 获取对话选项
   */
  getDialogueOptions(): DialogueOption[];

  /**
   * 获取日志条目
   */
  getJournalEntries(): MockJournalEntry[];

  /**
   * 获取动态 UI 数据
   */
  getDynamicUI(): DynamicUIData;

  /**
   * 获取空数据状态
   */
  getEmptyData(): typeof emptyMockData;

  /**
   * 获取异常数据状态
   */
  getInvalidData(): typeof invalidMockData;

  /**
   * 模拟延迟加载
   */
  loadMockDataWithDelay(delayMs?: number): Promise<MockGameState>;

  /**
   * 模拟 API 请求
   */
  simulateApiRequest<T>(
    data: T,
    successRate?: number,
    delayMs?: number
  ): Promise<{ success: boolean; data?: T; error?: string }>;
}

/**
 * 模拟游戏服务实现
 */
export const mockGameService: MockGameService = {
  loadMockData(): MockGameState {
    return mockGameState;
  },

  getMockData<K extends keyof MockGameState>(key: K): MockGameState[K] {
    return mockGameState[key];
  },

  getCharacter(): Character | null {
    return mockCharacter;
  },

  getSkills(): Skill[] {
    return mockSkills;
  },

  getItems(): Item[] {
    return mockItems;
  },

  getEquipment(): EquipmentState {
    return mockEquipmentState;
  },

  getInventory(): InventoryItem[] {
    return mockInventoryItems;
  },

  getQuests(): Quest[] {
    return mockQuests;
  },

  getQuestsByStatus(status: Quest['status']): Quest[] {
    return mockQuests.filter((quest) => quest.status === status);
  },

  getNPCs(): NPC[] {
    return mockNPCs;
  },

  getNPCById(id: string): NPC | undefined {
    return mockNPCs.find((npc) => npc.id === id);
  },

  getNPCRelationships(): Record<string, NPCRelationship> {
    return mockNpcRelationships;
  },

  getNPCRelationship(npcId: string): NPCRelationship | undefined {
    return mockNpcRelationships[npcId];
  },

  getMap(): GameMap | null {
    return mockGameMap;
  },

  getCombat(): CombatInstanceData | null {
    return mockCombatInstance;
  },

  getStatusEffects(): StatusEffect[] {
    return mockStatusEffects;
  },

  getGlobalContext(): GlobalContext | null {
    return mockGlobalContext;
  },

  getDialogueOptions(): DialogueOption[] {
    return mockDialogueOptions;
  },

  getJournalEntries(): MockJournalEntry[] {
    return mockJournalEntries;
  },

  getDynamicUI(): DynamicUIData {
    return mockDynamicUI;
  },

  getEmptyData(): typeof emptyMockData {
    return emptyMockData;
  },

  getInvalidData(): typeof invalidMockData {
    return invalidMockData;
  },

  async loadMockDataWithDelay(delayMs: number = 500): Promise<MockGameState> {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    return mockGameState;
  },

  async simulateApiRequest<T>(
    data: T,
    successRate: number = 0.9,
    delayMs: number = 300
  ): Promise<{ success: boolean; data?: T; error?: string }> {
    await new Promise((resolve) => setTimeout(resolve, delayMs));

    if (Math.random() < successRate) {
      return { success: true, data };
    } else {
      return { success: false, error: '模拟请求失败' };
    }
  },
};

/**
 * 模拟游戏服务 Hook
 * 用于 React 组件中方便地访问模拟数据
 */
export const useMockGameData = () => {
  return {
    character: mockGameService.getCharacter(),
    skills: mockGameService.getSkills(),
    items: mockGameService.getItems(),
    equipment: mockGameService.getEquipment(),
    inventory: mockGameService.getInventory(),
    quests: mockGameService.getQuests(),
    npcs: mockGameService.getNPCs(),
    npcRelationships: mockGameService.getNPCRelationships(),
    map: mockGameService.getMap(),
    combat: mockGameService.getCombat(),
    statusEffects: mockGameService.getStatusEffects(),
    globalContext: mockGameService.getGlobalContext(),
    dialogueOptions: mockGameService.getDialogueOptions(),
    journalEntries: mockGameService.getJournalEntries(),
    dynamicUI: mockGameService.getDynamicUI(),
  };
};

/**
 * 模拟数据生成器
 * 用于生成自定义的模拟数据
 */
export const mockDataGenerator = {
  /**
   * 生成随机属性值
   */
  generateRandomAttributes(): Character['baseAttributes'] {
    const random = (min: number, max: number) =>
      Math.floor(Math.random() * (max - min + 1)) + min;

    return {
      strength: random(8, 18),
      dexterity: random(8, 18),
      constitution: random(8, 18),
      intelligence: random(8, 18),
      wisdom: random(8, 18),
      charisma: random(8, 18),
    };
  },

  /**
   * 生成随机角色
   */
  generateRandomCharacter(overrides?: Partial<Character>): Character {
    const baseAttrs = this.generateRandomAttributes();
    const constitution = baseAttrs.constitution;
    const strength = baseAttrs.strength;

    return {
      id: `char-${Date.now()}`,
      name: '随机角色',
      race: 'human',
      class: 'warrior',
      level: 1,
      experience: 0,
      experienceToLevel: 100,
      baseAttributes: baseAttrs,
      derivedAttributes: {
        maxHp: 80 + constitution * 5,
        currentHp: 80 + constitution * 5,
        maxMp: 20 + baseAttrs.intelligence * 2,
        currentMp: 20 + baseAttrs.intelligence * 2,
        attack: 10 + strength,
        defense: 5 + Math.floor(constitution / 2),
        speed: 5 + Math.floor(baseAttrs.dexterity / 2),
        luck: 5,
      },
      skills: [],
      equipment: {},
      inventory: [],
      currency: { gold: 100 },
      statusEffects: [],
      appearance: '一个普通的冒险者',
      personality: '勇敢、好奇',
      backstory: '一个来自远方的旅行者',
      statistics: {
        battlesWon: 0,
        questsCompleted: 0,
        distanceTraveled: 0,
        itemsCrafted: 0,
        npcsMet: 0,
        playTime: 0,
      },
      ...overrides,
    };
  },

  /**
   * 生成随机任务
   */
  generateRandomQuest(overrides?: Partial<Quest>): Quest {
    const questTypes: Quest['type'][] = ['main', 'side', 'daily'];
    const randomType = questTypes[Math.floor(Math.random() * questTypes.length)];

    return {
      id: `quest-${Date.now()}`,
      name: '随机任务',
      description: '这是一个随机生成的任务',
      type: randomType,
      status: 'available',
      objectives: [
        {
          id: `obj-${Date.now()}`,
          description: '完成目标',
          type: 'custom',
          target: 'target',
          current: 0,
          required: 1,
          isCompleted: false,
        },
      ],
      prerequisites: [],
      rewards: {
        experience: 100,
        currency: { gold: 50 },
      },
      log: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      ...overrides,
    };
  },

  /**
   * 生成随机物品
   */
  generateRandomItem(overrides?: Partial<Item>): Item {
    const itemTypes: Item['type'][] = ['weapon', 'armor', 'consumable', 'material'];
    const rarities: Item['rarity'][] = ['common', 'uncommon', 'rare', 'epic'];

    const randomType = itemTypes[Math.floor(Math.random() * itemTypes.length)];
    const randomRarity = rarities[Math.floor(Math.random() * rarities.length)];

    return {
      id: `item-${Date.now()}`,
      name: '随机物品',
      description: '这是一个随机生成的物品',
      type: randomType,
      rarity: randomRarity,
      stats: {},
      effects: [],
      requirements: {},
      value: {
        buy: 100,
        sell: 40,
        currency: 'gold',
      },
      stackable: randomType === 'consumable' || randomType === 'material',
      maxStack: randomType === 'consumable' || randomType === 'material' ? 99 : 1,
      ...overrides,
    };
  },
};

export default mockGameService;
