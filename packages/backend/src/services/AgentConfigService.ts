import * as fs from 'fs';
import * as path from 'path';
import type { AgentConfig, PromptContext } from '@ai-rpg/shared';
import { AgentType, AGENT_DESCRIPTIONS, AGENT_CAPABILITIES, DEFAULT_AGENT_CONFIG } from '@ai-rpg/shared';
import { AgentConfigRepository } from '../models/AgentConfigRepository';
import type { AgentConfigEntity } from '../models/AgentConfigRepository';
import { getPromptService } from './PromptService';
import { gameLog } from './GameLogService';

export interface AgentConfigWithMetadata extends AgentConfig {
  type: AgentType;
  description: string;
  capabilities: string[];
  systemPrompt?: string;
  enabled: boolean;
}

export class AgentConfigService {
  private repository: AgentConfigRepository;
  private configCache: Map<AgentType, AgentConfigWithMetadata> = new Map();
  private initialized: boolean = false;

  constructor() {
    this.repository = new AgentConfigRepository();
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    gameLog.info('backend', '[AgentConfigService] Initializing...');

    const existingConfigs = this.repository.findAllEnabled();
    
    for (const entity of existingConfigs) {
      const config = this.createConfigWithMetadata(entity);
      this.configCache.set(entity.agent_type as AgentType, config);
    }

    const allAgentTypes = Object.values(AgentType) as AgentType[];
    for (const agentType of allAgentTypes) {
      if (!this.configCache.has(agentType)) {
        await this.createDefaultConfig(agentType);
      }
    }

    this.initialized = true;
    gameLog.info('backend', `[AgentConfigService] Initialized with ${this.configCache.size} agent configs`);
  }

  getConfig(agentType: AgentType): AgentConfigWithMetadata | undefined {
    return this.configCache.get(agentType);
  }

  getAllConfigs(): AgentConfigWithMetadata[] {
    return Array.from(this.configCache.values());
  }

  async updateConfig(
    agentType: AgentType,
    updates: Partial<AgentConfig> & { systemPrompt?: string; enabled?: boolean }
  ): Promise<AgentConfigWithMetadata | undefined> {
    const entityUpdates: Partial<AgentConfigEntity> = {};

    if (updates.provider !== undefined) {
      entityUpdates.provider = updates.provider;
    }
    if (updates.model !== undefined) {
      entityUpdates.model = updates.model;
    }
    if (updates.temperature !== undefined) {
      entityUpdates.temperature = updates.temperature;
    }
    if (updates.maxTokens !== undefined) {
      entityUpdates.max_tokens = updates.maxTokens;
    }
    if (updates.timeout !== undefined) {
      entityUpdates.timeout = updates.timeout;
    }
    if (updates.maxRetries !== undefined) {
      entityUpdates.max_retries = updates.maxRetries;
    }
    if (updates.systemPrompt !== undefined) {
      entityUpdates.system_prompt = updates.systemPrompt;
    }
    if (updates.enabled !== undefined) {
      entityUpdates.enabled = updates.enabled ? 1 : 0;
    }

    const entity = this.repository.updateByAgentType(agentType, entityUpdates);
    
    if (entity) {
      const config = this.createConfigWithMetadata(entity);
      this.configCache.set(agentType, config);
      return config;
    }

    return undefined;
  }

  async resetConfig(agentType: AgentType): Promise<AgentConfigWithMetadata | undefined> {
    return this.updateConfig(agentType, {
      ...DEFAULT_AGENT_CONFIG,
      systemPrompt: undefined,
      enabled: true,
    });
  }

