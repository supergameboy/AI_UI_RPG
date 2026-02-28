import React from 'react';
import { MiniMap } from './MiniMap';
import { PartyStatus } from './PartyStatus';
import { QuickBar } from './QuickBar';
import { useResizable } from '../../hooks/useResizable';
import styles from './LeftSidebar.module.css';

export const LeftSidebar: React.FC = () => {
  const { width, isResizing, resizerProps } = useResizable({
    minWidth: 150,
    maxWidth: 400,
    defaultWidth: 200,
    direction: 'left',
    storageKey: 'ai-rpg-left-sidebar-width',
  });

  return (
    <aside 
      className={styles.sidebar} 
      style={{ width: `${width}px` }}
    >
      <MiniMap />
      <PartyStatus />
      <QuickBar />
      <div 
        className={[styles.resizer, isResizing && styles.resizing].filter(Boolean).join(' ')}
        {...resizerProps}
      />
    </aside>
  );
};
