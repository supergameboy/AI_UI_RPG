import React from 'react';
import { Icon, IconName } from '../common';
import { useUIStore, PanelType } from '../../stores';
import styles from './TabBar.module.css';

interface TabItem {
  id: PanelType;
  label: string;
  icon: IconName;
}

const tabs: TabItem[] = [
  { id: 'character', label: '角色', icon: 'character' },
  { id: 'skills', label: '技能', icon: 'skills' },
  { id: 'equipment', label: '装备', icon: 'equipment' },
  { id: 'inventory', label: '背包', icon: 'inventory' },
  { id: 'quests', label: '任务', icon: 'quests' },
  { id: 'npc', label: 'NPC', icon: 'character' },
  { id: 'journal', label: '记录', icon: 'quests' },
  { id: 'map', label: '地图', icon: 'map' },
];

export const TabBar: React.FC = () => {
  const { activePanel, togglePanel } = useUIStore();

  return (
    <nav className={styles.tabBar}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={[styles.tab, activePanel === tab.id && styles.active].filter(Boolean).join(' ')}
          onClick={() => togglePanel(tab.id)}
          title={tab.label}
        >
          <Icon name={tab.icon} size={20} />
          <span className={styles.label}>{tab.label}</span>
        </button>
      ))}
    </nav>
  );
};
