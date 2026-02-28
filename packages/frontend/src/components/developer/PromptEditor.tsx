import React, { useState, useEffect, useCallback } from 'react';
import type { PromptTemplate, PromptContext, AgentType } from '@ai-rpg/shared';
import { AgentType as AgentTypes } from '@ai-rpg/shared';
import { useDeveloperStore } from '../../stores/developerStore';
import styles from './DeveloperPanel.module.css';

const API_BASE = 'http://localhost:6756/api/prompts';

export const PromptEditor: React.FC = () => {
  const { addLog } = useDeveloperStore();
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<AgentType | null>(null);
  const [content, setContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testInput, setTestInput] = useState('');
  const [testOutput, setTestOutput] = useState('');
  const [testing, setTesting] = useState(false);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(API_BASE);
      const data = await response.json();
      if (data.success) {
        setTemplates(data.data);
        addLog('info', `Loaded ${data.data.length} prompt templates`);
      }
    } catch (error) {
      addLog('error', `Failed to fetch templates: ${error}`);
    } finally {
      setLoading(false);
    }
  }, [addLog]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  useEffect(() => {
    if (selectedAgent) {
      const template = templates.find(t => t.agentType === selectedAgent);
      if (template) {
        setContent(template.content);
        setOriginalContent(template.content);
      }
    }
  }, [selectedAgent, templates]);

  const handleSave = async () => {
    if (!selectedAgent) return;
    
    setSaving(true);
    try {
      const response = await fetch(`${API_BASE}/${selectedAgent}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      const data = await response.json();
      
      if (data.success) {
        setOriginalContent(content);
        addLog('info', `Saved prompt for ${selectedAgent}`);
        fetchTemplates();
      } else {
        addLog('error', `Failed to save: ${data.error}`);
      }
    } catch (error) {
      addLog('error', `Failed to save: ${error}`);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!selectedAgent) return;
    
    try {
      const response = await fetch(`${API_BASE}/${selectedAgent}/reset`, {
        method: 'POST',
      });
      const data = await response.json();
      
      if (data.success) {
        setContent(data.data.content);
        setOriginalContent(data.data.content);
        addLog('info', `Reset prompt for ${selectedAgent}`);
        fetchTemplates();
      } else {
        addLog('error', `Failed to reset: ${data.error}`);
      }
    } catch (error) {
      addLog('error', `Failed to reset: ${error}`);
    }
  };

  const handleTest = async () => {
    if (!selectedAgent || !testInput.trim()) return;
    
    setTesting(true);
    setTestOutput('');
    
    try {
      const response = await fetch(`${API_BASE}/${selectedAgent}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testInput,
          context: {
            player: { name: 'Test Player', class: 'Warrior', level: 5 },
            gameState: { currentLocation: 'Test Location' },
          } as PromptContext,
        }),
      });
      const data = await response.json();
      
      if (data.success) {
        setTestOutput(data.data.testOutput);
        addLog('info', `Test completed in ${data.data.metrics.responseTime}ms`);
      } else {
        setTestOutput(`Error: ${data.error}`);
        addLog('error', `Test failed: ${data.error}`);
      }
    } catch (error) {
      setTestOutput(`Error: ${error}`);
      addLog('error', `Test failed: ${error}`);
    } finally {
      setTesting(false);
    }
  };

  const hasChanges = content !== originalContent;

  return (
    <div className={styles.promptEditor}>
      <div className={styles.promptHeader}>
        <h3>提示词编辑器</h3>
        <select
          value={selectedAgent || ''}
          onChange={(e) => setSelectedAgent(e.target.value as AgentType || null)}
          className={styles.agentSelect}
        >
          <option value="">选择智能体...</option>
          {Object.values(AgentTypes).map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className={styles.loading}>加载中...</div>
      ) : selectedAgent ? (
        <>
          <div className={styles.editorToolbar}>
            <button
              onClick={handleSave}
              disabled={!hasChanges || saving}
              className={styles.saveButton}
            >
              {saving ? '保存中...' : '保存'}
            </button>
            <button
              onClick={handleReset}
              className={styles.resetButton}
            >
              重置为默认
            </button>
            {hasChanges && (
              <span className={styles.unsavedIndicator}>有未保存的更改</span>
            )}
          </div>

          <div className={styles.editorContent}>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className={styles.promptTextarea}
              placeholder="提示词内容..."
              spellCheck={false}
            />
          </div>

          <div className={styles.testSection}>
            <h4>测试提示词</h4>
            <div className={styles.testInput}>
              <textarea
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                placeholder="输入测试消息..."
                className={styles.testTextarea}
              />
              <button
                onClick={handleTest}
                disabled={!testInput.trim() || testing}
                className={styles.testButton}
              >
                {testing ? '测试中...' : '执行测试'}
              </button>
            </div>
            {testOutput && (
              <div className={styles.testOutput}>
                <h5>输出结果:</h5>
                <pre>{testOutput}</pre>
              </div>
            )}
          </div>

          <PromptVariables content={content} />
        </>
      ) : (
        <div className={styles.noSelection}>请选择一个智能体来编辑提示词</div>
      )}
    </div>
  );
};

const PromptVariables: React.FC<{ content: string }> = ({ content }) => {
  const variables = React.useMemo(() => {
    const matches = content.matchAll(/\{\{(\w+)\}\}/g);
    const vars: string[] = [];
    for (const match of matches) {
      if (!vars.includes(match[1])) {
        vars.push(match[1]);
      }
    }
    return vars;
  }, [content]);

  if (variables.length === 0) {
    return null;
  }

  return (
    <div className={styles.variablesSection}>
      <h4>检测到的变量</h4>
      <div className={styles.variablesList}>
        {variables.map((v) => (
          <span key={v} className={styles.variableTag}>
            {`{{${v}}}`}
          </span>
        ))}
      </div>
    </div>
  );
};

export default PromptEditor;
