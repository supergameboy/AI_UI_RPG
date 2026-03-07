import type {
  AgentType,
  AgentMessage,
  AgentResponse,
  Message,
  UIInstruction,
  AgentBinding,
  ToolType,
} from '@ai-rpg/shared';
import { AgentType as AgentTypeEnum } from '@ai-rpg/shared';
import { AgentBase } from './AgentBase';

/**
 * 意图分析结果
 */
interface IntentAnalysisResult {
  primaryIntent: string;
  secondaryIntents: string[];
  requiredAgents: AgentType[];
  priority: 'low' | 'normal' | 'high' | 'critical';
  context: Record<string, unknown>;
}

/**
 * 智能体调用结果
 */
interface AgentCallResult {
  agentType: AgentType;
  response: AgentResponse;
  processingTime: number;
}

/**
 * 冲突检测结果
 */
interface ConflictDetectionResult {
  hasConflict: boolean;
  conflicts: ConflictInfo[];
  resolution: ConflictResolution | null;
}

/**
 * 冲突信息
 */
interface ConflictInfo {
  agents: AgentType[];
  type: 'data_inconsistency' | 'resource_contention' | 'logic_contradiction' | 'priority_clash';
  description: string;
  severity: 'low' | 'medium' | 'high';
}

/**
 * 冲突解决方案
 */
interface ConflictResolution {
  strategy: 'priority' | 'merge' | 'sequential' | 'user_choice';
  winner?: AgentType;
  mergedData?: Record<string, unknown>;
  sequence?: AgentType[];
}

/**
 * 统筹智能体
 * 负责接收玩家输入、分析意图、分配任务、整合结果
 */
export class CoordinatorAgent extends AgentBase {
  readonly type: AgentTypeEnum = AgentTypeEnum.COORDINATOR;

  // 依赖的 Tool 类型（统筹智能体不直接依赖 Tool）
  readonly tools: ToolType[] = [];

  // 可以调用所有其他智能体
  readonly bindings: AgentBinding[] = [
    { agentType: AgentTypeEnum.STORY_CONTEXT, enabled: true },
    { agentType: AgentTypeEnum.QUEST, enabled: true },
    { agentType: AgentTypeEnum.MAP, enabled: true },
    { agentType: AgentTypeEnum.NPC_PARTY, enabled: true },
    { agentType: AgentTypeEnum.NUMERICAL, enabled: true },
    { agentType: AgentTypeEnum.INVENTORY, enabled: true },
    { agentType: AgentTypeEnum.SKILL, enabled: true },
    { agentType: AgentTypeEnum.UI, enabled: true },
    { agentType: AgentTypeEnum.COMBAT, enabled: true },
    { agentType: AgentTypeEnum.DIALOGUE, enabled: true },
    { agentType: AgentTypeEnum.EVENT, enabled: true },
  ];

  readonly systemPrompt: string = `你是AI-RPG游戏的核心统筹智能体，负责协调所有其他智能体的工作。

你的职责：
1. 分析玩家输入的真实意图
2. 决定需要调用哪些智能体来处理请求
3. 检测和解决智能体之间的冲突
4. 整合所有智能体的结果，生成最终响应

你需要了解的智能体类型：
- STORY_CONTEXT: 故事上下文管理，维护故事主线和剧情
- QUEST: 任务管理，生成和追踪任务进度
- MAP: 地图管理，处理位置和移动
- NPC_PARTY: NPC和队伍管理
- NUMERICAL: 数值计算，属性和战斗数值
- INVENTORY: 背包系统，物品和装备管理
- SKILL: 技能管理
- UI: UI指令生成
- COMBAT: 战斗流程管理
- DIALOGUE: 对话生成
- EVENT: 事件管理

在分析玩家意图时，你需要：
1. 识别主要意图（如：移动、战斗、对话、使用物品、查看状态等）
2. 识别次要意图和上下文需求
3. 确定需要调用的智能体及其调用顺序
4. 设置优先级

在整合结果时，你需要：
1. 检查各智能体返回的数据是否一致
2. 解决任何冲突
3. 生成连贯的叙事响应
4. 确保UI指令正确传递`;

