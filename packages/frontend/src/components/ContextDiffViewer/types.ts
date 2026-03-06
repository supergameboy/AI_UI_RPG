import type { ContextDiff, ContextConflict, AgentType } from '@ai-rpg/shared';

export type ChangeType = 'added' | 'removed' | 'modified';

export interface DiffItem {
  path: string;
  oldValue: unknown;
  newValue: unknown;
  changeType: ChangeType;
  conflict?: DiffConflict;
}

export interface DiffConflict {
  type: string;
  message: string;
  resolution?: string;
  agents?: AgentType[];
}

export interface ContextDiffViewerProps {
  diffs: ContextDiff[];
  conflicts?: ContextConflict[];
  onResolveConflict?: (conflictId: string, resolution: unknown) => void;
  loading?: boolean;
  maxHeight?: string;
  showTimestamp?: boolean;
}

export interface DiffRowProps {
  diff: DiffItem;
  expanded: boolean;
  onToggle: () => void;
  onResolveConflict?: (resolution: unknown) => void;
  showTimestamp?: boolean;
}

export interface ValueDisplayProps {
  value: unknown;
  isOld?: boolean;
  maxDepth?: number;
}

export interface PathSegment {
  key: string;
  type: 'object' | 'array' | 'value';
}
