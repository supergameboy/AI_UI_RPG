import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { DynamicUIComponentProps } from './types';
import styles from './TooltipComponent.module.css';

/**
 * 悬浮提示组件
 * 
 * 内联格式: [文本](tooltip:提示内容)
 * 
 * 示例:
 * [火焰之剑](tooltip:一把燃烧着烈焰的魔法剑，攻击力+50)
 */
export const TooltipComponent: React.FC<DynamicUIComponentProps> = ({
  content,
  attrs,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState<'top' | 'bottom'>('top');
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // 提示内容
  const tooltipText = attrs.text || attrs.tooltip || content;
  const displayText = content;

  // 检查位置
  const checkPosition = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceAbove = rect.top;
      const spaceBelow = window.innerHeight - rect.bottom;
      
      // 如果上方空间不足，显示在下方
      if (spaceAbove < 100 && spaceBelow > spaceAbove) {
        setPosition('bottom');
      } else {
        setPosition('top');
      }
    }
  }, []);

  // 显示提示
  const showTooltip = useCallback(() => {
    checkPosition();
    setIsVisible(true);
  }, [checkPosition]);

  // 隐藏提示
  const hideTooltip = useCallback(() => {
    setIsVisible(false);
  }, []);

  // 键盘支持
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      hideTooltip();
    }
  }, [hideTooltip]);

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node) &&
        tooltipRef.current &&
        !tooltipRef.current.contains(e.target as Node)
      ) {
        hideTooltip();
      }
    };

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isVisible, hideTooltip]);

  return (
    <span
      ref={triggerRef}
      className={styles.wrapper}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-describedby={isVisible ? 'tooltip-content' : undefined}
    >
      <span className={styles.trigger}>{displayText}</span>
      {isVisible && (
        <div
          ref={tooltipRef}
          id="tooltip-content"
          className={[styles.tooltip, styles[position]].filter(Boolean).join(' ')}
          role="tooltip"
        >
          <div className={styles.content}>{tooltipText}</div>
          <div className={styles.arrow} />
        </div>
      )}
    </span>
  );
};

export default TooltipComponent;
