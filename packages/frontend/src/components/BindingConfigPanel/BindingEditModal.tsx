import React, { useState, useEffect } from 'react';
import { Button, Icon } from '../common';
import { AgentType, type BindingMatch } from '@ai-rpg/shared';
import type { BindingFormData, BindingEditModalProps } from './types';
import styles from './BindingEditModal.module.css';

const AGENT_OPTIONS: { value: AgentType; label: string }[] = [
  { value: AgentType.COORDINATOR, label: '统筹管理' },
  { value: AgentType.STORY_CONTEXT, label: '故事上下文' },
  { value: AgentType.QUEST, label: '任务管理' },
  { value: AgentType.MAP, label: '地图管理' },
  { value: AgentType.NPC_PARTY, label: 'NPC/队伍' },
  { value: AgentType.NUMERICAL, label: '数值管理' },
  { value: AgentType.INVENTORY, label: '背包系统' },
  { value: AgentType.SKILL, label: '技能管理' },
  { value: AgentType.UI, label: 'UI管理' },
  { value: AgentType.COMBAT, label: '战斗管理' },
  { value: AgentType.DIALOGUE, label: '对话管理' },
  { value: AgentType.EVENT, label: '事件管理' },
];

const CONTEXT_OPERATORS = [
  { value: 'eq', label: '等于' },
  { value: 'neq', label: '不等于' },
  { value: 'gt', label: '大于' },
  { value: 'lt', label: '小于' },
  { value: 'gte', label: '大于等于' },
  { value: 'lte', label: '小于等于' },
  { value: 'contains', label: '包含' },
  { value: 'matches', label: '匹配' },
] as const;

interface CustomCondition {
  field: string;
  operator: typeof CONTEXT_OPERATORS[number]['value'];
  value: string;
}

const DEFAULT_FORM_DATA: BindingFormData = {
  agentId: AgentType.COORDINATOR,
  match: {},
  priority: 10,
  enabled: true,
  description: '',
};

