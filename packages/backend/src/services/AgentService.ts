import type { AgentType, AgentStatus, AgentLog, AgentConfig } from '@ai-rpg/shared';
import { AgentBase } from '../agents/AgentBase';
import { getMessageQueue } from './MessageQueue';
import { getAgentConfigService } from './AgentConfigService';
import { CoordinatorAgent } from '../agents/CoordinatorAgent';
import { StoryContextAgent } from '../agents/StoryContextAgent';
import { UIAgent } from '../agents/UIAgent';
import { QuestAgent } from '../agents/QuestAgent';
import { MapAgent } from '../agents/MapAgent';
import { NPCAgent } from '../agents/NPCAgent';
import { NumericalAgent } from '../agents/NumericalAgent';
import { InventoryAgent } from '../agents/InventoryAgent';
import { SkillAgent } from '../agents/SkillAgent';
import { CombatAgent } from '../agents/CombatAgent';
import { DialogueAgent } from '../agents/DialogueAgent';
import { EventAgent } from '../agents/EventAgent';

export class AgentService {
  private agents: Map<AgentType, AgentBase> = new Map();
  private initialized: boolean = false;
  private started: boolean = false;

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    console.log('[AgentService] Initializing...');

    const configService = getAgentConfigService();
    await configService.initialize();

    this.agents.set('coordinator' as AgentType, new CoordinatorAgent());
    this.agents.set('story_context' as AgentType, new StoryContextAgent());
    this.agents.set('ui' as AgentType, new UIAgent());
    this.agents.set('quest' as AgentType, new QuestAgent());
    this.agents.set('map' as AgentType, new MapAgent());
    this.agents.set('npc_party' as AgentType, new NPCAgent());
    this.agents.set('numerical' as AgentType, new NumericalAgent());
    this.agents.set('inventory' as AgentType, new InventoryAgent());
    this.agents.set('skill' as AgentType, new SkillAgent());
    this.agents.set('combat' as AgentType, new CombatAgent());
    this.agents.set('dialogue' as AgentType, new DialogueAgent());
    this.agents.set('event' as AgentType, new EventAgent());

    this.initialized = true;
    console.log(`[AgentService] Initialized with ${this.agents.size} agents`);
  }

  async start(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    if (this.started) {
      return;
    }

    console.log('[AgentService] Starting agents...');

    for (const agent of this.agents.values()) {
      try {
        await agent.start();
      } catch (error) {
        console.error(`[AgentService] Failed to start agent ${agent.type}:`, error);
      }
    }

    this.started = true;
    console.log('[AgentService] All agents started');
  }

  async stop(): Promise<void> {
    if (!this.started) {
      return;
    }

    console.log('[AgentService] Stopping agents...');

    for (const agent of this.agents.values()) {
      try {
        await agent.stop();
      } catch (error) {
        console.error(`[AgentService] Failed to stop agent ${agent.type}:`, error);
      }
    }

    this.started = false;
    console.log('[AgentService] All agents stopped');
  }

  getAgent<T extends AgentBase>(type: AgentType): T | undefined {
    return this.agents.get(type) as T | undefined;
  }

  getAllAgents(): AgentBase[] {
    return Array.from(this.agents.values());
  }

  getAgentStatus(type: AgentType): AgentStatus | undefined {
    const agent = this.agents.get(type);
    if (!agent) {
      return undefined;
    }

    const queue = getMessageQueue();
    const logs = queue.getLogs({ agentType: type });

    const processedLogs = logs.filter(l => l.status === 'success');
    const errorLogs = logs.filter(l => l.status === 'error');
    
    const avgTime = processedLogs.length > 0
      ? processedLogs.reduce((sum, l) => sum + (l.processingTime || 0), 0) / processedLogs.length
      : 0;

    return {
      type,
      status: agent.status,
      lastActivity: logs.length > 0 ? logs[0].timestamp : 0,
      messagesProcessed: processedLogs.length,
      errors: errorLogs.length,
      averageProcessingTime: avgTime,
    };
  }

  getAllAgentStatuses(): AgentStatus[] {
    return Array.from(this.agents.keys()).map(type => this.getAgentStatus(type) as AgentStatus);
  }

  getLogs(filter?: {
    agentType?: AgentType;
    direction?: 'in' | 'out';
    status?: 'pending' | 'success' | 'error' | 'timeout';
    limit?: number;
  }): AgentLog[] {
    const queue = getMessageQueue();
    return queue.getLogs(filter);
  }

  clearLogs(): void {
    const queue = getMessageQueue();
    queue.clearLogs();
  }

  async updateAgentConfig(type: AgentType, config: Partial<AgentConfig>): Promise<void> {
    const configService = getAgentConfigService();
    await configService.updateConfig(type, config);

    const agent = this.agents.get(type);
    if (agent) {
      agent.updateConfig(config);
    }
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  isStarted(): boolean {
    return this.started;
  }
}

let agentService: AgentService | null = null;

export function getAgentService(): AgentService {
  if (!agentService) {
    agentService = new AgentService();
  }
  return agentService;
}

export async function initializeAgentService(): Promise<AgentService> {
  const service = getAgentService();
  await service.initialize();
  return service;
}

export async function startAgentService(): Promise<AgentService> {
  const service = getAgentService();
  await service.start();
  return service;
}
