import { create } from 'zustand';
import type { LLMRequestRecord, AgentMessageRecord, LogEntry } from '../services/logService';

export type DeveloperTab = 'requests' | 'agents' | 'logs' | 'state';

export interface DeveloperState {
  isDeveloperPanelVisible: boolean;
  isMinimized: boolean;
  activeTab: DeveloperTab;
  position: { x: number; y: number };
  size: { width: number; height: number };
  llmRequests: LLMRequestRecord[];
  agentMessages: AgentMessageRecord[];
  logs: LogEntry[];

  showDeveloperPanel: () => void;
  hideDeveloperPanel: () => void;
  toggleDeveloperPanel: () => void;
  minimizePanel: () => void;
  expandPanel: () => void;
  setActiveTab: (tab: DeveloperTab) => void;
  setPosition: (position: { x: number; y: number }) => void;
  setSize: (size: { width: number; height: number }) => void;

  addLLMRequest: (request: LLMRequestRecord) => void;
  updateLLMRequest: (id: string, updates: Partial<LLMRequestRecord>) => void;
  clearLLMRequests: () => void;

  addAgentMessage: (message: AgentMessageRecord) => void;
  clearAgentMessages: () => void;

  setLogs: (logs: LogEntry[]) => void;
  clearLogs: () => void;
}

const MAX_REQUESTS = 100;
const MAX_MESSAGES = 200;

const DEFAULT_POSITION = { x: 100, y: 100 };
const DEFAULT_SIZE = { width: 600, height: 450 };

export const useDeveloperStore = create<DeveloperState>((set, get) => ({
  isDeveloperPanelVisible: false,
  isMinimized: false,
  activeTab: 'requests',
  position: DEFAULT_POSITION,
  size: DEFAULT_SIZE,
  llmRequests: [],
  agentMessages: [],
  logs: [],

  showDeveloperPanel: () => set({ isDeveloperPanelVisible: true, isMinimized: false }),
  hideDeveloperPanel: () => set({ isDeveloperPanelVisible: false }),
  toggleDeveloperPanel: () => set((state) => ({ isDeveloperPanelVisible: !state.isDeveloperPanelVisible })),
  minimizePanel: () => set({ isMinimized: true }),
  expandPanel: () => set({ isMinimized: false }),
  setActiveTab: (tab: DeveloperTab) => set({ activeTab: tab }),
  setPosition: (position: { x: number; y: number }) => set({ position }),
  setSize: (size: { width: number; height: number }) => set({ size }),

  addLLMRequest: (request: LLMRequestRecord) => {
    const requests = [...get().llmRequests, request];
    if (requests.length > MAX_REQUESTS) {
      set({ llmRequests: requests.slice(-MAX_REQUESTS) });
    } else {
      set({ llmRequests: requests });
    }
  },

  updateLLMRequest: (id: string, updates: Partial<LLMRequestRecord>) => {
    set({
      llmRequests: get().llmRequests.map((req) =>
        req.id === id ? { ...req, ...updates } : req
      ),
    });
  },

  clearLLMRequests: () => set({ llmRequests: [] }),

  addAgentMessage: (message: AgentMessageRecord) => {
    const messages = [...get().agentMessages, message];
    if (messages.length > MAX_MESSAGES) {
      set({ agentMessages: messages.slice(-MAX_MESSAGES) });
    } else {
      set({ agentMessages: messages });
    }
  },

  clearAgentMessages: () => set({ agentMessages: [] }),

  setLogs: (logs: LogEntry[]) => set({ logs }),
  clearLogs: () => set({ logs: [] }),
}));
