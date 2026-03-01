import React, { useState, useCallback } from 'react';
import type { ClassDefinition } from '@ai-rpg/shared';
import { Button, Icon, ConfirmDialog } from '../../common';

const ATTRIBUTE_OPTIONS = [
  { value: 'strength', label: '力量' },
  { value: 'dexterity', label: '敏捷' },
  { value: 'constitution', label: '体质' },
  { value: 'intelligence', label: '智力' },
  { value: 'wisdom', label: '感知' },
  { value: 'charisma', label: '魅力' },
];

const HIT_DIE_OPTIONS = ['d4', 'd6', 'd8', 'd10', 'd12'];

const getAttributeLabel = (value: string): string => {
  return ATTRIBUTE_OPTIONS.find((a) => a.value === value)?.label || value;
};

interface ClassEditorProps {
  classes: ClassDefinition[];
  readOnly: boolean;
  onUpdate: (classes: ClassDefinition[]) => void;
}

const createEmptyClass = (): ClassDefinition => ({
  id: `class_${Date.now()}`,
  name: '新职业',
  description: '',
  primaryAttributes: [],
  hitDie: 'd8',
  skillProficiencies: [],
  startingEquipment: [],
});

export const ClassEditor: React.FC<ClassEditorProps> = ({
  classes,
  readOnly,
  onUpdate,
}) => {
  const [editingClass, setEditingClass] = useState<ClassDefinition | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleAdd = useCallback(() => {
    const newClass = createEmptyClass();
    onUpdate([...classes, newClass]);
    setEditingClass(newClass);
  }, [classes, onUpdate]);

  const handleUpdate = useCallback(
    (updatedClass: ClassDefinition) => {
      onUpdate(classes.map((c) => (c.id === updatedClass.id ? updatedClass : c)));
      setEditingClass(null);
    },
    [classes, onUpdate]
  );

  const handleDelete = useCallback(
    (id: string) => {
      onUpdate(classes.filter((c) => c.id !== id));
      setDeleteConfirm(null);
    },
    [classes, onUpdate]
  );

  const toggleAttribute = useCallback(
    (attr: string) => {
      if (!editingClass) return;
      const newAttrs = editingClass.primaryAttributes.includes(attr)
        ? editingClass.primaryAttributes.filter((a) => a !== attr)
        : [...editingClass.primaryAttributes, attr];
      setEditingClass({ ...editingClass, primaryAttributes: newAttrs });
    },
    [editingClass]
  );

  if (editingClass) {
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
          <h3 style={{ margin: 0 }}>编辑职业</h3>
          <Button variant="ghost" size="small" onClick={() => setEditingClass(null)}>
            <Icon name="close" size={16} />
          </Button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          <div>
            <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontWeight: 500 }}>
              职业名称
            </label>
            <input
              type="text"
              value={editingClass.name}
              onChange={(e) => setEditingClass({ ...editingClass, name: e.target.value })}
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
              value={editingClass.description}
              onChange={(e) => setEditingClass({ ...editingClass, description: e.target.value })}
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
              生命骰
            </label>
            <select
              value={editingClass.hitDie}
              onChange={(e) => setEditingClass({ ...editingClass, hitDie: e.target.value })}
              style={{
                width: '100%',
                padding: 'var(--spacing-sm)',
                background: 'var(--color-background)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-text-primary)',
              }}
            >
              {HIT_DIE_OPTIONS.map((hd) => (
                <option key={hd} value={hd}>
                  {hd}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontWeight: 500 }}>
              主属性
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-xs)' }}>
              {ATTRIBUTE_OPTIONS.map((attr) => (
                <button
                  key={attr.value}
                  type="button"
                  onClick={() => toggleAttribute(attr.value)}
                  style={{
                    padding: 'var(--spacing-xs) var(--spacing-sm)',
                    background: editingClass.primaryAttributes.includes(attr.value)
                      ? 'var(--color-primary)'
                      : 'var(--color-background)',
                    color: editingClass.primaryAttributes.includes(attr.value)
                      ? 'white'
                      : 'var(--color-text-primary)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                  }}
                >
                  {attr.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-md)' }}>
            <Button variant="primary" onClick={() => handleUpdate(editingClass)}>
              保存
            </Button>
            <Button variant="ghost" onClick={() => setEditingClass(null)}>
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
        <h3 style={{ margin: 0 }}>职业列表</h3>
        {!readOnly && (
          <Button variant="secondary" size="small" onClick={handleAdd} icon={<Icon name="plus" size={16} />}>
            添加职业
          </Button>
        )}
      </div>

      {classes.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: 'var(--spacing-xl)',
            color: 'var(--color-text-secondary)',
          }}
        >
          暂无职业，点击上方按钮添加
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          {classes.map((cls) => (
            <div
              key={cls.id}
              style={{
                padding: 'var(--spacing-md)',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h4 style={{ margin: '0 0 var(--spacing-xs) 0' }}>{cls.name}</h4>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 'var(--font-size-sm)',
                      color: 'var(--color-text-secondary)',
                    }}
                  >
                    {cls.description || '暂无描述'}
                  </p>
                  <div
                    style={{
                      display: 'flex',
                      gap: 'var(--spacing-md)',
                      marginTop: 'var(--spacing-sm)',
                      fontSize: 'var(--font-size-xs)',
                      color: 'var(--color-text-tertiary)',
                    }}
                  >
                    <span>生命骰: {cls.hitDie}</span>
                    <span>主属性: {(cls.primaryAttributes || []).map(getAttributeLabel).join('、') || '无'}</span>
                  </div>
                </div>
                {!readOnly && (
                  <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
                    <Button variant="ghost" size="small" onClick={() => setEditingClass(cls)}>
                      <Icon name="edit" size={16} />
                    </Button>
                    <Button variant="ghost" size="small" onClick={() => setDeleteConfirm(cls.id)}>
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
        title="删除职业"
        message="确定要删除这个职业吗？此操作无法撤销。"
        confirmText="删除"
        cancelText="取消"
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
};
