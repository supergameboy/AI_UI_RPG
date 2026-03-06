export interface ExtensionComponentProps {
  onAction?: (action: string, data?: unknown) => void;
  context?: Record<string, unknown>;
  children?: React.ReactNode;
  attributes?: Record<string, string>;
}

export interface OptionsComponentProps extends ExtensionComponentProps {
  options: Array<{
    text: string;
    action: string;
    data?: unknown;
  }>;
}

export interface ProgressComponentProps extends ExtensionComponentProps {
  value: number;
  max?: number;
  label?: string;
  color?: 'primary' | 'success' | 'warning' | 'error' | 'health' | 'mana';
}

export interface TabsComponentProps extends ExtensionComponentProps {
  tabs: Array<{
    label: string;
    id: string;
  }>;
  defaultTab?: string;
}

export interface SystemNotifyComponentProps extends ExtensionComponentProps {
  type?: 'info' | 'warning' | 'error' | 'success' | 'achievement' | 'welcome';
  title?: string;
}

export interface BadgeComponentProps extends ExtensionComponentProps {
  type?: 'default' | 'rarity';
  color?: 'default' | 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'gold';
}

export interface TooltipComponentProps extends ExtensionComponentProps {
  content: string;
  tooltipText: string;
}

export interface ConditionalComponentProps extends ExtensionComponentProps {
  condition: string;
}

export interface EnhancementComponentProps extends ExtensionComponentProps {
  itemName?: string;
  currentLevel?: number;
  successRate?: number;
  materials?: Array<{
    name: string;
    count: number;
    hasEnough: boolean;
  }>;
  stats?: Array<{
    name: string;
    current: number;
    enhanced: number;
  }>;
}

export interface WarehouseComponentProps extends ExtensionComponentProps {
  bagSpace?: { current: number; max: number };
  warehouseSpace?: { current: number; max: number };
  items?: Array<{
    name: string;
    count: number;
    actions: Array<{ label: string; action: string }>;
  }>;
}

export type DynamicUIType = 
  | 'welcome'
  | 'notification'
  | 'dialog'
  | 'enhancement'
  | 'warehouse'
  | 'shop'
  | 'custom';

export interface DynamicUIData {
  id: string;
  type: DynamicUIType;
  markdown: string;
  context?: Record<string, unknown>;
}
