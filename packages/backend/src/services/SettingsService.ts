import path from 'path';
import fs from 'fs';

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

function getSettingsFilePath(): string {
  const gameDataPath = path.join(process.cwd(), 'game_data');

  if (!fs.existsSync(gameDataPath)) {
    fs.mkdirSync(gameDataPath, { recursive: true });
  }

  return path.join(gameDataPath, 'settings.json');
}

class SettingsService {
  private settings: GameSettings;
  private settingsPath: string;

  constructor() {
    this.settingsPath = getSettingsFilePath();
    this.settings = this.loadFromFile();
  }

  private loadFromFile(): GameSettings {
    try {
      if (fs.existsSync(this.settingsPath)) {
        const data = fs.readFileSync(this.settingsPath, 'utf-8');
        const parsed = JSON.parse(data) as Partial<GameSettings>;
        console.log('[SettingsService] Loaded settings from file:', this.settingsPath);
        return {
          ai: { ...DEFAULT_SETTINGS.ai, ...parsed.ai },
          gameplay: { ...DEFAULT_SETTINGS.gameplay, ...parsed.gameplay },
          developer: { ...DEFAULT_SETTINGS.developer, ...parsed.developer },
        };
      }
    } catch (error) {
      console.error('[SettingsService] Failed to load settings from file:', error);
    }
    return { ...DEFAULT_SETTINGS };
  }

  private saveToFile(): void {
    try {
      fs.writeFileSync(this.settingsPath, JSON.stringify(this.settings, null, 2), 'utf-8');
      console.log('[SettingsService] Settings saved to file:', this.settingsPath);
    } catch (error) {
      console.error('[SettingsService] Failed to save settings to file:', error);
    }
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

    this.saveToFile();
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
