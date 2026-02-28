import React, { useState } from 'react';
import styles from './Panel.module.css';

export interface PanelProps {
  title?: string;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  closable?: boolean;
  onClose?: () => void;
  footer?: React.ReactNode;
  className?: string;
}

export const Panel: React.FC<PanelProps> = ({
  title,
  children,
  collapsible = false,
  defaultCollapsed = false,
  closable = false,
  onClose,
  footer,
  className,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  const handleToggle = () => {
    if (collapsible) {
      setIsCollapsed(!isCollapsed);
    }
  };

  return (
    <div className={[styles.panel, isCollapsed && styles.collapsed, className].filter(Boolean).join(' ')}>
      {title && (
        <div 
          className={[styles.header, collapsible && styles.clickable].filter(Boolean).join(' ')}
          onClick={handleToggle}
        >
          <h3 className={styles.title}>{title}</h3>
          <div className={styles.actions}>
            {collapsible && (
              <span className={styles.toggleIcon}>
                {isCollapsed ? '▶' : '▼'}
              </span>
            )}
            {closable && (
              <button className={styles.closeButton} onClick={onClose}>
                ✕
              </button>
            )}
          </div>
        </div>
      )}
      {!isCollapsed && (
        <>
          <div className={styles.content}>{children}</div>
          {footer && <div className={styles.footer}>{footer}</div>}
        </>
      )}
    </div>
  );
};
