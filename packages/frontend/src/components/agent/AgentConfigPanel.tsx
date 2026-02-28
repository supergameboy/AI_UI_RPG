import React, { useState, useEffect, useCallback } from 'react';
import { Button, Icon, Panel } from '../common';
import { useAgentStore } from '../../stores';
import { agentService, type AgentConfigUpdate } from '../../services/agentService';
import type { AgentType, AgentConfig } from '@ai-rpg/shared';
import styles from './AgentConfigPanel.module.css';

const PROVIDERS = [
  { value: 'deepseek', label: 'DeepSeek' },
  { value: 'glm', label: '智谱 GLM' },
  { value: 'kimi', label: 'Moonshot Kimi' },
  { value: 'openai', label: 'OpenAI' },
];

const DEFAULT_MODELS: Record<string, string[]> = {
  deepseek: ['deepseek-chat', 'deepseek-coder'],
  glm: ['glm-4', 'glm-4-flash', 'glm-3-turbo'],
  kimi: ['moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k'],
  openai: ['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'],
};

export interface AgentConfigPanelProps {
  onClose?: () => void;
}

export const AgentConfigPanel: React.FC<AgentConfigPanelProps> = ({ onClose }) => {
  const {
    configs,
    statuses,
    loading,
    error,
    expandedAgent,
    editingConfig,
    saving,
    fetchConfigs,
    fetchStatuses,
    setExpandedAgent,
    updateConfig,
    resetConfig,
    clearError,
  } = useAgentStore();

  const [formData, setFormData] = useState<Partial<AgentConfig>>({});

  const loadData = useCallback(async () => {
    await Promise.all([fetchConfigs(), fetchStatuses()]);
  }, [fetchConfigs, fetchStatuses]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (editingConfig) {
      setFormData({
        provider: editingConfig.provider,
        model: editingConfig.model,
        temperature: editingConfig.temperature,
        maxTokens: editingConfig.maxTokens,
      });
    }
  }, [editingConfig]);

  const handleToggleExpand = (agentType: AgentType) => {
    if (expandedAgent === agentType) {
      setExpandedAgent(null);
    } else {
      setExpandedAgent(agentType);
    }
  };

  const handleFormChange = (field: keyof AgentConfig, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleProviderChange = (provider: string) => {
    const defaultModel = DEFAULT_MODELS[provider]?.[0] || '';
    setFormData((prev) => ({
      ...prev,
      provider,
      model: defaultModel,
    }));
  };

  const handleSave = async () => {
    if (!editingConfig) return;

    const updates: AgentConfigUpdate = {
      provider: formData.provider,
      model: formData.model,
      temperature: Number(formData.temperature),
      maxTokens: Number(formData.maxTokens),
    };

    try {
      await updateConfig(editingConfig.type, updates);
    } catch {
      // Error is handled in store
    }
  };

  const handleReset = async () => {
    if (!editingConfig) return;

    try {
      await resetConfig(editingConfig.type);
    } catch {
      // Error is handled in store
    }
  };

  const getAgentStatus = (agentType: AgentType) => {
    return statuses.find((s) => s.type === agentType);
  };

  const isFormChanged = () => {
    if (!editingConfig) return false;
    return (
      formData.provider !== editingConfig.provider ||
      formData.model !== editingConfig.model ||
      formData.temperature !== editingConfig.temperature ||
      formData.maxTokens !== editingConfig.maxTokens
    );
  };

  if (loading && configs.length === 0) {
    return (
      <Panel className={styles.container}>
        <div className={styles.loading}>
          <Icon name="loading" size={32} />
          <span>加载中...</span>
        </div>
      </Panel>
    );
  }

  return (
    <Panel className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>智能体配置</h2>
        {onClose && (
          <button className={styles.closeBtn} onClick={onClose}>
            <Icon name="close" size={20} />
          </button>
        )}
      </div>

      {error && (
        <div className={styles.error}>
          <span>{error}</span>
          <button onClick={clearError}>
            <Icon name="close" size={16} />
          </button>
        </div>
      )}

      <div className={styles.content}>
        <div className={styles.agentList}>
          {configs.map((config) => {
            const status = getAgentStatus(config.type);
            const isExpanded = expandedAgent === config.type;

            return (
              <div
                key={config.type}
                className={[styles.agentCard, isExpanded && styles.expanded].filter(Boolean).join(' ')}
              >
                <div
                  className={styles.agentHeader}
                  onClick={() => handleToggleExpand(config.type)}
                >
                  <div className={styles.agentInfo}>
                    <span className={styles.agentName}>
                      {agentService.getAgentTypeName(config.type)}
                    </span>
                    <span className={styles.agentType}>{config.type}</span>
                  </div>

                  <div className={styles.agentMeta}>
                    {status && (
                      <span
                        className={styles.statusBadge}
                        style={{ backgroundColor: agentService.getStatusColor(status.status) }}
                      >
                        {agentService.getStatusLabel(status.status)}
                      </span>
                    )}
                    <span className={styles.modelInfo}>
                      {config.provider} / {config.model}
                    </span>
                    <Icon
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={16}
                    />
                  </div>
                </div>

                {isExpanded && editingConfig?.type === config.type && (
                  <div className={styles.agentBody}>
                    <div className={styles.description}>
                      <p>{config.description}</p>
                    </div>

                    {config.capabilities && config.capabilities.length > 0 && (
                      <div className={styles.capabilities}>
                        <h4>能力</h4>
                        <div className={styles.capabilityTags}>
                          {config.capabilities.map((cap) => (
                            <span key={cap} className={styles.capabilityTag}>
                              {cap}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className={styles.form}>
                      <div className={styles.formRow}>
                        <label className={styles.formLabel}>Provider</label>
                        <select
                          className={styles.formSelect}
                          value={formData.provider || ''}
                          onChange={(e) => handleProviderChange(e.target.value)}
                        >
                          {PROVIDERS.map((p) => (
                            <option key={p.value} value={p.value}>
                              {p.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className={styles.formRow}>
                        <label className={styles.formLabel}>Model</label>
                        <select
                          className={styles.formSelect}
                          value={formData.model || ''}
                          onChange={(e) => handleFormChange('model', e.target.value)}
                        >
                          {(DEFAULT_MODELS[formData.provider || ''] || []).map((m) => (
                            <option key={m} value={m}>
                              {m}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className={styles.formRow}>
                        <label className={styles.formLabel}>
                          Temperature: {formData.temperature?.toFixed(1) || '0.7'}
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="2"
                          step="0.1"
                          value={formData.temperature || 0.7}
                          onChange={(e) => handleFormChange('temperature', parseFloat(e.target.value))}
                          className={styles.formRange}
                        />
                      </div>

                      <div className={styles.formRow}>
                        <label className={styles.formLabel}>Max Tokens</label>
                        <input
                          type="number"
                          min="256"
                          max="32000"
                          step="256"
                          value={formData.maxTokens || 2048}
                          onChange={(e) => handleFormChange('maxTokens', parseInt(e.target.value, 10))}
                          className={styles.formInput}
                        />
                      </div>
                    </div>

                    <div className={styles.actions}>
                      <Button
                        variant="secondary"
                        size="small"
                        onClick={handleReset}
                        disabled={saving}
                      >
                        重置默认
                      </Button>
                      <Button
                        variant="primary"
                        size="small"
                        onClick={handleSave}
                        loading={saving}
                        disabled={!isFormChanged()}
                      >
                        保存
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </Panel>
  );
};
