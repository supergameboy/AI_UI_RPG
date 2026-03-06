import React from 'react';
import { MiniMap } from './MiniMap';
import { PartyStatus } from './PartyStatus';
import { QuickBar } from './QuickBar';
import { useResizable } from '../../hooks/useResizable';
import { useGameStore } from '../../stores';
import styles from './LeftSidebar.module.css';

export const LeftSidebar: React.FC = () => {
  const { width, isResizing, resizerProps } = useResizable({
    minWidth: 150,
    maxWidth: 400,
    defaultWidth: 200,
    direction: 'left',
    storageKey: 'ai-rpg-left-sidebar-width',
  });

  const selectedTemplate = useGameStore((state) => state.selectedTemplate);
  const uiLayout = selectedTemplate?.uiLayout;

  const showMinimap = uiLayout?.showMinimap !== false;
  const showPartyPanel = uiLayout?.showPartyPanel !== false;
  const showSkillBar = uiLayout?.showSkillBar !== false;

  if (!showMinimap && !showPartyPanel && !showSkillBar) {
    return null;
  }

  return (
    <aside 
      className={styles.sidebar} 
      style={{ width: `${width}px` }}
    >
      {showMinimap && <MiniMap />}
      {showPartyPanel && <PartyStatus />}
      {showSkillBar && <QuickBar />}
      <div 
        className={[styles.resizer, isResizing && styles.resizing].filter(Boolean).join(' ')}
        {...resizerProps}
      />
    </aside>
  );
};
