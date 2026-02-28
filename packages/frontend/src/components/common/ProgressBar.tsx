import React from 'react';
import styles from './ProgressBar.module.css';

export type ProgressBarColor = 'primary' | 'success' | 'warning' | 'error' | 'health' | 'mana';

export interface ProgressBarProps {
  value: number;
  max?: number;
  color?: ProgressBarColor;
  showText?: boolean;
  text?: string;
  size?: 'small' | 'medium' | 'large';
  animated?: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  color = 'primary',
  showText = false,
  text,
  size = 'medium',
  animated = false,
  className,
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const displayText = text || `${Math.round(value)}/${max}`;

  return (
    <div className={[styles.container, styles[size], className].filter(Boolean).join(' ')}>
      <div className={styles.track}>
        <div 
          className={[styles.fill, styles[color], animated && styles.animated].filter(Boolean).join(' ')}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showText && <span className={styles.text}>{displayText}</span>}
    </div>
  );
};
