import type {
  Item,
  ItemType,
  ItemRarity,
  EquipmentSlotType,
  InventorySlot,
  EquippedItem,
  InventoryState,
  TradeResult,
  EquipResult,
  RequirementCheckResult,
  StatBonus,
  InventoryStatistics,
  AddItemResponse,
  RemoveItemResponse,
  UseItemResponse,
  ExpandCapacityResponse,
} from '@ai-rpg/shared';
import { getItemRepository, ItemRepository } from '../models/ItemRepository';
import type { InventoryItemEntity } from '../models/ItemRepository';
import { gameLog } from './GameLogService';

// ==================== 类型定义 ====================

/**
 * 背包容量配置
 */
interface CapacityConfig {
  default: number;
  max: number;
  expandCost: number; // 每格扩展成本
}

/**
 * 默认背包容量配置
 */
const DEFAULT_CAPACITY_CONFIG: CapacityConfig = {
  default: 40,
  max: 200,
  expandCost: 100,
};

// ==================== InventoryService ====================

/**
 * 背包服务
 * 负责物品管理、装备系统、交易处理的核心业务逻辑
 */
export class InventoryService {
  private itemRepository: ItemRepository;
  private capacityConfig: CapacityConfig;

  // 内存缓存：角色背包容量
  private capacityCache: Map<string, number> = new Map();

  // 内存缓存：角色货币
  private currencyCache: Map<string, Record<string, number>> = new Map();

  // 物品ID计数器
  private itemIdCounter: number = 0;

  constructor(capacityConfig: CapacityConfig = DEFAULT_CAPACITY_CONFIG) {
    this.itemRepository = getItemRepository();
    this.capacityConfig = capacityConfig;
  }

  // ==================== 物品管理 ====================

  /**
   * 添加物品到背包
   */
  public addItem(
    saveId: string,
    characterId: string,
    item: Item,
    quantity: number = 1,
    slotIndex?: number
  ): AddItemResponse {
    // 检查背包容量
    const capacity = this.getCapacity(saveId, characterId);
    const usedSlots = this.itemRepository.findByCharacter(saveId, characterId).length;

    // 处理堆叠
    if (item.stackable) {
      const existingItem = this.itemRepository.findByItemId(saveId, characterId, item.id);
      if (existingItem && existingItem.quantity < item.maxStack) {
        const newQuantity = Math.min(existingItem.quantity + quantity, item.maxStack);
        const added = newQuantity - existingItem.quantity;
        this.itemRepository.updateQuantity(existingItem.id, newQuantity);

        gameLog.debug('backend', '添加物品详情', {
          itemId: item.id,
          quantity: added,
          itemDetails: { name: item.name, type: item.type, rarity: item.rarity },
          stacked: true,
        });

        return {
          success: true,
          item,
          quantity: added,
          slotIndex: existingItem.id as unknown as number,
          stacked: true,
        };
      }
    }

    // 检查是否有空槽位
    if (usedSlots >= capacity) {
      return {
        success: false,
        item,
        quantity: 0,
        slotIndex: -1,
        stacked: false,
      };
    }

    // 创建新物品
    const entity = this.itemRepository.createInventoryItem({
      saveId,
      characterId,
      item,
      quantity: item.stackable ? Math.min(quantity, item.maxStack) : 1,
      slotIndex,
    });

    gameLog.debug('backend', '添加物品详情', {
      itemId: item.id,
      quantity: entity.quantity,
      itemDetails: { name: item.name, type: item.type, rarity: item.rarity },
      stacked: false,
    });

    return {
      success: true,
      item,
      quantity: entity.quantity,
      slotIndex: entity.id as unknown as number,
      stacked: false,
    };
  }

