/**
 * 技能 API 路由
 * 提供技能管理的 RESTful API 接口
 */

import { Router, Request, Response } from 'express';
import type { Router as RouterType } from 'express';
import { getSkillService } from '../services/SkillService';
import type {
  SkillCategory,
  SkillLearnParams,
  SkillUpgradeParams,
  SkillUseParams,
} from '@ai-rpg/shared';

const router: RouterType = Router();

// ==================== 请求类型定义 ====================

interface CreateSkillRequest {
  name: string;
  description: string;
  type: 'active' | 'passive' | 'toggle';
  category: SkillCategory;
  costs: { type: string; value: number; customResource?: string }[];
  cooldown: number;
  effects: { type: string; value: number; duration?: number; condition?: string }[];
  requirements?: { type: string; value: number | string }[];
  targetType?: string;
  range?: { type: string; minDistance?: number; maxDistance?: number; areaRadius?: number };
  maxLevel?: number;
  characterId: string;
}

interface CreateTemplateRequest {
  name: string;
  description: string;
  type: 'active' | 'passive' | 'toggle';
  category: SkillCategory;
  baseCosts: { type: string; value: number; customResource?: string }[];
  baseCooldown: number;
  baseEffects: { type: string; value: number; duration?: number; condition?: string }[];
  requirements?: { type: string; value: number | string }[];
  maxLevel?: number;
  scalingPerLevel?: {
    costMultiplier: number;
    effectMultiplier: number;
    cooldownReduction: number;
  };
}

// ==================== 技能管理路由 ====================

/**
 * POST /api/skills
 * 创建新技能
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const skillService = getSkillService();
    const data = req.body as CreateSkillRequest;

    if (!data.name || !data.type || !data.category || !data.characterId) {
      return res.status(400).json({
        success: false,
        error: '缺少必需参数: name, type, category, characterId',
      });
    }

    const result = await skillService.createSkill(data);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json(result);
  } catch (error) {
    console.error('[SkillRoutes] Error creating skill:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '创建技能失败',
    });
  }
});

/**
 * GET /api/skills/:characterId
 * 获取角色的所有技能
 */
router.get('/:characterId', async (req: Request, res: Response) => {
  try {
    const skillService = getSkillService();
    const { characterId } = req.params;

    const result = await skillService.getCharacterSkills(characterId);

    res.json(result);
  } catch (error) {
    console.error('[SkillRoutes] Error getting character skills:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取角色技能失败',
    });
  }
});

/**
 * GET /api/skills/:characterId/:skillId
 * 获取特定技能详情
 */
router.get('/:characterId/:skillId', async (req: Request, res: Response) => {
  try {
    const skillService = getSkillService();
    const { characterId, skillId } = req.params;

    const result = await skillService.getSkill(skillId, characterId);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('[SkillRoutes] Error getting skill:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取技能失败',
    });
  }
});

/**
 * GET /api/skills/:characterId/category/:category
 * 按分类获取技能
 */
router.get('/:characterId/category/:category', async (req: Request, res: Response) => {
  try {
    const skillService = getSkillService();
    const { characterId, category } = req.params;

    const result = await skillService.getSkillsByCategory(
      characterId,
      category as SkillCategory
    );

    res.json(result);
  } catch (error) {
    console.error('[SkillRoutes] Error getting skills by category:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取分类技能失败',
    });
  }
});

/**
 * DELETE /api/skills/:characterId/:skillId
 * 删除技能
 */
router.delete('/:characterId/:skillId', async (req: Request, res: Response) => {
  try {
    const skillService = getSkillService();
    const { characterId, skillId } = req.params;

    const result = await skillService.deleteSkill(skillId, characterId);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('[SkillRoutes] Error deleting skill:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '删除技能失败',
    });
  }
});

// ==================== 学习和升级路由 ====================

/**
 * POST /api/skills/learn
 * 学习技能
 */
router.post('/learn', async (req: Request, res: Response) => {
  try {
    const skillService = getSkillService();
    const params = req.body as SkillLearnParams;

    if (!params.skillId || !params.characterId || !params.source) {
      return res.status(400).json({
        success: false,
        error: '缺少必需参数: skillId, characterId, source',
      });
    }

    const result = await skillService.learnSkill(params);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('[SkillRoutes] Error learning skill:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '学习技能失败',
    });
  }
});

/**
 * POST /api/skills/upgrade
 * 升级技能
 */
router.post('/upgrade', async (req: Request, res: Response) => {
  try {
    const skillService = getSkillService();
    const params = req.body as SkillUpgradeParams;

    if (!params.skillId || !params.characterId) {
      return res.status(400).json({
        success: false,
        error: '缺少必需参数: skillId, characterId',
      });
    }

    const result = await skillService.upgradeSkill(params);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('[SkillRoutes] Error upgrading skill:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '升级技能失败',
    });
  }
});

// ==================== 技能使用路由 ====================

/**
 * POST /api/skills/use
 * 使用技能
 */
