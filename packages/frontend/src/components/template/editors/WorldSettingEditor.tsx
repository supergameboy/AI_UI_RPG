import React, { useCallback, useState } from 'react';
import type { WorldSetting } from '@ai-rpg/shared';
import { Button, Icon, Input, TextArea } from '../../common';

export interface WorldSettingEditorProps {
  worldSetting: WorldSetting;
  readOnly: boolean;
  onUpdate: (updates: Partial<WorldSetting>) => void;
  onAIGenerate?: (prompt: string) => Promise<WorldSetting | null>;
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    maxWidth: '800px',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: 'var(--color-text-primary)',
    margin: 0,
    paddingBottom: '8px',
    borderBottom: '1px solid var(--color-border)',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '14px',
    fontWeight: 500,
    color: 'var(--color-text-secondary)',
  },
  input: {
    width: '100%',
  },
  textarea: {
    width: '100%',
    minHeight: '100px',
    resize: 'vertical' as const,
  },
  optionalLabel: {
    fontSize: '12px',
    color: 'var(--color-text-tertiary)',
    marginLeft: '8px',
  },
  customFieldsSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  customFieldsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  customFieldsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  customFieldRow: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    padding: '8px',
    backgroundColor: 'var(--color-surface)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border)',
  },
  customFieldKey: {
    flex: '0 0 150px',
  },
  customFieldValue: {
    flex: 1,
  },
  customFieldActions: {
    display: 'flex',
    alignItems: 'center',
  },
  deleteButton: {
    padding: '4px 8px',
    backgroundColor: 'transparent',
    border: 'none',
    color: 'var(--color-danger)',
    cursor: 'pointer',
    borderRadius: 'var(--radius-sm)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    backgroundColor: 'var(--color-surface)',
    borderRadius: 'var(--radius-md)',
    border: '1px dashed var(--color-border)',
    color: 'var(--color-text-tertiary)',
    gap: '8px',
  },
  emptyText: {
    fontSize: '14px',
    margin: 0,
  },
  addButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  readOnlyText: {
    padding: '8px 12px',
    backgroundColor: 'var(--color-surface)',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--color-border)',
    fontSize: '14px',
    color: 'var(--color-text-primary)',
    minHeight: '38px',
    display: 'flex',
    alignItems: 'center',
  },
  readOnlyTextarea: {
    padding: '12px',
    backgroundColor: 'var(--color-surface)',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--color-border)',
    fontSize: '14px',
    color: 'var(--color-text-primary)',
    minHeight: '100px',
    whiteSpace: 'pre-wrap' as const,
    lineHeight: 1.5,
  },
  customFieldReadOnly: {
    display: 'flex',
    gap: '16px',
    padding: '8px 12px',
    backgroundColor: 'var(--color-surface)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border)',
  },
  customFieldKeyReadOnly: {
    fontSize: '14px',
    fontWeight: 500,
    color: 'var(--color-text-secondary)',
    minWidth: '120px',
  },
  customFieldValueReadOnly: {
    fontSize: '14px',
    color: 'var(--color-text-primary)',
    flex: 1,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  aiDialogOverlay: {
    position: 'fixed' as const,
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
    maxWidth: '600px',
    width: '90%',
    maxHeight: '80vh',
    overflow: 'auto' as const,
  },
  aiDialogTitle: {
    margin: '0 0 var(--spacing-md) 0',
    fontSize: '18px',
    fontWeight: 600,
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
    resize: 'vertical' as const,
    minHeight: '80px',
  },
  aiDialogActions: {
    display: 'flex',
    gap: 'var(--spacing-sm)',
    justifyContent: 'flex-end',
    marginTop: 'var(--spacing-md)',
  },
  aiPreviewContainer: {
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
  aiPreviewField: {
    marginBottom: 'var(--spacing-sm)',
  },
  aiPreviewLabel: {
    fontSize: '12px',
    fontWeight: 500,
    color: 'var(--color-text-secondary)',
    marginBottom: '2px',
  },
  aiPreviewValue: {
    fontSize: '14px',
    color: 'var(--color-text-primary)',
  },
};

export const WorldSettingEditor: React.FC<WorldSettingEditorProps> = ({
  worldSetting,
  readOnly,
  onUpdate,
  onAIGenerate,
}) => {
  const [newFieldKey, setNewFieldKey] = useState('');
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiPreview, setAiPreview] = useState<WorldSetting | null>(null);

  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({ name: e.target.value });
  }, [onUpdate]);

  const handleDescriptionChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdate({ description: e.target.value });
  }, [onUpdate]);

  const handleEraChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({ era: e.target.value });
  }, [onUpdate]);

  const handleMagicSystemChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdate({ magicSystem: e.target.value });
  }, [onUpdate]);

  const handleTechnologyLevelChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({ technologyLevel: e.target.value });
  }, [onUpdate]);

  const customFields = Object.entries(worldSetting.customFields || {}).map(([key, value]) => ({
    key,
    value,
  }));

  const handleAddCustomField = useCallback(() => {
    if (!newFieldKey.trim()) return;

    const existingKeys = Object.keys(worldSetting.customFields || {});
    if (existingKeys.includes(newFieldKey.trim())) {
      return;
    }

    onUpdate({
      customFields: {
        ...worldSetting.customFields,
        [newFieldKey.trim()]: '',
      },
    });
    setNewFieldKey('');
  }, [newFieldKey, worldSetting.customFields, onUpdate]);

  const handleUpdateCustomFieldKey = useCallback((oldKey: string, newKey: string) => {
    if (!newKey.trim() || oldKey === newKey) return;

    const existingKeys = Object.keys(worldSetting.customFields || {});
    if (existingKeys.includes(newKey.trim()) && oldKey !== newKey.trim()) {
      return;
    }

    const newCustomFields = { ...worldSetting.customFields };
    const value = newCustomFields[oldKey];
    delete newCustomFields[oldKey];
    newCustomFields[newKey.trim()] = value;

    onUpdate({ customFields: newCustomFields });
  }, [worldSetting.customFields, onUpdate]);

  const handleUpdateCustomFieldValue = useCallback((key: string, value: string) => {
    onUpdate({
      customFields: {
        ...worldSetting.customFields,
        [key]: value,
      },
    });
  }, [worldSetting.customFields, onUpdate]);

  const handleDeleteCustomField = useCallback((key: string) => {
    const newCustomFields = { ...worldSetting.customFields };
    delete newCustomFields[key];
    onUpdate({ customFields: newCustomFields });
  }, [worldSetting.customFields, onUpdate]);

  const handleNewFieldKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddCustomField();
    }
  }, [handleAddCustomField]);

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
      onUpdate(aiPreview);
      setAiPreview(null);
      setShowAIDialog(false);
      setAiPrompt('');
    }
  }, [aiPreview, onUpdate]);

  return (
    <div style={styles.container}>
      {/* AI 生成按钮 */}
      {onAIGenerate && !readOnly && (
        <div style={styles.header}>
          <div></div>
          <Button
            variant="secondary"
            size="small"
            onClick={() => setShowAIDialog(true)}
            icon={<Icon name="sparkles" size={16} />}
          >
            AI 生成世界观
          </Button>
        </div>
      )}

      <section style={styles.section}>
        <h3 style={styles.sectionTitle}>基本信息</h3>
        
        <div style={styles.fieldGroup}>
          <label style={styles.label}>世界名称</label>
          {readOnly ? (
            <div style={styles.readOnlyText}>
              {worldSetting.name || <span style={{ color: 'var(--color-text-tertiary)' }}>未设置</span>}
            </div>
          ) : (
            <Input
              style={styles.input}
              value={worldSetting.name}
              onChange={handleNameChange}
              placeholder="输入世界名称"
              fullWidth
            />
          )}
        </div>

        <div style={styles.fieldGroup}>
          <label style={styles.label}>世界描述</label>
          {readOnly ? (
            <div style={styles.readOnlyTextarea}>
              {worldSetting.description || <span style={{ color: 'var(--color-text-tertiary)' }}>未设置</span>}
            </div>
          ) : (
            <TextArea
              style={styles.textarea}
              value={worldSetting.description}
              onChange={handleDescriptionChange}
              placeholder="描述这个世界的背景、特色和氛围..."
              fullWidth
            />
          )}
        </div>
      </section>

      <section style={styles.section}>
        <h3 style={styles.sectionTitle}>时代与背景</h3>

        <div style={styles.fieldGroup}>
          <label style={styles.label}>时代背景</label>
          {readOnly ? (
            <div style={styles.readOnlyText}>
              {worldSetting.era || <span style={{ color: 'var(--color-text-tertiary)' }}>未设置</span>}
            </div>
          ) : (
            <Input
              style={styles.input}
              value={worldSetting.era}
              onChange={handleEraChange}
              placeholder="例如：中世纪、现代、未来科幻..."
              fullWidth
            />
          )}
        </div>

        <div style={styles.fieldGroup}>
          <label style={styles.label}>
            科技水平
          </label>
          {readOnly ? (
            <div style={styles.readOnlyText}>
              {worldSetting.technologyLevel || <span style={{ color: 'var(--color-text-tertiary)' }}>未设置</span>}
            </div>
          ) : (
            <Input
              style={styles.input}
              value={worldSetting.technologyLevel}
              onChange={handleTechnologyLevelChange}
              placeholder="例如：石器时代、蒸汽朋克、赛博朋克..."
              fullWidth
            />
          )}
        </div>
      </section>

      <section style={styles.section}>
        <h3 style={styles.sectionTitle}>
          魔法系统
          <span style={styles.optionalLabel}>（可选）</span>
        </h3>

        <div style={styles.fieldGroup}>
          {readOnly ? (
            <div style={styles.readOnlyTextarea}>
              {worldSetting.magicSystem || <span style={{ color: 'var(--color-text-tertiary)' }}>未设置</span>}
            </div>
          ) : (
            <TextArea
              style={styles.textarea}
              value={worldSetting.magicSystem || ''}
              onChange={handleMagicSystemChange}
              placeholder="描述这个世界中的魔法系统，包括魔法类型、使用规则、限制等..."
              fullWidth
            />
          )}
        </div>
      </section>

      <section style={styles.section}>
        <div style={styles.customFieldsHeader}>
          <h3 style={styles.sectionTitle}>自定义字段</h3>
          {!readOnly && (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <Input
                value={newFieldKey}
                onChange={(e) => setNewFieldKey(e.target.value)}
                onKeyDown={handleNewFieldKeyDown}
                placeholder="新字段名称"
                size="small"
              />
              <Button
                variant="secondary"
                size="small"
                onClick={handleAddCustomField}
                disabled={!newFieldKey.trim()}
                icon={<Icon name="plus" size={16} />}
              >
                添加
              </Button>
            </div>
          )}
        </div>

        {customFields.length > 0 ? (
          <div style={styles.customFieldsList}>
            {readOnly ? (
              customFields.map(({ key, value }) => (
                <div key={key} style={styles.customFieldReadOnly}>
                  <span style={styles.customFieldKeyReadOnly}>{key}</span>
                  <span style={styles.customFieldValueReadOnly}>
                    {value || <span style={{ color: 'var(--color-text-tertiary)' }}>空</span>}
                  </span>
                </div>
              ))
            ) : (
              customFields.map(({ key, value }) => (
                <div key={key} style={styles.customFieldRow}>
                  <Input
                    style={styles.customFieldKey}
                    value={key}
                    onChange={(e) => handleUpdateCustomFieldKey(key, e.target.value)}
                    size="small"
                  />
                  <Input
                    style={styles.customFieldValue}
                    value={value}
                    onChange={(e) => handleUpdateCustomFieldValue(key, e.target.value)}
                    placeholder="字段值"
                    size="small"
                  />
                  <div style={styles.customFieldActions}>
                    <button
                      style={styles.deleteButton}
                      onClick={() => handleDeleteCustomField(key)}
                      title="删除字段"
                    >
                      <Icon name="delete" size={18} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div style={styles.emptyState}>
            <Icon name="info" size={24} />
            <p style={styles.emptyText}>暂无自定义字段</p>
          </div>
        )}
      </section>

      {/* AI 生成对话框 */}
      {showAIDialog && (
        <div style={styles.aiDialogOverlay}>
          <div style={styles.aiDialog}>
            <h3 style={styles.aiDialogTitle}>AI 生成世界观</h3>
            
            {!aiPreview ? (
              <>
                <div style={{ marginBottom: 'var(--spacing-md)' }}>
                  <label style={styles.aiDialogLabel}>描述你想要的世界观（可选）</label>
                  <textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    rows={4}
                    placeholder="留空将自动生成，或输入描述如：一个充满魔法的中世纪奇幻世界，有着古老的龙族和神秘的精灵..."
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
                <div style={styles.aiPreviewContainer}>
                  <h4 style={styles.aiPreviewTitle}>{aiPreview.name}</h4>
                  
                  <div style={styles.aiPreviewField}>
                    <div style={styles.aiPreviewLabel}>世界描述</div>
                    <div style={styles.aiPreviewValue}>{aiPreview.description}</div>
                  </div>

                  <div style={styles.aiPreviewField}>
                    <div style={styles.aiPreviewLabel}>时代背景</div>
                    <div style={styles.aiPreviewValue}>{aiPreview.era}</div>
                  </div>

                  {aiPreview.magicSystem && (
                    <div style={styles.aiPreviewField}>
                      <div style={styles.aiPreviewLabel}>魔法系统</div>
                      <div style={styles.aiPreviewValue}>{aiPreview.magicSystem}</div>
                    </div>
                  )}

                  <div style={styles.aiPreviewField}>
                    <div style={styles.aiPreviewLabel}>科技水平</div>
                    <div style={styles.aiPreviewValue}>{aiPreview.technologyLevel}</div>
                  </div>
                </div>
                <div style={styles.aiDialogActions}>
                  <Button variant="ghost" onClick={() => setAiPreview(null)}>
                    重新生成
                  </Button>
                  <Button variant="primary" onClick={handleAcceptAIPreview}>
                    应用
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

export default WorldSettingEditor;
