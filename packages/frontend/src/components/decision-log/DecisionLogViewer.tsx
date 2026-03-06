import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDecisionLogStore } from '../../stores/decisionLogStore';
import { Icon } from '../common';
import type { DecisionLog, AgentType } from '@ai-rpg/shared';
import type { DecisionLogFilter, ViewState } from './types';
import { DecisionLogDetail } from './DecisionLogDetail';
import styles from './DecisionLogViewer.module.css';

const AGENT_OPTIONS: { value: AgentType | ''; label: string }[] = [
  { value: '', label: '所有 Agent' },
  { value: 'coordinator' as AgentType, label: 'Coordinator' },
  { value: 'story_context' as AgentType, label: 'Story Context' },
  { value: 'quest' as AgentType, label: 'Quest' },
  { value: 'map' as AgentType, label: 'Map' },
  { value: 'npc_party' as AgentType, label: 'NPC/Party' },
  { value: 'numerical' as AgentType, label: 'Numerical' },
  { value: 'inventory' as AgentType, label: 'Inventory' },
  { value: 'skill' as AgentType, label: 'Skill' },
  { value: 'ui' as AgentType, label: 'UI' },
  { value: 'combat' as AgentType, label: 'Combat' },
  { value: 'dialogue' as AgentType, label: 'Dialogue' },
  { value: 'event' as AgentType, label: 'Event' },
];

const STATUS_OPTIONS = [
  { value: '', label: '所有状态' },
  { value: 'true', label: '成功' },
  { value: 'false', label: '失败' },
];

const CONFLICT_OPTIONS = [
  { value: '', label: '全部' },
  { value: 'true', label: '有冲突' },
  { value: 'false', label: '无冲突' },
];

const PAGE_SIZE = 20;

