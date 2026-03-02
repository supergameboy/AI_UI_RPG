/**
 * 数值服务
 * 提供属性计算、伤害计算、治疗计算、等级系统等业务逻辑
 */

import type {
  BaseAttributeName,
  DerivedAttributeName,
  DamageType,
  AttributeGrowthConfig,
  DamageCalculationParams,
  DamageResult,
  HealingCalculationParams,
  HealingResult,
  LevelExperienceConfig,
  LevelUpResult,
  AttributeModification,
  CombatStatistics,
  CharacterSnapshot,
  NumericalApiResponse,
  CalculateAttributesRequest,
  CalculateAttributesResponse,
  CalculateDerivedRequest,
  CalculateDerivedResponse,
  AddExperienceRequest,
  AddExperienceResponse,
  LevelCheckResponse,
  CharacterStatsResponse,
  StatusEffect,
  Character,
} from '@ai-rpg/shared';
import {
  DEFAULT_ATTRIBUTE_GROWTH as DEFAULT_GROWTH,
  DERIVED_ATTRIBUTE_FORMULAS as DERIVED_FORMULAS,
  DEFAULT_LEVEL_CONFIG as DEFAULT_LEVEL,
  DEFAULT_BLOCK_REDUCTION as DEFAULT_BLOCK,
} from '@ai-rpg/shared';
import { gameLog } from './GameLogService';

// ==================== 服务接口 ====================

export interface RegisterCharacterData {
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

// ==================== 数值服务类 ====================

/**
 * 数值服务
 * 负责属性计算、战斗数值、经验值和等级管理
 */
export class NumericalService {
  private static instance: NumericalService | null = null;
  private initialized: boolean = false;

  // 角色数据存储
  private characters: Map<string, Character> = new Map();

  // 属性成长配置
  private attributeGrowthConfigs: Map<BaseAttributeName, AttributeGrowthConfig> = new Map();

  // 等级配置
  private levelConfig: LevelExperienceConfig = { ...DEFAULT_LEVEL };

  // 经验值表（预计算）
  private experienceTable: number[] = [];

  // 角色快照历史
  private snapshots: Map<string, CharacterSnapshot[]> = new Map();

  // 战斗统计
  private combatStats: Map<string, CombatStatistics> = new Map();

  private constructor() {
    // 初始化属性成长配置
    for (const [attr, config] of Object.entries(DEFAULT_GROWTH)) {
      this.attributeGrowthConfigs.set(attr as BaseAttributeName, config);
    }

    // 预计算经验值表
    this.calculateExperienceTable();
  }

  /**
   * 获取单例实例
   */
  public static getInstance(): NumericalService {
    if (!NumericalService.instance) {
      NumericalService.instance = new NumericalService();
    }
    return NumericalService.instance;
  }

  /**
   * 初始化服务
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    this.initialized = true;
    console.log('[NumericalService] Initialized');
  }

  // ==================== 属性计算 ====================

  /**
   * 计算基础属性
   */
  public calculateBaseAttributes(
    request: CalculateAttributesRequest
  ): NumericalApiResponse<CalculateAttributesResponse> {
    const { level, race, class: characterClass, customGrowth } = request;

    if (level === undefined || level < 1) {
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
      const config = customGrowth?.[attr] || this.attributeGrowthConfigs.get(attr) || DEFAULT_GROWTH[attr];
      attributes[attr] = this.calculateGrowthValue(level, config);
    }

    // 应用种族和职业加成
    if (race) {
      this.applyRaceBonus(attributes, race);
    }
    if (characterClass) {
      this.applyClassBonus(attributes, characterClass);
    }

    return {
      success: true,
      data: { attributes, level },
    };
  }

