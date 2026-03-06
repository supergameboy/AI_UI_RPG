import type {
  AgentType,
  AgentMessage,
  AgentResponse,
  Skill,
  SkillEffect,
  SkillRequirement,
  UIInstruction,
  AgentBinding,
  ToolType,
  GameTemplate,
  AgentInitializationResult,
  Character,
} from '@ai-rpg/shared';
import { AgentType as AT, ToolType as ToolTypeEnum } from '@ai-rpg/shared';
import { AgentBase } from './AgentBase';

// ==================== 扩展类型定义 ====================

/**
 * 技能类型扩展（增加 toggle）
 */
type SkillType = 'active' | 'passive' | 'toggle';

/**
 * 技能分类
 */
type SkillCategory = 'combat' | 'magic' | 'craft' | 'social' | 'exploration' | 'custom';

/**
 * 消耗类型
 */
type CostType = 'mana' | 'health' | 'stamina' | 'custom';

/**
 * 技能消耗
 */
interface SkillCost {
  type: CostType;
  value: number;
  customResource?: string;
}

/**
 * 技能目标类型
 */
type TargetType = 'self' | 'single_enemy' | 'all_enemies' | 'single_ally' | 'all_allies' | 'area' | 'custom';

/**
 * 技能范围
 */
interface SkillRange {
  type: 'melee' | 'ranged' | 'area';
  minDistance?: number;
  maxDistance?: number;
  areaRadius?: number;
}

/**
 * 扩展技能接口
 */
interface ExtendedSkill extends Omit<Skill, 'type' | 'cost'> {
  type: SkillType;
  category: SkillCategory;
  costs: SkillCost[];
  targetType: TargetType;
  range?: SkillRange;
  castTime?: number;
  channelTime?: number;
  isToggleOn?: boolean;
  tags?: string[];
}

/**
 * 技能冷却状态
 */
interface SkillCooldownState {
  skillId: string;
  remainingTurns: number;
  totalCooldown: number;
  lastUsedAt: number;
}

/**
 * 技能学习参数
 */
interface SkillLearnParams {
  skillId: string;
  characterId: string;
  source: 'trainer' | 'book' | 'quest' | 'event' | 'level_up';
}

/**
 * 技能升级参数
 */
interface SkillUpgradeParams {
  skillId: string;
  characterId: string;
}

/**
 * 技能解锁参数
 */
interface SkillUnlockParams {
  skillId: string;
  characterId: string;
  unlockMethod: 'requirement_met' | 'item_used' | 'special_event';
}

/**
 * 技能使用参数
 */
interface SkillUseParams {
  skillId: string;
  characterId: string;
  targetId?: string;
  targetPosition?: { x: number; y: number };
  context?: {
    combatId?: string;
    location?: string;
    additionalData?: Record<string, unknown>;
  };
}

/**
 * 技能效果计算结果
 */
interface SkillEffectResult {
  skillId: string;
  characterId: string;
  targetId?: string;
  effects: {
    type: string;
    value: number;
    actualValue: number;
    isCritical?: boolean;
    isBlocked?: boolean;
    isResisted?: boolean;
  }[];
  totalCost: SkillCost[];
  cooldownApplied: number;
  success: boolean;
  message?: string;
}

/**
 * 技能消耗计算结果
 */
interface SkillCostResult {
  canAfford: boolean;
  costs: {
    type: CostType;
    required: number;
    available: number;
    sufficient: boolean;
  }[];
  totalInsufficient: number;
}

/**
 * 技能模板（用于生成新技能）
 */
interface SkillTemplate {
  id: string;
  name: string;
  description: string;
  category: SkillCategory;
  type: SkillType;
  baseCosts: SkillCost[];
  baseCooldown: number;
  baseEffects: SkillEffect[];
  requirements: SkillRequirement[];
  maxLevel: number;
  scalingPerLevel: {
    costMultiplier: number;
    effectMultiplier: number;
    cooldownReduction: number;
  };
}

/**
 * 技能树节点
 */
interface SkillTreeNode {
  skillId: string;
  prerequisites: string[];
  position: { x: number; y: number };
  unlocked: boolean;
  learned: boolean;
}

/**
 * 技能树
 */
interface SkillTree {
  id: string;
  name: string;
  description: string;
  category: SkillCategory;
  nodes: SkillTreeNode[];
}

/**
 * 技能统计
 */
interface SkillStatistics {
  totalSkills: number;
  byCategory: Record<SkillCategory, number>;
  byType: Record<SkillType, number>;
  learnedSkills: number;
  maxLevelSkills: number;
  totalCooldowns: number;
}

// ==================== SkillAgent 实现 ====================

/**
 * 技能管理智能体
 * 负责技能管理、学习和升级、效果计算、冷却管理
 */
export class SkillAgent extends AgentBase {
  readonly type: AgentType = AT.SKILL;

  // 依赖的 Tool 类型
  readonly tools: ToolType[] = [
    ToolTypeEnum.SKILL_DATA,
    ToolTypeEnum.NUMERICAL,
    ToolTypeEnum.COMBAT_DATA,
  ];

