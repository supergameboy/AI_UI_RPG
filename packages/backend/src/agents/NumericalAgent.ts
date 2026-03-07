import type {
  AgentType,
  AgentMessage,
  AgentResponse,
  UIInstruction,
  Character,
  StatusEffect,
  AgentBinding,
  ToolType,
  InitializationContext,
  InitializationResult,
} from '@ai-rpg/shared';
import { AgentType as AT, ToolType as ToolTypeEnum } from '@ai-rpg/shared';
import { AgentBase } from './AgentBase';
import {
  calculateInitialAttributes,
  calculateInitialHP,
  calculateInitialMP,
} from '../data/initialData';
import { gameLog } from '../services/GameLogService';

// ==================== 类型定义 ====================

/** 基础属性名称 */
type BaseAttributeName = 'strength' | 'dexterity' | 'constitution' | 'intelligence' | 'wisdom' | 'charisma';

/** 派生属性名称 */
type DerivedAttributeName = 'maxHp' | 'maxMp' | 'attack' | 'defense' | 'speed' | 'luck' | 'critRate' | 'critDamage' | 'dodgeRate' | 'blockRate';

/** 伤害类型 */
type DamageType = 'physical' | 'magical' | 'true';

/** 成长曲线类型 */
type GrowthCurveType = 'linear' | 'exponential' | 'custom';

/** 属性成长配置 */
interface AttributeGrowthConfig {
  baseValue: number;
  growthType: GrowthCurveType;
  growthRate: number;
  customFormula?: (level: number, baseValue: number, growthRate: number) => number;
}

/** 派生属性公式配置 */
interface DerivedAttributeFormula {
  name: string;
  baseValue: number;
  scalingAttributes: Array<{
    attribute: BaseAttributeName;
    multiplier: number;
  }>;
  levelScaling?: number;
}

/** 伤害计算参数 */
interface DamageCalculationParams {
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

/** 伤害计算结果 */
interface DamageResult {
  finalDamage: number;
  isCritical: boolean;
  isDodged: boolean;
  isBlocked: boolean;
  blockedDamage: number;
  damageType: DamageType;
  breakdown: {
    baseDamage: number;
    skillMultiplier: number;
    criticalMultiplier: number;
    defenseReduction: number;
    penetrationReduction: number;
  };
}

/** 治疗计算参数 */
interface HealingCalculationParams {
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

/** 治疗计算结果 */
interface HealingResult {
  finalHealing: number;
  overhealing: number;
  breakdown: {
    baseHealing: number;
    skillMultiplier: number;
    attributeBonus: number;
    healingBonus: number;
  };
}

/** 等级经验配置 */
interface LevelExperienceConfig {
  maxLevel: number;
  baseExperience: number;
  experienceGrowthType: GrowthCurveType;
  experienceGrowthRate: number;
  customFormula?: (level: number) => number;
}

/** 等级提升结果 */
interface LevelUpResult {
  previousLevel: number;
  newLevel: number;
  attributeGains: Record<BaseAttributeName, number>;
  derivedAttributeGains: Record<string, number>;
  unlockedSkills: string[];
  experienceRemaining: number;
}

/** 属性修改请求 */
interface AttributeModification {
  targetId: string;
  attribute: BaseAttributeName | DerivedAttributeName;
  value: number;
  type: 'add' | 'subtract' | 'set' | 'multiply';
  source: string;
  duration?: number;
}

/** 战斗统计 */
interface CombatStatistics {
  totalDamageDealt: number;
  totalDamageTaken: number;
  totalHealingDone: number;
  totalHealingReceived: number;
  criticalHits: number;
  dodgedAttacks: number;
  blockedAttacks: number;
  averageDamagePerHit: number;
}

/** 角色数值快照 */
interface CharacterSnapshot {
  timestamp: number;
  level: number;
  experience: number;
  baseAttributes: Record<BaseAttributeName, number>;
  derivedAttributes: Record<DerivedAttributeName, number>;
  statusEffects: StatusEffect[];
}

// ==================== 常量配置 ====================

/** 基础属性成长默认配置 */
const DEFAULT_ATTRIBUTE_GROWTH: Record<BaseAttributeName, AttributeGrowthConfig> = {
  strength: { baseValue: 10, growthType: 'linear', growthRate: 2 },
  dexterity: { baseValue: 10, growthType: 'linear', growthRate: 2 },
  constitution: { baseValue: 10, growthType: 'linear', growthRate: 2 },
  intelligence: { baseValue: 10, growthType: 'linear', growthRate: 2 },
  wisdom: { baseValue: 10, growthType: 'linear', growthRate: 2 },
  charisma: { baseValue: 10, growthType: 'linear', growthRate: 1 },
};

/** 派生属性公式 */
const DERIVED_ATTRIBUTE_FORMULAS: DerivedAttributeFormula[] = [
  {
    name: 'maxHp',
    baseValue: 100,
    scalingAttributes: [{ attribute: 'constitution', multiplier: 10 }],
    levelScaling: 5,
  },
  {
    name: 'maxMp',
    baseValue: 50,
    scalingAttributes: [{ attribute: 'intelligence', multiplier: 5 }, { attribute: 'wisdom', multiplier: 3 }],
    levelScaling: 3,
  },
  {
    name: 'attack',
    baseValue: 10,
    scalingAttributes: [{ attribute: 'strength', multiplier: 2 }],
    levelScaling: 1,
  },
  {
    name: 'defense',
    baseValue: 5,
    scalingAttributes: [{ attribute: 'constitution', multiplier: 1 }, { attribute: 'dexterity', multiplier: 0.5 }],
    levelScaling: 0.5,
  },
  {
    name: 'speed',
    baseValue: 100,
    scalingAttributes: [{ attribute: 'dexterity', multiplier: 2 }],
    levelScaling: 0,
  },
  {
    name: 'luck',
    baseValue: 0,
    scalingAttributes: [{ attribute: 'charisma', multiplier: 0.5 }],
    levelScaling: 0,
  },
  {
    name: 'critRate',
    baseValue: 5,
    scalingAttributes: [{ attribute: 'dexterity', multiplier: 0.3 }, { attribute: 'charisma', multiplier: 0.05 }],
    levelScaling: 0,
  },
  {
    name: 'critDamage',
    baseValue: 150,
    scalingAttributes: [{ attribute: 'strength', multiplier: 0.5 }],
    levelScaling: 0,
  },
  {
    name: 'dodgeRate',
    baseValue: 5,
    scalingAttributes: [{ attribute: 'dexterity', multiplier: 0.3 }],
    levelScaling: 0,
  },
  {
    name: 'blockRate',
    baseValue: 5,
    scalingAttributes: [{ attribute: 'constitution', multiplier: 0.2 }, { attribute: 'strength', multiplier: 0.1 }],
    levelScaling: 0,
  },
];

/** 等级经验默认配置 */
const DEFAULT_LEVEL_CONFIG: LevelExperienceConfig = {
  maxLevel: 100,
  baseExperience: 100,
  experienceGrowthType: 'exponential',
  experienceGrowthRate: 1.15,
};

/** 默认格挡减伤比例 */
const DEFAULT_BLOCK_REDUCTION = 0.5;

// ==================== 数值管理智能体 ====================

/**
 * 数值管理智能体
 * 负责属性计算、战斗数值、经验值和等级管理
 */
export class NumericalAgent extends AgentBase {
  readonly type: AgentType = AT.NUMERICAL;

  // 依赖的 Tool 类型
  readonly tools: ToolType[] = [
    ToolTypeEnum.NUMERICAL,
    ToolTypeEnum.COMBAT_DATA,
    ToolTypeEnum.SKILL_DATA,
    ToolTypeEnum.INVENTORY_DATA,
  ];

  // 可调用的 Agent 绑定配置
  readonly bindings: AgentBinding[] = [
    { agentType: AT.COORDINATOR, enabled: true },
    { agentType: AT.INVENTORY, enabled: true },
    { agentType: AT.SKILL, enabled: true },
    { agentType: AT.COMBAT, enabled: true },
  ];

  // 角色数据存储
  private characters: Map<string, Character> = new Map();

  // 属性成长配置
  private attributeGrowthConfigs: Map<BaseAttributeName, AttributeGrowthConfig> = new Map();

  // 等级配置
  private levelConfig: LevelExperienceConfig = { ...DEFAULT_LEVEL_CONFIG };

