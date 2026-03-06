import type {
  AgentContext,
  ContextData,
  GlobalContext,
  ContextSnapshot,
  ContextMergeResult,
  ContextConflict,
  ContextDiff,
  ConflictResolutionRule,
  ContextManagerConfig,
} from '@ai-rpg/shared';
import { AgentType, DEFAULT_CONFLICT_RESOLUTION_RULES } from '@ai-rpg/shared';
import { gameLog } from '../services/GameLogService';

export class AgentContextManager {
  private agentId: AgentType;
  private data: Record<string, unknown> = {};
  private changes: ContextData[] = [];
  private createdAt: number;
  private updatedAt: number;
  private version: number = 1;
  private maxHistorySize: number;

  constructor(agentId: AgentType, maxHistorySize: number = 100) {
    this.agentId = agentId;
    this.createdAt = Date.now();
    this.updatedAt = this.createdAt;
    this.maxHistorySize = maxHistorySize;
  }

  getAgentId(): AgentType {
    return this.agentId;
  }

  get(path: string): unknown {
    const parts = path.split('.');
    let current: unknown = this.data;

    for (const part of parts) {
      if (current === null || current === undefined) {
        return undefined;
      }
      if (typeof current === 'object') {
        current = (current as Record<string, unknown>)[part];
      } else {
        return undefined;
      }
    }

    return current;
  }

  set(path: string, value: unknown, reason: string): void {
    const previousValue = this.get(path);
    this.setNestedValue(this.data, path, value);
    this.updatedAt = Date.now();
    this.version++;

    const change: ContextData = {
      path,
      value,
      previousValue,
      timestamp: this.updatedAt,
      reason,
      agentId: this.agentId,
    };

    this.changes.push(change);

    if (this.changes.length > this.maxHistorySize) {
      this.changes.shift();
    }

    gameLog.debug('backend', `Context updated by ${this.agentId}`, {
      path,
      reason,
      hasPreviousValue: previousValue !== undefined,
    });
  }

  private setNestedValue(obj: Record<string, unknown>, path: string, value: unknown): void {
    const parts = path.split('.');
    let current: Record<string, unknown> = obj;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!(part in current)) {
        current[part] = {};
      }
      if (typeof current[part] === 'object' && current[part] !== null) {
        current = current[part] as Record<string, unknown>;
      } else {
        current[part] = {};
        current = current[part] as Record<string, unknown>;
      }
    }

    current[parts[parts.length - 1]] = value;
  }

  delete(path: string, reason: string): boolean {
    const previousValue = this.get(path);
    if (previousValue === undefined) {
      return false;
    }

    this.deleteNestedValue(this.data, path);
    this.updatedAt = Date.now();
    this.version++;

    const change: ContextData = {
      path,
      value: undefined,
      previousValue,
      timestamp: this.updatedAt,
      reason,
      agentId: this.agentId,
    };

    this.changes.push(change);
    return true;
  }

  private deleteNestedValue(obj: Record<string, unknown>, path: string): void {
    const parts = path.split('.');
    let current: Record<string, unknown> = obj;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!(part in current) || typeof current[part] !== 'object') {
        return;
      }
      current = current[part] as Record<string, unknown>;
    }

    delete current[parts[parts.length - 1]];
  }

  getAll(): Record<string, unknown> {
    return { ...this.data };
  }

  setAll(data: Record<string, unknown>, reason: string): void {
    const previousData = { ...this.data };
    this.data = { ...data };
    this.updatedAt = Date.now();
    this.version++;

    for (const key of Object.keys(data)) {
      this.changes.push({
        path: key,
        value: data[key],
        previousValue: previousData[key],
        timestamp: this.updatedAt,
        reason,
        agentId: this.agentId,
      });
    }

    while (this.changes.length > this.maxHistorySize) {
      this.changes.shift();
    }
  }

  getChanges(since?: number): ContextData[] {
    if (since === undefined) {
      return [...this.changes];
    }
    return this.changes.filter((c) => c.timestamp > since);
  }

  getChangesSince(version: number): ContextData[] {
    return this.changes.filter((c) => {
      const changeVersion = this.changes.indexOf(c) + 1;
      return changeVersion > version;
    });
  }

  clearChanges(): void {
    this.changes = [];
  }

  toAgentContext(): AgentContext {
    return {
      agentId: this.agentId,
      data: { ...this.data },
      changes: [...this.changes],
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      version: this.version,
    };
  }

  snapshot(): Record<string, unknown> {
    return JSON.parse(JSON.stringify(this.data));
  }

  restore(snapshot: Record<string, unknown>): void {
    this.data = JSON.parse(JSON.stringify(snapshot));
    this.updatedAt = Date.now();
    this.version++;
  }

  reset(): void {
    this.data = {};
    this.changes = [];
    this.updatedAt = Date.now();
    this.version = 1;
  }

  getVersion(): number {
    return this.version;
  }
}

