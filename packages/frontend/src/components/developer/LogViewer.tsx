import React, { useState, useMemo, useCallback } from 'react';
import { useDeveloperStore, useDecisionLogStore } from '../../stores';
import { Icon } from '../common';
import type { 
  LogLevel, 
  LogSource, 
  LogEntry,
  DecisionLogData,
  ContextChangeLogData,
  ConflictLogData
} from '@ai-rpg/shared';
import styles from './DeveloperPanel.module.css';

const LOG_LEVELS: LogLevel[] = ['debug', 'info', 'warn', 'error'];

// 日志类型分组
const LOG_SOURCE_GROUPS: Record<string, LogSource[]> = {
  '系统': ['frontend', 'backend', 'system'],
  'AI': ['agent', 'llm', 'prompt-editor'],
  '游戏': ['dialogue', 'combat'],
  '决策': ['decision', 'context', 'conflict'],
};

// 时间范围选项
interface TimeRangeOption {
  label: string;
  value: number | null; // null 表示不限，number 表示毫秒数
}

const TIME_RANGE_OPTIONS: TimeRangeOption[] = [
  { label: '不限', value: null },
  { label: '最近1分钟', value: 60 * 1000 },
  { label: '最近5分钟', value: 5 * 60 * 1000 },
  { label: '最近15分钟', value: 15 * 60 * 1000 },
  { label: '最近1小时', value: 60 * 60 * 1000 },
  { label: '最近24小时', value: 24 * 60 * 1000 },
];

// 日志来源显示名称
const SOURCE_DISPLAY_NAMES: Partial<Record<LogSource, string>> = {
  'frontend': '前端',
  'backend': '后端',
  'agent': '智能体',
  'system': '系统',
  'llm': 'LLM',
  'prompt-editor': '提示词编辑器',
  'dialogue': '对话',
  'combat': '战斗',
  'decision': '决策',
  'context': '上下文',
  'conflict': '冲突',
};

