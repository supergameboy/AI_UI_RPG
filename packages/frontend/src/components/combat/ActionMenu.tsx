import React, { useState } from 'react';
import { ActionType, type CombatUnit } from '@ai-rpg/shared';
import type { Skill } from '@ai-rpg/shared';
import type { InventoryItem } from '@ai-rpg/shared';
import styles from './ActionMenu.module.css';

/**
 * 行动菜单组件属性
 */
export interface ActionMenuProps {
  onAction: (action: ActionType, targetId?: string, skillId?: string, itemId?: string) => void;
  skills: Skill[];
  items: InventoryItem[];
  isPlayerTurn: boolean;
  targetMode: boolean;
  availableTargets: CombatUnit[];
}

/**
 * 行动类型标签映射
 */
const ACTION_LABELS: Record<ActionType, string> = {
  [ActionType.ATTACK]: '攻击',
  [ActionType.SKILL]: '技能',
  [ActionType.ITEM]: '物品',
  [ActionType.DEFEND]: '防御',
  [ActionType.FLEE]: '逃跑',
};

/**
 * 行动类型图标映射
 */
const ACTION_ICONS: Record<ActionType, string> = {
  [ActionType.ATTACK]: '⚔️',
  [ActionType.SKILL]: '✨',
  [ActionType.ITEM]: '🎒',
  [ActionType.DEFEND]: '🛡️',
  [ActionType.FLEE]: '🏃',
};

/**
 * 行动菜单组件
 * 玩家行动菜单，包括攻击、技能、物品、防御、逃跑等选项
 */
export const ActionMenu: React.FC<ActionMenuProps> = ({
  onAction,
  skills,
  items,
  isPlayerTurn,
  targetMode,
  availableTargets,
}) => {
  const [showSkillList, setShowSkillList] = useState(false);
  const [showItemList, setShowItemList] = useState(false);

  const handleAction = (action: ActionType) => {
    if (action === ActionType.SKILL) {
      setShowSkillList(!showSkillList);
      setShowItemList(false);
    } else if (action === ActionType.ITEM) {
      setShowItemList(!showItemList);
      setShowSkillList(false);
    } else {
      setShowSkillList(false);
      setShowItemList(false);
      onAction(action);
    }
  };

  const handleSkillSelect = (skillId: string) => {
    setShowSkillList(false);
    onAction(ActionType.SKILL, undefined, skillId);
  };

  const handleItemSelect = (itemId: string) => {
    setShowItemList(false);
    onAction(ActionType.ITEM, undefined, undefined, itemId);
  };

  const handleTargetSelect = (targetId: string) => {
    onAction(ActionType.ATTACK, targetId);
  };

  // 目标选择模式
  if (targetMode) {
    return (
      <div className={styles.container}>
        <div className={styles.targetModeHeader}>
          <span className={styles.targetModeIcon}>🎯</span>
          <span>选择目标</span>
        </div>
        <div className={styles.targetList}>
          {availableTargets
            .filter((unit) => unit.isAlive && unit.type === 'enemy')
            .map((target) => (
              <button
                key={target.id}
                className={styles.targetButton}
                onClick={() => handleTargetSelect(target.id)}
              >
                <span className={styles.targetName}>{target.name}</span>
                <span className={styles.targetHp}>
                  HP: {target.stats.currentHp}/{target.stats.maxHp}
                </span>
              </button>
            ))}
        </div>
        <button
          className={styles.cancelButton}
          onClick={() => onAction(ActionType.ATTACK)}
        >
          取消
        </button>
      </div>
    );
  }

  // 非玩家回合时禁用菜单
  if (!isPlayerTurn) {
    return (
      <div className={styles.container}>
        <div className={styles.disabledMessage}>
          <span className={styles.disabledIcon}>⏳</span>
          <span>等待敌方行动...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* 主行动按钮 */}
      <div className={styles.actionButtons}>
        {(Object.keys(ACTION_LABELS) as ActionType[]).map((action) => {
          const isDisabled =
            (action === ActionType.SKILL && skills.length === 0) ||
            (action === ActionType.ITEM && items.length === 0);

          return (
            <button
              key={action}
              className={`${styles.actionButton} ${styles[action]}`}
              onClick={() => handleAction(action)}
              disabled={isDisabled}
            >
              <span className={styles.actionIcon}>{ACTION_ICONS[action]}</span>
              <span className={styles.actionLabel}>{ACTION_LABELS[action]}</span>
            </button>
          );
        })}
      </div>

      {/* 技能列表 */}
      {showSkillList && (
        <div className={styles.subMenu}>
          <div className={styles.subMenuHeader}>
            <span>选择技能</span>
            <button
              className={styles.closeButton}
              onClick={() => setShowSkillList(false)}
            >
              ✕
            </button>
          </div>
          <div className={styles.skillList}>
            {skills.map((skill) => (
              <button
                key={skill.id}
                className={styles.skillButton}
                onClick={() => handleSkillSelect(skill.id)}
              >
                <div className={styles.skillInfo}>
                  <span className={styles.skillName}>{skill.name}</span>
                  <span className={styles.skillLevel}>Lv.{skill.level}</span>
                </div>
                <div className={styles.skillCost}>
                  {skill.cost.type === 'mp' && (
                    <span className={styles.mpCost}>💧{skill.cost.value}</span>
                  )}
                  {skill.cost.type === 'hp' && (
                    <span className={styles.hpCost}>❤️{skill.cost.value}</span>
                  )}
                </div>
                <div className={styles.skillDesc}>{skill.description}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 物品列表 */}
      {showItemList && (
        <div className={styles.subMenu}>
          <div className={styles.subMenuHeader}>
            <span>选择物品</span>
            <button
              className={styles.closeButton}
              onClick={() => setShowItemList(false)}
            >
              ✕
            </button>
          </div>
          <div className={styles.itemList}>
            {items.map((item) => (
              <button
                key={item.id}
                className={styles.itemButton}
                onClick={() => handleItemSelect(item.id)}
              >
                <div className={styles.itemInfo}>
                  <span className={styles.itemName}>物品 #{item.itemId}</span>
                  <span className={styles.itemQuantity}>x{item.quantity}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ActionMenu;
