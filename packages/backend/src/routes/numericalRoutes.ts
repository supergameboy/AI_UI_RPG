/**
 * 数值系统 API 路由
 * 提供属性计算、伤害计算、治疗计算、等级系统等 RESTful API 接口
 */

import { Router, Request, Response } from 'express';
import type { Router as RouterType } from 'express';
import { getNumericalService } from '../services/NumericalService';
import type {
  BaseAttributeName,
  DerivedAttributeName,
  DamageType,
  AttributeGrowthConfig,
  DamageCalculationParams,
  HealingCalculationParams,
  AttributeModification,
  StatusEffect,
} from '@ai-rpg/shared';

const router: RouterType = Router();

// ==================== 请求类型定义 ====================

interface CalculateAttributesRequest {
  level: number;
  race?: string;
  class?: string;
  customGrowth?: Partial<Record<BaseAttributeName, AttributeGrowthConfig>>;
}

interface CalculateDerivedRequest {
  baseAttributes: Record<BaseAttributeName, number>;
  level: number;
  equipment?: Record<string, unknown>;
  buffs?: StatusEffect[];
}

interface ModifyAttributeRequest {
  targetId: string;
  attribute: BaseAttributeName | DerivedAttributeName;
  value: number;
  type: 'add' | 'subtract' | 'set' | 'multiply';
  source: string;
  duration?: number;
}

interface CalculateDamageRequest {
  attacker: {
    level: number;
    baseAttack: number;
    critRate: number;
    critDamage: number;
    penetration?: number;
  };
  defender: {
    level: number;
    defense: number;
    dodgeRate: number;
    blockRate: number;
    blockReduction?: number;
  };
  damageType: DamageType;
  baseDamage: number;
  skillMultiplier?: number;
  isCritical?: boolean;
}

interface CalculateHealingRequest {
  healer: {
    level: number;
    intelligence: number;
    wisdom: number;
    healingBonus?: number;
  };
  target: {
    level: number;
    currentHp: number;
    maxHp: number;
    healingReceivedBonus?: number;
  };
  baseHealing: number;
  skillMultiplier?: number;
}

interface ApplyDamageRequest {
  targetId: string;
  damage: number;
  damageType: DamageType;
  source?: string;
}

interface ApplyHealingRequest {
  targetId: string;
  healing: number;
  source?: string;
}

interface AddExperienceRequest {
  characterId: string;
  amount: number;
  source?: string;
}

interface SetLevelRequest {
  characterId: string;
  level: number;
  recalculateAttributes?: boolean;
}

interface SetGrowthCurveRequest {
  attribute: BaseAttributeName;
  config: AttributeGrowthConfig;
}

interface CalculateGrowthRequest {
  level: number;
  config: AttributeGrowthConfig;
}

interface ApplyStatusEffectRequest {
  characterId: string;
  effect: StatusEffect;
}

interface RemoveStatusEffectRequest {
  characterId: string;
  effectId: string;
}

interface RegisterCharacterRequest {
  id: string;
  name: string;
  race?: string;
  class?: string;
  level?: number;
  experience?: number;
  baseAttributes?: Record<BaseAttributeName, number>;
  derivedAttributes?: {
    maxHp?: number;
    currentHp?: number;
    maxMp?: number;
    currentMp?: number;
    attack?: number;
    defense?: number;
    speed?: number;
    luck?: number;
  };
  statusEffects?: StatusEffect[];
}

// ==================== 属性计算路由 ====================

/**
 * POST /api/numerical/attributes/calculate
 * 计算基础属性
 */
router.post('/attributes/calculate', async (req: Request, res: Response) => {
  try {
    const numericalService = getNumericalService();
    const data = req.body as CalculateAttributesRequest;

    if (data.level === undefined || data.level < 1) {
      return res.status(400).json({
        success: false,
        error: '缺少必需参数: level (必须 >= 1)',
      });
    }

    const result = numericalService.calculateBaseAttributes(data);
    res.json(result);
  } catch (error) {
    console.error('[NumericalRoutes] Error calculating base attributes:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '计算基础属性失败',
    });
  }
});

/**
 * POST /api/numerical/attributes/derived
 * 计算派生属性
 */
