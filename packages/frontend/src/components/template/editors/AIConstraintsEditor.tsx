import React, { useState, useCallback } from 'react';
import type { AIConstraints } from '@ai-rpg/shared';
import { Button, Icon } from '../../common';

interface AIConstraintsEditorProps {
  aiConstraints: AIConstraints;
  readOnly: boolean;
  onUpdate: (updates: Partial<AIConstraints>) => void;
}

const TONE_OPTIONS = [
  { value: 'serious', label: '严肃' },
  { value: 'humorous', label: '幽默' },
  { value: 'dark', label: '黑暗' },
  { value: 'romantic', label: '浪漫' },
  { value: 'custom', label: '自定义' },
];

const CONTENT_RATING_OPTIONS = [
  { value: 'everyone', label: '全年龄' },
  { value: 'teen', label: '青少年' },
  { value: 'mature', label: '成人' },
];

export const AIConstraintsEditor: React.FC<AIConstraintsEditorProps> = ({
  aiConstraints,
  readOnly,
  onUpdate,
}) => {
  const [newProhibited, setNewProhibited] = useState('');
  const [newRequired, setNewRequired] = useState('');

  const prohibitedTopics = aiConstraints.prohibitedTopics || [];
  const requiredElements = aiConstraints.requiredElements || [];

  const handleAddProhibited = useCallback(() => {
    const trimmed = newProhibited.trim();
    if (trimmed && !prohibitedTopics.includes(trimmed)) {
      onUpdate({
        prohibitedTopics: [...prohibitedTopics, trimmed],
      });
      setNewProhibited('');
    }
  }, [newProhibited, prohibitedTopics, onUpdate]);

  const handleRemoveProhibited = useCallback(
    (topic: string) => {
      onUpdate({
        prohibitedTopics: prohibitedTopics.filter((t) => t !== topic),
      });
    },
    [prohibitedTopics, onUpdate]
  );

  const handleAddRequired = useCallback(() => {
    const trimmed = newRequired.trim();
    if (trimmed && !requiredElements.includes(trimmed)) {
      onUpdate({
        requiredElements: [...requiredElements, trimmed],
      });
      setNewRequired('');
    }
  }, [newRequired, requiredElements, onUpdate]);

  const handleRemoveRequired = useCallback(
    (element: string) => {
      onUpdate({
        requiredElements: requiredElements.filter((e) => e !== element),
      });
    },
    [requiredElements, onUpdate]
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

  const sectionStyle = {
    padding: 'var(--spacing-lg)',
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)',
    marginBottom: 'var(--spacing-lg)',
  };

  const tagStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--spacing-xs)',
    padding: 'var(--spacing-xs) var(--spacing-sm)',
    background: 'var(--color-background)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-sm)',
    fontSize: 'var(--font-size-sm)',
  };

  return (
    <div style={{ padding: 'var(--spacing-lg)', overflowY: 'auto' }}>
      {/* AI基调 */}
      <div style={sectionStyle}>
        <h3 style={{ margin: '0 0 var(--spacing-lg) 0', fontSize: 'var(--font-size-lg)' }}>
          🎭 AI基调
        </h3>
        <div style={{ marginBottom: 'var(--spacing-md)' }}>
          <label style={labelStyle}>基调风格</label>
          {readOnly ? (
            <span style={{ color: 'var(--color-text-primary)' }}>
              {TONE_OPTIONS.find((t) => t.value === aiConstraints.tone)?.label}
            </span>
          ) : (
            <select
              value={aiConstraints.tone}
              onChange={(e) => onUpdate({ tone: e.target.value as AIConstraints['tone'] })}
              style={inputStyle}
            >
              {TONE_OPTIONS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* 内容分级 */}
      <div style={sectionStyle}>
        <h3 style={{ margin: '0 0 var(--spacing-lg) 0', fontSize: 'var(--font-size-lg)' }}>
          🔞 内容分级
        </h3>
        <div>
          <label style={labelStyle}>内容分级</label>
          {readOnly ? (
            <span style={{ color: 'var(--color-text-primary)' }}>
              {CONTENT_RATING_OPTIONS.find((t) => t.value === aiConstraints.contentRating)?.label}
            </span>
          ) : (
            <select
              value={aiConstraints.contentRating}
              onChange={(e) => onUpdate({ contentRating: e.target.value as AIConstraints['contentRating'] })}
              style={inputStyle}
            >
              {CONTENT_RATING_OPTIONS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* 禁止话题 */}
      <div style={sectionStyle}>
        <h3 style={{ margin: '0 0 var(--spacing-lg) 0', fontSize: 'var(--font-size-lg)' }}>
          🚫 禁止话题
        </h3>
        <p style={{ margin: '0 0 var(--spacing-md) 0', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
          AI 将不会生成与这些话题相关的内容
        </p>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-xs)', marginBottom: 'var(--spacing-md)' }}>
          {prohibitedTopics.length === 0 ? (
            <span style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--font-size-sm)' }}>
              暂无禁止话题
            </span>
          ) : (
            prohibitedTopics.map((topic) => (
              <span key={topic} style={tagStyle}>
                {topic}
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => handleRemoveProhibited(topic)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    <Icon name="close" size={12} />
                  </button>
                )}
              </span>
            ))
          )}
        </div>

        {!readOnly && (
          <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
            <input
              type="text"
              value={newProhibited}
              onChange={(e) => setNewProhibited(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddProhibited()}
              placeholder="输入禁止话题"
              style={{ ...inputStyle, flex: 1 }}
            />
            <Button variant="secondary" size="small" onClick={handleAddProhibited}>
              添加
            </Button>
          </div>
        )}
      </div>

      {/* 必需元素 */}
      <div style={sectionStyle}>
        <h3 style={{ margin: '0 0 var(--spacing-lg) 0', fontSize: 'var(--font-size-lg)' }}>
          ✅ 必需元素
        </h3>
        <p style={{ margin: '0 0 var(--spacing-md) 0', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
          AI 将确保故事中包含这些元素
        </p>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-xs)', marginBottom: 'var(--spacing-md)' }}>
          {requiredElements.length === 0 ? (
            <span style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--font-size-sm)' }}>
              暂无必需元素
            </span>
          ) : (
            requiredElements.map((element) => (
              <span
                key={element}
                style={{
                  ...tagStyle,
                  background: 'var(--color-primary-light)',
                  borderColor: 'var(--color-primary)',
                  color: 'var(--color-primary)',
                }}
              >
                {element}
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => handleRemoveRequired(element)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    <Icon name="close" size={12} />
                  </button>
                )}
              </span>
            ))
          )}
        </div>

        {!readOnly && (
          <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
            <input
              type="text"
              value={newRequired}
              onChange={(e) => setNewRequired(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddRequired()}
              placeholder="输入必需元素"
              style={{ ...inputStyle, flex: 1 }}
            />
            <Button variant="secondary" size="small" onClick={handleAddRequired}>
              添加
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
