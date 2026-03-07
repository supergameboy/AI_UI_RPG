import type { AgentType } from '@ai-rpg/shared';
import type { AgentBase } from '../agents/AgentBase';
import type { ToolBase } from '../tools/ToolBase';
import { getToolRegistry } from '../tools/ToolRegistry';
import { gameLog } from './GameLogService';

/**
 * AgentRegistry 中的 Agent 状态信息
 * 扩展了 shared 包中的 AgentStatus，增加了 id 字段
 */
export interface AgentRegistryStatus {
  id: string;
  type: AgentType;
  status: 'idle' | 'processing' | 'waiting' | 'error';
  lastActivity: number;
  messageCount: number;
  errorCount: number;
}

export interface AgentRegistryConfig {
  autoInitialize: boolean;
  logActivity: boolean;
  maxAgents: number;
}

const DEFAULT_CONFIG: AgentRegistryConfig = {
  autoInitialize: true,
  logActivity: true,
  maxAgents: 50,
};

export class AgentRegistry {
  private agents: Map<string, AgentBase> = new Map();
  private agentsByType: Map<AgentType, AgentBase> = new Map();
  private agentStatuses: Map<string, AgentRegistryStatus> = new Map();
  private config: AgentRegistryConfig;
  private initializationPromise: Promise<void> | null = null;

