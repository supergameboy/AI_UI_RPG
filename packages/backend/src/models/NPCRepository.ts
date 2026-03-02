/**
 * NPC仓库
 * 提供NPC数据和关系数据的持久化存储和查询功能
 */

import { BaseRepository, BaseEntity } from './BaseRepository';
import type {
  NPC,
  NPCRelationship,
  PartyMember,
  NPCStatistics,
  NPCRole,
  NPCDisposition,
  RelationshipType,
} from '@ai-rpg/shared';

// ==================== 数据库实体类型 ====================

export interface NPCEntity extends BaseEntity {
  save_id: string;
  name: string;
  title: string;
  race: string;
  occupation: string;
  appearance: string; // JSON
  personality: string; // JSON
  status: string; // JSON
  stats: string; // JSON
  flags: string; // JSON
  role: NPCRole;
  disposition: NPCDisposition;
  dialogue: string; // JSON
  services: string; // JSON
  inventory: string; // JSON
  quests: string; // JSON
  relationships: string; // JSON
  backstory: string;
  secrets: string; // JSON
  custom_data: string; // JSON
}

export interface NPCRelationshipEntity extends BaseEntity {
  character_id: string;
  npc_id: string;
  type: RelationshipType;
  level: number;
  trust_level: number;
  respect_level: number;
  affection_level: number;
  fear_level: number;
  interaction_count: number;
  last_interaction_at: number | null;
  first_met_at: number;
  flags: string; // JSON
  notes: string; // JSON
  custom_data: string; // JSON
}

export interface PartyMemberEntity extends BaseEntity {
  character_id: string;
  npc_id: string;
  joined_at: number;
  role: string;
  position: number;
  orders: string; // JSON
  custom_data: string; // JSON
}

// ==================== NPC仓库 ====================

export class NPCRepository extends BaseRepository<NPCEntity> {
  private static instance: NPCRepository | null = null;

  constructor() {
    super('npcs');
    this.ensureTablesExist();
  }

  public static getInstance(): NPCRepository {
    if (!NPCRepository.instance) {
      NPCRepository.instance = new NPCRepository();
    }
    return NPCRepository.instance;
  }

  private ensureTablesExist(): void {
    this.db.prepare(`
      CREATE TABLE IF NOT EXISTS npcs (
        id TEXT PRIMARY KEY,
        save_id TEXT NOT NULL,
        name TEXT NOT NULL,
        title TEXT,
        race TEXT,
        occupation TEXT,
        appearance TEXT DEFAULT '{}',
        personality TEXT DEFAULT '{}',
        status TEXT DEFAULT '{}',
        stats TEXT DEFAULT '{}',
        flags TEXT DEFAULT '{}',
        role TEXT NOT NULL DEFAULT 'neutral',
        disposition TEXT DEFAULT 'neutral',
        dialogue TEXT DEFAULT '{}',
        services TEXT DEFAULT '[]',
        inventory TEXT DEFAULT '[]',
        quests TEXT DEFAULT '[]',
        relationships TEXT DEFAULT '{}',
        backstory TEXT,
        secrets TEXT DEFAULT '[]',
        custom_data TEXT DEFAULT '{}',
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY (save_id) REFERENCES saves(id) ON DELETE CASCADE
      )
    `).run();

    this.db.prepare(`
      CREATE TABLE IF NOT EXISTS npc_relationships (
        id TEXT PRIMARY KEY,
        character_id TEXT NOT NULL,
        npc_id TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'neutral',
        level INTEGER DEFAULT 0,
        trust_level INTEGER DEFAULT 0,
        respect_level INTEGER DEFAULT 0,
        affection_level INTEGER DEFAULT 0,
        fear_level INTEGER DEFAULT 0,
        interaction_count INTEGER DEFAULT 0,
        last_interaction_at INTEGER,
        first_met_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        flags TEXT DEFAULT '{}',
        notes TEXT DEFAULT '[]',
        custom_data TEXT DEFAULT '{}',
        UNIQUE(character_id, npc_id),
        FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE,
        FOREIGN KEY (npc_id) REFERENCES npcs(id) ON DELETE CASCADE
      )
    `).run();

    this.db.prepare(`
      CREATE TABLE IF NOT EXISTS party_members (
        id TEXT PRIMARY KEY,
        character_id TEXT NOT NULL,
        npc_id TEXT NOT NULL,
        joined_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        role TEXT DEFAULT 'support',
        position INTEGER DEFAULT 0,
        orders TEXT DEFAULT '{}',
        custom_data TEXT DEFAULT '{}',
        UNIQUE(character_id, npc_id),
        FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE,
        FOREIGN KEY (npc_id) REFERENCES npcs(id) ON DELETE CASCADE
      )
    `).run();

    this.db.prepare(`CREATE INDEX IF NOT EXISTS idx_npcs_save ON npcs(save_id)`).run();
    this.db.prepare(`CREATE INDEX IF NOT EXISTS idx_npc_relationships_character ON npc_relationships(character_id)`).run();
    this.db.prepare(`CREATE INDEX IF NOT EXISTS idx_npc_relationships_npc ON npc_relationships(npc_id)`).run();
    this.db.prepare(`CREATE INDEX IF NOT EXISTS idx_party_members_character ON party_members(character_id)`).run();

    this.migrateNPCsTable();

    this.db.prepare(`CREATE INDEX IF NOT EXISTS idx_npcs_role ON npcs(role)`).run();
  }

