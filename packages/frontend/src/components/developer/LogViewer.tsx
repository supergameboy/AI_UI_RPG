import React, { useState, useEffect } from 'react';
import { logService, type LogLevel, type LogSource, type LogEntry } from '../../services/logService';
import { useDeveloperStore } from '../../stores';
import { Icon } from '../common';
import styles from './DeveloperPanel.module.css';

const LOG_LEVELS: LogLevel[] = ['debug', 'info', 'warn', 'error'];
const LOG_SOURCES: LogSource[] = ['frontend', 'backend', 'agent', 'system', 'llm', 'prompt-editor'];

export const LogViewer: React.FC = () => {
  const { logs, setLogs } = useDeveloperStore();
  const [levelFilter, setLevelFilter] = useState<LogLevel | ''>('');
  const [sourceFilter, setSourceFilter] = useState<LogSource | ''>('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const unsubscribe = logService.subscribe((newLogs) => {
      setLogs(newLogs);
    });
    setLogs(logService.getLogs());
    return unsubscribe;
  }, [setLogs]);

  const filteredLogs = logs.filter((log) => {
    if (levelFilter && log.level !== levelFilter) return false;
    if (sourceFilter && log.source !== sourceFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        log.message.toLowerCase().includes(term) ||
        JSON.stringify(log.data || {}).toLowerCase().includes(term)
      );
    }
    return true;
  });

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('zh-CN');
  };

  const handleExport = (format: 'json' | 'text') => {
    logService.downloadLogs(format);
  };

  const handleClear = () => {
    logService.clearLogs();
  };

  return (
    <div className={styles.tabContent}>
      <div className={styles.filterBar}>
        <select
          className={styles.filterSelect}
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value as LogLevel | '')}
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
        >
          <option value="">所有来源</option>
          {LOG_SOURCES.map((source) => (
            <option key={source} value={source}>
              {source}
            </option>
          ))}
        </select>

        <input
          type="text"
          className={styles.searchInput}
          placeholder="搜索日志..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <div className={styles.actionButtons}>
          <button className={styles.actionButton} onClick={() => handleExport('json')}>
            <Icon name="download" size={14} />
            JSON
          </button>
          <button className={styles.actionButton} onClick={() => handleExport('text')}>
            <Icon name="download" size={14} />
            TXT
          </button>
          <button className={styles.actionButton} onClick={handleClear}>
            <Icon name="trash" size={14} />
            清空
          </button>
        </div>
      </div>

      <div className={styles.logList}>
        {filteredLogs.length === 0 ? (
          <div className={styles.empty}>暂无日志记录</div>
        ) : (
          filteredLogs
            .slice()
            .reverse()
            .map((log) => (
              <LogItem key={log.id} log={log} formatTime={formatTime} />
            ))
        )}
      </div>
    </div>
  );
};

const LogItem: React.FC<{ log: LogEntry; formatTime: (t: number) => string }> = ({
  log,
  formatTime,
}) => {
  const [expanded, setExpanded] = useState(false);

  const levelClass = {
    debug: styles.logDebug,
    info: styles.logInfo,
    warn: styles.logWarn,
    error: styles.logError,
  }[log.level];

  return (
    <div className={`${styles.logItem} ${levelClass}`}>
      <div className={styles.logHeader} onClick={() => setExpanded(!expanded)}>
        <span className={styles.logTime}>{formatTime(log.timestamp)}</span>
        <span className={styles.logLevel}>{log.level.toUpperCase()}</span>
        <span className={styles.logSource}>[{log.source}]</span>
        <span className={styles.logMessage}>{log.message}</span>
        {log.data && <Icon name={expanded ? 'chevron-down' : 'chevron-right'} size={12} />}
      </div>
      {expanded && log.data && (
        <pre className={styles.logData}>{JSON.stringify(log.data, null, 2)}</pre>
      )}
    </div>
  );
};
