import React, { useMemo, useRef, useEffect, useCallback } from 'react';
import type { DynamicUIComponentProps, DialogueMessage } from './types';
import styles from './DialogueHistoryComponent.module.css';

/**
 * 对话历史记录组件
 * 
 * 解析格式:
 * {maxMessages=50 showTimestamp=true}
 * 
 * 示例:
 * :::dialogue-history{maxMessages=50 showTimestamp=true}
 * [村长](speaker:npc time=1234567890)
 * 欢迎来到我们的村庄，勇敢的冒险者！
 * [玩家](speaker:player time=1234567895)
 * 你好，我听说这里有些麻烦？
 * [村长](speaker:npc time=1234567900)
 * 是的，最近有哥布林在附近出没...
 * :::
 */
export const DialogueHistoryComponent: React.FC<DynamicUIComponentProps> = ({
  content,
  attrs,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // 解析属性
  const maxMessages = useMemo(() => {
    const v = parseInt(attrs.maxMessages || '50', 10);
    return isNaN(v) ? 50 : Math.min(100, Math.max(10, v));
  }, [attrs.maxMessages]);

  const showTimestamp = attrs.showTimestamp !== 'false';

  // 解析对话消息
  const messages = useMemo<DialogueMessage[]>(() => {
    const result: DialogueMessage[] = [];
    const lines = content.split('\n');
    let currentMessage: Partial<DialogueMessage> | null = null;
    let contentLines: string[] = [];

    for (const line of lines) {
      // 匹配说话者行: [名字](speaker:type time=timestamp)
      const speakerMatch = line.match(/\[([^\]]+)\]\(speaker:(\w+)(?:\s+time=(\d+))?\)/);
      if (speakerMatch) {
        // 保存上一条消息
        if (currentMessage && currentMessage.id && currentMessage.speaker && currentMessage.type) {
          result.push({
            id: currentMessage.id,
            speaker: currentMessage.speaker,
            content: contentLines.join('\n').trim(),
            timestamp: currentMessage.timestamp,
            type: currentMessage.type,
          });
        }

        // 开始新消息
        const speakerType = speakerMatch[2] as DialogueMessage['type'];
        currentMessage = {
          id: `msg-${result.length}`,
          speaker: speakerMatch[1],
          type: speakerType,
          timestamp: speakerMatch[3] ? parseInt(speakerMatch[3], 10) : undefined,
        };
        contentLines = [];
        continue;
      }

      // 累积内容
      if (currentMessage) {
        contentLines.push(line);
      }
    }

    // 保存最后一条消息
    if (currentMessage && currentMessage.id && currentMessage.speaker && currentMessage.type) {
      result.push({
        id: currentMessage.id,
        speaker: currentMessage.speaker,
        content: contentLines.join('\n').trim(),
        timestamp: currentMessage.timestamp,
        type: currentMessage.type,
      });
    }

    // 限制消息数量
    return result.slice(-maxMessages);
  }, [content, maxMessages]);

  // 自动滚动到底部
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]);

  // 格式化时间戳
  const formatTime = useCallback((timestamp?: number) => {
    if (!timestamp) return '';
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  }, []);

  // 获取说话者图标
  const getSpeakerIcon = useCallback((type: DialogueMessage['type']) => {
    const icons: Record<DialogueMessage['type'], string> = {
      npc: '👤',
      player: '🎮',
      system: '⚙️',
    };
    return icons[type];
  }, []);

  return (
    <div className={styles.container} role="log" aria-label="对话历史">
      <div className={styles.header}>
        <h3 className={styles.title}>对话记录</h3>
        <span className={styles.count}>{messages.length} 条消息</span>
      </div>

      <div ref={containerRef} className={styles.messageList}>
        {messages.map((message) => (
          <div
            key={message.id}
            className={[styles.message, styles[message.type]].filter(Boolean).join(' ')}
          >
            <div className={styles.messageHeader}>
              <span className={styles.speakerIcon}>{getSpeakerIcon(message.type)}</span>
              <span className={styles.speakerName}>{message.speaker}</span>
              {showTimestamp && message.timestamp && (
                <span className={styles.timestamp}>{formatTime(message.timestamp)}</span>
              )}
            </div>
            <div className={styles.messageContent}>
              {message.content}
            </div>
          </div>
        ))}

        {messages.length === 0 && (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>💬</span>
            <span className={styles.emptyText}>暂无对话记录</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default DialogueHistoryComponent;
