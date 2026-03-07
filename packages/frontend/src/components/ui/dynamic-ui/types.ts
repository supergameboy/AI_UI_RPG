/**
 * 动态 UI 组件类型定义
 */

export type DynamicUIAction = {
  type: string;
  payload?: unknown;
};

export type DynamicUIComponentProps = {
  content: string;
  attrs: Record<string, string>;
  onAction?: (action: DynamicUIAction) => void;
  onDismiss?: () => void;
  context?: Record<string, unknown>;
};

export type ParsedOption = {
  text: string;
  action: string;
  disabled?: boolean;
};

export type ParsedTab = {
  label: string;
  id: string;
  content: string;
};

export type NotifyType = 'welcome' | 'achievement' | 'warning' | 'error' | 'info';

export type BadgeType = 'rarity' | 'status' | 'type' | 'custom';

export type EnhancementItem = {
  id: string;
  name: string;
  icon?: string;
  currentLevel: number;
  maxLevel: number;
  successRate: number;
  materials: Array<{
    name: string;
    required: number;
    owned: number;
  }>;
};

export type WarehouseTab = 'inventory' | 'bank' | 'equipment';

export type WarehouseItem = {
  id: string;
  name: string;
  icon?: string;
  quantity: number;
  rarity?: string;
  description?: string;
};

export type WarehouseSection = {
  id: WarehouseTab;
  label: string;
  items: WarehouseItem[];
  maxSlots: number;
  usedSlots: number;
};

// ============ 新增组件类型 ============

/** 技能节点状态 */
export type SkillNodeStatus = 'locked' | 'available' | 'unlocked' | 'maxed';

/** 技能节点 */
export type SkillNode = {
  id: string;
  name: string;
  icon?: string;
  description?: string;
  level: number;
  maxLevel: number;
  status: SkillNodeStatus;
  position: { x: number; y: number };
  prerequisites?: string[];
  cost?: number;
};

/** 技能树布局类型 */
export type SkillTreeLayout = 'tree' | 'grid' | 'radial';

/** 任务状态 */
export type QuestStatus = 'available' | 'in_progress' | 'completed' | 'failed';

/** 任务目标 */
export type QuestObjective = {
  id: string;
  description: string;
  current: number;
  target: number;
  completed: boolean;
};

/** 任务 */
export type Quest = {
  id: string;
  name: string;
  description?: string;
  status: QuestStatus;
  objectives: QuestObjective[];
  rewards?: Array<{ name: string; icon?: string; quantity: number }>;
  timeLimit?: number;
  priority?: 'main' | 'side' | 'daily';
};

/** 小地图标记 */
export type MinimapMarker = {
  id: string;
  type: 'player' | 'npc' | 'enemy' | 'item' | 'portal' | 'quest';
  position: { x: number; y: number };
  label?: string;
};

/** 角色状态 */
export type CharacterStats = {
  name: string;
  level: number;
  class: string;
  health: { current: number; max: number };
  mana: { current: number; max: number };
  exp: { current: number; max: number };
  avatar?: string;
  title?: string;
};

/** 对话消息 */
export type DialogueMessage = {
  id: string;
  speaker: string;
  content: string;
  timestamp?: number;
  type: 'npc' | 'player' | 'system';
};
