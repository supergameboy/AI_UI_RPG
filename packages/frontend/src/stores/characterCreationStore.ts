import { create } from 'zustand';
import type {
  StoryTemplate,
  RaceDefinition,
  ClassDefinition,
  BackgroundDefinition,
  AttributeDefinition,
  GeneratedRaceOption,
  GeneratedClassOption,
  GeneratedBackgroundOption,
  CharacterCreationStep,
  AttributeCalculationResult,
  Character,
} from '@ai-rpg/shared';

export interface CharacterCreationState {
  currentStep: CharacterCreationStep;
  characterName: string;
  selectedRace: RaceDefinition | GeneratedRaceOption | null;
  selectedClass: ClassDefinition | GeneratedClassOption | null;
  selectedBackground: BackgroundDefinition | GeneratedBackgroundOption | null;
  
  template: StoryTemplate | null;
  templateRaces: RaceDefinition[];
  templateClasses: ClassDefinition[];
  templateBackgrounds: BackgroundDefinition[];
  templateAttributes: AttributeDefinition[];
  
  aiGeneratedRaces: GeneratedRaceOption[];
  aiGeneratedClasses: GeneratedClassOption[];
  aiGeneratedBackgrounds: GeneratedBackgroundOption[];
  
  calculatedAttributes: AttributeCalculationResult;
  generatedAppearance: string;
  generatedImagePrompt: string;
  generatedBackstory: string;
  finalizedCharacter: Character | null;
  
  isLoading: boolean;
  loadingMessage: string;
  error: string | null;
}

export interface CharacterCreationActions {
  initFromTemplate: (template: StoryTemplate) => void;
  setCharacterName: (name: string) => void;
  selectRace: (race: RaceDefinition | GeneratedRaceOption) => void;
  selectClass: (cls: ClassDefinition | GeneratedClassOption) => void;
  selectBackground: (bg: BackgroundDefinition | GeneratedBackgroundOption) => void;
  
  generateAIRaces: () => Promise<void>;
  generateAIClasses: () => Promise<void>;
  generateAIBackgrounds: () => Promise<void>;
  calculateAttributes: () => Promise<void>;
  finalizeCharacter: (generateImagePrompt: boolean) => Promise<void>;
  
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  reset: () => void;
  clearError: () => void;
}

const STEP_ORDER: CharacterCreationStep[] = ['name', 'race', 'class', 'background', 'confirm'];

const initialState: CharacterCreationState = {
  currentStep: 'name',
  characterName: '',
  selectedRace: null,
  selectedClass: null,
  selectedBackground: null,
  
  template: null,
  templateRaces: [],
  templateClasses: [],
  templateBackgrounds: [],
  templateAttributes: [],
  
  aiGeneratedRaces: [],
  aiGeneratedClasses: [],
  aiGeneratedBackgrounds: [],
  
  calculatedAttributes: {},
  generatedAppearance: '',
  generatedImagePrompt: '',
  generatedBackstory: '',
  finalizedCharacter: null,
  
  isLoading: false,
  loadingMessage: '',
  error: null,
};

const API_BASE = 'http://localhost:6756/api';

