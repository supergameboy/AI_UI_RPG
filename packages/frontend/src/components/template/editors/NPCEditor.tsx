import React, { useState, useCallback } from 'react';
import type { NPCDefinition } from '@ai-rpg/shared';
import { Button, Icon, ConfirmDialog } from '../../common';

type NPCServiceType = 'shop' | 'inn' | 'blacksmith' | 'healer' | 'training';

interface NPCEditorProps {
  npcs: NPCDefinition[];
  readOnly: boolean;
  onUpdate: (npcs: NPCDefinition[]) => void;
  onAIGenerate?: (prompt: string) => Promise<NPCDefinition | null>;
}

const NPC_ROLES = [
  { value: 'merchant', label: '商人' },
  { value: 'quest_giver', label: '任务发布者' },
  { value: 'enemy', label: '敌人' },
  { value: 'ally', label: '盟友' },
  { value: 'neutral', label: '中立' },
  { value: 'custom', label: '自定义' },
];

const NPC_SERVICES: { value: NPCServiceType; label: string }[] = [
  { value: 'shop', label: '商店' },
  { value: 'inn', label: '旅馆' },
  { value: 'blacksmith', label: '铁匠铺' },
  { value: 'healer', label: '治疗' },
  { value: 'training', label: '训练' },
];

const createEmptyNPC = (): NPCDefinition => ({
  id: `npc_${Date.now()}`,
  name: '新NPC',
  description: '',
  role: 'neutral',
});

