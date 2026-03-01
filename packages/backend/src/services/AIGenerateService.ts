import type { LLMService } from './llm/LLMService';
import type {
  NPCDefinition,
  ItemDefinition,
  QuestDefinition,
  StoryTemplate,
  StartingScene,
  AIBehavior,
  NumericalComplexity,
  RaceDefinition,
  ClassDefinition,
  BackgroundDefinition,
  WorldSetting,
} from '@ai-rpg/shared';

interface GenerateContext {
  template: Partial<StoryTemplate>;
  targetType: 'npc' | 'item' | 'quest' | 'scene' | 'race' | 'class' | 'background' | 'worldSetting';
  userPrompt?: string;
  aiBehavior?: AIBehavior;
  numericalComplexity?: NumericalComplexity;
}

export class AIGenerateService {
  constructor(private llmService: LLMService) {}

  async generateNPC(context: GenerateContext): Promise<NPCDefinition | null> {
    const systemPrompt = this.buildSystemPrompt('npc', context);
    const userMessage = this.buildUserMessage('npc', context);

    try {
      const response = await this.llmService.chat(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        { temperature: 0.7, maxTokens: 1000, agentType: 'template' }
      );

      return this.parseNPCResponse(response.content);
    } catch (error) {
      console.error('[AIGenerateService] Failed to generate NPC:', error);
      return null;
    }
  }

  async generateItem(context: GenerateContext): Promise<ItemDefinition | null> {
    const systemPrompt = this.buildSystemPrompt('item', context);
    const userMessage = this.buildUserMessage('item', context);

    try {
      const response = await this.llmService.chat(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        { temperature: 0.7, maxTokens: 1000, agentType: 'template' }
      );

      return this.parseItemResponse(response.content);
    } catch (error) {
      console.error('[AIGenerateService] Failed to generate item:', error);
      return null;
    }
  }

  async generateQuest(context: GenerateContext): Promise<QuestDefinition | null> {
    const systemPrompt = this.buildSystemPrompt('quest', context);
    const userMessage = this.buildUserMessage('quest', context);

    try {
      const response = await this.llmService.chat(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        { temperature: 0.7, maxTokens: 1500, agentType: 'template' }
      );

      return this.parseQuestResponse(response.content);
    } catch (error) {
      console.error('[AIGenerateService] Failed to generate quest:', error);
      return null;
    }
  }

  async generateScene(context: GenerateContext): Promise<StartingScene | null> {
    const systemPrompt = this.buildSystemPrompt('scene', context);
    const userMessage = this.buildUserMessage('scene', context);

    try {
      const response = await this.llmService.chat(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        { temperature: 0.7, maxTokens: 2000, agentType: 'template' }
      );

      return this.parseSceneResponse(response.content);
    } catch (error) {
      console.error('[AIGenerateService] Failed to generate scene:', error);
      return null;
    }
  }

  async generateRace(context: GenerateContext): Promise<RaceDefinition | null> {
    const systemPrompt = this.buildSystemPrompt('race', context);
    const userMessage = this.buildUserMessage('race', context);

    try {
      const response = await this.llmService.chat(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        { temperature: 0.7, maxTokens: 1000, agentType: 'template' }
      );

      return this.parseRaceResponse(response.content);
    } catch (error) {
      console.error('[AIGenerateService] Failed to generate race:', error);
      return null;
    }
  }

  async generateClass(context: GenerateContext): Promise<ClassDefinition | null> {
    const systemPrompt = this.buildSystemPrompt('class', context);
    const userMessage = this.buildUserMessage('class', context);

    try {
      const response = await this.llmService.chat(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        { temperature: 0.7, maxTokens: 1000, agentType: 'template' }
      );

      return this.parseClassResponse(response.content);
    } catch (error) {
      console.error('[AIGenerateService] Failed to generate class:', error);
      return null;
    }
  }

  async generateBackground(context: GenerateContext): Promise<BackgroundDefinition | null> {
    const systemPrompt = this.buildSystemPrompt('background', context);
    const userMessage = this.buildUserMessage('background', context);

    try {
      const response = await this.llmService.chat(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        { temperature: 0.7, maxTokens: 1000, agentType: 'template' }
      );

      return this.parseBackgroundResponse(response.content);
    } catch (error) {
      console.error('[AIGenerateService] Failed to generate background:', error);
      return null;
    }
  }