export const useCharacterCreationStore = create<CharacterCreationState & CharacterCreationActions>((set, get) => ({
  ...initialState,

  initFromTemplate: (template: StoryTemplate) => {
    set({
      template,
      templateRaces: template.characterCreation.races,
      templateClasses: template.characterCreation.classes,
      templateBackgrounds: template.characterCreation.backgrounds,
      templateAttributes: template.characterCreation.attributes,
      aiGeneratedRaces: [],
      aiGeneratedClasses: [],
      aiGeneratedBackgrounds: [],
      selectedRace: null,
      selectedClass: null,
      selectedBackground: null,
      calculatedAttributes: {},
      generatedAppearance: '',
      generatedImagePrompt: '',
      generatedBackstory: '',
      finalizedCharacter: null,
      currentStep: 'name',
      characterName: '',
      error: null,
    });
  },

  setCharacterName: (name: string) => {
    set({ characterName: name });
  },

  selectRace: (race: RaceDefinition | GeneratedRaceOption) => {
    set({ selectedRace: race, selectedClass: null, selectedBackground: null });
  },

  selectClass: (cls: ClassDefinition | GeneratedClassOption) => {
    set({ selectedClass: cls, selectedBackground: null });
  },

  selectBackground: (bg: BackgroundDefinition | GeneratedBackgroundOption) => {
    set({ selectedBackground: bg });
  },

  generateAIRaces: async () => {
    const { template, isLoading } = get();
    if (!template) return;
    if (isLoading) return;

    set({ isLoading: true, loadingMessage: '正在生成种族选项...', error: null });

    try {
      const response = await fetch(`${API_BASE}/character/generate-races`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId: template.id, count: 3 }),
      });

      const data = await response.json();
      if (data.success) {
        set({ aiGeneratedRaces: data.data });
      } else {
        set({ error: data.error || '生成种族选项失败' });
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '网络错误' });
    } finally {
      set({ isLoading: false, loadingMessage: '' });
    }
  },

  generateAIClasses: async () => {
    const { template, selectedRace } = get();
    if (!template) return;

    set({ isLoading: true, loadingMessage: '正在生成职业选项...', error: null });

    try {
      const response = await fetch(`${API_BASE}/character/generate-classes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId: template.id, selectedRace, count: 3 }),
      });

      const data = await response.json();
      if (data.success) {
        set({ aiGeneratedClasses: data.data });
      } else {
        set({ error: data.error || '生成职业选项失败' });
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '网络错误' });
    } finally {
      set({ isLoading: false, loadingMessage: '' });
    }
  },

  generateAIBackgrounds: async () => {
    const { template, selectedRace, selectedClass } = get();
    if (!template) return;

    set({ isLoading: true, loadingMessage: '正在生成背景选项...', error: null });

    try {
      const response = await fetch(`${API_BASE}/character/generate-backgrounds`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId: template.id, selectedRace, selectedClass, count: 3 }),
      });

      const data = await response.json();
      if (data.success) {
        set({ aiGeneratedBackgrounds: data.data });
      } else {
        set({ error: data.error || '生成背景选项失败' });
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '网络错误' });
    } finally {
      set({ isLoading: false, loadingMessage: '' });
    }
  },

  calculateAttributes: async () => {
    const { template, selectedRace, selectedClass, selectedBackground, isLoading, calculatedAttributes } = get();
    if (!template || !selectedRace || !selectedClass || !selectedBackground) return;
    if (isLoading) return;
    if (Object.keys(calculatedAttributes).length > 0) return;

    set({ isLoading: true, loadingMessage: '正在计算属性...', error: null });

    try {
      const response = await fetch(`${API_BASE}/character/calculate-attributes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: template.id,
          race: selectedRace,
          class: selectedClass,
          background: selectedBackground,
        }),
      });

      const data = await response.json();
      if (data.success) {
        set({ calculatedAttributes: data.data });
      } else {
        set({ error: data.error || '计算属性失败' });
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '网络错误' });
    } finally {
      set({ isLoading: false, loadingMessage: '' });
    }
  },

  finalizeCharacter: async (generateImagePrompt: boolean) => {
    const { template, characterName, selectedRace, selectedClass, selectedBackground } = get();
    if (!template || !characterName || !selectedRace || !selectedClass || !selectedBackground) return;

    set({ isLoading: true, loadingMessage: '正在创建角色...', error: null });

    try {
      const response = await fetch(`${API_BASE}/character/finalize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: template.id,
          characterName,
          race: selectedRace,
          class: selectedClass,
          background: selectedBackground,
          generateImagePrompt,
        }),
      });

      const data = await response.json();
      if (data.success) {
        set({
          finalizedCharacter: data.data,
          generatedAppearance: data.data.appearance,
          generatedImagePrompt: data.data.imagePrompt || '',
          generatedBackstory: data.data.backstory,
        });
      } else {
        set({ error: data.error || '创建角色失败' });
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '网络错误' });
    } finally {
      set({ isLoading: false, loadingMessage: '' });
    }
  },

  goToNextStep: () => {
    const { currentStep } = get();
    const currentIndex = STEP_ORDER.indexOf(currentStep);
    if (currentIndex < STEP_ORDER.length - 1) {
      set({ currentStep: STEP_ORDER[currentIndex + 1] });
    }
  },

  goToPreviousStep: () => {
    const { currentStep } = get();
    const currentIndex = STEP_ORDER.indexOf(currentStep);
    if (currentIndex > 0) {
      set({ currentStep: STEP_ORDER[currentIndex - 1] });
    }
  },

  reset: () => {
    set(initialState);
  },

  clearError: () => {
    set({ error: null });
  },
}));
