import { BaseRepository, BaseEntity } from './BaseRepository';
import type { Binding, BindingMatch, AgentType } from '@ai-rpg/shared';

export interface BindingEntity extends BaseEntity {
  agent_id: string;
  match: string;
  priority: number;
  enabled: number;
  description: string | null;
}

export class BindingRepository extends BaseRepository<BindingEntity> {
  constructor() {
    super('bindings');
  }

  public findAllOrderByPriority(): BindingEntity[] {
    const stmt = this.db.prepare<BindingEntity>(
      `SELECT * FROM bindings ORDER BY priority DESC`
    );
    return stmt.all();
  }

  public findByAgentId(agentId: AgentType): BindingEntity[] {
    const stmt = this.db.prepare<BindingEntity>(
      `SELECT * FROM bindings WHERE agent_id = ? ORDER BY priority DESC`
    );
    return stmt.all(agentId);
  }

  public findAllEnabled(): BindingEntity[] {
    const stmt = this.db.prepare<BindingEntity>(
      `SELECT * FROM bindings WHERE enabled = 1 ORDER BY priority DESC`
    );
    return stmt.all();
  }

  public create(binding: Binding): BindingEntity {
    const id = binding.id || this.generateId();
    const now = Date.now();
    const stmt = this.db.prepare(`
      INSERT INTO bindings (
        id, agent_id, match, priority, enabled, description, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      binding.agentId,
      JSON.stringify(binding.match),
      binding.priority,
      binding.enabled ? 1 : 0,
      binding.description || null,
      binding.createdAt || now,
      binding.updatedAt || now
    );

    return this.findById(id) as BindingEntity;
  }

  public update(id: string, binding: Partial<Omit<Binding, 'id' | 'createdAt'>>): BindingEntity | undefined {
    const fields: string[] = [];
    const values: (string | number | null)[] = [];

    if (binding.agentId !== undefined) {
      fields.push('agent_id = ?');
      values.push(binding.agentId);
    }
    if (binding.match !== undefined) {
      fields.push('match = ?');
      values.push(JSON.stringify(binding.match));
    }
    if (binding.priority !== undefined) {
      fields.push('priority = ?');
      values.push(binding.priority);
    }
    if (binding.enabled !== undefined) {
      fields.push('enabled = ?');
      values.push(binding.enabled ? 1 : 0);
    }
    if (binding.description !== undefined) {
      fields.push('description = ?');
      values.push(binding.description || null);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    fields.push('updated_at = ?');
    values.push(Date.now());
    values.push(id);

    const stmt = this.db.prepare(
      `UPDATE bindings SET ${fields.join(', ')} WHERE id = ?`
    );
    stmt.run(...values);

    return this.findById(id);
  }

  public upsert(binding: Binding): BindingEntity {
    const existing = this.findById(binding.id);
    if (existing) {
      return this.update(binding.id, binding) as BindingEntity;
    }
    return this.create(binding);
  }

  public saveAll(bindings: Binding[]): void {
    this.db.transaction(() => {
      // 清空现有数据
      this.deleteAll();

      // 插入新数据
      for (const binding of bindings) {
        this.create(binding);
      }
    });
  }

  public deleteAll(): void {
    const stmt = this.db.prepare(`DELETE FROM bindings`);
    stmt.run();
  }

  public delete(id: string): boolean {
    const stmt = this.db.prepare(`DELETE FROM bindings WHERE id = ?`);
    const result = stmt.run(id);
    return result.changes > 0;
  }

  public toBinding(entity: BindingEntity): Binding {
    return {
      id: entity.id,
      agentId: entity.agent_id as AgentType,
      match: JSON.parse(entity.match) as BindingMatch,
      priority: entity.priority,
      enabled: entity.enabled === 1,
      description: entity.description || undefined,
      createdAt: entity.created_at || Date.now(),
      updatedAt: entity.updated_at || Date.now(),
    };
  }

  public toBindings(entities: BindingEntity[]): Binding[] {
    return entities.map((entity) => this.toBinding(entity));
  }

  public fromBinding(binding: Binding): Omit<BindingEntity, 'id' | 'created_at' | 'updated_at'> {
    return {
      agent_id: binding.agentId,
      match: JSON.stringify(binding.match),
      priority: binding.priority,
      enabled: binding.enabled ? 1 : 0,
      description: binding.description || null,
    };
  }
}