  constructor(config?: Partial<AgentRegistryConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * 注册 Agent
   */
  registerAgent(agent: AgentBase): void {
    if (this.agents.has(agent.id)) {
      gameLog.warn('agent', `Agent '${agent.id}' already registered, replacing`);
      this.unregisterAgent(agent.id);
    }

    if (this.agents.size >= this.config.maxAgents) {
      gameLog.error('agent', `Maximum agents limit (${this.config.maxAgents}) reached`);
      throw new Error(`Maximum agents limit (${this.config.maxAgents}) reached`);
    }

    // 注入依赖
    this.injectDependencies(agent);

    // 注册到 ID 映射
    this.agents.set(agent.id, agent);

    // 注册到类型映射
    if (this.agentsByType.has(agent.type)) {
      gameLog.warn('agent', `Agent type '${agent.type}' already has an instance, replacing`);
    }
    this.agentsByType.set(agent.type, agent);

    // 初始化状态
    this.agentStatuses.set(agent.id, {
      id: agent.id,
      type: agent.type,
      status: 'idle',
      lastActivity: Date.now(),
      messageCount: 0,
      errorCount: 0,
    });

    gameLog.info('agent', `Agent '${agent.id}' registered`, {
      type: agent.type,
      name: agent.name,
    });
  }

  /**
   * 通过 ID 获取 Agent
   */
  getAgent(agentId: string): AgentBase | undefined {
    return this.agents.get(agentId);
  }

  /**
   * 通过类型获取 Agent
   */
  getAgentByType(type: AgentType): AgentBase | undefined {
    return this.agentsByType.get(type);
  }

  /**
   * 列出所有 Agent
   */
  listAgents(): AgentBase[] {
    return Array.from(this.agents.values());
  }

  /**
   * 注销 Agent
   */
  unregisterAgent(agentId: string): void {
    const agent = this.agents.get(agentId);
    if (!agent) {
      gameLog.warn('agent', `Agent '${agentId}' not found for unregistration`);
      return;
    }

    // 停止 Agent
    agent.stop().catch((error) => {
      gameLog.error('agent', `Error stopping agent '${agentId}'`, {
        error: error instanceof Error ? error.message : String(error),
      });
    });

    // 从映射中移除
    this.agents.delete(agentId);
    this.agentsByType.delete(agent.type);
    this.agentStatuses.delete(agentId);

    gameLog.info('agent', `Agent '${agentId}' unregistered`, {
      type: agent.type,
    });
  }

  /**
   * 获取 Agent 状态
   */
  getAgentStatus(agentId: string): AgentRegistryStatus | undefined {
    const status = this.agentStatuses.get(agentId);
    const agent = this.agents.get(agentId);

    if (!status || !agent) {
      return undefined;
    }

    // 同步当前状态
    return {
      ...status,
      status: agent.status,
    };
  }

  /**
   * 获取所有 Agent 状态
   */
  getAllAgentStatuses(): Record<string, AgentRegistryStatus> {
    const statuses: Record<string, AgentRegistryStatus> = {};

    for (const entry of Array.from(this.agentStatuses.entries())) {
      const [id, status] = entry;
      const agent = this.agents.get(id);
      if (agent) {
        statuses[id] = {
          ...status,
          status: agent.status,
        };
      }
    }

    return statuses;
  }

  /**
   * 获取 Tool
   */
  getTool(toolType: string): ToolBase | undefined {
    const toolRegistry = getToolRegistry();
    return toolRegistry.getTool(toolType as never);
  }

  /**
   * 列出所有 Tool
   */
  listTools(): ToolBase[] {
    const toolRegistry = getToolRegistry();
    const toolTypes = toolRegistry.listTools();
    return toolTypes
      .map((type) => toolRegistry.getTool(type))
      .filter((tool): tool is ToolBase => tool !== undefined);
  }

  /**
   * 为 Agent 注入依赖
   */
  injectDependencies(agent: AgentBase): void {
    // 目前 AgentBase 已经通过内部导入获取依赖
    // 这里可以扩展为注入额外的服务或配置
    gameLog.debug('agent', `Injecting dependencies for agent '${agent.id}'`, {
      type: agent.type,
    });
  }

  /**
   * 初始化所有 Agent
   */
  async initializeAll(): Promise<void> {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.doInitializeAll();
    return this.initializationPromise;
  }

  private async doInitializeAll(): Promise<void> {
    const initPromises = Array.from(this.agents.values()).map(async (agent) => {
      try {
        // 调用 Agent 内部初始化方法
        if (agent.initAgent) {
          await agent.initAgent();
        }
        gameLog.debug('agent', `Agent '${agent.id}' initialized`);
      } catch (error) {
        gameLog.error('agent', `Failed to initialize agent '${agent.id}'`, {
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    });

    await Promise.all(initPromises);
    gameLog.info('agent', 'All agents initialized', {
      count: this.agents.size,
    });
  }

  /**
   * 启动所有 Agent
   */
  async startAll(): Promise<void> {
    const startPromises = Array.from(this.agents.values()).map(async (agent) => {
      try {
        await agent.start();
        gameLog.debug('agent', `Agent '${agent.id}' started`);
      } catch (error) {
        gameLog.error('agent', `Failed to start agent '${agent.id}'`, {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    });

    await Promise.all(startPromises);
    gameLog.info('agent', 'All agents started', {
      count: this.agents.size,
    });
  }

  /**
   * 停止所有 Agent
   */
  async stopAll(): Promise<void> {
    const stopPromises = Array.from(this.agents.values()).map(async (agent) => {
      try {
        await agent.stop();
        gameLog.debug('agent', `Agent '${agent.id}' stopped`);
      } catch (error) {
        gameLog.error('agent', `Failed to stop agent '${agent.id}'`, {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    });

    await Promise.all(stopPromises);
    gameLog.info('agent', 'All agents stopped', {
      count: this.agents.size,
    });
  }

  /**
   * 更新 Agent 活动状态
   */
  updateAgentActivity(agentId: string, isError: boolean = false): void {
    const status = this.agentStatuses.get(agentId);
    if (!status) {
      return;
    }

    status.lastActivity = Date.now();
    status.messageCount++;

    if (isError) {
      status.errorCount++;
    }

    if (this.config.logActivity) {
      gameLog.debug('agent', `Agent '${agentId}' activity updated`, {
        messageCount: status.messageCount,
        errorCount: status.errorCount,
      });
    }
  }

  /**
   * 获取 Agent 数量
   */
  getAgentCount(): number {
    return this.agents.size;
  }

  /**
   * 检查 Agent 是否存在
   */
  hasAgent(agentId: string): boolean {
    return this.agents.has(agentId);
  }

  /**
   * 检查 Agent 类型是否存在
   */
  hasAgentType(type: AgentType): boolean {
    return this.agentsByType.has(type);
  }

  /**
   * 清空所有 Agent
   */
  async disposeAll(): Promise<void> {
    await this.stopAll();
    this.agents.clear();
    this.agentsByType.clear();
    this.agentStatuses.clear();
    this.initializationPromise = null;
    gameLog.info('agent', 'All agents disposed');
  }

  /**
   * 验证依赖关系
   */
  validateDependencies(): { valid: boolean; missing: string[] } {
    const missing: string[] = [];

    for (const agent of Array.from(this.agents.values())) {
      // 验证 Agent 绑定依赖
      for (const binding of agent.bindings) {
        if (binding.enabled !== false && !this.agentsByType.has(binding.agentType)) {
          missing.push(`Agent '${agent.id}' requires agent type '${binding.agentType}'`);
        }
      }
    }

    return { valid: missing.length === 0, missing };
  }
}

// 单例实例
let globalRegistry: AgentRegistry | null = null;

/**
 * 获取全局 AgentRegistry 实例
 */
export function getAgentRegistry(config?: Partial<AgentRegistryConfig>): AgentRegistry {
  if (!globalRegistry) {
    globalRegistry = new AgentRegistry(config);
  }
  return globalRegistry;
}

/**
 * 重置全局 AgentRegistry 实例
 */
export function resetAgentRegistry(): void {
  if (globalRegistry) {
    globalRegistry.disposeAll().catch((error) => {
      gameLog.error('agent', 'Error disposing agent registry', {
        error: error instanceof Error ? error.message : String(error),
      });
    });
    globalRegistry = null;
  }
}
