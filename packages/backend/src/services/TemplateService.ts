import { TemplateRepository, getTemplateRepository } from '../models/TemplateRepository';
import type { StoryTemplate } from '@ai-rpg/shared';

/**
 * 有效的游戏模式列表
 */
const VALID_GAME_MODES: StoryTemplate['gameMode'][] = [
  'text_adventure',
  'turn_based_rpg',
  'visual_novel',
  'dynamic_combat',
];

/**
 * 模板创建/更新时的输入类型（不包含 id）
 */
export type CreateTemplateInput = Omit<StoryTemplate, 'id'>;

/**
 * 模板更新时的输入类型（部分字段）
 */
export type UpdateTemplateInput = Partial<CreateTemplateInput>;

/**
 * 分页查询选项
 */
export interface GetTemplatesOptions {
  limit?: number;
  offset?: number;
  gameMode?: string;
}

/**
 * 分页查询结果
 */
export interface GetTemplatesResult {
  templates: StoryTemplate[];
  total: number;
}

/**
 * 预设模板定义
 */
const PRESET_TEMPLATES: CreateTemplateInput[] = [
  {
    name: '中世纪奇幻冒险',
    description: '经典的中世纪奇幻世界，包含魔法、剑与龙的冒险故事',
    version: '1.0.0',
    author: 'AI-RPG Engine',
    tags: ['奇幻', '冒险', 'RPG', '魔法'],
    gameMode: 'turn_based_rpg',
    worldSetting: {
      name: '艾尔德兰大陆',
      description: '一个充满魔法与奇迹的大陆',
      era: '中世纪',
      magicSystem: '元素魔法',
      technologyLevel: '中世纪',
      customFields: {},
    },
    characterCreation: {
      races: [
        { id: 'human', name: '人类', description: '多才多艺的人类', bonuses: { strength: 1, intelligence: 1 }, penalties: {}, abilities: [], availableClasses: [] },
        { id: 'elf', name: '精灵', description: '优雅的精灵族', bonuses: { dexterity: 2, wisdom: 1 }, penalties: {}, abilities: [], availableClasses: [] },
        { id: 'dwarf', name: '矮人', description: '坚韧的矮人族', bonuses: { constitution: 2, strength: 1 }, penalties: {}, abilities: [], availableClasses: [] },
      ],
      classes: [
        { id: 'warrior', name: '战士', description: '近战专家', primaryAttributes: ['strength', 'constitution'], hitDie: 'd10', skillProficiencies: [], startingEquipment: [] },
        { id: 'mage', name: '法师', description: '魔法使用者', primaryAttributes: ['intelligence', 'wisdom'], hitDie: 'd6', skillProficiencies: [], startingEquipment: [] },
        { id: 'rogue', name: '盗贼', description: '敏捷的潜行者', primaryAttributes: ['dexterity', 'luck'], hitDie: 'd8', skillProficiencies: [], startingEquipment: [] },
      ],
      backgrounds: [],
      attributes: [],
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
        cooldownSystem: 'none',
      },
      inventorySystem: {
        maxSlots: 50,
        stackSizes: {},
        weightSystem: false,
      },
      questSystem: {
        maxActive: 5,
        failConditions: [],
        timeSystem: false,
      },
    },
    aiConstraints: {
      tone: 'serious',
      contentRating: 'teen',
      prohibitedTopics: [],
      requiredElements: [],
    },
    startingScene: {
      location: '新手村',
      description: '你在一个宁静的小村庄醒来...',
      npcs: [],
      items: [],
      quests: [],
    },
  },
  {
    name: '现代都市恋爱',
    description: '现代都市背景的恋爱模拟故事',
    version: '1.0.0',
    author: 'AI-RPG Engine',
    tags: ['恋爱', '都市', '视觉小说', '现代'],
    gameMode: 'visual_novel',
    worldSetting: {
      name: '星城市',
      description: '一个繁华的现代都市',
      era: '现代',
      technologyLevel: '现代',
      customFields: {},
    },
    characterCreation: {
      races: [{ id: 'human', name: '人类', description: '普通人类', bonuses: {}, penalties: {}, abilities: [], availableClasses: [] }],
      classes: [
        { id: 'student', name: '学生', description: '在校学生', primaryAttributes: [], hitDie: 'd6', skillProficiencies: [], startingEquipment: [] },
        { id: 'office_worker', name: '上班族', description: '公司职员', primaryAttributes: [], hitDie: 'd6', skillProficiencies: [], startingEquipment: [] },
        { id: 'freelancer', name: '自由职业者', description: '自由工作者', primaryAttributes: [], hitDie: 'd6', skillProficiencies: [], startingEquipment: [] },
      ],
      backgrounds: [],
      attributes: [],
    },
    gameRules: {
      combatSystem: {
        type: 'turn_based',
        initiativeType: 'random',
        actionPoints: 1,
        criticalHit: { threshold: 20, multiplier: 2 },
      },
      skillSystem: {
        maxLevel: 5,
        upgradeCost: { base: 50, multiplier: 1.2 },
        cooldownSystem: 'none',
      },
      inventorySystem: {
        maxSlots: 20,
        stackSizes: {},
        weightSystem: false,
      },
      questSystem: {
        maxActive: 3,
        failConditions: [],
        timeSystem: false,
      },
    },
    aiConstraints: {
      tone: 'romantic',
      contentRating: 'teen',
      prohibitedTopics: [],
      requiredElements: [],
    },
    startingScene: {
      location: '咖啡厅',
      description: '一个阳光明媚的下午，你在咖啡厅里...',
      npcs: [],
      items: [],
      quests: [],
    },
  },
  {
    name: '克苏鲁恐怖调查',
    description: '克苏鲁神话背景的恐怖调查故事',
    version: '1.0.0',
    author: 'AI-RPG Engine',
    tags: ['恐怖', '悬疑', '克苏鲁', '调查'],
    gameMode: 'text_adventure',
    worldSetting: {
      name: '阿卡姆镇',
      description: '一个充满神秘事件的小镇',
      era: '1920年代',
      technologyLevel: '工业时代',
      customFields: {},
    },
    characterCreation: {
      races: [{ id: 'human', name: '人类', description: '普通人类', bonuses: {}, penalties: {}, abilities: [], availableClasses: [] }],
      classes: [
        { id: 'detective', name: '侦探', description: '调查专家', primaryAttributes: [], hitDie: 'd8', skillProficiencies: [], startingEquipment: [] },
        { id: 'journalist', name: '记者', description: '新闻工作者', primaryAttributes: [], hitDie: 'd6', skillProficiencies: [], startingEquipment: [] },
        { id: 'scholar', name: '学者', description: '知识研究者', primaryAttributes: [], hitDie: 'd6', skillProficiencies: [], startingEquipment: [] },
      ],
      backgrounds: [],
      attributes: [],
    },
    gameRules: {
      combatSystem: {
        type: 'turn_based',
        initiativeType: 'dexterity',
        actionPoints: 2,
        criticalHit: { threshold: 20, multiplier: 1.5 },
      },
      skillSystem: {
        maxLevel: 10,
        upgradeCost: { base: 100, multiplier: 1.5 },
        cooldownSystem: 'none',
      },
      inventorySystem: {
        maxSlots: 30,
        stackSizes: {},
        weightSystem: false,
      },
      questSystem: {
        maxActive: 3,
        failConditions: [],
        timeSystem: false,
      },
    },
    aiConstraints: {
      tone: 'dark',
      contentRating: 'mature',
      prohibitedTopics: [],
      requiredElements: [],
    },
    startingScene: {
      location: '阿卡姆图书馆',
      description: '你收到了一封神秘的信件...',
      npcs: [],
      items: [],
      quests: [],
    },
  },
  {
    name: '赛博朋克佣兵',
    description: '赛博朋克风格的未来都市冒险',
    version: '1.0.0',
    author: 'AI-RPG Engine',
    tags: ['赛博朋克', '科幻', '动作', '未来'],
    gameMode: 'dynamic_combat',
    worldSetting: {
      name: '新东京',
      description: '一个高科技与低生活并存的未来都市',
      era: '2077年',
      technologyLevel: '赛博朋克',
      customFields: {},
    },
    characterCreation: {
      races: [
        { id: 'human', name: '自然人', description: '未改造的人类', bonuses: {}, penalties: {}, abilities: [], availableClasses: [] },
        { id: 'augmented', name: '改造人', description: '经过义体改造的人类', bonuses: {}, penalties: {}, abilities: [], availableClasses: [] },
        { id: 'android', name: '仿生人', description: '人工智能驱动的机器人', bonuses: {}, penalties: {}, abilities: [], availableClasses: [] },
      ],
      classes: [
        { id: 'hacker', name: '黑客', description: '网络入侵专家', primaryAttributes: [], hitDie: 'd6', skillProficiencies: [], startingEquipment: [] },
        { id: 'mercenary', name: '佣兵', description: '战斗专家', primaryAttributes: [], hitDie: 'd10', skillProficiencies: [], startingEquipment: [] },
        { id: 'medic', name: '医生', description: '医疗支援专家', primaryAttributes: [], hitDie: 'd8', skillProficiencies: [], startingEquipment: [] },
      ],
      backgrounds: [],
      attributes: [],
    },
    gameRules: {
      combatSystem: {
        type: 'real_time',
        initiativeType: 'random',
        actionPoints: 2,
        criticalHit: { threshold: 20, multiplier: 2 },
      },
      skillSystem: {
        maxLevel: 15,
        upgradeCost: { base: 150, multiplier: 1.6 },
        cooldownSystem: 'turn',
      },
      inventorySystem: {
        maxSlots: 40,
        stackSizes: {},
        weightSystem: false,
      },
      questSystem: {
        maxActive: 5,
        failConditions: [],
        timeSystem: true,
      },
    },
    aiConstraints: {
      tone: 'serious',
      contentRating: 'mature',
      prohibitedTopics: [],
      requiredElements: [],
    },
    startingScene: {
      location: '地下酒吧',
      description: '霓虹灯闪烁的地下酒吧里，一个神秘人走向你...',
      npcs: [],
      items: [],
      quests: [],
    },
  },
];

