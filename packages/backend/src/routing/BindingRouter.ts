import type {
  Binding,
  BindingMatch,
  BindingRouteResult,
  BindingRouterOptions,
  BindingTestRequest,
  BindingTestResult,
} from '@ai-rpg/shared';
import { AgentType, DEFAULT_BINDINGS } from '@ai-rpg/shared';
import { gameLog } from '../services/GameLogService';
import { BindingRepository } from '../models/BindingRepository';

type CacheEntry = {
  result: BindingRouteResult;
  timestamp: number;
};

export class BindingRouter {
  private bindings: Binding[] = [];
  private options: BindingRouterOptions;
  private cache: Map<string, CacheEntry> = new Map();
  private defaultAgentId: AgentType = AgentType.COORDINATOR;
  private repository: BindingRepository | null = null;
  private databaseReady: boolean = false;

  constructor(options?: Partial<BindingRouterOptions>) {
    this.options = {
      cacheEnabled: true,
      cacheTTL: 60000,
      logEnabled: true,
      ...options,
    };

    this.initializeWithDefaults();
    this.tryLoadFromDatabase();
  }

  private initializeWithDefaults(): void {
    this.bindings = [...DEFAULT_BINDINGS];
    this.sortBindings();
    if (this.options.logEnabled) {
      gameLog.info('backend', 'BindingRouter initialized with default bindings', { count: this.bindings.length });
    }
  }

