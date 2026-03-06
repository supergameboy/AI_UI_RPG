/**
 * 故事服务
 * 提供故事节点管理、分支管理、选择记录、摘要生成等业务逻辑
 */

import type {
  StoryNode,
  StoryChoice,
  StorySummary,
  PlotPoint,
  StoryBranch,
  StoryStateSnapshot,
  DecisionRecord,
  NodeContent,
  NodeMetadata,
  NodeStatus,
  StoryEffect,
  StoryCondition,
  CreateNodeRequest,
  CreateNodeResponse,
  RecordChoiceRequest,
  RecordChoiceResponse,
  GenerateSummaryRequest,
  GenerateSummaryResponse,
  StoryPathResponse,
  StoryNodeType,
  PlotPointType,
} from '@ai-rpg/shared';
import { DatabaseService } from './DatabaseService';
import { gameLog } from './GameLogService';
import { getLLMService } from './llm/LLMService';

// ==================== 数据库实体类型 ====================

interface StoryNodeEntity {
  id: string;
  save_id: string;
  title: string;
  description: string;
  type: StoryNodeType;
  content: string; // JSON
  choices: string; // JSON
  parent_id: string | null;
  convergence_point: number; // 0 or 1
  converging_branches: string; // JSON
  metadata: string; // JSON
  status: string; // JSON
  created_at: number;
  updated_at: number;
}

interface StorySummaryEntity {
  id: string;
  character_id: string;
  save_id: string;
  short_term: string; // JSON
  mid_term: string; // JSON
  long_term: string; // JSON
  current_node_id: string;
  active_branches: string; // JSON
  created_at: number;
  updated_at: number;
}

interface PlotPointEntity {
  id: string;
  character_id: string;
  save_id: string;
  type: PlotPointType;
  title: string;
  description: string;
  related_nodes: string; // JSON
  importance: number;
  timestamp: number;
}

interface StoryBranchEntity {
  id: string;
  save_id: string;
  name: string;
  start_node_id: string;
  end_node_id: string | null;
  nodes: string; // JSON
  is_active: number; // 0 or 1
  created_at: number;
  merged_at: number | null;
}

interface ChoiceHistoryEntity {
  id: string;
  save_id: string;
  node_id: string;
  choice_id: string;
  choice_text: string;
  timestamp: number;
  consequences: string; // JSON
}

// ==================== 服务类 ====================

export class StoryService {
  private static instance: StoryService | null = null;
  private db: DatabaseService;
  private initialized: boolean = false;

  // 缓存
  private nodeCache: Map<string, StoryNode> = new Map();
  private summaryCache: Map<string, StorySummary> = new Map();

  private constructor() {
    this.db = DatabaseService.getInstance();
  }

  /**
   * 获取单例实例
   */
  public static getInstance(): StoryService {
    if (!StoryService.instance) {
      StoryService.instance = new StoryService();
    }
    return StoryService.instance;
  }

