import { Router, Request, Response } from 'express';
import type { Router as RouterType } from 'express';
import { getEquipmentService } from '../services/EquipmentService';
import type { PlayerStats } from '../services/EquipmentService';
import type { EquipmentSlotType, Item } from '@ai-rpg/shared';

const router: RouterType = Router();

// ==================== 装备信息查询 ====================

/**
 * GET /api/equipment/:characterId
 * 获取角色所有已装备物品
 * 
 * @param characterId - 角色ID（格式：saveId:characterId 或单独的ID）
 * @returns EquipmentState 装备状态
 */
router.get('/:characterId', (req: Request, res: Response) => {
  try {
    const { characterId } = req.params;
    const equipmentService = getEquipmentService();
    const equipment = equipmentService.getEquipment(characterId);

    res.json({
      success: true,
      data: equipment,
    });
  } catch (error) {
    console.error('[EquipmentRoutes] Error getting equipment:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/equipment/:characterId/stats
 * 计算装备属性加成总计
 * 
 * @param characterId - 角色ID
 * @returns Record<string, number> 属性加成总计
 */
router.get('/:characterId/stats', (req: Request, res: Response) => {
  try {
    const { characterId } = req.params;
    const equipmentService = getEquipmentService();
    const stats = equipmentService.calculateEquipmentStats(characterId);

    res.json({
      success: true,
      data: {
        totalStats: stats,
        slotCount: Object.keys(stats).length,
      },
    });
  } catch (error) {
    console.error('[EquipmentRoutes] Error calculating equipment stats:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/equipment/:characterId/slot/:slot
 * 获取特定槽位的装备详情
 * 
 * @param characterId - 角色ID
 * @param slot - 装备槽位
 */
router.get('/:characterId/slot/:slot', (req: Request, res: Response) => {
  try {
    const { characterId, slot } = req.params;
    const equipmentService = getEquipmentService();
    const detail = equipmentService.getEquipmentDetail(characterId, slot as EquipmentSlotType);

    if (!detail) {
      return res.status(404).json({
        success: false,
        error: `该槽位没有装备: ${slot}`,
      });
    }

    res.json({
      success: true,
      data: detail,
    });
  } catch (error) {
    console.error('[EquipmentRoutes] Error getting equipment detail:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ==================== 装备操作 ====================

/**
 * POST /api/equipment/:characterId/equip
 * 穿戴装备
 * 
 * @body itemId - 物品ID
 * @body slot - 目标槽位（可选）
 * @body playerStats - 玩家属性（可选，用于需求检查）
 */
router.post('/:characterId/equip', (req: Request, res: Response) => {
  try {
    const { characterId } = req.params;
    const { itemId, slot, playerStats } = req.body as {
      itemId: string;
      slot?: EquipmentSlotType;
      playerStats?: PlayerStats;
    };

    if (!itemId) {
      return res.status(400).json({
        success: false,
        error: '缺少必需字段: itemId',
      });
    }

    const equipmentService = getEquipmentService();
    const result = equipmentService.equipItem(characterId, itemId, slot, playerStats);

    res.json({
      success: true,
      data: result,
      message: `成功装备 ${result.item.name} 到 ${result.slot} 槽位`,
    });
  } catch (error) {
    console.error('[EquipmentRoutes] Error equipping item:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({
      success: false,
      error: errorMessage,
    });
  }
});

/**
 * POST /api/equipment/:characterId/unequip
 * 卸下装备
 * 
 * @body slot - 装备槽位
 */
router.post('/:characterId/unequip', (req: Request, res: Response) => {
  try {
    const { characterId } = req.params;
    const { slot } = req.body as { slot: EquipmentSlotType };

    if (!slot) {
      return res.status(400).json({
        success: false,
        error: '缺少必需字段: slot',
      });
    }

    const equipmentService = getEquipmentService();
    const result = equipmentService.unequipItem(characterId, slot);

    res.json({
      success: true,
      data: result,
      message: `成功卸下 ${result.item.name}`,
    });
  } catch (error) {
    console.error('[EquipmentRoutes] Error unequipping item:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({
      success: false,
      error: errorMessage,
    });
  }
});

/**
 * POST /api/equipment/:characterId/unequip-all
 * 卸下所有装备
 */
router.post('/:characterId/unequip-all', (req: Request, res: Response) => {
  try {
    const { characterId } = req.params;
    const equipmentService = getEquipmentService();
    const results = equipmentService.unequipAll(characterId);

    res.json({
      success: true,
      data: {
        unequippedCount: results.length,
        items: results.map((r) => ({
          name: r.item.name,
          slot: r.slot,
        })),
      },
      message: `成功卸下 ${results.length} 件装备`,
    });
  } catch (error) {
    console.error('[EquipmentRoutes] Error unequipping all items:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/equipment/:characterId/swap
 * 交换两个槽位的装备
 * 
 * @body slot1 - 第一个槽位
 * @body slot2 - 第二个槽位
 */
router.post('/:characterId/swap', (req: Request, res: Response) => {
  try {
    const { characterId } = req.params;
    const { slot1, slot2 } = req.body as {
      slot1: EquipmentSlotType;
      slot2: EquipmentSlotType;
    };

    if (!slot1 || !slot2) {
      return res.status(400).json({
        success: false,
        error: '缺少必需字段: slot1, slot2',
      });
    }

    const equipmentService = getEquipmentService();
    const result = equipmentService.swapEquipment(characterId, slot1, slot2);

    res.json({
      success: true,
      data: {
        slot1: {
          slot: slot1,
          newItem: result.item2,
        },
        slot2: {
          slot: slot2,
          newItem: result.item1,
        },
      },
      message: '装备交换成功',
    });
  } catch (error) {
    console.error('[EquipmentRoutes] Error swapping equipment:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ==================== 需求检查 ====================

/**
 * GET /api/equipment/:characterId/check/:itemId
 * 检查装备需求
 * 
 * @param characterId - 角色ID
 * @param itemId - 物品ID
 * @query playerStats - 玩家属性（JSON字符串）
 */
router.get('/:characterId/check/:itemId', (req: Request, res: Response) => {
  try {
    const { characterId, itemId } = req.params;
    const { playerStats: playerStatsStr } = req.query;

    // 解析玩家属性
    let playerStats: PlayerStats = { level: 1, attributes: {} };
    if (playerStatsStr && typeof playerStatsStr === 'string') {
      try {
        playerStats = JSON.parse(playerStatsStr) as PlayerStats;
      } catch {
        // 忽略解析错误，使用默认值
      }
    }

    const equipmentService = getEquipmentService();
    const result = equipmentService.canEquip(characterId, itemId, undefined, playerStats);

    res.json({
      success: true,
      data: {
        canEquip: result.canEquip,
        reason: result.reason,
        itemId,
      },
    });
  } catch (error) {
    console.error('[EquipmentRoutes] Error checking equipment requirements:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/equipment/:characterId/check/:itemId
 * 检查装备需求（POST版本，支持更复杂的玩家属性）
 * 
 * @param characterId - 角色ID
 * @param itemId - 物品ID
 * @body playerStats - 玩家属性
 * @body slot - 目标槽位（可选）
 */
router.post('/:characterId/check/:itemId', (req: Request, res: Response) => {
  try {
    const { characterId, itemId } = req.params;
    const { playerStats, slot } = req.body as {
      playerStats?: PlayerStats;
      slot?: EquipmentSlotType;
    };

    const equipmentService = getEquipmentService();
    const result = equipmentService.canEquip(
      characterId,
      itemId,
      slot,
      playerStats || { level: 1, attributes: {} }
    );

    res.json({
      success: true,
      data: {
        canEquip: result.canEquip,
        reason: result.reason,
        itemId,
        targetSlot: slot,
      },
    });
  } catch (error) {
    console.error('[EquipmentRoutes] Error checking equipment requirements:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/equipment/check-requirements
 * 检查物品需求（不需要角色ID，纯物品检查）
 * 
 * @body item - 物品信息
 * @body playerStats - 玩家属性
 */
router.post('/check-requirements', (req: Request, res: Response) => {
  try {
    const { item, playerStats } = req.body as {
      item: Item;
      playerStats?: PlayerStats;
    };

    if (!item) {
      return res.status(400).json({
        success: false,
        error: '缺少必需字段: item',
      });
    }

    const equipmentService = getEquipmentService();
    const result = equipmentService.checkRequirements(
      item,
      playerStats || { level: 1, attributes: {} }
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('[EquipmentRoutes] Error checking requirements:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
