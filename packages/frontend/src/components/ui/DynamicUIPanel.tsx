import React, { useCallback, useEffect, useRef } from 'react';
import { MarkdownRenderer } from './MarkdownRenderer';
import styles from './DynamicUIPanel.module.css';
import type { DynamicUIData, DynamicUIType } from './extensions';

export interface DynamicUIPanelProps {
  data: DynamicUIData;
  onAction?: (action: string, data?: unknown) => void;
  onClose?: () => void;
  showOverlay?: boolean;
}

const panelIcons: Record<DynamicUIType, string> = {
  welcome: '🌟',
  notification: '📢',
  dialog: '💬',
  enhancement: '⚒️',
  warehouse: '🏦',
  shop: '🏪',
  custom: '📋',
};

const panelTitles: Record<DynamicUIType, string> = {
  welcome: '欢迎',
  notification: '系统通知',
  dialog: '对话',
  enhancement: '装备强化',
  warehouse: '仓库管理',
  shop: '商店',
  custom: '信息',
};

export const DynamicUIPanel: React.FC<DynamicUIPanelProps> = ({
  data,
  onAction,
  onClose,
  showOverlay = true,
}) => {
  const { type, markdown, context } = data;
  const panelRef = useRef<HTMLDivElement>(null);

  const handleAction = useCallback(
    (action: string, actionData?: unknown) => {
      if (action === 'close') {
        onClose?.();
      } else {
        onAction?.(action, actionData);
      }
    },
    [onAction, onClose]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (panelRef.current) {
      panelRef.current.focus();
    }
  }, []);

  const handleOverlayClick = () => {
    onClose?.();
  };

  const handlePanelClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <>
      {showOverlay && (
        <div className={styles.overlay} onClick={handleOverlayClick} />
      )}
      <div
        ref={panelRef}
        className={`${styles.dynamicUIPanel} ${styles[type]}`}
        onClick={handlePanelClick}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dynamic-ui-title"
      >
        <button
          className={styles.closeButton}
          onClick={() => onClose?.()}
          aria-label="关闭"
        >
          ✕
        </button>
        <div className={styles.panelContent}>
          <div className={styles.panelHeader}>
            <span className={styles.panelIcon}>{panelIcons[type]}</span>
            <h2 id="dynamic-ui-title" className={styles.panelTitle}>
              {panelTitles[type]}
            </h2>
          </div>
          <MarkdownRenderer
            content={markdown}
            onAction={handleAction}
            context={context}
          />
        </div>
      </div>
    </>
  );
};
