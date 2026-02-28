import React, { useEffect, useCallback } from 'react';
import { useAgentStore } from '../../stores/agentStore';
import { agentService } from '../../services/agentService';
import styles from './AgentLogPanel.module.css';

const AgentLogPanel: React.FC = () => {
  const { logs, loading, error, fetchLogs, clearLogs } = useAgentStore();

  useEffect(() => {
    fetchLogs({ limit: 100 });
  }, [fetchLogs]);

  const handleRefresh = useCallback(() => {
    fetchLogs({ limit: 100 });
  }, [fetchLogs]);

  const handleClear = useCallback(async () => {
    await clearLogs();
  }, [clearLogs]);

  const getStatusClass = (status: string): string => {
    switch (status) {
      case 'success':
        return styles.statusSuccess;
      case 'error':
      case 'timeout':
        return styles.statusError;
      case 'pending':
        return styles.statusPending;
      default:
        return '';
    }
  };

  const getDirectionLabel = (direction: 'in' | 'out'): string => {
    return direction === 'in' ? '接收' : '发送';
  };

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>错误: {error}</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>消息日志</h3>
        <div className={styles.actions}>
          <button
            className={styles.button}
            onClick={handleRefresh}
            disabled={loading}
          >
            刷新
          </button>
          <button
            className={`${styles.button} ${styles.dangerButton}`}
            onClick={handleClear}
            disabled={loading || logs.length === 0}
          >
            清除
          </button>
        </div>
      </div>

      <div className={styles.stats}>
        <span>共 {logs.length} 条日志</span>
      </div>

      <div className={styles.logList}>
        {logs.length === 0 ? (
          <div className={styles.empty}>暂无日志记录</div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className={styles.logItem}>
              <div className={styles.logHeader}>
                <span className={`${styles.status} ${getStatusClass(log.status)}`}>
                  {log.status}
                </span>
                <span className={styles.direction}>
                  {getDirectionLabel(log.direction)}
                </span>
                <span className={styles.agentType}>
                  {agentService.getAgentTypeName(log.agentType)}
                </span>
                <span className={styles.timestamp}>
                  {agentService.formatTimestamp(log.timestamp)}
                </span>
              </div>
              <div className={styles.logBody}>
                <div className={styles.messageInfo}>
                  <strong>动作:</strong> {log.message.payload.action}
                </div>
                <div className={styles.messageInfo}>
                  <strong>来自:</strong> {agentService.getAgentTypeName(log.message.from)}
                </div>
                {log.processingTime && (
                  <div className={styles.messageInfo}>
                    <strong>处理时间:</strong> {log.processingTime}ms
                  </div>
                )}
                {log.error && (
                  <div className={styles.errorInfo}>
                    <strong>错误:</strong> {log.error}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AgentLogPanel;
