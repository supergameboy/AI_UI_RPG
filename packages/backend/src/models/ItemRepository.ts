import { BaseRepository, BaseEntity } from './BaseRepository';
import type {
  Item,
  ItemType,
  ItemRarity,
  InventorySlot,
  EquippedItem,
  ItemFilter,
  InventoryStatistics,
} from '@ai-rpg/shared';

// ==================== 数据库实体类型 ====================

/**
 * 背包物品数据库实体
 */
export interface InventoryItemEntity extends BaseEntity {
  save_id: string;
  character_id: string;
  item_id: string;
  name: string;
  type: ItemType;
  rarity: ItemRarity;
  quantity: number;
  equipped: number;
  equipment_slot: string | null;
  stats: string;
  effects: string;
  custom_data: string;
  obtained_at: number;
}

/**
 * 物品模板数据库实体
 */
export interface ItemTemplateEntity extends BaseEntity {
  name: string;
  description: string;
  type: ItemType;
  rarity: ItemRarity;
  stats: string;
  effects: string;
  requirements: string;
  value_buy: number;
  value_sell: number;
  value_currency: string;
  stackable: number;
  max_stack: number;
  image_prompt: string | null;
  generated_image: string | null;
  tags: string;
  source: string;
}

// ==================== ItemRepository ====================

/**
 * 物品数据仓库
 * 负责背包物品的持久化存储和查询
 */
export class ItemRepository extends BaseRepository<InventoryItemEntity> {
  constructor() {
    super('inventory');
  }

  // ==================== 物品CRUD操作 ====================