  // 经验值表（预计算）
  private experienceTable: number[] = [];

  // 角色快照历史
  private snapshots: Map<string, CharacterSnapshot[]> = new Map();

  // 战斗统计
  private combatStats: Map<string, CombatStatistics> = new Map();

  constructor() {
    super({
      temperature: 0.3, // 数值计算需要低温度以保证一致性
      maxTokens: 4096,
    });

    // 初始化属性成长配置
    for (const [attr, config] of Object.entries(DEFAULT_ATTRIBUTE_GROWTH)) {
      this.attributeGrowthConfigs.set(attr as BaseAttributeName, config);
    }

    // 预计算经验值表
    this.calculateExperienceTable();
  }

  protected getAgentName(): string {
    return 'Numerical Agent';
  }

  protected getAgentDescription(): string {
    return '数值管理智能体，负责属性计算、战斗数值、经验值和等级管理';
  }

  protected getAgentCapabilities(): string[] {
    return [
      'attribute_calculation',
      'derived_attribute_calculation',
      'damage_calculation',
      'healing_calculation',
      'level_management',
      'experience_tracking',
      'growth_curve',
      'combat_mechanics',
      'balance_adjustment',
      'snapshot_management',
    ];
  }

  /**
   * 初始化方法
   * 用于游戏开始时计算角色的初始属性值
   */
  async initialize(context: InitializationContext): Promise<InitializationResult> {
    try {
      const { character } = context;
      
      // 计算基础属性（基于种族、职业、背景）
      const baseAttributes = calculateInitialAttributes(
        character.race,
        character.class,
        character.backgroundId || 'commoner' // 使用 backgroundId，默认为 'commoner'
      );
      
      // 计算派生属性
      const constitution = baseAttributes['constitution'] || 10;
      const intelligence = baseAttributes['intelligence'] || 10;
      const wisdom = baseAttributes['wisdom'] || 10;
      
      const maxHp = calculateInitialHP(character.class, constitution);
      const maxMp = calculateInitialMP(character.class, intelligence, wisdom);
      
      // 注册角色到数值系统
      this.characters.set(character.id, {
        ...character,
        baseAttributes: {
          strength: baseAttributes['strength'] || 10,
          dexterity: baseAttributes['dexterity'] || 10,
          constitution: baseAttributes['constitution'] || 10,
          intelligence: baseAttributes['intelligence'] || 10,
          wisdom: baseAttributes['wisdom'] || 10,
          charisma: baseAttributes['charisma'] || 10,
        },
        derivedAttributes: {
          maxHp,
          currentHp: maxHp,
          maxMp,
          currentMp: maxMp,
          attack: Math.floor((baseAttributes['strength'] || 10) * 0.5 + (baseAttributes['dexterity'] || 10) * 0.3),
          defense: Math.floor((baseAttributes['constitution'] || 10) * 0.5),
          speed: 100 + Math.floor((baseAttributes['dexterity'] || 10) * 2),
          luck: Math.floor((baseAttributes['charisma'] || 10) * 0.5),
        },
        statusEffects: [],
      });
      
      this.addMemory(
        `Initialized numerical data for character: ${character.name}`,
        'assistant',
        7,
        { characterId: character.id, baseAttributes }
      );
      
      return {
        success: true,
        data: {
          baseAttributes,
          derivedAttributes: {
            maxHp,
            maxMp,
          },
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during numerical initialization';
      gameLog.error('agent', `Initialization failed: ${errorMessage}`, {
        agentType: this.type,
        characterId: context.character?.id,
        saveId: context.saveId,
        stack: error instanceof Error ? error.stack : undefined,
      });
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * 处理消息主入口
   */
  async processMessage(message: AgentMessage): Promise<AgentResponse> {
    const action = message.payload.action;
    const data = message.payload.data as Record<string, unknown>;

    try {
      switch (action) {
        // 属性计算
        case 'calculate_base_attributes':
          return this.handleCalculateBaseAttributes(data);
        case 'calculate_derived_attributes':
          return this.handleCalculateDerivedAttributes(data);
        case 'modify_attribute':
          return this.handleModifyAttribute(data);
        case 'get_attribute_growth':
          return this.handleGetAttributeGrowth(data);

        // 伤害和治疗
        case 'calculate_damage':
          return this.handleCalculateDamage(data);
        case 'calculate_healing':
          return this.handleCalculateHealing(data);
        case 'apply_damage':
          return this.handleApplyDamage(data);
        case 'apply_healing':
          return this.handleApplyHealing(data);

        // 等级系统
        case 'add_experience':
          return this.handleAddExperience(data);
        case 'check_level_up':
          return this.handleCheckLevelUp(data);
        case 'get_experience_for_level':
          return this.handleGetExperienceForLevel(data);
        case 'set_level':
          return this.handleSetLevel(data);

        // 成长曲线
        case 'set_growth_curve':
          return this.handleSetGrowthCurve(data);
        case 'calculate_growth':
          return this.handleCalculateGrowth(data);

        // 状态效果
        case 'apply_status_effect':
          return this.handleApplyStatusEffect(data);
        case 'remove_status_effect':
          return this.handleRemoveStatusEffect(data);
        case 'calculate_status_effect_modifiers':
          return this.handleCalculateStatusEffectModifiers(data);

        // 快照和统计
        case 'create_snapshot':
          return this.handleCreateSnapshot(data);
        case 'get_snapshot':
          return this.handleGetSnapshot(data);
        case 'get_combat_statistics':
          return this.handleGetCombatStatistics(data);

        // 角色管理
        case 'register_character':
          return this.handleRegisterCharacter(data);
        case 'get_character_stats':
          return this.handleGetCharacterStats(data);
        case 'recalculate_all':
          return this.handleRecalculateAll(data);

        default:
          return {
            success: false,
            error: `Unknown action: ${action}`,
          };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error in NumericalAgent',
      };
    }
  }

  // ==================== 属性计算 ====================

  /**
   * 计算基础属性
   */
  private handleCalculateBaseAttributes(data: Record<string, unknown>): AgentResponse {
    const params = data as {
      level: number;
      race?: string;
      class?: string;
      customGrowth?: Partial<Record<BaseAttributeName, AttributeGrowthConfig>>;
      // 模板配置（可选，用于精确的种族/职业加成）
      raceConfig?: {
        bonuses?: Record<string, number>;
        penalties?: Record<string, number>;
      };
      classConfig?: {
        primaryAttributes?: string[];
        attributeBonuses?: Record<string, number>;
      };
    };

    if (params.level === undefined || params.level < 1) {
      return {
        success: false,
        error: 'Invalid level provided',
      };
    }

    const attributes: Record<BaseAttributeName, number> = {
      strength: 0,
      dexterity: 0,
      constitution: 0,
      intelligence: 0,
      wisdom: 0,
      charisma: 0,
    };

    for (const attr of Object.keys(attributes) as BaseAttributeName[]) {
      const config = params.customGrowth?.[attr] || this.attributeGrowthConfigs.get(attr) || DEFAULT_ATTRIBUTE_GROWTH[attr];
      attributes[attr] = this.calculateGrowthValue(params.level, config);
    }

    // 应用种族和职业加成
    if (params.race) {
      this.applyRaceBonus(attributes, params.race, params.raceConfig);
    }
    if (params.class) {
      this.applyClassBonus(attributes, params.class, params.classConfig);
    }

    this.addMemory(
      `Calculated base attributes for level ${params.level}`,
      'assistant',
      5,
      { level: params.level, attributes }
    );

    return {
      success: true,
      data: { attributes, level: params.level },
    };
  }

  /**
   * 计算派生属性
   */
  private handleCalculateDerivedAttributes(data: Record<string, unknown>): AgentResponse {
    const params = data as {
      baseAttributes: Record<BaseAttributeName, number>;
      level: number;
      equipment?: Record<string, unknown>;
      buffs?: StatusEffect[];
    };

    if (!params.baseAttributes || params.level === undefined) {
      return {
        success: false,
        error: 'Missing required fields: baseAttributes, level',
      };
    }

    const derivedAttributes: Record<DerivedAttributeName, number> = {
      maxHp: 0,
      maxMp: 0,
      attack: 0,
      defense: 0,
      speed: 0,
      luck: 0,
      critRate: 0,
      critDamage: 0,
      dodgeRate: 0,
      blockRate: 0,
    };

    // 应用公式计算
    for (const formula of DERIVED_ATTRIBUTE_FORMULAS) {
      let value = formula.baseValue;

      // 属性加成
      for (const scaling of formula.scalingAttributes) {
        value += params.baseAttributes[scaling.attribute] * scaling.multiplier;
      }

      // 等级加成
      if (formula.levelScaling) {
        value += params.level * formula.levelScaling;
      }

      derivedAttributes[formula.name as DerivedAttributeName] = Math.floor(value);
    }

    // 应用装备加成
    if (params.equipment) {
      this.applyEquipmentBonuses(derivedAttributes, params.equipment);
    }

    // 应用状态效果
    if (params.buffs && params.buffs.length > 0) {
      this.applyStatusEffectModifiers(derivedAttributes, params.buffs);
    }

    return {
      success: true,
      data: { derivedAttributes, level: params.level },
    };
  }

  /**
   * 修改属性
   */
  private handleModifyAttribute(data: Record<string, unknown>): AgentResponse {
    const modification = data as unknown as AttributeModification;

    if (!modification.targetId || !modification.attribute || modification.value === undefined) {
      return {
        success: false,
        error: 'Missing required fields: targetId, attribute, value',
      };
    }

    const character = this.characters.get(modification.targetId);
    if (!character) {
      return {
        success: false,
        error: `Character not found: ${modification.targetId}`,
      };
    }

    const previousValue = this.getAttributeValue(character, modification.attribute);
    let newValue = previousValue;

    switch (modification.type) {
      case 'add':
        newValue = previousValue + modification.value;
        break;
      case 'subtract':
        newValue = previousValue - modification.value;
        break;
      case 'set':
        newValue = modification.value;
        break;
      case 'multiply':
        newValue = previousValue * modification.value;
        break;
    }

    // 确保属性不会低于最小值
    newValue = Math.max(this.getAttributeMinValue(modification.attribute), newValue);

    this.setAttributeValue(character, modification.attribute, newValue);

    this.addMemory(
      `Modified ${modification.attribute} for ${modification.targetId}: ${previousValue} -> ${newValue}`,
      'assistant',
      5,
      { targetId: modification.targetId, attribute: modification.attribute, previousValue, newValue, source: modification.source }
    );

    const uiInstructions: UIInstruction[] = [
      {
        type: 'update',
        target: 'character_stats',
        action: 'attribute_changed',
        data: {
          targetId: modification.targetId,
          attribute: modification.attribute,
          previousValue,
          newValue,
          source: modification.source,
        },
        options: { priority: 'normal' },
      },
    ];

    return {
      success: true,
      data: {
        attribute: modification.attribute,
        previousValue,
        newValue,
        change: newValue - previousValue,
      },
      uiInstructions,
    };
  }

  /**
   * 获取属性成长配置
   */
  private handleGetAttributeGrowth(data: Record<string, unknown>): AgentResponse {
    const params = data as { attribute?: BaseAttributeName };

    if (params.attribute) {
      const config = this.attributeGrowthConfigs.get(params.attribute) || DEFAULT_ATTRIBUTE_GROWTH[params.attribute];
      return {
        success: true,
        data: { attribute: params.attribute, config },
      };
    }

    // 返回所有配置
    const allConfigs: Record<BaseAttributeName, AttributeGrowthConfig> = { ...DEFAULT_ATTRIBUTE_GROWTH };
    for (const [attr, config] of this.attributeGrowthConfigs) {
      allConfigs[attr] = config;
    }

    return {
      success: true,
      data: { configs: allConfigs },
    };
  }

  // ==================== 伤害和治疗计算 ====================

  /**
   * 计算伤害
   */
  private handleCalculateDamage(data: Record<string, unknown>): AgentResponse {
    const params = data as unknown as DamageCalculationParams;

    if (!params.attacker || !params.defender || !params.damageType) {
      return {
        success: false,
        error: 'Missing required fields: attacker, defender, damageType',
      };
    }

    const result = this.calculateDamage(params);

    // 更新战斗统计
    this.updateCombatStats(params.attacker.level.toString(), {
      totalDamageDealt: result.finalDamage,
      criticalHits: result.isCritical ? 1 : 0,
    });

    this.updateCombatStats(params.defender.level.toString(), {
      totalDamageTaken: result.finalDamage,
      dodgedAttacks: result.isDodged ? 1 : 0,
      blockedAttacks: result.isBlocked ? 1 : 0,
    });

    this.addMemory(
      `Damage calculated: ${result.finalDamage} (${params.damageType})`,
      'assistant',
      6,
      { result, params }
    );

    return {
      success: true,
      data: result,
    };
  }

  /**
   * 计算治疗
   */
  private handleCalculateHealing(data: Record<string, unknown>): AgentResponse {
    const params = data as unknown as HealingCalculationParams;

    if (!params.healer || !params.target || params.baseHealing === undefined) {
      return {
        success: false,
        error: 'Missing required fields: healer, target, baseHealing',
      };
    }

    const result = this.calculateHealing(params);

    // 更新战斗统计
    this.updateCombatStats(params.healer.level.toString(), {
      totalHealingDone: result.finalHealing,
    });

    this.updateCombatStats(params.target.level.toString(), {
      totalHealingReceived: result.finalHealing,
    });

    this.addMemory(
      `Healing calculated: ${result.finalHealing}`,
      'assistant',
      5,
      { result, params }
    );

    return {
      success: true,
      data: result,
    };
  }

  /**
   * 应用伤害
   */
  private handleApplyDamage(data: Record<string, unknown>): AgentResponse {
    const params = data as {
      targetId: string;
      damage: number;
      damageType: DamageType;
      source?: string;
    };

    if (!params.targetId || params.damage === undefined) {
      return {
        success: false,
        error: 'Missing required fields: targetId, damage',
      };
    }

    const character = this.characters.get(params.targetId);
    if (!character) {
      return {
        success: false,
        error: `Character not found: ${params.targetId}`,
      };
    }

    const previousHp = character.derivedAttributes.currentHp;
    const newHp = Math.max(0, previousHp - params.damage);
    const actualDamage = previousHp - newHp;

    character.derivedAttributes.currentHp = newHp;

    const isDead = newHp <= 0;

    this.addMemory(
      `Applied ${actualDamage} damage to ${params.targetId}. HP: ${previousHp} -> ${newHp}`,
      'assistant',
      7,
      { targetId: params.targetId, damage: actualDamage, previousHp, newHp, isDead }
    );

    const uiInstructions: UIInstruction[] = [
      {
        type: 'update',
        target: 'character_hp',
        action: 'damage_taken',
        data: {
          targetId: params.targetId,
          damage: actualDamage,
          currentHp: newHp,
          maxHp: character.derivedAttributes.maxHp,
          damageType: params.damageType,
          source: params.source,
        },
        options: { priority: 'high' },
      },
    ];

    if (isDead) {
      uiInstructions.push({
        type: 'notify',
        target: 'notification',
        action: 'character_death',
        data: { targetId: params.targetId },
        options: { priority: 'critical' },
      });
    }

    return {
      success: true,
      data: {
        targetId: params.targetId,
        previousHp,
        currentHp: newHp,
        damageDealt: actualDamage,
        isDead,
      },
      uiInstructions,
    };
  }

  /**
   * 应用治疗
   */
  private handleApplyHealing(data: Record<string, unknown>): AgentResponse {
    const params = data as {
      targetId: string;
      healing: number;
      source?: string;
    };

    if (!params.targetId || params.healing === undefined) {
      return {
        success: false,
        error: 'Missing required fields: targetId, healing',
      };
    }

    const character = this.characters.get(params.targetId);
    if (!character) {
      return {
        success: false,
        error: `Character not found: ${params.targetId}`,
      };
    }

    const previousHp = character.derivedAttributes.currentHp;
    const maxHp = character.derivedAttributes.maxHp;
    const newHp = Math.min(maxHp, previousHp + params.healing);
    const actualHealing = newHp - previousHp;
    const overhealing = params.healing - actualHealing;

    character.derivedAttributes.currentHp = newHp;

    this.addMemory(
      `Applied ${actualHealing} healing to ${params.targetId}. HP: ${previousHp} -> ${newHp}`,
      'assistant',
      5,
      { targetId: params.targetId, healing: actualHealing, previousHp, newHp, overhealing }
    );

    const uiInstructions: UIInstruction[] = [
      {
        type: 'update',
        target: 'character_hp',
        action: 'healing_received',
        data: {
          targetId: params.targetId,
          healing: actualHealing,
          currentHp: newHp,
          maxHp,
          source: params.source,
        },
        options: { priority: 'normal' },
      },
    ];

    return {
      success: true,
      data: {
        targetId: params.targetId,
        previousHp,
        currentHp: newHp,
        healingDone: actualHealing,
        overhealing,
      },
      uiInstructions,
    };
  }

  // ==================== 等级系统 ====================

  /**
   * 添加经验值
   */
  private handleAddExperience(data: Record<string, unknown>): AgentResponse {
    const params = data as {
      characterId: string;
      amount: number;
      source?: string;
    };

    if (!params.characterId || params.amount === undefined) {
      return {
        success: false,
        error: 'Missing required fields: characterId, amount',
      };
    }

    const character = this.characters.get(params.characterId);
    if (!character) {
      return {
        success: false,
        error: `Character not found: ${params.characterId}`,
      };
    }

    const previousExp = character.experience;
    const previousLevel = character.level;

    character.experience += params.amount;

    // 检查升级
    const levelUpResults: LevelUpResult[] = [];
    let continueLeveling = true;

    while (continueLeveling) {
      const expNeeded = this.getExperienceForLevel(character.level + 1);
      if (character.experience >= expNeeded && character.level < this.levelConfig.maxLevel) {
        const result = this.performLevelUp(character);
        levelUpResults.push(result);
      } else {
        continueLeveling = false;
      }
    }

    this.addMemory(
      `Added ${params.amount} experience to ${params.characterId}. Level: ${previousLevel} -> ${character.level}`,
      'assistant',
      levelUpResults.length > 0 ? 8 : 4,
      { characterId: params.characterId, amount: params.amount, previousExp, levelUps: levelUpResults.length }
    );

    const uiInstructions: UIInstruction[] = [
      {
        type: 'update',
        target: 'character_exp',
        action: 'experience_gained',
        data: {
          characterId: params.characterId,
          amount: params.amount,
          currentExp: character.experience,
          currentLevel: character.level,
          source: params.source,
        },
        options: { priority: 'normal' },
      },
    ];

    for (const result of levelUpResults) {
      uiInstructions.push({
        type: 'notify',
        target: 'notification',
        action: 'level_up',
        data: {
          characterId: params.characterId,
          previousLevel: result.previousLevel,
          newLevel: result.newLevel,
          attributeGains: result.attributeGains,
        },
        options: { priority: 'high', duration: 5000 },
      });
    }

    return {
      success: true,
      data: {
        characterId: params.characterId,
        previousExp,
        currentExp: character.experience,
        expGained: params.amount,
        previousLevel,
        currentLevel: character.level,
        levelUps: levelUpResults,
      },
      uiInstructions,
    };
  }

  /**
   * 检查升级
   */
  private handleCheckLevelUp(data: Record<string, unknown>): AgentResponse {
    const params = data as { characterId: string };

    if (!params.characterId) {
      return {
        success: false,
        error: 'Missing required field: characterId',
      };
    }

    const character = this.characters.get(params.characterId);
    if (!character) {
      return {
        success: false,
        error: `Character not found: ${params.characterId}`,
      };
    }

    const expNeeded = this.getExperienceForLevel(character.level + 1);
    const canLevelUp = character.experience >= expNeeded && character.level < this.levelConfig.maxLevel;

    return {
      success: true,
      data: {
        characterId: params.characterId,
        currentLevel: character.level,
        currentExp: character.experience,
        expNeeded,
        canLevelUp,
        expToNextLevel: canLevelUp ? 0 : expNeeded - character.experience,
      },
    };
  }

  /**
   * 获取升级所需经验值
   */
  private handleGetExperienceForLevel(data: Record<string, unknown>): AgentResponse {
    const params = data as { level: number };

    if (params.level === undefined || params.level < 1) {
      return {
        success: false,
        error: 'Invalid level provided',
      };
    }

    const expNeeded = this.getExperienceForLevel(params.level);

    return {
      success: true,
      data: {
        level: params.level,
        experienceRequired: expNeeded,
      },
    };
  }

  /**
   * 设置等级
   */
  private handleSetLevel(data: Record<string, unknown>): AgentResponse {
    const params = data as {
      characterId: string;
      level: number;
      recalculateAttributes?: boolean;
    };

    if (!params.characterId || params.level === undefined) {
      return {
        success: false,
        error: 'Missing required fields: characterId, level',
      };
    }

    if (params.level < 1 || params.level > this.levelConfig.maxLevel) {
      return {
        success: false,
        error: `Level must be between 1 and ${this.levelConfig.maxLevel}`,
      };
    }

    const character = this.characters.get(params.characterId);
    if (!character) {
      return {
        success: false,
        error: `Character not found: ${params.characterId}`,
      };
    }

    const previousLevel = character.level;
    character.level = params.level;

    // 重置经验值到当前等级的最低值
    character.experience = this.getExperienceForLevel(params.level);

    // 重新计算属性
    if (params.recalculateAttributes !== false) {
      const baseResult = this.handleCalculateBaseAttributes({
        level: params.level,
        race: character.race,
        class: character.class,
      });

      if (baseResult.success && baseResult.data) {
        const baseData = baseResult.data as { attributes: Record<BaseAttributeName, number> };
        character.baseAttributes = {
          ...character.baseAttributes,
          ...baseData.attributes,
        };

        // 重新计算派生属性
        const derivedResult = this.handleCalculateDerivedAttributes({
          baseAttributes: character.baseAttributes,
          level: params.level,
          buffs: character.statusEffects,
        });

        if (derivedResult.success && derivedResult.data) {
          const derivedData = derivedResult.data as { derivedAttributes: Record<DerivedAttributeName, number> };
          character.derivedAttributes = {
            ...character.derivedAttributes,
            ...derivedData.derivedAttributes,
            currentHp: derivedData.derivedAttributes.maxHp,
            currentMp: derivedData.derivedAttributes.maxMp,
          };
        }
      }
    }

    this.addMemory(
      `Set level for ${params.characterId}: ${previousLevel} -> ${params.level}`,
      'assistant',
      7,
      { characterId: params.characterId, previousLevel, newLevel: params.level }
    );

    return {
      success: true,
      data: {
        characterId: params.characterId,
        previousLevel,
        newLevel: params.level,
        character,
      },
    };
  }

  // ==================== 成长曲线 ====================

  /**
   * 设置成长曲线
   */
  private handleSetGrowthCurve(data: Record<string, unknown>): AgentResponse {
    const params = data as {
      attribute: BaseAttributeName;
      config: AttributeGrowthConfig;
    };

    if (!params.attribute || !params.config) {
      return {
        success: false,
        error: 'Missing required fields: attribute, config',
      };
    }

    const previousConfig = this.attributeGrowthConfigs.get(params.attribute);
    this.attributeGrowthConfigs.set(params.attribute, params.config);

    this.addMemory(
      `Updated growth curve for ${params.attribute}`,
      'assistant',
      5,
      { attribute: params.attribute, previousConfig, newConfig: params.config }
    );

    return {
      success: true,
      data: {
        attribute: params.attribute,
        previousConfig,
        newConfig: params.config,
      },
    };
  }

  /**
   * 计算成长值
   */
  private handleCalculateGrowth(data: Record<string, unknown>): AgentResponse {
    const params = data as {
      level: number;
      config: AttributeGrowthConfig;
    };

    if (params.level === undefined || !params.config) {
      return {
        success: false,
        error: 'Missing required fields: level, config',
      };
    }

    const value = this.calculateGrowthValue(params.level, params.config);

    return {
      success: true,
      data: {
        level: params.level,
        value,
        config: params.config,
      },
    };
  }

  // ==================== 状态效果 ====================

  /**
   * 应用状态效果
   */
  private handleApplyStatusEffect(data: Record<string, unknown>): AgentResponse {
    const params = data as {
      characterId: string;
      effect: StatusEffect;
    };

    if (!params.characterId || !params.effect) {
      return {
        success: false,
        error: 'Missing required fields: characterId, effect',
      };
    }

    const character = this.characters.get(params.characterId);
    if (!character) {
      return {
        success: false,
        error: `Character not found: ${params.characterId}`,
      };
    }

    // 检查是否已存在相同效果
    const existingIndex = character.statusEffects.findIndex(e => e.id === params.effect.id);
    if (existingIndex !== -1) {
      // 刷新持续时间
      character.statusEffects[existingIndex] = params.effect;
    } else {
      character.statusEffects.push(params.effect);
    }

    // 重新计算派生属性
    const derivedResult = this.handleCalculateDerivedAttributes({
      baseAttributes: character.baseAttributes,
      level: character.level,
      buffs: character.statusEffects,
    });

    if (derivedResult.success && derivedResult.data) {
      const derivedData = derivedResult.data as { derivedAttributes: Record<DerivedAttributeName, number> };
      // 保持当前HP/MP，更新其他属性
      const currentHp = character.derivedAttributes.currentHp;
      const currentMp = character.derivedAttributes.currentMp;

      character.derivedAttributes = {
        ...derivedData.derivedAttributes,
        currentHp: Math.min(currentHp, derivedData.derivedAttributes.maxHp),
        currentMp: Math.min(currentMp, derivedData.derivedAttributes.maxMp),
      };
    }

    this.addMemory(
      `Applied status effect ${params.effect.name} to ${params.characterId}`,
      'assistant',
      6,
      { characterId: params.characterId, effect: params.effect }
    );

    const uiInstructions: UIInstruction[] = [
      {
        type: 'update',
        target: 'status_effects',
        action: 'effect_applied',
        data: {
          characterId: params.characterId,
          effect: params.effect,
        },
        options: { priority: 'normal' },
      },
    ];

    return {
      success: true,
      data: {
        characterId: params.characterId,
        effect: params.effect,
        statusEffects: character.statusEffects,
      },
      uiInstructions,
    };
  }

  /**
   * 移除状态效果
   */
  private handleRemoveStatusEffect(data: Record<string, unknown>): AgentResponse {
    const params = data as {
      characterId: string;
      effectId: string;
    };

    if (!params.characterId || !params.effectId) {
      return {
        success: false,
        error: 'Missing required fields: characterId, effectId',
      };
    }

    const character = this.characters.get(params.characterId);
    if (!character) {
      return {
        success: false,
        error: `Character not found: ${params.characterId}`,
      };
    }

    const index = character.statusEffects.findIndex(e => e.id === params.effectId);
    if (index === -1) {
      return {
        success: false,
        error: `Status effect not found: ${params.effectId}`,
      };
    }

    const removedEffect = character.statusEffects.splice(index, 1)[0];

    // 重新计算派生属性
    const derivedResult = this.handleCalculateDerivedAttributes({
      baseAttributes: character.baseAttributes,
      level: character.level,
      buffs: character.statusEffects,
    });

    if (derivedResult.success && derivedResult.data) {
      const derivedData = derivedResult.data as { derivedAttributes: Record<DerivedAttributeName, number> };
      const currentHp = character.derivedAttributes.currentHp;
      const currentMp = character.derivedAttributes.currentMp;

      character.derivedAttributes = {
        ...derivedData.derivedAttributes,
        currentHp: Math.min(currentHp, derivedData.derivedAttributes.maxHp),
        currentMp: Math.min(currentMp, derivedData.derivedAttributes.maxMp),
      };
    }

    this.addMemory(
      `Removed status effect ${removedEffect.name} from ${params.characterId}`,
      'assistant',
      5,
      { characterId: params.characterId, effectId: params.effectId }
    );

    const uiInstructions: UIInstruction[] = [
      {
        type: 'update',
        target: 'status_effects',
        action: 'effect_removed',
        data: {
          characterId: params.characterId,
          effectId: params.effectId,
        },
        options: { priority: 'normal' },
      },
    ];

    return {
      success: true,
      data: {
        characterId: params.characterId,
        removedEffect,
        statusEffects: character.statusEffects,
      },
      uiInstructions,
    };
  }

  /**
   * 计算状态效果修正
   */
  private handleCalculateStatusEffectModifiers(data: Record<string, unknown>): AgentResponse {
    const params = data as {
      effects: StatusEffect[];
      baseAttributes: Record<string, number>;
    };

    if (!params.effects || !params.baseAttributes) {
      return {
        success: false,
        error: 'Missing required fields: effects, baseAttributes',
      };
    }

    const modifiers: Record<string, number> = {};

    for (const effect of params.effects) {
      for (const modifier of effect.effects) {
        if (!modifiers[modifier.attribute]) {
          modifiers[modifier.attribute] = 0;
        }

        if (modifier.type === 'flat') {
          modifiers[modifier.attribute] += modifier.modifier;
        } else if (modifier.type === 'percent') {
          const baseValue = params.baseAttributes[modifier.attribute] || 0;
          modifiers[modifier.attribute] += baseValue * (modifier.modifier / 100);
        }
      }
    }

    return {
      success: true,
      data: { modifiers },
    };
  }

  // ==================== 快照和统计 ====================

  /**
   * 创建快照
   */
  private handleCreateSnapshot(data: Record<string, unknown>): AgentResponse {
    const params = data as { characterId: string };

    if (!params.characterId) {
      return {
        success: false,
        error: 'Missing required field: characterId',
      };
    }

    const character = this.characters.get(params.characterId);
    if (!character) {
      return {
        success: false,
        error: `Character not found: ${params.characterId}`,
      };
    }

    const snapshot: CharacterSnapshot = {
      timestamp: Date.now(),
      level: character.level,
      experience: character.experience,
      baseAttributes: { ...character.baseAttributes },
      derivedAttributes: {
        maxHp: character.derivedAttributes.maxHp,
        maxMp: character.derivedAttributes.maxMp,
        attack: character.derivedAttributes.attack,
        defense: character.derivedAttributes.defense,
        speed: character.derivedAttributes.speed,
        luck: character.derivedAttributes.luck,
        critRate: 0,
        critDamage: 150,
        dodgeRate: 0,
        blockRate: 0,
      },
      statusEffects: [...character.statusEffects],
    };

    if (!this.snapshots.has(params.characterId)) {
      this.snapshots.set(params.characterId, []);
    }

    this.snapshots.get(params.characterId)!.push(snapshot);

    this.addMemory(
      `Created snapshot for ${params.characterId}`,
      'assistant',
      4,
      { characterId: params.characterId, timestamp: snapshot.timestamp }
    );

    return {
      success: true,
      data: { snapshot },
    };
  }

  /**
   * 获取快照
   */
  private handleGetSnapshot(data: Record<string, unknown>): AgentResponse {
    const params = data as {
      characterId: string;
      timestamp?: number;
      index?: number;
    };

    if (!params.characterId) {
      return {
        success: false,
        error: 'Missing required field: characterId',
      };
    }

    const snapshots = this.snapshots.get(params.characterId);
    if (!snapshots || snapshots.length === 0) {
      return {
        success: false,
        error: `No snapshots found for character: ${params.characterId}`,
      };
    }

    let snapshot: CharacterSnapshot;

    if (params.timestamp !== undefined) {
      const targetTimestamp = params.timestamp;
      snapshot = snapshots.reduce((closest, current) =>
        Math.abs(current.timestamp - targetTimestamp) < Math.abs(closest.timestamp - targetTimestamp)
          ? current
          : closest
      );
    } else if (params.index !== undefined) {
      snapshot = snapshots[params.index] || snapshots[snapshots.length - 1];
    } else {
      snapshot = snapshots[snapshots.length - 1];
    }

    return {
      success: true,
      data: { snapshot, totalSnapshots: snapshots.length },
    };
  }

  /**
   * 获取战斗统计
   */
  private handleGetCombatStatistics(data: Record<string, unknown>): AgentResponse {
    const params = data as { characterId: string };

    if (!params.characterId) {
      return {
        success: false,
        error: 'Missing required field: characterId',
      };
    }

    const stats = this.combatStats.get(params.characterId) || this.createEmptyCombatStats();

    // 计算平均伤害
    const totalHits = stats.criticalHits + (stats.totalDamageDealt > 0 ? 1 : 0);
    stats.averageDamagePerHit = totalHits > 0 ? stats.totalDamageDealt / totalHits : 0;

    return {
      success: true,
      data: { stats },
    };
  }

  // ==================== 角色管理 ====================

  /**
   * 注册角色
   */
  private handleRegisterCharacter(data: Record<string, unknown>): AgentResponse {
    const character = data as unknown as Character;

    if (!character.id) {
      return {
        success: false,
        error: 'Missing required field: id',
      };
    }

    // 初始化默认值
    if (!character.baseAttributes) {
      character.baseAttributes = {
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10,
      };
    }

    if (!character.derivedAttributes) {
      character.derivedAttributes = {
        maxHp: 100,
        currentHp: 100,
        maxMp: 50,
        currentMp: 50,
        attack: 10,
        defense: 5,
        speed: 100,
        luck: 0,
      };
    }

    if (!character.statusEffects) {
      character.statusEffects = [];
    }

    if (character.level === undefined) {
      character.level = 1;
    }

    if (character.experience === undefined) {
      character.experience = 0;
    }

    // 计算派生属性
    const derivedResult = this.handleCalculateDerivedAttributes({
      baseAttributes: character.baseAttributes,
      level: character.level,
      buffs: character.statusEffects,
    });

    if (derivedResult.success && derivedResult.data) {
      const derivedData = derivedResult.data as { derivedAttributes: Record<DerivedAttributeName, number> };
      character.derivedAttributes = {
        ...derivedData.derivedAttributes,
        currentHp: derivedData.derivedAttributes.maxHp,
        currentMp: derivedData.derivedAttributes.maxMp,
      };
    }

    this.characters.set(character.id, character);
    this.combatStats.set(character.id, this.createEmptyCombatStats());

    this.addMemory(
      `Registered character: ${character.name} (${character.id})`,
      'assistant',
      6,
      { characterId: character.id, name: character.name, level: character.level }
    );

    return {
      success: true,
      data: { character },
    };
  }

  /**
   * 获取角色统计
   */
  private handleGetCharacterStats(data: Record<string, unknown>): AgentResponse {
    const params = data as { characterId: string };

    if (!params.characterId) {
      return {
        success: false,
        error: 'Missing required field: characterId',
      };
    }

    const character = this.characters.get(params.characterId);
    if (!character) {
      return {
        success: false,
        error: `Character not found: ${params.characterId}`,
      };
    }

    const expNeeded = this.getExperienceForLevel(character.level + 1);
    const expProgress = (character.experience / expNeeded) * 100;

    return {
      success: true,
      data: {
        character,
        expProgress,
        expNeeded,
        statusEffectCount: character.statusEffects.length,
      },
    };
  }

  /**
   * 重新计算所有属性
   */
  private handleRecalculateAll(data: Record<string, unknown>): AgentResponse {
    const params = data as { characterId: string };

    if (!params.characterId) {
      return {
        success: false,
        error: 'Missing required field: characterId',
      };
    }

    const character = this.characters.get(params.characterId);
    if (!character) {
      return {
        success: false,
        error: `Character not found: ${params.characterId}`,
      };
    }

    // 重新计算基础属性
    const baseResult = this.handleCalculateBaseAttributes({
      level: character.level,
      race: character.race,
      class: character.class,
    });

    if (baseResult.success && baseResult.data) {
      const baseData = baseResult.data as { attributes: Record<BaseAttributeName, number> };
      character.baseAttributes = {
        ...character.baseAttributes,
        ...baseData.attributes,
      };
    }

    // 重新计算派生属性
    const derivedResult = this.handleCalculateDerivedAttributes({
      baseAttributes: character.baseAttributes,
      level: character.level,
      buffs: character.statusEffects,
    });

    if (derivedResult.success && derivedResult.data) {
      const derivedData = derivedResult.data as { derivedAttributes: Record<DerivedAttributeName, number> };
      const currentHpRatio = character.derivedAttributes.currentHp / character.derivedAttributes.maxHp;
      const currentMpRatio = character.derivedAttributes.currentMp / character.derivedAttributes.maxMp;

      character.derivedAttributes = {
        ...derivedData.derivedAttributes,
        currentHp: Math.floor(derivedData.derivedAttributes.maxHp * currentHpRatio),
        currentMp: Math.floor(derivedData.derivedAttributes.maxMp * currentMpRatio),
      };
    }

    this.addMemory(
      `Recalculated all attributes for ${params.characterId}`,
      'assistant',
      5,
      { characterId: params.characterId }
    );

    return {
      success: true,
      data: { character },
    };
  }

  // ==================== 私有辅助方法 ====================

  /**
   * 计算成长值
   */
  private calculateGrowthValue(level: number, config: AttributeGrowthConfig): number {
    switch (config.growthType) {
      case 'linear':
        return Math.floor(config.baseValue + (level - 1) * config.growthRate);

      case 'exponential':
        return Math.floor(config.baseValue * Math.pow(config.growthRate, level - 1));

      case 'custom':
        if (config.customFormula) {
          return Math.floor(config.customFormula(level, config.baseValue, config.growthRate));
        }
        return Math.floor(config.baseValue + (level - 1) * config.growthRate);

      default:
        return config.baseValue;
    }
  }

  /**
   * 计算伤害
   */
  private calculateDamage(params: DamageCalculationParams): DamageResult {
    const result: DamageResult = {
      finalDamage: 0,
      isCritical: false,
      isDodged: false,
      isBlocked: false,
      blockedDamage: 0,
      damageType: params.damageType,
      breakdown: {
        baseDamage: params.baseDamage,
        skillMultiplier: params.skillMultiplier || 1,
        criticalMultiplier: 1,
        defenseReduction: 0,
        penetrationReduction: 0,
      },
    };

    // 检查闪避
    const dodgeRoll = Math.random() * 100;
    if (dodgeRoll < params.defender.dodgeRate) {
      result.isDodged = true;
      return result;
    }

    // 计算技能倍率后的伤害
    let damage = params.baseDamage * result.breakdown.skillMultiplier;

    // 检查暴击
    if (params.isCritical !== false) {
      const critRoll = Math.random() * 100;
      if (critRoll < params.attacker.critRate) {
        result.isCritical = true;
        result.breakdown.criticalMultiplier = params.attacker.critDamage / 100;
        damage *= result.breakdown.criticalMultiplier;
      }
    }

    // 计算防御减免（真实伤害无视防御）
    if (params.damageType !== 'true') {
      const defense = params.defender.defense;
      const penetration = params.attacker.penetration || 0;
      const effectiveDefense = Math.max(0, defense - penetration);

      // 防御减伤公式：减伤百分比 = 防御 / (防御 + 100)
      const damageReduction = effectiveDefense / (effectiveDefense + 100);
      result.breakdown.defenseReduction = damageReduction;
      result.breakdown.penetrationReduction = penetration;

      damage *= (1 - damageReduction);
    }

    // 检查格挡
    const blockRoll = Math.random() * 100;
    if (blockRoll < params.defender.blockRate) {
      result.isBlocked = true;
      const blockReduction = params.defender.blockReduction || DEFAULT_BLOCK_REDUCTION;
      result.blockedDamage = damage * blockReduction;
      damage *= (1 - blockReduction);
    }

    result.finalDamage = Math.max(1, Math.floor(damage));

    return result;
  }

  /**
   * 计算治疗
   */
  private calculateHealing(params: HealingCalculationParams): HealingResult {
    const result: HealingResult = {
      finalHealing: 0,
      overhealing: 0,
      breakdown: {
        baseHealing: params.baseHealing,
        skillMultiplier: params.skillMultiplier || 1,
        attributeBonus: 0,
        healingBonus: 0,
      },
    };

    // 计算基础治疗量
    let healing = params.baseHealing * result.breakdown.skillMultiplier;

    // 属性加成（智力和感知）
    result.breakdown.attributeBonus = (params.healer.intelligence * 0.5 + params.healer.wisdom * 0.3);
    healing += result.breakdown.attributeBonus;

    // 治疗加成
    const healingBonus = params.healer.healingBonus || 0;
    const healingReceivedBonus = params.target.healingReceivedBonus || 0;
    result.breakdown.healingBonus = healingBonus + healingReceivedBonus;
    healing *= (1 + result.breakdown.healingBonus / 100);

    // 计算过量治疗
    const missingHp = params.target.maxHp - params.target.currentHp;
    result.finalHealing = Math.min(Math.floor(healing), missingHp);
    result.overhealing = Math.max(0, Math.floor(healing) - missingHp);

    return result;
  }

  /**
   * 获取升级所需经验值
   */
  private getExperienceForLevel(level: number): number {
    if (level <= 1) return 0;
    if (level > this.levelConfig.maxLevel) return Infinity;

    // 使用预计算的经验值表
    if (this.experienceTable[level - 1] !== undefined) {
      return this.experienceTable[level - 1];
    }

    // 动态计算
    return this.calculateExperienceForLevel(level);
  }

  /**
   * 计算指定等级所需经验值
   */
  private calculateExperienceForLevel(level: number): number {
    const config = this.levelConfig;

    switch (config.experienceGrowthType) {
      case 'linear':
        return config.baseExperience * (level - 1);

      case 'exponential':
        return Math.floor(config.baseExperience * Math.pow(config.experienceGrowthRate, level - 1));

      case 'custom':
        if (config.customFormula) {
          return config.customFormula(level);
        }
        return config.baseExperience * (level - 1);

      default:
        return config.baseExperience * (level - 1);
    }
  }

  /**
   * 预计算经验值表
   */
  private calculateExperienceTable(): void {
    this.experienceTable = [];
    for (let level = 1; level <= this.levelConfig.maxLevel; level++) {
      this.experienceTable.push(this.calculateExperienceForLevel(level));
    }
  }

  /**
   * 执行升级
   */
  private performLevelUp(character: Character): LevelUpResult {
    const previousLevel = character.level;
    character.level++;

    const attributeGains: Record<BaseAttributeName, number> = {
      strength: 0,
      dexterity: 0,
      constitution: 0,
      intelligence: 0,
      wisdom: 0,
      charisma: 0,
    };

    const derivedAttributeGains: Record<string, number> = {};

    // 计算属性增长
    for (const attr of Object.keys(character.baseAttributes) as BaseAttributeName[]) {
      const config = this.attributeGrowthConfigs.get(attr) || DEFAULT_ATTRIBUTE_GROWTH[attr];
      const previousValue = this.calculateGrowthValue(previousLevel, config);
      const newValue = this.calculateGrowthValue(character.level, config);
      attributeGains[attr] = newValue - previousValue;
      character.baseAttributes[attr] = newValue;
    }

    // 重新计算派生属性
    const oldMaxHp = character.derivedAttributes.maxHp;
    const oldMaxMp = character.derivedAttributes.maxMp;

    const derivedResult = this.handleCalculateDerivedAttributes({
      baseAttributes: character.baseAttributes,
      level: character.level,
      buffs: character.statusEffects,
    });

    if (derivedResult.success && derivedResult.data) {
      const derivedData = derivedResult.data as { derivedAttributes: Record<DerivedAttributeName, number> };
      derivedAttributeGains.maxHp = derivedData.derivedAttributes.maxHp - oldMaxHp;
      derivedAttributeGains.maxMp = derivedData.derivedAttributes.maxMp - oldMaxMp;

      character.derivedAttributes = {
        ...derivedData.derivedAttributes,
        currentHp: derivedData.derivedAttributes.maxHp,
        currentMp: derivedData.derivedAttributes.maxMp,
      };
    }

    return {
      previousLevel,
      newLevel: character.level,
      attributeGains,
      derivedAttributeGains,
      unlockedSkills: [], // 技能解锁由 SkillAgent 处理
      experienceRemaining: character.experience - this.getExperienceForLevel(character.level),
    };
  }

  /**
   * 应用种族加成
   * 支持从模板配置中读取种族加成，如果未提供则使用默认配置
   */
  private applyRaceBonus(
    attributes: Record<BaseAttributeName, number>,
    race: string,
    raceConfig?: {
      bonuses?: Record<string, number>;
      penalties?: Record<string, number>;
    }
  ): void {
    // 如果提供了模板配置，优先使用
    if (raceConfig) {
      // 应用加成
      if (raceConfig.bonuses) {
        for (const [attr, value] of Object.entries(raceConfig.bonuses)) {
          const attrName = attr as BaseAttributeName;
          if (attrName in attributes) {
            attributes[attrName] = Math.max(1, attributes[attrName] + value);
          }
        }
      }
      // 应用惩罚
      if (raceConfig.penalties) {
        for (const [attr, value] of Object.entries(raceConfig.penalties)) {
          const attrName = attr as BaseAttributeName;
          if (attrName in attributes) {
            attributes[attrName] = Math.max(1, attributes[attrName] + value);
          }
        }
      }
      return;
    }

    // 默认种族加成配置（兼容旧数据）
    const raceBonuses: Record<string, { bonuses: Partial<Record<BaseAttributeName, number>>; penalties: Partial<Record<BaseAttributeName, number>> }> = {
      human: { bonuses: { strength: 1, intelligence: 1, charisma: 1 }, penalties: {} },
      elf: { bonuses: { dexterity: 2, intelligence: 2 }, penalties: { constitution: -1 } },
      dwarf: { bonuses: { constitution: 2, strength: 2 }, penalties: { charisma: -1 } },
      orc: { bonuses: { strength: 3, constitution: 2 }, penalties: { intelligence: -2 } },
      halfling: { bonuses: { dexterity: 2, charisma: 1 }, penalties: { strength: -1 } },
    };

    const raceData = raceBonuses[race.toLowerCase()];
    if (raceData) {
      for (const [attr, value] of Object.entries(raceData.bonuses)) {
        attributes[attr as BaseAttributeName] = Math.max(1, attributes[attr as BaseAttributeName] + (value || 0));
      }
      for (const [attr, value] of Object.entries(raceData.penalties)) {
        attributes[attr as BaseAttributeName] = Math.max(1, attributes[attr as BaseAttributeName] + (value || 0));
      }
    }
  }

  /**
   * 应用职业加成
   * 支持从模板配置中读取职业加成，如果未提供则使用默认配置
   */
  private applyClassBonus(
    attributes: Record<BaseAttributeName, number>,
    characterClass: string,
    classConfig?: {
      primaryAttributes?: string[];
      attributeBonuses?: Record<string, number>;
    }
  ): void {
    // 如果提供了模板配置，优先使用
    if (classConfig) {
      if (classConfig.attributeBonuses) {
        for (const [attr, value] of Object.entries(classConfig.attributeBonuses)) {
          const attrName = attr as BaseAttributeName;
          if (attrName in attributes) {
            attributes[attrName] += value;
          }
        }
      } else if (classConfig.primaryAttributes) {
        // 如果只有主属性配置，给每个主属性 +2
        for (const attr of classConfig.primaryAttributes) {
          const attrName = attr as BaseAttributeName;
          if (attrName in attributes) {
            attributes[attrName] += 2;
          }
        }
      }
      return;
    }

    // 默认职业加成配置（兼容旧数据）
    const classBonuses: Record<string, Partial<Record<BaseAttributeName, number>>> = {
      warrior: { strength: 2, constitution: 1 },
      mage: { intelligence: 2, wisdom: 1 },
      rogue: { dexterity: 2, charisma: 1 },
      cleric: { wisdom: 2, constitution: 1 },
      ranger: { dexterity: 1, wisdom: 1, strength: 1 },
      paladin: { strength: 1, constitution: 1, charisma: 1 },
      bard: { charisma: 2, dexterity: 1 },
    };

    const bonus = classBonuses[characterClass.toLowerCase()];
    if (bonus) {
      for (const [attr, value] of Object.entries(bonus)) {
        attributes[attr as BaseAttributeName] += value || 0;
      }
    }
  }

  /**
   * 应用装备加成
   * 正确解析装备数据结构，提取所有装备的加成属性
   */
  private applyEquipmentBonuses(
    attributes: Record<DerivedAttributeName, number>,
    equipment: Record<string, unknown>
  ): void {
    // 定义装备槽位列表
    const equipmentSlots = ['weapon', 'head', 'body', 'feet'] as const;
    
    // 处理单个装备槽位（weapon, head, body, feet）
    for (const slot of equipmentSlots) {
      const equippedItem = equipment[slot] as Record<string, unknown> | undefined;
      if (equippedItem) {
        this.extractItemBonuses(attributes, equippedItem, slot);
      }
    }
    
    // 处理饰品槽位（数组形式）
    const accessories = equipment.accessories as Array<Record<string, unknown>> | undefined;
    if (accessories && Array.isArray(accessories)) {
      for (const accessory of accessories) {
        this.extractItemBonuses(attributes, accessory, 'accessory');
      }
    }
    
    // 处理自定义槽位
    const customSlots = equipment.customSlots as Record<string, Record<string, unknown>> | undefined;
    if (customSlots) {
      for (const [slotName, equippedItem] of Object.entries(customSlots)) {
        this.extractItemBonuses(attributes, equippedItem, slotName);
      }
    }
    
    // 兼容旧格式：直接提供 bonuses 对象
    if (equipment.bonuses) {
      const bonuses = equipment.bonuses as Record<string, number>;
      for (const [attr, value] of Object.entries(bonuses)) {
        if (attr in attributes) {
          attributes[attr as DerivedAttributeName] += value;
        }
      }
    }
  }
  
  /**
   * 从单个装备项中提取加成
   */
  private extractItemBonuses(
    attributes: Record<DerivedAttributeName, number>,
    equippedItem: Record<string, unknown>,
    slotName: string
  ): void {
    // 检查装备是否有效
    if (!equippedItem || !equippedItem.itemId) {
      return;
    }
    
    // 从 item 属性中提取 stats
    const item = equippedItem.item as Record<string, unknown> | undefined;
    if (item) {
      // 处理 stats 属性（数值加成）
      const stats = item.stats as Record<string, number> | undefined;
      if (stats) {
        for (const [statName, value] of Object.entries(stats)) {
          // 映射常见的属性名到派生属性
          const mappedAttr = this.mapItemStatToAttribute(statName);
          if (mappedAttr && mappedAttr in attributes) {
            attributes[mappedAttr] += value;
          }
        }
      }
      
      // 处理 effects 属性（效果加成）
      const effects = item.effects as Array<Record<string, unknown>> | undefined;
      if (effects && Array.isArray(effects)) {
        for (const effect of effects) {
          const effectType = effect.type as string;
          const effectValue = effect.value as number;
          const mappedAttr = this.mapEffectTypeToAttribute(effectType);
          if (mappedAttr && mappedAttr in attributes) {
            attributes[mappedAttr] += effectValue;
          }
        }
      }
    }
    
    // 记录日志
    gameLog.debug('backend', `Applied equipment bonuses from slot: ${slotName}`, {
      itemId: equippedItem.itemId as string,
    });
  }
  
  /**
   * 映射物品属性名到派生属性名
   */
  private mapItemStatToAttribute(statName: string): DerivedAttributeName | null {
    const statMapping: Record<string, DerivedAttributeName> = {
      // 攻击相关
      'attack': 'attack',
      'atk': 'attack',
      'damage': 'attack',
      'physical_damage': 'attack',
      'magical_damage': 'attack',
      
      // 防御相关
      'defense': 'defense',
      'def': 'defense',
      'armor': 'defense',
      'protection': 'defense',
      
      // 生命值
      'maxHp': 'maxHp',
      'max_hp': 'maxHp',
      'hp': 'maxHp',
      'health': 'maxHp',
      
      // 魔法值
      'maxMp': 'maxMp',
      'max_mp': 'maxMp',
      'mp': 'maxMp',
      'mana': 'maxMp',
      
      // 速度
      'speed': 'speed',
      'spd': 'speed',
      
      // 幸运
      'luck': 'luck',
      
      // 暴击
      'critRate': 'critRate',
      'crit_rate': 'critRate',
      'critical_rate': 'critRate',
      'critChance': 'critRate',
      
      // 暴击伤害
      'critDamage': 'critDamage',
      'crit_damage': 'critDamage',
      'critical_damage': 'critDamage',
      
      // 闪避
      'dodgeRate': 'dodgeRate',
      'dodge_rate': 'dodgeRate',
      'evasion': 'dodgeRate',
      
      // 格挡
      'blockRate': 'blockRate',
      'block_rate': 'blockRate',
      'block_chance': 'blockRate',
    };
    
    return statMapping[statName.toLowerCase()] || null;
  }
  
  /**
   * 映射效果类型到派生属性名
   */
  private mapEffectTypeToAttribute(effectType: string): DerivedAttributeName | null {
    const effectMapping: Record<string, DerivedAttributeName> = {
      'attack_boost': 'attack',
      'defense_boost': 'defense',
      'hp_boost': 'maxHp',
      'mp_boost': 'maxMp',
      'speed_boost': 'speed',
      'luck_boost': 'luck',
      'crit_boost': 'critRate',
      'crit_damage_boost': 'critDamage',
      'dodge_boost': 'dodgeRate',
      'block_boost': 'blockRate',
    };
    
    return effectMapping[effectType.toLowerCase()] || null;
  }

  /**
   * 应用状态效果修正
   */
  private applyStatusEffectModifiers(
    attributes: Record<DerivedAttributeName, number>,
    effects: StatusEffect[]
  ): void {
    for (const effect of effects) {
      for (const modifier of effect.effects) {
        const attr = modifier.attribute as DerivedAttributeName;
        if (attr in attributes) {
          if (modifier.type === 'flat') {
            attributes[attr] += modifier.modifier;
          } else if (modifier.type === 'percent') {
            attributes[attr] *= (1 + modifier.modifier / 100);
          }
        }
      }
    }
  }

  /**
   * 获取属性值
   */
  private getAttributeValue(character: Character, attribute: string): number {
    if (attribute in character.baseAttributes) {
      return character.baseAttributes[attribute as BaseAttributeName];
    }
    if (attribute in character.derivedAttributes) {
      return character.derivedAttributes[attribute as keyof typeof character.derivedAttributes] as number;
    }
    return 0;
  }

  /**
   * 设置属性值
   */
  private setAttributeValue(character: Character, attribute: string, value: number): void {
    if (attribute in character.baseAttributes) {
      character.baseAttributes[attribute as BaseAttributeName] = value;
    } else if (attribute === 'maxHp') {
      character.derivedAttributes.maxHp = value;
    } else if (attribute === 'maxMp') {
      character.derivedAttributes.maxMp = value;
    } else if (attribute === 'currentHp') {
      character.derivedAttributes.currentHp = value;
    } else if (attribute === 'currentMp') {
      character.derivedAttributes.currentMp = value;
    } else if (attribute === 'attack') {
      character.derivedAttributes.attack = value;
    } else if (attribute === 'defense') {
      character.derivedAttributes.defense = value;
    } else if (attribute === 'speed') {
      character.derivedAttributes.speed = value;
    } else if (attribute === 'luck') {
      character.derivedAttributes.luck = value;
    }
  }

  /**
   * 获取属性最小值
   */
  private getAttributeMinValue(attribute: string): number {
    if (['currentHp', 'currentMp'].includes(attribute)) {
      return 0;
    }
    if (['maxHp', 'maxMp'].includes(attribute)) {
      return 1;
    }
    if (['critRate', 'critDamage', 'dodgeRate', 'blockRate'].includes(attribute)) {
      return 0;
    }
    return 1;
  }

  /**
   * 创建空的战斗统计
   */
  private createEmptyCombatStats(): CombatStatistics {
    return {
      totalDamageDealt: 0,
      totalDamageTaken: 0,
      totalHealingDone: 0,
      totalHealingReceived: 0,
      criticalHits: 0,
      dodgedAttacks: 0,
      blockedAttacks: 0,
      averageDamagePerHit: 0,
    };
  }

  /**
   * 更新战斗统计
   */
  private updateCombatStats(characterId: string, updates: Partial<CombatStatistics>): void {
    const stats = this.combatStats.get(characterId) || this.createEmptyCombatStats();

    if (updates.totalDamageDealt !== undefined) {
      stats.totalDamageDealt += updates.totalDamageDealt;
    }
    if (updates.totalDamageTaken !== undefined) {
      stats.totalDamageTaken += updates.totalDamageTaken;
    }
    if (updates.totalHealingDone !== undefined) {
      stats.totalHealingDone += updates.totalHealingDone;
    }
    if (updates.totalHealingReceived !== undefined) {
      stats.totalHealingReceived += updates.totalHealingReceived;
    }
    if (updates.criticalHits !== undefined) {
      stats.criticalHits += updates.criticalHits;
    }
    if (updates.dodgedAttacks !== undefined) {
      stats.dodgedAttacks += updates.dodgedAttacks;
    }
    if (updates.blockedAttacks !== undefined) {
      stats.blockedAttacks += updates.blockedAttacks;
    }

    this.combatStats.set(characterId, stats);
  }
}

export default NumericalAgent;
