import React, { useState } from 'react';
import { useDeveloperStore } from '../../stores';
import { Icon } from '../common';
import styles from './DeveloperPanel.module.css';

export const RequestMonitor: React.FC = () => {
  const { llmRequests } = useDeveloperStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedRequest = llmRequests.find((r) => r.id === selectedId);

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('zh-CN');
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <div className={styles.tabContent}>
      <div className={styles.listContainer}>
        <div className={styles.listHeader}>
          <span>请求列表</span>
          <span className={styles.count}>{llmRequests.length}</span>
        </div>
        <div className={styles.list}>
          {llmRequests.length === 0 ? (
            <div className={styles.empty}>暂无请求记录</div>
          ) : (
            llmRequests
              .slice()
              .reverse()
              .map((request) => (
                <div
                  key={request.id}
                  className={`${styles.listItem} ${selectedId === request.id ? styles.selected : ''}`}
                  onClick={() => setSelectedId(request.id)}
                >
                  <div className={styles.itemHeader}>
                    <span className={styles.itemTime}>{formatTime(request.timestamp)}</span>
                    <span
                      className={`${styles.itemStatus} ${
                        request.status === 'success'
                          ? styles.success
                          : request.status === 'error'
                          ? styles.error
                          : styles.pending
                      }`}
                    >
                      {request.status === 'success' ? '成功' : request.status === 'error' ? '失败' : '进行中'}
                    </span>
                  </div>
                  <div className={styles.itemBody}>
                    <span className={styles.itemAgent}>{request.agentType}</span>
                    <span className={styles.itemProvider}>{request.provider}</span>
                  </div>
                  <div className={styles.itemFooter}>
                    <span>{formatDuration(request.duration)}</span>
                    <span>{request.promptTokens + request.completionTokens} tokens</span>
                  </div>
                </div>
              ))
          )}
        </div>
      </div>

      {selectedRequest && (
        <div className={styles.detailContainer}>
          <div className={styles.detailHeader}>
            <span>请求详情</span>
            <button className={styles.closeButton} onClick={() => setSelectedId(null)}>
              <Icon name="close" size={14} />
            </button>
          </div>
          <div className={styles.detailContent}>
            <div className={styles.detailSection}>
              <div className={styles.detailLabel}>基本信息</div>
              <div className={styles.detailGrid}>
                <div>智能体: {selectedRequest.agentType}</div>
                <div>提供商: {selectedRequest.provider}</div>
                <div>模型: {selectedRequest.model}</div>
                <div>耗时: {formatDuration(selectedRequest.duration)}</div>
                <div>输入Token: {selectedRequest.promptTokens}</div>
                <div>输出Token: {selectedRequest.completionTokens}</div>
              </div>
            </div>

            {selectedRequest.prompt && (
              <div className={styles.detailSection}>
                <div className={styles.detailLabel}>Prompt</div>
                <pre className={styles.codeBlock}>{selectedRequest.prompt}</pre>
              </div>
            )}

            {selectedRequest.response && (
              <div className={styles.detailSection}>
                <div className={styles.detailLabel}>Response</div>
                <pre className={styles.codeBlock}>{selectedRequest.response}</pre>
              </div>
            )}

            {selectedRequest.error && (
              <div className={styles.detailSection}>
                <div className={styles.detailLabel}>错误信息</div>
                <pre className={`${styles.codeBlock} ${styles.errorText}`}>{selectedRequest.error}</pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
