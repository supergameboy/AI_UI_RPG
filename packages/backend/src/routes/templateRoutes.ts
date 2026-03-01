import { Router, Request, Response } from 'express';
import type { Router as RouterType } from 'express';
import { getTemplateService } from '../services/TemplateService';
import type { CreateTemplateInput, UpdateTemplateInput } from '../services/TemplateService';
import { getAIGenerateService } from '../services/AIGenerateService';
import type { StoryTemplate } from '@ai-rpg/shared';

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

/**
 * POST /api/templates/generate/npc
 * AI 生成 NPC
 * Body: { template: Partial<StoryTemplate>, prompt: string }
 */
router.post('/generate/npc', async (req: Request, res: Response) => {
  try {
    const { template, prompt } = req.body as { template: Partial<StoryTemplate>; prompt?: string };

    const aiService = getAIGenerateService();
    if (!aiService) {
      return res.status(503).json({
        success: false,
        error: 'AI 服务未初始化',
        hint: '请确保后端服务正确启动',
      });
    }

    const npc = await aiService.generateNPC({
      template: template || {},
      targetType: 'npc',
      userPrompt: prompt,
    });

    if (!npc) {
      return res.status(500).json({
        success: false,
        error: '生成 NPC 失败',
        hint: '请检查 LLM API Key 是否正确配置',
      });
    }

    res.json({
      success: true,
      data: npc,
    });
  } catch (error) {
    console.error('[TemplateRoutes] Error generating NPC:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate NPC';
    const isConfigError = errorMessage.includes('Adapter not found') || errorMessage.includes('not configured');
    res.status(isConfigError ? 503 : 500).json({
      success: false,
      error: isConfigError ? 'AI 服务未配置' : errorMessage,
      hint: isConfigError ? '请先在设置页面配置 LLM API Key（如 DeepSeek、GLM、Kimi 等）' : undefined,
    });
  }
});

/**
 * POST /api/templates/generate/item
 * AI 生成物品
 * Body: { template: Partial<StoryTemplate>, prompt: string }
 */
router.post('/generate/item', async (req: Request, res: Response) => {
  try {
    const { template, prompt } = req.body as { template: Partial<StoryTemplate>; prompt?: string };

    const aiService = getAIGenerateService();
    if (!aiService) {
      return res.status(503).json({
        success: false,
        error: 'AI 服务未初始化',
        hint: '请确保后端服务正确启动',
      });
    }

    const item = await aiService.generateItem({
      template: template || {},
      targetType: 'item',
      userPrompt: prompt,
    });

    if (!item) {
      return res.status(500).json({
        success: false,
        error: '生成物品失败',
        hint: '请检查 LLM API Key 是否正确配置',
      });
    }

    res.json({
      success: true,
      data: item,
    });
  } catch (error) {
    console.error('[TemplateRoutes] Error generating item:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate item';
    const isConfigError = errorMessage.includes('Adapter not found') || errorMessage.includes('not configured');
    res.status(isConfigError ? 503 : 500).json({
      success: false,
      error: isConfigError ? 'AI 服务未配置' : errorMessage,
      hint: isConfigError ? '请先在设置页面配置 LLM API Key（如 DeepSeek、GLM、Kimi 等）' : undefined,
    });
  }
});

/**
 * POST /api/templates/generate/quest
 * AI 生成任务
 * Body: { template: Partial<StoryTemplate>, prompt: string }
 */
router.post('/generate/quest', async (req: Request, res: Response) => {
  try {
    const { template, prompt } = req.body as { template: Partial<StoryTemplate>; prompt?: string };

    const aiService = getAIGenerateService();
    if (!aiService) {
      return res.status(503).json({
        success: false,
        error: 'AI 服务未初始化',
        hint: '请确保后端服务正确启动',
      });
    }

    const quest = await aiService.generateQuest({
      template: template || {},
      targetType: 'quest',
      userPrompt: prompt,
    });

    if (!quest) {
      return res.status(500).json({
        success: false,
        error: '生成任务失败',
        hint: '请检查 LLM API Key 是否正确配置',
      });
    }

    res.json({
      success: true,
      data: quest,
    });
  } catch (error) {
    console.error('[TemplateRoutes] Error generating quest:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate quest';
    const isConfigError = errorMessage.includes('Adapter not found') || errorMessage.includes('not configured');
    res.status(isConfigError ? 503 : 500).json({
      success: false,
      error: isConfigError ? 'AI 服务未配置' : errorMessage,
      hint: isConfigError ? '请先在设置页面配置 LLM API Key（如 DeepSeek、GLM、Kimi 等）' : undefined,
    });
  }
});

/**
 * POST /api/templates/generate/scene
 * AI 生成起始场景
 * Body: { template: Partial<StoryTemplate>, prompt?: string }
 */
router.post('/generate/scene', async (req: Request, res: Response) => {
  try {
    const { template, prompt } = req.body as { template: Partial<StoryTemplate>; prompt?: string };

    const aiService = getAIGenerateService();
    if (!aiService) {
      return res.status(503).json({
        success: false,
        error: 'AI 服务未初始化',
        hint: '请确保后端服务正确启动',
      });
    }

    const scene = await aiService.generateScene({
      template: template || {},
      targetType: 'scene',
      userPrompt: prompt,
    });

    if (!scene) {
      return res.status(500).json({
        success: false,
        error: '生成起始场景失败',
        hint: '请检查 LLM API Key 是否正确配置',
      });
    }

    res.json({
      success: true,
      data: scene,
    });
  } catch (error) {
    console.error('[TemplateRoutes] Error generating scene:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate scene';
    const isConfigError = errorMessage.includes('Adapter not found') || errorMessage.includes('not configured');
    res.status(isConfigError ? 503 : 500).json({
      success: false,
      error: isConfigError ? 'AI 服务未配置' : errorMessage,
      hint: isConfigError ? '请先在设置页面配置 LLM API Key（如 DeepSeek、GLM、Kimi 等）' : undefined,
    });
  }
});

/**
 * POST /api/templates/generate/race
 * AI 生成种族
 * Body: { template: Partial<StoryTemplate>, prompt?: string }
 */
router.post('/generate/race', async (req: Request, res: Response) => {
  try {
    const { template, prompt } = req.body as { template: Partial<StoryTemplate>; prompt?: string };

    const aiService = getAIGenerateService();
    if (!aiService) {
      return res.status(503).json({
        success: false,
        error: 'AI 服务未初始化',
        hint: '请确保后端服务正确启动',
      });
    }

    const race = await aiService.generateRace({
      template: template || {},
      targetType: 'race',
      userPrompt: prompt,
    });

    if (!race) {
      return res.status(500).json({
        success: false,
        error: '生成种族失败',
        hint: '请检查 LLM API Key 是否正确配置',
      });
    }

    res.json({
      success: true,
      data: race,
    });
  } catch (error) {
    console.error('[TemplateRoutes] Error generating race:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate race';
    const isConfigError = errorMessage.includes('Adapter not found') || errorMessage.includes('not configured');
    res.status(isConfigError ? 503 : 500).json({
      success: false,
      error: isConfigError ? 'AI 服务未配置' : errorMessage,
      hint: isConfigError ? '请先在设置页面配置 LLM API Key（如 DeepSeek、GLM、Kimi 等）' : undefined,
    });
  }
});

/**
 * POST /api/templates/generate/class
 * AI 生成职业
 * Body: { template: Partial<StoryTemplate>, prompt?: string }
 */
router.post('/generate/class', async (req: Request, res: Response) => {
  try {
    const { template, prompt } = req.body as { template: Partial<StoryTemplate>; prompt?: string };

    const aiService = getAIGenerateService();
    if (!aiService) {
      return res.status(503).json({
        success: false,
        error: 'AI 服务未初始化',
        hint: '请确保后端服务正确启动',
      });
    }

    const classDef = await aiService.generateClass({
      template: template || {},
      targetType: 'class',
      userPrompt: prompt,
    });

    if (!classDef) {
      return res.status(500).json({
        success: false,
        error: '生成职业失败',
        hint: '请检查 LLM API Key 是否正确配置',
      });
    }

    res.json({
      success: true,
      data: classDef,
    });
  } catch (error) {
    console.error('[TemplateRoutes] Error generating class:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate class';
    const isConfigError = errorMessage.includes('Adapter not found') || errorMessage.includes('not configured');
    res.status(isConfigError ? 503 : 500).json({
      success: false,
      error: isConfigError ? 'AI 服务未配置' : errorMessage,
      hint: isConfigError ? '请先在设置页面配置 LLM API Key（如 DeepSeek、GLM、Kimi 等）' : undefined,
    });
  }
});

/**
 * POST /api/templates/generate/background
 * AI 生成背景
 * Body: { template: Partial<StoryTemplate>, prompt?: string }
 */
router.post('/generate/background', async (req: Request, res: Response) => {
  try {
    const { template, prompt } = req.body as { template: Partial<StoryTemplate>; prompt?: string };

    const aiService = getAIGenerateService();
    if (!aiService) {
      return res.status(503).json({
        success: false,
        error: 'AI 服务未初始化',
        hint: '请确保后端服务正确启动',
      });
    }

    const background = await aiService.generateBackground({
      template: template || {},
      targetType: 'background',
      userPrompt: prompt,
    });

    if (!background) {
      return res.status(500).json({
        success: false,
        error: '生成背景失败',
        hint: '请检查 LLM API Key 是否正确配置',
      });
    }

    res.json({
      success: true,
      data: background,
    });
  } catch (error) {
    console.error('[TemplateRoutes] Error generating background:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate background';
    const isConfigError = errorMessage.includes('Adapter not found') || errorMessage.includes('not configured');
    res.status(isConfigError ? 503 : 500).json({
      success: false,
      error: isConfigError ? 'AI 服务未配置' : errorMessage,
      hint: isConfigError ? '请先在设置页面配置 LLM API Key（如 DeepSeek、GLM、Kimi 等）' : undefined,
    });
  }
});

/**
 * POST /api/templates/generate/worldSetting
 * AI 生成世界观
 * Body: { template: Partial<StoryTemplate>, prompt?: string }
 */
router.post('/generate/worldSetting', async (req: Request, res: Response) => {
  try {
    const { template, prompt } = req.body as { template: Partial<StoryTemplate>; prompt?: string };

    const aiService = getAIGenerateService();
    if (!aiService) {
      return res.status(503).json({
        success: false,
        error: 'AI 服务未初始化',
        hint: '请确保后端服务正确启动',
      });
    }

    const worldSetting = await aiService.generateWorldSetting({
      template: template || {},
      targetType: 'worldSetting',
      userPrompt: prompt,
    });

    if (!worldSetting) {
      return res.status(500).json({
        success: false,
        error: '生成世界观失败',
        hint: '请检查 LLM API Key 是否正确配置',
      });
    }

    res.json({
      success: true,
      data: worldSetting,
    });
  } catch (error) {
    console.error('[TemplateRoutes] Error generating world setting:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate world setting';
    const isConfigError = errorMessage.includes('Adapter not found') || errorMessage.includes('not configured');
    res.status(isConfigError ? 503 : 500).json({
      success: false,
      error: isConfigError ? 'AI 服务未配置' : errorMessage,
      hint: isConfigError ? '请先在设置页面配置 LLM API Key（如 DeepSeek、GLM、Kimi 等）' : undefined,
    });
  }
});

export default router;
