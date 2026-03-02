import { create } from 'zustand';
import { saveService, Save, CreateSaveData } from '../services/saveService';
import { dialogueService } from '../services/dialogueService';
import type { StoryTemplate, Character, DialogueOption } from '@ai-rpg/shared';

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
  selectedTemplate: StoryTemplate | null;
  
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
  setSelectedTemplate: (template: StoryTemplate | null) => void;
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
  
  setSelectedTemplate: (template: StoryTemplate | null) => {
    set({ selectedTemplate: template, templateId: template?.id ?? null, gameMode: template?.gameMode ?? null });
  },
  
  onCharacterCreated: (character: Character) => {
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
    
    setTimeout(() => {
      get().generateInitialScene();
    }, 100);
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
}));
