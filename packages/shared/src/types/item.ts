// ==================== 基础物品类型 ====================

/**
 * 物品类型
 */
export type ItemType = 'weapon' | 'armor' | 'accessory' | 'consumable' | 'material' | 'quest' | 'misc';

/**
 * 物品稀有度
 */
export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'unique';

/**
 * 装备槽位类型
 */
export type EquipmentSlotType = 'weapon' | 'head' | 'body' | 'feet' | 'accessory' | string;

/**
 * 物品效果
 */
export interface ItemEffect {
  type: string;
  value: number;
  duration?: number;
  condition?: string;
}

/**
 * 物品需求
 */
export interface ItemRequirements {
  level?: number;
  class?: string[];
  attributes?: Record<string, number>;
  custom?: string[];
}

/**
 * 物品价值
 */
export interface ItemValue {
  buy: number;
  sell: number;
  currency: string;
}

/**
 * 物品定义
 */
export interface Item {
  id: string;
  name: string;
  description: string;
  type: ItemType;
  rarity: ItemRarity;
  stats: Record<string, number>;
  effects: ItemEffect[];
  requirements: ItemRequirements;
  value: ItemValue;
  stackable: boolean;
  maxStack: number;
  imagePrompt?: string;
  generatedImage?: string;
}

// ==================== 背包相关类型 ====================

/**
 * 背包槽位
 */
export interface InventorySlot {
  id: string;
  slotIndex: number;
  itemId: string;
  quantity: number;
  item?: Item;
}

/**
 * 装备信息
 */
export interface EquippedItem {
  id: string;
  itemId: string;
  slot: EquipmentSlotType;
  equippedAt: number;
  item?: Item;
}

/**
 * 背包状态
 */
export interface InventoryState {
  capacity: number;
  usedSlots: number;
  slots: InventorySlot[];
  equipment: EquippedItem[];
  currency: Record<string, number>;
}

/**
 * 物品过滤器
 */
export interface ItemFilter {
  type?: ItemType;
  rarity?: ItemRarity;
  name?: string;
  stackable?: boolean;
  equipped?: boolean;
}

// ==================== 交易相关类型 ====================

/**
 * 交易请求
 */
export interface TradeRequest {
  type: 'buy' | 'sell';
  itemId: string;
  quantity: number;
  merchantId?: string;
  priceMultiplier?: number;
}

/**
 * 交易结果
 */
export interface TradeResult {
  success: boolean;
  itemId: string;
  quantity: number;
  totalPrice: number;
  currency: string;
  newBalance: number;
}

// ==================== 装备相关类型 ====================

/**
 * 装备结果
 */
export interface EquipResult {
  success: boolean;
  item: Item;
  slot: EquipmentSlotType;
  previousItem?: Item;
  statChanges: Record<string, number>;
}

/**
 * 需求检查结果
 */
export interface RequirementCheckResult {
  met: boolean;
  missing: string[];
  requirements: ItemRequirements;
}

/**
 * 属性加成计算结果
 */
export interface StatBonus {
  base: Record<string, number>;
  fromEquipment: Record<string, number>;
  total: Record<string, number>;
}

// ==================== 背包统计类型 ====================

/**
 * 背包统计
 */
export interface InventoryStatistics {
  totalItems: number;
  totalValue: number;
  byType: Record<ItemType, number>;
  byRarity: Record<ItemRarity, number>;
  equippedCount: number;
  capacityUsed: number;
  capacityRemaining: number;
}

// ==================== API 请求/响应类型 ====================

/**
 * 添加物品请求
 */
export interface AddItemRequest {
  saveId: string;
  characterId: string;
  item: Item;
  quantity?: number;
  slotIndex?: number;
}

/**
 * 添加物品响应
 */
export interface AddItemResponse {
  success: boolean;
  item: Item;
  quantity: number;
  slotIndex: number;
  stacked: boolean;
}

/**
 * 移除物品请求
 */
export interface RemoveItemRequest {
  saveId: string;
  characterId: string;
  itemId: string;
  quantity?: number;
  slotIndex?: number;
}

/**
 * 移除物品响应
 */
export interface RemoveItemResponse {
  success: boolean;
  item: Item;
  quantity: number;
  slotIndex: number;
}

/**
 * 使用物品请求
 */
export interface UseItemRequest {
  saveId: string;
  characterId: string;
  itemId: string;
  slotIndex?: number;
  targetId?: string;
}

/**
 * 使用物品响应
 */
export interface UseItemResponse {
  success: boolean;
  item: Item;
  effects: ItemEffect[];
  remainingQuantity: number;
}

/**
 * 装备物品请求
 */
export interface EquipItemRequest {
  saveId: string;
  characterId: string;
  itemId: string;
  slotIndex?: number;
  targetSlot?: EquipmentSlotType;
}

/**
 * 卸下装备请求
 */
export interface UnequipItemRequest {
  saveId: string;
  characterId: string;
  slot: EquipmentSlotType;
}

/**
 * 扩展背包请求
 */
export interface ExpandCapacityRequest {
  saveId: string;
  characterId: string;
  amount: number;
  cost?: number;
}

/**
 * 扩展背包响应
 */
export interface ExpandCapacityResponse {
  success: boolean;
  previousCapacity: number;
  newCapacity: number;
  expandedBy: number;
  cost: number;
}

/**
 * 整理背包请求
 */
export interface SortInventoryRequest {
  saveId: string;
  characterId: string;
  sortBy?: 'type' | 'rarity' | 'name' | 'value';
  ascending?: boolean;
}

/**
 * 拆分堆叠请求
 */
export interface SplitStackRequest {
  saveId: string;
  characterId: string;
  slotIndex: number;
  quantity: number;
}

/**
 * 合并堆叠请求
 */
export interface MergeStacksRequest {
  saveId: string;
  characterId: string;
  sourceSlotIndex: number;
  targetSlotIndex: number;
}

/**
 * 创建物品请求（GM命令）
 */
export interface CreateItemRequest {
  name: string;
  type: ItemType;
  rarity?: ItemRarity;
  stats?: Record<string, number>;
  effects?: ItemEffect[];
  requirements?: ItemRequirements;
  value?: ItemValue;
  stackable?: boolean;
  maxStack?: number;
  description?: string;
}

// ==================== 稀有度配置 ====================

/**
 * 稀有度配置
 */
export interface RarityConfig {
  color: string;
  multiplier: number;
  dropRate: number;
}

/**
 * 稀有度配置映射
 */
export const RARITY_CONFIG: Record<ItemRarity, RarityConfig> = {
  common: { color: '#9E9E9E', multiplier: 1.0, dropRate: 0.6 },
  uncommon: { color: '#4CAF50', multiplier: 1.3, dropRate: 0.25 },
  rare: { color: '#2196F3', multiplier: 1.6, dropRate: 0.1 },
  epic: { color: '#9C27B0', multiplier: 2.0, dropRate: 0.04 },
  legendary: { color: '#FF9800', multiplier: 3.0, dropRate: 0.009 },
  unique: { color: '#E91E63', multiplier: 5.0, dropRate: 0.001 },
};
