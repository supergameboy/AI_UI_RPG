import { BaseRepository, BaseEntity } from './BaseRepository';

export interface Save extends BaseEntity {
  name: string;
  template_id: string | null;
  game_mode: 'text_adventure' | 'turn_based_rpg' | 'visual_novel' | 'dynamic_combat';
  character_id: string | null;
  created_at: number;
  updated_at: number;
  play_time: number;
  current_location: string | null;
  current_scene: string | null;
  game_state: string;
  story_progress: string;
}

export interface SaveSnapshot extends BaseEntity {
  save_id: string;
  snapshot_type: 'auto' | 'manual' | 'checkpoint';
  context_state: string;
  memory_state: string;
  agent_states: string;
  created_at: number;
}

export class SaveRepository extends BaseRepository<Save> {
  constructor() {
    super('saves');
  }

  public create(data: Omit<Save, 'id' | 'created_at' | 'updated_at'>): Save {
    const id = this.generateId();
    const now = Math.floor(Date.now() / 1000);

    const stmt = this.db.prepare(`
      INSERT INTO saves (id, name, template_id, game_mode, character_id, created_at, updated_at, play_time, current_location, current_scene, game_state, story_progress)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      data.name,
      data.template_id ?? null,
      data.game_mode,
      data.character_id ?? null,
      now,
      now,
      data.play_time ?? 0,
      data.current_location ?? null,
      data.current_scene ?? null,
      data.game_state ?? '{}',
      data.story_progress ?? '{}'
    );

    return this.findById(id)!;
  }

  public update(id: string, data: Partial<Omit<Save, 'id' | 'created_at'>>): Save | undefined {
    const fields: string[] = [];
    const values: unknown[] = [];

    if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
    if (data.template_id !== undefined) { fields.push('template_id = ?'); values.push(data.template_id); }
    if (data.character_id !== undefined) { fields.push('character_id = ?'); values.push(data.character_id); }
    if (data.play_time !== undefined) { fields.push('play_time = ?'); values.push(data.play_time); }
    if (data.current_location !== undefined) { fields.push('current_location = ?'); values.push(data.current_location); }
    if (data.current_scene !== undefined) { fields.push('current_scene = ?'); values.push(data.current_scene); }
    if (data.game_state !== undefined) { fields.push('game_state = ?'); values.push(data.game_state); }
    if (data.story_progress !== undefined) { fields.push('story_progress = ?'); values.push(data.story_progress); }

    if (fields.length === 0) return this.findById(id);

    fields.push("updated_at = strftime('%s', 'now')");
    values.push(id);

    const stmt = this.db.prepare(`UPDATE saves SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...values);

    return this.findById(id);
  }

  public findByGameMode(gameMode: Save['game_mode']): Save[] {
    const stmt = this.db.prepare<Save>(`SELECT * FROM saves WHERE game_mode = ? ORDER BY updated_at DESC`);
    return stmt.all(gameMode);
  }

  public findRecent(limit: number = 10): Save[] {
    const stmt = this.db.prepare<Save>(`SELECT * FROM saves ORDER BY updated_at DESC LIMIT ?`);
    return stmt.all(limit);
  }