export const DecisionLogViewer: React.FC = () => {
  const {
    logs,
    currentLog,
    loading,
    error,
    total,
    hasMore,
    stats,
    fetchLogs,
    fetchLogById,
    clearCurrentLog,
    fetchStats,
  } = useDecisionLogStore();

  // 使用 ref 存储 store 方法避免依赖变化
  const storeRef = useRef({ fetchLogs, fetchStats });
  storeRef.current = { fetchLogs, fetchStats };

  const [viewState, setViewState] = useState<ViewState>({
    mode: 'list',
    selectedLogId: null,
  });

  const [filter, setFilter] = useState<DecisionLogFilter>({});
  const [searchRequestId, setSearchRequestId] = useState('');
  const [page, setPage] = useState(0);

  // 初始化加载 - 只运行一次
  useEffect(() => {
    storeRef.current.fetchLogs({ limit: PAGE_SIZE, offset: 0 });
    storeRef.current.fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 过滤条件变化时重新加载
  useEffect(() => {
    setPage(0);
    loadLogs(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const loadLogs = useCallback((offset: number) => {
    const options: Record<string, unknown> = {
      limit: PAGE_SIZE,
      offset,
    };

    if (filter.requestId) options.requestId = filter.requestId;
    if (filter.agentId) options.agentId = filter.agentId;
    if (filter.startTime) options.startTime = filter.startTime;
    if (filter.endTime) options.endTime = filter.endTime;
    if (filter.hasConflicts !== undefined) options.hasConflicts = filter.hasConflicts;
    if (filter.success !== undefined && filter.success !== '') options.success = filter.success;

    storeRef.current.fetchLogs(options as Parameters<typeof fetchLogs>[0]);
  }, [filter]);

  const handleSearch = useCallback(() => {
    if (searchRequestId.trim()) {
      setFilter(prev => ({ ...prev, requestId: searchRequestId.trim() }));
    } else {
      setFilter(prev => {
        const { requestId, ...rest } = prev;
        return rest;
      });
    }
  }, [searchRequestId]);

  const handleRefresh = useCallback(() => {
    loadLogs(page * PAGE_SIZE);
    fetchStats();
  }, [loadLogs, page, fetchStats]);

  const handleLogClick = useCallback(async (log: DecisionLog) => {
    setViewState({ mode: 'detail', selectedLogId: log.id });
    await fetchLogById(log.id);
  }, [fetchLogById]);

  const handleBackToList = useCallback(() => {
    setViewState({ mode: 'list', selectedLogId: null });
    clearCurrentLog();
  }, [clearCurrentLog]);

  const handlePrevPage = useCallback(() => {
    if (page > 0) {
      const newPage = page - 1;
      setPage(newPage);
      loadLogs(newPage * PAGE_SIZE);
    }
  }, [page, loadLogs]);

  const handleNextPage = useCallback(() => {
    if (hasMore) {
      const newPage = page + 1;
      setPage(newPage);
      loadLogs(newPage * PAGE_SIZE);
    }
  }, [page, hasMore, loadLogs]);

  const handleExport = useCallback(async (format: 'json' | 'text') => {
    const content = format === 'json'
      ? JSON.stringify(logs, null, 2)
      : logs.map(log => {
          const timestamp = new Date(log.timestamp).toISOString();
          const agents = log.agents.map(a => a.agentId).join(', ');
          return `[${timestamp}] [${log.result.success ? 'SUCCESS' : 'FAILED'}] [${log.requestId}] "${log.playerInput}" Agents: [${agents}] Conflicts: ${log.conflicts.length}`;
        }).join('\n');

    const mimeType = format === 'json' ? 'application/json' : 'text/plain';
    const extension = format === 'json' ? 'json' : 'txt';
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `decision-logs-${timestamp}.${extension}`;
    a.click();
    URL.revokeObjectURL(url);
  }, [logs]);

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const truncateText = (text: string, maxLength: number = 50) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // 详情视图
  if (viewState.mode === 'detail') {
    return (
      <div className={styles.container}>
        <DecisionLogDetail
          log={currentLog}
          loading={loading}
          onBack={handleBackToList}
        />
      </div>
    );
  }

  // 列表视图
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <Icon name="book" size={16} />
          决策日志
        </div>
        <div className={styles.actionButtons}>
          <button
            className={styles.actionButton}
            onClick={handleRefresh}
            disabled={loading}
          >
            <Icon name="refresh" size={14} />
            刷新
          </button>
          <button
            className={styles.actionButton}
            onClick={() => handleExport('json')}
            disabled={loading || logs.length === 0}
          >
            <Icon name="download" size={14} />
            JSON
          </button>
          <button
            className={styles.actionButton}
            onClick={() => handleExport('text')}
            disabled={loading || logs.length === 0}
          >
            <Icon name="download" size={14} />
            TXT
          </button>
        </div>
      </div>

      <div className={styles.filterBar}>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="搜索 Request ID..."
          value={searchRequestId}
          onChange={(e) => setSearchRequestId(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button className={styles.actionButton} onClick={handleSearch}>
          <Icon name="search" size={14} />
          搜索
        </button>

        <select
          className={styles.filterSelect}
          value={filter.agentId || ''}
          onChange={(e) => setFilter(prev => ({
            ...prev,
            agentId: e.target.value as AgentType | '',
          }))}
        >
          {AGENT_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        <select
          className={styles.filterSelect}
          value={filter.success === undefined ? '' : String(filter.success)}
          onChange={(e) => setFilter(prev => ({
            ...prev,
            success: e.target.value === '' ? undefined : e.target.value === 'true',
          }))}
        >
          {STATUS_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        <select
          className={styles.filterSelect}
          value={filter.hasConflicts === undefined ? '' : String(filter.hasConflicts)}
          onChange={(e) => setFilter(prev => ({
            ...prev,
            hasConflicts: e.target.value === '' ? undefined : e.target.value === 'true',
          }))}
        >
          {CONFLICT_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {stats && (
        <div className={styles.statsBar}>
          <div className={styles.statItem}>
            总计: <span className={styles.statValue}>{stats.total}</span>
          </div>
          <div className={styles.statItem}>
            成功: <span className={`${styles.statValue} ${styles.success}`}>{stats.successCount}</span>
          </div>
          <div className={styles.statItem}>
            失败: <span className={`${styles.statValue} ${styles.error}`}>{stats.failureCount}</span>
          </div>
          <div className={styles.statItem}>
            冲突: <span className={`${styles.statValue} ${styles.warning}`}>{stats.conflictCount}</span>
          </div>
          <div className={styles.statItem}>
            平均耗时: <span className={styles.statValue}>{formatDuration(stats.averageDuration)}</span>
          </div>
        </div>
      )}

      {error && (
        <div className={styles.empty} style={{ color: 'var(--color-error)' }}>
          错误: {error}
        </div>
      )}

      <div className={styles.logList}>
        {loading && logs.length === 0 ? (
          <div className={styles.loading}>
            <Icon name="loading" size={20} />
            加载中...
          </div>
        ) : logs.length === 0 ? (
          <div className={styles.empty}>暂无决策日志记录</div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className={`${styles.logItem} ${viewState.selectedLogId === log.id ? styles.selected : ''}`}
              onClick={() => handleLogClick(log)}
            >
              <div className={styles.logItemHeader}>
                <span className={styles.logTime}>{formatTime(log.timestamp)}</span>
                <span className={`${styles.logStatus} ${log.result.success ? styles.success : styles.error}`}>
                  {log.result.success ? '成功' : '失败'}
                </span>
              </div>
              <div className={styles.logBody}>
                <div className={styles.logInput} title={log.playerInput}>
                  {truncateText(log.playerInput)}
                </div>
                <div className={styles.logMeta}>
                  <div className={styles.logAgents}>
                    {log.agents.slice(0, 5).map((agent) => (
                      <span key={agent.agentId} className={styles.agentTag}>
                        {agent.agentId}
                      </span>
                    ))}
                    {log.agents.length > 5 && (
                      <span className={styles.agentTag}>+{log.agents.length - 5}</span>
                    )}
                  </div>
                  {log.conflicts.length > 0 && (
                    <span className={styles.conflictBadge}>
                      <Icon name="warning" size={10} />
                      {log.conflicts.length} 冲突
                    </span>
                  )}
                  <span className={styles.duration}>
                    {formatDuration(log.metadata.totalDuration)}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className={styles.pagination}>
        <button
          className={styles.paginationButton}
          onClick={handlePrevPage}
          disabled={page === 0 || loading}
        >
          <Icon name="chevron-left" size={14} />
          上一页
        </button>
        <span className={styles.paginationInfo}>
          第 {page + 1} 页 / 共 {Math.ceil(total / PAGE_SIZE)} 页 ({total} 条)
        </span>
        <button
          className={styles.paginationButton}
          onClick={handleNextPage}
          disabled={!hasMore || loading}
        >
          下一页
          <Icon name="chevron-right" size={14} />
        </button>
      </div>
    </div>
  );
};

export default DecisionLogViewer;
