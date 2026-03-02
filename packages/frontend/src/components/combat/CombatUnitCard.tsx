import React from 'react';
import type { CombatUnit, StatusEffect } from '@ai-rpg/shared';
import { ProgressBar } from '../common';
import styles from './CombatUnitCard.module.css';

/**
 * 单位类型图标映射
 */
const UNIT_TYPE_ICONS: Record<string, string> = {
  player: '👤',
  ally: '🤝',
  enemy: '👹',
};

/**
 * 状态效果图标映射
 */
const STATUS_EFFECT_ICONS: Record<string, string> = {
  poison: '☠️',
  burn: '🔥',
  freeze: '❄️',
  stun: '💫',
  slow: '🐌',
  haste: '⚡',
  shield: '🛡️',
  regeneration: '💚',
  strength: '💪',
  weakness: '📉',
  blind: '👁️‍🗨️',
  silence: '🔇',
};

/**
 * 战斗单位卡片组件属性
 */
export interface CombatUnitCardProps {
  unit: CombatUnit;
  isCurrentTurn: boolean;
  isTargetable: boolean;
  onSelect?: () => void;
}

/**
 * 获取状态效果图标
 */
const getStatusEffectIcon = (effect: StatusEffect): string => {
  return STATUS_EFFECT_ICONS[effect.type] || STATUS_EFFECT_ICONS[effect.name.toLowerCase()] || '✨';
};

/**
 * 战斗单位卡片组件
 * 显示单个战斗单位的信息，包括名称、等级、HP/MP进度条、状态效果等
 */
export const CombatUnitCard: React.FC<CombatUnitCardProps> = ({
  unit,
  isCurrentTurn,
  isTargetable,
  onSelect,
}) => {
  const hpPercentage = (unit.stats.currentHp / unit.stats.maxHp) * 100;

  const cardClassName = [
    styles.card,
    isCurrentTurn && styles.currentTurn,
    isTargetable && styles.targetable,
    !unit.isAlive && styles.dead,
    unit.type === 'enemy' && styles.enemy,
    unit.type === 'player' && styles.player,
    unit.type === 'ally' && styles.ally,
  ].filter(Boolean).join(' ');

  const handleClick = () => {
    if (isTargetable && unit.isAlive && onSelect) {
      onSelect();
    }
  };

  return (
    <div
      className={cardClassName}
      onClick={handleClick}
      role={isTargetable ? 'button' : undefined}
      tabIndex={isTargetable ? 0 : undefined}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && isTargetable) {
          handleClick();
        }
      }}
    >
      {/* 单位头部信息 */}
      <div className={styles.header}>
        <div className={styles.typeIcon}>
          {UNIT_TYPE_ICONS[unit.type] || '❓'}
        </div>
        <div className={styles.info}>
          <h3 className={styles.name}>{unit.name}</h3>
          <div className={styles.meta}>
            <span className={styles.level}>Lv.{unit.level}</span>
            {unit.isDefending && <span className={styles.defending}>🛡️</span>}
          </div>
        </div>
      </div>

      {/* HP进度条 */}
      <div className={styles.statBar}>
        <div className={styles.statHeader}>
          <span className={styles.statLabel}>HP</span>
          <span className={styles.statValue}>
            {unit.stats.currentHp} / {unit.stats.maxHp}
          </span>
        </div>
        <ProgressBar
          value={unit.stats.currentHp}
          max={unit.stats.maxHp}
          color="health"
          size="small"
        />
        {hpPercentage <= 25 && hpPercentage > 0 && (
          <span className={styles.lowHealthWarning}>⚠️</span>
        )}
      </div>

      {/* MP进度条 */}
      <div className={styles.statBar}>
        <div className={styles.statHeader}>
          <span className={styles.statLabel}>MP</span>
          <span className={styles.statValue}>
            {unit.stats.currentMp} / {unit.stats.maxMp}
          </span>
        </div>
        <ProgressBar
          value={unit.stats.currentMp}
          max={unit.stats.maxMp}
          color="mana"
          size="small"
        />
      </div>

      {/* 状态效果 */}
      {unit.statusEffects.length > 0 && (
        <div className={styles.statusEffects}>
          {unit.statusEffects.map((effect) => (
            <div
              key={effect.id}
              className={`${styles.statusEffect} ${styles[effect.type]}`}
              title={`${effect.name} (${effect.remainingTurns}回合)`}
            >
              <span className={styles.statusIcon}>{getStatusEffectIcon(effect)}</span>
              <span className={styles.statusDuration}>{effect.remainingTurns}</span>
            </div>
          ))}
        </div>
      )}

      {/* 死亡标记 */}
      {!unit.isAlive && (
        <div className={styles.deadOverlay}>
          <span className={styles.deadText}>战败</span>
        </div>
      )}

      {/* 当前回合指示器 */}
      {isCurrentTurn && (
        <div className={styles.turnIndicator}>
          <span className={styles.turnArrow}>▶</span>
        </div>
      )}
    </div>
  );
};

export default CombatUnitCard;
