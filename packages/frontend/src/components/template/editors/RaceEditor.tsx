import React, { useState, useCallback, useMemo } from 'react';
import type { RaceDefinition, ClassDefinition, StoryTemplate, AttributeDefinition } from '@ai-rpg/shared';
import { Button, Icon, Input, TextArea, ConfirmDialog } from '../../common';

export interface RaceEditorProps {
  races: RaceDefinition[];
  classes: ClassDefinition[];
  attributes?: AttributeDefinition[];
  readOnly: boolean;
  template?: Partial<StoryTemplate>;
  onUpdate: (races: RaceDefinition[]) => void;
  onAIGenerate?: (prompt: string, template?: Partial<StoryTemplate>) => Promise<RaceDefinition | null>;
}

const DEFAULT_ATTRIBUTES: AttributeDefinition[] = [
  { id: 'strength', name: '力量', abbreviation: 'STR', description: '', defaultValue: 10, minValue: 1, maxValue: 20 },
  { id: 'dexterity', name: '敏捷', abbreviation: 'DEX', description: '', defaultValue: 10, minValue: 1, maxValue: 20 },
  { id: 'constitution', name: '体质', abbreviation: 'CON', description: '', defaultValue: 10, minValue: 1, maxValue: 20 },
  { id: 'intelligence', name: '智力', abbreviation: 'INT', description: '', defaultValue: 10, minValue: 1, maxValue: 20 },
  { id: 'wisdom', name: '感知', abbreviation: 'WIS', description: '', defaultValue: 10, minValue: 1, maxValue: 20 },
  { id: 'charisma', name: '魅力', abbreviation: 'CHA', description: '', defaultValue: 10, minValue: 1, maxValue: 20 },
];

const createEmptyRace = (): RaceDefinition => ({
  id: `race_${Date.now()}`,
  name: '',
  description: '',
  bonuses: {},
  penalties: {},
  abilities: [],
  availableClasses: [],
});