router.post('/attributes/derived', async (req: Request, res: Response) => {
  try {
    const numericalService = getNumericalService();
    const data = req.body as CalculateDerivedRequest;

    if (!data.baseAttributes || data.level === undefined) {
      return res.status(400).json({
        success: false,
        error: '缺少必需参数: baseAttributes, level',
      });
    }

    const result = numericalService.calculateDerivedAttributes(data);
    res.json(result);
  } catch (error) {
    console.error('[NumericalRoutes] Error calculating derived attributes:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '计算派生属性失败',
    });
  }
});

/**
 * POST /api/numerical/attributes/modify
 * 修改属性
 */
router.post('/attributes/modify', async (req: Request, res: Response) => {
  try {
    const numericalService = getNumericalService();
    const data = req.body as ModifyAttributeRequest;

    if (!data.targetId || !data.attribute || data.value === undefined || !data.type) {
      return res.status(400).json({
        success: false,
        error: '缺少必需参数: targetId, attribute, value, type',
      });
    }

    const modification: AttributeModification = {
      targetId: data.targetId,
      attribute: data.attribute,
      value: data.value,
      type: data.type,
      source: data.source || 'api',
      duration: data.duration,
    };

    const result = numericalService.modifyAttribute(modification);
    res.json(result);
  } catch (error) {
    console.error('[NumericalRoutes] Error modifying attribute:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '修改属性失败',
    });
  }
});

// ==================== 伤害和治疗路由 ====================

/**
 * POST /api/numerical/damage/calculate
 * 计算伤害
 */
router.post('/damage/calculate', async (req: Request, res: Response) => {
  try {
    const numericalService = getNumericalService();
    const data = req.body as CalculateDamageRequest;

    if (!data.attacker || !data.defender || !data.damageType || data.baseDamage === undefined) {
      return res.status(400).json({
        success: false,
        error: '缺少必需参数: attacker, defender, damageType, baseDamage',
      });
    }

    const params: DamageCalculationParams = {
      attacker: data.attacker,
      defender: data.defender,
      damageType: data.damageType,
      baseDamage: data.baseDamage,
      skillMultiplier: data.skillMultiplier,
      isCritical: data.isCritical,
    };

    const result = numericalService.calculateDamage(params);
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('[NumericalRoutes] Error calculating damage:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '计算伤害失败',
    });
  }
});

/**
 * POST /api/numerical/healing/calculate
 * 计算治疗
 */
router.post('/healing/calculate', async (req: Request, res: Response) => {
  try {
    const numericalService = getNumericalService();
    const data = req.body as CalculateHealingRequest;

    if (!data.healer || !data.target || data.baseHealing === undefined) {
      return res.status(400).json({
        success: false,
        error: '缺少必需参数: healer, target, baseHealing',
      });
    }

    const params: HealingCalculationParams = {
      healer: data.healer,
      target: data.target,
      baseHealing: data.baseHealing,
      skillMultiplier: data.skillMultiplier,
    };

    const result = numericalService.calculateHealing(params);
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('[NumericalRoutes] Error calculating healing:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '计算治疗失败',
    });
  }
});

/**
 * POST /api/numerical/damage/apply
 * 应用伤害
 */
router.post('/damage/apply', async (req: Request, res: Response) => {
  try {
    const numericalService = getNumericalService();
    const data = req.body as ApplyDamageRequest;

    if (!data.targetId || data.damage === undefined) {
      return res.status(400).json({
        success: false,
        error: '缺少必需参数: targetId, damage',
      });
    }

    const result = numericalService.applyDamage(
      data.targetId,
      data.damage,
      data.damageType || 'physical',
      data.source
    );
    res.json(result);
  } catch (error) {
    console.error('[NumericalRoutes] Error applying damage:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '应用伤害失败',
    });
  }
});

/**
 * POST /api/numerical/healing/apply
 * 应用治疗
 */
router.post('/healing/apply', async (req: Request, res: Response) => {
  try {
    const numericalService = getNumericalService();
    const data = req.body as ApplyHealingRequest;

    if (!data.targetId || data.healing === undefined) {
      return res.status(400).json({
        success: false,
        error: '缺少必需参数: targetId, healing',
      });
    }

    const result = numericalService.applyHealing(data.targetId, data.healing, data.source);
    res.json(result);
  } catch (error) {
    console.error('[NumericalRoutes] Error applying healing:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '应用治疗失败',
    });
  }
});

