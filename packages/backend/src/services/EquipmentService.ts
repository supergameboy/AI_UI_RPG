import type {
  Item,
  EquipmentSlotType,
  EquipmentState,
  EquipResult,
  RequirementCheckResult,
} from '@ai-rpg/shared';
import { NotFoundError, ValidationError, GameError } from '@ai-rpg/shared';
import { getItemRepository, ItemRepository } from '../models/ItemRepository';
import { getInventoryService, InventoryService } from './InventoryService';
import { gameLog } from './GameLogService';

// ==================== 类型定义 ====================

/**
 * 玩家属性信息（用于需求检查）
 */
export interface PlayerStats {
  level: number;
  attributes: Record<string, number>;
  class?: string;
}

/**
 * 装备槽位配置
 */
interface EquipmentSlotConfig {
  maxAccessories: number;
  allowedSlots: EquipmentSlotType[];
}

/**
 * 默认装备槽位配置
 */
const DEFAULT_SLOT_CONFIG: EquipmentSlotConfig = {
  maxAccessories: 2,
  allowedSlots: ['weapon', 'head', 'body', 'feet', 'accessory'],
};

// ==================== EquipmentService ====================

/**
 * 装备服务
 * 负责装备管理的核心业务逻辑，包括穿戴、卸下、需求检查和属性计算
 */
export class EquipmentService {
  private itemRepository: ItemRepository;
  private inventoryService: InventoryService;
  private slotConfig: EquipmentSlotConfig;

  constructor(slotConfig: EquipmentSlotConfig = DEFAULT_SLOT_CONFIG) {
    this.itemRepository = getItemRepository();
    this.inventoryService = getInventoryService();
    this.slotConfig = slotConfig;
  }

  // ==================== 核心装备操作 ====================

  /**
   * 获取角色所有已装备物品
   * @param characterId 角色ID（格式：saveId:characterId）
   * @returns EquipmentState 装备状态
   */
  public getEquipment(characterId: string): EquipmentState {
    const [saveId, charId] = this.parseCharacterId(characterId);
    const entities = this.itemRepository.findEquipped(saveId, charId);

    const equipmentState: EquipmentState = {
      weapon: undefined,
      head: undefined,
      body: undefined,
      feet: undefined,
      accessories: [],
      customSlots: {},
    };

    for (const entity of entities) {
      const equippedItem = this.itemRepository.entityToEquippedItem(entity);
      const slot = entity.equipment_slot as EquipmentSlotType;

      // 根据槽位类型分配到对应字段
      if (slot === 'weapon') {
        equipmentState.weapon = equippedItem;
      } else if (slot === 'head') {
        equipmentState.head = equippedItem;
      } else if (slot === 'body') {
        equipmentState.body = equippedItem;
      } else if (slot === 'feet') {
        equipmentState.feet = equippedItem;
      } else if (slot === 'accessory') {
        equipmentState.accessories.push(equippedItem);
      } else {
        // 自定义槽位
        if (!equipmentState.customSlots) {
          equipmentState.customSlots = {};
        }
        equipmentState.customSlots[slot] = equippedItem;
      }
    }

    return equipmentState;
  }

