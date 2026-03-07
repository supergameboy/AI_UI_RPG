import React, { useState, useMemo } from 'react';
import { useGameStore } from '../../stores/gameStore';
import type { JournalEntry as SharedJournalEntry, JournalEntryType } from '@ai-rpg/shared';
import styles from './JournalPanel.module.css';

const FILTER_OPTIONS: { value: JournalEntryType | 'all'; label: string; icon: string }[] = [
  { value: 'all', label: '全部', icon: '📖' },
  { value: 'quest', label: '任务', icon: '📜' },
  { value: 'combat', label: '战斗', icon: '⚔️' },
  { value: 'discovery', label: '发现', icon: '🔍' },
  { value: 'dialog', label: '对话', icon: '💬' },
  { value: 'trade', label: '交易', icon: '💰' },
  { value: 'system', label: '系统', icon: '⚙️' },
];

const TYPE_ICONS: Record<JournalEntryType, string> = {
  quest: '📜',
  combat: '⚔️',
  discovery: '🔍',
  dialog: '💬',
  trade: '💰',
  system: '⚙️',
};

const TYPE_NAMES: Record<JournalEntryType, string> = {
  quest: '任务',
  combat: '战斗',
  discovery: '发现',
  dialog: '对话',
  trade: '交易',
  system: '系统',
};

const TYPE_COLORS: Record<JournalEntryType, string> = {
  quest: '#FF9800',
  combat: '#F44336',
  discovery: '#4CAF50',
  dialog: '#2196F3',
  trade: '#9C27B0',
  system: '#9E9E9E',
};

const formatTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return '刚刚';
  if (diffMins < 60) return `${diffMins}分钟前`;
  if (diffHours < 24) return `${diffHours}小时前`;
  if (diffDays < 7) return `${diffDays}天前`;
  
  return date.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatFullTime = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