  /**
   * 初始化服务
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    this.ensureTablesExist();
    this.initialized = true;
    gameLog.info('backend', 'StoryService initialized');
  }

  /**
   * 确保数据库表存在
   */
  private ensureTablesExist(): void {
    // 故事节点表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS story_nodes (
        id TEXT PRIMARY KEY,
        save_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        type TEXT NOT NULL DEFAULT 'scene',
        content TEXT DEFAULT '{}',
        choices TEXT DEFAULT '[]',
        parent_id TEXT,
        convergence_point INTEGER DEFAULT 0,
        converging_branches TEXT DEFAULT '[]',
        metadata TEXT DEFAULT '{}',
        status TEXT DEFAULT '{}',
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
      )
    `);

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_story_nodes_save ON story_nodes(save_id)
    `);

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_story_nodes_parent ON story_nodes(parent_id)
    `);

    // 故事摘要表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS story_summaries (
        id TEXT PRIMARY KEY,
        character_id TEXT NOT NULL,
        save_id TEXT NOT NULL UNIQUE,
        short_term TEXT DEFAULT '{}',
        mid_term TEXT DEFAULT '{}',
        long_term TEXT DEFAULT '{}',
        current_node_id TEXT,
        active_branches TEXT DEFAULT '[]',
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
      )
    `);

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_story_summaries_save ON story_summaries(save_id)
    `);

    // 剧情点表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS plot_points (
        id TEXT PRIMARY KEY,
        character_id TEXT NOT NULL,
        save_id TEXT NOT NULL,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        related_nodes TEXT DEFAULT '[]',
        importance INTEGER DEFAULT 1,
        timestamp INTEGER NOT NULL
      )
    `);

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_plot_points_save ON plot_points(save_id)
    `);

    // 分支表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS story_branches (
        id TEXT PRIMARY KEY,
        save_id TEXT NOT NULL,
        name TEXT NOT NULL,
        start_node_id TEXT NOT NULL,
        end_node_id TEXT,
        nodes TEXT DEFAULT '[]',
        is_active INTEGER DEFAULT 1,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        merged_at INTEGER
      )
    `);

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_story_branches_save ON story_branches(save_id)
    `);

    // 选择历史表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS choice_history (
        id TEXT PRIMARY KEY,
        save_id TEXT NOT NULL,
        node_id TEXT NOT NULL,
        choice_id TEXT NOT NULL,
        choice_text TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        consequences TEXT DEFAULT '[]'
      )
    `);

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_choice_history_save ON choice_history(save_id)
    `);
  }

  // ==================== 节点管理 ====================

  /**
   * 创建节点
   */
  public createNode(request: CreateNodeRequest): CreateNodeResponse {
    try {
      const id = this.generateId('node');
      const now = Date.now();

      const metadata: NodeMetadata = {
        chapter: request.metadata?.chapter ?? 1,
        importance: request.metadata?.importance ?? 'minor',
        tags: request.metadata?.tags ?? [],
        createdAt: now,
      };

      const status: NodeStatus = {
        isVisited: false,
      };

      const choices: StoryChoice[] = (request.choices ?? []).map((c, index) => ({
        id: `choice_${index}_${Date.now()}`,
        text: c.text,
        effects: c.effects ?? [],
        targetNodeId: c.targetNodeId,
        conditions: c.conditions,
        flags: c.flags,
      }));

      const node: StoryNode = {
        id,
        saveId: request.saveId,
        title: request.title,
        description: request.description,
        type: request.type,
        content: request.content,
        choices,
        parentId: request.parentId,
        convergencePoint: false,
        convergingBranches: [],
        metadata,
        status,
      };

      // 保存到数据库
      const stmt = this.db.prepare(`
        INSERT INTO story_nodes (
          id, save_id, title, description, type, content, choices, parent_id,
          convergence_point, converging_branches, metadata, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        id,
        request.saveId,
        node.title,
        node.description,
        node.type,
        JSON.stringify(node.content),
        JSON.stringify(node.choices),
        node.parentId ?? null,
        node.convergencePoint ? 1 : 0,
        JSON.stringify(node.convergingBranches),
        JSON.stringify(node.metadata),
        JSON.stringify(node.status),
        Math.floor(now / 1000),
        Math.floor(now / 1000)
      );

      // 更新缓存
      this.nodeCache.set(id, node);

      gameLog.debug('backend', '创建故事节点', {
        nodeId: id,
        type: node.type,
        title: node.title,
      });

      return {
        success: true,
        node,
        message: `成功创建节点: ${node.title}`,
      };
    } catch (error) {
      gameLog.error('backend', '创建节点失败', { error });
      return {
        success: false,
        node: null as unknown as StoryNode,
        message: error instanceof Error ? error.message : '创建节点失败',
      };
    }
  }

  /**
   * 获取节点
   */
  public getNode(nodeId: string): StoryNode | null {
    // 检查缓存
    if (this.nodeCache.has(nodeId)) {
      return this.nodeCache.get(nodeId)!;
    }

    const stmt = this.db.prepare<StoryNodeEntity>(
      'SELECT * FROM story_nodes WHERE id = ?'
    );
    const entity = stmt.get(nodeId);

    if (!entity) {
      return null;
    }

    const node = this.toStoryNode(entity);
    this.nodeCache.set(nodeId, node);
    return node;
  }

  /**
   * 更新节点
   */
  public updateNode(nodeId: string, updates: Partial<StoryNode>): StoryNode | null {
    const node = this.getNode(nodeId);
    if (!node) {
      return null;
    }

    const updatedNode = { ...node, ...updates };
    const now = Math.floor(Date.now() / 1000);

    const stmt = this.db.prepare(`
      UPDATE story_nodes
      SET title = ?, description = ?, type = ?, content = ?, choices = ?,
          parent_id = ?, convergence_point = ?, converging_branches = ?,
          metadata = ?, status = ?, updated_at = ?
      WHERE id = ?
    `);

    stmt.run(
      updatedNode.title,
      updatedNode.description,
      updatedNode.type,
      JSON.stringify(updatedNode.content),
      JSON.stringify(updatedNode.choices),
      updatedNode.parentId ?? null,
      updatedNode.convergencePoint ? 1 : 0,
      JSON.stringify(updatedNode.convergingBranches),
      JSON.stringify(updatedNode.metadata),
      JSON.stringify(updatedNode.status),
      now,
      nodeId
    );

    // 更新缓存
    this.nodeCache.set(nodeId, updatedNode);

    gameLog.debug('backend', '更新故事节点', { nodeId, updates: Object.keys(updates) });

    return updatedNode;
  }

  /**
   * 删除节点
   */
  public deleteNode(nodeId: string): boolean {
    const stmt = this.db.prepare('DELETE FROM story_nodes WHERE id = ?');
    const result = stmt.run(nodeId);

    if (result.changes > 0) {
      this.nodeCache.delete(nodeId);
      gameLog.debug('backend', '删除故事节点', { nodeId });
      return true;
    }

    return false;
  }

  /**
   * 获取活动节点
   */
  public getActiveNodes(saveId: string): StoryNode[] {
    const stmt = this.db.prepare<StoryNodeEntity>(
      `SELECT * FROM story_nodes WHERE save_id = ? ORDER BY created_at DESC`
    );
    const entities = stmt.all(saveId);
    return entities.map(e => this.toStoryNode(e));
  }

  // ==================== 分支管理 ====================

  /**
   * 获取分支
   */
  public getBranch(branchId: string): StoryBranch | null {
    const stmt = this.db.prepare<StoryBranchEntity>(
      'SELECT * FROM story_branches WHERE id = ?'
    );
    const entity = stmt.get(branchId);

    if (!entity) {
      return null;
    }

    return this.toStoryBranch(entity);
  }

  /**
   * 获取当前分支
   */
  public getCurrentBranch(saveId: string): StoryBranch | null {
    const stmt = this.db.prepare<StoryBranchEntity>(
      `SELECT * FROM story_branches WHERE save_id = ? AND is_active = 1 ORDER BY created_at DESC LIMIT 1`
    );
    const entity = stmt.get(saveId);

    if (!entity) {
      return null;
    }

    return this.toStoryBranch(entity);
  }

  /**
   * 创建分支
   */
  public createBranch(saveId: string, name: string, startNodeId: string): StoryBranch {
    const id = this.generateId('branch');
    const now = Math.floor(Date.now() / 1000);

    const stmt = this.db.prepare(`
      INSERT INTO story_branches (id, save_id, name, start_node_id, nodes, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(id, saveId, name, startNodeId, JSON.stringify([startNodeId]), 1, now);

    return this.getBranch(id)!;
  }

  /**
   * 合并分支
   */
  public mergeBranches(
    saveId: string,
    branchIds: string[],
    _convergenceNodeId?: string
  ): StoryNode | null {
    try {
      // 创建收敛节点
      const convergenceNode = this.createNode({
        saveId,
        title: '剧情汇合点',
        description: '多条剧情线在此汇合',
        type: 'convergence',
        content: { narrative: '' },
      });

      if (!convergenceNode.success) {
        return null;
      }

      const node = convergenceNode.node;
      node.convergencePoint = true;
      node.convergingBranches = branchIds;

      // 更新节点
      this.updateNode(node.id, {
        convergencePoint: true,
        convergingBranches: branchIds,
      });

      // 停用并合并分支
      for (const branchId of branchIds) {
        const branch = this.getBranch(branchId);
        if (branch) {
          const stmt = this.db.prepare(`
            UPDATE story_branches
            SET is_active = 0, end_node_id = ?, merged_at = ?, nodes = ?
            WHERE id = ?
          `);
          stmt.run(
            node.id,
            Math.floor(Date.now() / 1000),
            JSON.stringify([...branch.nodes, node.id]),
            branchId
          );
        }
      }

      gameLog.info('backend', '合并故事分支', {
        branchIds,
        convergenceNodeId: node.id,
      });

      return node;
    } catch (error) {
      gameLog.error('backend', '合并分支失败', { error });
      return null;
    }
  }

  // ==================== 选择记录 ====================

  /**
   * 记录选择
   */
  public recordChoice(request: RecordChoiceRequest): RecordChoiceResponse {
    try {
      const node = this.getNode(request.nodeId);
      if (!node) {
        return {
          success: false,
          node: null as unknown as StoryNode,
          message: '节点不存在',
        };
      }

      const choice = node.choices.find(c => c.id === request.choiceId);
      if (!choice) {
        return {
          success: false,
          node,
          message: '选择不存在',
        };
      }

      // 检查条件
      if (choice.conditions && !this.checkConditions(choice.conditions, request.saveId)) {
        return {
          success: false,
          node,
          message: '不满足选择条件',
        };
      }

      // 记录选择历史
      const historyId = this.generateId('choice');
      const stmt = this.db.prepare(`
        INSERT INTO choice_history (id, save_id, node_id, choice_id, choice_text, timestamp, consequences)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        historyId,
        request.saveId,
        request.nodeId,
        request.choiceId,
        choice.text,
        Date.now(),
        JSON.stringify(choice.effects)
      );

      // 更新节点状态
      const updatedNode = this.updateNode(request.nodeId, {
        status: {
          ...node.status,
          isVisited: true,
          visitedAt: Date.now(),
          selectedChoice: request.choiceId,
        },
      });

      // 应用效果
      this.applyEffects(choice.effects, request.saveId);

      gameLog.debug('backend', '记录选择', {
        nodeId: request.nodeId,
        choiceId: request.choiceId,
        choiceText: choice.text,
      });

      return {
        success: true,
        node: updatedNode!,
        nextNodeId: choice.targetNodeId,
        message: `已选择: ${choice.text}`,
      };
    } catch (error) {
      gameLog.error('backend', '记录选择失败', { error });
      return {
        success: false,
        node: null as unknown as StoryNode,
        message: error instanceof Error ? error.message : '记录选择失败',
      };
    }
  }

  /**
   * 获取选择历史
   */
  public getChoices(saveId: string, limit: number = 50): DecisionRecord[] {
    const stmt = this.db.prepare<ChoiceHistoryEntity>(
      `SELECT * FROM choice_history WHERE save_id = ? ORDER BY timestamp DESC LIMIT ?`
    );
    const entities = stmt.all(saveId, limit);

    return entities.map(e => ({
      nodeId: e.node_id,
      choiceId: e.choice_id,
      choiceText: e.choice_text,
      timestamp: e.timestamp,
      consequences: JSON.parse(e.consequences) as string[],
    }));
  }

  /**
   * 撤销选择
   */
  public undoChoice(saveId: string, nodeId: string): boolean {
    try {
      const node = this.getNode(nodeId);
      if (!node) {
        return false;
      }

      // 删除选择历史
      const stmt = this.db.prepare(
        'DELETE FROM choice_history WHERE save_id = ? AND node_id = ?'
      );
      stmt.run(saveId, nodeId);

      // 重置节点状态
      this.updateNode(nodeId, {
        status: {
          isVisited: false,
          visitedAt: undefined,
          selectedChoice: undefined,
        },
      });

      gameLog.debug('backend', '撤销选择', { saveId, nodeId });
      return true;
    } catch (error) {
      gameLog.error('backend', '撤销选择失败', { error });
      return false;
    }
  }

  // ==================== 摘要管理 ====================

  /**
   * 生成摘要
   */
  public async generateSummary(request: GenerateSummaryRequest): Promise<GenerateSummaryResponse> {
    try {
      const nodes = this.getActiveNodes(request.saveId);
      const existingSummary = this.getSummary(request.saveId);

      let summary: StorySummary;

      if (request.level === 'short') {
        summary = await this.generateShortTermSummary(request.saveId, nodes, existingSummary);
      } else if (request.level === 'mid') {
        summary = await this.generateMidTermSummary(request.saveId, nodes, existingSummary);
      } else {
        summary = await this.generateLongTermSummary(request.saveId, nodes, existingSummary);
      }

      // 保存摘要
      this.saveSummary(summary);

      gameLog.info('backend', '生成故事摘要', {
        saveId: request.saveId,
        level: request.level,
        nodeCount: nodes.length,
      });

      return {
        success: true,
        summary,
        message: `成功生成${request.level === 'short' ? '短期' : request.level === 'mid' ? '中期' : '长期'}摘要`,
      };
    } catch (error) {
      gameLog.error('backend', '生成摘要失败', { error });
      return {
        success: false,
        summary: null as unknown as StorySummary,
        message: error instanceof Error ? error.message : '生成摘要失败',
      };
    }
  }

  /**
   * 生成短期摘要
   */
  private async generateShortTermSummary(
    saveId: string,
    nodes: StoryNode[],
    existingSummary: StorySummary | null
  ): Promise<StorySummary> {
    const recentNodes = nodes.slice(0, 10);
    const content = await this.callLLMForSummary(recentNodes, 'short');

    return {
      id: existingSummary?.id ?? this.generateId('summary'),
      characterId: saveId,
      shortTerm: {
        content,
        nodeIds: recentNodes.map(n => n.id),
        lastUpdated: Date.now(),
      },
      midTerm: existingSummary?.midTerm ?? { content: '', nodeIds: [], lastUpdated: 0 },
      longTerm: existingSummary?.longTerm ?? { content: '', keyDecisions: [], lastUpdated: 0 },
      currentNodeId: nodes[0]?.id ?? '',
      activeBranches: existingSummary?.activeBranches ?? [],
    };
  }

  /**
   * 生成中期摘要
   */
  private async generateMidTermSummary(
    saveId: string,
    nodes: StoryNode[],
    existingSummary: StorySummary | null
  ): Promise<StorySummary> {
    const recentNodes = nodes.slice(0, 30);
    const content = await this.callLLMForSummary(recentNodes, 'mid');

    return {
      id: existingSummary?.id ?? this.generateId('summary'),
      characterId: saveId,
      shortTerm: existingSummary?.shortTerm ?? { content: '', nodeIds: [], lastUpdated: 0 },
      midTerm: {
        content,
        nodeIds: recentNodes.map(n => n.id),
        lastUpdated: Date.now(),
      },
      longTerm: existingSummary?.longTerm ?? { content: '', keyDecisions: [], lastUpdated: 0 },
      currentNodeId: nodes[0]?.id ?? '',
      activeBranches: existingSummary?.activeBranches ?? [],
    };
  }

  /**
   * 生成长期摘要
   */
  private async generateLongTermSummary(
    saveId: string,
    nodes: StoryNode[],
    existingSummary: StorySummary | null
  ): Promise<StorySummary> {
    const content = await this.callLLMForSummary(nodes, 'long');
    const choices = this.getChoices(saveId, 20);
    const keyDecisions: DecisionRecord[] = choices.slice(0, 10).map(c => ({
      nodeId: c.nodeId,
      choiceId: c.choiceId,
      choiceText: c.choiceText,
      timestamp: c.timestamp,
      consequences: c.consequences,
    }));

    return {
      id: existingSummary?.id ?? this.generateId('summary'),
      characterId: saveId,
      shortTerm: existingSummary?.shortTerm ?? { content: '', nodeIds: [], lastUpdated: 0 },
      midTerm: existingSummary?.midTerm ?? { content: '', nodeIds: [], lastUpdated: 0 },
      longTerm: {
        content,
        keyDecisions,
        lastUpdated: Date.now(),
      },
      currentNodeId: nodes[0]?.id ?? '',
      activeBranches: existingSummary?.activeBranches ?? [],
    };
  }

  /**
   * 调用 LLM 生成摘要
   */
  private async callLLMForSummary(nodes: StoryNode[], level: 'short' | 'mid' | 'long'): Promise<string> {
    try {
      const llmService = getLLMService();

      const nodeDescriptions = nodes.map(n =>
        `[${n.type}] ${n.title}: ${n.description}\n内容: ${n.content.narrative.substring(0, 200)}`
      ).join('\n\n');

      const levelDesc = {
        short: '最近的事件摘要（简洁，50字以内）',
        mid: '近期剧情发展摘要（适中，100字以内）',
        long: '整体故事发展摘要（详细，200字以内）',
      };

      const response = await llmService.chat([
        {
          role: 'system',
          content: '你是一个RPG游戏故事摘要专家。请根据给定的故事节点生成简洁、准确的摘要。',
        },
        {
          role: 'user',
          content: `请根据以下故事节点生成${levelDesc[level]}：\n\n${nodeDescriptions}`,
        },
      ], {
        temperature: 0.5,
        maxTokens: 500,
        agentType: 'summary',
      });

      return response.content.trim();
    } catch (error) {
      gameLog.error('backend', 'LLM生成摘要失败', { error });
      // 降级：使用简单拼接
      return nodes.slice(0, 3).map(n => n.title).join(' -> ');
    }
  }

  /**
   * 保存摘要
   */
  public saveSummary(summary: StorySummary): boolean {
    try {
      const now = Math.floor(Date.now() / 1000);
      const existing = this.getSummary(summary.characterId);

      if (existing) {
        const stmt = this.db.prepare(`
          UPDATE story_summaries
          SET short_term = ?, mid_term = ?, long_term = ?, current_node_id = ?,
              active_branches = ?, updated_at = ?
          WHERE id = ?
        `);
        stmt.run(
          JSON.stringify(summary.shortTerm),
          JSON.stringify(summary.midTerm),
          JSON.stringify(summary.longTerm),
          summary.currentNodeId,
          JSON.stringify(summary.activeBranches),
          now,
          existing.id
        );
      } else {
        const stmt = this.db.prepare(`
          INSERT INTO story_summaries (
            id, character_id, save_id, short_term, mid_term, long_term,
            current_node_id, active_branches, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        stmt.run(
          summary.id,
          summary.characterId,
          summary.characterId,
          JSON.stringify(summary.shortTerm),
          JSON.stringify(summary.midTerm),
          JSON.stringify(summary.longTerm),
          summary.currentNodeId,
          JSON.stringify(summary.activeBranches),
          now,
          now
        );
      }

      // 更新缓存
      this.summaryCache.set(summary.characterId, summary);

      return true;
    } catch (error) {
      gameLog.error('backend', '保存摘要失败', { error });
      return false;
    }
  }

  /**
   * 获取摘要
   */
  public getSummary(saveId: string): StorySummary | null {
    if (this.summaryCache.has(saveId)) {
      return this.summaryCache.get(saveId)!;
    }

    const stmt = this.db.prepare<StorySummaryEntity>(
      'SELECT * FROM story_summaries WHERE save_id = ?'
    );
    const entity = stmt.get(saveId);

    if (!entity) {
      return null;
    }

    const summary = this.toStorySummary(entity);
    this.summaryCache.set(saveId, summary);
    return summary;
  }

  // ==================== 剧情点 ====================

  /**
   * 添加剧情点
   */
  public addPlotPoint(
    saveId: string,
    characterId: string,
    type: PlotPointType,
    title: string,
    description: string,
    relatedNodes: string[] = [],
    importance: number = 1
  ): PlotPoint {
    const id = this.generateId('plot');

    const stmt = this.db.prepare(`
      INSERT INTO plot_points (id, character_id, save_id, type, title, description, related_nodes, importance, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      characterId,
      saveId,
      type,
      title,
      description,
      JSON.stringify(relatedNodes),
      importance,
      Date.now()
    );

    gameLog.debug('backend', '添加剧情点', { id, type, title });

    return {
      id,
      characterId,
      type,
      title,
      description,
      relatedNodes,
      importance,
      timestamp: Date.now(),
    };
  }

  /**
   * 获取剧情点
   */
  public getPlotPoints(saveId: string, type?: PlotPointType): PlotPoint[] {
    let sql = 'SELECT * FROM plot_points WHERE save_id = ?';
    const params: string[] = [saveId];

    if (type) {
      sql += ' AND type = ?';
      params.push(type);
    }

    sql += ' ORDER BY timestamp DESC';

    const stmt = this.db.prepare<PlotPointEntity>(sql);
    const entities = stmt.all(...params);

    return entities.map(e => this.toPlotPoint(e));
  }

  // ==================== 存读档支持 ====================

  /**
   * 序列化状态
   */
  public serializeState(saveId: string): StoryStateSnapshot {
    const nodes = this.getActiveNodes(saveId);
    const summary = this.getSummary(saveId);
    const plotPoints = this.getPlotPoints(saveId);
    const branches = this.getBranchesBySaveId(saveId);
    const choiceHistory = this.getChoices(saveId, 1000);

    return {
      nodes,
      summaries: summary ? [summary] : [],
      plotPoints,
      branches,
      currentNodeId: summary?.currentNodeId ?? nodes[0]?.id ?? '',
      choiceHistory,
    };
  }

  /**
   * 反序列化状态
   */
  public deserializeState(saveId: string, snapshot: StoryStateSnapshot): boolean {
    try {
      // 清除现有数据
      this.clearSaveData(saveId);

      // 恢复节点
      for (const node of snapshot.nodes) {
        const stmt = this.db.prepare(`
          INSERT INTO story_nodes (
            id, save_id, title, description, type, content, choices, parent_id,
            convergence_point, converging_branches, metadata, status, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        stmt.run(
          node.id,
          node.saveId,
          node.title,
          node.description,
          node.type,
          JSON.stringify(node.content),
          JSON.stringify(node.choices),
          node.parentId ?? null,
          node.convergencePoint ? 1 : 0,
          JSON.stringify(node.convergingBranches),
          JSON.stringify(node.metadata),
          JSON.stringify(node.status),
          Math.floor(node.metadata.createdAt / 1000),
          Math.floor(Date.now() / 1000)
        );
      }

      // 恢复摘要
      for (const summary of snapshot.summaries) {
        this.saveSummary(summary);
      }

      // 恢复剧情点
      for (const plotPoint of snapshot.plotPoints) {
        const stmt = this.db.prepare(`
          INSERT INTO plot_points (id, character_id, save_id, type, title, description, related_nodes, importance, timestamp)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        stmt.run(
          plotPoint.id,
          plotPoint.characterId,
          saveId,
          plotPoint.type,
          plotPoint.title,
          plotPoint.description,
          JSON.stringify(plotPoint.relatedNodes),
          plotPoint.importance,
          plotPoint.timestamp
        );
      }

      // 恢复分支
      for (const branch of snapshot.branches) {
        const stmt = this.db.prepare(`
          INSERT INTO story_branches (id, save_id, name, start_node_id, end_node_id, nodes, is_active, created_at, merged_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        stmt.run(
          branch.id,
          branch.saveId,
          branch.name,
          branch.startNodeId,
          branch.endNodeId ?? null,
          JSON.stringify(branch.nodes),
          branch.isActive ? 1 : 0,
          branch.createdAt,
          branch.mergedAt ?? null
        );
      }

      // 恢复选择历史
      for (const choice of snapshot.choiceHistory) {
        const stmt = this.db.prepare(`
          INSERT INTO choice_history (id, save_id, node_id, choice_id, choice_text, timestamp, consequences)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        stmt.run(
          this.generateId('choice'),
          saveId,
          choice.nodeId,
          choice.choiceId,
          choice.choiceText,
          choice.timestamp,
          JSON.stringify(choice.consequences ?? [])
        );
      }

      gameLog.info('backend', '恢复故事状态', { saveId, nodeCount: snapshot.nodes.length });

      return true;
    } catch (error) {
      gameLog.error('backend', '恢复故事状态失败', { error });
      return false;
    }
  }

  /**
   * 清除存档数据
   */
  public clearSaveData(saveId: string): void {
    this.db.prepare('DELETE FROM story_nodes WHERE save_id = ?').run(saveId);
    this.db.prepare('DELETE FROM story_summaries WHERE save_id = ?').run(saveId);
    this.db.prepare('DELETE FROM plot_points WHERE save_id = ?').run(saveId);
    this.db.prepare('DELETE FROM story_branches WHERE save_id = ?').run(saveId);
    this.db.prepare('DELETE FROM choice_history WHERE save_id = ?').run(saveId);

    // 清除缓存
    this.nodeCache.clear();
    this.summaryCache.delete(saveId);
  }

  // ==================== 导航 ====================

  /**
   * 获取当前节点
   */
  public getCurrentNode(saveId: string): StoryNode | null {
    const summary = this.getSummary(saveId);
    if (summary?.currentNodeId) {
      return this.getNode(summary.currentNodeId);
    }

    // 返回最新的节点
    const nodes = this.getActiveNodes(saveId);
    return nodes[0] ?? null;
  }

  /**
   * 导航到节点
   */
  public navigateToNode(saveId: string, nodeId: string): StoryNode | null {
    const node = this.getNode(nodeId);
    if (!node) {
      return null;
    }

    // 更新摘要中的当前节点
    const summary = this.getSummary(saveId);
    if (summary) {
      this.saveSummary({
        ...summary,
        currentNodeId: nodeId,
      });
    }

    // 更新节点访问状态
    if (!node.status.isVisited) {
      this.updateNode(nodeId, {
        status: {
          ...node.status,
          isVisited: true,
          visitedAt: Date.now(),
        },
      });
    }

    return node;
  }

  /**
   * 获取故事路径
   */
  public getStoryPath(saveId: string, fromNodeId?: string): StoryPathResponse {
    const nodes = this.getActiveNodes(saveId);

    if (fromNodeId) {
      // 从指定节点开始追溯
      const path: StoryNode[] = [];
      let current = this.getNode(fromNodeId);

      while (current) {
        path.unshift(current);
        current = current.parentId ? this.getNode(current.parentId) : null;
      }

      return {
        success: true,
        path,
        totalNodes: path.length,
      };
    }

    // 返回所有节点的路径
    return {
      success: true,
      path: nodes,
      totalNodes: nodes.length,
    };
  }

  // ==================== 辅助方法 ====================

  /**
   * 获取存档的所有分支
   */
  private getBranchesBySaveId(saveId: string): StoryBranch[] {
    const stmt = this.db.prepare<StoryBranchEntity>(
      'SELECT * FROM story_branches WHERE save_id = ? ORDER BY created_at DESC'
    );
    const entities = stmt.all(saveId);
    return entities.map(e => this.toStoryBranch(e));
  }

  /**
   * 检查条件
   */
  private checkConditions(_conditions: StoryCondition[], _saveId: string): boolean {
    // TODO: 实现条件检查逻辑
    // 这里需要与其他服务（如角色属性、物品、任务等）集成
    return true;
  }

  /**
   * 应用效果
   */
  private applyEffects(effects: StoryEffect[], saveId: string): void {
    // TODO: 实现效果应用逻辑
    // 这里需要与其他服务集成来实际应用效果
    gameLog.debug('backend', '应用故事效果', { saveId, effects });
  }

  /**
   * 生成唯一ID
   */
  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // ==================== 实体转换 ====================

  private toStoryNode(entity: StoryNodeEntity): StoryNode {
    return {
      id: entity.id,
      saveId: entity.save_id,
      title: entity.title,
      description: entity.description,
      type: entity.type,
      content: JSON.parse(entity.content) as NodeContent,
      choices: JSON.parse(entity.choices) as StoryChoice[],
      parentId: entity.parent_id ?? undefined,
      convergencePoint: entity.convergence_point === 1,
      convergingBranches: JSON.parse(entity.converging_branches) as string[],
      metadata: JSON.parse(entity.metadata) as NodeMetadata,
      status: JSON.parse(entity.status) as NodeStatus,
    };
  }

  private toStorySummary(entity: StorySummaryEntity): StorySummary {
    return {
      id: entity.id,
      characterId: entity.character_id,
      shortTerm: JSON.parse(entity.short_term),
      midTerm: JSON.parse(entity.mid_term),
      longTerm: JSON.parse(entity.long_term),
      currentNodeId: entity.current_node_id,
      activeBranches: JSON.parse(entity.active_branches),
    };
  }

  private toPlotPoint(entity: PlotPointEntity): PlotPoint {
    return {
      id: entity.id,
      characterId: entity.character_id,
      type: entity.type,
      title: entity.title,
      description: entity.description,
      relatedNodes: JSON.parse(entity.related_nodes),
      importance: entity.importance,
      timestamp: entity.timestamp,
    };
  }

  private toStoryBranch(entity: StoryBranchEntity): StoryBranch {
    return {
      id: entity.id,
      saveId: entity.save_id,
      name: entity.name,
      startNodeId: entity.start_node_id,
      endNodeId: entity.end_node_id ?? undefined,
      nodes: JSON.parse(entity.nodes),
      isActive: entity.is_active === 1,
      createdAt: entity.created_at,
      mergedAt: entity.merged_at ?? undefined,
    };
  }
}

// ==================== 单例导出 ====================

let storyServiceInstance: StoryService | null = null;

export function getStoryService(): StoryService {
  if (!storyServiceInstance) {
    storyServiceInstance = StoryService.getInstance();
  }
  return storyServiceInstance;
}

export async function initializeStoryService(): Promise<StoryService> {
  const service = getStoryService();
  await service.initialize();
  return service;
}