  /**
   * 计算派生属性
   */
  public calculateDerivedAttributes(
    request: CalculateDerivedRequest
  ): NumericalApiResponse<CalculateDerivedResponse> {
    const { baseAttributes, level, equipment, buffs } = request;

    if (!baseAttributes || level === undefined) {
      return {
        success: false,
        error: 'Missing required fields: baseAttributes, level',
      };
    }

    gameLog.debug('backend', '计算派生属性', { level });

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
    for (const formula of DERIVED_FORMULAS) {
      let value = formula.baseValue;

      // 属性加成
      for (const scaling of formula.scalingAttributes) {
        value += baseAttributes[scaling.attribute] * scaling.multiplier;
      }

      // 等级加成
      if (formula.levelScaling) {
        value += level * formula.levelScaling;
      }

      derivedAttributes[formula.name as DerivedAttributeName] = Math.floor(value);
    }

    // 应用装备加成
    if (equipment) {
      this.applyEquipmentBonuses(derivedAttributes, equipment);
    }

    // 应用状态效果
    if (buffs && buffs.length > 0) {
      this.applyStatusEffectModifiers(derivedAttributes, buffs);
    }

    return {
      success: true,
      data: { derivedAttributes, level },
    };
  }

  /**
   * 修改属性
   */
  public modifyAttribute(modification: AttributeModification): NumericalApiResponse<{
    attribute: string;
    previousValue: number;
    newValue: number;
    change: number;
  }> {
    const { targetId, attribute, value, type } = modification;

    if (!targetId || !attribute || value === undefined) {
      return {
        success: false,
        error: 'Missing required fields: targetId, attribute, value',
      };
    }

    const character = this.characters.get(targetId);
    if (!character) {
      return {
        success: false,
        error: `Character not found: ${targetId}`,
      };
    }

    const previousValue = this.getAttributeValue(character, attribute);
    let newValue = previousValue;

    switch (type) {
      case 'add':
        newValue = previousValue + value;
        break;
      case 'subtract':
        newValue = previousValue - value;
        break;
      case 'set':
        newValue = value;
        break;
      case 'multiply':
        newValue = previousValue * value;
        break;
    }

    // 确保属性不会低于最小值
    newValue = Math.max(this.getAttributeMinValue(attribute), newValue);

    this.setAttributeValue(character, attribute, newValue);

    return {
      success: true,
      data: {
        attribute,
        previousValue,
        newValue,
        change: newValue - previousValue,
      },
    };
  }

  // ==================== 伤害和治疗计算 ====================

  /**
   * 计算伤害
   */
  public calculateDamage(params: DamageCalculationParams): DamageResult {
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

      damage *= 1 - damageReduction;
    }

    // 检查格挡
    const blockRoll = Math.random() * 100;
    if (blockRoll < params.defender.blockRate) {
      result.isBlocked = true;
      const blockReduction = params.defender.blockReduction || DEFAULT_BLOCK;
      result.blockedDamage = damage * blockReduction;
      damage *= 1 - blockReduction;
    }

    result.finalDamage = Math.max(1, Math.floor(damage));

    // 记录详细伤害计算日志
    gameLog.debug('backend', '伤害计算详情', {
      attacker: { baseAttack: params.attacker.baseAttack, level: params.attacker.level },
      defender: { defense: params.defender.defense, level: params.defender.level },
      baseDamage: params.baseDamage,
      formula: 'baseDamage * variance * critical',
      result: result.finalDamage,
      isCritical: result.isCritical,
      isDodged: result.isDodged,
      isBlocked: result.isBlocked,
      breakdown: result.breakdown,
    });

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

    return result;
  }

  /**
   * 计算治疗
   */
  public calculateHealing(params: HealingCalculationParams): HealingResult {
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
    result.breakdown.attributeBonus =
      params.healer.intelligence * 0.5 + params.healer.wisdom * 0.3;
    healing += result.breakdown.attributeBonus;

    // 治疗加成
    const healingBonus = params.healer.healingBonus || 0;
    const healingReceivedBonus = params.target.healingReceivedBonus || 0;
    result.breakdown.healingBonus = healingBonus + healingReceivedBonus;
    healing *= 1 + result.breakdown.healingBonus / 100;

    // 计算过量治疗
    const missingHp = params.target.maxHp - params.target.currentHp;
    result.finalHealing = Math.min(Math.floor(healing), missingHp);
    result.overhealing = Math.max(0, Math.floor(healing) - missingHp);

    // 更新战斗统计
    this.updateCombatStats(params.healer.level.toString(), {
      totalHealingDone: result.finalHealing,
    });

    this.updateCombatStats(params.target.level.toString(), {
      totalHealingReceived: result.finalHealing,
    });

    return result;
  }

