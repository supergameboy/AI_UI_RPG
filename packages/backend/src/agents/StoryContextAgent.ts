import type {
  AgentType,
  AgentMessage,
  AgentResponse,
} from '@ai-rpg/shared';
import { AgentType as AT } from '@ai-rpg/shared';
import { AgentBase } from './AgentBase';

// 剧情节点类型
export enum StoryNodeType {
  MAIN = 'main',           // 主线剧情
  SIDE = 'side',           // 支线剧情
  BRANCH = 'branch',       // 分支剧情
  EVENT = 'event',         // 事件节点
  DIALOGUE = 'dialogue',   // 对话节点
  CHOICE = 'choice',       // 选择节点
}

// 剧情节点状态
export enum StoryNodeStatus {
  LOCKED = 'locked',       // 锁定
  AVAILABLE = 'available', // 可触发
  ACTIVE = 'active',       // 进行中
  COMPLETED = 'completed', // 已完成
  SKIPPED = 'skipped',     // 已跳过
  FAILED = 'failed',       // 失败
}

// 剧情节点
export interface StoryNode {
  id: string;
  type: StoryNodeType;
  title: string;
  description: string;
  status: StoryNodeStatus;
  chapter: number;
  order: number;
  prerequisites: string[];
  consequences: string[];
  metadata: {
    location?: string;
    involvedNPCs?: string[];
    relatedQuests?: string[];
    tags?: string[];
    importance: number;
  };
  createdAt: number;
  updatedAt: number;
}

// 玩家选择
export interface PlayerChoice {
  id: string;
  nodeId: string;
  choiceText: string;
  selectedOption: number;
  availableOptions: ChoiceOption[];
  consequences: ChoiceConsequence[];
  context: {
    location?: string;
    npcsPresent?: string[];
    questContext?: string;
  };
  timestamp: number;
}

// 选择选项
export interface ChoiceOption {
  index: number;
  text: string;
  conditions?: string[];
  outcomes?: string[];
}

// 选择后果
export interface ChoiceConsequence {
  type: 'reputation' | 'quest' | 'item' | 'npc_relation' | 'story_branch' | 'stat';
  target: string;
  value: number | string;
  description: string;
}

// 剧情摘要
export interface StorySummary {
  id: string;
  chapter: number;
  title: string;
  summary: string;
  keyEvents: string[];
  keyChoices: string[];
  activeQuests: string[];
  importantNPCs: string[];
  currentLocation: string;
  generatedAt: number;
}

// 故事状态
export interface StoryState {
  currentChapter: number;
  currentNode: string | null;
  nodes: Map<string, StoryNode>;
  choices: PlayerChoice[];
  summaries: StorySummary[];
  flags: Record<string, boolean | number | string>;
  variables: Record<string, unknown>;
  lastUpdated: number;
}

// 一致性检查结果
export interface ConsistencyCheckResult {
  isConsistent: boolean;
  issues: ConsistencyIssue[];
  suggestions: string[];
}

// 一致性问题
export interface ConsistencyIssue {
  type: 'plot_hole' | 'contradiction' | 'missing_prerequisite' | 'timeline_error' | 'character_inconsistency';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedNodes: string[];
  suggestedFix?: string;
}

// 上下文压缩配置
interface CompressionConfig {
  maxShortTermMemory: number;
  maxMidTermMemory: number;
  maxChoices: number;
  compressionThreshold: number;
  summaryInterval: number;
}

/**
 * 故事上下文智能体
 * 负责维护故事主线、记录玩家选择、生成剧情摘要、检查故事一致性
 */
export class StoryContextAgent extends AgentBase {
  readonly type: AgentType = AT.STORY_CONTEXT;
  readonly canCallAgents: AgentType[] = [
    AT.COORDINATOR,
    AT.QUEST,
    AT.NPC_PARTY,
    AT.MAP,
  ];
  readonly dataAccess: string[] = [
    'story_nodes',
    'player_choices',
    'story_summaries',
    'quest_progress',
    'npc_relations',
    'player_location',
    'game_flags',
  ];

