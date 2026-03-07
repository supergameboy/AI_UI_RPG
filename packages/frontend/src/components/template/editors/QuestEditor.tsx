import React, { useState, useCallback } from 'react';
import type { QuestDefinition } from '@ai-rpg/shared';
import { Button, Icon, ConfirmDialog } from '../../common';

interface QuestEditorProps {
  quests: QuestDefinition[];
  readOnly: boolean;
  onUpdate: (quests: QuestDefinition[]) => void;
  onAIGenerate?: (prompt: string) => Promise<QuestDefinition | null>;
}

const QUEST_TYPES = [
  { value: 'main', label: '主线任务', color: '#f59e0b' },
  { value: 'side', label: '支线任务', color: '#3b82f6' },
  { value: 'daily', label: '日常任务', color: '#22c55e' },
  { value: 'hidden', label: '隐藏任务', color: '#a855f7' },
];

type ObjectiveType = 'kill' | 'collect' | 'talk' | 'explore' | 'custom';
type RewardType = 'experience' | 'currency' | 'item' | 'skill' | 'reputation' | 'custom';

const OBJECTIVE_TYPES: { value: ObjectiveType; label: string }[] = [
  { value: 'kill', label: '击杀' },
  { value: 'collect', label: '收集' },
  { value: 'talk', label: '对话' },
  { value: 'explore', label: '探索' },
  { value: 'custom', label: '自定义' },
];

const REWARD_TYPES: { value: RewardType; label: string }[] = [
  { value: 'experience', label: '经验值' },
  { value: 'currency', label: '货币' },
  { value: 'item', label: '物品' },
  { value: 'skill', label: '技能' },
  { value: 'reputation', label: '声望' },
  { value: 'custom', label: '自定义' },
];

const createEmptyQuest = (): QuestDefinition => ({
  id: `quest_${Date.now()}`,
  name: '新任务',
  description: '',
  type: 'side',
  objectives: [],
});

