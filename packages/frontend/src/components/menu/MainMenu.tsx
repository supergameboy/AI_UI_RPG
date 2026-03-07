import React, { useEffect, useState } from 'react';
import { Button, Icon, ConfirmDialog } from '../common';
import { SaveManager } from '../save';
import { useGameStore, useThemeStore, useSettingsStore } from '../../stores';
import { mockGameService } from '../../services/mockGameService';
import type { QuestState } from '../../stores/gameStore';
import styles from './MainMenu.module.css';

/**
 * 简单的日志工具
 */
const gameLog = {
  debug: (category: string, message: string, data?: unknown) => {
    if (import.meta.env.DEV) {
      console.debug(`[${category}] ${message}`, data ?? '');
    }
  },
  info: (category: string, message: string, data?: unknown) => {
    if (import.meta.env.DEV) {
      console.log(`[${category}] ${message}`, data ?? '');
    }
  },
  warn: (category: string, message: string, data?: unknown) => {
    console.warn(`[${category}] ${message}`, data ?? '');
  },
  error: (category: string, message: string, data?: unknown) => {
    console.error(`[${category}] ${message}`, data ?? '');
  },
};

export const MainMenu: React.FC = () => {
  const { openSettings, openTemplateManager, saves, fetchSaves, loadGame, setScreen, updateGameState, setNotification, clearNotification } = useGameStore();
  const { theme, toggleTheme } = useThemeStore();
  const { settings } = useSettingsStore();
  const [showSaveManager, setShowSaveManager] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const developerMode = settings.developer.developerMode;

  useEffect(() => {
    fetchSaves();
  }, [fetchSaves]);

  const handleContinue = () => {
    setShowSaveManager(true);
  };

  const handleLoadSave = async (save: Parameters<typeof loadGame>[0]) => {
    await loadGame(save);
    setShowSaveManager(false);
  };

  const handleQuickStart = () => {
    setScreen('template-select');
  };

  const handleDevModeGame = () => {
    try {
      // 1. 加载模拟数据
      const mockData = mockGameService.loadMockData();
      
      // 2. 转换数据格式以匹配 GameState
      // 转换角色数据
      const characterState = {
        id: mockData.character.id,
        name: mockData.character.name,
        race: mockData.character.race,
        class: mockData.character.class,
        level: mockData.character.level,
        health: mockData.character.derivedAttributes.currentHp,
        maxHealth: mockData.character.derivedAttributes.maxHp,
        mana: mockData.character.derivedAttributes.currentMp,
        maxMana: mockData.character.derivedAttributes.maxMp,
        attributes: {
          strength: mockData.character.baseAttributes.strength,
          dexterity: mockData.character.baseAttributes.dexterity,
          constitution: mockData.character.baseAttributes.constitution,
          intelligence: mockData.character.baseAttributes.intelligence,
          wisdom: mockData.character.baseAttributes.wisdom,
          charisma: mockData.character.baseAttributes.charisma,
        },
      };
      
      // 3. 更新游戏状态
      updateGameState({
        character: characterState,
        skills: mockData.skills,
        inventory: mockData.inventory,
        equipment: mockData.equipment,
        mapData: mockData.map,
        journalEntries: mockData.journalEntries,
        dynamicUI: mockData.dynamicUI,
        quests: mockData.quests as QuestState[],
        npcs: mockData.npcs,
        npcRelationships: mockData.npcRelationships,
        combat: mockData.combat,
        globalContext: mockData.globalContext,
        dialogueOptions: mockData.dialogueOptions,
        currentLocation: mockData.globalContext?.player?.location || '未知地点',
        currentScene: '模拟场景',
        templateId: 'mock-template',
        gameMode: 'text_adventure',
      });
      
      // 4. 切换到游戏界面
      setScreen('game');
      
      // 5. 显示通知
      setNotification({
        type: 'success',
        message: '已加载模拟数据',
      });
      
      // 3秒后自动关闭通知
      setTimeout(() => {
        clearNotification();
      }, 3000);
      
    } catch (error) {
      gameLog.error('frontend', '加载模拟数据失败', { error: error instanceof Error ? error.message : String(error) });
      setNotification({
        type: 'error',
        message: '加载模拟数据失败',
      });
      setTimeout(() => {
        clearNotification();
      }, 3000);
    }
  };

  const handleSaveManagerClose = () => {
    setShowSaveManager(false);
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
          
          {developerMode && (
            <Button 
              variant="secondary" 
              size="large" 
              fullWidth 
              onClick={handleDevModeGame}
              icon={<Icon name="developer" size={20} />}
            >
              模拟游戏界面
            </Button>
          )}
          
          <Button 
            variant="secondary" 
            size="large" 
            fullWidth 
            onClick={handleContinue}
            icon={<Icon name="load" size={20} />}
          >
            继续游戏
          </Button>
          
          <Button 
            variant="ghost" 
            size="large" 
            fullWidth 
            onClick={openTemplateManager}
            icon={<Icon name="folder" size={20} />}
          >
            模板管理
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

        {saves.length > 0 && (
          <div className={styles.recentSave}>
            <span className={styles.recentLabel}>最近存档：</span>
            <button 
              className={styles.recentBtn}
              onClick={() => setShowConfirm(true)}
            >
              <span className={styles.recentName}>{saves[0].name}</span>
              <span className={styles.recentTime}>
                {new Date(saves[0].timestamp * 1000).toLocaleString('zh-CN')}
              </span>
            </button>
          </div>
        )}

        <div className={styles.footer}>
          <button className={styles.themeToggle} onClick={toggleTheme}>
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={20} />
            <span>{theme === 'dark' ? '亮色模式' : '暗色模式'}</span>
          </button>
          <span className={styles.version}>v0.4.0</span>
        </div>
      </div>

      {showSaveManager && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <SaveManager
              mode="load"
              onClose={handleSaveManagerClose}
              onLoad={handleLoadSave}
            />
          </div>
        </div>
      )}

      <ConfirmDialog
        open={showConfirm}
        title="加载最近存档"
        message={`确定要加载存档"${saves[0]?.name}"吗？`}
        confirmText="加载"
        cancelText="取消"
        onConfirm={async () => {
          if (saves[0]) {
            const saveData = await import('../../services/saveService').then(m => m.saveService.getSave(saves[0].id));
            await loadGame(saveData);
          }
          setShowConfirm(false);
        }}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
};