  /**
   * 从背包移除物品
   */
  public removeItem(
    saveId: string,
    characterId: string,
    itemId: string,
    quantity: number = 1,
    slotIndex?: number
  ): RemoveItemResponse {
    let entity: InventoryItemEntity | undefined;

    if (slotIndex !== undefined) {
      entity = this.itemRepository.findById(String(slotIndex));
    } else {
      entity = this.itemRepository.findByItemId(saveId, characterId, itemId);
    }

    if (!entity) {
      throw new Error(`Item not found: ${itemId}`);
    }

    if (entity.quantity < quantity) {
      throw new Error(`Not enough items. Have: ${entity.quantity}, Need: ${quantity}`);
    }

    const removedQuantity = Math.min(quantity, entity.quantity);
    const newQuantity = entity.quantity - removedQuantity;

    if (newQuantity <= 0) {
      this.itemRepository.deleteById(entity.id);
    } else {
      this.itemRepository.updateQuantity(entity.id, newQuantity);
    }

    const slot = this.itemRepository.entityToSlot(entity);

    gameLog.info('backend', '移除物品', { characterId, itemId, quantity: removedQuantity });

    return {
      success: true,
      item: slot.item!,
      quantity: removedQuantity,
      slotIndex: entity.id as unknown as number,
    };
  }

  /**
   * 使用物品
   */
  public useItem(
    saveId: string,
    characterId: string,
    itemId: string,
    slotIndex?: number,
    _targetId?: string
  ): UseItemResponse {
    let entity: InventoryItemEntity | undefined;

    if (slotIndex !== undefined) {
      entity = this.itemRepository.findById(String(slotIndex));
    } else {
      entity = this.itemRepository.findByItemId(saveId, characterId, itemId);
    }

    if (!entity) {
      throw new Error(`Item not found: ${itemId}`);
    }

    const slot = this.itemRepository.entityToSlot(entity);
    const item = slot.item!;

    // 检查是否可使用
    if (item.type !== 'consumable') {
      throw new Error(`Item type ${item.type} cannot be used directly`);
    }

    // 应用效果
    const appliedEffects = [...item.effects];

    // 消耗物品
    const newQuantity = entity.quantity - 1;
    let remainingQuantity = 0;

    if (newQuantity <= 0) {
      this.itemRepository.deleteById(entity.id);
    } else {
      this.itemRepository.updateQuantity(entity.id, newQuantity);
      remainingQuantity = newQuantity;
    }

    gameLog.debug('backend', '使用物品详情', {
      itemId,
      targetId: _targetId,
      effects: item.effects,
      remainingQuantity,
      itemDetails: { name: item.name, type: item.type, rarity: item.rarity },
    });

    return {
      success: true,
      item,
      effects: appliedEffects,
      remainingQuantity,
    };
  }

  /**
   * 拆分堆叠
   */
  public splitStack(
    saveId: string,
    characterId: string,
    slotIndex: number,
    quantity: number
  ): { sourceSlot: InventorySlot; targetSlot: InventorySlot } {
    const sourceEntity = this.itemRepository.findById(String(slotIndex));
    if (!sourceEntity) {
      throw new Error(`Slot ${slotIndex} is empty`);
    }

    const sourceSlot = this.itemRepository.entityToSlot(sourceEntity);
    const item = sourceSlot.item!;

    if (!item.stackable) {
      throw new Error('Item is not stackable');
    }

    if (quantity >= sourceEntity.quantity) {
      throw new Error('Split quantity must be less than stack quantity');
    }

    // 检查背包空间
    const capacity = this.getCapacity(saveId, characterId);
    const usedSlots = this.itemRepository.findByCharacter(saveId, characterId).length;

    if (usedSlots >= capacity) {
      throw new Error('No free slot for split stack');
    }

    // 更新源槽位
    this.itemRepository.updateQuantity(sourceEntity.id, sourceEntity.quantity - quantity);

    // 创建新槽位
    const newEntity = this.itemRepository.createInventoryItem({
      saveId,
      characterId,
      item,
      quantity,
    });

    const updatedSourceEntity = this.itemRepository.findById(sourceEntity.id);

    return {
      sourceSlot: this.itemRepository.entityToSlot(updatedSourceEntity!),
      targetSlot: this.itemRepository.entityToSlot(newEntity),
    };
  }

