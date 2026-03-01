import React, { useState, useCallback, useMemo } from 'react';
import type { ClassDefinition, StoryTemplate, AttributeDefinition } from '@ai-rpg/shared';
import { Button, Icon, ConfirmDialog } from '../../common';

const DEFAULT_ATTRIBUTES: AttributeDefinition[] = [
  { id: 'strength', name: '力量', abbreviation: 'STR', description: '', defaultValue: 10, minValue: 1, maxValue: 20 },
  { id: 'dexterity', name: '敏捷', abbreviation: 'DEX', description: '', defaultValue: 10, minValue: 1, maxValue: 20 },
  { id: 'constitution', name: '体质', abbreviation: 'CON', description: '', defaultValue: 10, minValue: 1, maxValue: 20 },
  { id: 'intelligence', name: '智力', abbreviation: 'INT', description: '', defaultValue: 10, minValue: 1, maxValue: 20 },
  { id: 'wisdom', name: '感知', abbreviation: 'WIS', description: '', defaultValue: 10, minValue: 1, maxValue: 20 },
  { id: 'charisma', name: '魅力', abbreviation: 'CHA', description: '', defaultValue: 10, minValue: 1, maxValue: 20 },
];

const HIT_DIE_OPTIONS = ['d4', 'd6', 'd8', 'd10', 'd12'];

interface ClassEditorProps {
  classes: ClassDefinition[];
  attributes?: AttributeDefinition[];
  readOnly: boolean;
  onUpdate: (classes: ClassDefinition[]) => void;
  onAIGenerate?: (prompt: string) => Promise<ClassDefinition | null>;
  template?: Partial<StoryTemplate>;
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
  attributes = DEFAULT_ATTRIBUTES,
  readOnly,
  onUpdate,
  onAIGenerate,
  template: _template,
}) => {
  const [editingClass, setEditingClass] = useState<ClassDefinition | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [aiPrompt, setAIPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiPreview, setAIPreview] = useState<ClassDefinition | null>(null);

  // 将 attributes 转换为选择器格式
  const attributeOptions = useMemo(
    () => attributes.map((attr) => ({ value: attr.id, label: attr.name })),
    [attributes]
  );

  // 获取属性标签
  const getAttributeLabel = useCallback(
    (value: string): string => {
      return attributes.find((a) => a.id === value)?.name || value;
    },
    [attributes]
  );

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

  const handleAIGenerate = useCallback(async () => {
    if (!onAIGenerate) return;
    
    setIsGenerating(true);
    setAIPreview(null);
    
    try {
      const result = await onAIGenerate(aiPrompt);
      if (result) {
        setAIPreview(result);
      }
    } catch (error) {
      console.error('AI generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [onAIGenerate, aiPrompt]);

  const handleAddAIPreview = useCallback(() => {
    if (aiPreview) {
      onUpdate([...classes, aiPreview]);
      setAIPreview(null);
      setAIPrompt('');
      setShowAIDialog(false);
    }
  }, [aiPreview, classes, onUpdate]);

  const handleRegenerate = useCallback(() => {
    setAIPreview(null);
    handleAIGenerate();
  }, [handleAIGenerate]);

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
              {attributeOptions.map((attr) => (
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
          <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
            {onAIGenerate && (
              <Button 
                variant="secondary" 
                size="small" 
                onClick={() => setShowAIDialog(true)} 
                icon={<Icon name="sparkles" size={16} />}
              >
                AI 生成
              </Button>
            )}
            <Button variant="secondary" size="small" onClick={handleAdd} icon={<Icon name="plus" size={16} />}>
              添加职业
            </Button>
          </div>
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

      {/* AI 生成对话框 */}
      {showAIDialog && (
        <div
          style={{
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
          }}
          onClick={() => !isGenerating && setShowAIDialog(false)}
        >
          <div
            style={{
              background: 'var(--color-surface)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--spacing-lg)',
              width: '500px',
              maxWidth: '90vw',
              maxHeight: '90vh',
              overflow: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 'var(--spacing-lg)',
              }}
            >
              <h3 style={{ margin: 0 }}>AI 生成职业</h3>
              <Button variant="ghost" size="small" onClick={() => !isGenerating && setShowAIDialog(false)}>
                <Icon name="close" size={16} />
              </Button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
              <div>
                <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontWeight: 500 }}>
                  描述提示词（可选）
                </label>
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAIPrompt(e.target.value)}
                  placeholder="例如：一个擅长远程攻击的精灵弓箭手职业..."
                  rows={3}
                  disabled={isGenerating}
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

              <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                <Button
                  variant="primary"
                  onClick={handleAIGenerate}
                  disabled={isGenerating}
                  icon={<Icon name="sparkles" size={16} />}
                >
                  {isGenerating ? '生成中...' : (aiPrompt ? '根据描述生成' : '自动生成')}
                </Button>
              </div>

              {/* AI 预览 */}
              {aiPreview && (
                <div
                  style={{
                    marginTop: 'var(--spacing-md)',
                    padding: 'var(--spacing-md)',
                    background: 'var(--color-background)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  <h4 style={{ margin: '0 0 var(--spacing-sm) 0', color: 'var(--color-primary)' }}>
                    生成预览
                  </h4>
                  <div style={{ marginBottom: 'var(--spacing-sm)' }}>
                    <strong>名称：</strong>{aiPreview.name}
                  </div>
                  <div style={{ marginBottom: 'var(--spacing-sm)' }}>
                    <strong>描述：</strong>{aiPreview.description || '暂无描述'}
                  </div>
                  <div style={{ marginBottom: 'var(--spacing-sm)' }}>
                    <strong>生命骰：</strong>{aiPreview.hitDie}
                  </div>
                  <div style={{ marginBottom: 'var(--spacing-sm)' }}>
                    <strong>主属性：</strong>{(aiPreview.primaryAttributes || []).map(getAttributeLabel).join('、') || '无'}
                  </div>
                  {(aiPreview.skillProficiencies?.length ?? 0) > 0 && (
                    <div style={{ marginBottom: 'var(--spacing-sm)' }}>
                      <strong>技能熟练：</strong>{aiPreview.skillProficiencies?.join('、')}
                    </div>
                  )}
                  {(aiPreview.startingEquipment?.length ?? 0) > 0 && (
                    <div>
                      <strong>初始装备：</strong>{aiPreview.startingEquipment?.join('、')}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-md)' }}>
                    <Button variant="primary" onClick={handleAddAIPreview}>
                      添加到列表
                    </Button>
                    <Button variant="secondary" onClick={handleRegenerate} disabled={isGenerating}>
                      重新生成
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
