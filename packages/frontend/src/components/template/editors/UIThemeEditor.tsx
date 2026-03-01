import React, { useCallback } from 'react';
import type { UITheme } from '@ai-rpg/shared';

interface UIThemeEditorProps {
  uiTheme: UITheme;
  readOnly: boolean;
  onUpdate: (updates: Partial<UITheme>) => void;
}

const FONT_FAMILY_OPTIONS = [
  { value: 'system-ui', label: '系统默认' },
  { value: 'serif', label: '衬线体' },
  { value: 'sans-serif', label: '无衬线体' },
  { value: 'monospace', label: '等宽字体' },
  { value: 'cursive', label: '手写体' },
  { value: 'fantasy', label: '艺术字体' },
];

const BACKGROUND_STYLE_OPTIONS = [
  { value: 'solid', label: '纯色背景' },
  { value: 'gradient', label: '渐变背景' },
  { value: 'image', label: '图片背景' },
  { value: 'pattern', label: '图案背景' },
  { value: 'animated', label: '动态背景' },
];

const GRADIENT_DIRECTION_OPTIONS = [
  { value: 'to right', label: '从左到右' },
  { value: 'to left', label: '从右到左' },
  { value: 'to bottom', label: '从上到下' },
  { value: 'to top', label: '从下到上' },
  { value: 'to bottom right', label: '对角线 ↘' },
  { value: 'to bottom left', label: '对角线 ↙' },
  { value: 'to top right', label: '对角线 ↗' },
  { value: 'to top left', label: '对角线 ↖' },
];

const PATTERN_TYPE_OPTIONS = [
  { value: 'dots', label: '圆点图案' },
  { value: 'stripes', label: '条纹图案' },
  { value: 'grid', label: '网格图案' },
  { value: 'zigzag', label: '锯齿图案' },
  { value: 'checkerboard', label: '棋盘图案' },
];

const ANIMATED_TYPE_OPTIONS = [
  { value: 'particles', label: '粒子效果' },
  { value: 'waves', label: '波浪效果' },
  { value: 'stars', label: '星空效果' },
  { value: 'aurora', label: '极光效果' },
  { value: 'matrix', label: '矩阵效果' },
];

