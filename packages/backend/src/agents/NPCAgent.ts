import type {
  AgentType,
  AgentMessage,
  AgentResponse,
  Message,
} from '@ai-rpg/shared';
import { AgentType as AT } from '@ai-rpg/shared';
import { AgentBase } from './AgentBase';

// ==================== NPC 类型定义 ====================

/**
 * NPC关系类型
 */
export type NPCRelationType = 'neutral' | 'friendly' | 'hostile' | 'romantic' | 'custom';

/**
 * NPC标记
 */
export interface NPCFlags {
  isCompanion: boolean;    // 是否为同伴
  isMerchant: boolean;     // 是否为商人
  isQuestGiver: boolean;   // 是否为任务发布者
  isRomanceable: boolean;  // 是否可恋爱
  isEssential: boolean;    // 是否为关键NPC（不可杀死）
  isHostile: boolean;      // 是否敌对
}

/**
 * NPC好感度等级
 */
export enum AffectionLevel {
  HATED = 'hated',           // -100 ~ -75: 仇恨
  HOSTILE = 'hostile',       // -74 ~ -50: 敌对
  UNFRIENDLY = 'unfriendly', // -49 ~ -25: 不友好
  NEUTRAL = 'neutral',       // -24 ~ 24: 中立
  FRIENDLY = 'friendly',     // 25 ~ 49: 友好
  CLOSE = 'close',           // 50 ~ 74: 亲密
  LOYAL = 'loyal',           // 75 ~ 100: 忠诚
}

/**
 * NPC好感度信息
 */
export interface NPCAffection {
  value: number;            // -100 到 100
  level: AffectionLevel;
  history: AffectionChange[];
  locked?: boolean;         // 是否锁定好感度
}

/**
 * 好感度变化记录
 */
export interface AffectionChange {
  timestamp: number;
  change: number;
  reason: string;
  previousValue: number;
  newValue: number;
}

/**
 * NPC关系
 */
export interface NPCRelation {
  npcId: string;
  type: NPCRelationType;
  affection: NPCAffection;
  firstMet: number;
  lastInteraction: number;
  interactionCount: number;
  customLabel?: string;     // 自定义关系标签
  notes?: string;           // 备注
}

/**
 * NPC行为模式
 */
export interface NPCBehavior {
  personality: string;      // 性格描述
  traits: string[];         // 特质列表
  schedule?: NPCSchedule;   // 日程安排
  dialogueStyle: string;    // 对话风格
  combatStyle?: string;     // 战斗风格
  preferences: {
    likes: string[];
    dislikes: string[];
    fears: string[];
  };
}

/**
 * NPC日程
 */
export interface NPCSchedule {
  locationId: string;
  timeSlots: {
    startTime: string;      // HH:MM格式
    endTime: string;
    activity: string;
    locationId: string;
  }[];
}

/**
 * NPC基础信息
 */
export interface NPCData {
  id: string;
  name: string;
  title?: string;           // 称号/头衔
  race: string;
  gender?: string;
  age?: number;
  occupation: string;
  description: string;
  appearance: string;
  backstory: string;
  location: {
    currentLocationId: string;
    defaultLocationId: string;
    lastKnownPosition?: { x: number; y: number };
  };
  flags: NPCFlags;
  behavior: NPCBehavior;
  stats?: {
    level: number;
    hp: number;
    maxHp: number;
    mp?: number;
    maxMp?: number;
    attack?: number;
    defense?: number;
  };
  inventory?: string[];     // 物品ID列表
  quests?: string[];        // 关联任务ID列表
  dialogueTreeId?: string;  // 对话树ID
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

/**
 * 队伍成员
 */
export interface PartyMember {
  npcId: string;
  joinedAt: number;
  role: 'tank' | 'dps' | 'healer' | 'support' | 'custom';
  customRole?: string;
  order: number;            // 队伍中的顺序
  isActive: boolean;        // 是否活跃成员
}

/**
 * 队伍信息
 */
export interface PartyState {
  members: PartyMember[];
  maxSize: number;
  formation: string;
  partyStats: {
    totalLevel: number;
    averageLevel: number;
    combatPower: number;
  };
}

/**
 * NPC状态
 */
export interface NPCAgentState {
  npcs: Map<string, NPCData>;
  relations: Map<string, NPCRelation>;  // key: `${playerId}_${npcId}`
  party: PartyState;
  activeDialogues: Map<string, string>; // key: npcId, value: dialogueId
}

// ==================== NPC Agent 实现 ====================

/**
 * NPC智能体
 * 负责管理NPC信息、控制行为对话、处理关系和好感度、管理队伍
 */
export class NPCAgent extends AgentBase {
  readonly type: AgentType = AT.NPC_PARTY;
  