router.post('/use', async (req: Request, res: Response) => {
  try {
    const skillService = getSkillService();
    const params = req.body as SkillUseParams;

    if (!params.skillId || !params.characterId) {
      return res.status(400).json({
        success: false,
        error: '缺少必需参数: skillId, characterId',
      });
    }

    const result = await skillService.useSkill(params);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('[SkillRoutes] Error using skill:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '使用技能失败',
    });
  }
});

/**
 * GET /api/skills/:characterId/:skillId/availability
 * 检查技能可用性
 */
router.get('/:characterId/:skillId/availability', async (req: Request, res: Response) => {
  try {
    const skillService = getSkillService();
    const { characterId, skillId } = req.params;

    const result = await skillService.checkSkillAvailability(skillId, characterId);

    res.json(result);
  } catch (error) {
    console.error('[SkillRoutes] Error checking skill availability:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '检查技能可用性失败',
    });
  }
});

// ==================== 冷却管理路由 ====================

/**
 * GET /api/skills/:characterId/cooldowns/all
 * 获取角色所有冷却
 */
router.get('/:characterId/cooldowns/all', async (req: Request, res: Response) => {
  try {
    const skillService = getSkillService();
    const { characterId } = req.params;

    const result = await skillService.getCharacterCooldowns(characterId);

    res.json(result);
  } catch (error) {
    console.error('[SkillRoutes] Error getting cooldowns:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取冷却失败',
    });
  }
});

/**
 * POST /api/skills/cooldowns/reduce
 * 减少冷却
 */
router.post('/cooldowns/reduce', async (req: Request, res: Response) => {
  try {
    const skillService = getSkillService();
    const { characterId, skillId, amount } = req.body as {
      characterId: string;
      skillId?: string;
      amount?: number;
    };

    if (!characterId) {
      return res.status(400).json({
        success: false,
        error: '缺少必需参数: characterId',
      });
    }

    const result = await skillService.reduceCooldown(characterId, skillId, amount || 1);

    res.json(result);
  } catch (error) {
    console.error('[SkillRoutes] Error reducing cooldown:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '减少冷却失败',
    });
  }
});

/**
 * POST /api/skills/cooldowns/reset
 * 重置冷却
 */
router.post('/cooldowns/reset', async (req: Request, res: Response) => {
  try {
    const skillService = getSkillService();
    const { characterId, skillId } = req.body as {
      characterId: string;
      skillId?: string;
    };

    if (!characterId) {
      return res.status(400).json({
        success: false,
        error: '缺少必需参数: characterId',
      });
    }

    const result = await skillService.resetCooldown(characterId, skillId);

    res.json(result);
  } catch (error) {
    console.error('[SkillRoutes] Error resetting cooldown:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '重置冷却失败',
    });
  }
});

// ==================== 模板管理路由 ====================

/**
 * POST /api/skills/templates
 * 创建技能模板
 */
router.post('/templates', async (req: Request, res: Response) => {
  try {
    const skillService = getSkillService();
    const data = req.body as CreateTemplateRequest;

    if (!data.name || !data.type || !data.category) {
      return res.status(400).json({
        success: false,
        error: '缺少必需参数: name, type, category',
      });
    }

    const result = await skillService.createTemplate(data);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json(result);
  } catch (error) {
    console.error('[SkillRoutes] Error creating template:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '创建模板失败',
    });
  }
});

/**
 * GET /api/skills/templates/all
 * 获取所有模板
 */
router.get('/templates/all', async (_req: Request, res: Response) => {
  try {
    const skillService = getSkillService();
    const result = await skillService.getAllTemplates();

    res.json(result);
  } catch (error) {
    console.error('[SkillRoutes] Error getting templates:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取模板失败',
    });
  }
});

/**
 * GET /api/skills/templates/:templateId
 * 获取特定模板
 */
router.get('/templates/:templateId', async (req: Request, res: Response) => {
  try {
    const skillService = getSkillService();
    const { templateId } = req.params;

    const result = await skillService.getTemplate(templateId);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('[SkillRoutes] Error getting template:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取模板失败',
    });
  }
});

/**
 * POST /api/skills/templates/:templateId/create
 * 从模板创建技能
 */
router.post('/templates/:templateId/create', async (req: Request, res: Response) => {
  try {
    const skillService = getSkillService();
    const { templateId } = req.params;
    const { characterId, level } = req.body as {
      characterId: string;
      level?: number;
    };

    if (!characterId) {
      return res.status(400).json({
        success: false,
        error: '缺少必需参数: characterId',
      });
    }

    const result = await skillService.createSkillFromTemplate(
      templateId,
      characterId,
      level || 1
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json(result);
  } catch (error) {
    console.error('[SkillRoutes] Error creating skill from template:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '从模板创建技能失败',
    });
  }
});

// ==================== 统计路由 ====================

/**
 * GET /api/skills/statistics/:characterId?
 * 获取技能统计
 */
router.get('/statistics/:characterId?', async (req: Request, res: Response) => {
  try {
    const skillService = getSkillService();
    const { characterId } = req.params;

    const result = await skillService.getStatistics(characterId);

    res.json(result);
  } catch (error) {
    console.error('[SkillRoutes] Error getting statistics:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取统计失败',
    });
  }
});

export default router;
