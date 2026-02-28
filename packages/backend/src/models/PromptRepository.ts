import { BaseRepository, BaseEntity } from './BaseRepository';
import type { 
  PromptTemplate, 
  PromptVersion, 
  PromptTestResult, 
  PromptVariable 
} from '@ai-rpg/shared';
import { AgentType } from '@ai-rpg/shared';

export interface PromptTemplateEntity extends BaseEntity {
  agent_type: string;
  name: string;
  description: string | null;
  content: string;
  variables: string;
  metadata: string;
  updated_at: number;
}

export interface PromptVersionEntity extends BaseEntity {
  template_id: string;
  version: number;
  content: string;
  variables: string;
  created_by: string | null;
  change_note: string | null;
}

export interface PromptTestResultEntity extends BaseEntity {
  template_id: string;
  version: number;
  test_input: string;
  test_output: string | null;
  response_time: number;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  evaluation_score: number | null;
  evaluation_feedback: string | null;
  evaluation_criteria: string;
}

export class PromptRepository extends BaseRepository<PromptTemplateEntity> {
  constructor() {
    super('prompt_templates');
  }

  findByAgentType(agentType: AgentType): PromptTemplateEntity | undefined {
    const stmt = this.db.prepare<PromptTemplateEntity>(
      `SELECT * FROM prompt_templates WHERE agent_type = ?`
    );
    return stmt.get(agentType);
  }

