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
