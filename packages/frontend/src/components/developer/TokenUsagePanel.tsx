import React, { useMemo } from 'react';
import { useDeveloperStore } from '../../stores';
import { Icon } from '../common';
import styles from './DeveloperPanel.module.css';

export const TokenUsagePanel: React.FC = () => {
  const { llmRequests, clearLLMRequests } = useDeveloperStore();

  // 计算统计数据
  const stats = useMemo(() => {
    const totalPromptTokens = llmRequests.reduce((sum, r) => sum + (r.promptTokens || 0), 0);
    const totalCompletionTokens = llmRequests.reduce((sum, r) => sum + (r.completionTokens || 0), 0);
    const totalTokens = totalPromptTokens + totalCompletionTokens;
    const successCount = llmRequests.filter(r => r.status === 'success').length;
    const errorCount = llmRequests.filter(r => r.status === 'error').length;

    return {
      totalPromptTokens,
      totalCompletionTokens,
      totalTokens,
      successCount,
      errorCount,
      requestCount: llmRequests.length,
    };
  }, [llmRequests]);

  // 按智能体分组统计
  const agentStats = useMemo(() => {
    const agentMap = new Map<string, {
      agentType: string;
      promptTokens: number;
      completionTokens: number;
      requestCount: number;
    }>();

    llmRequests.forEach(request => {
      const existing = agentMap.get(request.agentType) || {
        agentType: request.agentType,
        promptTokens: 0,
        completionTokens: 0,
        requestCount: 0,
      };

      existing.promptTokens += request.promptTokens || 0;
      existing.completionTokens += request.completionTokens || 0;
      existing.requestCount += 1;

      agentMap.set(request.agentType, existing);
    });

    return Array.from(agentMap.values()).sort((a, b) =>
      (b.promptTokens + b.completionTokens) - (a.promptTokens + a.completionTokens)
    );
  }, [llmRequests]);

  // 按提供商分组统计
  const providerStats = useMemo(() => {
    const providerMap = new Map<string, {
      provider: string;
      promptTokens: number;
      completionTokens: number;
      requestCount: number;
    }>();

    llmRequests.forEach(request => {
      const existing = providerMap.get(request.provider) || {
        provider: request.provider,
        promptTokens: 0,
        completionTokens: 0,
        requestCount: 0,
      };

      existing.promptTokens += request.promptTokens || 0;
      existing.completionTokens += request.completionTokens || 0;
      existing.requestCount += 1;

      providerMap.set(request.provider, existing);
    });

    return Array.from(providerMap.values()).sort((a, b) =>
      (b.promptTokens + b.completionTokens) - (a.promptTokens + a.completionTokens)
    );
  }, [llmRequests]);

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('zh-CN');
  };

  const handleClearRequests = async () => {
    try {
      await fetch('http://localhost:6756/api/logs/llm', { method: 'DELETE' });
      clearLLMRequests();
    } catch (error) {
      console.error('Failed to clear LLM requests:', error);
    }
  };

  return (
    <div className={styles.tabContent}>
      {/* 概览卡片 */}
      <div className={styles.tokenOverview}>
        <div className={styles.tokenCard}>
          <div className={styles.tokenLabel}>总 Token</div>
          <div className={styles.tokenValue}>{stats.totalTokens.toLocaleString()}</div>
        </div>
        <div className={styles.tokenCard}>
          <div className={styles.tokenLabel}>输入 Token</div>
          <div className={styles.tokenValue}>{stats.totalPromptTokens.toLocaleString()}</div>
        </div>
        <div className={styles.tokenCard}>
          <div className={styles.tokenLabel}>输出 Token</div>
          <div className={styles.tokenValue}>{stats.totalCompletionTokens.toLocaleString()}</div>
        </div>
        <div className={styles.tokenCard}>
          <div className={styles.tokenLabel}>请求数</div>
          <div className={styles.tokenValue}>{stats.requestCount}</div>
        </div>
      </div>

      {/* 按智能体统计 */}
      <div className={styles.tokenSection}>
        <div className={styles.tokenSectionTitle}>按智能体统计</div>
        {agentStats.length > 0 ? (
          <div className={styles.tokenTable}>
            <div className={styles.tokenTableHeader}>
              <span>智能体</span>
              <span>输入</span>
              <span>输出</span>
              <span>请求</span>
            </div>
            {agentStats.map(stat => (
              <div key={stat.agentType} className={styles.tokenTableRow}>
                <span>{stat.agentType}</span>
                <span>{stat.promptTokens.toLocaleString()}</span>
                <span>{stat.completionTokens.toLocaleString()}</span>
                <span>{stat.requestCount}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.empty}>暂无数据</div>
        )}
      </div>

      {/* 按提供商统计 */}
      <div className={styles.tokenSection}>
        <div className={styles.tokenSectionTitle}>按提供商统计</div>
        {providerStats.length > 0 ? (
          <div className={styles.tokenTable}>
            <div className={styles.tokenTableHeader}>
              <span>提供商</span>
              <span>输入</span>
              <span>输出</span>
              <span>请求</span>
            </div>
            {providerStats.map(stat => (
              <div key={stat.provider} className={styles.tokenTableRow}>
                <span>{stat.provider}</span>
                <span>{stat.promptTokens.toLocaleString()}</span>
                <span>{stat.completionTokens.toLocaleString()}</span>
                <span>{stat.requestCount}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.empty}>暂无数据</div>
        )}
      </div>

      {/* 最近请求记录 */}
      <div className={styles.tokenSection}>
        <div className={styles.tokenSectionTitle}>最近请求记录</div>
        {llmRequests.length > 0 ? (
          <div className={styles.tokenRecordList}>
            {llmRequests.slice(0, 10).map(request => (
              <div key={request.id} className={styles.tokenRecordItem}>
                <div className={styles.tokenRecordHeader}>
                  <span className={styles.tokenRecordAgent}>{request.agentType}</span>
                  <span className={styles.tokenRecordTime}>{formatTime(request.timestamp)}</span>
                </div>
                <div className={styles.tokenRecordDetails}>
                  <span>提供商: {request.provider}</span>
                  <span>模型: {request.model}</span>
                  <span>输入: {request.promptTokens || 0}</span>
                  <span>输出: {request.completionTokens || 0}</span>
                  <span className={`${styles.itemStatus} ${request.status === 'success' ? styles.success : request.status === 'error' ? styles.error : styles.pending}`}>
                    {request.status === 'success' ? '成功' : request.status === 'error' ? '失败' : '进行中'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.empty}>暂无请求记录</div>
        )}
      </div>

      {/* 操作按钮 */}
      <div className={styles.tokenActions}>
        <button className={styles.clearButton} onClick={handleClearRequests}>
          <Icon name="trash" size={14} />
          <span>清空记录</span>
        </button>
      </div>
    </div>
  );
};