  readonly canCallAgents: AgentType[] = [
    AT.COORDINATOR,
    AT.STORY_CONTEXT,
    AT.QUEST,
    AT.DIALOGUE,
  ];

  readonly dataAccess: string[] = [
    'npc_data',
    'npc_relations',
    'party_state',
    'dialogue_state',
    'quest_state',
    'player_location',
    'inventory_state',
  ];

  readonly systemPrompt = `你是NPC和队伍管理智能体，负责管理游戏中的所有NPC及其与玩家的关系。

核心职责：
1. NPC信息管理：创建、更新、查询NPC信息
2. 好感度系统：管理玩家与NPC的关系值（-100到100），处理好感度变化
3. NPC行为生成：根据NPC性格和当前状态生成合理的行为和对话
4. 队伍管理：管理玩家队伍中的NPC成员

好感度等级划分：
- HATED (仇恨): -100 ~ -75
- HOSTILE (敌对): -74 ~ -50
- UNFRIENDLY (不友好): -49 ~ -25
- NEUTRAL (中立): -24 ~ 24
- FRIENDLY (友好): 25 ~ 49
- CLOSE (亲密): 50 ~ 74
- LOYAL (忠诚): 75 ~ 100

关系类型：
- neutral: 中立关系
- friendly: 友好关系
- hostile: 敌对关系
- romantic: 恋爱关系
- custom: 自定义关系

NPC标记：
- isCompanion: 是否可作为同伴加入队伍
- isMerchant: 是否为商人
- isQuestGiver: 是否可发布任务
- isRomanceable: 是否可发展恋爱关系
- isEssential: 是否为关键NPC（不可死亡）
- isHostile: 是否对玩家敌对

工作原则：
- 保持NPC行为的一致性和合理性
- 好感度变化要有合理的理由和幅度
- NPC行为要符合其性格和背景设定
- 队伍管理要平衡游戏体验`;

  private npcState: NPCAgentState;

  constructor() {
    super({
      temperature: 0.6,
      maxTokens: 4096,
    });

    this.npcState = {
      npcs: new Map(),
      relations: new Map(),
      party: {
        members: [],
        maxSize: 4,
        formation: 'standard',
        partyStats: {
          totalLevel: 0,
          averageLevel: 0,
          combatPower: 0,
        },
      },
      activeDialogues: new Map(),
    };
  }

  protected getAgentName(): string {
    return 'NPC Party Agent';
  }

  protected getAgentDescription(): string {
    return 'NPC和队伍管理智能体，负责管理NPC信息、控制行为对话、处理关系和好感度';
  }

  protected getAgentCapabilities(): string[] {
    return [
      'npc_management',
      'relationship_handling',
      'behavior_generation',
      'party_management',
      'affection_system',
      'dialogue_coordination',
    ];
  }

  /**
   * 处理消息主入口
   */
  async processMessage(message: AgentMessage): Promise<AgentResponse> {
    const action = message.payload.action;
    const data = message.payload.data as Record<string, unknown>;

    try {
      switch (action) {
        // NPC管理
        case 'create_npc':
          return this.handleCreateNPC(data);
        case 'update_npc':
          return this.handleUpdateNPC(data);
        case 'get_npc':
          return this.handleGetNPC(data);
        case 'get_all_npcs':
          return this.handleGetAllNPCs(data);
        case 'delete_npc':
          return this.handleDeleteNPC(data);

        // 好感度系统
        case 'get_affection':
          return this.handleGetAffection(data);
        case 'modify_affection':
          return this.handleModifyAffection(data);
        case 'set_affection':
          return this.handleSetAffection(data);
        case 'get_relation':
          return this.handleGetRelation(data);
        case 'get_all_relations':
          return this.handleGetAllRelations(data);

        // NPC行为
        case 'generate_behavior':
          return await this.handleGenerateBehavior(data);
        case 'generate_dialogue':
          return await this.handleGenerateDialogue(data);
        case 'update_location':
          return this.handleUpdateNPCLocation(data);

        // 队伍管理
        case 'add_party_member':
          return this.handleAddPartyMember(data);
        case 'remove_party_member':
          return this.handleRemovePartyMember(data);
        case 'get_party':
          return this.handleGetParty();
        case 'update_party_formation':
          return this.handleUpdatePartyFormation(data);
        case 'set_party_max_size':
          return this.handleSetPartyMaxSize(data);

        // 对话管理
        case 'start_dialogue':
          return this.handleStartDialogue(data);
        case 'end_dialogue':
          return this.handleEndDialogue(data);
        case 'get_active_dialogue':
          return this.handleGetActiveDialogue(data);

        // 状态查询
        case 'get_npc_state':
          return this.handleGetNPCState();
        case 'get_npcs_by_location':
          return this.handleGetNPCsByLocation(data);
        case 'get_npcs_by_flag':
          return this.handleGetNPCsByFlag(data);

        default:
          return {
            success: false,
            error: `Unknown action: ${action}`,
          };
      }
    } catch (error) {
      console.error('[NPCAgent] Error processing message:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error in NPCAgent',
      };
    }
  }

