import { Router, Request, Response } from 'express';
import type { Router as RouterType } from 'express';
import { getInventoryService } from '../services/InventoryService';
import type {
  Item,
  ItemFilter,
  AddItemRequest,
  EquipmentSlotType,
  CreateItemRequest,
} from '@ai-rpg/shared';

const router: RouterType = Router();

// ==================== 背包管理 ====================

/**
 * GET /api/inventory/:saveId/:characterId
 * 获取背包状态
 */
router.get('/:saveId/:characterId', (req: Request, res: Response) => {
  try {
    const { saveId, characterId } = req.params;
    const inventoryService = getInventoryService();
    const inventory = inventoryService.getInventory(saveId, characterId);

    res.json({
      success: true,
      data: inventory,
    });
  } catch (error) {
    console.error('[InventoryRoutes] Error getting inventory:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/inventory/:saveId/:characterId/statistics
 * 获取背包统计
 */
router.get('/:saveId/:characterId/statistics', (req: Request, res: Response) => {
  try {
    const { saveId, characterId } = req.params;
    const inventoryService = getInventoryService();
    const statistics = inventoryService.getStatistics(saveId, characterId);

    res.json({
      success: true,
      data: statistics,
    });
  } catch (error) {
    console.error('[InventoryRoutes] Error getting statistics:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/inventory/:saveId/:characterId/currency
 * 获取货币余额
 */
router.get('/:saveId/:characterId/currency', (req: Request, res: Response) => {
  try {
    const { saveId, characterId } = req.params;
    const { currency } = req.query;

    const inventoryService = getInventoryService();

    if (currency && typeof currency === 'string') {
      const amount = inventoryService.getCurrency(saveId, characterId, currency);
      res.json({
        success: true,
        data: { currency, amount },
      });
    } else {
      const currencies = inventoryService.getAllCurrency(saveId, characterId);
      res.json({
        success: true,
        data: { currency: currencies },
      });
    }
  } catch (error) {
    console.error('[InventoryRoutes] Error getting currency:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/inventory/:saveId/:characterId/currency
 * 增加货币
 */
router.post('/:saveId/:characterId/currency', (req: Request, res: Response) => {
  try {
    const { saveId, characterId } = req.params;
    const { currency, amount, source } = req.body as {
      currency: string;
      amount: number;
      source?: string;
    };

    if (!currency || amount === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: currency, amount',
      });
    }

    const inventoryService = getInventoryService();
    const previousAmount = inventoryService.getCurrency(saveId, characterId, currency);
    const newAmount = inventoryService.addCurrency(saveId, characterId, currency, amount);

    res.json({
      success: true,
      data: {
        currency,
        previousAmount,
        addedAmount: amount,
        newAmount,
        source,
      },
    });
  } catch (error) {
    console.error('[InventoryRoutes] Error adding currency:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ==================== 物品管理 ====================

/**
 * POST /api/inventory/:saveId/:characterId/items
 * 添加物品
 */
router.post('/:saveId/:characterId/items', (req: Request, res: Response) => {
  try {
    const { saveId, characterId } = req.params;
    const { item, quantity, slotIndex } = req.body as AddItemRequest;

    if (!item) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: item',
      });
    }

    const inventoryService = getInventoryService();
    const result = inventoryService.addItem(saveId, characterId, item, quantity, slotIndex);

    if (result.success) {
      res.json({
        success: true,
        data: result,
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Inventory is full',
        data: result,
      });
    }
  } catch (error) {
    console.error('[InventoryRoutes] Error adding item:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * DELETE /api/inventory/:saveId/:characterId/items/:itemId
 * 移除物品
 */
router.delete('/:saveId/:characterId/items/:itemId', (req: Request, res: Response) => {
  try {
    const { saveId, characterId, itemId } = req.params;
    const { quantity, slotIndex } = req.query;

    const inventoryService = getInventoryService();
    const result = inventoryService.removeItem(
      saveId,
      characterId,
      itemId,
      quantity ? parseInt(quantity as string) : 1,
      slotIndex ? parseInt(slotIndex as string) : undefined
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('[InventoryRoutes] Error removing item:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(errorMessage.includes('not found') ? 404 : 500).json({
      success: false,
      error: errorMessage,
    });
  }
});

/**
 * POST /api/inventory/:saveId/:characterId/items/:itemId/use
 * 使用物品
 */
router.post('/:saveId/:characterId/items/:itemId/use', (req: Request, res: Response) => {
  try {
    const { saveId, characterId, itemId } = req.params;
    const { slotIndex, targetId } = req.body as { slotIndex?: number; targetId?: string };

    const inventoryService = getInventoryService();
    const result = inventoryService.useItem(
      saveId,
      characterId,
      itemId,
      slotIndex,
      targetId
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('[InventoryRoutes] Error using item:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(errorMessage.includes('not found') ? 404 : 400).json({
      success: false,
      error: errorMessage,
    });
  }
});

/**
 * POST /api/inventory/:saveId/:characterId/items/split
 * 拆分堆叠
 */
router.post('/:saveId/:characterId/items/split', (req: Request, res: Response) => {
  try {
    const { saveId, characterId } = req.params;
    const { slotIndex, quantity } = req.body as { slotIndex: number; quantity: number };

    if (slotIndex === undefined || !quantity) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: slotIndex, quantity',
      });
    }

    const inventoryService = getInventoryService();
    const result = inventoryService.splitStack(saveId, characterId, slotIndex, quantity);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('[InventoryRoutes] Error splitting stack:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/inventory/:saveId/:characterId/items/merge
 * 合并堆叠
 */
router.post('/:saveId/:characterId/items/merge', (req: Request, res: Response) => {
  try {
    const { saveId, characterId } = req.params;
    const { sourceSlotIndex, targetSlotIndex } = req.body as {
      sourceSlotIndex: number;
      targetSlotIndex: number;
    };

    if (sourceSlotIndex === undefined || targetSlotIndex === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: sourceSlotIndex, targetSlotIndex',
      });
    }

    const inventoryService = getInventoryService();
    const result = inventoryService.mergeStacks(
      saveId,
      characterId,
      sourceSlotIndex,
      targetSlotIndex
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('[InventoryRoutes] Error merging stacks:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/inventory/:saveId/:characterId/filter
 * 过滤物品
 */
router.post('/:saveId/:characterId/filter', (req: Request, res: Response) => {
  try {
    const { saveId, characterId } = req.params;
    const filter = req.body as ItemFilter;

    const inventoryService = getInventoryService();
    const inventory = inventoryService.getInventory(saveId, characterId);

    let filteredItems = inventory.slots;

    if (filter.type) {
      filteredItems = filteredItems.filter((slot) => slot.item?.type === filter.type);
    }
    if (filter.rarity) {
      filteredItems = filteredItems.filter((slot) => slot.item?.rarity === filter.rarity);
    }
    if (filter.name) {
      filteredItems = filteredItems.filter((slot) =>
        slot.item?.name.includes(filter.name as string)
      );
    }
    if (filter.equipped !== undefined) {
      const equippedIds = new Set(inventory.equipment.map((e) => e.itemId));
      filteredItems = filteredItems.filter((slot) =>
        filter.equipped ? equippedIds.has(slot.itemId) : !equippedIds.has(slot.itemId)
      );
    }

    res.json({
      success: true,
      data: {
        items: filteredItems,
        count: filteredItems.length,
      },
    });
  } catch (error) {
    console.error('[InventoryRoutes] Error filtering items:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ==================== 装备系统 ====================

/**
 * GET /api/inventory/:saveId/:characterId/equipment
 * 获取装备信息
 */
router.get('/:saveId/:characterId/equipment', (req: Request, res: Response) => {
  try {
    const { saveId, characterId } = req.params;
    const { slot } = req.query;

    const inventoryService = getInventoryService();
    const equipment = inventoryService.getEquipment(
      saveId,
      characterId,
      slot as EquipmentSlotType | undefined
    );

    res.json({
      success: true,
      data: { equipment },
    });
  } catch (error) {
    console.error('[InventoryRoutes] Error getting equipment:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/inventory/:saveId/:characterId/equipment/equip
 * 装备物品
 */
router.post('/:saveId/:characterId/equipment/equip', (req: Request, res: Response) => {
  try {
    const { saveId, characterId } = req.params;
    const { itemId, slotIndex, targetSlot, playerStats } = req.body as {
      itemId: string;
      slotIndex?: number;
      targetSlot?: EquipmentSlotType;
      playerStats?: Record<string, number>;
    };

    if (!itemId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: itemId',
      });
    }

    const inventoryService = getInventoryService();
    const result = inventoryService.equipItem(
      saveId,
      characterId,
      itemId,
      slotIndex,
      targetSlot,
      playerStats
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('[InventoryRoutes] Error equipping item:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/inventory/:saveId/:characterId/equipment/unequip
 * 卸下装备
 */
router.post('/:saveId/:characterId/equipment/unequip', (req: Request, res: Response) => {
  try {
    const { saveId, characterId } = req.params;
    const { slot } = req.body as { slot: EquipmentSlotType };

    if (!slot) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: slot',
      });
    }

    const inventoryService = getInventoryService();
    const result = inventoryService.unequipItem(saveId, characterId, slot);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('[InventoryRoutes] Error unequipping item:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/inventory/:saveId/:characterId/equipment/check-requirements
 * 检查装备需求
 */
router.post('/:saveId/:characterId/equipment/check-requirements', (req: Request, res: Response) => {
  try {
    const { item, playerStats } = req.body as {
      item: Item;
      playerStats?: Record<string, number>;
    };

    if (!item) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: item',
      });
    }

    const inventoryService = getInventoryService();
    const result = inventoryService.checkEquipRequirements(item, playerStats);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('[InventoryRoutes] Error checking requirements:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/inventory/:saveId/:characterId/equipment/calculate-stats
 * 计算属性加成
 */
router.post('/:saveId/:characterId/equipment/calculate-stats', (req: Request, res: Response) => {
  try {
    const { saveId, characterId } = req.params;
    const { baseStats } = req.body as { baseStats: Record<string, number> };

    const inventoryService = getInventoryService();
    const result = inventoryService.calculateStats(saveId, characterId, baseStats || {});

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('[InventoryRoutes] Error calculating stats:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ==================== 交易处理 ====================

/**
 * POST /api/inventory/:saveId/:characterId/trade/buy
 * 购买物品
 */
router.post('/:saveId/:characterId/trade/buy', (req: Request, res: Response) => {
  try {
    const { saveId, characterId } = req.params;
    const { item, quantity, priceMultiplier } = req.body as {
      item: Item;
      quantity?: number;
      priceMultiplier?: number;
    };

    if (!item) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: item',
      });
    }

    const inventoryService = getInventoryService();
    const result = inventoryService.buyItem(
      saveId,
      characterId,
      item,
      quantity || 1,
      priceMultiplier || 1
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('[InventoryRoutes] Error buying item:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/inventory/:saveId/:characterId/trade/sell
 * 出售物品
 */
router.post('/:saveId/:characterId/trade/sell', (req: Request, res: Response) => {
  try {
    const { saveId, characterId } = req.params;
    const { itemId, quantity, priceMultiplier } = req.body as {
      itemId: string;
      quantity?: number;
      priceMultiplier?: number;
    };

    if (!itemId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: itemId',
      });
    }

    const inventoryService = getInventoryService();
    const result = inventoryService.sellItem(
      saveId,
      characterId,
      itemId,
      quantity || 1,
      priceMultiplier || 1
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('[InventoryRoutes] Error selling item:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/inventory/:saveId/:characterId/trade/calculate-price
 * 计算价格
 */
router.post('/:saveId/:characterId/trade/calculate-price', (req: Request, res: Response) => {
  try {
    const { item, type, quantity, priceMultiplier, merchantRelation } = req.body as {
      item: Item;
      type: 'buy' | 'sell';
      quantity?: number;
      priceMultiplier?: number;
      merchantRelation?: number;
    };

    if (!item || !type) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: item, type',
      });
    }

    const inventoryService = getInventoryService();
    const finalPrice = inventoryService.calculatePrice(
      item,
      type,
      quantity || 1,
      priceMultiplier || 1,
      merchantRelation
    );

    res.json({
      success: true,
      data: {
        itemId: item.id,
        itemName: item.name,
        type,
        quantity: quantity || 1,
        basePrice: item.value[type],
        finalPrice,
        currency: item.value.currency || 'gold',
      },
    });
  } catch (error) {
    console.error('[InventoryRoutes] Error calculating price:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ==================== 背包容量 ====================

/**
 * POST /api/inventory/:saveId/:characterId/capacity/expand
 * 扩展背包容量
 */
router.post('/:saveId/:characterId/capacity/expand', (req: Request, res: Response) => {
  try {
    const { saveId, characterId } = req.params;
    const { amount, cost } = req.body as { amount: number; cost?: number };

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid expansion amount',
      });
    }

    const inventoryService = getInventoryService();
    const result = inventoryService.expandCapacity(saveId, characterId, amount, cost);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('[InventoryRoutes] Error expanding capacity:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/inventory/:saveId/:characterId/sort
 * 整理背包
 */
router.post('/:saveId/:characterId/sort', (req: Request, res: Response) => {
  try {
    const { saveId, characterId } = req.params;
    const { sortBy, ascending } = req.body as {
      sortBy?: 'type' | 'rarity' | 'name' | 'value';
      ascending?: boolean;
    };

    const inventoryService = getInventoryService();
    const result = inventoryService.sortInventory(
      saveId,
      characterId,
      sortBy || 'type',
      ascending !== false
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('[InventoryRoutes] Error sorting inventory:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ==================== 物品创建（GM命令）====================

/**
 * POST /api/inventory/items/create
 * 创建物品模板
 */
router.post('/items/create', (req: Request, res: Response) => {
  try {
    const { name, type, rarity, stats, effects, requirements, value, stackable, maxStack, description } =
      req.body as CreateItemRequest;

    if (!name || !type) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, type',
      });
    }

    const inventoryService = getInventoryService();
    const item = inventoryService.createItem(name, type, rarity, {
      stats,
      effects,
      requirements,
      value,
      stackable,
      maxStack,
      description,
    });

    res.json({
      success: true,
      data: { item },
    });
  } catch (error) {
    console.error('[InventoryRoutes] Error creating item:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