export const LogViewer: React.FC = () => {
  const { logs, clearLogs, setActiveTab } = useDeveloperStore();
  const { fetchLogById } = useDecisionLogStore();
  
  // 过滤状态
  const [levelFilter, setLevelFilter] = useState<LogLevel | ''>('');
  const [sourceFilter, setSourceFilter] = useState<LogSource | ''>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [timeRange, setTimeRange] = useState<number | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(Object.keys(LOG_SOURCE_GROUPS)));

  // 过滤日志
  const filteredLogs = useMemo(() => {
    const now = Date.now();
    return logs.filter((log) => {
      // 级别过滤
      if (levelFilter && log.level !== levelFilter) return false;
      
      // 来源过滤
      if (sourceFilter && log.source !== sourceFilter) return false;
      
      // 时间范围过滤
      if (timeRange !== null && (now - log.timestamp) > timeRange) return false;
      
      // 关键词搜索
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const messageMatch = log.message.toLowerCase().includes(term);
        const dataMatch = log.data ? JSON.stringify(log.data).toLowerCase().includes(term) : false;
        const sourceMatch = SOURCE_DISPLAY_NAMES[log.source]?.toLowerCase().includes(term) || false;
        return messageMatch || dataMatch || sourceMatch;
      }
      
      return true;
    });
  }, [logs, levelFilter, sourceFilter, searchTerm, timeRange]);

  // 按来源分组日志
  const groupedLogs = useMemo(() => {
    const groups: Record<string, LogEntry[]> = {};
    
    filteredLogs.forEach(log => {
      // 找到日志所属的分组
      let groupName = '其他';
      for (const [name, sources] of Object.entries(LOG_SOURCE_GROUPS)) {
        if (sources.includes(log.source)) {
          groupName = name;
          break;
        }
      }
      
      if (!groups[groupName]) {
        groups[groupName] = [];
      }
      groups[groupName].push(log);
    });
    
    return groups;
  }, [filteredLogs]);

  // 切换分组展开状态
  const toggleGroup = useCallback((groupName: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupName)) {
        next.delete(groupName);
      } else {
        next.add(groupName);
      }
      return next;
    });
  }, []);

  // 格式化时间
  const formatTime = useCallback((timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3,
    });
  }, []);

  // 格式化日期时间
  const formatDateTime = useCallback((timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN');
  }, []);

  // 导出日志
  const handleExport = useCallback((format: 'json' | 'text') => {
    const content = format === 'json' 
      ? JSON.stringify(filteredLogs, null, 2)
      : filteredLogs.map(log => {
          const timestamp = new Date(log.timestamp).toISOString();
          const dataStr = log.data ? ` ${JSON.stringify(log.data)}` : '';
          return `[${timestamp}] [${log.level.toUpperCase()}] [${log.source}] ${log.message}${dataStr}`;
        }).join('\n');
    
    const mimeType = format === 'json' ? 'application/json' : 'text/plain';
    const extension = format === 'json' ? 'json' : 'txt';
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-rpg-logs-${timestamp}.${extension}`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredLogs]);

  // 清空所有过滤器
  const clearFilters = useCallback(() => {
    setLevelFilter('');
    setSourceFilter('');
    setSearchTerm('');
    setTimeRange(null);
  }, []);

  // 跳转到决策日志详情
  const handleJumpToDecision = useCallback(async (decisionId: string) => {
    await fetchLogById(decisionId);
    setActiveTab('decisions');
  }, [fetchLogById, setActiveTab]);

  // 统计信息
  const stats = useMemo(() => {
    const result = {
      total: filteredLogs.length,
      byLevel: {} as Record<LogLevel, number>,
      bySource: {} as Record<LogSource, number>,
      errors: 0,
      warnings: 0,
    };
    
    filteredLogs.forEach(log => {
      result.byLevel[log.level] = (result.byLevel[log.level] || 0) + 1;
      result.bySource[log.source] = (result.bySource[log.source] || 0) + 1;
      if (log.level === 'error') result.errors++;
      if (log.level === 'warn') result.warnings++;
    });
    
    return result;
  }, [filteredLogs]);

  return (
    <div className={styles.tabContent} style={{ padding: 0 }}>
      {/* 过滤器栏 */}
      <div className={styles.filterBar}>
        <select
          className={styles.filterSelect}
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value as LogLevel | '')}
          title="按日志级别过滤"
        >
          <option value="">所有级别</option>
          {LOG_LEVELS.map((level) => (
            <option key={level} value={level}>
              {level.toUpperCase()}
            </option>
          ))}
        </select>

        <select
          className={styles.filterSelect}
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value as LogSource | '')}
          title="按日志来源过滤"
        >
          <option value="">所有来源</option>
          {Object.entries(LOG_SOURCE_GROUPS).map(([group, sources]) => (
            <optgroup key={group} label={group}>
              {sources.map((source) => (
                <option key={source} value={source}>
                  {SOURCE_DISPLAY_NAMES[source] || source}
                </option>
              ))}
            </optgroup>
          ))}
        </select>

        <select
          className={styles.filterSelect}
          value={timeRange ?? ''}
          onChange={(e) => setTimeRange(e.target.value ? Number(e.target.value) : null)}
          title="按时间范围过滤"
        >
          {TIME_RANGE_OPTIONS.map((option) => (
            <option key={option.label} value={option.value ?? ''}>
              {option.label}
            </option>
          ))}
        </select>

        <input
          type="text"
          className={styles.searchInput}
          placeholder="搜索日志..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          title="搜索日志消息和数据"
        />

        <div className={styles.actionButtons}>
          {(levelFilter || sourceFilter || searchTerm || timeRange !== null) && (
            <button 
              className={styles.actionButton} 
              onClick={clearFilters}
              title="清除所有过滤器"
            >
              <Icon name="close" size={14} />
              清除
            </button>
          )}
          <button className={styles.actionButton} onClick={() => handleExport('json')}>
            <Icon name="download" size={14} />
            JSON
          </button>
          <button className={styles.actionButton} onClick={() => handleExport('text')}>
            <Icon name="download" size={14} />
            TXT
          </button>
          <button className={styles.actionButton} onClick={clearLogs}>
            <Icon name="trash" size={14} />
            清空
          </button>
        </div>
      </div>

      {/* 统计信息栏 */}
      <div className={styles.logStatsBar}>
        <span className={styles.logStatsItem}>
          总计: <strong>{stats.total}</strong>
        </span>
        {stats.errors > 0 && (
          <span className={`${styles.logStatsItem} ${styles.logStatsError}`}>
            错误: <strong>{stats.errors}</strong>
          </span>
        )}
        {stats.warnings > 0 && (
          <span className={`${styles.logStatsItem} ${styles.logStatsWarning}`}>
            警告: <strong>{stats.warnings}</strong>
          </span>
        )}
      </div>

      {/* 日志列表 */}
      <div className={styles.logList}>
        {filteredLogs.length === 0 ? (
          <div className={styles.empty}>暂无日志记录</div>
        ) : (
          Object.entries(groupedLogs).map(([groupName, groupLogs]) => (
            <div key={groupName} className={styles.logGroup}>
              <div 
                className={styles.logGroupHeader}
                onClick={() => toggleGroup(groupName)}
              >
                <Icon 
                  name={expandedGroups.has(groupName) ? 'chevron-down' : 'chevron-right'} 
                  size={12} 
                />
                <span className={styles.logGroupName}>{groupName}</span>
                <span className={styles.logGroupCount}>{groupLogs.length}</span>
              </div>
              {expandedGroups.has(groupName) && (
                <div className={styles.logGroupContent}>
                  {groupLogs
                    .slice()
                    .reverse()
                    .map((log) => (
                      <LogItem 
                        key={log.id} 
                        log={log} 
                        formatTime={formatTime}
                        formatDateTime={formatDateTime}
                        onJumpToDecision={handleJumpToDecision}
                      />
                    ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// 日志项组件
interface LogItemProps {
  log: LogEntry;
  formatTime: (t: number) => string;
  formatDateTime: (t: number) => string;
  onJumpToDecision: (decisionId: string) => void;
}

const LogItem: React.FC<LogItemProps> = ({
  log,
  formatTime,
  formatDateTime,
  onJumpToDecision,
}) => {
  const [expanded, setExpanded] = useState(false);

  // 根据日志级别获取样式类
  const levelClass = {
    debug: styles.logDebug,
    info: styles.logInfo,
    warn: styles.logWarn,
    error: styles.logError,
  }[log.level];

  // 根据日志来源获取特殊样式
  const getSourceClass = (): string => {
    if (log.source === 'decision') return styles.logSourceDecision;
    if (log.source === 'context') return styles.logSourceContext;
    if (log.source === 'conflict') return styles.logSourceConflict;
    return '';
  };

  // 渲染日志数据
  const renderLogData = () => {
    if (!log.data) return null;

    // 决策日志特殊渲染
    if (log.source === 'decision') {
      const decisionData = log.data as unknown as DecisionLogData;
      return (
        <div className={styles.logDataSpecial}>
          <div className={styles.logDataField}>
            <span className={styles.logDataLabel}>智能体:</span>
            <span className={styles.logDataValue}>{decisionData.agentType}</span>
          </div>
          <div className={styles.logDataField}>
            <span className={styles.logDataLabel}>动作:</span>
            <span className={styles.logDataValue}>{decisionData.action}</span>
          </div>
          {decisionData.reasoning && (
            <div className={styles.logDataField}>
              <span className={styles.logDataLabel}>推理:</span>
              <span className={styles.logDataValue}>{decisionData.reasoning}</span>
            </div>
          )}
          <div className={styles.logDataField}>
            <span className={styles.logDataLabel}>状态:</span>
            <span className={`${styles.logDataValue} ${decisionData.success ? styles.logSuccess : styles.logFailure}`}>
              {decisionData.success ? '成功' : '失败'}
            </span>
          </div>
          {decisionData.decisionId && (
            <button 
              className={styles.logJumpButton}
              onClick={(e) => {
                e.stopPropagation();
                onJumpToDecision(decisionData.decisionId);
              }}
            >
              查看详情
            </button>
          )}
        </div>
      );
    }

    // 上下文变更日志特殊渲染
    if (log.source === 'context') {
      const contextData = log.data as unknown as ContextChangeLogData;
      return (
        <div className={styles.logDataSpecial}>
          <div className={styles.logDataField}>
            <span className={styles.logDataLabel}>路径:</span>
            <span className={styles.logDataValuePath}>{contextData.path}</span>
          </div>
          <div className={styles.logDataField}>
            <span className={styles.logDataLabel}>智能体:</span>
            <span className={styles.logDataValue}>{contextData.agentId}</span>
          </div>
          <div className={styles.logDataField}>
            <span className={styles.logDataLabel}>原因:</span>
            <span className={styles.logDataValue}>{contextData.reason}</span>
          </div>
          <div className={styles.logDataDiff}>
            <div className={styles.logDataOldValue}>
              <span className={styles.logDataLabel}>旧值:</span>
              <pre>{JSON.stringify(contextData.oldValue, null, 2)}</pre>
            </div>
            <div className={styles.logDataNewValue}>
              <span className={styles.logDataLabel}>新值:</span>
              <pre>{JSON.stringify(contextData.newValue, null, 2)}</pre>
            </div>
          </div>
        </div>
      );
    }

    // 冲突日志特殊渲染
    if (log.source === 'conflict') {
      const conflictData = log.data as unknown as ConflictLogData;
      return (
        <div className={`${styles.logDataSpecial} ${styles.logDataConflict}`}>
          <div className={styles.logDataField}>
            <span className={styles.logDataLabel}>路径:</span>
            <span className={styles.logDataValuePath}>{conflictData.path}</span>
          </div>
          <div className={styles.logDataField}>
            <span className={styles.logDataLabel}>涉及智能体:</span>
            <span className={styles.logDataValue}>{conflictData.agents.join(', ')}</span>
          </div>
          <div className={styles.logDataField}>
            <span className={styles.logDataLabel}>解决方式:</span>
            <span className={styles.logDataValue}>{conflictData.resolution}</span>
          </div>
          <div className={styles.logDataConflictValues}>
            <span className={styles.logDataLabel}>冲突值:</span>
            {conflictData.values.map((value: unknown, index: number) => (
              <div key={index} className={styles.logDataConflictValue}>
                <span className={styles.logDataAgentTag}>{conflictData.agents[index]}</span>
                <pre>{JSON.stringify(value, null, 2)}</pre>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // 默认 JSON 渲染
    return (
      <pre className={styles.logData}>{JSON.stringify(log.data, null, 2)}</pre>
    );
  };

  return (
    <div className={`${styles.logItem} ${levelClass} ${getSourceClass()}`}>
      <div className={styles.logHeader} onClick={() => setExpanded(!expanded)}>
        <span className={styles.logTime} title={formatDateTime(log.timestamp)}>
          {formatTime(log.timestamp)}
        </span>
        <span className={styles.logLevel}>{log.level.toUpperCase()}</span>
        <span className={styles.logSource}>[{SOURCE_DISPLAY_NAMES[log.source] || log.source}]</span>
        <span className={styles.logMessage}>{log.message}</span>
        {log.data && (
          <Icon 
            name={expanded ? 'chevron-down' : 'chevron-right'} 
            size={12} 
          />
        )}
      </div>
      {expanded && renderLogData()}
    </div>
  );
};
