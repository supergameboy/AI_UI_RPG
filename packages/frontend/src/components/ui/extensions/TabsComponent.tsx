import React, { useState, useMemo } from 'react';
import styles from './TabsComponent.module.css';
import type { ExtensionComponentProps } from './types';

interface ParsedTab {
  label: string;
  id: string;
}

interface TabsComponentProps extends ExtensionComponentProps {
  rawContent?: string;
  defaultTab?: string;
}

function parseTabsFromContent(content: string): ParsedTab[] {
  const tabs: ParsedTab[] = [];
  const linkRegex = /\[([^\]]+)\]\(tab:([^)\s]+)\)/g;
  let match;
  
  while ((match = linkRegex.exec(content)) !== null) {
    tabs.push({
      label: match[1],
      id: match[2],
    });
  }
  
  return tabs;
}

export const TabsComponent: React.FC<TabsComponentProps> = ({
  rawContent = '',
  defaultTab,
  onAction,
  context,
}) => {
  const tabs = useMemo(() => parseTabsFromContent(rawContent), [rawContent]);
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    onAction?.(`tab:${tabId}`, context);
  };

  if (tabs.length === 0) {
    return null;
  }

  return (
    <div className={styles.tabsContainer}>
      <div className={styles.tabsList}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`${styles.tabButton} ${activeTab === tab.id ? styles.active : ''}`}
            onClick={() => handleTabClick(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};
