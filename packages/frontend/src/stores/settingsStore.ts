import { create } from 'zustand';
import { AgentType } from '@ai-rpg/shared';

export type TextSpeed = 'slow' | 'normal' | 'fast' | 'instant';

export interface ProviderConfig {
  apiKey: string;
  baseURL?: string;
  defaultModel?: string;
}

/**
 * Per-Agent LLM 配置
 * 允许为每个 Agent 单独配置模型和参数
 */
export interface AgentLLMConfig {
  /** 使用的模型，不设置则使用全局默认 */
  model?: string;
  /** 温度参数 (0-2) */
  temperature?: number;
  /** 最大 token 数 */
  maxTokens?: number;
  /** Top P 采样参数 (0-1) */
  topP?: number;
  /** 是否启用故障转移 */
  fallbackEnabled?: boolean;
  /** 故障转移时使用的备用模型 */
  fallbackModel?: string;
  /** 故障转移策略 */
  fallbackStrategy?: 'auto' | 'specified';
}

export interface AISettings {
  defaultProvider: string;
  providers: Record<string, ProviderConfig>;
  /** Per-Agent 模型配置 */
  agentConfigs?: Partial<Record<AgentType, AgentLLMConfig>>;
}

export interface GameplaySettings {
  autoSaveEnabled: boolean;
  textSpeed: TextSpeed;
  aiRandomGeneration: boolean;
  generateImagePrompt: boolean;
}

export interface DeveloperSettings {
  developerMode: boolean;
}

export interface GameSettings {
  ai: AISettings;
  gameplay: GameplaySettings;
  developer: DeveloperSettings;
}

const STORAGE_KEY = 'ai-rpg-settings';

const defaultSettings: GameSettings = {
  ai: {
    defaultProvider: 'deepseek',
    providers: {},
  },
  gameplay: {
    autoSaveEnabled: true,
    textSpeed: 'normal',
    aiRandomGeneration: true,
    generateImagePrompt: true,
  },
  developer: {
    developerMode: false,
  },
};

const loadSettings = (): GameSettings => {
  if (typeof window === 'undefined') {
    return defaultSettings;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<GameSettings>;
      return {
        ai: { ...defaultSettings.ai, ...parsed.ai },
        gameplay: { ...defaultSettings.gameplay, ...parsed.gameplay },
        developer: { ...defaultSettings.developer, ...parsed.developer },
      };
    }
  } catch (error) {
    console.error('Failed to load settings:', error);
  }

  return defaultSettings;
};

const saveSettings = (settings: GameSettings): void => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
};

export interface SettingsState {
  settings: GameSettings;
  updateSettings: (updates: Partial<GameSettings>) => void;
  updateAISettings: (updates: Partial<AISettings>) => void;
  updateGameplaySettings: (updates: Partial<GameplaySettings>) => void;
  updateDeveloperSettings: (updates: Partial<DeveloperSettings>) => void;
  updateProvider: (provider: string, config: ProviderConfig) => void;
  setDefaultProvider: (provider: string) => void;
  updateAgentConfig: (agentType: AgentType, config: Partial<AgentLLMConfig>) => void;
  clearAgentConfig: (agentType: AgentType) => void;
  resetToDefaults: () => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: loadSettings(),

  updateSettings: (updates: Partial<GameSettings>) => {
    const newSettings = {
      ...get().settings,
      ...updates,
      ai: { ...get().settings.ai, ...updates.ai },
      gameplay: { ...get().settings.gameplay, ...updates.gameplay },
      developer: { ...get().settings.developer, ...updates.developer },
    };
    saveSettings(newSettings);
    set({ settings: newSettings });
  },

  updateAISettings: (updates: Partial<AISettings>) => {
    const newSettings = {
      ...get().settings,
      ai: { ...get().settings.ai, ...updates },
    };
    saveSettings(newSettings);
    set({ settings: newSettings });
  },

  updateGameplaySettings: (updates: Partial<GameplaySettings>) => {
    const newSettings = {
      ...get().settings,
      gameplay: { ...get().settings.gameplay, ...updates },
    };
    saveSettings(newSettings);
    set({ settings: newSettings });
  },

  updateDeveloperSettings: (updates: Partial<DeveloperSettings>) => {
    const newSettings = {
      ...get().settings,
      developer: { ...get().settings.developer, ...updates },
    };
    saveSettings(newSettings);
    set({ settings: newSettings });
  },

  updateProvider: (provider: string, config: ProviderConfig) => {
    const newSettings = {
      ...get().settings,
      ai: {
        ...get().settings.ai,
        providers: {
          ...get().settings.ai.providers,
          [provider]: config,
        },
      },
    };
    saveSettings(newSettings);
    set({ settings: newSettings });
  },

  setDefaultProvider: (provider: string) => {
    const newSettings = {
      ...get().settings,
      ai: {
        ...get().settings.ai,
        defaultProvider: provider,
      },
    };
    saveSettings(newSettings);
    set({ settings: newSettings });
  },

  updateAgentConfig: (agentType: AgentType, config: Partial<AgentLLMConfig>) => {
    const newSettings = {
      ...get().settings,
      ai: {
        ...get().settings.ai,
        agentConfigs: {
          ...get().settings.ai.agentConfigs,
          [agentType]: {
            ...get().settings.ai.agentConfigs?.[agentType],
            ...config,
          },
        },
      },
    };
    saveSettings(newSettings);
    set({ settings: newSettings });
  },

  clearAgentConfig: (agentType: AgentType) => {
    const agentConfigs = { ...get().settings.ai.agentConfigs };
    delete agentConfigs[agentType];
    const newSettings = {
      ...get().settings,
      ai: {
        ...get().settings.ai,
        agentConfigs,
      },
    };
    saveSettings(newSettings);
    set({ settings: newSettings });
  },

  resetToDefaults: () => {
    saveSettings(defaultSettings);
    set({ settings: defaultSettings });
  },
}));
