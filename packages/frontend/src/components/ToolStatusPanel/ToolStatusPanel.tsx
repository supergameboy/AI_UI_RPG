import React, { useEffect, useCallback, useRef, useMemo, useState } from 'react';
import { Button, Panel, Icon } from '../common';
import { useAgentStore } from '../../stores/agentStore';
import { TOOL_DESCRIPTIONS } from '@ai-rpg/shared';
import type { ToolStatus, ToolType } from '@ai-rpg/shared';
import type { ToolStatusPanelProps, ToolStatusFilter, ToolStatistics } from './types';
import { TOOL_NAMES, STATUS_COLORS, STATUS_LABELS } from './types';
import styles from './ToolStatusPanel.module.css';

const REFRESH_OPTIONS = [
  { value: 2000, label: '2秒' },
  { value: 5000, label: '5秒' },
  { value: 10000, label: '10秒' },
  { value: 30000, label: '30秒' },
];

const FILTER_OPTIONS: { value: ToolStatusFilter; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'idle', label: '空闲' },
  { value: 'busy', label: '忙碌' },
  { value: 'error', label: '错误' },
];

function formatTimestamp(timestamp: number): string {
  if (timestamp === 0) return '从未';
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - timestamp;

  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;

  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDuration(ms: number): string {
  if (ms === 0) return '-';
  if (ms < 1) return `${(ms * 1000).toFixed(1)}μs`;
  if (ms < 1000) return `${ms.toFixed(1)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

export const ToolStatusPanel: React.FC<ToolStatusPanelProps> = ({
  onClose,
  refreshInterval: defaultRefreshInterval = 5000,
}) => {
  const {
    tools,
    toolsLoading,
    loading,
    error,
    refreshInterval,
    autoRefresh,
    fetchTools,
    setRefreshInterval,
    setAutoRefresh,
    clearError,
  } = useAgentStore();

  // 使用 ref 存储 store 方法避免依赖变化
  const storeRef = useRef({ fetchTools, setRefreshInterval });
  storeRef.current = { fetchTools, setRefreshInterval };

  const [statusFilter, setStatusFilter] = useState<ToolStatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 初始化刷新间隔
  useEffect(() => {
    storeRef.current.setRefreshInterval(defaultRefreshInterval);
  }, [defaultRefreshInterval]);

  // 初始加载 - 只在组件挂载时执行一次
  // fetchTools 通过 storeRef 调用，确保始终使用最新的函数引用
  useEffect(() => {
    storeRef.current.fetchTools();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // 空依赖数组：组件挂载时执行一次初始化加载
  }, []);

  // 自动刷新
  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(() => {
        storeRef.current.fetchTools();
      }, refreshInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [autoRefresh, refreshInterval]);

  // 计算统计数据
  const statistics: ToolStatistics = useMemo(() => {
    const totalCalls = tools.reduce((sum, t) => sum + t.callCount, 0);
    const totalErrors = tools.reduce((sum, t) => sum + t.errorCount, 0);
    const successRate = totalCalls > 0 ? ((totalCalls - totalErrors) / totalCalls) * 100 : 100;
    const avgDuration = tools.length > 0
      ? tools.reduce((sum, t) => sum + t.averageDuration, 0) / tools.length
      : 0;
    const activeTools = tools.filter(t => t.status === 'busy').length;
    const errorTools = tools.filter(t => t.status === 'error').length;

    return {
      totalCalls,
      totalErrors,
      successRate,
      averageDuration: avgDuration,
      activeTools,
      errorTools,
    };
  }, [tools]);

  // 过滤后的工具列表
  const filteredTools = useMemo(() => {
    return tools.filter(tool => {
      // 状态过滤
      if (statusFilter !== 'all' && tool.status !== statusFilter) {
        return false;
      }

      // 搜索过滤
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const toolName = TOOL_NAMES[tool.type as ToolType] || tool.type;
        const description = TOOL_DESCRIPTIONS[tool.type as ToolType] || '';
        return (
          toolName.toLowerCase().includes(query) ||
          tool.type.toLowerCase().includes(query) ||
          description.toLowerCase().includes(query)
        );
      }

      return true;
    });
  }, [tools, statusFilter, searchQuery]);

  // 刷新间隔变更
  const handleRefreshIntervalChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setRefreshInterval(Number(e.target.value));
  }, [setRefreshInterval]);

  // 自动刷新切换
  const handleAutoRefreshToggle = useCallback(() => {
    setAutoRefresh(!autoRefresh);
  }, [autoRefresh, setAutoRefresh]);

  // 状态过滤变更
  const handleStatusFilterChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value as ToolStatusFilter);
  }, []);

  // 搜索变更
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  // 渲染状态指示器
  const renderStatusIndicator = (status: ToolStatus['status']) => {
    const color = STATUS_COLORS[status];
    return (
      <span
        className={styles.statusIndicator}
        style={{ backgroundColor: color }}
        title={STATUS_LABELS[status]}
      />
    );
  };

  // 渲染工具卡片
  const renderToolCard = (tool: ToolStatus) => {
    const toolName = TOOL_NAMES[tool.type as ToolType] || tool.type;
    const description = TOOL_DESCRIPTIONS[tool.type as ToolType] || '';

    return (
      <div key={tool.type} className={styles.toolCard}>
        <div className={styles.toolHeader}>
          <div className={styles.toolInfo}>
            {renderStatusIndicator(tool.status)}
            <span className={styles.toolName}>{toolName}</span>
          </div>
          <span className={styles.toolType}>{tool.type}</span>
        </div>

        {description && (
          <p className={styles.toolDescription}>{description}</p>
        )}

        <div className={styles.toolStats}>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>调用次数</span>
            <span className={styles.statValue}>{tool.callCount}</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>错误次数</span>
            <span className={`${styles.statValue} ${tool.errorCount > 0 ? styles.errorValue : ''}`}>
              {tool.errorCount}
            </span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>平均耗时</span>
            <span className={styles.statValue}>{formatDuration(tool.averageDuration)}</span>
          </div>
        </div>

        <div className={styles.lastCall}>
          最后调用: {formatTimestamp(tool.lastCall)}
        </div>
      </div>
    );
  };

  return (
    <Panel className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>工具状态监控</h2>
        {onClose && (
          <button className={styles.closeBtn} onClick={onClose}>
            <Icon name="close" size={20} />
          </button>
        )}
      </div>

      {/* 统计摘要 */}
      <div className={styles.summaryStats}>
        <div className={styles.summaryItem}>
          <span className={styles.summaryValue}>{tools.length}</span>
          <span className={styles.summaryLabel}>工具总数</span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryValue}>{statistics.activeTools}</span>
          <span className={styles.summaryLabel}>活跃工具</span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryValue}>{statistics.totalCalls}</span>
          <span className={styles.summaryLabel}>总调用次数</span>
        </div>
        <div className={styles.summaryItem}>
          <span className={`${styles.summaryValue} ${statistics.totalErrors > 0 ? styles.errorValue : ''}`}>
            {statistics.totalErrors}
          </span>
          <span className={styles.summaryLabel}>总错误数</span>
        </div>
      </div>

      {/* 性能指标 */}
      <div className={styles.performanceStats}>
        <div className={styles.performanceItem}>
          <span className={styles.performanceLabel}>成功率</span>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{
                width: `${statistics.successRate}%`,
                backgroundColor: statistics.successRate >= 95 ? '#10b981' : statistics.successRate >= 80 ? '#f59e0b' : '#ef4444',
              }}
            />
          </div>
          <span className={styles.performanceValue}>{statistics.successRate.toFixed(1)}%</span>
        </div>
        <div className={styles.performanceItem}>
          <span className={styles.performanceLabel}>平均响应</span>
          <span className={styles.performanceValue}>{formatDuration(statistics.averageDuration)}</span>
        </div>
      </div>

      {/* 工具栏 */}
      <div className={styles.toolbar}>
        <div className={styles.filterControls}>
          <select
            className={styles.filterSelect}
            value={statusFilter}
            onChange={handleStatusFilterChange}
          >
            {FILTER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <div className={styles.searchWrapper}>
            <Icon name="search" size={16} className={styles.searchIcon} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="搜索工具..."
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
        </div>

        <div className={styles.refreshControls}>
          <label className={styles.autoRefreshLabel}>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={handleAutoRefreshToggle}
            />
            <span>自动刷新</span>
          </label>

          <select
            className={styles.refreshSelect}
            value={refreshInterval}
            onChange={handleRefreshIntervalChange}
            disabled={!autoRefresh}
          >
            {REFRESH_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <Button
            variant="ghost"
            size="small"
            onClick={fetchTools}
            loading={loading || toolsLoading}
            icon={<Icon name="refresh" size={16} />}
          >
            刷新
          </Button>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className={styles.error}>
          <span>{error}</span>
          <button onClick={clearError}>x</button>
        </div>
      )}

      {/* 工具列表 */}
      <div className={styles.toolList}>
        {filteredTools.length === 0 ? (
          <div className={styles.emptyState}>
            <Icon name="info" size={32} />
            <p>暂无工具数据</p>
            {searchQuery || statusFilter !== 'all' ? (
              <p className={styles.hint}>尝试调整过滤条件</p>
            ) : null}
          </div>
        ) : (
          <div className={styles.toolGrid}>
            {filteredTools.map(renderToolCard)}
          </div>
        )}
      </div>

      {/* 错误工具警告 */}
      {statistics.errorTools > 0 && (
        <div className={styles.errorBanner}>
          <Icon name="warning" size={16} />
          <span>有 {statistics.errorTools} 个工具处于错误状态</span>
        </div>
      )}
    </Panel>
  );
};
