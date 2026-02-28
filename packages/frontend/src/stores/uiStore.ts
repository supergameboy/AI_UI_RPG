import { create } from 'zustand';

export type PanelType = 'character' | 'skills' | 'equipment' | 'inventory' | 'quests' | 'map' | 'npc' | 'journal' | null;

export interface UIState {
  activePanel: PanelType;
  isPanelOpen: boolean;
  isDeveloperMode: boolean;
  
  openPanel: (panel: PanelType) => void;
  closePanel: () => void;
  togglePanel: (panel: PanelType) => void;
  toggleDeveloperMode: () => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  activePanel: null,
  isPanelOpen: false,
  isDeveloperMode: false,
  
  openPanel: (panel: PanelType) => {
    set({ activePanel: panel, isPanelOpen: true });
  },
  
  closePanel: () => {
    set({ activePanel: null, isPanelOpen: false });
  },
  
  togglePanel: (panel: PanelType) => {
    const current = get().activePanel;
    if (current === panel) {
      set({ activePanel: null, isPanelOpen: false });
    } else {
      set({ activePanel: panel, isPanelOpen: true });
    }
  },
  
  toggleDeveloperMode: () => {
    set((state) => ({ isDeveloperMode: !state.isDeveloperMode }));
  },
}));
