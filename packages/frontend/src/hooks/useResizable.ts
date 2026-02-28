import React, { useState, useCallback, useEffect } from 'react';

export interface UseResizableOptions {
  minWidth?: number;
  maxWidth?: number;
  defaultWidth?: number;
  direction?: 'left' | 'right';
  storageKey?: string;
}

export function useResizable({
  minWidth = 150,
  maxWidth = 500,
  defaultWidth = 200,
  direction = 'right',
  storageKey,
}: UseResizableOptions = {}) {
  const getInitialWidth = () => {
    if (storageKey && typeof window !== 'undefined') {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const width = parseInt(stored, 10);
        if (!isNaN(width) && width >= minWidth && width <= maxWidth) {
          return width;
        }
      }
    }
    return defaultWidth;
  };

  const [width, setWidth] = useState(getInitialWidth);
  const [isResizing, setIsResizing] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    setStartX(e.clientX);
    setStartWidth(width);
  }, [width]);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - startX;
      let newWidth: number;
      
      if (direction === 'right') {
        newWidth = startWidth - delta;
      } else {
        newWidth = startWidth + delta;
      }
      
      newWidth = Math.min(maxWidth, Math.max(minWidth, newWidth));
      setWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      if (storageKey) {
        localStorage.setItem(storageKey, width.toString());
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, startX, startWidth, direction, minWidth, maxWidth, storageKey, width]);

  return {
    width,
    isResizing,
    resizerProps: {
      onMouseDown: handleMouseDown,
    },
  };
}