/**
 * 模板服务类
 * 负责模板的业务逻辑处理
 */
export class TemplateService {
  private repository: TemplateRepository;

  constructor() {
    this.repository = getTemplateRepository();
  }

  /**
   * 获取模板列表（支持分页和过滤）
   */
  public async getTemplates(options?: GetTemplatesOptions): Promise<GetTemplatesResult> {
    const limit = options?.limit ?? 10;
    const offset = options?.offset ?? 0;
    const gameMode = options?.gameMode;

    // 验证 gameMode
    if (gameMode !== undefined && !this.isValidGameMode(gameMode)) {
      throw new Error(`无效的游戏模式: ${gameMode}。有效模式: ${VALID_GAME_MODES.join(', ')}`);
    }

    const result = this.repository.findWithPagination({
      page: Math.floor(offset / limit) + 1,
      limit,
      gameMode: gameMode as StoryTemplate['gameMode'] | undefined,
    });

    return {
      templates: result.templates,
      total: result.total,
    };
  }

  /**
   * 根据 ID 获取单个模板
   */
  public async getTemplateById(id: string): Promise<StoryTemplate | null> {
    if (!id || typeof id !== 'string') {
      throw new Error('模板 ID 不能为空');
    }

    return this.repository.getById(id);
  }

  /**
   * 创建新模板
   */
  public async createTemplate(template: CreateTemplateInput): Promise<StoryTemplate> {
    // 验证必填字段
    this.validateTemplate(template);

    // 创建模板
    return this.repository.create(template);
  }

