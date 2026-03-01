import React, { useState, useCallback } from 'react';
import type { GameRules, NumericalComplexity, SpecialRules, CombatRuleSet } from '@ai-rpg/shared';
import { Button, Icon } from '../../common';

interface RulesEditorProps {
  gameRules: GameRules;
  numericalComplexity: NumericalComplexity;
  specialRules: SpecialRules;
  readOnly: boolean;
  onUpdate: (updates: Partial<GameRules>) => void;
  onUpdateNumericalComplexity: (value: NumericalComplexity) => void;
  onUpdateSpecialRules: (updates: Partial<SpecialRules>) => void;
}

const COMBAT_TYPES = [
  { value: 'narrative', label: '叙事型' },
  { value: 'turn_based', label: '回合制' },
  { value: 'real_time', label: '实时' },
  { value: 'hybrid', label: '混合' },
];

const INITIATIVE_TYPES = [
  { value: 'dexterity', label: '敏捷' },
  { value: 'random', label: '随机' },
  { value: 'custom', label: '自定义' },
];

const COOLDOWN_SYSTEMS = [
  { value: 'turn', label: '回合制' },
  { value: 'time', label: '时间制' },
  { value: 'none', label: '无冷却' },
];

const NUMERICAL_COMPLEXITY_OPTIONS = [
  { value: 'simple', label: '简单', description: '简化的数值系统，适合新手玩家' },
  { value: 'medium', label: '中等', description: '平衡的数值复杂度，兼顾深度和易用性' },
  { value: 'complex', label: '复杂', description: '详细的数值系统，适合硬核玩家' },
];

const DEFAULT_CRITICAL_HIT = { threshold: 20, multiplier: 2 };
const DEFAULT_UPGRADE_COST = { base: 1, multiplier: 1.5 };