  // ==================== NPC 管理 ====================

  /**
   * 创建NPC
   */
  private handleCreateNPC(data: Record<string, unknown>): AgentResponse {
    const npcInput = data as {
      name: string;
      race: string;
      occupation: string;
      description: string;
      appearance: string;
      backstory: string;
      defaultLocationId: string;
      flags?: Partial<NPCFlags>;
      behavior?: Partial<NPCBehavior>;
      stats?: NPCData['stats'];
      title?: string;
      gender?: string;
      age?: number;
      tags?: string[];
    };

    if (!npcInput.name || !npcInput.race || !npcInput.occupation) {
      return {
        success: false,
        error: 'Missing required fields: name, race, occupation',
      };
    }

    const npcId = this.generateNPCId();
    const now = Date.now();

    const npc: NPCData = {
      id: npcId,
      name: npcInput.name,
      title: npcInput.title,
      race: npcInput.race,
      gender: npcInput.gender,
      age: npcInput.age,
      occupation: npcInput.occupation,
      description: npcInput.description || '',
      appearance: npcInput.appearance || '',
      backstory: npcInput.backstory || '',
      location: {
        currentLocationId: npcInput.defaultLocationId,
        defaultLocationId: npcInput.defaultLocationId,
      },
      flags: {
        isCompanion: npcInput.flags?.isCompanion ?? false,
        isMerchant: npcInput.flags?.isMerchant ?? false,
        isQuestGiver: npcInput.flags?.isQuestGiver ?? false,
        isRomanceable: npcInput.flags?.isRomanceable ?? false,
        isEssential: npcInput.flags?.isEssential ?? false,
        isHostile: npcInput.flags?.isHostile ?? false,
      },
      behavior: {
        personality: npcInput.behavior?.personality || '普通',
        traits: npcInput.behavior?.traits || [],
        dialogueStyle: npcInput.behavior?.dialogueStyle || 'normal',
        preferences: npcInput.behavior?.preferences || {
          likes: [],
          dislikes: [],
          fears: [],
        },
      },
      stats: npcInput.stats,
      tags: npcInput.tags || [],
      createdAt: now,
      updatedAt: now,
    };

    this.npcState.npcs.set(npcId, npc);

    this.addMemory(
      `Created NPC: ${npc.name} (${npc.race} ${npc.occupation})`,
      'assistant',
      6,
      { npcId, npcName: npc.name }
    );

    return {
      success: true,
      data: { npc },
    };
  }

  /**
   * 更新NPC
   */
  private handleUpdateNPC(data: Record<string, unknown>): AgentResponse {
    const updateInput = data as {
      npcId: string;
      updates: Partial<NPCData>;
    };

    const npc = this.npcState.npcs.get(updateInput.npcId);
    if (!npc) {
      return {
        success: false,
        error: `NPC not found: ${updateInput.npcId}`,
      };
    }

    const updatedNPC: NPCData = {
      ...npc,
      ...updateInput.updates,
      id: npc.id,  // 防止ID被修改
      createdAt: npc.createdAt,
      updatedAt: Date.now(),
    };

    this.npcState.npcs.set(updateInput.npcId, updatedNPC);

    this.addMemory(
      `Updated NPC: ${npc.name}`,
      'assistant',
      5,
      { npcId: updateInput.npcId, changes: Object.keys(updateInput.updates) }
    );

    return {
      success: true,
      data: { npc: updatedNPC },
    };
  }