  /**
   * 更新模板
   */
  public async updateTemplate(id: string, template: UpdateTemplateInput): Promise<StoryTemplate | null> {
    if (!id || typeof id !== 'string') {
      throw new Error('模板 ID 不能为空');
    }

    // 检查模板是否存在
    const existingTemplate = this.repository.getById(id);
    if (!existingTemplate) {
      throw new Error(`模板不存在: ${id}`);
    }

    // 如果提供了 gameMode，验证其有效性
    if (template.gameMode !== undefined && !this.isValidGameMode(template.gameMode)) {
      throw new Error(`无效的游戏模式: ${template.gameMode}。有效模式: ${VALID_GAME_MODES.join(', ')}`);
    }

    // 如果提供了 name，验证其不为空
    if (template.name !== undefined && !template.name.trim()) {
      throw new Error('模板名称不能为空');
    }

    return this.repository.update(id, template);
  }

  /**
   * 删除模板
   * 注意：内置模板不能被删除
   */
  public async deleteTemplate(id: string): Promise<boolean> {
    if (!id || typeof id !== 'string') {
      throw new Error('模板 ID 不能为空');
    }

    // 检查模板是否存在
    const existingTemplate = this.repository.getById(id);
    if (!existingTemplate) {
      throw new Error(`模板不存在: ${id}`);
    }

    // 检查是否为内置模板
    const record = this.repository.findById(id);
    if (record && record.is_builtin === 1) {
      throw new Error('无法删除内置模板');
    }

    return this.repository.delete(id);
  }

