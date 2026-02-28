import React from 'react';
import { Button, Icon, Panel } from '../common';
import { useGameStore, useThemeStore } from '../../stores';
import styles from './Settings.module.css';

export const Settings: React.FC = () => {
  const { closeSettings } = useGameStore();
  const { theme, setTheme } = useThemeStore();

  return (
    <div className={styles.container}>
      <div className={styles.background} onClick={closeSettings} />
      
      <div className={styles.content}>
        <div className={styles.header}>
          <h1>设置</h1>
          <button className={styles.closeButton} onClick={closeSettings}>
            <Icon name="close" size={24} />
          </button>
        </div>

        <div className={styles.sections}>
          <Panel title="外观设置">
            <div className={styles.settingItem}>
              <div className={styles.settingLabel}>
                <span className={styles.settingName}>主题</span>
                <span className={styles.settingDesc}>选择界面主题风格</span>
              </div>
              <div className={styles.themeOptions}>
                <button
                  className={[styles.themeOption, theme === 'dark' && styles.active].filter(Boolean).join(' ')}
                  onClick={() => setTheme('dark')}
                >
                  <Icon name="moon" size={20} />
                  <span>暗色</span>
                </button>
                <button
                  className={[styles.themeOption, theme === 'light' && styles.active].filter(Boolean).join(' ')}
                  onClick={() => setTheme('light')}
                >
                  <Icon name="sun" size={20} />
                  <span>亮色</span>
                </button>
              </div>
            </div>
          </Panel>

          <Panel title="AI设置">
            <div className={styles.settingItem}>
              <div className={styles.settingLabel}>
                <span className={styles.settingName}>LLM配置</span>
                <span className={styles.settingDesc}>配置AI模型和API密钥</span>
              </div>
              <Button variant="secondary" size="small">
                配置
              </Button>
            </div>
          </Panel>

          <Panel title="游戏设置">
            <div className={styles.settingItem}>
              <div className={styles.settingLabel}>
                <span className={styles.settingName}>自动存档</span>
                <span className={styles.settingDesc}>场景切换时自动保存</span>
              </div>
              <label className={styles.toggle}>
                <input type="checkbox" defaultChecked />
                <span className={styles.toggleSlider} />
              </label>
            </div>
            <div className={styles.settingItem}>
              <div className={styles.settingLabel}>
                <span className={styles.settingName}>文本速度</span>
                <span className={styles.settingDesc}>调整文字显示速度</span>
              </div>
              <select className={styles.select}>
                <option value="slow">慢速</option>
                <option value="normal" selected>正常</option>
                <option value="fast">快速</option>
                <option value="instant">即时</option>
              </select>
            </div>
          </Panel>

          <Panel title="开发者选项">
            <div className={styles.settingItem}>
              <div className={styles.settingLabel}>
                <span className={styles.settingName}>开发者模式</span>
                <span className={styles.settingDesc}>显示调试面板和日志</span>
              </div>
              <label className={styles.toggle}>
                <input type="checkbox" />
                <span className={styles.toggleSlider} />
              </label>
            </div>
          </Panel>
        </div>

        <div className={styles.footer}>
          <Button variant="primary" onClick={closeSettings}>
            保存并返回
          </Button>
        </div>
      </div>
    </div>
  );
};
