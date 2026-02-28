import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import type { 
  PromptTemplate, 
  PromptVersion, 
  PromptTestResult, 
  PromptContext,
  PromptVariable,
} from '@ai-rpg/shared';
import { AgentType, VARIABLE_PATTERN, BUILTIN_VARIABLES } from '@ai-rpg/shared';
import { getPromptRepository, PromptRepository } from '../models/PromptRepository';
import { getLLMService } from './llm/LLMService';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class PromptService {
  private repository: PromptRepository;
  private templateCache: Map<AgentType, PromptTemplate> = new Map();
  private promptsDir: string;
  private initialized: boolean = false;

  constructor() {
    this.repository = getPromptRepository();
    this.promptsDir = path.join(__dirname, '../prompts');
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    console.log('[PromptService] Initializing...');

    await this.loadTemplatesFromFiles();
    await this.loadTemplatesFromDatabase();

    this.initialized = true;
    console.log(`[PromptService] Initialized with ${this.templateCache.size} templates`);
  }

  private async loadTemplatesFromFiles(): Promise<void> {
    if (!fs.existsSync(this.promptsDir)) {
      console.log('[PromptService] Prompts directory not found, skipping file load');
      return;
    }

    const agentTypeMap: Record<string, AgentType> = {
      'coordinator': AgentType.COORDINATOR,
      'story_context': AgentType.STORY_CONTEXT,
      'dialogue': AgentType.DIALOGUE,
      'quest': AgentType.QUEST,
      'combat': AgentType.COMBAT,
      'map': AgentType.MAP,
      'npc_party': AgentType.NPC_PARTY,
      'numerical': AgentType.NUMERICAL,
      'inventory': AgentType.INVENTORY,
      'skill': AgentType.SKILL,
      'ui': AgentType.UI,
      'event': AgentType.EVENT,
    };

    const files = fs.readdirSync(this.promptsDir).filter(f => f.endsWith('.md'));

    for (const file of files) {
      const baseName = path.basename(file, '.md');
      const agentType = agentTypeMap[baseName];

      if (!agentType) {
        console.warn(`[PromptService] Unknown agent type for file: ${file}`);
        continue;
      }

      const filePath = path.join(this.promptsDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const variables = this.extractVariables(content);

      const existingInDb = this.repository.findByAgentType(agentType);
      
      if (!existingInDb) {
        const template: PromptTemplate = {
          id: '',
          agentType,
          name: this.getAgentDisplayName(agentType),
          description: `Default prompt template for ${this.getAgentDisplayName(agentType)}`,
          content,
          variables,
          metadata: {
            createdAt: Date.now(),
            updatedAt: Date.now(),
            version: 1,
            author: 'System',
          },
        };

        const entity = this.repository.fromPromptTemplate(template);
        const saved = this.repository.create({
          ...entity,
          agent_type: agentType,
        });

        const savedTemplate = this.repository.toPromptTemplate(saved);
        this.templateCache.set(agentType, savedTemplate);
        console.log(`[PromptService] Loaded template from file: ${baseName}`);
      }
    }
  }

  private async loadTemplatesFromDatabase(): Promise<void> {
    const entities = this.repository.findAll();

    for (const entity of entities) {
      const template = this.repository.toPromptTemplate(entity);
      this.templateCache.set(template.agentType, template);
    }
  }

  private extractVariables(content: string): PromptVariable[] {
    const variables: PromptVariable[] = [];
    const seen = new Set<string>();
    const matches = content.matchAll(VARIABLE_PATTERN);

    for (const match of matches) {
      const varName = match[1];
      if (seen.has(varName)) continue;
      seen.add(varName);

      const builtinVar = BUILTIN_VARIABLES.find(v => v.name === varName);
      if (builtinVar) {
        variables.push(builtinVar);
      } else {
        variables.push({
          name: varName,
          type: 'custom',
          description: `Custom variable: ${varName}`,
          required: false,
        });
      }
    }

    return variables;
  }

  private getAgentDisplayName(agentType: AgentType): string {
    const names: Record<AgentType, string> = {
      [AgentType.COORDINATOR]: 'Coordinator Agent',
      [AgentType.STORY_CONTEXT]: 'Story Context Agent',
      [AgentType.QUEST]: 'Quest Agent',
      [AgentType.MAP]: 'Map Agent',
      [AgentType.NPC_PARTY]: 'NPC & Party Agent',
      [AgentType.NUMERICAL]: 'Numerical Agent',
      [AgentType.INVENTORY]: 'Inventory Agent',
      [AgentType.SKILL]: 'Skill Agent',
      [AgentType.UI]: 'UI Agent',
      [AgentType.COMBAT]: 'Combat Agent',
      [AgentType.DIALOGUE]: 'Dialogue Agent',
      [AgentType.EVENT]: 'Event Agent',
    };
    return names[agentType] || agentType;
  }

  getTemplate(agentType: AgentType): PromptTemplate | undefined {
    return this.templateCache.get(agentType);
  }

  getAllTemplates(): PromptTemplate[] {
    return Array.from(this.templateCache.values());
  }

  async updateTemplate(
    agentType: AgentType, 
    updates: { content?: string; name?: string; description?: string }
  ): Promise<PromptTemplate | undefined> {
    const existing = this.templateCache.get(agentType);
    if (!existing) {
      return undefined;
    }

    const newVariables = updates.content ? this.extractVariables(updates.content) : existing.variables;

    const entity = this.repository.update(existing.id, {
      name: updates.name,
      description: updates.description,
      content: updates.content,
      variables: JSON.stringify(newVariables),
    });

    if (!entity) {
      return undefined;
    }

    const latestVersion = this.repository.getLatestVersionNumber(existing.id);
    this.repository.createVersion({
      template_id: existing.id,
      version: latestVersion + 1,
      content: existing.content,
      variables: JSON.stringify(existing.variables),
      created_by: 'user',
      change_note: 'Auto-saved before update',
    });

    const updatedTemplate = this.repository.toPromptTemplate(entity);
    this.templateCache.set(agentType, updatedTemplate);

    return updatedTemplate;
  }

  injectVariables(content: string, context: PromptContext): string {
    let result = content;
    const matches = content.matchAll(VARIABLE_PATTERN);

    for (const match of matches) {
      const varName = match[1];
      const value = this.getVariableValue(varName, context);
      
      if (value !== undefined) {
        result = result.replace(match[0], value);
      }
    }

    return result;
  }

  private getVariableValue(varName: string, context: PromptContext): string | undefined {
    switch (varName) {
      case 'game_state':
        return context.gameState?.fullState 
          ? JSON.stringify(context.gameState.fullState, null, 2)
          : '{}';
      case 'current_chapter':
        return context.gameState?.currentChapter?.toString() ?? '1';
      case 'current_location':
        return context.gameState?.currentLocation ?? 'Unknown';
      case 'game_time':
        return context.gameState?.gameTime ?? 'Unknown';
      case 'player_name':
        return context.player?.name ?? 'Player';
      case 'player_class':
        return context.player?.class ?? 'Adventurer';
      case 'player_level':
        return context.player?.level?.toString() ?? '1';
      case 'player_attributes':
        return context.player?.attributes 
          ? JSON.stringify(context.player.attributes, null, 2)
          : '{}';
      case 'world_name':
        return context.world?.name ?? 'Unknown World';
      case 'world_era':
        return context.world?.era ?? 'Unknown Era';
      case 'magic_system':
        return context.world?.magicSystem ?? 'None';
      case 'custom_settings':
        return context.world?.customSettings
          ? JSON.stringify(context.world.customSettings, null, 2)
          : '{}';
      case 'recent_history':
        return context.context?.recentHistory ?? '';
      case 'active_quests':
        return context.context?.activeQuests?.join(', ') ?? 'None';
      case 'nearby_npcs':
        return context.context?.nearbyNPCs?.join(', ') ?? 'None';
      case 'available_actions':
        return context.context?.availableActions?.join(', ') ?? 'None';
      default:
        if (context.custom && varName in context.custom) {
          const value = context.custom[varName];
          if (typeof value === 'object') {
            return JSON.stringify(value, null, 2);
          }
          return String(value);
        }
        return undefined;
    }
  }

  buildSystemPrompt(agentType: AgentType, context: PromptContext): string {
    const template = this.templateCache.get(agentType);
    
    if (!template) {
      console.warn(`[PromptService] No template found for agent type: ${agentType}`);
      return `You are a ${agentType} agent in an AI-RPG game.`;
    }

    return this.injectVariables(template.content, context);
  }

  getVersions(agentType: AgentType): PromptVersion[] {
    const template = this.templateCache.get(agentType);
    if (!template) {
      return [];
    }

    const entities = this.repository.findVersionsByTemplateId(template.id);
    return entities.map(e => this.repository.toPromptVersion(e));
  }

  getVersion(agentType: AgentType, version: number): PromptVersion | undefined {
    const template = this.templateCache.get(agentType);
    if (!template) {
      return undefined;
    }

    const entity = this.repository.findVersionByNumber(template.id, version);
    return entity ? this.repository.toPromptVersion(entity) : undefined;
  }

  rollbackToVersion(agentType: AgentType, version: number): PromptTemplate | undefined {
    const template = this.templateCache.get(agentType);
    if (!template) {
      return undefined;
    }

    const targetVersion = this.repository.findVersionByNumber(template.id, version);
    if (!targetVersion) {
      return undefined;
    }

    const currentVersion = this.repository.getLatestVersionNumber(template.id);
    this.repository.createVersion({
      template_id: template.id,
      version: currentVersion + 1,
      content: template.content,
      variables: JSON.stringify(template.variables),
      created_by: 'system',
      change_note: `Auto-saved before rollback to version ${version}`,
    });

    const entity = this.repository.update(template.id, {
      content: targetVersion.content,
      variables: targetVersion.variables,
    });

    if (!entity) {
      return undefined;
    }

    const updatedTemplate = this.repository.toPromptTemplate(entity);
    this.templateCache.set(agentType, updatedTemplate);

    return updatedTemplate;
  }

  async executeTest(
    agentType: AgentType,
    testInput: string,
    context?: PromptContext
  ): Promise<PromptTestResult> {
    const template = this.templateCache.get(agentType);
    if (!template) {
      throw new Error(`No template found for agent type: ${agentType}`);
    }

    const systemPrompt = this.buildSystemPrompt(agentType, context || {});
    const llmService = getLLMService();

    const startTime = Date.now();
    let response;
    let testOutput = '';
    let inputTokens = 0;
    let outputTokens = 0;

    try {
      response = await llmService.chat([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: testInput },
      ], {
        provider: 'deepseek',
        model: 'deepseek-chat',
        temperature: 0.7,
        maxTokens: 2048,
      });

      testOutput = response.content;
      inputTokens = response.usage?.promptTokens || 0;
      outputTokens = response.usage?.completionTokens || 0;
    } catch (error) {
      testOutput = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }

    const responseTime = Date.now() - startTime;
    const totalTokens = inputTokens + outputTokens;

    const resultEntity = this.repository.createTestResult({
      template_id: template.id,
      version: template.metadata.version,
      test_input: testInput,
      test_output: testOutput,
      response_time: responseTime,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      total_tokens: totalTokens,
      evaluation_score: null,
      evaluation_feedback: null,
      evaluation_criteria: '{}',
    });

    return this.repository.toPromptTestResult(resultEntity);
  }

  getTestResults(agentType: AgentType, limit: number = 50): PromptTestResult[] {
    const template = this.templateCache.get(agentType);
    if (!template) {
      return [];
    }

    const entities = this.repository.findTestResultsByTemplateId(template.id, limit);
    return entities.map(e => this.repository.toPromptTestResult(e));
  }

  resetTemplate(agentType: AgentType): PromptTemplate | undefined {
    const template = this.templateCache.get(agentType);
    if (!template) {
      return undefined;
    }

    const filePath = path.join(this.promptsDir, `${this.getAgentTypeFileName(agentType)}.md`);
    if (!fs.existsSync(filePath)) {
      return undefined;
    }

    const defaultContent = fs.readFileSync(filePath, 'utf-8');
    const variables = this.extractVariables(defaultContent);

    const entity = this.repository.update(template.id, {
      content: defaultContent,
      variables: JSON.stringify(variables),
    });

    if (!entity) {
      return undefined;
    }

    const updatedTemplate = this.repository.toPromptTemplate(entity);
    this.templateCache.set(agentType, updatedTemplate);

    return updatedTemplate;
  }

  private getAgentTypeFileName(agentType: AgentType): string {
    const map: Record<AgentType, string> = {
      [AgentType.COORDINATOR]: 'coordinator',
      [AgentType.STORY_CONTEXT]: 'story_context',
      [AgentType.QUEST]: 'quest',
      [AgentType.MAP]: 'map',
      [AgentType.NPC_PARTY]: 'npc_party',
      [AgentType.NUMERICAL]: 'numerical',
      [AgentType.INVENTORY]: 'inventory',
      [AgentType.SKILL]: 'skill',
      [AgentType.UI]: 'ui',
      [AgentType.COMBAT]: 'combat',
      [AgentType.DIALOGUE]: 'dialogue',
      [AgentType.EVENT]: 'event',
    };
    return map[agentType] || agentType;
  }
}

let promptService: PromptService | null = null;

export function getPromptService(): PromptService {
  if (!promptService) {
    promptService = new PromptService();
  }
  return promptService;
}

export async function initializePromptService(): Promise<PromptService> {
  const service = getPromptService();
  await service.initialize();
  return service;
}