// ==================== 等级系统路由 ====================

/**
 * POST /api/numerical/experience/add
 * 添加经验值
 */
router.post('/experience/add', async (req: Request, res: Response) => {
  try {
    const numericalService = getNumericalService();
    const data = req.body as AddExperienceRequest;

    if (!data.characterId || data.amount === undefined) {
      return res.status(400).json({
        success: false,
        error: '缺少必需参数: characterId, amount',
      });
    }

    const result = numericalService.addExperience(data);
    res.json(result);
  } catch (error) {
    console.error('[NumericalRoutes] Error adding experience:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '添加经验值失败',
    });
  }
});

/**
 * GET /api/numerical/experience/check/:characterId
 * 检查升级
 */
router.get('/experience/check/:characterId', async (req: Request, res: Response) => {
  try {
    const numericalService = getNumericalService();
    const { characterId } = req.params;

    const result = numericalService.checkLevelUp(characterId);
    res.json(result);
  } catch (error) {
    console.error('[NumericalRoutes] Error checking level up:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '检查升级失败',
    });
  }
});

/**
 * GET /api/numerical/experience/required/:level
 * 获取升级所需经验值
 */
router.get('/experience/required/:level', async (req: Request, res: Response) => {
  try {
    const numericalService = getNumericalService();
    const level = parseInt(req.params.level, 10);

    if (isNaN(level) || level < 1) {
      return res.status(400).json({
        success: false,
        error: '无效的等级参数',
      });
    }

    const result = numericalService.getExperienceForLevelApi(level);
    res.json(result);
  } catch (error) {
    console.error('[NumericalRoutes] Error getting experience for level:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取经验值需求失败',
    });
  }
});

/**
 * POST /api/numerical/level/set
 * 设置等级
 */
router.post('/level/set', async (req: Request, res: Response) => {
  try {
    const numericalService = getNumericalService();
    const data = req.body as SetLevelRequest;

    if (!data.characterId || data.level === undefined) {
      return res.status(400).json({
        success: false,
        error: '缺少必需参数: characterId, level',
      });
    }

    const result = numericalService.setLevel(
      data.characterId,
      data.level,
      data.recalculateAttributes !== false
    );
    res.json(result);
  } catch (error) {
    console.error('[NumericalRoutes] Error setting level:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '设置等级失败',
    });
  }
});

// ==================== 成长曲线路由 ====================

/**
 * POST /api/numerical/growth/set
 * 设置成长曲线
 */
router.post('/growth/set', async (req: Request, res: Response) => {
  try {
    const numericalService = getNumericalService();
    const data = req.body as SetGrowthCurveRequest;

    if (!data.attribute || !data.config) {
      return res.status(400).json({
        success: false,
        error: '缺少必需参数: attribute, config',
      });
    }

    const result = numericalService.setGrowthCurve(data.attribute, data.config);
    res.json(result);
  } catch (error) {
    console.error('[NumericalRoutes] Error setting growth curve:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '设置成长曲线失败',
    });
  }
});

/**
 * POST /api/numerical/growth/calculate
 * 计算成长值
 */
router.post('/growth/calculate', async (req: Request, res: Response) => {
  try {
    const numericalService = getNumericalService();
    const data = req.body as CalculateGrowthRequest;

    if (data.level === undefined || !data.config) {
      return res.status(400).json({
        success: false,
        error: '缺少必需参数: level, config',
      });
    }

    const result = numericalService.calculateGrowth(data.level, data.config);
    res.json(result);
  } catch (error) {
    console.error('[NumericalRoutes] Error calculating growth:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '计算成长值失败',
    });
  }
});

// ==================== 状态效果路由 ====================

/**
 * POST /api/numerical/status-effects/apply
 * 应用状态效果
 */
router.post('/status-effects/apply', async (req: Request, res: Response) => {
  try {
    const numericalService = getNumericalService();
    const data = req.body as ApplyStatusEffectRequest;

    if (!data.characterId || !data.effect) {
      return res.status(400).json({
        success: false,
        error: '缺少必需参数: characterId, effect',
      });
    }

    const result = numericalService.applyStatusEffect(data.characterId, data.effect);
    res.json(result);
  } catch (error) {
    console.error('[NumericalRoutes] Error applying status effect:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '应用状态效果失败',
    });
  }
});

