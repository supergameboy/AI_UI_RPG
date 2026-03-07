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
  InitializationContext,
  InitializationResult,
} from '@ai-rpg/shared';
import { AgentType as AT, ToolType as ToolTypeEnum, DEFAULT_RESOURCE_VALUES } from '@ai-rpg/shared';
import { AgentBase } from './AgentBase';
import { getInitialSkills } from '../data/initialData';
import { gameLog } from '../services/GameLogService';

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
 * 技能等级缩放配置
 */
interface SkillScalingConfig {
  /** 效果值缩放倍率（每级乘以此值） */
  effectMultiplier: number;
  /** 消耗值缩放倍率（每级乘以此值） */
  costMultiplier: number;
  /** 冷却减少值（每级减少） */
  cooldownReduction: number;
  /** 缩放公式类型 */
  scalingType: 'linear' | 'exponential' | 'logarithmic';
}

/**
 * 默认技能缩放配置
 */
const DEFAULT_SKILL_SCALING: SkillScalingConfig = {
  effectMultiplier: 1.1,      // 每级效果 +10%
  costMultiplier: 1.05,       // 每级消耗 +5%
  cooldownReduction: 0.5,     // 每级冷却减少 0.5 回合
  scalingType: 'linear',
};

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
  /** 可选的自定义缩放配置 */
  scalingConfig?: SkillScalingConfig;
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

/**
 * 单个需求检查结果
 */
interface RequirementCheckDetail {
  type: 'level' | 'attribute' | 'skill' | 'item' | 'class';
  required: number | string;
  actual?: number | string;
  satisfied: boolean;
  description: string;
}

/**
 * 技能需求检查结果
 */