  private migrateNPCsTable(): void {
    try {
      const tableInfo = this.db.prepare<{ name: string }>(`PRAGMA table_info(npcs)`).all();
      const columns = tableInfo.map(col => col.name);

      const requiredColumns = [
        { name: 'title', def: 'title TEXT' },
        { name: 'race', def: 'race TEXT' },
        { name: 'occupation', def: 'occupation TEXT' },
        { name: 'appearance', def: 'appearance TEXT DEFAULT \'{}\'' },
        { name: 'personality', def: 'personality TEXT DEFAULT \'{}\'' },
        { name: 'status', def: 'status TEXT DEFAULT \'{}\'' },
        { name: 'stats', def: 'stats TEXT DEFAULT \'{}\'' },
        { name: 'flags', def: 'flags TEXT DEFAULT \'{}\'' },
        { name: 'role', def: 'role TEXT NOT NULL DEFAULT \'neutral\'' },
        { name: 'disposition', def: 'disposition TEXT DEFAULT \'neutral\'' },
        { name: 'dialogue', def: 'dialogue TEXT DEFAULT \'{}\'' },
        { name: 'services', def: 'services TEXT DEFAULT \'[]\'' },
        { name: 'inventory', def: 'inventory TEXT DEFAULT \'[]\'' },
        { name: 'quests', def: 'quests TEXT DEFAULT \'[]\'' },
        { name: 'relationships', def: 'relationships TEXT DEFAULT \'{}\'' },
        { name: 'backstory', def: 'backstory TEXT' },
        { name: 'secrets', def: 'secrets TEXT DEFAULT \'[]\'' },
        { name: 'custom_data', def: 'custom_data TEXT DEFAULT \'{}\'' },
        { name: 'created_at', def: 'created_at INTEGER NOT NULL DEFAULT (strftime(\'%s\', \'now\'))' },
        { name: 'updated_at', def: 'updated_at INTEGER NOT NULL DEFAULT (strftime(\'%s\', \'now\'))' },
      ];

      for (const col of requiredColumns) {
        if (!columns.includes(col.name)) {
          this.db.prepare(`ALTER TABLE npcs ADD COLUMN ${col.def}`).run();
          console.log(`[NPCRepository] Added column ${col.name} to npcs table`);
        }
      }
    } catch (error) {
      console.error('[NPCRepository] Migration error:', error);
    }
  }

  // ==================== NPC CRUD ====================

