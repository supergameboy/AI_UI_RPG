import type { AgentType } from '@ai-rpg/shared';

export interface DecisionLogFilter {
  requestId?: string;
  agentId?: AgentType | '';
  startTime?: number;
  endTime?: number;
  hasConflicts?: boolean;
  success?: boolean | '';
}

export type SortField = 'timestamp' | 'duration' | 'conflictCount';
export type SortOrder = 'asc' | 'desc';

export interface ViewState {
  mode: 'list' | 'detail';
  selectedLogId: string | null;
}
