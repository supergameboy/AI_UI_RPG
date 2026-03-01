import { Router, Request, Response } from 'express';
import type { Router as RouterType } from 'express';
import { getCharacterGenerationService } from '../services/CharacterGenerationService';
import { getTemplateService } from '../services/TemplateService';
import type {
  RaceDefinition,
  ClassDefinition,
  BackgroundDefinition,
  GeneratedRaceOption,
  GeneratedClassOption,
  GeneratedBackgroundOption,
} from '@ai-rpg/shared';

const router: RouterType = Router();

interface GenerateRacesRequest {
  templateId: string;
  count?: number;
}

interface GenerateClassesRequest {
  templateId: string;
  selectedRace: RaceDefinition | GeneratedRaceOption | null;
  count?: number;
}

interface GenerateBackgroundsRequest {
  templateId: string;
  selectedRace: RaceDefinition | GeneratedRaceOption | null;
  selectedClass: ClassDefinition | GeneratedClassOption | null;
  count?: number;
}

interface FinalizeCharacterRequest {
  templateId: string;
  characterName: string;
  race: RaceDefinition | GeneratedRaceOption;
  class: ClassDefinition | GeneratedClassOption;
  background: BackgroundDefinition | GeneratedBackgroundOption;
  generateImagePrompt: boolean;
}

