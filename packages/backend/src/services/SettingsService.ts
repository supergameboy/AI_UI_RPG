import path from 'path';
import fs from 'fs';
import { gameLog } from './GameLogService';

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
        gameLog.info('backend', '设置从文件加载', { path: this.settingsPath });
        return {
          ai: { ...DEFAULT_SETTINGS.ai, ...parsed.ai },
          gameplay: { ...DEFAULT_SETTINGS.gameplay, ...parsed.gameplay },
          developer: { ...DEFAULT_SETTINGS.developer, ...parsed.developer },
        };
      }
    } catch (error) {
      gameLog.error('backend', '加载设置失败', { error: error instanceof Error ? error.message : String(error) });
    }
    gameLog.info('backend', '使用默认设置');
    return { ...DEFAULT_SETTINGS };
  }

  private saveToFile(): void {
    try {
      fs.writeFileSync(this.settingsPath, JSON.stringify(this.settings, null, 2), 'utf-8');
      gameLog.debug('backend', '设置保存到文件', { path: this.settingsPath });
    } catch (error) {
      gameLog.error('backend', '保存设置失败', { error: error instanceof Error ? error.message : String(error) });
    }
  }

  getSettings(): GameSettings {
    gameLog.debug('backend', '获取设置');
    return { ...this.settings };
  }

  updateSettings(updates: Partial<GameSettings>): GameSettings {
    gameLog.info('backend', '更新设置', { 
      hasAiUpdate: updates.ai !== undefined,
      hasGameplayUpdate: updates.gameplay !== undefined,
      hasDeveloperUpdate: updates.developer !== undefined,
    });
    
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