  /**
   * 处理消息的主入口
   */
  async processMessage(message: AgentMessage): Promise<AgentResponse> {
    const startTime = Date.now();
    console.log(`[CoordinatorAgent] Processing message: ${message.payload.action}`);

    try {
      // 1. 分析玩家意图
      const intentAnalysis = await this.analyzeIntent(message);
      this.addMemory(
        `Intent analysis: ${JSON.stringify(intentAnalysis)}`,
        'assistant',
        7,
        { messageId: message.id }
      );

      // 2. 根据意图调用相应智能体
      const agentResults = await this.callAgents(intentAnalysis, message);
      
      // 3. 检测冲突
      const conflictResult = this.detectConflicts(agentResults);
      
      // 4. 解决冲突（如果有）
      let resolvedResults = agentResults;
      if (conflictResult.hasConflict && conflictResult.resolution) {
        resolvedResults = this.resolveConflicts(agentResults, conflictResult);
        console.log(`[CoordinatorAgent] Resolved conflicts: ${conflictResult.conflicts.length}`);
      }

      // 5. 整合结果
      const integratedResponse = await this.integrateResults(
        resolvedResults,
        intentAnalysis,
        message
      );

      // 6. 添加处理记录到记忆
      const processingTime = Date.now() - startTime;
      this.addMemory(
        `Processed message in ${processingTime}ms. Called ${agentResults.length} agents.`,
        'assistant',
        6,
        { processingTime, agentCount: agentResults.length }
      );

      return integratedResponse;
    } catch (error) {
      console.error('[CoordinatorAgent] Error processing message:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error in CoordinatorAgent',
      };
    }
  }

