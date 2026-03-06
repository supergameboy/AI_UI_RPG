import type {
  AgentType,
  AgentMessage,
  AgentResponse,
  Item,
  ItemEffect,
  ItemRequirements,
  UIInstruction,
  AgentBinding,
  ToolType,
  GameTemplate,
  AgentInitializationResult,
  Character,
} from '@ai-rpg/shared';
import { AgentType as AT, ToolType as ToolTypeEnum } from '@ai-rpg/shared';
import { AgentBase } from './AgentBase';

// ==================== 类型定义 ====================

/**
 * 物品类型
 */
export type ItemType = 'weapon' | 'armor' | 'accessory' | 'consumable' | 'material' | 'quest' | 'misc';

/**
 * 物品稀有度
 */
export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'unique';

/**
 * 装备槽位
 */
export type EquipmentSlot = 'weapon' | 'head' | 'body' | 'feet' | 'accessory';

/**
 * 背包槽位
 */
interface InventorySlot {
  itemId: string;
  quantity: number;
  slotIndex: number;
}

/**
 * 装备信息
 */
interface EquippedItem {
  itemId: string;
  slot: EquipmentSlot;
  equippedAt: number;
}

/**
 * 背包状态
 */
interface InventoryState {
  slots: Map<number, InventorySlot>;
  equipment: Map<EquipmentSlot, EquippedItem>;
  capacity: number;
  usedSlots: number;
  currency: Record<string, number>;
}

/**
 * 物品过滤器
 */
interface ItemFilter {
  type?: ItemType;
  rarity?: ItemRarity;
  name?: string;
  stackable?: boolean;
  equipped?: boolean;
}

/**
 * 交易类型
 */
interface TradeRequest {
  type: 'buy' | 'sell';
  itemId: string;
  quantity: number;
  merchantId?: string;
  priceMultiplier?: number;
}

/**
 * 交易结果
 */
interface TradeResult {
  success: boolean;
  itemId: string;
  quantity: number;
  totalPrice: number;
  currency: string;
  newBalance: number;
}

/**
 * 装备结果
 */
interface EquipResult {
  success: boolean;
  item: Item;
  slot: EquipmentSlot;
  previousItem?: Item;
  statChanges: Record<string, number>;
}

/**
 * 属性加成计算结果
 */
interface StatBonus {
  base: Record<string, number>;
  fromEquipment: Record<string, number>;
  total: Record<string, number>;
}

/**
 * 背包统计
 */
interface InventoryStatistics {
  totalItems: number;
  totalValue: number;
  byType: Record<ItemType, number>;
  byRarity: Record<ItemRarity, number>;
  equippedCount: number;
  capacityUsed: number;
  capacityRemaining: number;
}

/**
 * 稀有度配置
 */
const RARITY_CONFIG: Record<ItemRarity, { color: string; multiplier: number; dropRate: number }> = {
  common: { color: '#9E9E9E', multiplier: 1.0, dropRate: 0.6 },
  uncommon: { color: '#4CAF50', multiplier: 1.3, dropRate: 0.25 },
  rare: { color: '#2196F3', multiplier: 1.6, dropRate: 0.1 },
  epic: { color: '#9C27B0', multiplier: 2.0, dropRate: 0.04 },
  legendary: { color: '#FF9800', multiplier: 3.0, dropRate: 0.009 },
  unique: { color: '#E91E63', multiplier: 5.0, dropRate: 0.001 },
};

/**
 * 背包系统智能体
 * 负责物品管理、装备系统、交易处理
 */
export class InventoryAgent extends AgentBase {
  readonly type: AgentType = AT.INVENTORY;

  // 依赖的 Tool 类型
  readonly tools: ToolType[] = [
    ToolTypeEnum.INVENTORY_DATA,
    ToolTypeEnum.NUMERICAL,
    ToolTypeEnum.NPC_DATA,
    ToolTypeEnum.QUEST_DATA,
  ];

  // 可调用的 Agent 绑定配置
  readonly bindings: AgentBinding[] = [
    { agentType: AT.COORDINATOR, enabled: true },
    { agentType: AT.NUMERICAL, enabled: true },
    { agentType: AT.QUEST, enabled: true },
    { agentType: AT.NPC_PARTY, enabled: true },
  ];

  readonly systemPrompt = `你是背包系统智能体，负责管理玩家的物品、装备和交易系统。

核心职责：
1. 物品管理：添加、移除、查询、堆叠物品
2. 装备系统：管理装备槽位、穿戴/卸下装备、计算属性加成
3. 交易处理：购买、出售物品，价格计算，货币管理
4. 背包容量：管理背包空间，处理扩容

物品类型：
- weapon: 武器，提供攻击力加成
- armor: 护甲，提供防御力加成
- accessory: 饰品，提供特殊效果
- consumable: 消耗品，使用后产生效果
- material: 材料，用于制作或任务
- quest: 任务物品，特殊用途
- misc: 杂项物品

稀有度等级：
- common: 普通（灰色）
- uncommon: 优秀（绿色）
- rare: 稀有（蓝色）
- epic: 史诗（紫色）
- legendary: 传说（橙色）
- unique: 独特（粉色）

装备槽位：
- weapon: 武器槽
- head: 头部槽
- body: 身体槽
- feet: 脚部槽
- accessory: 饰品槽

工作原则：
- 确保物品操作的原子性和一致性
- 装备穿戴需检查等级和属性需求
- 交易需验证货币余额
- 合理处理堆叠和拆分`;

  // 背包状态
  private inventoryState: InventoryState;

  // 物品数据库
  private items: Map<string, Item> = new Map();

  // 物品ID计数器
  private itemIdCounter: number = 0;

  constructor() {
    super({
      temperature: 0.5,
      maxTokens: 4096,
    });

    this.inventoryState = {
      slots: new Map(),
      equipment: new Map(),
      capacity: 40, // 默认背包容量
      usedSlots: 0,
      currency: {
        gold: 100, // 初始金币
        silver: 0,
        copper: 0,
      },
    };
  }

  protected getAgentName(): string {
    return 'Inventory Agent';
  }

  protected getAgentDescription(): string {
    return '背包系统智能体，负责物品管理、装备系统、交易处理';
  }

  protected getAgentCapabilities(): string[] {
    return [
      'item_management',
      'equipment_handling',
      'trading',
      'inventory_organization',
      'stat_calculation',
      'price_evaluation',
      'stack_management',
      'capacity_management',
    ];
  }

