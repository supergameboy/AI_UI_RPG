import React, { useState, useCallback } from 'react';
import type { AIConstraints, AIBehavior } from '@ai-rpg/shared';
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

const RESPONSE_STYLE_OPTIONS = [
  { value: 'narrative', label: '叙事风格', description: 'AI 以故事叙述的方式回应，注重情节和氛围' },
  { value: 'mechanical', label: '机械风格', description: 'AI 以简洁、直接的方式回应，注重游戏机制' },
  { value: 'adaptive', label: '自适应', description: 'AI 根据情境自动调整回应风格' },
];

const DETAIL_LEVEL_OPTIONS = [
  { value: 'brief', label: '简略', description: '简洁的描述，快速推进剧情' },
  { value: 'normal', label: '正常', description: '适中的详细程度，平衡叙事和节奏' },
  { value: 'detailed', label: '详细', description: '丰富的细节描写，沉浸式体验' },
];

const PLAYER_AGENCY_OPTIONS = [
  { value: 'guided', label: '引导式', description: 'AI 提供明确的选项和建议，引导玩家决策' },
  { value: 'balanced', label: '平衡', description: 'AI 提供适度的引导，同时保持玩家自由度' },
  { value: 'freeform', label: '自由形式', description: 'AI 给予玩家最大的自由，不提供明确引导' },
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
  const aiBehavior = aiConstraints.aiBehavior || {
    responseStyle: 'narrative' as const,
    detailLevel: 'normal' as const,
    playerAgency: 'balanced' as const,
  };

  const updateAIBehavior = useCallback(
    (updates: Partial<AIBehavior>) => {
      onUpdate({
        aiBehavior: { ...aiBehavior, ...updates },
      });
    },
    [aiBehavior, onUpdate]
  );

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

      {/* AI行为配置 */}
      <div style={sectionStyle}>
        <h3 style={{ margin: '0 0 var(--spacing-lg) 0', fontSize: 'var(--font-size-lg)' }}>
          🤖 AI行为配置
        </h3>
        <p style={{ margin: '0 0 var(--spacing-md) 0', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
          配置 AI 的回应风格和行为模式
        </p>

        {/* 回应风格 */}
        <div style={{ marginBottom: 'var(--spacing-lg)' }}>
          <label style={labelStyle}>回应风格</label>
          {readOnly ? (
            <div style={{ marginTop: 'var(--spacing-xs)' }}>
              <span style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>
                {RESPONSE_STYLE_OPTIONS.find((o) => o.value === aiBehavior.responseStyle)?.label}
              </span>
              <p style={{ margin: 'var(--spacing-xs) 0 0 0', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-tertiary)' }}>
                {RESPONSE_STYLE_OPTIONS.find((o) => o.value === aiBehavior.responseStyle)?.description}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)', marginTop: 'var(--spacing-xs)' }}>
              {RESPONSE_STYLE_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 'var(--spacing-sm)',
                    padding: 'var(--spacing-sm)',
                    background: aiBehavior.responseStyle === option.value ? 'var(--color-primary-light)' : 'var(--color-background)',
                    border: `1px solid ${aiBehavior.responseStyle === option.value ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <input
                    type="radio"
                    name="responseStyle"
                    value={option.value}
                    checked={aiBehavior.responseStyle === option.value}
                    onChange={() => updateAIBehavior({ responseStyle: option.value as AIBehavior['responseStyle'] })}
                    style={{ marginTop: '2px' }}
                  />
                  <div>
                    <div style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>
                      {option.label}
                    </div>
                    <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-tertiary)' }}>
                      {option.description}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* 详细程度 */}
        <div style={{ marginBottom: 'var(--spacing-lg)' }}>
          <label style={labelStyle}>详细程度</label>
          {readOnly ? (
            <div style={{ marginTop: 'var(--spacing-xs)' }}>
              <span style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>
                {DETAIL_LEVEL_OPTIONS.find((o) => o.value === aiBehavior.detailLevel)?.label}
              </span>
              <p style={{ margin: 'var(--spacing-xs) 0 0 0', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-tertiary)' }}>
                {DETAIL_LEVEL_OPTIONS.find((o) => o.value === aiBehavior.detailLevel)?.description}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)', marginTop: 'var(--spacing-xs)' }}>
              {DETAIL_LEVEL_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 'var(--spacing-sm)',
                    padding: 'var(--spacing-sm)',
                    background: aiBehavior.detailLevel === option.value ? 'var(--color-primary-light)' : 'var(--color-background)',
                    border: `1px solid ${aiBehavior.detailLevel === option.value ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <input
                    type="radio"
                    name="detailLevel"
                    value={option.value}
                    checked={aiBehavior.detailLevel === option.value}
                    onChange={() => updateAIBehavior({ detailLevel: option.value as AIBehavior['detailLevel'] })}
                    style={{ marginTop: '2px' }}
                  />
                  <div>
                    <div style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>
                      {option.label}
                    </div>
                    <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-tertiary)' }}>
                      {option.description}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* 玩家主导权 */}
        <div>
          <label style={labelStyle}>玩家主导权</label>
          {readOnly ? (
            <div style={{ marginTop: 'var(--spacing-xs)' }}>
              <span style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>
                {PLAYER_AGENCY_OPTIONS.find((o) => o.value === aiBehavior.playerAgency)?.label}
              </span>
              <p style={{ margin: 'var(--spacing-xs) 0 0 0', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-tertiary)' }}>
                {PLAYER_AGENCY_OPTIONS.find((o) => o.value === aiBehavior.playerAgency)?.description}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)', marginTop: 'var(--spacing-xs)' }}>
              {PLAYER_AGENCY_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 'var(--spacing-sm)',
                    padding: 'var(--spacing-sm)',
                    background: aiBehavior.playerAgency === option.value ? 'var(--color-primary-light)' : 'var(--color-background)',
                    border: `1px solid ${aiBehavior.playerAgency === option.value ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <input
                    type="radio"
                    name="playerAgency"
                    value={option.value}
                    checked={aiBehavior.playerAgency === option.value}
                    onChange={() => updateAIBehavior({ playerAgency: option.value as AIBehavior['playerAgency'] })}
                    style={{ marginTop: '2px' }}
                  />
                  <div>
                    <div style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>
                      {option.label}
                    </div>
                    <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-tertiary)' }}>
                      {option.description}
                    </div>
                  </div>
                </label>
              ))}
            </div>
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
