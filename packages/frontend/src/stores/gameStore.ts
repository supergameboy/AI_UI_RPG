import { create } from 'zustand';
import { saveService, Save, CreateSaveData } from '../services/saveService';
import { dialogueService } from '../services/dialogueService';
import { combatService } from '../services/combatService';
import { decisionLogService, QueryOptions } from '../services/decisionLogService';
import { contextService } from '../services/contextService';
import { initializationService } from '../services/initializationService';
import { websocketService } from '../services/websocketService';
import type { 
  Character, 
  DialogueOption,
  CombatInstanceData,
  CombatAction,
  ActionType,
  EnemyInitData,
  AllyInitData,
  CombatResult,
  GlobalContext,
  DecisionLog,
  DecisionLogTraceback,
  NPC,
  NPCRelationship,
  SkillState,
  InventoryGameState,
  EquipmentState,
  MapGameState,
  JournalEntry,
  DynamicUIData,
  GameStateUpdateLog,
  GameStateUpdateSource,
} from '@ai-rpg/shared';
import { 
  InitializationStatus, 
  GameTemplate, 
  InitializationData,
  DEFAULT_SKILL_STATE,
  DEFAULT_INVENTORY_STATE,
  DEFAULT_EQUIPMENT_STATE,
  DEFAULT_MAP_STATE,
} from '@ai-rpg/shared';

export type GameScreen = 'menu' | 'game' | 'template-select' | 'character-creation' | 'save-load' | 'template-manager';

export interface SaveInfo {
  id: string;
  name: string;
  timestamp: number;
  playTime: number;
  chapter: string;
  location: string;
  level: number;
}

export interface CharacterState {
  id: string | null;
  name: string;
  race: string;
  class: string;
  level: number;
  health: number;
  maxHealth: number;
  mana: number;
  maxMana: number;
  attributes: Record<string, number>;
}

export interface QuestState {
  id: string;
  name: string;
  status: 'locked' | 'available' | 'in_progress' | 'completed' | 'failed';
  description: string;
}

export interface GameState {
  screen: GameScreen;
  previousScreen: GameScreen;
  showSettings: boolean;
  showSaveManager: boolean;
  currentSaveId: string | null;
  saves: SaveInfo[];
  isLoading: boolean;
  hasUnsavedChanges: boolean;
  
  templateId: string | null;
  gameMode: 'text_adventure' | 'turn_based_rpg' | 'visual_novel' | 'dynamic_combat' | null;
  selectedTemplate: GameTemplate | null;
  
  character: CharacterState;
  currentLocation: string;
  currentScene: string;
  quests: QuestState[];
  storyProgress: Record<string, unknown>;
  playTime: number;
  sessionStartTime: number | null;
  
  messages: Array<{ role: string; content: string; timestamp: number }>;
  dialogueOptions: DialogueOption[];
  isLoadingDialogue: boolean;
  autoSaveEnabled: boolean;
  lastAutoSaveTime: number;
  
  notification: { message: string; type: 'success' | 'error' | 'info' } | null;
  
  // 战斗状态
  combat: CombatInstanceData | null;
  combatLog: CombatAction[];
  isInCombat: boolean;
  isPlayerTurn: boolean;
  
  // 全局上下文和决策日志
  globalContext: GlobalContext | null;
  decisionLogs: DecisionLog[];
  contextLoading: boolean;
  decisionLogsLoading: boolean;
  
  // 初始化相关
  initializationStatus: InitializationStatus | null;
  isInitializing: boolean;
  initializationData: InitializationData | null;
  
  // NPC 相关
  npcs: NPC[];
  npcRelationships: Record<string, NPCRelationship>;
  selectedNpcId: string | null;
  
  // 新增游戏状态字段
  skills: SkillState;
  inventory: InventoryGameState;
  equipment: EquipmentState;
  map: MapGameState;
  journal: JournalEntry[];
  dynamicUI: DynamicUIData | null;
  updateLogs: GameStateUpdateLog[];
  
  setScreen: (screen: GameScreen) => void;
  startNewGame: () => void;
  loadGame: (save: Save) => Promise<void>;
  returnToMenu: () => void;
  openSettings: () => void;
  closeSettings: () => void;
  setSaves: (saves: SaveInfo[]) => void;
  setLoading: (loading: boolean) => void;
  
  openSaveManager: () => void;
  closeSaveManager: () => void;
  openTemplateManager: () => void;
  saveGame: (name: string) => Promise<void>;
  quickSave: () => Promise<void>;
  autoSave: () => Promise<void>;
  deleteSave: (saveId: string) => Promise<void>;
  fetchSaves: () => Promise<void>;
  
