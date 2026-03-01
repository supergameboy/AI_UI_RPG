import React, { useState, useCallback } from 'react';
import type { BackgroundDefinition } from '@ai-rpg/shared';
import { Button, Icon, ConfirmDialog } from '../../common';

interface BackgroundEditorProps {
  backgrounds: BackgroundDefinition[];
  readOnly: boolean;
  onUpdate: (backgrounds: BackgroundDefinition[]) => void;
}

const createEmptyBackground = (): BackgroundDefinition => ({
  id: `bg_${Date.now()}`,
  name: '新背景',
  description: '',
  skillProficiencies: [],
  languages: [],
  equipment: [],
  feature: '',
});

export const BackgroundEditor: React.FC<BackgroundEditorProps> = ({
  backgrounds,
  readOnly,
  onUpdate,
}) => {
  const [editingBg, setEditingBg] = useState<BackgroundDefinition | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [newSkill, setNewSkill] = useState('');
  const [newLang, setNewLang] = useState('');

  const handleAdd = useCallback(() => {
    const newBg = createEmptyBackground();
    onUpdate([...(backgrounds || []), newBg]);
    setEditingBg(newBg);
  }, [backgrounds, onUpdate]);

  const handleUpdate = useCallback(
    (updated: BackgroundDefinition) => {
      onUpdate((backgrounds || []).map((bg) => (bg.id === updated.id ? updated : bg)));
      setEditingBg(null);
    },
    [backgrounds, onUpdate]
  );

  const handleDelete = useCallback(
    (id: string) => {
      onUpdate((backgrounds || []).filter((bg) => bg.id !== id));
      setDeleteConfirm(null);
    },
    [backgrounds, onUpdate]
  );

  const addToArray = useCallback(
    (field: 'skillProficiencies' | 'languages' | 'equipment', value: string) => {
      if (!editingBg || !value.trim()) return;
      const currentArray = editingBg[field] || [];
      setEditingBg({
        ...editingBg,
        [field]: [...currentArray, value.trim()],
      });
    },
    [editingBg]
  );

  const removeFromArray = useCallback(
    (field: 'skillProficiencies' | 'languages' | 'equipment', index: number) => {
      if (!editingBg) return;
      const currentArray = editingBg[field] || [];
      setEditingBg({
        ...editingBg,
        [field]: currentArray.filter((_, i) => i !== index),
      });
    },
    [editingBg]
  );

  if (editingBg) {
    const skillProficiencies = editingBg.skillProficiencies || [];
    const languages = editingBg.languages || [];
    
    return (
      <div style={{ padding: 'var(--spacing-lg)' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 'var(--spacing-lg)',
          }}
        >
          <h3 style={{ margin: 0 }}>编辑背景</h3>
          <Button variant="ghost" size="small" onClick={() => setEditingBg(null)}>
            <Icon name="close" size={16} />
          </Button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          <div>
            <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontWeight: 500 }}>
              背景名称
            </label>
            <input
              type="text"
              value={editingBg.name}
              onChange={(e) => setEditingBg({ ...editingBg, name: e.target.value })}
              style={{
                width: '100%',
                padding: 'var(--spacing-sm)',
                background: 'var(--color-background)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-text-primary)',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontWeight: 500 }}>
              描述
            </label>
            <textarea
              value={editingBg.description}
              onChange={(e) => setEditingBg({ ...editingBg, description: e.target.value })}
              rows={3}
              style={{
                width: '100%',
                padding: 'var(--spacing-sm)',
                background: 'var(--color-background)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-text-primary)',
                resize: 'vertical',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontWeight: 500 }}>
              特性
            </label>
            <textarea
              value={editingBg.feature || ''}
              onChange={(e) => setEditingBg({ ...editingBg, feature: e.target.value })}
              rows={2}
              placeholder="描述这个背景的特殊特性"
              style={{
                width: '100%',
                padding: 'var(--spacing-sm)',
                background: 'var(--color-background)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-text-primary)',
                resize: 'vertical',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontWeight: 500 }}>
              技能熟练
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-xs)', marginBottom: 'var(--spacing-xs)' }}>
              {skillProficiencies.map((skill, i) => (
                <span
                  key={i}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-xs)',
                    padding: 'var(--spacing-xs) var(--spacing-sm)',
                    background: 'var(--color-primary-light)',
                    color: 'var(--color-primary)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 'var(--font-size-sm)',
                  }}
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => removeFromArray('skillProficiencies', i)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    <Icon name="close" size={12} />
                  </button>
                </span>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                placeholder="添加技能"
                style={{
                  flex: 1,
                  padding: 'var(--spacing-sm)',
                  background: 'var(--color-background)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--color-text-primary)',
                }}
              />
              <Button variant="secondary" size="small" onClick={() => { addToArray('skillProficiencies', newSkill); setNewSkill(''); }}>
                添加
              </Button>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontWeight: 500 }}>
              语言
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-xs)', marginBottom: 'var(--spacing-xs)' }}>
              {languages.map((lang, i) => (
                <span
                  key={i}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-xs)',
                    padding: 'var(--spacing-xs) var(--spacing-sm)',
                    background: 'var(--color-background)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 'var(--font-size-sm)',
                  }}
                >
                  {lang}
                  <button
                    type="button"
                    onClick={() => removeFromArray('languages', i)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    <Icon name="close" size={12} />
                  </button>
                </span>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
              <input
                type="text"
                value={newLang}
                onChange={(e) => setNewLang(e.target.value)}
                placeholder="添加语言"
                style={{
                  flex: 1,
                  padding: 'var(--spacing-sm)',
                  background: 'var(--color-background)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--color-text-primary)',
                }}
              />
              <Button variant="secondary" size="small" onClick={() => { addToArray('languages', newLang); setNewLang(''); }}>
                添加
              </Button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-md)' }}>
            <Button variant="primary" onClick={() => handleUpdate(editingBg)}>
              保存
            </Button>
            <Button variant="ghost" onClick={() => setEditingBg(null)}>
              取消
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 'var(--spacing-lg)' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 'var(--spacing-lg)',
        }}
      >
        <h3 style={{ margin: 0 }}>背景列表</h3>
        {!readOnly && (
          <Button variant="secondary" size="small" onClick={handleAdd} icon={<Icon name="plus" size={16} />}>
            添加背景
          </Button>
        )}
      </div>

      {(backgrounds || []).length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: 'var(--spacing-xl)',
            color: 'var(--color-text-secondary)',
          }}
        >
          暂无背景，点击上方按钮添加
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          {(backgrounds || []).map((bg) => (
            <div
              key={bg.id}
              style={{
                padding: 'var(--spacing-md)',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h4 style={{ margin: '0 0 var(--spacing-xs) 0' }}>{bg.name}</h4>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 'var(--font-size-sm)',
                      color: 'var(--color-text-secondary)',
                    }}
                  >
                    {bg.description || '暂无描述'}
                  </p>
                  {bg.feature && (
                    <p
                      style={{
                        margin: 'var(--spacing-sm) 0 0 0',
                        fontSize: 'var(--font-size-xs)',
                        color: 'var(--color-primary)',
                      }}
                    >
                      特性: {bg.feature}
                    </p>
                  )}
                </div>
                {!readOnly && (
                  <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
                    <Button variant="ghost" size="small" onClick={() => setEditingBg(bg)}>
                      <Icon name="edit" size={16} />
                    </Button>
                    <Button variant="ghost" size="small" onClick={() => setDeleteConfirm(bg.id)}>
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
        title="删除背景"
        message="确定要删除这个背景吗？此操作无法撤销。"
        confirmText="删除"
        cancelText="取消"
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
};