export const RulesEditor: React.FC<RulesEditorProps> = ({
  gameRules,
  numericalComplexity,
  specialRules,
  readOnly,
  onUpdate,
  onUpdateNumericalComplexity,
  onUpdateSpecialRules,
}) => {
  const [newCustomRule, setNewCustomRule] = useState('');
  
  const combatSystem = gameRules.combatSystem || {};
  const skillSystem = gameRules.skillSystem || {};
  const inventorySystem = gameRules.inventorySystem || {};
  const questSystem = gameRules.questSystem || {};
  const criticalHit = combatSystem.criticalHit || DEFAULT_CRITICAL_HIT;
  const upgradeCost = skillSystem.upgradeCost || DEFAULT_UPGRADE_COST;
  const customRules = specialRules.customRules || [];

  const updateCombat = useCallback(
    (updates: Partial<GameRules['combatSystem']>) => {
      onUpdate({
        combatSystem: { ...combatSystem, ...updates },
      });
    },
    [combatSystem, onUpdate]
  );

  const updateSkill = useCallback(
    (updates: Partial<GameRules['skillSystem']>) => {
      onUpdate({
        skillSystem: { ...skillSystem, ...updates },
      });
    },
    [skillSystem, onUpdate]
  );

  const updateInventory = useCallback(
    (updates: Partial<GameRules['inventorySystem']>) => {
      onUpdate({
        inventorySystem: { ...inventorySystem, ...updates },
      });
    },
    [inventorySystem, onUpdate]
  );

  const updateQuest = useCallback(
    (updates: Partial<GameRules['questSystem']>) => {
      onUpdate({
        questSystem: { ...questSystem, ...updates },
      });
    },
    [questSystem, onUpdate]
  );

  const handleCombatTypeChange = useCallback(
    (newType: CombatRuleSet['type']) => {
      const updates: Partial<CombatRuleSet> = { type: newType };

      switch (newType) {
        case 'narrative':
          updates.actionPoints = 1;
          updates.initiativeType = 'random';
          break;
        case 'turn_based':
          updates.actionPoints = 3;
          break;
        case 'real_time':
          updates.actionPoints = 0;
          break;
        case 'hybrid':
          updates.actionPoints = 3;
          break;
      }

      onUpdate({
        combatSystem: { ...combatSystem, ...updates },
        skillSystem: {
          ...skillSystem,
          cooldownSystem: newType === 'real_time' ? 'time' : 'turn',
        },
      });
    },
    [combatSystem, skillSystem, onUpdate]
  );

  const handleAddCustomRule = useCallback(() => {
    const trimmed = newCustomRule.trim();
    if (trimmed && !customRules.includes(trimmed)) {
      onUpdateSpecialRules({
        customRules: [...customRules, trimmed],
      });
      setNewCustomRule('');
    }
  }, [newCustomRule, customRules, onUpdateSpecialRules]);

  const handleRemoveCustomRule = useCallback(
    (rule: string) => {
      onUpdateSpecialRules({
        customRules: customRules.filter((r) => r !== rule),
      });
    },
    [customRules, onUpdateSpecialRules]
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

  return (
    <div style={{ padding: 'var(--spacing-lg)', overflowY: 'auto' }}>
      {/* 战斗规则 */}
      <div style={sectionStyle}>
        <h3 style={{ margin: '0 0 var(--spacing-lg) 0', fontSize: 'var(--font-size-lg)' }}>
          ⚔️ 战斗规则
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
          <div>
            <label style={labelStyle}>战斗类型</label>
            {readOnly ? (
              <span style={{ color: 'var(--color-text-primary)' }}>
                {COMBAT_TYPES.find((t) => t.value === combatSystem.type)?.label || '回合制'}
              </span>
            ) : (
              <select
                value={combatSystem.type || 'turn_based'}
                onChange={(e) => handleCombatTypeChange(e.target.value as CombatRuleSet['type'])}
                style={inputStyle}
              >
                {COMBAT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label style={labelStyle}>先攻类型</label>
            {readOnly ? (
              <span style={{ color: 'var(--color-text-primary)' }}>
                {INITIATIVE_TYPES.find((t) => t.value === combatSystem.initiativeType)?.label || '敏捷'}
              </span>
            ) : (
              <>
                <select
                  value={combatSystem.initiativeType || 'dexterity'}
                  onChange={(e) => updateCombat({ initiativeType: e.target.value as GameRules['combatSystem']['initiativeType'] })}
                  style={inputStyle}
                >
                  {INITIATIVE_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
                {combatSystem.initiativeType === 'custom' && (
                  <input
                    type="text"
                    value={combatSystem.customInitiative || ''}
                    onChange={(e) => updateCombat({ customInitiative: e.target.value })}
                    placeholder="请输入自定义先攻规则"
                    style={{ ...inputStyle, marginTop: 'var(--spacing-xs)' }}
                  />
                )}
              </>
            )}
          </div>

          {(combatSystem.type !== 'real_time' || readOnly) && (
            <div>
              <label style={labelStyle}>行动点数</label>
              {readOnly ? (
                <span style={{ color: 'var(--color-text-primary)' }}>{combatSystem.actionPoints || 3}</span>
              ) : (
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={combatSystem.actionPoints || 3}
                  onChange={(e) => updateCombat({ actionPoints: parseInt(e.target.value, 10) || 3 })}
                  style={inputStyle}
                  disabled={combatSystem.type === 'narrative'}
                />
              )}
            </div>
          )}

          <div>
            <label style={labelStyle}>暴击阈值</label>
            {readOnly ? (
              <span style={{ color: 'var(--color-text-primary)' }}>{criticalHit.threshold}</span>
            ) : (
              <input
                type="number"
                min={1}
                max={20}
                value={criticalHit.threshold}
                onChange={(e) =>
                  updateCombat({
                    criticalHit: {
                      ...criticalHit,
                      threshold: parseInt(e.target.value, 10) || 20,
                    },
                  })
                }
                style={inputStyle}
              />
            )}
          </div>

          <div>
            <label style={labelStyle}>暴击倍率</label>
            {readOnly ? (
              <span style={{ color: 'var(--color-text-primary)' }}>{criticalHit.multiplier}x</span>
            ) : (
              <input
                type="number"
                min={1}
                max={10}
                step={0.5}
                value={criticalHit.multiplier}
                onChange={(e) =>
                  updateCombat({
                    criticalHit: {
                      ...criticalHit,
                      multiplier: parseFloat(e.target.value) || 2,
                    },
                  })
                }
                style={inputStyle}
              />
            )}
          </div>
        </div>
      </div>

      {/* 技能规则 */}
      <div style={sectionStyle}>
        <h3 style={{ margin: '0 0 var(--spacing-lg) 0', fontSize: 'var(--font-size-lg)' }}>
          ✨ 技能规则
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
          <div>
            <label style={labelStyle}>最大等级</label>
            {readOnly ? (
              <span style={{ color: 'var(--color-text-primary)' }}>{skillSystem.maxLevel || 10}</span>
            ) : (
              <input
                type="number"
                min={1}
                max={100}
                value={skillSystem.maxLevel || 10}
                onChange={(e) => updateSkill({ maxLevel: parseInt(e.target.value, 10) || 10 })}
                style={inputStyle}
              />
            )}
          </div>

          <div>
            <label style={labelStyle}>冷却系统</label>
            {readOnly ? (
              <span style={{ color: 'var(--color-text-primary)' }}>
                {COOLDOWN_SYSTEMS.find((t) => t.value === skillSystem.cooldownSystem)?.label || '回合制'}
              </span>
            ) : (
              <select
                value={skillSystem.cooldownSystem || 'turn'}
                onChange={(e) => updateSkill({ cooldownSystem: e.target.value as GameRules['skillSystem']['cooldownSystem'] })}
                style={inputStyle}
              >
                {COOLDOWN_SYSTEMS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label style={labelStyle}>升级基础消耗</label>
            {readOnly ? (
              <span style={{ color: 'var(--color-text-primary)' }}>{upgradeCost.base}</span>
            ) : (
              <input
                type="number"
                min={1}
                value={upgradeCost.base}
                onChange={(e) =>
                  updateSkill({
                    upgradeCost: {
                      ...upgradeCost,
                      base: parseInt(e.target.value, 10) || 1,
                    },
                  })
                }
                style={inputStyle}
              />
            )}
          </div>

          <div>
            <label style={labelStyle}>升级消耗倍率</label>
            {readOnly ? (
              <span style={{ color: 'var(--color-text-primary)' }}>{upgradeCost.multiplier}x</span>
            ) : (
              <input
                type="number"
                min={1}
                step={0.1}
                value={upgradeCost.multiplier}
                onChange={(e) =>
                  updateSkill({
                    upgradeCost: {
                      ...upgradeCost,
                      multiplier: parseFloat(e.target.value) || 1.5,
                    },
                  })
                }
                style={inputStyle}
              />
            )}
          </div>
        </div>
      </div>

      {/* 背包规则 */}
      <div style={sectionStyle}>
        <h3 style={{ margin: '0 0 var(--spacing-lg) 0', fontSize: 'var(--font-size-lg)' }}>
          🎒 背包规则
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
          <div>
            <label style={labelStyle}>最大槽位</label>
            {readOnly ? (
              <span style={{ color: 'var(--color-text-primary)' }}>{inventorySystem.maxSlots || 50}</span>
            ) : (
              <input
                type="number"
                min={1}
                max={1000}
                value={inventorySystem.maxSlots || 50}
                onChange={(e) => updateInventory({ maxSlots: parseInt(e.target.value, 10) || 50 })}
                style={inputStyle}
              />
            )}
          </div>

          <div>
            <label style={labelStyle}>重量系统</label>
            {readOnly ? (
              <span style={{ color: 'var(--color-text-primary)' }}>
                {inventorySystem.weightSystem ? '启用' : '禁用'}
              </span>
            ) : (
              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={inventorySystem.weightSystem || false}
                  onChange={(e) => updateInventory({ weightSystem: e.target.checked })}
                />
                <span>启用重量系统</span>
              </label>
            )}
          </div>
        </div>
      </div>

      {/* 任务规则 */}
      <div style={sectionStyle}>
        <h3 style={{ margin: '0 0 var(--spacing-lg) 0', fontSize: 'var(--font-size-lg)' }}>
          📜 任务规则
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
          <div>
            <label style={labelStyle}>最大同时任务数</label>
            {readOnly ? (
              <span style={{ color: 'var(--color-text-primary)' }}>{questSystem.maxActive || 10}</span>
            ) : (
              <input
                type="number"
                min={1}
                max={100}
                value={questSystem.maxActive || 10}
                onChange={(e) => updateQuest({ maxActive: parseInt(e.target.value, 10) || 10 })}
                style={inputStyle}
              />
            )}
          </div>

          <div>
            <label style={labelStyle}>时间系统</label>
            {readOnly ? (
              <span style={{ color: 'var(--color-text-primary)' }}>
                {questSystem.timeSystem ? '启用' : '禁用'}
              </span>
            ) : (
              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={questSystem.timeSystem || false}
                  onChange={(e) => updateQuest({ timeSystem: e.target.checked })}
                />
                <span>启用时间系统</span>
              </label>
            )}
          </div>
        </div>
      </div>

      {/* 数值复杂度 */}
      <div style={sectionStyle}>
        <h3 style={{ margin: '0 0 var(--spacing-lg) 0', fontSize: 'var(--font-size-lg)' }}>
          🔢 数值复杂度
        </h3>
        <p style={{ margin: '0 0 var(--spacing-md) 0', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
          设置游戏数值系统的复杂程度
        </p>
        {readOnly ? (
          <div style={{ marginTop: 'var(--spacing-xs)' }}>
            <span style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>
              {NUMERICAL_COMPLEXITY_OPTIONS.find((o) => o.value === numericalComplexity)?.label}
            </span>
            <p style={{ margin: 'var(--spacing-xs) 0 0 0', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-tertiary)' }}>
              {NUMERICAL_COMPLEXITY_OPTIONS.find((o) => o.value === numericalComplexity)?.description}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)', marginTop: 'var(--spacing-xs)' }}>
            {NUMERICAL_COMPLEXITY_OPTIONS.map((option) => (
              <label
                key={option.value}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 'var(--spacing-sm)',
                  padding: 'var(--spacing-sm)',
                  background: numericalComplexity === option.value ? 'var(--color-primary-light)' : 'var(--color-background)',
                  border: `1px solid ${numericalComplexity === option.value ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <input
                  type="radio"
                  name="numericalComplexity"
                  value={option.value}
                  checked={numericalComplexity === option.value}
                  onChange={() => onUpdateNumericalComplexity(option.value as NumericalComplexity)}
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

      {/* 特殊规则 */}
      <div style={sectionStyle}>
        <h3 style={{ margin: '0 0 var(--spacing-lg) 0', fontSize: 'var(--font-size-lg)' }}>
          ⚡ 特殊规则
        </h3>
        <p style={{ margin: '0 0 var(--spacing-md) 0', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
          配置游戏的特殊规则和限制
        </p>

        <div style={{ display: 'grid', gap: 'var(--spacing-sm)' }}>
          {/* KP系统 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 'var(--spacing-md)',
              background: 'var(--color-background)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <div>
              <div style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>
                🎲 KP（守密人）系统
              </div>
              <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-tertiary)' }}>
                启用守密人系统，由AI扮演KP角色
              </div>
            </div>
            {readOnly ? (
              <span
                style={{
                  padding: 'var(--spacing-xs) var(--spacing-sm)',
                  background: specialRules.hasKP ? 'var(--color-primary-light)' : 'var(--color-background)',
                  border: `1px solid ${specialRules.hasKP ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  borderRadius: 'var(--radius-sm)',
                  color: specialRules.hasKP ? 'var(--color-primary)' : 'var(--color-text-tertiary)',
                  fontSize: 'var(--font-size-sm)',
                }}
              >
                {specialRules.hasKP ? '已启用' : '已禁用'}
              </span>
            ) : (
              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={specialRules.hasKP || false}
                  onChange={(e) => onUpdateSpecialRules({ hasKP: e.target.checked })}
                />
                <span>启用</span>
              </label>
            )}
          </div>

          {/* 永久死亡 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 'var(--spacing-md)',
              background: 'var(--color-background)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <div>
              <div style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>
                💀 永久死亡
              </div>
              <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-tertiary)' }}>
                角色死亡后无法复活，增加游戏紧张感
              </div>
            </div>
            {readOnly ? (
              <span
                style={{
                  padding: 'var(--spacing-xs) var(--spacing-sm)',
                  background: specialRules.permadeath ? 'var(--color-danger-light)' : 'var(--color-background)',
                  border: `1px solid ${specialRules.permadeath ? 'var(--color-danger)' : 'var(--color-border)'}`,
                  borderRadius: 'var(--radius-sm)',
                  color: specialRules.permadeath ? 'var(--color-danger)' : 'var(--color-text-tertiary)',
                  fontSize: 'var(--font-size-sm)',
                }}
              >
                {specialRules.permadeath ? '已启用' : '已禁用'}
              </span>
            ) : (
              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={specialRules.permadeath || false}
                  onChange={(e) => onUpdateSpecialRules({ permadeath: e.target.checked })}
                />
                <span>启用</span>
              </label>
            )}
          </div>

          {/* 存档限制 */}
          <div>
            <label style={labelStyle}>存档限制</label>
            {readOnly ? (
              <span style={{ color: 'var(--color-text-primary)' }}>
                {specialRules.saveRestriction || '无限制'}
              </span>
            ) : (
              <select
                value={specialRules.saveRestriction || 'none'}
                onChange={(e) => onUpdateSpecialRules({ saveRestriction: e.target.value })}
                style={inputStyle}
              >
                <option value="none">无限制</option>
                <option value="checkpoint">仅检查点存档</option>
                <option value="manual">仅手动存档</option>
                <option value="ironman">铁人模式（仅一个存档）</option>
              </select>
            )}
          </div>
        </div>

        {/* 自定义规则 */}
        <div style={{ marginTop: 'var(--spacing-lg)' }}>
          <label style={labelStyle}>自定义规则</label>
          <p style={{ margin: '0 0 var(--spacing-sm) 0', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>
            添加游戏特定的自定义规则
          </p>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-xs)', marginBottom: 'var(--spacing-sm)' }}>
            {customRules.length === 0 ? (
              <span style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--font-size-sm)' }}>
                暂无自定义规则
              </span>
            ) : (
              customRules.map((rule) => (
                <span
                  key={rule}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-xs)',
                    padding: 'var(--spacing-xs) var(--spacing-sm)',
                    background: 'var(--color-background)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 'var(--font-size-sm)',
                  }}
                >
                  {rule}
                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => handleRemoveCustomRule(rule)}
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
                value={newCustomRule}
                onChange={(e) => setNewCustomRule(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCustomRule()}
                placeholder="输入自定义规则"
                style={{ ...inputStyle, flex: 1 }}
              />
              <Button variant="secondary" size="small" onClick={handleAddCustomRule}>
                添加
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
