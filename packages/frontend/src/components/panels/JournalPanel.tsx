import React, { useState, useMemo } from 'react';
import { useGameStore } from '../../stores/gameStore';
import type { JournalEntry } from '@ai-rpg/shared';
import styles from './JournalPanel.module.css';

type JournalEntryType = 'story' | 'combat' | 'quest' | 'discovery' | 'dialogue' | 'system';

const FILTER_OPTIONS: { value: JournalEntryType | 'all'; label: string; icon: string }[] = [
  { value: 'all', label: '全部', icon: '📖' },
  { value: 'dialogue', label: '对话', icon: '💬' },
  { value: 'story', label: '故事', icon: '📜' },
  { value: 'combat', label: '战斗', icon: '⚔️' },
  { value: 'quest', label: '任务', icon: '🎯' },
  { value: 'discovery', label: '发现', icon: '🔍' },
  { value: 'system', label: '系统', icon: '⚙️' },
];

const TYPE_ICONS: Record<JournalEntryType, string> = {
  story: '📜',
  combat: '⚔️',
  quest: '🎯',
  discovery: '🔍',
  dialogue: '💬',
  system: '⚙️',
};

const TYPE_NAMES: Record<JournalEntryType, string> = {
  story: '故事',
  combat: '战斗',
  quest: '任务',
  discovery: '发现',
  dialogue: '对话',
  system: '系统',
};

const TYPE_COLORS: Record<JournalEntryType, string> = {
  story: '#9C27B0',
  combat: '#F44336',
  quest: '#FF9800',
  discovery: '#4CAF50',
  dialogue: '#2196F3',
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

const getTypeIcon = (type: string): string => {
  return TYPE_ICONS[type as JournalEntryType] || '📄';
};

const getTypeName = (type: string): string => {
  return TYPE_NAMES[type as JournalEntryType] || type;
};

const getTypeColor = (type: string): string => {
  return TYPE_COLORS[type as JournalEntryType] || '#9E9E9E';
};

export const JournalPanel: React.FC = () => {
  const messages = useGameStore((state) => state.messages);
  const character = useGameStore((state) => state.character);
  const journal = useGameStore((state) => state.journal);
  const [typeFilter, setTypeFilter] = useState<JournalEntryType | 'all'>('all');
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [sortByNewest, setSortByNewest] = useState(true);

  const dialogueEntries: JournalEntry[] = useMemo(() => {
    return messages.map((msg, index) => ({
      id: `msg_${index}_${msg.timestamp}`,
      type: 'dialogue' as JournalEntryType,
      title: msg.role === 'user' ? '你的行动' : 
             msg.role === 'narrator' ? '旁白' : 
             msg.role === 'assistant' ? '游戏回应' : msg.role,
      content: msg.content,
      timestamp: msg.timestamp,
    }));
  }, [messages]);

  const allEntries = useMemo(() => {
    const combined = [...journal, ...dialogueEntries];
    return combined.sort((a, b) => 
      sortByNewest ? b.timestamp - a.timestamp : a.timestamp - b.timestamp
    );
  }, [journal, dialogueEntries, sortByNewest]);

  const filteredEntries = useMemo(() => {
    if (typeFilter === 'all') return allEntries;
    return allEntries.filter((entry) => entry.type === typeFilter);
  }, [allEntries, typeFilter]);

  const selectedEntry = allEntries.find((entry) => entry.id === selectedEntryId);

  const stats = useMemo(() => ({
    total: allEntries.length,
    dialogue: allEntries.filter((e) => e.type === 'dialogue').length,
    story: allEntries.filter((e) => e.type === 'story').length,
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
      {/* 统计栏 */}
      <div className={styles.statsBar}>
        <div className={styles.statItem}>
          <span className={styles.statIcon}>💬</span>
          <span className={styles.statLabel}>对话</span>
          <span className={styles.statValue}>{stats.dialogue}</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statIcon}>📜</span>
          <span className={styles.statLabel}>故事</span>
          <span className={styles.statValue}>{stats.story}</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statIcon}>⚙️</span>
          <span className={styles.statLabel}>系统</span>
          <span className={styles.statValue}>{stats.system}</span>
        </div>
      </div>

      {/* 筛选和排序 */}
      <div className={styles.filterBar}>
        {/* 类型筛选 */}
        <div className={styles.filterSection}>
          <span className={styles.filterLabel}>类型筛选</span>
          <div className={styles.filterTabs}>
            {FILTER_OPTIONS.map((option) => (
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

        {/* 排序切换 */}
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

      {/* 日志列表 */}
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
                    style={{ backgroundColor: `${getTypeColor(entry.type)}20` }}
                  >
                    {getTypeIcon(entry.type)}
                  </div>
                  <div className={styles.entryInfo}>
                    <h4 className={styles.entryTitle}>{entry.title}</h4>
                    <div className={styles.entryMeta}>
                      <span
                        className={styles.entryType}
                        style={{ color: getTypeColor(entry.type) }}
                      >
                        {getTypeName(entry.type)}
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

      {/* 日志详情 */}
      {selectedEntry && (
        <div className={styles.entryDetail}>
          <div className={styles.detailHeader}>
            <div 
              className={styles.detailTypeIcon}
              style={{ backgroundColor: `${getTypeColor(selectedEntry.type)}20` }}
            >
              {getTypeIcon(selectedEntry.type)}
            </div>
            <div className={styles.detailTitle}>
              <h4 className={styles.detailName}>{selectedEntry.title}</h4>
              <div className={styles.detailMeta}>
                <span
                  className={styles.detailType}
                  style={{ color: getTypeColor(selectedEntry.type) }}
                >
                  {getTypeName(selectedEntry.type)}
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
              ✕
            </button>
          </div>

          <div className={styles.detailContent}>
            {selectedEntry.content}
          </div>

          {selectedEntry.relatedLocationId && (
            <div className={styles.metadataSection}>
              <h5 className={styles.sectionTitle}>相关信息</h5>
              <div className={styles.metadataList}>
                <div className={styles.metadataItem}>
                  <span className={styles.metadataLabel}>地点</span>
                  <span className={styles.metadataValue}>
                    {selectedEntry.relatedLocationId}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default JournalPanel;
