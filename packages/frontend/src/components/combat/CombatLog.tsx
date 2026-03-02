import React, { useEffect, useRef } from 'react';
import type { CombatAction, ActionType } from '@ai-rpg/shared';
import styles from './CombatLog.module.css';

/**
 * 战斗日志组件属性
 */
export interface CombatLogProps {
  messages: CombatAction[];
}

/**
 * 行动类型颜色映射
 */
const ACTION_TYPE_COLORS: Record<ActionType, string> = {
  attack: 'damage',
  skill: 'skill',
  item: 'heal',
  defend: 'system',
  flee: 'system',
};

/**
 * 获取消息类型样式
 */
const getMessageType = (action: CombatAction): string => {
  if (action.damage && action.damage > 0) {
    return 'damage';
  }
  if (action.healing && action.healing > 0) {
    return 'heal';
  }
  return ACTION_TYPE_COLORS[action.type] || 'system';
};

/**
 * 格式化时间戳
 */
const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

/**
 * 战斗日志组件
 * 显示战斗中的行动消息，支持自动滚动到最新消息
 */
export const CombatLog: React.FC<CombatLogProps> = ({ messages }) => {
  const logEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 自动滚动到最新消息
  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.headerIcon}>📜</span>
        <span className={styles.headerTitle}>战斗日志</span>
        <span className={styles.messageCount}>{messages.length} 条记录</span>
      </div>
      <div ref={containerRef} className={styles.logList}>
        {messages.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>⚔️</span>
            <span>战斗尚未开始</span>
          </div>
        ) : (
          messages.map((action) => {
            const messageType = getMessageType(action);
            return (
              <div
                key={action.id}
                className={`${styles.logEntry} ${styles[messageType]}`}
              >
                <span className={styles.timestamp}>
                  {formatTime(action.timestamp)}
                </span>
                <span className={styles.message}>{action.message}</span>
                {action.damage !== undefined && action.damage > 0 && (
                  <span className={styles.damageValue}>
                    -{action.damage} HP
                  </span>
                )}
                {action.healing !== undefined && action.healing > 0 && (
                  <span className={styles.healValue}>
                    +{action.healing} HP
                  </span>
                )}
                {!action.success && (
                  <span className={styles.failedBadge}>失败</span>
                )}
              </div>
            );
          })
        )}
        <div ref={logEndRef} />
      </div>
    </div>
  );
};

export default CombatLog;
