import React, { useState } from 'react';
import { Button, Icon, ConfirmDialog } from '../common';
import { useGameStore, useThemeStore, useUIStore } from '../../stores';
import styles from './Header.module.css';

export const Header: React.FC = () => {
  const { returnToMenu, openSettings } = useGameStore();
  const { theme, toggleTheme } = useThemeStore();
  const { isDeveloperMode, toggleDeveloperMode } = useUIStore();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleReturnClick = () => {
    setShowConfirm(true);
  };

  const handleConfirmReturn = () => {
    setShowConfirm(false);
    returnToMenu();
  };

  const handleCancelReturn = () => {
    setShowConfirm(false);
  };

  return (
    <>
      <header className={styles.header}>
        <div className={styles.left}>
          <Button 
            variant="ghost" 
            size="small" 
            onClick={handleReturnClick}
            icon={<Icon name="chevron-left" size={16} />}
          >
            返回
          </Button>
          <span className={styles.title}>AI-RPG Engine</span>
        </div>

        <div className={styles.right}>
          <Button 
            variant="ghost" 
            size="small" 
            onClick={toggleTheme}
            icon={<Icon name={theme === 'dark' ? 'sun' : 'moon'} size={18} />}
            title={theme === 'dark' ? '切换到亮色模式' : '切换到暗色模式'}
          />
          <Button 
            variant="ghost" 
            size="small" 
            onClick={toggleDeveloperMode}
            icon={<Icon name="developer" size={18} />}
            title="开发者工具"
            className={isDeveloperMode ? styles.active : ''}
          />
          <Button 
            variant="ghost" 
            size="small" 
            onClick={openSettings}
            icon={<Icon name="settings" size={18} />}
            title="设置"
          />
        </div>
      </header>

      {showConfirm && (
        <ConfirmDialog
          title="返回主菜单"
          message="确定要返回主菜单吗？当前游戏进度将会自动保存。"
          confirmText="确定返回"
          cancelText="继续游戏"
          onConfirm={handleConfirmReturn}
          onCancel={handleCancelReturn}
        />
      )}
    </>
  );
};
