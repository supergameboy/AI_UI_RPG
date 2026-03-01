import React, { useEffect, useRef } from 'react';
import { DeveloperPanel } from './DeveloperPanel';
import { useDeveloperStore, useSettingsStore } from '../../stores';

export const GlobalDeveloperTools: React.FC = () => {
  const { settings } = useSettingsStore();
  const connectWebSocket = useDeveloperStore((state) => state.connectWebSocket);
  const isConnected = useDeveloperStore((state) => state.wsConnection.connected);
  const isDeveloperPanelVisible = useDeveloperStore((state) => state.isDeveloperPanelVisible);
  const showDeveloperPanel = useDeveloperStore((state) => state.showDeveloperPanel);
  const hasConnected = useRef(false);

  useEffect(() => {
    if (settings.developer.developerMode && !isConnected && !hasConnected.current) {
      connectWebSocket();
      hasConnected.current = true;
    }
  }, [settings.developer.developerMode, isConnected, connectWebSocket]);

  useEffect(() => {
    if (settings.developer.developerMode && !isDeveloperPanelVisible) {
      showDeveloperPanel();
    }
  }, [settings.developer.developerMode, isDeveloperPanelVisible, showDeveloperPanel]);

  if (!settings.developer.developerMode) {
    return null;
  }

  return <DeveloperPanel />;
};
