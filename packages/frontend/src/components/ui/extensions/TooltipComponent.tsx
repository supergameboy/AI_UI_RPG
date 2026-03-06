import React from 'react';
import styles from './TooltipComponent.module.css';
import type { ExtensionComponentProps } from './types';

interface TooltipComponentProps extends ExtensionComponentProps {
  tooltipText?: string;
  children?: React.ReactNode;
}

export const TooltipComponent: React.FC<TooltipComponentProps> = ({
  tooltipText = '',
  children,
}) => {
  return (
    <span className={styles.tooltipWrapper}>
      {children}
      {tooltipText && (
        <span className={styles.tooltipContent}>
          {tooltipText}
        </span>
      )}
    </span>
  );
};