  /**
   * 获取NPC
   */
  private handleGetNPC(data: Record<string, unknown>): AgentResponse {
    const inputData = data as { npcId: string };
    const npc = this.npcState.npcs.get(inputData.npcId);

    if (!npc) {
      return {
        success: false,
        error: `NPC not found: ${inputData.npcId}`,
      };
    }

    return {
      success: true,
      data: { npc },
    };
  }

  /**
   * 获取所有NPC
   */
  private handleGetAllNPCs(data: Record<string, unknown>): AgentResponse {
    const inputData = data as { limit?: number; offset?: number };
    let npcs = Array.from(this.npcState.npcs.values());

    if (inputData.offset) {
      npcs = npcs.slice(inputData.offset);
    }
    if (inputData.limit) {
      npcs = npcs.slice(0, inputData.limit);
    }

    return {
      success: true,
      data: {
        npcs,
        total: this.npcState.npcs.size,
      },
    };
  }

  /**
   * 删除NPC
   */
  private handleDeleteNPC(data: Record<string, unknown>): AgentResponse {
    const inputData = data as { npcId: string };
    const npc = this.npcState.npcs.get(inputData.npcId);

    if (!npc) {
      return {
        success: false,
        error: `NPC not found: ${inputData.npcId}`,
      };
    }

    // 检查是否在队伍中
    const inParty = this.npcState.party.members.some(m => m.npcId === inputData.npcId);
    if (inParty) {
      return {
        success: false,
        error: 'Cannot delete NPC that is in the party',
      };
    }

    this.npcState.npcs.delete(inputData.npcId);

    // 删除相关关系
    for (const [key] of this.npcState.relations) {
      if (key.endsWith(`_${inputData.npcId}`)) {
        this.npcState.relations.delete(key);
      }
    }

    this.addMemory(
      `Deleted NPC: ${npc.name}`,
      'assistant',
      4,
      { npcId: inputData.npcId }
    );

    return {
      success: true,
      data: { deleted: true },
    };
  }

  // ==================== 好感度系统 ====================

  /**
   * 获取好感度
   */
  private handleGetAffection(data: Record<string, unknown>): AgentResponse {
    const inputData = data as { playerId: string; npcId: string };
    const relation = this.getOrCreateRelation(inputData.playerId, inputData.npcId);

    return {
      success: true,
      data: {
        affection: relation.affection,
        npcId: inputData.npcId,
      },
    };
  }

  /**
   * 修改好感度
   */
  private handleModifyAffection(data: Record<string, unknown>): AgentResponse {
    const inputData = data as {
      playerId: string;
      npcId: string;
      change: number;
      reason: string;
    };

    if (inputData.change < -100 || inputData.change > 100) {
      return {
        success: false,
        error: 'Change value must be between -100 and 100',
      };
    }

    const relation = this.getOrCreateRelation(inputData.playerId, inputData.npcId);

    if (relation.affection.locked) {
      return {
        success: false,
        error: 'Affection is locked for this NPC',
      };
    }

    const previousValue = relation.affection.value;
    const newValue = Math.max(-100, Math.min(100, previousValue + inputData.change));

    // 记录变化
    const changeRecord: AffectionChange = {
      timestamp: Date.now(),
      change: inputData.change,
      reason: inputData.reason,
      previousValue,
      newValue,
    };

    relation.affection.value = newValue;
    relation.affection.level = this.getAffectionLevel(newValue);
    relation.affection.history.push(changeRecord);
    relation.lastInteraction = Date.now();
    relation.interactionCount++;

    // 更新关系类型
    relation.type = this.determineRelationType(newValue, relation.type);

    const npc = this.npcState.npcs.get(inputData.npcId);

    this.addMemory(
      `Modified affection for ${npc?.name || inputData.npcId}: ${previousValue} -> ${newValue} (${inputData.reason})`,
      'assistant',
      7,
      { npcId: inputData.npcId, change: inputData.change }
    );

    return {
      success: true,
      data: {
        previousValue,
        newValue,
        change: inputData.change,
        level: relation.affection.level,
        relationType: relation.type,
      },
    };
  }