  setTemplate: (templateId: string, gameMode: GameState['gameMode']) => void;
  setSelectedTemplate: (template: GameTemplate | null) => void;
  onCharacterCreated: (character: Character) => void;
  setCharacter: (character: Partial<CharacterState>) => void;
  setLocation: (location: string) => void;
  setScene: (scene: string) => void;
  addQuest: (quest: QuestState) => void;
  updateQuest: (questId: string, status: QuestState['status']) => void;
  completeQuest: (questId: string) => void;
  
  addMessage: (role: string, content: string) => void;
  clearMessages: () => void;
  setDialogueOptions: (options: DialogueOption[]) => void;
  sendPlayerInput: (input: string, optionId?: string) => Promise<void>;
  generateInitialScene: () => Promise<void>;
  
  markUnsaved: () => void;
  setAutoSaveEnabled: (enabled: boolean) => void;
  
  setNotification: (notification: GameState['notification']) => void;
  clearNotification: () => void;
  
  // 战斗相关
  initiateCombat: (enemies: EnemyInitData[], allies?: AllyInitData[]) => Promise<void>;
  startCombat: () => Promise<void>;
  executeCombatAction: (action: ActionType, targetId?: string, skillId?: string, itemId?: string) => Promise<void>;
  executeAITurn: () => Promise<void>;
  endCombat: () => Promise<void>;
  addCombatLog: (action: CombatAction) => void;
  clearCombat: () => void;
  
  // 全局上下文和决策日志方法
  fetchGlobalContext: () => Promise<void>;
  fetchDecisionLogs: (options?: QueryOptions) => Promise<void>;
  tracebackProblem: (requestId: string) => Promise<DecisionLogTraceback>;
  
  // 初始化方法
  startInitialization: (saveId: string, character: Character, template: GameTemplate) => Promise<InitializationStatus>;
  fetchInitializationStatus: (saveId: string) => Promise<InitializationStatus | null>;
  retryInitialization: (saveId: string, character: Character, template: GameTemplate) => Promise<InitializationStatus>;
  /** 从初始化响应批量设置数据 */
  initializeFromResponse: (data: InitializationData) => void;
  /** 设置初始化数据 */
  setInitializationData: (data: InitializationData | null) => void;
  
  // NPC 相关方法
  setNpcs: (npcs: NPC[]) => void;
  addNpc: (npc: NPC) => void;
  updateNpcRelationship: (npcId: string, relationship: Partial<NPCRelationship>) => void;
  setSelectedNpc: (npcId: string | null) => void;
  
  // 统一游戏状态更新方法
  updateGameState: (data: Partial<{
    character: Character | null;
    skills: SkillState;
    inventory: InventoryGameState;
    equipment: EquipmentState;
    map: MapGameState;
    journal: JournalEntry[];
    dynamicUI: DynamicUIData | null;
  }>, source?: GameStateUpdateSource, sourceId?: string) => void;
  
  // 数据流转监控方法
  getUpdateLogs: () => GameStateUpdateLog[];
  clearUpdateLogs: () => void;
}

const defaultCharacter: CharacterState = {
  id: null,
  name: '',
  race: '',
  class: '',
  level: 1,
  health: 100,
  maxHealth: 100,
  mana: 50,
  maxMana: 50,
  attributes: {},
};