  /**
   * 合并堆叠
   */
  public mergeStacks(
    _saveId: string,
    _characterId: string,
    sourceSlotIndex: number,
    targetSlotIndex: number
  ): { targetSlot: InventorySlot; sourceRemaining: number; sourceRemoved: boolean } {
    const sourceEntity = this.itemRepository.findById(String(sourceSlotIndex));
    const targetEntity = this.itemRepository.findById(String(targetSlotIndex));

    if (!sourceEntity || !targetEntity) {
      throw new Error('One or both slots are empty');
    }

    if (sourceEntity.item_id !== targetEntity.item_id) {
      throw new Error('Cannot merge different items');
    }

    const sourceSlot = this.itemRepository.entityToSlot(sourceEntity);
    const item = sourceSlot.item!;

    if (!item.stackable) {
      throw new Error('Item is not stackable');
    }

    // 计算合并数量
    const totalQuantity = sourceEntity.quantity + targetEntity.quantity;
    const maxMerge = Math.min(totalQuantity, item.maxStack);
    const overflow = totalQuantity - maxMerge;

    // 更新目标槽位
    this.itemRepository.updateQuantity(targetEntity.id, maxMerge);

    // 处理源槽位
    if (overflow > 0) {
      this.itemRepository.updateQuantity(sourceEntity.id, overflow);
    } else {
      this.itemRepository.deleteById(sourceEntity.id);
    }

    const updatedTargetEntity = this.itemRepository.findById(targetEntity.id);

    return {
      targetSlot: this.itemRepository.entityToSlot(updatedTargetEntity!),
      sourceRemaining: overflow,
      sourceRemoved: overflow === 0,
    };
  }

  // ==================== 装备系统 ====================

  /**
   * 装备物品
   */
  public equipItem(
    saveId: string,
    characterId: string,
    itemId: string,
    slotIndex?: number,
    targetSlot?: EquipmentSlotType,
    playerStats?: Record<string, number>
  ): EquipResult {
    let entity: InventoryItemEntity | undefined;

    if (slotIndex !== undefined) {
      entity = this.itemRepository.findById(String(slotIndex));
    } else {
      entity = this.itemRepository.findByItemId(saveId, characterId, itemId);
    }

    if (!entity) {
      throw new Error(`Item not found: ${itemId}`);
    }

    const slot = this.itemRepository.entityToSlot(entity);
    const item = slot.item!;

    // 检查是否是装备类型
    if (!this.isEquipable(item)) {
      throw new Error(`Item type ${item.type} cannot be equipped`);
    }

    // 确定装备槽位
    const equipSlot = targetSlot || this.getEquipmentSlot(item);
    if (!equipSlot) {
      throw new Error('Cannot determine equipment slot for this item');
    }

    // 检查需求
    const reqCheck = this.checkEquipRequirements(item, playerStats);
    if (!reqCheck.met) {
      throw new Error(`Requirements not met: ${reqCheck.missing.join(', ')}`);
    }

    // 处理已装备的物品
    let previousItem: Item | undefined;
    const existingEquip = this.itemRepository.findByEquipmentSlot(saveId, characterId, equipSlot);

    if (existingEquip) {
      const prevSlot = this.itemRepository.entityToSlot(existingEquip);
      previousItem = prevSlot.item;

      // 检查背包空间
      const capacity = this.getCapacity(saveId, characterId);
      const usedSlots = this.itemRepository.findByCharacter(saveId, characterId).length;

      if (usedSlots >= capacity) {
        throw new Error('No free slot to unequip current item');
      }

      // 卸下原装备
      this.itemRepository.updateEquipStatus(existingEquip.id, false, null);
    }

    // 从背包移除物品（如果数量大于1，减少数量）
    if (entity.quantity > 1) {
      this.itemRepository.updateQuantity(entity.id, entity.quantity - 1);

      // 创建新的装备实例
      const newEntity = this.itemRepository.createInventoryItem({
        saveId,
        characterId,
        item,
        quantity: 1,
      });
      this.itemRepository.updateEquipStatus(newEntity.id, true, equipSlot);
    } else {
      // 直接装备
      this.itemRepository.updateEquipStatus(entity.id, true, equipSlot);
    }

    // 计算属性变化
    const statChanges = this.calculateStatChanges(previousItem, item);

    return {
      success: true,
      item,
      slot: equipSlot,
      previousItem,
      statChanges,
    };
  }

