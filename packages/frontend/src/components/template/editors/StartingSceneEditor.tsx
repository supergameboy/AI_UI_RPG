import React, { useState, useCallback } from 'react';
import type { StartingScene, NPCDefinition, ItemDefinition, QuestDefinition } from '@ai-rpg/shared';
import { Icon } from '../../common';
import { NPCEditor } from './NPCEditor';
import { ItemEditor } from './ItemEditor';
import { QuestEditor } from './QuestEditor';

interface StartingSceneEditorProps {
  startingScene: StartingScene;
  readOnly: boolean;
  onUpdate: (updates: Partial<StartingScene>) => void;
}

type TabType = 'npcs' | 'items' | 'quests';

const TABS: { id: TabType; label: string; icon: string }[] = [
  { id: 'npcs', label: 'NPC', icon: 'character' },
  { id: 'items', label: '物品', icon: 'inventory' },
  { id: 'quests', label: '任务', icon: 'quests' },
];

export const StartingSceneEditor: React.FC<StartingSceneEditorProps> = ({
  startingScene,
  readOnly,
  onUpdate,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('npcs');

  const npcs = startingScene.npcs || [];
  const items = startingScene.items || [];
  const quests = startingScene.quests || [];

  const handleUpdateNPCs = useCallback(
    (newNpcs: NPCDefinition[]) => {
      onUpdate({ npcs: newNpcs });
    },
    [onUpdate]
  );

  const handleUpdateItems = useCallback(
    (newItems: ItemDefinition[]) => {
      onUpdate({ items: newItems });
    },
    [onUpdate]
  );

  const handleUpdateQuests = useCallback(
    (newQuests: QuestDefinition[]) => {
      onUpdate({ quests: newQuests });
    },
    [onUpdate]
  );

  const inputStyle = {
    width: '100%',
    padding: 'var(--spacing-sm)',
    background: 'var(--color-background)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--color-text-primary)',
  };

  const labelStyle = {
    display: 'block',
    marginBottom: 'var(--spacing-xs)',
    fontWeight: 500,
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-text-secondary)',
  };

  const tabStyle = (isActive: boolean): React.CSSProperties => ({
    padding: 'var(--spacing-sm) var(--spacing-md)',
    background: isActive ? 'var(--color-primary)' : 'var(--color-background)',
    color: isActive ? 'white' : 'var(--color-text-primary)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--spacing-xs)',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* 起始地点信息 */}
      <div style={{ padding: 'var(--spacing-lg)', borderBottom: '1px solid var(--color-border)' }}>
        <h3 style={{ margin: '0 0 var(--spacing-lg) 0', fontSize: 'var(--font-size-lg)' }}>
          📍 起始地点
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          <div>
            <label style={labelStyle}>地点名称</label>
            {readOnly ? (
              <span style={{ color: 'var(--color-text-primary)' }}>
                {startingScene.location || '未设置'}
              </span>
            ) : (
              <input
                type="text"
                value={startingScene.location || ''}
                onChange={(e) => onUpdate({ location: e.target.value })}
                placeholder="例如：新手村"
                style={inputStyle}
              />
            )}
          </div>

          <div>
            <label style={labelStyle}>场景描述</label>
            {readOnly ? (
              <p style={{ color: 'var(--color-text-primary)', margin: 0, whiteSpace: 'pre-wrap' }}>
                {startingScene.description || '暂无描述'}
              </p>
            ) : (
              <textarea
                value={startingScene.description || ''}
                onChange={(e) => onUpdate({ description: e.target.value })}
                placeholder="描述玩家开始游戏时的场景..."
                rows={4}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            )}
          </div>
        </div>
      </div>

      {/* 标签页切换 */}
      <div style={{ padding: 'var(--spacing-md)', borderBottom: '1px solid var(--color-border)', display: 'flex', gap: 'var(--spacing-sm)' }}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            style={tabStyle(activeTab === tab.id)}
            onClick={() => setActiveTab(tab.id)}
          >
            <Icon name={tab.icon as any} size={16} />
            <span>{tab.label}</span>
            <span style={{
              background: activeTab === tab.id ? 'rgba(255,255,255,0.2)' : 'var(--color-primary-light)',
              padding: 'var(--spacing-xs) var(--spacing-xs)',
              borderRadius: 'var(--radius-sm)',
              fontSize: 'var(--font-size-xs)',
            }}>
              {tab.id === 'npcs' ? npcs.length : tab.id === 'items' ? items.length : quests.length}
            </span>
          </button>
        ))}
      </div>

      {/* 内容区域 */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {activeTab === 'npcs' && (
          <NPCEditor
            npcs={npcs}
            readOnly={readOnly}
            onUpdate={handleUpdateNPCs}
          />
        )}
        {activeTab === 'items' && (
          <ItemEditor
            items={items}
            readOnly={readOnly}
            onUpdate={handleUpdateItems}
          />
        )}
        {activeTab === 'quests' && (
          <QuestEditor
            quests={quests}
            readOnly={readOnly}
            onUpdate={handleUpdateQuests}
          />
        )}
      </div>
    </div>
  );
};