  async generateWorldSetting(context: GenerateContext): Promise<WorldSetting | null> {
    const systemPrompt = this.buildSystemPrompt('worldSetting', context);
    const userMessage = this.buildUserMessage('worldSetting', context);

    try {
      const response = await this.llmService.chat(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        { temperature: 0.7, maxTokens: 1500, agentType: 'template' }
      );

      return this.parseWorldSettingResponse(response.content);
    } catch (error) {
      console.error('[AIGenerateService] Failed to generate world setting:', error);
      return null;
    }
  }

  private buildSystemPrompt(type: 'npc' | 'item' | 'quest' | 'scene' | 'race' | 'class' | 'background' | 'worldSetting', context: GenerateContext): string {
    const worldContext = this.buildWorldContext(context.template);

    // 构建 AI 行为提示
    const behaviorPrompts = this.buildBehaviorPrompts(context.aiBehavior);
    
    // 构建数值复杂度提示
    const complexityPrompt = this.buildComplexityPrompt(context.numericalComplexity);

    const typePrompts = {
      npc: `你是一个RPG游戏的NPC设计专家。根据世界观背景，自动生成一个符合世界设定的NPC。
请以JSON格式返回，包含以下字段：
- id: 自动生成的唯一ID (格式: npc_时间戳)
- name: NPC名称
- title: NPC头衔或职业 (可选)
- description: NPC的详细描述
- role: 角色类型，必须是以下之一: merchant, quest_giver, enemy, ally, neutral, custom
- personality: 性格特点描述 (可选)
- dialogue: 对话示例数组 (可选)
- stats: 属性对象，包含 level, hp, attack, defense 等 (可选)
- services: 服务类型数组，可包含: shop, inn, blacksmith, healer, training (可选)

只返回JSON，不要有其他文字。`,
      item: `你是一个RPG游戏的物品设计专家。根据世界观背景，自动生成一个符合世界设定的物品。
请以JSON格式返回，包含以下字段：
- id: 自动生成的唯一ID (格式: item_时间戳)
- name: 物品名称
- description: 物品的详细描述
- type: 物品类型，必须是以下之一: weapon, armor, accessory, consumable, material, quest, misc
- rarity: 稀有度，必须是以下之一: common, uncommon, rare, epic, legendary, unique
- stats: 属性对象，如 { attack: 10, defense: 5 } (可选)
- effects: 效果数组，每个效果包含 type, value, duration (可选)
- value: 价值对象，包含 buy, sell, currency (可选)
- quantity: 数量，默认为1 (可选)

只返回JSON，不要有其他文字。`,
      quest: `你是一个RPG游戏的任务设计专家。根据世界观背景，自动生成一个符合世界设定的任务。
请以JSON格式返回，包含以下字段：
- id: 自动生成的唯一ID (格式: quest_时间戳)
- name: 任务名称
- description: 任务的详细描述
- type: 任务类型，必须是以下之一: main, side, daily, hidden
- objectives: 目标数组，每个目标包含:
  - id: 目标ID (格式: obj_时间戳_序号)
  - description: 目标描述
  - type: 目标类型，必须是以下之一: kill, collect, talk, explore, custom
  - target: 目标对象
  - required: 需要完成的数量
- rewards: 奖励数组，每个奖励包含 type, value, quantity (可选)
- giver: 任务发布者名称 (可选)
- timeLimit: 时间限制（秒）(可选)

只返回JSON，不要有其他文字。`,
      scene: `你是一个RPG游戏的场景设计专家。根据世界观背景，自动生成一个符合世界设定的起始场景。
请以JSON格式返回，包含以下字段：
- location: 地点名称
- description: 场景的详细描述，描述玩家开始游戏时的环境和氛围
- npcs: NPC数组（1-3个），每个NPC包含：
  - id: 自动生成的唯一ID (格式: npc_时间戳)
  - name: NPC名称
  - title: NPC头衔或职业 (可选)
  - description: NPC的详细描述
  - role: 角色类型，必须是以下之一: merchant, quest_giver, enemy, ally, neutral, custom
  - personality: 性格特点描述 (可选)
- items: 物品数组（1-3个），每个物品包含：
  - id: 自动生成的唯一ID (格式: item_时间戳)
  - name: 物品名称
  - description: 物品的详细描述
  - type: 物品类型，必须是以下之一: weapon, armor, accessory, consumable, material, quest, misc
  - rarity: 稀有度，必须是以下之一: common, uncommon, rare, epic, legendary, unique
  - quantity: 数量
- quests: 任务数组（1-2个），每个任务包含：
  - id: 自动生成的唯一ID (格式: quest_时间戳)
  - name: 任务名称
  - description: 任务的详细描述
  - type: 任务类型，必须是以下之一: main, side, daily, hidden
  - objectives: 目标数组

只返回JSON，不要有其他文字。`,
      race: `你是一个RPG游戏的种族设计专家。根据世界观背景，自动生成一个符合世界设定的种族。
请以JSON格式返回，包含以下字段：
- id: 自动生成的唯一ID (格式: race_时间戳)
- name: 种族名称
- description: 种族的详细描述，包括外貌特征、文化背景、性格倾向等
- bonuses: 属性加成对象，如 { "strength": 2, "dexterity": 1 }，属性名需与游戏属性系统对应
- penalties: 属性减值对象，如 { "intelligence": -1 }，体现种族的弱点
- abilities: 种族能力数组，列出该种族特有的能力或技能名称
- availableClasses: 该种族可选的职业ID数组，如 ["warrior", "ranger", "rogue"]

只返回JSON，不要有其他文字。`,
      class: `你是一个RPG游戏的职业设计专家。根据世界观背景，自动生成一个符合世界设定的职业。
请以JSON格式返回，包含以下字段：
- id: 自动生成的唯一ID (格式: class_时间戳)
- name: 职业名称
- description: 职业的详细描述，包括战斗风格、角色定位、特色能力等
- primaryAttributes: 主属性数组，列出该职业最依赖的属性名称，如 ["strength", "constitution"]
- hitDie: 生命骰，如 "d10"、"d8"、"d6" 等，决定角色的生命值成长
- skillProficiencies: 技能熟练项数组，列出该职业擅长的技能名称
- startingEquipment: 初始装备数组，列出该职业创建角色时获得的装备名称

只返回JSON，不要有其他文字。`,
      background: `你是一个RPG游戏的背景设计专家。根据世界观背景，自动生成一个符合世界设定的角色背景。
请以JSON格式返回，包含以下字段：
- id: 自动生成的唯一ID (格式: bg_时间戳)
- name: 背景名称
- description: 背景的详细描述，包括角色的过往经历、社会地位、人生故事等
- skillProficiencies: 技能熟练项数组，列出该背景提供的技能加成
- languages: 语言数组，列出该背景角色掌握的语言
- equipment: 装备数组，列出该背景角色携带的初始物品
- feature: 背景特性，描述该背景提供的独特能力或社会关系

只返回JSON，不要有其他文字。`,
      worldSetting: `你是一个RPG游戏的世界观设计专家。请创建一个独特且引人入胜的世界设定。
请以JSON格式返回，包含以下字段：
- name: 世界名称
- description: 世界的详细描述，包括历史背景、地理环境、主要势力等
- era: 时代背景，如 "中世纪"、"未来科幻"、"蒸汽朋克"、"远古神话" 等
- magicSystem: 魔法系统描述，说明魔法在世界中的存在形式和使用方式 (可选)
- technologyLevel: 科技水平，如 "原始"、"中世纪"、"工业革命"、"现代"、"未来" 等
- customFields: 自定义字段对象，可包含该世界特有的设定，如 { "神系": "多神教", "货币": "金币" }

只返回JSON，不要有其他文字。`,
    };

    let systemPrompt = `${typePrompts[type]}

世界观背景：
${worldContext}`;

    // 添加 AI 行为提示
    if (behaviorPrompts) {
      systemPrompt += `\n\n语言风格要求：\n${behaviorPrompts}`;
    }

    // 添加数值复杂度提示
    if (complexityPrompt) {
      systemPrompt += `\n\n数值系统要求：\n${complexityPrompt}`;
    }

    return systemPrompt;
  }

