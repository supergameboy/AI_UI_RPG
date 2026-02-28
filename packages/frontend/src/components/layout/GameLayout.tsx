import React from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { LeftSidebar } from './LeftSidebar';
import { PanelContainer } from './PanelContainer';
import { StoryDisplay, QuickOptions, ChatInput } from '../game';
import { DeveloperPanel } from '../developer';
import styles from './GameLayout.module.css';

export const GameLayout: React.FC = () => {
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
      <DeveloperPanel />
    </div>
  );
};
