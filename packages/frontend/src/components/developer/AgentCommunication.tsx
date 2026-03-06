import React, { useState, useMemo, useCallback } from 'react';
import { useDeveloperStore } from '../../stores';
import { Icon } from '../common';
import styles from './DeveloperPanel.module.css';
import type {
  AgentMessageRecord,
  ToolCallPayload,
  ToolResponsePayload,
  ContextChangePayload,
  ConflictDetectedPayload,
} from '../../services/logService';

/** 消息类型过滤器选项 */
const MESSAGE_TYPE_FILTERS: { value: string; label: string }[] = [
  { value: 'all', label: '全部类型' },
  { value: 'request', label: '请求' },
  { value: 'response', label: '响应' },
  { value: 'notification', label: '通知' },
  { value: 'error', label: '错误' },
  { value: 'tool_call', label: 'Tool 调用' },
  { value: 'tool_response', label: 'Tool 响应' },
  { value: 'context_change', label: '上下文变更' },
  { value: 'conflict_detected', label: '冲突检测' },
];

/** 消息来源过滤器选项 */
const SOURCE_FILTERS: { value: string; label: string }[] = [
  { value: 'all', label: '全部来源' },
  { value: 'coordinator', label: 'Coordinator' },
  { value: 'story_context', label: 'Story Context' },
  { value: 'quest', label: 'Quest' },
  { value: 'map', label: 'Map' },
  { value: 'npc_party', label: 'NPC/Party' },
  { value: 'numerical', label: 'Numerical' },
  { value: 'inventory', label: 'Inventory' },
  { value: 'skill', label: 'Skill' },
  { value: 'ui', label: 'UI' },
  { value: 'combat', label: 'Combat' },
  { value: 'dialogue', label: 'Dialogue' },
  { value: 'event', label: 'Event' },
];

/** 消息类型样式映射 */
const MESSAGE_TYPE_STYLES: Record<string, string> = {
  request: styles.info,
  response: styles.success,
  notification: styles.info,
  error: styles.error,
  tool_call: styles.toolCall,
  tool_response: styles.toolResponse,
  context_change: styles.contextChange,
  conflict_detected: styles.conflictDetected,
};

/** 消息类型中文映射 */
const MESSAGE_TYPE_LABELS: Record<string, string> = {
  request: '请求',
  response: '响应',
  notification: '通知',
  error: '错误',
  tool_call: 'Tool 调用',
  tool_response: 'Tool 响应',
  context_change: '上下文变更',
  conflict_detected: '冲突检测',
};