  private buildBehaviorPrompts(aiBehavior?: AIBehavior): string {
    if (!aiBehavior) return '';

    const prompts: string[] = [];

    // 响应风格
    if (aiBehavior.responseStyle) {
      const stylePrompts: Record<string, string> = {
        narrative: '使用文学化、叙事性的语言',
        mechanical: '使用简洁、游戏化的语言',
        adaptive: '根据场景灵活调整语言风格',
      };
      prompts.push(stylePrompts[aiBehavior.responseStyle]);
    }

    // 细节程度
    if (aiBehavior.detailLevel) {
      const detailPrompts: Record<string, string> = {
        brief: '保持描述简洁，不超过2句话',
        normal: '提供适度的描述',
        detailed: '提供详细丰富的描述',
      };
      prompts.push(detailPrompts[aiBehavior.detailLevel]);
    }

    return prompts.join('；');
  }

  private buildComplexityPrompt(numericalComplexity?: NumericalComplexity): string {
    if (!numericalComplexity) return '';

    const complexityPrompts: Record<NumericalComplexity, string> = {
      simple: '数值系统简单，属性不超过5个',
      medium: '数值系统适中，属性约8-10个',
      complex: '数值系统复杂，属性详细完整',
    };

    return complexityPrompts[numericalComplexity];
  }

