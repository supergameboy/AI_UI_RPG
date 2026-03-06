import React from 'react';
import styles from './WarehouseComponent.module.css';
import type { ExtensionComponentProps } from './types';

interface WarehouseComponentProps extends ExtensionComponentProps {
  children?: React.ReactNode;
}

export const WarehouseComponent: React.FC<WarehouseComponentProps> = ({
  children,
}) => {
  return (
    <div className={styles.warehouseContainer}>
      <div className={styles.warehouseHeader}>
        <span className={styles.warehouseIcon}>🏦</span>
        <h2 className={styles.warehouseTitle}>仓库管理</h2>
      </div>
      <div className={styles.warehouseContent}>
        {children}
      </div>
    </div>
  );
};
