import { BaseRepository, BaseEntity } from './BaseRepository';
import {
  StoryTemplate,
  WorldSetting,
  CharacterCreationRules,
  GameRules,
  AIConstraints,
  StartingScene,
  UITheme,
  UILayout,
  SpecialRules,
} from '@ai-rpg/shared';

/**
 * 数据库中的模板记录结构（使用 snake_case 字段名）
 */
export interface TemplateRecord extends BaseEntity {
  name: string;
  description: string;
  version: string;
  author: string;
  tags: string; // JSON string
  game_mode: StoryTemplate['gameMode'];
  world_setting: string; // JSON string
  character_creation: string; // JSON string
  game_rules: string; // JSON string
  ai_constraints: string; // JSON string
  starting_scene: string; // JSON string
  ui_theme: string; // JSON string
  is_builtin: number; // 0 or 1
}

/**
 * 模板仓库类
 * 负责模板的数据库 CRUD 操作
 */
export class TemplateRepository extends BaseRepository<TemplateRecord> {
  constructor() {
    super('templates');
  }

  /**
   * 将数据库记录转换为 StoryTemplate 类型
   */
  private recordToTemplate(record: TemplateRecord): StoryTemplate {
    return {
      id: record.id,
      name: record.name,
      description: record.description,
      version: record.version,
      author: record.author,
      tags: this.parseJSON<string[]>(record.tags, []),
      gameMode: record.game_mode,
      worldSetting: this.parseJSON<WorldSetting>(record.world_setting, this.getDefaultWorldSetting()),
      characterCreation: this.parseJSON<CharacterCreationRules>(record.character_creation, this.getDefaultCharacterCreation()),
      gameRules: this.parseJSON<GameRules>(record.game_rules, this.getDefaultGameRules()),
      aiConstraints: this.parseJSON<AIConstraints>(record.ai_constraints, this.getDefaultAIConstraints()),
      startingScene: this.parseJSON<StartingScene>(record.starting_scene, this.getDefaultStartingScene()),
      uiTheme: this.parseJSON<UITheme>(record.ui_theme, this.getDefaultUITheme()),
      uiLayout: this.getDefaultUILayout(),
      numericalComplexity: 'medium',
      specialRules: this.getDefaultSpecialRules(),
    };
  }

  /**
   * 安全解析 JSON
   */
  private parseJSON<T>(jsonString: string, defaultValue: T): T {
    try {
      return JSON.parse(jsonString) as T;
    } catch {
      return defaultValue;
    }
  }

  /**
   * 创建新模板
   */
  public create(template: Omit<StoryTemplate, 'id'>): StoryTemplate {
    const id = this.generateId();
    const now = Math.floor(Date.now() / 1000);

    const stmt = this.db.prepare(`
      INSERT INTO templates (
        id, name, description, version, author, tags, game_mode,
        world_setting, character_creation, game_rules, ai_constraints,
        starting_scene, ui_theme, is_builtin, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      template.name,
      template.description,
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
      0, // is_builtin = false
      now,
      now
    );

    return this.getById(id)!;
  }

  /**
   * 根据 ID 获取模板
   */
  public getById(id: string): StoryTemplate | null {
    const record = this.findById(id);
    if (!record) {
      return null;
    }
    return this.recordToTemplate(record);
  }

  /**
   * 获取所有模板（支持分页）
   */
  public getAll(limit?: number, offset?: number): StoryTemplate[] {
    let query = 'SELECT * FROM templates ORDER BY created_at DESC';
    const params: unknown[] = [];

    if (limit !== undefined) {
      query += ' LIMIT ?';
      params.push(limit);

      if (offset !== undefined) {
        query += ' OFFSET ?';
        params.push(offset);
      }
    }

    const stmt = this.db.prepare<TemplateRecord>(query);
    const records = stmt.all(...params);
    return records.map(record => this.recordToTemplate(record));
  }

  /**
   * 更新模板
   */
  public update(id: string, template: Partial<Omit<StoryTemplate, 'id' | 'created_at'>>): StoryTemplate | null {
    const fields: string[] = [];
    const values: unknown[] = [];

    if (template.name !== undefined) {
      fields.push('name = ?');
      values.push(template.name);
    }
    if (template.description !== undefined) {
      fields.push('description = ?');
      values.push(template.description);
    }
    if (template.version !== undefined) {
      fields.push('version = ?');
      values.push(template.version);
    }
    if (template.author !== undefined) {
      fields.push('author = ?');
      values.push(template.author);
    }
    if (template.tags !== undefined) {
      fields.push('tags = ?');
      values.push(JSON.stringify(template.tags));
    }
    if (template.gameMode !== undefined) {
      fields.push('game_mode = ?');
      values.push(template.gameMode);
    }
    if (template.worldSetting !== undefined) {
      fields.push('world_setting = ?');
      values.push(JSON.stringify(template.worldSetting));
    }
    if (template.characterCreation !== undefined) {
      fields.push('character_creation = ?');
      values.push(JSON.stringify(template.characterCreation));
    }
    if (template.gameRules !== undefined) {
      fields.push('game_rules = ?');
      values.push(JSON.stringify(template.gameRules));
    }
    if (template.aiConstraints !== undefined) {
      fields.push('ai_constraints = ?');
      values.push(JSON.stringify(template.aiConstraints));
    }
    if (template.startingScene !== undefined) {
      fields.push('starting_scene = ?');
      values.push(JSON.stringify(template.startingScene));
    }

    if (fields.length === 0) {
      return this.getById(id);
    }

    fields.push("updated_at = strftime('%s', 'now')");
    values.push(id);

    const stmt = this.db.prepare(`UPDATE templates SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...values);

    return this.getById(id);
  }

