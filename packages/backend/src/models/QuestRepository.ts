/**
 * 任务仓库
 * 提供任务数据的持久化存储和查询功能
 */

import { BaseRepository, BaseEntity } from './BaseRepository';
import type {
  Quest,
  QuestObjective,
  QuestStatus,
  QuestType,
  QuestRewards,
  QuestLogEntry,
} from '@ai-rpg/shared';

// ==================== 数据库实体类型 ====================

/**
 * 任务数据库实体
 */
export interface QuestEntity extends BaseEntity {
  character_id: string;
  quest_id: string;
  name: string;
  description: string;
  type: QuestType;
  status: QuestStatus;
  objectives: string; // JSON
  prerequisites: string; // JSON
  rewards: string; // JSON
  time_limit: number | null;
  log: string; // JSON
  created_at: number;
  updated_at: number;
}

// ==================== 任务仓库 ====================

export class QuestRepository extends BaseRepository<QuestEntity> {
  private static instance: QuestRepository | null = null;

  constructor() {
    super('quests');
    this.ensureTableExists();
  }

  /**
   * 获取单例实例
   */
  public static getInstance(): QuestRepository {
    if (!QuestRepository.instance) {
      QuestRepository.instance = new QuestRepository();
    }
    return QuestRepository.instance;
  }

  /**
   * 确保表存在
   */
  private ensureTableExists(): void {
    const tableCheck = this.db.prepare<{ count: number }>(
      `SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name='quests'`
    );
    const result = tableCheck.get();

    if (!result || result.count === 0) {
      this.db.prepare(`
        CREATE TABLE IF NOT EXISTS quests (
          id TEXT PRIMARY KEY,
          character_id TEXT NOT NULL,
          quest_id TEXT NOT NULL,
          name TEXT NOT NULL,
          description TEXT,
          type TEXT NOT NULL DEFAULT 'side',
          status TEXT NOT NULL DEFAULT 'available',
          objectives TEXT DEFAULT '[]',
          prerequisites TEXT DEFAULT '[]',
          rewards TEXT DEFAULT '{}',
          time_limit INTEGER,
          log TEXT DEFAULT '[]',
          created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
          updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
          UNIQUE(character_id, quest_id)
        )
      `).run();

      this.db.prepare(`
        CREATE INDEX IF NOT EXISTS idx_quests_character ON quests(character_id)
      `).run();

      this.db.prepare(`
        CREATE INDEX IF NOT EXISTS idx_quests_status ON quests(status)
      `).run();

      this.db.prepare(`
        CREATE INDEX IF NOT EXISTS idx_quests_type ON quests(type)
      `).run();
    }
  }

  // ==================== 任务 CRUD ====================

