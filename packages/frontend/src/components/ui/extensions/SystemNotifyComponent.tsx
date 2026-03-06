import React from 'react';
import styles from './SystemNotifyComponent.module.css';
import type { ExtensionComponentProps } from './types';

interface SystemNotifyComponentProps extends ExtensionComponentProps {
  type?: 'info' | 'warning' | 'error' | 'success' | 'achievement' | 'welcome';
  children?: React.ReactNode;
}

const notifyIcons: Record<string, string> = {
  info: 'ℹ️',
  warning: '⚠️',
  error: '❌',
  success: '✅',
  achievement: '🏆',
  welcome: '🌟',
};

export const SystemNotifyComponent: React.FC<SystemNotifyComponentProps> = ({
  type = 'info',
  children,
}) => {
  return (
    <div className={`${styles.notifyContainer} ${styles[type]}`}>
      <div className={styles.notifyIcon}>{notifyIcons[type]}</div>
      <div className={styles.notifyContent}>
        {children}
      </div>
    </div>
  );
};
