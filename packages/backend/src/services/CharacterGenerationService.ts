import type { LLMService } from './llm/LLMService';
import type {
  StoryTemplate,
  RaceDefinition,
  ClassDefinition,
  BackgroundDefinition,
  AttributeDefinition,
  GeneratedRaceOption,
  GeneratedClassOption,
  GeneratedBackgroundOption,
  AttributeCalculationResult,
  Character,
  ToolCallContext,
  CalculateAttributesResponse,
} from '@ai-rpg/shared';
import { ToolType, AgentType } from '@ai-rpg/shared';
import { AIGenerateService } from './AIGenerateService';
import { gameLog } from './GameLogService';
import { getToolRegistry } from '../tools/ToolRegistry';
import { getDecisionLogService } from './DecisionLogService';
import { getWriteOperationReviewService } from './WriteOperationReviewService';
import { ContextManager } from '../context/ContextManager';

export interface CharacterGenerationOptions {
  generateImagePrompt: boolean;
}

export class CharacterGenerationService {
  private contextManager: ContextManager | null = null;

  constructor(
    private llmService: LLMService,
    private aiGenerateService: AIGenerateService
  ) {}

  /**
   * 设置 ContextManager
   */
  setContextManager(contextManager: ContextManager): void {
    this.contextManager = contextManager;
  }

  async generateRaceOptions(template: StoryTemplate, count: number = 3): Promise<GeneratedRaceOption[]> {
    const races = await this.aiGenerateService.generateRaces({
      template,
      targetType: 'race',
      aiBehavior: template.aiConstraints?.aiBehavior,
      numericalComplexity: template.numericalComplexity,
    }, count);
    
    return races.map(race => ({
      ...race,
      isAIGenerated: true,
    }));
  }

  async generateClassOptions(
    template: StoryTemplate,
    selectedRace: RaceDefinition | GeneratedRaceOption | null,
    count: number = 3
  ): Promise<GeneratedClassOption[]> {
    const raceContext = selectedRace
      ? `已选种族: ${selectedRace.name}，该种族可选职业: ${selectedRace.availableClasses.join(', ')}`
      : '';

    const classes = await this.aiGenerateService.generateClasses({
      template,
      targetType: 'class',
      userPrompt: raceContext,
      aiBehavior: template.aiConstraints?.aiBehavior,
      numericalComplexity: template.numericalComplexity,
    }, count);
    
    return classes.map(cls => ({
      ...cls,
      isAIGenerated: true,
    }));
  }

  async generateBackgroundOptions(
    template: StoryTemplate,
    selectedRace: RaceDefinition | GeneratedRaceOption | null,
    selectedClass: ClassDefinition | GeneratedClassOption | null,
    count: number = 3
  ): Promise<GeneratedBackgroundOption[]> {
    const contextParts: string[] = [];
    if (selectedRace) {
      contextParts.push(`已选种族: ${selectedRace.name}`);
    }
    if (selectedClass) {
      contextParts.push(`已选职业: ${selectedClass.name}`);
    }
    const context = contextParts.join('，');

    const backgrounds = await this.aiGenerateService.generateBackgrounds({
      template,
      targetType: 'background',
      userPrompt: context,
      aiBehavior: template.aiConstraints?.aiBehavior,
      numericalComplexity: template.numericalComplexity,
    }, count);
    
    return backgrounds.map(bg => ({
      ...bg,
      isAIGenerated: true,
    }));
  }

