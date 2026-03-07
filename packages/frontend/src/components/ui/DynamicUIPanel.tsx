import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { MarkdownRenderer } from './MarkdownRenderer';
import styles from './DynamicUIPanel.module.css';

interface Position {
  x: number;
  y: number;
}

interface Size {
  width: number;
  height: number;
}

interface DynamicUIPanelProps {
  title?: string;
  initialPosition?: Position;
  initialSize?: Size;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
}

/**
 * 窗口化的动态 UI 面板组件
 * 
 * 支持功能：
 * - 拖拽移动窗口位置
 * - 缩放调整窗口大小
 * - 关闭窗口
 * - 渲染 Markdown 动态 UI 内容
 */
export const DynamicUIPanel: React.FC<DynamicUIPanelProps> = ({
  title = '动态界面',
  initialPosition = { x: 100, y: 100 },
  initialSize = { width: 400, height: 300 },
  minWidth = 200,
  minHeight = 150,
  maxWidth = 800,
  maxHeight = 600,
}) => {
  const dynamicUI = useGameStore((state) => state.dynamicUI);
  const sendDynamicUIAction = useGameStore((state) => state.sendDynamicUIAction);
  
  // 窗口状态
  const [position, setPosition] = useState<Position>(initialPosition);
  const [size, setSize] = useState<Size>(initialSize);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  
  // 拖拽偏移量
  const dragOffset = useRef<Position>({ x: 0, y: 0 });
  const resizeStart = useRef<{ position: Position; size: Size; mouse: Position }>({
    position: { x: 0, y: 0 },
    size: { width: 0, height: 0 },
    mouse: { x: 0, y: 0 },
  });
  
  // 处理拖拽开始
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return; // 只响应左键
    e.preventDefault();
    setIsDragging(true);
    dragOffset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  }, [position]);
  
  // 处理缩放开始
  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    resizeStart.current = {
      position,
      size,
      mouse: { x: e.clientX, y: e.clientY },
    };
  }, [position, size]);
  
  // 处理鼠标移动
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newX = e.clientX - dragOffset.current.x;
        const newY = e.clientY - dragOffset.current.y;
        setPosition({
          x: Math.max(0, newX),
          y: Math.max(0, newY),
        });
      } else if (isResizing) {
        const deltaX = e.clientX - resizeStart.current.mouse.x;
        const deltaY = e.clientY - resizeStart.current.mouse.y;
        const newWidth = Math.min(maxWidth, Math.max(minWidth, resizeStart.current.size.width + deltaX));
        const newHeight = Math.min(maxHeight, Math.max(minHeight, resizeStart.current.size.height + deltaY));
        setSize({ width: newWidth, height: newHeight });
      }
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };
    
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, minWidth, minHeight, maxWidth, maxHeight]);
  
  // 处理关闭
  const handleClose = useCallback(() => {
    setIsVisible(false);
    sendDynamicUIAction('close', { dynamicUIId: dynamicUI?.id });
  }, [sendDynamicUIAction, dynamicUI?.id]);
  
  // 处理用户操作
  const handleAction = useCallback((action: { type: string; payload?: unknown }) => {
    sendDynamicUIAction(action.type, { dynamicUIId: dynamicUI?.id }, action.payload);
  }, [sendDynamicUIAction, dynamicUI?.id]);
  
  // 当 dynamicUI 变化时重新显示
  // eslint-disable-next-line react-hooks/exhaustive-deps
  // 仅在 dynamicUI.id 变化时重置可见性，不需要依赖整个 dynamicUI 对象
  useEffect(() => {
    if (dynamicUI?.id) {
      setIsVisible(true);
      // 重置窗口位置到屏幕中央
      setPosition(initialPosition);
      setSize(initialSize);
    }
  }, [dynamicUI?.id]);
  
  // 如果没有动态 UI 或不可见，不渲染
  if (!dynamicUI || !isVisible) {
    return null;
  }
  
  return (
    <div
      className={styles.panel}
      style={{
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
      }}
      role="dialog"
      aria-label={title}
      aria-modal="false"
    >
      {/* 标题栏 */}
      <div 
        className={styles.header} 
        onMouseDown={handleMouseDown}
        role="titlebar"
      >
        <span className={styles.title}>{(dynamicUI.context?.title as string) || title}</span>
        <button
          className={styles.closeButton}
          onClick={handleClose}
          aria-label="关闭"
          type="button"
        >
          ×
        </button>
      </div>
      
      {/* 内容区 */}
      <div className={styles.content}>
        <MarkdownRenderer
          content={dynamicUI.markdown}
          onAction={handleAction}
          context={dynamicUI.context}
        />
      </div>
      
      {/* 缩放手柄 */}
      <div
        className={styles.resizeHandle}
        onMouseDown={handleResizeMouseDown}
        aria-label="调整窗口大小"
      />
    </div>
  );
};

export default DynamicUIPanel;
