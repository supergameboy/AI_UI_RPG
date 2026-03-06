import React, { useState } from 'react';
import { Button, Icon, Input } from '../common';
import { useSettingsStore, type ProviderConfig, type AgentLLMConfig } from '../../stores';
import { AgentType, AGENT_DESCRIPTIONS } from '@ai-rpg/shared';
import styles from './LLMConfigModal.module.css';

interface LLMConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export type { LLMConfigModalProps };

interface ProviderInfo {
  id: string;
  name: string;
  description: string;
  defaultBaseURL: string;
  models: string[];
}

const PROVIDERS: ProviderInfo[] = [
  {
    id: 'deepseek',
    name: 'DeepSeek',
    description: '高性价比，中文能力强',
    defaultBaseURL: 'https://api.deepseek.com',
    models: ['deepseek-chat', 'deepseek-reasoner'],
  },
  {
    id: 'glm',
    name: 'GLM (智谱)',
    description: '多模态，长上下文',
    defaultBaseURL: 'https://open.bigmodel.cn/api/paas/v4',
    models: ['glm-4', 'glm-4-flash', 'glm-4-plus'],
  },
  {
    id: 'kimi',
    name: 'Kimi (月之暗面)',
    description: '超长上下文',
    defaultBaseURL: 'https://api.moonshot.cn/v1',
    models: ['moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k'],
  },
];

interface AgentInfo {
  id: AgentType;
  name: string;
  description: string;
}

const AGENTS: AgentInfo[] = [
  { id: AgentType.COORDINATOR, name: '统筹管理', description: AGENT_DESCRIPTIONS[AgentType.COORDINATOR] },
  { id: AgentType.STORY_CONTEXT, name: '故事上下文', description: AGENT_DESCRIPTIONS[AgentType.STORY_CONTEXT] },
  { id: AgentType.QUEST, name: '任务管理', description: AGENT_DESCRIPTIONS[AgentType.QUEST] },
  { id: AgentType.MAP, name: '地图管理', description: AGENT_DESCRIPTIONS[AgentType.MAP] },
  { id: AgentType.NPC_PARTY, name: 'NPC/队伍', description: AGENT_DESCRIPTIONS[AgentType.NPC_PARTY] },
  { id: AgentType.NUMERICAL, name: '数值管理', description: AGENT_DESCRIPTIONS[AgentType.NUMERICAL] },
  { id: AgentType.INVENTORY, name: '背包系统', description: AGENT_DESCRIPTIONS[AgentType.INVENTORY] },
  { id: AgentType.SKILL, name: '技能管理', description: AGENT_DESCRIPTIONS[AgentType.SKILL] },
  { id: AgentType.UI, name: 'UI管理', description: AGENT_DESCRIPTIONS[AgentType.UI] },
  { id: AgentType.COMBAT, name: '战斗管理', description: AGENT_DESCRIPTIONS[AgentType.COMBAT] },
  { id: AgentType.DIALOGUE, name: '对话管理', description: AGENT_DESCRIPTIONS[AgentType.DIALOGUE] },
  { id: AgentType.EVENT, name: '事件管理', description: AGENT_DESCRIPTIONS[AgentType.EVENT] },
];

type ConfigTab = 'provider' | 'agent';

