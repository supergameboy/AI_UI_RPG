import React, { useMemo } from 'react';
import type { DynamicUIComponentProps, BadgeType } from './types';
import styles from './BadgeComponent.module.css';

/**
 * 徽章组件
 * 
 * 解析格式: {type=rarity color=gold}
 * 
 * 示例:
 * :::badge{type=rarity color=legendary}
 * 传说
 * :::
 * 
 * :::badge{type=status color=active}
 * 激活
 * :::
 */
export const BadgeComponent: React.FC<DynamicUIComponentProps> = ({
  content,
  attrs,
}) => {
  const type = (attrs.type as BadgeType) || 'custom';
  const color = attrs.color || 'default';
  const size = attrs.size || 'medium';
  const icon = attrs.icon || '';

  // 获取稀有度颜色
  const rarityColor = useMemo(() => {
    switch (color) {
      case 'common':
        return 'common';
      case 'uncommon':
        return 'uncommon';
      case 'rare':
        return 'rare';
      case 'epic':
        return 'epic';
      case 'legendary':
        return 'legendary';
      case 'mythic':
        return 'mythic';
      default:
        return color;
    }
  }, [color]);

  return (
    <span
      className={[
        styles.badge,
        styles[type],
        styles[rarityColor],
        styles[size],
      ].filter(Boolean).join(' ')}
      role="status"
      aria-label={content.trim()}
    >
      {icon && <span className={styles.icon}>{icon}</span>}
      <span className={styles.text}>{content.trim()}</span>
    </span>
  );
};

export default BadgeComponent;
