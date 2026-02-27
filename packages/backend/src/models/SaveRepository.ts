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
      data.template_id,
      data.game_mode,
      data.character_id,
      now,
      now,
      data.play_time || 0,
      data.current_location,
      data.current_scene,
      data.game_state || '{}',
      data.story_progress || '{}'
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
  createSnapshot: (data: Parameters<SaveRepository['createSnapshot']>[0]) => getSaveRepository().createSnapshot(data),
  findSnapshotById: (id: string) => getSaveRepository().findSnapshotById(id),
  findLatestSnapshot: (saveId: string) => getSaveRepository().findLatestSnapshot(saveId),
  findSnapshotsBySaveId: (saveId: string) => getSaveRepository().findSnapshotsBySaveId(saveId),
  deleteSnapshotsBySaveId: (saveId: string) => getSaveRepository().deleteSnapshotsBySaveId(saveId),
};
