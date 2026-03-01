import React, { useState, useCallback } from 'react';
import type { ItemDefinition } from '@ai-rpg/shared';
import { Button, Icon, ConfirmDialog } from '../../common';

interface ItemEditorProps {
  items: ItemDefinition[];
  readOnly: boolean;
  onUpdate: (items: ItemDefinition[]) => void;
  onAIGenerate?: (prompt: string) => Promise<ItemDefinition | null>;
}

const ITEM_TYPES = [
  { value: 'weapon', label: '武器' },
  { value: 'armor', label: '护甲' },
  { value: 'accessory', label: '饰品' },
  { value: 'consumable', label: '消耗品' },
  { value: 'material', label: '材料' },
  { value: 'quest', label: '任务物品' },
  { value: 'misc', label: '杂项' },
];

const RARITY_OPTIONS = [
  { value: 'common', label: '普通', color: '#9ca3af' },
  { value: 'uncommon', label: '优秀', color: '#22c55e' },
  { value: 'rare', label: '稀有', color: '#3b82f6' },
  { value: 'epic', label: '史诗', color: '#a855f7' },
  { value: 'legendary', label: '传说', color: '#f59e0b' },
  { value: 'unique', label: '独特', color: '#ef4444' },
];

const createEmptyItem = (): ItemDefinition => ({
  id: `item_${Date.now()}`,
  name: '新物品',
  description: '',
  type: 'misc',
  rarity: 'common',
});

