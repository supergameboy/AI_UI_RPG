import React, { useState, useCallback, useMemo } from 'react';
import { Icon } from '../common';
import { useGameStore } from '../../stores';
import styles from './StateDebugger.module.css';
import type { GameStateUpdateLog, GameStateUpdateSource } from '@ai-rpg/shared';

type StateCategory = 'character' | 'skills' | 'inventory' | 'equipment' | 'quests' | 'npcs' | 'map' | 'journal' | 'dynamicUI' | 'all';

const SOURCE_COLORS: Record<GameStateUpdateSource, string> = {
  agent: '#8b5cf6',
  tool: '#10b981',
  websocket: '#3b82f6',
  user: '#f59e0b',
  system: '#6b7280',
};

export const StateDebugger: React.FC = () => {
  const gameStore = useGameStore();
  const [selectedCategory, setSelectedCategory] = useState<StateCategory>('all');
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set(['character', 'skills', 'inventory']));
  const [editingPath, setEditingPath] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const updateLogs = gameStore.getUpdateLogs();

  const stateData = useMemo(() => {
    const data: Record<string, unknown> = {
      character: gameStore.character,
      skills: gameStore.skills,
      inventory: gameStore.inventory,
      equipment: gameStore.equipment,
      quests: gameStore.quests,
      npcs: gameStore.npcs,
      map: gameStore.map,
      journal: gameStore.journal,
      dynamicUI: gameStore.dynamicUI,
    };

    if (selectedCategory === 'all') {
      return data;
    }

    return { [selectedCategory]: data[selectedCategory] };
  }, [gameStore, selectedCategory]);

  const toggleExpand = useCallback((path: string) => {
    setExpandedPaths(prev => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  }, []);

  const isExpandable = useCallback((value: unknown): boolean => {
    return typeof value === 'object' && value !== null;
  }, []);

  const getValueType = useCallback((value: unknown): string => {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (Array.isArray(value)) return `array[${value.length}]`;
    if (typeof value === 'object') return 'object';
    return typeof value;
  }, []);

  const getValueClass = useCallback((value: unknown): string => {
    if (value === null || value === undefined) return styles.null;
    if (typeof value === 'string') return styles.string;
    if (typeof value === 'number') return styles.number;
    if (typeof value === 'boolean') return styles.boolean;
    return '';
  }, []);

  const formatValue = useCallback((value: unknown): string => {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'string') return `"${value.length > 50 ? value.slice(0, 50) + '...' : value}"`;
    if (typeof value === 'object') return '{...}';
    return String(value);
  }, []);

  const handleValueClick = useCallback((path: string, value: unknown) => {
    if (isExpandable(value)) return;
    setEditingPath(path);
    setEditingValue(JSON.stringify(value, null, 2));
    setError(null);
  }, [isExpandable]);

  const handleSaveEdit = useCallback(() => {
    if (!editingPath) return;

    try {
      const parsed = JSON.parse(editingValue);
      const pathParts = editingPath.split('.');
      const updates: Record<string, unknown> = {};
      
      let current = updates;
      for (let i = 0; i < pathParts.length - 1; i++) {
        current[pathParts[i]] = {};
        current = current[pathParts[i]] as Record<string, unknown>;
      }
      current[pathParts[pathParts.length - 1]] = parsed;

      gameStore.updateGameState(
        { [pathParts[0]]: gameStore[pathParts[0] as keyof typeof gameStore] } as Parameters<typeof gameStore.updateGameState>[0],
        'user'
      );

      setEditingPath(null);
      setError(null);
    } catch (err) {
      setError('无效的 JSON 格式');
    }
  }, [editingPath, editingValue, gameStore]);

  const handleClearLogs = useCallback(() => {
    gameStore.clearUpdateLogs();
  }, [gameStore]);

  const renderNode = useCallback((
    key: string,
    value: unknown,
    path: string,
    depth: number
  ): React.ReactNode => {
    const fullPath = path ? `${path}.${key}` : key;
    const isExpanded = expandedPaths.has(fullPath);
    const expandable = isExpandable(value);
    const indent = depth * 16;

    return (
      <div key={fullPath} className={styles.stateNode}>
        <div
          className={styles.stateNodeHeader}
          style={{ paddingLeft: indent }}
          onClick={() => expandable && toggleExpand(fullPath)}
        >
          {expandable ? (
            <Icon
              name={isExpanded ? 'chevron-down' : 'chevron-right'}
              size={12}
              className={styles.expandIcon}
            />
          ) : (
            <span className={styles.expandPlaceholder} />
          )}
          <span className={styles.stateKey}>{key}</span>
          <span className={styles.stateType}>{getValueType(value)}</span>
          {!expandable && (
            <span
              className={`${styles.stateValue} ${getValueClass(value)}`}
              onClick={(e) => {
                e.stopPropagation();
                handleValueClick(fullPath, value);
              }}
            >
              {formatValue(value)}
            </span>
          )}
        </div>
        {expandable && isExpanded && (
          <div className={styles.stateChildren}>
            {Object.entries(value as Record<string, unknown>).map(([k, v]) =>
              renderNode(k, v, fullPath, depth + 1)
            )}
          </div>
        )}
      </div>
    );
  }, [expandedPaths, isExpandable, getValueType, getValueClass, formatValue, toggleExpand, handleValueClick]);

  const formatTimestamp = (timestamp: number): string => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const formatFields = (updates: Record<string, unknown>): string => {
    return Object.keys(updates).join(', ');
  };

  return (
    <div className={styles.stateDebugger}>
      <div className={styles.header}>
        <span className={styles.title}>状态调试器</span>
        <div className={styles.quickActions}>
          <button
            className={styles.quickActionButton}
            onClick={() => setExpandedPaths(new Set(['character', 'skills', 'inventory', 'equipment', 'quests', 'npcs', 'map', 'journal']))}
          >
            全部展开
          </button>
          <button
            className={styles.quickActionButton}
            onClick={() => setExpandedPaths(new Set())}
          >
            全部折叠
          </button>
        </div>
      </div>

      <div className={styles.stateSelector}>
        {[
          { key: 'all', label: '全部' },
          { key: 'character', label: '角色' },
          { key: 'skills', label: '技能' },
          { key: 'inventory', label: '背包' },
          { key: 'equipment', label: '装备' },
          { key: 'quests', label: '任务' },
          { key: 'npcs', label: 'NPC' },
          { key: 'map', label: '地图' },
          { key: 'journal', label: '日志' },
          { key: 'dynamicUI', label: '动态UI' },
        ].map(cat => (
          <button
            key={cat.key}
            className={`${styles.stateButton} ${selectedCategory === cat.key ? styles.active : ''}`}
            onClick={() => setSelectedCategory(cat.key as StateCategory)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className={styles.mainContent}>
        <div className={styles.leftPanel}>
          <div className={styles.stateTree}>
            {Object.entries(stateData).map(([key, value]) =>
              renderNode(key, value, '', 0)
            )}
          </div>
        </div>

        <div className={styles.rightPanel}>
          {editingPath ? (
            <div className={styles.editorSection}>
              <div className={styles.editorHeader}>
                <span>编辑: <span className={styles.editorPath}>{editingPath}</span></span>
              </div>
              <div className={styles.editorContent}>
                <textarea
                  className={styles.editorTextarea}
                  value={editingValue}
                  onChange={e => setEditingValue(e.target.value)}
                />
              </div>
              {error && <div className={styles.error}>{error}</div>}
              <div className={styles.editorActions}>
                <button
                  className={styles.editorButton}
                  onClick={() => {
                    setEditingPath(null);
                    setError(null);
                  }}
                >
                  取消
                </button>
                <button
                  className={`${styles.editorButton} ${styles.primary}`}
                  onClick={handleSaveEdit}
                >
                  保存
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.historySection}>
              <div className={styles.historyHeader}>
                <span>状态变更历史 ({updateLogs.length})</span>
                <button
                  className={styles.quickActionButton}
                  onClick={handleClearLogs}
                >
                  清空
                </button>
              </div>
              <div className={styles.historyList}>
                {updateLogs.length > 0 ? (
                  updateLogs.map((log: GameStateUpdateLog) => (
                    <div key={log.id} className={styles.historyItem}>
                      <span className={styles.historyTime}>
                        {formatTimestamp(log.timestamp)}
                      </span>
                      <span
                        className={styles.historySource}
                        style={{ backgroundColor: SOURCE_COLORS[log.source] + '20', color: SOURCE_COLORS[log.source] }}
                      >
                        {log.source}
                      </span>
                      <span className={styles.historyFields}>
                        {formatFields(log.updates as Record<string, unknown>)}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className={styles.empty}>暂无状态变更记录</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
