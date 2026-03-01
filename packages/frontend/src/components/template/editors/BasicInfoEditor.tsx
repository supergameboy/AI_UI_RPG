import React, { useState, useCallback } from 'react';
import type { StoryTemplate } from '@ai-rpg/shared';
import { Button, Icon } from '../../common';
import styles from './BasicInfoEditor.module.css';

const GAME_MODE_OPTIONS = [
  { value: 'text_adventure', label: '文字冒险' },
  { value: 'turn_based_rpg', label: '回合制RPG' },
  { value: 'visual_novel', label: '视觉小说' },
  { value: 'dynamic_combat', label: '动态战斗' },
];

interface BasicInfoEditorProps {
  template: StoryTemplate;
  readOnly: boolean;
  onUpdate: (updates: Partial<StoryTemplate>) => void;
}

export const BasicInfoEditor: React.FC<BasicInfoEditorProps> = ({
  template,
  readOnly,
  onUpdate,
}) => {
  const [newTag, setNewTag] = useState('');

  const handleFieldChange = useCallback(
    (field: keyof StoryTemplate, value: string | StoryTemplate['gameMode']) => {
      onUpdate({ [field]: value });
    },
    [onUpdate]
  );

  const handleAddTag = useCallback(() => {
    const trimmedTag = newTag.trim();
    if (trimmedTag && !template.tags.includes(trimmedTag)) {
      onUpdate({ tags: [...template.tags, trimmedTag] });
      setNewTag('');
    }
  }, [newTag, template.tags, onUpdate]);

  const handleRemoveTag = useCallback(
    (tagToRemove: string) => {
      onUpdate({ tags: template.tags.filter((tag) => tag !== tagToRemove) });
    },
    [template.tags, onUpdate]
  );

  const handleTagKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAddTag();
      }
    },
    [handleAddTag]
  );

  return (
    <div className={styles.container}>
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>基础信息</h3>
        <div className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>模板名称</label>
            <div className={styles.inputWrapper}>
              {readOnly ? (
                <span className={styles.readOnlyValue}>{template.name || '未命名'}</span>
              ) : (
                <input
                  type="text"
                  className={styles.input}
                  value={template.name}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  placeholder="输入模板名称"
                />
              )}
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>描述</label>
            <div className={styles.inputWrapper}>
              {readOnly ? (
                <span className={styles.readOnlyValue}>{template.description || '暂无描述'}</span>
              ) : (
                <textarea
                  className={styles.textarea}
                  value={template.description}
                  onChange={(e) => handleFieldChange('description', e.target.value)}
                  placeholder="输入模板描述"
                  rows={4}
                />
              )}
            </div>
          </div>

          <div className={styles.fieldRow}>
            <div className={styles.field}>
              <label className={styles.label}>版本号</label>
              <div className={styles.inputWrapper}>
                {readOnly ? (
                  <span className={styles.readOnlyValue}>{template.version || '1.0.0'}</span>
                ) : (
                  <input
                    type="text"
                    className={styles.input}
                    value={template.version}
                    onChange={(e) => handleFieldChange('version', e.target.value)}
                    placeholder="例如: 1.0.0"
                  />
                )}
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>作者</label>
              <div className={styles.inputWrapper}>
                {readOnly ? (
                  <span className={styles.readOnlyValue}>{template.author || '未知'}</span>
                ) : (
                  <input
                    type="text"
                    className={styles.input}
                    value={template.author}
                    onChange={(e) => handleFieldChange('author', e.target.value)}
                    placeholder="输入作者名称"
                  />
                )}
              </div>
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>游戏模式</label>
            <div className={styles.inputWrapper}>
              {readOnly ? (
                <span className={styles.readOnlyValue}>
                  {GAME_MODE_OPTIONS.find((opt) => opt.value === template.gameMode)?.label ||
                    template.gameMode}
                </span>
              ) : (
                <select
                  className={styles.select}
                  value={template.gameMode}
                  onChange={(e) =>
                    handleFieldChange(
                      'gameMode',
                      e.target.value as StoryTemplate['gameMode']
                    )
                  }
                >
                  {GAME_MODE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>标签</label>
            <div className={styles.inputWrapper}>
              {readOnly ? (
                <div className={styles.tagsList}>
                  {template.tags.length > 0 ? (
                    template.tags.map((tag) => (
                      <span key={tag} className={styles.tag}>
                        {tag}
                      </span>
                    ))
                  ) : (
                    <span className={styles.readOnlyValue}>暂无标签</span>
                  )}
                </div>
              ) : (
                <>
                  <div className={styles.tagsList}>
                    {template.tags.map((tag) => (
                      <span key={tag} className={styles.tag}>
                        {tag}
                        <button
                          type="button"
                          className={styles.tagRemove}
                          onClick={() => handleRemoveTag(tag)}
                          aria-label={`移除标签 ${tag}`}
                        >
                          <Icon name="close" size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className={styles.tagInput}>
                    <input
                      type="text"
                      className={styles.input}
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyDown={handleTagKeyDown}
                      placeholder="输入标签后按回车添加"
                    />
                    <Button
                      variant="secondary"
                      size="small"
                      onClick={handleAddTag}
                      disabled={!newTag.trim()}
                    >
                      添加
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
