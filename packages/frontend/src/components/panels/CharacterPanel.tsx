import React from 'react';
import { useGameStore } from '../../stores/gameStore';
import { ProgressBar } from '../common';
import styles from './CharacterPanel.module.css';

/**
 * 属性名称映射
 */
const ATTRIBUTE_NAMES: Record<string, string> = {
  strength: '力量',
  dexterity: '敏捷',
  constitution: '体质',
  intelligence: '智力',
  wisdom: '感知',
  charisma: '魅力',
};

/**
 * 属性图标映射
 */
const ATTRIBUTE_ICONS: Record<string, string> = {
  strength: '💪',
  dexterity: '🎯',
  constitution: '❤️',
  intelligence: '🧠',
  wisdom: '👁️',
  charisma: '✨',
};

/**
 * 角色面板组件
 * 显示角色基础属性、派生属性、等级和经验值
 */
export const CharacterPanel: React.FC = () => {
  const character = useGameStore((state) => state.character);

  // 计算经验值进度（假设每级需要 level * 100 经验）
  const expForNextLevel = character.experienceToLevel ?? character.level * 100;
  const currentExp = character.experience ?? 0;
  const expProgress = (currentExp / expForNextLevel) * 100;

  // 获取基础属性列表
  const baseAttributes = Object.entries(character.attributes)
    .filter(([key]) => ATTRIBUTE_NAMES[key])
    .sort(([a], [b]) => {
      const order = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
      return order.indexOf(a) - order.indexOf(b);
    });

  // 计算派生属性（基于基础属性估算）
  const derivedStats = [
    { name: '攻击力', value: Math.floor((character.attributes.strength || 10) * 1.5 + character.level * 2), icon: '⚔️' },
    { name: '防御力', value: Math.floor((character.attributes.constitution || 10) * 1.2 + character.level), icon: '🛡️' },
    { name: '速度', value: Math.floor((character.attributes.dexterity || 10) * 0.8 + 5), icon: '💨' },
    { name: '暴击率', value: Math.floor((character.attributes.dexterity || 10) * 0.5), unit: '%', icon: '💥' },
    { name: '闪避率', value: Math.floor((character.attributes.dexterity || 10) * 0.3), unit: '%', icon: '🌀' },
    { name: '魔法攻击', value: Math.floor((character.attributes.intelligence || 10) * 1.5 + character.level), icon: '🔮' },
  ];

  if (!character.id) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>👤</div>
        <p>暂无角色数据</p>
        <p className={styles.emptyHint}>创建角色后查看详细信息</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* 角色头部信息 */}
      <div className={styles.header}>
        <div className={styles.avatar}>
          <span className={styles.avatarIcon}>👤</span>
        </div>
        <div className={styles.info}>
          <h2 className={styles.name}>{character.name}</h2>
          <div className={styles.meta}>
            <span className={styles.race}>{character.race}</span>
            <span className={styles.separator}>·</span>
            <span className={styles.class}>{character.class}</span>
          </div>
        </div>
        <div className={styles.level}>
          <span className={styles.levelLabel}>Lv.</span>
          <span className={styles.levelValue}>{character.level}</span>
        </div>
      </div>

      {/* 经验值进度 */}
      <div className={styles.expSection}>
        <div className={styles.expHeader}>
          <span className={styles.expLabel}>经验值</span>
          <span className={styles.expValue}>{currentExp} / {expForNextLevel}</span>
        </div>
        <ProgressBar
          value={expProgress}
          max={100}
          color="primary"
          size="small"
          animated
        />
      </div>

      {/* HP 和 MP */}
      <div className={styles.vitalsSection}>
        <div className={styles.vital}>
          <div className={styles.vitalHeader}>
            <span className={styles.vitalIcon}>❤️</span>
            <span className={styles.vitalLabel}>生命值</span>
            <span className={styles.vitalValue}>
              {character.health} / {character.maxHealth}
            </span>
          </div>
          <ProgressBar
            value={character.health}
            max={character.maxHealth}
            color="health"
            size="medium"
          />
        </div>
        <div className={styles.vital}>
          <div className={styles.vitalHeader}>
            <span className={styles.vitalIcon}>💧</span>
            <span className={styles.vitalLabel}>魔法值</span>
            <span className={styles.vitalValue}>
              {character.mana} / {character.maxMana}
            </span>
          </div>
          <ProgressBar
            value={character.mana}
            max={character.maxMana}
            color="mana"
            size="medium"
          />
        </div>
      </div>

      {/* 基础属性 */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>基础属性</h3>
        <div className={styles.attributesGrid}>
          {baseAttributes.map(([key, value]) => (
            <div key={key} className={styles.attributeItem}>
              <span className={styles.attributeIcon}>
                {ATTRIBUTE_ICONS[key] || '📊'}
              </span>
              <div className={styles.attributeInfo}>
                <span className={styles.attributeName}>
                  {ATTRIBUTE_NAMES[key] || key}
                </span>
                <span className={styles.attributeValue}>{value}</span>
              </div>
              <div className={styles.attributeBar}>
                <div
                  className={styles.attributeBarFill}
                  style={{ width: `${Math.min(100, (value / 20) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 派生属性 */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>派生属性</h3>
        <div className={styles.derivedGrid}>
          {derivedStats.map((stat) => (
            <div key={stat.name} className={styles.derivedItem}>
              <span className={styles.derivedIcon}>{stat.icon}</span>
              <span className={styles.derivedName}>{stat.name}</span>
              <span className={styles.derivedValue}>
                {stat.value}{stat.unit || ''}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 状态效果占位 */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>状态效果</h3>
        <div className={styles.statusEmpty}>
          <span className={styles.statusEmptyIcon}>✓</span>
          <span>无状态效果</span>
        </div>
      </div>
    </div>
  );
};

export default CharacterPanel;