export const RaceEditor: React.FC<RaceEditorProps> = ({
  races,
  classes,
  attributes = DEFAULT_ATTRIBUTES,
  readOnly,
  template,
  onUpdate,
  onAIGenerate,
}) => {
  const [editingRace, setEditingRace] = useState<RaceDefinition | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [newAbility, setNewAbility] = useState('');
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiPreview, setAiPreview] = useState<RaceDefinition | null>(null);

  // 将 attributes 转换为选择器格式
  const attributeOptions = useMemo(() => 
    attributes.map(attr => ({
      key: attr.id,
      label: attr.name,
    })),
    [attributes]
  );

  const handleAddNew = useCallback(() => {
    setEditingRace(createEmptyRace());
    setIsAddingNew(true);
  }, []);

  const handleEdit = useCallback((race: RaceDefinition) => {
    setEditingRace({ ...race });
    setIsAddingNew(false);
  }, []);

  const handleCancel = useCallback(() => {
    setEditingRace(null);
    setIsAddingNew(false);
    setNewAbility('');
  }, []);

  const handleSave = useCallback(() => {
    if (!editingRace) return;

    if (!editingRace.name.trim()) {
      alert('种族名称不能为空');
      return;
    }

    if (isAddingNew) {
      onUpdate([...races, editingRace]);
    } else {
      onUpdate(races.map(r => r.id === editingRace.id ? editingRace : r));
    }

    setEditingRace(null);
    setIsAddingNew(false);
    setNewAbility('');
  }, [editingRace, isAddingNew, races, onUpdate]);

  const handleDelete = useCallback((id: string) => {
    onUpdate(races.filter(r => r.id !== id));
    setDeleteConfirm(null);
  }, [races, onUpdate]);

  const handleFieldChange = useCallback((field: keyof RaceDefinition, value: string | string[] | Record<string, number>) => {
    if (!editingRace) return;
    setEditingRace({ ...editingRace, [field]: value });
  }, [editingRace]);

  const handleAttributeChange = useCallback((
    type: 'bonuses' | 'penalties',
    attr: string,
    value: number
  ) => {
    if (!editingRace) return;
    const currentAttrs = editingRace[type] || {};
    const newAttrs = { ...currentAttrs };
    if (value === 0) {
      delete newAttrs[attr];
    } else {
      newAttrs[attr] = value;
    }
    setEditingRace({ ...editingRace, [type]: newAttrs });
  }, [editingRace]);

  const handleAddAbility = useCallback(() => {
    if (!editingRace || !newAbility.trim()) return;
    setEditingRace({
      ...editingRace,
      abilities: [...(editingRace.abilities || []), newAbility.trim()],
    });
    setNewAbility('');
  }, [editingRace, newAbility]);

  const handleRemoveAbility = useCallback((index: number) => {
    if (!editingRace) return;
    setEditingRace({
      ...editingRace,
      abilities: (editingRace.abilities || []).filter((_, i) => i !== index),
    });
  }, [editingRace]);

  const handleClassToggle = useCallback((classId: string) => {
    if (!editingRace) return;
    const availableClasses = editingRace.availableClasses || [];
    const newClasses = availableClasses.includes(classId)
      ? availableClasses.filter(id => id !== classId)
      : [...availableClasses, classId];
    setEditingRace({ ...editingRace, availableClasses: newClasses });
  }, [editingRace]);

  const handleAIGenerate = useCallback(async () => {
    if (!onAIGenerate) return;
    setIsGenerating(true);
    try {
      const result = await onAIGenerate(aiPrompt, template);
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
  }, [onAIGenerate, aiPrompt, template]);

  const handleAcceptAIPreview = useCallback(() => {
    if (aiPreview) {
      onUpdate([...races, aiPreview]);
      setAiPreview(null);
      setShowAIDialog(false);
      setAiPrompt('');
    }
  }, [aiPreview, races, onUpdate]);

  const getClassName = (classId: string): string => {
    const cls = classes.find(c => c.id === classId);
    return cls?.name || classId;
  };

  const renderAttributeValue = (race: RaceDefinition, attr: string): string => {
    const bonuses = race.bonuses || {};
    const penalties = race.penalties || {};
    const bonus = bonuses[attr] || 0;
    const penalty = penalties[attr] || 0;
    const total = bonus + penalty;
    if (total === 0) return '-';
    return total > 0 ? `+${total}` : `${total}`;
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>种族列表</h3>
        {!readOnly && (
          <div style={styles.headerActions}>
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
            <Button
              variant="primary"
              size="small"
              onClick={handleAddNew}
              icon={<Icon name="plus" size={16} />}
            >
              添加种族
            </Button>
          </div>
        )}
      </div>

      {editingRace ? (
        <div style={styles.editor}>
          <div style={styles.editorHeader}>
            <h4 style={styles.editorTitle}>
              {isAddingNew ? '新建种族' : '编辑种族'}
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
            <Input
              label="种族名称"
              value={editingRace.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              fullWidth
              placeholder="输入种族名称"
            />

            <TextArea
              label="描述"
              value={editingRace.description}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              fullWidth
              placeholder="输入种族描述"
              rows={3}
            />

            <div style={styles.section}>
              <h5 style={styles.sectionTitle}>属性加成</h5>
              <div style={styles.attributeGrid}>
                {attributeOptions.map(attr => (
                  <div key={attr.key} style={styles.attributeRow}>
                    <span style={styles.attributeLabel}>{attr.label}</span>
                    <input
                      type="number"
                      style={styles.attributeInput}
                      value={(editingRace.bonuses || {})[attr.key] || 0}
                      onChange={(e) => handleAttributeChange('bonuses', attr.key, parseInt(e.target.value) || 0)}
                      min={0}
                      max={10}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div style={styles.section}>
              <h5 style={styles.sectionTitle}>属性惩罚</h5>
              <div style={styles.attributeGrid}>
                {attributeOptions.map(attr => (
                  <div key={attr.key} style={styles.attributeRow}>
                    <span style={styles.attributeLabel}>{attr.label}</span>
                    <input
                      type="number"
                      style={styles.attributeInput}
                      value={(editingRace.penalties || {})[attr.key] || 0}
                      onChange={(e) => handleAttributeChange('penalties', attr.key, -(Math.abs(parseInt(e.target.value) || 0)))}
                      min={-10}
                      max={0}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div style={styles.section}>
              <h5 style={styles.sectionTitle}>特殊能力</h5>
              <div style={styles.abilityList}>
                {(editingRace.abilities || []).map((ability, index) => (
                  <div key={index} style={styles.abilityItem}>
                    <span style={styles.abilityText}>{ability}</span>
                    <button
                      style={styles.removeButton}
                      onClick={() => handleRemoveAbility(index)}
                    >
                      <Icon name="close" size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <div style={styles.addAbilityRow}>
                <input
                  type="text"
                  style={styles.addAbilityInput}
                  value={newAbility}
                  onChange={(e) => setNewAbility(e.target.value)}
                  placeholder="输入新能力"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddAbility()}
                />
                <Button variant="secondary" size="small" onClick={handleAddAbility}>
                  添加
                </Button>
              </div>
            </div>

            <div style={styles.section}>
              <h5 style={styles.sectionTitle}>可用职业</h5>
              {classes.length === 0 ? (
                <p style={styles.emptyText}>暂无职业定义，请先添加职业</p>
              ) : (
                <div style={styles.classList}>
                  {classes.map(cls => (
                    <label key={cls.id} style={styles.classItem}>
                      <input
                        type="checkbox"
                        checked={(editingRace.availableClasses || []).includes(cls.id)}
                        onChange={() => handleClassToggle(cls.id)}
                      />
                      <span>{cls.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div style={styles.list}>
          {races.length === 0 ? (
            <div style={styles.empty}>
              <Icon name="info" size={48} />
              <p>暂无种族定义</p>
              {!readOnly && (
                <Button variant="primary" onClick={handleAddNew}>
                  添加第一个种族
                </Button>
              )}
            </div>
          ) : (
            races.map(race => (
              <div key={race.id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <h4 style={styles.cardTitle}>{race.name || '未命名种族'}</h4>
                  {!readOnly && (
                    <div style={styles.cardActions}>
                      <button
                        style={styles.iconButton}
                        onClick={() => handleEdit(race)}
                        title="编辑"
                      >
                        <Icon name="edit" size={16} />
                      </button>
                      <button
                        style={styles.iconButton}
                        onClick={() => setDeleteConfirm(race.id)}
                        title="删除"
                      >
                        <Icon name="trash" size={16} />
                      </button>
                    </div>
                  )}
                </div>
                <p style={styles.cardDescription}>
                  {race.description || '暂无描述'}
                </p>
                <div style={styles.cardStats}>
                  <div style={styles.statGroup}>
                    <span style={styles.statLabel}>属性调整：</span>
                    <div style={styles.statValues}>
                      {attributeOptions.map(attr => {
                        const bonuses = race.bonuses || {};
                        const penalties = race.penalties || {};
                        const total = (bonuses[attr.key] || 0) + (penalties[attr.key] || 0);
                        return (
                          <span
                            key={attr.key}
                            style={{
                              ...styles.statValue,
                              color: total > 0
                                ? '#22c55e'
                                : total < 0
                                  ? '#ef4444'
                                  : 'inherit',
                            }}
                          >
                            {attr.label.substring(0, 1)}: {renderAttributeValue(race, attr.key)}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  {(race.abilities || []).length > 0 && (
                    <div style={styles.statGroup}>
                      <span style={styles.statLabel}>特殊能力：</span>
                      <span style={styles.statText}>{(race.abilities || []).length} 项</span>
                    </div>
                  )}
                  {(race.availableClasses || []).length > 0 && (
                    <div style={styles.statGroup}>
                      <span style={styles.statLabel}>可用职业：</span>
                      <span style={styles.statText}>
                        {(race.availableClasses || []).slice(0, 3).map(getClassName).join('、')}
                        {(race.availableClasses || []).length > 3 && ` 等${(race.availableClasses || []).length}个`}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <ConfirmDialog
        open={deleteConfirm !== null}
        title="删除种族"
        message="确定要删除这个种族吗？此操作无法撤销。"
        confirmText="删除"
        cancelText="取消"
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        onCancel={() => setDeleteConfirm(null)}
      />

      {/* AI 生成对话框 */}
      {showAIDialog && (
        <div style={styles.aiDialogOverlay}>
          <div style={styles.aiDialog}>
            <h3 style={styles.aiDialogTitle}>AI 生成种族</h3>
            
            {!aiPreview ? (
              <>
                <div style={styles.aiDialogSection}>
                  <label style={styles.aiDialogLabel}>描述你想要的种族（可选）</label>
                  <textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    rows={4}
                    placeholder="留空将根据世界观自动生成，或输入描述如：一个生活在高山上的强壮种族，擅长锻造..."
                    style={styles.aiDialogTextarea}
                  />
                </div>
                <div style={styles.aiDialogActions}>
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
                <div style={styles.aiPreview}>
                  <h4 style={styles.aiPreviewTitle}>{aiPreview.name}</h4>
                  <p style={styles.aiPreviewDescription}>{aiPreview.description}</p>
                  <div style={styles.aiPreviewStats}>
                    <div style={styles.aiPreviewSection}>
                      <span style={styles.aiPreviewLabel}>属性加成：</span>
                      <div style={styles.aiPreviewValues}>
                        {attributeOptions.map(attr => {
                          const bonus = (aiPreview.bonuses || {})[attr.key] || 0;
                          if (bonus === 0) return null;
                          return (
                            <span key={attr.key} style={styles.aiPreviewBonus}>
                              {attr.label}: +{bonus}
                            </span>
                          );
                        })}
                        {Object.keys(aiPreview.bonuses || {}).length === 0 && (
                          <span style={styles.aiPreviewEmpty}>无</span>
                        )}
                      </div>
                    </div>
                    <div style={styles.aiPreviewSection}>
                      <span style={styles.aiPreviewLabel}>属性惩罚：</span>
                      <div style={styles.aiPreviewValues}>
                        {attributeOptions.map(attr => {
                          const penalty = (aiPreview.penalties || {})[attr.key] || 0;
                          if (penalty === 0) return null;
                          return (
                            <span key={attr.key} style={styles.aiPreviewPenalty}>
                              {attr.label}: {penalty}
                            </span>
                          );
                        })}
                        {Object.keys(aiPreview.penalties || {}).length === 0 && (
                          <span style={styles.aiPreviewEmpty}>无</span>
                        )}
                      </div>
                    </div>
                    {(aiPreview.abilities || []).length > 0 && (
                      <div style={styles.aiPreviewSection}>
                        <span style={styles.aiPreviewLabel}>特殊能力：</span>
                        <span style={styles.aiPreviewText}>{(aiPreview.abilities || []).join('、')}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div style={styles.aiDialogActions}>
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
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
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
    flexDirection: 'column',
    gap: '8px',
    paddingTop: '8px',
    borderTop: '1px solid var(--color-border)',
  },
  statGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
  },
  statLabel: {
    color: 'var(--color-text-tertiary)',
    flexShrink: 0,
  },
  statValues: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  statValue: {
    fontFamily: 'monospace',
    fontSize: '12px',
  },
  statText: {
    color: 'var(--color-text-secondary)',
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
  attributeGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
    gap: '12px',
  },
  attributeRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
  },
  attributeLabel: {
    fontSize: '14px',
    color: 'var(--color-text-secondary)',
  },
  attributeInput: {
    width: '60px',
    padding: '4px 8px',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-sm)',
    background: 'var(--color-background)',
    color: 'var(--color-text-primary)',
    fontSize: '14px',
    textAlign: 'center',
  },
  abilityList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginBottom: '8px',
  },
  abilityItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 8px',
    background: 'var(--color-primary-light)',
    borderRadius: 'var(--radius-sm)',
    fontSize: '13px',
  },
  abilityText: {
    color: 'var(--color-primary)',
  },
  removeButton: {
    background: 'transparent',
    border: 'none',
    padding: '2px',
    cursor: 'pointer',
    color: 'var(--color-primary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addAbilityRow: {
    display: 'flex',
    gap: '8px',
  },
  addAbilityInput: {
    flex: 1,
    padding: '8px 12px',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-sm)',
    background: 'var(--color-background)',
    color: 'var(--color-text-primary)',
    fontSize: '14px',
  },
  classList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
  },
  classItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '14px',
    color: 'var(--color-text-secondary)',
    cursor: 'pointer',
  },
  emptyText: {
    fontSize: '14px',
    color: 'var(--color-text-tertiary)',
    margin: 0,
  },
  headerActions: {
    display: 'flex',
    gap: '8px',
  },
  aiDialogOverlay: {
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
  },
  aiDialog: {
    background: 'var(--color-surface)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--spacing-lg)',
    maxWidth: '500px',
    width: '90%',
    maxHeight: '80vh',
    overflow: 'auto',
  },
  aiDialogTitle: {
    margin: '0 0 var(--spacing-md) 0',
    fontSize: '18px',
    fontWeight: 600,
    color: 'var(--color-text-primary)',
  },
  aiDialogSection: {
    marginBottom: 'var(--spacing-md)',
  },
  aiDialogLabel: {
    display: 'block',
    marginBottom: 'var(--spacing-xs)',
    fontWeight: 500,
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-text-secondary)',
  },
  aiDialogTextarea: {
    width: '100%',
    padding: 'var(--spacing-sm)',
    background: 'var(--color-background)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--color-text-primary)',
    resize: 'vertical',
    fontSize: '14px',
    fontFamily: 'inherit',
  },
  aiDialogActions: {
    display: 'flex',
    gap: 'var(--spacing-sm)',
    justifyContent: 'flex-end',
  },
  aiPreview: {
    marginBottom: 'var(--spacing-md)',
    padding: 'var(--spacing-md)',
    background: 'var(--color-background)',
    borderRadius: 'var(--radius-md)',
  },
  aiPreviewTitle: {
    margin: '0 0 var(--spacing-sm) 0',
    fontSize: '16px',
    fontWeight: 600,
    color: 'var(--color-text-primary)',
  },
  aiPreviewDescription: {
    margin: '0 0 var(--spacing-md) 0',
    fontSize: '14px',
    color: 'var(--color-text-secondary)',
    lineHeight: 1.5,
  },
  aiPreviewStats: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--spacing-sm)',
  },
  aiPreviewSection: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 'var(--spacing-xs)',
    fontSize: '13px',
  },
  aiPreviewLabel: {
    color: 'var(--color-text-tertiary)',
    flexShrink: 0,
    minWidth: '70px',
  },
  aiPreviewValues: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  aiPreviewBonus: {
    color: '#22c55e',
    fontFamily: 'monospace',
    fontSize: '12px',
  },
  aiPreviewPenalty: {
    color: '#ef4444',
    fontFamily: 'monospace',
    fontSize: '12px',
  },
  aiPreviewEmpty: {
    color: 'var(--color-text-tertiary)',
  },
  aiPreviewText: {
    color: 'var(--color-text-secondary)',
  },
};

export default RaceEditor;
