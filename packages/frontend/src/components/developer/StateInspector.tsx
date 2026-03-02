import React, { useState } from 'react';
import { useGameStore, useSettingsStore } from '../../stores';
import { Icon } from '../common';
import styles from './DeveloperPanel.module.css';

export const StateInspector: React.FC = () => {
  const gameStore = useGameStore();
  const settingsStore = useSettingsStore();
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set(['game', 'settings']));
  const [editPath, setEditPath] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');

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

  const renderNode = (key: string, value: unknown, path: string, depth: number): React.ReactNode => {
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
              renderNode(k, v, fullPath, depth + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={styles.tabContent} style={{ padding: 0 }}>
      <div className={styles.stateHeader}>
        <span>游戏状态树</span>
        <button
          className={styles.refreshButton}
          onClick={() => {
            setExpandedPaths(new Set(['game', 'settings']));
          }}
        >
          <Icon name="refresh" size={14} />
          刷新
        </button>
      </div>
      <div className={styles.stateTree}>
        {Object.entries(stateData).map(([key, value]) =>
          renderNode(key, value, '', 0)
        )}
      </div>

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