export const useGameStore = create<GameState>((set, get) => ({
  screen: 'menu',
  previousScreen: 'menu',
  showSettings: false,
  showSaveManager: false,
  currentSaveId: null,
  saves: [],
  isLoading: false,
  hasUnsavedChanges: false,
  
  templateId: null,
  gameMode: null,
  selectedTemplate: null,
  
  character: defaultCharacter,
  currentLocation: '',
  currentScene: '',
  quests: [],
  storyProgress: {},
  playTime: 0,
  sessionStartTime: null,
  
  messages: [],
  dialogueOptions: [],
  isLoadingDialogue: false,
  autoSaveEnabled: true,
  lastAutoSaveTime: 0,
  
  notification: null,
  
  combat: null,
  combatLog: [],
  isInCombat: false,
  isPlayerTurn: false,
  
  // 全局上下文和决策日志初始状态
  globalContext: null,
  decisionLogs: [],
  contextLoading: false,
  decisionLogsLoading: false,
  
  // 初始化状态
  initializationStatus: null,
  isInitializing: false,
  initializationData: null,
  
  // NPC 状态
  npcs: [],
  npcRelationships: {},
  selectedNpcId: null,
  
  // 新增游戏状态字段初始值
  skills: DEFAULT_SKILL_STATE,
  inventory: DEFAULT_INVENTORY_STATE,
  equipment: DEFAULT_EQUIPMENT_STATE,
  map: DEFAULT_MAP_STATE,
  journal: [],
  dynamicUI: null,
  updateLogs: [],
  
  setScreen: (screen: GameScreen) => {
    set({ screen });
  },
  
  startNewGame: () => {
    set({
      screen: 'template-select',
      currentSaveId: null,
      character: defaultCharacter,
      currentLocation: '',
      currentScene: '',
      quests: [],
      storyProgress: {},
      playTime: 0,
      sessionStartTime: null,
      messages: [],
      hasUnsavedChanges: false,
    });
  },
  
  loadGame: async (save: Save) => {
    set({ isLoading: true });
    try {
      let gameState = {};
      let storyProgress = {};
      
      try {
        gameState = JSON.parse(save.game_state || '{}');
        storyProgress = JSON.parse(save.story_progress || '{}');
      } catch {
        console.warn('Failed to parse save data');
      }
      
      const loadedState = gameState as Record<string, unknown>;
      
      set({
        screen: 'game',
        currentSaveId: save.id,
        templateId: save.template_id,
        gameMode: save.game_mode,
        currentLocation: save.current_location || '',
        currentScene: save.current_scene || '',
        playTime: save.play_time,
        sessionStartTime: Date.now(),
        storyProgress,
        character: (loadedState.character as CharacterState) || defaultCharacter,
        quests: (loadedState.quests as QuestState[]) || [],
        messages: (loadedState.messages as GameState['messages']) || [],
        hasUnsavedChanges: false,
      });
    } finally {
      set({ isLoading: false });
    }
  },
  
  returnToMenu: () => {
    set({
      screen: 'menu',
      currentSaveId: null,
      showSettings: false,
      showSaveManager: false,
      sessionStartTime: null,
    });
  },
  
  openSettings: () => {
    const current = get().screen;
    set({ previousScreen: current, showSettings: true });
  },
  
  closeSettings: () => {
    set({ showSettings: false });
  },
  
  setSaves: (saves: SaveInfo[]) => {
    set({ saves });
  },
  
  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },
  
  openSaveManager: () => {
    set({ showSaveManager: true });
  },
  
  closeSaveManager: () => {
    set({ showSaveManager: false });
  },
  
  openTemplateManager: () => {
    set({ screen: 'template-manager' });
  },
  
  saveGame: async (name: string) => {
    const state = get();
    const currentPlayTime = state.playTime + 
      (state.sessionStartTime ? (Date.now() - state.sessionStartTime) / 1000 : 0);
    
    const gameState = {
      character: state.character,
      quests: state.quests,
      messages: state.messages.slice(-100),
    };
    
    const saveData: CreateSaveData = {
      name,
      template_id: state.templateId,
      game_mode: state.gameMode || 'text_adventure',
      play_time: Math.floor(currentPlayTime),
      current_location: state.currentLocation,
      current_scene: state.currentScene,
      game_state: JSON.stringify(gameState),
      story_progress: JSON.stringify(state.storyProgress),
      snapshot: {
        snapshot_type: 'manual',
        context_state: JSON.stringify({ messages: state.messages.slice(-10) }),
        memory_state: '{}',
        agent_states: '{}',
      },
    };
    
    try {
      if (state.currentSaveId) {
        await saveService.updateSave(state.currentSaveId, {
          name,
          play_time: Math.floor(currentPlayTime),
          current_location: state.currentLocation,
          current_scene: state.currentScene,
          game_state: JSON.stringify(gameState),
          story_progress: JSON.stringify(state.storyProgress),
        });
      } else {
        const newSave = await saveService.createSave(saveData);
        set({ currentSaveId: newSave.id });
      }
      
      set({
        playTime: Math.floor(currentPlayTime),
        sessionStartTime: Date.now(),
        hasUnsavedChanges: false,
      });
      
      get().setNotification({ message: '存档成功', type: 'success' });
      setTimeout(() => get().clearNotification(), 3000);
      
      await get().fetchSaves();
    } catch (error) {
      console.error('Failed to save game:', error);
      get().setNotification({ message: '存档失败', type: 'error' });
      throw error;
    }
  },
  
  quickSave: async () => {
    const state = get();
    const now = Date.now();
    
    if (now - state.lastAutoSaveTime < 10000) {
      return;
    }
    
    const name = `快速存档 ${new Date().toLocaleString('zh-CN')}`;
    await get().saveGame(name);
  },
  
  autoSave: async () => {
    const state = get();
    
    if (!state.autoSaveEnabled || !state.currentSaveId) {
      return;
    }
    
    const now = Date.now();
    if (now - state.lastAutoSaveTime < 30000) {
      return;
    }
    
    try {
      await get().saveGame(`自动存档 ${new Date().toLocaleString('zh-CN')}`);
      set({ lastAutoSaveTime: now });
    } catch (error) {
      console.error('Auto save failed:', error);
    }
  },
  
  deleteSave: async (saveId: string) => {
    try {
      await saveService.deleteSave(saveId);
      await get().fetchSaves();
      
      if (get().currentSaveId === saveId) {
        set({ currentSaveId: null });
      }
    } catch (error) {
      console.error('Failed to delete save:', error);
      throw error;
    }
  },
  
  fetchSaves: async () => {
    try {
      const result = await saveService.getSaves({ limit: 20 });
      const saves: SaveInfo[] = result.saves.map((save) => ({
        id: save.id,
        name: save.name,
        timestamp: save.updated_at,
        playTime: save.play_time,
        chapter: save.current_scene || '',
        location: save.current_location || '',
        level: 1,
      }));
      set({ saves });
    } catch (error) {
      console.error('Failed to fetch saves:', error);
    }
  },
  
  setTemplate: (templateId: string, gameMode: GameState['gameMode']) => {
    set({ templateId, gameMode });
  },
  
  setSelectedTemplate: (template: GameTemplate | null) => {
    set({ selectedTemplate: template, templateId: template?.id ?? null, gameMode: template?.gameMode ?? null });
  },
  
  onCharacterCreated: async (character: Character) => {
    const template = get().selectedTemplate as GameTemplate;
    if (!template) {
      console.error('No template selected');
      return;
    }
    
    const baseAttrs = character.baseAttributes;
    const attributes: Record<string, number> = {
      strength: baseAttrs.strength,
      dexterity: baseAttrs.dexterity,
      constitution: baseAttrs.constitution,
      intelligence: baseAttrs.intelligence,
      wisdom: baseAttrs.wisdom,
      charisma: baseAttrs.charisma,
    };
    if (baseAttrs.customStats) {
      Object.assign(attributes, baseAttrs.customStats);
    }
    
    set({
      screen: 'game',
      character: {
        id: character.id,
        name: character.name,
        race: character.race,
        class: character.class,
        level: character.level,
        health: character.derivedAttributes.maxHp,
        maxHealth: character.derivedAttributes.maxHp,
        mana: character.derivedAttributes.maxMp,
        maxMana: character.derivedAttributes.maxMp,
        attributes,
      },
      sessionStartTime: Date.now(),
    });
    
    // 创建存档并开始初始化
    try {
      // 先创建存档
      const saveName = `${character.name} 的冒险`;
      await get().saveGame(saveName);
      
      const saveId = get().currentSaveId;
      if (saveId) {
        // 开始初始化流程
        await get().startInitialization(saveId, character, template);
      }
      
      // 初始化完成后生成初始场景
      setTimeout(() => {
        get().generateInitialScene();
      }, 100);
    } catch (error) {
      console.error('Failed to initialize game:', error);
      // 即使初始化失败，也尝试生成初始场景
      setTimeout(() => {
        get().generateInitialScene();
      }, 100);
    }
  },
  
  setCharacter: (character: Partial<CharacterState>) => {
    set((state) => ({
      character: { ...state.character, ...character },
      hasUnsavedChanges: true,
    }));
  },
  
  setLocation: (location: string) => {
    set({ currentLocation: location, hasUnsavedChanges: true });
  },
  
  setScene: (scene: string) => {
    set({ currentScene: scene, hasUnsavedChanges: true });
  },
  
  addQuest: (quest: QuestState) => {
    set((state) => ({
      quests: [...state.quests, quest],
      hasUnsavedChanges: true,
    }));
  },
  
  updateQuest: (questId: string, status: QuestState['status']) => {
    set((state) => ({
      quests: state.quests.map((q) =>
        q.id === questId ? { ...q, status } : q
      ),
      hasUnsavedChanges: true,
    }));
  },
  
  completeQuest: (questId: string) => {
    set((state) => ({
      quests: state.quests.map((q) =>
        q.id === questId ? { ...q, status: 'completed' } : q
      ),
      hasUnsavedChanges: true,
    }));
    
    get().autoSave();
    
    get().setNotification({ message: '任务完成！', type: 'success' });
    setTimeout(() => get().clearNotification(), 3000);
  },
  
  addMessage: (role: string, content: string) => {
    set((state) => ({
      messages: [
        ...state.messages,
        { role, content, timestamp: Date.now() },
      ].slice(-200),
      hasUnsavedChanges: true,
    }));
  },
  
  clearMessages: () => {
    set({ messages: [], hasUnsavedChanges: true });
  },
  
  setDialogueOptions: (options: DialogueOption[]) => {
    set({ dialogueOptions: options });
  },
  
  sendPlayerInput: async (input: string, optionId?: string) => {
    const state = get();
    if (!state.character.id) return;
    
    set({ isLoadingDialogue: true });
    
    get().addMessage('user', input);
    
    try {
      const response = await dialogueService.sendPlayerInput({
        characterId: state.character.id,
        saveId: state.currentSaveId ?? undefined,
        message: input,
        optionId,
        context: {
          location: state.currentLocation,
          recentMessages: state.messages.slice(-5),
        },
      });
      
      if (response.success) {
        get().addMessage(response.message.role, response.message.content);
        set({ dialogueOptions: response.options });
        
        if (response.stateChanges) {
          const changes = response.stateChanges;
          if (changes.health !== undefined || changes.mana !== undefined) {
            set((s) => ({
              character: {
                ...s.character,
                health: changes.health !== undefined 
                  ? Math.min(s.character.maxHealth, Math.max(0, s.character.health + changes.health))
                  : s.character.health,
                mana: changes.mana !== undefined 
                  ? Math.min(s.character.maxMana, Math.max(0, s.character.mana + changes.mana))
                  : s.character.mana,
              },
            }));
          }
        }
        
        // 检测战斗触发
        if (response.combatTrigger) {
          const { enemies, allies, reason } = response.combatTrigger;
          console.log('[GameStore] Combat triggered:', reason);
          // 延迟触发战斗，让玩家有时间看到对话内容
          setTimeout(() => {
            get().initiateCombat(enemies, allies);
          }, 1000);
        }
      }
    } catch (error) {
      console.error('Failed to send player input:', error);
      get().setNotification({ 
        message: '发送失败，请重试', 
        type: 'error' 
      });
    } finally {
      set({ isLoadingDialogue: false });
    }
  },
  
  generateInitialScene: async () => {
    const state = get();
    if (!state.character.id || !state.templateId) return;
    
    set({ isLoadingDialogue: true });
    
    try {
      const response = await dialogueService.generateInitialScene({
        characterId: state.character.id,
        saveId: state.currentSaveId ?? undefined,
        templateId: state.templateId,
        characterName: state.character.name,
        characterRace: state.character.race,
        characterClass: state.character.class,
        worldSetting: state.selectedTemplate?.worldSetting,
      });
      
      if (response.success) {
        get().addMessage(response.message.role, response.message.content);
        set({ 
          dialogueOptions: response.options,
          currentLocation: response.context?.location ?? '',
        });
      }
    } catch (error) {
      console.error('Failed to generate initial scene:', error);
      get().addMessage('narrator', '你的冒险即将开始...');
      set({
        dialogueOptions: [
          { id: 'opt_1', text: '四处看看', type: 'normal' },
          { id: 'opt_2', text: '检查自己的装备', type: 'normal' },
          { id: 'opt_3', text: '向前走去', type: 'normal' },
        ],
      });
    } finally {
      set({ isLoadingDialogue: false });
    }
  },
  
  markUnsaved: () => {
    set({ hasUnsavedChanges: true });
  },
  
  setAutoSaveEnabled: (enabled: boolean) => {
    set({ autoSaveEnabled: enabled });
  },
  
  setNotification: (notification: GameState['notification']) => {
    set({ notification });
  },
  
  clearNotification: () => {
    set({ notification: null });
  },
  
  // ==================== 战斗相关 Actions ====================
  
  initiateCombat: async (enemies: EnemyInitData[], allies?: AllyInitData[]) => {
    const state = get();
    if (!state.character.id) {
      get().setNotification({ message: '角色不存在，无法进入战斗', type: 'error' });
      return;
    }
    
    set({ isLoading: true });
    
    try {
      // 初始化战斗
      const initResponse = await combatService.initiateCombat({
        playerId: state.character.id,
        enemies,
        allies,
      });
      
      set({ combat: initResponse.combat });
      
      // 开始战斗
      const startResponse = await combatService.startCombat(initResponse.combatId);
      
      // 判断是否玩家回合
      const isPlayerTurn = startResponse.currentUnit === state.character.id;
      
      set({
        combat: startResponse.combat,
        isInCombat: true,
        isPlayerTurn,
        isLoading: false,
      });
      
      get().setNotification({ message: '战斗开始！', type: 'info' });
      
      // 如果不是玩家回合，自动执行AI回合
      if (!isPlayerTurn) {
        setTimeout(() => get().executeAITurn(), 500);
      }
    } catch (error) {
      console.error('Failed to initiate combat:', error);
      set({ isLoading: false });
      get().setNotification({ message: '战斗初始化失败', type: 'error' });
    }
  },
  
  startCombat: async () => {
    const state = get();
    if (!state.combat) {
      get().setNotification({ message: '没有进行中的战斗', type: 'error' });
      return;
    }
    
    set({ isLoading: true });
    
    try {
      const response = await combatService.startCombat(state.combat.id);
      const isPlayerTurn = response.currentUnit === state.character.id;
      
      set({
        combat: response.combat,
        isPlayerTurn,
        isLoading: false,
      });
      
      if (!isPlayerTurn) {
        setTimeout(() => get().executeAITurn(), 500);
      }
    } catch (error) {
      console.error('Failed to start combat:', error);
      set({ isLoading: false });
      get().setNotification({ message: '战斗启动失败', type: 'error' });
    }
  },
  
  executeCombatAction: async (action: ActionType, targetId?: string, skillId?: string, itemId?: string) => {
    const state = get();
    
    if (!state.combat || !state.character.id) {
      get().setNotification({ message: '战斗状态异常', type: 'error' });
      return;
    }
    
    if (!state.isPlayerTurn) {
      get().setNotification({ message: '现在不是你的回合', type: 'error' });
      return;
    }
    
    set({ isLoading: true });
    
    try {
      const response = await combatService.executeAction(
        state.combat.id,
        state.character.id,
        action,
        targetId,
        skillId,
        itemId
      );
      
      // 添加战斗日志
      get().addCombatLog(response.action);
      
      // 更新战斗状态
      set({ combat: response.combat });
      
      // 检查战斗是否结束
      if (response.combat.result) {
        await get().endCombat();
        return;
      }
      
      // 判断下一个是否是AI回合
      const currentUnitId = response.combat.turnOrder[response.combat.currentTurnIndex];
      const isPlayerTurn = currentUnitId === state.character.id;
      
      set({ isPlayerTurn, isLoading: false });
      
      // 如果是AI回合，自动执行
      if (!isPlayerTurn) {
        setTimeout(() => get().executeAITurn(), 500);
      }
    } catch (error) {
      console.error('Failed to execute combat action:', error);
      set({ isLoading: false });
      get().setNotification({ message: '行动执行失败', type: 'error' });
    }
  },
  
  executeAITurn: async () => {
    const state = get();
    
    if (!state.combat) {
      return;
    }
    
    set({ isLoading: true });
    
    try {
      const response = await combatService.executeAITurn(state.combat.id);
      
      // 添加战斗日志
      get().addCombatLog(response.action);
      
      // 更新战斗状态
      set({ combat: response.combat });
      
      // 检查战斗是否结束
      if (response.combat.result) {
        await get().endCombat();
        return;
      }
      
      // 判断下一个是否是玩家回合
      const currentUnitId = response.combat.turnOrder[response.combat.currentTurnIndex];
      const isPlayerTurn = currentUnitId === state.character.id;
      
      set({ isPlayerTurn, isLoading: false });
      
      // 如果还是AI回合，继续执行
      if (!isPlayerTurn) {
        setTimeout(() => get().executeAITurn(), 500);
      }
    } catch (error) {
      console.error('Failed to execute AI turn:', error);
      set({ isLoading: false });
      get().setNotification({ message: 'AI回合执行失败', type: 'error' });
    }
  },
  
  endCombat: async () => {
    const state = get();
    
    if (!state.combat) {
      return;
    }
    
    set({ isLoading: true });
    
    try {
      const result: CombatResult = await combatService.endCombat(state.combat.id);
      
      // 处理战斗结果
      if (result.victory && result.rewards) {
        // 更新角色状态（经验、金币等）
        const { rewards } = result;
        
        // 更新角色属性
        set((s) => ({
          character: {
            ...s.character,
            // 经验值可以用于升级判断，这里暂时存储
            // 实际项目中可能需要单独的经验值字段
            // 这里用 attributes 存储累计经验
            attributes: {
              ...s.character.attributes,
              experience: (s.character.attributes.experience || 0) + rewards.experience,
            },
          },
          hasUnsavedChanges: true,
        }));
        
        // 显示奖励信息
        const rewardMessages: string[] = [];
        rewardMessages.push(`经验 +${rewards.experience}`);
        rewardMessages.push(`金币 +${rewards.gold}`);
        
        if (rewards.items && rewards.items.length > 0) {
          rewardMessages.push(`获得物品: ${rewards.items.join(', ')}`);
          // TODO: 将物品添加到背包
          // 需要调用 inventoryService 或相关方法
        }
        
        if (rewards.skillPoints && rewards.skillPoints > 0) {
          rewardMessages.push(`技能点 +${rewards.skillPoints}`);
        }
        
        get().setNotification({ 
          message: `战斗胜利！\n${rewardMessages.join('\n')}`, 
          type: 'success' 
        });
        
      } else if (result.fled) {
        get().setNotification({ message: '成功逃离战斗！', type: 'info' });
      } else {
        // 战斗失败，可能需要处理角色死亡等情况
        get().setNotification({ message: '战斗失败...', type: 'error' });
        
        // 可以在这里处理角色复活、回城等逻辑
        // 例如：恢复一定生命值
        set((s) => ({
          character: {
            ...s.character,
            health: Math.floor(s.character.maxHealth * 0.3), // 恢复30%生命值
          },
        }));
      }
      
      // 清除战斗状态
      get().clearCombat();
      set({ isLoading: false });
      
      // 自动保存
      get().autoSave();
      
    } catch (error) {
      console.error('Failed to end combat:', error);
      set({ isLoading: false });
      get().setNotification({ message: '战斗结束处理失败', type: 'error' });
    }
  },
  
  addCombatLog: (action: CombatAction) => {
    set((state) => ({
      combatLog: [...state.combatLog, action].slice(-100), // 保留最近100条
    }));
  },
  
  clearCombat: () => {
    set({
      combat: null,
      combatLog: [],
      isInCombat: false,
      isPlayerTurn: false,
    });
  },
  
  // ==================== 全局上下文和决策日志方法 ====================
  
  fetchGlobalContext: async () => {
    const state = get();
    if (!state.currentSaveId) {
      return;
    }
    
    set({ contextLoading: true });
    try {
      const result = await contextService.getGlobalContext(state.currentSaveId);
      set({
        globalContext: result.context,
        contextLoading: false,
      });
    } catch (error) {
      console.error('Failed to fetch global context:', error);
      set({ contextLoading: false });
    }
  },
  
  fetchDecisionLogs: async (options?: QueryOptions) => {
    const state = get();
    set({ decisionLogsLoading: true });
    try {
      const queryOptions: QueryOptions = {
        ...options,
        saveId: state.currentSaveId ?? undefined,
        limit: options?.limit ?? 50,
      };
      const result = await decisionLogService.getLogs(queryOptions);
      set({
        decisionLogs: result.logs,
        decisionLogsLoading: false,
      });
    } catch (error) {
      console.error('Failed to fetch decision logs:', error);
      set({ decisionLogsLoading: false });
    }
  },
  
  tracebackProblem: async (requestId: string) => {
    set({ decisionLogsLoading: true });
    try {
      const result = await decisionLogService.traceback(requestId);
      set({ decisionLogsLoading: false });
      return result;
    } catch (error) {
      console.error('Failed to traceback problem:', error);
      set({ decisionLogsLoading: false });
      throw error;
    }
  },
  
  // ==================== 初始化方法 ====================
  
  startInitialization: async (saveId: string, character: Character, template: GameTemplate) => {
    set({ isInitializing: true, initializationStatus: null, initializationData: null });
    
    try {
      const response = await initializationService.startInitialization({
        saveId,
        character,
        template,
      });
      
      // 处理返回的初始化数据
      if (response.success && response.data) {
        get().initializeFromResponse(response.data);
      }
      
      set({ 
        initializationStatus: response.status,
        initializationData: response.data || null,
        isInitializing: false,
      });
      
      return response.status;
    } catch (error) {
      set({ isInitializing: false });
      console.error('Failed to start initialization:', error);
      throw error;
    }
  },
  
  fetchInitializationStatus: async (saveId: string) => {
    try {
      const response = await initializationService.getStatus(saveId);
      if (response.success && response.status) {
        set({ initializationStatus: response.status });
        return response.status;
      }
      return null;
    } catch (error) {
      console.error('Failed to fetch initialization status:', error);
      return null;
    }
  },
  
  retryInitialization: async (saveId: string, character: Character, template: GameTemplate) => {
    set({ isInitializing: true });
    
    try {
      const response = await initializationService.retryInitialization(saveId, {
        character,
        templateId: template.id,
      });
      
      // 处理返回的初始化数据
      if (response.success && response.data) {
        get().initializeFromResponse(response.data);
      }
      
      set({ 
        initializationStatus: response.status,
        initializationData: response.data || null,
        isInitializing: false,
      });
      
      return response.status;
    } catch (error) {
      set({ isInitializing: false });
      console.error('Failed to retry initialization:', error);
      throw error;
    }
  },
  
  /**
   * 从初始化响应批量设置数据
   */
  initializeFromResponse: (data: InitializationData) => {
    // 更新位置信息
    if (data.scene?.location) {
      set({ currentLocation: data.scene.location.name });
    }
    
    // 更新任务列表
    if (data.quests?.createdQuests && data.quests.createdQuests.length > 0) {
      // 这里可以根据任务ID获取任务详情，暂时只记录ID
      console.log('[GameStore] 初始化任务:', data.quests.createdQuests);
    }
    
    // 更新NPC列表
    if (data.npcs?.npcIds && data.npcs.npcIds.length > 0) {
      console.log('[GameStore] 初始化NPC:', data.npcs.npcIds);
    }
    
    // 更新角色属性（如果有数值数据）
    if (data.numerical?.attributes) {
      set((s) => ({
        character: {
          ...s.character,
          attributes: {
            ...s.character.attributes,
            ...data.numerical!.attributes,
          },
        },
      }));
    }
    
    // 记录初始化数据
    console.log('[GameStore] 初始化数据已同步:', {
      skills: data.skills?.learnedSkills?.length || 0,
      items: data.inventory?.addedItems?.length || 0,
      equipment: data.equipment?.equippedItems?.length || 0,
      quests: data.quests?.createdQuests?.length || 0,
      npcs: data.npcs?.npcIds?.length || 0,
    });
  },
  
  /**
   * 设置初始化数据
   */
  setInitializationData: (data: InitializationData | null) => {
    set({ initializationData: data });
  },
  
  // ==================== NPC 相关 Actions ====================
  
  setNpcs: (npcs: NPC[]) => {
    set({ npcs });
  },
  
  addNpc: (npc: NPC) => {
    set((state) => ({
      npcs: [...state.npcs, npc],
      hasUnsavedChanges: true,
    }));
  },
  
  updateNpcRelationship: (npcId: string, relationship: Partial<NPCRelationship>) => {
    set((state) => ({
      npcRelationships: {
        ...state.npcRelationships,
        [npcId]: {
          ...state.npcRelationships[npcId],
          ...relationship,
        } as NPCRelationship,
      },
      hasUnsavedChanges: true,
    }));
  },
  
  setSelectedNpc: (npcId: string | null) => {
    set({ selectedNpcId: npcId });
  },
  
  // ==================== 统一游戏状态更新方法 ====================
  
  updateGameState: (data, source = 'system', sourceId) => {
    const state = get();
    
    const logEntry: GameStateUpdateLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      source,
      sourceId,
      updates: data,
    };
    
    const newUpdateLogs = [...state.updateLogs, logEntry].slice(-100);
    
    set({
      ...data,
      updateLogs: newUpdateLogs,
      hasUnsavedChanges: true,
    } as Partial<GameState>);
    
    console.log('[GameStore] updateGameState:', {
      source,
      sourceId,
      updatedFields: Object.keys(data),
    });
  },
  
  // ==================== 数据流转监控方法 ====================
  
  getUpdateLogs: () => {
    return get().updateLogs;
  },
  
  clearUpdateLogs: () => {
    set({ updateLogs: [] });
  },
}));

// ==================== WebSocket 监听器设置 ====================

let websocketUnsubscribe: (() => void) | null = null;

type GameStateUpdateData = Parameters<GameState['updateGameState']>[0];

export const setupGameStateWebSocketListener = (): void => {
  if (websocketUnsubscribe) {
    return;
  }
  
  websocketUnsubscribe = websocketService.subscribe((message) => {
    if (message.type === 'agent_message') {
      const payload = message.payload as { action?: string; data?: unknown };
      if (payload?.action === 'game_state_update' && payload?.data) {
        const gameStateData = payload.data as GameStateUpdateData;
        if (gameStateData) {
          useGameStore.getState().updateGameState(gameStateData, 'websocket');
        }
      }
    }
  });
  
  console.log('[GameStore] WebSocket listener for game_state_update registered');
};

export const cleanupGameStateWebSocketListener = (): void => {
  if (websocketUnsubscribe) {
    websocketUnsubscribe();
    websocketUnsubscribe = null;
    console.log('[GameStore] WebSocket listener cleaned up');
  }
};