  /**
   * 应用伤害
   */
  public applyDamage(
    targetId: string,
    damage: number,
    _damageType: DamageType,
    _source?: string
  ): NumericalApiResponse<{
    targetId: string;
    previousHp: number;
    currentHp: number;
    damageDealt: number;
    isDead: boolean;
  }> {
    const character = this.characters.get(targetId);
    if (!character) {
      return {
        success: false,
        error: `Character not found: ${targetId}`,
      };
    }

    const previousHp = character.derivedAttributes.currentHp;
    const newHp = Math.max(0, previousHp - damage);
    const actualDamage = previousHp - newHp;

    character.derivedAttributes.currentHp = newHp;

    const isDead = newHp <= 0;

    return {
      success: true,
      data: {
        targetId,
        previousHp,
        currentHp: newHp,
        damageDealt: actualDamage,
        isDead,
      },
    };
  }

  /**
   * 应用治疗
   */
  public applyHealing(
    targetId: string,
    healing: number,
    _source?: string
  ): NumericalApiResponse<{
    targetId: string;
    previousHp: number;
    currentHp: number;
    healingDone: number;
    overhealing: number;
  }> {
    const character = this.characters.get(targetId);
    if (!character) {
      return {
        success: false,
        error: `Character not found: ${targetId}`,
      };
    }

    const previousHp = character.derivedAttributes.currentHp;
    const maxHp = character.derivedAttributes.maxHp;
    const newHp = Math.min(maxHp, previousHp + healing);
    const actualHealing = newHp - previousHp;
    const overhealing = healing - actualHealing;

    character.derivedAttributes.currentHp = newHp;

    return {
      success: true,
      data: {
        targetId,
        previousHp,
        currentHp: newHp,
        healingDone: actualHealing,
        overhealing,
      },
    };
  }

  // ==================== 等级系统 ====================

  /**
   * 添加经验值
   */
  public addExperience(request: AddExperienceRequest): NumericalApiResponse<AddExperienceResponse> {
    const { characterId, amount, source: _source } = request;

    if (!characterId || amount === undefined) {
      return {
        success: false,
        error: 'Missing required fields: characterId, amount',
      };
    }

    const character = this.characters.get(characterId);
    if (!character) {
      return {
        success: false,
        error: `Character not found: ${characterId}`,
      };
    }

    const previousExp = character.experience;
    const previousLevel = character.level;

    character.experience += amount;

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

    return {
      success: true,
      data: {
        characterId,
        previousExp,
        currentExp: character.experience,
        expGained: amount,
        previousLevel,
        currentLevel: character.level,
        levelUps: levelUpResults,
      },
    };
  }

