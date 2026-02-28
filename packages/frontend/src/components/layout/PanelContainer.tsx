import React from 'react';
import { Panel } from '../common';
import { useUIStore } from '../../stores';
import { useResizable } from '../../hooks/useResizable';
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
        return (
          <div className={styles.placeholder}>
            <h3>角色信息</h3>
            <p>角色属性、状态、背景等信息将在这里显示</p>
          </div>
        );
      case 'skills':
        return (
          <div className={styles.placeholder}>
            <h3>技能列表</h3>
            <p>已学习的技能和技能树将在这里显示</p>
          </div>
        );
      case 'equipment':
        return (
          <div className={styles.placeholder}>
            <h3>装备管理</h3>
            <p>装备槽位和装备详情将在这里显示</p>
          </div>
        );
      case 'inventory':
        return (
          <div className={styles.placeholder}>
            <h3>背包</h3>
            <p>物品列表和背包管理将在这里显示</p>
          </div>
        );
      case 'quests':
        return (
          <div className={styles.placeholder}>
            <h3>任务日志</h3>
            <p>当前任务和已完成任务将在这里显示</p>
          </div>
        );
      case 'npc':
        return (
          <div className={styles.placeholder}>
            <h3>NPC列表</h3>
            <p>遇到的NPC和关系信息将在这里显示</p>
          </div>
        );
      case 'journal':
        return (
          <div className={styles.placeholder}>
            <h3>故事记录</h3>
            <p>对话历史和重要事件记录将在这里显示</p>
          </div>
        );
      case 'map':
        return (
          <div className={styles.placeholder}>
            <h3>世界地图</h3>
            <p>完整的世界地图将在这里显示</p>
          </div>
        );
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
