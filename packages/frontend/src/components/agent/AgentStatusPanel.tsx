import React, { useEffect, useCallback, useRef } from 'react';
import { Button, Panel, Icon } from '../common';
import { useAgentStore } from '../../stores/agentStore';
import { agentService } from '../../services/agentService';
import type { AgentStatus, AgentType } from '@ai-rpg/shared';
import { AGENT_DESCRIPTIONS } from '@ai-rpg/shared';
import styles from './AgentStatusPanel.module.css';

export interface AgentStatusPanelProps {
  onClose?: () => void;
  refreshInterval?: number;
}

const REFRESH_OPTIONS = [
  { value: 2000, label: '2秒' },
  { value: 5000, label: '5秒' },
  { value: 10000, label: '10秒' },
  { value: 30000, label: '30秒' },
];

const STATUS_COLORS: Record<string, string> = {
  idle: '#10b981',
  processing: '#3b82f6',
  waiting: '#f59e0b',
  error: '#ef4444',
};

const STATUS_LABELS: Record<string, string> = {
  idle: '空闲',
  processing: '处理中',
  waiting: '等待',
  error: '错误',
};

const AGENT_NAMES: Record<string, string> = {
  coordinator: '协调器',
  story_context: '故事上下文',
  quest: '任务管理',
  map: '地图管理',
  npc_party: 'NPC管理',
  numerical: '数值管理',
  inventory: '背包系统',
  skill: '技能管理',
  ui: 'UI管理',
  combat: '战斗管理',
  dialogue: '对话管理',
  event: '事件管理',
};

