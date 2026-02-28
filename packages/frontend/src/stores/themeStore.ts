import { create } from 'zustand';

export type Theme = 'dark' | 'light';

export interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const STORAGE_KEY = 'ai-rpg-theme';

const getInitialTheme = (): Theme => {
  if (typeof window === 'undefined') return 'dark';
  
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'dark' || stored === 'light') {
    return stored;
  }
  
  if (window.matchMedia('(prefers-color-scheme: light)').matches) {
    return 'light';
  }
  
  return 'dark';
};

export const applyTheme = (theme: Theme): void => {
  document.documentElement.setAttribute('data-theme', theme);
};

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: getInitialTheme(),
  
  setTheme: (theme: Theme) => {
    localStorage.setItem(STORAGE_KEY, theme);
    applyTheme(theme);
    set({ theme });
  },
  
  toggleTheme: () => {
    const current = get().theme;
    const next = current === 'dark' ? 'light' : 'dark';
    localStorage.setItem(STORAGE_KEY, next);
    applyTheme(next);
    set({ theme: next });
  },
}));

if (typeof window !== 'undefined') {
  applyTheme(getInitialTheme());
}