  /**
   * 卸下装备
   */
  public unequipItem(
    saveId: string,
    characterId: string,
    slot: EquipmentSlotType
  ): { item: Item; slot: EquipmentSlotType; statChanges: Record<string, number> } {
    const entity = this.itemRepository.findByEquipmentSlot(saveId, characterId, slot);

    if (!entity) {
      throw new Error(`No item equipped in slot ${slot}`);
    }

    const equippedSlot = this.itemRepository.entityToSlot(entity);
    const item = equippedSlot.item!;

    // 检查背包空间
    const capacity = this.getCapacity(saveId, characterId);
    const usedSlots = this.itemRepository.findByCharacter(saveId, characterId).length;

    if (usedSlots >= capacity) {
      throw new Error('Inventory is full, cannot unequip');
    }

    // 卸下装备
    this.itemRepository.updateEquipStatus(entity.id, false, null);

    // 计算属性变化
    const statChanges: Record<string, number> = {};
    for (const [stat, value] of Object.entries(item.stats)) {
      statChanges[stat] = -value;
    }

    return {
      item,
      slot,
      statChanges,
    };
  }

  /**
   * 获取装备信息
   */
  public getEquipment(saveId: string, characterId: string, slot?: EquipmentSlotType): EquippedItem[] {
    if (slot) {
      const entity = this.itemRepository.findByEquipmentSlot(saveId, characterId, slot);
      if (!entity) {
        return [];
      }
      return [this.itemRepository.entityToEquippedItem(entity)];
    }

    const entities = this.itemRepository.findEquipped(saveId, characterId);
    return entities.map((e) => this.itemRepository.entityToEquippedItem(e));
  }