  /**
   * 初始化预设模板
   * 如果模板已存在则跳过
   */
  public async initializePresetTemplates(): Promise<void> {
    const existingTemplates = this.repository.findBuiltIn();
    const existingNames = new Set(existingTemplates.map(t => t.name));

    for (const preset of PRESET_TEMPLATES) {
      // 如果已存在同名模板，跳过
      if (existingNames.has(preset.name)) {
        continue;
      }

      try {
        // 创建内置模板（需要直接插入数据库，设置 is_builtin = 1）
        this.createBuiltInTemplate(preset);
      } catch (error) {
        console.error(`初始化预设模板失败: ${preset.name}`, error);
      }
    }
  }

  /**
   * 验证模板数据
   */
  private validateTemplate(template: CreateTemplateInput): void {
    // 验证名称
    if (!template.name || typeof template.name !== 'string' || !template.name.trim()) {
      throw new Error('模板名称是必填项');
    }

    // 验证游戏模式
    if (!template.gameMode) {
      throw new Error('游戏模式是必填项');
    }

    if (!this.isValidGameMode(template.gameMode)) {
      throw new Error(`无效的游戏模式: ${template.gameMode}。有效模式: ${VALID_GAME_MODES.join(', ')}`);
    }
  }

  /**
   * 检查游戏模式是否有效
   */
  private isValidGameMode(gameMode: string): boolean {
    return VALID_GAME_MODES.includes(gameMode as StoryTemplate['gameMode']);
  }

  /**
   * 创建内置模板（直接设置 is_builtin 标志）
   */
  private createBuiltInTemplate(template: CreateTemplateInput): StoryTemplate {
    const id = `preset-${template.name.toLowerCase().replace(/\s+/g, '-')}`;
    const now = Math.floor(Date.now() / 1000);

    const stmt = this.repository['db'].prepare(`
      INSERT INTO templates (
        id, name, description, version, author, tags, game_mode,
        world_setting, character_creation, game_rules, ai_constraints,
        starting_scene, ui_theme, is_builtin, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      template.name,
      template.description ?? '',
      template.version ?? '1.0.0',
      template.author ?? 'AI-RPG Engine',
      JSON.stringify(template.tags ?? []),
      template.gameMode,
      JSON.stringify(template.worldSetting ?? {}),
      JSON.stringify(template.characterCreation ?? {}),
      JSON.stringify(template.gameRules ?? {}),
      JSON.stringify(template.aiConstraints ?? {}),
      JSON.stringify(template.startingScene ?? {}),
      JSON.stringify({}),
      1, // is_builtin = true
      now,
      now
    );

    return this.repository.getById(id)!;
  }
}

// 单例实例
let _templateService: TemplateService | null = null;

/**
 * 获取模板服务单例
 */
export function getTemplateService(): TemplateService {
  if (!_templateService) {
    _templateService = new TemplateService();
  }
  return _templateService;
}

/**
 * 初始化模板服务
 */
export function initializeTemplateService(): TemplateService {
  return getTemplateService();
}

/**
 * 便捷导出的模板服务对象
 */
export const templateService = {
  get instance() {
    return getTemplateService();
  },
  getTemplates: (options?: GetTemplatesOptions) => getTemplateService().getTemplates(options),
  getTemplateById: (id: string) => getTemplateService().getTemplateById(id),
  createTemplate: (template: CreateTemplateInput) => getTemplateService().createTemplate(template),
  updateTemplate: (id: string, template: UpdateTemplateInput) => getTemplateService().updateTemplate(id, template),
  deleteTemplate: (id: string) => getTemplateService().deleteTemplate(id),
  initializePresetTemplates: () => getTemplateService().initializePresetTemplates(),
};
