import React, { useState, useMemo } from 'react';
import { useGameStore } from '../../stores/gameStore';
import styles from './JournalPanel.module.css';

/**
 * 日志条目类型
 */
export type JournalEntryType = 'dialogue' | 'event' | 'system';

/**
 * 日志条目接口
 */
export interface JournalEntry {
  id: string;
  type: JournalEntryType;
  title: string;
  content: string;
  timestamp: number;
  metadata?: {
    location?: string;
    npcName?: string;
    questId?: string;
    itemId?: string;
  };
}

/**
 * 筛选选项
 */
const FILTER_OPTIONS: { value: JournalEntryType | 'all'; label: string; icon: string }[] = [
  { value: 'all', label: '全部', icon: '📖' },
  { value: 'dialogue', label: '对话', icon: '💬' },
  { value: 'event', label: '事件', icon: '⚡' },
  { value: 'system', label: '系统', icon: '⚙️' },
];

/**
 * 类型图标映射
 */
const TYPE_ICONS: Record<JournalEntryType, string> = {
  dialogue: '💬',
  event: '⚡',
  system: '⚙️',
};

/**
 * 类型名称映射
 */
const TYPE_NAMES: Record<JournalEntryType, string> = {
  dialogue: '对话',
  event: '事件',
  system: '系统',
};

/**
 * 类型颜色映射
 */
const TYPE_COLORS: Record<JournalEntryType, string> = {
  dialogue: '#2196F3',
  event: '#FF9800',
  system: '#9E9E9E',
};

/**
 * 格式化时间戳
 */
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

/**
 * 格式化完整时间
 */
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

/**
 * 模拟事件数据（用于演示）
 */
const MOCK_JOURNAL_ENTRIES: JournalEntry[] = [
  {
    id: 'journal_001',
    type: 'event',
    title: '任务完成：村庄的危机',
    content: '你成功帮助村长清除了村庄附近的野狼威胁，获得了村民的感激。',
    timestamp: Date.now() - 3600000,
    metadata: { questId: 'quest_001', location: '新手村' },
  },
  {
    id: 'journal_002',
    type: 'event',
    title: 'NPC相遇：神秘商人',
    content: '在古老遗迹中，你遇到了一位神秘的商人，他似乎知道一些关于宝藏的秘密。',
    timestamp: Date.now() - 7200000,
    metadata: { npcName: '神秘商人', location: '古老遗迹' },
  },
  {
    id: 'journal_003',
    type: 'system',
    title: '等级提升',
    content: '恭喜！你的角色等级提升到了 5 级，获得了新的技能点。',
    timestamp: Date.now() - 10800000,
  },
  {
    id: 'journal_004',
    type: 'event',
    title: '获得物品：神秘钥匙',
    content: '你在宝箱中发现了一把神秘的钥匙，似乎可以打开某扇隐藏的门。',
    timestamp: Date.now() - 14400000,
    metadata: { itemId: 'mysterious_key', location: '古老遗迹' },
  },
  {
    id: 'journal_005',
    type: 'system',
    title: '成就解锁：初次探索',
    content: '你完成了第一次探索，解锁了"初次探索"成就。',
    timestamp: Date.now() - 18000000,
  },
];

/**
 * 记录面板组件
 * 显示对话历史和重要事件记录
 */
export const JournalPanel: React.FC = () => {
  const messages = useGameStore((state) => state.messages);
  const character = useGameStore((state) => state.character);
  const [typeFilter, setTypeFilter] = useState<JournalEntryType | 'all'>('all');
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [sortByNewest, setSortByNewest] = useState(true);

  // 将消息转换为日志条目格式
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

  // 合并所有日志条目（对话 + 事件）
  const allEntries = useMemo(() => {
    const combined = [...MOCK_JOURNAL_ENTRIES, ...dialogueEntries];
    return combined.sort((a, b) => 
      sortByNewest ? b.timestamp - a.timestamp : a.timestamp - b.timestamp
    );
  }, [dialogueEntries, sortByNewest]);

  // 过滤日志条目
  const filteredEntries = useMemo(() => {
    if (typeFilter === 'all') return allEntries;
    return allEntries.filter((entry) => entry.type === typeFilter);
  }, [allEntries, typeFilter]);

  // 选中的条目
  const selectedEntry = allEntries.find((entry) => entry.id === selectedEntryId);

  // 统计信息
  const stats = useMemo(() => ({
    total: allEntries.length,
    dialogue: allEntries.filter((e) => e.type === 'dialogue').length,
    event: allEntries.filter((e) => e.type === 'event').length,
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
          <span className={styles.statIcon}>⚡</span>
          <span className={styles.statLabel}>事件</span>
          <span className={styles.statValue}>{stats.event}</span>
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
                    style={{ backgroundColor: `${TYPE_COLORS[entry.type]}20` }}
                  >
                    {TYPE_ICONS[entry.type]}
                  </div>
                  <div className={styles.entryInfo}>
                    <h4 className={styles.entryTitle}>{entry.title}</h4>
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

      {/* 日志详情 */}
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
              <h4 className={styles.detailName}>{selectedEntry.title}</h4>
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
              ✕
            </button>
          </div>

          <div className={styles.detailContent}>
            {selectedEntry.content}
          </div>

          {/* 元数据 */}
          {selectedEntry.metadata && (
            <div className={styles.metadataSection}>
              <h5 className={styles.sectionTitle}>相关信息</h5>
              <div className={styles.metadataList}>
                {selectedEntry.metadata.location && (
                  <div className={styles.metadataItem}>
                    <span className={styles.metadataLabel}>地点</span>
                    <span className={styles.metadataValue}>
                      {selectedEntry.metadata.location}
                    </span>
                  </div>
                )}
                {selectedEntry.metadata.npcName && (
                  <div className={styles.metadataItem}>
                    <span className={styles.metadataLabel}>NPC</span>
                    <span className={styles.metadataValue}>
                      {selectedEntry.metadata.npcName}
                    </span>
                  </div>
                )}
                {selectedEntry.metadata.questId && (
                  <div className={styles.metadataItem}>
                    <span className={styles.metadataLabel}>任务</span>
                    <span className={styles.metadataValue}>
                      {selectedEntry.metadata.questId}
                    </span>
                  </div>
                )}
                {selectedEntry.metadata.itemId && (
                  <div className={styles.metadataItem}>
                    <span className={styles.metadataLabel}>物品</span>
                    <span className={styles.metadataValue}>
                      {selectedEntry.metadata.itemId}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default JournalPanel;