export const JournalPanel: React.FC = () => {
  const journalEntries = useGameStore((state) => state.journalEntries);
  const messages = useGameStore((state) => state.messages);
  const character = useGameStore((state) => state.character);
  const [typeFilter, setTypeFilter] = useState<JournalEntryType | 'all'>('all');
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [sortByNewest, setSortByNewest] = useState(true);

  const dialogueEntries: SharedJournalEntry[] = useMemo(() => {
    return messages.map((msg, index) => ({
      id: `msg_${index}_${msg.timestamp}`,
      type: 'dialog' as JournalEntryType,
      content: msg.content,
      timestamp: msg.timestamp,
    }));
  }, [messages]);

  const allEntries = useMemo(() => {
    const combined = [...journalEntries, ...dialogueEntries];
    return combined.sort((a, b) => 
      sortByNewest ? b.timestamp - a.timestamp : a.timestamp - b.timestamp
    );
  }, [journalEntries, dialogueEntries, sortByNewest]);

  const filteredEntries = useMemo(() => {
    if (typeFilter === 'all') return allEntries;
    return allEntries.filter((entry) => entry.type === typeFilter);
  }, [allEntries, typeFilter]);

  const selectedEntry = allEntries.find((entry) => entry.id === selectedEntryId);

  const stats = useMemo(() => ({
    total: allEntries.length,
    dialog: allEntries.filter((e) => e.type === 'dialog').length,
    quest: allEntries.filter((e) => e.type === 'quest').length,
    combat: allEntries.filter((e) => e.type === 'combat').length,
    discovery: allEntries.filter((e) => e.type === 'discovery').length,
    trade: allEntries.filter((e) => e.type === 'trade').length,
    system: allEntries.filter((e) => e.type === 'system').length,
  }), [allEntries]);

  if (!character.id) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>📖</div>
        <p>暂无日志记录</p>
        <p className={styles.emptyHint}>创建角色后查看游戏日志</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.statsBar}>
        <div className={styles.statItem}>
          <span className={styles.statIcon}>💬</span>
          <span className={styles.statLabel}>对话</span>
          <span className={styles.statValue}>{stats.dialog}</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statIcon}>📜</span>
          <span className={styles.statLabel}>任务</span>
          <span className={styles.statValue}>{stats.quest}</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statIcon}>⚔️</span>
          <span className={styles.statLabel}>战斗</span>
          <span className={styles.statValue}>{stats.combat}</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statIcon}>🔍</span>
          <span className={styles.statLabel}>发现</span>
          <span className={styles.statValue}>{stats.discovery}</span>
        </div>
      </div>

      <div className={styles.filterBar}>
        <div className={styles.filterSection}>
          <span className={styles.filterLabel}>类型筛选</span>
          <div className={styles.filterTabs}>
            {FILTER_OPTIONS.slice(0, 4).map((option) => (
              <button
                key={option.value}
                className={[
                  styles.filterTab,
                  typeFilter === option.value && styles.filterTabActive,
                ].filter(Boolean).join(' ')}
                onClick={() => setTypeFilter(option.value)}
              >
                <span className={styles.filterTabIcon}>{option.icon}</span>
                <span className={styles.filterTabLabel}>{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className={styles.sortSection}>
          <button
            className={[styles.sortButton, sortByNewest && styles.sortButtonActive].filter(Boolean).join(' ')}
            onClick={() => setSortByNewest(true)}
          >
            最新优先
          </button>
          <button
            className={[styles.sortButton, !sortByNewest && styles.sortButtonActive].filter(Boolean).join(' ')}
            onClick={() => setSortByNewest(false)}
          >
            最早优先
          </button>
        </div>
      </div>

      <div className={styles.entriesContainer}>
        {filteredEntries.length === 0 ? (
          <div className={styles.noEntries}>
            <span className={styles.noEntriesIcon}>📖</span>
            <p>没有符合条件的记录</p>
          </div>
        ) : (
          <div className={styles.entriesList}>
            {filteredEntries.map((entry) => (
              <div
                key={entry.id}
                className={[
                  styles.entryCard,
                  selectedEntryId === entry.id && styles.entryCardSelected,
                ].filter(Boolean).join(' ')}
                onClick={() => setSelectedEntryId(entry.id)}
              >
                <div className={styles.entryHeader}>
                  <div 
                    className={styles.entryTypeIcon}
                    style={{ backgroundColor: `${TYPE_COLORS[entry.type]}20` }}
                  >
                    {TYPE_ICONS[entry.type]}
                  </div>
                  <div className={styles.entryInfo}>
                    <div className={styles.entryMeta}>
                      <span
                        className={styles.entryType}
                        style={{ color: TYPE_COLORS[entry.type] }}
                      >
                        {TYPE_NAMES[entry.type]}
                      </span>
                      <span className={styles.entryTime}>
                        {formatTimestamp(entry.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>
                <p className={styles.entryPreview}>
                  {entry.content.length > 80 
                    ? `${entry.content.substring(0, 80)}...` 
                    : entry.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedEntry && (
        <div className={styles.entryDetail}>
          <div className={styles.detailHeader}>
            <div 
              className={styles.detailTypeIcon}
              style={{ backgroundColor: `${TYPE_COLORS[selectedEntry.type]}20` }}
            >
              {TYPE_ICONS[selectedEntry.type]}
            </div>
            <div className={styles.detailTitle}>
              <div className={styles.detailMeta}>
                <span
                  className={styles.detailType}
                  style={{ color: TYPE_COLORS[selectedEntry.type] }}
                >
                  {TYPE_NAMES[selectedEntry.type]}
                </span>
                <span className={styles.detailTime}>
                  {formatFullTime(selectedEntry.timestamp)}
                </span>
              </div>
            </div>
            <button
              className={styles.closeDetail}
              onClick={() => setSelectedEntryId(null)}
            >
              ×
            </button>
          </div>

          <div className={styles.detailContent}>
            {selectedEntry.content}
          </div>
        </div>
      )}
    </div>
  );
};

export default JournalPanel;
