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
import { AgentType, VARIABLE_PATTERN, BUILTIN_VARIABLES, ToolType } from '@ai-rpg/shared';
import { getPromptRepository, PromptRepository } from '../models/PromptRepository';
import { getLLMService } from './llm/LLMService';
import { gameLog } from './GameLogService';
import { 
  loadModule,
  combineAndCompile,
  type PromptModule,
  type InjectOptions,
} from '../prompts/modules';
import { getToolSchemaGenerator, type OpenAIToolSchema } from './ToolSchemaGenerator';
import { 
  getExamples, 
  formatExamplesAsText, 
  type ExampleCategory,
  type ToolCallExample,
} from '../prompts/examples';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 提示词构建选项
 */
export interface PromptOptions {
  /** 是否包含决策日志 */
  includeDecisionLog?: boolean;
  /** 决策日志数量限制 */
  decisionLogLimit?: number;
  /** 是否包含 Tool Schema */
  includeToolSchema?: boolean;
  /** 指定包含的 Tool 类型 */
  toolTypes?: ToolType[];
  /** 是否包含示例 */
  includeExamples?: boolean;
  /** 示例分类 */
  exampleCategories?: ExampleCategory[];
  /** 使用的模块列表 */
  modules?: string[];
  /** 变量对象 */
  variables?: Record<string, unknown>;
}

/**
 * 占位符模式
 */
