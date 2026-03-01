import React, { useCallback } from 'react';
import type { GameRules } from '@ai-rpg/shared';

interface RulesEditorProps {
  gameRules: GameRules;
  readOnly: boolean;
  onUpdate: (updates: Partial<GameRules>) => void;
}

const COMBAT_TYPES = [
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

const DEFAULT_CRITICAL_HIT = { threshold: 20, multiplier: 2 };
const DEFAULT_UPGRADE_COST = { base: 1, multiplier: 1.5 };

export const RulesEditor: React.FC<RulesEditorProps> = ({
  gameRules,
  readOnly,
  onUpdate,
}) => {
  const combatSystem = gameRules.combatSystem || {};
  const skillSystem = gameRules.skillSystem || {};
  const inventorySystem = gameRules.inventorySystem || {};
  const questSystem = gameRules.questSystem || {};
  const criticalHit = combatSystem.criticalHit || DEFAULT_CRITICAL_HIT;
  const upgradeCost = skillSystem.upgradeCost || DEFAULT_UPGRADE_COST;

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
                onChange={(e) => updateCombat({ type: e.target.value as GameRules['combatSystem']['type'] })}
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
            )}
          </div>

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
              />
            )}
          </div>

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
    </div>
  );
};