export const NPCEditor: React.FC<NPCEditorProps> = ({
  npcs,
  readOnly,
  onUpdate,
  onAIGenerate,
}) => {
  const [editingNpc, setEditingNpc] = useState<NPCDefinition | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiPreview, setAiPreview] = useState<NPCDefinition | null>(null);

  const handleAdd = useCallback(() => {
    const newNpc = createEmptyNPC();
    setEditingNpc(newNpc);
  }, []);

  const handleUpdate = useCallback(
    (updated: NPCDefinition) => {
      const existingIndex = npcs.findIndex((n) => n.id === updated.id);
      if (existingIndex >= 0) {
        onUpdate(npcs.map((n) => (n.id === updated.id ? updated : n)));
      } else {
        onUpdate([...npcs, updated]);
      }
      setEditingNpc(null);
    },
    [npcs, onUpdate]
  );

  const handleDelete = useCallback(
    (id: string) => {
      onUpdate(npcs.filter((n) => n.id !== id));
      setDeleteConfirm(null);
    },
    [npcs, onUpdate]
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
      onUpdate([...npcs, aiPreview]);
      setAiPreview(null);
      setShowAIDialog(false);
      setAiPrompt('');
    }
  }, [aiPreview, npcs, onUpdate]);

  const toggleService = useCallback(
    (service: NPCServiceType) => {
      if (!editingNpc) return;
      const services = editingNpc.services || [];
      const newServices = services.includes(service)
        ? services.filter((s) => s !== service)
        : [...services, service];
      setEditingNpc({ ...editingNpc, services: newServices });
    },
    [editingNpc]
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

  if (editingNpc) {
    return (
      <div style={{ padding: 'var(--spacing-lg)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
          <h3 style={{ margin: 0 }}>编辑 NPC</h3>
          <Button variant="ghost" size="small" onClick={() => setEditingNpc(null)}>
            <Icon name="close" size={16} />
          </Button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
            <div>
              <label style={labelStyle}>名称</label>
              <input
                type="text"
                value={editingNpc.name}
                onChange={(e) => setEditingNpc({ ...editingNpc, name: e.target.value })}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>头衔</label>
              <input
                type="text"
                value={editingNpc.title || ''}
                onChange={(e) => setEditingNpc({ ...editingNpc, title: e.target.value })}
                placeholder="如：村长、商人、守卫"
                style={inputStyle}
              />
            </div>
          </div>

          <div>
            <label style={labelStyle}>描述</label>
            <textarea
              value={editingNpc.description}
              onChange={(e) => setEditingNpc({ ...editingNpc, description: e.target.value })}
              rows={3}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          <div>
            <label style={labelStyle}>角色类型</label>
            <select
              value={editingNpc.role}
              onChange={(e) => setEditingNpc({ ...editingNpc, role: e.target.value as NPCDefinition['role'] })}
              style={inputStyle}
            >
              {NPC_ROLES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>性格特点</label>
            <textarea
              value={editingNpc.personality || ''}
              onChange={(e) => setEditingNpc({ ...editingNpc, personality: e.target.value })}
              rows={2}
              placeholder="描述NPC的性格特点..."
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          <div>
            <label style={labelStyle}>服务类型</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-xs)' }}>
              {NPC_SERVICES.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => toggleService(s.value)}
                  style={{
                    padding: 'var(--spacing-xs) var(--spacing-sm)',
                    background: (editingNpc.services || []).includes(s.value)
                      ? 'var(--color-primary)'
                      : 'var(--color-background)',
                    color: (editingNpc.services || []).includes(s.value)
                      ? 'white'
                      : 'var(--color-text-primary)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-md)' }}>
            <Button variant="primary" onClick={() => handleUpdate(editingNpc)}>
              保存
            </Button>
            <Button variant="ghost" onClick={() => setEditingNpc(null)}>
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
        <h3 style={{ margin: 0 }}>NPC 列表</h3>
        <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
          {onAIGenerate && !readOnly && (
            <Button variant="secondary" size="small" onClick={() => setShowAIDialog(true)} icon={<Icon name="sparkles" size={16} />}>
              AI 生成
            </Button>
          )}
          {!readOnly && (
            <Button variant="secondary" size="small" onClick={handleAdd} icon={<Icon name="plus" size={16} />}>
              添加 NPC
            </Button>
          )}
        </div>
      </div>

      {(npcs || []).length === 0 ? (
        <div style={{ textAlign: 'center', padding: 'var(--spacing-xl)', color: 'var(--color-text-secondary)' }}>
          暂无 NPC，点击上方按钮添加
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          {(npcs || []).map((npc) => (
            <div
              key={npc.id}
              style={{
                padding: 'var(--spacing-md)',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h4 style={{ margin: '0 0 var(--spacing-xs) 0' }}>
                    {npc.name}
                    {npc.title && <span style={{ fontWeight: 'normal', color: 'var(--color-text-secondary)', marginLeft: 'var(--spacing-xs)' }}>- {npc.title}</span>}
                  </h4>
                  <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                    {npc.description || '暂无描述'}
                  </p>
                  <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-sm)', fontSize: 'var(--font-size-xs)' }}>
                    <span style={{ padding: 'var(--spacing-xs) var(--spacing-sm)', background: 'var(--color-primary-light)', color: 'var(--color-primary)', borderRadius: 'var(--radius-sm)' }}>
                      {NPC_ROLES.find((r) => r.value === npc.role)?.label || npc.role}
                    </span>
                    {(npc.services || []).length > 0 && (
                      <span style={{ color: 'var(--color-text-tertiary)' }}>
                        服务: {(npc.services || []).map((s) => NPC_SERVICES.find((ns) => ns.value === s)?.label).join('、')}
                      </span>
                    )}
                  </div>
                </div>
                {!readOnly && (
                  <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
                    <Button variant="ghost" size="small" onClick={() => setEditingNpc(npc)}>
                      <Icon name="edit" size={16} />
                    </Button>
                    <Button variant="ghost" size="small" onClick={() => setDeleteConfirm(npc.id)}>
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
        title="删除 NPC"
        message="确定要删除这个 NPC 吗？此操作无法撤销。"
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
            <h3 style={{ margin: '0 0 var(--spacing-md) 0' }}>AI 生成 NPC</h3>
            
            {!aiPreview ? (
              <>
                <div style={{ marginBottom: 'var(--spacing-md)' }}>
                  <label style={labelStyle}>描述你想要的 NPC（可选）</label>
                  <textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    rows={4}
                    placeholder="留空将根据世界观自动生成，或输入描述如：一个友好的村庄铁匠..."
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
                <div style={{ marginBottom: 'var(--spacing-md)', padding: 'var(--spacing-md)', background: 'var(--color-background)', borderRadius: 'var(--radius-md)' }}>
                  <h4 style={{ margin: '0 0 var(--spacing-sm) 0' }}>{aiPreview.name}</h4>
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
