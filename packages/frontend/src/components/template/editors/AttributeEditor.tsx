import React, { useState, useCallback } from 'react';
import type { AttributeDefinition } from '@ai-rpg/shared';
import { Button, Icon, Input, TextArea, ConfirmDialog } from '../../common';

export interface AttributeEditorProps {
  attributes: AttributeDefinition[];
  readOnly: boolean;
  onUpdate: (attributes: AttributeDefinition[]) => void;
  onDeleteAttribute?: (attributeId: string) => void;
}

const createEmptyAttribute = (): AttributeDefinition => ({
  id: `attr_${Date.now()}`,
  name: '',
  abbreviation: '',
  description: '',
  defaultValue: 10,
  minValue: 1,
  maxValue: 20,
});

export const AttributeEditor: React.FC<AttributeEditorProps> = ({
  attributes: propAttributes,
  readOnly,
  onUpdate,
  onDeleteAttribute,
}) => {
  const attributes = propAttributes || [];
  const [editingAttribute, setEditingAttribute] = useState<AttributeDefinition | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleAddNew = useCallback(() => {
    setEditingAttribute(createEmptyAttribute());
    setIsAddingNew(true);
  }, []);

  const handleEdit = useCallback((attribute: AttributeDefinition) => {
    setEditingAttribute({ ...attribute });
    setIsAddingNew(false);
  }, []);

  const handleCancel = useCallback(() => {
    setEditingAttribute(null);
    setIsAddingNew(false);
  }, []);

  const handleSave = useCallback(() => {
    if (!editingAttribute) return;

    if (!editingAttribute.name.trim()) {
      alert('属性名称不能为空');
      return;
    }

    if (!editingAttribute.abbreviation.trim()) {
      alert('属性缩写不能为空');
      return;
    }

    if (editingAttribute.minValue >= editingAttribute.maxValue) {
      alert('最小值必须小于最大值');
      return;
    }

    if (editingAttribute.defaultValue < editingAttribute.minValue ||
        editingAttribute.defaultValue > editingAttribute.maxValue) {
      alert('默认值必须在最小值和最大值之间');
      return;
    }

    if (isAddingNew) {
      onUpdate([...attributes, editingAttribute]);
    } else {
      onUpdate(attributes.map(a => a.id === editingAttribute.id ? editingAttribute : a));
    }

    setEditingAttribute(null);
    setIsAddingNew(false);
  }, [editingAttribute, isAddingNew, attributes, onUpdate]);

  const handleDelete = useCallback((id: string) => {
    if (onDeleteAttribute) {
      onDeleteAttribute(id);
    }
    onUpdate(attributes.filter(a => a.id !== id));
    setDeleteConfirm(null);
  }, [attributes, onUpdate, onDeleteAttribute]);

  const handleFieldChange = useCallback((field: keyof AttributeDefinition, value: string | number) => {
    if (!editingAttribute) return;
    setEditingAttribute({ ...editingAttribute, [field]: value });
  }, [editingAttribute]);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>属性列表</h3>
        {!readOnly && (
          <Button
            variant="primary"
            size="small"
            onClick={handleAddNew}
            icon={<Icon name="plus" size={16} />}
          >
            添加属性
          </Button>
        )}
      </div>

      {editingAttribute ? (
        <div style={styles.editor}>
          <div style={styles.editorHeader}>
            <h4 style={styles.editorTitle}>
              {isAddingNew ? '新建属性' : '编辑属性'}
            </h4>
            <div style={styles.editorActions}>
              <Button variant="ghost" size="small" onClick={handleCancel}>
                取消
              </Button>
              <Button variant="primary" size="small" onClick={handleSave}>
                保存
              </Button>
            </div>
          </div>

          <div style={styles.form}>
            <div style={styles.formRow}>
              <Input
                label="属性ID"
                value={editingAttribute.id}
                onChange={(e) => handleFieldChange('id', e.target.value)}
                fullWidth
                placeholder="输入属性ID（如：str、dex）"
                disabled={!isAddingNew}
              />
              <Input
                label="属性名称"
                value={editingAttribute.name}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                fullWidth
                placeholder="输入属性名称（如：力量）"
              />
              <Input
                label="属性缩写"
                value={editingAttribute.abbreviation}
                onChange={(e) => handleFieldChange('abbreviation', e.target.value)}
                fullWidth
                placeholder="输入缩写（如：STR）"
                maxLength={4}
              />
            </div>

            <TextArea
              label="描述"
              value={editingAttribute.description}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              fullWidth
              placeholder="输入属性描述"
              rows={3}
            />

            <div style={styles.section}>
              <h5 style={styles.sectionTitle}>数值范围</h5>
              <div style={styles.numericRow}>
                <div style={styles.numericField}>
                  <label style={styles.numericLabel}>最小值</label>
                  <input
                    type="number"
                    style={styles.numericInput}
                    value={editingAttribute.minValue}
                    onChange={(e) => handleFieldChange('minValue', parseInt(e.target.value) || 0)}
                    min={0}
                    max={1000}
                  />
                </div>
                <div style={styles.numericField}>
                  <label style={styles.numericLabel}>默认值</label>
                  <input
                    type="number"
                    style={styles.numericInput}
                    value={editingAttribute.defaultValue}
                    onChange={(e) => handleFieldChange('defaultValue', parseInt(e.target.value) || 0)}
                    min={editingAttribute.minValue}
                    max={editingAttribute.maxValue}
                  />
                </div>
                <div style={styles.numericField}>
                  <label style={styles.numericLabel}>最大值</label>
                  <input
                    type="number"
                    style={styles.numericInput}
                    value={editingAttribute.maxValue}
                    onChange={(e) => handleFieldChange('maxValue', parseInt(e.target.value) || 0)}
                    min={editingAttribute.minValue + 1}
                    max={1000}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div style={styles.list}>
          {attributes.length === 0 ? (
            <div style={styles.empty}>
              <Icon name="info" size={48} />
              <p>暂无属性定义</p>
              {!readOnly && (
                <Button variant="primary" onClick={handleAddNew}>
                  添加第一个属性
                </Button>
              )}
            </div>
          ) : (
            attributes.map(attribute => (
              <div key={attribute.id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <div style={styles.cardTitleRow}>
                    <span style={styles.abbreviation}>{attribute.abbreviation}</span>
                    <h4 style={styles.cardTitle}>{attribute.name || '未命名属性'}</h4>
                  </div>
                  {!readOnly && (
                    <div style={styles.cardActions}>
                      <button
                        style={styles.iconButton}
                        onClick={() => handleEdit(attribute)}
                        title="编辑"
                      >
                        <Icon name="edit" size={16} />
                      </button>
                      <button
                        style={styles.iconButton}
                        onClick={() => setDeleteConfirm(attribute.id)}
                        title="删除"
                      >
                        <Icon name="trash" size={16} />
                      </button>
                    </div>
                  )}
                </div>
                <p style={styles.cardDescription}>
                  {attribute.description || '暂无描述'}
                </p>
                <div style={styles.cardStats}>
                  <div style={styles.statGroup}>
                    <span style={styles.statLabel}>数值范围：</span>
                    <span style={styles.statValue}>
                      {attribute.minValue} - {attribute.maxValue}
                    </span>
                  </div>
                  <div style={styles.statGroup}>
                    <span style={styles.statLabel}>默认值：</span>
                    <span style={styles.statValue}>{attribute.defaultValue}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <ConfirmDialog
        open={deleteConfirm !== null}
        title="删除属性"
        message="确定要删除这个属性吗？此操作无法撤销。"
        confirmText="删除"
        cancelText="取消"
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    gap: '16px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexShrink: 0,
  },
  title: {
    margin: 0,
    fontSize: '18px',
    fontWeight: 600,
    color: 'var(--color-text-primary)',
  },
  list: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '16px',
    overflowY: 'auto',
  },
  card: {
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  abbreviation: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '40px',
    height: '24px',
    padding: '0 8px',
    background: 'var(--color-primary)',
    color: 'white',
    borderRadius: 'var(--radius-sm)',
    fontSize: '11px',
    fontWeight: 700,
    fontFamily: 'monospace',
  },
  cardTitle: {
    margin: 0,
    fontSize: '16px',
    fontWeight: 600,
    color: 'var(--color-text-primary)',
  },
  cardActions: {
    display: 'flex',
    gap: '4px',
  },
  iconButton: {
    background: 'transparent',
    border: 'none',
    padding: '4px',
    cursor: 'pointer',
    color: 'var(--color-text-secondary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 'var(--radius-sm)',
    transition: 'all 0.2s',
  },
  cardDescription: {
    margin: 0,
    fontSize: '14px',
    color: 'var(--color-text-secondary)',
    lineHeight: 1.5,
  },
  cardStats: {
    display: 'flex',
    gap: '16px',
    paddingTop: '8px',
    borderTop: '1px solid var(--color-border)',
    flexWrap: 'wrap',
  },
  statGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13px',
  },
  statLabel: {
    color: 'var(--color-text-tertiary)',
  },
  statValue: {
    fontFamily: 'monospace',
    color: 'var(--color-text-primary)',
    fontWeight: 500,
  },
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    padding: '48px',
    color: 'var(--color-text-tertiary)',
    background: 'var(--color-surface)',
    border: '1px dashed var(--color-border)',
    borderRadius: 'var(--radius-lg)',
  },
  editor: {
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)',
    overflow: 'hidden',
  },
  editorHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    borderBottom: '1px solid var(--color-border)',
    background: 'var(--color-background)',
  },
  editorTitle: {
    margin: 0,
    fontSize: '16px',
    fontWeight: 600,
    color: 'var(--color-text-primary)',
  },
  editorActions: {
    display: 'flex',
    gap: '8px',
  },
  form: {
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    overflowY: 'auto',
    maxHeight: 'calc(100vh - 300px)',
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  sectionTitle: {
    margin: 0,
    fontSize: '14px',
    fontWeight: 500,
    color: 'var(--color-text-primary)',
  },
  numericRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '16px',
  },
  numericField: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  numericLabel: {
    fontSize: '13px',
    color: 'var(--color-text-secondary)',
  },
  numericInput: {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-sm)',
    background: 'var(--color-background)',
    color: 'var(--color-text-primary)',
    fontSize: '14px',
    textAlign: 'center',
  },
};

export default AttributeEditor;
