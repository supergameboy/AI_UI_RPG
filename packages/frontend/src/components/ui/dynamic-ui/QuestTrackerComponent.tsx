import React, { useMemo, useCallback } from 'react';
import type { DynamicUIComponentProps, Quest, QuestObjective, QuestStatus } from './types';
import styles from './QuestTrackerComponent.module.css';

/**
 * 任务追踪面板组件
 * 
 * 解析格式:
 * {title="当前任务"}
 * 
 * 示例:
 * :::quest-tracker{title="当前任务"}
 * [主线任务：拯救村庄](quest:main-001 status=in_progress priority=main)
 * - [击败哥布林首领](obj:obj-1 current=0 target=1)
 * - [收集草药 x5](obj:obj-2 current=3 target=5)
 * [支线任务：遗失的项链](quest:side-001 status=available priority=side)
 * - [与村长对话](obj:obj-3 current=0 target=1)
 * :::
 */
export const QuestTrackerComponent: React.FC<DynamicUIComponentProps> = ({
  content,
  attrs,
  onAction,
}) => {
  const title = attrs.title || '任务追踪';

  // 解析任务列表
  const quests = useMemo<Quest[]>(() => {
    const result: Quest[] = [];
    const lines = content.split('\n');
    let currentQuest: Quest | null = null;

    for (const line of lines) {
      // 匹配任务行: [任务名](quest:id status=xxx priority=xxx)
      const questMatch = line.match(/\[([^\]]+)\]\(quest:([\w-]+)\s+status=(\w+)(?:\s+priority=(\w+))?\)/);
      if (questMatch) {
        // 保存上一个任务
        if (currentQuest) {
          result.push(currentQuest);
        }
        currentQuest = {
          id: questMatch[2],
          name: questMatch[1],
          status: questMatch[3] as QuestStatus,
          objectives: [],
          priority: questMatch[4] as Quest['priority'] || 'side',
        };
        continue;
      }

      // 匹配目标行: - [目标描述](obj:id current=N target=N)
      const objMatch = line.match(/-\s+\[([^\]]+)\]\(obj:([\w-]+)\s+current=(\d+)\s+target=(\d+)\)/);
      if (objMatch && currentQuest) {
        currentQuest.objectives.push({
          id: objMatch[2],
          description: objMatch[1],
          current: parseInt(objMatch[3], 10),
          target: parseInt(objMatch[4], 10),
          completed: parseInt(objMatch[3], 10) >= parseInt(objMatch[4], 10),
        });
      }
    }

    // 保存最后一个任务
    if (currentQuest) {
      result.push(currentQuest);
    }

    return result;
  }, [content]);

  // 按优先级排序
  const sortedQuests = useMemo(() => {
    const priorityOrder = { main: 0, side: 1, daily: 2 };
    return [...quests].sort((a, b) => {
      const orderA = priorityOrder[a.priority || 'side'] ?? 1;
      const orderB = priorityOrder[b.priority || 'side'] ?? 1;
      return orderA - orderB;
    });
  }, [quests]);

  // 点击任务
  const handleQuestClick = useCallback((quest: Quest) => {
    onAction?.({
      type: 'select-quest',
      payload: { questId: quest.id },
    });
  }, [onAction]);

  // 计算任务进度
  const getQuestProgress = useCallback((objectives: QuestObjective[]) => {
    if (objectives.length === 0) return 0;
    const completed = objectives.filter(o => o.completed).length;
    return (completed / objectives.length) * 100;
  }, []);

  return (
    <div className={styles.container} role="region" aria-label={title}>
      <div className={styles.header}>
        <h3 className={styles.title}>{title}</h3>
        <span className={styles.count}>{quests.length} 个任务</span>
      </div>

      <div className={styles.questList}>
        {sortedQuests.map(quest => (
          <div
            key={quest.id}
            className={[
              styles.questItem,
              styles[quest.status],
              styles[quest.priority || 'side'],
            ].filter(Boolean).join(' ')}
            onClick={() => handleQuestClick(quest)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && handleQuestClick(quest)}
          >
            <div className={styles.questHeader}>
              <span className={styles.priorityBadge}>
                {quest.priority === 'main' ? '主线' : quest.priority === 'daily' ? '日常' : '支线'}
              </span>
              <span className={styles.questName}>{quest.name}</span>
              <span className={styles.statusIcon}>
                {quest.status === 'completed' && '✓'}
                {quest.status === 'failed' && '✗'}
              </span>
            </div>

            {/* 进度条 */}
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ width: `${getQuestProgress(quest.objectives)}%` }}
              />
            </div>

            {/* 目标列表 */}
            {quest.objectives.length > 0 && (
              <ul className={styles.objectiveList}>
                {quest.objectives.map(obj => (
                  <li
                    key={obj.id}
                    className={[styles.objective, obj.completed && styles.completed].filter(Boolean).join(' ')}
                  >
                    <span className={styles.objectiveCheckbox}>
                      {obj.completed ? '☑' : '☐'}
                    </span>
                    <span className={styles.objectiveText}>{obj.description}</span>
                    <span className={styles.objectiveProgress}>
                      {obj.current}/{obj.target}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}

        {quests.length === 0 && (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>📋</span>
            <span className={styles.emptyText}>暂无进行中的任务</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestTrackerComponent;