  // 可调用的 Agent 绑定配置
  readonly bindings: AgentBinding[] = [
    { agentType: AT.COORDINATOR, enabled: true },
    { agentType: AT.NUMERICAL, enabled: true },
    { agentType: AT.COMBAT, enabled: true },
  ];

  readonly systemPrompt = `你是技能管理智能体，负责管理游戏中的所有技能系统。

核心职责：
1. 技能管理：管理技能的定义、分类、属性
2. 学习和升级：处理技能的学习、升级、解锁
3. 效果计算：计算技能使用时的效果数值
4. 冷却管理：管理技能的冷却时间和状态
5. 消耗计算：计算技能使用的资源消耗

技能类型：
- active: 主动技能，需要玩家主动使用
- passive: 被动技能，自动生效
- toggle: 切换技能，可以开启/关闭

技能分类：
- combat: 战斗技能，用于战斗场景
- magic: 魔法技能，消耗魔力施放
- craft: 制作技能，用于物品制作
- social: 社交技能，影响NPC互动
- exploration: 探索技能，用于地图探索
- custom: 自定义技能，特殊用途

消耗类型：
- mana: 魔力消耗
- health: 生命值消耗
- stamina: 体力消耗
- custom: 自定义资源消耗

工作原则：
- 确保技能平衡性
- 合理设置技能冷却
- 准确计算技能效果
- 维护技能树结构`;

  // 技能存储
  private skills: Map<string, ExtendedSkill> = new Map();

  // 技能模板存储
  private skillTemplates: Map<string, SkillTemplate> = new Map();

  // 技能树存储
  private skillTrees: Map<string, SkillTree> = new Map();

  // 角色已学习技能
  private characterSkills: Map<string, Set<string>> = new Map();

  // 技能冷却状态
  private cooldownStates: Map<string, Map<string, SkillCooldownState>> = new Map();

  // Toggle 技能状态
  private toggleStates: Map<string, Set<string>> = new Map();

  // ID 计数器
  private skillIdCounter: number = 0;
  private templateIdCounter: number = 0;

  constructor() {
    super({
      temperature: 0.5,
      maxTokens: 4096,
    });
  }

  protected getAgentName(): string {
    return 'Skill Agent';
  }

  protected getAgentDescription(): string {
    return '技能管理智能体，负责技能管理、学习和升级、效果计算、冷却管理';
  }

  protected getAgentCapabilities(): string[] {
    return [
      'skill_management',
      'effect_calculation',
      'cooldown_management',
      'skill_upgrade',
      'skill_learning',
      'skill_tree_navigation',
      'cost_calculation',
    ];
  }

