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
  InventorySlot,
  AttributeModification,
  Item,
  BaseAttributeName,
  DerivedAttributeName,
} from '@ai-rpg/shared';
import { DatabaseService } from './DatabaseService';
import { gameLog } from './GameLogService';
import { getLLMService } from './llm/LLMService';
import { getNumericalService } from './NumericalService';
import { getInventoryService } from './InventoryService';
import { getQuestService } from './QuestService';

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

    // 故事标志表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS story_flags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        save_id TEXT NOT NULL,
        flag_name TEXT NOT NULL,
        flag_value TEXT NOT NULL,
        updated_at INTEGER NOT NULL,
        UNIQUE(save_id, flag_name)
      )
    `);

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_story_flags_save ON story_flags(save_id)
    `);

    // 故事关系表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS story_relationships (
        id TEXT PRIMARY KEY,
        save_id TEXT NOT NULL,
        target_id TEXT NOT NULL,
        value INTEGER NOT NULL,
        description TEXT,
        timestamp INTEGER NOT NULL
      )
    `);

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_story_relationships_save ON story_relationships(save_id)
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
  public async recordChoice(request: RecordChoiceRequest): Promise<RecordChoiceResponse> {
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
      await this.applyEffects(choice.effects, request.saveId);

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
   * 支持属性、物品、任务、标志等条件类型的检查
   */
  private checkConditions(conditions: StoryCondition[], saveId: string): boolean {
    // 所有条件必须满足（AND 逻辑）
    for (const condition of conditions) {
      if (!this.checkSingleCondition(condition, saveId)) {
        gameLog.debug('backend', '条件检查失败', {
          saveId,
          condition,
        });
        return false;
      }
    }
    return true;
  }

  /**
   * 检查单个条件
   */
  private checkSingleCondition(condition: StoryCondition, saveId: string): boolean {
    switch (condition.type) {
      case 'attribute':
        return this.checkAttributeCondition(condition, saveId);
      case 'item':
        return this.checkItemCondition(condition, saveId);
      case 'quest':
        return this.checkQuestCondition(condition, saveId);
      case 'flag':
        return this.checkFlagCondition(condition, saveId);
      case 'relationship':
        return this.checkRelationshipCondition(condition, saveId);
      case 'custom':
        return this.checkCustomCondition(condition, saveId);
      default:
        gameLog.warn('backend', '未知条件类型', { condition });
        return false;
    }
  }

  /**
   * 检查属性条件
   */
  private checkAttributeCondition(condition: StoryCondition, saveId: string): boolean {
    try {
      const { getNumericalService } = require('./NumericalService');
      const numericalService = getNumericalService();
      const characterId = this.getCharacterIdBySaveId(saveId);

      if (!characterId) {
        gameLog.warn('backend', '无法获取角色ID', { saveId });
        return false;
      }

      const statsResult = numericalService.getCharacterStats(characterId);
      if (!statsResult.success || !statsResult.data) {
        return false;
      }

      const stats = statsResult.data;
      const targetValue = condition.value as number;

      // 支持基础属性和衍生属性
      let actualValue: number | undefined;

      // 检查基础属性
      if (condition.target in stats.baseAttributes) {
        actualValue = stats.baseAttributes[condition.target as keyof typeof stats.baseAttributes];
      }
      // 检查衍生属性
      else if (condition.target in stats.derivedAttributes) {
        actualValue = stats.derivedAttributes[condition.target as keyof typeof stats.derivedAttributes];
      }
      // 检查等级和经验
      else if (condition.target === 'level') {
        actualValue = stats.level;
      } else if (condition.target === 'experience') {
        actualValue = stats.experience;
      }

      if (actualValue === undefined) {
        gameLog.warn('backend', '未知的属性类型', { target: condition.target });
        return false;
      }

      return this.compareValues(actualValue, targetValue, condition.operator);
    } catch (error) {
      gameLog.error('backend', '检查属性条件失败', { error: error instanceof Error ? error.message : String(error) });
      return false;
    }
  }

  /**
   * 检查物品条件
   */
  private checkItemCondition(condition: StoryCondition, saveId: string): boolean {
    try {
      const { getInventoryService } = require('./InventoryService');
      const inventoryService = getInventoryService();
      const characterId = this.getCharacterIdBySaveId(saveId);

      if (!characterId) {
        return false;
      }

      const inventory = inventoryService.getInventory(saveId, characterId);
      const targetItemId = condition.target;
      const requiredQuantity = typeof condition.value === 'number' ? condition.value : 1;

      // 查找物品
      const itemSlot = inventory.slots.find(
        (slot: InventorySlot) => slot.item && (slot.item.id === targetItemId || slot.item.name === targetItemId)
      );

      if (!itemSlot || !itemSlot.item) {
        return condition.operator === 'neq'; // 如果要求不等于，没有物品则满足
      }

      const actualQuantity = itemSlot.quantity;

      // 根据操作符比较
      switch (condition.operator) {
        case 'eq':
          return actualQuantity === requiredQuantity;
        case 'gt':
          return actualQuantity > requiredQuantity;
        case 'gte':
          return actualQuantity >= requiredQuantity;
        case 'lt':
          return actualQuantity < requiredQuantity;
        case 'lte':
          return actualQuantity <= requiredQuantity;
        case 'neq':
          return actualQuantity !== requiredQuantity;
        default:
          return actualQuantity >= requiredQuantity;
      }
    } catch (error) {
      gameLog.error('backend', '检查物品条件失败', { error: error instanceof Error ? error.message : String(error) });
      return false;
    }
  }

  /**
   * 检查任务条件
   */
  private checkQuestCondition(condition: StoryCondition, saveId: string): boolean {
    try {
      const { getQuestService } = require('./QuestService');
      const questService = getQuestService();
      const characterId = this.getCharacterIdBySaveId(saveId);

      if (!characterId) {
        return false;
      }

      const questId = condition.target;
      const requiredStatus = condition.value as string;

      const result = questService.getQuest(characterId, questId);

      if (!result.success || !result.quest) {
        // 任务不存在时，如果要求状态是 'not_started' 或 'locked'，则满足
        return requiredStatus === 'not_started' || requiredStatus === 'locked';
      }

      const actualStatus = result.quest.status;

      switch (condition.operator) {
        case 'eq':
          return actualStatus === requiredStatus;
        case 'neq':
          return actualStatus !== requiredStatus;
        default:
          return actualStatus === requiredStatus;
      }
    } catch (error) {
      gameLog.error('backend', '检查任务条件失败', { error: error instanceof Error ? error.message : String(error) });
      return false;
    }
  }

  /**
   * 检查标志条件
   */
  private checkFlagCondition(condition: StoryCondition, saveId: string): boolean {
    try {
      const { getSaveRepository } = require('../models/SaveRepository');
      const saveRepository = getSaveRepository();

      const save = saveRepository.findById(saveId);
      if (!save) {
        return false;
      }

      // 解析 game_state JSON
      let gameState: Record<string, unknown> = {};
      try {
        gameState = JSON.parse(save.game_state || '{}');
      } catch {
        gameState = {};
      }

      // 支持嵌套路径，如 "flags.completedTutorial"
      const flagPath = condition.target.split('.');
      let currentValue: unknown = gameState;

      for (const key of flagPath) {
        if (currentValue && typeof currentValue === 'object' && key in currentValue) {
          currentValue = (currentValue as Record<string, unknown>)[key];
        } else {
          currentValue = undefined;
          break;
        }
      }

      const targetValue = condition.value;

      // 根据操作符比较
      switch (condition.operator) {
        case 'eq':
          return currentValue === targetValue;
        case 'neq':
          return currentValue !== targetValue;
        default:
          // 对于布尔值标志，默认检查是否为真
          if (typeof targetValue === 'boolean') {
            return currentValue === targetValue;
          }
          return currentValue === targetValue;
      }
    } catch (error) {
      gameLog.error('backend', '检查标志条件失败', { error: error instanceof Error ? error.message : String(error) });
      return false;
    }
  }

  /**
   * 检查关系条件（预留接口）
   */
  private checkRelationshipCondition(condition: StoryCondition, saveId: string): boolean {
    // TODO: 实现关系检查，需要 NPC 关系系统
    gameLog.warn('backend', '关系条件检查暂未实现', { saveId, condition });
    return true;
  }

  /**
   * 检查自定义条件
   */
  private checkCustomCondition(condition: StoryCondition, saveId: string): boolean {
    // 自定义条件需要根据具体业务逻辑实现
    gameLog.debug('backend', '自定义条件检查', { saveId, condition });
    // 默认返回 true，允许自定义逻辑通过
    return true;
  }

  /**
   * 根据存档ID获取角色ID
   */
  private getCharacterIdBySaveId(saveId: string): string | null {
    try {
      const stmt = this.db.prepare<{ character_id: string | null }>(
        'SELECT character_id FROM saves WHERE id = ?'
      );
      const result = stmt.get(saveId);
      return result?.character_id ?? null;
    } catch (error) {
      gameLog.error('backend', '获取角色ID失败', { error: error instanceof Error ? error.message : String(error) });
      return null;
    }
  }

  /**
   * 比较数值
   */
  private compareValues(actual: number, target: number, operator: string): boolean {
    switch (operator) {
      case 'eq':
        return actual === target;
      case 'gt':
        return actual > target;
      case 'gte':
        return actual >= target;
      case 'lt':
        return actual < target;
      case 'lte':
        return actual <= target;
      case 'neq':
        return actual !== target;
      default:
        return actual >= target;
    }
  }

  /**
   * 应用效果
   */
  private async applyEffects(effects: StoryEffect[], saveId: string): Promise<void> {
    const characterId = saveId; // 在当前架构中，saveId 即为 characterId

    for (const effect of effects) {
      try {
        switch (effect.type) {
          case 'attribute': {
            this.applyAttributeEffect(effect, characterId);
            break;
          }
          case 'item': {
            this.applyItemEffect(effect, saveId, characterId);
            break;
          }
          case 'quest': {
            await this.applyQuestEffect(effect, characterId);
            break;
          }
          case 'flag': {
            this.applyFlagEffect(effect, saveId);
            break;
          }
          case 'relationship': {
            this.applyRelationshipEffect(effect, saveId);
            break;
          }
          case 'custom': {
            gameLog.info('backend', '应用自定义效果', {
              saveId,
              target: effect.target,
              value: effect.value,
              description: effect.description,
            });
            break;
          }
          default: {
            gameLog.warn('backend', '未知效果类型', { effect });
          }
        }
      } catch (error) {
        gameLog.error('backend', '应用效果失败', {
          effect,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  /**
   * 应用属性效果
   */
  private applyAttributeEffect(effect: StoryEffect, characterId: string): void {
    const numericalService = getNumericalService();
    
    // 解析效果值，支持数值增减
    const value = typeof effect.value === 'number' ? effect.value : 0;
    
    // 将 effect.target 转换为合法的属性名
    const attributeName = effect.target as BaseAttributeName | DerivedAttributeName;
    
    const modification: AttributeModification = {
      targetId: characterId,
      attribute: attributeName,
      value: Math.abs(value),
      type: value >= 0 ? 'add' : 'subtract',
      source: 'story_effect',
    };

    const result = numericalService.modifyAttribute(modification);
    
    if (result.success) {
      gameLog.info('backend', '属性效果已应用', {
        characterId,
        attribute: effect.target,
        change: result.data?.change,
        previousValue: result.data?.previousValue,
        newValue: result.data?.newValue,
        description: effect.description,
      });
    } else {
      gameLog.warn('backend', '属性效果应用失败', {
        characterId,
        attribute: effect.target,
        error: result.error,
      });
    }
  }

  /**
   * 应用物品效果
   */
  private applyItemEffect(effect: StoryEffect, saveId: string, characterId: string): void {
    const inventoryService = getInventoryService();
    
    // effect.target 为物品ID，effect.value 为数量（正数为获取，负数为失去）
    const quantity = typeof effect.value === 'number' ? Math.abs(effect.value) : 1;
    const isAdding = typeof effect.value === 'number' ? effect.value >= 0 : true;

    if (isAdding) {
      // 添加物品 - 创建一个基础物品对象
      const item: Item = {
        id: effect.target,
        name: effect.description || effect.target,
        description: effect.description || `物品: ${effect.target}`,
        type: 'misc',
        rarity: 'common',
        stats: {},
        effects: [],
        requirements: {},
        value: { buy: 0, sell: 0, currency: 'gold' },
        stackable: true,
        maxStack: 99,
      };

      const result = inventoryService.addItem(saveId, characterId, item, quantity);
      
      if (result.success) {
        gameLog.info('backend', '物品效果已应用（获取）', {
          characterId,
          itemId: effect.target,
          quantity,
          description: effect.description,
        });
      } else {
        gameLog.warn('backend', '物品效果应用失败（获取）', {
          characterId,
          itemId: effect.target,
          error: '添加物品失败',
        });
      }
    } else {
      // 移除物品
      try {
        const result = inventoryService.removeItem(saveId, characterId, effect.target, quantity);
        gameLog.info('backend', '物品效果已应用（失去）', {
          characterId,
          itemId: effect.target,
          quantity: result.quantity,
          description: effect.description,
        });
      } catch (error) {
        gameLog.warn('backend', '物品效果应用失败（失去）', {
          characterId,
          itemId: effect.target,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  /**
   * 应用任务效果
   */
  private async applyQuestEffect(effect: StoryEffect, characterId: string): Promise<void> {
    const questService = getQuestService();
    
    // effect.target 为任务ID
    // effect.value 可以是 'accept', 'complete', 'abandon' 或进度数值
    const action = typeof effect.value === 'string' ? effect.value : 'accept';

    switch (action) {
      case 'accept': {
        const result = questService.acceptQuest(characterId, effect.target);
        if (result.success) {
          gameLog.info('backend', '任务效果已应用（接取）', {
            characterId,
            questId: effect.target,
            questName: result.quest?.name,
            description: effect.description,
          });
        } else {
          gameLog.warn('backend', '任务效果应用失败（接取）', {
            characterId,
            questId: effect.target,
            error: result.message,
          });
        }
        break;
      }
      case 'complete': {
        const result = await questService.completeQuest(characterId, effect.target);
        if (result.success) {
          gameLog.info('backend', '任务效果已应用（完成）', {
            characterId,
            questId: effect.target,
            rewards: result.rewards,
            description: effect.description,
          });
        } else {
          gameLog.warn('backend', '任务效果应用失败（完成）', {
            characterId,
            questId: effect.target,
            error: result.message,
          });
        }
        break;
      }
      case 'abandon': {
        const result = questService.abandonQuest(characterId, effect.target);
        if (result.success) {
          gameLog.info('backend', '任务效果已应用（放弃）', {
            characterId,
            questId: effect.target,
            description: effect.description,
          });
        } else {
          gameLog.warn('backend', '任务效果应用失败（放弃）', {
            characterId,
            questId: effect.target,
            error: result.message,
          });
        }
        break;
      }
      default: {
        // 尝试作为进度更新 - 使用 incrementProgress 方法
        const progress = typeof effect.value === 'number' ? effect.value : parseInt(action, 10);
        if (!isNaN(progress)) {
          // 使用 updateProgressByType 方法自动匹配目标
          const results = questService.updateProgressByType(characterId, 'custom', effect.target, progress);
          if (results.length > 0 && results.some(r => r.success)) {
            gameLog.info('backend', '任务效果已应用（进度更新）', {
              characterId,
              questId: effect.target,
              progress,
              description: effect.description,
            });
          } else {
            gameLog.warn('backend', '任务效果应用失败（进度更新）', {
              characterId,
              questId: effect.target,
              error: '未找到匹配的任务目标',
            });
          }
        }
      }
    }
  }

  /**
   * 应用标志效果
   */
  private applyFlagEffect(effect: StoryEffect, saveId: string): void {
    // 将标志存储到数据库中
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO story_flags (save_id, flag_name, flag_value, updated_at)
      VALUES (?, ?, ?, ?)
    `);
    
    const now = Math.floor(Date.now() / 1000);
    const flagValue = typeof effect.value === 'boolean' 
      ? (effect.value ? 1 : 0) 
      : String(effect.value);
    
    stmt.run(saveId, effect.target, flagValue, now);
    
    gameLog.info('backend', '标志效果已应用', {
      saveId,
      flagName: effect.target,
      flagValue: effect.value,
      description: effect.description,
    });
  }

  /**
   * 应用关系效果
   */
  private applyRelationshipEffect(effect: StoryEffect, saveId: string): void {
    // effect.target 为 NPC ID 或关系名称
    // effect.value 为关系值变化（正数增加好感，负数减少好感）
    const value = typeof effect.value === 'number' ? effect.value : 0;
    
    // 将关系变化存储到数据库
    const stmt = this.db.prepare(`
      INSERT INTO story_relationships (id, save_id, target_id, value, description, timestamp)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    const id = this.generateId('rel');
    const now = Date.now();
    
    stmt.run(id, saveId, effect.target, value, effect.description || '', now);
    
    gameLog.info('backend', '关系效果已应用', {
      saveId,
      targetId: effect.target,
      value,
      description: effect.description,
    });
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