export const LLMConfigModal: React.FC<LLMConfigModalProps> = ({ isOpen, onClose }) => {
  const { settings, updateProvider, setDefaultProvider, updateAgentConfig, clearAgentConfig } = useSettingsStore();
  const [activeTab, setActiveTab] = useState<ConfigTab>('provider');
  const [selectedProvider, setSelectedProvider] = useState<string>(
    settings.ai.defaultProvider || 'deepseek'
  );
  const [selectedAgent, setSelectedAgent] = useState<AgentType>(AgentType.COORDINATOR);
  const [apiKey, setApiKey] = useState('');
  const [baseURL, setBaseURL] = useState('');
  const [model, setModel] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  // Agent 配置状态
  const [agentModel, setAgentModel] = useState<string>('');
  const [agentTemperature, setAgentTemperature] = useState<string>('0.7');
  const [agentMaxTokens, setAgentMaxTokens] = useState<string>('2048');
  const [agentTopP, setAgentTopP] = useState<string>('1');
  const [agentFallbackEnabled, setAgentFallbackEnabled] = useState(false);
  const [agentFallbackModel, setAgentFallbackModel] = useState<string>('');
  const [agentFallbackStrategy, setAgentFallbackStrategy] = useState<'auto' | 'specified'>('auto');

  const currentProvider = PROVIDERS.find((p) => p.id === selectedProvider);
  const existingConfig = settings.ai.providers[selectedProvider];
  const currentAgentConfig = settings.ai.agentConfigs?.[selectedAgent];

  // 获取当前 Provider 的所有可用模型
  const availableModels = React.useMemo(() => {
    const models: string[] = [];
    PROVIDERS.forEach((p) => {
      if (settings.ai.providers[p.id]?.apiKey) {
        models.push(...p.models.map((m) => `${p.id}:${m}`));
      }
    });
    return models;
  }, [settings.ai.providers]);

  // Provider 切换时重置表单
  React.useEffect(() => {
    if (existingConfig) {
      setApiKey(existingConfig.apiKey || '');
      setBaseURL(existingConfig.baseURL || currentProvider?.defaultBaseURL || '');
      setModel(existingConfig.defaultModel || currentProvider?.models[0] || '');
    } else {
      setApiKey('');
      setBaseURL(currentProvider?.defaultBaseURL || '');
      setModel(currentProvider?.models[0] || '');
    }
    setTestResult(null);
  }, [selectedProvider, existingConfig, currentProvider]);

  // Agent 切换时加载配置
  React.useEffect(() => {
    if (currentAgentConfig) {
      setAgentModel(currentAgentConfig.model || '');
      setAgentTemperature(String(currentAgentConfig.temperature ?? 0.7));
      setAgentMaxTokens(String(currentAgentConfig.maxTokens ?? 2048));
      setAgentTopP(String(currentAgentConfig.topP ?? 1));
      setAgentFallbackEnabled(currentAgentConfig.fallbackEnabled ?? false);
      setAgentFallbackModel(currentAgentConfig.fallbackModel || '');
      setAgentFallbackStrategy(currentAgentConfig.fallbackStrategy || 'auto');
    } else {
      setAgentModel('');
      setAgentTemperature('0.7');
      setAgentMaxTokens('2048');
      setAgentTopP('1');
      setAgentFallbackEnabled(false);
      setAgentFallbackModel('');
      setAgentFallbackStrategy('auto');
    }
  }, [selectedAgent, currentAgentConfig]);

  const handleTestConnection = async () => {
    if (!apiKey.trim()) {
      setTestResult({ success: false, message: '请输入API密钥' });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const response = await fetch('/api/llm/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: selectedProvider,
          apiKey,
          baseURL: baseURL || currentProvider?.defaultBaseURL,
        }),
      });

      const result = await response.json() as { success: boolean; message?: string };
      
      if (response.ok && result.success) {
        setTestResult({ success: true, message: '连接成功！' });
      } else {
        setTestResult({ success: false, message: result.message || '连接失败' });
      }
    } catch (error) {
      setTestResult({ success: false, message: '连接测试失败，请检查网络' });
    } finally {
      setTesting(false);
    }
  };

  const handleSaveProvider = async () => {
    if (!apiKey.trim()) {
      setTestResult({ success: false, message: '请输入API密钥' });
      return;
    }

    setSaving(true);

    try {
      const config: ProviderConfig = {
        apiKey: apiKey.trim(),
        baseURL: baseURL.trim() || currentProvider?.defaultBaseURL,
        defaultModel: model || currentProvider?.models[0],
      };

      // 更新本地状态
      updateProvider(selectedProvider, config);
      setDefaultProvider(selectedProvider);

      // 同步到后端
      const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:6756';
      await fetch(`${API_BASE}/api/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ai: {
            defaultProvider: selectedProvider,
            providers: {
              [selectedProvider]: config,
            },
          },
        }),
      });

      setTestResult({ success: true, message: '保存成功！' });
      
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (error) {
      setTestResult({ success: false, message: '保存失败' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAgentConfig = async () => {
    setSaving(true);

    try {
      const config: AgentLLMConfig = {};

      // 只保存有值的配置
      if (agentModel && agentModel !== 'default') {
        config.model = agentModel;
      }
      
      const temp = parseFloat(agentTemperature);
      if (!isNaN(temp) && temp >= 0 && temp <= 2 && temp !== 0.7) {
        config.temperature = temp;
      }

      const tokens = parseInt(agentMaxTokens, 10);
      if (!isNaN(tokens) && tokens > 0 && tokens !== 2048) {
        config.maxTokens = tokens;
      }

      const topP = parseFloat(agentTopP);
      if (!isNaN(topP) && topP >= 0 && topP <= 1 && topP !== 1) {
        config.topP = topP;
      }

      if (agentFallbackEnabled) {
        config.fallbackEnabled = true;
        config.fallbackStrategy = agentFallbackStrategy;
        if (agentFallbackStrategy === 'specified' && agentFallbackModel) {
          config.fallbackModel = agentFallbackModel;
        }
      }

      // 如果配置为空，则清除该 Agent 的配置
      if (Object.keys(config).length === 0) {
        clearAgentConfig(selectedAgent);
      } else {
        updateAgentConfig(selectedAgent, config);
      }

      // 同步到后端
      const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:6756';
      await fetch(`${API_BASE}/api/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ai: {
            agentConfigs: {
              [selectedAgent]: Object.keys(config).length > 0 ? config : undefined,
            },
          },
        }),
      });

      setTestResult({ success: true, message: 'Agent 配置已保存！' });
      
      setTimeout(() => {
        setTestResult(null);
      }, 1500);
    } catch (error) {
      setTestResult({ success: false, message: '保存失败' });
    } finally {
      setSaving(false);
    }
  };

  const handleResetAgentConfig = () => {
    clearAgentConfig(selectedAgent);
    setAgentModel('');
    setAgentTemperature('0.7');
    setAgentMaxTokens('2048');
    setAgentTopP('1');
    setAgentFallbackEnabled(false);
    setAgentFallbackModel('');
    setAgentFallbackStrategy('auto');
    setTestResult({ success: true, message: '已重置为全局默认配置' });
    setTimeout(() => setTestResult(null), 1500);
  };

  if (!isOpen) return null;

  return (
    <div className={styles.container}>
      <div className={styles.background} onClick={onClose} />
      <div className={styles.content}>
        <div className={styles.header}>
          <h2>LLM 配置</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <Icon name="close" size={24} />
          </button>
        </div>

        <div className={styles.tabBar}>
          <button
            className={[styles.tab, activeTab === 'provider' && styles.activeTab].filter(Boolean).join(' ')}
            onClick={() => setActiveTab('provider')}
          >
            <Icon name="settings" size={16} />
            <span>Provider 配置</span>
          </button>
          <button
            className={[styles.tab, activeTab === 'agent' && styles.activeTab].filter(Boolean).join(' ')}
            onClick={() => setActiveTab('agent')}
          >
            <Icon name="character" size={16} />
            <span>Per-Agent 配置</span>
          </button>
        </div>

        <div className={styles.body}>
          {activeTab === 'provider' ? (
            <>
              <div className={styles.providerList}>
                {PROVIDERS.map((provider) => (
                  <button
                    key={provider.id}
                    className={[
                      styles.providerCard,
                      selectedProvider === provider.id && styles.active,
                      settings.ai.providers[provider.id]?.apiKey && styles.configured,
                    ].filter(Boolean).join(' ')}
                    onClick={() => setSelectedProvider(provider.id)}
                  >
                    <div className={styles.providerName}>{provider.name}</div>
                    <div className={styles.providerDesc}>{provider.description}</div>
                    {settings.ai.providers[provider.id]?.apiKey && (
                      <span className={styles.configuredBadge}>已配置</span>
                    )}
                  </button>
                ))}
              </div>

              <div className={styles.configForm}>
                <div className={styles.apiKeyField}>
                  <Input
                    label="API 密钥"
                    type={showApiKey ? 'text' : 'password'}
                    placeholder="输入您的 API 密钥"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    fullWidth
                  />
                  <button
                    className={styles.toggleVisibility}
                    onClick={() => setShowApiKey(!showApiKey)}
                    type="button"
                    title={showApiKey ? '隐藏密钥' : '显示密钥'}
                  >
                    <Icon name={showApiKey ? 'moon' : 'sun'} size={16} />
                  </button>
                </div>
                
                {existingConfig?.apiKey && !apiKey && (
                  <div className={styles.existingKeyHint}>
                    <Icon name="success" size={14} />
                    <span>已保存密钥，输入新密钥将覆盖</span>
                  </div>
                )}

                <Input
                  label="API 地址 (可选)"
                  type="text"
                  placeholder={currentProvider?.defaultBaseURL}
                  value={baseURL}
                  onChange={(e) => setBaseURL(e.target.value)}
                  fullWidth
                />

                <div className={styles.formField}>
                  <label className={styles.label}>默认模型</label>
                  <select
                    className={styles.select}
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                  >
                    {currentProvider?.models.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                {testResult && (
                  <div className={[
                    styles.testResult,
                    testResult.success ? styles.success : styles.error,
                  ].filter(Boolean).join(' ')}>
                    <Icon name={testResult.success ? 'success' : 'error'} size={16} />
                    <span>{testResult.message}</span>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <div className={styles.agentList}>
                {AGENTS.map((agent) => (
                  <button
                    key={agent.id}
                    className={[
                      styles.agentCard,
                      selectedAgent === agent.id && styles.active,
                      settings.ai.agentConfigs?.[agent.id] && styles.configured,
                    ].filter(Boolean).join(' ')}
                    onClick={() => setSelectedAgent(agent.id)}
                    title={agent.description}
                  >
                    <div className={styles.agentName}>{agent.name}</div>
                    {settings.ai.agentConfigs?.[agent.id] && (
                      <span className={styles.configuredBadge}>自定义</span>
                    )}
                  </button>
                ))}
              </div>

              <div className={styles.configForm}>
                <div className={styles.agentHeader}>
                  <h3>{AGENTS.find((a) => a.id === selectedAgent)?.name}</h3>
                  <p>{AGENTS.find((a) => a.id === selectedAgent)?.description}</p>
                </div>

                <div className={styles.formField}>
                  <label className={styles.label}>模型选择</label>
                  <select
                    className={styles.select}
                    value={agentModel}
                    onChange={(e) => setAgentModel(e.target.value)}
                  >
                    <option value="default">使用全局默认</option>
                    {availableModels.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.paramsGrid}>
                  <Input
                    label="Temperature"
                    type="number"
                    step="0.1"
                    min="0"
                    max="2"
                    value={agentTemperature}
                    onChange={(e) => setAgentTemperature(e.target.value)}
                    fullWidth
                  />
                  <Input
                    label="Max Tokens"
                    type="number"
                    min="1"
                    value={agentMaxTokens}
                    onChange={(e) => setAgentMaxTokens(e.target.value)}
                    fullWidth
                  />
                  <Input
                    label="Top P"
                    type="number"
                    step="0.1"
                    min="0"
                    max="1"
                    value={agentTopP}
                    onChange={(e) => setAgentTopP(e.target.value)}
                    fullWidth
                  />
                </div>

                <div className={styles.fallbackSection}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={agentFallbackEnabled}
                      onChange={(e) => setAgentFallbackEnabled(e.target.checked)}
                    />
                    <span>启用故障转移</span>
                  </label>

                  {agentFallbackEnabled && (
                    <div className={styles.fallbackConfig}>
                      <div className={styles.formField}>
                        <label className={styles.label}>故障转移策略</label>
                        <select
                          className={styles.select}
                          value={agentFallbackStrategy}
                          onChange={(e) => setAgentFallbackStrategy(e.target.value as 'auto' | 'specified')}
                        >
                          <option value="auto">自动选择备用模型</option>
                          <option value="specified">使用指定备用模型</option>
                        </select>
                      </div>

                      {agentFallbackStrategy === 'specified' && (
                        <div className={styles.formField}>
                          <label className={styles.label}>备用模型</label>
                          <select
                            className={styles.select}
                            value={agentFallbackModel}
                            onChange={(e) => setAgentFallbackModel(e.target.value)}
                          >
                            <option value="">选择备用模型</option>
                            {availableModels.filter((m) => m !== agentModel).map((m) => (
                              <option key={m} value={m}>{m}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {testResult && (
                  <div className={[
                    styles.testResult,
                    testResult.success ? styles.success : styles.error,
                  ].filter(Boolean).join(' ')}>
                    <Icon name={testResult.success ? 'success' : 'error'} size={16} />
                    <span>{testResult.message}</span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className={styles.footer}>
          <Button variant="ghost" onClick={onClose}>
            取消
          </Button>
          {activeTab === 'provider' ? (
            <>
              <Button variant="secondary" onClick={handleTestConnection} loading={testing}>
                测试连接
              </Button>
              <Button variant="primary" onClick={handleSaveProvider} loading={saving}>
                保存
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={handleResetAgentConfig}>
                重置为默认
              </Button>
              <Button variant="primary" onClick={handleSaveAgentConfig} loading={saving}>
                保存配置
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
