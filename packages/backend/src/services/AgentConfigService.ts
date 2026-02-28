import type { AgentConfig, PromptContext } from '@ai-rpg/shared';
import { AgentType, AGENT_DESCRIPTIONS, AGENT_CAPABILITIES, DEFAULT_AGENT_CONFIG } from '@ai-rpg/shared';
import { AgentConfigRepository } from '../models/AgentConfigRepository';
import type { AgentConfigEntity } from '../models/AgentConfigRepository';
import { getPromptService } from './PromptService';

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

    console.log('[AgentConfigService] Initializing...');

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
    console.log(`[AgentConfigService] Initialized with ${this.configCache.size} agent configs`);
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
    const entity = this.repository.fromAgentConfig(
      agentType,
      DEFAULT_AGENT_CONFIG,
      this.getDefaultSystemPrompt(agentType)
    );

    const created = this.repository.create(entity);
    const config = this.createConfigWithMetadata(created);
    this.configCache.set(agentType, config);

    console.log(`[AgentConfigService] Created default config for: ${agentType}`);
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

  private getDefaultSystemPrompt(agentType: AgentType): string {
    const promptService = getPromptService();
    const template = promptService.getTemplate(agentType);
    
    if (template) {
      return template.content;
    }

    const prompts: Partial<Record<AgentType, string>> = {
      [AgentType.COORDINATOR]: `你是游戏的主控制器和协调者。你的职责是：
1. 分析玩家输入，理解其真实意图
2. 决定需要调用哪些智能体来处理
3. 协调智能体之间的工作
4. 解决智能体输出之间的冲突
5. 整合最终结果

你通过JSON格式与其他智能体通信。所有输出必须遵循标准协议。`,

      [AgentType.STORY_CONTEXT]: `你是故事上下文管理智能体。你的职责是：
1. 维护故事的主线剧情
2. 记录玩家的重大选择
3. 管理故事的分支和收敛
4. 确保故事的一致性
5. 生成剧情摘要`,

      [AgentType.QUEST]: `你是任务管理智能体。你的职责是：
1. 生成主线/支线任务
2. 追踪任务进度
3. 处理任务完成和失败
4. 生成任务奖励
5. 管理任务链`,

      [AgentType.MAP]: `你是地图管理智能体。你的职责是：
1. 管理游戏世界地图
2. 生成新区域和地点
3. 处理玩家移动
4. 管理地点事件
5. 维护地点之间的连接关系`,

      [AgentType.NPC_PARTY]: `你是NPC和队伍管理智能体。你的职责是：
1. 管理所有NPC的信息
2. 控制NPC的行为和对话
3. 管理玩家队伍成员
4. 处理NPC关系和好感度
5. 生成NPC互动事件`,

      [AgentType.NUMERICAL]: `你是数值管理智能体。你的职责是：
1. 管理角色属性计算
2. 处理战斗数值
3. 管理经验值和等级
4. 计算伤害和治疗效果
5. 平衡游戏数值`,

      [AgentType.INVENTORY]: `你是背包系统管理智能体。你的职责是：
1. 管理玩家背包
2. 处理物品获取和消耗
3. 管理装备系统
4. 处理物品交易
5. 生成物品描述`,

      [AgentType.SKILL]: `你是技能管理智能体。你的职责是：
1. 管理角色技能
2. 处理技能学习和升级
3. 计算技能效果
4. 管理技能冷却
5. 生成技能描述`,

      [AgentType.UI]: `你是UI管理智能体。你的职责是：
1. 解析其他智能体的输出
2. 生成标准化UI指令
3. 管理动态UI组件
4. 处理UI交互事件
5. 格式化文本显示`,

      [AgentType.COMBAT]: `你是战斗管理智能体。你的职责是：
1. 管理战斗流程
2. 处理回合逻辑
3. 执行战斗AI决策
4. 计算战斗结果
5. 生成战斗描述`,

      [AgentType.DIALOGUE]: `你是对话管理智能体。你的职责是：
1. 生成NPC对话内容
2. 创建对话选项
3. 管理对话历史
4. 处理对话上下文
5. 维护对话一致性`,

      [AgentType.EVENT]: `你是事件管理智能体。你的职责是：
1. 生成随机事件
2. 检查触发条件
3. 管理事件链
4. 处理事件结果
5. 记录事件历史`,
    };

    return prompts[agentType] || '你是一个游戏智能体。';
  }

  getSystemPrompt(agentType: AgentType, context?: PromptContext): string {
    const config = this.configCache.get(agentType);
    
    if (config?.systemPrompt) {
      return config.systemPrompt;
    }

    const promptService = getPromptService();
    
    if (context) {
      return promptService.buildSystemPrompt(agentType, context);
    }

    const template = promptService.getTemplate(agentType);
    return template?.content || this.getDefaultSystemPrompt(agentType);
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
