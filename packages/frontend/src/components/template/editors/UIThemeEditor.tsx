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

export const UIThemeEditor: React.FC<UIThemeEditorProps> = ({
  uiTheme,
  readOnly,
  onUpdate,
}) => {
  const handleColorChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
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
      onUpdate({ backgroundStyle: e.target.value });
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
