import React, { useState, useCallback } from 'react';
import type { StartingScene, NPCDefinition, ItemDefinition, QuestDefinition, StoryTemplate } from '@ai-rpg/shared';
import { Button, Icon } from '../../common';
import { NPCEditor } from './NPCEditor';
import { ItemEditor } from './ItemEditor';
import { QuestEditor } from './QuestEditor';
import { templateService } from '../../../services/templateService';

interface StartingSceneEditorProps {
  startingScene: StartingScene;
  readOnly: boolean;
  onUpdate: (updates: Partial<StartingScene>) => void;
  template: Partial<StoryTemplate>;
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
  template,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('npcs');
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiPreview, setAiPreview] = useState<StartingScene | null>(null);

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

  const handleGenerateNPC = useCallback(async (prompt: string): Promise<NPCDefinition | null> => {
    try {
      return await templateService.generateNPC({ template, prompt });
    } catch (error) {
      console.error('Failed to generate NPC:', error);
      const err = error as Error;
      throw new Error(err.message || 'AI 生成失败');
    }
  }, [template]);

  const handleGenerateItem = useCallback(async (prompt: string): Promise<ItemDefinition | null> => {
    try {
      return await templateService.generateItem({ template, prompt });
    } catch (error) {
      console.error('Failed to generate item:', error);
      const err = error as Error;
      throw new Error(err.message || 'AI 生成失败');
    }
  }, [template]);

  const handleGenerateQuest = useCallback(async (prompt: string): Promise<QuestDefinition | null> => {
    try {
      return await templateService.generateQuest({ template, prompt });
    } catch (error) {
      console.error('Failed to generate quest:', error);
      const err = error as Error;
      throw new Error(err.message || 'AI 生成失败');
    }
  }, [template]);

  const handleGenerateScene = useCallback(async () => {
    setIsGenerating(true);
    try {
      const result = await templateService.generateScene({ template, prompt: aiPrompt });
      if (result) {
        setAiPreview(result);
      }
    } catch (error) {
      console.error('Failed to generate scene:', error);
      const err = error as Error;
      alert(err.message || 'AI 生成失败');
    } finally {
      setIsGenerating(false);
    }
  }, [template, aiPrompt]);

  const handleAcceptAIPreview = useCallback(() => {
    if (aiPreview) {
      onUpdate({
        location: aiPreview.location,
        description: aiPreview.description,
        npcs: aiPreview.npcs,
        items: aiPreview.items,
        quests: aiPreview.quests,
      });
      setAiPreview(null);
      setShowAIDialog(false);
      setAiPrompt('');
    }
  }, [aiPreview, onUpdate]);

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
          <h3 style={{ margin: 0, fontSize: 'var(--font-size-lg)' }}>
            📍 起始地点
          </h3>
          {!readOnly && (
            <Button variant="secondary" size="small" onClick={() => setShowAIDialog(true)} icon={<Icon name="sparkles" size={16} />}>
              AI 生成场景
            </Button>
          )}
        </div>
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
            onAIGenerate={handleGenerateNPC}
          />
        )}
        {activeTab === 'items' && (
          <ItemEditor
            items={items}
            readOnly={readOnly}
            onUpdate={handleUpdateItems}
            onAIGenerate={handleGenerateItem}
          />
        )}
        {activeTab === 'quests' && (
          <QuestEditor
            quests={quests}
            readOnly={readOnly}
            onUpdate={handleUpdateQuests}
            onAIGenerate={handleGenerateQuest}
          />
        )}
      </div>

      {/* AI 生成对话框 */}
      {showAIDialog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: 'var(--color-surface)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--spacing-lg)',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto',
          }}>
            <h3 style={{ margin: '0 0 var(--spacing-md) 0' }}>AI 生成起始场景</h3>
            
            {!aiPreview ? (
              <>
                <div style={{ marginBottom: 'var(--spacing-md)' }}>
                  <label style={labelStyle}>描述你想要的场景（可选）</label>
                  <textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    rows={4}
                    placeholder="留空将根据世界观自动生成，或输入描述如：一个位于森林边缘的小村庄..."
                    style={{ ...inputStyle, resize: 'vertical' }}
                  />
                </div>
                <div style={{ marginBottom: 'var(--spacing-md)', padding: 'var(--spacing-sm)', background: 'var(--color-background)', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                  AI 将自动生成：地点名称、场景描述、1-3个NPC、1-3个物品、1-2个初始任务
                </div>
                <div style={{ display: 'flex', gap: 'var(--spacing-sm)', justifyContent: 'flex-end' }}>
                  <Button variant="ghost" onClick={() => { setShowAIDialog(false); setAiPrompt(''); }}>
                    取消
                  </Button>
                  <Button variant="primary" onClick={handleGenerateScene} loading={isGenerating}>
                    {aiPrompt.trim() ? '根据描述生成' : '自动生成'}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div style={{ marginBottom: 'var(--spacing-md)', padding: 'var(--spacing-md)', background: 'var(--color-background)', borderRadius: 'var(--radius-md)' }}>
                  <h4 style={{ margin: '0 0 var(--spacing-sm) 0', color: 'var(--color-primary)' }}>
                    📍 {aiPreview.location}
                  </h4>
                  <p style={{ margin: '0 0 var(--spacing-md) 0', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                    {aiPreview.description}
                  </p>
                  <div style={{ display: 'flex', gap: 'var(--spacing-lg)', fontSize: 'var(--font-size-sm)' }}>
                    <span>👥 NPC: {aiPreview.npcs?.length || 0} 个</span>
                    <span>🎒 物品: {aiPreview.items?.length || 0} 个</span>
                    <span>📜 任务: {aiPreview.quests?.length || 0} 个</span>
                  </div>
                </div>
                
                {/* NPC 预览 */}
                {(aiPreview.npcs || []).length > 0 && (
                  <div style={{ marginBottom: 'var(--spacing-md)' }}>
                    <h5 style={{ margin: '0 0 var(--spacing-sm) 0', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>NPC</h5>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-xs)' }}>
                      {aiPreview.npcs.map((npc) => (
                        <span key={npc.id} style={{ padding: 'var(--spacing-xs) var(--spacing-sm)', background: 'var(--color-primary-light)', color: 'var(--color-primary)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--font-size-sm)' }}>
                          {npc.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* 物品预览 */}
                {(aiPreview.items || []).length > 0 && (
                  <div style={{ marginBottom: 'var(--spacing-md)' }}>
                    <h5 style={{ margin: '0 0 var(--spacing-sm) 0', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>物品</h5>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-xs)' }}>
                      {aiPreview.items.map((item) => (
                        <span key={item.id} style={{ padding: 'var(--spacing-xs) var(--spacing-sm)', background: 'var(--color-background)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--font-size-sm)' }}>
                          {item.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* 任务预览 */}
                {(aiPreview.quests || []).length > 0 && (
                  <div style={{ marginBottom: 'var(--spacing-md)' }}>
                    <h5 style={{ margin: '0 0 var(--spacing-sm) 0', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>任务</h5>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-xs)' }}>
                      {aiPreview.quests.map((quest) => (
                        <span key={quest.id} style={{ padding: 'var(--spacing-xs) var(--spacing-sm)', background: 'rgba(255, 193, 7, 0.1)', border: '1px solid #ffc107', color: '#ffc107', borderRadius: 'var(--radius-sm)', fontSize: 'var(--font-size-sm)' }}>
                          {quest.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                <div style={{ display: 'flex', gap: 'var(--spacing-sm)', justifyContent: 'flex-end' }}>
                  <Button variant="ghost" onClick={() => setAiPreview(null)}>
                    重新生成
                  </Button>
                  <Button variant="primary" onClick={handleAcceptAIPreview}>
                    应用到场景
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