  /**
   * 穿戴装备
   * @param characterId 角色ID（格式：saveId:characterId）
   * @param itemId 物品ID
   * @param slot 目标槽位（可选，不指定则自动判断）
   * @param playerStats 玩家属性（用于需求检查）
   * @returns EquipResult 装备结果
   */
  public equipItem(
    characterId: string,
    itemId: string,
    slot?: EquipmentSlotType,
    playerStats?: PlayerStats
  ): EquipResult {
    const [saveId, charId] = this.parseCharacterId(characterId);

    // 1. 检查物品是否在背包中
    const entity = this.itemRepository.findByItemId(saveId, charId, itemId);
    if (!entity) {
      throw new NotFoundError('背包中的物品', itemId);
    }

    const inventorySlot = this.itemRepository.entityToSlot(entity);
    const item = inventorySlot.item!;

    // 2. 检查是否是装备类型
    if (!this.isEquipable(item)) {
      throw new GameError(`该物品类型无法装备: ${item.type}`, { itemType: item.type });
    }

    // 3. 确定装备槽位
    const targetSlot = slot || this.determineEquipmentSlot(item);
    if (!targetSlot) {
      throw new GameError('无法确定装备槽位', { itemId: item.id });
    }

    // 4. 检查槽位是否有效
    if (!this.isValidSlot(targetSlot)) {
      throw new ValidationError(`无效的装备槽位: ${targetSlot}`, { slot: targetSlot });
    }

    // 5. 检查饰品槽位数量限制
    if (targetSlot === 'accessory') {
      // 获取所有已装备的饰品
      const allEquipped = this.itemRepository.findEquipped(saveId, charId);
      const currentAccessoryCount = allEquipped.filter(
        (e) => e.equipment_slot === 'accessory'
      ).length;
      
      // 检查是否已有足够的饰品
      if (currentAccessoryCount >= this.slotConfig.maxAccessories) {
        // 需要先卸下一个饰品
        throw new GameError(`饰品槽位已满，最多可装备 ${this.slotConfig.maxAccessories} 个饰品`, { currentCount: currentAccessoryCount, maxCount: this.slotConfig.maxAccessories });
      }
    }

    // 6. 检查装备需求
    const stats = playerStats || { level: 1, attributes: {} };
    const reqCheck = this.checkRequirements(item, stats);
    if (!reqCheck.met) {
      throw new GameError(`装备需求不满足: ${reqCheck.missing.join(', ')}`, { missing: reqCheck.missing });
    }

    // 7. 处理已装备的物品
    let previousItem: Item | undefined;
    const existingEquip = this.itemRepository.findByEquipmentSlot(saveId, charId, targetSlot);

    if (existingEquip) {
      // 检查背包空间
      const capacity = this.inventoryService.getCapacity(saveId, charId);
      const usedSlots = this.itemRepository.findByCharacter(saveId, charId).length;

      if (usedSlots >= capacity) {
        throw new GameError('背包已满，无法卸下当前装备', { usedSlots, capacity });
      }

      // 卸下原装备到背包
      const prevSlot = this.itemRepository.entityToSlot(existingEquip);
      previousItem = prevSlot.item;
      this.itemRepository.updateEquipStatus(existingEquip.id, false, null);
    }

    // 8. 从背包移除物品并装备
    if (entity.quantity > 1) {
      // 如果数量大于1，减少背包数量
      this.itemRepository.updateQuantity(entity.id, entity.quantity - 1);

      // 创建新的装备实例
      const newEntity = this.itemRepository.createInventoryItem({
        saveId,
        characterId: charId,
        item,
        quantity: 1,
      });
      this.itemRepository.updateEquipStatus(newEntity.id, true, targetSlot);
    } else {
      // 直接装备
      this.itemRepository.updateEquipStatus(entity.id, true, targetSlot);
    }

    // 9. 计算属性变化
    const statChanges = this.calculateStatChanges(previousItem, item);

    return {
      success: true,
      item,
      slot: targetSlot,
      previousItem,
      statChanges,
    };
  }

  /**
   * 卸下装备
   * @param characterId 角色ID（格式：saveId:characterId）
   * @param slot 装备槽位
   * @returns EquipResult 卸下结果
   */
  public unequipItem(characterId: string, slot: EquipmentSlotType): EquipResult {
    const [saveId, charId] = this.parseCharacterId(characterId);

    // 1. 查找该槽位的装备
    const entity = this.itemRepository.findByEquipmentSlot(saveId, charId, slot);

    if (!entity) {
      throw new NotFoundError('装备槽位', slot);
    }

    const equippedSlot = this.itemRepository.entityToSlot(entity);
    const item = equippedSlot.item!;

    // 2. 检查背包是否有空位
    const capacity = this.inventoryService.getCapacity(saveId, charId);
    const usedSlots = this.itemRepository.findByCharacter(saveId, charId).length;

    if (usedSlots >= capacity) {
      throw new GameError('背包已满，无法卸下装备', { usedSlots, capacity });
    }

    // 3. 卸下装备
    this.itemRepository.updateEquipStatus(entity.id, false, null);

    // 4. 计算属性变化（卸下装备是负值）
    const statChanges: Record<string, number> = {};
    for (const [stat, value] of Object.entries(item.stats)) {
      statChanges[stat] = -value;
    }

    return {
      success: true,
      item,
      slot,
      previousItem: undefined,
      statChanges,
    };
  }