  create(entity: Omit<PromptTemplateEntity, 'id' | 'created_at' | 'updated_at'>): PromptTemplateEntity {
    const id = this.generateId();
    const now = Math.floor(Date.now() / 1000);
    
    const stmt = this.db.prepare(
      `INSERT INTO prompt_templates (id, agent_type, name, description, content, variables, metadata, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    
    stmt.run(
      id,
      entity.agent_type,
      entity.name,
      entity.description,
      entity.content,
      entity.variables,
      entity.metadata,
      now,
      now
    );
    
    return this.findById(id)!;
  }

  update(id: string, updates: Partial<Omit<PromptTemplateEntity, 'id' | 'created_at'>>): PromptTemplateEntity | undefined {
    const fields: string[] = [];
    const values: (string | number | null)[] = [];
    
    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.description !== undefined) {
      fields.push('description = ?');
      values.push(updates.description);
    }
    if (updates.content !== undefined) {
      fields.push('content = ?');
      values.push(updates.content);
    }
    if (updates.variables !== undefined) {
      fields.push('variables = ?');
      values.push(updates.variables);
    }
    if (updates.metadata !== undefined) {
      fields.push('metadata = ?');
      values.push(updates.metadata);
    }
    
    if (fields.length === 0) {
      return this.findById(id);
    }
    
    fields.push("updated_at = strftime('%s', 'now')");
    values.push(id);
    
    const stmt = this.db.prepare(
      `UPDATE prompt_templates SET ${fields.join(', ')} WHERE id = ?`
    );
    stmt.run(...values);
    
    return this.findById(id);
  }

  toPromptTemplate(entity: PromptTemplateEntity): PromptTemplate {
    return {
      id: entity.id,
      agentType: entity.agent_type as AgentType,
      name: entity.name,
      description: entity.description || '',
      content: entity.content,
      variables: JSON.parse(entity.variables) as PromptVariable[],
      metadata: {
        ...JSON.parse(entity.metadata),
        createdAt: entity.created_at!,
        updatedAt: entity.updated_at,
      },
    };
  }

  fromPromptTemplate(template: PromptTemplate): Omit<PromptTemplateEntity, 'id' | 'created_at' | 'updated_at'> {
    return {
      agent_type: template.agentType,
      name: template.name,
      description: template.description || null,
      content: template.content,
      variables: JSON.stringify(template.variables),
      metadata: JSON.stringify({
        version: template.metadata.version,
        author: template.metadata.author,
        tags: template.metadata.tags,
      }),
    };
  }

  createVersion(version: Omit<PromptVersionEntity, 'id' | 'created_at'>): PromptVersionEntity {
    const id = `pv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = Math.floor(Date.now() / 1000);
    
    const stmt = this.db.prepare(
      `INSERT INTO prompt_versions (id, template_id, version, content, variables, created_at, created_by, change_note)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );
    
    stmt.run(
      id,
      version.template_id,
      version.version,
      version.content,
      version.variables,
      now,
      version.created_by,
      version.change_note
    );
    
    return this.findVersionById(id)!;
  }

  findVersionById(id: string): PromptVersionEntity | undefined {
    const stmt = this.db.prepare<PromptVersionEntity>(
      `SELECT * FROM prompt_versions WHERE id = ?`
    );
    return stmt.get(id);
  }

  findVersionsByTemplateId(templateId: string): PromptVersionEntity[] {
    const stmt = this.db.prepare<PromptVersionEntity>(
      `SELECT * FROM prompt_versions WHERE template_id = ? ORDER BY version DESC`
    );
    return stmt.all(templateId);
  }

  findVersionByNumber(templateId: string, version: number): PromptVersionEntity | undefined {
    const stmt = this.db.prepare<PromptVersionEntity>(
      `SELECT * FROM prompt_versions WHERE template_id = ? AND version = ?`
    );
    return stmt.get(templateId, version);
  }

  getLatestVersionNumber(templateId: string): number {
    const stmt = this.db.prepare<{ max_version: number | null }>(
      `SELECT MAX(version) as max_version FROM prompt_versions WHERE template_id = ?`
    );
    const result = stmt.get(templateId);
    return result?.max_version ?? 0;
  }

  toPromptVersion(entity: PromptVersionEntity): PromptVersion {
    return {
      id: entity.id,
      templateId: entity.template_id,
      version: entity.version,
      content: entity.content,
      variables: JSON.parse(entity.variables) as PromptVariable[],
      createdAt: entity.created_at!,
      createdBy: entity.created_by || undefined,
      changeNote: entity.change_note || undefined,
    };
  }

  createTestResult(result: Omit<PromptTestResultEntity, 'id' | 'created_at'>): PromptTestResultEntity {
    const id = `ptr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = Math.floor(Date.now() / 1000);
    
    const stmt = this.db.prepare(
      `INSERT INTO prompt_test_results 
       (id, template_id, version, test_input, test_output, response_time, input_tokens, output_tokens, total_tokens, 
        evaluation_score, evaluation_feedback, evaluation_criteria, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    
    stmt.run(
      id,
      result.template_id,
      result.version,
      result.test_input,
      result.test_output,
      result.response_time,
      result.input_tokens,
      result.output_tokens,
      result.total_tokens,
      result.evaluation_score,
      result.evaluation_feedback,
      result.evaluation_criteria,
      now
    );
    
    return this.findTestResultById(id)!;
  }

  findTestResultById(id: string): PromptTestResultEntity | undefined {
    const stmt = this.db.prepare<PromptTestResultEntity>(
      `SELECT * FROM prompt_test_results WHERE id = ?`
    );
    return stmt.get(id);
  }

  findTestResultsByTemplateId(templateId: string, limit: number = 50): PromptTestResultEntity[] {
    const stmt = this.db.prepare<PromptTestResultEntity>(
      `SELECT * FROM prompt_test_results WHERE template_id = ? ORDER BY created_at DESC LIMIT ?`
    );
    return stmt.all(templateId, limit);
  }

  toPromptTestResult(entity: PromptTestResultEntity): PromptTestResult {
    return {
      id: entity.id,
      templateId: entity.template_id,
      version: entity.version,
      testInput: entity.test_input,
      testOutput: entity.test_output || '',
      metrics: {
        responseTime: entity.response_time,
        inputTokens: entity.input_tokens,
        outputTokens: entity.output_tokens,
        totalTokens: entity.total_tokens,
      },
      evaluation: entity.evaluation_score !== null ? {
        score: entity.evaluation_score,
        feedback: entity.evaluation_feedback || '',
        criteria: JSON.parse(entity.evaluation_criteria),
      } : undefined,
      createdAt: entity.created_at!,
    };
  }
}

let promptRepository: PromptRepository | null = null;

export function getPromptRepository(): PromptRepository {
  if (!promptRepository) {
    promptRepository = new PromptRepository();
  }
  return promptRepository;
}
