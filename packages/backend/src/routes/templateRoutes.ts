import { Router, Request, Response } from 'express';
import type { Router as RouterType } from 'express';
import { getTemplateService } from '../services/TemplateService';
import type { CreateTemplateInput, UpdateTemplateInput } from '../services/TemplateService';

const router: RouterType = Router();

/**
 * GET /api/templates
 * 获取模板列表（支持分页和过滤）
 * Query params: limit (default 20), offset (default 0), gameMode (optional)
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const offset = parseInt(req.query.offset as string, 10) || 0;
    const gameMode = req.query.gameMode as string | undefined;

    // 验证分页参数
    if (limit < 1 || limit > 100) {
      return res.status(400).json({
        success: false,
        error: 'limit must be between 1 and 100',
      });
    }

    if (offset < 0) {
      return res.status(400).json({
        success: false,
        error: 'offset must be non-negative',
      });
    }

    const templateService = getTemplateService();
    const result = await templateService.getTemplates({
      limit,
      offset,
      gameMode,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('[TemplateRoutes] Error getting templates:', error);
    const status = error instanceof Error && error.message.includes('无效的游戏模式') ? 400 : 500;
    res.status(status).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get templates',
    });
  }
});

/**
 * GET /api/templates/:id
 * 获取单个模板
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Template ID is required',
      });
    }

    const templateService = getTemplateService();
    const template = await templateService.getTemplateById(id);

    if (!template) {
      return res.status(404).json({
        success: false,
        error: `Template not found: ${id}`,
      });
    }

    res.json({
      success: true,
      data: template,
    });
  } catch (error) {
    console.error('[TemplateRoutes] Error getting template:', error);
    const status = error instanceof Error && error.message.includes('模板 ID') ? 400 : 500;
    res.status(status).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get template',
    });
  }
});

/**
 * POST /api/templates
 * 创建新模板
 * Body: Omit<StoryTemplate, 'id'>
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const templateData = req.body as CreateTemplateInput;

    // 基本验证
    if (!templateData || typeof templateData !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Request body is required and must be an object',
      });
    }

    const templateService = getTemplateService();
    const template = await templateService.createTemplate(templateData);

    res.status(201).json({
      success: true,
      data: template,
    });
  } catch (error) {
    console.error('[TemplateRoutes] Error creating template:', error);
    const status = error instanceof Error && (
      error.message.includes('必填项') ||
      error.message.includes('无效的游戏模式')
    ) ? 400 : 500;
    res.status(status).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create template',
    });
  }
});

/**
 * PUT /api/templates/:id
 * 更新模板
 * Body: Partial<StoryTemplate>
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body as UpdateTemplateInput;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Template ID is required',
      });
    }

    if (!updateData || typeof updateData !== 'object' || Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Request body is required and must contain at least one field to update',
      });
    }

    const templateService = getTemplateService();
    const template = await templateService.updateTemplate(id, updateData);

    res.json({
      success: true,
      data: template,
    });
  } catch (error) {
    console.error('[TemplateRoutes] Error updating template:', error);
    let status = 500;
    if (error instanceof Error) {
      if (error.message.includes('不存在') || error.message.includes('not found')) {
        status = 404;
      } else if (
        error.message.includes('ID') ||
        error.message.includes('无效') ||
        error.message.includes('不能为空')
      ) {
        status = 400;
      }
    }
    res.status(status).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update template',
    });
  }
});

/**
 * DELETE /api/templates/:id
 * 删除模板
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Template ID is required',
      });
    }

    const templateService = getTemplateService();
    const deleted = await templateService.deleteTemplate(id);

    res.json({
      success: true,
      data: { deleted },
    });
  } catch (error) {
    console.error('[TemplateRoutes] Error deleting template:', error);
    let status = 500;
    if (error instanceof Error) {
      if (error.message.includes('不存在') || error.message.includes('not found')) {
        status = 404;
      } else if (error.message.includes('内置模板')) {
        status = 403;
      } else if (error.message.includes('ID')) {
        status = 400;
      }
    }
    res.status(status).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete template',
    });
  }
});

export default router;
