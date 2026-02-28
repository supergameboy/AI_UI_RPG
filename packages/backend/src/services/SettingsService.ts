export interface GameSettings {
  ai: {
    defaultProvider: string;
    providers: Record<string, {
      apiKey: string;
      baseURL?: string;
      defaultModel?: string;
    }>;
  };
  gameplay: {
    autoSaveEnabled: boolean;
    textSpeed: 'slow' | 'normal' | 'fast' | 'instant';
  };
  developer: {
    developerMode: boolean;
  };
}

const DEFAULT_SETTINGS: GameSettings = {
  ai: {
    defaultProvider: 'deepseek',
    providers: {},
  },
  gameplay: {
    autoSaveEnabled: true,
    textSpeed: 'normal',
  },
  developer: {
    developerMode: false,
  },
};

class SettingsService {
  private settings: GameSettings;

  constructor() {
    this.settings = { ...DEFAULT_SETTINGS };
  }

  getSettings(): GameSettings {
    return { ...this.settings };
  }

  updateSettings(updates: Partial<GameSettings>): GameSettings {
    if (updates.ai !== undefined) {
      this.settings.ai = {
        ...this.settings.ai,
        ...updates.ai,
        providers: updates.ai.providers !== undefined
          ? { ...this.settings.ai.providers, ...updates.ai.providers }
          : this.settings.ai.providers,
      };
    }

    if (updates.gameplay !== undefined) {
      this.settings.gameplay = {
        ...this.settings.gameplay,
        ...updates.gameplay,
      };
    }

    if (updates.developer !== undefined) {
      this.settings.developer = {
        ...this.settings.developer,
        ...updates.developer,
      };
    }

    return this.getSettings();
  }
}

let settingsService: SettingsService | null = null;

export function getSettingsService(): SettingsService {
  if (!settingsService) {
    settingsService = new SettingsService();
  }
  return settingsService;
}

export function initializeSettingsService(): SettingsService {
  return getSettingsService();
}