export const BindingEditModal: React.FC<BindingEditModalProps> = ({
  open,
  binding,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<BindingFormData>(DEFAULT_FORM_DATA);
  const [messageType, setMessageType] = useState('');
  const [contextFields, setContextFields] = useState<{ key: string; value: string }[]>([]);
  const [customConditions, setCustomConditions] = useState<CustomCondition[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (binding) {
      setFormData({
        id: binding.id,
        agentId: binding.agentId,
        match: binding.match,
        priority: binding.priority,
        enabled: binding.enabled,
        description: binding.description || '',
      });

      // Parse messageType
      setMessageType(binding.match.messageType || '');

      // Parse context
      if (binding.match.context) {
        const fields = Object.entries(binding.match.context).map(([key, value]) => ({
          key,
          value: String(value),
        }));
        setContextFields(fields);
      } else {
        setContextFields([]);
      }

      // Parse custom conditions
      if (binding.match.custom) {
        setCustomConditions(
          binding.match.custom.map((c) => ({
            field: c.field,
            operator: c.operator,
            value: String(c.value),
          }))
        );
      } else {
        setCustomConditions([]);
      }
    } else {
      setFormData(DEFAULT_FORM_DATA);
      setMessageType('');
      setContextFields([]);
      setCustomConditions([]);
    }
    setError(null);
  }, [binding, open]);

  const handleFormChange = (field: keyof BindingFormData, value: string | number | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddContextField = () => {
    setContextFields((prev) => [...prev, { key: '', value: '' }]);
  };

  const handleRemoveContextField = (index: number) => {
    setContextFields((prev) => prev.filter((_, i) => i !== index));
  };

  const handleContextFieldChange = (
    index: number,
    field: 'key' | 'value',
    value: string
  ) => {
    setContextFields((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const handleAddCustomCondition = () => {
    setCustomConditions((prev) => [
      ...prev,
      { field: '', operator: 'eq', value: '' },
    ]);
  };

  const handleRemoveCustomCondition = (index: number) => {
    setCustomConditions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCustomConditionChange = (
    index: number,
    field: keyof CustomCondition,
    value: string
  ) => {
    setCustomConditions((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const buildMatch = (): BindingMatch => {
    const match: BindingMatch = {};

    if (messageType.trim()) {
      match.messageType = messageType.trim() as string;
    }

    const validContextFields = contextFields.filter((f) => f.key.trim() && f.value.trim());
    if (validContextFields.length > 0) {
      match.context = {};
      for (const field of validContextFields) {
        // Try to parse boolean values
        let parsedValue: unknown = field.value;
        if (field.value === 'true') parsedValue = true;
        else if (field.value === 'false') parsedValue = false;
        else if (!isNaN(Number(field.value))) parsedValue = Number(field.value);
        
        match.context[field.key] = parsedValue;
      }
    }

    const validCustomConditions = customConditions.filter(
      (c) => c.field.trim() && c.value.trim()
    );
    if (validCustomConditions.length > 0) {
      match.custom = validCustomConditions.map((c) => ({
        field: c.field,
        operator: c.operator,
        value: c.value,
      }));
    }

    return match;
  };

  const handleSubmit = async () => {
    if (!formData.agentId) {
      setError('请选择目标 Agent');
      return;
    }

    const match = buildMatch();
    if (Object.keys(match).length === 0) {
      setError('请至少设置一个匹配条件');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await onSave({
        ...formData,
        match,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3 className={styles.title}>
            {binding ? `编辑绑定: ${binding.id}` : '新建绑定'}
          </h3>
          <button className={styles.closeBtn} onClick={onClose}>
            <Icon name="close" size={20} />
          </button>
        </div>

        {error && (
          <div className={styles.error}>
            <span>{error}</span>
            <button onClick={() => setError(null)}>
              <Icon name="close" size={16} />
            </button>
          </div>
        )}

        <div className={styles.content}>
          {/* Basic Info */}
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>基本信息</h4>
            
            {!binding && (
              <div className={styles.formRow}>
                <label className={styles.formLabel}>绑定 ID *</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={formData.id || ''}
                  onChange={(e) => handleFormChange('id', e.target.value)}
                  placeholder="例如: my_binding"
                />
              </div>
            )}

            <div className={styles.formRow}>
              <label className={styles.formLabel}>目标 Agent *</label>
              <select
                className={styles.formSelect}
                value={formData.agentId}
                onChange={(e) => handleFormChange('agentId', e.target.value as AgentType)}
              >
                {AGENT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label} ({opt.value})
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formRow}>
              <label className={styles.formLabel}>描述</label>
              <input
                type="text"
                className={styles.formInput}
                value={formData.description || ''}
                onChange={(e) => handleFormChange('description', e.target.value)}
                placeholder="可选描述"
              />
            </div>

            <div className={styles.formRow}>
              <label className={styles.formLabel}>优先级</label>
              <input
                type="number"
                className={styles.formInput}
                value={formData.priority}
                onChange={(e) => handleFormChange('priority', parseInt(e.target.value, 10))}
                min={0}
                max={1000}
              />
              <span className={styles.formHint}>数值越高优先级越高</span>
            </div>

            <div className={styles.formRow}>
              <label className={styles.formLabel}>启用状态</label>
              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={formData.enabled}
                  onChange={(e) => handleFormChange('enabled', e.target.checked)}
                />
                <span>启用此绑定</span>
              </label>
            </div>
          </div>

          {/* Match Conditions */}
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>匹配条件</h4>

            {/* Message Type */}
            <div className={styles.formRow}>
              <label className={styles.formLabel}>消息类型</label>
              <input
                type="text"
                className={styles.formInput}
                value={messageType}
                onChange={(e) => setMessageType(e.target.value)}
                placeholder="例如: dialogue_request 或 * (匹配所有)"
              />
            </div>

            {/* Context Fields */}
            <div className={styles.conditionGroup}>
              <div className={styles.conditionHeader}>
                <label className={styles.formLabel}>上下文条件</label>
                <Button variant="ghost" size="small" onClick={handleAddContextField}>
                  <Icon name="plus" size={14} />
                  添加字段
                </Button>
              </div>
              
              {contextFields.map((field, index) => (
                <div key={index} className={styles.conditionRow}>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={field.key}
                    onChange={(e) => handleContextFieldChange(index, 'key', e.target.value)}
                    placeholder="字段名"
                  />
                  <span className={styles.conditionSeparator}>=</span>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={field.value}
                    onChange={(e) => handleContextFieldChange(index, 'value', e.target.value)}
                    placeholder="值"
                  />
                  <button
                    className={styles.removeBtn}
                    onClick={() => handleRemoveContextField(index)}
                  >
                    <Icon name="close" size={14} />
                  </button>
                </div>
              ))}
              
              {contextFields.length === 0 && (
                <div className={styles.emptyCondition}>
                  点击"添加字段"添加上下文条件
                </div>
              )}
            </div>

            {/* Custom Conditions */}
            <div className={styles.conditionGroup}>
              <div className={styles.conditionHeader}>
                <label className={styles.formLabel}>自定义条件</label>
                <Button variant="ghost" size="small" onClick={handleAddCustomCondition}>
                  <Icon name="plus" size={14} />
                  添加条件
                </Button>
              </div>
              
              {customConditions.map((condition, index) => (
                <div key={index} className={styles.conditionRow}>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={condition.field}
                    onChange={(e) => handleCustomConditionChange(index, 'field', e.target.value)}
                    placeholder="字段名"
                  />
                  <select
                    className={styles.formSelect}
                    value={condition.operator}
                    onChange={(e) =>
                      handleCustomConditionChange(index, 'operator', e.target.value)
                    }
                  >
                    {CONTEXT_OPERATORS.map((op) => (
                      <option key={op.value} value={op.value}>
                        {op.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={condition.value}
                    onChange={(e) => handleCustomConditionChange(index, 'value', e.target.value)}
                    placeholder="值"
                  />
                  <button
                    className={styles.removeBtn}
                    onClick={() => handleRemoveCustomCondition(index)}
                  >
                    <Icon name="close" size={14} />
                  </button>
                </div>
              ))}
              
              {customConditions.length === 0 && (
                <div className={styles.emptyCondition}>
                  点击"添加条件"添加自定义条件
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            取消
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={saving}>
            {binding ? '保存更改' : '创建绑定'}
          </Button>
        </div>
      </div>
    </div>
  );
};
