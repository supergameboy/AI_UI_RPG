import { BaseRepository, BaseEntity } from './BaseRepository';
import type {
  ExtendedSkill,
  SkillTemplate,
  SkillCooldownState,
  SkillCategory,
  SkillType,
} from '@ai-rpg/shared';

// ==================== 数据库实体类型 ====================

/**
 * 技能数据库实体
 */
export interface SkillEntity extends BaseEntity {
  character_id: string;
  skill_id: string;
  name: string;
  type: SkillType;
  category: SkillCategory;
  level: number;
  max_level: number;
  cooldown: number;
  costs: string; // JSON
  effects: string; // JSON
  requirements: string; // JSON
  target_type: string;
  range: string; // JSON
  cast_time: number | null;
  channel_time: number | null;
  is_toggle_on: number; // SQLite 不支持 boolean，使用 0/1
  tags: string; // JSON
  unlocked: number; // SQLite 不支持 boolean，使用 0/1
  custom_data: string; // JSON
  created_at: number;
  updated_at: number;
}

/**
 * 技能模板数据库实体
 */
export interface SkillTemplateEntity extends BaseEntity {
  name: string;
  description: string;
  type: SkillType;
  category: SkillCategory;
  base_costs: string; // JSON
  base_cooldown: number;
  base_effects: string; // JSON
  requirements: string; // JSON
  max_level: number;
  scaling_per_level: string; // JSON
  created_at: number;
  updated_at: number;
}

/**
 * 技能冷却数据库实体
 */
export interface SkillCooldownEntity extends BaseEntity {
  character_id: string;
  skill_id: string;
  remaining_turns: number;
  total_cooldown: number;
  last_used_at: number;
  created_at: number;
  updated_at: number;
}

/**
 * 角色技能关联实体
 */
export interface CharacterSkillEntity extends BaseEntity {
  character_id: string;
  skill_id: string;
  learned_at: number;
  source: string;
  created_at: number;
}

// ==================== 技能仓库 ====================

export class SkillRepository extends BaseRepository<SkillEntity> {
  constructor() {
    super('skills');
  }

  // ==================== 技能 CRUD ====================

  /**
   * 创建技能
   */
  public createSkill(data: Omit<ExtendedSkill, 'id'> & { characterId: string }): SkillEntity {
    const id = this.generateId();
    const now = Math.floor(Date.now() / 1000);

    const stmt = this.db.prepare(`
      INSERT INTO skills (
        id, character_id, skill_id, name, type, category, level, max_level,
        cooldown, costs, effects, requirements, target_type, range,
        cast_time, channel_time, is_toggle_on, tags, unlocked, custom_data,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      data.characterId,
      data.id, // skill_id 存储原始技能ID
      data.name,
      data.type,
      data.category,
      data.level,
      data.maxLevel,
      data.cooldown,
      JSON.stringify(data.costs),
      JSON.stringify(data.effects),
      JSON.stringify(data.requirements),
      data.targetType,
      JSON.stringify(data.range || null),
      data.castTime ?? null,
      data.channelTime ?? null,
      data.isToggleOn ? 1 : 0,
      JSON.stringify(data.tags || []),
      1, // unlocked
      '{}',
      now,
      now
    );

    return this.findById(id)!;
  }

  /**
   * 更新技能
   */
  public updateSkill(id: string, data: Partial<Omit<ExtendedSkill, 'id'>>): SkillEntity | undefined {
    const fields: string[] = [];
    const values: unknown[] = [];

    if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
    if (data.type !== undefined) { fields.push('type = ?'); values.push(data.type); }
    if (data.category !== undefined) { fields.push('category = ?'); values.push(data.category); }
    if (data.level !== undefined) { fields.push('level = ?'); values.push(data.level); }
    if (data.maxLevel !== undefined) { fields.push('max_level = ?'); values.push(data.maxLevel); }
    if (data.cooldown !== undefined) { fields.push('cooldown = ?'); values.push(data.cooldown); }
    if (data.costs !== undefined) { fields.push('costs = ?'); values.push(JSON.stringify(data.costs)); }
    if (data.effects !== undefined) { fields.push('effects = ?'); values.push(JSON.stringify(data.effects)); }
    if (data.requirements !== undefined) { fields.push('requirements = ?'); values.push(JSON.stringify(data.requirements)); }
    if (data.targetType !== undefined) { fields.push('target_type = ?'); values.push(data.targetType); }
    if (data.range !== undefined) { fields.push('range = ?'); values.push(JSON.stringify(data.range)); }
    if (data.castTime !== undefined) { fields.push('cast_time = ?'); values.push(data.castTime); }
    if (data.channelTime !== undefined) { fields.push('channel_time = ?'); values.push(data.channelTime); }
    if (data.isToggleOn !== undefined) { fields.push('is_toggle_on = ?'); values.push(data.isToggleOn ? 1 : 0); }
    if (data.tags !== undefined) { fields.push('tags = ?'); values.push(JSON.stringify(data.tags)); }

    if (fields.length === 0) return this.findById(id);

    fields.push("updated_at = strftime('%s', 'now')");
    values.push(id);

    const stmt = this.db.prepare(`UPDATE skills SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...values);

    return this.findById(id);
  }

