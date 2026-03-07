import React, { useMemo } from 'react';
import type { DynamicUIComponentProps } from './types';
import styles from './ProgressComponent.module.css';

type ProgressColor = 'primary' | 'success' | 'warning' | 'error' | 'health' | 'mana' | 'stamina' | 'experience';

/**
 * 进度条组件
 * 
 * 解析格式: {value=75 max=100 label="生命值" color="health"}
 * 
 * 示例:
 * :::progress{value=75 max=100 label="生命值" color="health"}
 * :::
 */
export const ProgressComponent: React.FC<DynamicUIComponentProps> = ({
  attrs,
}) => {
  // 解析属性
  const value = useMemo(() => {
    const v = parseFloat(attrs.value || '0');
    return isNaN(v) ? 0 : v;
  }, [attrs.value]);

  const max = useMemo(() => {
    const m = parseFloat(attrs.max || '100');
    return isNaN(m) ? 100 : m;
  }, [attrs.max]);

  const label = attrs.label || '';
  const showValue = attrs.showValue !== 'false';
  const color = (attrs.color as ProgressColor) || 'primary';
  const size = attrs.size || 'medium';
  const animated = attrs.animated === 'true';

  // 计算百分比
  const percentage = useMemo(() => {
    return Math.min(100, Math.max(0, (value / max) * 100));
  }, [value, max]);

  // 显示文本
  const displayText = useMemo(() => {
    if (attrs.text) return attrs.text;
    if (showValue) return `${Math.round(value)}/${max}`;
    return '';
  }, [attrs.text, showValue, value, max]);

  return (
    <div 
      className={[styles.container, styles[size]].filter(Boolean).join(' ')}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label}
    >
      {label && <span className={styles.label}>{label}</span>}
      <div className={styles.track}>
        <div
          className={[
            styles.fill,
            styles[color],
            animated && styles.animated,
          ].filter(Boolean).join(' ')}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {displayText && <span className={styles.text}>{displayText}</span>}
    </div>
  );
};

export default ProgressComponent;