  /**
   * 删除模板
   */
  public delete(id: string): boolean {
    return this.deleteById(id);
  }

  /**
   * 检查模板是否存在
   */
  public exists(id: string): boolean {
    return super.exists(id);
  }

  /**
   * 根据游戏模式获取模板
   */
  public findByGameMode(gameMode: StoryTemplate['gameMode']): StoryTemplate[] {
    const stmt = this.db.prepare<TemplateRecord>(
      'SELECT * FROM templates WHERE game_mode = ? ORDER BY created_at DESC'
    );
    const records = stmt.all(gameMode);
    return records.map(record => this.recordToTemplate(record));
  }

  /**
   * 获取内置模板
   */
  public findBuiltIn(): StoryTemplate[] {
    const stmt = this.db.prepare<TemplateRecord>(
      'SELECT * FROM templates WHERE is_builtin = 1 ORDER BY created_at DESC'
    );
    const records = stmt.all();
    return records.map(record => this.recordToTemplate(record));
  }

  /**
   * 根据标签搜索模板
   */
  public findByTag(tag: string): StoryTemplate[] {
    const stmt = this.db.prepare<TemplateRecord>(
      "SELECT * FROM templates WHERE tags LIKE ? ORDER BY created_at DESC"
    );
    const records = stmt.all(`%"${tag}"%`);
    return records.map(record => this.recordToTemplate(record));
  }