  /**
   * 创建任务
   */
  public createQuest(characterId: string, quest: Quest): QuestEntity {
    const id = this.generateId();
    const now = Math.floor(Date.now() / 1000);

    const stmt = this.db.prepare(`
      INSERT INTO quests (
        id, character_id, quest_id, name, description, type, status,
        objectives, prerequisites, rewards, time_limit, log,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      characterId,
      quest.id,
      quest.name,
      quest.description,
      quest.type,
      quest.status,
      JSON.stringify(quest.objectives),
      JSON.stringify(quest.prerequisites),
      JSON.stringify(quest.rewards),
      quest.timeLimit ?? null,
      JSON.stringify(quest.log || []),
      now,
      now
    );

    return this.findById(id)!;
  }

  /**
   * 获取任务
   */
  public getQuest(questId: string, characterId: string): Quest | null {
    const stmt = this.db.prepare<QuestEntity>(
      `SELECT * FROM quests WHERE quest_id = ? AND character_id = ?`
    );
    const entity = stmt.get(questId, characterId);

    if (!entity) {
      return null;
    }

    return this.toQuest(entity);
  }

  /**
   * 获取角色所有任务
   */
  public getCharacterQuests(characterId: string): Quest[] {
    const stmt = this.db.prepare<QuestEntity>(
      `SELECT * FROM quests WHERE character_id = ? ORDER BY created_at DESC`
    );
    const entities = stmt.all(characterId);

    return entities.map(e => this.toQuest(e));
  }

  /**
   * 获取角色可接取的任务（状态为 available）
   */
  public getAvailableQuests(characterId: string): Quest[] {
    const stmt = this.db.prepare<QuestEntity>(
      `SELECT * FROM quests WHERE character_id = ? AND status = 'available' ORDER BY created_at DESC`
    );
    const entities = stmt.all(characterId);

    return entities.map(e => this.toQuest(e));
  }

  /**
   * 获取角色进行中的任务
   */
  public getInProgressQuests(characterId: string): Quest[] {
    const stmt = this.db.prepare<QuestEntity>(
      `SELECT * FROM quests WHERE character_id = ? AND status = 'in_progress' ORDER BY created_at DESC`
    );
    const entities = stmt.all(characterId);

    return entities.map(e => this.toQuest(e));
  }

  /**
   * 获取角色已完成的任务
   */
  public getCompletedQuests(characterId: string): Quest[] {
    const stmt = this.db.prepare<QuestEntity>(
      `SELECT * FROM quests WHERE character_id = ? AND status = 'completed' ORDER BY updated_at DESC`
    );
    const entities = stmt.all(characterId);

    return entities.map(e => this.toQuest(e));
  }

  /**
   * 更新任务状态
   */
  public updateQuestStatus(questId: string, characterId: string, status: QuestStatus): boolean {
    const stmt = this.db.prepare(`
      UPDATE quests
      SET status = ?, updated_at = strftime('%s', 'now')
      WHERE quest_id = ? AND character_id = ?
    `);
    const result = stmt.run(status, questId, characterId);

    return result.changes > 0;
  }

  /**
   * 更新目标进度
   */
  public updateObjectiveProgress(
    questId: string,
    characterId: string,
    objectiveId: string,
    progress: number
  ): Quest | null {
    // 获取当前任务
    const quest = this.getQuest(questId, characterId);
    if (!quest) {
      return null;
    }

    // 更新目标进度
    const objectives = quest.objectives.map(obj => {
      if (obj.id === objectiveId) {
        const newCurrent = Math.min(progress, obj.required);
        return {
          ...obj,
          current: newCurrent,
          isCompleted: newCurrent >= obj.required,
        };
      }
      return obj;
    });

    // 检查是否所有目标都已完成
    const allCompleted = objectives.every(obj => obj.isCompleted);

    // 更新数据库
    const stmt = this.db.prepare(`
      UPDATE quests
      SET objectives = ?, status = ?, updated_at = strftime('%s', 'now')
      WHERE quest_id = ? AND character_id = ?
    `);
    stmt.run(
      JSON.stringify(objectives),
      allCompleted ? 'completed' : quest.status,
      questId,
      characterId
    );

    return this.getQuest(questId, characterId);
  }

  /**
   * 增加目标进度
   */
  public incrementObjectiveProgress(
    questId: string,
    characterId: string,
    objectiveId: string,
    increment: number
  ): Quest | null {
    const quest = this.getQuest(questId, characterId);
    if (!quest) {
      return null;
    }

    const objective = quest.objectives.find(obj => obj.id === objectiveId);
    if (!objective) {
      return null;
    }

    return this.updateObjectiveProgress(
      questId,
      characterId,
      objectiveId,
      objective.current + increment
    );
  }

  /**
   * 添加日志条目
   */
  public addLogEntry(
    questId: string,
    characterId: string,
    event: string
  ): boolean {
    const quest = this.getQuest(questId, characterId);
    if (!quest) {
      return false;
    }

    const log: QuestLogEntry[] = [
      ...quest.log,
      {
        timestamp: Date.now(),
        event,
      },
    ];

    const stmt = this.db.prepare(`
      UPDATE quests
      SET log = ?, updated_at = strftime('%s', 'now')
      WHERE quest_id = ? AND character_id = ?
    `);
    stmt.run(JSON.stringify(log), questId, characterId);

    return true;
  }

  /**
   * 删除任务
   */
  public deleteQuest(questId: string, characterId: string): boolean {
    const stmt = this.db.prepare(
      `DELETE FROM quests WHERE quest_id = ? AND character_id = ?`
    );
    const result = stmt.run(questId, characterId);

    return result.changes > 0;
  }

  /**
   * 删除角色所有任务
   */
  public deleteByCharacterId(characterId: string): number {
    const stmt = this.db.prepare(`DELETE FROM quests WHERE character_id = ?`);
    const result = stmt.run(characterId);

    return result.changes;
  }

  /**
   * 检查任务是否存在
   */
  public questExists(questId: string, characterId: string): boolean {
    const stmt = this.db.prepare<{ count: number }>(
      `SELECT COUNT(*) as count FROM quests WHERE quest_id = ? AND character_id = ?`
    );
    const result = stmt.get(questId, characterId);

    return result ? result.count > 0 : false;
  }

  // ==================== 统计 ====================

  /**
   * 获取任务统计
   */
  public getStatistics(characterId: string): {
    total: number;
    byType: Record<QuestType, number>;
    byStatus: Record<QuestStatus, number>;
    completedCount: number;
    inProgressCount: number;
    availableCount: number;
  } {
    const entities = this.db.prepare<QuestEntity>(
      `SELECT * FROM quests WHERE character_id = ?`
    ).all(characterId);

    const stats = {
      total: entities.length,
      byType: {
        main: 0,
        side: 0,
        hidden: 0,
        daily: 0,
        chain: 0,
      } as Record<QuestType, number>,
      byStatus: {
        locked: 0,
        available: 0,
        in_progress: 0,
        completed: 0,
        failed: 0,
      } as Record<QuestStatus, number>,
      completedCount: 0,
      inProgressCount: 0,
      availableCount: 0,
    };

    for (const entity of entities) {
      stats.byType[entity.type]++;
      stats.byStatus[entity.status]++;

      if (entity.status === 'completed') {
        stats.completedCount++;
      } else if (entity.status === 'in_progress') {
        stats.inProgressCount++;
      } else if (entity.status === 'available') {
        stats.availableCount++;
      }
    }

    return stats;
  }

  // ==================== 实体转换 ====================

  /**
   * 将数据库实体转换为业务对象
   */
  public toQuest(entity: QuestEntity): Quest {
    return {
      id: entity.quest_id,
      name: entity.name,
      description: entity.description,
      type: entity.type,
      status: entity.status,
      objectives: JSON.parse(entity.objectives || '[]') as QuestObjective[],
      prerequisites: JSON.parse(entity.prerequisites || '[]') as string[],
      rewards: JSON.parse(entity.rewards || '{}') as QuestRewards,
      timeLimit: entity.time_limit ?? undefined,
      log: JSON.parse(entity.log || '[]') as QuestLogEntry[],
      characterId: entity.character_id,
      createdAt: entity.created_at,
      updatedAt: entity.updated_at,
    };
  }

  /**
   * 将业务对象转换为数据库实体格式
   */
  public toEntity(quest: Quest, characterId: string): Omit<QuestEntity, 'id'> {
    const now = Math.floor(Date.now() / 1000);
    return {
      character_id: characterId,
      quest_id: quest.id,
      name: quest.name,
      description: quest.description,
      type: quest.type,
      status: quest.status,
      objectives: JSON.stringify(quest.objectives),
      prerequisites: JSON.stringify(quest.prerequisites),
      rewards: JSON.stringify(quest.rewards),
      time_limit: quest.timeLimit ?? null,
      log: JSON.stringify(quest.log || []),
      created_at: quest.createdAt ?? now,
      updated_at: now,
    };
  }
}

// ==================== 单例实例 ====================

let _questRepository: QuestRepository | null = null;

export function getQuestRepository(): QuestRepository {
  if (!_questRepository) {
    _questRepository = QuestRepository.getInstance();
  }
  return _questRepository;
}

// ==================== 便捷导出 ====================

export const questRepository = {
  get instance() {
    return getQuestRepository();
  },
  findById: (id: string) => getQuestRepository().findById(id),
  createQuest: (characterId: string, quest: Quest) =>
    getQuestRepository().createQuest(characterId, quest),
  getQuest: (questId: string, characterId: string) =>
    getQuestRepository().getQuest(questId, characterId),
  getCharacterQuests: (characterId: string) =>
    getQuestRepository().getCharacterQuests(characterId),
  getAvailableQuests: (characterId: string) =>
    getQuestRepository().getAvailableQuests(characterId),
  updateQuestStatus: (questId: string, characterId: string, status: QuestStatus) =>
    getQuestRepository().updateQuestStatus(questId, characterId, status),
  updateObjectiveProgress: (
    questId: string,
    characterId: string,
    objectiveId: string,
    progress: number
  ) => getQuestRepository().updateObjectiveProgress(questId, characterId, objectiveId, progress),
  deleteQuest: (questId: string, characterId: string) =>
    getQuestRepository().deleteQuest(questId, characterId),
  toQuest: (entity: QuestEntity) => getQuestRepository().toQuest(entity),
};