  /**
   * 检查升级
   */
  public checkLevelUp(characterId: string): NumericalApiResponse<LevelCheckResponse> {
    const character = this.characters.get(characterId);
    if (!character) {
      return {
        success: false,
        error: `Character not found: ${characterId}`,
      };
    }

    const expNeeded = this.getExperienceForLevel(character.level + 1);
    const canLevelUp =
      character.experience >= expNeeded && character.level < this.levelConfig.maxLevel;

    return {
      success: true,
      data: {
        characterId,
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
  public getExperienceForLevelApi(level: number): NumericalApiResponse<{
    level: number;
    experienceRequired: number;
  }> {
    if (level === undefined || level < 1) {
      return {
        success: false,
        error: 'Invalid level provided',
      };
    }

    const expNeeded = this.getExperienceForLevel(level);

    return {
      success: true,
      data: {
        level,
        experienceRequired: expNeeded,
      },
    };
  }

  /**
   * 设置等级
   */
  public setLevel(
    characterId: string,
    level: number,
    recalculateAttributes: boolean = true
  ): NumericalApiResponse<{
    characterId: string;
    previousLevel: number;
    newLevel: number;
    character: Character;
  }> {
    if (level < 1 || level > this.levelConfig.maxLevel) {
      return {
        success: false,
        error: `Level must be between 1 and ${this.levelConfig.maxLevel}`,
      };
    }

    const character = this.characters.get(characterId);
    if (!character) {
      return {
        success: false,
        error: `Character not found: ${characterId}`,
      };
    }

    const previousLevel = character.level;
    character.level = level;

    // 重置经验值到当前等级的最低值
    character.experience = this.getExperienceForLevel(level);

    // 重新计算属性
    if (recalculateAttributes) {
      const baseResult = this.calculateBaseAttributes({
        level,
        race: character.race,
        class: character.class,
      });

      if (baseResult.success && baseResult.data) {
        character.baseAttributes = {
          ...character.baseAttributes,
          ...baseResult.data.attributes,
        };

        // 重新计算派生属性
        const derivedResult = this.calculateDerivedAttributes({
          baseAttributes: character.baseAttributes,
          level,
          buffs: character.statusEffects,
        });

        if (derivedResult.success && derivedResult.data) {
          character.derivedAttributes = {
            ...character.derivedAttributes,
            ...derivedResult.data.derivedAttributes,
            currentHp: derivedResult.data.derivedAttributes.maxHp,
            currentMp: derivedResult.data.derivedAttributes.maxMp,
          };
        }
      }
    }

    return {
      success: true,
      data: {
        characterId,
        previousLevel,
        newLevel: level,
        character,
      },
    };
  }

  // ==================== 成长曲线 ====================

  /**
   * 设置成长曲线
   */
  public setGrowthCurve(
    attribute: BaseAttributeName,
    config: AttributeGrowthConfig
  ): NumericalApiResponse<{
    attribute: BaseAttributeName;
    previousConfig: AttributeGrowthConfig | undefined;
    newConfig: AttributeGrowthConfig;
  }> {
    const previousConfig = this.attributeGrowthConfigs.get(attribute);
    this.attributeGrowthConfigs.set(attribute, config);

    return {
      success: true,
      data: {
        attribute,
        previousConfig,
        newConfig: config,
      },
    };
  }

  /**
   * 计算成长值
   */
  public calculateGrowth(level: number, config: AttributeGrowthConfig): NumericalApiResponse<{
    level: number;
    value: number;
    config: AttributeGrowthConfig;
  }> {
    const value = this.calculateGrowthValue(level, config);

    return {
      success: true,
      data: {
        level,
        value,
        config,
      },
    };
  }

  // ==================== 状态效果 ====================

  /**
   * 应用状态效果
   */
  public applyStatusEffect(
    characterId: string,
    effect: StatusEffect
  ): NumericalApiResponse<{
    characterId: string;
    effect: StatusEffect;
    statusEffects: StatusEffect[];
  }> {
    const character = this.characters.get(characterId);
    if (!character) {
      return {
        success: false,
        error: `Character not found: ${characterId}`,
      };
    }

    // 检查是否已存在相同效果
    const existingIndex = character.statusEffects.findIndex(e => e.id === effect.id);
    if (existingIndex !== -1) {
      // 刷新持续时间
      character.statusEffects[existingIndex] = effect;
    } else {
      character.statusEffects.push(effect);
    }

    // 重新计算派生属性
    const derivedResult = this.calculateDerivedAttributes({
      baseAttributes: character.baseAttributes,
      level: character.level,
      buffs: character.statusEffects,
    });

    if (derivedResult.success && derivedResult.data) {
      const currentHp = character.derivedAttributes.currentHp;
      const currentMp = character.derivedAttributes.currentMp;

      character.derivedAttributes = {
        ...derivedResult.data.derivedAttributes,
        currentHp: Math.min(currentHp, derivedResult.data.derivedAttributes.maxHp),
        currentMp: Math.min(currentMp, derivedResult.data.derivedAttributes.maxMp),
      };
    }

    return {
      success: true,
      data: {
        characterId,
        effect,
        statusEffects: character.statusEffects,
      },
    };
  }

  /**
   * 移除状态效果
   */
  public removeStatusEffect(
    characterId: string,
    effectId: string
  ): NumericalApiResponse<{
    characterId: string;
    removedEffect: StatusEffect | undefined;
    statusEffects: StatusEffect[];
  }> {
    const character = this.characters.get(characterId);
    if (!character) {
      return {
        success: false,
        error: `Character not found: ${characterId}`,
      };
    }

    const index = character.statusEffects.findIndex(e => e.id === effectId);
    if (index === -1) {
      return {
        success: false,
        error: `Status effect not found: ${effectId}`,
      };
    }

    const removedEffect = character.statusEffects.splice(index, 1)[0];

    // 重新计算派生属性
    const derivedResult = this.calculateDerivedAttributes({
      baseAttributes: character.baseAttributes,
      level: character.level,
      buffs: character.statusEffects,
    });

    if (derivedResult.success && derivedResult.data) {
      const currentHp = character.derivedAttributes.currentHp;
      const currentMp = character.derivedAttributes.currentMp;

      character.derivedAttributes = {
        ...derivedResult.data.derivedAttributes,
        currentHp: Math.min(currentHp, derivedResult.data.derivedAttributes.maxHp),
        currentMp: Math.min(currentMp, derivedResult.data.derivedAttributes.maxMp),
      };
    }

    return {
      success: true,
      data: {
        characterId,
        removedEffect,
        statusEffects: character.statusEffects,
      },
    };
  }

  // ==================== 快照和统计 ====================

  /**
   * 创建快照
   */
  public createSnapshot(characterId: string): NumericalApiResponse<CharacterSnapshot> {
    const character = this.characters.get(characterId);
    if (!character) {
      return {
        success: false,
        error: `Character not found: ${characterId}`,
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

    if (!this.snapshots.has(characterId)) {
      this.snapshots.set(characterId, []);
    }

    this.snapshots.get(characterId)!.push(snapshot);

    return {
      success: true,
      data: snapshot,
    };
  }

  /**
   * 获取快照
   */
  public getSnapshot(
    characterId: string,
    timestamp?: number,
    index?: number
  ): NumericalApiResponse<{ snapshot: CharacterSnapshot; totalSnapshots: number }> {
    const snapshots = this.snapshots.get(characterId);
    if (!snapshots || snapshots.length === 0) {
      return {
        success: false,
        error: `No snapshots found for character: ${characterId}`,
      };
    }

    let snapshot: CharacterSnapshot;

    if (timestamp !== undefined) {
      const targetTimestamp = timestamp;
      snapshot = snapshots.reduce((closest, current) =>
        Math.abs(current.timestamp - targetTimestamp) < Math.abs(closest.timestamp - targetTimestamp)
          ? current
          : closest
      );
    } else if (index !== undefined) {
      snapshot = snapshots[index] || snapshots[snapshots.length - 1];
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
  public getCombatStatistics(characterId: string): NumericalApiResponse<CombatStatistics> {
    const stats = this.combatStats.get(characterId) || this.createEmptyCombatStats();

    // 计算平均伤害
    const totalHits = stats.criticalHits + (stats.totalDamageDealt > 0 ? 1 : 0);
    stats.averageDamagePerHit = totalHits > 0 ? stats.totalDamageDealt / totalHits : 0;

    return {
      success: true,
      data: stats,
    };
  }

  // ==================== 角色管理 ====================

  /**
   * 注册角色
   */
  public registerCharacter(data: RegisterCharacterData): NumericalApiResponse<Character> {
    if (!data.id) {
      return {
        success: false,
        error: 'Missing required field: id',
      };
    }

    const character: Character = {
      id: data.id,
      name: data.name || 'Unknown',
      race: data.race || 'human',
      class: data.class || 'warrior',
      level: data.level ?? 1,
      experience: data.experience ?? 0,
      baseAttributes: data.baseAttributes || {
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10,
      },
      derivedAttributes: {
        maxHp: data.derivedAttributes?.maxHp ?? 100,
        currentHp: data.derivedAttributes?.currentHp ?? 100,
        maxMp: data.derivedAttributes?.maxMp ?? 50,
        currentMp: data.derivedAttributes?.currentMp ?? 50,
        attack: data.derivedAttributes?.attack ?? 10,
        defense: data.derivedAttributes?.defense ?? 5,
        speed: data.derivedAttributes?.speed ?? 100,
        luck: data.derivedAttributes?.luck ?? 0,
      },
      skills: [],
      equipment: {},
      inventory: [],
      currency: {},
      statusEffects: data.statusEffects || [],
      appearance: '',
      personality: '',
      backstory: '',
      statistics: {
        battlesWon: 0,
        questsCompleted: 0,
        distanceTraveled: 0,
        itemsCrafted: 0,
        npcsMet: 0,
        playTime: 0,
      },
    };

    // 计算派生属性
    const derivedResult = this.calculateDerivedAttributes({
      baseAttributes: character.baseAttributes,
      level: character.level,
      buffs: character.statusEffects,
    });

    if (derivedResult.success && derivedResult.data) {
      character.derivedAttributes = {
        ...derivedResult.data.derivedAttributes,
        currentHp: derivedResult.data.derivedAttributes.maxHp,
        currentMp: derivedResult.data.derivedAttributes.maxMp,
      };
    }

    this.characters.set(character.id, character);
    this.combatStats.set(character.id, this.createEmptyCombatStats());

    return {
      success: true,
      data: character,
    };
  }

  /**
   * 获取角色统计
   */
  public getCharacterStats(characterId: string): NumericalApiResponse<CharacterStatsResponse> {
    const character = this.characters.get(characterId);
    if (!character) {
      return {
        success: false,
        error: `Character not found: ${characterId}`,
      };
    }

    const expNeeded = this.getExperienceForLevel(character.level + 1);
    const expProgress = (character.experience / expNeeded) * 100;

    return {
      success: true,
      data: {
        characterId,
        level: character.level,
        experience: character.experience,
        baseAttributes: character.baseAttributes,
        derivedAttributes: character.derivedAttributes,
        statusEffects: character.statusEffects,
        expProgress,
        expNeeded,
        statusEffectCount: character.statusEffects.length,
      },
    };
  }

  /**
   * 重新计算所有属性
   */
  public recalculateAll(characterId: string): NumericalApiResponse<Character> {
    const character = this.characters.get(characterId);
    if (!character) {
      return {
        success: false,
        error: `Character not found: ${characterId}`,
      };
    }

    // 重新计算基础属性
    const baseResult = this.calculateBaseAttributes({
      level: character.level,
      race: character.race,
      class: character.class,
    });

    if (baseResult.success && baseResult.data) {
      character.baseAttributes = {
        ...character.baseAttributes,
        ...baseResult.data.attributes,
      };
    }

    // 重新计算派生属性
    const derivedResult = this.calculateDerivedAttributes({
      baseAttributes: character.baseAttributes,
      level: character.level,
      buffs: character.statusEffects,
    });

    if (derivedResult.success && derivedResult.data) {
      const currentHpRatio = character.derivedAttributes.currentHp / character.derivedAttributes.maxHp;
      const currentMpRatio = character.derivedAttributes.currentMp / character.derivedAttributes.maxMp;

      character.derivedAttributes = {
        ...derivedResult.data.derivedAttributes,
        currentHp: Math.floor(derivedResult.data.derivedAttributes.maxHp * currentHpRatio),
        currentMp: Math.floor(derivedResult.data.derivedAttributes.maxMp * currentMpRatio),
      };
    }

    return {
      success: true,
      data: character,
    };
  }

  /**
   * 获取角色
   */
  public getCharacter(characterId: string): Character | undefined {
    return this.characters.get(characterId);
  }

  /**
   * 获取所有角色
   */
  public getAllCharacters(): Character[] {
    return Array.from(this.characters.values());
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
      const config = this.attributeGrowthConfigs.get(attr) || DEFAULT_GROWTH[attr];
      const previousValue = this.calculateGrowthValue(previousLevel, config);
      const newValue = this.calculateGrowthValue(character.level, config);
      attributeGains[attr] = newValue - previousValue;
      character.baseAttributes[attr] = newValue;
    }

    // 重新计算派生属性
    const oldMaxHp = character.derivedAttributes.maxHp;
    const oldMaxMp = character.derivedAttributes.maxMp;

    const derivedResult = this.calculateDerivedAttributes({
      baseAttributes: character.baseAttributes,
      level: character.level,
      buffs: character.statusEffects,
    });

    if (derivedResult.success && derivedResult.data) {
      derivedAttributeGains.maxHp = derivedResult.data.derivedAttributes.maxHp - oldMaxHp;
      derivedAttributeGains.maxMp = derivedResult.data.derivedAttributes.maxMp - oldMaxMp;

      character.derivedAttributes = {
        ...derivedResult.data.derivedAttributes,
        currentHp: derivedResult.data.derivedAttributes.maxHp,
        currentMp: derivedResult.data.derivedAttributes.maxMp,
      };
    }

    gameLog.info('backend', '角色升级', {
      characterId: character.id,
      newLevel: character.level,
      attributeGains,
    });

    return {
      previousLevel,
      newLevel: character.level,
      attributeGains,
      derivedAttributeGains,
      unlockedSkills: [],
      experienceRemaining: character.experience - this.getExperienceForLevel(character.level),
    };
  }

  /**
   * 应用种族加成
   */
  private applyRaceBonus(attributes: Record<BaseAttributeName, number>, race: string): void {
    const raceBonuses: Record<string, Partial<Record<BaseAttributeName, number>>> = {
      human: { strength: 1, intelligence: 1, charisma: 1 },
      elf: { dexterity: 2, intelligence: 2, constitution: -1 },
      dwarf: { constitution: 2, strength: 1, charisma: -1 },
      orc: { strength: 3, constitution: 2, intelligence: -2 },
      halfling: { dexterity: 2, charisma: 1, strength: -1 },
    };

    const bonus = raceBonuses[race.toLowerCase()];
    if (bonus) {
      for (const [attr, value] of Object.entries(bonus)) {
        attributes[attr as BaseAttributeName] = Math.max(
          1,
          attributes[attr as BaseAttributeName] + (value || 0)
        );
      }
    }
  }

  /**
   * 应用职业加成
   */
  private applyClassBonus(attributes: Record<BaseAttributeName, number>, characterClass: string): void {
    const classBonuses: Record<string, Partial<Record<BaseAttributeName, number>>> = {
      warrior: { strength: 2, constitution: 1 },
      mage: { intelligence: 2, wisdom: 1 },
      rogue: { dexterity: 2, charisma: 1 },
      cleric: { wisdom: 2, constitution: 1 },
      ranger: { dexterity: 1, wisdom: 1, strength: 1 },
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
   */
  private applyEquipmentBonuses(
    attributes: Record<DerivedAttributeName, number>,
    equipment: Record<string, unknown>
  ): void {
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
            attributes[attr] *= 1 + modifier.modifier / 100;
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

// ==================== 单例导出 ====================

let numericalServiceInstance: NumericalService | null = null;

export function getNumericalService(): NumericalService {
  if (!numericalServiceInstance) {
    numericalServiceInstance = NumericalService.getInstance();
  }
  return numericalServiceInstance;
}

export async function initializeNumericalService(): Promise<NumericalService> {
  const service = getNumericalService();
  await service.initialize();
  return service;
}