interface SkillRequirementCheckResult {
  satisfied: boolean;
  requirements: RequirementCheckDetail[];
  missingRequirements: RequirementCheckDetail[];
  summary: string;
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
   * 初始化方法
   * 用于游戏开始时为角色添加初始技能
   */
  async initialize(context: InitializationContext): Promise<InitializationResult> {
    try {
      const { character } = context;
      
      // 获取职业初始技能ID列表
      const initialSkillIds = getInitialSkills(character.class);
      
      // 为角色学习初始技能
      const learnedSkills: string[] = [];
      const failedSkills: string[] = [];
      
      for (const skillId of initialSkillIds) {
        // 创建基础技能实例
        const skill = this.createSkillFromId(skillId);
        if (skill) {
          // 存储技能
          this.skills.set(skill.id, skill);
          
          // 为角色学习技能
          this.learnSkillForCharacter(character.id, skill.id);
          learnedSkills.push(skill.id);
        } else {
          failedSkills.push(skillId);
        }
      }
      
      this.addMemory(
        `Initialized skills for character: ${character.name}. Learned: ${learnedSkills.length} skills`,
        'assistant',
        7,
        { characterId: character.id, learnedSkills }
      );
      
      return {
        success: true,
        data: {
          learnedSkills,
          failedSkills,
          totalSkills: learnedSkills.length,
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during skill initialization';
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
   * 根据技能ID创建技能实例
   */
  private createSkillFromId(skillId: string): ExtendedSkill | null {
    const skillData = this.getSkillData(skillId);
    if (!skillData) return null;
    
    return {
      id: skillId,
      name: skillData.name,
      description: skillData.description,
      type: skillData.type,
      category: skillData.category,
      costs: skillData.costs,
      cooldown: skillData.cooldown,
      effects: skillData.effects,
      requirements: [],
      level: 1,
      maxLevel: 10,
      targetType: skillData.targetType,
    };
  }

  /**
   * 获取技能数据
   */
  private getSkillData(skillId: string): {
    name: string;
    description: string;
    type: SkillType;
    category: SkillCategory;
    costs: SkillCost[];
    cooldown: number;
    effects: SkillEffect[];
    targetType: TargetType;
  } | null {
    const skillConfigs: Record<string, {
      name: string;
      description: string;
      type: SkillType;
      category: SkillCategory;
      costs: SkillCost[];
      cooldown: number;
      effects: SkillEffect[];
      targetType: TargetType;
    }> = {
      // 战士技能
      'slash': {
        name: '斩击',
        description: '基础剑术攻击',
        type: 'active',
        category: 'combat',
        costs: [{ type: 'stamina', value: 5 }],
        cooldown: 0,
        effects: [{ type: 'damage', value: 15 }],
        targetType: 'single_enemy',
      },
      'defensive_stance': {
        name: '防御姿态',
        description: '提高防御力',
        type: 'active',
        category: 'combat',
        costs: [{ type: 'stamina', value: 10 }],
        cooldown: 3,
        effects: [{ type: 'defense_boost', value: 20, duration: 3 }],
        targetType: 'self',
      },
      'power_strike': {
        name: '强力打击',
        description: '强力一击',
        type: 'active',
        category: 'combat',
        costs: [{ type: 'stamina', value: 15 }],
        cooldown: 2,
        effects: [{ type: 'damage', value: 25 }],
        targetType: 'single_enemy',
      },
      // 法师技能
      'fireball': {
        name: '火球术',
        description: '发射火球',
        type: 'active',
        category: 'magic',
        costs: [{ type: 'mana', value: 15 }],
        cooldown: 2,
        effects: [{ type: 'damage', value: 30 }],
        targetType: 'single_enemy',
      },
      'ice_shield': {
        name: '冰盾',
        description: '召唤冰盾保护自己',
        type: 'active',
        category: 'magic',
        costs: [{ type: 'mana', value: 12 }],
        cooldown: 4,
        effects: [{ type: 'defense_boost', value: 15, duration: 3 }],
        targetType: 'self',
      },
      'mana_regen': {
        name: '魔力回复',
        description: '回复魔力',
        type: 'active',
        category: 'magic',
        costs: [],
        cooldown: 5,
        effects: [{ type: 'mp_regen', value: 5 }],
        targetType: 'self',
      },
      // 盗贼技能
      'backstab': {
        name: '背刺',
        description: '从背后偷袭',
        type: 'active',
        category: 'combat',
        costs: [{ type: 'stamina', value: 10 }],
        cooldown: 2,
        effects: [{ type: 'damage', value: 35 }],
        targetType: 'single_enemy',
      },
      'stealth': {
        name: '潜行',
        description: '进入隐身状态',
        type: 'active',
        category: 'exploration',
        costs: [{ type: 'stamina', value: 15 }],
        cooldown: 5,
        effects: [{ type: 'stealth', value: 1, duration: 3 }],
        targetType: 'self',
      },
      'poison_blade': {
        name: '毒刃',
        description: '涂毒攻击',
        type: 'active',
        category: 'combat',
        costs: [{ type: 'stamina', value: 8 }],
        cooldown: 3,
        effects: [{ type: 'damage', value: 10 }, { type: 'poison', value: 5, duration: 3 }],
        targetType: 'single_enemy',
      },
      // 牧师技能
      'heal': {
        name: '治疗',
        description: '恢复生命值',
        type: 'active',
        category: 'magic',
        costs: [{ type: 'mana', value: 10 }],
        cooldown: 2,
        effects: [{ type: 'healing', value: 20 }],
        targetType: 'single_ally',
      },
      'bless': {
        name: '祝福',
        description: '祝福目标',
        type: 'active',
        category: 'magic',
        costs: [{ type: 'mana', value: 15 }],
        cooldown: 5,
        effects: [{ type: 'stat_boost', value: 10, duration: 3 }],
        targetType: 'single_ally',
      },
      'holy_light': {
        name: '圣光',
        description: '神圣之光',
        type: 'active',
        category: 'magic',
        costs: [{ type: 'mana', value: 20 }],
        cooldown: 3,
        effects: [{ type: 'damage', value: 25 }],
        targetType: 'single_enemy',
      },
      // 游侠技能
      'aimed_shot': {
        name: '瞄准射击',
        description: '精准射击',
        type: 'active',
        category: 'combat',
        costs: [{ type: 'stamina', value: 8 }],
        cooldown: 1,
        effects: [{ type: 'damage', value: 20 }],
        targetType: 'single_enemy',
      },
      'trap': {
        name: '陷阱',
        description: '设置陷阱',
        type: 'active',
        category: 'exploration',
        costs: [{ type: 'stamina', value: 10 }],
        cooldown: 3,
        effects: [{ type: 'trap', value: 15 }],
        targetType: 'area',
      },
      'nature_bond': {
        name: '自然契约',
        description: '与自然连接',
        type: 'active',
        category: 'magic',
        costs: [{ type: 'mana', value: 10 }],
        cooldown: 4,
        effects: [{ type: 'healing', value: 10 }],
        targetType: 'self',
      },
      // 圣骑士技能
      'holy_strike': {
        name: '神圣打击',
        description: '神圣一击',
        type: 'active',
        category: 'combat',
        costs: [{ type: 'mana', value: 12 }],
        cooldown: 2,
        effects: [{ type: 'damage', value: 28 }],
        targetType: 'single_enemy',
      },
      'divine_shield': {
        name: '神圣护盾',
        description: '神圣保护',
        type: 'active',
        category: 'magic',
        costs: [{ type: 'mana', value: 15 }],
        cooldown: 5,
        effects: [{ type: 'shield', value: 30, duration: 2 }],
        targetType: 'self',
      },
      'lay_on_hands': {
        name: '圣疗',
        description: '圣手治疗',
        type: 'active',
        category: 'magic',
        costs: [{ type: 'mana', value: 20 }],
        cooldown: 4,
        effects: [{ type: 'healing', value: 40 }],
        targetType: 'single_ally',
      },
      // 死灵法师技能
      'summon_undead': {
        name: '召唤亡灵',
        description: '召唤亡灵仆从',
        type: 'active',
        category: 'magic',
        costs: [{ type: 'mana', value: 25 }],
        cooldown: 6,
        effects: [{ type: 'summon', value: 1 }],
        targetType: 'self',
      },
      'drain_life': {
        name: '吸取生命',
        description: '吸取敌人生命',
        type: 'active',
        category: 'magic',
        costs: [{ type: 'mana', value: 15 }],
        cooldown: 2,
        effects: [{ type: 'damage', value: 15 }, { type: 'healing', value: 10 }],
        targetType: 'single_enemy',
      },
      'bone_armor': {
        name: '骨甲',
        description: '召唤骨甲',
        type: 'active',
        category: 'magic',
        costs: [{ type: 'mana', value: 12 }],
        cooldown: 4,
        effects: [{ type: 'defense_boost', value: 20, duration: 3 }],
        targetType: 'self',
      },
      // 吟游诗人技能
      'inspiring_song': {
        name: '激励之歌',
        description: '激励队友',
        type: 'active',
        category: 'social',
        costs: [{ type: 'mana', value: 10 }],
        cooldown: 3,
        effects: [{ type: 'stat_boost', value: 15, duration: 3 }],
        targetType: 'all_allies',
      },
      'dissonant_whisper': {
        name: '不谐低语',
        description: '干扰敌人',
        type: 'active',
        category: 'magic',
        costs: [{ type: 'mana', value: 8 }],
        cooldown: 2,
        effects: [{ type: 'damage', value: 18 }],
        targetType: 'single_enemy',
      },
      'healing_melody': {
        name: '治愈旋律',
        description: '治愈之歌',
        type: 'active',
        category: 'magic',
        costs: [{ type: 'mana', value: 12 }],
        cooldown: 3,
        effects: [{ type: 'healing', value: 15 }],
        targetType: 'all_allies',
      },
      // 武僧技能
      'flurry_of_blows': {
        name: '连击',
        description: '快速连击',
        type: 'active',
        category: 'combat',
        costs: [{ type: 'stamina', value: 8 }],
        cooldown: 1,
        effects: [{ type: 'damage', value: 12 }],
        targetType: 'single_enemy',
      },
      'patient_defense': {
        name: '耐心防御',
        description: '防御姿态',
        type: 'active',
        category: 'combat',
        costs: [{ type: 'stamina', value: 10 }],
        cooldown: 3,
        effects: [{ type: 'defense_boost', value: 15, duration: 2 }],
        targetType: 'self',
      },
      'step_of_the_wind': {
        name: '风行步',
        description: '快速移动',
        type: 'active',
        category: 'exploration',
        costs: [{ type: 'stamina', value: 10 }],
        cooldown: 2,
        effects: [{ type: 'speed_boost', value: 20, duration: 2 }],
        targetType: 'self',
      },
      // 德鲁伊技能
      'wild_shape': {
        name: '野性形态',
        description: '变身野兽',
        type: 'active',
        category: 'magic',
        costs: [{ type: 'mana', value: 15 }],
        cooldown: 5,
        effects: [{ type: 'transform', value: 1, duration: 5 }],
        targetType: 'self',
      },
      'entangle': {
        name: '纠缠',
        description: '束缚敌人',
        type: 'active',
        category: 'magic',
        costs: [{ type: 'mana', value: 10 }],
        cooldown: 3,
        effects: [{ type: 'root', value: 2, duration: 2 }],
        targetType: 'all_enemies',
      },
      'healing_spirit': {
        name: '治愈之灵',
        description: '召唤治愈之灵',
        type: 'active',
        category: 'magic',
        costs: [{ type: 'mana', value: 12 }],
        cooldown: 4,
        effects: [{ type: 'healing', value: 12 }],
        targetType: 'single_ally',
      },
    };
    
    return skillConfigs[skillId] || null;
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
  private async handleLearnSkill(data: Record<string, unknown>): Promise<AgentResponse> {
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

    // 检查前置条件（调用 NUMERICAL agent 检查属性要求）
    if (skill.requirements && skill.requirements.length > 0) {
      const requirementCheck = await this.checkSkillRequirements(skill, learnData.characterId);

      if (!requirementCheck.satisfied) {
        gameLog.info('agent', `Skill learning failed: requirements not met`, {
          skillId: skill.id,
          characterId: learnData.characterId,
          missingRequirements: requirementCheck.missingRequirements.map(r => r.description),
        });

        return {
          success: false,
          error: `不满足学习条件: ${requirementCheck.summary}`,
          data: {
            requirementCheck,
          },
        };
      }
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
  private async handleUseSkill(data: Record<string, unknown>): Promise<AgentResponse> {
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

    // 计算效果（异步调用 NUMERICAL agent）
    const effectResult = await this.calculateSkillEffect(skill, useData);

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
  private async handleCalculateEffect(data: Record<string, unknown>): Promise<AgentResponse> {
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

    const effectResult = await this.calculateSkillEffect(skill, {
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
  private async handleGetAvailableSkills(data: Record<string, unknown>): Promise<AgentResponse> {
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

    // 获取角色属性用于需求检查
    const characterStatsResponse = await this.callAgent(AT.NUMERICAL, {
      id: this.generateMessageId(),
      timestamp: Date.now(),
      from: this.type,
      to: AT.NUMERICAL,
      type: 'request',
      payload: {
        action: 'get_character_stats',
        data: { characterId: queryData.characterId },
      },
      metadata: {
        priority: 'normal',
        requiresResponse: true,
      },
    });

    const characterData = characterStatsResponse.success && characterStatsResponse.data
      ? (characterStatsResponse.data as { character?: {
          level: number;
          baseAttributes: Record<string, number>;
          derivedAttributes: Record<string, number>;
          class?: string;
        } }).character
      : undefined;

    const availableSkills: Array<ExtendedSkill & { requirementStatus?: SkillRequirementCheckResult }> = [];

    for (const skill of this.skills.values()) {
      // 未学习
      if (characterSkillSet.has(skill.id)) continue;

      // 分类过滤
      if (queryData.category && skill.category !== queryData.category) continue;

      // 检查前置条件
      if (skill.requirements && skill.requirements.length > 0) {
        const requirementCheck = this.checkRequirementsLocally(skill, characterData, characterSkillSet);

        // 只包含满足条件的技能，或者包含详细信息供前端展示
        availableSkills.push({
          ...skill,
          requirementStatus: requirementCheck,
        });
      } else {
        availableSkills.push({
          ...skill,
          requirementStatus: {
            satisfied: true,
            requirements: [],
            missingRequirements: [],
            summary: '无前置需求',
          },
        });
      }
    }

    return {
      success: true,
      data: { skills: availableSkills, count: availableSkills.length },
    };
  }

  /**
   * 本地检查需求（不调用 Agent，用于批量检查）
   */
  private checkRequirementsLocally(
    skill: ExtendedSkill,
    character?: {
      level: number;
      baseAttributes: Record<string, number>;
      derivedAttributes: Record<string, number>;
      class?: string;
    },
    learnedSkills?: Set<string>
  ): SkillRequirementCheckResult {
    const requirements: RequirementCheckDetail[] = [];
    const missingRequirements: RequirementCheckDetail[] = [];

    // 确保 requirements 存在
    const skillRequirements = skill.requirements || [];
    for (const req of skillRequirements) {
      const detail = this.checkSingleRequirement(req, character, learnedSkills);
      requirements.push(detail);

      if (!detail.satisfied) {
        missingRequirements.push(detail);
      }
    }

    const satisfied = missingRequirements.length === 0;
    let summary: string;
    if (satisfied) {
      summary = '满足所有前置需求';
    } else {
      const missingDescriptions = missingRequirements.map(r => r.description);
      summary = `缺少条件: ${missingDescriptions.join(', ')}`;
    }

    return {
      satisfied,
      requirements,
      missingRequirements,
      summary,
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
   * 支持配置化的缩放公式，根据技能等级调整效果、消耗和冷却
   */
  private applyLevelScaling(skill: ExtendedSkill): void {
    const config = skill.scalingConfig || DEFAULT_SKILL_SCALING;
    const currentLevel = skill.level;
    
    // 根据缩放类型计算缩放因子
    const scaleFactor = this.calculateScaleFactor(currentLevel, config);
    
    // 应用效果缩放
    for (const effect of skill.effects) {
      effect.value = this.applyScalingToValue(
        effect.value,
        scaleFactor.effectScale,
        config.scalingType
      );
    }
    
    // 应用消耗缩放
    for (const cost of skill.costs) {
      cost.value = this.applyScalingToValue(
        cost.value,
        scaleFactor.costScale,
        config.scalingType
      );
    }
    
    // 应用冷却减少
    const cooldownReduction = config.cooldownReduction * (currentLevel - 1);
    skill.cooldown = Math.max(0, Math.floor(skill.cooldown - cooldownReduction));
    
    // 记录日志
    gameLog.debug('agent', `Applied level scaling to skill ${skill.name}`, {
      level: currentLevel,
      effectScale: scaleFactor.effectScale,
      costScale: scaleFactor.costScale,
      cooldownReduction,
    });
  }
  
  /**
   * 计算缩放因子
   */
  private calculateScaleFactor(
    level: number,
    config: SkillScalingConfig
  ): { effectScale: number; costScale: number } {
    const levelMultiplier = level - 1;
    
    switch (config.scalingType) {
      case 'exponential':
        // 指数增长：每级效果/消耗按倍率指数增长
        return {
          effectScale: Math.pow(config.effectMultiplier, levelMultiplier),
          costScale: Math.pow(config.costMultiplier, levelMultiplier),
        };
        
      case 'logarithmic':
        // 对数增长：增长逐渐减缓
        return {
          effectScale: 1 + Math.log(1 + levelMultiplier * (config.effectMultiplier - 1)),
          costScale: 1 + Math.log(1 + levelMultiplier * (config.costMultiplier - 1)),
        };
        
      case 'linear':
      default:
        // 线性增长：每级固定增长
        return {
          effectScale: 1 + levelMultiplier * (config.effectMultiplier - 1),
          costScale: 1 + levelMultiplier * (config.costMultiplier - 1),
        };
    }
  }
  
  /**
   * 应用缩放到数值
   */
  private applyScalingToValue(
    baseValue: number,
    scale: number,
    _scalingType: string
  ): number {
    // 对数值进行缩放并取整
    return Math.max(1, Math.floor(baseValue * scale));
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
   * 调用 NUMERICAL agent 进行详细计算
   */
  private async calculateSkillEffect(
    skill: ExtendedSkill,
    params: SkillUseParams
  ): Promise<{ effects: SkillEffectResult['effects'] }> {
    // 获取角色属性用于详细计算
    const characterStatsResponse = await this.callAgent(AT.NUMERICAL, {
      id: this.generateMessageId(),
      timestamp: Date.now(),
      from: this.type,
      to: AT.NUMERICAL,
      type: 'request',
      payload: {
        action: 'get_character_stats',
        data: { characterId: params.characterId },
      },
      metadata: {
        priority: 'normal',
        requiresResponse: true,
      },
    });

    const characterData = characterStatsResponse.success && characterStatsResponse.data
      ? (characterStatsResponse.data as { character?: {
          level: number;
          baseAttributes: Record<string, number>;
          derivedAttributes: Record<string, number>;
          class?: string;
        } }).character
      : undefined;

    // 使用详细计算方法
    const effects = await this.calculateSkillEffectDetailed(skill, params, characterData);

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
    const defaultResources: Record<string, number> = resources || { ...DEFAULT_RESOURCE_VALUES };

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

  /**
   * 检查技能需求
   * 调用 NUMERICAL agent 获取角色属性并验证需求
   */
  private async checkSkillRequirements(
    skill: ExtendedSkill,
    characterId: string
  ): Promise<SkillRequirementCheckResult> {
    const requirements: RequirementCheckDetail[] = [];
    const missingRequirements: RequirementCheckDetail[] = [];

    // 如果没有需求，直接返回满足
    if (!skill.requirements || skill.requirements.length === 0) {
      return {
        satisfied: true,
        requirements: [],
        missingRequirements: [],
        summary: '无前置需求',
      };
    }

    // 调用 NUMERICAL agent 获取角色属性
    const characterStatsResponse = await this.callAgent(AT.NUMERICAL, {
      id: this.generateMessageId(),
      timestamp: Date.now(),
      from: this.type,
      to: AT.NUMERICAL,
      type: 'request',
      payload: {
        action: 'get_character_stats',
        data: { characterId },
      },
      metadata: {
        priority: 'normal',
        requiresResponse: true,
      },
    });

    // 获取角色已学习技能
    const characterSkillSet = this.characterSkills.get(characterId) || new Set();

    // 如果获取角色数据失败，返回默认检查结果
    if (!characterStatsResponse.success || !characterStatsResponse.data) {
      gameLog.warn('agent', 'Failed to get character stats for requirement check', {
        skillId: skill.id,
        characterId,
        error: characterStatsResponse.error,
      });

      // 返回保守结果：假设所有需求都不满足
      for (const req of skill.requirements) {
        const detail: RequirementCheckDetail = {
          type: req.type,
          required: req.value,
          satisfied: false,
          description: this.getRequirementDescription(req),
        };
        requirements.push(detail);
        missingRequirements.push(detail);
      }

      return {
        satisfied: false,
        requirements,
        missingRequirements,
        summary: `无法获取角色数据，需要满足 ${missingRequirements.length} 个条件`,
      };
    }

    const characterData = characterStatsResponse.data as {
      character?: {
        level: number;
        baseAttributes: Record<string, number>;
        derivedAttributes: Record<string, number>;
        class?: string;
      };
    };
    const character = characterData.character;

    // 检查每个需求
    for (const req of skill.requirements) {
      const detail = this.checkSingleRequirement(req, character, characterSkillSet);
      requirements.push(detail);

      if (!detail.satisfied) {
        missingRequirements.push(detail);
      }
    }

    // 生成摘要
    const satisfied = missingRequirements.length === 0;
    let summary: string;
    if (satisfied) {
      summary = '满足所有前置需求';
    } else {
      const missingDescriptions = missingRequirements.map(r => r.description);
      summary = `缺少条件: ${missingDescriptions.join(', ')}`;
    }

    return {
      satisfied,
      requirements,
      missingRequirements,
      summary,
    };
  }

  /**
   * 检查单个需求
   * 完整实现所有前置条件检查
   */
  private checkSingleRequirement(
    req: SkillRequirement,
    character?: {
      level: number;
      baseAttributes: Record<string, number>;
      derivedAttributes: Record<string, number>;
      class?: string;
    },
    learnedSkills?: Set<string>
  ): RequirementCheckDetail {
    const detail: RequirementCheckDetail = {
      type: req.type,
      required: req.value,
      satisfied: false,
      description: '',
    };

    switch (req.type) {
      case 'level': {
        // 等级要求检查
        const requiredLevel = typeof req.value === 'number' ? req.value : parseInt(String(req.value), 10);
        const actualLevel = character?.level ?? 0;
        detail.actual = actualLevel;
        detail.satisfied = actualLevel >= requiredLevel;
        detail.description = detail.satisfied
          ? `等级要求: ${requiredLevel} (当前: ${actualLevel})`
          : `需要等级 ${requiredLevel}，当前等级 ${actualLevel}`;
        break;
      }

      case 'attribute': {
        // 属性要求检查
        // req.value 格式: "strength:15" 或 "intelligence:20"
        const attrReq = String(req.value);
        const [attrName, attrValueStr] = attrReq.includes(':') ? attrReq.split(':') : [attrReq, '0'];
        const requiredValue = parseInt(attrValueStr, 10);

        // 优先检查基础属性，其次检查衍生属性
        let actualValue = character?.baseAttributes?.[attrName] ?? 0;
        if (actualValue === 0 && character?.derivedAttributes) {
          actualValue = character.derivedAttributes[attrName] ?? 0;
        }

        detail.actual = actualValue;
        detail.satisfied = actualValue >= requiredValue;

        const attrDisplayName = this.getAttributeDisplayName(attrName);
        detail.description = detail.satisfied
          ? `${attrDisplayName} 要求: ${requiredValue} (当前: ${actualValue})`
          : `需要 ${attrDisplayName} ${requiredValue}，当前 ${actualValue}`;
        break;
      }

      case 'skill': {
        // 前置技能检查
        // req.value 为前置技能的ID
        const requiredSkillId = String(req.value);
        const hasSkill = learnedSkills?.has(requiredSkillId) ?? false;

        // 获取技能名称用于更友好的提示
        const requiredSkill = this.skills.get(requiredSkillId);
        const skillName = requiredSkill?.name ?? requiredSkillId;

        detail.actual = hasSkill ? '已学习' : '未学习';
        detail.satisfied = hasSkill;
        detail.description = hasSkill
          ? `前置技能: ${skillName} (已学习)`
          : `需要先学习技能: ${skillName}`;
        break;
      }

      case 'item': {
        // 物品需求检查
        // 注意: 完整的物品检查需要调用 INVENTORY agent
        // 这里提供基础检查框架，实际物品验证应在调用层完成
        const requiredItem = String(req.value);

        // 标记为需要进一步验证
        detail.actual = '需要验证';
        detail.satisfied = false;
        detail.description = `需要物品: ${requiredItem} (需要检查背包)`;

        gameLog.debug('agent', 'Item requirement check needs INVENTORY agent integration', {
          requiredItem,
          requirementType: 'item',
        });
        break;
      }

      case 'class': {
        // 职业限制检查
        // req.value 可以是单个职业名称或职业数组（JSON格式）
        const classReq = String(req.value);
        let allowedClasses: string[];

        try {
          // 尝试解析为数组
          const parsed = JSON.parse(classReq);
          allowedClasses = Array.isArray(parsed) ? parsed : [parsed];
        } catch {
          // 解析失败，作为单个职业处理
          allowedClasses = [classReq];
        }

        const characterClass = character?.class ?? '';
        const isClassAllowed = allowedClasses.some(
          allowedClass => allowedClass.toLowerCase() === characterClass.toLowerCase()
        );

        detail.actual = characterClass || '未知';
        detail.satisfied = isClassAllowed;

        const allowedClassesStr = allowedClasses.map(c => this.getClassDisplayName(c)).join('、');
        detail.description = isClassAllowed
          ? `职业限制: ${allowedClassesStr} (当前: ${this.getClassDisplayName(characterClass)})`
          : `仅限 ${allowedClassesStr} 职业，当前职业: ${this.getClassDisplayName(characterClass)}`;
        break;
      }

      default: {
        // 未知需求类型
        detail.description = `未知需求类型: ${req.type}`;
        gameLog.warn('agent', `Unknown requirement type encountered: ${req.type}`, {
          requirement: req,
        });
        break;
      }
    }

    return detail;
  }

  /**
   * 获取属性显示名称
   */
  private getAttributeDisplayName(attrName: string): string {
    const attrNames: Record<string, string> = {
      strength: '力量',
      dexterity: '敏捷',
      constitution: '体质',
      intelligence: '智力',
      wisdom: '感知',
      charisma: '魅力',
      // 衍生属性
      critRate: '暴击率',
      critDamage: '暴击伤害',
      evasion: '闪避',
      accuracy: '命中',
    };
    return attrNames[attrName] ?? attrName;
  }

  /**
   * 获取职业显示名称
   */
  private getClassDisplayName(className: string): string {
    const classNames: Record<string, string> = {
      warrior: '战士',
      mage: '法师',
      rogue: '盗贼',
      priest: '牧师',
      ranger: '游侠',
      paladin: '圣骑士',
      necromancer: '死灵法师',
      bard: '吟游诗人',
      monk: '武僧',
      druid: '德鲁伊',
    };
    return classNames[className.toLowerCase()] ?? className;
  }

  /**
   * 获取需求描述
   */
  private getRequirementDescription(req: SkillRequirement): string {
    switch (req.type) {
      case 'level':
        return `等级 ${req.value}`;
      case 'attribute':
        return `属性 ${req.value}`;
      case 'skill': {
        const skillId = String(req.value);
        const skill = this.skills.get(skillId);
        return `技能 ${skill?.name ?? skillId}`;
      }
      case 'item':
        return `物品 ${req.value}`;
      case 'class':
        return `职业 ${req.value}`;
      default:
        return `未知需求`;
    }
  }

  /**
   * 计算技能效果详情
   * 调用 NUMERICAL agent 进行详细计算
   */
  private async calculateSkillEffectDetailed(
    skill: ExtendedSkill,
    _params: SkillUseParams,
    characterData?: {
      level: number;
      baseAttributes: Record<string, number>;
      derivedAttributes: Record<string, number>;
      class?: string;
    }
  ): Promise<SkillEffectResult['effects']> {
    const effects: SkillEffectResult['effects'] = [];

    for (const effect of skill.effects) {
      // 基础效果值
      let value = effect.value;

      // 应用等级加成
      value = Math.floor(value * (1 + (skill.level - 1) * 0.1));

      // 如果有角色数据，进行属性加成计算
      if (characterData) {
        value = this.applyAttributeBonus(effect.type, value, characterData);
      }

      // 计算暴击（简化处理，实际应该调用 NUMERICAL agent）
      const critRate = characterData?.derivedAttributes?.['critRate'] ?? 5;
      const critDamage = 150; // 默认暴击伤害倍率
      const isCritical = Math.random() * 100 < critRate;
      if (isCritical) {
        value = Math.floor(value * (critDamage / 100));
      }

      effects.push({
        type: effect.type,
        value: effect.value,
        actualValue: value,
        isCritical,
        isBlocked: false,
        isResisted: false,
      });
    }

    return effects;
  }

  /**
   * 应用属性加成
   */
  private applyAttributeBonus(
    effectType: string,
    baseValue: number,
    characterData: {
      level: number;
      baseAttributes: Record<string, number>;
      derivedAttributes: Record<string, number>;
      class?: string;
    }
  ): number {
    let value = baseValue;

    switch (effectType) {
      case 'damage':
      case 'physical_damage':
        // 物理伤害受力量加成
        value += Math.floor((characterData.baseAttributes['strength'] ?? 10) * 0.5);
        break;

      case 'magic_damage':
      case 'damage': // 魔法伤害
        // 魔法伤害受智力加成
        value += Math.floor((characterData.baseAttributes['intelligence'] ?? 10) * 0.5);
        break;

      case 'healing':
        // 治疗受智力和感知加成
        value += Math.floor(
          (characterData.baseAttributes['intelligence'] ?? 10) * 0.3 +
          (characterData.baseAttributes['wisdom'] ?? 10) * 0.2
        );
        break;

      case 'defense_boost':
      case 'shield':
        // 防御类效果受体质加成
        value += Math.floor((characterData.baseAttributes['constitution'] ?? 10) * 0.3);
        break;

      default:
        // 默认不额外加成
        break;
    }

    return value;
  }
}

export default SkillAgent;
