/**
 * 技能服务
 * 提供技能管理的业务逻辑层，与 SkillAgent 和数据库仓库交互
 */

import type {
  ExtendedSkill,
  SkillTemplate,
  SkillLearnParams,
  SkillUpgradeParams,
  SkillUseParams,
  SkillEffectResult,
  SkillStatistics,
  SkillCategory,
  SkillType,
  SkillApiResponse,
  SkillListResponse,
  SkillCooldownResponse,
  SkillAvailabilityResponse,
} from '@ai-rpg/shared';
import {
  getSkillRepository,
  getSkillTemplateRepository,
  getSkillCooldownRepository,
} from '../models/SkillRepository';
import { gameLog } from './GameLogService';

// ==================== 服务接口 ====================

export interface CreateSkillData {
  name: string;
  description: string;
  type: SkillType;
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

export interface CreateTemplateData {
  name: string;
  description: string;
  type: SkillType;
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

// ==================== 技能服务类 ====================

export class SkillService {
  private static instance: SkillService | null = null;
  private initialized: boolean = false;

  private constructor() {}

  /**
   * 获取单例实例
   */
  public static getInstance(): SkillService {
    if (!SkillService.instance) {
      SkillService.instance = new SkillService();
    }
    return SkillService.instance;
  }

  /**
   * 初始化服务
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    // 确保仓库已初始化
    getSkillRepository();
    getSkillTemplateRepository();
    getSkillCooldownRepository();

    this.initialized = true;
    gameLog.info('system', 'SkillService initialized');
  }

  // ==================== 技能管理 ====================

  /**
   * 创建技能
   */
  public async createSkill(data: CreateSkillData): Promise<SkillApiResponse<ExtendedSkill>> {
    try {
      // 生成技能ID
      const skillId = `skill_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const skill: ExtendedSkill = {
        id: skillId,
        name: data.name,
        description: data.description,
        type: data.type,
        category: data.category,
        costs: data.costs as ExtendedSkill['costs'],
        cooldown: data.cooldown,
        effects: data.effects as ExtendedSkill['effects'],
        requirements: (data.requirements || []) as ExtendedSkill['requirements'],
        level: 1,
        maxLevel: data.maxLevel || 10,
        targetType: (data.targetType || 'single_enemy') as ExtendedSkill['targetType'],
        range: data.range as ExtendedSkill['range'],
        isToggleOn: false,
        tags: [],
      };

      // 保存到数据库
      const repo = getSkillRepository();
      const entity = repo.createSkill({
        ...skill,
        characterId: data.characterId,
      });

      return {
        success: true,
        data: repo.toSkill(entity),
        message: `技能 ${skill.name} 创建成功`,
      };
    } catch (error) {
      gameLog.error('system', 'Error creating skill', { error });
      return {
        success: false,
        error: error instanceof Error ? error.message : '创建技能失败',
      };
    }
  }

  /**
   * 从模板创建技能
   */
  public async createSkillFromTemplate(
    templateId: string,
    characterId: string,
    level: number = 1
  ): Promise<SkillApiResponse<ExtendedSkill>> {
    try {
      const templateRepo = getSkillTemplateRepository();
      const templateEntity = templateRepo.findById(templateId);

      if (!templateEntity) {
        return {
          success: false,
          error: `模板不存在: ${templateId}`,
        };
      }

      const template = templateRepo.toTemplate(templateEntity);
      const skill = this.applyTemplateScaling(template, level);

      // 保存到数据库
      const repo = getSkillRepository();
      const entity = repo.createSkill({
        ...skill,
        characterId,
      });

      return {
        success: true,
        data: repo.toSkill(entity),
        message: `从模板创建技能 ${skill.name} 成功`,
      };
    } catch (error) {
      gameLog.error('system', 'Error creating skill from template', { error });
      return {
        success: false,
        error: error instanceof Error ? error.message : '从模板创建技能失败',
      };
    }
  }

  /**
   * 获取技能
   */
  public async getSkill(skillId: string, characterId: string): Promise<SkillApiResponse<ExtendedSkill>> {
    try {
      const repo = getSkillRepository();
      const entity = repo.findByCharacterAndSkillId(characterId, skillId);

      if (!entity) {
        return {
          success: false,
          error: `技能不存在: ${skillId}`,
        };
      }

      return {
        success: true,
        data: repo.toSkill(entity),
      };
    } catch (error) {
      gameLog.error('system', 'Error getting skill', { error });
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取技能失败',
      };
    }
  }

  /**
   * 获取角色所有技能
   */
  public async getCharacterSkills(characterId: string): Promise<SkillApiResponse<SkillListResponse>> {
    try {
      const repo = getSkillRepository();
      const entities = repo.findByCharacterId(characterId);
      const skills = entities.map(e => repo.toSkill(e));

      return {
        success: true,
        data: {
          skills,
          count: skills.length,
        },
      };
    } catch (error) {
      gameLog.error('system', 'Error getting character skills', { error });
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取角色技能失败',
      };
    }
  }

  /**
   * 按分类获取技能
   */
  public async getSkillsByCategory(
    characterId: string,
    category: SkillCategory
  ): Promise<SkillApiResponse<SkillListResponse>> {
    try {
      const repo = getSkillRepository();
      const entities = repo.findByCharacterId(characterId);
      const skills = entities
        .map(e => repo.toSkill(e))
        .filter(s => s.category === category);

      return {
        success: true,
        data: {
          skills,
          count: skills.length,
        },
      };
    } catch (error) {
      gameLog.error('system', 'Error getting skills by category', { error });
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取分类技能失败',
      };
    }
  }

  /**
   * 删除技能
   */
  public async deleteSkill(skillId: string, characterId: string): Promise<SkillApiResponse<void>> {
    try {
      const repo = getSkillRepository();
      const entity = repo.findByCharacterAndSkillId(characterId, skillId);

      if (!entity) {
        return {
          success: false,
          error: `技能不存在: ${skillId}`,
        };
      }

      repo.deleteById(entity.id);

      // 清除冷却
      getSkillCooldownRepository().resetCooldown(characterId, skillId);

      return {
        success: true,
        message: `技能 ${skillId} 已删除`,
      };
    } catch (error) {
      gameLog.error('system', 'Error deleting skill', { error });
      return {
        success: false,
        error: error instanceof Error ? error.message : '删除技能失败',
      };
    }
  }

  // ==================== 学习和升级 ====================

  /**
   * 学习技能
   */
  public async learnSkill(params: SkillLearnParams): Promise<SkillApiResponse<ExtendedSkill>> {
    try {
      const repo = getSkillRepository();
      
      // 检查是否已学习
      const existing = repo.findByCharacterAndSkillId(params.characterId, params.skillId);
      if (existing) {
        return {
          success: false,
          error: '技能已学习',
        };
      }

      // 创建技能记录
      const skill: Omit<ExtendedSkill, 'id'> & { characterId: string; skillId: string } = {
        skillId: params.skillId,
        characterId: params.characterId,
        name: `Skill_${params.skillId}`,
        description: 'Learned skill',
        type: 'active',
        category: 'combat',
        costs: [],
        cooldown: 0,
        effects: [],
        requirements: [],
        level: 1,
        maxLevel: 10,
        targetType: 'single_enemy',
        isToggleOn: false,
        tags: [],
      };

      const entity = repo.createSkill(skill);

      return {
        success: true,
        data: repo.toSkill(entity),
        message: `成功学习技能`,
      };
    } catch (error) {
      gameLog.error('system', 'Error learning skill', { error });
      return {
        success: false,
        error: error instanceof Error ? error.message : '学习技能失败',
      };
    }
  }

  /**
   * 升级技能
   */
  public async upgradeSkill(params: SkillUpgradeParams): Promise<SkillApiResponse<ExtendedSkill>> {
    try {
      const repo = getSkillRepository();
      const entity = repo.findByCharacterAndSkillId(params.characterId, params.skillId);

      if (!entity) {
        return {
          success: false,
          error: `技能不存在: ${params.skillId}`,
        };
      }

      const skill = repo.toSkill(entity);

      if (skill.level >= skill.maxLevel) {
        return {
          success: false,
          error: '技能已达到最高等级',
        };
      }

      // 升级
      const updated = repo.updateSkill(entity.id, {
        level: skill.level + 1,
      });

      if (!updated) {
        return {
          success: false,
          error: '升级技能失败',
        };
      }

      return {
        success: true,
        data: repo.toSkill(updated),
        message: `技能升级到 ${skill.level + 1} 级`,
      };
    } catch (error) {
      gameLog.error('system', 'Error upgrading skill', { error });
      return {
        success: false,
        error: error instanceof Error ? error.message : '升级技能失败',
      };
    }
  }

  // ==================== 技能使用 ====================

  /**
   * 使用技能
   */
  public async useSkill(params: SkillUseParams): Promise<SkillApiResponse<SkillEffectResult>> {
    try {
      const repo = getSkillRepository();
      const entity = repo.findByCharacterAndSkillId(params.characterId, params.skillId);

      if (!entity) {
        return {
          success: false,
          error: '技能未学习',
        };
      }

      const skill = repo.toSkill(entity);

      // 检查冷却
      const cooldownRepo = getSkillCooldownRepository();
      const cooldown = cooldownRepo.findByCharacterAndSkill(params.characterId, params.skillId);
      if (cooldown && cooldown.remaining_turns > 0) {
        return {
          success: false,
          error: `技能冷却中，剩余 ${cooldown.remaining_turns} 回合`,
        };
      }

      // 获取角色属性（从 context 中获取或使用默认值）
      const characterStats = this.extractCharacterStats(params.context);
      
      // 获取目标属性（如果有目标）
      const targetStats = params.targetId 
        ? this.extractTargetStats(params.context, params.targetId)
        : undefined;

      // 完整的效果计算
      const effects = this.calculateSkillEffects(skill, characterStats, targetStats);

      // 应用冷却
      if (skill.cooldown > 0) {
        cooldownRepo.upsertCooldown({
          characterId: params.characterId,
          skillId: params.skillId,
          remainingTurns: skill.cooldown,
          totalCooldown: skill.cooldown,
        });
      }

      const result: SkillEffectResult = {
        skillId: params.skillId,
        characterId: params.characterId,
        targetId: params.targetId,
        effects,
        totalCost: skill.costs,
        cooldownApplied: skill.cooldown,
        success: true,
      };

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      gameLog.error('system', 'Error using skill', { error });
      return {
        success: false,
        error: error instanceof Error ? error.message : '使用技能失败',
      };
    }
  }

  /**
   * 从上下文中提取角色属性
   */
  private extractCharacterStats(context?: SkillUseParams['context']): {
    level: number;
    attack: number;
    intelligence: number;
    wisdom: number;
    critRate: number;
    critDamage: number;
    healingBonus: number;
  } {
    const additionalData = context?.additionalData;
    
    if (additionalData && 'characterStats' in additionalData) {
      const stats = additionalData.characterStats as Record<string, unknown>;
      return {
        level: (stats.level as number) || 1,
        attack: (stats.attack as number) || 10,
        intelligence: (stats.intelligence as number) || 10,
        wisdom: (stats.wisdom as number) || 10,
        critRate: (stats.critRate as number) || 5,
        critDamage: (stats.critDamage as number) || 150,
        healingBonus: (stats.healingBonus as number) || 0,
      };
    }
    
    // 默认属性
    return {
      level: 1,
      attack: 10,
      intelligence: 10,
      wisdom: 10,
      critRate: 5,
      critDamage: 150,
      healingBonus: 0,
    };
  }

  /**
   * 从上下文中提取目标属性
   */
  private extractTargetStats(
    context: SkillUseParams['context'],
    _targetId: string
  ): {
    defense: number;
    magicResist: number;
    dodgeRate: number;
    blockRate: number;
    damageReduction: number;
  } | undefined {
    const additionalData = context?.additionalData;
    
    if (additionalData && 'targetStats' in additionalData) {
      const stats = additionalData.targetStats as Record<string, unknown>;
      return {
        defense: (stats.defense as number) || 0,
        magicResist: (stats.magicResist as number) || 0,
        dodgeRate: (stats.dodgeRate as number) || 0,
        blockRate: (stats.blockRate as number) || 0,
        damageReduction: (stats.damageReduction as number) || 0,
      };
    }
    
    return undefined;
  }

  /**
   * 计算技能效果
   * 考虑属性加成、暴击、抗性等因素
   */
  private calculateSkillEffects(
    skill: ExtendedSkill,
    characterStats: ReturnType<typeof this.extractCharacterStats>,
    targetStats?: ReturnType<typeof this.extractTargetStats>
  ): SkillEffectResult['effects'] {
    return skill.effects.map(effect => {
      // 基础效果值
      let baseValue = effect.value;
      
      // 根据效果类型应用不同的属性加成
      const effectType = effect.type.toLowerCase();
      let attributeBonus = 0;
      
      if (this.isPhysicalEffect(effectType)) {
        // 物理效果：受攻击力加成
        attributeBonus = characterStats.attack * 0.5;
      } else if (this.isMagicalEffect(effectType)) {
        // 魔法效果：受智力和智慧加成
        attributeBonus = (characterStats.intelligence + characterStats.wisdom) * 0.3;
      } else if (this.isHealingEffect(effectType)) {
        // 治疗效果：受智力和治疗加成
        attributeBonus = characterStats.intelligence * 0.5 + characterStats.healingBonus;
      }
      
      // 技能等级加成
      const levelBonus = 1 + (skill.level - 1) * 0.1;
      
      // 计算最终基础值
      let actualValue = Math.floor((baseValue + attributeBonus) * levelBonus);
      
      // 暴击判定（仅对伤害效果）
      let isCritical = false;
      if (this.isDamageEffect(effectType)) {
        isCritical = this.rollCritical(characterStats.critRate);
        if (isCritical) {
          actualValue = Math.floor(actualValue * (characterStats.critDamage / 100));
        }
      }
      
      // 目标防御/抗性计算
      let isBlocked = false;
      let isResisted = false;
      
      if (targetStats && this.isDamageEffect(effectType)) {
        if (this.isPhysicalEffect(effectType)) {
          // 物理伤害：检查闪避和格挡
          if (this.rollDodge(targetStats.dodgeRate)) {
            actualValue = 0;
          } else if (this.rollBlock(targetStats.blockRate)) {
            actualValue = Math.floor(actualValue * 0.5);
            isBlocked = true;
          } else {
            // 应用防御减伤
            const defenseReduction = this.calculateDefenseReduction(targetStats.defense);
            actualValue = Math.floor(actualValue * (1 - defenseReduction));
          }
        } else if (this.isMagicalEffect(effectType)) {
          // 魔法伤害：应用魔法抗性
          const resistReduction = this.calculateResistReduction(targetStats.magicResist);
          actualValue = Math.floor(actualValue * (1 - resistReduction));
          isResisted = resistReduction > 0.1;
        }
        
        // 应用通用伤害减免
        if (targetStats.damageReduction > 0) {
          actualValue = Math.floor(actualValue * (1 - targetStats.damageReduction / 100));
        }
      }
      
      // 确保最小值为 1（伤害效果）或 0（其他效果）
      if (this.isDamageEffect(effectType)) {
        actualValue = Math.max(1, actualValue);
      } else {
        actualValue = Math.max(0, actualValue);
      }
      
      return {
        type: effect.type,
        value: effect.value,
        actualValue,
        isCritical,
        isBlocked,
        isResisted,
      };
    });
  }

  /**
   * 判断是否为物理效果
   */
  private isPhysicalEffect(effectType: string): boolean {
    const physicalTypes = [
      'physical_damage', 'slash', 'pierce', 'blunt', 'melee_damage',
      'attack', 'physical_attack', 'weapon_damage'
    ];
    return physicalTypes.some(t => effectType.includes(t));
  }

  /**
   * 判断是否为魔法效果
   */
  private isMagicalEffect(effectType: string): boolean {
    const magicalTypes = [
      'magical_damage', 'magic_damage', 'spell_damage', 'elemental_damage',
      'fire', 'ice', 'lightning', 'holy', 'shadow', 'arcane'
    ];
    return magicalTypes.some(t => effectType.includes(t));
  }

  /**
   * 判断是否为治疗效果
   */
  private isHealingEffect(effectType: string): boolean {
    const healingTypes = ['heal', 'healing', 'restore', 'recover_hp', 'regeneration'];
    return healingTypes.some(t => effectType.includes(t));
  }

  /**
   * 判断是否为伤害效果
   */
  private isDamageEffect(effectType: string): boolean {
    const damageTypes = ['damage', 'attack', 'hit', 'strike'];
    return damageTypes.some(t => effectType.includes(t)) || 
           this.isPhysicalEffect(effectType) || 
           this.isMagicalEffect(effectType);
  }

  /**
   * 暴击判定
   */
  private rollCritical(critRate: number): boolean {
    return Math.random() * 100 < critRate;
  }

  /**
   * 闪避判定
   */
  private rollDodge(dodgeRate: number): boolean {
    return Math.random() * 100 < dodgeRate;
  }

  /**
   * 格挡判定
   */
  private rollBlock(blockRate: number): boolean {
    return Math.random() * 100 < blockRate;
  }

  /**
   * 计算防御减伤比例
   */
  private calculateDefenseReduction(defense: number): number {
    // 使用递减公式：减伤 = defense / (defense + 100)
    // 最大减伤 75%
    return Math.min(0.75, defense / (defense + 100));
  }

  /**
   * 计算抗性减伤比例
   */
  private calculateResistReduction(resistance: number): number {
    // 抗性直接转换为百分比减伤
    // 最大减伤 50%
    return Math.min(0.5, resistance / 200);
  }

  /**
   * 检查技能可用性
   */
  public async checkSkillAvailability(
    skillId: string,
    characterId: string
  ): Promise<SkillApiResponse<SkillAvailabilityResponse>> {
    try {
      const repo = getSkillRepository();
      const entity = repo.findByCharacterAndSkillId(characterId, skillId);

      if (!entity) {
        return {
          success: true,
          data: {
            available: false,
            reason: '技能未学习',
          },
        };
      }

      // 检查冷却
      const cooldownRepo = getSkillCooldownRepository();
      const cooldown = cooldownRepo.findByCharacterAndSkill(characterId, skillId);

      if (cooldown && cooldown.remaining_turns > 0) {
        return {
          success: true,
          data: {
            available: false,
            reason: '技能冷却中',
            cooldownRemaining: cooldown.remaining_turns,
          },
        };
      }

      // 检查消耗（简化版，实际应检查角色资源）
      // TODO: 集成角色资源检查

      return {
        success: true,
        data: {
          available: true,
        },
      };
    } catch (error) {
      gameLog.error('system', 'Error checking skill availability', { error });
      return {
        success: false,
        error: error instanceof Error ? error.message : '检查技能可用性失败',
      };
    }
  }

  // ==================== 冷却管理 ====================

  /**
   * 获取角色所有冷却
   */
  public async getCharacterCooldowns(
    characterId: string
  ): Promise<SkillApiResponse<SkillCooldownResponse>> {
    try {
      const repo = getSkillCooldownRepository();
      const entities = repo.findByCharacterId(characterId);
      const cooldowns = entities.map(e => repo.toCooldownState(e));

      return {
        success: true,
        data: {
          cooldowns,
          count: cooldowns.length,
        },
      };
    } catch (error) {
      gameLog.error('system', 'Error getting cooldowns', { error });
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取冷却失败',
      };
    }
  }

  /**
   * 减少冷却
   */
  public async reduceCooldown(
    characterId: string,
    skillId: string | undefined,
    amount: number = 1
  ): Promise<SkillApiResponse<void>> {
    try {
      const repo = getSkillCooldownRepository();

      if (skillId) {
        repo.reduceCooldown(characterId, skillId, amount);
      } else {
        repo.reduceAllCooldowns(characterId, amount);
      }

      return {
        success: true,
        message: '冷却已减少',
      };
    } catch (error) {
      gameLog.error('system', 'Error reducing cooldown', { error });
      return {
        success: false,
        error: error instanceof Error ? error.message : '减少冷却失败',
      };
    }
  }

  /**
   * 重置冷却
   */
  public async resetCooldown(
    characterId: string,
    skillId: string | undefined
  ): Promise<SkillApiResponse<void>> {
    try {
      const repo = getSkillCooldownRepository();

      if (skillId) {
        repo.resetCooldown(characterId, skillId);
      } else {
        repo.resetAllCooldowns(characterId);
      }

      return {
        success: true,
        message: '冷却已重置',
      };
    } catch (error) {
      gameLog.error('system', 'Error resetting cooldown', { error });
      return {
        success: false,
        error: error instanceof Error ? error.message : '重置冷却失败',
      };
    }
  }

  // ==================== 模板管理 ====================

  /**
   * 创建技能模板
   */
  public async createTemplate(data: CreateTemplateData): Promise<SkillApiResponse<SkillTemplate>> {
    try {
      const templateRepo = getSkillTemplateRepository();

      // 检查是否已存在同名模板
      const existing = templateRepo.findByName(data.name);
      if (existing) {
        return {
          success: false,
          error: `模板名称已存在: ${data.name}`,
        };
      }

      const template: SkillTemplate = {
        id: '', // 由仓库生成
        name: data.name,
        description: data.description,
        type: data.type,
        category: data.category,
        baseCosts: data.baseCosts as SkillTemplate['baseCosts'],
        baseCooldown: data.baseCooldown,
        baseEffects: data.baseEffects as SkillTemplate['baseEffects'],
        requirements: (data.requirements || []) as SkillTemplate['requirements'],
        maxLevel: data.maxLevel || 10,
        scalingPerLevel: data.scalingPerLevel || {
          costMultiplier: 1.1,
          effectMultiplier: 1.15,
          cooldownReduction: 1,
        },
      };

      const entity = templateRepo.createTemplate(template);

      return {
        success: true,
        data: templateRepo.toTemplate(entity),
        message: `模板 ${template.name} 创建成功`,
      };
    } catch (error) {
      gameLog.error('system', 'Error creating template', { error });
      return {
        success: false,
        error: error instanceof Error ? error.message : '创建模板失败',
      };
    }
  }

  /**
   * 获取模板
   */
  public async getTemplate(templateId: string): Promise<SkillApiResponse<SkillTemplate>> {
    try {
      const templateRepo = getSkillTemplateRepository();
      const entity = templateRepo.findById(templateId);

      if (!entity) {
        return {
          success: false,
          error: `模板不存在: ${templateId}`,
        };
      }

      return {
        success: true,
        data: templateRepo.toTemplate(entity),
      };
    } catch (error) {
      gameLog.error('system', 'Error getting template', { error });
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取模板失败',
      };
    }
  }

  /**
   * 获取所有模板
   */
  public async getAllTemplates(): Promise<SkillApiResponse<SkillTemplate[]>> {
    try {
      const templateRepo = getSkillTemplateRepository();
      const entities = templateRepo.findAll();
      const templates = entities.map(e => templateRepo.toTemplate(e));

      return {
        success: true,
        data: templates,
      };
    } catch (error) {
      gameLog.error('system', 'Error getting templates', { error });
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取模板列表失败',
      };
    }
  }

  // ==================== 统计 ====================

  /**
   * 获取技能统计
   */
  public async getStatistics(characterId?: string): Promise<SkillApiResponse<SkillStatistics>> {
    try {
      const repo = getSkillRepository();
      const cooldownRepo = getSkillCooldownRepository();

      let skills: ExtendedSkill[] = [];

      if (characterId) {
        const entities = repo.findByCharacterId(characterId);
        skills = entities.map(e => repo.toSkill(e));
      } else {
        const entities = repo.findAll();
        skills = entities.map(e => repo.toSkill(e));
      }

      const stats: SkillStatistics = {
        totalSkills: skills.length,
        byCategory: {
          combat: 0,
          magic: 0,
          craft: 0,
          social: 0,
          exploration: 0,
          custom: 0,
        },
        byType: {
          active: 0,
          passive: 0,
          toggle: 0,
        },
        learnedSkills: skills.length,
        maxLevelSkills: 0,
        totalCooldowns: 0,
      };

      for (const skill of skills) {
        stats.byCategory[skill.category]++;
        stats.byType[skill.type]++;
        if (skill.level >= skill.maxLevel) {
          stats.maxLevelSkills++;
        }
      }

      if (characterId) {
        const cooldowns = cooldownRepo.findByCharacterId(characterId);
        stats.totalCooldowns = cooldowns.length;
      }

      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      gameLog.error('system', 'Error getting statistics', { error });
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取统计失败',
      };
    }
  }

  // ==================== 辅助方法 ====================

  /**
   * 应用模板缩放
   */
  private applyTemplateScaling(template: SkillTemplate, level: number): ExtendedSkill {
    const scaling = template.scalingPerLevel;
    const levelMultiplier = level - 1;

    // 计算缩放后的消耗
    const scaledCosts = template.baseCosts.map(cost => ({
      ...cost,
      value: Math.floor(cost.value * Math.pow(scaling.costMultiplier, levelMultiplier)),
    }));

    // 计算缩放后的效果
    const scaledEffects = template.baseEffects.map(effect => ({
      ...effect,
      value: Math.floor(effect.value * Math.pow(scaling.effectMultiplier, levelMultiplier)),
    }));

    // 计算缩放后的冷却
    const scaledCooldown = Math.max(
      0,
      template.baseCooldown - scaling.cooldownReduction * levelMultiplier
    );

    const skillId = `skill_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return {
      id: skillId,
      name: template.name,
      description: template.description,
      type: template.type,
      category: template.category,
      costs: scaledCosts,
      cooldown: scaledCooldown,
      effects: scaledEffects,
      requirements: template.requirements,
      level,
      maxLevel: template.maxLevel,
      targetType: 'single_enemy',
      isToggleOn: false,
      tags: [],
    };
  }
}

// ==================== 单例导出 ====================

let skillServiceInstance: SkillService | null = null;

export function getSkillService(): SkillService {
  if (!skillServiceInstance) {
    skillServiceInstance = SkillService.getInstance();
  }
  return skillServiceInstance;
}

export async function initializeSkillService(): Promise<SkillService> {
  const service = getSkillService();
  await service.initialize();
  return service;
}
