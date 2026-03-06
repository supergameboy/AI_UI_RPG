import React from 'react';
import styles from './EnhancementComponent.module.css';
import type { ExtensionComponentProps } from './types';

interface EnhancementComponentProps extends ExtensionComponentProps {
  children?: React.ReactNode;
}

export const EnhancementComponent: React.FC<EnhancementComponentProps> = ({
  children,
}) => {
  return (
    <div className={styles.enhancementContainer}>
      <div className={styles.enhancementHeader}>
        <span className={styles.enhancementIcon}>⚒️</span>
        <h2 className={styles.enhancementTitle}>装备强化</h2>
      </div>
      <div className={styles.enhancementContent}>
        {children}
      </div>
    </div>
  );
};
