import React, { useState } from 'react';
import { Button, Icon, Input } from '../common';
import { useSettingsStore, type ProviderConfig } from '../../stores';
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

export const LLMConfigModal: React.FC<LLMConfigModalProps> = ({ isOpen, onClose }) => {
  const { settings, updateProvider, setDefaultProvider } = useSettingsStore();
  const [selectedProvider, setSelectedProvider] = useState<string>(
    settings.ai.defaultProvider || 'deepseek'
  );
  const [apiKey, setApiKey] = useState('');
  const [baseURL, setBaseURL] = useState('');
  const [model, setModel] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  const currentProvider = PROVIDERS.find((p) => p.id === selectedProvider);
  const existingConfig = settings.ai.providers[selectedProvider];

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

  const handleSave = async () => {
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

        <div className={styles.body}>
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
        </div>

        <div className={styles.footer}>
          <Button variant="ghost" onClick={onClose}>
            取消
          </Button>
          <Button variant="secondary" onClick={handleTestConnection} loading={testing}>
            测试连接
          </Button>
          <Button variant="primary" onClick={handleSave} loading={saving}>
            保存
          </Button>
        </div>
      </div>
    </div>
  );
};
