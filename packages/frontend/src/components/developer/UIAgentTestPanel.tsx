import React, { useState } from 'react';
import { MarkdownRenderer } from '../ui/MarkdownRenderer';
import type { DynamicUIData } from '@ai-rpg/shared';
import styles from './UIAgentTestPanel.module.css';

/**
 * UIAgent 测试面板
 * 用于测试动态 UI 生成功能
 */
export const UIAgentTestPanel: React.FC = () => {
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<DynamicUIData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSource, setShowSource] = useState(false);

  const handleGenerate = async () => {
    if (!description.trim()) return;
    
    setIsLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const response = await fetch('/api/developer/test-ui-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description }),
      });
      
      const data = await response.json() as { success: boolean; dynamicUI?: DynamicUIData; error?: string };
      
      if (data.success && data.dynamicUI) {
        setResult(data.dynamicUI);
      } else {
        setError(data.error || '生成失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '请求失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyMarkdown = () => {
    if (result?.markdown) {
      navigator.clipboard.writeText(result.markdown);
    }
  };

  const handleClear = () => {
    setDescription('');
    setResult(null);
    setError(null);
    setShowSource(false);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>UIAgent 动态 UI 生成测试</h3>
        <p className={styles.description}>
          输入自然语言描述，测试 UIAgent 生成的动态 UI 效果
        </p>
      </div>

      <div className={styles.inputSection}>
        <label className={styles.label}>自然语言描述</label>
        <textarea
          className={styles.textarea}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="描述你想要生成的动态 UI，例如：&#10;- 生成一个欢迎界面，显示角色创建成功&#10;- 创建一个任务完成通知，显示获得的奖励&#10;- 设计一个装备强化界面，显示成功率"
          rows={5}
          disabled={isLoading}
        />
        <div className={styles.buttonGroup}>
          <button
            className={styles.primaryButton}
            onClick={handleGenerate}
            disabled={isLoading || !description.trim()}
          >
            {isLoading ? (
              <>
                <span className={styles.spinner} />
                生成中...
              </>
            ) : (
              '生成动态 UI'
            )}
          </button>
          <button
            className={styles.secondaryButton}
            onClick={handleClear}
            disabled={isLoading}
          >
            清空
          </button>
        </div>
      </div>

      {error && (
        <div className={styles.error}>
          <span className={styles.errorIcon}>!</span>
          <span className={styles.errorText}>{error}</span>
        </div>
      )}

      {result && (
        <div className={styles.resultSection}>
          <div className={styles.resultHeader}>
            <div className={styles.resultInfo}>
              <span className={styles.resultId}>ID: {result.id}</span>
              <span className={styles.resultTime}>
                生成时间: {new Date().toLocaleTimeString()}
              </span>
            </div>
            <div className={styles.resultActions}>
              <button
                className={styles.toggleButton}
                onClick={() => setShowSource(!showSource)}
              >
                {showSource ? '显示预览' : '显示源码'}
              </button>
              <button
                className={styles.copyButton}
                onClick={handleCopyMarkdown}
                title="复制 Markdown 到剪贴板"
              >
                复制 Markdown
              </button>
            </div>
          </div>

          <div className={styles.resultContent}>
            {showSource ? (
              <pre className={styles.sourceCode}>{result.markdown}</pre>
            ) : (
              <div className={styles.preview}>
                <MarkdownRenderer content={result.markdown} />
              </div>
            )}
          </div>
        </div>
      )}

      <div className={styles.helpSection}>
        <h4 className={styles.helpTitle}>支持的动态 UI 组件</h4>
        <div className={styles.helpGrid}>
          <div className={styles.helpItem}>
            <code>:::options</code>
            <span>选项按钮组</span>
          </div>
          <div className={styles.helpItem}>
            <code>:::progress</code>
            <span>进度条</span>
          </div>
          <div className={styles.helpItem}>
            <code>:::tabs</code>
            <span>标签页</span>
          </div>
          <div className={styles.helpItem}>
            <code>:::system-notify</code>
            <span>系统通知</span>
          </div>
          <div className={styles.helpItem}>
            <code>:::badge</code>
            <span>徽章</span>
          </div>
          <div className={styles.helpItem}>
            <code>:::enhancement</code>
            <span>装备强化</span>
          </div>
          <div className={styles.helpItem}>
            <code>:::warehouse</code>
            <span>仓库界面</span>
          </div>
          <div className={styles.helpItem}>
            <code>:::conditional</code>
            <span>条件显示</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UIAgentTestPanel;