  readonly systemPrompt = `你是故事上下文管理智能体，负责维护游戏的故事主线和上下文一致性。

核心职责：
1. 剧情节点管理：创建、更新和追踪故事节点状态
2. 玩家选择记录：记录玩家的关键选择及其后果
3. 剧情摘要生成：定期生成故事摘要，压缩上下文
4. 故事一致性检查：确保故事发展逻辑一致，无矛盾

工作原则：
- 保持故事连贯性和逻辑性
- 准确记录玩家的关键选择
- 及时发现和报告一致性问题
- 生成简洁但信息完整的摘要

输出格式要求：
- 使用清晰的JSON格式输出
- 包含必要的元数据和时间戳
- 标注数据来源和依赖关系`;

  private storyState: StoryState;
  private compressionConfig: CompressionConfig;

  constructor() {
    super({
      temperature: 0.5,
      maxTokens: 4096,
    });

    this.storyState = {
      currentChapter: 1,
      currentNode: null,
      nodes: new Map(),
      choices: [],
      summaries: [],
      flags: {},
      variables: {},
      lastUpdated: Date.now(),
    };

    this.compressionConfig = {
      maxShortTermMemory: 30,
      maxMidTermMemory: 100,
      maxChoices: 200,
      compressionThreshold: 0.8,
      summaryInterval: 10,
    };
  }

  protected getAgentName(): string {
    return 'Story Context Agent';
  }

  protected getAgentDescription(): string {
    return '故事上下文智能体，负责维护故事主线、记录玩家选择、生成剧情摘要、检查故事一致性';
  }

  protected getAgentCapabilities(): string[] {
    return [
      'plot_management',
      'choice_recording',
      'summary_generation',
      'consistency_check',
      'context_compression',
      'branch_tracking',
    ];
  }

  /**
   * 处理消息
   */
  async processMessage(message: AgentMessage): Promise<AgentResponse> {
    const action = message.payload.action;
    const data = message.payload.data as Record<string, unknown>;

    try {
      switch (action) {
        case 'create_node':
          return this.handleCreateNode(data);
        case 'update_node':
          return this.handleUpdateNode(data);
        case 'get_node':
          return this.handleGetNode(data);
        case 'get_current_story':
          return this.handleGetCurrentStory();
        case 'record_choice':
          return this.handleRecordChoice(data);
        case 'get_choices':
          return this.handleGetChoices(data);
        case 'generate_summary':
          return this.handleGenerateSummary(data);
        case 'check_consistency':
          return this.handleCheckConsistency(data);
        case 'set_flag':
          return this.handleSetFlag(data);
        case 'get_flag':
          return this.handleGetFlag(data);
        case 'compress_context':
          return this.handleCompressContext();
        case 'get_story_state':
          return this.handleGetStoryState();
        case 'advance_chapter':
          return this.handleAdvanceChapter(data);
        default:
          return {
            success: false,
            error: `Unknown action: ${action}`,
          };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error in StoryContextAgent',
      };
    }
  }

  // ==================== 剧情节点管理 ====================

