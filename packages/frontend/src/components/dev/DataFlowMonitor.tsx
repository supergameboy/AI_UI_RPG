import React, { useState, useCallback, useMemo } from 'react';
import { Icon } from '../common';
import { useGameStore } from '../../stores';
import styles from './DataFlowMonitor.module.css';
import type { GameStateUpdateLog, GameStateUpdateSource } from '@ai-rpg/shared';

const SOURCE_COLORS: Record<GameStateUpdateSource, string> = {
  agent: '#8b5cf6',
  tool: '#10b981',
  websocket: '#3b82f6',
  user: '#f59e0b',
  system: '#6b7280',
};

export const DataFlowMonitor: React.FC = () => {
  const gameStore = useGameStore();
  const updateLogs = gameStore.getUpdateLogs();

  const [selectedLog, setSelectedLog] = useState<GameStateUpdateLog | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<GameStateUpdateSource | 'all'>('all');
  const [showExportModal, setShowExportModal] = useState(false);

  const filteredLogs = useMemo(() => {
    let result = updateLogs;

    if (sourceFilter !== 'all') {
      result = result.filter(log => log.source === sourceFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(log => {
        const fields = Object.keys(log.updates as Record<string, unknown>).join(' ');
        return fields.toLowerCase().includes(query);
      });
    }

    return result;
  }, [updateLogs, sourceFilter, searchQuery]);

  const stats = useMemo(() => {
    const total = updateLogs.length;
    const bySource: Record<string, number> = {};
    
    updateLogs.forEach(log => {
      bySource[log.source] = (bySource[log.source] || 0) + 1;
    });

    return { total, bySource };
  }, [updateLogs]);

  const handleSelectLog = useCallback((log: GameStateUpdateLog) => {
    setSelectedLog(log);
  }, []);

  const handleClearLogs = useCallback(() => {
    gameStore.clearUpdateLogs();
    setSelectedLog(null);
  }, [gameStore]);

  const handleExport = useCallback(() => {
    setShowExportModal(true);
  }, []);

  const handleExportJson = useCallback(() => {
    const data = JSON.stringify(filteredLogs, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `data-flow-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportModal(false);
  }, [filteredLogs]);

  const handleExportCsv = useCallback(() => {
    const headers = ['ID', '时间戳', '来源', '更新字段'];
    const rows = filteredLogs.map(log => [
      log.id,
      new Date(log.timestamp).toISOString(),
      log.source,
      Object.keys(log.updates as Record<string, unknown>).join('; '),
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `data-flow-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportModal(false);
  }, [filteredLogs]);

  const formatTime = (timestamp: number): string => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const formatFields = (updates: Record<string, unknown>): string => {
    return Object.keys(updates).join(', ');
  };

  return (
    <div className={styles.dataFlowMonitor}>
      <div className={styles.header}>
        <span className={styles.title}>数据流转监控</span>
        <div className={styles.actionButtons}>
          <button className={styles.actionButton} onClick={handleExport}>
            导出日志
          </button>
          <button className={styles.actionButton} onClick={handleClearLogs}>
            清空
          </button>
        </div>
      </div>

      <div className={styles.statsBar}>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>总记录:</span>
          <span className={styles.statValue}>{stats.total}</span>
        </div>
        {Object.entries(stats.bySource).map(([source, count]) => (
          <div key={source} className={styles.statItem}>
            <span className={styles.statLabel}>{source}:</span>
            <span className={styles.statValue}>{count}</span>
          </div>
        ))}
      </div>

      <div className={styles.filterBar}>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="搜索更新字段..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
        <select
          className={styles.filterSelect}
          value={sourceFilter}
          onChange={e => setSourceFilter(e.target.value as typeof sourceFilter)}
        >
          <option value="all">全部来源</option>
          <option value="agent">Agent</option>
          <option value="tool">Tool</option>
          <option value="websocket">WebSocket</option>
          <option value="user">User</option>
          <option value="system">System</option>
        </select>
      </div>

      <div className={styles.mainContent}>
        <div className={styles.logList}>
          <div className={styles.logListHeader}>
            <span>更新记录 ({filteredLogs.length})</span>
          </div>
          <div className={styles.logListContent}>
            {filteredLogs.length > 0 ? (
              filteredLogs.map(log => (
                <div
                  key={log.id}
                  className={`${styles.logItem} ${selectedLog?.id === log.id ? styles.selected : ''}`}
                  onClick={() => handleSelectLog(log)}
                >
                  <div className={styles.logItemHeader}>
                    <span className={styles.logTime}>{formatTime(log.timestamp)}</span>
                    <span
                      className={`${styles.logSource} ${styles[log.source]}`}
                      style={{ backgroundColor: SOURCE_COLORS[log.source] + '20', color: SOURCE_COLORS[log.source] }}
                    >
                      {log.source}
                    </span>
                    <span className={styles.logFields}>
                      {formatFields(log.updates as Record<string, unknown>)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.empty}>暂无数据流转记录</div>
            )}
          </div>
        </div>

        <div className={styles.detailPanel}>
          {selectedLog ? (
            <>
              <div className={styles.detailHeader}>
                <span>记录详情</span>
              </div>
              <div className={styles.detailContent}>
                <div className={styles.detailSection}>
                  <div className={styles.detailLabel}>时间戳</div>
                  <div className={styles.detailValue}>
                    {new Date(selectedLog.timestamp).toLocaleString()}
                  </div>
                </div>

                <div className={styles.detailSection}>
                  <div className={styles.detailLabel}>来源</div>
                  <div className={styles.detailValue}>
                    <span
                      className={`${styles.logSource} ${styles[selectedLog.source]}`}
                      style={{ backgroundColor: SOURCE_COLORS[selectedLog.source] + '20', color: SOURCE_COLORS[selectedLog.source] }}
                    >
                      {selectedLog.source}
                    </span>
                    {selectedLog.sourceId && (
                      <span style={{ marginLeft: 'var(--spacing-sm)', color: 'var(--color-text-secondary)' }}>
                        ID: {selectedLog.sourceId}
                      </span>
                    )}
                  </div>
                </div>

                <div className={styles.detailSection}>
                  <div className={styles.detailLabel}>更新字段</div>
                  <div className={styles.fieldList}>
                    {Object.keys(selectedLog.updates as Record<string, unknown>).map(field => (
                      <span key={field} className={styles.fieldTag}>
                        {field}
                      </span>
                    ))}
                  </div>
                </div>

                <div className={styles.detailSection}>
                  <div className={styles.detailLabel}>更新内容</div>
                  <pre className={styles.detailJson}>
                    {JSON.stringify(selectedLog.updates, null, 2)}
                  </pre>
                </div>

                {selectedLog.reason && (
                  <div className={styles.detailSection}>
                    <div className={styles.detailLabel}>原因</div>
                    <div className={styles.detailValue}>{selectedLog.reason}</div>
                  </div>
                )}
              </div>
              <div className={styles.actionButtons}>
                <button
                  className={styles.actionButton}
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(selectedLog.updates, null, 2));
                  }}
                >
                  复制内容
                </button>
              </div>
            </>
          ) : (
            <div className={styles.empty}>选择一条记录查看详情</div>
          )}
        </div>
      </div>

      {showExportModal && (
        <div className={styles.exportModal} onClick={() => setShowExportModal(false)}>
          <div className={styles.exportDialogContent} onClick={e => e.stopPropagation()}>
            <div className={styles.exportDialogHeader}>
              <span className={styles.exportDialogTitle}>导出日志</span>
              <div
                className={styles.exportDialogClose}
                onClick={() => setShowExportModal(false)}
              >
                <Icon name="close" size={16} />
              </div>
            </div>
            <div className={styles.exportDialogBody}>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-md)' }}>
                选择导出格式：
              </p>
              <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                <button className={`${styles.actionButton} ${styles.primary}`} onClick={handleExportJson}>
                  导出 JSON
                </button>
                <button className={styles.actionButton} onClick={handleExportCsv}>
                  导出 CSV
                </button>
              </div>
              <div style={{ marginTop: 'var(--spacing-md)' }}>
                <div className={styles.detailLabel}>预览 ({filteredLogs.length} 条记录)</div>
                <textarea
                  className={styles.exportTextarea}
                  value={JSON.stringify(filteredLogs.slice(0, 5), null, 2)}
                  readOnly
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
