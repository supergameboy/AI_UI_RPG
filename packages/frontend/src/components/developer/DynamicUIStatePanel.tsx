import React, { useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { MarkdownRenderer } from '../ui/MarkdownRenderer';
import styles from './DynamicUIStatePanel.module.css';

export const DynamicUIStatePanel: React.FC = () => {
  const dynamicUI = useGameStore((state) => state.dynamicUI);
  const updateGameState = useGameStore((state) => state.updateGameState);
  const [showSource, setShowSource] = useState(false);

  if (!dynamicUI) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>UI</div>
        <p>当前没有动态 UI</p>
        <p className={styles.emptyHint}>使用模拟面板生成动态 UI</p>
      </div>
    );
  }

  const handleClose = () => {
    updateGameState({ dynamicUI: null });
  };

  return (
    <div className={styles.container}>
      <div className={styles.infoSection}>
        <div className={styles.infoItem}>
          <span className={styles.infoLabel}>ID</span>
          <span className={styles.infoValue}>{dynamicUI.id}</span>
        </div>
        {dynamicUI.context && (
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>上下文</span>
            <pre className={styles.contextValue}>
              {JSON.stringify(dynamicUI.context, null, 2)}
            </pre>
          </div>
        )}
      </div>

      <div className={styles.displaySection}>
        <div className={styles.displayHeader}>
          <label className={styles.label}>内容</label>
          <div className={styles.displayActions}>
            <button
              className={styles.toggleButton}
              onClick={() => setShowSource(!showSource)}
            >
              {showSource ? '显示预览' : '显示源码'}
            </button>
            <button
              className={styles.closeButton}
              onClick={handleClose}
            >
              关闭
            </button>
          </div>
        </div>

        <div className={styles.displayContent}>
          {showSource ? (
            <pre className={styles.sourceCode}>{dynamicUI.markdown}</pre>
          ) : (
            <div className={styles.preview}>
              <MarkdownRenderer content={dynamicUI.markdown} />
            </div>
          )}
        </div>
      </div>

      <div className={styles.statsSection}>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>内容长度</span>
          <span className={styles.statValue}>{dynamicUI.markdown.length} 字符</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>行数</span>
          <span className={styles.statValue}>
            {dynamicUI.markdown.split('\n').length} 行
          </span>
        </div>
      </div>
    </div>
  );
};