  /**
   * 检查装备需求
   */
  public checkEquipRequirements(
    item: Item,
    playerStats?: Record<string, number>
  ): RequirementCheckResult {
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
   * 计算属性加成
   */
  public calculateStats(
    saveId: string,
    characterId: string,
    baseStats: Record<string, number>
  ): StatBonus {
    const fromEquipment: Record<string, number> = {};

    // 累加所有装备属性
    const equipped = this.itemRepository.findEquipped(saveId, characterId);
    for (const entity of equipped) {
      const slot = this.itemRepository.entityToSlot(entity);
      const item = slot.item;
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

  // ==================== 交易处理 ====================

  /**
   * 购买物品
   */
  public buyItem(
    saveId: string,
    characterId: string,
    item: Item,
    quantity: number = 1,
    priceMultiplier: number = 1
  ): TradeResult {
    // 计算总价
    const totalPrice = Math.floor(item.value.buy * quantity * priceMultiplier);
    const currency = item.value.currency || 'gold';

    // 检查货币余额
    const currentBalance = this.getCurrency(saveId, characterId, currency);
    if (currentBalance < totalPrice) {
      throw new Error(`Not enough ${currency}. Have: ${currentBalance}, Need: ${totalPrice}`);
    }

    // 检查背包空间
    const capacity = this.getCapacity(saveId, characterId);
    const usedSlots = this.itemRepository.findByCharacter(saveId, characterId).length;

    if (!item.stackable || !this.itemRepository.findByItemId(saveId, characterId, item.id)) {
      if (usedSlots >= capacity) {
        throw new Error('Inventory is full');
      }
    }

    // 扣除货币
    this.addCurrency(saveId, characterId, currency, -totalPrice);

    // 添加物品到背包
    this.addItem(saveId, characterId, item, quantity);

    return {
      success: true,
      itemId: item.id,
      quantity,
      totalPrice,
      currency,
      newBalance: this.getCurrency(saveId, characterId, currency),
    };
  }

  /**
   * 出售物品
   */
  public sellItem(
    saveId: string,
    characterId: string,
    itemId: string,
    quantity: number = 1,
    priceMultiplier: number = 1
  ): TradeResult {
    // 查找物品
    const entity = this.itemRepository.findByItemId(saveId, characterId, itemId);
    if (!entity) {
      throw new Error(`Item not found in inventory: ${itemId}`);
    }

    const slot = this.itemRepository.entityToSlot(entity);
    const item = slot.item!;

    // 任务物品不能出售
    if (item.type === 'quest') {
      throw new Error('Quest items cannot be sold');
    }

    // 检查数量
    const sellQuantity = Math.min(quantity, entity.quantity);
    if (sellQuantity <= 0) {
      throw new Error('No items to sell');
    }

    // 计算售价
    const totalPrice = Math.floor(item.value.sell * sellQuantity * priceMultiplier);
    const currency = item.value.currency || 'gold';

    // 从背包移除
    this.removeItem(saveId, characterId, itemId, sellQuantity);

    // 增加货币
    this.addCurrency(saveId, characterId, currency, totalPrice);

    return {
      success: true,
      itemId: item.id,
      quantity: sellQuantity,
      totalPrice,
      currency,
      newBalance: this.getCurrency(saveId, characterId, currency),
    };
  }

  /**
   * 计算价格
   */
  public calculatePrice(
    item: Item,
    type: 'buy' | 'sell',
    quantity: number = 1,
    priceMultiplier: number = 1,
    merchantRelation?: number
  ): number {
    let relationMultiplier = 1;
    if (merchantRelation) {
      relationMultiplier = type === 'buy'
        ? 1 - (merchantRelation * 0.001)
        : 1 + (merchantRelation * 0.001);
    }

    const basePrice = item.value[type];
    return Math.floor(basePrice * quantity * priceMultiplier * relationMultiplier);
  }

  // ==================== 背包管理 ====================

  /**
   * 获取背包状态
   */
  public getInventory(saveId: string, characterId: string): InventoryState {
    const entities = this.itemRepository.findByCharacter(saveId, characterId);
    const slots: InventorySlot[] = entities.map((e) => this.itemRepository.entityToSlot(e));

    const equippedEntities = this.itemRepository.findEquipped(saveId, characterId);
    const equipment: EquippedItem[] = equippedEntities.map((e) =>
      this.itemRepository.entityToEquippedItem(e)
    );

    const capacity = this.getCapacity(saveId, characterId);

    return {
      capacity,
      usedSlots: slots.length,
      slots,
      equipment,
      currency: this.getAllCurrency(saveId, characterId),
    };
  }

  /**
   * 获取统计数据
   */
  public getStatistics(saveId: string, characterId: string): InventoryStatistics {
    const stats = this.itemRepository.getStatistics(saveId, characterId);
    const capacity = this.getCapacity(saveId, characterId);
    stats.capacityRemaining = capacity - stats.capacityUsed;
    return stats;
  }

  /**
   * 扩展背包容量
   */
  public expandCapacity(
    saveId: string,
    characterId: string,
    amount: number,
    cost?: number
  ): ExpandCapacityResponse {
    if (amount <= 0) {
      throw new Error('Invalid expansion amount');
    }

    const actualCost = cost || amount * this.capacityConfig.expandCost;
    const currency = 'gold';

    // 检查货币
    const currentBalance = this.getCurrency(saveId, characterId, currency);
    if (currentBalance < actualCost) {
      throw new Error(`Not enough gold. Have: ${currentBalance}, Need: ${actualCost}`);
    }

    // 检查最大容量
    const currentCapacity = this.getCapacity(saveId, characterId);
    const newCapacity = Math.min(currentCapacity + amount, this.capacityConfig.max);

    if (newCapacity === currentCapacity) {
      throw new Error('Already at maximum capacity');
    }

    // 扣除货币
    this.addCurrency(saveId, characterId, currency, -actualCost);

    // 更新容量
    this.setCapacity(saveId, characterId, newCapacity);

    return {
      success: true,
      previousCapacity: currentCapacity,
      newCapacity,
      expandedBy: newCapacity - currentCapacity,
      cost: actualCost,
    };
  }

  /**
   * 整理背包
   */
  public sortInventory(
    saveId: string,
    characterId: string,
    sortBy: 'type' | 'rarity' | 'name' | 'value' = 'type',
    ascending: boolean = true
  ): { sorted: number; sortBy: string; ascending: boolean } {
    const entities = this.itemRepository.findByCharacter(saveId, characterId);

    // 排序
    entities.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
        case 'rarity': {
          const rarityOrder: ItemRarity[] = [
            'unique',
            'legendary',
            'epic',
            'rare',
            'uncommon',
            'common',
          ];
          comparison = rarityOrder.indexOf(a.rarity) - rarityOrder.indexOf(b.rarity);
          break;
        }
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'value': {
          const aData = JSON.parse(a.custom_data) as { value?: { sell: number } };
          const bData = JSON.parse(b.custom_data) as { value?: { sell: number } };
          comparison = (aData.value?.sell || 0) - (bData.value?.sell || 0);
          break;
        }
      }

      return ascending ? comparison : -comparison;
    });

    // 更新槽位索引（通过 custom_data 存储）
    entities.forEach((entity, index) => {
      const customData = JSON.parse(entity.custom_data) as Record<string, unknown>;
      customData.slotIndex = index;
      this.itemRepository.updateCustomData(entity.id, customData);
    });

    return {
      sorted: entities.length,
      sortBy,
      ascending,
    };
  }

