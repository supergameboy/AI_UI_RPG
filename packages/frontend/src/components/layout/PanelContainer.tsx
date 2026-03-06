import React from 'react';
import { Panel } from '../common';
import { useUIStore } from '../../stores';
import { useResizable } from '../../hooks/useResizable';
import { CharacterPanel } from '../panels/CharacterPanel';
import { InventoryPanel } from '../panels/InventoryPanel';
import { SkillsPanel } from '../panels/SkillsPanel';
import { EquipmentPanel } from '../panels/EquipmentPanel';
import { QuestPanel } from '../panels/QuestPanel';
import { JournalPanel } from '../panels/JournalPanel';
import { NPCPanel } from '../panels/NPCPanel';
import { MapPanel } from '../panels/MapPanel';
import styles from './PanelContainer.module.css';

export const PanelContainer: React.FC = () => {
  const { activePanel, isPanelOpen, closePanel } = useUIStore();
  
  const { width, isResizing, resizerProps } = useResizable({
    minWidth: 250,
    maxWidth: 500,
    defaultWidth: 320,
    direction: 'right',
    storageKey: 'ai-rpg-right-panel-width',
  });

  if (!isPanelOpen || !activePanel) {
    return null;
  }

  const renderPanelContent = () => {
    switch (activePanel) {
      case 'character':
        return <CharacterPanel />;
      case 'skills':
        return <SkillsPanel />;
      case 'equipment':
        return <EquipmentPanel />;
      case 'inventory':
        return <InventoryPanel />;
      case 'quests':
        return <QuestPanel />;
      case 'npc':
        return <NPCPanel />;
      case 'journal':
        return <JournalPanel />;
      case 'map':
        return <MapPanel />;
      default:
        return null;
    }
  };

  const getPanelTitle = () => {
    const titles: Record<string, string> = {
      character: '角色',
      skills: '技能',
      equipment: '装备',
      inventory: '背包',
      quests: '任务',
      npc: 'NPC',
      journal: '记录',
      map: '地图',
    };
    return titles[activePanel] || '';
  };

  return (
    <div 
      className={styles.container} 
      style={{ width: `${width}px` }}
    >
      <div 
        className={[styles.resizer, isResizing && styles.resizing].filter(Boolean).join(' ')}
        {...resizerProps}
      />
      <Panel 
        title={getPanelTitle()} 
        closable 
        onClose={closePanel}
        className={styles.panel}
      >
        {renderPanelContent()}
      </Panel>
    </div>
  );
};
