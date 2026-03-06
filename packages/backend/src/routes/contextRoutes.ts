import { Router, type Router as RouterType } from 'express';
import type {
  GlobalContext,
  AgentContext,
  ContextSnapshot,
  ContextData,
  ContextConflict,
  ContextDiff,
  AgentType,
  ConflictResolutionStrategy,
} from '@ai-rpg/shared';
import { sendSuccess, sendError, sendCreated } from '../utils/response';
import { asyncHandler } from '../middleware/errorHandler';
import { gameLog } from '../services/GameLogService';

const router: RouterType = Router();

// 内存存储 - 用于管理上下文数据
class ContextManager {
  private globalContexts: Map<string, { context: GlobalContext; lastUpdated: number }> = new Map();
  private agentContexts: Map<string, Map<string, AgentContext>> = new Map();
  private snapshots: Map<string, ContextSnapshot[]> = new Map();
  private conflicts: Map<string, ContextConflict[]> = new Map();
  private changeHistory: Map<string, ContextData[]> = new Map();

  // 默认全局上下文
  private createDefaultGlobalContext(): GlobalContext {
    return {
      player: {
        id: '',
        name: '',
        race: '',
        class: '',
        background: '',
        level: 1,
        experience: 0,
        attributes: {},
        health: 100,
        maxHealth: 100,
        mana: 50,
        maxMana: 50,
        location: '',
      },
      world: {
        id: '',
        name: '',
        currentTime: 0,
        weather: 'clear',
        exploredAreas: [],
        worldState: {},
      },
      combat: null,
      inventory: {
        items: [],
        equipment: {},
        currency: { gold: 0 },
      },
      quests: {
        active: [],
        completed: [],
        failed: [],
      },
      npcs: {
        met: [],
        relationships: {},
        party: [],
      },
      story: {
        currentNode: '',
        choices: [],
        plotPoints: [],
      },
      dialogue: {
        history: [],
      },
      metadata: {
        createdAt: Date.now(),
        updatedAt: Date.now(),
        saveVersion: '1.0.0',
        templateId: '',
        gameMode: 'normal',
      },
    };
  }

  // 获取全局上下文
  getGlobalContext(saveId: string): { context: GlobalContext; lastUpdated: number } {
    let stored = this.globalContexts.get(saveId);
    if (!stored) {
      stored = {
        context: this.createDefaultGlobalContext(),
        lastUpdated: Date.now(),
      };
      this.globalContexts.set(saveId, stored);
    }
    return stored;
  }

  // 更新全局上下文
  updateGlobalContext(saveId: string, data: Partial<GlobalContext>): GlobalContext {
    const stored = this.getGlobalContext(saveId);
    stored.context = { ...stored.context, ...data };
    stored.context.metadata.updatedAt = Date.now();
    stored.lastUpdated = Date.now();
    return stored.context;
  }

  // 获取智能体上下文
  getAgentContexts(saveId: string, agentId?: AgentType): AgentContext[] {
    const saveContexts = this.agentContexts.get(saveId);
    if (!saveContexts) return [];

    if (agentId) {
      const context = saveContexts.get(agentId);
      return context ? [context] : [];
    }

    return Array.from(saveContexts.values());
  }

  // 更新智能体上下文
  updateAgentContext(saveId: string, agentId: AgentType, data: Record<string, unknown>): AgentContext {
    let saveContexts = this.agentContexts.get(saveId);
    if (!saveContexts) {
      saveContexts = new Map();
      this.agentContexts.set(saveId, saveContexts);
    }

    let context = saveContexts.get(agentId);
    const now = Date.now();

    if (!context) {
      context = {
        agentId,
        data,
        changes: [],
        createdAt: now,
        updatedAt: now,
        version: 1,
      };
    } else {
      context.data = { ...context.data, ...data };
      context.updatedAt = now;
      context.version += 1;
    }

    saveContexts.set(agentId, context);
    return context;
  }

  // 清除智能体上下文
  clearAgentContext(saveId: string, agentId: AgentType): boolean {
    const saveContexts = this.agentContexts.get(saveId);
    if (!saveContexts) return false;
    return saveContexts.delete(agentId);
  }