  /**
   * 设置好感度
   */
  private handleSetAffection(data: Record<string, unknown>): AgentResponse {
    const inputData = data as {
      playerId: string;
      npcId: string;
      value: number;
      reason?: string;
    };

    if (inputData.value < -100 || inputData.value > 100) {
      return {
        success: false,
        error: 'Value must be between -100 and 100',
      };
    }

    const relation = this.getOrCreateRelation(inputData.playerId, inputData.npcId);

    if (relation.affection.locked) {
      return {
        success: false,
        error: 'Affection is locked for this NPC',
      };
    }

    const previousValue = relation.affection.value;
    const change = inputData.value - previousValue;

    const changeRecord: AffectionChange = {
      timestamp: Date.now(),
      change,
      reason: inputData.reason || 'Direct set',
      previousValue,
      newValue: inputData.value,
    };

    relation.affection.value = inputData.value;
    relation.affection.level = this.getAffectionLevel(inputData.value);
    relation.affection.history.push(changeRecord);
    relation.lastInteraction = Date.now();

    relation.type = this.determineRelationType(inputData.value, relation.type);

    return {
      success: true,
      data: {
        value: inputData.value,
        level: relation.affection.level,
        relationType: relation.type,
      },
    };
  }

  /**
   * 获取关系
   */
  private handleGetRelation(data: Record<string, unknown>): AgentResponse {
    const inputData = data as { playerId: string; npcId: string };
    const relation = this.getOrCreateRelation(inputData.playerId, inputData.npcId);

    return {
      success: true,
      data: { relation },
    };
  }

  /**
   * 获取所有关系
   */
  private handleGetAllRelations(data: Record<string, unknown>): AgentResponse {
    const inputData = data as { playerId: string };
    const relations: NPCRelation[] = [];

    for (const [key, relation] of this.npcState.relations) {
      if (key.startsWith(`${inputData.playerId}_`)) {
        relations.push(relation);
      }
    }

    return {
      success: true,
      data: { relations },
    };
  }

  /**
   * 获取或创建关系
   */
  private getOrCreateRelation(playerId: string, npcId: string): NPCRelation {
    const key = `${playerId}_${npcId}`;
    let relation = this.npcState.relations.get(key);

    if (!relation) {
      const npc = this.npcState.npcs.get(npcId);
      relation = {
        npcId,
        type: npc?.flags.isHostile ? 'hostile' : 'neutral',
        affection: {
          value: 0,
          level: AffectionLevel.NEUTRAL,
          history: [],
        },
        firstMet: Date.now(),
        lastInteraction: Date.now(),
        interactionCount: 0,
      };
      this.npcState.relations.set(key, relation);
    }

    return relation;
  }

  /**
   * 获取好感度等级
   */
  private getAffectionLevel(value: number): AffectionLevel {
    if (value <= -75) return AffectionLevel.HATED;
    if (value <= -50) return AffectionLevel.HOSTILE;
    if (value <= -25) return AffectionLevel.UNFRIENDLY;
    if (value < 25) return AffectionLevel.NEUTRAL;
    if (value < 50) return AffectionLevel.FRIENDLY;
    if (value < 75) return AffectionLevel.CLOSE;
    return AffectionLevel.LOYAL;
  }

  /**
   * 确定关系类型
   */
  private determineRelationType(affection: number, currentType: NPCRelationType): NPCRelationType {
    if (currentType === 'romantic' && affection >= 50) return 'romantic';
    if (currentType === 'custom') return 'custom';
    if (affection <= -50) return 'hostile';
    if (affection >= 50) return 'friendly';
    return 'neutral';
  }

  // ==================== NPC 行为生成 ====================

