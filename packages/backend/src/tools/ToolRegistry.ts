import type {
  ToolType,
  ToolStatus,
  ToolResponse,
  ToolCallContext,
} from '@ai-rpg/shared';
import type { ToolBase } from './ToolBase';
import { gameLog } from '../services/GameLogService';

export interface ToolRegistryConfig {
  autoInitialize: boolean;
  logCalls: boolean;
  maxConcurrentCalls: number;
}

const DEFAULT_CONFIG: ToolRegistryConfig = {
  autoInitialize: true,
  logCalls: true,
  maxConcurrentCalls: 100,
};

export class ToolRegistry {
  private tools: Map<ToolType, ToolBase> = new Map();
  private config: ToolRegistryConfig;
  private initializationPromise: Promise<void> | null = null;
  private activeCalls: number = 0;

  constructor(config?: Partial<ToolRegistryConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  registerTool(tool: ToolBase): void {
    if (this.tools.has(tool.type)) {
      gameLog.warn('backend', `Tool '${tool.type}' already registered, replacing`);
    }

    this.tools.set(tool.type, tool);
    gameLog.info('backend', `Tool '${tool.type}' registered`, {
      name: tool.getConfig().name,
      version: tool.getConfig().version,
    });
  }

  unregisterTool(toolType: ToolType): boolean {
    const tool = this.tools.get(toolType);
    if (tool) {
      tool.dispose();
      this.tools.delete(toolType);
      gameLog.info('backend', `Tool '${toolType}' unregistered`);
      return true;
    }
    return false;
  }

  getTool<T extends ToolBase>(toolType: ToolType): T | undefined {
    return this.tools.get(toolType) as T | undefined;
  }

  hasTool(toolType: ToolType): boolean {
    return this.tools.has(toolType);
  }

  listTools(): ToolType[] {
    return Array.from(this.tools.keys());
  }

  listToolStatuses(): ToolStatus[] {
    return Array.from(this.tools.values()).map((tool) => tool.getStatus());
  }

  async initializeAll(): Promise<void> {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.doInitializeAll();
    return this.initializationPromise;
  }

  private async doInitializeAll(): Promise<void> {
    const initPromises = Array.from(this.tools.values()).map(async (tool) => {
      try {
        await tool.initialize();
        gameLog.debug('backend', `Tool '${tool.type}' initialized`);
      } catch (error) {
        gameLog.error('backend', `Failed to initialize tool '${tool.type}'`, {
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    });

    await Promise.all(initPromises);
    gameLog.info('backend', 'All tools initialized', {
      count: this.tools.size,
    });
  }

  async disposeAll(): Promise<void> {
    const disposePromises = Array.from(this.tools.values()).map(async (tool) => {
      try {
        await tool.dispose();
      } catch (error) {
        gameLog.error('backend', `Failed to dispose tool '${tool.type}'`, {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    });

    await Promise.all(disposePromises);
    this.tools.clear();
    this.initializationPromise = null;
    gameLog.info('backend', 'All tools disposed');
  }

  async executeTool<T = unknown>(
    toolType: ToolType,
    method: string,
    params: Record<string, unknown>,
    context: ToolCallContext
  ): Promise<ToolResponse<T>> {
    const tool = this.tools.get(toolType);

    if (!tool) {
      return {
        success: false,
        error: {
          code: 'TOOL_NOT_FOUND',
          message: `Tool '${toolType}' not found in registry`,
        },
      };
    }

    if (this.activeCalls >= this.config.maxConcurrentCalls) {
      return {
        success: false,
        error: {
          code: 'MAX_CONCURRENT_CALLS_EXCEEDED',
          message: `Maximum concurrent calls (${this.config.maxConcurrentCalls}) exceeded`,
        },
      };
    }

    this.activeCalls++;

    if (this.config.logCalls) {
      gameLog.debug('backend', `Tool call: ${toolType}.${method}`, {
        agentId: context.agentId,
        requestId: context.requestId,
        permission: context.permission,
        params,
      });
    }

    const startTime = Date.now();

    try {
      const result = await tool.execute<T>(method, params, context);

      if (this.config.logCalls) {
        const duration = Date.now() - startTime;
        gameLog.debug('backend', `Tool result: ${toolType}.${method}`, {
          success: result.success,
          duration,
          agentId: context.agentId,
        });
      }

      return result;
    } catch (error) {
      gameLog.error('backend', `Tool error: ${toolType}.${method}`, {
        error: error instanceof Error ? error.message : String(error),
        agentId: context.agentId,
      });

      return {
        success: false,
        error: {
          code: 'TOOL_EXECUTION_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          details: { toolType, method },
        },
      };
    } finally {
      this.activeCalls--;
    }
  }

  getToolCount(): number {
    return this.tools.size;
  }

  getActiveCallCount(): number {
    return this.activeCalls;
  }

  validateDependencies(): { valid: boolean; missing: string[] } {
    const missing: string[] = [];
    return { valid: missing.length === 0, missing };
  }
}

let globalRegistry: ToolRegistry | null = null;

export function getToolRegistry(config?: Partial<ToolRegistryConfig>): ToolRegistry {
  if (!globalRegistry) {
    globalRegistry = new ToolRegistry(config);
  }
  return globalRegistry;
}

export function resetToolRegistry(): void {
  if (globalRegistry) {
    globalRegistry.disposeAll();
    globalRegistry = null;
  }
}
