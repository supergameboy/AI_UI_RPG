import React, { useCallback } from 'react';
import type { UILayout } from '@ai-rpg/shared';

interface UILayoutEditorProps {
  uiLayout: UILayout;
  readOnly: boolean;
  onUpdate: (updates: Partial<UILayout>) => void;
}

export const UILayoutEditor: React.FC<UILayoutEditorProps> = ({
  uiLayout,
  readOnly,
  onUpdate,
}) => {
  const handleToggle = useCallback(
    (field: keyof UILayout) => {
      if (typeof uiLayout[field] === 'boolean') {
        onUpdate({ [field]: !uiLayout[field] });
      }
    },
    [uiLayout, onUpdate]
  );

  const handleCustomLayoutChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onUpdate({ customLayout: e.target.value });
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

  const sectionStyle = {
    padding: 'var(--spacing-lg)',
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)',
    marginBottom: 'var(--spacing-lg)',
  };

  const toggleContainerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 'var(--spacing-md)',
    background: 'var(--color-background)',
    borderRadius: 'var(--radius-md)',
    marginBottom: 'var(--spacing-sm)',
  };

  const toggleStyle = (checked: boolean) => ({
    position: 'relative' as const,
    width: '48px',
    height: '24px',
    background: checked ? 'var(--color-primary)' : 'var(--color-border)',
    borderRadius: '12px',
    cursor: readOnly ? 'default' : 'pointer',
    transition: 'background 0.2s ease',
  });

  const toggleKnobStyle = (checked: boolean) => ({
    position: 'absolute' as const,
    top: '2px',
    left: checked ? '26px' : '2px',
    width: '20px',
    height: '20px',
    background: 'white',
    borderRadius: '50%',
    transition: 'left 0.2s ease',
    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
  });

  const panelOptions = [
    {
      field: 'showMinimap' as const,
      label: '小地图',
      description: '在界面角落显示小地图，帮助玩家了解当前位置',
      icon: '🗺️',
    },
    {
      field: 'showCombatPanel' as const,
      label: '战斗面板',
      description: '在战斗时显示详细的战斗信息和状态',
      icon: '⚔️',
    },
    {
      field: 'showSkillBar' as const,
      label: '技能栏',
      description: '显示快捷技能栏，方便快速使用技能',
      icon: '✨',
    },
    {
      field: 'showPartyPanel' as const,
      label: '队伍面板',
      description: '显示队伍成员信息和状态',
      icon: '👥',
    },
  ];

  return (
    <div style={{ padding: 'var(--spacing-lg)', overflowY: 'auto' }}>
      {/* 界面面板设置 */}
      <div style={sectionStyle}>
        <h3 style={{ margin: '0 0 var(--spacing-lg) 0', fontSize: 'var(--font-size-lg)' }}>
          📐 界面面板设置
        </h3>
        <p
          style={{
            margin: '0 0 var(--spacing-md) 0',
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-secondary)',
          }}
        >
          配置游戏中显示的界面元素
        </p>

        <div style={{ display: 'grid', gap: 'var(--spacing-sm)' }}>
          {panelOptions.map((option) => (
            <div key={option.field} style={toggleContainerStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                <span style={{ fontSize: 'var(--font-size-lg)' }}>{option.icon}</span>
                <div>
                  <div style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>
                    {option.label}
                  </div>
                  <div
                    style={{
                      fontSize: 'var(--font-size-xs)',
                      color: 'var(--color-text-tertiary)',
                    }}
                  >
                    {option.description}
                  </div>
                </div>
              </div>
              {readOnly ? (
                <span
                  style={{
                    padding: 'var(--spacing-xs) var(--spacing-sm)',
                    background: uiLayout[option.field]
                      ? 'var(--color-primary-light)'
                      : 'var(--color-background)',
                    border: `1px solid ${
                      uiLayout[option.field] ? 'var(--color-primary)' : 'var(--color-border)'
                    }`,
                    borderRadius: 'var(--radius-sm)',
                    color: uiLayout[option.field]
                      ? 'var(--color-primary)'
                      : 'var(--color-text-tertiary)',
                    fontSize: 'var(--font-size-sm)',
                  }}
                >
                  {uiLayout[option.field] ? '已启用' : '已禁用'}
                </span>
              ) : (
                <div
                  style={toggleStyle(uiLayout[option.field])}
                  onClick={() => handleToggle(option.field)}
                  role="switch"
                  aria-checked={uiLayout[option.field]}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleToggle(option.field);
                    }
                  }}
                >
                  <div style={toggleKnobStyle(uiLayout[option.field])} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 布局预览 */}
      <div style={sectionStyle}>
        <h3 style={{ margin: '0 0 var(--spacing-lg) 0', fontSize: 'var(--font-size-lg)' }}>
          👁️ 布局预览
        </h3>
        <div
          style={{
            background: 'var(--color-background)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--spacing-md)',
            position: 'relative',
            minHeight: '200px',
          }}
        >
          {/* 小地图预览 */}
          {uiLayout.showMinimap && (
            <div
              style={{
                position: 'absolute',
                top: 'var(--spacing-sm)',
                right: 'var(--spacing-sm)',
                width: '80px',
                height: '80px',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-text-tertiary)',
              }}
            >
              小地图
            </div>
          )}

          {/* 队伍面板预览 */}
          {uiLayout.showPartyPanel && (
            <div
              style={{
                position: 'absolute',
                top: 'var(--spacing-sm)',
                left: 'var(--spacing-sm)',
                width: '120px',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                padding: 'var(--spacing-xs)',
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-text-tertiary)',
              }}
            >
              队伍面板
            </div>
          )}

          {/* 主内容区 */}
          <div
            style={{
              marginTop: uiLayout.showPartyPanel ? '60px' : 0,
              marginRight: uiLayout.showMinimap ? '100px' : 0,
              marginBottom: uiLayout.showSkillBar ? '60px' : 0,
              padding: 'var(--spacing-md)',
              textAlign: 'center',
              color: 'var(--color-text-tertiary)',
              fontSize: 'var(--font-size-sm)',
            }}
          >
            主游戏区域
          </div>

          {/* 技能栏预览 */}
          {uiLayout.showSkillBar && (
            <div
              style={{
                position: 'absolute',
                bottom: 'var(--spacing-sm)',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '200px',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                padding: 'var(--spacing-xs)',
                display: 'flex',
                justifyContent: 'center',
                gap: 'var(--spacing-xs)',
              }}
            >
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  style={{
                    width: '24px',
                    height: '24px',
                    background: 'var(--color-background)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-xs)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--color-text-tertiary)',
                  }}
                >
                  {i}
                </div>
              ))}
            </div>
          )}

          {/* 战斗面板预览 */}
          {uiLayout.showCombatPanel && (
            <div
              style={{
                position: 'absolute',
                bottom: uiLayout.showSkillBar ? '50px' : 'var(--spacing-sm)',
                right: 'var(--spacing-sm)',
                width: '100px',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                padding: 'var(--spacing-xs)',
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-text-tertiary)',
                textAlign: 'center',
              }}
            >
              战斗面板
            </div>
          )}
        </div>
      </div>

      {/* 自定义布局 */}
      <div style={sectionStyle}>
        <h3 style={{ margin: '0 0 var(--spacing-lg) 0', fontSize: 'var(--font-size-lg)' }}>
          🔧 自定义布局
        </h3>
        <p
          style={{
            margin: '0 0 var(--spacing-md) 0',
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-secondary)',
          }}
        >
          输入自定义布局配置（JSON 格式）以进一步定制界面
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
            {uiLayout.customLayout || '/* 暂无自定义布局 */'}
          </pre>
        ) : (
          <textarea
            value={uiLayout.customLayout || ''}
            onChange={handleCustomLayoutChange}
            placeholder='/* 在此输入自定义布局配置 */&#10;{&#10;  "customPanel": {&#10;    "position": "top",&#10;    "size": 100&#10;  }&#10;}'
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
