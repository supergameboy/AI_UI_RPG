import React, { useEffect, useMemo } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { LeftSidebar } from './LeftSidebar';
import { PanelContainer } from './PanelContainer';
import { StoryDisplay, QuickOptions, ChatInput } from '../game';
import { TemplateSelect } from '../template';
import { DynamicUIPanel } from '../ui';
import { useGameStore } from '../../stores';
import styles from './GameLayout.module.css';

export const GameLayout: React.FC = () => {
  const screen = useGameStore((state) => state.screen);
  const selectedTemplate = useGameStore((state) => state.selectedTemplate);

  const uiTheme = selectedTemplate?.uiTheme;
  const uiLayout = selectedTemplate?.uiLayout;

  const themeStyle = useMemo(() => {
    if (!uiTheme) return {};
    
    const style: React.CSSProperties & Record<string, string> = {};
    
    if (uiTheme.primaryColor) {
      style['--color-primary'] = uiTheme.primaryColor;
    }
    
    if (uiTheme.fontFamily) {
      style.fontFamily = uiTheme.fontFamily;
    }
    
    return style;
  }, [uiTheme]);

  const layoutStyle = useMemo(() => {
    if (!uiLayout) return {};
    
    const style: React.CSSProperties = {};
    
    if (!uiLayout.showMinimap && !uiLayout.showPartyPanel) {
      style.paddingLeft = 0;
    }
    
    return style;
  }, [uiLayout]);

  useEffect(() => {
    if (uiTheme?.primaryColor) {
      document.documentElement.style.setProperty('--color-primary', uiTheme.primaryColor);
    }
    if (uiTheme?.fontFamily) {
      document.documentElement.style.setProperty('--font-family', uiTheme.fontFamily);
    }
    
    return () => {
      document.documentElement.style.removeProperty('--color-primary');
      document.documentElement.style.removeProperty('--font-family');
    };
  }, [uiTheme]);

  if (screen === 'template-select') {
    return (
      <div className={styles.layout}>
        <Header />
        <main className={styles.main} style={{ padding: 'var(--spacing-lg)' }}>
          <TemplateSelect />
        </main>
        <Footer />
      </div>
    );
  }
  
  return (
    <div className={styles.layout} style={themeStyle}>
      <Header />
      
      <main className={styles.main}>
        {uiLayout?.showMinimap !== false && uiLayout?.showPartyPanel !== false && <LeftSidebar />}
        <div className={styles.gameArea} style={layoutStyle}>
          <StoryDisplay />
          <QuickOptions />
          <ChatInput />
        </div>
        <PanelContainer />
      </main>
      
      <Footer />
      
      <DynamicUIPanel title="动态界面" />
    </div>
  );
};