  /**
   * 分析玩家意图
   */
  protected async analyzeIntent(message: AgentMessage): Promise<IntentAnalysisResult> {
    const playerInput = message.payload.data.input as string || 
                        message.payload.data.message as string ||
                        JSON.stringify(message.payload.data);

    // 使用LLM分析意图
    const analysisPrompt: Message[] = [
      {
        role: 'user',
        content: `分析以下玩家输入的意图，返回JSON格式的分析结果。

玩家输入：${playerInput}

请返回以下格式的JSON：
{
  "primaryIntent": "主要意图描述",
  "secondaryIntents": ["次要意图1", "次要意图2"],
  "requiredAgents": ["需要调用的智能体类型列表"],
  "priority": "优先级(low/normal/high/critical)",
  "context": {"额外的上下文信息": "值"}
}

可用的智能体类型：STORY_CONTEXT, QUEST, MAP, NPC_PARTY, NUMERICAL, INVENTORY, SKILL, UI, COMBAT, DIALOGUE, EVENT

只返回JSON，不要其他解释。`,
      },
    ];

    try {
      const response = await this.callLLM(analysisPrompt, {
        temperature: 0.3, // 低温度以获得更确定的分析
        maxTokens: 500,
      });

      // 解析LLM返回的JSON
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return this.getDefaultIntentAnalysis(message);
      }

      const parsed = JSON.parse(jsonMatch[0]) as Partial<IntentAnalysisResult>;
      
      // 验证并规范化结果
      return {
        primaryIntent: parsed.primaryIntent || 'unknown',
        secondaryIntents: Array.isArray(parsed.secondaryIntents) ? parsed.secondaryIntents : [],
        requiredAgents: this.validateAgentTypes(parsed.requiredAgents || []),
        priority: this.validatePriority(parsed.priority),
        context: typeof parsed.context === 'object' ? parsed.context : {},
      };
    } catch (error) {
      console.error('[CoordinatorAgent] Error analyzing intent:', error);
      return this.getDefaultIntentAnalysis(message);
    }
  }

  /**
   * 获取默认意图分析结果
   */
  private getDefaultIntentAnalysis(message: AgentMessage): IntentAnalysisResult {
    // 基于消息动作的简单规则匹配
    const action = message.payload.action;
    let requiredAgents: AgentType[] = [];
    let priority: 'low' | 'normal' | 'high' | 'critical' = 'normal';

    switch (action) {
      case 'move':
      case 'explore':
        requiredAgents = [AgentTypeEnum.MAP, AgentTypeEnum.EVENT];
        break;
      case 'attack':
      case 'combat':
        requiredAgents = [AgentTypeEnum.COMBAT, AgentTypeEnum.NUMERICAL, AgentTypeEnum.UI];
        priority = 'high';
        break;
      case 'talk':
      case 'dialogue':
        requiredAgents = [AgentTypeEnum.DIALOGUE, AgentTypeEnum.NPC_PARTY, AgentTypeEnum.STORY_CONTEXT];
        break;
      case 'use_item':
      case 'equip':
        requiredAgents = [AgentTypeEnum.INVENTORY, AgentTypeEnum.NUMERICAL];
        break;
      case 'check_quest':
      case 'accept_quest':
        requiredAgents = [AgentTypeEnum.QUEST, AgentTypeEnum.UI];
        break;
      case 'check_status':
        requiredAgents = [AgentTypeEnum.NUMERICAL, AgentTypeEnum.SKILL, AgentTypeEnum.UI];
        break;
      default:
        requiredAgents = [AgentTypeEnum.STORY_CONTEXT, AgentTypeEnum.UI];
    }

    return {
      primaryIntent: action,
      secondaryIntents: [],
      requiredAgents,
      priority,
      context: message.payload.context || {},
    };
  }

  /**
   * 调用所需的智能体
   */
  protected async callAgents(
    intentAnalysis: IntentAnalysisResult,
    originalMessage: AgentMessage
  ): Promise<AgentCallResult[]> {
    const results: AgentCallResult[] = [];
    const agents = intentAnalysis.requiredAgents;

    if (agents.length === 0) {
      return results;
    }

    // 并行调用所有智能体
    const callPromises = agents.map(async (agentType) => {
      const startTime = Date.now();
      
      try {
        // 发送消息到目标智能体
        const agentMessage = await this.sendMessage(
          agentType,
          originalMessage.payload.action,
          {
            ...originalMessage.payload.data,
            context: intentAnalysis.context,
            primaryIntent: intentAnalysis.primaryIntent,
          },
          {
            priority: intentAnalysis.priority,
            requiresResponse: true,
            timeout: this.config.timeout,
          }
        );

        // 等待响应
        const response = this.parseAgentResponse(agentMessage);
        const processingTime = Date.now() - startTime;

        return {
          agentType,
          response,
          processingTime,
        };
      } catch (error) {
        console.error(`[CoordinatorAgent] Error calling agent ${agentType}:`, error);
        return {
          agentType,
          response: {
            success: false,
            error: error instanceof Error ? error.message : `Failed to call ${agentType}`,
          },
          processingTime: Date.now() - startTime,
        };
      }
    });

    // 等待所有调用完成
    const settledResults = await Promise.allSettled(callPromises);
    
    for (const result of settledResults) {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        console.error('[CoordinatorAgent] Agent call rejected:', result.reason);
      }
    }

    return results;
  }

  /**
   * 解析智能体响应
   */
  private parseAgentResponse(message: AgentMessage): AgentResponse {
    const data = message.payload.data as Record<string, unknown>;
    
    return {
      success: data.success !== false,
      data: data.data || data,
      error: data.error as string | undefined,
      uiInstructions: data.uiInstructions as UIInstruction[] | undefined,
      requiresFollowUp: data.requiresFollowUp as boolean | undefined,
    };
  }

  /**
   * 检测冲突
   */
  protected detectConflicts(results: AgentCallResult[]): ConflictDetectionResult {
    const conflicts: ConflictInfo[] = [];
    const successfulResults = results.filter(r => r.response.success);

    // 检查数据不一致
    for (let i = 0; i < successfulResults.length; i++) {
      for (let j = i + 1; j < successfulResults.length; j++) {
        const conflict = this.checkPairwiseConflict(
          successfulResults[i],
          successfulResults[j]
        );
        if (conflict) {
          conflicts.push(conflict);
        }
      }
    }

    // 检查资源争用
    const resourceConflicts = this.checkResourceContention(successfulResults);
    conflicts.push(...resourceConflicts);

    // 生成解决方案
    let resolution: ConflictResolution | null = null;
    if (conflicts.length > 0) {
      resolution = this.generateConflictResolution(conflicts, successfulResults);
    }

    return {
      hasConflict: conflicts.length > 0,
      conflicts,
      resolution,
    };
  }

  /**
   * 检查两个智能体结果之间的冲突
   */
  private checkPairwiseConflict(
    result1: AgentCallResult,
    result2: AgentCallResult
  ): ConflictInfo | null {
    const data1 = result1.response.data as Record<string, unknown> | undefined;
    const data2 = result2.response.data as Record<string, unknown> | undefined;

    if (!data1 || !data2) {
      return null;
    }

    // 检查位置冲突
    if (data1.location && data2.location) {
      if (JSON.stringify(data1.location) !== JSON.stringify(data2.location)) {
        return {
          agents: [result1.agentType, result2.agentType],
          type: 'data_inconsistency',
          description: '位置数据不一致',
          severity: 'medium',
        };
      }
    }

    // 检查状态冲突
    if (data1.characterState && data2.characterState) {
      const state1 = data1.characterState as Record<string, unknown>;
      const state2 = data2.characterState as Record<string, unknown>;
      
      if (state1.hp !== state2.hp || state1.mp !== state2.mp) {
        return {
          agents: [result1.agentType, result2.agentType],
          type: 'logic_contradiction',
          description: '角色状态数据冲突',
          severity: 'high',
        };
      }
    }

    return null;
  }

  /**
   * 检查资源争用
   */
  private checkResourceContention(results: AgentCallResult[]): ConflictInfo[] {
    const conflicts: ConflictInfo[] = [];
    const resourceMap = new Map<string, AgentType[]>();

    for (const result of results) {
      const data = result.response.data as Record<string, unknown> | undefined;
      if (!data) continue;

      // 检查物品使用
      if (data.usedItem) {
        const item = data.usedItem as string;
        const agents = resourceMap.get(item) || [];
        agents.push(result.agentType);
        resourceMap.set(item, agents);
      }

      // 检查目标对象
      if (data.target) {
        const target = data.target as string;
        const agents = resourceMap.get(`target:${target}`) || [];
        agents.push(result.agentType);
        resourceMap.set(`target:${target}`, agents);
      }
    }

    // 找出争用
    for (const [resource, agents] of resourceMap) {
      if (agents.length > 1) {
        conflicts.push({
          agents,
          type: 'resource_contention',
          description: `多个智能体争用资源: ${resource}`,
          severity: 'medium',
        });
      }
    }

    return conflicts;
  }

  /**
   * 生成冲突解决方案
   */
  private generateConflictResolution(
    conflicts: ConflictInfo[],
    results: AgentCallResult[]
  ): ConflictResolution {
    // 按严重程度排序
    const highSeverityConflicts = conflicts.filter(c => c.severity === 'high');
    
    if (highSeverityConflicts.length > 0) {
      // 高严重度冲突：使用优先级策略
      const priorityOrder: AgentType[] = [
        AgentTypeEnum.COMBAT,
        AgentTypeEnum.NUMERICAL,
        AgentTypeEnum.STORY_CONTEXT,
        AgentTypeEnum.QUEST,
        AgentTypeEnum.MAP,
      ];

      for (const priority of priorityOrder) {
        const winner = results.find(r => r.agentType === priority);
        if (winner) {
          return {
            strategy: 'priority',
            winner: priority,
          };
        }
      }
    }

    // 默认：合并策略
    return {
      strategy: 'merge',
      mergedData: this.mergeResults(results),
    };
  }

  /**
   * 解决冲突
   */
  protected resolveConflicts(
    results: AgentCallResult[],
    conflictResult: ConflictDetectionResult
  ): AgentCallResult[] {
    if (!conflictResult.resolution) {
      return results;
    }

    const resolution = conflictResult.resolution;

    switch (resolution.strategy) {
      case 'priority':
        if (resolution.winner) {
          return results.map(r => {
            if (r.agentType === resolution.winner) {
              return r;
            }
            // 非获胜者的数据被标记为已覆盖
            return {
              ...r,
              response: {
                ...r.response,
                data: { ...r.response.data as Record<string, unknown>, _overridden: true },
              },
            };
          });
        }
        break;

      case 'merge':
        if (resolution.mergedData) {
          // 将合并后的数据应用到第一个成功的响应
          const mergedResults = [...results];
          const firstSuccess = mergedResults.findIndex(r => r.response.success);
          if (firstSuccess >= 0) {
            mergedResults[firstSuccess] = {
              ...mergedResults[firstSuccess],
              response: {
                ...mergedResults[firstSuccess].response,
                data: resolution.mergedData,
              },
            };
          }
          return mergedResults;
        }
        break;

      case 'sequential':
        if (resolution.sequence) {
          // 按顺序重新排列结果
          return results.sort((a, b) => {
            const indexA = resolution.sequence!.indexOf(a.agentType);
            const indexB = resolution.sequence!.indexOf(b.agentType);
            return indexA - indexB;
          });
        }
        break;
    }

    return results;
  }

  /**
   * 合并多个结果
   */
  private mergeResults(results: AgentCallResult[]): Record<string, unknown> {
    const merged: Record<string, unknown> = {};

    for (const result of results) {
      if (!result.response.success) continue;
      
      const data = result.response.data as Record<string, unknown> | undefined;
      if (!data) continue;

      for (const [key, value] of Object.entries(data)) {
        // 如果键已存在，创建数组或合并
        if (key in merged) {
          if (Array.isArray(merged[key]) && Array.isArray(value)) {
            (merged[key] as unknown[]).push(...value);
          } else if (typeof merged[key] === 'object' && typeof value === 'object') {
            merged[key] = { ...merged[key] as object, ...value as object };
          } else {
            // 保留最新的值，但记录冲突
            merged[`${key}_${result.agentType}`] = value;
          }
        } else {
          merged[key] = value;
        }
      }
    }

    return merged;
  }

  /**
   * 整合所有智能体的结果
   */
  protected async integrateResults(
    results: AgentCallResult[],
    intentAnalysis: IntentAnalysisResult,
    originalMessage: AgentMessage
  ): Promise<AgentResponse> {
    // 收集所有成功的结果
    const successfulResults = results.filter(r => r.response.success);
    const failedResults = results.filter(r => !r.response.success);

    // 如果所有调用都失败
    if (successfulResults.length === 0 && failedResults.length > 0) {
      return {
        success: false,
        error: 'All agent calls failed',
        data: {
          errors: failedResults.map(r => ({
            agent: r.agentType,
            error: r.response.error,
          })),
        },
      };
    }

    // 收集UI指令
    const allUIInstructions: UIInstruction[] = [];
    for (const result of successfulResults) {
      if (result.response.uiInstructions) {
        allUIInstructions.push(...result.response.uiInstructions);
      }
    }

    // 使用LLM生成整合的叙事响应
    const integrationPrompt: Message[] = [
      {
        role: 'user',
        content: `整合以下智能体的响应，生成连贯的游戏响应。

玩家原始输入：${JSON.stringify(originalMessage.payload.data)}
玩家意图：${intentAnalysis.primaryIntent}

智能体响应：
${successfulResults.map(r => 
  `[${r.agentType}]: ${JSON.stringify(r.response.data, null, 2)}`
).join('\n\n')}

${failedResults.length > 0 ? 
  `失败的调用：${failedResults.map(r => r.agentType).join(', ')}` : ''}

请生成：
1. 一个连贯的叙事描述（告诉玩家发生了什么）
2. 确保所有重要信息都被传达
3. 保持游戏体验的流畅性

返回JSON格式：
{
  "narrative": "叙事描述文本",
  "summary": "简要总结",
  "highlights": ["关键事件1", "关键事件2"]
}`,
      },
    ];

    try {
      const llmResponse = await this.callLLM(integrationPrompt, {
        temperature: 0.7,
        maxTokens: 1000,
      });

      const jsonMatch = llmResponse.content.match(/\{[\s\S]*\}/);
      let narrativeData = {
        narrative: '处理完成。',
        summary: '',
        highlights: [] as string[],
      };

      if (jsonMatch) {
        narrativeData = JSON.parse(jsonMatch[0]) as typeof narrativeData;
      }

      // 合并所有数据
      const mergedData = this.mergeResults(successfulResults);

      return {
        success: true,
        data: {
          ...mergedData,
          narrative: narrativeData.narrative,
          summary: narrativeData.summary,
          highlights: narrativeData.highlights,
          agentsCalled: successfulResults.map(r => r.agentType),
          processingTime: results.reduce((sum, r) => sum + r.processingTime, 0),
        },
        uiInstructions: allUIInstructions,
        requiresFollowUp: successfulResults.some(r => r.response.requiresFollowUp),
      };
    } catch (error) {
      console.error('[CoordinatorAgent] Error integrating results:', error);
      
      // 回退：简单合并
      const mergedData = this.mergeResults(successfulResults);
      
      return {
        success: true,
        data: {
          ...mergedData,
          narrative: '你的行动已完成。',
          agentsCalled: successfulResults.map(r => r.agentType),
        },
        uiInstructions: allUIInstructions,
      };
    }
  }

  /**
   * 验证智能体类型
   */
  private validateAgentTypes(types: unknown[]): AgentType[] {
    const validTypes = Object.values(AgentTypeEnum);
    return types.filter((t): t is AgentType => 
      typeof t === 'string' && validTypes.includes(t as AgentType)
    );
  }

  /**
   * 验证优先级
   */
  private validatePriority(priority: unknown): 'low' | 'normal' | 'high' | 'critical' {
    const validPriorities = ['low', 'normal', 'high', 'critical'] as const;
    if (typeof priority === 'string' && validPriorities.includes(priority as typeof validPriorities[number])) {
      return priority as typeof validPriorities[number];
    }
    return 'normal';
  }

  protected getAgentName(): string {
    return '统筹智能体';
  }

  protected getAgentDescription(): string {
    return '统筹管理智能体，负责接收玩家输入、分析意图、分配任务、整合结果';
  }

  protected getAgentCapabilities(): string[] {
    return ['intent_analysis', 'task_allocation', 'conflict_resolution', 'result_integration'];
  }
}

// 导出单例工厂
let coordinatorInstance: CoordinatorAgent | null = null;

export function getCoordinatorAgent(config?: Partial<import('@ai-rpg/shared').AgentConfig>): CoordinatorAgent {
  if (!coordinatorInstance) {
    coordinatorInstance = new CoordinatorAgent(config);
  }
  return coordinatorInstance;
}