export class ContextManager {
  private globalContext: GlobalContext;
  private agentContexts: Map<AgentType, AgentContextManager> = new Map();
  private snapshots: ContextSnapshot[] = [];
  private config: ContextManagerConfig;
  private conflictResolutionRules: ConflictResolutionRule[];

  constructor(
    initialContext: Partial<GlobalContext>,
    config?: Partial<ContextManagerConfig>
  ) {
    this.config = {
      maxHistorySize: 100,
      snapshotInterval: 60000,
      conflictResolutionRules: DEFAULT_CONFLICT_RESOLUTION_RULES,
      autoMerge: true,
      logChanges: true,
      ...config,
    };

    this.conflictResolutionRules = this.config.conflictResolutionRules;

    this.globalContext = this.createDefaultGlobalContext(initialContext);
  }

  private createDefaultGlobalContext(partial: Partial<GlobalContext>): GlobalContext {
    return {
      player: partial.player ?? {
        id: '',
        name: '',
        race: '',
        class: '',
        background: '',
        level: 1,
        experience: 0,
        attributes: {},
        health: 100,
        maxHealth: 100,
        mana: 100,
        maxMana: 100,
        location: 'start',
      },
      world: partial.world ?? {
        id: 'default',
        name: 'Default World',
        currentTime: 0,
        weather: 'clear',
        exploredAreas: [],
        worldState: {},
      },
      combat: partial.combat ?? null,
      inventory: partial.inventory ?? {
        items: [],
        equipment: {},
        currency: { gold: 0 },
      },
      quests: partial.quests ?? {
        active: [],
        completed: [],
        failed: [],
      },
      npcs: partial.npcs ?? {
        met: [],
        relationships: {},
        party: [],
      },
      story: partial.story ?? {
        currentNode: 'start',
        choices: [],
        plotPoints: [],
      },
      dialogue: partial.dialogue ?? {
        history: [],
      },
      metadata: partial.metadata ?? {
        createdAt: Date.now(),
        updatedAt: Date.now(),
        saveVersion: '1.0.0',
        templateId: 'default',
        gameMode: 'normal',
      },
    };
  }

  getGlobalContext(): GlobalContext {
    return JSON.parse(JSON.stringify(this.globalContext));
  }

  updateGlobalContext(updates: Partial<GlobalContext>): void {
    Object.assign(this.globalContext, updates);
    this.globalContext.metadata.updatedAt = Date.now();

    if (this.config.logChanges) {
      gameLog.debug('backend', 'Global context updated', {
        fields: Object.keys(updates),
      });
    }
  }

  getAgentContext(agentId: AgentType): AgentContextManager {
    if (!this.agentContexts.has(agentId)) {
      this.agentContexts.set(agentId, new AgentContextManager(agentId, this.config.maxHistorySize));
    }
    return this.agentContexts.get(agentId)!;
  }

  hasAgentContext(agentId: AgentType): boolean {
    return this.agentContexts.has(agentId);
  }

  getAllAgentContexts(): Map<AgentType, AgentContextManager> {
    return new Map(this.agentContexts);
  }