  /**
   * 初始化角色背包
   * 优先使用 startingScene.items，其次使用 initialData.items[backgroundId]
   */
  async initialize(params: {
    character: Character;
    template: GameTemplate;
  }): Promise<AgentInitializationResult> {
    const { character, template } = params;
    
    try {
      const backgroundId = character.backstory || 'commoner';
      
      const initialItems = template.startingScene?.items?.map(item => ({
        itemId: item.id,
        quantity: item.quantity || 1,
      })) || template.initialData?.items?.[backgroundId] || [];
      
      const addedItems: Array<{ itemId: string; quantity: number }> = [];
      const failedItems: string[] = [];
      
      for (const itemConfig of initialItems) {
        const item = this.handleCreateItem({
          name: itemConfig.itemId,
          type: 'material',
          rarity: 'common',
          description: `初始物品: ${itemConfig.itemId}`,
          stackable: true,
          maxStack: 99,
        });
        
        if (item.success && item.data) {
          const itemData = item.data as { item: Item };
          const addResult = this.handleAddItem({
            item: itemData.item,
            quantity: itemConfig.quantity,
          });
          
          if (addResult.success) {
            addedItems.push({ itemId: itemConfig.itemId, quantity: itemConfig.quantity });
          } else {
            failedItems.push(itemConfig.itemId);
          }
        } else {
          failedItems.push(itemConfig.itemId);
        }
      }
      
      const initialGold = template.initialData?.gold?.[backgroundId] || 100;
      this.inventoryState.currency.gold = initialGold;
      
      this.addMemory(
        `初始化角色背包: ${character.name}, 背景: ${backgroundId}, 物品: ${addedItems.length}/${initialItems.length}, 金币: ${initialGold}`,
        'assistant',
        7,
        { characterId: character.id, addedItems, failedItems, initialGold }
      );
      
      return {
        success: true,
        data: {
          addedItems,
          failedItems,
          initialGold,
          backgroundId,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '背包初始化失败',
      };
    }
  }

  /**
   * 处理消息主入口
   */
  async processMessage(message: AgentMessage): Promise<AgentResponse> {
    const action = message.payload.action;
    const data = message.payload.data as Record<string, unknown>;

    try {
      switch (action) {
        // 物品管理
        case 'add_item':
          return this.handleAddItem(data);
        case 'remove_item':
          return this.handleRemoveItem(data);
        case 'get_item':
          return this.handleGetItem(data);
        case 'get_items':
          return this.handleGetItems(data);
        case 'use_item':
          return this.handleUseItem(data);
        case 'split_stack':
          return this.handleSplitStack(data);
        case 'merge_stacks':
          return this.handleMergeStacks(data);

        // 装备系统
        case 'equip_item':
          return this.handleEquipItem(data);
        case 'unequip_item':
          return this.handleUnequipItem(data);
        case 'get_equipment':
          return this.handleGetEquipment(data);
        case 'calculate_stats':
          return this.handleCalculateStats(data);
        case 'check_requirements':
          return this.handleCheckRequirements(data);

        // 交易处理
        case 'buy_item':
          return this.handleBuyItem(data);
        case 'sell_item':
          return this.handleSellItem(data);
        case 'calculate_price':
          return this.handleCalculatePrice(data);
        case 'get_currency':
          return this.handleGetCurrency(data);
        case 'add_currency':
          return this.handleAddCurrency(data);

        // 背包管理
        case 'get_inventory':
          return this.handleGetInventory(data);
        case 'get_statistics':
          return this.handleGetStatistics();
        case 'expand_capacity':
          return this.handleExpandCapacity(data);
        case 'sort_inventory':
          return this.handleSortInventory(data);
        case 'find_free_slot':
          return this.handleFindFreeSlot();

        // 物品创建（用于测试或GM命令）
        case 'create_item':
          return this.handleCreateItem(data);

        default:
          return {
            success: false,
            error: `Unknown action: ${action}`,
          };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error in InventoryAgent',
      };
    }
  }

  // ==================== 物品管理 ====================

  /**
   * 添加物品到背包
   */
  private handleAddItem(data: Record<string, unknown>): AgentResponse {
    const addData = data as {
      item: Item;
      quantity?: number;
      slotIndex?: number;
    };

    if (!addData.item) {
      return {
        success: false,
        error: 'Missing required field: item',
      };
    }

    const quantity = addData.quantity || 1;
    const item = addData.item;

    // 检查背包容量
    if (!item.stackable || !this.findStackableSlot(item)) {
      if (this.inventoryState.usedSlots >= this.inventoryState.capacity) {
        return {
          success: false,
          error: 'Inventory is full',
        };
      }
    }

    // 存储物品到数据库
    this.items.set(item.id, item);

    // 处理堆叠
    if (item.stackable) {
      const existingSlot = this.findStackableSlot(item);
      if (existingSlot) {
        const slot = this.inventoryState.slots.get(existingSlot);
        if (slot) {
          const newQuantity = Math.min(slot.quantity + quantity, item.maxStack);
          const added = newQuantity - slot.quantity;
          slot.quantity = newQuantity;

          this.addMemory(
            `Added ${added}x ${item.name} to existing stack`,
            'assistant',
            4,
            { itemId: item.id, quantity: added }
          );

          return {
            success: true,
            data: { item, quantity: added, slotIndex: existingSlot, stacked: true },
          };
        }
      }
    }

    // 找到空闲槽位
    const slotIndex = addData.slotIndex ?? this.findNextFreeSlot();
    if (slotIndex === -1) {
      return {
        success: false,
        error: 'No available slot found',
      };
    }

    // 添加到新槽位
    const actualQuantity = item.stackable ? Math.min(quantity, item.maxStack) : 1;
    this.inventoryState.slots.set(slotIndex, {
      itemId: item.id,
      quantity: actualQuantity,
      slotIndex,
    });
    this.inventoryState.usedSlots++;

    this.addMemory(
      `Added ${actualQuantity}x ${item.name} to slot ${slotIndex}`,
      'assistant',
      5,
      { itemId: item.id, quantity: actualQuantity, slotIndex }
    );

    const uiInstructions: UIInstruction[] = [
      {
        type: 'update',
        target: 'inventory',
        action: 'add_item',
        data: { item, quantity: actualQuantity, slotIndex },
        options: { priority: 'normal' },
      },
      {
        type: 'notify',
        target: 'notification',
        action: 'item_added',
        data: { message: `获得物品: ${item.name} x${actualQuantity}` },
        options: { duration: 2000 },
      },
    ];

    return {
      success: true,
      data: { item, quantity: actualQuantity, slotIndex, stacked: false },
      uiInstructions,
    };
  }

  /**
   * 从背包移除物品
   */
  private handleRemoveItem(data: Record<string, unknown>): AgentResponse {
    const removeData = data as {
      itemId: string;
      quantity?: number;
      slotIndex?: number;
    };

    if (!removeData.itemId) {
      return {
        success: false,
        error: 'Missing required field: itemId',
      };
    }

    const quantity = removeData.quantity || 1;
    let slotIndex = removeData.slotIndex;

    // 如果没有指定槽位，查找物品
    if (slotIndex === undefined) {
      slotIndex = this.findItemSlot(removeData.itemId);
      if (slotIndex === -1) {
        return {
          success: false,
          error: `Item not found in inventory: ${removeData.itemId}`,
        };
      }
    }

    const slot = this.inventoryState.slots.get(slotIndex);
    if (!slot || slot.itemId !== removeData.itemId) {
      return {
        success: false,
        error: `Item not found in slot ${slotIndex}`,
      };
    }

    const item = this.items.get(slot.itemId);
    if (!item) {
      return {
        success: false,
        error: 'Item data not found',
      };
    }

    // 检查数量
    if (slot.quantity < quantity) {
      return {
        success: false,
        error: `Not enough items. Have: ${slot.quantity}, Need: ${quantity}`,
      };
    }

    // 更新或移除槽位
    const removedQuantity = Math.min(quantity, slot.quantity);
    slot.quantity -= removedQuantity;

    if (slot.quantity <= 0) {
      this.inventoryState.slots.delete(slotIndex);
      this.inventoryState.usedSlots--;
    }

    this.addMemory(
      `Removed ${removedQuantity}x ${item.name} from slot ${slotIndex}`,
      'assistant',
      5,
      { itemId: item.id, quantity: removedQuantity, slotIndex }
    );

    const uiInstructions: UIInstruction[] = [
      {
        type: 'update',
        target: 'inventory',
        action: 'remove_item',
        data: { itemId: item.id, quantity: removedQuantity, slotIndex },
        options: { priority: 'normal' },
      },
    ];

    return {
      success: true,
      data: { item, quantity: removedQuantity, slotIndex },
      uiInstructions,
    };
  }

  /**
   * 获取单个物品信息
   */
  private handleGetItem(data: Record<string, unknown>): AgentResponse {
    const queryData = data as { itemId: string; slotIndex?: number };

    if (!queryData.itemId && queryData.slotIndex === undefined) {
      return {
        success: false,
        error: 'Missing required field: itemId or slotIndex',
      };
    }

    let item: Item | undefined;
    let slot: InventorySlot | undefined;

    if (queryData.slotIndex !== undefined) {
      slot = this.inventoryState.slots.get(queryData.slotIndex);
      if (!slot) {
        return {
          success: false,
          error: `Slot ${queryData.slotIndex} is empty`,
        };
      }
      item = this.items.get(slot.itemId);
    } else if (queryData.itemId) {
      item = this.items.get(queryData.itemId);
      if (item) {
        const slotIndex = this.findItemSlot(queryData.itemId);
        if (slotIndex !== -1) {
          slot = this.inventoryState.slots.get(slotIndex);
        }
      }
    }

    if (!item) {
      return {
        success: false,
        error: `Item not found: ${queryData.itemId}`,
      };
    }

    return {
      success: true,
      data: { item, quantity: slot?.quantity || 1, slotIndex: slot?.slotIndex },
    };
  }

  /**
   * 获取物品列表
   */
  private handleGetItems(data: Record<string, unknown>): AgentResponse {
    const filterData = data as ItemFilter;

    let items: Array<{ item: Item; quantity: number; slotIndex: number }> = [];

    for (const [slotIndex, slot] of this.inventoryState.slots) {
      const item = this.items.get(slot.itemId);
      if (!item) continue;

      // 应用过滤器
      if (filterData.type && item.type !== filterData.type) continue;
      if (filterData.rarity && item.rarity !== filterData.rarity) continue;
      if (filterData.name && !item.name.includes(filterData.name)) continue;
      if (filterData.stackable !== undefined && item.stackable !== filterData.stackable) continue;

      items.push({ item, quantity: slot.quantity, slotIndex });
    }

    return {
      success: true,
      data: { items, count: items.length },
    };
  }

  /**
   * 使用物品
   */
  private handleUseItem(data: Record<string, unknown>): AgentResponse {
    const useData = data as {
      itemId: string;
      slotIndex?: number;
      targetId?: string;
    };

    if (!useData.itemId) {
      return {
        success: false,
        error: 'Missing required field: itemId',
      };
    }

    let slotIndex = useData.slotIndex;
    if (slotIndex === undefined) {
      slotIndex = this.findItemSlot(useData.itemId);
      if (slotIndex === -1) {
        return {
          success: false,
          error: `Item not found: ${useData.itemId}`,
        };
      }
    }

    const slot = this.inventoryState.slots.get(slotIndex);
    if (!slot) {
      return {
        success: false,
        error: `Slot ${slotIndex} is empty`,
      };
    }

    const item = this.items.get(slot.itemId);
    if (!item) {
      return {
        success: false,
        error: 'Item data not found',
      };
    }

    // 检查是否可使用
    if (item.type !== 'consumable') {
      return {
        success: false,
        error: `Item type ${item.type} cannot be used directly`,
      };
    }

    // 应用效果
    const appliedEffects: ItemEffect[] = [];
    for (const effect of item.effects) {
      appliedEffects.push(effect);
    }

    // 消耗物品
    slot.quantity--;
    if (slot.quantity <= 0) {
      this.inventoryState.slots.delete(slotIndex);
      this.inventoryState.usedSlots--;
    }

    this.addMemory(
      `Used item: ${item.name}`,
      'assistant',
      6,
      { itemId: item.id, effects: appliedEffects }
    );

    const uiInstructions: UIInstruction[] = [
      {
        type: 'update',
        target: 'inventory',
        action: 'use_item',
        data: { itemId: item.id, effects: appliedEffects },
        options: { priority: 'normal' },
      },
      {
        type: 'notify',
        target: 'notification',
        action: 'item_used',
        data: { message: `使用了: ${item.name}` },
        options: { duration: 2000 },
      },
    ];

    // 如果有属性变化，通知数值智能体
    if (appliedEffects.length > 0) {
      uiInstructions.push({
        type: 'update',
        target: 'player_stats',
        action: 'apply_effects',
        data: { effects: appliedEffects },
        options: { priority: 'high' },
      });
    }

    return {
      success: true,
      data: { item, effects: appliedEffects, remainingQuantity: slot.quantity },
      uiInstructions,
    };
  }

  /**
   * 拆分堆叠
   */
  private handleSplitStack(data: Record<string, unknown>): AgentResponse {
    const splitData = data as {
      slotIndex: number;
      quantity: number;
    };

    if (splitData.slotIndex === undefined || !splitData.quantity) {
      return {
        success: false,
        error: 'Missing required fields: slotIndex, quantity',
      };
    }

    const sourceSlot = this.inventoryState.slots.get(splitData.slotIndex);
    if (!sourceSlot) {
      return {
        success: false,
        error: `Slot ${splitData.slotIndex} is empty`,
      };
    }

    const item = this.items.get(sourceSlot.itemId);
    if (!item || !item.stackable) {
      return {
        success: false,
        error: 'Item is not stackable',
      };
    }

    if (splitData.quantity >= sourceSlot.quantity) {
      return {
        success: false,
        error: 'Split quantity must be less than stack quantity',
      };
    }

    // 检查是否有空槽位
    const targetSlotIndex = this.findNextFreeSlot();
    if (targetSlotIndex === -1) {
      return {
        success: false,
        error: 'No free slot for split stack',
      };
    }

    // 执行拆分
    sourceSlot.quantity -= splitData.quantity;
    this.inventoryState.slots.set(targetSlotIndex, {
      itemId: item.id,
      quantity: splitData.quantity,
      slotIndex: targetSlotIndex,
    });
    this.inventoryState.usedSlots++;

    this.addMemory(
      `Split ${splitData.quantity}x ${item.name} to slot ${targetSlotIndex}`,
      'assistant',
      3,
      { itemId: item.id, quantity: splitData.quantity }
    );

    return {
      success: true,
      data: {
        item,
        sourceSlot: { slotIndex: splitData.slotIndex, quantity: sourceSlot.quantity },
        targetSlot: { slotIndex: targetSlotIndex, quantity: splitData.quantity },
      },
    };
  }

  /**
   * 合并堆叠
   */
  private handleMergeStacks(data: Record<string, unknown>): AgentResponse {
    const mergeData = data as {
      sourceSlotIndex: number;
      targetSlotIndex: number;
    };

    if (mergeData.sourceSlotIndex === undefined || mergeData.targetSlotIndex === undefined) {
      return {
        success: false,
        error: 'Missing required fields: sourceSlotIndex, targetSlotIndex',
      };
    }

    const sourceSlot = this.inventoryState.slots.get(mergeData.sourceSlotIndex);
    const targetSlot = this.inventoryState.slots.get(mergeData.targetSlotIndex);

    if (!sourceSlot || !targetSlot) {
      return {
        success: false,
        error: 'One or both slots are empty',
      };
    }

    if (sourceSlot.itemId !== targetSlot.itemId) {
      return {
        success: false,
        error: 'Cannot merge different items',
      };
    }

    const item = this.items.get(sourceSlot.itemId);
    if (!item || !item.stackable) {
      return {
        success: false,
        error: 'Item is not stackable',
      };
    }

    // 计算合并数量
    const totalQuantity = sourceSlot.quantity + targetSlot.quantity;
    const maxMerge = Math.min(totalQuantity, item.maxStack);
    const overflow = totalQuantity - maxMerge;

    // 更新目标槽位
    targetSlot.quantity = maxMerge;

    // 处理源槽位
    if (overflow > 0) {
      sourceSlot.quantity = overflow;
    } else {
      this.inventoryState.slots.delete(mergeData.sourceSlotIndex);
      this.inventoryState.usedSlots--;
    }

    this.addMemory(
      `Merged ${item.name} stacks`,
      'assistant',
      3,
      { itemId: item.id, totalQuantity, maxMerge, overflow }
    );

    return {
      success: true,
      data: {
        item,
        targetQuantity: targetSlot.quantity,
        sourceRemaining: overflow > 0 ? overflow : 0,
        sourceRemoved: overflow === 0,
      },
    };
  }

  // ==================== 装备系统 ====================

  /**
   * 装备物品
   */
  private handleEquipItem(data: Record<string, unknown>): AgentResponse {
    const equipData = data as {
      itemId: string;
      slotIndex?: number;
      targetSlot?: EquipmentSlot;
    };

    if (!equipData.itemId) {
      return {
        success: false,
        error: 'Missing required field: itemId',
      };
    }

    let slotIndex = equipData.slotIndex;
    if (slotIndex === undefined) {
      slotIndex = this.findItemSlot(equipData.itemId);
      if (slotIndex === -1) {
        return {
          success: false,
          error: `Item not found in inventory: ${equipData.itemId}`,
        };
      }
    }

    const slot = this.inventoryState.slots.get(slotIndex);
    if (!slot) {
      return {
        success: false,
        error: `Slot ${slotIndex} is empty`,
      };
    }

    const item = this.items.get(slot.itemId);
    if (!item) {
      return {
        success: false,
        error: 'Item data not found',
      };
    }

    // 检查是否是装备类型
    if (!this.isEquipable(item)) {
      return {
        success: false,
        error: `Item type ${item.type} cannot be equipped`,
      };
    }

    // 确定装备槽位
    const targetSlot = equipData.targetSlot || this.getEquipmentSlot(item);
    if (!targetSlot) {
      return {
        success: false,
        error: 'Cannot determine equipment slot for this item',
      };
    }

    // 检查需求
    const reqCheck = this.checkEquipRequirements(item);
    if (!reqCheck.met) {
      return {
        success: false,
        error: `Requirements not met: ${reqCheck.missing.join(', ')}`,
      };
    }

    // 处理已装备的物品
    let previousItem: Item | undefined;
    const existingEquip = this.inventoryState.equipment.get(targetSlot);
    if (existingEquip) {
      previousItem = this.items.get(existingEquip.itemId);
      if (previousItem) {
        // 将原装备放回背包
        const freeSlot = this.findNextFreeSlot();
        if (freeSlot === -1) {
          return {
            success: false,
            error: 'No free slot to unequip current item',
          };
        }
        this.inventoryState.slots.set(freeSlot, {
          itemId: previousItem.id,
          quantity: 1,
          slotIndex: freeSlot,
        });
        this.inventoryState.usedSlots++;
      }
    }

    // 从背包移除物品
    if (slot.quantity > 1) {
      slot.quantity--;
    } else {
      this.inventoryState.slots.delete(slotIndex);
      this.inventoryState.usedSlots--;
    }

    // 装备新物品
    this.inventoryState.equipment.set(targetSlot, {
      itemId: item.id,
      slot: targetSlot,
      equippedAt: Date.now(),
    });

    // 计算属性变化
    const statChanges = this.calculateStatChanges(previousItem, item);

    this.addMemory(
      `Equipped ${item.name} to ${targetSlot} slot`,
      'assistant',
      7,
      { itemId: item.id, slot: targetSlot, previousItem: previousItem?.id }
    );

    const uiInstructions: UIInstruction[] = [
      {
        type: 'update',
        target: 'equipment',
        action: 'equip_item',
        data: { item, slot: targetSlot, previousItem },
        options: { priority: 'high' },
      },
      {
        type: 'update',
        target: 'player_stats',
        action: 'apply_stat_changes',
        data: { changes: statChanges },
        options: { priority: 'high' },
      },
      {
        type: 'notify',
        target: 'notification',
        action: 'item_equipped',
        data: { message: `装备了: ${item.name}` },
        options: { duration: 2000 },
      },
    ];

    const result: EquipResult = {
      success: true,
      item,
      slot: targetSlot,
      previousItem,
      statChanges,
    };

    return {
      success: true,
      data: result,
      uiInstructions,
    };
  }

  /**
   * 卸下装备
   */
  private handleUnequipItem(data: Record<string, unknown>): AgentResponse {
    const unequipData = data as { slot: EquipmentSlot };

    if (!unequipData.slot) {
      return {
        success: false,
        error: 'Missing required field: slot',
      };
    }

    const equipped = this.inventoryState.equipment.get(unequipData.slot);
    if (!equipped) {
      return {
        success: false,
        error: `No item equipped in slot ${unequipData.slot}`,
      };
    }

    const item = this.items.get(equipped.itemId);
    if (!item) {
      return {
        success: false,
        error: 'Equipped item data not found',
      };
    }

    // 检查背包空间
    if (this.inventoryState.usedSlots >= this.inventoryState.capacity) {
      return {
        success: false,
        error: 'Inventory is full, cannot unequip',
      };
    }

    // 找到空闲槽位
    const freeSlot = this.findNextFreeSlot();

    // 从装备槽移除
    this.inventoryState.equipment.delete(unequipData.slot);

    // 添加到背包
    this.inventoryState.slots.set(freeSlot, {
      itemId: item.id,
      quantity: 1,
      slotIndex: freeSlot,
    });
    this.inventoryState.usedSlots++;

    // 计算属性变化（移除装备的加成）
    const statChanges: Record<string, number> = {};
    for (const [stat, value] of Object.entries(item.stats)) {
      statChanges[stat] = -value;
    }

    this.addMemory(
      `Unequipped ${item.name} from ${unequipData.slot} slot`,
      'assistant',
      6,
      { itemId: item.id, slot: unequipData.slot }
    );

    const uiInstructions: UIInstruction[] = [
      {
        type: 'update',
        target: 'equipment',
        action: 'unequip_item',
        data: { item, slot: unequipData.slot },
        options: { priority: 'high' },
      },
      {
        type: 'update',
        target: 'player_stats',
        action: 'apply_stat_changes',
        data: { changes: statChanges },
        options: { priority: 'high' },
      },
      {
        type: 'notify',
        target: 'notification',
        action: 'item_unequipped',
        data: { message: `卸下了: ${item.name}` },
        options: { duration: 2000 },
      },
    ];

    return {
      success: true,
      data: { item, slot: unequipData.slot, statChanges },
      uiInstructions,
    };
  }

  /**
   * 获取装备信息
   */
  private handleGetEquipment(data: Record<string, unknown>): AgentResponse {
    const queryData = data as { slot?: EquipmentSlot };

    if (queryData.slot) {
      const equipped = this.inventoryState.equipment.get(queryData.slot);
      if (!equipped) {
        return {
          success: true,
          data: { slot: queryData.slot, item: null },
        };
      }

      const item = this.items.get(equipped.itemId);
      return {
        success: true,
        data: { slot: queryData.slot, item, equippedAt: equipped.equippedAt },
      };
    }

    // 返回所有装备
    const equipment: Array<{ slot: EquipmentSlot; item: Item | null; equippedAt?: number }> = [];
    const allSlots: EquipmentSlot[] = ['weapon', 'head', 'body', 'feet', 'accessory'];

    for (const slot of allSlots) {
      const equipped = this.inventoryState.equipment.get(slot);
      equipment.push({
        slot,
        item: equipped ? this.items.get(equipped.itemId) || null : null,
        equippedAt: equipped?.equippedAt,
      });
    }

    return {
      success: true,
      data: { equipment },
    };
  }

  /**
   * 计算属性加成
   */
  private handleCalculateStats(data: Record<string, unknown>): AgentResponse {
    const baseStats = (data.baseStats as Record<string, number>) || {};

    const statBonus = this.calculateTotalStats(baseStats);

    return {
      success: true,
      data: statBonus,
    };
  }

  /**
   * 检查装备需求
   */
  private handleCheckRequirements(data: Record<string, unknown>): AgentResponse {
    const checkData = data as { itemId: string; playerStats?: Record<string, number> };

    if (!checkData.itemId) {
      return {
        success: false,
        error: 'Missing required field: itemId',
      };
    }

    const item = this.items.get(checkData.itemId);
    if (!item) {
      return {
        success: false,
        error: `Item not found: ${checkData.itemId}`,
      };
    }

    const result = this.checkEquipRequirements(item, checkData.playerStats);

    return {
      success: true,
      data: result,
    };
  }

  // ==================== 交易处理 ====================

  /**
   * 购买物品
   */
  private handleBuyItem(data: Record<string, unknown>): AgentResponse {
    const buyData = data as unknown as TradeRequest & { item: Item };

    if (!buyData.item && !buyData.itemId) {
      return {
        success: false,
        error: 'Missing required field: item or itemId',
      };
    }

    const item = buyData.item || this.items.get(buyData.itemId || '');
    if (!item) {
      return {
        success: false,
        error: 'Item not found',
      };
    }

    const quantity = buyData.quantity || 1;
    const priceMultiplier = buyData.priceMultiplier || 1;

    // 计算总价
    const totalPrice = Math.floor(item.value.buy * quantity * priceMultiplier);
    const currency = item.value.currency || 'gold';

    // 检查货币余额
    const currentBalance = this.inventoryState.currency[currency] || 0;
    if (currentBalance < totalPrice) {
      return {
        success: false,
        error: `Not enough ${currency}. Have: ${currentBalance}, Need: ${totalPrice}`,
      };
    }

    // 检查背包空间
    if (!item.stackable || !this.findStackableSlot(item)) {
      if (this.inventoryState.usedSlots >= this.inventoryState.capacity) {
        return {
          success: false,
          error: 'Inventory is full',
        };
      }
    }

    // 扣除货币
    this.inventoryState.currency[currency] -= totalPrice;

    // 添加物品到背包
    const addResult = this.addItemToInventory(item, quantity);

    this.addMemory(
      `Bought ${quantity}x ${item.name} for ${totalPrice} ${currency}`,
      'assistant',
      7,
      { itemId: item.id, quantity, price: totalPrice, currency }
    );

    const uiInstructions: UIInstruction[] = [
      {
        type: 'update',
        target: 'currency',
        action: 'deduct',
        data: { amount: totalPrice, currency },
        options: { priority: 'high' },
      },
      {
        type: 'notify',
        target: 'notification',
        action: 'item_purchased',
        data: { message: `购买了: ${item.name} x${quantity}`, price: totalPrice, currency },
        options: { duration: 3000 },
      },
    ];

    const result: TradeResult = {
      success: true,
      itemId: item.id,
      quantity,
      totalPrice,
      currency,
      newBalance: this.inventoryState.currency[currency],
    };

    return {
      success: true,
      data: { ...result, addResult },
      uiInstructions,
    };
  }

  /**
   * 出售物品
   */
  private handleSellItem(data: Record<string, unknown>): AgentResponse {
    const sellData = data as unknown as TradeRequest;

    if (!sellData.itemId) {
      return {
        success: false,
        error: 'Missing required field: itemId',
      };
    }

    const quantity = sellData.quantity || 1;
    const priceMultiplier = sellData.priceMultiplier || 1;

    // 查找物品
    const slotIndex = this.findItemSlot(sellData.itemId);
    if (slotIndex === -1) {
      return {
        success: false,
        error: `Item not found in inventory: ${sellData.itemId}`,
      };
    }

    const slot = this.inventoryState.slots.get(slotIndex);
    if (!slot) {
      return {
        success: false,
        error: 'Slot data not found',
      };
    }

    const item = this.items.get(slot.itemId);
    if (!item) {
      return {
        success: false,
        error: 'Item data not found',
      };
    }

    // 任务物品不能出售
    if (item.type === 'quest') {
      return {
        success: false,
        error: 'Quest items cannot be sold',
      };
    }

    // 检查数量
    const sellQuantity = Math.min(quantity, slot.quantity);
    if (sellQuantity <= 0) {
      return {
        success: false,
        error: 'No items to sell',
      };
    }

    // 计算售价
    const totalPrice = Math.floor(item.value.sell * sellQuantity * priceMultiplier);
    const currency = item.value.currency || 'gold';

    // 从背包移除
    slot.quantity -= sellQuantity;
    if (slot.quantity <= 0) {
      this.inventoryState.slots.delete(slotIndex);
      this.inventoryState.usedSlots--;
    }

    // 增加货币
    this.inventoryState.currency[currency] = (this.inventoryState.currency[currency] || 0) + totalPrice;

    this.addMemory(
      `Sold ${sellQuantity}x ${item.name} for ${totalPrice} ${currency}`,
      'assistant',
      7,
      { itemId: item.id, quantity: sellQuantity, price: totalPrice, currency }
    );

    const uiInstructions: UIInstruction[] = [
      {
        type: 'update',
        target: 'currency',
        action: 'add',
        data: { amount: totalPrice, currency },
        options: { priority: 'high' },
      },
      {
        type: 'notify',
        target: 'notification',
        action: 'item_sold',
        data: { message: `出售了: ${item.name} x${sellQuantity}`, price: totalPrice, currency },
        options: { duration: 3000 },
      },
    ];

    const result: TradeResult = {
      success: true,
      itemId: item.id,
      quantity: sellQuantity,
      totalPrice,
      currency,
      newBalance: this.inventoryState.currency[currency],
    };

    return {
      success: true,
      data: result,
      uiInstructions,
    };
  }

  /**
   * 计算价格
   */
  private handleCalculatePrice(data: Record<string, unknown>): AgentResponse {
    const priceData = data as {
      itemId: string;
      quantity?: number;
      type: 'buy' | 'sell';
      priceMultiplier?: number;
      merchantRelation?: number;
    };

    if (!priceData.itemId) {
      return {
        success: false,
        error: 'Missing required field: itemId',
      };
    }

    const item = this.items.get(priceData.itemId);
    if (!item) {
      return {
        success: false,
        error: `Item not found: ${priceData.itemId}`,
      };
    }

    const quantity = priceData.quantity || 1;
    const baseMultiplier = priceData.priceMultiplier || 1;

    // 根据商人好感度调整价格
    let relationMultiplier = 1;
    if (priceData.merchantRelation) {
      relationMultiplier = priceData.type === 'buy'
        ? 1 - (priceData.merchantRelation * 0.001) // 购买时好感度降低价格
        : 1 + (priceData.merchantRelation * 0.001); // 出售时好感度提高价格
    }

    const basePrice = priceData.type === 'buy' ? item.value.buy : item.value.sell;
    const finalPrice = Math.floor(basePrice * quantity * baseMultiplier * relationMultiplier);

    return {
      success: true,
      data: {
        itemId: item.id,
        itemName: item.name,
        type: priceData.type,
        quantity,
        basePrice: item.value[priceData.type],
        priceMultiplier: baseMultiplier,
        relationMultiplier,
        finalPrice,
        currency: item.value.currency || 'gold',
      },
    };
  }

  /**
   * 获取货币余额
   */
  private handleGetCurrency(data: Record<string, unknown>): AgentResponse {
    const queryData = data as { currency?: string };

    if (queryData.currency) {
      return {
        success: true,
        data: {
          currency: queryData.currency,
          amount: this.inventoryState.currency[queryData.currency] || 0,
        },
      };
    }

    return {
      success: true,
      data: { currency: this.inventoryState.currency },
    };
  }

  /**
   * 增加货币
   */
  private handleAddCurrency(data: Record<string, unknown>): AgentResponse {
    const addData = data as {
      currency: string;
      amount: number;
      source?: string;
    };

    if (!addData.currency || addData.amount === undefined) {
      return {
        success: false,
        error: 'Missing required fields: currency, amount',
      };
    }

    const previousAmount = this.inventoryState.currency[addData.currency] || 0;
    this.inventoryState.currency[addData.currency] = previousAmount + addData.amount;

    this.addMemory(
      `Added ${addData.amount} ${addData.currency}. Source: ${addData.source || 'unknown'}`,
      'assistant',
      6,
      { currency: addData.currency, amount: addData.amount, source: addData.source }
    );

    const uiInstructions: UIInstruction[] = [
      {
        type: 'update',
        target: 'currency',
        action: 'add',
        data: { amount: addData.amount, currency: addData.currency },
        options: { priority: 'high' },
      },
    ];

    return {
      success: true,
      data: {
        currency: addData.currency,
        previousAmount,
        addedAmount: addData.amount,
        newAmount: this.inventoryState.currency[addData.currency],
      },
      uiInstructions,
    };
  }

  // ==================== 背包管理 ====================

  /**
   * 获取背包状态
   */
  private handleGetInventory(_data: Record<string, unknown>): AgentResponse {
    const slots: Array<{ slotIndex: number; item: Item; quantity: number }> = [];

    for (const [slotIndex, slot] of this.inventoryState.slots) {
      const item = this.items.get(slot.itemId);
      if (item) {
        slots.push({ slotIndex, item, quantity: slot.quantity });
      }
    }

    return {
      success: true,
      data: {
        slots,
        capacity: this.inventoryState.capacity,
        usedSlots: this.inventoryState.usedSlots,
        freeSlots: this.inventoryState.capacity - this.inventoryState.usedSlots,
        currency: this.inventoryState.currency,
      },
    };
  }

  /**
   * 获取统计数据
   */
  private handleGetStatistics(): AgentResponse {
    const stats: InventoryStatistics = {
      totalItems: 0,
      totalValue: 0,
      byType: {
        weapon: 0,
        armor: 0,
        accessory: 0,
        consumable: 0,
        material: 0,
        quest: 0,
        misc: 0,
      },
      byRarity: {
        common: 0,
        uncommon: 0,
        rare: 0,
        epic: 0,
        legendary: 0,
        unique: 0,
      },
      equippedCount: this.inventoryState.equipment.size,
      capacityUsed: this.inventoryState.usedSlots,
      capacityRemaining: this.inventoryState.capacity - this.inventoryState.usedSlots,
    };

    for (const slot of this.inventoryState.slots.values()) {
      const item = this.items.get(slot.itemId);
      if (item) {
        stats.totalItems += slot.quantity;
        stats.totalValue += item.value.sell * slot.quantity;
        stats.byType[item.type] += slot.quantity;
        stats.byRarity[item.rarity] += slot.quantity;
      }
    }

    return {
      success: true,
      data: stats,
    };
  }

  /**
   * 扩展背包容量
   */
  private handleExpandCapacity(data: Record<string, unknown>): AgentResponse {
    const expandData = data as { amount: number; cost?: number };

    if (!expandData.amount || expandData.amount <= 0) {
      return {
        success: false,
        error: 'Invalid expansion amount',
      };
    }

    const cost = expandData.cost || expandData.amount * 100; // 默认每格100金币

    // 检查货币
    if (this.inventoryState.currency.gold < cost) {
      return {
        success: false,
        error: `Not enough gold. Have: ${this.inventoryState.currency.gold}, Need: ${cost}`,
      };
    }

    // 扣除货币
    this.inventoryState.currency.gold -= cost;

    // 扩展容量
    const previousCapacity = this.inventoryState.capacity;
    this.inventoryState.capacity += expandData.amount;

    this.addMemory(
      `Expanded inventory capacity from ${previousCapacity} to ${this.inventoryState.capacity}`,
      'assistant',
      8,
      { previousCapacity, newCapacity: this.inventoryState.capacity, cost }
    );

    const uiInstructions: UIInstruction[] = [
      {
        type: 'update',
        target: 'inventory',
        action: 'expand_capacity',
        data: { newCapacity: this.inventoryState.capacity, cost },
        options: { priority: 'high' },
      },
      {
        type: 'notify',
        target: 'notification',
        action: 'capacity_expanded',
        data: { message: `背包容量扩展了 ${expandData.amount} 格` },
        options: { duration: 3000 },
      },
    ];

    return {
      success: true,
      data: {
        previousCapacity,
        newCapacity: this.inventoryState.capacity,
        expandedBy: expandData.amount,
        cost,
      },
      uiInstructions,
    };
  }

  /**
   * 整理背包
   */
  private handleSortInventory(data: Record<string, unknown>): AgentResponse {
    const sortData = data as {
      sortBy?: 'type' | 'rarity' | 'name' | 'value';
      ascending?: boolean;
    };

    const sortBy = sortData.sortBy || 'type';
    const ascending = sortData.ascending !== false;

    // 收集所有物品
    const items: Array<{ itemId: string; quantity: number }> = [];
    for (const slot of this.inventoryState.slots.values()) {
      items.push({ itemId: slot.itemId, quantity: slot.quantity });
    }

    // 排序
    items.sort((a, b) => {
      const itemA = this.items.get(a.itemId);
      const itemB = this.items.get(b.itemId);
      if (!itemA || !itemB) return 0;

      let comparison = 0;
      switch (sortBy) {
        case 'type':
          comparison = itemA.type.localeCompare(itemB.type);
          break;
        case 'rarity': {
          const rarityOrder: ItemRarity[] = ['unique', 'legendary', 'epic', 'rare', 'uncommon', 'common'];
          comparison = rarityOrder.indexOf(itemA.rarity) - rarityOrder.indexOf(itemB.rarity);
          break;
        }
        case 'name':
          comparison = itemA.name.localeCompare(itemB.name);
          break;
        case 'value':
          comparison = itemA.value.sell - itemB.value.sell;
          break;
      }

      return ascending ? comparison : -comparison;
    });

    // 重新分配槽位
    this.inventoryState.slots.clear();
    items.forEach((item, index) => {
      this.inventoryState.slots.set(index, {
        itemId: item.itemId,
        quantity: item.quantity,
        slotIndex: index,
      });
    });

    this.addMemory(
      `Sorted inventory by ${sortBy} (${ascending ? 'ascending' : 'descending'})`,
      'assistant',
      3,
      { sortBy, ascending }
    );

    return {
      success: true,
      data: { sorted: items.length, sortBy, ascending },
    };
  }

  /**
   * 查找空闲槽位
   */
  private handleFindFreeSlot(): AgentResponse {
    const freeSlot = this.findNextFreeSlot();

    return {
      success: true,
      data: {
        freeSlot,
        hasFreeSlot: freeSlot !== -1,
        usedSlots: this.inventoryState.usedSlots,
        capacity: this.inventoryState.capacity,
      },
    };
  }

  /**
   * 创建物品（用于测试或GM命令）
   */
  private handleCreateItem(data: Record<string, unknown>): AgentResponse {
    const createData = data as {
      name: string;
      type: ItemType;
      rarity?: ItemRarity;
      stats?: Record<string, number>;
      effects?: ItemEffect[];
      requirements?: ItemRequirements;
      value?: { buy: number; sell: number; currency?: string };
      stackable?: boolean;
      maxStack?: number;
      description?: string;
    };

    if (!createData.name || !createData.type) {
      return {
        success: false,
        error: 'Missing required fields: name, type',
      };
    }

    const rarity = createData.rarity || 'common';
    const rarityConfig = RARITY_CONFIG[rarity];

    // 构建物品价值
    const itemValue = createData.value
      ? { ...createData.value, currency: createData.value.currency || 'gold' }
      : {
          buy: Math.floor(100 * rarityConfig.multiplier),
          sell: Math.floor(50 * rarityConfig.multiplier),
          currency: 'gold' as const,
        };

    const item: Item = {
      id: this.generateItemId(),
      name: createData.name,
      description: createData.description || `${createData.name} - ${createData.type}`,
      type: createData.type,
      rarity,
      stats: createData.stats || {},
      effects: createData.effects || [],
      requirements: createData.requirements || {},
      value: itemValue,
      stackable: createData.stackable ?? (createData.type === 'consumable' || createData.type === 'material'),
      maxStack: createData.maxStack || 99,
    };

    this.items.set(item.id, item);

    this.addMemory(
      `Created item: ${item.name} (${item.rarity} ${item.type})`,
      'assistant',
      5,
      { itemId: item.id, type: item.type, rarity: item.rarity }
    );

    return {
      success: true,
      data: { item },
    };
  }

  // ==================== 辅助方法 ====================

  /**
   * 查找下一个空闲槽位
   */
  private findNextFreeSlot(): number {
    for (let i = 0; i < this.inventoryState.capacity; i++) {
      if (!this.inventoryState.slots.has(i)) {
        return i;
      }
    }
    return -1;
  }

  /**
   * 查找物品所在槽位
   */
  private findItemSlot(itemId: string): number {
    for (const [slotIndex, slot] of this.inventoryState.slots) {
      if (slot.itemId === itemId) {
        return slotIndex;
      }
    }
    return -1;
  }

  /**
   * 查找可堆叠的槽位
   */
  private findStackableSlot(item: Item): number | null {
    if (!item.stackable) return null;

    for (const [slotIndex, slot] of this.inventoryState.slots) {
      if (slot.itemId === item.id && slot.quantity < item.maxStack) {
        return slotIndex;
      }
    }
    return null;
  }

  /**
   * 检查物品是否可装备
   */
  private isEquipable(item: Item): boolean {
    return ['weapon', 'armor', 'accessory'].includes(item.type);
  }

  /**
   * 获取物品对应的装备槽位
   */
  private getEquipmentSlot(item: Item): EquipmentSlot | null {
    if (item.type === 'weapon') return 'weapon';
    if (item.type === 'accessory') return 'accessory';
    if (item.type === 'armor') {
      // 根据物品名称或属性判断具体部位
      if (item.name.includes('头盔') || item.name.includes('头')) return 'head';
      if (item.name.includes('靴') || item.name.includes('脚')) return 'feet';
      return 'body';
    }
    return null;
  }

  /**
   * 检查装备需求
   */
  private checkEquipRequirements(
    item: Item,
    playerStats?: Record<string, number>
  ): { met: boolean; missing: string[]; requirements: ItemRequirements } {
    const missing: string[] = [];
    const stats = playerStats || {};

    if (item.requirements.level && (stats.level || 1) < item.requirements.level) {
      missing.push(`需要等级 ${item.requirements.level}`);
    }

    if (item.requirements.attributes) {
      for (const [attr, value] of Object.entries(item.requirements.attributes)) {
        if ((stats[attr] || 0) < value) {
          missing.push(`需要 ${attr} ${value}`);
        }
      }
    }

    if (item.requirements.class && item.requirements.class.length > 0) {
      const playerClass = stats.class as unknown as string | undefined;
      if (!playerClass || !item.requirements.class.includes(playerClass)) {
        missing.push(`需要职业: ${item.requirements.class.join(' 或 ')}`);
      }
    }

    return {
      met: missing.length === 0,
      missing,
      requirements: item.requirements,
    };
  }

  /**
   * 计算属性变化
   */
  private calculateStatChanges(oldItem: Item | undefined, newItem: Item): Record<string, number> {
    const changes: Record<string, number> = {};

    // 移除旧装备属性
    if (oldItem) {
      for (const [stat, value] of Object.entries(oldItem.stats)) {
        changes[stat] = (changes[stat] || 0) - value;
      }
    }

    // 添加新装备属性
    for (const [stat, value] of Object.entries(newItem.stats)) {
      changes[stat] = (changes[stat] || 0) + value;
    }

    return changes;
  }

  /**
   * 计算总属性
   */
  private calculateTotalStats(baseStats: Record<string, number>): StatBonus {
    const fromEquipment: Record<string, number> = {};

    // 累加所有装备属性
    for (const equipped of this.inventoryState.equipment.values()) {
      const item = this.items.get(equipped.itemId);
      if (item) {
        for (const [stat, value] of Object.entries(item.stats)) {
          fromEquipment[stat] = (fromEquipment[stat] || 0) + value;
        }
      }
    }

    // 计算总属性
    const total: Record<string, number> = { ...baseStats };
    for (const [stat, value] of Object.entries(fromEquipment)) {
      total[stat] = (total[stat] || 0) + value;
    }

    return {
      base: baseStats,
      fromEquipment,
      total,
    };
  }

  /**
   * 添加物品到背包（内部方法）
   */
  private addItemToInventory(item: Item, quantity: number): { slotIndex: number; quantity: number } {
    // 处理堆叠
    if (item.stackable) {
      const existingSlot = this.findStackableSlot(item);
      if (existingSlot !== null) {
        const slot = this.inventoryState.slots.get(existingSlot);
        if (slot) {
          const newQuantity = Math.min(slot.quantity + quantity, item.maxStack);
          slot.quantity = newQuantity;
          return { slotIndex: existingSlot, quantity: newQuantity };
        }
      }
    }

    // 添加到新槽位
    const slotIndex = this.findNextFreeSlot();
    const actualQuantity = item.stackable ? Math.min(quantity, item.maxStack) : 1;

    this.inventoryState.slots.set(slotIndex, {
      itemId: item.id,
      quantity: actualQuantity,
      slotIndex,
    });
    this.inventoryState.usedSlots++;

    return { slotIndex, quantity: actualQuantity };
  }

  /**
   * 生成物品ID
   */
  private generateItemId(): string {
    this.itemIdCounter++;
    return `item_${Date.now()}_${this.itemIdCounter}`;
  }
}

export default InventoryAgent;
