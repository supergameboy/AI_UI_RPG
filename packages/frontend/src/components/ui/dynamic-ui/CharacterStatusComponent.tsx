import React, { useMemo } from 'react';
import type { DynamicUIComponentProps, CharacterStats } from './types';
import styles from './CharacterStatusComponent.module.css';

/**
 * 角色状态面板组件
 * 
 * 解析格式:
 * {name="勇者" level=15 class="战士" health=75/100 mana=50/80 exp=1200/2000}
 * 
 * 示例:
 * :::character-status{name="勇者" level=15 class="战士" title="屠龙者"}
 * health=75/100
 * mana=50/80
 * exp=1200/2000
 * :::
 */
export const CharacterStatusComponent: React.FC<DynamicUIComponentProps> = ({
  content,
  attrs,
}) => {
  // 解析属性
  const stats = useMemo<CharacterStats>(() => {
    // 从 attrs 解析基本属性
    const name = attrs.name || '未知角色';
    const level = parseInt(attrs.level || '1', 10);
    const className = attrs.class || '冒险者';
    const title = attrs.title;
    const avatar = attrs.avatar;

    // 解析生命值
    const healthMatch = content.match(/health=(\d+)\/(\d+)/) || 
                        (attrs.health ? attrs.health.match(/(\d+)\/(\d+)/) : null);
    const health = healthMatch ? {
      current: parseInt(healthMatch[1], 10),
      max: parseInt(healthMatch[2], 10),
    } : { current: 100, max: 100 };

    // 解析魔法值
    const manaMatch = content.match(/mana=(\d+)\/(\d+)/) ||
                      (attrs.mana ? attrs.mana.match(/(\d+)\/(\d+)/) : null);
    const mana = manaMatch ? {
      current: parseInt(manaMatch[1], 10),
      max: parseInt(manaMatch[2], 10),
    } : { current: 50, max: 50 };

    // 解析经验值
    const expMatch = content.match(/exp=(\d+)\/(\d+)/) ||
                     (attrs.exp ? attrs.exp.match(/(\d+)\/(\d+)/) : null);
    const exp = expMatch ? {
      current: parseInt(expMatch[1], 10),
      max: parseInt(expMatch[2], 10),
    } : { current: 0, max: 100 };

    return {
      name,
      level,
      class: className,
      health,
      mana,
      exp,
      avatar,
      title,
    };
  }, [content, attrs]);

  // 计算百分比
  const healthPercent = useMemo(() => {
    return (stats.health.current / stats.health.max) * 100;
  }, [stats.health]);

  const manaPercent = useMemo(() => {
    return (stats.mana.current / stats.mana.max) * 100;
  }, [stats.mana]);

  const expPercent = useMemo(() => {
    return (stats.exp.current / stats.exp.max) * 100;
  }, [stats.exp]);

  // 获取生命值状态
  const getHealthStatus = useMemo(() => {
    if (healthPercent > 60) return 'healthy';
    if (healthPercent > 30) return 'warning';
    return 'critical';
  }, [healthPercent]);

  return (
    <div className={styles.container} role="region" aria-label={`角色状态 - ${stats.name}`}>
      {/* 角色信息头部 */}
      <div className={styles.header}>
        {stats.avatar && (
          <div className={styles.avatar}>
            <img src={stats.avatar} alt={stats.name} />
          </div>
        )}
        <div className={styles.info}>
          <div className={styles.nameRow}>
            <h3 className={styles.name}>{stats.name}</h3>
            {stats.title && <span className={styles.title}>{stats.title}</span>}
          </div>
          <div className={styles.classInfo}>
            <span className={styles.level}>Lv.{stats.level}</span>
            <span className={styles.class}>{stats.class}</span>
          </div>
        </div>
      </div>

      {/* 状态条 */}
      <div className={styles.stats}>
        {/* 生命值 */}
        <div className={styles.statRow}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>
              <span className={styles.statIcon}>❤</span>
              生命值
            </span>
            <span className={styles.statValue}>
              {stats.health.current}/{stats.health.max}
            </span>
          </div>
          <div className={[styles.statBar, styles.healthBar].filter(Boolean).join(' ')}>
            <div
              className={[styles.statFill, styles[getHealthStatus]].filter(Boolean).join(' ')}
              style={{ width: `${healthPercent}%` }}
            />
          </div>
        </div>

        {/* 魔法值 */}
        <div className={styles.statRow}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>
              <span className={styles.statIcon}>💧</span>
              魔法值
            </span>
            <span className={styles.statValue}>
              {stats.mana.current}/{stats.mana.max}
            </span>
          </div>
          <div className={[styles.statBar, styles.manaBar].filter(Boolean).join(' ')}>
            <div
              className={styles.statFill}
              style={{ width: `${manaPercent}%` }}
            />
          </div>
        </div>

        {/* 经验值 */}
        <div className={styles.statRow}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>
              <span className={styles.statIcon}>⭐</span>
              经验值
            </span>
            <span className={styles.statValue}>
              {stats.exp.current}/{stats.exp.max}
            </span>
          </div>
          <div className={[styles.statBar, styles.expBar].filter(Boolean).join(' ')}>
            <div
              className={styles.statFill}
              style={{ width: `${expPercent}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CharacterStatusComponent;
