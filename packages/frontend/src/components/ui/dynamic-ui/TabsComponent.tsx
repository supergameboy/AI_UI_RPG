import React, { useState, useMemo, useCallback } from 'react';
import type { DynamicUIComponentProps, ParsedTab } from './types';
import { parseTabs } from './utils';
import styles from './TabsComponent.module.css';

/**
 * 标签页组件
 * 
 * 解析格式: [标签名](tab:xxx)
 * 
 * 示例:
 * :::tabs
 * [属性](tab:stats)
 * 力量: 10
 * 敏捷: 8
 * [技能](tab:skills)
 * 火球术
 * 冰霜箭
 * :::
 */
export const TabsComponent: React.FC<DynamicUIComponentProps> = ({
  content,
  attrs,
  onAction,
}) => {
  // 解析标签页
  const tabs = useMemo<ParsedTab[]>(() => {
    return parseTabs(content);
  }, [content]);

  // 当前选中的标签
  const [activeTab, setActiveTab] = useState<string>(() => {
    return tabs.length > 0 ? tabs[0].id : '';
  });

  // 处理标签切换
  const handleTabChange = useCallback((tabId: string) => {
    setActiveTab(tabId);
    onAction?.({ type: 'tab-change', payload: { tabId } });
  }, [onAction]);

  // 键盘导航
  const handleKeyDown = useCallback((e: React.KeyboardEvent, currentIndex: number) => {
    let newIndex = currentIndex;
    
    switch (e.key) {
      case 'ArrowLeft':
        newIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
        break;
      case 'ArrowRight':
        newIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0;
        break;
      case 'Home':
        newIndex = 0;
        break;
      case 'End':
        newIndex = tabs.length - 1;
        break;
      default:
        return;
    }
    
    e.preventDefault();
    const newTab = tabs[newIndex];
    if (newTab) {
      handleTabChange(newTab.id);
      // 聚焦到新标签
      const tabElement = document.getElementById(`tab-${newTab.id}`);
      tabElement?.focus();
    }
  }, [tabs, handleTabChange]);

  // 获取当前标签内容
  const activeContent = useMemo(() => {
    const tab = tabs.find(t => t.id === activeTab);
    return tab?.content || '';
  }, [tabs, activeTab]);

  if (tabs.length === 0) {
    return null;
  }

  const layout = attrs.layout || 'top'; // top | left | bottom

  return (
    <div 
      className={[styles.container, styles[layout]].filter(Boolean).join(' ')}
      role="tablist"
      aria-label={attrs.label || '标签页'}
    >
      <div className={styles.tabList}>
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            id={`tab-${tab.id}`}
            type="button"
            className={[
              styles.tab,
              activeTab === tab.id && styles.active,
            ].filter(Boolean).join(' ')}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`tabpanel-${tab.id}`}
            tabIndex={activeTab === tab.id ? 0 : -1}
            onClick={() => handleTabChange(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, index)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div
        className={styles.tabPanel}
        role="tabpanel"
        id={`tabpanel-${activeTab}`}
        aria-labelledby={`tab-${activeTab}`}
        tabIndex={0}
      >
        <div className={styles.tabContent}>
          {activeContent}
        </div>
      </div>
    </div>
  );
};

export default TabsComponent;
