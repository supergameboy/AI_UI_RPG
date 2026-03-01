import React, { useState, useCallback } from 'react';
import type { StartingScene } from '@ai-rpg/shared';
import { Button, Icon } from '../../common';

interface StartingSceneEditorProps {
  startingScene: StartingScene;
  readOnly: boolean;
  onUpdate: (updates: Partial<StartingScene>) => void;
}

export const StartingSceneEditor: React.FC<StartingSceneEditorProps> = ({
  startingScene,
  readOnly,
  onUpdate,
}) => {
  const [newNpc, setNewNpc] = useState('');
  const [newItem, setNewItem] = useState('');
  const [newQuest, setNewQuest] = useState('');

  const npcs = startingScene.npcs || [];
  const items = startingScene.items || [];
  const quests = startingScene.quests || [];

  const handleAddNpc = useCallback(() => {
    const trimmed = newNpc.trim();
    if (trimmed && !npcs.includes(trimmed)) {
      onUpdate({ npcs: [...npcs, trimmed] });
      setNewNpc('');
    }
  }, [newNpc, npcs, onUpdate]);

  const handleRemoveNpc = useCallback(
    (npc: string) => {
      onUpdate({ npcs: npcs.filter((n) => n !== npc) });
    },
    [npcs, onUpdate]
  );

  const handleAddItem = useCallback(() => {
    const trimmed = newItem.trim();
    if (trimmed && !items.includes(trimmed)) {
      onUpdate({ items: [...items, trimmed] });
      setNewItem('');
    }
  }, [newItem, items, onUpdate]);

  const handleRemoveItem = useCallback(
    (item: string) => {
      onUpdate({ items: items.filter((i) => i !== item) });
    },
    [items, onUpdate]
  );

  const handleAddQuest = useCallback(() => {
    const trimmed = newQuest.trim();
    if (trimmed && !quests.includes(trimmed)) {
      onUpdate({ quests: [...quests, trimmed] });
      setNewQuest('');
    }
  }, [newQuest, quests, onUpdate]);

  const handleRemoveQuest = useCallback(
    (quest: string) => {
      onUpdate({ quests: quests.filter((q) => q !== quest) });
    },
    [quests, onUpdate]
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

  const sectionStyle = {
    padding: 'var(--spacing-lg)',
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)',
    marginBottom: 'var(--spacing-lg)',
  };

  const tagStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--spacing-xs)',
    padding: 'var(--spacing-xs) var(--spacing-sm)',
    background: 'var(--color-background)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-sm)',
    fontSize: 'var(--font-size-sm)',
  };

  return (
    <div style={{ padding: 'var(--spacing-lg)', overflowY: 'auto' }}>
      {/* 起始地点 */}
      <div style={sectionStyle}>
        <h3 style={{ margin: '0 0 var(--spacing-lg) 0', fontSize: 'var(--font-size-lg)' }}>
          📍 起始地点
        </h3>
        <div style={{ marginBottom: 'var(--spacing-md)' }}>
          <label style={labelStyle}>地点名称</label>
          {readOnly ? (
            <span style={{ color: 'var(--color-text-primary)' }}>
              {startingScene.location || '未设置'}
            </span>
          ) : (
            <input
              type="text"
              value={startingScene.location}
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
              value={startingScene.description}
              onChange={(e) => onUpdate({ description: e.target.value })}
              placeholder="描述玩家开始游戏时的场景..."
              rows={4}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          )}
        </div>
      </div>

      {/* 初始NPC */}
      <div style={sectionStyle}>
        <h3 style={{ margin: '0 0 var(--spacing-lg) 0', fontSize: 'var(--font-size-lg)' }}>
          👥 初始NPC
        </h3>
        <p style={{ margin: '0 0 var(--spacing-md) 0', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
          玩家开始游戏时遇到的NPC
        </p>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-xs)', marginBottom: 'var(--spacing-md)' }}>
          {npcs.length === 0 ? (
            <span style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--font-size-sm)' }}>
              暂无NPC
            </span>
          ) : (
            npcs.map((npc) => (
              <span key={npc} style={tagStyle}>
                {npc}
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => handleRemoveNpc(npc)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    <Icon name="close" size={12} />
                  </button>
                )}
              </span>
            ))
          )}
        </div>

        {!readOnly && (
          <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
            <input
              type="text"
              value={newNpc}
              onChange={(e) => setNewNpc(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddNpc()}
              placeholder="输入NPC名称"
              style={{ ...inputStyle, flex: 1 }}
            />
            <Button variant="secondary" size="small" onClick={handleAddNpc}>
              添加
            </Button>
          </div>
        )}
      </div>

      {/* 初始物品 */}
      <div style={sectionStyle}>
        <h3 style={{ margin: '0 0 var(--spacing-lg) 0', fontSize: 'var(--font-size-lg)' }}>
          🎒 初始物品
        </h3>
        <p style={{ margin: '0 0 var(--spacing-md) 0', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
          玩家开始游戏时拥有的物品
        </p>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-xs)', marginBottom: 'var(--spacing-md)' }}>
          {items.length === 0 ? (
            <span style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--font-size-sm)' }}>
              暂无物品
            </span>
          ) : (
            items.map((item) => (
              <span
                key={item}
                style={{
                  ...tagStyle,
                  background: 'var(--color-primary-light)',
                  borderColor: 'var(--color-primary)',
                  color: 'var(--color-primary)',
                }}
              >
                {item}
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(item)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    <Icon name="close" size={12} />
                  </button>
                )}
              </span>
            ))
          )}
        </div>

        {!readOnly && (
          <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
            <input
              type="text"
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
              placeholder="输入物品名称"
              style={{ ...inputStyle, flex: 1 }}
            />
            <Button variant="secondary" size="small" onClick={handleAddItem}>
              添加
            </Button>
          </div>
        )}
      </div>

      {/* 初始任务 */}
      <div style={sectionStyle}>
        <h3 style={{ margin: '0 0 var(--spacing-lg) 0', fontSize: 'var(--font-size-lg)' }}>
          📜 初始任务
        </h3>
        <p style={{ margin: '0 0 var(--spacing-md) 0', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
          玩家开始游戏时可接取的任务
        </p>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-xs)', marginBottom: 'var(--spacing-md)' }}>
          {quests.length === 0 ? (
            <span style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--font-size-sm)' }}>
              暂无任务
            </span>
          ) : (
            quests.map((quest) => (
              <span
                key={quest}
                style={{
                  ...tagStyle,
                  background: 'rgba(255, 193, 7, 0.1)',
                  borderColor: '#ffc107',
                  color: '#ffc107',
                }}
              >
                {quest}
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => handleRemoveQuest(quest)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    <Icon name="close" size={12} />
                  </button>
                )}
              </span>
            ))
          )}
        </div>

        {!readOnly && (
          <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
            <input
              type="text"
              value={newQuest}
              onChange={(e) => setNewQuest(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddQuest()}
              placeholder="输入任务名称"
              style={{ ...inputStyle, flex: 1 }}
            />
            <Button variant="secondary" size="small" onClick={handleAddQuest}>
              添加
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