export const UIThemeEditor: React.FC<UIThemeEditorProps> = ({
  uiTheme,
  readOnly,
  onUpdate,
}) => {
  const handleColorChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      console.log('[UIThemeEditor] handleColorChange:', e.target.value);
      onUpdate({ primaryColor: e.target.value });
    },
    [onUpdate]
  );

  const handleFontFamilyChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      onUpdate({ fontFamily: e.target.value });
    },
    [onUpdate]
  );

  const handleBackgroundStyleChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      onUpdate({ backgroundStyle: e.target.value as UITheme['backgroundStyle'] });
    },
    [onUpdate]
  );

  const handleGradientStartChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onUpdate({
        gradientColors: {
          ...uiTheme.gradientColors,
          start: e.target.value,
          end: uiTheme.gradientColors?.end || '#ffffff',
        },
      });
    },
    [onUpdate, uiTheme.gradientColors]
  );

  const handleGradientEndChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onUpdate({
        gradientColors: {
          ...uiTheme.gradientColors,
          start: uiTheme.gradientColors?.start || '#3b82f6',
          end: e.target.value,
        },
      });
    },
    [onUpdate, uiTheme.gradientColors]
  );

  const handleGradientDirectionChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      onUpdate({
        gradientColors: {
          ...uiTheme.gradientColors,
          start: uiTheme.gradientColors?.start || '#3b82f6',
          end: uiTheme.gradientColors?.end || '#ffffff',
          direction: e.target.value,
        },
      });
    },
    [onUpdate, uiTheme.gradientColors]
  );

  const handleBackgroundImageChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onUpdate({ backgroundImage: e.target.value });
    },
    [onUpdate]
  );

  const handlePatternTypeChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      onUpdate({ patternType: e.target.value });
    },
    [onUpdate]
  );

  const handleAnimatedTypeChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      onUpdate({ animatedType: e.target.value });
    },
    [onUpdate]
  );

  const handleCustomCSSChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onUpdate({ customCSS: e.target.value });
    },
    [onUpdate]
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

  const colorPreviewStyle = {
    width: '40px',
    height: '40px',
    borderRadius: 'var(--radius-md)',
    border: '2px solid var(--color-border)',
    cursor: readOnly ? 'default' : 'pointer',
    transition: 'transform 0.2s ease',
  };

  return (
    <div style={{ padding: 'var(--spacing-lg)', overflowY: 'auto' }}>
      {/* 主题颜色 */}
      <div style={sectionStyle}>
        <h3 style={{ margin: '0 0 var(--spacing-lg) 0', fontSize: 'var(--font-size-lg)' }}>
          🎨 主题颜色
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
          <div>
            <label style={labelStyle}>主色调</label>
            {readOnly ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                <div
                  style={{
                    ...colorPreviewStyle,
                    background: uiTheme.primaryColor || '#3b82f6',
                    cursor: 'default',
                  }}
                />
                <span style={{ color: 'var(--color-text-primary)' }}>
                  {uiTheme.primaryColor || '#3b82f6'}
                </span>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                <input
                  type="color"
                  value={uiTheme.primaryColor || '#3b82f6'}
                  onChange={handleColorChange}
                  style={{
                    width: '60px',
                    height: '40px',
                    padding: '2px',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    background: 'transparent',
                  }}
                />
                <input
                  type="text"
                  value={uiTheme.primaryColor || '#3b82f6'}
                  onChange={handleColorChange}
                  placeholder="#3b82f6"
                  style={{ ...inputStyle, flex: 1, maxWidth: '200px' }}
                />
              </div>
            )}
          </div>
          <div
            style={{
              flex: 1,
              padding: 'var(--spacing-md)',
              background: uiTheme.primaryColor || '#3b82f6',
              borderRadius: 'var(--radius-md)',
              color: '#fff',
              textAlign: 'center',
            }}
          >
            预览效果
          </div>
        </div>
      </div>

      {/* 字体设置 */}
      <div style={sectionStyle}>
        <h3 style={{ margin: '0 0 var(--spacing-lg) 0', fontSize: 'var(--font-size-lg)' }}>
          🔤 字体设置
        </h3>
        <div>
          <label style={labelStyle}>字体族</label>
          {readOnly ? (
            <span style={{ color: 'var(--color-text-primary)' }}>
              {FONT_FAMILY_OPTIONS.find((f) => f.value === uiTheme.fontFamily)?.label ||
                '系统默认'}
            </span>
          ) : (
            <select
              value={uiTheme.fontFamily || 'system-ui'}
              onChange={handleFontFamilyChange}
              style={inputStyle}
            >
              {FONT_FAMILY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )}
        </div>
        <div
          style={{
            marginTop: 'var(--spacing-md)',
            padding: 'var(--spacing-md)',
            background: 'var(--color-background)',
            borderRadius: 'var(--radius-md)',
            fontFamily: uiTheme.fontFamily || 'system-ui',
          }}
        >
          <p style={{ margin: '0 0 var(--spacing-xs) 0', color: 'var(--color-text-primary)' }}>
            字体预览：The quick brown fox jumps over the lazy dog.
          </p>
          <p style={{ margin: 0, color: 'var(--color-text-primary)' }}>
            中文预览：天地玄黄，宇宙洪荒。日月盈昃，辰宿列张。
          </p>
        </div>
      </div>

      {/* 背景样式 */}
      <div style={sectionStyle}>
        <h3 style={{ margin: '0 0 var(--spacing-lg) 0', fontSize: 'var(--font-size-lg)' }}>
          🖼️ 背景样式
        </h3>
        <div>
          <label style={labelStyle}>背景类型</label>
          {readOnly ? (
            <span style={{ color: 'var(--color-text-primary)' }}>
              {BACKGROUND_STYLE_OPTIONS.find((b) => b.value === uiTheme.backgroundStyle)?.label ||
                '纯色背景'}
            </span>
          ) : (
            <select
              value={uiTheme.backgroundStyle || 'solid'}
              onChange={handleBackgroundStyleChange}
              style={inputStyle}
            >
              {BACKGROUND_STYLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* 渐变背景配置 */}
        {uiTheme.backgroundStyle === 'gradient' && (
          <div style={{ marginTop: 'var(--spacing-md)' }}>
            <label style={labelStyle}>渐变起始颜色</label>
            {readOnly ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                <div
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: 'var(--radius-sm)',
                    background: uiTheme.gradientColors?.start || '#3b82f6',
                  }}
                />
                <span>{uiTheme.gradientColors?.start || '#3b82f6'}</span>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                <input
                  type="color"
                  value={uiTheme.gradientColors?.start || '#3b82f6'}
                  onChange={handleGradientStartChange}
                  style={{
                    width: '50px',
                    height: '35px',
                    padding: '2px',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    background: 'transparent',
                  }}
                />
                <input
                  type="text"
                  value={uiTheme.gradientColors?.start || '#3b82f6'}
                  onChange={handleGradientStartChange}
                  style={{ ...inputStyle, flex: 1 }}
                />
              </div>
            )}

            <label style={{ ...labelStyle, marginTop: 'var(--spacing-sm)' }}>渐变结束颜色</label>
            {readOnly ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                <div
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: 'var(--radius-sm)',
                    background: uiTheme.gradientColors?.end || '#ffffff',
                  }}
                />
                <span>{uiTheme.gradientColors?.end || '#ffffff'}</span>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                <input
                  type="color"
                  value={uiTheme.gradientColors?.end || '#ffffff'}
                  onChange={handleGradientEndChange}
                  style={{
                    width: '50px',
                    height: '35px',
                    padding: '2px',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    background: 'transparent',
                  }}
                />
                <input
                  type="text"
                  value={uiTheme.gradientColors?.end || '#ffffff'}
                  onChange={handleGradientEndChange}
                  style={{ ...inputStyle, flex: 1 }}
                />
              </div>
            )}

            <label style={{ ...labelStyle, marginTop: 'var(--spacing-sm)' }}>渐变方向</label>
            {readOnly ? (
              <span style={{ color: 'var(--color-text-primary)' }}>
                {GRADIENT_DIRECTION_OPTIONS.find(d => d.value === uiTheme.gradientColors?.direction)?.label || '从左到右'}
              </span>
            ) : (
              <select
                value={uiTheme.gradientColors?.direction || 'to right'}
                onChange={handleGradientDirectionChange}
                style={inputStyle}
              >
                {GRADIENT_DIRECTION_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}

            {/* 渐变预览 */}
            <div
              style={{
                marginTop: 'var(--spacing-md)',
                height: '60px',
                borderRadius: 'var(--radius-md)',
                background: `linear-gradient(${uiTheme.gradientColors?.direction || 'to right'}, ${uiTheme.gradientColors?.start || '#3b82f6'}, ${uiTheme.gradientColors?.end || '#ffffff'})`,
              }}
            />
          </div>
        )}

        {/* 图片背景配置 */}
        {uiTheme.backgroundStyle === 'image' && (
          <div style={{ marginTop: 'var(--spacing-md)' }}>
            <label style={labelStyle}>背景图片 URL</label>
            {readOnly ? (
              <span style={{ color: 'var(--color-text-primary)' }}>
                {uiTheme.backgroundImage || '未设置'}
              </span>
            ) : (
              <input
                type="text"
                value={uiTheme.backgroundImage || ''}
                onChange={handleBackgroundImageChange}
                placeholder="https://example.com/background.jpg"
                style={inputStyle}
              />
            )}
            {uiTheme.backgroundImage && (
              <div
                style={{
                  marginTop: 'var(--spacing-md)',
                  height: '100px',
                  borderRadius: 'var(--radius-md)',
                  backgroundImage: `url(${uiTheme.backgroundImage})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              />
            )}
          </div>
        )}

        {/* 图案背景配置 */}
        {uiTheme.backgroundStyle === 'pattern' && (
          <div style={{ marginTop: 'var(--spacing-md)' }}>
            <label style={labelStyle}>图案类型</label>
            {readOnly ? (
              <span style={{ color: 'var(--color-text-primary)' }}>
                {PATTERN_TYPE_OPTIONS.find(p => p.value === uiTheme.patternType)?.label || '圆点图案'}
              </span>
            ) : (
              <select
                value={uiTheme.patternType || 'dots'}
                onChange={handlePatternTypeChange}
                style={inputStyle}
              >
                {PATTERN_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}
            <div
              style={{
                marginTop: 'var(--spacing-md)',
                height: '60px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-background)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-text-secondary)',
                fontSize: 'var(--font-size-sm)',
              }}
            >
              图案预览（游戏运行时生效）
            </div>
          </div>
        )}

        {/* 动态背景配置 */}
        {uiTheme.backgroundStyle === 'animated' && (
          <div style={{ marginTop: 'var(--spacing-md)' }}>
            <label style={labelStyle}>动画效果类型</label>
            {readOnly ? (
              <span style={{ color: 'var(--color-text-primary)' }}>
                {ANIMATED_TYPE_OPTIONS.find(a => a.value === uiTheme.animatedType)?.label || '粒子效果'}
              </span>
            ) : (
              <select
                value={uiTheme.animatedType || 'particles'}
                onChange={handleAnimatedTypeChange}
                style={inputStyle}
              >
                {ANIMATED_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}
            <div
              style={{
                marginTop: 'var(--spacing-md)',
                height: '60px',
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-text-secondary)',
                fontSize: 'var(--font-size-sm)',
              }}
            >
              动画预览（游戏运行时生效）
            </div>
          </div>
        )}
      </div>

      {/* 自定义 CSS */}
      <div style={sectionStyle}>
        <h3 style={{ margin: '0 0 var(--spacing-lg) 0', fontSize: 'var(--font-size-lg)' }}>
          💻 自定义 CSS
        </h3>
        <p
          style={{
            margin: '0 0 var(--spacing-md) 0',
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-secondary)',
          }}
        >
          输入自定义 CSS 代码以进一步定制界面样式
        </p>
        {readOnly ? (
          <pre
            style={{
              ...inputStyle,
              minHeight: '120px',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
              margin: 0,
            }}
          >
            {uiTheme.customCSS || '/* 暂无自定义 CSS */'}
          </pre>
        ) : (
          <textarea
            value={uiTheme.customCSS || ''}
            onChange={handleCustomCSSChange}
            placeholder="/* 在此输入自定义 CSS */&#10;.custom-class {&#10;  color: red;&#10;}"
            style={{
              ...inputStyle,
              minHeight: '150px',
              fontFamily: 'monospace',
              fontSize: 'var(--font-size-sm)',
              resize: 'vertical',
            }}
          />
        )}
      </div>
    </div>
  );
};
