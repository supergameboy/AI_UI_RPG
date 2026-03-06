import React from 'react';
import styles from './BadgeComponent.module.css';
import type { ExtensionComponentProps } from './types';

interface BadgeComponentProps extends ExtensionComponentProps {
  color?: 'default' | 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'gold';
  children?: React.ReactNode;
}

export const BadgeComponent: React.FC<BadgeComponentProps> = ({
  color = 'default',
  children,
}) => {
  return (
    <span className={`${styles.badge} ${styles[color]}`}>
      {children}
    </span>
  );
};
