import React, { useState, useMemo } from 'react';
import { useGameStore } from '../../stores/gameStore';
import type { QuestState } from '../../stores/gameStore';
import styles from './QuestPanel.module.css';

type QuestStatus = QuestState['status'];
type QuestType = 'main' | 'side' | 'daily' | 'chain' | 'hidden';

const TYPE_OPTIONS: { value: QuestType | 'all'; label: string; icon: string }[] = [
  { value: 'all', label: '全部', icon: '📜' },
  { value: 'main', label: '主线', icon: '⭐' },
  { value: 'side', label: '支线', icon: '📖' },
  { value: 'daily', label: '日常', icon: '📅' },
  { value: 'chain', label: '任务链', icon: '🔗' },
  { value: 'hidden', label: '隐藏', icon: '❓' },
];

const STATUS_OPTIONS: { value: QuestStatus | 'all'; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'available', label: '可接取' },
  { value: 'in_progress', label: '进行中' },
  { value: 'completed', label: '已完成' },
];

const QUEST_STATUS_NAMES: Record<QuestStatus, string> = {
  locked: '未解锁',
  available: '可接取',
  in_progress: '进行中',
  completed: '已完成',
  failed: '已失败',
};

const QUEST_STATUS_COLORS: Record<QuestStatus, string> = {
  locked: '#9E9E9E',
  available: '#4CAF50',
  in_progress: '#2196F3',
  completed: '#FF9800',
  failed: '#F44336',
};

export const QuestPanel: React.FC = () => {
  const character = useGameStore((state) => state.character);
  const quests = useGameStore((state) => state.quests);
  const [typeFilter, setTypeFilter] = useState<QuestType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<QuestStatus | 'all'>('all');
  const [selectedQuestId, setSelectedQuestId] = useState<string | null>(null);

  const filteredQuests = useMemo(() => {
    return quests.filter((quest) => {
      if (statusFilter !== 'all' && quest.status !== statusFilter) return false;
      return true;
    });
  }, [quests, statusFilter]);

  const selectedQuest = quests.find((quest) => quest.id === selectedQuestId);

  const questStats = useMemo(() => {
    return {
      total: quests.length,
      inProgress: quests.filter((q) => q.status === 'in_progress').length,
      available: quests.filter((q) => q.status === 'available').length,
      completed: quests.filter((q) => q.status === 'completed').length,
    };
  }, [quests]);

  if (!character.id) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>📜</div>
        <p>暂无任务数据</p>
        <p className={styles.emptyHint}>创建角色后查看任务</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* 任务统计 */}
      <div className={styles.statsBar}>
        <div className={styles.statItem}>
          <span className={styles.statIcon}>📋</span>
          <span className={styles.statLabel}>进行中</span>
          <span className={styles.statValue}>{questStats.inProgress}</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statIcon}>✅</span>
          <span className={styles.statLabel}>可接取</span>
          <span className={styles.statValue}>{questStats.available}</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statIcon}>🏆</span>
          <span className={styles.statLabel}>已完成</span>
          <span className={styles.statValue}>{questStats.completed}</span>
        </div>
      </div>

      {/* 筛选器 */}
      <div className={styles.filterBar}>
        {/* 类型筛选 */}
        <div className={styles.filterSection}>
          <span className={styles.filterLabel}>类型</span>
          <div className={styles.filterTabs}>
            {TYPE_OPTIONS.map((option) => (
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

        {/* 状态筛选 */}
        <div className={styles.filterSection}>
          <span className={styles.filterLabel}>状态</span>
          <div className={styles.filterTabs}>
            {STATUS_OPTIONS.map((option) => (
              <button
                key={option.value}
                className={[
                  styles.filterTab,
                  statusFilter === option.value && styles.filterTabActive,
                ].filter(Boolean).join(' ')}
                onClick={() => setStatusFilter(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 任务列表 */}
      <div className={styles.questsContainer}>
        {filteredQuests.length === 0 ? (
          <div className={styles.noQuests}>
            <span className={styles.noQuestsIcon}>📜</span>
            <p>没有符合条件的任务</p>
          </div>
        ) : (
          <div className={styles.questsList}>
            {filteredQuests.map((quest) => (
              <div
                key={quest.id}
                className={[
                  styles.questCard,
                  selectedQuestId === quest.id && styles.questCardSelected,
                ].filter(Boolean).join(' ')}
                onClick={() => setSelectedQuestId(quest.id)}
              >
                <div className={styles.questHeader}>
                  <div className={styles.questTypeIcon}>📜</div>
                  <div className={styles.questInfo}>
                    <h4 className={styles.questName}>{quest.name}</h4>
                    <div className={styles.questMeta}>
                      <span
                        className={styles.questStatus}
                        style={{ color: QUEST_STATUS_COLORS[quest.status] }}
                      >
                        {QUEST_STATUS_NAMES[quest.status]}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 任务详情 */}
      {selectedQuest && (
        <div className={styles.questDetail}>
          <div className={styles.detailHeader}>
            <div className={styles.detailTypeIcon}>📜</div>
            <div className={styles.detailTitle}>
              <h4 className={styles.detailName}>{selectedQuest.name}</h4>
              <div className={styles.detailMeta}>
                <span
                  className={styles.detailStatus}
                  style={{ color: QUEST_STATUS_COLORS[selectedQuest.status] }}
                >
                  {QUEST_STATUS_NAMES[selectedQuest.status]}
                </span>
              </div>
            </div>
            <button
              className={styles.closeDetail}
              onClick={() => setSelectedQuestId(null)}
            >
              ✕
            </button>
          </div>

          <p className={styles.detailDescription}>{selectedQuest.description}</p>
        </div>
      )}
    </div>
  );
};

export default QuestPanel;