/**
 * POST /api/numerical/status-effects/remove
 * 移除状态效果
 */
router.post('/status-effects/remove', async (req: Request, res: Response) => {
  try {
    const numericalService = getNumericalService();
    const data = req.body as RemoveStatusEffectRequest;

    if (!data.characterId || !data.effectId) {
      return res.status(400).json({
        success: false,
        error: '缺少必需参数: characterId, effectId',
      });
    }

    const result = numericalService.removeStatusEffect(data.characterId, data.effectId);
    res.json(result);
  } catch (error) {
    console.error('[NumericalRoutes] Error removing status effect:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '移除状态效果失败',
    });
  }
});

// ==================== 快照和统计路由 ====================

/**
 * POST /api/numerical/snapshots/create
 * 创建快照
 */
router.post('/snapshots/create', async (req: Request, res: Response) => {
  try {
    const numericalService = getNumericalService();
    const { characterId } = req.body as { characterId: string };

    if (!characterId) {
      return res.status(400).json({
        success: false,
        error: '缺少必需参数: characterId',
      });
    }

    const result = numericalService.createSnapshot(characterId);
    res.json(result);
  } catch (error) {
    console.error('[NumericalRoutes] Error creating snapshot:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '创建快照失败',
    });
  }
});

/**
 * GET /api/numerical/snapshots/:characterId
 * 获取快照
 */
router.get('/snapshots/:characterId', async (req: Request, res: Response) => {
  try {
    const numericalService = getNumericalService();
    const { characterId } = req.params;
    const timestamp = req.query.timestamp ? parseInt(req.query.timestamp as string, 10) : undefined;
    const index = req.query.index ? parseInt(req.query.index as string, 10) : undefined;

    const result = numericalService.getSnapshot(characterId, timestamp, index);
    res.json(result);
  } catch (error) {
    console.error('[NumericalRoutes] Error getting snapshot:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取快照失败',
    });
  }
});

/**
 * GET /api/numerical/statistics/:characterId
 * 获取战斗统计
 */
router.get('/statistics/:characterId', async (req: Request, res: Response) => {
  try {
    const numericalService = getNumericalService();
    const { characterId } = req.params;

    const result = numericalService.getCombatStatistics(characterId);
    res.json(result);
  } catch (error) {
    console.error('[NumericalRoutes] Error getting combat statistics:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取战斗统计失败',
    });
  }
});

// ==================== 角色管理路由 ====================

/**
 * POST /api/numerical/characters/register
 * 注册角色
 */
router.post('/characters/register', async (req: Request, res: Response) => {
  try {
    const numericalService = getNumericalService();
    const data = req.body as RegisterCharacterRequest;

    if (!data.id) {
      return res.status(400).json({
        success: false,
        error: '缺少必需参数: id',
      });
    }

    const result = numericalService.registerCharacter(data);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json(result);
  } catch (error) {
    console.error('[NumericalRoutes] Error registering character:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '注册角色失败',
    });
  }
});

/**
 * GET /api/numerical/characters/:characterId
 * 获取角色统计
 */
router.get('/characters/:characterId', async (req: Request, res: Response) => {
  try {
    const numericalService = getNumericalService();
    const { characterId } = req.params;

    const result = numericalService.getCharacterStats(characterId);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('[NumericalRoutes] Error getting character stats:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取角色统计失败',
    });
  }
});

/**
 * GET /api/numerical/characters
 * 获取所有角色
 */
router.get('/characters', async (_req: Request, res: Response) => {
  try {
    const numericalService = getNumericalService();
    const characters = numericalService.getAllCharacters();

    res.json({
      success: true,
      data: {
        characters,
        count: characters.length,
      },
    });
  } catch (error) {
    console.error('[NumericalRoutes] Error getting all characters:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取角色列表失败',
    });
  }
});

/**
 * POST /api/numerical/characters/:characterId/recalculate
 * 重新计算所有属性
 */
router.post('/characters/:characterId/recalculate', async (req: Request, res: Response) => {
  try {
    const numericalService = getNumericalService();
    const { characterId } = req.params;

    const result = numericalService.recalculateAll(characterId);
    res.json(result);
  } catch (error) {
    console.error('[NumericalRoutes] Error recalculating attributes:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '重新计算属性失败',
    });
  }
});

export default router;