  /**
   * 按角色ID查找技能
   */
  public findByCharacterId(characterId: string): SkillEntity[] {
    const stmt = this.db.prepare<SkillEntity>(
      `SELECT * FROM skills WHERE character_id = ? ORDER BY created_at DESC`
    );
    return stmt.all(characterId);
  }

  /**
   * 按技能ID查找
   */
  public findBySkillId(skillId: string): SkillEntity[] {
    const stmt = this.db.prepare<SkillEntity>(
      `SELECT * FROM skills WHERE skill_id = ?`
    );
    return stmt.all(skillId);
  }

  /**
   * 按分类查找
   */
  public findByCategory(category: SkillCategory): SkillEntity[] {
    const stmt = this.db.prepare<SkillEntity>(
      `SELECT * FROM skills WHERE category = ? ORDER BY name`
    );
    return stmt.all(category);
  }

  /**
   * 按类型查找
   */
  public findByType(type: SkillType): SkillEntity[] {
    const stmt = this.db.prepare<SkillEntity>(
      `SELECT * FROM skills WHERE type = ? ORDER BY name`
    );
    return stmt.all(type);
  }

  /**
   * 按角色和技能ID查找
   */
  public findByCharacterAndSkillId(characterId: string, skillId: string): SkillEntity | undefined {
    const stmt = this.db.prepare<SkillEntity>(
      `SELECT * FROM skills WHERE character_id = ? AND skill_id = ?`
    );
    return stmt.get(characterId, skillId);
  }

  /**
   * 删除角色的所有技能
   */
  public deleteByCharacterId(characterId: string): number {
    const stmt = this.db.prepare(`DELETE FROM skills WHERE character_id = ?`);
    const result = stmt.run(characterId);
    return result.changes;
  }

  // ==================== 实体转换 ====================

  /**
   * 将数据库实体转换为业务对象
   */
  public toSkill(entity: SkillEntity): ExtendedSkill {
    return {
      id: entity.skill_id, // 使用原始技能ID
      name: entity.name,
      description: '', // 数据库中没有存储，需要从其他地方获取
      type: entity.type,
      category: entity.category,
      costs: JSON.parse(entity.costs || '[]'),
      cooldown: entity.cooldown,
      effects: JSON.parse(entity.effects || '[]'),
      requirements: JSON.parse(entity.requirements || '[]'),
      level: entity.level,
      maxLevel: entity.max_level,
      targetType: entity.target_type as ExtendedSkill['targetType'],
      range: entity.range ? JSON.parse(entity.range) : undefined,
      castTime: entity.cast_time ?? undefined,
      channelTime: entity.channel_time ?? undefined,
      isToggleOn: entity.is_toggle_on === 1,
      tags: JSON.parse(entity.tags || '[]'),
    };
  }

  // ==================== 统计 ====================