  /**
   * 检查装备需求
   * @param item 物品
   * @param playerStats 玩家属性
   * @returns RequirementCheckResult 检查结果
   */
  public checkRequirements(
    item: Item,
    playerStats: PlayerStats
  ): RequirementCheckResult {
    const missing: string[] = [];
    const requirements = item.requirements;

    // 检查等级需求
    if (requirements.level && playerStats.level < requirements.level) {
      missing.push(`需要等级 ${requirements.level}（当前 ${playerStats.level}）`);
    }

    // 检查属性需求
    if (requirements.attributes) {
      for (const [attr, requiredValue] of Object.entries(requirements.attributes)) {
        const currentValue = playerStats.attributes[attr] || 0;
        if (currentValue < requiredValue) {
          missing.push(`需要 ${this.getAttributeName(attr)} ${requiredValue}（当前 ${currentValue}）`);
        }
      }
    }

    // 检查职业需求
    if (requirements.class && requirements.class.length > 0) {
      if (!playerStats.class || !requirements.class.includes(playerStats.class)) {
        missing.push(`需要职业: ${requirements.class.join(' 或 ')}`);
      }
    }

    // 检查自定义需求
    if (requirements.custom && requirements.custom.length > 0) {
      for (const customReq of requirements.custom) {
        missing.push(`特殊需求: ${customReq}`);
      }
    }

    return {
      met: missing.length === 0,
      missing,
      requirements,
    };
  }

  /**
   * 计算装备属性加成总计
   * @param characterId 角色ID（格式：saveId:characterId）
   * @returns Record<string, number> 属性加成总计
   */
  public calculateEquipmentStats(characterId: string): Record<string, number> {
    const [saveId, charId] = this.parseCharacterId(characterId);
    const entities = this.itemRepository.findEquipped(saveId, charId);

    const totalStats: Record<string, number> = {};

    for (const entity of entities) {
      const slot = this.itemRepository.entityToSlot(entity);
      const item = slot.item;

      if (item) {
        for (const [stat, value] of Object.entries(item.stats)) {
          totalStats[stat] = (totalStats[stat] || 0) + value;
        }
      }
    }

    return totalStats;
  }

  // ==================== 辅助方法 ====================

  /**
   * 检查物品是否可装备
   */
  private isEquipable(item: Item): boolean {
    return ['weapon', 'armor', 'accessory'].includes(item.type);
  }

  /**
   * 确定物品对应的装备槽位
   */
  private determineEquipmentSlot(item: Item): EquipmentSlotType | null {
    if (item.type === 'weapon') {
      return 'weapon';
    }

    if (item.type === 'accessory') {
      return 'accessory';
    }

    if (item.type === 'armor') {
      // 根据物品名称或属性判断具体部位
      const name = item.name.toLowerCase();

      if (name.includes('头盔') || name.includes('头') || name.includes('helmet') || name.includes('head')) {
        return 'head';
      }
      if (name.includes('靴') || name.includes('脚') || name.includes('boots') || name.includes('feet') || name.includes('shoes')) {
        return 'feet';
      }
      // 默认为身体部位
      return 'body';
    }

    return null;
  }

