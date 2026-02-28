import React from 'react';
import { TabBar } from './TabBar';
import styles from './Footer.module.css';

export const Footer: React.FC = () => {
  return (
    <footer className={styles.footer}>
      <TabBar />
    </footer>
  );
};