  /**
   * 获取技能统计
   */
  public getStatistics(): {
    total: number;
    byCategory: Record<string, number>;
    byType: Record<string, number>;
    maxLevelCount: number;
  } {
    const totalStmt = this.db.prepare<{ count: number }>('SELECT COUNT(*) as count FROM skills');
    const total = totalStmt.get()?.count || 0;

    const byCategoryStmt = this.db.prepare<{ category: string; count: number }>(
      'SELECT category, COUNT(*) as count FROM skills GROUP BY category'
    );
    const byCategoryRows = byCategoryStmt.all();
    const byCategory: Record<string, number> = {};
    for (const row of byCategoryRows) {
      byCategory[row.category] = row.count;
    }

    const byTypeStmt = this.db.prepare<{ type: string; count: number }>(
      'SELECT type, COUNT(*) as count FROM skills GROUP BY type'
    );
    const byTypeRows = byTypeStmt.all();
    const byType: Record<string, number> = {};
    for (const row of byTypeRows) {
      byType[row.type] = row.count;
    }

    const maxLevelStmt = this.db.prepare<{ count: number }>(
      'SELECT COUNT(*) as count FROM skills WHERE level >= max_level'
    );
    const maxLevelCount = maxLevelStmt.get()?.count || 0;

    return { total, byCategory, byType, maxLevelCount };
  }
}

// ==================== 技能模板仓库 ====================

export class SkillTemplateRepository extends BaseRepository<SkillTemplateEntity> {
  constructor() {
    super('skill_templates');
  }