  /**
   * 检查槽位是否有效
   */
  private isValidSlot(slot: EquipmentSlotType): boolean {
    // 检查是否是标准槽位
    if (this.slotConfig.allowedSlots.includes(slot)) {
      return true;
    }
    // 允许自定义槽位（以 custom_ 开头）
    if (slot.startsWith('custom_')) {
      return true;
    }
    return false;
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
   * 解析角色ID
   * @param characterId 角色ID（格式：saveId:characterId 或单独的ID）
   * @returns [saveId, characterId]
   */
  private parseCharacterId(characterId: string): [string, string] {
    // 如果包含冒号，则分割
    if (characterId.includes(':')) {
      const [saveId, charId] = characterId.split(':');
      return [saveId, charId];
    }
    // 否则使用默认值
    return ['default', characterId];
  }

  /**
   * 获取属性名称的中文显示
   */
  private getAttributeName(attr: string): string {
    const attrNames: Record<string, string> = {
      strength: '力量',
      dexterity: '敏捷',
      constitution: '体质',
      intelligence: '智力',
      wisdom: '智慧',
      charisma: '魅力',
      attack: '攻击力',
      defense: '防御力',
      speed: '速度',
      luck: '幸运',
    };
    return attrNames[attr] || attr;
  }

  // ==================== 高级功能 ====================

  /**
   * 批量卸下所有装备
   */
  public unequipAll(characterId: string): EquipResult[] {
    const [saveId, charId] = this.parseCharacterId(characterId);
    const entities = this.itemRepository.findEquipped(saveId, charId);
    const results: EquipResult[] = [];

    for (const entity of entities) {
      try {
        const slot = entity.equipment_slot as EquipmentSlotType;
        const result = this.unequipItem(characterId, slot);
        results.push(result);
      } catch (error) {
        gameLog.error('system', `Failed to unequip item ${entity.id}`, { error });
      }
    }

    return results;
  }

  /**
   * 交换两个槽位的装备
   */
  public swapEquipment(
    characterId: string,
    slot1: EquipmentSlotType,
    slot2: EquipmentSlotType
  ): { item1?: Item; item2?: Item } {
    const [saveId, charId] = this.parseCharacterId(characterId);

    const entity1 = this.itemRepository.findByEquipmentSlot(saveId, charId, slot1);
    const entity2 = this.itemRepository.findByEquipmentSlot(saveId, charId, slot2);

    let item1: Item | undefined;
    let item2: Item | undefined;

    if (entity1) {
      const slot = this.itemRepository.entityToSlot(entity1);
      item1 = slot.item;
      this.itemRepository.updateEquipStatus(entity1.id, true, slot2);
    }

    if (entity2) {
      const slot = this.itemRepository.entityToSlot(entity2);
      item2 = slot.item;
      this.itemRepository.updateEquipStatus(entity2.id, true, slot1);
    }

    return { item1, item2 };
  }

  /**
   * 检查是否可以装备（不实际装备）
   */
  public canEquip(
    characterId: string,
    itemId: string,
    slot?: EquipmentSlotType,
    playerStats?: PlayerStats
  ): { canEquip: boolean; reason?: string } {
    try {
      const [saveId, charId] = this.parseCharacterId(characterId);

      // 检查物品是否在背包中
      const entity = this.itemRepository.findByItemId(saveId, charId, itemId);
      if (!entity) {
        return { canEquip: false, reason: '物品不在背包中' };
      }

      const inventorySlot = this.itemRepository.entityToSlot(entity);
      const item = inventorySlot.item!;

      // 检查是否是装备类型
      if (!this.isEquipable(item)) {
        return { canEquip: false, reason: '该物品类型无法装备' };
      }

      // 检查装备需求
      const stats = playerStats || { level: 1, attributes: {} };
      const reqCheck = this.checkRequirements(item, stats);
      if (!reqCheck.met) {
        return { canEquip: false, reason: `需求不满足: ${reqCheck.missing.join(', ')}` };
      }

      // 检查目标槽位
      const targetSlot = slot || this.determineEquipmentSlot(item);
      if (!targetSlot || !this.isValidSlot(targetSlot)) {
        return { canEquip: false, reason: '无效的装备槽位' };
      }

      // 检查目标槽位是否有装备
      const existingEquip = this.itemRepository.findByEquipmentSlot(saveId, charId, targetSlot);
      if (existingEquip) {
        // 检查背包空间
        const capacity = this.inventoryService.getCapacity(saveId, charId);
        const usedSlots = this.itemRepository.findByCharacter(saveId, charId).length;

        if (usedSlots >= capacity) {
          return { canEquip: false, reason: '背包已满，无法替换当前装备' };
        }
      }

      return { canEquip: true };
    } catch (error) {
      return {
        canEquip: false,
        reason: error instanceof Error ? error.message : '未知错误',
      };
    }
  }

  /**
   * 获取装备详情（包含完整信息）
   */
  public getEquipmentDetail(
    characterId: string,
    slot: EquipmentSlotType
  ): { item: Item; slot: EquipmentSlotType; equippedAt: number } | null {
    const [saveId, charId] = this.parseCharacterId(characterId);
    const entity = this.itemRepository.findByEquipmentSlot(saveId, charId, slot);

    if (!entity) {
      return null;
    }

    const equippedItem = this.itemRepository.entityToEquippedItem(entity);
    return {
      item: equippedItem.item!,
      slot: equippedItem.slot,
      equippedAt: equippedItem.equippedAt,
    };
  }
}

// ==================== 单例导出 ====================

let _equipmentService: EquipmentService | null = null;

export function getEquipmentService(): EquipmentService {
  if (!_equipmentService) {
    _equipmentService = new EquipmentService();
  }
  return _equipmentService;
}

export function initializeEquipmentService(config?: EquipmentSlotConfig): void {
  _equipmentService = new EquipmentService(config);
}