  private buildUserMessage(type: 'npc' | 'item' | 'quest' | 'scene' | 'race' | 'class' | 'background' | 'worldSetting', context: GenerateContext): string {
    const typeLabels = {
      npc: 'NPC',
      item: '物品',
      quest: '任务',
      scene: '起始场景',
      race: '种族',
      class: '职业',
      background: '角色背景',
      worldSetting: '世界观设定',
    };

    if (context.userPrompt && context.userPrompt.trim()) {
      return `请根据以下描述生成一个${typeLabels[type]}：

${context.userPrompt}

请确保生成的内容与世界观背景相符。`;
    }

    // 自动生成模式 - 根据世界观创建合适的内容
    const autoGeneratePrompts = {
      npc: `请根据世界观背景，自动生成一个适合该世界的NPC。

要求：
- 角色应该符合世界设定（时代背景、魔法系统、科技水平等）
- 给角色一个有意义的名字和背景故事
- 角色应该有明确的角色定位（商人、任务发布者、敌人等）
- 描述应该生动有趣，有助于玩家沉浸`,
      item: `请根据世界观背景，自动生成一个适合该世界的物品。

要求：
- 物品应该符合世界设定（时代背景、魔法系统、科技水平等）
- 给物品一个有意义的名字和描述
- 物品应该有合理的稀有度和属性
- 描述应该生动有趣`,
      quest: `请根据世界观背景，自动生成一个适合该世界的任务。

要求：
- 任务应该符合世界设定（时代背景、魔法系统、科技水平等）
- 给任务一个有意义的名字和描述
- 任务应该有明确的目标和合理的奖励
- 任务类型应该适合当前游戏阶段`,
      scene: `请根据世界观背景，自动生成一个适合该世界的起始场景。

要求：
- 场景应该符合世界设定（时代背景、魔法系统、科技水平等）
- 给地点一个有意义的名称
- 描述应该生动有趣，帮助玩家沉浸在游戏世界中
- 包含1-3个NPC、1-3个物品和1-2个初始任务
- 场景应该适合新手玩家开始冒险`,
      race: `请根据世界观背景，自动生成一个适合该世界的种族。

要求：
- 种族应该符合世界设定（时代背景、魔法系统、科技水平等）
- 给种族一个有意义的名字和详细描述
- 种族应该有合理的属性加成和减值，体现种族特色
- 种族应该有独特的能力和可选职业
- 描述应该生动有趣，帮助玩家理解种族特点`,
      class: `请根据世界观背景，自动生成一个适合该世界的职业。

要求：
- 职业应该符合世界设定（时代背景、魔法系统、科技水平等）
- 给职业一个有意义的名字和详细描述
- 职业应该有明确的主属性和生命骰
- 职业应该有合理的技能熟练项和初始装备
- 描述应该生动有趣，帮助玩家理解职业定位`,
      background: `请根据世界观背景，自动生成一个适合该世界的角色背景。

要求：
- 背景应该符合世界设定（时代背景、魔法系统、科技水平等）
- 给背景一个有意义的名字和详细描述
- 背景应该提供合理的技能熟练项和语言
- 背景应该有独特的特性和初始装备
- 描述应该生动有趣，帮助玩家构建角色故事`,
      worldSetting: `请创建一个独特且引人入胜的世界设定。

要求：
- 世界应该有独特的主题和风格
- 给世界一个有意义的名字和详细描述
- 世界应该有明确的时代背景和科技水平
- 如果有魔法系统，应该详细描述其运作方式
- 世界应该有丰富的自定义设定，增加深度和趣味性`,
    };

    return autoGeneratePrompts[type];
  }

