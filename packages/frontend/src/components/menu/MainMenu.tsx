import React, { useState } from 'react';
import { Button, Icon } from '../common';
import { useGameStore, useThemeStore } from '../../stores';
import styles from './MainMenu.module.css';

export const MainMenu: React.FC = () => {
  const { startNewGame, openSettings, saves, setScreen } = useGameStore();
  const { theme, toggleTheme } = useThemeStore();
  const [showSaveList, setShowSaveList] = useState(false);

  const hasSaves = saves.length > 0;

  const handleContinue = () => {
    if (hasSaves) {
      setShowSaveList(true);
    }
  };

  const handleLoadSave = (saveId: string) => {
    useGameStore.getState().loadGame(saveId);
    setShowSaveList(false);
  };

  const handleQuickStart = () => {
    startNewGame();
    setScreen('game');
  };

  return (
    <div className={styles.container}>
      <div className={styles.background}>
        <div className={styles.overlay} />
      </div>
      
      <div className={styles.content}>
        <div className={styles.header}>
          <h1 className={styles.title}>AI-RPG Engine</h1>
          <p className={styles.subtitle}>AI驱动的通用角色扮演游戏引擎</p>
        </div>

        <nav className={styles.menu}>
          <Button 
            variant="primary" 
            size="large" 
            fullWidth 
            onClick={handleQuickStart}
            icon={<Icon name="play" size={20} />}
          >
            开始新游戏
          </Button>
          
          <Button 
            variant="secondary" 
            size="large" 
            fullWidth 
            onClick={handleContinue}
            disabled={!hasSaves}
            icon={<Icon name="load" size={20} />}
          >
            继续游戏
          </Button>
          
          <Button 
            variant="ghost" 
            size="large" 
            fullWidth 
            onClick={openSettings}
            icon={<Icon name="settings" size={20} />}
          >
            设置
          </Button>
        </nav>

        <div className={styles.footer}>
          <button className={styles.themeToggle} onClick={toggleTheme}>
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={20} />
            <span>{theme === 'dark' ? '亮色模式' : '暗色模式'}</span>
          </button>
          <span className={styles.version}>v0.1.0</span>
        </div>
      </div>

      {showSaveList && (
        <div className={styles.modal} onClick={() => setShowSaveList(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>选择存档</h2>
              <button className={styles.closeButton} onClick={() => setShowSaveList(false)}>
                <Icon name="close" size={20} />
              </button>
            </div>
            <div className={styles.saveList}>
              {saves.map((save) => (
                <button
                  key={save.id}
                  className={styles.saveItem}
                  onClick={() => handleLoadSave(save.id)}
                >
                  <div className={styles.saveInfo}>
                    <span className={styles.saveName}>{save.name}</span>
                    <span className={styles.saveDetails}>
                      {save.chapter} · {save.location} · Lv.{save.level}
                    </span>
                  </div>
                  <span className={styles.saveTime}>
                    {new Date(save.timestamp).toLocaleString('zh-CN')}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
