import React from 'react';
import type { CombatUnit, CombatUnitType } from '@ai-rpg/shared';
import styles from './TurnOrder.module.css';

/**
 * 回合顺序组件属性
 */
export interface TurnOrderProps {
  turnOrder: string[];
  units: CombatUnit[];
  currentIndex: number;
}

/**
 * 单位类型图标映射
 */
const UNIT_TYPE_ICONS: Record<CombatUnitType, string> = {
  player: '👤',
  ally: '🤝',
  enemy: '👹',
};

/**
 * 获取单位类型颜色类名
 */
const getUnitTypeClass = (type: CombatUnitType): string => {
  return styles[type];
};

/**
 * 回合顺序组件
 * 水平显示战斗单位的行动顺序
 */
export const TurnOrder: React.FC<TurnOrderProps> = ({
  turnOrder,
  units,
  currentIndex,
}) => {
  // 创建单位ID到单位的映射
  const unitMap = new Map<string, CombatUnit>();
  units.forEach((unit) => {
    unitMap.set(unit.id, unit);
  });

  // 获取显示的回合顺序（当前回合前后各显示若干个）
  const displayCount = 8;
  const startIndex = Math.max(0, currentIndex - 2);
  const endIndex = Math.min(turnOrder.length, startIndex + displayCount);
  const visibleTurnOrder = turnOrder.slice(startIndex, endIndex);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.headerIcon}>⏱️</span>
        <span className={styles.headerTitle}>行动顺序</span>
        <span className={styles.turnInfo}>
          回合 {currentIndex + 1} / {turnOrder.length}
        </span>
      </div>
      <div className={styles.orderList}>
        {visibleTurnOrder.map((unitId, index) => {
          const unit = unitMap.get(unitId);
          const actualIndex = startIndex + index;
          const isCurrentTurn = actualIndex === currentIndex;
          const isPast = actualIndex < currentIndex;

          if (!unit) {
            return (
              <div
                key={`${unitId}-${actualIndex}`}
                className={`${styles.unitSlot} ${styles.unknown}`}
              >
                <span className={styles.unitIcon}>❓</span>
              </div>
            );
          }

          return (
            <div
              key={`${unitId}-${actualIndex}`}
              className={`${styles.unitSlot} ${getUnitTypeClass(unit.type)} ${
                isCurrentTurn ? styles.current : ''
              } ${isPast ? styles.past : ''} ${!unit.isAlive ? styles.dead : ''}`}
              title={`${unit.name} (Lv.${unit.level})`}
            >
              {isCurrentTurn && <div className={styles.currentIndicator} />}
              <span className={styles.unitIcon}>
                {UNIT_TYPE_ICONS[unit.type]}
              </span>
              <span className={styles.unitName}>{unit.name}</span>
              {!unit.isAlive && <span className={styles.deadBadge}>✕</span>}
            </div>
          );
        })}
      </div>
      {turnOrder.length > displayCount && (
        <div className={styles.moreIndicator}>
          {turnOrder.length - endIndex > 0 && (
            <span>+{turnOrder.length - endIndex} 更多</span>
          )}
        </div>
      )}
    </div>
  );
};

export default TurnOrder;