  /**
   * 创建物品（GM命令）
   */
  public createItem(
    name: string,
    type: ItemType,
    rarity: ItemRarity = 'common',
    options?: {
      stats?: Record<string, number>;
      effects?: Item['effects'];
      requirements?: Item['requirements'];
      value?: Item['value'];
      stackable?: boolean;
      maxStack?: number;
      description?: string;
    }
  ): Item {
    const rarityConfig = {
      common: { multiplier: 1.0 },
      uncommon: { multiplier: 1.3 },
      rare: { multiplier: 1.6 },
      epic: { multiplier: 2.0 },
      legendary: { multiplier: 3.0 },
      unique: { multiplier: 5.0 },
    };

    const config = rarityConfig[rarity];

    const itemValue = options?.value || {
      buy: Math.floor(100 * config.multiplier),
      sell: Math.floor(50 * config.multiplier),
      currency: 'gold',
    };

    return {
      id: this.generateItemId(),
      name,
      description: options?.description || `${name} - ${type}`,
      type,
      rarity,
      stats: options?.stats || {},
      effects: options?.effects || [],
      requirements: options?.requirements || {},
      value: itemValue,
      stackable: options?.stackable ?? (type === 'consumable' || type === 'material'),
      maxStack: options?.maxStack || 99,
    };
  }

  // ==================== 货币管理 ====================

  /**
   * 获取货币余额
   */
  public getCurrency(saveId: string, characterId: string, currency: string): number {
    const key = `${saveId}:${characterId}`;
    const currencies = this.currencyCache.get(key) || { gold: 100, silver: 0, copper: 0 };
    return currencies[currency] || 0;
  }

  /**
   * 获取所有货币
   */
  public getAllCurrency(saveId: string, characterId: string): Record<string, number> {
    const key = `${saveId}:${characterId}`;
    return this.currencyCache.get(key) || { gold: 100, silver: 0, copper: 0 };
  }

  /**
   * 增加货币
   */
  public addCurrency(
    saveId: string,
    characterId: string,
    currency: string,
    amount: number
  ): number {
    const key = `${saveId}:${characterId}`;
    const currencies = this.currencyCache.get(key) || { gold: 100, silver: 0, copper: 0 };
    currencies[currency] = (currencies[currency] || 0) + amount;
    this.currencyCache.set(key, currencies);
    return currencies[currency];
  }

  // ==================== 容量管理 ====================

  /**
   * 获取背包容量
   */
  public getCapacity(saveId: string, characterId: string): number {
    const key = `${saveId}:${characterId}`;
    return this.capacityCache.get(key) || this.capacityConfig.default;
  }

  /**
   * 设置背包容量
   */
  public setCapacity(saveId: string, characterId: string, capacity: number): void {
    const key = `${saveId}:${characterId}`;
    this.capacityCache.set(key, capacity);
  }

  // ==================== 辅助方法 ====================

  /**
   * 检查物品是否可装备
   */
  private isEquipable(item: Item): boolean {
    return ['weapon', 'armor', 'accessory'].includes(item.type);
  }

  /**
   * 获取物品对应的装备槽位
   */
  private getEquipmentSlot(item: Item): EquipmentSlotType | null {
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
   * 计算属性变化
   */
  private calculateStatChanges(
    oldItem: Item | undefined,
    newItem: Item
  ): Record<string, number> {
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
   * 生成物品ID
   */
  private generateItemId(): string {
    this.itemIdCounter++;
    return `item_${Date.now()}_${this.itemIdCounter}`;
  }
}

// ==================== 单例导出 ====================

let _inventoryService: InventoryService | null = null;

export function getInventoryService(): InventoryService {
  if (!_inventoryService) {
    _inventoryService = new InventoryService();
  }
  return _inventoryService;
}

export function initializeInventoryService(config?: CapacityConfig): void {
  _inventoryService = new InventoryService(config);
}
