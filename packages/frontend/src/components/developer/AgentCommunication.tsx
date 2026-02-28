import React, { useState } from 'react';
import { useDeveloperStore } from '../../stores';
import { Icon } from '../common';
import styles from './DeveloperPanel.module.css';

export const AgentCommunication: React.FC = () => {
  const { agentMessages, wsConnection, clearAgentMessages } = useDeveloperStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedMessage = agentMessages.find((m) => m.id === selectedId);

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('zh-CN');
  };

  const handleClearMessages = async () => {
    try {
      await fetch('http://localhost:6756/api/logs/agents', { method: 'DELETE' });
      clearAgentMessages();
    } catch (error) {
      console.error('Failed to clear agent messages:', error);
    }
  };

  return (
    <div className={styles.tabContent}>
      <div className={styles.toolbar}>
        <div className={styles.connectionStatus}>
          <span className={`${styles.statusDot} ${wsConnection.connected ? styles.connected : styles.disconnected}`} />
          <span>{wsConnection.connected ? '已连接' : wsConnection.reconnecting ? '重连中...' : '未连接'}</span>
        </div>
        <button className={styles.clearButton} onClick={handleClearMessages}>
          清空
        </button>
      </div>
      <div className={styles.listContainer}>
        <div className={styles.listHeader}>
          <span>消息流</span>
          <span className={styles.count}>{agentMessages.length}</span>
        </div>
        <div className={styles.list}>
          {agentMessages.length === 0 ? (
            <div className={styles.empty}>暂无消息记录</div>
          ) : (
            agentMessages
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
                    <span
                      className={`${styles.itemStatus} ${
                        message.status === 'sent'
                          ? styles.info
                          : message.status === 'received'
                          ? styles.success
                          : styles.error
                      }`}
                    >
                      {message.status === 'sent' ? '发送' : message.status === 'received' ? '接收' : '错误'}
                    </span>
                  </div>
                  <div className={styles.messageFlow}>
                    <span className={styles.messageFrom}>{message.from}</span>
                    <Icon name="chevron-right" size={12} />
                    <span className={styles.messageTo}>{message.to}</span>
                  </div>
                  <div className={styles.itemFooter}>
                    <span>{message.type}</span>
                    <span>{message.action}</span>
                  </div>
                </div>
              ))
          )}
        </div>
      </div>

      {selectedMessage && (
        <div className={styles.detailContainer}>
          <div className={styles.detailHeader}>
            <span>消息详情</span>
            <button className={styles.closeButton} onClick={() => setSelectedId(null)}>
              <Icon name="close" size={14} />
            </button>
          </div>
          <div className={styles.detailContent}>
            <div className={styles.detailSection}>
              <div className={styles.detailLabel}>基本信息</div>
              <div className={styles.detailGrid}>
                <div>发送者: {selectedMessage.from}</div>
                <div>接收者: {selectedMessage.to}</div>
                <div>类型: {selectedMessage.type}</div>
                <div>动作: {selectedMessage.action}</div>
                <div>状态: {selectedMessage.status}</div>
              </div>
            </div>

            {selectedMessage.payload && (
              <div className={styles.detailSection}>
                <div className={styles.detailLabel}>Payload</div>
                <pre className={styles.codeBlock}>
                  {JSON.stringify(selectedMessage.payload, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
