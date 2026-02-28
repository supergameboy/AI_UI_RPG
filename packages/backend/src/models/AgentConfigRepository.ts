import { BaseRepository, BaseEntity } from './BaseRepository';
import type { AgentConfig, AgentType } from '@ai-rpg/shared';

export interface AgentConfigEntity extends BaseEntity {
  agent_type: string;
  provider: string;
  model: string;
  temperature: number;
  max_tokens: number;
  timeout: number;
  max_retries: number;
  system_prompt: string | null;
  custom_config: string;
  enabled: number;
}

export class AgentConfigRepository extends BaseRepository<AgentConfigEntity> {
  constructor() {
    super('agent_configs');
  }

  public findByAgentType(agentType: AgentType): AgentConfigEntity | undefined {
    const stmt = this.db.prepare<AgentConfigEntity>(
      `SELECT * FROM agent_configs WHERE agent_type = ?`
    );
    return stmt.get(agentType);
  }

  public findAllEnabled(): AgentConfigEntity[] {
    const stmt = this.db.prepare<AgentConfigEntity>(
      `SELECT * FROM agent_configs WHERE enabled = 1`
    );
    return stmt.all();
  }

  public create(config: Omit<AgentConfigEntity, 'id' | 'created_at' | 'updated_at'>): AgentConfigEntity {
    const id = this.generateId();
    const stmt = this.db.prepare(`
      INSERT INTO agent_configs (
        id, agent_type, provider, model, temperature, max_tokens,
        timeout, max_retries, system_prompt, custom_config, enabled
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      id,
      config.agent_type,
      config.provider,
      config.model,
      config.temperature,
      config.max_tokens,
      config.timeout,
      config.max_retries,
      config.system_prompt,
      config.custom_config,
      config.enabled
    );

    return this.findById(id) as AgentConfigEntity;
  }

  public updateByAgentType(
    agentType: AgentType,
    updates: Partial<Omit<AgentConfigEntity, 'id' | 'agent_type' | 'created_at'>>
  ): AgentConfigEntity | undefined {
    const fields: string[] = [];
    const values: (string | number | null)[] = [];

    if (updates.provider !== undefined) {
      fields.push('provider = ?');
      values.push(updates.provider);
    }
    if (updates.model !== undefined) {
      fields.push('model = ?');
      values.push(updates.model);
    }
    if (updates.temperature !== undefined) {
      fields.push('temperature = ?');
      values.push(updates.temperature);
    }
    if (updates.max_tokens !== undefined) {
      fields.push('max_tokens = ?');
      values.push(updates.max_tokens);
    }
    if (updates.timeout !== undefined) {
      fields.push('timeout = ?');
      values.push(updates.timeout);
    }
    if (updates.max_retries !== undefined) {
      fields.push('max_retries = ?');
      values.push(updates.max_retries);
    }
    if (updates.system_prompt !== undefined) {
      fields.push('system_prompt = ?');
      values.push(updates.system_prompt);
    }
    if (updates.custom_config !== undefined) {
      fields.push('custom_config = ?');
      values.push(updates.custom_config);
    }
    if (updates.enabled !== undefined) {
      fields.push('enabled = ?');
      values.push(updates.enabled);
    }

    if (fields.length === 0) {
      return this.findByAgentType(agentType);
    }

    fields.push("updated_at = strftime('%s', 'now')");
    values.push(agentType);

    const stmt = this.db.prepare(
      `UPDATE agent_configs SET ${fields.join(', ')} WHERE agent_type = ?`
    );
    stmt.run(...values);

    return this.findByAgentType(agentType);
  }

  public deleteByAgentType(agentType: AgentType): boolean {
    const stmt = this.db.prepare(`DELETE FROM agent_configs WHERE agent_type = ?`);
    const result = stmt.run(agentType);
    return result.changes > 0;
  }

  public toAgentConfig(entity: AgentConfigEntity): AgentConfig {
    return {
      provider: entity.provider,
      model: entity.model,
      temperature: entity.temperature,
      maxTokens: entity.max_tokens,
      timeout: entity.timeout,
      maxRetries: entity.max_retries,
    };
  }

  public fromAgentConfig(agentType: AgentType, config: AgentConfig, systemPrompt?: string): Omit<AgentConfigEntity, 'id' | 'created_at' | 'updated_at'> {
    return {
      agent_type: agentType,
      provider: config.provider,
      model: config.model,
      temperature: config.temperature,
      max_tokens: config.maxTokens,
      timeout: config.timeout,
      max_retries: config.maxRetries,
      system_prompt: systemPrompt || null,
      custom_config: '{}',
      enabled: 1,
    };
  }
}