  /**
   * 创建模板
   */
  public createTemplate(data: Omit<SkillTemplate, 'id'>): SkillTemplateEntity {
    const id = this.generateId();
    const now = Math.floor(Date.now() / 1000);

    // 检查表是否存在，如果不存在则创建
    this.ensureTableExists();

    const stmt = this.db.prepare(`
      INSERT INTO skill_templates (
        id, name, description, type, category, base_costs, base_cooldown,
        base_effects, requirements, max_level, scaling_per_level,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      data.name,
      data.description,
      data.type,
      data.category,
      JSON.stringify(data.baseCosts),
      data.baseCooldown,
      JSON.stringify(data.baseEffects),
      JSON.stringify(data.requirements),
      data.maxLevel,
      JSON.stringify(data.scalingPerLevel),
      now,
      now
    );

    return this.findById(id)!;
  }

  /**
   * 按名称查找模板
   */
  public findByName(name: string): SkillTemplateEntity | undefined {
    this.ensureTableExists();
    const stmt = this.db.prepare<SkillTemplateEntity>(
      `SELECT * FROM skill_templates WHERE name = ?`
    );
    return stmt.get(name);
  }

  /**
   * 按分类查找模板
   */
  public findByCategory(category: SkillCategory): SkillTemplateEntity[] {
    this.ensureTableExists();
    const stmt = this.db.prepare<SkillTemplateEntity>(
      `SELECT * FROM skill_templates WHERE category = ? ORDER BY name`
    );
    return stmt.all(category);
  }

  /**
   * 将数据库实体转换为业务对象
   */
  public toTemplate(entity: SkillTemplateEntity): SkillTemplate {
    return {
      id: entity.id,
      name: entity.name,
      description: entity.description,
      type: entity.type,
      category: entity.category,
      baseCosts: JSON.parse(entity.base_costs || '[]'),
      baseCooldown: entity.base_cooldown,
      baseEffects: JSON.parse(entity.base_effects || '[]'),
      requirements: JSON.parse(entity.requirements || '[]'),
      maxLevel: entity.max_level,
      scalingPerLevel: JSON.parse(entity.scaling_per_level || '{}'),
    };
  }

  /**
   * 确保表存在
   */
  private ensureTableExists(): void {
    const tableCheck = this.db.prepare<{ count: number }>(
      `SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name='skill_templates'`
    );
    const result = tableCheck.get();

    if (!result || result.count === 0) {
      this.db.prepare(`
        CREATE TABLE IF NOT EXISTS skill_templates (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          type TEXT NOT NULL,
          category TEXT NOT NULL,
          base_costs TEXT DEFAULT '[]',
          base_cooldown INTEGER DEFAULT 0,
          base_effects TEXT DEFAULT '[]',
          requirements TEXT DEFAULT '[]',
          max_level INTEGER DEFAULT 10,
          scaling_per_level TEXT DEFAULT '{}',
          created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
          updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
        )
      `).run();
    }
  }
}

// ==================== 技能冷却仓库 ====================

export class SkillCooldownRepository extends BaseRepository<SkillCooldownEntity> {
  constructor() {
    super('skill_cooldowns');
  }

  /**
   * 创建或更新冷却
   */
  public upsertCooldown(data: {
    characterId: string;
    skillId: string;
    remainingTurns: number;
    totalCooldown: number;
  }): SkillCooldownEntity {
    this.ensureTableExists();
    const id = this.generateId();
    const now = Math.floor(Date.now() / 1000);

    // 先尝试更新现有记录
    const existingStmt = this.db.prepare<SkillCooldownEntity>(
      `SELECT * FROM skill_cooldowns WHERE character_id = ? AND skill_id = ?`
    );
    const existing = existingStmt.get(data.characterId, data.skillId);

    if (existing) {
      const updateStmt = this.db.prepare(`
        UPDATE skill_cooldowns
        SET remaining_turns = ?, total_cooldown = ?, last_used_at = ?, updated_at = ?
        WHERE id = ?
      `);
      updateStmt.run(data.remainingTurns, data.totalCooldown, now, now, existing.id);
      return this.findById(existing.id)!;
    }

    // 创建新记录
    const stmt = this.db.prepare(`
      INSERT INTO skill_cooldowns (
        id, character_id, skill_id, remaining_turns, total_cooldown,
        last_used_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      data.characterId,
      data.skillId,
      data.remainingTurns,
      data.totalCooldown,
      now,
      now,
      now
    );

    return this.findById(id)!;
  }

  /**
   * 按角色查找所有冷却
   */
  public findByCharacterId(characterId: string): SkillCooldownEntity[] {
    this.ensureTableExists();
    const stmt = this.db.prepare<SkillCooldownEntity>(
      `SELECT * FROM skill_cooldowns WHERE character_id = ?`
    );
    return stmt.all(characterId);
  }

  /**
   * 按角色和技能查找冷却
   */
  public findByCharacterAndSkill(characterId: string, skillId: string): SkillCooldownEntity | undefined {
    this.ensureTableExists();
    const stmt = this.db.prepare<SkillCooldownEntity>(
      `SELECT * FROM skill_cooldowns WHERE character_id = ? AND skill_id = ?`
    );
    return stmt.get(characterId, skillId);
  }

  /**
   * 减少冷却
   */
  public reduceCooldown(characterId: string, skillId: string, amount: number): number {
    this.ensureTableExists();
    const stmt = this.db.prepare(`
      UPDATE skill_cooldowns
      SET remaining_turns = MAX(0, remaining_turns - ?), updated_at = strftime('%s', 'now')
      WHERE character_id = ? AND skill_id = ?
    `);
    const result = stmt.run(amount, characterId, skillId);

    // 如果冷却结束，删除记录
    this.db.prepare(`
      DELETE FROM skill_cooldowns WHERE character_id = ? AND skill_id = ? AND remaining_turns = 0
    `).run(characterId, skillId);

    return result.changes;
  }

  /**
   * 减少角色所有冷却
   */
  public reduceAllCooldowns(characterId: string, amount: number): number {
    this.ensureTableExists();
    const stmt = this.db.prepare(`
      UPDATE skill_cooldowns
      SET remaining_turns = MAX(0, remaining_turns - ?), updated_at = strftime('%s', 'now')
      WHERE character_id = ?
    `);
    const result = stmt.run(amount, characterId);

    // 删除已结束的冷却
    this.db.prepare(`
      DELETE FROM skill_cooldowns WHERE character_id = ? AND remaining_turns = 0
    `).run(characterId);

    return result.changes;
  }

  /**
   * 重置冷却
   */
  public resetCooldown(characterId: string, skillId: string): boolean {
    this.ensureTableExists();
    const stmt = this.db.prepare(
      `DELETE FROM skill_cooldowns WHERE character_id = ? AND skill_id = ?`
    );
    const result = stmt.run(characterId, skillId);
    return result.changes > 0;
  }

  /**
   * 重置角色所有冷却
   */
  public resetAllCooldowns(characterId: string): number {
    this.ensureTableExists();
    const stmt = this.db.prepare(
      `DELETE FROM skill_cooldowns WHERE character_id = ?`
    );
    const result = stmt.run(characterId);
    return result.changes;
  }

  /**
   * 将数据库实体转换为业务对象
   */
  public toCooldownState(entity: SkillCooldownEntity): SkillCooldownState {
    return {
      skillId: entity.skill_id,
      remainingTurns: entity.remaining_turns,
      totalCooldown: entity.total_cooldown,
      lastUsedAt: entity.last_used_at,
    };
  }

  /**
   * 确保表存在
   */
  private ensureTableExists(): void {
    const tableCheck = this.db.prepare<{ count: number }>(
      `SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name='skill_cooldowns'`
    );
    const result = tableCheck.get();

    if (!result || result.count === 0) {
      this.db.prepare(`
        CREATE TABLE IF NOT EXISTS skill_cooldowns (
          id TEXT PRIMARY KEY,
          character_id TEXT NOT NULL,
          skill_id TEXT NOT NULL,
          remaining_turns INTEGER NOT NULL DEFAULT 0,
          total_cooldown INTEGER NOT NULL DEFAULT 0,
          last_used_at INTEGER NOT NULL DEFAULT 0,
          created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
          updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
          UNIQUE(character_id, skill_id)
        )
      `).run();

      this.db.prepare(`
        CREATE INDEX IF NOT EXISTS idx_skill_cooldowns_character ON skill_cooldowns(character_id)
      `).run();
    }
  }
}

// ==================== 单例实例 ====================

let _skillRepository: SkillRepository | null = null;
let _skillTemplateRepository: SkillTemplateRepository | null = null;
let _skillCooldownRepository: SkillCooldownRepository | null = null;

export function getSkillRepository(): SkillRepository {
  if (!_skillRepository) {
    _skillRepository = new SkillRepository();
  }
  return _skillRepository;
}

export function getSkillTemplateRepository(): SkillTemplateRepository {
  if (!_skillTemplateRepository) {
    _skillTemplateRepository = new SkillTemplateRepository();
  }
  return _skillTemplateRepository;
}

export function getSkillCooldownRepository(): SkillCooldownRepository {
  if (!_skillCooldownRepository) {
    _skillCooldownRepository = new SkillCooldownRepository();
  }
  return _skillCooldownRepository;
}

// ==================== 便捷导出 ====================

export const skillRepository = {
  get instance() {
    return getSkillRepository();
  },
  findById: (id: string) => getSkillRepository().findById(id),
  findByCharacterId: (characterId: string) => getSkillRepository().findByCharacterId(characterId),
  createSkill: (data: Parameters<SkillRepository['createSkill']>[0]) => getSkillRepository().createSkill(data),
  updateSkill: (id: string, data: Parameters<SkillRepository['updateSkill']>[1]) => getSkillRepository().updateSkill(id, data),
  deleteById: (id: string) => getSkillRepository().deleteById(id),
  toSkill: (entity: SkillEntity) => getSkillRepository().toSkill(entity),
};

export const skillTemplateRepository = {
  get instance() {
    return getSkillTemplateRepository();
  },
  findById: (id: string) => getSkillTemplateRepository().findById(id),
  findByName: (name: string) => getSkillTemplateRepository().findByName(name),
  createTemplate: (data: Parameters<SkillTemplateRepository['createTemplate']>[0]) =>
    getSkillTemplateRepository().createTemplate(data),
  toTemplate: (entity: SkillTemplateEntity) => getSkillTemplateRepository().toTemplate(entity),
};

export const skillCooldownRepository = {
  get instance() {
    return getSkillCooldownRepository();
  },
  findByCharacterId: (characterId: string) => getSkillCooldownRepository().findByCharacterId(characterId),
  upsertCooldown: (data: Parameters<SkillCooldownRepository['upsertCooldown']>[0]) =>
    getSkillCooldownRepository().upsertCooldown(data),
  reduceCooldown: (characterId: string, skillId: string, amount: number) =>
    getSkillCooldownRepository().reduceCooldown(characterId, skillId, amount),
  resetCooldown: (characterId: string, skillId: string) =>
    getSkillCooldownRepository().resetCooldown(characterId, skillId),
  toCooldownState: (entity: SkillCooldownEntity) => getSkillCooldownRepository().toCooldownState(entity),
};
