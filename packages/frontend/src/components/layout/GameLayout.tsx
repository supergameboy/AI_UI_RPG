import React, { useEffect } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { LeftSidebar } from './LeftSidebar';
import { PanelContainer } from './PanelContainer';
import { StoryDisplay, QuickOptions, ChatInput } from '../game';
import { DeveloperPanel } from '../developer';
import { useDeveloperStore } from '../../stores/developerStore';
import styles from './GameLayout.module.css';

export const GameLayout: React.FC = () => {
  const connectWebSocket = useDeveloperStore((state) => state.connectWebSocket);
  const disconnectWebSocket = useDeveloperStore((state) => state.disconnectWebSocket);
  
  useEffect(() => {
    connectWebSocket();
    
    return () => {
      disconnectWebSocket();
    };
  }, [connectWebSocket, disconnectWebSocket]);
  
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