  /**
   * 生成NPC行为
   */
  private async handleGenerateBehavior(data: Record<string, unknown>): Promise<AgentResponse> {
    const inputData = data as {
      npcId: string;
      context: {
        situation: string;
        playerAction?: string;
        location?: string;
        time?: string;
        involvedNPCs?: string[];
      };
    };

    const npc = this.npcState.npcs.get(inputData.npcId);
    if (!npc) {
      return {
        success: false,
        error: `NPC not found: ${inputData.npcId}`,
      };
    }

    const relation = this.npcState.relations.get(`player_${inputData.npcId}`);

    const prompt: Message[] = [
      {
        role: 'user',
        content: `为以下NPC生成行为响应。

NPC信息：
- 名字: ${npc.name}
- 种族: ${npc.race}
- 职业: ${npc.occupation}
- 性格: ${npc.behavior.personality}
- 特质: ${npc.behavior.traits.join(', ')}
- 对话风格: ${npc.behavior.dialogueStyle}
- 喜好: ${npc.behavior.preferences.likes.join(', ') || '无'}
- 厌恶: ${npc.behavior.preferences.dislikes.join(', ') || '无'}
- 恐惧: ${npc.behavior.preferences.fears.join(', ') || '无'}
${relation ? `- 当前好感度: ${relation.affection.value} (${relation.affection.level})` : ''}

当前情境：
${inputData.context.situation}
${inputData.context.playerAction ? `玩家行为: ${inputData.context.playerAction}` : ''}
${inputData.context.location ? `地点: ${inputData.context.location}` : ''}
${inputData.context.time ? `时间: ${inputData.context.time}` : ''}

请生成NPC的行为响应，返回JSON格式：
{
  "action": "行为描述",
  "dialogue": "对话内容（如果有）",
  "emotion": "情绪状态",
  "bodyLanguage": "肢体语言描述",
  "possibleOutcomes": ["可能的结果1", "可能的结果2"]
}`,
      },
    ];

    try {
      const response = await this.callLLM(prompt, {
        temperature: 0.7,
        maxTokens: 500,
      });

      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return {
          success: true,
          data: {
            action: 'NPC保持沉默。',
            dialogue: '',
            emotion: 'neutral',
          },
        };
      }

      const behavior = JSON.parse(jsonMatch[0]) as {
        action: string;
        dialogue: string;
        emotion: string;
        bodyLanguage?: string;
        possibleOutcomes?: string[];
      };

      return {
        success: true,
        data: { behavior, npcId: inputData.npcId },
      };
    } catch (error) {
      console.error('[NPCAgent] Error generating behavior:', error);
      return {
        success: false,
        error: 'Failed to generate NPC behavior',
      };
    }
  }