  private buildWorldContext(template: Partial<StoryTemplate>): string {
    const parts: string[] = [];

    if (template.name) {
      parts.push(`模板名称: ${template.name}`);
    }
    if (template.description) {
      parts.push(`模板描述: ${template.description}`);
    }
    if (template.worldSetting) {
      if (template.worldSetting.name) {
        parts.push(`世界名称: ${template.worldSetting.name}`);
      }
      if (template.worldSetting.description) {
        parts.push(`世界描述: ${template.worldSetting.description}`);
      }
      if (template.worldSetting.era) {
        parts.push(`时代背景: ${template.worldSetting.era}`);
      }
      if (template.worldSetting.magicSystem) {
        parts.push(`魔法系统: ${template.worldSetting.magicSystem}`);
      }
      if (template.worldSetting.technologyLevel) {
        parts.push(`科技水平: ${template.worldSetting.technologyLevel}`);
      }
    }
    if (template.gameMode) {
      parts.push(`游戏模式: ${template.gameMode}`);
    }
    if (template.numericalComplexity) {
      const complexityLabels: Record<NumericalComplexity, string> = {
        simple: '简单',
        medium: '中等',
        complex: '复杂',
      };
      parts.push(`数值复杂度: ${complexityLabels[template.numericalComplexity]}`);
    }
    if (template.aiConstraints?.aiBehavior) {
      const behavior = template.aiConstraints.aiBehavior;
      const styleLabels: Record<string, string> = {
        narrative: '叙事性',
        mechanical: '游戏化',
        adaptive: '自适应',
      };
      const detailLabels: Record<string, string> = {
        brief: '简洁',
        normal: '适中',
        detailed: '详细',
      };
      parts.push(`AI响应风格: ${styleLabels[behavior.responseStyle]}`);
      parts.push(`AI细节程度: ${detailLabels[behavior.detailLevel]}`);
    }

    return parts.length > 0 ? parts.join('\n') : '无特定世界观背景';
  }

