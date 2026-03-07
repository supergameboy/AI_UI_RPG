import React, { useState, useMemo } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { Button } from '../common';
import type { Quest, QuestType, QuestStatus, QuestObjective, ObjectiveType } from '@ai-rpg/shared';
import styles from './QuestPanel.module.css';

/**
 * 任务类型选项
 */
const TYPE_OPTIONS: { value: QuestType | 'all'; label: string; icon: string }[] = [
  { value: 'all', label: '全部', icon: '📜' },
  { value: 'main', label: '主线', icon: '⭐' },
  { value: 'side', label: '支线', icon: '📖' },
  { value: 'daily', label: '日常', icon: '📅' },
  { value: 'chain', label: '任务链', icon: '🔗' },
  { value: 'hidden', label: '隐藏', icon: '❓' },
];

/**
 * 状态筛选选项
 */
const STATUS_OPTIONS: { value: QuestStatus | 'all'; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'available', label: '可接取' },
  { value: 'in_progress', label: '进行中' },
  { value: 'completed', label: '已完成' },
];

/**
 * 任务类型名称映射
 */
const QUEST_TYPE_NAMES: Record<QuestType, string> = {
  main: '主线',
  side: '支线',
  hidden: '隐藏',
  daily: '日常',
  chain: '任务链',
};

/**
 * 任务状态名称映射
 */
const QUEST_STATUS_NAMES: Record<QuestStatus, string> = {
  locked: '未解锁',
  available: '可接取',
  in_progress: '进行中',
  completed: '已完成',
  failed: '已失败',
};

/**
 * 任务状态颜色映射
 */
const QUEST_STATUS_COLORS: Record<QuestStatus, string> = {
  locked: '#9E9E9E',
  available: '#4CAF50',
  in_progress: '#2196F3',
  completed: '#FF9800',
  failed: '#F44336',
};

/**
 * 目标类型名称映射
 */
const OBJECTIVE_TYPE_NAMES: Record<ObjectiveType, string> = {
  kill: '击杀',
  collect: '收集',
  talk: '对话',
  explore: '探索',
  custom: '其他',
};

/**
 * 任务面板组件
 * 显示任务列表、分类筛选、任务详情
 */