  /**
   * 生成NPC对话
   */
  private async handleGenerateDialogue(data: Record<string, unknown>): Promise<AgentResponse> {
    const inputData = data as {
      npcId: string;
      topic: string;
      playerMessage?: string;
      dialogueHistory?: Array<{ role: 'player' | 'npc'; content: string }>;
    };

    const npc = this.npcState.npcs.get(inputData.npcId);
    if (!npc) {
      return {
        success: false,
        error: `NPC not found: ${inputData.npcId}`,
      };
    }

    const relation = this.npcState.relations.get(`player_${inputData.npcId}`);

    const prompt: Message[] = [
      {
        role: 'user',
        content: `为以下NPC生成对话响应。

NPC信息：
- 名字: ${npc.name}
- 称号: ${npc.title || '无'}
- 种族: ${npc.race}
- 职业: ${npc.occupation}
- 性格: ${npc.behavior.personality}
- 对话风格: ${npc.behavior.dialogueStyle}
${relation ? `- 好感度: ${relation.affection.value} (${relation.affection.level})` : ''}
- 关系类型: ${relation?.type || '陌生人'}

对话主题: ${inputData.topic}
${inputData.playerMessage ? `玩家说: ${inputData.playerMessage}` : ''}

${inputData.dialogueHistory && inputData.dialogueHistory.length > 0 
  ? `对话历史:\n${inputData.dialogueHistory.map(d => `${d.role}: ${d.content}`).join('\n')}` 
  : ''}

请生成NPC的对话响应，返回JSON格式：
{
  "dialogue": "NPC的回复内容",
  "emotion": "情绪状态",
  "options": [
    {"text": "玩家选项1", "requiresAffection": 0},
    {"text": "玩家选项2", "requiresAffection": 25}
  ],
  "affectionHint": 建议的好感度变化（-10到10）
}`,
      },
    ];

    try {
      const response = await this.callLLM(prompt, {
        temperature: 0.7,
        maxTokens: 600,
      });

      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return {
          success: true,
          data: {
            dialogue: '...',
            emotion: 'neutral',
            options: [],
          },
        };
      }

      const dialogueResponse = JSON.parse(jsonMatch[0]) as {
        dialogue: string;
        emotion: string;
        options?: Array<{ text: string; requiresAffection?: number }>;
        affectionHint?: number;
      };

      return {
        success: true,
        data: {
          dialogue: dialogueResponse.dialogue,
          emotion: dialogueResponse.emotion,
          options: dialogueResponse.options || [],
          affectionHint: dialogueResponse.affectionHint,
          npcId: inputData.npcId,
        },
      };
    } catch (error) {
      console.error('[NPCAgent] Error generating dialogue:', error);
      return {
        success: false,
        error: 'Failed to generate dialogue',
      };
    }
  }

  /**
   * 更新NPC位置
   */
  private handleUpdateNPCLocation(data: Record<string, unknown>): AgentResponse {
    const inputData = data as {
      npcId: string;
      locationId: string;
      position?: { x: number; y: number };
    };

    const npc = this.npcState.npcs.get(inputData.npcId);
    if (!npc) {
      return {
        success: false,
        error: `NPC not found: ${inputData.npcId}`,
      };
    }

    npc.location.currentLocationId = inputData.locationId;
    if (inputData.position) {
      npc.location.lastKnownPosition = inputData.position;
    }
    npc.updatedAt = Date.now();

    return {
      success: true,
      data: { npc },
    };
  }

  // ==================== 队伍管理 ====================

  /**
   * 添加队伍成员
   */
  private handleAddPartyMember(data: Record<string, unknown>): AgentResponse {
    const inputData = data as {
      npcId: string;
      role?: PartyMember['role'];
      customRole?: string;
    };

    const npc = this.npcState.npcs.get(inputData.npcId);
    if (!npc) {
      return {
        success: false,
        error: `NPC not found: ${inputData.npcId}`,
      };
    }

    if (!npc.flags.isCompanion) {
      return {
        success: false,
        error: 'This NPC cannot join the party',
      };
    }

    if (this.npcState.party.members.length >= this.npcState.party.maxSize) {
      return {
        success: false,
        error: 'Party is full',
      };
    }

    if (this.npcState.party.members.some(m => m.npcId === inputData.npcId)) {
      return {
        success: false,
        error: 'NPC is already in the party',
      };
    }

    const member: PartyMember = {
      npcId: inputData.npcId,
      joinedAt: Date.now(),
      role: inputData.role || 'support',
      customRole: inputData.customRole,
      order: this.npcState.party.members.length,
      isActive: true,
    };

    this.npcState.party.members.push(member);
    this.updatePartyStats();

    this.addMemory(
      `${npc.name} joined the party as ${member.role}`,
      'assistant',
      7,
      { npcId: inputData.npcId, role: member.role }
    );

    return {
      success: true,
      data: {
        member,
        party: this.npcState.party,
      },
    };
  }

  /**
   * 移除队伍成员
   */
  private handleRemovePartyMember(data: Record<string, unknown>): AgentResponse {
    const inputData = data as { npcId: string };
    const index = this.npcState.party.members.findIndex(m => m.npcId === inputData.npcId);

    if (index === -1) {
      return {
        success: false,
        error: 'NPC is not in the party',
      };
    }

    const [_removed] = this.npcState.party.members.splice(index, 1);
    const npc = this.npcState.npcs.get(inputData.npcId);

    // 重新排序
    this.npcState.party.members.forEach((m, i) => {
      m.order = i;
    });

    this.updatePartyStats();

    this.addMemory(
      `${npc?.name || inputData.npcId} left the party`,
      'assistant',
      6,
      { npcId: inputData.npcId }
    );

    return {
      success: true,
      data: {
        removed: true,
        party: this.npcState.party,
      },
    };
  }

  /**
   * 获取队伍信息
   */
  private handleGetParty(): AgentResponse {
    const membersWithDetails = this.npcState.party.members.map(member => {
      const npc = this.npcState.npcs.get(member.npcId);
      return {
        ...member,
        npc,
      };
    });

    return {
      success: true,
      data: {
        party: {
          ...this.npcState.party,
          members: membersWithDetails,
        },
      },
    };
  }

  /**
   * 更新队伍阵型
   */
  private handleUpdatePartyFormation(data: Record<string, unknown>): AgentResponse {
    const inputData = data as { formation: string };
    this.npcState.party.formation = inputData.formation;

    return {
      success: true,
      data: { formation: inputData.formation },
    };
  }

  /**
   * 设置队伍最大人数
   */
  private handleSetPartyMaxSize(data: Record<string, unknown>): AgentResponse {
    const inputData = data as { maxSize: number };

    if (inputData.maxSize < 1 || inputData.maxSize > 8) {
      return {
        success: false,
        error: 'Max size must be between 1 and 8',
      };
    }

    this.npcState.party.maxSize = inputData.maxSize;

    return {
      success: true,
      data: { maxSize: inputData.maxSize },
    };
  }

  /**
   * 更新队伍统计
   */
  private updatePartyStats(): void {
    const members = this.npcState.party.members;
    const levels = members
      .map(m => this.npcState.npcs.get(m.npcId)?.stats?.level || 1);

    this.npcState.party.partyStats = {
      totalLevel: levels.reduce((sum, l) => sum + l, 0),
      averageLevel: levels.length > 0 ? levels.reduce((sum, l) => sum + l, 0) / levels.length : 0,
      combatPower: this.calculateCombatPower(),
    };
  }

  /**
   * 计算战斗力
   */
  private calculateCombatPower(): number {
    return this.npcState.party.members.reduce((power, member) => {
      const npc = this.npcState.npcs.get(member.npcId);
      if (!npc?.stats) return power;

      const { level = 1, attack = 0, defense = 0, maxHp = 0 } = npc.stats;
      return power + level * 10 + attack * 2 + defense * 2 + maxHp * 0.5;
    }, 0);
  }

  // ==================== 对话管理 ====================

  /**
   * 开始对话
   */
  private handleStartDialogue(data: Record<string, unknown>): AgentResponse {
    const inputData = data as { npcId: string; dialogueId: string };

    const npc = this.npcState.npcs.get(inputData.npcId);
    if (!npc) {
      return {
        success: false,
        error: `NPC not found: ${inputData.npcId}`,
      };
    }

    this.npcState.activeDialogues.set(inputData.npcId, inputData.dialogueId);

    return {
      success: true,
      data: {
        npcId: inputData.npcId,
        dialogueId: inputData.dialogueId,
      },
    };
  }

  /**
   * 结束对话
   */
  private handleEndDialogue(data: Record<string, unknown>): AgentResponse {
    const inputData = data as { npcId: string };
    const dialogueId = this.npcState.activeDialogues.get(inputData.npcId);

    this.npcState.activeDialogues.delete(inputData.npcId);

    return {
      success: true,
      data: {
        ended: true,
        dialogueId,
      },
    };
  }

  /**
   * 获取活跃对话
   */
  private handleGetActiveDialogue(data: Record<string, unknown>): AgentResponse {
    const inputData = data as { npcId: string };
    const dialogueId = this.npcState.activeDialogues.get(inputData.npcId);

    return {
      success: true,
      data: {
        npcId: inputData.npcId,
        dialogueId: dialogueId || null,
        hasActiveDialogue: !!dialogueId,
      },
    };
  }

  // ==================== 状态查询 ====================

  /**
   * 获取NPC状态
   */
  private handleGetNPCState(): AgentResponse {
    return {
      success: true,
      data: {
        npcsCount: this.npcState.npcs.size,
        relationsCount: this.npcState.relations.size,
        partySize: this.npcState.party.members.length,
        partyMaxSize: this.npcState.party.maxSize,
        activeDialoguesCount: this.npcState.activeDialogues.size,
      },
    };
  }

  /**
   * 按位置获取NPC
   */
  private handleGetNPCsByLocation(data: Record<string, unknown>): AgentResponse {
    const inputData = data as { locationId: string };
    const npcs = Array.from(this.npcState.npcs.values()).filter(
      npc => npc.location.currentLocationId === inputData.locationId
    );

    return {
      success: true,
      data: { npcs, locationId: inputData.locationId },
    };
  }

  /**
   * 按标记获取NPC
   */
  private handleGetNPCsByFlag(data: Record<string, unknown>): AgentResponse {
    const inputData = data as { flag: keyof NPCFlags; value?: boolean };
    const targetValue = inputData.value ?? true;

    const npcs = Array.from(this.npcState.npcs.values()).filter(
      npc => npc.flags[inputData.flag] === targetValue
    );

    return {
      success: true,
      data: { npcs, flag: inputData.flag, value: targetValue },
    };
  }

  // ==================== 辅助方法 ====================

  /**
   * 生成NPC ID
   */
  private generateNPCId(): string {
    return `npc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export default NPCAgent;

// 导出单例工厂
let npcAgentInstance: NPCAgent | null = null;

export function getNPCAgent(config?: Partial<import('@ai-rpg/shared').AgentConfig>): NPCAgent {
  if (!npcAgentInstance) {
    npcAgentInstance = new NPCAgent();
    if (config) {
      npcAgentInstance.updateConfig(config);
    }
  }
  return npcAgentInstance;
}
