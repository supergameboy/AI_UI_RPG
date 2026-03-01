import { create } from 'zustand';
import type { LLMRequestRecord, AgentMessageRecord, LogEntry } from '../services/logService';
import type { WSConnectionState, LLMRequestLog, AgentMessageLog } from '@ai-rpg/shared';
import { websocketService } from '../services/websocketService';

export type DeveloperTab = 'requests' | 'agents' | 'logs' | 'state' | 'prompts';

export interface DeveloperState {
  isDeveloperPanelVisible: boolean;
  isMinimized: boolean;
  activeTab: DeveloperTab;
  position: { x: number; y: number };
  size: { width: number; height: number };
  llmRequests: LLMRequestRecord[];
  agentMessages: AgentMessageRecord[];
  logs: LogEntry[];
  wsConnection: WSConnectionState;

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

  addLog: (level: LogEntry['level'], message: string, data?: Record<string, unknown>) => void;
  addLogEntry: (entry: LogEntry) => void;
  setLogs: (logs: LogEntry[]) => void;
  clearLogs: () => void;
  
  connectWebSocket: () => void;
  disconnectWebSocket: () => void;
  setWSConnection: (state: WSConnectionState) => void;
}

const MAX_REQUESTS = 100;
const MAX_MESSAGES = 200;

const DEFAULT_POSITION = { x: 100, y: 100 };
const DEFAULT_SIZE = { width: 600, height: 450 };

const INITIAL_WS_STATE: WSConnectionState = {
  connected: false,
  reconnecting: false,
  reconnectAttempts: 0,
};

function convertLLMRequestLog(log: LLMRequestLog): LLMRequestRecord {
  return {
    id: log.id,
    timestamp: log.timestamp,
    agentType: log.agentType,
    provider: log.provider,
    model: log.model,
    status: log.status,
    duration: log.duration,
    promptTokens: log.promptTokens,
    completionTokens: log.completionTokens,
    prompt: log.prompt,
    response: log.response,
    error: log.error,
  };
}

function convertAgentMessageLog(log: AgentMessageLog): AgentMessageRecord {
  return {
    id: log.id,
    timestamp: log.timestamp,
    from: log.from,
    to: log.to,
    type: log.type,
    action: log.action,
    status: log.status,
    payload: log.payload as Record<string, unknown> | undefined,
    error: log.error,
  };
}

export const useDeveloperStore = create<DeveloperState>((set, get) => ({
  isDeveloperPanelVisible: false,
  isMinimized: false,
  activeTab: 'requests',
  position: DEFAULT_POSITION,
  size: DEFAULT_SIZE,
  llmRequests: [],
  agentMessages: [],
  logs: [],
  wsConnection: INITIAL_WS_STATE,

  showDeveloperPanel: () => set({ isDeveloperPanelVisible: true, isMinimized: false }),
  hideDeveloperPanel: () => set({ isDeveloperPanelVisible: false }),
  toggleDeveloperPanel: () => set((state) => ({ isDeveloperPanelVisible: !state.isDeveloperPanelVisible })),
  minimizePanel: () => set({ isMinimized: true }),
  expandPanel: () => set({ isMinimized: false }),
  setActiveTab: (tab: DeveloperTab) => set({ activeTab: tab }),
  setPosition: (position: { x: number; y: number }) => set({ position }),
  setSize: (size: { width: number; height: number }) => set({ size }),

  addLLMRequest: (request: LLMRequestRecord) => {
    const requests = [request, ...get().llmRequests];
    if (requests.length > MAX_REQUESTS) {
      set({ llmRequests: requests.slice(0, MAX_REQUESTS) });
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
    const messages = [message, ...get().agentMessages];
    if (messages.length > MAX_MESSAGES) {
      set({ agentMessages: messages.slice(0, MAX_MESSAGES) });
    } else {
      set({ agentMessages: messages });
    }
  },

  clearAgentMessages: () => set({ agentMessages: [] }),

  addLog: (level: LogEntry['level'], message: string, data?: Record<string, unknown>) => {
    const log: LogEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      level,
      source: 'prompt-editor',
      message,
      data,
    };
    const logs = [log, ...get().logs];
    if (logs.length > MAX_MESSAGES) {
      set({ logs: logs.slice(0, MAX_MESSAGES) });
    } else {
      set({ logs });
    }
  },

  addLogEntry: (entry: LogEntry) => {
    const logs = [entry, ...get().logs];
    if (logs.length > MAX_MESSAGES) {
      set({ logs: logs.slice(0, MAX_MESSAGES) });
    } else {
      set({ logs });
    }
  },

  setLogs: (logs: LogEntry[]) => set({ logs }),
  clearLogs: () => set({ logs: [] }),
  
  connectWebSocket: () => {
    websocketService.subscribe((message) => {
      if (message.type === 'llm_request') {
        const log = message.payload as LLMRequestLog;
        get().addLLMRequest(convertLLMRequestLog(log));
      } else if (message.type === 'llm_update') {
        const updates = message.payload as Partial<LLMRequestLog> & { id: string };
        get().updateLLMRequest(updates.id, updates);
      } else if (message.type === 'agent_message') {
        const log = message.payload as AgentMessageLog;
        get().addAgentMessage(convertAgentMessageLog(log));
      } else if (message.type === 'log') {
        const logEntry = message.payload as LogEntry;
        get().addLogEntry(logEntry);
      }
    });
    
    websocketService.subscribeToConnection((state) => {
      get().setWSConnection(state);
    });
    
    websocketService.connect();
  },
  
  disconnectWebSocket: () => {
    websocketService.disconnect();
  },
  
  setWSConnection: (state: WSConnectionState) => set({ wsConnection: state }),
}));
