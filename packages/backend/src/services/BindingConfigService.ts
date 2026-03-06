import type {
  Binding,
  BindingConfig,
  AgentType,
} from '@ai-rpg/shared';
import { DEFAULT_BINDINGS } from '@ai-rpg/shared';
import { gameLog } from './GameLogService';

export interface BindingConfigStorage {
  load(): Promise<BindingConfig>;
  save(config: BindingConfig): Promise<void>;
}

export class InMemoryBindingConfigStorage implements BindingConfigStorage {
  private config: BindingConfig | null = null;

  async load(): Promise<BindingConfig> {
    if (this.config) {
      return this.config;
    }
    return {
      bindings: [...DEFAULT_BINDINGS],
      defaultAgentId: 'coordinator' as AgentType,
      version: '1.0.0',
    };
  }

  async save(config: BindingConfig): Promise<void> {
    this.config = { ...config };
  }
}

export class BindingConfigService {
  private config: BindingConfig | null = null;
  private storage: BindingConfigStorage;
  private dirty: boolean = false;

  constructor(storage?: BindingConfigStorage) {
    this.storage = storage ?? new InMemoryBindingConfigStorage();
  }

  async initialize(): Promise<void> {
    try {
      this.config = await this.storage.load();
      gameLog.info('backend', 'Binding config loaded', {
        bindingCount: this.config.bindings.length,
        version: this.config.version,
      });
    } catch (error) {
      gameLog.warn('backend', 'Failed to load binding config, using defaults', {
        error: error instanceof Error ? error.message : String(error),
      });
      this.config = {
        bindings: [...DEFAULT_BINDINGS],
        defaultAgentId: 'coordinator' as AgentType,
        version: '1.0.0',
      };
    }
  }

  getConfig(): BindingConfig {
    if (!this.config) {
      throw new Error('BindingConfigService not initialized');
    }
    return {
      ...this.config,
      bindings: [...this.config.bindings],
    };
  }

  getBindings(): Binding[] {
    if (!this.config) {
      throw new Error('BindingConfigService not initialized');
    }
    return [...this.config.bindings];
  }

  getBinding(bindingId: string): Binding | undefined {
    if (!this.config) {
      throw new Error('BindingConfigService not initialized');
    }
    return this.config.bindings.find((b) => b.id === bindingId);
  }

  addBinding(binding: Binding): void {
    if (!this.config) {
      throw new Error('BindingConfigService not initialized');
    }

    const existing = this.config.bindings.find((b) => b.id === binding.id);
    if (existing) {
      Object.assign(existing, binding);
      existing.updatedAt = Date.now();
    } else {
      this.config.bindings.push({
        ...binding,
        createdAt: binding.createdAt ?? Date.now(),
        updatedAt: Date.now(),
      });
    }
    this.dirty = true;

    gameLog.debug('backend', 'Binding added/updated', { bindingId: binding.id });
  }

  updateBinding(bindingId: string, updates: Partial<Binding>): boolean {
    if (!this.config) {
      throw new Error('BindingConfigService not initialized');
    }

    const binding = this.config.bindings.find((b) => b.id === bindingId);
    if (!binding) {
      return false;
    }

    Object.assign(binding, updates, { updatedAt: Date.now() });
    this.dirty = true;

    gameLog.debug('backend', 'Binding updated', { bindingId });
    return true;
  }

  removeBinding(bindingId: string): boolean {
    if (!this.config) {
      throw new Error('BindingConfigService not initialized');
    }

    const index = this.config.bindings.findIndex((b) => b.id === bindingId);
    if (index === -1) {
      return false;
    }

    this.config.bindings.splice(index, 1);
    this.dirty = true;

    gameLog.debug('backend', 'Binding removed', { bindingId });
    return true;
  }

  setBindingEnabled(bindingId: string, enabled: boolean): boolean {
    return this.updateBinding(bindingId, { enabled });
  }

  setBindingPriority(bindingId: string, priority: number): boolean {
    return this.updateBinding(bindingId, { priority });
  }

  getDefaultAgent(): AgentType {
    if (!this.config) {
      throw new Error('BindingConfigService not initialized');
    }
    return this.config.defaultAgentId;
  }

  setDefaultAgent(agentId: AgentType): void {
    if (!this.config) {
      throw new Error('BindingConfigService not initialized');
    }
    this.config.defaultAgentId = agentId;
    this.dirty = true;

    gameLog.info('backend', 'Default agent changed', { agentId });
  }

  resetToDefaults(): void {
    this.config = {
      bindings: [...DEFAULT_BINDINGS],
      defaultAgentId: 'coordinator' as AgentType,
      version: '1.0.0',
    };
    this.dirty = true;

    gameLog.info('backend', 'Binding config reset to defaults');
  }

  async save(): Promise<void> {
    if (!this.config) {
      throw new Error('BindingConfigService not initialized');
    }

    if (!this.dirty) {
      return;
    }

    await this.storage.save(this.config);
    this.dirty = false;

    gameLog.info('backend', 'Binding config saved');
  }

  isDirty(): boolean {
    return this.dirty;
  }

  validateBinding(binding: Partial<Binding>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!binding.id || typeof binding.id !== 'string') {
      errors.push('Binding must have a valid id');
    }

    if (!binding.agentId || typeof binding.agentId !== 'string') {
      errors.push('Binding must have a valid agentId');
    }

    if (typeof binding.priority !== 'number' || binding.priority < 0) {
      errors.push('Binding must have a valid non-negative priority');
    }

    if (!binding.match || typeof binding.match !== 'object') {
      errors.push('Binding must have a valid match object');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  exportConfig(): string {
    if (!this.config) {
      throw new Error('BindingConfigService not initialized');
    }
    return JSON.stringify(this.config, null, 2);
  }

  importConfig(json: string): { success: boolean; error?: string } {
    try {
      const config = JSON.parse(json) as BindingConfig;

      if (!config.bindings || !Array.isArray(config.bindings)) {
        return { success: false, error: 'Invalid config: missing bindings array' };
      }

      if (!config.defaultAgentId) {
        return { success: false, error: 'Invalid config: missing defaultAgentId' };
      }

      for (const binding of config.bindings) {
        const validation = this.validateBinding(binding);
        if (!validation.valid) {
          return { success: false, error: `Invalid binding ${binding.id}: ${validation.errors.join(', ')}` };
        }
      }

      this.config = {
        ...config,
        version: config.version ?? '1.0.0',
      };
      this.dirty = true;

      gameLog.info('backend', 'Binding config imported', {
        bindingCount: config.bindings.length,
      });

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to parse config JSON',
      };
    }
  }
}

let globalBindingConfigService: BindingConfigService | null = null;

export function getBindingConfigService(storage?: BindingConfigStorage): BindingConfigService {
  if (!globalBindingConfigService) {
    globalBindingConfigService = new BindingConfigService(storage);
  }
  return globalBindingConfigService;
}

export function resetBindingConfigService(): void {
  globalBindingConfigService = null;
}