export const QuestEditor: React.FC<QuestEditorProps> = ({
  quests,
  readOnly,
  onUpdate,
  onAIGenerate,
}) => {
  const [editingQuest, setEditingQuest] = useState<QuestDefinition | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiPreview, setAiPreview] = useState<QuestDefinition | null>(null);
  const [newObjective, setNewObjective] = useState({ description: '', type: 'custom' as ObjectiveType, target: '', required: 1 });
  const [newReward, setNewReward] = useState({ type: 'experience' as RewardType, value: 0 });

  const handleAdd = useCallback(() => {
    const newQuest = createEmptyQuest();
    setEditingQuest(newQuest);
  }, []);

  const handleUpdate = useCallback(
    (updated: QuestDefinition) => {
      const existingIndex = quests.findIndex((q) => q.id === updated.id);
      if (existingIndex >= 0) {
        onUpdate(quests.map((q) => (q.id === updated.id ? updated : q)));
      } else {
        onUpdate([...quests, updated]);
      }
      setEditingQuest(null);
    },
    [quests, onUpdate]
  );

  const handleDelete = useCallback(
    (id: string) => {
      onUpdate(quests.filter((q) => q.id !== id));
      setDeleteConfirm(null);
    },
    [quests, onUpdate]
  );

  const handleAIGenerate = useCallback(async () => {
    if (!onAIGenerate) return;
    setIsGenerating(true);
    try {
      const result = await onAIGenerate(aiPrompt);
      if (result) {
        setAiPreview(result);
      }
    } catch (err) {
      console.error('AI generation failed:', err);
      const error = err as Error;
      alert(error.message || 'AI 生成失败');
    } finally {
      setIsGenerating(false);
    }
  }, [onAIGenerate, aiPrompt]);

  const handleAcceptAIPreview = useCallback(() => {
    if (aiPreview) {
      onUpdate([...quests, aiPreview]);
      setAiPreview(null);
      setShowAIDialog(false);
      setAiPrompt('');
    }
  }, [aiPreview, quests, onUpdate]);

  const addObjective = useCallback(() => {
    if (!editingQuest || !newObjective.description.trim()) return;
    setEditingQuest({
      ...editingQuest,
      objectives: [
        ...editingQuest.objectives,
        {
          id: `obj_${Date.now()}`,
          description: newObjective.description,
          type: newObjective.type,
          target: newObjective.target || newObjective.description,
          required: newObjective.required,
        },
      ],
    });
    setNewObjective({ description: '', type: 'custom', target: '', required: 1 });
  }, [editingQuest, newObjective]);

  const removeObjective = useCallback((id: string) => {
    if (!editingQuest) return;
    setEditingQuest({
      ...editingQuest,
      objectives: editingQuest.objectives.filter((o) => o.id !== id),
    });
  }, [editingQuest]);

  const addReward = useCallback(() => {
    if (!editingQuest || newReward.value <= 0) return;
    setEditingQuest({
      ...editingQuest,
      rewards: [...(editingQuest.rewards || []), { ...newReward }],
    });
    setNewReward({ type: 'experience', value: 0 });
  }, [editingQuest, newReward]);

  const removeReward = useCallback((index: number) => {
    if (!editingQuest || !editingQuest.rewards) return;
    setEditingQuest({
      ...editingQuest,
      rewards: editingQuest.rewards.filter((_, i) => i !== index),
    });
  }, [editingQuest]);

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

  const getQuestTypeColor = (type: string) => {
    return QUEST_TYPES.find((t) => t.value === type)?.color || 'var(--color-text-primary)';
  };

  if (editingQuest) {
    return (
      <div style={{ padding: 'var(--spacing-lg)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
          <h3 style={{ margin: 0 }}>编辑任务</h3>
          <Button variant="ghost" size="small" onClick={() => setEditingQuest(null)}>
            <Icon name="close" size={16} />
          </Button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          <div>
            <label style={labelStyle}>任务名称</label>
            <input
              type="text"
              value={editingQuest.name}
              onChange={(e) => setEditingQuest({ ...editingQuest, name: e.target.value })}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>描述</label>
            <textarea
              value={editingQuest.description}
              onChange={(e) => setEditingQuest({ ...editingQuest, description: e.target.value })}
              rows={3}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          <div>
            <label style={labelStyle}>任务类型</label>
            <select
              value={editingQuest.type}
              onChange={(e) => setEditingQuest({ ...editingQuest, type: e.target.value as QuestDefinition['type'] })}
              style={inputStyle}
            >
              {QUEST_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* 目标列表 */}
          <div>
            <label style={labelStyle}>任务目标</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)', marginBottom: 'var(--spacing-sm)' }}>
              {editingQuest.objectives.map((obj) => (
                <div key={obj.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', padding: 'var(--spacing-xs) var(--spacing-sm)', background: 'var(--color-background)', borderRadius: 'var(--radius-sm)' }}>
                  <span style={{ fontSize: 'var(--font-size-xs)', padding: 'var(--spacing-xs)', background: 'var(--color-primary-light)', color: 'var(--color-primary)', borderRadius: 'var(--radius-sm)' }}>
                    {OBJECTIVE_TYPES.find((t) => t.value === obj.type)?.label}
                  </span>
                  <span style={{ flex: 1 }}>{obj.description}</span>
                  <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>x{obj.required}</span>
                  <button type="button" onClick={() => removeObjective(obj.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    <Icon name="close" size={14} />
                  </button>
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto auto', gap: 'var(--spacing-xs)', alignItems: 'center' }}>
              <select
                value={newObjective.type}
                onChange={(e) => setNewObjective({ ...newObjective, type: e.target.value as ObjectiveType })}
                style={{ ...inputStyle, width: 'auto' }}
              >
                {OBJECTIVE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              <input
                type="text"
                value={newObjective.description}
                onChange={(e) => setNewObjective({ ...newObjective, description: e.target.value })}
                placeholder="目标描述"
                style={inputStyle}
              />
              <input
                type="number"
                min={1}
                value={newObjective.required}
                onChange={(e) => setNewObjective({ ...newObjective, required: parseInt(e.target.value, 10) || 1 })}
                style={{ ...inputStyle, width: '60px' }}
              />
              <Button variant="secondary" size="small" onClick={addObjective}>添加</Button>
            </div>
          </div>

          {/* 奖励列表 */}
          <div>
            <label style={labelStyle}>任务奖励</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-xs)', marginBottom: 'var(--spacing-sm)' }}>
              {(editingQuest.rewards || []).map((reward, i) => (
                <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--spacing-xs)', padding: 'var(--spacing-xs) var(--spacing-sm)', background: 'var(--color-background)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--font-size-sm)' }}>
                  {REWARD_TYPES.find((t) => t.value === reward.type)?.label}: {reward.value}
                  <button type="button" onClick={() => removeReward(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    <Icon name="close" size={12} />
                  </button>
                </span>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
              <select
                value={newReward.type}
                onChange={(e) => setNewReward({ ...newReward, type: e.target.value as RewardType })}
                style={{ ...inputStyle, width: 'auto' }}
              >
                {REWARD_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              <input
                type="number"
                min={1}
                value={newReward.value}
                onChange={(e) => setNewReward({ ...newReward, value: parseInt(e.target.value, 10) || 0 })}
                style={inputStyle}
              />
              <Button variant="secondary" size="small" onClick={addReward}>添加</Button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-md)' }}>
            <Button variant="primary" onClick={() => handleUpdate(editingQuest)}>
              保存
            </Button>
            <Button variant="ghost" onClick={() => setEditingQuest(null)}>
              取消
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 'var(--spacing-lg)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
        <h3 style={{ margin: 0 }}>任务列表</h3>
        <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
          {onAIGenerate && !readOnly && (
            <Button variant="secondary" size="small" onClick={() => setShowAIDialog(true)} icon={<Icon name="sparkles" size={16} />}>
              AI 生成
            </Button>
          )}
          {!readOnly && (
            <Button variant="secondary" size="small" onClick={handleAdd} icon={<Icon name="plus" size={16} />}>
              添加任务
            </Button>
          )}
        </div>
      </div>

      {(quests || []).length === 0 ? (
        <div style={{ textAlign: 'center', padding: 'var(--spacing-xl)', color: 'var(--color-text-secondary)' }}>
          暂无任务，点击上方按钮添加
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          {(quests || []).map((quest) => (
            <div
              key={quest.id}
              style={{
                padding: 'var(--spacing-md)',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                borderLeft: `3px solid ${getQuestTypeColor(quest.type)}`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h4 style={{ margin: '0 0 var(--spacing-xs) 0' }}>{quest.name}</h4>
                  <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                    {quest.description || '暂无描述'}
                  </p>
                  <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-sm)', fontSize: 'var(--font-size-xs)' }}>
                    <span style={{ color: getQuestTypeColor(quest.type) }}>
                      {QUEST_TYPES.find((t) => t.value === quest.type)?.label}
                    </span>
                    <span style={{ color: 'var(--color-text-tertiary)' }}>
                      {quest.objectives.length} 个目标
                    </span>
                  </div>
                </div>
                {!readOnly && (
                  <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
                    <Button variant="ghost" size="small" onClick={() => setEditingQuest(quest)}>
                      <Icon name="edit" size={16} />
                    </Button>
                    <Button variant="ghost" size="small" onClick={() => setDeleteConfirm(quest.id)}>
                      <Icon name="trash" size={16} />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteConfirm}
        title="删除任务"
        message="确定要删除这个任务吗？此操作无法撤销。"
        confirmText="删除"
        cancelText="取消"
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        onCancel={() => setDeleteConfirm(null)}
      />

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
            maxWidth: '500px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto',
          }}>
            <h3 style={{ margin: '0 0 var(--spacing-md) 0' }}>AI 生成任务</h3>
            
            {!aiPreview ? (
              <>
                <div style={{ marginBottom: 'var(--spacing-md)' }}>
                  <label style={labelStyle}>描述你想要的任务（可选）</label>
                  <textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    rows={4}
                    placeholder="留空将根据世界观自动生成，或输入描述如：一个帮助村民找回被盗物品的任务..."
                    style={{ ...inputStyle, resize: 'vertical' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: 'var(--spacing-sm)', justifyContent: 'flex-end' }}>
                  <Button variant="ghost" onClick={() => { setShowAIDialog(false); setAiPrompt(''); }}>
                    取消
                  </Button>
                  <Button variant="primary" onClick={handleAIGenerate} loading={isGenerating}>
                    {aiPrompt.trim() ? '根据描述生成' : '自动生成'}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div style={{ marginBottom: 'var(--spacing-md)', padding: 'var(--spacing-md)', background: 'var(--color-background)', borderRadius: 'var(--radius-md)', borderLeft: `3px solid ${getQuestTypeColor(aiPreview.type)}` }}>
                  <h4 style={{ margin: '0 0 var(--spacing-sm) 0' }}>{aiPreview.name}</h4>
                  <p style={{ margin: '0 0 var(--spacing-sm) 0', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                    {aiPreview.description}
                  </p>
                  <div style={{ fontSize: 'var(--font-size-xs)' }}>
                    <span style={{ color: getQuestTypeColor(aiPreview.type) }}>
                      {QUEST_TYPES.find((t) => t.value === aiPreview.type)?.label}
                    </span>
                    <span style={{ margin: '0 var(--spacing-sm)', color: 'var(--color-text-tertiary)' }}>•</span>
                    <span style={{ color: 'var(--color-text-secondary)' }}>{aiPreview.objectives.length} 个目标</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 'var(--spacing-sm)', justifyContent: 'flex-end' }}>
                  <Button variant="ghost" onClick={() => setAiPreview(null)}>
                    重新生成
                  </Button>
                  <Button variant="primary" onClick={handleAcceptAIPreview}>
                    添加到列表
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