  createSnapshot(requestId: string): ContextSnapshot {
    const snapshot: ContextSnapshot = {
      id: `snapshot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      globalContext: JSON.parse(JSON.stringify(this.globalContext)),
      agentContexts: Array.from(this.agentContexts.values()).map((ac) => ac.toAgentContext()),
      timestamp: Date.now(),
      requestId,
    };

    this.snapshots.push(snapshot);

    if (this.snapshots.length > 10) {
      this.snapshots.shift();
    }

    return snapshot;
  }

  getLatestSnapshot(): ContextSnapshot | undefined {
    return this.snapshots[this.snapshots.length - 1];
  }

  mergeContexts(agentIds?: AgentType[]): ContextMergeResult {
    const targetAgents = agentIds ?? Array.from(this.agentContexts.keys());
    const conflicts: ContextConflict[] = [];
    const appliedChanges: ContextData[] = [];

    const changeMap = new Map<string, { agentId: AgentType; change: ContextData }[]>();

    for (const agentId of targetAgents) {
      const agentContext = this.agentContexts.get(agentId);
      if (!agentContext) continue;

      const changes = agentContext.getChanges();
      for (const change of changes) {
        if (!changeMap.has(change.path)) {
          changeMap.set(change.path, []);
        }
        changeMap.get(change.path)!.push({ agentId, change });
      }
    }

    for (const [path, agentChanges] of changeMap) {
      if (agentChanges.length === 1) {
        this.applyChange(path, agentChanges[0].change);
        appliedChanges.push(agentChanges[0].change);
      } else {
        const conflict = this.resolveConflict(path, agentChanges);
        if (conflict) {
          conflicts.push(conflict);
          if (conflict.resolvedValue !== undefined) {
            this.applyChange(path, {
              path,
              value: conflict.resolvedValue,
              timestamp: Date.now(),
              reason: `Conflict resolution: ${conflict.resolution}`,
              agentId: conflict.resolvedBy ?? AgentType.COORDINATOR,
            });
            appliedChanges.push({
              path,
              value: conflict.resolvedValue,
              timestamp: Date.now(),
              reason: `Conflict resolution: ${conflict.resolution}`,
              agentId: conflict.resolvedBy ?? AgentType.COORDINATOR,
            });
          }
        }
      }
    }

    if (this.config.logChanges) {
      gameLog.info('backend', 'Contexts merged', {
        agentCount: targetAgents.length,
        changeCount: appliedChanges.length,
        conflictCount: conflicts.length,
      });
    }

    return {
      success: true,
      mergedContext: this.getGlobalContext(),
      conflicts,
      appliedChanges,
    };
  }

  private applyChange(path: string, change: ContextData): void {
    const parts = path.split('.');
    let current: Record<string, unknown> = this.globalContext as unknown as Record<string, unknown>;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!(part in current)) {
        current[part] = {};
      }
      if (typeof current[part] === 'object' && current[part] !== null) {
        current = current[part] as Record<string, unknown>;
      } else {
        current[part] = {};
        current = current[part] as Record<string, unknown>;
      }
    }

    current[parts[parts.length - 1]] = change.value;
    this.globalContext.metadata.updatedAt = Date.now();
  }

  private resolveConflict(
    path: string,
    agentChanges: { agentId: AgentType; change: ContextData }[]
  ): ContextConflict | null {
    const rule = this.findResolutionRule(path);
    const strategy = rule?.strategy ?? 'timestamp';
    
    if (strategy === 'abort') {
      return null;
    }

    const conflict: ContextConflict = {
      id: `conflict-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      path,
      agents: agentChanges.map((ac) => ac.agentId),
      values: agentChanges.map((ac) => ({
        agentId: ac.agentId,
        value: ac.change.value,
        reason: ac.change.reason,
      })),
      resolution: strategy,
      timestamp: Date.now(),
    };

    switch (rule?.strategy) {
      case 'priority':
        if (rule.priority) {
          for (const preferredAgent of rule.priority) {
            const agentChange = agentChanges.find((ac) => ac.agentId === preferredAgent);
            if (agentChange) {
              conflict.resolvedValue = agentChange.change.value;
              conflict.resolvedBy = agentChange.agentId;
              break;
            }
          }
        }
        break;

      case 'timestamp':
        const latest = agentChanges.reduce((latest, current) =>
          current.change.timestamp > latest.change.timestamp ? current : latest
        );
        conflict.resolvedValue = latest.change.value;
        conflict.resolvedBy = latest.agentId;
        break;

      case 'manual':
        break;
    }

    return conflict;
  }

  private findResolutionRule(path: string): ConflictResolutionRule | undefined {
    for (const rule of this.conflictResolutionRules) {
      if (rule.path === path) {
        return rule;
      }
      if (rule.path.includes('*')) {
        const pattern = rule.path.replace(/\*/g, '.*');
        if (new RegExp(`^${pattern}$`).test(path)) {
          return rule;
        }
      }
    }
    return undefined;
  }

  diffContexts(before: GlobalContext, after: GlobalContext): ContextDiff[] {
    const diffs: ContextDiff[] = [];
    this.compareObjects(before, after, '', diffs);
    return diffs;
  }

  private compareObjects(
    before: unknown,
    after: unknown,
    path: string,
    diffs: ContextDiff[]
  ): void {
    if (before === after) return;

    if (typeof before !== typeof after || before === null || after === null) {
      diffs.push({
        path,
        type: before === undefined ? 'added' : after === undefined ? 'removed' : 'modified',
        oldValue: before,
        newValue: after,
        agentId: AgentType.COORDINATOR,
      });
      return;
    }

    if (typeof before === 'object' && typeof after === 'object') {
      const beforeObj = before as Record<string, unknown>;
      const afterObj = after as Record<string, unknown>;
      const allKeys = new Set([...Object.keys(beforeObj), ...Object.keys(afterObj)]);

      for (const key of allKeys) {
        const newPath = path ? `${path}.${key}` : key;
        if (!(key in beforeObj)) {
          diffs.push({
            path: newPath,
            type: 'added',
            oldValue: undefined,
            newValue: afterObj[key],
            agentId: AgentType.COORDINATOR,
          });
        } else if (!(key in afterObj)) {
          diffs.push({
            path: newPath,
            type: 'removed',
            oldValue: beforeObj[key],
            newValue: undefined,
            agentId: AgentType.COORDINATOR,
          });
        } else {
          this.compareObjects(beforeObj[key], afterObj[key], newPath, diffs);
        }
      }
    } else {
      diffs.push({
        path,
        type: 'modified',
        oldValue: before,
        newValue: after,
        agentId: AgentType.COORDINATOR,
      });
    }
  }

  clearAgentContexts(): void {
    this.agentContexts.clear();
  }

  reset(): void {
    this.globalContext = this.createDefaultGlobalContext({});
    this.agentContexts.clear();
    this.snapshots = [];
  }
}
