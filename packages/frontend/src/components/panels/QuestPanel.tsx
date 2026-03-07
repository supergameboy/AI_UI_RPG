import React, { useState, useMemo } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { Button } from '../common';
import type { Quest, QuestType, QuestStatus, QuestObjective } from '@ai-rpg/shared';
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
const OBJECTIVE_TYPE_NAMES: Record<string, string> = {
  kill: '击杀',
  collect: '收集',
  talk: '对话',
  explore: '探索',
  custom: '其他',
};

/**
 * 模拟任务数据（用于演示）
 */
const MOCK_QUESTS: Quest[] = [
  {
    id: 'quest_001',
    name: '村庄的危机',
    description: '村庄附近出现了大量怪物，村长请求你帮助清除威胁。',
    type: 'main',
    status: 'in_progress',
    objectives: [
      { id: 'obj_001', description: '击杀村外的野狼', type: 'kill', target: '野狼', current: 3, required: 5, isCompleted: false },
      { id: 'obj_002', description: '向村长报告', type: 'talk', target: '村长', current: 0, required: 1, isCompleted: false },
    ],
    prerequisites: [],
    rewards: { experience: 100, currency: { gold: 50 } },
    log: [],
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now(),
  },
  {
    id: 'quest_002',
    name: '失落的宝藏',
    description: '据说在古老遗迹中藏有宝藏，有人愿意付高价购买。',
    type: 'side',
    status: 'in_progress',
    objectives: [
      { id: 'obj_003', description: '探索古老遗迹', type: 'explore', target: '古老遗迹', current: 1, required: 1, isCompleted: true },
      { id: 'obj_004', description: '找到宝藏箱', type: 'collect', target: '宝藏箱', current: 0, required: 1, isCompleted: false },
    ],
    prerequisites: [],
    rewards: { experience: 200, currency: { gold: 150 }, items: [{ itemId: 'rare_gem', quantity: 1 }] },
    log: [],
    createdAt: Date.now() - 172800000,
    updatedAt: Date.now(),
  },
  {
    id: 'quest_003',
    name: '每日狩猎',
    description: '完成每日狩猎任务，获得丰厚奖励。',
    type: 'daily',
    status: 'available',
    objectives: [
      { id: 'obj_005', description: '击杀任意怪物', type: 'kill', target: '怪物', current: 0, required: 10, isCompleted: false },
    ],
    prerequisites: [],
    rewards: { experience: 50, currency: { gold: 20 } },
    log: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'quest_004',
    name: '神秘的信件',
    description: '一封神秘信件指引你前往未知之地...',
    type: 'hidden',
    status: 'in_progress',
    objectives: [
      { id: 'obj_006', description: '解读信件内容', type: 'custom', target: '信件', current: 1, required: 1, isCompleted: true },
      { id: 'obj_007', description: '前往信中提到的地点', type: 'explore', target: '未知地点', current: 0, required: 1, isCompleted: false },
    ],
    prerequisites: [],
    rewards: { experience: 500, items: [{ itemId: 'mysterious_artifact', quantity: 1 }] },
    log: [],
    createdAt: Date.now() - 259200000,
    updatedAt: Date.now(),
  },
  {
    id: 'quest_005',
    name: '商人的请求',
    description: '商人需要一些材料来制作装备。',
    type: 'side',
    status: 'completed',
    objectives: [
      { id: 'obj_008', description: '收集铁矿石', type: 'collect', target: '铁矿石', current: 5, required: 5, isCompleted: true },
    ],
    prerequisites: [],
    rewards: { experience: 80, currency: { gold: 30 } },
    log: [],
    createdAt: Date.now() - 345600000,
    updatedAt: Date.now() - 86400000,
  },
];

/**
 * 任务面板组件
 * 显示任务列表、分类筛选、任务详情
 */
export const QuestPanel: React.FC = () => {
  const character = useGameStore((state) => state.character);
  const [typeFilter, setTypeFilter] = useState<QuestType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<QuestStatus | 'all'>('all');
  const [selectedQuestId, setSelectedQuestId] = useState<string | null>(null);

  // 使用模拟数据
  const quests = MOCK_QUESTS;

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
  const handleAcceptQuest = (questId: string) => {
    console.log('接受任务:', questId);
    // TODO: 实现接受任务逻辑
  };

  // 放弃任务
  const handleAbandonQuest = (questId: string) => {
    console.log('放弃任务:', questId);
    // TODO: 实现放弃任务逻辑
    setSelectedQuestId(null);
  };

  // 完成任务
  const handleCompleteQuest = (questId: string) => {
    console.log('完成任务:', questId);
    // TODO: 实现完成任务逻辑
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
