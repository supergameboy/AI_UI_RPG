import React from 'react';
import styles from './ProgressComponent.module.css';
import type { ExtensionComponentProps } from './types';

interface ProgressComponentProps extends ExtensionComponentProps {
  value?: number;
  max?: number;
  label?: string;
  color?: 'primary' | 'success' | 'warning' | 'error' | 'health' | 'mana';
}

export const ProgressComponent: React.FC<ProgressComponentProps> = ({
  value = 0,
  max = 100,
  label,
  color = 'primary',
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={styles.progressContainer}>
      {label && (
        <div className={styles.progressLabel}>
          <span>{label}</span>
          <span>{value}/{max}</span>
        </div>
      )}
      <div className={styles.progressTrack}>
        <div
          className={`${styles.progressFill} ${styles[color]}`}
          style={{ width: `${percentage}%` }}
        >
          {!label && (
            <span className={styles.progressText}>{Math.round(percentage)}%</span>
          )}
        </div>
      </div>
    </div>
  );
};
