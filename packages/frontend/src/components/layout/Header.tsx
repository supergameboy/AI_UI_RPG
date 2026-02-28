import React, { useState } from 'react';
import { Button, Icon, ConfirmDialog } from '../common';
import { useGameStore, useThemeStore, useUIStore } from '../../stores';
import styles from './Header.module.css';

export const Header: React.FC = () => {
  const { returnToMenu, openSettings, saveGame, hasUnsavedChanges } = useGameStore();
  const { theme, toggleTheme } = useThemeStore();
  const { isDeveloperMode, toggleDeveloperMode } = useUIStore();
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saving, setSaving] = useState(false);

  const handleReturnClick = () => {
    if (hasUnsavedChanges) {
      setShowConfirm(true);
    } else {
      returnToMenu();
    }
  };

  const handleConfirmReturn = () => {
    setShowConfirm(false);
    returnToMenu();
  };

  const handleCancelReturn = () => {
    setShowConfirm(false);
  };

  const handleSaveClick = () => {
    setShowSaveForm(true);
    const now = new Date();
    setSaveName(`存档 ${now.toLocaleDateString('zh-CN')} ${now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveGame(saveName);
      setShowSaveForm(false);
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleQuickSave = async () => {
    setSaving(true);
    try {
      await saveGame(`快速存档 ${new Date().toLocaleString('zh-CN')}`);
    } catch (error) {
      console.error('Quick save failed:', error);
    } finally {
      setSaving(false);
    }
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

        <div className={styles.center}>
          <Button 
            variant="ghost" 
            size="small" 
            onClick={handleSaveClick}
            icon={<Icon name="save" size={18} />}
            title="保存游戏"
          >
            保存
          </Button>
          <Button 
            variant="ghost" 
            size="small" 
            onClick={handleQuickSave}
            loading={saving}
            icon={<Icon name={saving ? 'loading' : 'save'} size={18} />}
            title="快速存档"
          >
            快速存档
          </Button>
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

      {showSaveForm && (
        <div className={styles.saveFormOverlay} onClick={() => setShowSaveForm(false)}>
          <div className={styles.saveForm} onClick={(e) => e.stopPropagation()}>
            <h3>保存游戏</h3>
            <input
              type="text"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="输入存档名称"
              className={styles.saveInput}
              autoFocus
            />
            <div className={styles.saveActions}>
              <Button variant="ghost" onClick={() => setShowSaveForm(false)}>
                取消
              </Button>
              <Button variant="primary" onClick={handleSave} loading={saving}>
                {saving ? '保存中...' : '保存'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