  /**
   * 计算属性
   * 优先使用 NumericalTool，如果不可用则使用原有逻辑
   */
  async calculateAttributes(
    attributes: AttributeDefinition[],
    race: RaceDefinition | GeneratedRaceOption,
    cls: ClassDefinition | GeneratedClassOption,
    _background: BackgroundDefinition | GeneratedBackgroundOption
  ): Promise<AttributeCalculationResult> {
    // 尝试使用 NumericalTool
    const toolRegistry = getToolRegistry();
    const numericalTool = toolRegistry.getTool(ToolType.NUMERICAL);

    if (numericalTool) {
      try {
        const context: ToolCallContext = {
          agentId: AgentType.COORDINATOR,
          requestId: `char_gen_${Date.now()}`,
          timestamp: Date.now(),
          permission: 'read',
        };

        const result = await numericalTool.execute<AttributeCalculationResult>(
          'calculateBaseAttributes',
          {
            level: 1,
            race: race.id,
            class: cls.id,
          },
          context
        );

        if (result.success && result.data) {
          gameLog.debug('system', 'calculateAttributes using NumericalTool', {
            race: race.id,
            class: cls.id,
          });
          
          // 将 NumericalTool 返回的属性转换为 AttributeCalculationResult 格式
          const calcResponse = result.data as unknown as CalculateAttributesResponse;
          return this.convertToAttributeCalculationResult(
            calcResponse.attributes,
            attributes,
            race,
            cls
          );
        }
      } catch (error) {
        gameLog.warn('system', 'NumericalTool calculateAttributes failed, using fallback', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // Fallback to original logic
    return this.calculateAttributesFallback(attributes, race, cls, _background);
  }

  /**
   * 将 NumericalTool 返回的属性转换为 AttributeCalculationResult 格式
   */
  private convertToAttributeCalculationResult(
    calculatedAttrs: Record<string, number>,
    attributes: AttributeDefinition[],
    race: RaceDefinition | GeneratedRaceOption,
    cls: ClassDefinition | GeneratedClassOption
  ): AttributeCalculationResult {
    const result: AttributeCalculationResult = {};

    for (const attr of attributes) {
      const finalValue = calculatedAttrs[attr.id] ?? calculatedAttrs[attr.abbreviation] ?? attr.defaultValue;
      const raceBonus = race.bonuses[attr.id] || race.bonuses[attr.abbreviation] || 0;
      const racePenalty = race.penalties[attr.id] || race.penalties[attr.abbreviation] || 0;
      const classBonus = cls.primaryAttributes.includes(attr.id) || cls.primaryAttributes.includes(attr.abbreviation) ? 1 : 0;

      result[attr.id] = {
        baseValue: attr.defaultValue,
        raceBonus: raceBonus - racePenalty,
        classBonus,
        backgroundBonus: 0,
        finalValue: Math.max(attr.minValue, Math.min(attr.maxValue, finalValue)),
      };
    }

    return result;
  }

  /**
   * 原有的属性计算逻辑（作为 fallback）
   */
  private calculateAttributesFallback(
    attributes: AttributeDefinition[],
    race: RaceDefinition | GeneratedRaceOption,
    cls: ClassDefinition | GeneratedClassOption,
    _background: BackgroundDefinition | GeneratedBackgroundOption
  ): AttributeCalculationResult {
    const result: AttributeCalculationResult = {};
    
    gameLog.debug('system', 'calculateAttributes fallback called');
    gameLog.debug('system', 'attributes', { data: attributes.map(a => ({ id: a.id, abbr: a.abbreviation })) });
    gameLog.debug('system', 'race', { data: { name: race.name, bonuses: race.bonuses, penalties: race.penalties } });
    gameLog.debug('system', 'class', { data: { name: cls.name, primaryAttributes: cls.primaryAttributes } });
    
    for (const attr of attributes) {
      const baseValue = attr.defaultValue;
      const raceBonus = race.bonuses[attr.id] || race.bonuses[attr.abbreviation] || 0;
      const racePenalty = race.penalties[attr.id] || race.penalties[attr.abbreviation] || 0;
      const classBonus = cls.primaryAttributes.includes(attr.id) || cls.primaryAttributes.includes(attr.abbreviation) ? 1 : 0;
      
      gameLog.debug('system', `${attr.id}: base=${baseValue}, raceBonus=${raceBonus}, racePenalty=${racePenalty}, classBonus=${classBonus}`);
      
      const finalValue = baseValue + raceBonus - racePenalty + classBonus;
      
      result[attr.id] = {
        baseValue,
        raceBonus: raceBonus - racePenalty,
        classBonus,
        backgroundBonus: 0,
        finalValue: Math.max(attr.minValue, Math.min(attr.maxValue, finalValue)),
      };
    }
    
    return result;
  }

  async generateAppearance(
    template: StoryTemplate,
    characterName: string,
    race: RaceDefinition | GeneratedRaceOption,
    cls: ClassDefinition | GeneratedClassOption,
    background: BackgroundDefinition | GeneratedBackgroundOption,
    options: CharacterGenerationOptions
  ): Promise<{ appearance: string; imagePrompt: string }> {
    const systemPrompt = `你是一个RPG游戏的角色外观描述专家。根据角色的种族、职业和背景，生成生动的外观描述。

请以JSON格式返回，包含以下字段：
- appearance: 角色的外观描述，包括体型、面容、穿着、气质等，约100-200字
- imagePrompt: 用于AI绘图的英文提示词，描述角色的主要视觉特征，约50-100词

只返回JSON，不要有其他文字。`;

    const userMessage = `请为以下角色生成外观描述：

角色名称: ${characterName}
种族: ${race.name} - ${race.description}
职业: ${cls.name} - ${cls.description}
背景: ${background.name} - ${background.description}
世界观: ${template.worldSetting.name} - ${template.worldSetting.era}

${options.generateImagePrompt ? '请同时生成英文的AI绘图提示词。' : '不需要生成AI绘图提示词，imagePrompt字段留空。'}`;

    try {
      const response = await this.llmService.chat(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        { temperature: 0.8, maxTokens: 500, agentType: 'template' }
      );

      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          appearance: parsed.appearance || '',
          imagePrompt: parsed.imagePrompt || '',
        };
      }
    } catch (error) {
      gameLog.error('system', 'Failed to generate appearance', { error });
    }

    return {
      appearance: `${characterName}是一个${race.name}${cls.name}，来自${background.name}背景。`,
      imagePrompt: '',
    };
  }

  async generateBackstory(
    template: StoryTemplate,
    characterName: string,
    race: RaceDefinition | GeneratedRaceOption,
    cls: ClassDefinition | GeneratedClassOption,
    background: BackgroundDefinition | GeneratedBackgroundOption
  ): Promise<string> {
    const systemPrompt = `你是一个RPG游戏的角色背景故事撰写专家。根据角色的种族、职业和背景，生成一个引人入胜的背景故事。

要求：
- 故事应该与世界观相符
- 故事应该解释角色为什么成为现在的职业
- 故事应该包含角色的动机和目标
- 故事长度约150-300字

只返回故事文本，不要有其他格式。`;

    const userMessage = `请为以下角色生成背景故事：

角色名称: ${characterName}
种族: ${race.name}
职业: ${cls.name}
背景: ${background.name} - ${background.description}
世界观: ${template.worldSetting.name} - ${template.worldSetting.description}`;

    try {
      const response = await this.llmService.chat(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        { temperature: 0.8, maxTokens: 500, agentType: 'template' }
      );

      return response.content.trim();
    } catch (error) {
      gameLog.error('system', 'Failed to generate backstory', { error });
      return `${characterName}来自${background.name}，经过多年的历练成为了一名${cls.name}。`;
    }
  }

  async finalizeCharacter(
    template: StoryTemplate,
    characterName: string,
    race: RaceDefinition | GeneratedRaceOption,
    cls: ClassDefinition | GeneratedClassOption,
    background: BackgroundDefinition | GeneratedBackgroundOption,
    attributes: AttributeDefinition[],
    options: CharacterGenerationOptions
  ): Promise<Character> {
    // 计算属性（使用 NumericalTool 或 fallback）
    const calculatedAttributes = await this.calculateAttributes(attributes, race, cls, background);
    const { appearance, imagePrompt } = await this.generateAppearance(
      template,
      characterName,
      race,
      cls,
      background,
      options
    );
    const backstory = await this.generateBackstory(template, characterName, race, cls, background);

    const baseAttributes: Character['baseAttributes'] = {
      strength: calculatedAttributes['strength']?.finalValue || 10,
      dexterity: calculatedAttributes['dexterity']?.finalValue || 10,
      constitution: calculatedAttributes['constitution']?.finalValue || 10,
      intelligence: calculatedAttributes['intelligence']?.finalValue || 10,
      wisdom: calculatedAttributes['wisdom']?.finalValue || 10,
      charisma: calculatedAttributes['charisma']?.finalValue || 10,
    };

    for (const attr of attributes) {
      if (!['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'].includes(attr.id)) {
        if (!baseAttributes.customStats) {
          baseAttributes.customStats = {};
        }
        baseAttributes.customStats[attr.id] = calculatedAttributes[attr.id]?.finalValue || attr.defaultValue;
      }
    }

    const constitutionBonus = Math.floor((baseAttributes.constitution - 10) / 2);
    const hitDieValue = parseInt(cls.hitDie.replace('d', '')) || 8;
    const maxHp = hitDieValue + constitutionBonus;

    const character: Character = {
      id: `char_${Date.now()}`,
      name: characterName,
      race: race.id,
      class: cls.id,
      backgroundId: background.id, // 添加背景模板 ID
      level: 1,
      experience: 0,
      baseAttributes,
      derivedAttributes: {
        maxHp,
        currentHp: maxHp,
        maxMp: 0,
        currentMp: 0,
        attack: baseAttributes.strength,
        defense: baseAttributes.constitution,
        speed: baseAttributes.dexterity,
        luck: 0,
      },
      skills: [],
      equipment: {},
      inventory: [],
      currency: {},
      statusEffects: [],
      appearance,
      imagePrompt: options.generateImagePrompt ? imagePrompt : undefined,
      personality: '',
      backstory,
      statistics: {
        battlesWon: 0,
        questsCompleted: 0,
        distanceTraveled: 0,
        itemsCrafted: 0,
        npcsMet: 0,
        playTime: 0,
      },
    };

    // 写操作审核
    await this.reviewCharacterCreation(character);

    // 记录决策日志
    this.recordCharacterCreationDecision(character, race, cls, background);

    // 写入全局上下文
    this.writeCharacterToContext(character);

    return character;
  }

  /**
   * 审核角色创建操作
   */
  private async reviewCharacterCreation(character: Character): Promise<void> {
    const reviewService = getWriteOperationReviewService();
    if (!reviewService) {
      gameLog.debug('system', 'WriteOperationReviewService not available, skipping review');
      return;
    }

    try {
      const review = await reviewService.reviewOperation({
        toolType: ToolType.INVENTORY_DATA,
        method: 'createCharacter',
        params: { character },
        context: { saveId: 'new', agentId: 'character_generation' },
      });

      if (!review.approved) {
        gameLog.warn('system', 'Character creation review failed', {
          violations: review.violations,
          characterId: character.id,
        });
      } else {
        gameLog.debug('system', 'Character creation review passed', {
          characterId: character.id,
        });
      }
    } catch (error) {
      gameLog.error('system', 'Error during character creation review', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * 记录角色创建决策
   */
  private recordCharacterCreationDecision(
    character: Character,
    race: RaceDefinition | GeneratedRaceOption,
    cls: ClassDefinition | GeneratedClassOption,
    background: BackgroundDefinition | GeneratedBackgroundOption
  ): void {
    const decisionLogService = getDecisionLogService();
    if (!decisionLogService) {
      gameLog.debug('system', 'DecisionLogService not available, skipping decision log');
      return;
    }

    try {
      decisionLogService.addDecision(AgentType.COORDINATOR, {
        action: 'character_created',
        reasoning: `创建新角色: ${character.name}，种族: ${race.name}，职业: ${cls.name}，背景: ${background.name}`,
        toolCalls: [],
      });

      gameLog.debug('system', 'Character creation decision logged', {
        characterId: character.id,
        race: race.id,
        class: cls.id,
        background: background.id,
      });
    } catch (error) {
      gameLog.error('system', 'Error logging character creation decision', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * 将角色数据写入全局上下文
   */
  private writeCharacterToContext(character: Character): void {
    if (!this.contextManager) {
      gameLog.debug('system', 'ContextManager not available, skipping context write');
      return;
    }

    try {
      const agentContext = this.contextManager.getAgentContext(AgentType.COORDINATOR);
      agentContext.set('character', character, 'character_created');

      gameLog.debug('system', 'Character written to global context', {
        characterId: character.id,
      });
    } catch (error) {
      gameLog.error('system', 'Error writing character to context', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

let characterGenerationService: CharacterGenerationService | null = null;

export function getCharacterGenerationService(): CharacterGenerationService | null {
  return characterGenerationService;
}

export function initializeCharacterGenerationService(
  llmService: LLMService,
  aiGenerateService: AIGenerateService,
  contextManager?: ContextManager
): CharacterGenerationService {
  characterGenerationService = new CharacterGenerationService(llmService, aiGenerateService);
  
  if (contextManager) {
    characterGenerationService.setContextManager(contextManager);
  }
  
  return characterGenerationService;
}