  /**
   * 初始化角色技能
   * 从模板的 initialData.skills[classId] 获取初始技能列表
   */
  async initialize(params: {
    character: Character;
    template: GameTemplate;
  }): Promise<AgentInitializationResult> {
    const { character, template } = params;
    
    try {
      const classId = character.class || 'warrior';
      const initialSkillIds = template.initialData?.skills?.[classId] || [];
      
      const learnedSkills: string[] = [];
      const failedSkills: string[] = [];
      
      for (const skillId of initialSkillIds) {
        const learnResult = this.handleLearnSkill({
          skillId,
          characterId: character.id,
          source: 'level_up',
        });
        
        if (learnResult.success) {
          learnedSkills.push(skillId);
        } else {
          failedSkills.push(skillId);
        }
      }
      
      this.addMemory(
        `初始化角色技能: ${character.name}, 职业: ${classId}, 学习技能: ${learnedSkills.length}/${initialSkillIds.length}`,
        'assistant',
        7,
        { characterId: character.id, learnedSkills, failedSkills }
      );
      
      return {
        success: true,
        data: {
          learnedSkills,
          failedSkills,
          classId,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '技能初始化失败',
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
        // 技能管理
        case 'create_skill':
          return this.handleCreateSkill(data);
        case 'create_skill_from_template':
          return this.handleCreateSkillFromTemplate(data);
        case 'get_skill':
          return this.handleGetSkill(data);
        case 'get_skills_by_category':
          return this.handleGetSkillsByCategory(data);
        case 'get_skills_by_type':
          return this.handleGetSkillsByType(data);

        // 学习和升级
        case 'learn_skill':
          return this.handleLearnSkill(data);
        case 'upgrade_skill':
          return this.handleUpgradeSkill(data);
        case 'unlock_skill':
          return this.handleUnlockSkill(data);
        case 'unlearn_skill':
          return this.handleUnlearnSkill(data);

        // 技能使用
        case 'use_skill':
          return this.handleUseSkill(data);
        case 'toggle_skill':
          return this.handleToggleSkill(data);
        case 'calculate_effect':
          return this.handleCalculateEffect(data);
        case 'calculate_cost':
          return this.handleCalculateCost(data);

        // 冷却管理
        case 'check_cooldown':
          return this.handleCheckCooldown(data);
        case 'reduce_cooldown':
          return this.handleReduceCooldown(data);
        case 'reset_cooldown':
          return this.handleResetCooldown(data);
        case 'get_all_cooldowns':
          return this.handleGetAllCooldowns(data);

        // 技能树
        case 'get_skill_tree':
          return this.handleGetSkillTree(data);
        case 'get_available_skills':
          return this.handleGetAvailableSkills(data);

        // 模板管理
        case 'create_template':
          return this.handleCreateTemplate(data);
        case 'get_template':
          return this.handleGetTemplate(data);

        // 统计
        case 'get_statistics':
          return this.handleGetStatistics();

        default:
          return {
            success: false,
            error: `Unknown action: ${action}`,
          };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error in SkillAgent',
      };
    }
  }

  // ==================== 技能管理 ====================

  /**
   * 创建技能
   */
  private handleCreateSkill(data: Record<string, unknown>): AgentResponse {
    const skillData = data as {
      name: string;
      description: string;
      type: SkillType;
      category: SkillCategory;
      costs: SkillCost[];
      cooldown: number;
      effects: SkillEffect[];
      requirements?: SkillRequirement[];
      targetType?: TargetType;
      range?: SkillRange;
      maxLevel?: number;
    };

    if (!skillData.name || !skillData.type || !skillData.category) {
      return {
        success: false,
        error: 'Missing required fields: name, type, category',
      };
    }

    const skill = this.createSkill(skillData);
    this.skills.set(skill.id, skill);

    this.addMemory(
      `Created ${skill.category} skill: ${skill.name} (${skill.type})`,
      'assistant',
      6,
      { skillId: skill.id, category: skill.category }
    );

    return {
      success: true,
      data: { skill },
    };
  }

  /**
   * 从模板创建技能
   */
  private handleCreateSkillFromTemplate(data: Record<string, unknown>): AgentResponse {
    const templateData = data as {
      templateId: string;
      characterId: string;
      level?: number;
    };

    if (!templateData.templateId || !templateData.characterId) {
      return {
        success: false,
        error: 'Missing required fields: templateId, characterId',
      };
    }

    const template = this.skillTemplates.get(templateData.templateId);
    if (!template) {
      return {
        success: false,
        error: `Template not found: ${templateData.templateId}`,
      };
    }

    const level = templateData.level || 1;
    const skill = this.createSkillFromTemplate(template, level);
    this.skills.set(skill.id, skill);

    // 自动学习
    this.learnSkillForCharacter(templateData.characterId, skill.id);

    this.addMemory(
      `Created skill from template: ${skill.name} for character ${templateData.characterId}`,
      'assistant',
      5,
      { skillId: skill.id, templateId: templateData.templateId }
    );

    return {
      success: true,
      data: { skill },
    };
  }

  /**
   * 获取技能
   */
  private handleGetSkill(data: Record<string, unknown>): AgentResponse {
    const queryData = data as { skillId: string };

    if (!queryData.skillId) {
      return {
        success: false,
        error: 'Missing required field: skillId',
      };
    }

    const skill = this.skills.get(queryData.skillId);
    if (!skill) {
      return {
        success: false,
        error: `Skill not found: ${queryData.skillId}`,
      };
    }

    return {
      success: true,
      data: { skill },
    };
  }

  /**
   * 按分类获取技能
   */
  private handleGetSkillsByCategory(data: Record<string, unknown>): AgentResponse {
    const queryData = data as { category: SkillCategory };

    if (!queryData.category) {
      return {
        success: false,
        error: 'Missing required field: category',
      };
    }

    const skills = Array.from(this.skills.values())
      .filter(s => s.category === queryData.category);

    return {
      success: true,
      data: { skills, count: skills.length },
    };
  }

  /**
   * 按类型获取技能
   */
  private handleGetSkillsByType(data: Record<string, unknown>): AgentResponse {
    const queryData = data as { type: SkillType };

    if (!queryData.type) {
      return {
        success: false,
        error: 'Missing required field: type',
      };
    }

    const skills = Array.from(this.skills.values())
      .filter(s => s.type === queryData.type);

    return {
      success: true,
      data: { skills, count: skills.length },
    };
  }

  // ==================== 学习和升级 ====================

  /**
   * 学习技能
   */
  private handleLearnSkill(data: Record<string, unknown>): AgentResponse {
    const learnData = data as unknown as SkillLearnParams;

    if (!learnData.skillId || !learnData.characterId) {
      return {
        success: false,
        error: 'Missing required fields: skillId, characterId',
      };
    }

    const skill = this.skills.get(learnData.skillId);
    if (!skill) {
      return {
        success: false,
        error: `Skill not found: ${learnData.skillId}`,
      };
    }

    // 检查是否已学习
    const characterSkillSet = this.characterSkills.get(learnData.characterId);
    if (characterSkillSet?.has(learnData.skillId)) {
      return {
        success: false,
        error: 'Skill already learned',
      };
    }

    // 检查前置条件（这里简化处理，实际应该检查角色属性等）
    if (skill.requirements && skill.requirements.length > 0) {
      // TODO: 调用 NUMERICAL agent 检查属性要求
    }

    // 学习技能
    this.learnSkillForCharacter(learnData.characterId, learnData.skillId);

    this.addMemory(
      `Character ${learnData.characterId} learned skill: ${skill.name} via ${learnData.source}`,
      'assistant',
      7,
      { skillId: skill.id, characterId: learnData.characterId, source: learnData.source }
    );

    const uiInstructions: UIInstruction[] = [
      {
        type: 'show',
        target: 'skill_panel',
        action: 'add_skill',
        data: { skill, characterId: learnData.characterId },
        options: { priority: 'high' },
      },
      {
        type: 'notify',
        target: 'notification',
        action: 'skill_learned',
        data: { message: `学会了新技能: ${skill.name}` },
        options: { duration: 3000, priority: 'high' },
      },
    ];

    return {
      success: true,
      data: { skill, characterId: learnData.characterId },
      uiInstructions,
    };
  }

  /**
   * 升级技能
   */
  private handleUpgradeSkill(data: Record<string, unknown>): AgentResponse {
    const upgradeData = data as unknown as SkillUpgradeParams;

    if (!upgradeData.skillId || !upgradeData.characterId) {
      return {
        success: false,
        error: 'Missing required fields: skillId, characterId',
      };
    }

    const skill = this.skills.get(upgradeData.skillId);
    if (!skill) {
      return {
        success: false,
        error: `Skill not found: ${upgradeData.skillId}`,
      };
    }

    // 检查是否已学习
    const characterSkillSet = this.characterSkills.get(upgradeData.characterId);
    if (!characterSkillSet?.has(upgradeData.skillId)) {
      return {
        success: false,
        error: 'Skill not learned yet',
      };
    }

    // 检查是否达到最大等级
    if (skill.level >= skill.maxLevel) {
      return {
        success: false,
        error: 'Skill already at max level',
      };
    }

    // 升级技能
    const previousLevel = skill.level;
    skill.level++;

    // 应用等级缩放
    this.applyLevelScaling(skill);

    this.addMemory(
      `Character ${upgradeData.characterId} upgraded skill: ${skill.name} to level ${skill.level}`,
      'assistant',
      6,
      { skillId: skill.id, characterId: upgradeData.characterId, previousLevel }
    );

    const uiInstructions: UIInstruction[] = [
      {
        type: 'update',
        target: 'skill_panel',
        action: 'upgrade_skill',
        data: { skill, characterId: upgradeData.characterId },
        options: { priority: 'normal' },
      },
      {
        type: 'notify',
        target: 'notification',
        action: 'skill_upgraded',
        data: { message: `${skill.name} 升级到 ${skill.level} 级` },
        options: { duration: 2000 },
      },
    ];

    return {
      success: true,
      data: { skill, previousLevel },
      uiInstructions,
    };
  }

  /**
   * 解锁技能
   */
  private handleUnlockSkill(data: Record<string, unknown>): AgentResponse {
    const unlockData = data as unknown as SkillUnlockParams;

    if (!unlockData.skillId || !unlockData.characterId) {
      return {
        success: false,
        error: 'Missing required fields: skillId, characterId',
      };
    }

    const skill = this.skills.get(unlockData.skillId);
    if (!skill) {
      return {
        success: false,
        error: `Skill not found: ${unlockData.skillId}`,
      };
    }

    // 解锁技能（设置状态或添加标记）
    // 这里简化处理，实际可能需要更复杂的解锁逻辑

    this.addMemory(
      `Skill ${skill.name} unlocked for character ${unlockData.characterId} via ${unlockData.unlockMethod}`,
      'assistant',
      5,
      { skillId: skill.id, characterId: unlockData.characterId }
    );

    const uiInstructions: UIInstruction[] = [
      {
        type: 'notify',
        target: 'notification',
        action: 'skill_unlocked',
        data: { message: `技能已解锁: ${skill.name}` },
        options: { duration: 3000 },
      },
    ];

    return {
      success: true,
      data: { skill },
      uiInstructions,
    };
  }

  /**
   * 遗忘技能
   */
  private handleUnlearnSkill(data: Record<string, unknown>): AgentResponse {
    const unlearnData = data as { skillId: string; characterId: string };

    if (!unlearnData.skillId || !unlearnData.characterId) {
      return {
        success: false,
        error: 'Missing required fields: skillId, characterId',
      };
    }

    const skill = this.skills.get(unlearnData.skillId);
    if (!skill) {
      return {
        success: false,
        error: `Skill not found: ${unlearnData.skillId}`,
      };
    }

    const characterSkillSet = this.characterSkills.get(unlearnData.characterId);
    if (!characterSkillSet?.has(unlearnData.skillId)) {
      return {
        success: false,
        error: 'Skill not learned',
      };
    }

    // 移除技能
    characterSkillSet.delete(unlearnData.skillId);

    // 清除冷却
    this.clearCooldown(unlearnData.characterId, unlearnData.skillId);

    // 清除 toggle 状态
    const toggleState = this.toggleStates.get(unlearnData.characterId);
    if (toggleState) {
      toggleState.delete(unlearnData.skillId);
    }

    this.addMemory(
      `Character ${unlearnData.characterId} unlearned skill: ${skill.name}`,
      'assistant',
      4,
      { skillId: skill.id, characterId: unlearnData.characterId }
    );

    const uiInstructions: UIInstruction[] = [
      {
        type: 'update',
        target: 'skill_panel',
        action: 'remove_skill',
        data: { skillId: unlearnData.skillId, characterId: unlearnData.characterId },
        options: { priority: 'normal' },
      },
    ];

    return {
      success: true,
      data: { skillId: unlearnData.skillId },
      uiInstructions,
    };
  }

  // ==================== 技能使用 ====================

  /**
   * 使用技能
   */
  private handleUseSkill(data: Record<string, unknown>): AgentResponse {
    const useData = data as unknown as SkillUseParams;

    if (!useData.skillId || !useData.characterId) {
      return {
        success: false,
        error: 'Missing required fields: skillId, characterId',
      };
    }

    const skill = this.skills.get(useData.skillId);
    if (!skill) {
      return {
        success: false,
        error: `Skill not found: ${useData.skillId}`,
      };
    }

    // 检查技能类型
    if (skill.type === 'passive') {
      return {
        success: false,
        error: 'Cannot use passive skill directly',
      };
    }

    // 检查是否已学习
    const characterSkillSet = this.characterSkills.get(useData.characterId);
    if (!characterSkillSet?.has(useData.skillId)) {
      return {
        success: false,
        error: 'Skill not learned',
      };
    }

    // 检查冷却
    const cooldownCheck = this.checkCooldownState(useData.characterId, useData.skillId);
    if (!cooldownCheck.ready) {
      return {
        success: false,
        error: `Skill on cooldown. Remaining: ${cooldownCheck.remaining} turns`,
      };
    }

    // 计算消耗
    const costResult = this.calculateSkillCost(skill, useData.characterId);
    if (!costResult.canAfford) {
      return {
        success: false,
        error: 'Insufficient resources',
        data: { costResult },
      };
    }

    // 计算效果
    const effectResult = this.calculateSkillEffect(skill, useData);

    // 应用冷却
    this.applyCooldown(useData.characterId, useData.skillId, skill.cooldown);

    this.addMemory(
      `Character ${useData.characterId} used skill: ${skill.name}`,
      'assistant',
      5,
      { skillId: skill.id, targetId: useData.targetId, effects: effectResult.effects }
    );

    const uiInstructions: UIInstruction[] = [
      {
        type: 'animate',
        target: 'skill_effect',
        action: 'play_effect',
        data: { skill, effectResult, characterId: useData.characterId },
        options: { duration: 1000 },
      },
      {
        type: 'update',
        target: 'skill_panel',
        action: 'set_cooldown',
        data: { skillId: skill.id, cooldown: skill.cooldown },
        options: { priority: 'normal' },
      },
    ];

    const result: SkillEffectResult = {
      skillId: skill.id,
      characterId: useData.characterId,
      targetId: useData.targetId,
      effects: effectResult.effects,
      totalCost: skill.costs,
      cooldownApplied: skill.cooldown,
      success: true,
    };

    return {
      success: true,
      data: result,
      uiInstructions,
    };
  }

  /**
   * 切换技能（toggle 类型）
   */
  private handleToggleSkill(data: Record<string, unknown>): AgentResponse {
    const toggleData = data as { skillId: string; characterId: string };

    if (!toggleData.skillId || !toggleData.characterId) {
      return {
        success: false,
        error: 'Missing required fields: skillId, characterId',
      };
    }

    const skill = this.skills.get(toggleData.skillId);
    if (!skill) {
      return {
        success: false,
        error: `Skill not found: ${toggleData.skillId}`,
      };
    }

    if (skill.type !== 'toggle') {
      return {
        success: false,
        error: 'Skill is not toggle type',
      };
    }

    // 初始化 toggle 状态
    if (!this.toggleStates.has(toggleData.characterId)) {
      this.toggleStates.set(toggleData.characterId, new Set());
    }

    const toggleState = this.toggleStates.get(toggleData.characterId)!;
    const isCurrentlyOn = toggleState.has(toggleData.skillId);

    if (isCurrentlyOn) {
      // 关闭技能
      toggleState.delete(toggleData.skillId);
      skill.isToggleOn = false;

      this.addMemory(
        `Character ${toggleData.characterId} toggled OFF skill: ${skill.name}`,
        'assistant',
        3,
        { skillId: skill.id, characterId: toggleData.characterId }
      );
    } else {
      // 检查冷却
      const cooldownCheck = this.checkCooldownState(toggleData.characterId, toggleData.skillId);
      if (!cooldownCheck.ready) {
        return {
          success: false,
          error: `Skill on cooldown. Remaining: ${cooldownCheck.remaining} turns`,
        };
      }

      // 检查消耗
      const costResult = this.calculateSkillCost(skill, toggleData.characterId);
      if (!costResult.canAfford) {
        return {
          success: false,
          error: 'Insufficient resources to activate',
          data: { costResult },
        };
      }

      // 开启技能
      toggleState.add(toggleData.skillId);
      skill.isToggleOn = true;

      // 应用冷却
      this.applyCooldown(toggleData.characterId, toggleData.skillId, skill.cooldown);

      this.addMemory(
        `Character ${toggleData.characterId} toggled ON skill: ${skill.name}`,
        'assistant',
        4,
        { skillId: skill.id, characterId: toggleData.characterId }
      );
    }

    const uiInstructions: UIInstruction[] = [
      {
        type: 'update',
        target: 'skill_panel',
        action: 'toggle_skill',
        data: { skillId: skill.id, isOn: skill.isToggleOn },
        options: { priority: 'normal' },
      },
    ];

    return {
      success: true,
      data: { skill, isOn: skill.isToggleOn },
      uiInstructions,
    };
  }

  /**
   * 计算技能效果
   */
  private handleCalculateEffect(data: Record<string, unknown>): AgentResponse {
    const calcData = data as {
      skillId: string;
      characterId: string;
      targetId?: string;
      attributes?: Record<string, number>;
    };

    if (!calcData.skillId) {
      return {
        success: false,
        error: 'Missing required field: skillId',
      };
    }

    const skill = this.skills.get(calcData.skillId);
    if (!skill) {
      return {
        success: false,
        error: `Skill not found: ${calcData.skillId}`,
      };
    }

    const effectResult = this.calculateSkillEffect(skill, {
      skillId: calcData.skillId,
      characterId: calcData.characterId,
      targetId: calcData.targetId,
    });

    return {
      success: true,
      data: effectResult,
    };
  }

  /**
   * 计算技能消耗
   */
  private handleCalculateCost(data: Record<string, unknown>): AgentResponse {
    const calcData = data as {
      skillId: string;
      characterId: string;
      resources?: Record<string, number>;
    };

    if (!calcData.skillId || !calcData.characterId) {
      return {
        success: false,
        error: 'Missing required fields: skillId, characterId',
      };
    }

    const skill = this.skills.get(calcData.skillId);
    if (!skill) {
      return {
        success: false,
        error: `Skill not found: ${calcData.skillId}`,
      };
    }

    const costResult = this.calculateSkillCost(skill, calcData.characterId, calcData.resources);

    return {
      success: true,
      data: costResult,
    };
  }

  // ==================== 冷却管理 ====================

  /**
   * 检查冷却状态
   */
  private handleCheckCooldown(data: Record<string, unknown>): AgentResponse {
    const checkData = data as { skillId: string; characterId: string };

    if (!checkData.skillId || !checkData.characterId) {
      return {
        success: false,
        error: 'Missing required fields: skillId, characterId',
      };
    }

    const cooldownState = this.checkCooldownState(checkData.characterId, checkData.skillId);

    return {
      success: true,
      data: cooldownState,
    };
  }

  /**
   * 减少冷却
   */
  private handleReduceCooldown(data: Record<string, unknown>): AgentResponse {
    const reduceData = data as {
      characterId: string;
      skillId?: string;
      amount?: number;
      reduceAll?: boolean;
    };

    if (!reduceData.characterId) {
      return {
        success: false,
        error: 'Missing required field: characterId',
      };
    }

    const amount = reduceData.amount || 1;
    const updatedCooldowns: SkillCooldownState[] = [];

    if (reduceData.reduceAll) {
      // 减少所有冷却
      const characterCooldowns = this.cooldownStates.get(reduceData.characterId);
      if (characterCooldowns) {
        for (const [skillId, state] of characterCooldowns) {
          state.remainingTurns = Math.max(0, state.remainingTurns - amount);
          updatedCooldowns.push(state);

          if (state.remainingTurns === 0) {
            characterCooldowns.delete(skillId);
          }
        }
      }
    } else if (reduceData.skillId) {
      // 减少特定技能冷却
      const characterCooldowns = this.cooldownStates.get(reduceData.characterId);
      if (characterCooldowns) {
        const state = characterCooldowns.get(reduceData.skillId);
        if (state) {
          state.remainingTurns = Math.max(0, state.remainingTurns - amount);
          updatedCooldowns.push(state);

          if (state.remainingTurns === 0) {
            characterCooldowns.delete(reduceData.skillId);
          }
        }
      }
    }

    return {
      success: true,
      data: { updatedCooldowns, count: updatedCooldowns.length },
    };
  }

  /**
   * 重置冷却
   */
  private handleResetCooldown(data: Record<string, unknown>): AgentResponse {
    const resetData = data as {
      characterId: string;
      skillId?: string;
      resetAll?: boolean;
    };

    if (!resetData.characterId) {
      return {
        success: false,
        error: 'Missing required field: characterId',
      };
    }

    if (resetData.resetAll) {
      this.cooldownStates.delete(resetData.characterId);
    } else if (resetData.skillId) {
      this.clearCooldown(resetData.characterId, resetData.skillId);
    }

    return {
      success: true,
      data: { reset: true },
    };
  }

  /**
   * 获取所有冷却
   */
  private handleGetAllCooldowns(data: Record<string, unknown>): AgentResponse {
    const queryData = data as { characterId: string };

    if (!queryData.characterId) {
      return {
        success: false,
        error: 'Missing required field: characterId',
      };
    }

    const characterCooldowns = this.cooldownStates.get(queryData.characterId);
    const cooldowns = characterCooldowns
      ? Array.from(characterCooldowns.values())
      : [];

    return {
      success: true,
      data: { cooldowns, count: cooldowns.length },
    };
  }

  // ==================== 技能树 ====================

  /**
   * 获取技能树
   */
  private handleGetSkillTree(data: Record<string, unknown>): AgentResponse {
    const queryData = data as { treeId: string; characterId?: string };

    if (!queryData.treeId) {
      return {
        success: false,
        error: 'Missing required field: treeId',
      };
    }

    const tree = this.skillTrees.get(queryData.treeId);
    if (!tree) {
      return {
        success: false,
        error: `Skill tree not found: ${queryData.treeId}`,
      };
    }

    // 如果提供了角色ID，更新节点状态
    if (queryData.characterId) {
      const characterSkillSet = this.characterSkills.get(queryData.characterId);
      for (const node of tree.nodes) {
        node.learned = characterSkillSet?.has(node.skillId) || false;
        // 检查前置条件是否满足
        node.unlocked = node.prerequisites.every(
          prereqId => characterSkillSet?.has(prereqId) || false
        );
      }
    }

    return {
      success: true,
      data: { tree },
    };
  }

  /**
   * 获取可学习技能
   */
  private handleGetAvailableSkills(data: Record<string, unknown>): AgentResponse {
    const queryData = data as {
      characterId: string;
      category?: SkillCategory;
    };

    if (!queryData.characterId) {
      return {
        success: false,
        error: 'Missing required field: characterId',
      };
    }

    const characterSkillSet = this.characterSkills.get(queryData.characterId) || new Set();

    let availableSkills = Array.from(this.skills.values())
      .filter(skill => {
        // 未学习
        if (characterSkillSet.has(skill.id)) return false;

        // 分类过滤
        if (queryData.category && skill.category !== queryData.category) return false;

        // 检查前置条件
        if (skill.requirements) {
          // TODO: 调用 NUMERICAL agent 检查详细要求
          return true;
        }

        return true;
      });

    return {
      success: true,
      data: { skills: availableSkills, count: availableSkills.length },
    };
  }

  // ==================== 模板管理 ====================

  /**
   * 创建模板
   */
  private handleCreateTemplate(data: Record<string, unknown>): AgentResponse {
    const templateData = data as Omit<SkillTemplate, 'id'>;

    if (!templateData.name || !templateData.category || !templateData.type) {
      return {
        success: false,
        error: 'Missing required fields: name, category, type',
      };
    }

    const template: SkillTemplate = {
      ...templateData,
      id: this.generateTemplateId(),
    };

    this.skillTemplates.set(template.id, template);

    return {
      success: true,
      data: { template },
    };
  }

  /**
   * 获取模板
   */
  private handleGetTemplate(data: Record<string, unknown>): AgentResponse {
    const queryData = data as { templateId: string };

    if (!queryData.templateId) {
      return {
        success: false,
        error: 'Missing required field: templateId',
      };
    }

    const template = this.skillTemplates.get(queryData.templateId);
    if (!template) {
      return {
        success: false,
        error: `Template not found: ${queryData.templateId}`,
      };
    }

    return {
      success: true,
      data: { template },
    };
  }

  // ==================== 统计 ====================

  /**
   * 获取统计数据
   */
  private handleGetStatistics(): AgentResponse {
    const stats: SkillStatistics = {
      totalSkills: this.skills.size,
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
      learnedSkills: 0,
      maxLevelSkills: 0,
      totalCooldowns: 0,
    };

    for (const skill of this.skills.values()) {
      stats.byCategory[skill.category]++;
      stats.byType[skill.type]++;

      if (skill.level >= skill.maxLevel) {
        stats.maxLevelSkills++;
      }
    }

    for (const skillSet of this.characterSkills.values()) {
      stats.learnedSkills += skillSet.size;
    }

    for (const cooldownMap of this.cooldownStates.values()) {
      stats.totalCooldowns += cooldownMap.size;
    }

    return {
      success: true,
      data: stats,
    };
  }

  // ==================== 辅助方法 ====================

  /**
   * 创建技能
   */
  private createSkill(data: {
    name: string;
    description: string;
    type: SkillType;
    category: SkillCategory;
    costs: SkillCost[];
    cooldown: number;
    effects: SkillEffect[];
    requirements?: SkillRequirement[];
    targetType?: TargetType;
    range?: SkillRange;
    maxLevel?: number;
  }): ExtendedSkill {
    return {
      id: this.generateSkillId(),
      name: data.name,
      description: data.description,
      type: data.type,
      category: data.category,
      costs: data.costs,
      cooldown: data.cooldown,
      effects: data.effects,
      requirements: data.requirements || [],
      level: 1,
      maxLevel: data.maxLevel || 10,
      targetType: data.targetType || 'single_enemy',
      range: data.range,
      isToggleOn: false,
    };
  }

  /**
   * 从模板创建技能
   */
  private createSkillFromTemplate(template: SkillTemplate, level: number): ExtendedSkill {
    const scaling = template.scalingPerLevel;
    const levelMultiplier = level - 1;

    // 计算缩放后的消耗
    const scaledCosts: SkillCost[] = template.baseCosts.map(cost => ({
      ...cost,
      value: Math.floor(cost.value * Math.pow(scaling.costMultiplier, levelMultiplier)),
    }));

    // 计算缩放后的效果
    const scaledEffects: SkillEffect[] = template.baseEffects.map(effect => ({
      ...effect,
      value: Math.floor(effect.value * Math.pow(scaling.effectMultiplier, levelMultiplier)),
    }));

    // 计算缩放后的冷却
    const scaledCooldown = Math.max(
      0,
      template.baseCooldown - scaling.cooldownReduction * levelMultiplier
    );

    return {
      id: this.generateSkillId(),
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
    };
  }

  /**
   * 应用等级缩放
   */
  private applyLevelScaling(skill: ExtendedSkill): void {
    // 简化的等级缩放逻辑
    for (const effect of skill.effects) {
      effect.value = Math.floor(effect.value * 1.1);
    }
    for (const cost of skill.costs) {
      cost.value = Math.floor(cost.value * 1.05);
    }
    skill.cooldown = Math.max(0, skill.cooldown - 1);
  }

  /**
   * 学习技能（内部方法）
   */
  private learnSkillForCharacter(characterId: string, skillId: string): void {
    if (!this.characterSkills.has(characterId)) {
      this.characterSkills.set(characterId, new Set());
    }
    this.characterSkills.get(characterId)!.add(skillId);
  }

  /**
   * 计算技能效果
   */
  private calculateSkillEffect(
    skill: ExtendedSkill,
    _params: SkillUseParams
  ): { effects: SkillEffectResult['effects'] } {
    const effects: SkillEffectResult['effects'] = [];

    for (const effect of skill.effects) {
      // 基础效果值
      let value = effect.value;

      // 应用等级加成
      value = Math.floor(value * (1 + (skill.level - 1) * 0.1));

      // TODO: 调用 NUMERICAL agent 进行详细计算
      // 包括：属性加成、暴击计算、抗性计算等

      effects.push({
        type: effect.type,
        value: effect.value,
        actualValue: value,
        isCritical: false,
        isBlocked: false,
        isResisted: false,
      });
    }

    return { effects };
  }

  /**
   * 计算技能消耗
   */
  private calculateSkillCost(
    skill: ExtendedSkill,
    _characterId: string,
    resources?: Record<string, number>
  ): SkillCostResult {
    // 默认资源值（实际应从角色数据获取）
    const defaultResources: Record<string, number> = resources || {
      mana: 100,
      health: 100,
      stamina: 100,
    };

    const costs: SkillCostResult['costs'] = [];
    let totalInsufficient = 0;

    for (const cost of skill.costs) {
      const resourceKey = cost.type === 'custom' ? cost.customResource || 'custom' : cost.type;
      const available = defaultResources[resourceKey] || 0;
      const sufficient = available >= cost.value;

      if (!sufficient) {
        totalInsufficient += cost.value - available;
      }

      costs.push({
        type: cost.type,
        required: cost.value,
        available,
        sufficient,
      });
    }

    return {
      canAfford: totalInsufficient === 0,
      costs,
      totalInsufficient,
    };
  }

  /**
   * 检查冷却状态
   */
  private checkCooldownState(
    characterId: string,
    skillId: string
  ): { ready: boolean; remaining: number; state?: SkillCooldownState } {
    const characterCooldowns = this.cooldownStates.get(characterId);
    if (!characterCooldowns) {
      return { ready: true, remaining: 0 };
    }

    const state = characterCooldowns.get(skillId);
    if (!state) {
      return { ready: true, remaining: 0 };
    }

    return {
      ready: state.remainingTurns === 0,
      remaining: state.remainingTurns,
      state,
    };
  }

  /**
   * 应用冷却
   */
  private applyCooldown(characterId: string, skillId: string, cooldown: number): void {
    if (cooldown <= 0) return;

    if (!this.cooldownStates.has(characterId)) {
      this.cooldownStates.set(characterId, new Map());
    }

    const characterCooldowns = this.cooldownStates.get(characterId)!;
    characterCooldowns.set(skillId, {
      skillId,
      remainingTurns: cooldown,
      totalCooldown: cooldown,
      lastUsedAt: Date.now(),
    });
  }

  /**
   * 清除冷却
   */
  private clearCooldown(characterId: string, skillId: string): void {
    const characterCooldowns = this.cooldownStates.get(characterId);
    if (characterCooldowns) {
      characterCooldowns.delete(skillId);
    }
  }

  /**
   * 生成技能ID
   */
  private generateSkillId(): string {
    this.skillIdCounter++;
    return `skill_${Date.now()}_${this.skillIdCounter}`;
  }

  /**
   * 生成模板ID
   */
  private generateTemplateId(): string {
    this.templateIdCounter++;
    return `template_${Date.now()}_${this.templateIdCounter}`;
  }
}

export default SkillAgent;
