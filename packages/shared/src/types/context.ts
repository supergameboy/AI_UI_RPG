import type { AgentType } from './agent';

export interface ContextData {
  path: string;
  value: unknown;
  previousValue?: unknown;
  timestamp: number;
  reason: string;
  agentId: AgentType;
}

export interface AgentContext {
  agentId: AgentType;
  data: Record<string, unknown>;
  changes: ContextData[];
  createdAt: number;
  updatedAt: number;
  version: number;
}

export interface GlobalContext {
  player: {
    id: string;
    name: string;
    race: string;
    class: string;
    background: string;
    level: number;
    experience: number;
    attributes: Record<string, number>;
    health: number;
    maxHealth: number;
    mana: number;
    maxMana: number;
    location: string;
  };
  world: {
    id: string;
    name: string;
    currentTime: number;
    weather: string;
    exploredAreas: string[];
    worldState: Record<string, unknown>;
  };
  combat: {
    inCombat: boolean;
    combatId?: string;
    turn?: number;
    enemies?: unknown[];
    allies?: unknown[];
  } | null;
  inventory: {
    items: unknown[];
    equipment: Record<string, unknown>;
    currency: Record<string, number>;
  };
  quests: {
    active: unknown[];
    completed: string[];
    failed: string[];
  };
  npcs: {
    met: string[];
    relationships: Record<string, number>;
    party: string[];
  };
  story: {
    currentNode: string;
    choices: unknown[];
    plotPoints: unknown[];
  };
  dialogue: {
    history: unknown[];
    currentNpc?: string;
  };
  metadata: {
    createdAt: number;
    updatedAt: number;
    saveVersion: string;
    templateId: string;
    gameMode: string;
  };
}

export interface ContextSnapshot {
  id: string;
  globalContext: GlobalContext;
  agentContexts: AgentContext[];
  timestamp: number;
  requestId: string;
}

export interface ContextMergeResult {
  success: boolean;
  mergedContext: GlobalContext;
  conflicts: ContextConflict[];
  appliedChanges: ContextData[];
}

export interface ContextConflict {
  id: string;
  path: string;
  agents: AgentType[];
  values: {
    agentId: AgentType;
    value: unknown;
    reason: string;
  }[];
  resolution: 'pending' | 'priority' | 'timestamp' | 'manual';
  resolvedValue?: unknown;
  resolvedBy?: AgentType;
  timestamp: number;
}

export interface ContextDiff {
  path: string;
  type: 'added' | 'removed' | 'modified';
  oldValue: unknown;
  newValue: unknown;
  agentId: AgentType;
}

export type ConflictResolutionStrategy = 'priority' | 'timestamp' | 'manual' | 'abort';

export interface ConflictResolutionRule {
  path: string;
  strategy: ConflictResolutionStrategy;
  priority?: AgentType[];
  fallback?: unknown;
}

export const DEFAULT_CONFLICT_RESOLUTION_RULES: ConflictResolutionRule[] = [
  {
    path: 'player.health',
    strategy: 'priority',
    priority: ['combat' as AgentType, 'numerical' as AgentType],
  },
  {
    path: 'player.location',
    strategy: 'priority',
    priority: ['map' as AgentType],
  },
  {
    path: 'inventory.items',
    strategy: 'priority',
    priority: ['inventory' as AgentType],
  },
  {
    path: 'quests.*',
    strategy: 'priority',
    priority: ['quest' as AgentType],
  },
  {
    path: 'npcs.relationships',
    strategy: 'priority',
    priority: ['npc_party' as AgentType, 'dialogue' as AgentType],
  },
  {
    path: '*',
    strategy: 'timestamp',
  },
];

export interface ContextManagerConfig {
  maxHistorySize: number;
  snapshotInterval: number;
  conflictResolutionRules: ConflictResolutionRule[];
  autoMerge: boolean;
  logChanges: boolean;
}

export const DEFAULT_CONTEXT_MANAGER_CONFIG: ContextManagerConfig = {
  maxHistorySize: 100,
  snapshotInterval: 60000,
  conflictResolutionRules: DEFAULT_CONFLICT_RESOLUTION_RULES,
  autoMerge: true,
  logChanges: true,
};