router.post('/generate-races', async (req: Request, res: Response) => {
  try {
    const { templateId, count = 3 } = req.body as GenerateRacesRequest;

    if (!templateId) {
      return res.status(400).json({
        success: false,
        error: 'templateId 是必需的',
      });
    }

    const characterService = getCharacterGenerationService();
    if (!characterService) {
      return res.status(503).json({
        success: false,
        error: '角色生成服务未初始化',
        hint: '请确保后端服务正确启动',
      });
    }

    const templateService = getTemplateService();
    const template = await templateService.getTemplateById(templateId);
    if (!template) {
      return res.status(404).json({
        success: false,
        error: `模板不存在: ${templateId}`,
      });
    }

    const races = await characterService.generateRaceOptions(template, count);

    res.json({
      success: true,
      data: races,
    });
  } catch (error) {
    console.error('[CharacterRoutes] Error generating races:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate races';
    const isConfigError = errorMessage.includes('Adapter not found') || errorMessage.includes('not configured');
    res.status(isConfigError ? 503 : 500).json({
      success: false,
      error: isConfigError ? 'AI 服务未配置' : errorMessage,
      hint: isConfigError ? '请先在设置页面配置 LLM API Key' : undefined,
    });
  }
});

router.post('/generate-classes', async (req: Request, res: Response) => {
  try {
    const { templateId, selectedRace, count = 3 } = req.body as GenerateClassesRequest;

    if (!templateId) {
      return res.status(400).json({
        success: false,
        error: 'templateId 是必需的',
      });
    }

    const characterService = getCharacterGenerationService();
    if (!characterService) {
      return res.status(503).json({
        success: false,
        error: '角色生成服务未初始化',
        hint: '请确保后端服务正确启动',
      });
    }

    const templateService = getTemplateService();
    const template = await templateService.getTemplateById(templateId);
    if (!template) {
      return res.status(404).json({
        success: false,
        error: `模板不存在: ${templateId}`,
      });
    }

    const classes = await characterService.generateClassOptions(template, selectedRace, count);

    res.json({
      success: true,
      data: classes,
    });
  } catch (error) {
    console.error('[CharacterRoutes] Error generating classes:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate classes';
    const isConfigError = errorMessage.includes('Adapter not found') || errorMessage.includes('not configured');
    res.status(isConfigError ? 503 : 500).json({
      success: false,
      error: isConfigError ? 'AI 服务未配置' : errorMessage,
      hint: isConfigError ? '请先在设置页面配置 LLM API Key' : undefined,
    });
  }
});

router.post('/generate-backgrounds', async (req: Request, res: Response) => {
  try {
    const { templateId, selectedRace, selectedClass, count = 3 } = req.body as GenerateBackgroundsRequest;

    if (!templateId) {
      return res.status(400).json({
        success: false,
        error: 'templateId 是必需的',
      });
    }

    const characterService = getCharacterGenerationService();
    if (!characterService) {
      return res.status(503).json({
        success: false,
        error: '角色生成服务未初始化',
        hint: '请确保后端服务正确启动',
      });
    }

    const templateService = getTemplateService();
    const template = await templateService.getTemplateById(templateId);
    if (!template) {
      return res.status(404).json({
        success: false,
        error: `模板不存在: ${templateId}`,
      });
    }

    const backgrounds = await characterService.generateBackgroundOptions(
      template,
      selectedRace,
      selectedClass,
      count
    );

    res.json({
      success: true,
      data: backgrounds,
    });
  } catch (error) {
    console.error('[CharacterRoutes] Error generating backgrounds:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate backgrounds';
    const isConfigError = errorMessage.includes('Adapter not found') || errorMessage.includes('not configured');
    res.status(isConfigError ? 503 : 500).json({
      success: false,
      error: isConfigError ? 'AI 服务未配置' : errorMessage,
      hint: isConfigError ? '请先在设置页面配置 LLM API Key' : undefined,
    });
  }
});

router.post('/finalize', async (req: Request, res: Response) => {
  try {
    const { templateId, characterName, race, class: cls, background, generateImagePrompt } = req.body as FinalizeCharacterRequest;

    if (!templateId || !characterName || !race || !cls || !background) {
      return res.status(400).json({
        success: false,
        error: '缺少必需参数',
      });
    }

    const characterService = getCharacterGenerationService();
    if (!characterService) {
      return res.status(503).json({
        success: false,
        error: '角色生成服务未初始化',
        hint: '请确保后端服务正确启动',
      });
    }

    const templateService = getTemplateService();
    const template = await templateService.getTemplateById(templateId);
    if (!template) {
      return res.status(404).json({
        success: false,
        error: `模板不存在: ${templateId}`,
      });
    }

    const character = await characterService.finalizeCharacter(
      template,
      characterName,
      race,
      cls,
      background,
      template.characterCreation.attributes,
      { generateImagePrompt }
    );

    res.json({
      success: true,
      data: character,
    });
  } catch (error) {
    console.error('[CharacterRoutes] Error finalizing character:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to finalize character';
    const isConfigError = errorMessage.includes('Adapter not found') || errorMessage.includes('not configured');
    res.status(isConfigError ? 503 : 500).json({
      success: false,
      error: isConfigError ? 'AI 服务未配置' : errorMessage,
      hint: isConfigError ? '请先在设置页面配置 LLM API Key' : undefined,
    });
  }
});

router.post('/calculate-attributes', async (req: Request, res: Response) => {
  console.log('[CharacterRoutes] calculate-attributes request received');
  try {
    const { templateId, race, class: cls, background } = req.body;

    console.log('[CharacterRoutes] Request body:', { templateId, race: race?.name, class: cls?.name, background: background?.name });

    if (!templateId || !race || !cls || !background) {
      console.log('[CharacterRoutes] Missing required parameters');
      return res.status(400).json({
        success: false,
        error: '缺少必需参数',
      });
    }

    const characterService = getCharacterGenerationService();
    if (!characterService) {
      console.log('[CharacterRoutes] CharacterGenerationService not initialized');
      return res.status(503).json({
        success: false,
        error: '角色生成服务未初始化',
      });
    }

    const templateService = getTemplateService();
    const template = await templateService.getTemplateById(templateId);
    if (!template) {
      console.log('[CharacterRoutes] Template not found:', templateId);
      return res.status(404).json({
        success: false,
        error: `模板不存在: ${templateId}`,
      });
    }

    console.log('[CharacterRoutes] Calculating attributes...');
    const attributes = characterService.calculateAttributes(
      template.characterCreation.attributes,
      race,
      cls,
      background
    );

    console.log('[CharacterRoutes] Attributes calculated successfully');
    res.json({
      success: true,
      data: attributes,
    });
  } catch (error) {
    console.error('[CharacterRoutes] Error calculating attributes:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to calculate attributes',
    });
  }
});

export default router;