  validateConfig(config: Partial<AgentConfig>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (config.provider !== undefined) {
      const validProviders = ['deepseek', 'glm', 'kimi', 'openai'];
      if (!validProviders.includes(config.provider)) {
        errors.push(`Invalid provider: ${config.provider}. Valid providers: ${validProviders.join(', ')}`);
      }
    }

    if (config.temperature !== undefined) {
      if (config.temperature < 0 || config.temperature > 2) {
        errors.push('Temperature must be between 0 and 2');
      }
    }

    if (config.maxTokens !== undefined) {
      if (config.maxTokens < 1 || config.maxTokens > 32000) {
        errors.push('maxTokens must be between 1 and 32000');
      }
    }

    if (config.timeout !== undefined) {
      if (config.timeout < 1000 || config.timeout > 300000) {
        errors.push('Timeout must be between 1000ms and 300000ms');
      }
    }

    if (config.maxRetries !== undefined) {
      if (config.maxRetries < 0 || config.maxRetries > 10) {
        errors.push('maxRetries must be between 0 and 10');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  private async createDefaultConfig(agentType: AgentType): Promise<void> {
    const systemPrompt = await this.loadPromptFromFile(agentType);
    
    const entity = this.repository.fromAgentConfig(
      agentType,
      DEFAULT_AGENT_CONFIG,
      systemPrompt
    );

    const created = this.repository.create(entity);
    const config = this.createConfigWithMetadata(created);
    this.configCache.set(agentType, config);

    gameLog.info('backend', `[AgentConfigService] Created default config for: ${agentType}`);
  }

  private createConfigWithMetadata(entity: AgentConfigEntity): AgentConfigWithMetadata {
    return {
      type: entity.agent_type as AgentType,
      provider: entity.provider,
      model: entity.model,
      temperature: entity.temperature,
      maxTokens: entity.max_tokens,
      timeout: entity.timeout,
      maxRetries: entity.max_retries,
      description: AGENT_DESCRIPTIONS[entity.agent_type as AgentType] || '',
      capabilities: AGENT_CAPABILITIES[entity.agent_type as AgentType] || [],
      systemPrompt: entity.system_prompt || undefined,
      enabled: entity.enabled === 1,
    };
  }

  /**
   * Agent 类型到 MD 文件名的映射
   */
  private static readonly AGENT_TYPE_FILE_MAP: Record<AgentType, string> = {
    [AgentType.COORDINATOR]: 'coordinator',
    [AgentType.DIALOGUE]: 'dialogue',
    [AgentType.COMBAT]: 'combat',
    [AgentType.UI]: 'ui',
    [AgentType.INVENTORY]: 'inventory',
    [AgentType.QUEST]: 'quest',
    [AgentType.MAP]: 'map',
    [AgentType.NPC_PARTY]: 'npc_party',
    [AgentType.NUMERICAL]: 'numerical',
    [AgentType.SKILL]: 'skill',
    [AgentType.EVENT]: 'event',
    [AgentType.STORY_CONTEXT]: 'story_context',
  };

  /**
   * 从 MD 文件加载提示词
   * @param agentType Agent 类型
   * @returns 提示词内容
   */
  private async loadPromptFromFile(agentType: AgentType): Promise<string> {
    const promptService = getPromptService();
    
    // 优先从 PromptService 获取（已包含从 MD 文件加载的逻辑）
    const template = promptService.getTemplate(agentType);
    
    if (template?.content) {
      gameLog.debug('backend', `[AgentConfigService] Loaded prompt from PromptService for: ${agentType}`);
      return template.content;
    }

    // 如果 PromptService 中没有，尝试直接读取 MD 文件
    const fileName = AgentConfigService.AGENT_TYPE_FILE_MAP[agentType];
    if (!fileName) {
      gameLog.warn('backend', `[AgentConfigService] No file mapping for agent type: ${agentType}`);
      return this.getFallbackPrompt(agentType);
    }

    const filePath = path.join(__dirname, '../prompts', `${fileName}.md`);
    
    try {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        gameLog.info('backend', `[AgentConfigService] Loaded prompt from file: ${fileName}.md`);
        return content;
      }
    } catch (error) {
      gameLog.error('backend', `[AgentConfigService] Failed to read prompt file: ${filePath}`, {
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // 使用回退提示词
    gameLog.warn('backend', `[AgentConfigService] Prompt file not found, using fallback for: ${agentType}`);
    return this.getFallbackPrompt(agentType);
  }

  /**
   * 获取回退提示词（简化版本，仅在 MD 文件不存在时使用）
   */
  private getFallbackPrompt(agentType: AgentType): string {
    const fallbacks: Partial<Record<AgentType, string>> = {
      [AgentType.COORDINATOR]: '你是游戏的主控制器和协调者，负责分析玩家输入并协调其他智能体工作。',
      [AgentType.DIALOGUE]: '你是对话管理智能体，负责生成NPC对话内容和管理对话历史。',
      [AgentType.COMBAT]: '你是战斗管理智能体，负责管理战斗流程和计算战斗结果。',
      [AgentType.UI]: '你是UI管理智能体，负责解析其他智能体输出并生成标准化UI指令。',
      [AgentType.INVENTORY]: '你是背包系统管理智能体，负责管理玩家背包和物品。',
      [AgentType.QUEST]: '你是任务管理智能体，负责生成和追踪任务进度。',
      [AgentType.MAP]: '你是地图管理智能体，负责管理游戏世界地图和地点。',
      [AgentType.NPC_PARTY]: '你是NPC和队伍管理智能体，负责管理所有NPC信息和行为。',
      [AgentType.NUMERICAL]: '你是数值管理智能体，负责管理角色属性和数值计算。',
      [AgentType.SKILL]: '你是技能管理智能体，负责管理角色技能和技能效果。',
      [AgentType.EVENT]: '你是事件管理智能体，负责生成随机事件和管理事件链。',
      [AgentType.STORY_CONTEXT]: '你是故事上下文管理智能体，负责维护故事主线剧情。',
    };

    return fallbacks[agentType] || `你是 ${agentType} 智能体。`;
  }

  /**
   * 获取系统提示词
   * 优先级：
   * 1. 数据库中存储的自定义提示词（config.systemPrompt）
   * 2. 如果有 context，使用 PromptService.buildSystemPrompt 构建完整提示词
   * 3. 从 PromptService 获取模板
   * 4. 使用回退提示词
   */
  getSystemPrompt(agentType: AgentType, context?: PromptContext): string {
    const config = this.configCache.get(agentType);
    
    // 1. 优先使用数据库中存储的自定义提示词
    if (config?.systemPrompt) {
      gameLog.debug('backend', `[AgentConfigService] Using stored system prompt for: ${agentType}`);
      return config.systemPrompt;
    }

    const promptService = getPromptService();
    
    // 2. 如果有上下文，构建完整提示词（包含变量注入）
    if (context) {
      gameLog.debug('backend', `[AgentConfigService] Building system prompt with context for: ${agentType}`);
      return promptService.buildSystemPrompt(agentType, context);
    }

    // 3. 从 PromptService 获取模板
    const template = promptService.getTemplate(agentType);
    if (template?.content) {
      gameLog.debug('backend', `[AgentConfigService] Using template from PromptService for: ${agentType}`);
      return template.content;
    }

    // 4. 使用回退提示词
    gameLog.warn('backend', `[AgentConfigService] No prompt found, using fallback for: ${agentType}`);
    return this.getFallbackPrompt(agentType);
  }
}

let agentConfigService: AgentConfigService | null = null;

export function getAgentConfigService(): AgentConfigService {
  if (!agentConfigService) {
    agentConfigService = new AgentConfigService();
  }
  return agentConfigService;
}

export async function initializeAgentConfigService(): Promise<AgentConfigService> {
  const service = getAgentConfigService();
  await service.initialize();
  return service;
}