  /**
   * 创建剧情节点
   */
  private handleCreateNode(data: Record<string, unknown>): AgentResponse {
    const nodeData = data as {
      type: StoryNodeType;
      title: string;
      description: string;
      chapter?: number;
      order?: number;
      prerequisites?: string[];
      metadata?: Partial<StoryNode['metadata']>;
    };

    if (!nodeData.type || !nodeData.title) {
      return {
        success: false,
        error: 'Missing required fields: type, title',
      };
    }

    const node: StoryNode = {
      id: this.generateNodeId(),
      type: nodeData.type,
      title: nodeData.title,
      description: nodeData.description || '',
      status: this.determineInitialStatus(nodeData.prerequisites),
      chapter: nodeData.chapter ?? this.storyState.currentChapter,
      order: nodeData.order ?? this.storyState.nodes.size,
      prerequisites: nodeData.prerequisites || [],
      consequences: [],
      metadata: {
        importance: nodeData.metadata?.importance ?? 5,
        location: nodeData.metadata?.location,
        involvedNPCs: nodeData.metadata?.involvedNPCs,
        relatedQuests: nodeData.metadata?.relatedQuests,
        tags: nodeData.metadata?.tags,
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.storyState.nodes.set(node.id, node);
    this.storyState.lastUpdated = Date.now();

    this.addMemory(
      `Created story node: ${node.title} (Chapter ${node.chapter})`,
      'assistant',
      node.metadata.importance,
      { nodeId: node.id, type: node.type }
    );

    return {
      success: true,
      data: { node },
    };
  }

  /**
   * 更新剧情节点
   */
  private handleUpdateNode(data: Record<string, unknown>): AgentResponse {
    const updateData = data as {
      nodeId: string;
      updates: Partial<StoryNode>;
    };

    const node = this.storyState.nodes.get(updateData.nodeId);
    if (!node) {
      return {
        success: false,
        error: `Node not found: ${updateData.nodeId}`,
      };
    }

    const updatedNode: StoryNode = {
      ...node,
      ...updateData.updates,
      updatedAt: Date.now(),
    };

    this.storyState.nodes.set(updateData.nodeId, updatedNode);
    this.storyState.lastUpdated = Date.now();

    this.addMemory(
      `Updated story node: ${node.title} -> ${updatedNode.status}`,
      'assistant',
      6,
      { nodeId: updateData.nodeId, changes: updateData.updates }
    );

    return {
      success: true,
      data: { node: updatedNode },
    };
  }

  /**
   * 获取剧情节点
   */
  private handleGetNode(data: Record<string, unknown>): AgentResponse {
    const nodeData = data as { nodeId: string };
    const node = this.storyState.nodes.get(nodeData.nodeId);

    if (!node) {
      return {
        success: false,
        error: `Node not found: ${nodeData.nodeId}`,
      };
    }

    return {
      success: true,
      data: { node },
    };
  }

  /**
   * 获取当前故事状态
   */
  private handleGetCurrentStory(): AgentResponse {
    const currentNode = this.storyState.currentNode
      ? this.storyState.nodes.get(this.storyState.currentNode)
      : null;

    const activeNodes = Array.from(this.storyState.nodes.values())
      .filter(n => n.status === StoryNodeStatus.ACTIVE);

    const availableNodes = Array.from(this.storyState.nodes.values())
      .filter(n => n.status === StoryNodeStatus.AVAILABLE);

    const recentChoices = this.storyState.choices.slice(-5);

    return {
      success: true,
      data: {
        currentChapter: this.storyState.currentChapter,
        currentNode,
        activeNodes,
        availableNodes,
        recentChoices,
        flags: this.storyState.flags,
      },
    };
  }

  /**
   * 推进章节
   */
  private handleAdvanceChapter(data: Record<string, unknown>): AgentResponse {
    const chapterData = data as { chapter?: number };
    const newChapter = chapterData.chapter ?? this.storyState.currentChapter + 1;

    if (newChapter <= this.storyState.currentChapter) {
      return {
        success: false,
        error: 'New chapter must be greater than current chapter',
      };
    }

    const oldChapter = this.storyState.currentChapter;
    this.storyState.currentChapter = newChapter;
    this.storyState.lastUpdated = Date.now();

    // 生成上一章摘要
    const summary = this.generateChapterSummary(oldChapter);

    this.addMemory(
      `Advanced to Chapter ${newChapter}. Generated summary for Chapter ${oldChapter}.`,
      'assistant',
      10,
      { oldChapter, newChapter, summaryId: summary.id }
    );

    return {
      success: true,
      data: {
        previousChapter: oldChapter,
        currentChapter: newChapter,
        summary,
      },
    };
  }

  // ==================== 玩家选择记录 ====================

  /**
   * 记录玩家选择
   */
  private handleRecordChoice(data: Record<string, unknown>): AgentResponse {
    const choiceData = data as {
      nodeId: string;
      choiceText: string;
      selectedOption: number;
      availableOptions: ChoiceOption[];
      consequences?: ChoiceConsequence[];
      context?: PlayerChoice['context'];
    };

    if (!choiceData.nodeId || choiceData.selectedOption === undefined) {
      return {
        success: false,
        error: 'Missing required fields: nodeId, selectedOption',
      };
    }

    const choice: PlayerChoice = {
      id: this.generateChoiceId(),
      nodeId: choiceData.nodeId,
      choiceText: choiceData.choiceText,
      selectedOption: choiceData.selectedOption,
      availableOptions: choiceData.availableOptions,
      consequences: choiceData.consequences || [],
      context: choiceData.context || {},
      timestamp: Date.now(),
    };

    this.storyState.choices.push(choice);
    this.storyState.lastUpdated = Date.now();

    // 应用选择后果
    this.applyChoiceConsequences(choice);

    // 检查是否需要压缩
    if (this.storyState.choices.length > this.compressionConfig.maxChoices) {
      this.compressChoices();
    }

    this.addMemory(
      `Player chose: ${choice.choiceText} (Option ${choice.selectedOption + 1})`,
      'assistant',
      8,
      { choiceId: choice.id, nodeId: choice.nodeId }
    );

    return {
      success: true,
      data: { choice },
    };
  }

  /**
   * 获取玩家选择历史
   */
  private handleGetChoices(data: Record<string, unknown>): AgentResponse {
    const filterData = data as {
      nodeId?: string;
      limit?: number;
      chapter?: number;
    };

    let choices = this.storyState.choices;

    if (filterData.nodeId) {
      choices = choices.filter(c => c.nodeId === filterData.nodeId);
    }

    if (filterData.chapter) {
      const chapterNodes = Array.from(this.storyState.nodes.values())
        .filter(n => n.chapter === filterData.chapter)
        .map(n => n.id);
      choices = choices.filter(c => chapterNodes.includes(c.nodeId));
    }

    if (filterData.limit) {
      choices = choices.slice(-filterData.limit);
    }

    return {
      success: true,
      data: { choices },
    };
  }

  /**
   * 应用选择后果
   */
  private applyChoiceConsequences(choice: PlayerChoice): void {
    for (const consequence of choice.consequences) {
      switch (consequence.type) {
        case 'story_branch':
          this.storyState.flags[`branch_${consequence.target}`] = true;
          break;
        case 'reputation':
        case 'npc_relation':
          const currentValue = this.storyState.variables[consequence.target] as number || 0;
          this.storyState.variables[consequence.target] = currentValue + (consequence.value as number);
          break;
        case 'stat':
          this.storyState.variables[consequence.target] = consequence.value;
          break;
        default:
          break;
      }
    }
  }

  // ==================== 剧情摘要生成 ====================

  /**
   * 生成摘要
   */
  private async handleGenerateSummary(data: Record<string, unknown>): Promise<AgentResponse> {
    const summaryData = data as { chapter?: number };

    const chapter = summaryData.chapter ?? this.storyState.currentChapter;
    const summary = this.generateChapterSummary(chapter);

    this.storyState.summaries.push(summary);
    this.storyState.lastUpdated = Date.now();

    return {
      success: true,
      data: { summary },
    };
  }

  /**
   * 生成章节摘要
   */
  private generateChapterSummary(chapter: number): StorySummary {
    const chapterNodes = Array.from(this.storyState.nodes.values())
      .filter(n => n.chapter === chapter);

    const chapterChoices = this.storyState.choices.filter(c => {
      const node = this.storyState.nodes.get(c.nodeId);
      return node && node.chapter === chapter;
    });

    const keyEvents = chapterNodes
      .filter(n => n.status === StoryNodeStatus.COMPLETED && n.metadata.importance >= 7)
      .map(n => n.title);

    const keyChoices = chapterChoices
      .filter(c => c.consequences.length > 0)
      .map(c => c.choiceText);

    const activeQuests = chapterNodes
      .filter(n => n.metadata.relatedQuests)
      .flatMap(n => n.metadata.relatedQuests as string[])
      .filter((v, i, a) => a.indexOf(v) === i);

    const importantNPCs = chapterNodes
      .filter(n => n.metadata.involvedNPCs)
      .flatMap(n => n.metadata.involvedNPCs as string[])
      .filter((v, i, a) => a.indexOf(v) === i);

    const summary: StorySummary = {
      id: this.generateSummaryId(),
      chapter,
      title: `Chapter ${chapter} Summary`,
      summary: this.buildSummaryText(chapterNodes, chapterChoices),
      keyEvents,
      keyChoices,
      activeQuests,
      importantNPCs,
      currentLocation: this.getCurrentLocation(chapterNodes),
      generatedAt: Date.now(),
    };

    return summary;
  }

  /**
   * 构建摘要文本
   */
  private buildSummaryText(nodes: StoryNode[], choices: PlayerChoice[]): string {
    const completedNodes = nodes.filter(n => n.status === StoryNodeStatus.COMPLETED);
    const activeNodes = nodes.filter(n => n.status === StoryNodeStatus.ACTIVE);

    const parts: string[] = [];

    if (completedNodes.length > 0) {
      parts.push(`Completed events: ${completedNodes.map(n => n.title).join(', ')}.`);
    }

    if (activeNodes.length > 0) {
      parts.push(`Current focus: ${activeNodes.map(n => n.title).join(', ')}.`);
    }

    if (choices.length > 0) {
      const significantChoices = choices.filter(c => c.consequences.length > 0);
      if (significantChoices.length > 0) {
        parts.push(`Key decisions made: ${significantChoices.length}.`);
      }
    }

    return parts.join(' ') || 'No significant events recorded.';
  }

  /**
   * 获取当前位置
   */
  private getCurrentLocation(nodes: StoryNode[]): string {
    const activeNode = nodes.find(n => n.status === StoryNodeStatus.ACTIVE);
    return activeNode?.metadata.location || 'Unknown';
  }

  // ==================== 故事一致性检查 ====================

  /**
   * 检查一致性
   */
  private async handleCheckConsistency(data: Record<string, unknown>): Promise<AgentResponse> {
    const checkData = data as {
      scope?: 'all' | 'chapter' | 'node';
      chapter?: number;
      nodeId?: string;
    };

    const result = await this.performConsistencyCheck(checkData);

    return {
      success: true,
      data: result,
    };
  }

  /**
   * 执行一致性检查
   */
  private async performConsistencyCheck(
    options: { scope?: string; chapter?: number; nodeId?: string }
  ): Promise<ConsistencyCheckResult> {
    const issues: ConsistencyIssue[] = [];
    const suggestions: string[] = [];

    let nodesToCheck: StoryNode[] = [];

    switch (options.scope) {
      case 'chapter':
        nodesToCheck = Array.from(this.storyState.nodes.values())
          .filter(n => n.chapter === options.chapter);
        break;
      case 'node':
        const node = this.storyState.nodes.get(options.nodeId || '');
        nodesToCheck = node ? [node] : [];
        break;
      default:
        nodesToCheck = Array.from(this.storyState.nodes.values());
    }

    // 检查前置条件
    for (const node of nodesToCheck) {
      const prerequisiteIssues = this.checkPrerequisites(node);
      issues.push(...prerequisiteIssues);
    }

    // 检查时间线
    const timelineIssues = this.checkTimeline(nodesToCheck);
    issues.push(...timelineIssues);

    // 检查选择一致性
    const choiceIssues = this.checkChoiceConsistency();
    issues.push(...choiceIssues);

    // 生成建议
    if (issues.length > 0) {
      suggestions.push('Review flagged issues and consider adjusting story flow.');
      suggestions.push('Ensure all prerequisites are properly set before node activation.');
    }

    return {
      isConsistent: issues.length === 0,
      issues,
      suggestions,
    };
  }

  /**
   * 检查前置条件
   */
  private checkPrerequisites(node: StoryNode): ConsistencyIssue[] {
    const issues: ConsistencyIssue[] = [];

    for (const prereqId of node.prerequisites) {
      const prereqNode = this.storyState.nodes.get(prereqId);
      if (!prereqNode) {
        issues.push({
          type: 'missing_prerequisite',
          severity: 'high',
          description: `Node "${node.title}" has missing prerequisite: ${prereqId}`,
          affectedNodes: [node.id],
          suggestedFix: `Create node ${prereqId} or remove it from prerequisites`,
        });
      } else if (prereqNode.status !== StoryNodeStatus.COMPLETED &&
                 node.status === StoryNodeStatus.ACTIVE) {
        issues.push({
          type: 'contradiction',
          severity: 'medium',
          description: `Node "${node.title}" is active but prerequisite "${prereqNode.title}" is not completed`,
          affectedNodes: [node.id, prereqId],
          suggestedFix: `Complete "${prereqNode.title}" first or update node status`,
        });
      }
    }

    return issues;
  }

  /**
   * 检查时间线
   */
  private checkTimeline(nodes: StoryNode[]): ConsistencyIssue[] {
    const issues: ConsistencyIssue[] = [];

    const sortedNodes = [...nodes].sort((a, b) => {
      if (a.chapter !== b.chapter) return a.chapter - b.chapter;
      return a.order - b.order;
    });

    for (let i = 1; i < sortedNodes.length; i++) {
      const prev = sortedNodes[i - 1];
      const curr = sortedNodes[i];

      if (prev.chapter === curr.chapter &&
          prev.status === StoryNodeStatus.ACTIVE &&
          curr.status === StoryNodeStatus.COMPLETED) {
        issues.push({
          type: 'timeline_error',
          severity: 'low',
          description: `Possible timeline issue: "${curr.title}" completed before "${prev.title}"`,
          affectedNodes: [prev.id, curr.id],
        });
      }
    }

    return issues;
  }

  /**
   * 检查选择一致性
   */
  private checkChoiceConsistency(): ConsistencyIssue[] {
    const issues: ConsistencyIssue[] = [];

    for (const choice of this.storyState.choices) {
      if (choice.selectedOption >= choice.availableOptions.length) {
        issues.push({
          type: 'contradiction',
          severity: 'medium',
          description: `Invalid choice option: ${choice.selectedOption} for choice "${choice.choiceText}"`,
          affectedNodes: [choice.nodeId],
          suggestedFix: 'Verify choice data integrity',
        });
      }
    }

    return issues;
  }

  // ==================== 标志和变量管理 ====================

  /**
   * 设置标志
   */
  private handleSetFlag(data: Record<string, unknown>): AgentResponse {
    const flagData = data as {
      key: string;
      value: boolean | number | string;
    };

    if (!flagData.key) {
      return {
        success: false,
        error: 'Missing required field: key',
      };
    }

    this.storyState.flags[flagData.key] = flagData.value;
    this.storyState.lastUpdated = Date.now();

    return {
      success: true,
      data: { key: flagData.key, value: flagData.value },
    };
  }

  /**
   * 获取标志
   */
  private handleGetFlag(data: Record<string, unknown>): AgentResponse {
    const flagData = data as { key: string };

    if (!flagData.key) {
      return {
        success: false,
        error: 'Missing required field: key',
      };
    }

    const value = this.storyState.flags[flagData.key];

    return {
      success: true,
      data: { key: flagData.key, value },
    };
  }

  // ==================== 上下文压缩 ====================

  /**
   * 压缩上下文
   */
  private handleCompressContext(): AgentResponse {
    const result = this.compressContext();

    return {
      success: true,
      data: result,
    };
  }

  /**
   * 执行上下文压缩
   */
  private compressContext(): {
    compressedChoices: number;
    compressedMemories: number;
    newSummary: string;
  } {
    let compressedChoices = 0;
    let compressedMemories = 0;

    // 压缩选择记录
    if (this.storyState.choices.length > this.compressionConfig.maxChoices) {
      const oldLength = this.storyState.choices.length;
      this.compressChoices();
      compressedChoices = oldLength - this.storyState.choices.length;
    }

    // 压缩记忆
    if (this.memory.shortTerm.length > this.compressionConfig.maxShortTermMemory) {
      const overflow = this.memory.shortTerm.splice(
        0,
        this.memory.shortTerm.length - this.compressionConfig.maxShortTermMemory
      );
      this.memory.midTerm.push(...overflow);
      compressedMemories = overflow.length;
    }

    // 更新压缩摘要
    const summary = this.buildCompressionSummary();
    this.memory.compressed = summary;

    return {
      compressedChoices,
      compressedMemories,
      newSummary: summary,
    };
  }

  /**
   * 压缩选择记录
   */
  private compressChoices(): void {
    const keepCount = Math.floor(this.compressionConfig.maxChoices * 0.8);
    const toCompress = this.storyState.choices.slice(0, -keepCount);
    this.storyState.choices = this.storyState.choices.slice(-keepCount);

    // 将压缩的选择转换为摘要
    if (toCompress.length > 0) {
      const summary = `Compressed ${toCompress.length} earlier choices. Key outcomes: ${
        toCompress
          .filter(c => c.consequences.length > 0)
          .slice(0, 5)
          .map(c => c.choiceText)
          .join('; ')
      }`;

      this.addMemory(summary, 'assistant', 7, {
        type: 'choice_compression',
        count: toCompress.length,
      });
    }
  }

  /**
   * 构建压缩摘要
   */
  private buildCompressionSummary(): string {
    const parts: string[] = [];

    // 当前章节和状态
    parts.push(`Current Chapter: ${this.storyState.currentChapter}`);

    // 活跃节点
    const activeNodes = Array.from(this.storyState.nodes.values())
      .filter(n => n.status === StoryNodeStatus.ACTIVE);
    if (activeNodes.length > 0) {
      parts.push(`Active: ${activeNodes.map(n => n.title).join(', ')}`);
    }

    // 关键选择
    const significantChoices = this.storyState.choices
      .filter(c => c.consequences.length > 0)
      .slice(-5);
    if (significantChoices.length > 0) {
      parts.push(`Recent key choices: ${significantChoices.length}`);
    }

    // 重要标志
    const importantFlags = Object.entries(this.storyState.flags)
      .filter(([key]) => key.startsWith('branch_') || key.startsWith('major_'));
    if (importantFlags.length > 0) {
      parts.push(`Story branches: ${importantFlags.length}`);
    }

    return parts.join('. ') + '.';
  }

  // ==================== 状态获取 ====================

  /**
   * 获取完整故事状态
   */
  private handleGetStoryState(): AgentResponse {
    return {
      success: true,
      data: {
        currentChapter: this.storyState.currentChapter,
        currentNode: this.storyState.currentNode,
        nodesCount: this.storyState.nodes.size,
        choicesCount: this.storyState.choices.length,
        summariesCount: this.storyState.summaries.length,
        flags: this.storyState.flags,
        variables: this.storyState.variables,
        lastUpdated: this.storyState.lastUpdated,
      },
    };
  }

  // ==================== 辅助方法 ====================

  /**
   * 确定节点初始状态
   */
  private determineInitialStatus(prerequisites?: string[]): StoryNodeStatus {
    if (!prerequisites || prerequisites.length === 0) {
      return StoryNodeStatus.AVAILABLE;
    }

    const allCompleted = prerequisites.every(id => {
      const node = this.storyState.nodes.get(id);
      return node && node.status === StoryNodeStatus.COMPLETED;
    });

    return allCompleted ? StoryNodeStatus.AVAILABLE : StoryNodeStatus.LOCKED;
  }

  /**
   * 生成节点ID
   */
  private generateNodeId(): string {
    return `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 生成选择ID
   */
  private generateChoiceId(): string {
    return `choice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 生成摘要ID
   */
  private generateSummaryId(): string {
    return `summary_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export default StoryContextAgent;
