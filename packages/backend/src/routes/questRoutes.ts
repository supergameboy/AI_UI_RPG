/**
 * 任务 API 路由
 * 提供任务管理的 RESTful API 接口
 */

import { Router, Request, Response } from 'express';
import type { Router as RouterType } from 'express';
import { getQuestService } from '../services/QuestService';
import type { Quest, QuestObjective } from '@ai-rpg/shared';

const router: RouterType = Router();

// ==================== 请求类型定义 ====================

interface AcceptQuestRequest {
  questId: string;
  questData?: Quest;
}

interface CompleteQuestRequest {
  questId: string;
}

interface UpdateProgressRequest {
  questId: string;
  objectiveId: string;
  progress: number;
}

interface AbandonQuestRequest {
  questId: string;
}

// ==================== 任务查询路由 ====================

/**
 * GET /api/quests/:characterId
 * 获取角色任务列表
 */
router.get('/:characterId', async (req: Request, res: Response) => {
  try {
    const questService = getQuestService();
    const { characterId } = req.params;

    const result = await questService.getCharacterQuests(characterId);

    res.json(result);
  } catch (error) {
    console.error('[QuestRoutes] Error getting character quests:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取任务列表失败',
    });
  }
});

/**
 * GET /api/quests/:characterId/:questId
 * 获取任务详情
 */
router.get('/:characterId/:questId', async (req: Request, res: Response) => {
  try {
    const questService = getQuestService();
    const { characterId, questId } = req.params;

    const result = await questService.getQuest(characterId, questId);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('[QuestRoutes] Error getting quest:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取任务详情失败',
    });
  }
});

/**
 * GET /api/quests/:characterId/available
 * 获取可接取的任务
 */
router.get('/:characterId/available', async (req: Request, res: Response) => {
  try {
    const questService = getQuestService();
    const { characterId } = req.params;

    const result = await questService.getAvailableQuests(characterId);

    res.json(result);
  } catch (error) {
    console.error('[QuestRoutes] Error getting available quests:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取可接取任务失败',
    });
  }
});

/**
 * GET /api/quests/:characterId/in-progress
 * 获取进行中的任务
 */
router.get('/:characterId/in-progress', async (req: Request, res: Response) => {
  try {
    const questService = getQuestService();
    const { characterId } = req.params;

    const result = await questService.getCharacterQuests(characterId);

    // 过滤只返回进行中的任务
    const inProgressQuests = result.quests.filter(q => q.status === 'in_progress');

    res.json({
      success: true,
      quests: inProgressQuests,
      count: inProgressQuests.length,
    });
  } catch (error) {
    console.error('[QuestRoutes] Error getting in-progress quests:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取进行中任务失败',
    });
  }
});

/**
 * GET /api/quests/:characterId/completed
 * 获取已完成的任务
 */
router.get('/:characterId/completed', async (req: Request, res: Response) => {
  try {
    const questService = getQuestService();
    const { characterId } = req.params;

    const result = await questService.getCharacterQuests(characterId);

    // 过滤只返回已完成的任务
    const completedQuests = result.quests.filter(q => q.status === 'completed');

    res.json({
      success: true,
      quests: completedQuests,
      count: completedQuests.length,
    });
  } catch (error) {
    console.error('[QuestRoutes] Error getting completed quests:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取已完成任务失败',
    });
  }
});

// ==================== 任务操作路由 ====================

/**
 * POST /api/quests/:characterId/accept
 * 接取任务
 */
router.post('/:characterId/accept', async (req: Request, res: Response) => {
  try {
    const questService = getQuestService();
    const { characterId } = req.params;
    const { questId, questData } = req.body as AcceptQuestRequest;

    if (!questId) {
      return res.status(400).json({
        success: false,
        message: '缺少必需参数: questId',
      });
    }

    const result = await questService.acceptQuest(characterId, questId, questData);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json(result);
  } catch (error) {
    console.error('[QuestRoutes] Error accepting quest:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '接取任务失败',
    });
  }
});

/**
 * POST /api/quests/:characterId/complete
 * 完成任务
 */