export const AgentStatusPanel: React.FC<AgentStatusPanelProps> = ({
  onClose,
  refreshInterval: defaultRefreshInterval = 5000,
}) => {
  const {
    initialized,
    started,
    agents,
    loading,
    error,
    refreshInterval,
    autoRefresh,
    fetchStatus,
    startService,
    stopService,
    setRefreshInterval,
    setAutoRefresh,
    clearError,
  } = useAgentStore();

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setRefreshInterval(defaultRefreshInterval);
  }, [defaultRefreshInterval, setRefreshInterval]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  useEffect(() => {
    if (autoRefresh && started) {
      intervalRef.current = setInterval(fetchStatus, refreshInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [autoRefresh, started, refreshInterval, fetchStatus]);

  const handleStartService = useCallback(async () => {
    await startService();
  }, [startService]);

  const handleStopService = useCallback(async () => {
    await stopService();
  }, [stopService]);

  const handleRefreshIntervalChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setRefreshInterval(Number(e.target.value));
  }, [setRefreshInterval]);

  const handleAutoRefreshToggle = useCallback(() => {
    setAutoRefresh(!autoRefresh);
  }, [autoRefresh, setAutoRefresh]);

  const renderStatusIndicator = (status: AgentStatus['status']) => {
    const color = STATUS_COLORS[status] || STATUS_COLORS.idle;
    return (
      <span
        className={styles.statusIndicator}
        style={{ backgroundColor: color }}
        title={STATUS_LABELS[status] || status}
      />
    );
  };

  const renderAgentCard = (agent: AgentStatus) => {
    const agentName = AGENT_NAMES[agent.type] || agent.type;
    const description = AGENT_DESCRIPTIONS[agent.type as AgentType] || '';
    
    return (
      <div key={agent.type} className={styles.agentCard}>
        <div className={styles.agentHeader}>
          <div className={styles.agentInfo}>
            {renderStatusIndicator(agent.status)}
            <span className={styles.agentName}>{agentName}</span>
          </div>
          <span className={styles.agentType}>{agent.type}</span>
        </div>
        
        {description && (
          <p className={styles.agentDescription}>{description}</p>
        )}
        
        <div className={styles.agentStats}>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>处理消息</span>
            <span className={styles.statValue}>{agent.messagesProcessed}</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>错误数</span>
            <span className={`${styles.statValue} ${agent.errors > 0 ? styles.errorValue : ''}`}>
              {agent.errors}
            </span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>平均耗时</span>
            <span className={styles.statValue}>
              {agentService.formatProcessingTime(agent.averageProcessingTime)}
            </span>
          </div>
        </div>
        
        {agent.lastActivity > 0 && (
          <div className={styles.lastActivity}>
            最后活动: {agentService.formatTimestamp(agent.lastActivity)}
          </div>
        )}
      </div>
    );
  };

  const totalMessages = agents.reduce((sum, a) => sum + a.messagesProcessed, 0);
  const totalErrors = agents.reduce((sum, a) => sum + a.errors, 0);
  const activeAgents = agents.filter(a => a.status === 'processing').length;
  const errorAgents = agents.filter(a => a.status === 'error').length;

  return (
    <Panel className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>智能体状态监控</h2>
        {onClose && (
          <button className={styles.closeBtn} onClick={onClose}>
            <Icon name="close" size={20} />
          </button>
        )}
      </div>

      <div className={styles.serviceStatus}>
        <div className={styles.statusRow}>
          <div className={styles.serviceInfo}>
            <span
              className={styles.serviceIndicator}
              style={{
                backgroundColor: started
                  ? STATUS_COLORS.idle
                  : initialized
                  ? STATUS_COLORS.waiting
                  : STATUS_COLORS.error,
              }}
            />
            <span className={styles.serviceLabel}>
              服务状态: {started ? '已启动' : initialized ? '已初始化' : '未初始化'}
            </span>
          </div>
          
          <div className={styles.serviceActions}>
            {started ? (
              <Button
                variant="danger"
                size="small"
                onClick={handleStopService}
                loading={loading}
                icon={<Icon name="pause" size={16} />}
              >
                停止服务
              </Button>
            ) : (
              <Button
                variant="primary"
                size="small"
                onClick={handleStartService}
                loading={loading}
                icon={<Icon name="play" size={16} />}
              >
                启动服务
              </Button>
            )}
          </div>
        </div>

        <div className={styles.summaryStats}>
          <div className={styles.summaryItem}>
            <span className={styles.summaryValue}>{agents.length}</span>
            <span className={styles.summaryLabel}>智能体总数</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryValue}>{activeAgents}</span>
            <span className={styles.summaryLabel}>活动智能体</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryValue}>{totalMessages}</span>
            <span className={styles.summaryLabel}>处理消息数</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={`${styles.summaryValue} ${totalErrors > 0 ? styles.errorValue : ''}`}>
              {totalErrors}
            </span>
            <span className={styles.summaryLabel}>总错误数</span>
          </div>
        </div>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.refreshControls}>
          <label className={styles.autoRefreshLabel}>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={handleAutoRefreshToggle}
              disabled={!started}
            />
            <span>自动刷新</span>
          </label>
          
          <select
            className={styles.refreshSelect}
            value={refreshInterval}
            onChange={handleRefreshIntervalChange}
            disabled={!autoRefresh || !started}
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
            onClick={fetchStatus}
            loading={loading}
            icon={<Icon name="refresh" size={16} />}
          >
            刷新
          </Button>
        </div>
      </div>

      {error && (
        <div className={styles.error}>
          <span>{error}</span>
          <button onClick={clearError}>×</button>
        </div>
      )}

      <div className={styles.agentList}>
        {agents.length === 0 ? (
          <div className={styles.emptyState}>
            <Icon name="info" size={32} />
            <p>暂无智能体数据</p>
            <p className={styles.hint}>请先启动智能体服务</p>
          </div>
        ) : (
          <div className={styles.agentGrid}>
            {agents.map(renderAgentCard)}
          </div>
        )}
      </div>

      {errorAgents > 0 && (
        <div className={styles.errorBanner}>
          <Icon name="warning" size={16} />
          <span>有 {errorAgents} 个智能体处于错误状态</span>
        </div>
      )}
    </Panel>
  );
};