const PLACEHOLDER_PATTERN = /\{\{(tool_list|tool_examples|decision_log)\}\}/g;

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

    gameLog.info('backend', '[PromptService] Initializing...');

    await this.loadTemplatesFromFiles();
    await this.loadTemplatesFromDatabase();

    this.initialized = true;
    gameLog.info('backend', `[PromptService] Initialized with ${this.templateCache.size} templates`);
  }

  private async loadTemplatesFromFiles(): Promise<void> {
    if (!fs.existsSync(this.promptsDir)) {
      gameLog.info('backend', '[PromptService] Prompts directory not found, skipping file load');
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
        gameLog.warn('backend', `[PromptService] Unknown agent type for file: ${file}`);
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
        gameLog.info('backend', `[PromptService] Loaded template from file: ${baseName}`);
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

  /**
   * 从模块构建提示词
   * @param moduleNames 模块名称列表
   * @param variables 变量对象
   * @param options 注入选项
   * @returns 构建后的提示词内容
   */
  buildPromptFromModules(
    moduleNames: string[], 
    variables: Record<string, unknown>,
    options: InjectOptions = {}
  ): string {
    gameLog.debug('backend', '[PromptService] Building prompt from modules', {
      moduleCount: moduleNames.length,
      variableCount: Object.keys(variables).length,
    });

    const modules: PromptModule[] = [];
    const missingModules: string[] = [];

    for (const name of moduleNames) {
      const module = loadModule(name);
      if (module) {
        modules.push(module);
      } else {
        missingModules.push(name);
      }
    }

    if (missingModules.length > 0) {
      gameLog.warn('backend', '[PromptService] Some modules not found', {
        missingModules,
      });
    }

    if (modules.length === 0) {
      gameLog.error('backend', '[PromptService] No valid modules found');
      return '';
    }

    // 使用 combineAndCompile 进行组合和编译
    const content = combineAndCompile(moduleNames, variables, { injectOptions: options });

    gameLog.info('backend', '[PromptService] Prompt built from modules', {
      moduleCount: modules.length,
      contentLength: content.length,
    });

    return content;
  }

  /**
   * 注入 Tool Schema 到提示词中
   * @param prompt 原始提示词
   * @param toolTypes 指定的 Tool 类型列表，不指定则使用所有
   * @returns 注入后的提示词
   */
  injectToolSchema(prompt: string, toolTypes?: ToolType[]): string {
    const generator = getToolSchemaGenerator();
    let schemas: OpenAIToolSchema[];

    if (toolTypes && toolTypes.length > 0) {
      // 获取指定 Tool 类型的 Schema
      schemas = [];
      for (const toolType of toolTypes) {
        const cached = generator.getCachedSchema(toolType);
        if (cached) {
          schemas.push(...cached);
        }
      }
    } else {
      // 获取所有 Tool 的 Schema
      schemas = generator.generateAllSchemas();
    }

    if (schemas.length === 0) {
      gameLog.warn('backend', '[PromptService] No tool schemas available for injection');
      return prompt;
    }

    // 格式化 Schema 为文本
    const schemaText = this.formatToolSchemasAsText(schemas);

    // 替换占位符
    const result = prompt.replace(/\{\{tool_list\}\}/g, schemaText);

    gameLog.debug('backend', '[PromptService] Tool schema injected', {
      schemaCount: schemas.length,
      textLength: schemaText.length,
    });

    return result;
  }

  /**
   * 格式化 Tool Schema 为文本
   */
  private formatToolSchemasAsText(schemas: OpenAIToolSchema[]): string {
    const lines: string[] = [];
    lines.push('## 可用工具列表');
    lines.push('');
    lines.push('以下是你可以调用的工具函数：');
    lines.push('');

    for (const schema of schemas) {
      lines.push(`### ${schema.function.name}`);
      lines.push(schema.function.description);
      lines.push('');
      
      if (Object.keys(schema.function.parameters.properties).length > 0) {
        lines.push('**参数**:');
        lines.push('```json');
        lines.push(JSON.stringify(schema.function.parameters, null, 2));
        lines.push('```');
        lines.push('');
      }
    }

    return lines.join('\n');
  }

  /**
   * 注入示例到提示词中
   * @param prompt 原始提示词
   * @param categories 示例分类，不指定则使用所有
   * @returns 注入后的提示词
   */
  injectExamples(prompt: string, categories?: ExampleCategory[]): string {
    const examples = getExamples(categories);

    if (examples.length === 0) {
      gameLog.warn('backend', '[PromptService] No examples available for injection');
      return prompt;
    }

    // 格式化示例为文本
    const examplesText = this.formatExamplesSection(examples);

    // 替换占位符
    const result = prompt.replace(/\{\{tool_examples\}\}/g, examplesText);

    gameLog.debug('backend', '[PromptService] Examples injected', {
      exampleCount: examples.length,
      categories: categories || ['all'],
      textLength: examplesText.length,
    });

    return result;
  }

  /**
   * 格式化示例部分
   */
  private formatExamplesSection(examples: ToolCallExample[]): string {
    const lines: string[] = [];
    lines.push('## 工具调用示例');
    lines.push('');
    lines.push('以下是正确调用工具的示例：');
    lines.push('');

    // 限制示例数量，避免提示词过长
    const maxExamples = 5;
    const limitedExamples = examples.slice(0, maxExamples);

    lines.push(formatExamplesAsText(limitedExamples));

    if (examples.length > maxExamples) {
      lines.push('');
      lines.push(`... 还有 ${examples.length - maxExamples} 个示例未显示`);
    }

    return lines.join('\n');
  }

  /**
   * 注入决策日志到提示词中
   * @param prompt 原始提示词
   * @param decisionLogs 决策日志列表
   * @param limit 限制数量
   * @returns 注入后的提示词
   */
  injectDecisionLog(prompt: string, decisionLogs: unknown[], limit?: number): string {
    if (!decisionLogs || decisionLogs.length === 0) {
      // 移除占位符
      return prompt.replace(/\{\{decision_log\}\}/g, '');
    }

    const limitedLogs = limit ? decisionLogs.slice(-limit) : decisionLogs;
    const logText = this.formatDecisionLogs(limitedLogs);

    const result = prompt.replace(/\{\{decision_log\}\}/g, logText);

    gameLog.debug('backend', '[PromptService] Decision log injected', {
      logCount: limitedLogs.length,
    });

    return result;
  }

  /**
   * 格式化决策日志
   */
  private formatDecisionLogs(logs: unknown[]): string {
    const lines: string[] = [];
    lines.push('## 历史决策记录');
    lines.push('');
    lines.push('以下是最近的决策记录，供参考：');
    lines.push('```json');
    lines.push(JSON.stringify(logs, null, 2));
    lines.push('```');

    return lines.join('\n');
  }

  /**
   * 构建提示词（新方法，支持完整选项）
   * @param options 提示词构建选项
   * @returns 构建后的提示词
   */
  buildPrompt(options: PromptOptions): string {
    const parts: string[] = [];

    // 1. 如果指定了模块，从模块构建
    if (options.modules && options.modules.length > 0) {
      const moduleContent = this.buildPromptFromModules(
        options.modules,
        options.variables || {}
      );
      parts.push(moduleContent);
    }

    // 2. 处理 Tool Schema 注入
    if (options.includeToolSchema) {
      const schemas = this.getToolSchemas(options.toolTypes);
      if (schemas.length > 0) {
        parts.push(this.formatToolSchemasAsText(schemas));
      }
    }

    // 3. 处理示例注入
    if (options.includeExamples) {
      const examples = getExamples(options.exampleCategories);
      if (examples.length > 0) {
        parts.push(this.formatExamplesSection(examples));
      }
    }

    // 4. 如果有变量，注入变量
    let result = parts.join('\n\n---\n\n');
    if (options.variables) {
      result = this.injectVariablesFromRecord(result, options.variables);
    }

    gameLog.info('backend', '[PromptService] Prompt built with options', {
      hasModules: !!options.modules?.length,
      hasToolSchema: options.includeToolSchema,
      hasExamples: options.includeExamples,
      contentLength: result.length,
    });

    return result;
  }

  /**
   * 从 Record 注入变量
   */
  private injectVariablesFromRecord(content: string, variables: Record<string, unknown>): string {
    let result = content;
    for (const [key, value] of Object.entries(variables)) {
      const pattern = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      const valueStr = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
      result = result.replace(pattern, valueStr);
    }
    return result;
  }

  /**
   * 获取 Tool Schemas
   */
  private getToolSchemas(toolTypes?: ToolType[]): OpenAIToolSchema[] {
    const generator = getToolSchemaGenerator();

    if (toolTypes && toolTypes.length > 0) {
      const schemas: OpenAIToolSchema[] = [];
      for (const toolType of toolTypes) {
        const cached = generator.getCachedSchema(toolType);
        if (cached) {
          schemas.push(...cached);
        }
      }
      return schemas;
    }

    return generator.generateAllSchemas();
  }

  /**
   * 构建系统提示词（更新版本，支持新选项）
   * @param agentType Agent 类型
   * @param context 提示词上下文
   * @param options 可选的提示词选项
   * @returns 构建后的系统提示词
   */
  buildSystemPrompt(agentType: AgentType, context: PromptContext, options?: PromptOptions): string {
    const template = this.templateCache.get(agentType);
    
    if (!template) {
      gameLog.warn('backend', `[PromptService] No template found for agent type: ${agentType}`);
      return `You are a ${agentType} agent in an AI-RPG game.`;
    }

    // 基础变量注入
    let result = this.injectVariables(template.content, context);

    // 处理选项
    if (options) {
      // 注入 Tool Schema
      if (options.includeToolSchema) {
        result = this.injectToolSchema(result, options.toolTypes);
      }

      // 注入示例
      if (options.includeExamples) {
        result = this.injectExamples(result, options.exampleCategories);
      }

      // 注入决策日志（如果有）
      if (options.includeDecisionLog && context.custom?.decisionLogs) {
        result = this.injectDecisionLog(
          result, 
          context.custom.decisionLogs as unknown[], 
          options.decisionLogLimit
        );
      }

      // 注入额外变量
      if (options.variables) {
        result = this.injectVariablesFromRecord(result, options.variables);
      }
    }

    // 清理未替换的占位符
    result = result.replace(PLACEHOLDER_PATTERN, '');

    gameLog.debug('backend', '[PromptService] System prompt built', {
      agentType,
      contentLength: result.length,
      hasOptions: !!options,
    });

    return result;
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

// 导出类型
export type { ExampleCategory } from '../prompts/examples';