export const AgentCommunication: React.FC = () => {
  const { agentMessages, wsConnection, clearAgentMessages } = useDeveloperStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['basic', 'payload']));
  const [searchQuery, setSearchQuery] = useState('');

  /** 过滤后的消息列表 */
  const filteredMessages = useMemo(() => {
    return agentMessages.filter((message) => {
      // 类型过滤
      if (typeFilter !== 'all' && message.type !== typeFilter) {
        return false;
      }
      // 来源过滤
      if (sourceFilter !== 'all') {
        const fromMatch = message.from === sourceFilter;
        const toMatch = message.to === sourceFilter;
        if (!fromMatch && !toMatch) {
          return false;
        }
      }
      // 搜索过滤
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchAction = message.action.toLowerCase().includes(query);
        const matchPayload = message.payload
          ? JSON.stringify(message.payload).toLowerCase().includes(query)
          : false;
        const matchFrom = message.from.toLowerCase().includes(query);
        const matchTo = message.to.toLowerCase().includes(query);
        if (!matchAction && !matchPayload && !matchFrom && !matchTo) {
          return false;
        }
      }
      return true;
    });
  }, [agentMessages, typeFilter, sourceFilter, searchQuery]);

  const selectedMessage = useMemo(
    () => agentMessages.find((m) => m.id === selectedId),
    [agentMessages, selectedId]
  );

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('zh-CN');
  };

  /** 格式化 JSON 显示 */
  const formatJSON = useCallback((data: unknown, indent = 2): string => {
    try {
      return JSON.stringify(data, null, indent);
    } catch {
      return String(data);
    }
  }, []);

  /** 切换折叠状态 */
  const toggleSection = useCallback((section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  }, []);

  /** 复制到剪贴板 */
  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text).catch(console.error);
  }, []);

  const handleClearMessages = async () => {
    try {
      await fetch('http://localhost:6756/api/logs/agents', { method: 'DELETE' });
      clearAgentMessages();
    } catch (error) {
      console.error('Failed to clear agent messages:', error);
    }
  };

  /** 渲染消息类型标签 */
  const renderMessageType = (type: string) => {
    const label = MESSAGE_TYPE_LABELS[type] || type;
    const styleClass = MESSAGE_TYPE_STYLES[type] || styles.info;
    return (
      <span className={`${styles.itemStatus} ${styleClass}`}>
        {label}
      </span>
    );
  };

  /** 渲染 Tool 调用详情 */
  const renderToolCallDetail = (toolCall: ToolCallPayload) => (
    <div className={styles.detailSection}>
      <div
        className={styles.detailLabel}
        onClick={() => toggleSection('toolCall')}
        style={{ cursor: 'pointer' }}
      >
        <Icon name={expandedSections.has('toolCall') ? 'chevron-down' : 'chevron-right'} size={12} />
        <span style={{ marginLeft: 4 }}>Tool 调用信息</span>
      </div>
      {expandedSections.has('toolCall') && (
        <div className={styles.toolCallDetail}>
          <div className={styles.detailGrid}>
            <div>
              <span className={styles.detailSubLabel}>Tool 类型:</span>
              <span className={styles.toolType}>{toolCall.toolType}</span>
            </div>
            <div>
              <span className={styles.detailSubLabel}>方法:</span>
              <span className={styles.methodName}>{toolCall.method}</span>
            </div>
            <div>
              <span className={styles.detailSubLabel}>权限:</span>
              <span className={`${styles.permission} ${toolCall.permission === 'write' ? styles.write : styles.read}`}>
                {toolCall.permission === 'write' ? '写入' : '读取'}
              </span>
            </div>
          </div>
          <div className={styles.codeSection}>
            <div className={styles.codeHeader}>
              <span>参数</span>
              <button
                className={styles.copyButton}
                onClick={() => copyToClipboard(formatJSON(toolCall.params))}
              >
                <Icon name="copy" size={12} />
              </button>
            </div>
            <pre className={styles.codeBlock}>{formatJSON(toolCall.params)}</pre>
          </div>
        </div>
      )}
    </div>
  );

  /** 渲染 Tool 响应详情 */
  const renderToolResponseDetail = (toolResponse: ToolResponsePayload) => (
    <div className={styles.detailSection}>
      <div
        className={styles.detailLabel}
        onClick={() => toggleSection('toolResponse')}
        style={{ cursor: 'pointer' }}
      >
        <Icon name={expandedSections.has('toolResponse') ? 'chevron-down' : 'chevron-right'} size={12} />
        <span style={{ marginLeft: 4 }}>Tool 响应信息</span>
        <span
          className={`${styles.responseStatus} ${toolResponse.success ? styles.success : styles.error}`}
          style={{ marginLeft: 8 }}
        >
          {toolResponse.success ? '成功' : '失败'}
        </span>
      </div>
      {expandedSections.has('toolResponse') && (
        <div className={styles.toolResponseDetail}>
          <div className={styles.detailGrid}>
            <div>
              <span className={styles.detailSubLabel}>Tool 类型:</span>
              <span className={styles.toolType}>{toolResponse.toolType}</span>
            </div>
            <div>
              <span className={styles.detailSubLabel}>方法:</span>
              <span className={styles.methodName}>{toolResponse.method}</span>
            </div>
            {toolResponse.duration !== undefined && (
              <div>
                <span className={styles.detailSubLabel}>耗时:</span>
                <span>{toolResponse.duration}ms</span>
              </div>
            )}
          </div>
          {toolResponse.success && toolResponse.data !== undefined && (
            <div className={styles.codeSection}>
              <div className={styles.codeHeader}>
                <span>返回数据</span>
                <button
                  className={styles.copyButton}
                  onClick={() => copyToClipboard(formatJSON(toolResponse.data))}
                >
                  <Icon name="copy" size={12} />
                </button>
              </div>
              <pre className={styles.codeBlock}>{formatJSON(toolResponse.data)}</pre>
            </div>
          )}
          {!toolResponse.success && toolResponse.error && (
            <div className={styles.errorSection}>
              <div className={styles.errorHeader}>
                <Icon name="alert-circle" size={14} />
                <span>错误信息</span>
              </div>
              <pre className={styles.errorBlock}>{toolResponse.error}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );

  /** 渲染上下文变更详情 */
  const renderContextChangeDetail = (contextChange: ContextChangePayload) => (
    <div className={styles.detailSection}>
      <div
        className={styles.detailLabel}
        onClick={() => toggleSection('contextChange')}
        style={{ cursor: 'pointer' }}
      >
        <Icon name={expandedSections.has('contextChange') ? 'chevron-down' : 'chevron-right'} size={12} />
        <span style={{ marginLeft: 4 }}>上下文变更</span>
      </div>
      {expandedSections.has('contextChange') && (
        <div className={styles.contextChangeDetail}>
          <div className={styles.pathDisplay}>
            <Icon name="file-text" size={12} />
            <span className={styles.pathText}>{contextChange.path}</span>
          </div>
          <div className={styles.changeComparison}>
            <div className={styles.changeItem}>
              <span className={styles.changeLabel}>旧值</span>
              <pre className={styles.codeBlock}>{formatJSON(contextChange.oldValue)}</pre>
            </div>
            <div className={styles.changeArrow}>
              <Icon name="arrow-right" size={16} />
            </div>
            <div className={styles.changeItem}>
              <span className={styles.changeLabel}>新值</span>
              <pre className={styles.codeBlock}>{formatJSON(contextChange.newValue)}</pre>
            </div>
          </div>
          <div className={styles.changeMeta}>
            <span className={styles.detailSubLabel}>来源:</span> {contextChange.source}
            {contextChange.reason && (
              <>
                <span className={styles.detailSubLabel} style={{ marginLeft: 16 }}>原因:</span> {contextChange.reason}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );

  /** 渲染冲突检测详情 */
  const renderConflictDetectedDetail = (conflict: ConflictDetectedPayload) => (
    <div className={styles.detailSection}>
      <div
        className={`${styles.detailLabel} ${styles.conflictHeader}`}
        onClick={() => toggleSection('conflictDetected')}
        style={{ cursor: 'pointer' }}
      >
        <Icon name={expandedSections.has('conflictDetected') ? 'chevron-down' : 'chevron-right'} size={12} />
        <Icon name="warning" size={14} className={styles.warningIcon} />
        <span style={{ marginLeft: 4 }}>冲突检测</span>
        {conflict.resolution && (
          <span className={`${styles.resolutionBadge} ${styles[conflict.resolution]}`}>
            {conflict.resolution === 'auto' ? '自动解决' :
             conflict.resolution === 'manual' ? '手动解决' :
             conflict.resolution === 'priority' ? '优先级解决' : '时间戳解决'}
          </span>
        )}
      </div>
      {expandedSections.has('conflictDetected') && (
        <div className={styles.conflictDetail}>
          <div className={styles.conflictDescription}>
            <span className={styles.detailSubLabel}>冲突类型:</span>
            <span className={styles.conflictType}>{conflict.conflictType}</span>
          </div>
          <div className={styles.conflictDescription}>
            <span className={styles.detailSubLabel}>描述:</span>
            <span>{conflict.description}</span>
          </div>
          <div className={styles.conflictingParties}>
            <span className={styles.detailSubLabel}>冲突方:</span>
            <div className={styles.partyTags}>
              {conflict.conflictingParties.map((party, index) => (
                <span key={index} className={styles.partyTag}>{party}</span>
              ))}
            </div>
          </div>
          {conflict.conflictingData && (
            <div className={styles.codeSection}>
              <div className={styles.codeHeader}>
                <span>冲突数据</span>
                <button
                  className={styles.copyButton}
                  onClick={() => copyToClipboard(formatJSON(conflict.conflictingData))}
                >
                  <Icon name="copy" size={12} />
                </button>
              </div>
              <pre className={styles.codeBlock}>{formatJSON(conflict.conflictingData)}</pre>
            </div>
          )}
          {conflict.resolution && (
            <div className={styles.resolutionInfo}>
              <span className={styles.detailSubLabel}>解决方案:</span>
              <span>{conflict.resolution}</span>
              {conflict.resolvedBy && (
                <span style={{ marginLeft: 8 }}>by {conflict.resolvedBy}</span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );

  /** 渲染消息详情 */
  const renderMessageDetail = (message: AgentMessageRecord) => (
    <div className={styles.detailContent}>
      {/* 基本信息 */}
      <div className={styles.detailSection}>
        <div
          className={styles.detailLabel}
          onClick={() => toggleSection('basic')}
          style={{ cursor: 'pointer' }}
        >
          <Icon name={expandedSections.has('basic') ? 'chevron-down' : 'chevron-right'} size={12} />
          <span style={{ marginLeft: 4 }}>基本信息</span>
        </div>
        {expandedSections.has('basic') && (
          <div className={styles.detailGrid}>
            <div>
              <span className={styles.detailSubLabel}>发送者:</span> {message.from}
            </div>
            <div>
              <span className={styles.detailSubLabel}>接收者:</span> {message.to}
            </div>
            <div>
              <span className={styles.detailSubLabel}>类型:</span> {renderMessageType(message.type)}
            </div>
            <div>
              <span className={styles.detailSubLabel}>动作:</span> {message.action}
            </div>
            <div>
              <span className={styles.detailSubLabel}>状态:</span>
              <span className={`${styles.itemStatus} ${
                message.status === 'sent' ? styles.info :
                message.status === 'received' ? styles.success : styles.error
              }`}>
                {message.status === 'sent' ? '发送' : message.status === 'received' ? '接收' : '错误'}
              </span>
            </div>
            <div>
              <span className={styles.detailSubLabel}>时间:</span> {formatTime(message.timestamp)}
            </div>
          </div>
        )}
      </div>

      {/* Tool 调用信息 */}
      {message.toolCall && renderToolCallDetail(message.toolCall)}

      {/* Tool 响应信息 */}
      {message.toolResponse && renderToolResponseDetail(message.toolResponse)}

      {/* 上下文变更信息 */}
      {message.contextChange && renderContextChangeDetail(message.contextChange)}

      {/* 冲突检测信息 */}
      {message.conflictDetected && renderConflictDetectedDetail(message.conflictDetected)}

      {/* Payload */}
      {message.payload && !message.toolCall && !message.toolResponse && !message.contextChange && !message.conflictDetected && (
        <div className={styles.detailSection}>
          <div
            className={styles.detailLabel}
            onClick={() => toggleSection('payload')}
            style={{ cursor: 'pointer' }}
          >
            <Icon name={expandedSections.has('payload') ? 'chevron-down' : 'chevron-right'} size={12} />
            <span style={{ marginLeft: 4 }}>Payload</span>
            <button
              className={styles.copyButton}
              onClick={(e) => {
                e.stopPropagation();
                copyToClipboard(formatJSON(message.payload));
              }}
              style={{ marginLeft: 'auto' }}
            >
              <Icon name="copy" size={12} />
            </button>
          </div>
          {expandedSections.has('payload') && (
            <pre className={styles.codeBlock}>{formatJSON(message.payload)}</pre>
          )}
        </div>
      )}

      {/* 错误信息 */}
      {message.error && (
        <div className={styles.detailSection}>
          <div className={styles.errorHeader}>
            <Icon name="alert-circle" size={14} />
            <span>错误信息</span>
          </div>
          <pre className={styles.errorBlock}>{message.error}</pre>
        </div>
      )}
    </div>
  );

  return (
    <div className={styles.tabContent} style={{ padding: 0 }}>
      {/* 工具栏 */}
      <div className={styles.toolbar}>
        <div className={styles.connectionStatus}>
          <span className={`${styles.statusDot} ${wsConnection.connected ? styles.connected : styles.disconnected}`} />
          <span>{wsConnection.connected ? '已连接' : wsConnection.reconnecting ? '重连中...' : '未连接'}</span>
        </div>
        <button className={styles.clearButton} onClick={handleClearMessages}>
          清空
        </button>
      </div>

      {/* 过滤器栏 */}
      <div className={styles.filterBar}>
        <select
          className={styles.filterSelect}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          {MESSAGE_TYPE_FILTERS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <select
          className={styles.filterSelect}
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
        >
          {SOURCE_FILTERS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="搜索消息..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* 消息列表 */}
      <div className={styles.listContainer}>
        <div className={styles.listHeader}>
          <span>消息流</span>
          <span className={styles.count}>
            {filteredMessages.length}
            {filteredMessages.length !== agentMessages.length && ` / ${agentMessages.length}`}
          </span>
        </div>
        <div className={styles.list}>
          {filteredMessages.length === 0 ? (
            <div className={styles.empty}>
              {agentMessages.length === 0 ? '暂无消息记录' : '没有匹配的消息'}
            </div>
          ) : (
            filteredMessages
              .slice()
              .reverse()
              .map((message) => (
                <div
                  key={message.id}
                  className={`${styles.listItem} ${selectedId === message.id ? styles.selected : ''}`}
                  onClick={() => setSelectedId(message.id)}
                >
                  <div className={styles.itemHeader}>
                    <span className={styles.itemTime}>{formatTime(message.timestamp)}</span>
                    {renderMessageType(message.type)}
                  </div>
                  <div className={styles.messageFlow}>
                    <span className={styles.messageFrom}>{message.from}</span>
                    <Icon name="chevron-right" size={12} />
                    <span className={styles.messageTo}>{message.to}</span>
                  </div>
                  <div className={styles.itemFooter}>
                    <span>{message.action}</span>
                    {message.toolCall && (
                      <span className={styles.toolHint}>
                        <Icon name="tool" size={10} /> {message.toolCall.toolType}
                      </span>
                    )}
                    {message.toolResponse && (
                      <span className={`${styles.toolHint} ${message.toolResponse.success ? '' : styles.error}`}>
                        <Icon name={message.toolResponse.success ? 'check-circle' : 'x-circle'} size={10} />
                        {' '}{message.toolResponse.toolType}
                      </span>
                    )}
                    {message.contextChange && (
                      <span className={styles.toolHint}>
                        <Icon name="edit" size={10} /> {message.contextChange.path}
                      </span>
                    )}
                    {message.conflictDetected && (
                      <span className={`${styles.toolHint} ${styles.warning}`}>
                        <Icon name="alert-triangle" size={10} /> {message.conflictDetected.conflictType}
                      </span>
                    )}
                  </div>
                </div>
              ))
          )}
        </div>
      </div>

      {/* 消息详情 */}
      {selectedMessage && (
        <div className={styles.detailContainer}>
          <div className={styles.detailHeader}>
            <span>消息详情</span>
            <button className={styles.closeButton} onClick={() => setSelectedId(null)}>
              <Icon name="close" size={14} />
            </button>
          </div>
          {renderMessageDetail(selectedMessage)}
        </div>
      )}
    </div>
  );
};
