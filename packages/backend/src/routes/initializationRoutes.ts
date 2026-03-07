import { Router, type Router as RouterType, type Request, type Response } from 'express';
import { getInitializationService } from '../services/InitializationService';
import { getTemplateService } from '../services/TemplateService';
import { sendSuccess, sendError } from '../utils/response';
import { asyncHandler } from '../middleware/errorHandler';
import { gameLog } from '../services/GameLogService';
import type {
  InitializationRequest,
  Character,
  GameTemplate,
} from '@ai-rpg/shared';
const router: RouterType = Router();

/**
 * POST /api/initialization/start
 * 开始游戏初始化
 */
router.post(
  '/start',
  asyncHandler(async (req: Request, res: Response) => {
    const { saveId, character, templateId } = req.body as {
      saveId: string;
      character: Character;
      templateId?: string;
    };

    // 验证必需参数
    if (!saveId) {
      return sendError(res, 'VALIDATION_ERROR', 'saveId 是必需的', 400);
    }

    if (!character) {
      return sendError(res, 'VALIDATION_ERROR', 'character 是必需的', 400);
    }

    gameLog.info('backend', '收到初始化请求', { saveId, characterName: character.name, templateId });

    // 获取模板
    let template: GameTemplate;
    
    if (templateId) {
      const templateService = getTemplateService();
      const foundTemplate = await templateService.getTemplateById(templateId);
      
      if (!foundTemplate) {
        return sendError(res, 'NOT_FOUND', `模板不存在: ${templateId}`, 404);
      }
      
      template = foundTemplate;
    } else {
      // 使用默认模板
      template = createDefaultTemplate();
    }

    const initializationService = getInitializationService();
    
    const request: InitializationRequest = {
      saveId,
      character,
      template,
    };

    const result = await initializationService.runFullInitialization(request);

    if (result.success) {
      gameLog.info('backend', '初始化成功', { saveId });
      sendSuccess(res, result);
    } else {
      gameLog.error('backend', '初始化失败', { saveId, error: result.error });
      sendError(res, 'GAME_ERROR', result.error || '初始化失败', 500);
    }
  })
);

/**
 * GET /api/initialization/status/:saveId
 * 获取初始化状态
 */
router.get(
  '/status/:saveId',
  asyncHandler(async (req: Request, res: Response) => {
    const { saveId } = req.params;

    if (!saveId) {
      return sendError(res, 'VALIDATION_ERROR', 'saveId 是必需的', 400);
    }

    const initializationService = getInitializationService();
    const status = initializationService.getStatus(saveId);

    if (!status) {
      return sendError(res, 'NOT_FOUND', '未找到初始化记录', 404);
    }

    gameLog.debug('backend', '获取初始化状态', { saveId, status: status.currentStep });
    sendSuccess(res, { status });
  })
);

/**
 * POST /api/initialization/retry/:saveId
 * 重试失败的初始化
 */
router.post(
  '/retry/:saveId',
  asyncHandler(async (req: Request, res: Response) => {
    const { saveId } = req.params;
    const { character, templateId } = req.body as {
      character: Character;
      templateId?: string;
    };

    if (!saveId) {
      return sendError(res, 'VALIDATION_ERROR', 'saveId 是必需的', 400);
    }

    if (!character) {
      return sendError(res, 'VALIDATION_ERROR', 'character 是必需的', 400);
    }

    gameLog.info('backend', '收到重试初始化请求', { saveId, characterName: character.name });

    // 获取模板
    let template: GameTemplate;
    
    if (templateId) {
      const templateService = getTemplateService();
      const foundTemplate = await templateService.getTemplateById(templateId);
      
      if (!foundTemplate) {
        return sendError(res, 'NOT_FOUND', `模板不存在: ${templateId}`, 404);
      }
      
      template = foundTemplate;
    } else {
      template = createDefaultTemplate();
    }

    const initializationService = getInitializationService();
    const result = await initializationService.retryInitialization(saveId, character, template);

    if (result.success) {
      gameLog.info('backend', '重试初始化成功', { saveId });
      sendSuccess(res, result);
    } else {
      gameLog.error('backend', '重试初始化失败', { saveId, error: result.error });
      sendError(res, 'GAME_ERROR', result.error || '重试初始化失败', 500);
    }
  })
);

/**
 * 创建默认模板
 */