  /**
   * 分页查询存档，支持 template_id 筛选
   */
  public findWithPagination(options: {
    page?: number;
    limit?: number;
    template_id?: string;
  }): { saves: Save[]; total: number; page: number; limit: number; totalPages: number } {
    const page = Math.max(1, options.page || 1);
    const limit = Math.max(1, Math.min(100, options.limit || 10));
    const offset = (page - 1) * limit;

    let countQuery = 'SELECT COUNT(*) as count FROM saves';
    let dataQuery = 'SELECT * FROM saves';
    const params: unknown[] = [];

    if (options.template_id !== undefined) {
      countQuery += ' WHERE template_id = ?';
      dataQuery += ' WHERE template_id = ?';
      params.push(options.template_id);
    }

    dataQuery += ' ORDER BY updated_at DESC LIMIT ? OFFSET ?';

    // 获取总数
    const countStmt = this.db.prepare<{ count: number }>(countQuery);
    const countResult = countStmt.get(...params);
    const total = countResult?.count || 0;

    // 获取分页数据
    const dataStmt = this.db.prepare<Save>(dataQuery);
    const saves = dataStmt.all(...params, limit, offset);

    return {
      saves,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 获取存档统计信息
   */
  public getStats(): {
    total: number;
    byTemplate: Record<string, number>;
    byGameMode: Record<string, number>;
    totalPlayTime: number;
  } {
    // 获取总数
    const totalStmt = this.db.prepare<{ count: number }>('SELECT COUNT(*) as count FROM saves');
    const totalResult = totalStmt.get();
    const total = totalResult?.count || 0;

    // 按 template_id 分组统计
    const byTemplateStmt = this.db.prepare<{ template_id: string | null; count: number }>(
      'SELECT template_id, COUNT(*) as count FROM saves GROUP BY template_id'
    );
    const byTemplateRows = byTemplateStmt.all();
    const byTemplate: Record<string, number> = {};
    for (const row of byTemplateRows) {
      if (row.template_id !== null) {
        byTemplate[row.template_id] = row.count;
      }
    }

    // 按 game_mode 分组统计
    const byGameModeStmt = this.db.prepare<{ game_mode: string; count: number }>(
      'SELECT game_mode, COUNT(*) as count FROM saves GROUP BY game_mode'
    );
    const byGameModeRows = byGameModeStmt.all();
    const byGameMode: Record<string, number> = {};
    for (const row of byGameModeRows) {
      byGameMode[row.game_mode] = row.count;
    }

    // 获取总游戏时长
    const playTimeStmt = this.db.prepare<{ total: number | null }>(
      'SELECT SUM(play_time) as total FROM saves'
    );
    const playTimeResult = playTimeStmt.get();
    const totalPlayTime = playTimeResult?.total || 0;

    return {
      total,
      byTemplate,
      byGameMode,
      totalPlayTime,
    };
  }

  public createSnapshot(data: Omit<SaveSnapshot, 'id' | 'created_at'>): SaveSnapshot {
    const id = this.generateId();
    const now = Math.floor(Date.now() / 1000);

    const stmt = this.db.prepare(`
      INSERT INTO save_snapshots (id, save_id, snapshot_type, context_state, memory_state, agent_states, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(id, data.save_id, data.snapshot_type, data.context_state, data.memory_state, data.agent_states, now);

    return this.findSnapshotById(id)!;
  }

  public findSnapshotById(id: string): SaveSnapshot | undefined {
    const stmt = this.db.prepare<SaveSnapshot>(`SELECT * FROM save_snapshots WHERE id = ?`);
    return stmt.get(id);
  }

  public findLatestSnapshot(saveId: string): SaveSnapshot | undefined {
    const stmt = this.db.prepare<SaveSnapshot>(
      `SELECT * FROM save_snapshots WHERE save_id = ? ORDER BY created_at DESC LIMIT 1`
    );
    return stmt.get(saveId);
  }

  public findSnapshotsBySaveId(saveId: string): SaveSnapshot[] {
    const stmt = this.db.prepare<SaveSnapshot>(
      `SELECT * FROM save_snapshots WHERE save_id = ? ORDER BY created_at DESC`
    );
    return stmt.all(saveId);
  }

  public deleteSnapshotsBySaveId(saveId: string): number {
    const stmt = this.db.prepare(`DELETE FROM save_snapshots WHERE save_id = ?`);
    const result = stmt.run(saveId);
    return result.changes;
  }

  public deleteById(id: string): boolean {
    this.deleteSnapshotsBySaveId(id);
    return super.deleteById(id);
  }
}

let _saveRepository: SaveRepository | null = null;

export function getSaveRepository(): SaveRepository {
  if (!_saveRepository) {
    _saveRepository = new SaveRepository();
  }
  return _saveRepository;
}

export const saveRepository = {
  get instance() {
    return getSaveRepository();
  },
  findById: (id: string) => getSaveRepository().findById(id),
  findAll: () => getSaveRepository().findAll(),
  create: (data: Parameters<SaveRepository['create']>[0]) => getSaveRepository().create(data),
  update: (id: string, data: Parameters<SaveRepository['update']>[1]) => getSaveRepository().update(id, data),
  deleteById: (id: string) => getSaveRepository().deleteById(id),
  findByGameMode: (gameMode: Save['game_mode']) => getSaveRepository().findByGameMode(gameMode),
  findRecent: (limit?: number) => getSaveRepository().findRecent(limit),
  findWithPagination: (options: Parameters<SaveRepository['findWithPagination']>[0]) =>
    getSaveRepository().findWithPagination(options),
  getStats: () => getSaveRepository().getStats(),
  createSnapshot: (data: Parameters<SaveRepository['createSnapshot']>[0]) => getSaveRepository().createSnapshot(data),
  findSnapshotById: (id: string) => getSaveRepository().findSnapshotById(id),
  findLatestSnapshot: (saveId: string) => getSaveRepository().findLatestSnapshot(saveId),
  findSnapshotsBySaveId: (saveId: string) => getSaveRepository().findSnapshotsBySaveId(saveId),
  deleteSnapshotsBySaveId: (saveId: string) => getSaveRepository().deleteSnapshotsBySaveId(saveId),
};
