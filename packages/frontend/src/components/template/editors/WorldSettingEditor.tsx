import React, { useCallback, useState } from 'react';
import type { WorldSetting } from '@ai-rpg/shared';
import { Button, Icon, Input, TextArea } from '../../common';

export interface WorldSettingEditorProps {
  worldSetting: WorldSetting;
  readOnly: boolean;
  onUpdate: (updates: Partial<WorldSetting>) => void;
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
};

export const WorldSettingEditor: React.FC<WorldSettingEditorProps> = ({
  worldSetting,
  readOnly,
  onUpdate,
}) => {
  const [newFieldKey, setNewFieldKey] = useState('');

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

  return (
    <div style={styles.container}>
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
    </div>
  );
};

export default WorldSettingEditor;