export const ItemEditor: React.FC<ItemEditorProps> = ({
  items,
  readOnly,
  onUpdate,
  onAIGenerate,
}) => {
  const [editingItem, setEditingItem] = useState<ItemDefinition | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiPreview, setAiPreview] = useState<ItemDefinition | null>(null);

  const handleAdd = useCallback(() => {
    const newItem = createEmptyItem();
    setEditingItem(newItem);
  }, []);

  const handleUpdate = useCallback(
    (updated: ItemDefinition) => {
      const existingIndex = items.findIndex((i) => i.id === updated.id);
      if (existingIndex >= 0) {
        onUpdate(items.map((i) => (i.id === updated.id ? updated : i)));
      } else {
        onUpdate([...items, updated]);
      }
      setEditingItem(null);
    },
    [items, onUpdate]
  );

  const handleDelete = useCallback(
    (id: string) => {
      onUpdate(items.filter((i) => i.id !== id));
      setDeleteConfirm(null);
    },
    [items, onUpdate]
  );

  const handleAIGenerate = useCallback(async () => {
    if (!onAIGenerate || !aiPrompt.trim()) return;
    setIsGenerating(true);
    try {
      const result = await onAIGenerate(aiPrompt);
      if (result) {
        setAiPreview(result);
      }
    } catch (err) {
      console.error('AI generation failed:', err);
    } finally {
      setIsGenerating(false);
    }
  }, [onAIGenerate, aiPrompt]);

  const handleAcceptAIPreview = useCallback(() => {
    if (aiPreview) {
      onUpdate([...items, aiPreview]);
      setAiPreview(null);
      setShowAIDialog(false);
      setAiPrompt('');
    }
  }, [aiPreview, items, onUpdate]);

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

  const getRarityColor = (rarity: string) => {
    return RARITY_OPTIONS.find((r) => r.value === rarity)?.color || 'var(--color-text-primary)';
  };

  if (editingItem) {
    return (
      <div style={{ padding: 'var(--spacing-lg)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
          <h3 style={{ margin: 0 }}>编辑物品</h3>
          <Button variant="ghost" size="small" onClick={() => setEditingItem(null)}>
            <Icon name="close" size={16} />
          </Button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
            <div>
              <label style={labelStyle}>名称</label>
              <input
                type="text"
                value={editingItem.name}
                onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>数量</label>
              <input
                type="number"
                min={1}
                value={editingItem.quantity || 1}
                onChange={(e) => setEditingItem({ ...editingItem, quantity: parseInt(e.target.value, 10) || 1 })}
                style={inputStyle}
              />
            </div>
          </div>

          <div>
            <label style={labelStyle}>描述</label>
            <textarea
              value={editingItem.description}
              onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
              rows={3}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
            <div>
              <label style={labelStyle}>类型</label>
              <select
                value={editingItem.type}
                onChange={(e) => setEditingItem({ ...editingItem, type: e.target.value as ItemDefinition['type'] })}
                style={inputStyle}
              >
                {ITEM_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>稀有度</label>
              <select
                value={editingItem.rarity}
                onChange={(e) => setEditingItem({ ...editingItem, rarity: e.target.value as ItemDefinition['rarity'] })}
                style={inputStyle}
              >
                {RARITY_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-md)' }}>
            <Button variant="primary" onClick={() => handleUpdate(editingItem)}>
              保存
            </Button>
            <Button variant="ghost" onClick={() => setEditingItem(null)}>
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
        <h3 style={{ margin: 0 }}>物品列表</h3>
        <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
          {onAIGenerate && !readOnly && (
            <Button variant="secondary" size="small" onClick={() => setShowAIDialog(true)} icon={<Icon name="sparkles" size={16} />}>
              AI 生成
            </Button>
          )}
          {!readOnly && (
            <Button variant="secondary" size="small" onClick={handleAdd} icon={<Icon name="plus" size={16} />}>
              添加物品
            </Button>
          )}
        </div>
      </div>

      {(items || []).length === 0 ? (
        <div style={{ textAlign: 'center', padding: 'var(--spacing-xl)', color: 'var(--color-text-secondary)' }}>
          暂无物品，点击上方按钮添加
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          {(items || []).map((item) => (
            <div
              key={item.id}
              style={{
                padding: 'var(--spacing-md)',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                borderLeft: `3px solid ${getRarityColor(item.rarity)}`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h4 style={{ margin: '0 0 var(--spacing-xs) 0', color: getRarityColor(item.rarity) }}>
                    {item.name}
                    {item.quantity && item.quantity > 1 && (
                      <span style={{ fontWeight: 'normal', color: 'var(--color-text-secondary)', marginLeft: 'var(--spacing-xs)' }}>
                        x{item.quantity}
                      </span>
                    )}
                  </h4>
                  <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                    {item.description || '暂无描述'}
                  </p>
                  <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-sm)', fontSize: 'var(--font-size-xs)' }}>
                    <span style={{ padding: 'var(--spacing-xs) var(--spacing-sm)', background: 'var(--color-background)', borderRadius: 'var(--radius-sm)' }}>
                      {ITEM_TYPES.find((t) => t.value === item.type)?.label || item.type}
                    </span>
                    <span style={{ color: getRarityColor(item.rarity) }}>
                      {RARITY_OPTIONS.find((r) => r.value === item.rarity)?.label || item.rarity}
                    </span>
                  </div>
                </div>
                {!readOnly && (
                  <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
                    <Button variant="ghost" size="small" onClick={() => setEditingItem(item)}>
                      <Icon name="edit" size={16} />
                    </Button>
                    <Button variant="ghost" size="small" onClick={() => setDeleteConfirm(item.id)}>
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
        title="删除物品"
        message="确定要删除这个物品吗？此操作无法撤销。"
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
            <h3 style={{ margin: '0 0 var(--spacing-md) 0' }}>AI 生成物品</h3>
            
            {!aiPreview ? (
              <>
                <div style={{ marginBottom: 'var(--spacing-md)' }}>
                  <label style={labelStyle}>描述你想要的物品</label>
                  <textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    rows={4}
                    placeholder="例如：一把锋利的铁剑，剑身刻有古老的符文..."
                    style={{ ...inputStyle, resize: 'vertical' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: 'var(--spacing-sm)', justifyContent: 'flex-end' }}>
                  <Button variant="ghost" onClick={() => { setShowAIDialog(false); setAiPrompt(''); }}>
                    取消
                  </Button>
                  <Button variant="primary" onClick={handleAIGenerate} loading={isGenerating} disabled={!aiPrompt.trim()}>
                    生成
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div style={{ marginBottom: 'var(--spacing-md)', padding: 'var(--spacing-md)', background: 'var(--color-background)', borderRadius: 'var(--radius-md)', borderLeft: `3px solid ${getRarityColor(aiPreview.rarity)}` }}>
                  <h4 style={{ margin: '0 0 var(--spacing-sm) 0', color: getRarityColor(aiPreview.rarity) }}>{aiPreview.name}</h4>
                  <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                    {aiPreview.description}
                  </p>
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