router.post('/:characterId/complete', async (req: Request, res: Response) => {
  try {
    const questService = getQuestService();
    const { characterId } = req.params;
    const { questId } = req.body as CompleteQuestRequest;

    if (!questId) {
      return res.status(400).json({
        success: false,
        message: '缺少必需参数: questId',
      });
    }

    const result = await questService.completeQuest(characterId, questId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('[QuestRoutes] Error completing quest:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '完成任务失败',
    });
  }
});

/**
 * POST /api/quests/:characterId/progress
 * 更新任务进度
 */
router.post('/:characterId/progress', async (req: Request, res: Response) => {
  try {
    const questService = getQuestService();
    const { characterId } = req.params;
    const { questId, objectiveId, progress } = req.body as UpdateProgressRequest;

    if (!questId || !objectiveId || progress === undefined) {
      return res.status(400).json({
        success: false,
        message: '缺少必需参数: questId, objectiveId, progress',
      });
    }

    const result = await questService.updateProgress(
      characterId,
      questId,
      objectiveId,
      progress
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('[QuestRoutes] Error updating progress:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '更新进度失败',
    });
  }
});

/**
 * POST /api/quests/:characterId/progress/increment
 * 增加任务进度
 */
router.post('/:characterId/progress/increment', async (req: Request, res: Response) => {
  try {
    const questService = getQuestService();
    const { characterId } = req.params;
    const { questId, objectiveId, increment = 1 } = req.body as {
      questId: string;
      objectiveId: string;
      increment?: number;
    };

    if (!questId || !objectiveId) {
      return res.status(400).json({
        success: false,
        message: '缺少必需参数: questId, objectiveId',
      });
    }

    const result = await questService.incrementProgress(
      characterId,
      questId,
      objectiveId,
      increment
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('[QuestRoutes] Error incrementing progress:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '增加进度失败',
    });
  }
});

/**
 * POST /api/quests/:characterId/abandon
 * 放弃任务
 */
router.post('/:characterId/abandon', async (req: Request, res: Response) => {
  try {
    const questService = getQuestService();
    const { characterId } = req.params;
    const { questId } = req.body as AbandonQuestRequest;

    if (!questId) {
      return res.status(400).json({
        success: false,
        message: '缺少必需参数: questId',
      });
    }

    const result = await questService.abandonQuest(characterId, questId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('[QuestRoutes] Error abandoning quest:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '放弃任务失败',
    });
  }
});

// ==================== 自动追踪路由 ====================

/**
 * POST /api/quests/:characterId/track
 * 根据目标类型自动更新任务进度
 */
router.post('/:characterId/track', async (req: Request, res: Response) => {
  try {
    const questService = getQuestService();
    const { characterId } = req.params;
    const { objectiveType, target, increment = 1 } = req.body as {
      objectiveType: QuestObjective['type'];
      target: string;
      increment?: number;
    };

    if (!objectiveType || !target) {
      return res.status(400).json({
        success: false,
        message: '缺少必需参数: objectiveType, target',
      });
    }

    const results = await questService.updateProgressByType(
      characterId,
      objectiveType,
      target,
      increment
    );

    res.json({
      success: true,
      updatedQuests: results.length,
      results,
    });
  } catch (error) {
    console.error('[QuestRoutes] Error tracking progress:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '追踪进度失败',
    });
  }
});

/**
 * POST /api/quests/:characterId/auto-complete
 * 自动完成所有目标已完成的任务
 */
router.post('/:characterId/auto-complete', async (req: Request, res: Response) => {
  try {
    const questService = getQuestService();
    const { characterId } = req.params;

    const results = await questService.autoCompleteQuests(characterId);

    res.json({
      success: true,
      completedCount: results.length,
      results,
    });
  } catch (error) {
    console.error('[QuestRoutes] Error auto-completing quests:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '自动完成任务失败',
    });
  }
});

// ==================== 统计路由 ====================

/**
 * GET /api/quests/:characterId/statistics
 * 获取任务统计
 */
router.get('/:characterId/statistics', async (req: Request, res: Response) => {
  try {
    const questService = getQuestService();
    const { characterId } = req.params;

    const result = await questService.getCharacterQuests(characterId);

    res.json({
      success: true,
      statistics: result.statistics,
    });
  } catch (error) {
    console.error('[QuestRoutes] Error getting statistics:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取统计失败',
    });
  }
});

export default router;