  /**
   * 创建背包物品
   */
  public createInventoryItem(data: {
    saveId: string;
    characterId: string;
    item: Item;
    quantity?: number;
    slotIndex?: number;
  }): InventoryItemEntity {
    const id = this.generateId();
    const now = Math.floor(Date.now() / 1000);
    const quantity = data.quantity || 1;

    const stmt = this.db.prepare(`
      INSERT INTO inventory (
        id, save_id, character_id, item_id, name, type, rarity,
        quantity, equipped, equipment_slot, stats, effects,
        custom_data, obtained_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      data.saveId,
      data.characterId,
      data.item.id,
      data.item.name,
      data.item.type,
      data.item.rarity,
      quantity,
      0,
      null,
      JSON.stringify(data.item.stats),
      JSON.stringify(data.item.effects),
      JSON.stringify({
        description: data.item.description,
        requirements: data.item.requirements,
        value: data.item.value,
        stackable: data.item.stackable,
        maxStack: data.item.maxStack,
        imagePrompt: data.item.imagePrompt,
        generatedImage: data.item.generatedImage,
        slotIndex: data.slotIndex,
      }),
      now
    );

    return this.findById(id)!;
  }

  /**
   * 更新物品数量
   */
  public updateQuantity(id: string, quantity: number): InventoryItemEntity | undefined {
    if (quantity <= 0) {
      this.deleteById(id);
      return undefined;
    }

    const stmt = this.db.prepare(`
      UPDATE inventory SET quantity = ? WHERE id = ?
    `);
    stmt.run(quantity, id);

    return this.findById(id);
  }

  /**
   * 更新装备状态
   */
  public updateEquipStatus(
    id: string,
    equipped: boolean,
    equipmentSlot: string | null
  ): InventoryItemEntity | undefined {
    const stmt = this.db.prepare(`
      UPDATE inventory SET equipped = ?, equipment_slot = ? WHERE id = ?
    `);
    stmt.run(equipped ? 1 : 0, equipmentSlot, id);

    return this.findById(id);
  }

  /**
   * 更新自定义数据
   */
  public updateCustomData(id: string, customData: Record<string, unknown>): boolean {
    const stmt = this.db.prepare(`
      UPDATE inventory SET custom_data = ? WHERE id = ?
    `);
    const result = stmt.run(JSON.stringify(customData), id);
    return result.changes > 0;
  }

  // ==================== 查询操作 ====================

  /**
   * 根据存档和角色查询所有物品
   */
  public findByCharacter(saveId: string, characterId: string): InventoryItemEntity[] {
    const stmt = this.db.prepare<InventoryItemEntity>(
      `SELECT * FROM inventory WHERE save_id = ? AND character_id = ? ORDER BY obtained_at DESC`
    );
    return stmt.all(saveId, characterId);
  }

  /**
   * 根据物品ID查询
   */
  public findByItemId(saveId: string, characterId: string, itemId: string): InventoryItemEntity | undefined {
    const stmt = this.db.prepare<InventoryItemEntity>(
      `SELECT * FROM inventory WHERE save_id = ? AND character_id = ? AND item_id = ? LIMIT 1`
    );
    return stmt.get(saveId, characterId, itemId);
  }

  /**
   * 查询已装备物品
   */
  public findEquipped(saveId: string, characterId: string): InventoryItemEntity[] {
    const stmt = this.db.prepare<InventoryItemEntity>(
      `SELECT * FROM inventory WHERE save_id = ? AND character_id = ? AND equipped = 1`
    );
    return stmt.all(saveId, characterId);
  }

  /**
   * 根据槽位查询装备
   */
  public findByEquipmentSlot(
    saveId: string,
    characterId: string,
    slot: string
  ): InventoryItemEntity | undefined {
    const stmt = this.db.prepare<InventoryItemEntity>(
      `SELECT * FROM inventory WHERE save_id = ? AND character_id = ? AND equipment_slot = ? LIMIT 1`
    );
    return stmt.get(saveId, characterId, slot);
  }

  /**
   * 根据类型查询物品
   */
  public findByType(saveId: string, characterId: string, type: ItemType): InventoryItemEntity[] {
    const stmt = this.db.prepare<InventoryItemEntity>(
      `SELECT * FROM inventory WHERE save_id = ? AND character_id = ? AND type = ?`
    );
    return stmt.all(saveId, characterId, type);
  }

  /**
   * 根据稀有度查询物品
   */
  public findByRarity(saveId: string, characterId: string, rarity: ItemRarity): InventoryItemEntity[] {
    const stmt = this.db.prepare<InventoryItemEntity>(
      `SELECT * FROM inventory WHERE save_id = ? AND character_id = ? AND rarity = ?`
    );
    return stmt.all(saveId, characterId, rarity);
  }

  /**
   * 使用过滤器查询物品
   */
  public findByFilter(saveId: string, characterId: string, filter: ItemFilter): InventoryItemEntity[] {
    let query = `SELECT * FROM inventory WHERE save_id = ? AND character_id = ?`;
    const params: unknown[] = [saveId, characterId];

    if (filter.type) {
      query += ` AND type = ?`;
      params.push(filter.type);
    }
    if (filter.rarity) {
      query += ` AND rarity = ?`;
      params.push(filter.rarity);
    }
    if (filter.name) {
      query += ` AND name LIKE ?`;
      params.push(`%${filter.name}%`);
    }
    if (filter.equipped !== undefined) {
      query += ` AND equipped = ?`;
      params.push(filter.equipped ? 1 : 0);
    }

    query += ` ORDER BY obtained_at DESC`;

    const stmt = this.db.prepare<InventoryItemEntity>(query);
    return stmt.all(...params);
  }

  /**
   * 统计背包使用情况
   */
  public getStatistics(saveId: string, characterId: string): InventoryStatistics {
    const items = this.findByCharacter(saveId, characterId);

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
      equippedCount: 0,
      capacityUsed: items.length,
      capacityRemaining: 0, // 需要从外部传入容量
    };

    for (const item of items) {
      stats.totalItems += item.quantity;

      const customData = JSON.parse(item.custom_data) as { value?: { sell: number } };
      if (customData.value) {
        stats.totalValue += customData.value.sell * item.quantity;
      }

      stats.byType[item.type] += item.quantity;
      stats.byRarity[item.rarity] += item.quantity;

      if (item.equipped) {
        stats.equippedCount++;
      }
    }

    return stats;
  }

  /**
   * 计算背包总价值
   */
  public calculateTotalValue(saveId: string, characterId: string): number {
    const stmt = this.db.prepare<{ total: number }>(`
      SELECT SUM(
        CAST(json_extract(custom_data, '$.value.sell') AS INTEGER) * quantity
      ) as total
      FROM inventory
      WHERE save_id = ? AND character_id = ?
    `);
    const result = stmt.get(saveId, characterId);
    return result?.total || 0;
  }

  /**
   * 删除角色的所有物品
   */
  public deleteByCharacter(saveId: string, characterId: string): number {
    const stmt = this.db.prepare(
      `DELETE FROM inventory WHERE save_id = ? AND character_id = ?`
    );
    const result = stmt.run(saveId, characterId);
    return result.changes;
  }

  // ==================== 实体转换方法 ====================

  /**
   * 将数据库实体转换为 InventorySlot
   */
  public entityToSlot(entity: InventoryItemEntity): InventorySlot {
    const customData = JSON.parse(entity.custom_data) as {
      description?: string;
      requirements?: Item['requirements'];
      value?: Item['value'];
      stackable?: boolean;
      maxStack?: number;
      imagePrompt?: string;
      generatedImage?: string;
      slotIndex?: number;
    };

    const item: Item = {
      id: entity.item_id,
      name: entity.name,
      description: customData.description || '',
      type: entity.type,
      rarity: entity.rarity,
      stats: JSON.parse(entity.stats) as Record<string, number>,
      effects: JSON.parse(entity.effects) as Item['effects'],
      requirements: customData.requirements || {},
      value: customData.value || { buy: 0, sell: 0, currency: 'gold' },
      stackable: customData.stackable ?? false,
      maxStack: customData.maxStack || 1,
      imagePrompt: customData.imagePrompt,
      generatedImage: customData.generatedImage,
    };

    return {
      id: entity.id,
      slotIndex: customData.slotIndex ?? 0,
      itemId: entity.item_id,
      quantity: entity.quantity,
      item,
    };
  }

  /**
   * 将数据库实体转换为 EquippedItem
   */
  public entityToEquippedItem(entity: InventoryItemEntity): EquippedItem {
    const customData = JSON.parse(entity.custom_data) as {
      description?: string;
      requirements?: Item['requirements'];
      value?: Item['value'];
      stackable?: boolean;
      maxStack?: number;
      imagePrompt?: string;
      generatedImage?: string;
    };

    const item: Item = {
      id: entity.item_id,
      name: entity.name,
      description: customData.description || '',
      type: entity.type,
      rarity: entity.rarity,
      stats: JSON.parse(entity.stats) as Record<string, number>,
      effects: JSON.parse(entity.effects) as Item['effects'],
      requirements: customData.requirements || {},
      value: customData.value || { buy: 0, sell: 0, currency: 'gold' },
      stackable: customData.stackable ?? false,
      maxStack: customData.maxStack || 1,
      imagePrompt: customData.imagePrompt,
      generatedImage: customData.generatedImage,
    };

    return {
      id: entity.id,
      itemId: entity.item_id,
      slot: entity.equipment_slot as EquippedItem['slot'],
      equippedAt: entity.obtained_at,
      item,
    };
  }
}

// ==================== 单例导出 ====================

let _itemRepository: ItemRepository | null = null;

export function getItemRepository(): ItemRepository {
  if (!_itemRepository) {
    _itemRepository = new ItemRepository();
  }
  return _itemRepository;
}

export const itemRepository = {
  get instance() {
    return getItemRepository();
  },
  findById: (id: string) => getItemRepository().findById(id),
  findAll: () => getItemRepository().findAll(),
  createInventoryItem: (data: Parameters<ItemRepository['createInventoryItem']>[0]) =>
    getItemRepository().createInventoryItem(data),
  updateQuantity: (id: string, quantity: number) => getItemRepository().updateQuantity(id, quantity),
  updateEquipStatus: (id: string, equipped: boolean, slot: string | null) =>
    getItemRepository().updateEquipStatus(id, equipped, slot),
  findByCharacter: (saveId: string, characterId: string) =>
    getItemRepository().findByCharacter(saveId, characterId),
  findByItemId: (saveId: string, characterId: string, itemId: string) =>
    getItemRepository().findByItemId(saveId, characterId, itemId),
  findEquipped: (saveId: string, characterId: string) =>
    getItemRepository().findEquipped(saveId, characterId),
  findByEquipmentSlot: (saveId: string, characterId: string, slot: string) =>
    getItemRepository().findByEquipmentSlot(saveId, characterId, slot),
  findByFilter: (saveId: string, characterId: string, filter: ItemFilter) =>
    getItemRepository().findByFilter(saveId, characterId, filter),
  getStatistics: (saveId: string, characterId: string) =>
    getItemRepository().getStatistics(saveId, characterId),
  deleteById: (id: string) => getItemRepository().deleteById(id),
  deleteByCharacter: (saveId: string, characterId: string) =>
    getItemRepository().deleteByCharacter(saveId, characterId),
};