  private tryLoadFromDatabase(): void {
    try {
      this.repository = new BindingRepository();
      this.databaseReady = true;
      this.loadFromDatabase();
    } catch (error) {
      this.databaseReady = false;
      if (this.options.logEnabled) {
        gameLog.warn('backend', 'Database not ready, using default bindings', { 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }
  }

  private loadFromDatabase(): void {
    if (!this.databaseReady || !this.repository) {
      return;
    }
    
    try {
      const entities = this.repository.findAllOrderByPriority();
      if (entities.length > 0) {
        this.bindings = this.repository.toBindings(entities);
        if (this.options.logEnabled) {
          gameLog.info('backend', 'Bindings loaded from database', { count: this.bindings.length });
        }
      } else {
        this.bindings = [...DEFAULT_BINDINGS];
        this.saveToDatabase();
        if (this.options.logEnabled) {
          gameLog.info('backend', 'Default bindings saved to database', { count: this.bindings.length });
        }
      }
      this.sortBindings();
    } catch (error) {
      this.bindings = [...DEFAULT_BINDINGS];
      this.sortBindings();
      if (this.options.logEnabled) {
        const errorMessage = error instanceof Error ? error.message : 
          (typeof error === 'object' && error !== null ? JSON.stringify(error) : String(error));
        gameLog.error('backend', 'Failed to load bindings from database, using defaults', { error: errorMessage });
      }
    }
  }

  private saveToDatabase(): void {
    if (!this.databaseReady || !this.repository) {
      return;
    }
    try {
      this.repository.saveAll(this.bindings);
    } catch (error) {
      if (this.options.logEnabled) {
        gameLog.error('backend', 'Failed to save bindings to database', { error });
      }
    }
  }

  private sortBindings(): void {
    this.bindings.sort((a, b) => b.priority - a.priority);
  }

  setBindings(bindings: Binding[]): void {
    this.bindings = [...bindings];
    this.sortBindings();
    this.clearCache();
    this.saveToDatabase();
    
    if (this.options.logEnabled) {
      gameLog.info('backend', 'Bindings updated', { count: bindings.length });
    }
  }

  getBindings(): Binding[] {
    return [...this.bindings];
  }

  addBinding(binding: Binding): void {
    const existing = this.bindings.find((b) => b.id === binding.id);
    if (existing) {
      Object.assign(existing, binding);
      existing.updatedAt = Date.now();
    } else {
      this.bindings.push(binding);
    }
    this.sortBindings();
    this.clearCache();
    
    if (this.repository) {
      try {
        this.repository.upsert(binding);
      } catch (error) {
        if (this.options.logEnabled) {
          gameLog.error('backend', 'Failed to save binding to database', { error, bindingId: binding.id });
        }
      }
    }
    
    if (this.options.logEnabled) {
      gameLog.info('backend', 'Binding saved', { bindingId: binding.id });
    }
  }

  removeBinding(bindingId: string): boolean {
    const index = this.bindings.findIndex((b) => b.id === bindingId);
    if (index !== -1) {
      this.bindings.splice(index, 1);
      this.clearCache();
      
      if (this.repository) {
        try {
          this.repository.delete(bindingId);
        } catch (error) {
          if (this.options.logEnabled) {
            gameLog.error('backend', 'Failed to delete binding from database', { error, bindingId });
          }
        }
      }
      
      return true;
    }
    return false;
  }

  setDefaultAgent(agentId: AgentType): void {
    this.defaultAgentId = agentId;
  }

  route(messageType: string, context: Record<string, unknown>): BindingRouteResult {
    const cacheKey = this.getCacheKey(messageType, context);

    if (this.options.cacheEnabled) {
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.options.cacheTTL) {
        return cached.result;
      }
    }

    const result = this.doRoute(messageType, context);

    if (this.options.cacheEnabled) {
      this.cache.set(cacheKey, { result, timestamp: Date.now() });
    }

    if (this.options.logEnabled) {
      gameLog.debug('backend', 'Route resolved', {
        messageType,
        agentId: result.agentId,
        matched: result.matched,
        bindingId: result.binding?.id,
      });
    }

    return result;
  }

  private doRoute(messageType: string, context: Record<string, unknown>): BindingRouteResult {
    const allMatches: BindingRouteResult[] = [];

    for (const binding of this.bindings) {
      if (!binding.enabled) {
        continue;
      }

      const matchResult = this.matchBinding(binding, messageType, context);
      if (matchResult.matched) {
        allMatches.push(matchResult);

        if (binding.match.messageType !== '*') {
          return matchResult;
        }
      }
    }

    if (allMatches.length > 0) {
      return allMatches[0];
    }

    return {
      binding: null,
      agentId: this.defaultAgentId,
      matched: false,
      matchDetails: {
        matchedConditions: [],
        score: 0,
      },
    };
  }

  private matchBinding(
    binding: Binding,
    messageType: string,
    context: Record<string, unknown>
  ): BindingRouteResult {
    const matchedConditions: string[] = [];
    let score = 0;

    if (binding.match.messageType) {
      if (binding.match.messageType === '*') {
        matchedConditions.push('messageType:*');
        score += 1;
      } else if (binding.match.messageType === messageType) {
        matchedConditions.push(`messageType:${messageType}`);
        score += 10;
      } else {
        return {
          binding,
          agentId: binding.agentId,
          matched: false,
        };
      }
    }

    if (binding.match.context) {
      for (const [key, value] of Object.entries(binding.match.context)) {
        const contextValue = this.getNestedValue(context, key);
        if (contextValue === value) {
          matchedConditions.push(`context.${key}:${String(value)}`);
          score += 5;
        } else {
          return {
            binding,
            agentId: binding.agentId,
            matched: false,
          };
        }
      }
    }

    if (binding.match.custom) {
      for (const rule of binding.match.custom) {
        const contextValue = this.getNestedValue(context, rule.field);
        const matched = this.evaluateOperator(rule.operator, contextValue, rule.value);

        if (matched) {
          matchedConditions.push(`custom.${rule.field}`);
          score += 3;
        } else {
          return {
            binding,
            agentId: binding.agentId,
            matched: false,
          };
        }
      }
    }

    score += binding.priority;

    return {
      binding,
      agentId: binding.agentId,
      matched: true,
      matchDetails: {
        matchedConditions,
        score,
      },
    };
  }

  private evaluateOperator(
    operator: BindingMatch['custom'] extends { field: string; operator: infer O; value: unknown }[] | undefined
      ? O
      : never,
    left: unknown,
    right: unknown
  ): boolean {
    switch (operator) {
      case 'eq':
        return left === right;
      case 'neq':
        return left !== right;
      case 'gt':
        return typeof left === 'number' && typeof right === 'number' && left > right;
      case 'lt':
        return typeof left === 'number' && typeof right === 'number' && left < right;
      case 'gte':
        return typeof left === 'number' && typeof right === 'number' && left >= right;
      case 'lte':
        return typeof left === 'number' && typeof right === 'number' && left <= right;
      case 'contains':
        return Array.isArray(left) && left.includes(right);
      case 'matches':
        if (typeof right === 'string' && typeof left === 'string') {
          try {
            return new RegExp(right).test(left);
          } catch {
            return false;
          }
        }
        return false;
      default:
        return false;
    }
  }

  private getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    const parts = path.split('.');
    let current: unknown = obj;

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

  private getCacheKey(messageType: string, context: Record<string, unknown>): string {
    return `${messageType}:${JSON.stringify(context)}`;
  }

  clearCache(): void {
    this.cache.clear();
  }

  test(request: BindingTestRequest): BindingTestResult {
    const allMatches: BindingRouteResult[] = [];

    for (const binding of this.bindings) {
      if (!binding.enabled) {
        continue;
      }

      const matchResult = this.matchBinding(binding, request.messageType, request.context);
      if (matchResult.matched) {
        allMatches.push(matchResult);
      }
    }

    allMatches.sort((a, b) => (b.matchDetails?.score ?? 0) - (a.matchDetails?.score ?? 0));

    const topMatch = allMatches[0];

    return {
      matched: allMatches.length > 0,
      agentId: topMatch?.agentId ?? null,
      binding: topMatch?.binding ?? null,
      allMatches,
    };
  }

  getStats(): {
    bindingCount: number;
    enabledCount: number;
    cacheSize: number;
  } {
    return {
      bindingCount: this.bindings.length,
      enabledCount: this.bindings.filter((b) => b.enabled).length,
      cacheSize: this.cache.size,
    };
  }
}

let globalRouter: BindingRouter | null = null;

export function getBindingRouter(options?: Partial<BindingRouterOptions>): BindingRouter {
  if (!globalRouter) {
    globalRouter = new BindingRouter(options);
  }
  return globalRouter;
}

export function resetBindingRouter(): void {
  globalRouter = null;
}