  /**
   * 分页查询模板
   */
  public findWithPagination(options: {
    page?: number;
    limit?: number;
    gameMode?: StoryTemplate['gameMode'];
    isBuiltIn?: boolean;
  }): { templates: StoryTemplate[]; total: number; page: number; limit: number; totalPages: number } {
    const page = Math.max(1, options.page || 1);
    const limit = Math.max(1, Math.min(100, options.limit || 10));
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (options.gameMode !== undefined) {
      conditions.push('game_mode = ?');
      params.push(options.gameMode);
    }

    if (options.isBuiltIn !== undefined) {
      conditions.push('is_builtin = ?');
      params.push(options.isBuiltIn ? 1 : 0);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // 获取总数
    const countStmt = this.db.prepare<{ count: number }>(
      `SELECT COUNT(*) as count FROM templates ${whereClause}`
    );
    const countResult = countStmt.get(...params);
    const total = countResult?.count || 0;

    // 获取分页数据
    const dataStmt = this.db.prepare<TemplateRecord>(
      `SELECT * FROM templates ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`
    );
    const records = dataStmt.all(...params, limit, offset);

    return {
      templates: records.map(record => this.recordToTemplate(record)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 获取模板统计信息
   */
  public getStats(): {
    total: number;
    builtIn: number;
    custom: number;
    byGameMode: Record<string, number>;
  } {
    // 获取总数
    const totalStmt = this.db.prepare<{ count: number }>('SELECT COUNT(*) as count FROM templates');
    const totalResult = totalStmt.get();
    const total = totalResult?.count || 0;

    // 获取内置模板数量
    const builtInStmt = this.db.prepare<{ count: number }>(
      'SELECT COUNT(*) as count FROM templates WHERE is_builtin = 1'
    );
    const builtInResult = builtInStmt.get();
    const builtIn = builtInResult?.count || 0;

    // 按 game_mode 分组统计
    const byGameModeStmt = this.db.prepare<{ game_mode: string; count: number }>(
      'SELECT game_mode, COUNT(*) as count FROM templates GROUP BY game_mode'
    );
    const byGameModeRows = byGameModeStmt.all();
    const byGameMode: Record<string, number> = {};
    for (const row of byGameModeRows) {
      byGameMode[row.game_mode] = row.count;
    }

    return {
      total,
      builtIn,
      custom: total - builtIn,
      byGameMode,
    };
  }

  // 默认值辅助方法
  private getDefaultWorldSetting(): WorldSetting {
    return {
      name: '',
      description: '',
      era: '',
      technologyLevel: '',
      customFields: {},
    };
  }

  private getDefaultCharacterCreation(): CharacterCreationRules {
    return {
      races: [],
      classes: [],
      backgrounds: [],
      attributes: [],
    };
  }

  private getDefaultGameRules(): GameRules {
    return {
      combatSystem: {
        type: 'turn_based',
        initiativeType: 'dexterity',
        actionPoints: 1,
        criticalHit: { threshold: 20, multiplier: 2 },
      },
      skillSystem: {
        maxLevel: 10,
        upgradeCost: { base: 100, multiplier: 1.5 },
        cooldownSystem: 'none',
      },
      inventorySystem: {
        maxSlots: 20,
        stackSizes: {},
        weightSystem: false,
      },
      questSystem: {
        maxActive: 5,
        failConditions: [],
        timeSystem: false,
      },
    };
  }

  private getDefaultAIConstraints(): AIConstraints {
    return {
      tone: 'serious',
      contentRating: 'teen',
      prohibitedTopics: [],
      requiredElements: [],
      aiBehavior: {
        responseStyle: 'narrative',
        detailLevel: 'normal',
        playerAgency: 'balanced',
      },
    };
  }

  private getDefaultStartingScene(): StartingScene {
    return {
      location: '',
      description: '',
      npcs: [],
      items: [],
      quests: [],
    };
  }

  private getDefaultUITheme(): UITheme {
    return {
      primaryColor: '#4a90d9',
      fontFamily: 'Arial, sans-serif',
      backgroundStyle: 'dark',
    };
  }

  private getDefaultUILayout(): UILayout {
    return {
      showMinimap: false,
      showCombatPanel: true,
      showSkillBar: true,
      showPartyPanel: false,
    };
  }

  private getDefaultSpecialRules(): SpecialRules {
    return {
      hasKP: false,
      permadeath: false,
      saveRestriction: '',
      customRules: [],
    };
  }
}

// 单例模式
let _templateRepository: TemplateRepository | null = null;

/**
 * 获取模板仓库单例
 */
export function getTemplateRepository(): TemplateRepository {
  if (!_templateRepository) {
    _templateRepository = new TemplateRepository();
  }
  return _templateRepository;
}

/**
 * 便捷导出的模板仓库对象
 */
export const templateRepository = {
  get instance() {
    return getTemplateRepository();
  },
  create: (template: Parameters<TemplateRepository['create']>[0]) =>
    getTemplateRepository().create(template),
  getById: (id: string) => getTemplateRepository().getById(id),
  getAll: (limit?: number, offset?: number) => getTemplateRepository().getAll(limit, offset),
  update: (id: string, template: Parameters<TemplateRepository['update']>[1]) =>
    getTemplateRepository().update(id, template),
  delete: (id: string) => getTemplateRepository().delete(id),
  exists: (id: string) => getTemplateRepository().exists(id),
  findByGameMode: (gameMode: StoryTemplate['gameMode']) =>
    getTemplateRepository().findByGameMode(gameMode),
  findBuiltIn: () => getTemplateRepository().findBuiltIn(),
  findByTag: (tag: string) => getTemplateRepository().findByTag(tag),
  findWithPagination: (options: Parameters<TemplateRepository['findWithPagination']>[0]) =>
    getTemplateRepository().findWithPagination(options),
  getStats: () => getTemplateRepository().getStats(),
};
