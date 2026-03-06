import React, { useState } from 'react';
import { Icon } from '../common';
import type { DecisionLog } from '@ai-rpg/shared';
import styles from './DecisionLogViewer.module.css';

interface DecisionLogDetailProps {
  log: DecisionLog | null;
  loading: boolean;
  onBack: () => void;
}

export const DecisionLogDetail: React.FC<DecisionLogDetailProps> = ({
  log,
  loading,
  onBack,
}) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    agents: true,
    conflicts: true,
    result: true,
    contextChanges: true,
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN');
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatTokens = (tokens: number) => {
    if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}k`;
    return String(tokens);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <Icon name="loading" size={20} />
          加载中...
        </div>
      </div>
    );
  }

  if (!log) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>未选择决策日志</div>
      </div>
    );
  }

  return (
    <div className={styles.detailContainer}>
      <div className={styles.detailHeader}>
        <button className={styles.detailBackButton} onClick={onBack}>
          <Icon name="arrow-left" size={14} />
          返回列表
        </button>
        <span className={styles.headerTitle}>
          决策日志详情
        </span>
      </div>

      <div className={styles.detailContent}>
        {/* 基本信息 */}
        <div className={styles.detailSection}>
          <div className={styles.detailSectionTitle}>基本信息</div>
          <div className={styles.detailGrid}>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Request ID</span>
              <span className={styles.detailValue}>{log.requestId}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>时间戳</span>
              <span className={styles.detailValue}>{formatTime(log.timestamp)}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>玩家 ID</span>
              <span className={styles.detailValue}>{log.playerId}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>存档 ID</span>
              <span className={styles.detailValue}>{log.saveId}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>输入类型</span>
              <span className={styles.detailValue}>{log.inputType}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>状态</span>
              <span className={`${styles.detailValue} ${log.result.success ? styles.success : styles.error}`}>
                {log.result.success ? '成功' : '失败'}
              </span>
            </div>
          </div>
        </div>

        {/* 玩家输入 */}
        <div className={styles.detailSection}>
          <div className={styles.detailSectionTitle}>玩家输入</div>
          <div className={styles.codeBlock}>{log.playerInput}</div>
        </div>

        {/* 元数据 */}
        <div className={styles.detailSection}>
          <div className={styles.detailSectionTitle}>元数据</div>
          <div className={styles.detailGrid}>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>总耗时</span>
              <span className={styles.detailValue}>{formatDuration(log.metadata.totalDuration)}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>总 Token</span>
              <span className={styles.detailValue}>{formatTokens(log.metadata.totalTokens)}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Agent 数量</span>
              <span className={styles.detailValue}>{log.metadata.agentCount}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>工具调用数</span>
              <span className={styles.detailValue}>{log.metadata.toolCallCount}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>冲突数量</span>
              <span className={styles.detailValue}>{log.metadata.conflictCount}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>版本</span>
              <span className={styles.detailValue}>{log.metadata.version}</span>
            </div>
          </div>
        </div>

        {/* Agent 决策 */}
        <div className={styles.detailSection}>
          <div className={styles.detailSectionTitle}>
            <span>Agent 决策 ({log.agents.length})</span>
            <button
              className={styles.expandButton}
              onClick={() => toggleSection('agents')}
            >
              {expandedSections.agents ? '收起' : '展开'}
            </button>
          </div>
          {expandedSections.agents && (
            <div>
              {log.agents.map((agent, idx) => (
                <div key={idx} className={styles.agentSection}>
                  <div className={styles.agentHeader}>
                    <span className={styles.agentName}>{agent.agentId}</span>
                    <span className={styles.agentDuration}>
                      {formatDuration(agent.duration)}
                    </span>
                  </div>

                  {/* 决策列表 */}
                  {agent.decisions.map((decision, didx) => (
                    <div key={didx} className={styles.decisionItem}>
                      <div className={styles.decisionAction}>
                        <strong>动作:</strong> {decision.action}
                      </div>
                      {decision.reasoning && (
                        <div className={styles.decisionReasoning}>
                          <strong>推理:</strong> {decision.reasoning}
                        </div>
                      )}

                      {/* LLM 调用 */}
                      {decision.llmCall && (
                        <div className={styles.llmCallSection}>
                          <div className={styles.llmCallHeader}>
                            <span>LLM 调用</span>
                            <div className={styles.llmCallMeta}>
                              <span>{decision.llmCall.model}</span>
                              <span>{formatTokens(decision.llmCall.tokens.total)} tokens</span>
                              <span>{formatDuration(decision.llmCall.duration)}</span>
                            </div>
                          </div>
                          <div className={styles.detailLabel}>输入:</div>
                          <div className={styles.codeBlock} style={{ maxHeight: '150px' }}>
                            {decision.llmCall.input.map((msg, midx) => (
                              <div key={midx}>
                                <strong>{msg.role}:</strong> {msg.content}
                              </div>
                            ))}
                          </div>
                          <div className={styles.detailLabel}>输出:</div>
                          <div className={styles.codeBlock} style={{ maxHeight: '150px' }}>
                            {decision.llmCall.output}
                          </div>
                        </div>
                      )}

                      {/* 工具调用 */}
                      {decision.toolCalls.map((toolCall, tidx) => (
                        <div key={tidx} className={styles.toolCallItem}>
                          <div className={styles.toolCallHeader}>
                            <span className={styles.toolCallName}>
                              {toolCall.tool}.{toolCall.method}
                            </span>
                            <span className={styles.toolCallDuration}>
                              {formatDuration(toolCall.duration)}
                            </span>
                            {toolCall.isWrite && (
                              <span className={styles.toolCallWrite}>写操作</span>
                            )}
                          </div>
                          <div className={styles.detailLabel}>参数:</div>
                          <div className={styles.codeBlock} style={{ maxHeight: '100px' }}>
                            {JSON.stringify(toolCall.params, null, 2)}
                          </div>
                          <div className={styles.detailLabel}>结果:</div>
                          <div className={styles.codeBlock} style={{ maxHeight: '100px' }}>
                            {JSON.stringify(toolCall.result, null, 2)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}

                  {/* 上下文变更 */}
                  {agent.contextChanges.length > 0 && (
                    <div style={{ marginTop: 'var(--spacing-sm)' }}>
                      <div className={styles.detailLabel}>上下文变更:</div>
                      {agent.contextChanges.map((change, cidx) => (
                        <div key={cidx} className={styles.contextChangeItem}>
                          <strong>{change.path}:</strong>{' '}
                          {JSON.stringify(change.value)}
                          {change.previousValue !== undefined && (
                            <span style={{ color: 'var(--color-text-tertiary)' }}>
                              {' '}(原值: {JSON.stringify(change.previousValue)})
                            </span>
                          )}
                          <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>
                            原因: {change.reason}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 冲突 */}
        {log.conflicts.length > 0 && (
          <div className={styles.detailSection}>
            <div className={styles.detailSectionTitle}>
              <span>冲突 ({log.conflicts.length})</span>
              <button
                className={styles.expandButton}
                onClick={() => toggleSection('conflicts')}
              >
                {expandedSections.conflicts ? '收起' : '展开'}
              </button>
            </div>
            {expandedSections.conflicts && (
              <div>
                {log.conflicts.map((conflict, idx) => (
                  <div key={idx} className={styles.conflictItem}>
                    <div className={styles.conflictPath}>
                      <strong>路径:</strong> {conflict.path}
                    </div>
                    <div className={styles.conflictAgents}>
                      <strong>涉及 Agent:</strong> {conflict.agents.join(', ')}
                    </div>
                    <div className={styles.detailLabel}>
                      <strong>值:</strong>
                    </div>
                    <div className={styles.codeBlock}>
                      {conflict.values.map((value, vidx) => (
                        <div key={vidx}>
                          {conflict.agents[vidx]}: {JSON.stringify(value)}
                        </div>
                      ))}
                    </div>
                    <div className={styles.conflictResolution}>
                      <strong>解决方式:</strong> {conflict.resolution} |{' '}
                      <strong>最终值:</strong> {JSON.stringify(conflict.resolvedValue)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 结果 */}
        <div className={styles.detailSection}>
          <div className={styles.detailSectionTitle}>
            <span>结果</span>
            <button
              className={styles.expandButton}
              onClick={() => toggleSection('result')}
            >
              {expandedSections.result ? '收起' : '展开'}
            </button>
          </div>
          {expandedSections.result && (
            <div>
              <div className={styles.detailLabel}>响应:</div>
              <div className={styles.codeBlock}>{log.result.response}</div>

              {Object.keys(log.result.stateChanges).length > 0 && (
                <>
                  <div className={styles.detailLabel}>状态变更:</div>
                  <div className={styles.codeBlock}>
                    {JSON.stringify(log.result.stateChanges, null, 2)}
                  </div>
                </>
              )}

              {log.result.uiInstructions && log.result.uiInstructions.length > 0 && (
                <>
                  <div className={styles.detailLabel}>UI 指令:</div>
                  <div className={styles.codeBlock}>
                    {JSON.stringify(log.result.uiInstructions, null, 2)}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DecisionLogDetail;
