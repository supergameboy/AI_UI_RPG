import { create } from 'zustand';

export type GameScreen = 'menu' | 'game' | 'template-select' | 'save-load';

export interface SaveInfo {
  id: string;
  name: string;
  timestamp: number;
  playTime: number;
  chapter: string;
  location: string;
  level: number;
}

export interface GameState {
  screen: GameScreen;
  previousScreen: GameScreen;
  showSettings: boolean;
  currentSaveId: string | null;
  saves: SaveInfo[];
  isLoading: boolean;
  
  setScreen: (screen: GameScreen) => void;
  startNewGame: () => void;
  loadGame: (saveId: string) => void;
  returnToMenu: () => void;
  openSettings: () => void;
  closeSettings: () => void;
  setSaves: (saves: SaveInfo[]) => void;
  setLoading: (loading: boolean) => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  screen: 'menu',
  previousScreen: 'menu',
  showSettings: false,
  currentSaveId: null,
  saves: [],
  isLoading: false,
  
  setScreen: (screen: GameScreen) => {
    set({ screen });
  },
  
  startNewGame: () => {
    set({ screen: 'template-select', currentSaveId: null });
  },
  
  loadGame: (saveId: string) => {
    set({ screen: 'game', currentSaveId: saveId });
  },
  
  returnToMenu: () => {
    set({ screen: 'menu', currentSaveId: null, showSettings: false });
  },
  
  openSettings: () => {
    const current = get().screen;
    set({ previousScreen: current, showSettings: true });
  },
  
  closeSettings: () => {
    const previous = get().previousScreen;
    set({ showSettings: false, screen: previous });
  },
  
  setSaves: (saves: SaveInfo[]) => {
    set({ saves });
  },
  
  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },
}));