  // 应用上下文变更
  applyChanges(saveId: string, changes: ContextData[]): { appliedChanges: ContextData[]; conflicts: ContextConflict[] } {
    const appliedChanges: ContextData[] = [];
    const conflicts: ContextConflict[] = [];

    for (const change of changes) {
      const existingConflict = this.checkConflict(saveId, change);
      if (existingConflict) {
        conflicts.push(existingConflict);
      } else {
        this.applyChange(saveId, change);
        appliedChanges.push(change);
      }
    }

    // 记录变更历史
    let history = this.changeHistory.get(saveId);
    if (!history) {
      history = [];
      this.changeHistory.set(saveId, history);
    }
    history.push(...appliedChanges);

    return { appliedChanges, conflicts };
  }

  // 检查冲突
  private checkConflict(saveId: string, change: ContextData): ContextConflict | null {
    const saveConflicts = this.conflicts.get(saveId) || [];
    const existingConflict = saveConflicts.find(
      (c) => c.path === change.path && c.resolution === 'pending'
    );
    return existingConflict || null;
  }

  // 应用单个变更
  private applyChange(saveId: string, change: ContextData): void {
    const stored = this.getGlobalContext(saveId);
    this.setNestedValue(stored.context, change.path, change.value);
    stored.lastUpdated = Date.now();
  }

