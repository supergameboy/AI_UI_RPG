import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useGameStore, useSettingsStore, useAgentStore } from '../../stores';
import { Icon } from '../common';
import styles from './DeveloperPanel.module.css';
import type {
  GlobalContext,
  AgentContext,
  ContextConflict,
  ContextDiff,
  ToolStatus,
} from '@ai-rpg/shared';
import { contextService } from '../../services/contextService';

type StateType = 'game' | 'settings' | 'globalContext' | 'agentContext' | 'toolState';

interface SnapshotInfo {
  id: string;
  timestamp: number;
  label: string;
}

export const StateInspector: React.FC = () => {
  const gameStore = useGameStore();
  const settingsStore = useSettingsStore();
  const agentStore = useAgentStore();
  
  // 使用 ref 存储 stores 避免依赖变化
  const gameStoreRef = useRef(gameStore);
  const agentStoreRef = useRef(agentStore);
  gameStoreRef.current = gameStore;
  agentStoreRef.current = agentStore;

  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set(['game', 'settings']));
  const [editPath, setEditPath] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  // 新增状态
  const [activeStateType, setActiveStateType] = useState<StateType>('game');
  const [globalContext, setGlobalContext] = useState<GlobalContext | null>(null);
  const [agentContexts, setAgentContexts] = useState<AgentContext[]>([]);
  const [toolStates, setToolStates] = useState<ToolStatus[]>([]);
  const [conflicts, setConflicts] = useState<ContextConflict[]>([]);
  const [snapshots, setSnapshots] = useState<SnapshotInfo[]>([]);
  const [selectedSnapshots, setSelectedSnapshots] = useState<[string | null, string | null]>([null, null]);
  const [contextDiffs, setContextDiffs] = useState<ContextDiff[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 加载全局上下文
  const loadGlobalContext = useCallback(async () => {
    const saveId = gameStoreRef.current.currentSaveId;
    if (!saveId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await contextService.getGlobalContext(saveId);
      setGlobalContext(response.context);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载全局上下文失败');
    } finally {
      setLoading(false);
    }
  }, []);

  // 加载 Agent 上下文
  const loadAgentContexts = useCallback(async () => {
    const saveId = gameStoreRef.current.currentSaveId;
    if (!saveId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await contextService.getAgentContext(saveId);
      setAgentContexts(response.contexts);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载 Agent 上下文失败');
    } finally {
      setLoading(false);
    }
  }, []);

  // 加载 Tool 状态
  const loadToolStates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await agentStoreRef.current.fetchTools();
      const tools = agentStoreRef.current.tools;
      setToolStates([...tools]);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载 Tool 状态失败');
    } finally {
      setLoading(false);
    }
  }, []);

  // 加载冲突列表
  const loadConflicts = useCallback(async () => {
    const saveId = gameStoreRef.current.currentSaveId;
    if (!saveId) return;
    try {
      const conflictList = await contextService.getConflicts(saveId, false);
      setConflicts(conflictList);
    } catch (err) {
      console.error('加载冲突列表失败:', err);
    }
  }, []);

  // 加载快照列表
  const loadSnapshots = useCallback(async () => {
    const saveId = gameStoreRef.current.currentSaveId;
    if (!saveId) return;
    try {
      const response = await contextService.getSnapshots(saveId, 20);
      setSnapshots(
        response.snapshots.map((s) => ({
          id: s.id,
          timestamp: s.timestamp,
          label: new Date(s.timestamp).toLocaleString(),
        }))
      );
    } catch (err) {
      console.error('加载快照列表失败:', err);
    }
  }, []);

  // 根据状态类型加载数据
  // loadGlobalContext, loadAgentContexts, loadToolStates, loadConflicts 使用 ref 模式
  // 避免每次 store 变化时重新创建函数导致的无限循环
  useEffect(() => {
    if (activeStateType === 'globalContext') {
      loadGlobalContext();
      loadConflicts();
    } else if (activeStateType === 'agentContext') {
      loadAgentContexts();
      loadConflicts();
    } else if (activeStateType === 'toolState') {
      loadToolStates();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // loadXxx 函数内部使用 gameStoreRef 获取最新状态，不需要作为依赖
  }, [activeStateType]);

  // 加载快照列表（用于对比功能）
  // loadSnapshots 使用 ref 模式，内部通过 gameStoreRef 获取最新 saveId
  useEffect(() => {
    const saveId = gameStoreRef.current.currentSaveId;
    if (saveId) {
      loadSnapshots();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // loadSnapshots 内部使用 gameStoreRef，不需要作为依赖
  }, [gameStore.currentSaveId]);

  // 对比两个快照
  const compareSnapshots = async () => {
    if (!gameStore.currentSaveId || !selectedSnapshots[0] || !selectedSnapshots[1]) return;
    setLoading(true);
    setError(null);
    try {
      const fromSnapshot = snapshots.find((s) => s.id === selectedSnapshots[0]);
      const toSnapshot = snapshots.find((s) => s.id === selectedSnapshots[1]);
      if (!fromSnapshot || !toSnapshot) return;

      const diffs = await contextService.getDiff(
        gameStore.currentSaveId,
        fromSnapshot.timestamp,
        toSnapshot.timestamp
      );
      setContextDiffs(diffs);
    } catch (err) {
      setError(err instanceof Error ? err.message : '对比快照失败');
    } finally {
      setLoading(false);
    }
  };

  const stateData = {
    game: {
      screen: gameStore.screen,
      currentSaveId: gameStore.currentSaveId,
      character: gameStore.character,
      currentLocation: gameStore.currentLocation,
      currentScene: gameStore.currentScene,
      quests: gameStore.quests,
      playTime: gameStore.playTime,
      autoSaveEnabled: gameStore.autoSaveEnabled,
    },
    settings: settingsStore.settings,
  };

  const toggleExpand = (path: string) => {
    const newExpanded = new Set(expandedPaths);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedPaths(newExpanded);
  };

  const isExpandable = (value: unknown): boolean => {
    return typeof value === 'object' && value !== null;
  };

  const getValueType = (value: unknown): string => {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (Array.isArray(value)) return `array[${value.length}]`;
    if (typeof value === 'object') return 'object';
    return typeof value;
  };

  // 检查路径是否有冲突
  const getConflictForPath = (path: string): ContextConflict | undefined => {
    return conflicts.find((c) => c.path === path);
  };

  // 渲染状态节点（带冲突高亮）
  const renderNode = (
    key: string,
    value: unknown,
    path: string,
    depth: number,
    conflict?: ContextConflict
  ): React.ReactNode => {
    const fullPath = path ? `${path}.${key}` : key;
    const isExpanded = expandedPaths.has(fullPath);
    const expandable = isExpandable(value);
    const indent = depth * 16;
    const nodeConflict = conflict || getConflictForPath(fullPath);

    return (
      <div key={fullPath} className={styles.stateNode}>
        <div
          className={`${styles.stateNodeHeader} ${nodeConflict ? styles.hasConflict : ''}`}
          style={{ paddingLeft: indent }}
          onClick={() => expandable && toggleExpand(fullPath)}
        >
          {expandable && (
            <Icon
              name={isExpanded ? 'chevron-down' : 'chevron-right'}
              size={12}
              className={styles.expandIcon}
            />
          )}
          {!expandable && <span className={styles.expandPlaceholder} />}
          <span className={styles.stateKey}>{key}</span>
          <span className={styles.stateType}>{getValueType(value)}</span>
          {nodeConflict && (
            <span className={styles.conflictBadge} title={nodeConflict.id}>
              冲突
            </span>
          )}
          {!expandable && (
            <span
              className={styles.stateValue}
              onClick={(e) => {
                e.stopPropagation();
                setEditPath(fullPath);
                setEditValue(JSON.stringify(value));
              }}
            >
              {JSON.stringify(value)}
            </span>
          )}
        </div>
        {expandable && isExpanded && (
          <div className={styles.stateChildren}>
            {Object.entries(value as Record<string, unknown>).map(([k, v]) =>
              renderNode(k, v, fullPath, depth + 1, nodeConflict)
            )}
          </div>
        )}
        {nodeConflict && depth === 0 && (
          <div className={styles.conflictDetail}>
            <div className={styles.conflictHeader}>
              <span>冲突详情</span>
              <span className={styles.conflictResolution}>
                解决方式: {nodeConflict.resolution}
              </span>
            </div>
            <div className={styles.conflictValues}>
              {nodeConflict.values.map((val, idx) => (
                <div key={idx} className={styles.conflictValueItem}>
                  <span className={styles.conflictAgent}>{val.agentId}:</span>
                  <span className={styles.conflictValue}>
                    {JSON.stringify(val.value)}
                  </span>
                  <span className={styles.conflictReason}>{val.reason}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // 渲染 Agent 上下文（按类型分组）
  const renderAgentContexts = () => {
    const groupedByType: Record<string, AgentContext[]> = {};
    agentContexts.forEach((ctx) => {
      const type = ctx.agentId;
      if (!groupedByType[type]) {
        groupedByType[type] = [];
      }
      groupedByType[type].push(ctx);
    });

    return (
      <div className={styles.agentContextContainer}>
        {Object.entries(groupedByType).map(([type, contexts]) => (
          <div key={type} className={styles.agentContextGroup}>
            <div
              className={styles.agentContextHeader}
              onClick={() => toggleExpand(`agent_${type}`)}
            >
              <Icon
                name={expandedPaths.has(`agent_${type}`) ? 'chevron-down' : 'chevron-right'}
                size={12}
              />
              <span className={styles.agentType}>{type}</span>
              <span className={styles.agentCount}>{contexts.length}</span>
            </div>
            {expandedPaths.has(`agent_${type}`) && (
              <div className={styles.agentContextList}>
                {contexts.map((ctx) => (
                  <div key={ctx.agentId} className={styles.agentContextItem}>
                    <div className={styles.agentContextMeta}>
                      <span>版本: {ctx.version}</span>
                      <span>更新: {new Date(ctx.updatedAt).toLocaleString()}</span>
                    </div>
                    {renderNode('data', ctx.data, '', 0)}
                    {ctx.changes.length > 0 && (
                      <div className={styles.changesSection}>
                        <span className={styles.changesLabel}>变更记录 ({ctx.changes.length})</span>
                        <div className={styles.changesList}>
                          {ctx.changes.slice(-5).map((change, idx) => (
                            <div key={idx} className={styles.changeItem}>
                              <span className={styles.changePath}>{change.path}</span>
                              <span className={styles.changeReason}>{change.reason}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        {agentContexts.length === 0 && (
          <div className={styles.empty}>暂无 Agent 上下文数据</div>
        )}
      </div>
    );
  };

  // 渲染 Tool 状态
  const renderToolStates = () => {
    return (
      <div className={styles.toolStateContainer}>
        <div className={styles.toolStats}>
          <div className={styles.toolStatItem}>
            <span className={styles.toolStatLabel}>总调用次数</span>
            <span className={styles.toolStatValue}>
              {toolStates.reduce((sum, t) => sum + t.callCount, 0)}
            </span>
          </div>
          <div className={styles.toolStatItem}>
            <span className={styles.toolStatLabel}>错误次数</span>
            <span className={styles.toolStatValue}>
              {toolStates.reduce((sum, t) => sum + t.errorCount, 0)}
            </span>
          </div>
          <div className={styles.toolStatItem}>
            <span className={styles.toolStatLabel}>活跃工具</span>
            <span className={styles.toolStatValue}>
              {toolStates.filter((t) => t.status === 'busy').length}
            </span>
          </div>
        </div>
        <div className={styles.toolList}>
          {toolStates.map((tool) => (
            <div key={tool.type} className={styles.toolItem}>
              <div className={styles.toolHeader}>
                <span className={styles.toolName}>{tool.name}</span>
                <span className={`${styles.toolStatus} ${styles[tool.status]}`}>
                  {tool.status}
                </span>
              </div>
              <div className={styles.toolStats}>
                <div className={styles.toolStatItem}>
                  <span>调用: {tool.callCount}</span>
                </div>
                <div className={styles.toolStatItem}>
                  <span>错误: {tool.errorCount}</span>
                </div>
                <div className={styles.toolStatItem}>
                  <span>平均耗时: {tool.averageDuration.toFixed(2)}ms</span>
                </div>
              </div>
              <div className={styles.toolLastCall}>
                最后调用: {tool.lastCall > 0 ? new Date(tool.lastCall).toLocaleString() : '无'}
              </div>
            </div>
          ))}
        </div>
        {toolStates.length === 0 && (
          <div className={styles.empty}>暂无 Tool 状态数据</div>
        )}
      </div>
    );
  };

  // 渲染上下文对比
  const renderContextDiff = () => {
    return (
      <div className={styles.diffContainer}>
        <div className={styles.diffHeader}>
          <span>上下文对比</span>
        </div>
        <div className={styles.diffSelectors}>
          <select
            className={styles.diffSelect}
            value={selectedSnapshots[0] || ''}
            onChange={(e) => setSelectedSnapshots([e.target.value || null, selectedSnapshots[1]])}
          >
            <option value="">选择快照 A</option>
            {snapshots.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
          <span className={styles.diffArrow}>→</span>
          <select
            className={styles.diffSelect}
            value={selectedSnapshots[1] || ''}
            onChange={(e) => setSelectedSnapshots([selectedSnapshots[0], e.target.value || null])}
          >
            <option value="">选择快照 B</option>
            {snapshots.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
          <button
            className={styles.diffButton}
            onClick={compareSnapshots}
            disabled={!selectedSnapshots[0] || !selectedSnapshots[1] || loading}
          >
            对比
          </button>
        </div>
        {contextDiffs.length > 0 && (
          <div className={styles.diffResults}>
            <div className={styles.diffSummary}>
              共 {contextDiffs.length} 处差异
            </div>
            <div className={styles.diffList}>
              {contextDiffs.map((diff, idx) => (
                <div key={idx} className={`${styles.diffItem} ${styles[diff.type]}`}>
                  <div className={styles.diffPath}>
                    <span className={styles.diffType}>{diff.type}</span>
                    <span>{diff.path}</span>
                  </div>
                  <div className={styles.diffValues}>
                    {diff.type !== 'added' && (
                      <div className={styles.oldValue}>
                        <span className={styles.valueLabel}>旧值:</span>
                        <span>{JSON.stringify(diff.oldValue)}</span>
                      </div>
                    )}
                    {diff.type !== 'removed' && (
                      <div className={styles.newValue}>
                        <span className={styles.valueLabel}>新值:</span>
                        <span>{JSON.stringify(diff.newValue)}</span>
                      </div>
                    )}
                  </div>
                  <div className={styles.diffAgent}>Agent: {diff.agentId}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // 渲染冲突列表
  const renderConflicts = () => {
    if (conflicts.length === 0) return null;
    return (
      <div className={styles.conflictsSection}>
        <div className={styles.conflictsHeader}>
          <span>未解决的冲突 ({conflicts.length})</span>
        </div>
        <div className={styles.conflictsList}>
          {conflicts.map((conflict) => (
            <div key={conflict.id} className={styles.conflictItem}>
              <div className={styles.conflictPath}>{conflict.path}</div>
              <div className={styles.conflictAgents}>
                涉及: {conflict.agents.join(', ')}
              </div>
              <div className={styles.conflictResolution}>
                解决方式: {conflict.resolution}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // 渲染状态类型选择器
  const renderStateTypeSelector = () => {
    const types: { key: StateType; label: string }[] = [
      { key: 'game', label: '游戏状态' },
      { key: 'settings', label: '设置' },
      { key: 'globalContext', label: '全局上下文' },
      { key: 'agentContext', label: 'Agent 上下文' },
      { key: 'toolState', label: 'Tool 状态' },
    ];

    return (
      <div className={styles.stateTypeSelector}>
        {types.map((type) => (
          <button
            key={type.key}
            className={`${styles.stateTypeButton} ${activeStateType === type.key ? styles.active : ''}`}
            onClick={() => setActiveStateType(type.key)}
          >
            {type.label}
          </button>
        ))}
      </div>
    );
  };

  // 渲染当前状态内容
  const renderCurrentState = () => {
    if (loading) {
      return <div className={styles.loading}>加载中...</div>;
    }

    if (error) {
      return <div className={styles.errorText}>{error}</div>;
    }

    switch (activeStateType) {
      case 'game':
      case 'settings':
        return (
          <div className={styles.stateTree}>
            {Object.entries(stateData)
              .filter(([key]) => key === activeStateType)
              .map(([key, value]) => renderNode(key, value, '', 0))}
          </div>
        );
      case 'globalContext':
        return (
          <div className={styles.stateTree}>
            {renderConflicts()}
            {globalContext ? (
              renderNode('globalContext', globalContext, '', 0)
            ) : (
              <div className={styles.empty}>
                {gameStore.currentSaveId ? '暂无全局上下文数据' : '请先加载存档'}
              </div>
            )}
            {renderContextDiff()}
          </div>
        );
      case 'agentContext':
        return (
          <div className={styles.stateTree}>
            {renderConflicts()}
            {renderAgentContexts()}
            {renderContextDiff()}
          </div>
        );
      case 'toolState':
        return <div className={styles.stateTree}>{renderToolStates()}</div>;
      default:
        return null;
    }
  };

  return (
    <div className={styles.tabContent} style={{ padding: 0 }}>
      <div className={styles.stateHeader}>
        <span>状态检查器</span>
        <button
          className={styles.refreshButton}
          onClick={() => {
            setExpandedPaths(new Set(['game', 'settings']));
            setContextDiffs([]);
            setError(null);
            if (activeStateType === 'globalContext') {
              loadGlobalContext();
            } else if (activeStateType === 'agentContext') {
              loadAgentContexts();
            } else if (activeStateType === 'toolState') {
              loadToolStates();
            }
          }}
        >
          <Icon name="refresh" size={14} />
          刷新
        </button>
      </div>
      {renderStateTypeSelector()}
      {renderCurrentState()}

      {editPath && (
        <div className={styles.editOverlay}>
          <div className={styles.editDialog}>
            <div className={styles.editHeader}>
              <span>编辑: {editPath}</span>
              <button onClick={() => setEditPath(null)}>
                <Icon name="close" size={14} />
              </button>
            </div>
            <textarea
              className={styles.editTextarea}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
            />
            <div className={styles.editActions}>
              <button
                className={styles.cancelButton}
                onClick={() => setEditPath(null)}
              >
                取消
              </button>
              <button
                className={styles.saveButton}
                onClick={() => {
                  try {
                    const parsed = JSON.parse(editValue);
                    console.log('Would update:', editPath, parsed);
                    setEditPath(null);
                  } catch {
                    alert('无效的JSON格式');
                  }
                }}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