  public createNPC(saveId: string, npc: Partial<NPC>): NPCEntity {
    const id = this.generateId();
    const now = Math.floor(Date.now() / 1000);

    const stmt = this.db.prepare(`
      INSERT INTO npcs (
        id, save_id, name, title, race, occupation, appearance, personality,
        status, stats, flags, role, disposition, dialogue, services,
        inventory, quests, relationships, backstory, secrets, custom_data,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      saveId,
      npc.name || 'Unknown NPC',
      npc.title || '',
      npc.race || 'human',
      npc.occupation || '',
      JSON.stringify(npc.appearance || {}),
      JSON.stringify(npc.personality || {}),
      JSON.stringify(npc.status || {}),
      JSON.stringify(npc.stats || {}),
      JSON.stringify(npc.flags || {}),
      npc.role || 'neutral',
      npc.disposition || 'neutral',
      JSON.stringify(npc.dialogue || {}),
      JSON.stringify(npc.services || []),
      JSON.stringify(npc.inventory || []),
      JSON.stringify(npc.quests || []),
      JSON.stringify(npc.relationships || {}),
      npc.backstory || '',
      JSON.stringify(npc.secrets || []),
      JSON.stringify(npc.customData || {}),
      now,
      now
    );

    return this.findById(id)!;
  }

  public getNPC(npcId: string): NPC | null {
    const stmt = this.db.prepare<NPCEntity>(`SELECT * FROM npcs WHERE id = ?`);
    const entity = stmt.get(npcId);

    if (!entity) {
      return null;
    }

    return this.toNPC(entity);
  }

  public getNPCsBySaveId(saveId: string): NPC[] {
    const stmt = this.db.prepare<NPCEntity>(`SELECT * FROM npcs WHERE save_id = ? ORDER BY name`);
    const entities = stmt.all(saveId);

    return entities.map(e => this.toNPC(e));
  }

  public getNPCsByLocation(locationId: string, saveId: string): NPC[] {
    const npcs = this.getNPCsBySaveId(saveId);
    return npcs.filter(npc => npc.status.currentLocation === locationId);
  }

  public updateNPC(npcId: string, updates: Partial<NPC>): boolean {
    const fields: string[] = [];
    const values: unknown[] = [];

    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.status !== undefined) {
      fields.push('status = ?');
      values.push(JSON.stringify(updates.status));
    }
    if (updates.disposition !== undefined) {
      fields.push('disposition = ?');
      values.push(updates.disposition);
    }
    if (updates.relationships !== undefined) {
      fields.push('relationships = ?');
      values.push(JSON.stringify(updates.relationships));
    }

    if (fields.length === 0) {
      return false;
    }

    fields.push('updated_at = strftime("%s", "now")');
    values.push(npcId);

    const stmt = this.db.prepare(`
      UPDATE npcs SET ${fields.join(', ')} WHERE id = ?
    `);
    const result = stmt.run(...values);

    return result.changes > 0;
  }

  public deleteNPC(npcId: string): boolean {
    this.db.prepare(`DELETE FROM npc_relationships WHERE npc_id = ?`).run(npcId);
    this.db.prepare(`DELETE FROM party_members WHERE npc_id = ?`).run(npcId);

    return this.deleteById(npcId);
  }

  // ==================== Relationship CRUD ====================

  public createRelationship(characterId: string, npcId: string, relationship: Partial<NPCRelationship>): NPCRelationshipEntity {
    const id = this.generateId();
    const now = Math.floor(Date.now() / 1000);

    const stmt = this.db.prepare(`
      INSERT INTO npc_relationships (
        id, character_id, npc_id, type, level, trust_level, respect_level,
        affection_level, fear_level, interaction_count, last_interaction_at,
        first_met_at, flags, notes, custom_data
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      characterId,
      npcId,
      relationship.type || 'neutral',
      relationship.level ?? 0,
      relationship.trustLevel ?? 0,
      relationship.respectLevel ?? 0,
      relationship.affectionLevel ?? 0,
      relationship.fearLevel ?? 0,
      relationship.interactionCount ?? 0,
      relationship.lastInteractionAt ?? null,
      relationship.firstMetAt ?? now,
      JSON.stringify(relationship.flags || { met: true }),
      JSON.stringify(relationship.notes || []),
      JSON.stringify(relationship.customData || {})
    );

    return this.db.prepare<NPCRelationshipEntity>(`SELECT * FROM npc_relationships WHERE id = ?`).get(id)!;
  }

  public getRelationship(characterId: string, npcId: string): NPCRelationship | null {
    const stmt = this.db.prepare<NPCRelationshipEntity>(
      `SELECT * FROM npc_relationships WHERE character_id = ? AND npc_id = ?`
    );
    const entity = stmt.get(characterId, npcId);

    if (!entity) {
      return null;
    }

    return this.toRelationship(entity);
  }

  public getRelationshipsByCharacterId(characterId: string): NPCRelationship[] {
    const stmt = this.db.prepare<NPCRelationshipEntity>(
      `SELECT * FROM npc_relationships WHERE character_id = ?`
    );
    const entities = stmt.all(characterId);

    return entities.map(e => this.toRelationship(e));
  }

  public updateRelationship(characterId: string, npcId: string, updates: Partial<NPCRelationship>): boolean {
    const fields: string[] = [];
    const values: unknown[] = [];

    if (updates.type !== undefined) {
      fields.push('type = ?');
      values.push(updates.type);
    }
    if (updates.level !== undefined) {
      fields.push('level = ?');
      values.push(Math.max(-100, Math.min(100, updates.level)));
    }
    if (updates.trustLevel !== undefined) {
      fields.push('trust_level = ?');
      values.push(Math.max(-100, Math.min(100, updates.trustLevel)));
    }
    if (updates.respectLevel !== undefined) {
      fields.push('respect_level = ?');
      values.push(Math.max(-100, Math.min(100, updates.respectLevel)));
    }
    if (updates.affectionLevel !== undefined) {
      fields.push('affection_level = ?');
      values.push(Math.max(-100, Math.min(100, updates.affectionLevel)));
    }
    if (updates.fearLevel !== undefined) {
      fields.push('fear_level = ?');
      values.push(Math.max(-100, Math.min(100, updates.fearLevel)));
    }
    if (updates.interactionCount !== undefined) {
      fields.push('interaction_count = ?');
      values.push(updates.interactionCount);
    }
    if (updates.lastInteractionAt !== undefined) {
      fields.push('last_interaction_at = ?');
      values.push(updates.lastInteractionAt);
    }
    if (updates.notes !== undefined) {
      fields.push('notes = ?');
      values.push(JSON.stringify(updates.notes));
    }

    if (fields.length === 0) {
      return false;
    }

    values.push(characterId, npcId);

    const stmt = this.db.prepare(`
      UPDATE npc_relationships SET ${fields.join(', ')} WHERE character_id = ? AND npc_id = ?
    `);
    const result = stmt.run(...values);

    return result.changes > 0;
  }

  public incrementInteraction(characterId: string, npcId: string): boolean {
    const now = Math.floor(Date.now() / 1000);

    const stmt = this.db.prepare(`
      UPDATE npc_relationships
      SET interaction_count = interaction_count + 1,
          last_interaction_at = ?
      WHERE character_id = ? AND npc_id = ?
    `);
    const result = stmt.run(now, characterId, npcId);

    return result.changes > 0;
  }

  // ==================== Party CRUD ====================

  public addToParty(characterId: string, npcId: string, role: string = 'support'): PartyMemberEntity {
    const id = this.generateId();
    const now = Math.floor(Date.now() / 1000);

    const stmt = this.db.prepare(`
      INSERT INTO party_members (id, character_id, npc_id, joined_at, role, position, orders, custom_data)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const position = this.getPartySize(characterId);

    stmt.run(id, characterId, npcId, now, role, position, '{}', '{}');

    return this.db.prepare<PartyMemberEntity>(`SELECT * FROM party_members WHERE id = ?`).get(id)!;
  }

  public removeFromParty(characterId: string, npcId: string): boolean {
    const stmt = this.db.prepare(
      `DELETE FROM party_members WHERE character_id = ? AND npc_id = ?`
    );
    const result = stmt.run(characterId, npcId);

    return result.changes > 0;
  }

  public getPartyMembers(characterId: string): PartyMember[] {
    const stmt = this.db.prepare<PartyMemberEntity>(
      `SELECT * FROM party_members WHERE character_id = ? ORDER BY position`
    );
    const entities = stmt.all(characterId);

    return entities.map(e => this.toPartyMember(e));
  }

  public getPartySize(characterId: string): number {
    const stmt = this.db.prepare<{ count: number }>(
      `SELECT COUNT(*) as count FROM party_members WHERE character_id = ?`
    );
    const result = stmt.get(characterId);

    return result ? result.count : 0;
  }

  public isInParty(characterId: string, npcId: string): boolean {
    const stmt = this.db.prepare<{ count: number }>(
      `SELECT COUNT(*) as count FROM party_members WHERE character_id = ? AND npc_id = ?`
    );
    const result = stmt.get(characterId, npcId);

    return result ? result.count > 0 : false;
  }

  public updatePartyMemberOrder(characterId: string, npcId: string, orders: PartyMember['orders']): boolean {
    const stmt = this.db.prepare(`
      UPDATE party_members SET orders = ? WHERE character_id = ? AND npc_id = ?
    `);
    const result = stmt.run(JSON.stringify(orders), characterId, npcId);

    return result.changes > 0;
  }

  // ==================== Statistics ====================

  public getStatistics(saveId: string): NPCStatistics {
    const npcs = this.getNPCsBySaveId(saveId);

    const stats: NPCStatistics = {
      total: npcs.length,
      byRole: {
        merchant: 0,
        quest_giver: 0,
        enemy: 0,
        ally: 0,
        neutral: 0,
        romance: 0,
        companion: 0,
        custom: 0,
      },
      byDisposition: {
        helpful: 0,
        neutral: 0,
        unfriendly: 0,
        hostile: 0,
      },
      aliveCount: 0,
      deadCount: 0,
      companionsCount: 0,
      merchantsCount: 0,
      questGiversCount: 0,
    };

    for (const npc of npcs) {
      stats.byRole[npc.role]++;
      if (npc.status.isAlive) {
        stats.aliveCount++;
      } else {
        stats.deadCount++;
      }
      if (npc.flags.isCompanion) {
        stats.companionsCount++;
      }
      if (npc.flags.isMerchant) {
        stats.merchantsCount++;
      }
      if (npc.flags.isQuestGiver) {
        stats.questGiversCount++;
      }
    }

    return stats;
  }

  // ==================== Entity Conversion ====================

  public toNPC(entity: NPCEntity): NPC {
    return {
      id: entity.id,
      saveId: entity.save_id,
      name: entity.name,
      title: entity.title,
      race: entity.race,
      occupation: entity.occupation,
      appearance: JSON.parse(entity.appearance || '{}') as NPC['appearance'],
      personality: JSON.parse(entity.personality || '{}') as NPC['personality'],
      status: JSON.parse(entity.status || '{}') as NPC['status'],
      stats: JSON.parse(entity.stats || '{}') as NPC['stats'],
      flags: JSON.parse(entity.flags || '{}') as NPC['flags'],
      role: entity.role,
      disposition: entity.disposition,
      dialogue: JSON.parse(entity.dialogue || '{}') as NPC['dialogue'],
      services: JSON.parse(entity.services || '[]') as string[],
      inventory: JSON.parse(entity.inventory || '[]') as string[],
      quests: JSON.parse(entity.quests || '[]') as string[],
      relationships: JSON.parse(entity.relationships || '{}') as Record<string, NPCRelationship>,
      backstory: entity.backstory,
      secrets: JSON.parse(entity.secrets || '[]') as string[],
      customData: JSON.parse(entity.custom_data || '{}') as Record<string, unknown>,
      createdAt: entity.created_at ?? Math.floor(Date.now() / 1000),
      updatedAt: entity.updated_at ?? Math.floor(Date.now() / 1000),
    };
  }

  public toRelationship(entity: NPCRelationshipEntity): NPCRelationship {
    return {
      characterId: entity.character_id,
      npcId: entity.npc_id,
      type: entity.type,
      level: entity.level,
      trustLevel: entity.trust_level,
      respectLevel: entity.respect_level,
      affectionLevel: entity.affection_level,
      fearLevel: entity.fear_level,
      interactionCount: entity.interaction_count,
      lastInteractionAt: entity.last_interaction_at,
      firstMetAt: entity.first_met_at,
      flags: JSON.parse(entity.flags || '{}') as NPCRelationship['flags'],
      notes: JSON.parse(entity.notes || '[]') as string[],
      customData: JSON.parse(entity.custom_data || '{}') as Record<string, unknown>,
    };
  }

  public toPartyMember(entity: PartyMemberEntity): PartyMember {
    return {
      npcId: entity.npc_id,
      characterId: entity.character_id,
      joinedAt: entity.joined_at,
      role: entity.role as PartyMember['role'],
      position: entity.position,
      orders: JSON.parse(entity.orders || '{}') as PartyMember['orders'],
      customData: JSON.parse(entity.custom_data || '{}') as Record<string, unknown>,
    };
  }
}

let _npcRepository: NPCRepository | null = null;

export function getNPCRepository(): NPCRepository {
  if (!_npcRepository) {
    _npcRepository = NPCRepository.getInstance();
  }
  return _npcRepository;
}

export const npcRepository = {
  get instance() {
    return getNPCRepository();
  },
};
