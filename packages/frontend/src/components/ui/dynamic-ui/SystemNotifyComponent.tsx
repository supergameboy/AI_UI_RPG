import React, { useMemo, useState, useCallback } from 'react';
import type { DynamicUIComponentProps, NotifyType } from './types';
import { MarkdownRenderer } from '../MarkdownRenderer';
import styles from './SystemNotifyComponent.module.css';

/**
 * 系统通知组件
 * 
 * 解析格式: {type=welcome|achievement|warning|error|info}
 * 
 * 示例:
 * :::notify{type=achievement}
 * 恭喜！你获得了"初次胜利"成就！
 * :::
 */
export const SystemNotifyComponent: React.FC<DynamicUIComponentProps> = ({
  content,
  attrs,
  onAction,
  onDismiss,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const type = (attrs.type as NotifyType) || 'info';
  const title = attrs.title || '';
  const dismissible = attrs.dismissible === 'true';

  // 处理关闭逻辑
  const handleDismiss = useCallback(() => {
    setIsVisible(false);
    if (onDismiss) {
      onDismiss();
    } else if (onAction) {
      onAction({ type: 'dismiss', payload: { notifyId: attrs.id } });
    }
  }, [onDismiss, onAction, attrs.id]);

  // 如果不可见，不渲染
  if (!isVisible) {
    return null;
  }

  // 获取图标
  const icon = useMemo(() => {
    switch (type) {
      case 'welcome':
        return '👋';
      case 'achievement':
        return '🏆';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      case 'info':
      default:
        return 'ℹ️';
    }
  }, [type]);

  // 获取标题
  const displayTitle = useMemo(() => {
    if (title) return title;
    switch (type) {
      case 'welcome':
        return '欢迎';
      case 'achievement':
        return '成就解锁';
      case 'warning':
        return '警告';
      case 'error':
        return '错误';
      case 'info':
      default:
        return '提示';
    }
  }, [type, title]);

  return (
    <div
      className={[styles.container, styles[type]].filter(Boolean).join(' ')}
      role="alert"
      aria-live="polite"
    >
      <div className={styles.iconWrapper}>
        <span className={styles.icon} aria-hidden="true">
          {icon}
        </span>
      </div>
      <div className={styles.content}>
        <div className={styles.title}>{displayTitle}</div>
        <div className={styles.message}>
          <MarkdownRenderer content={content.trim()} onAction={onAction} />
        </div>
      </div>
      {dismissible && (
        <button
          type="button"
          className={styles.dismiss}
          aria-label="关闭通知"
          onClick={handleDismiss}
        >
          ×
        </button>
      )}
    </div>
  );
};

export default SystemNotifyComponent;
