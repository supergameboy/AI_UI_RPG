import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Icon, type IconName } from '../common';
import { useDeveloperStore, useSettingsStore } from '../../stores';
import { RequestMonitor } from './RequestMonitor';
import { AgentCommunication } from './AgentCommunication';
import { LogViewer } from './LogViewer';
import { StateInspector } from './StateInspector';
import { PromptEditor } from './PromptEditor';
import { TokenUsagePanel } from './TokenUsagePanel';
import { ToolStatusPanel } from '../ToolStatusPanel';
import { BindingConfigPanel } from '../BindingConfigPanel';
import { DecisionLogViewer } from '../decision-log';
import { DataSimulatorPanel } from './DataSimulatorPanel';
import { MockDynamicUIPanel } from './MockDynamicUIPanel';
import { DynamicUIStatePanel } from './DynamicUIStatePanel';
import { UIAgentTestPanel } from './UIAgentTestPanel';
import styles from './DeveloperPanel.module.css';

const TABS: { id: 'requests' | 'agents' | 'tools' | 'bindings' | 'decisions' | 'logs' | 'state' | 'prompts' | 'tokens' | 'data-simulator' | 'mock-dynamic-ui' | 'dynamic-ui-state' | 'ui-agent-test'; label: string; icon: IconName }[] = [
  { id: 'requests', label: '请求', icon: 'send' },
  { id: 'agents', label: '智能体', icon: 'developer' },
  { id: 'tools', label: '工具', icon: 'inventory' },
  { id: 'bindings', label: '绑定', icon: 'equipment' },
  { id: 'decisions', label: '决策', icon: 'quests' },
  { id: 'logs', label: '日志', icon: 'folder' },
  { id: 'state', label: '状态', icon: 'character' },
  { id: 'prompts', label: '提示词', icon: 'edit' },
  { id: 'tokens', label: 'Token', icon: 'token' },
  { id: 'data-simulator', label: '数据模拟', icon: 'settings' },
  { id: 'mock-dynamic-ui', label: '模拟UI', icon: 'edit' },
  { id: 'dynamic-ui-state', label: 'UI状态', icon: 'character' },
  { id: 'ui-agent-test', label: 'UI测试', icon: 'settings' },
];

export const DeveloperPanel: React.FC = () => {
  const { settings } = useSettingsStore();
  const {
    isDeveloperPanelVisible,
    isMinimized,
    activeTab,
    position,
    size,
    hideDeveloperPanel,
    minimizePanel,
    expandPanel,
    setActiveTab,
    setPosition,
    setSize,
  } = useDeveloperStore();

  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const panelRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest(`.${styles.headerButtons}`)) {
      return;
    }
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  }, [position]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      const newX = Math.max(0, Math.min(e.clientX - dragOffset.x, window.innerWidth - 100));
      const newY = Math.max(0, Math.min(e.clientY - dragOffset.y, window.innerHeight - 50));
      setPosition({ x: newX, y: newY });
    }

    if (isResizing && panelRef.current) {
      const rect = panelRef.current.getBoundingClientRect();
      const newWidth = Math.max(400, e.clientX - rect.left);
      const newHeight = Math.max(300, e.clientY - rect.top);
      setSize({ width: newWidth, height: newHeight });
    }
  }, [isDragging, isResizing, dragOffset, setPosition, setSize]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  useEffect(() => {
    if (!settings.developer.developerMode && isDeveloperPanelVisible) {
      hideDeveloperPanel();
    }
  }, [settings.developer.developerMode, isDeveloperPanelVisible, hideDeveloperPanel]);

  if (!settings.developer.developerMode || !isDeveloperPanelVisible) {
    return null;
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'requests':
        return <RequestMonitor />;
      case 'agents':
        return <AgentCommunication />;
      case 'tools':
        return <ToolStatusPanel />;
      case 'bindings':
        return <BindingConfigPanel />;
      case 'decisions':
        return <DecisionLogViewer />;
      case 'logs':
        return <LogViewer />;
      case 'state':
        return <StateInspector />;
      case 'prompts':
        return <PromptEditor />;
      case 'tokens':
        return <TokenUsagePanel />;
      case 'data-simulator':
        return <DataSimulatorPanel />;
      case 'mock-dynamic-ui':
        return <MockDynamicUIPanel />;
      case 'dynamic-ui-state':
        return <DynamicUIStatePanel />;
      case 'ui-agent-test':
        return <UIAgentTestPanel />;
      default:
        return null;
    }
  };

  return (
    <div
      ref={panelRef}
      className={`${styles.panel} ${isMinimized ? styles.minimized : ''}`}
      style={{
        left: position.x,
        top: position.y,
        width: isMinimized ? 'auto' : size.width,
        height: isMinimized ? 'auto' : size.height,
      }}
    >
      <div
        className={styles.header}
        onMouseDown={handleMouseDown}
      >
        <div className={styles.headerTitle}>
          <Icon name="developer" size={18} />
          <span>开发者工具</span>
        </div>
        <div className={styles.headerButtons}>
          <button
            className={styles.headerButton}
            onClick={isMinimized ? expandPanel : minimizePanel}
            title={isMinimized ? '展开' : '最小化'}
          >
            <Icon name={isMinimized ? 'chevron-up' : 'chevron-down'} size={16} />
          </button>
          <button
            className={styles.headerButton}
            onClick={hideDeveloperPanel}
            title="关闭"
          >
            <Icon name="close" size={16} />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          <div className={styles.tabs}>
            {TABS.map((tab) => (
              <button
                key={tab.id}
                className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon name={tab.icon} size={14} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <div className={styles.content}>
            {renderTabContent()}
          </div>

          <div
            className={styles.resizeHandle}
            onMouseDown={() => setIsResizing(true)}
          />
        </>
      )}
    </div>
  );
};
