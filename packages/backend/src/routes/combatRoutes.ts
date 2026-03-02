/**
 * 战斗 API 路由
 * 提供战斗管理的 RESTful API 接口
 */

import { Router, Request, Response } from 'express';
import type { Router as RouterType } from 'express';
import { getCombatService } from '../services/CombatService';
import type {
  ActionType,
  CombatInitParams,
  CombatDifficulty,
  CombatEnvironment,
  AllyInitData,
  EnemyInitData,
} from '@ai-rpg/shared';

const router: RouterType = Router();

// ==================== 请求类型定义 ====================

interface InitiateCombatRequest {
  playerId: string;
  allies?: AllyInitData[];
  enemies: EnemyInitData[];
  difficulty?: CombatDifficulty;
  environment?: CombatEnvironment;
}

interface StartCombatRequest {
  combatId: string;
}

interface ExecuteActionRequest {
  combatId: string;
  actorId: string;
  action: ActionType;
  targetId?: string;
  skillId?: string;
  itemId?: string;
}

interface ExecuteAITurnRequest {
  combatId: string;
}

interface EndCombatRequest {
  combatId: string;
  victory?: boolean;
  fled?: boolean;
}

// ==================== 战斗流程路由 ====================

/**
 * POST /api/combat/initiate
 * 初始化战斗
 */
router.post('/initiate', async (req: Request, res: Response) => {
  try {
    const combatService = getCombatService();
    const data = req.body as InitiateCombatRequest;

    if (!data.playerId) {
      return res.status(400).json({
        success: false,
        error: '缺少必需参数: playerId',
      });
    }

    if (!data.enemies || data.enemies.length === 0) {
      return res.status(400).json({
        success: false,
        error: '缺少必需参数: enemies (至少需要一个敌人)',
      });
    }

    // 验证敌人数据
    for (const enemy of data.enemies) {
      if (!enemy.id || !enemy.name || !enemy.stats) {
        return res.status(400).json({
          success: false,
          error: '敌人数据不完整，需要 id, name, stats',
        });
      }
    }

    const params: CombatInitParams = {
      playerId: data.playerId,
      allies: data.allies,
      enemies: data.enemies,
      difficulty: data.difficulty,
      environment: data.environment,
    };

    const result = await combatService.initiateCombat(params);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json(result);
  } catch (error) {
    console.error('[CombatRoutes] Error initiating combat:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '初始化战斗失败',
    });
  }
});

/**
 * POST /api/combat/start
 * 开始战斗
 */
router.post('/start', async (req: Request, res: Response) => {
  try {
    const combatService = getCombatService();
    const data = req.body as StartCombatRequest;

    if (!data.combatId) {
      return res.status(400).json({
        success: false,
        error: '缺少必需参数: combatId',
      });
    }

    const result = await combatService.startCombat(data.combatId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('[CombatRoutes] Error starting combat:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '开始战斗失败',
    });
  }
});

/**
 * POST /api/combat/action
 * 执行行动
 */
router.post('/action', async (req: Request, res: Response) => {
  try {
    const combatService = getCombatService();
    const data = req.body as ExecuteActionRequest;

    if (!data.combatId || !data.actorId || !data.action) {
      return res.status(400).json({
        success: false,
        error: '缺少必需参数: combatId, actorId, action',
      });
    }

    const result = await combatService.executeAction(
      data.combatId,
      data.actorId,
      data.action,
      data.targetId,
      data.skillId,
      data.itemId
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('[CombatRoutes] Error executing action:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '执行行动失败',
    });
  }
});

/**
 * POST /api/combat/ai-turn
 * 执行AI回合
 */
router.post('/ai-turn', async (req: Request, res: Response) => {
  try {
    const combatService = getCombatService();
    const data = req.body as ExecuteAITurnRequest;

    if (!data.combatId) {
      return res.status(400).json({
        success: false,
        error: '缺少必需参数: combatId',
      });
    }

    const result = await combatService.executeAITurn(data.combatId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('[CombatRoutes] Error executing AI turn:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '执行AI回合失败',
    });
  }
});

/**
 * POST /api/combat/end-turn
 * 结束当前回合
 */
router.post('/end-turn', async (req: Request, res: Response) => {
  try {
    const combatService = getCombatService();
    const data = req.body as { combatId: string };

    if (!data.combatId) {
      return res.status(400).json({
        success: false,
        error: '缺少必需参数: combatId',
      });
    }

    const result = await combatService.endTurn(data.combatId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('[CombatRoutes] Error ending turn:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '结束回合失败',
    });
  }
});

/**
 * POST /api/combat/end
 * 结束战斗
 */
router.post('/end', async (req: Request, res: Response) => {
  try {
    const combatService = getCombatService();
    const data = req.body as EndCombatRequest;

    if (!data.combatId) {
      return res.status(400).json({
        success: false,
        error: '缺少必需参数: combatId',
      });
    }

    const result = await combatService.endCombat(
      data.combatId,
      data.victory,
      data.fled
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('[CombatRoutes] Error ending combat:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '结束战斗失败',
    });
  }
});

// ==================== 战斗状态查询路由 ====================

/**
 * GET /api/combat/:combatId
 * 获取战斗状态
 */
router.get('/:combatId', async (req: Request, res: Response) => {
  try {
    const combatService = getCombatService();
    const { combatId } = req.params;

    const result = await combatService.getCombatState(combatId);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('[CombatRoutes] Error getting combat state:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取战斗状态失败',
    });
  }
});

/**
 * GET /api/combat/player/:playerId
 * 获取玩家当前战斗
 */
router.get('/player/:playerId', async (req: Request, res: Response) => {
  try {
    const combatService = getCombatService();
    const { playerId } = req.params;

    const result = await combatService.getPlayerCombat(playerId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('[CombatRoutes] Error getting player combat:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取玩家战斗状态失败',
    });
  }
});

/**
 * GET /api/combat/:combatId/units
 * 获取战斗单位列表
 */
router.get('/:combatId/units', async (req: Request, res: Response) => {
  try {
    const combatService = getCombatService();
    const { combatId } = req.params;

    const result = await combatService.getCombatUnits(combatId);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('[CombatRoutes] Error getting combat units:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取战斗单位失败',
    });
  }
});

/**
 * GET /api/combat/:combatId/turn-order
 * 获取回合顺序
 */
router.get('/:combatId/turn-order', async (req: Request, res: Response) => {
  try {
    const combatService = getCombatService();
    const { combatId } = req.params;

    const result = await combatService.getTurnOrder(combatId);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('[CombatRoutes] Error getting turn order:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取回合顺序失败',
    });
  }
});

/**
 * GET /api/combat/:combatId/current-turn
 * 获取当前回合信息
 */
router.get('/:combatId/current-turn', async (req: Request, res: Response) => {
  try {
    const combatService = getCombatService();
    const { combatId } = req.params;

    const result = await combatService.getCurrentTurn(combatId);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('[CombatRoutes] Error getting current turn:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取当前回合信息失败',
    });
  }
});

export default router;
