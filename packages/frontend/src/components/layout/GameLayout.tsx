import React from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { LeftSidebar } from './LeftSidebar';
import { PanelContainer } from './PanelContainer';
import { StoryDisplay, QuickOptions, ChatInput } from '../game';
import { TemplateSelect } from '../template';
import { useGameStore } from '../../stores';
import styles from './GameLayout.module.css';

export const GameLayout: React.FC = () => {
  const screen = useGameStore((state) => state.screen);

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
    <div className={styles.layout}>
      <Header />
      
      <main className={styles.main}>
        <LeftSidebar />
        <div className={styles.gameArea}>
          <StoryDisplay />
          <QuickOptions />
          <ChatInput />
        </div>
        <PanelContainer />
      </main>
      
      <Footer />
    </div>
  );
};