  private parseNPCResponse(content: string): NPCDefinition | null {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return null;

      const parsed = JSON.parse(jsonMatch[0]);
      return {
        id: parsed.id || `npc_${Date.now()}`,
        name: parsed.name || '未命名NPC',
        description: parsed.description || '',
        role: parsed.role || 'neutral',
        title: parsed.title,
        personality: parsed.personality,
        dialogue: parsed.dialogue,
        stats: parsed.stats,
        services: parsed.services,
      };
    } catch (error) {
      console.error('[AIGenerateService] Failed to parse NPC response:', error);
      return null;
    }
  }

  private parseItemResponse(content: string): ItemDefinition | null {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return null;

      const parsed = JSON.parse(jsonMatch[0]);
      return {
        id: parsed.id || `item_${Date.now()}`,
        name: parsed.name || '未命名物品',
        description: parsed.description || '',
        type: parsed.type || 'misc',
        rarity: parsed.rarity || 'common',
        stats: parsed.stats,
        effects: parsed.effects,
        value: parsed.value,
        quantity: parsed.quantity || 1,
      };
    } catch (error) {
      console.error('[AIGenerateService] Failed to parse item response:', error);
      return null;
    }
  }

  private parseQuestResponse(content: string): QuestDefinition | null {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return null;

      const parsed = JSON.parse(jsonMatch[0]);
      return {
        id: parsed.id || `quest_${Date.now()}`,
        name: parsed.name || '未命名任务',
        description: parsed.description || '',
        type: parsed.type || 'side',
        objectives: (parsed.objectives || []).map((obj: any, index: number) => ({
          id: obj.id || `obj_${Date.now()}_${index}`,
          description: obj.description || '',
          type: obj.type || 'custom',
          target: obj.target || '',
          required: obj.required || 1,
        })),
        rewards: parsed.rewards,
        giver: parsed.giver,
        timeLimit: parsed.timeLimit,
      };
    } catch (error) {
      console.error('[AIGenerateService] Failed to parse quest response:', error);
      return null;
    }
  }

  private parseSceneResponse(content: string): StartingScene | null {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return null;

      const parsed = JSON.parse(jsonMatch[0]);
      return {
        location: parsed.location || '未知地点',
        description: parsed.description || '',
        npcs: (parsed.npcs || []).map((npc: any) => ({
          id: npc.id || `npc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: npc.name || '未命名NPC',
          description: npc.description || '',
          role: npc.role || 'neutral',
          title: npc.title,
          personality: npc.personality,
          dialogue: npc.dialogue,
          stats: npc.stats,
          services: npc.services,
        })),
        items: (parsed.items || []).map((item: any) => ({
          id: item.id || `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: item.name || '未命名物品',
          description: item.description || '',
          type: item.type || 'misc',
          rarity: item.rarity || 'common',
          stats: item.stats,
          effects: item.effects,
          value: item.value,
          quantity: item.quantity || 1,
        })),
        quests: (parsed.quests || []).map((quest: any) => ({
          id: quest.id || `quest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: quest.name || '未命名任务',
          description: quest.description || '',
          type: quest.type || 'side',
          objectives: (quest.objectives || []).map((obj: any, index: number) => ({
            id: obj.id || `obj_${Date.now()}_${index}`,
            description: obj.description || '',
            type: obj.type || 'custom',
            target: obj.target || '',
            required: obj.required || 1,
          })),
          rewards: quest.rewards,
          giver: quest.giver,
          timeLimit: quest.timeLimit,
        })),
      };
    } catch (error) {
      console.error('[AIGenerateService] Failed to parse scene response:', error);
      return null;
    }
  }

  private parseRaceResponse(content: string): RaceDefinition | null {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return null;

      const parsed = JSON.parse(jsonMatch[0]);
      return {
        id: parsed.id || `race_${Date.now()}`,
        name: parsed.name || '未命名种族',
        description: parsed.description || '',
        bonuses: parsed.bonuses || {},
        penalties: parsed.penalties || {},
        abilities: parsed.abilities || [],
        availableClasses: parsed.availableClasses || [],
      };
    } catch (error) {
      console.error('[AIGenerateService] Failed to parse race response:', error);
      return null;
    }
  }

  private parseClassResponse(content: string): ClassDefinition | null {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return null;

      const parsed = JSON.parse(jsonMatch[0]);
      return {
        id: parsed.id || `class_${Date.now()}`,
        name: parsed.name || '未命名职业',
        description: parsed.description || '',
        primaryAttributes: parsed.primaryAttributes || [],
        hitDie: parsed.hitDie || 'd8',
        skillProficiencies: parsed.skillProficiencies || [],
        startingEquipment: parsed.startingEquipment || [],
      };
    } catch (error) {
      console.error('[AIGenerateService] Failed to parse class response:', error);
      return null;
    }
  }

  private parseBackgroundResponse(content: string): BackgroundDefinition | null {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return null;

      const parsed = JSON.parse(jsonMatch[0]);
      return {
        id: parsed.id || `bg_${Date.now()}`,
        name: parsed.name || '未命名背景',
        description: parsed.description || '',
        skillProficiencies: parsed.skillProficiencies || [],
        languages: parsed.languages || [],
        equipment: parsed.equipment || [],
        feature: parsed.feature || '',
      };
    } catch (error) {
      console.error('[AIGenerateService] Failed to parse background response:', error);
      return null;
    }
  }

  private parseWorldSettingResponse(content: string): WorldSetting | null {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return null;

      const parsed = JSON.parse(jsonMatch[0]);
      return {
        name: parsed.name || '未命名世界',
        description: parsed.description || '',
        era: parsed.era || '中世纪',
        magicSystem: parsed.magicSystem,
        technologyLevel: parsed.technologyLevel || '中世纪',
        customFields: parsed.customFields || {},
      };
    } catch (error) {
      console.error('[AIGenerateService] Failed to parse world setting response:', error);
      return null;
    }
  }
}

let aiGenerateService: AIGenerateService | null = null;

export function getAIGenerateService(): AIGenerateService | null {
  return aiGenerateService;
}

export function initializeAIGenerateService(llmService: LLMService): AIGenerateService {
  aiGenerateService = new AIGenerateService(llmService);
  return aiGenerateService;
}