  // 设置嵌套值
  private setNestedValue(obj: unknown, path: string, value: unknown): void {
    const keys = path.split('.');
    let current: unknown = obj;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i] as string;
      if (current && typeof current === 'object') {
        const record = current as Record<string, unknown>;
        if (!(key in record)) {
          record[key] = {};
        }
        current = record[key];
      } else {
        return;
      }
    }

    if (current && typeof current === 'object') {
      (current as Record<string, unknown>)[keys[keys.length - 1] as string] = value;
    }
  }

  // 获取嵌套值
  private getNestedValue(obj: unknown, path: string): unknown {
    const keys = path.split('.');
    let current: unknown = obj;

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = (current as Record<string, unknown>)[key];
      } else {
        return undefined;
      }
    }

    return current;
  }

  // 获取上下文路径值
  getValue(saveId: string, path: string): { value: unknown; previousValue?: unknown; timestamp: number } {
    const stored = this.getGlobalContext(saveId);
    const value = this.getNestedValue(stored.context, path);

    // 查找历史记录中的上一个值
    const history = this.changeHistory.get(saveId) || [];
    const lastChange = [...history].reverse().find((c) => c.path === path);

    return {
      value,
      previousValue: lastChange?.previousValue,
      timestamp: stored.lastUpdated,
    };
  }

  // 设置上下文路径值
  setValue(
    saveId: string,
    path: string,
    value: unknown,
    agentId: AgentType,
    reason: string
  ): { success: boolean; previousValue?: unknown; newValue: unknown } {
    const stored = this.getGlobalContext(saveId);
    const previousValue = this.getNestedValue(stored.context, path);

    this.setNestedValue(stored.context, path, value);
    stored.lastUpdated = Date.now();

    // 记录变更
    const change: ContextData = {
      path,
      value,
      previousValue,
      timestamp: Date.now(),
      reason,
      agentId,
    };

    let history = this.changeHistory.get(saveId);
    if (!history) {
      history = [];
      this.changeHistory.set(saveId, history);
    }
    history.push(change);

    return { success: true, previousValue, newValue: value };
  }

  // 合并上下文
  mergeContext(
    saveId: string,
    agentContexts: AgentContext[],
    strategy: 'priority' | 'timestamp' | 'manual' = 'timestamp'
  ): { mergedContext: GlobalContext; conflicts: ContextConflict[]; appliedChanges: ContextData[] } {
    const stored = this.getGlobalContext(saveId);
    const conflicts: ContextConflict[] = [];
    const appliedChanges: ContextData[] = [];

    // 收集所有变更
    const allChanges: Map<string, { agentId: AgentType; value: unknown; reason: string; timestamp: number }[]> = new Map();

    for (const agentContext of agentContexts) {
      for (const change of agentContext.changes) {
        let pathChanges = allChanges.get(change.path);
        if (!pathChanges) {
          pathChanges = [];
          allChanges.set(change.path, pathChanges);
        }
        pathChanges.push({
          agentId: agentContext.agentId,
          value: change.value,
          reason: change.reason,
          timestamp: change.timestamp,
        });
      }
    }

    // 处理每个路径的变更
    for (const [path, changes] of allChanges) {
      if (changes.length === 1) {
        // 无冲突，直接应用
        this.setNestedValue(stored.context, path, changes[0]!.value);
        appliedChanges.push({
          path,
          value: changes[0]!.value,
          timestamp: Date.now(),
          reason: changes[0]!.reason,
          agentId: changes[0]!.agentId,
        });
      } else {
        // 存在冲突
        if (strategy === 'timestamp') {
          // 按时间戳排序，使用最新的
          changes.sort((a, b) => b.timestamp - a.timestamp);
          const winner = changes[0]!;
          this.setNestedValue(stored.context, path, winner.value);
          appliedChanges.push({
            path,
            value: winner.value,
            timestamp: Date.now(),
            reason: winner.reason,
            agentId: winner.agentId,
          });
        } else if (strategy === 'priority') {
          // 按优先级处理（这里简化为使用第一个）
          const winner = changes[0]!;
          this.setNestedValue(stored.context, path, winner.value);
          appliedChanges.push({
            path,
            value: winner.value,
            timestamp: Date.now(),
            reason: winner.reason,
            agentId: winner.agentId,
          });
        } else {
          // 手动处理，记录冲突
          const conflict: ContextConflict = {
            id: `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            path,
            agents: changes.map((c) => c.agentId),
            values: changes.map((c) => ({
              agentId: c.agentId,
              value: c.value,
              reason: c.reason,
            })),
            resolution: 'pending',
            timestamp: Date.now(),
          };
          conflicts.push(conflict);

          // 保存冲突
          let saveConflicts = this.conflicts.get(saveId);
          if (!saveConflicts) {
            saveConflicts = [];
            this.conflicts.set(saveId, saveConflicts);
          }
          saveConflicts.push(conflict);
        }
      }
    }

    stored.lastUpdated = Date.now();
    return { mergedContext: stored.context, conflicts, appliedChanges };
  }

  // 获取快照列表
  getSnapshots(saveId: string, limit?: number): ContextSnapshot[] {
    const snapshots = this.snapshots.get(saveId) || [];
    if (limit) {
      return snapshots.slice(-limit);
    }
    return snapshots;
  }

  // 创建快照
  createSnapshot(saveId: string, requestId?: string): ContextSnapshot {
    const stored = this.getGlobalContext(saveId);
    const agentContexts = this.getAgentContexts(saveId);

    const snapshot: ContextSnapshot = {
      id: `snapshot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      globalContext: JSON.parse(JSON.stringify(stored.context)),
      agentContexts: JSON.parse(JSON.stringify(agentContexts)),
      timestamp: Date.now(),
      requestId: requestId || '',
    };

    let snapshots = this.snapshots.get(saveId);
    if (!snapshots) {
      snapshots = [];
      this.snapshots.set(saveId, snapshots);
    }
    snapshots.push(snapshot);

    return snapshot;
  }

  // 恢复快照
  restoreSnapshot(saveId: string, snapshotId: string): GlobalContext | null {
    const snapshots = this.snapshots.get(saveId);
    if (!snapshots) return null;

    const snapshot = snapshots.find((s) => s.id === snapshotId);
    if (!snapshot) return null;

    this.globalContexts.set(saveId, {
      context: JSON.parse(JSON.stringify(snapshot.globalContext)),
      lastUpdated: Date.now(),
    });

    // 恢复智能体上下文
    const agentContextsMap = new Map<string, AgentContext>();
    for (const agentContext of snapshot.agentContexts) {
      agentContextsMap.set(agentContext.agentId, JSON.parse(JSON.stringify(agentContext)));
    }
    this.agentContexts.set(saveId, agentContextsMap);

    return snapshot.globalContext;
  }

  // 获取差异
  getDiff(saveId: string, fromTimestamp: number, toTimestamp?: number): ContextDiff[] {
    const history = this.changeHistory.get(saveId) || [];
    const endTime = toTimestamp || Date.now();

    return history
      .filter((c) => c.timestamp >= fromTimestamp && c.timestamp <= endTime)
      .map((c) => ({
        path: c.path,
        type: c.previousValue === undefined ? 'added' : 'modified' as 'added' | 'modified',
        oldValue: c.previousValue,
        newValue: c.value,
        agentId: c.agentId,
      }));
  }

  // 获取冲突列表
  getConflicts(saveId: string, resolved?: boolean): ContextConflict[] {
    const conflicts = this.conflicts.get(saveId) || [];
    if (resolved === undefined) {
      return conflicts;
    }
    return conflicts.filter((c) =>
      resolved ? c.resolution !== 'pending' : c.resolution === 'pending'
    );
  }

  // 解决冲突
  resolveConflict(
    saveId: string,
    conflictId: string,
    strategy: ConflictResolutionStrategy,
    resolvedValue?: unknown,
    resolvedBy?: AgentType
  ): ContextConflict | null {
    const conflicts = this.conflicts.get(saveId);
    if (!conflicts) return null;

    const conflict = conflicts.find((c) => c.id === conflictId);
    if (!conflict) return null;

    let finalValue: unknown;
    if (strategy === 'manual' && resolvedValue !== undefined) {
      finalValue = resolvedValue;
    } else if (strategy === 'priority' && conflict.values.length > 0) {
      finalValue = conflict.values[0]!.value;
    } else if (strategy === 'timestamp' && conflict.values.length > 0) {
      finalValue = conflict.values[conflict.values.length - 1]!.value;
    } else {
      return null;
    }

    // 应用解决后的值
    const stored = this.getGlobalContext(saveId);
    this.setNestedValue(stored.context, conflict.path, finalValue);
    stored.lastUpdated = Date.now();

    // 更新冲突状态
    conflict.resolution = strategy;
    conflict.resolvedValue = finalValue;
    conflict.resolvedBy = resolvedBy;

    return conflict;
  }

  // 重置全局上下文
  resetGlobalContext(saveId: string): GlobalContext {
    const newContext = this.createDefaultGlobalContext();
    this.globalContexts.set(saveId, {
      context: newContext,
      lastUpdated: Date.now(),
    });
    return newContext;
  }
}

// 单例实例
const contextManager = new ContextManager();

/**
 * GET /api/context/global/:saveId
 * 获取全局上下文
 */
router.get(
  '/global/:saveId',
  asyncHandler(async (req, res) => {
    const { saveId } = req.params;

    const result = contextManager.getGlobalContext(saveId);

    gameLog.debug('backend', '获取全局上下文', { saveId });

    sendSuccess(res, {
      context: result.context,
      lastUpdated: result.lastUpdated,
    });
  })
);

/**
 * PUT /api/context/global/:saveId
 * 更新全局上下文
 */
router.put(
  '/global/:saveId',
  asyncHandler(async (req, res) => {
    const { saveId } = req.params;
    const data = req.body as Partial<GlobalContext>;

    const updatedContext = contextManager.updateGlobalContext(saveId, data);

    gameLog.info('backend', '更新全局上下文', { saveId, updatedFields: Object.keys(data) });

    sendSuccess(res, updatedContext);
  })
);

/**
 * POST /api/context/global/:saveId/reset
 * 重置全局上下文
 */
router.post(
  '/global/:saveId/reset',
  asyncHandler(async (req, res) => {
    const { saveId } = req.params;

    const newContext = contextManager.resetGlobalContext(saveId);

    gameLog.info('backend', '重置全局上下文', { saveId });

    sendSuccess(res, newContext);
  })
);

/**
 * GET /api/context/agents/:saveId
 * 获取智能体上下文
 */
router.get(
  '/agents/:saveId',
  asyncHandler(async (req, res) => {
    const { saveId } = req.params;
    const agentId = req.query.agentId as AgentType | undefined;

    const contexts = contextManager.getAgentContexts(saveId, agentId);

    gameLog.debug('backend', '获取智能体上下文', { saveId, agentId, count: contexts.length });

    sendSuccess(res, { contexts });
  })
);

/**
 * PUT /api/context/agents/:saveId/:agentId
 * 更新智能体上下文
 */
router.put(
  '/agents/:saveId/:agentId',
  asyncHandler(async (req, res) => {
    const { saveId, agentId } = req.params;
    const data = req.body as Record<string, unknown>;

    const updatedContext = contextManager.updateAgentContext(saveId, agentId as AgentType, data);

    gameLog.info('backend', '更新智能体上下文', { saveId, agentId });

    sendSuccess(res, updatedContext);
  })
);

/**
 * DELETE /api/context/agents/:saveId/:agentId
 * 清除智能体上下文
 */
router.delete(
  '/agents/:saveId/:agentId',
  asyncHandler(async (req, res) => {
    const { saveId, agentId } = req.params;

    const success = contextManager.clearAgentContext(saveId, agentId as AgentType);

    gameLog.info('backend', '清除智能体上下文', { saveId, agentId, success });

    sendSuccess(res, { success });
  })
);

/**
 * POST /api/context/changes/:saveId
 * 应用上下文变更
 */
router.post(
  '/changes/:saveId',
  asyncHandler(async (req, res) => {
    const { saveId } = req.params;
    const { changes } = req.body as { changes: ContextData[] };

    if (!Array.isArray(changes)) {
      sendError(res, 'VALIDATION_ERROR', 'changes 必须是数组', 400);
      return;
    }

    const result = contextManager.applyChanges(saveId, changes);

    gameLog.info('backend', '应用上下文变更', {
      saveId,
      appliedCount: result.appliedChanges.length,
      conflictCount: result.conflicts.length,
    });

    sendSuccess(res, {
      success: true,
      appliedChanges: result.appliedChanges,
      conflicts: result.conflicts,
    });
  })
);

/**
 * POST /api/context/batch/:saveId
 * 批量更新上下文
 */
router.post(
  '/batch/:saveId',
  asyncHandler(async (req, res) => {
    const { saveId } = req.params;
    const { updates } = req.body as {
      updates: Array<{
        path: string;
        value: unknown;
        reason: string;
        agentId: AgentType;
      }>;
    };

    if (!Array.isArray(updates)) {
      sendError(res, 'VALIDATION_ERROR', 'updates 必须是数组', 400);
      return;
    }

    const changes: ContextData[] = updates.map((u) => ({
      path: u.path,
      value: u.value,
      timestamp: Date.now(),
      reason: u.reason,
      agentId: u.agentId,
    }));

    const result = contextManager.applyChanges(saveId, changes);

    gameLog.info('backend', '批量更新上下文', {
      saveId,
      updatedCount: result.appliedChanges.length,
      conflictCount: result.conflicts.length,
    });

    sendSuccess(res, {
      success: true,
      updatedCount: result.appliedChanges.length,
      conflicts: result.conflicts,
    });
  })
);

/**
 * POST /api/context/merge/:saveId
 * 合并上下文
 */
router.post(
  '/merge/:saveId',
  asyncHandler(async (req, res) => {
    const { saveId } = req.params;
    const { agentContexts, strategy = 'timestamp' } = req.body as {
      agentContexts: AgentContext[];
      strategy?: 'priority' | 'timestamp' | 'manual';
    };

    if (!Array.isArray(agentContexts)) {
      sendError(res, 'VALIDATION_ERROR', 'agentContexts 必须是数组', 400);
      return;
    }

    const result = contextManager.mergeContext(saveId, agentContexts, strategy);

    gameLog.info('backend', '合并上下文', {
      saveId,
      strategy,
      appliedCount: result.appliedChanges.length,
      conflictCount: result.conflicts.length,
    });

    sendSuccess(res, {
      success: true,
      mergedContext: result.mergedContext,
      conflicts: result.conflicts,
      appliedChanges: result.appliedChanges,
    });
  })
);

/**
 * GET /api/context/snapshots/:saveId
 * 获取上下文快照列表
 */
router.get(
  '/snapshots/:saveId',
  asyncHandler(async (req, res) => {
    const { saveId } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;

    const snapshots = contextManager.getSnapshots(saveId, limit);

    gameLog.debug('backend', '获取上下文快照列表', { saveId, count: snapshots.length });

    sendSuccess(res, {
      snapshots,
      total: snapshots.length,
    });
  })
);

/**
 * POST /api/context/snapshots/:saveId
 * 创建上下文快照
 */
router.post(
  '/snapshots/:saveId',
  asyncHandler(async (req, res) => {
    const { saveId } = req.params;
    const { requestId } = req.body as { requestId?: string };

    const snapshot = contextManager.createSnapshot(saveId, requestId);

    gameLog.info('backend', '创建上下文快照', { saveId, snapshotId: snapshot.id });

    sendCreated(res, snapshot);
  })
);

/**
 * POST /api/context/snapshots/:saveId/:snapshotId/restore
 * 恢复上下文快照
 */
router.post(
  '/snapshots/:saveId/:snapshotId/restore',
  asyncHandler(async (req, res) => {
    const { saveId, snapshotId } = req.params;

    const restoredContext = contextManager.restoreSnapshot(saveId, snapshotId);

    if (!restoredContext) {
      sendError(res, 'NOT_FOUND', '快照不存在', 404);
      return;
    }

    gameLog.info('backend', '恢复上下文快照', { saveId, snapshotId });

    sendSuccess(res, {
      success: true,
      restoredContext,
    });
  })
);

/**
 * GET /api/context/diff/:saveId
 * 获取上下文差异
 */
router.get(
  '/diff/:saveId',
  asyncHandler(async (req, res) => {
    const { saveId } = req.params;
    const fromTimestamp = parseInt(req.query.from as string);
    const toTimestamp = req.query.to ? parseInt(req.query.to as string) : undefined;

    if (isNaN(fromTimestamp)) {
      sendError(res, 'VALIDATION_ERROR', 'from 参数必须是有效的时间戳', 400);
      return;
    }

    const diffs = contextManager.getDiff(saveId, fromTimestamp, toTimestamp);

    gameLog.debug('backend', '获取上下文差异', { saveId, fromTimestamp, toTimestamp, diffCount: diffs.length });

    sendSuccess(res, diffs);
  })
);

/**
 * GET /api/context/conflicts/:saveId
 * 获取上下文冲突列表
 */
router.get(
  '/conflicts/:saveId',
  asyncHandler(async (req, res) => {
    const { saveId } = req.params;
    const resolved = req.query.resolved ? req.query.resolved === 'true' : undefined;

    const conflicts = contextManager.getConflicts(saveId, resolved);

    gameLog.debug('backend', '获取上下文冲突列表', { saveId, resolved, count: conflicts.length });

    sendSuccess(res, conflicts);
  })
);

/**
 * POST /api/context/conflicts/:saveId/:conflictId/resolve
 * 解决上下文冲突
 */
router.post(
  '/conflicts/:saveId/:conflictId/resolve',
  asyncHandler(async (req, res) => {
    const { saveId, conflictId } = req.params;
    const { strategy, resolvedValue, resolvedBy } = req.body as {
      strategy: ConflictResolutionStrategy;
      resolvedValue?: unknown;
      resolvedBy?: AgentType;
    };

    if (!strategy) {
      sendError(res, 'VALIDATION_ERROR', 'strategy 参数是必需的', 400);
      return;
    }

    const conflict = contextManager.resolveConflict(
      saveId,
      conflictId,
      strategy,
      resolvedValue,
      resolvedBy
    );

    if (!conflict) {
      sendError(res, 'NOT_FOUND', '冲突不存在或无法解决', 404);
      return;
    }

    gameLog.info('backend', '解决上下文冲突', { saveId, conflictId, strategy });

    sendSuccess(res, conflict);
  })
);

/**
 * GET /api/context/value/:saveId
 * 获取上下文路径值
 */
router.get(
  '/value/:saveId',
  asyncHandler(async (req, res) => {
    const { saveId } = req.params;
    const path = req.query.path as string;

    if (!path) {
      sendError(res, 'VALIDATION_ERROR', 'path 参数是必需的', 400);
      return;
    }

    const result = contextManager.getValue(saveId, path);

    gameLog.debug('backend', '获取上下文路径值', { saveId, path });

    sendSuccess(res, result);
  })
);

/**
 * PUT /api/context/value/:saveId
 * 设置上下文路径值
 */
router.put(
  '/value/:saveId',
  asyncHandler(async (req, res) => {
    const { saveId } = req.params;
    const { path, value, agentId, reason = '' } = req.body as {
      path: string;
      value: unknown;
      agentId: AgentType;
      reason?: string;
    };

    if (!path || !agentId) {
      sendError(res, 'VALIDATION_ERROR', 'path 和 agentId 参数是必需的', 400);
      return;
    }

    const result = contextManager.setValue(saveId, path, value, agentId, reason);

    gameLog.info('backend', '设置上下文路径值', { saveId, path, agentId });

    sendSuccess(res, result);
  })
);

export default router;