export const QuestPanel: React.FC = () => {
  const quests = useGameStore((state) => state.quests);
  const sendGameAction = useGameStore((state) => state.sendGameAction);
  const [typeFilter, setTypeFilter] = useState<QuestType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<QuestStatus | 'all'>('all');
  const [selectedQuestId, setSelectedQuestId] = useState<string | null>(null);

  // 过滤任务
  const filteredQuests = useMemo(() => {
    return quests.filter((quest) => {
      if (typeFilter !== 'all' && quest.type !== typeFilter) return false;
      if (statusFilter !== 'all' && quest.status !== statusFilter) return false;
      return true;
    });
  }, [quests, typeFilter, statusFilter]);

  // 选中的任务
  const selectedQuest = quests.find((quest) => quest.id === selectedQuestId);

  // 任务统计
  const questStats = useMemo(() => {
    const stats = {
      total: quests.length,
      inProgress: quests.filter((q) => q.status === 'in_progress').length,
      available: quests.filter((q) => q.status === 'available').length,
      completed: quests.filter((q) => q.status === 'completed').length,
    };
    return stats;
  }, [quests]);

  // 计算目标进度
  const getObjectiveProgress = (objective: QuestObjective): number => {
    return Math.min((objective.current / objective.required) * 100, 100);
  };

  // 接受任务
  const handleAcceptQuest = async (questId: string) => {
    await sendGameAction({
      type: 'accept_quest',
      payload: { questId },
    });
  };

  // 放弃任务
  const handleAbandonQuest = async (questId: string) => {
    await sendGameAction({
      type: 'abandon_quest',
      payload: { questId },
    });
    setSelectedQuestId(null);
  };

  // 完成任务
  const handleCompleteQuest = async (questId: string) => {
    await sendGameAction({
      type: 'complete_quest',
      payload: { questId },
    });
  };

  // 格式化奖励
  const formatRewards = (quest: Quest): string[] => {
    const rewards: string[] = [];
    if (quest.rewards.experience) {
      rewards.push(`${quest.rewards.experience} 经验`);
    }
    if (quest.rewards.currency) {
      Object.entries(quest.rewards.currency).forEach(([currency, amount]) => {
        rewards.push(`${amount} ${currency}`);
      });
    }
    if (quest.rewards.items) {
      quest.rewards.items.forEach((item) => {
        rewards.push(`${item.quantity}x ${item.itemId}`);
      });
    }
    return rewards;
  };

  // 处理空数据状态
  if (!quests || quests.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>📜</div>
        <p>暂无任务</p>
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
                  <div className={styles.questTypeIcon}>
                    {TYPE_OPTIONS.find((t) => t.value === quest.type)?.icon || '📜'}
                  </div>
                  <div className={styles.questInfo}>
                    <h4 className={styles.questName}>{quest.name}</h4>
                    <div className={styles.questMeta}>
                      <span
                        className={styles.questStatus}
                        style={{ color: QUEST_STATUS_COLORS[quest.status] }}
                      >
                        {QUEST_STATUS_NAMES[quest.status]}
                      </span>
                      <span className={styles.questType}>
                        {QUEST_TYPE_NAMES[quest.type]}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 目标进度概览 */}
                {quest.status === 'in_progress' && (
                  <div className={styles.objectivesPreview}>
                    {quest.objectives.map((objective) => (
                      <div key={objective.id} className={styles.objectivePreviewItem}>
                        <span className={styles.objectivePreviewText}>
                          {objective.description}
                        </span>
                        <span className={styles.objectivePreviewProgress}>
                          {objective.current}/{objective.required}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 任务详情 */}
      {selectedQuest && (
        <div className={styles.questDetail}>
          <div className={styles.detailHeader}>
            <div className={styles.detailTypeIcon}>
              {TYPE_OPTIONS.find((t) => t.value === selectedQuest.type)?.icon || '📜'}
            </div>
            <div className={styles.detailTitle}>
              <h4 className={styles.detailName}>{selectedQuest.name}</h4>
              <div className={styles.detailMeta}>
                <span
                  className={styles.detailStatus}
                  style={{ color: QUEST_STATUS_COLORS[selectedQuest.status] }}
                >
                  {QUEST_STATUS_NAMES[selectedQuest.status]}
                </span>
                <span className={styles.detailType}>
                  {QUEST_TYPE_NAMES[selectedQuest.type]}
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

          {/* 目标列表 */}
          <div className={styles.objectivesSection}>
            <h5 className={styles.sectionTitle}>任务目标</h5>
            <div className={styles.objectivesList}>
              {selectedQuest.objectives.map((objective) => (
                <div
                  key={objective.id}
                  className={[
                    styles.objectiveItem,
                    objective.isCompleted && styles.objectiveCompleted,
                  ].filter(Boolean).join(' ')}
                >
                  <div className={styles.objectiveHeader}>
                    <span className={styles.objectiveIcon}>
                      {objective.isCompleted ? '✓' : OBJECTIVE_TYPE_NAMES[objective.type]}
                    </span>
                    <span className={styles.objectiveText}>
                      {objective.description}
                    </span>
                  </div>
                  <div className={styles.objectiveProgress}>
                    <div className={styles.objectiveProgressBar}>
                      <div
                        className={styles.objectiveProgressFill}
                        style={{ width: `${getObjectiveProgress(objective)}%` }}
                      />
                    </div>
                    <span className={styles.objectiveProgressText}>
                      {objective.current}/{objective.required}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 奖励预览 */}
          <div className={styles.rewardsSection}>
            <h5 className={styles.sectionTitle}>任务奖励</h5>
            <div className={styles.rewardsList}>
              {formatRewards(selectedQuest).map((reward, index) => (
                <div key={index} className={styles.rewardItem}>
                  <span className={styles.rewardIcon}>🎁</span>
                  <span className={styles.rewardText}>{reward}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 操作按钮 */}
          <div className={styles.detailActions}>
            {selectedQuest.status === 'available' && (
              <Button
                size="small"
                variant="primary"
                fullWidth
                onClick={() => handleAcceptQuest(selectedQuest.id)}
              >
                接受任务
              </Button>
            )}
            {selectedQuest.status === 'in_progress' && (
              <>
                {selectedQuest.objectives.every((obj) => obj.isCompleted) ? (
                  <Button
                    size="small"
                    variant="primary"
                    fullWidth
                    onClick={() => handleCompleteQuest(selectedQuest.id)}
                  >
                    完成任务
                  </Button>
                ) : (
                  <Button
                    size="small"
                    variant="ghost"
                    fullWidth
                    onClick={() => handleAbandonQuest(selectedQuest.id)}
                  >
                    放弃任务
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestPanel;