function createDefaultTemplate(): GameTemplate {
  return {
    id: 'default',
    name: '默认模板',
    description: '默认游戏模板',
    version: '1.0.0',
    author: 'System',
    tags: ['default', 'fantasy'],
    
    gameMode: 'text_adventure',
    
    worldSetting: {
      name: '艾泽拉斯',
      description: '一个充满魔法与冒险的世界',
      era: '中世纪奇幻',
      technologyLevel: '中世纪',
      customFields: {},
    },
    
    characterCreation: {
      races: [],
      classes: [],
      backgrounds: [],
      attributes: [
        { id: 'strength', name: '力量', abbreviation: 'STR', description: '物理力量', defaultValue: 10, minValue: 3, maxValue: 18 },
        { id: 'dexterity', name: '敏捷', abbreviation: 'DEX', description: '灵活性和反应', defaultValue: 10, minValue: 3, maxValue: 18 },
        { id: 'constitution', name: '体质', abbreviation: 'CON', description: '健康和耐力', defaultValue: 10, minValue: 3, maxValue: 18 },
        { id: 'intelligence', name: '智力', abbreviation: 'INT', description: '学习和推理能力', defaultValue: 10, minValue: 3, maxValue: 18 },
        { id: 'wisdom', name: '感知', abbreviation: 'WIS', description: '洞察力和直觉', defaultValue: 10, minValue: 3, maxValue: 18 },
        { id: 'charisma', name: '魅力', abbreviation: 'CHA', description: '个人魅力', defaultValue: 10, minValue: 3, maxValue: 18 },
      ],
    },
    
    gameRules: {
      combatSystem: {
        type: 'turn_based',
        initiativeType: 'dexterity',
        actionPoints: 3,
        criticalHit: { threshold: 20, multiplier: 2 },
      },
      skillSystem: {
        maxLevel: 10,
        upgradeCost: { base: 100, multiplier: 1.5 },
        cooldownSystem: 'turn',
      },
      inventorySystem: {
        maxSlots: 20,
        stackSizes: {},
        weightSystem: false,
      },
      questSystem: {
        maxActive: 10,
        failConditions: [],
        timeSystem: false,
      },
    },
    
    aiConstraints: {
      tone: 'serious',
      contentRating: 'teen',
      prohibitedTopics: [],
      requiredElements: [],
      aiBehavior: {
        responseStyle: 'narrative',
        detailLevel: 'normal',
        playerAgency: 'balanced',
      },
    },
    
    startingScene: {
      location: '未知地点',
      description: '',
      npcs: [],
      items: [],
      quests: [],
    },
    
    uiTheme: {
      primaryColor: '#4a90d9',
      fontFamily: 'sans-serif',
      backgroundStyle: 'solid',
    },
    
    uiLayout: {
      showMinimap: true,
      showCombatPanel: true,
      showSkillBar: true,
      showPartyPanel: false,
    },
    
    numericalComplexity: 'medium',
    
    specialRules: {
      hasKP: false,
      permadeath: false,
      saveRestriction: 'none',
      customRules: [],
    },
    
    // 初始化相关扩展字段
    initialData: {
      skills: {
        warrior: ['slash', 'shield_block'],
        mage: ['fireball', 'magic_missile'],
        rogue: ['backstab', 'stealth'],
      },
      items: {
        commoner: [
          { itemId: 'bread', quantity: 5 },
          { itemId: 'water', quantity: 3 },
        ],
        noble: [
          { itemId: 'fine_clothes', quantity: 1 },
          { itemId: 'gold_ring', quantity: 1 },
        ],
      },
      equipment: {
        warrior: {
          mainHand: 'rusty_sword',
          offHand: 'wooden_shield',
          chest: 'leather_armor',
        },
        mage: {
          mainHand: 'apprentice_staff',
          chest: 'mage_robe',
        },
        rogue: {
          mainHand: 'dagger',
          chest: 'leather_vest',
        },
      },
      gold: {
        commoner: 50,
        noble: 200,
        merchant: 500,
      },
    },
    
    initialQuests: [
      {
        id: 'tutorial_1',
        name: '探索之旅',
        description: '探索周围环境，了解基本操作',
        type: 'main',
        objectives: [
          { id: 'obj_1', description: '与向导对话', type: 'talk', target: 'guide_npc', required: 1 },
          { id: 'obj_2', description: '查看背包', type: 'custom', target: 'inventory', required: 1 },
        ],
        rewards: [
          { type: 'experience', value: 100 },
          { type: 'currency', value: 10 },
        ],
      },
    ],
    
    initialNPCs: [
      {
        id: 'guide_npc',
        name: '向导',
        description: '一位友好的向导，帮助你了解这个世界',
        role: 'quest_giver',
      },
    ],
    
    startingLocation: {
      name: '未知地点',
      description: '',
    },
    
    worldConfig: {
      name: '未知世界',
      description: '一个充满魔法与冒险的世界',
    },
  };
}

export default router;
