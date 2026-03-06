import type { ToolStatus, ToolType } from '@ai-rpg/shared';

export type ToolStatusFilter = 'all' | 'idle' | 'busy' | 'error';

export interface ToolStatusPanelProps {
  onClose?: () => void;
  refreshInterval?: number;
}

export interface ToolStatistics {
  totalCalls: number;
  totalErrors: number;
  successRate: number;
  averageDuration: number;
  activeTools: number;
  errorTools: number;
}

export interface ToolCardProps {
  tool: ToolStatus;
  description: string;
}

export const TOOL_NAMES: Record<ToolType, string> = {
  numerical: '数值计算',
  inventory_data: '背包数据',
  skill_data: '技能数据',
  map_data: '地图数据',
  npc_data: 'NPC 数据',
  quest_data: '任务数据',
  event_data: '事件数据',
  dialogue_data: '对话数据',
  combat_data: '战斗数据',
  story_data: '故事数据',
  ui_data: 'UI 数据',
} as const;

export const STATUS_COLORS: Record<ToolStatus['status'], string> = {
  idle: '#10b981',
  busy: '#3b82f6',
  error: '#ef4444',
} as const;

export const STATUS_LABELS: Record<ToolStatus['status'], string> = {
  idle: '空闲',
  busy: '忙碌',
  error: '错误',
} as const;
