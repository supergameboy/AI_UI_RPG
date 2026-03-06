import type {
  DialogueHistoryEntry,
  ToolCallContext,
  Quest,
  NPC,
  CharacterLocation,
} from '@ai-rpg/shared';
import { ToolType, AgentType } from '@ai-rpg/shared';
import { gameLog } from './GameLogService';
import { getToolRegistry } from '../tools/ToolRegistry';

/**
 * 上下文层级
 * - essential: 必须注入的核心信息（玩家基本信息、当前位置）
 * - important: 重要信息（最近对话、活跃任务）
 * - optional: 可选信息（详细历史、背景信息）
 */
export type ContextLayer = 'essential' | 'important' | 'optional';

/**
 * 核心上下文
 */
export interface CoreContext {
  playerInfo: {
    name: string;
    level: number;
    health: number;
    maxHealth: number;
    mana: number;
    maxMana: number;
    location: string;
    race?: string;
    class?: string;
  };
  sceneInfo: {
    currentLocation: string;
    locationDetails?: string;
    nearbyNPCs: string[];
    activeQuests: string[];
    timeOfDay?: string;
    weather?: string;
  };
  recentHistory: DialogueHistoryEntry[];
  questContext?: {
    activeQuests: Array<{
      id: string;
      name: string;
      description: string;
      progress?: string;
    }>;
  };
  npcContext?: {
    nearbyNPCs: Array<{
      id: string;
      name: string;
      role?: string;
      relationship?: number;
    }>;
  };
  metadata: {
    generatedAt: number;
    layers: ContextLayer[];
    tokenEstimate: number;
  };
}

/**
 * 分层上下文配置
 */
export interface LayerConfig {
  includePlayerInfo: boolean;
  includeLocationInfo: boolean;
  includeNearbyNPCs: boolean;
  includeActiveQuests: boolean;
  maxHistoryEntries: number;
  includeQuestDetails: boolean;
  includeNPCDetails: boolean;
  includeWorldState: boolean;
}

/**
 * 默认层级配置
 */
const LAYER_CONFIGS: Record<ContextLayer, LayerConfig> = {
  essential: {
    includePlayerInfo: true,
    includeLocationInfo: true,
    includeNearbyNPCs: false,
    includeActiveQuests: false,
    maxHistoryEntries: 0,
    includeQuestDetails: false,
    includeNPCDetails: false,
    includeWorldState: false,
  },
  important: {
    includePlayerInfo: true,
    includeLocationInfo: true,
    includeNearbyNPCs: true,
    includeActiveQuests: true,
    maxHistoryEntries: 5,
    includeQuestDetails: true,
    includeNPCDetails: true,
    includeWorldState: false,
  },
  optional: {
    includePlayerInfo: true,
    includeLocationInfo: true,
    includeNearbyNPCs: true,
    includeActiveQuests: true,
    maxHistoryEntries: 20,
    includeQuestDetails: true,
    includeNPCDetails: true,
    includeWorldState: true,
  },
};

/**
 * 上下文注入服务配置
 */
export interface ContextInjectionConfig {
  defaultMaxHistory: number;
  maxTokenEstimate: number;
  enableCache: boolean;
  cacheTTL: number;
}

const DEFAULT_CONFIG: ContextInjectionConfig = {
  defaultMaxHistory: 10,
  maxTokenEstimate: 4000,
  enableCache: true,
  cacheTTL: 60000, // 1 分钟
};

/**
 * 缓存条目
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

/**
 * 上下文注入服务
 * 负责构建核心上下文、分层注入、历史截断
 */
class ContextInjectionService {
  private config: ContextInjectionConfig;
  private contextCache: Map<string, CacheEntry<CoreContext>> = new Map();

  constructor(config?: Partial<ContextInjectionConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * 构建核心上下文
   * @param saveId 存档ID
   * @param characterId 角色ID
   * @param options 可选配置
   */
  public async buildCoreContext(
    saveId: string,
    characterId: string,
    options?: {
      layers?: ContextLayer[];
      maxHistory?: number;
    }
  ): Promise<CoreContext> {
    const layers = options?.layers || ['essential', 'important'];
    const maxHistory = options?.maxHistory || this.config.defaultMaxHistory;

    gameLog.debug('backend', '开始构建核心上下文', {
      saveId,
      characterId,
      layers,
      maxHistory,
    });

    // 检查缓存
    const cacheKey = `${saveId}:${characterId}:${layers.join(',')}`;
    if (this.config.enableCache) {
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        gameLog.debug('backend', '使用缓存的上下文', { cacheKey });
        return cached;
      }
    }

    // 并行获取所有需要的数据
    const contextData = await this.fetchContextData(saveId, characterId, layers, maxHistory);

    // 构建核心上下文
    const coreContext = this.assembleCoreContext(contextData, layers);

    // 缓存结果
    if (this.config.enableCache) {
      this.setCache(cacheKey, coreContext);
    }

    gameLog.info('backend', '核心上下文构建完成', {
      saveId,
      characterId,
      tokenEstimate: coreContext.metadata.tokenEstimate,
      historyEntries: coreContext.recentHistory.length,
    });

    return coreContext;
  }

  /**
   * 注入上下文到提示词
   * @param prompt 原始提示词
   * @param context 核心上下文
   */
  public injectContext(prompt: string, context: CoreContext): string {
    const sections: string[] = [];

    // 玩家信息
    sections.push(this.formatPlayerInfo(context.playerInfo));

    // 场景信息
    sections.push(this.formatSceneInfo(context.sceneInfo));

    // 任务上下文
    if (context.questContext && context.questContext.activeQuests.length > 0) {
      sections.push(this.formatQuestContext(context.questContext));
    }

    // NPC 上下文
    if (context.npcContext && context.npcContext.nearbyNPCs.length > 0) {
      sections.push(this.formatNPCContext(context.npcContext));
    }

    // 对话历史
    if (context.recentHistory.length > 0) {
      sections.push(this.formatHistory(context.recentHistory));
    }

    // 组合上下文
    const contextStr = sections.filter(s => s.trim()).join('\n\n');

    // 注入到提示词
    const injectedPrompt = `${contextStr}

---

${prompt}`;

    gameLog.debug('backend', '上下文注入完成', {
      originalLength: prompt.length,
      injectedLength: injectedPrompt.length,
      sectionsCount: sections.length,
    });

    return injectedPrompt;
  }

  /**
   * 分层获取上下文
   * @param saveId 存档ID
   * @param characterId 角色ID
   * @param layers 上下文层级数组
   */
  public async getLayeredContext(
    saveId: string,
    characterId: string,
    layers: ContextLayer[]
  ): Promise<string> {
    const context = await this.buildCoreContext(saveId, characterId, { layers });

    const sections: string[] = [];

    for (const layer of layers) {
      const config = LAYER_CONFIGS[layer];
      const layerContent = this.buildLayerContent(context, config, layer);
      sections.push(layerContent);
    }

    return sections.filter(s => s.trim()).join('\n\n---\n\n');
  }

  /**
   * 截断历史记录
   * @param history 历史记录数组
   * @param maxEntries 最大条数
   * @param options 截断选项
   */
  public truncateHistory(
    history: DialogueHistoryEntry[],
    maxEntries: number,
    options?: {
      preserveImportant?: boolean;
      generateSummary?: boolean;
    }
  ): {
    truncated: DialogueHistoryEntry[];
    summary?: string;
    removedCount: number;
  } {
    if (history.length <= maxEntries) {
      return {
        truncated: history,
        removedCount: 0,
      };
    }

    const preserveImportant = options?.preserveImportant ?? true;
    const generateSummary = options?.generateSummary ?? true;

    let truncated: DialogueHistoryEntry[];
    let summary: string | undefined;
    const removedCount = history.length - maxEntries;

    if (preserveImportant) {
      // 保留重要的对话（标记为重要的或与任务相关的）
      const important = history.filter(h =>
        h.content.includes('[重要]') ||
        h.content.includes('[任务]') ||
        h.content.includes('[决策]')
      );

      // 获取最近的对话
      const recent = history.slice(-maxEntries);

      // 合并并去重
      const merged = new Map<string, DialogueHistoryEntry>();
      [...important, ...recent].forEach(h => {
        merged.set(h.id, h);
      });

      truncated = Array.from(merged.values())
        .sort((a, b) => a.timestamp - b.timestamp)
        .slice(-maxEntries);
    } else {
      truncated = history.slice(-maxEntries);
    }

    // 生成摘要替代截断内容
    if (generateSummary && removedCount > 0) {
      const removed = history.slice(0, history.length - truncated.length);
      summary = this.generateHistorySummary(removed);
    }

    gameLog.debug('backend', '历史记录截断完成', {
      originalCount: history.length,
      truncatedCount: truncated.length,
      removedCount,
      hasSummary: !!summary,
    });

    return {
      truncated,
      summary,
      removedCount,
    };
  }

  /**
   * 获取上下文数据
   */
  private async fetchContextData(
    saveId: string,
    characterId: string,
    layers: ContextLayer[],
    maxHistory: number
  ): Promise<{
    playerInfo: CoreContext['playerInfo'];
    location: CharacterLocation | null;
    nearbyNPCs: NPC[];
    activeQuests: Quest[];
    history: DialogueHistoryEntry[];
  }> {
    const registry = getToolRegistry();
    const toolContext: ToolCallContext = {
      agentId: AgentType.DIALOGUE,
      requestId: `ctx_${Date.now()}`,
      timestamp: Date.now(),
      permission: 'read',
    };

    // 合并所有层级的配置
    const mergedConfig = this.mergeLayerConfigs(layers);

    // 并行获取数据
    const [
      locationResult,
      historyResult,
      questsResult,
      npcsResult,
    ] = await Promise.all([
      // 获取角色位置
      registry.executeTool<CharacterLocation>(
        ToolType.MAP_DATA,
        'getCharacterLocation',
        { characterId },
        toolContext
      ),
      // 获取对话历史
      registry.executeTool<DialogueHistoryEntry[]>(
        ToolType.DIALOGUE_DATA,
        'getHistory',
        { characterId, limit: maxHistory },
        toolContext
      ),
      // 获取活跃任务
      mergedConfig.includeActiveQuests
        ? registry.executeTool<{ quests: Quest[] }>(
            ToolType.QUEST_DATA,
            'getCharacterQuests',
            { characterId },
            toolContext
          )
        : Promise.resolve({ success: true, data: { quests: [] } }),
      // 获取附近 NPC
      mergedConfig.includeNearbyNPCs
        ? this.getNearbyNPCs(saveId, characterId, toolContext)
        : Promise.resolve([]),
    ]);

    // 提取数据
    const location = locationResult.success ? locationResult.data! : null;
    const history = historyResult.success ? historyResult.data! : [];
    const activeQuests = questsResult.success ? (questsResult.data as { quests: Quest[] }).quests : [];
    const nearbyNPCs = npcsResult;

    // 构建玩家信息（从位置信息推断）
    const playerInfo: CoreContext['playerInfo'] = {
      name: characterId, // 实际应从角色服务获取
      level: 1,
      health: 100,
      maxHealth: 100,
      mana: 100,
      maxMana: 100,
      location: location?.locationId || '未知地点',
    };

    return {
      playerInfo,
      location,
      nearbyNPCs,
      activeQuests,
      history,
    };
  }

  /**
   * 获取附近 NPC
   */
  private async getNearbyNPCs(
    saveId: string,
    characterId: string,
    toolContext: ToolCallContext
  ): Promise<NPC[]> {
    const registry = getToolRegistry();

    // 先获取角色位置
    const locationResult = await registry.executeTool<CharacterLocation>(
      ToolType.MAP_DATA,
      'getCharacterLocation',
      { characterId },
      toolContext
    );

    if (!locationResult.success || !locationResult.data) {
      return [];
    }

    // 获取该位置的 NPC
    const npcsResult = await registry.executeTool<NPC[]>(
      ToolType.NPC_DATA,
      'getNPCsByLocation',
      { locationId: locationResult.data.locationId, saveId },
      toolContext
    );

    return npcsResult.success ? npcsResult.data! : [];
  }

  /**
   * 组装核心上下文
   */
  private assembleCoreContext(
    data: {
      playerInfo: CoreContext['playerInfo'];
      location: CharacterLocation | null;
      nearbyNPCs: NPC[];
      activeQuests: Quest[];
      history: DialogueHistoryEntry[];
    },
    layers: ContextLayer[]
  ): CoreContext {
    const mergedConfig = this.mergeLayerConfigs(layers);

    // 构建场景信息
    const sceneInfo: CoreContext['sceneInfo'] = {
      currentLocation: data.location?.locationId || '未知地点',
      locationDetails: data.location?.locationId,
      nearbyNPCs: data.nearbyNPCs.map(npc => npc.name),
      activeQuests: data.activeQuests.map(quest => quest.name),
    };

    // 构建任务上下文
    const questContext = mergedConfig.includeQuestDetails
      ? {
          activeQuests: data.activeQuests.map(quest => ({
            id: quest.id,
            name: quest.name,
            description: quest.description,
            progress: this.formatQuestProgress(quest),
          })),
        }
      : undefined;

    // 构建 NPC 上下文
    const npcContext = mergedConfig.includeNPCDetails
      ? {
          nearbyNPCs: data.nearbyNPCs.map(npc => {
            // 获取与角色的关系值
            const characterId = data.playerInfo.name; // 使用角色名作为 ID
            const relationship = npc.relationships[characterId];
            return {
              id: npc.id,
              name: npc.name,
              role: npc.role,
              relationship: relationship?.level,
            };
          }),
        }
      : undefined;

    // 估算 token 数量
    const tokenEstimate = this.estimateTokens({
      playerInfo: data.playerInfo,
      sceneInfo,
      recentHistory: data.history,
      questContext,
      npcContext,
    });

    return {
      playerInfo: data.playerInfo,
      sceneInfo,
      recentHistory: data.history,
      questContext,
      npcContext,
      metadata: {
        generatedAt: Date.now(),
        layers,
        tokenEstimate,
      },
    };
  }

  /**
   * 合并层级配置
   */
  private mergeLayerConfigs(layers: ContextLayer[]): LayerConfig {
    const merged: LayerConfig = {
      includePlayerInfo: false,
      includeLocationInfo: false,
      includeNearbyNPCs: false,
      includeActiveQuests: false,
      maxHistoryEntries: 0,
      includeQuestDetails: false,
      includeNPCDetails: false,
      includeWorldState: false,
    };

    for (const layer of layers) {
      const config = LAYER_CONFIGS[layer];
      merged.includePlayerInfo = merged.includePlayerInfo || config.includePlayerInfo;
      merged.includeLocationInfo = merged.includeLocationInfo || config.includeLocationInfo;
      merged.includeNearbyNPCs = merged.includeNearbyNPCs || config.includeNearbyNPCs;
      merged.includeActiveQuests = merged.includeActiveQuests || config.includeActiveQuests;
      merged.maxHistoryEntries = Math.max(merged.maxHistoryEntries, config.maxHistoryEntries);
      merged.includeQuestDetails = merged.includeQuestDetails || config.includeQuestDetails;
      merged.includeNPCDetails = merged.includeNPCDetails || config.includeNPCDetails;
      merged.includeWorldState = merged.includeWorldState || config.includeWorldState;
    }

    return merged;
  }

  /**
   * 构建层级内容
   */
  private buildLayerContent(
    context: CoreContext,
    config: LayerConfig,
    layer: ContextLayer
  ): string {
    const sections: string[] = [];
    const layerNames: Record<ContextLayer, string> = {
      essential: '核心信息',
      important: '重要信息',
      optional: '详细信息',
    };

    sections.push(`## ${layerNames[layer]}`);

    if (config.includePlayerInfo) {
      sections.push(this.formatPlayerInfo(context.playerInfo));
    }

    if (config.includeLocationInfo) {
      sections.push(this.formatSceneInfo(context.sceneInfo));
    }

    if (config.maxHistoryEntries > 0 && context.recentHistory.length > 0) {
      const truncated = this.truncateHistory(context.recentHistory, config.maxHistoryEntries);
      sections.push(this.formatHistory(truncated.truncated));
    }

    return sections.join('\n\n');
  }

  /**
   * 格式化玩家信息
   */
  private formatPlayerInfo(playerInfo: CoreContext['playerInfo']): string {
    const lines = [
      '## 玩家信息',
      `- 姓名: ${playerInfo.name}`,
      `- 等级: ${playerInfo.level}`,
      `- 生命值: ${playerInfo.health}/${playerInfo.maxHealth}`,
      `- 魔法值: ${playerInfo.mana}/${playerInfo.maxMana}`,
      `- 当前位置: ${playerInfo.location}`,
    ];

    if (playerInfo.race) {
      lines.push(`- 种族: ${playerInfo.race}`);
    }
    if (playerInfo.class) {
      lines.push(`- 职业: ${playerInfo.class}`);
    }

    return lines.join('\n');
  }

  /**
   * 格式化场景信息
   */
  private formatSceneInfo(sceneInfo: CoreContext['sceneInfo']): string {
    const lines = ['## 当前场景'];

    if (sceneInfo.locationDetails) {
      lines.push(`地点: ${sceneInfo.locationDetails}`);
    } else {
      lines.push(`地点: ${sceneInfo.currentLocation}`);
    }

    if (sceneInfo.timeOfDay) {
      lines.push(`时间: ${sceneInfo.timeOfDay}`);
    }
    if (sceneInfo.weather) {
      lines.push(`天气: ${sceneInfo.weather}`);
    }

    if (sceneInfo.nearbyNPCs.length > 0) {
      lines.push(`附近NPC: ${sceneInfo.nearbyNPCs.join(', ')}`);
    }

    if (sceneInfo.activeQuests.length > 0) {
      lines.push(`活跃任务: ${sceneInfo.activeQuests.join(', ')}`);
    }

    return lines.join('\n');
  }

  /**
   * 格式化任务上下文
   */
  private formatQuestContext(questContext: NonNullable<CoreContext['questContext']>): string {
    const lines = ['## 任务信息'];

    for (const quest of questContext.activeQuests) {
      lines.push(`### ${quest.name}`);
      lines.push(quest.description);
      if (quest.progress) {
        lines.push(`进度: ${quest.progress}`);
      }
    }

    return lines.join('\n');
  }

  /**
   * 格式化 NPC 上下文
   */
  private formatNPCContext(npcContext: NonNullable<CoreContext['npcContext']>): string {
    const lines = ['## 附近NPC'];

    for (const npc of npcContext.nearbyNPCs) {
      let npcLine = `- ${npc.name}`;
      if (npc.role) {
        npcLine += ` (${npc.role})`;
      }
      if (npc.relationship !== undefined) {
        npcLine += ` [好感度: ${npc.relationship}]`;
      }
      lines.push(npcLine);
    }

    return lines.join('\n');
  }

  /**
   * 格式化对话历史
   */
  private formatHistory(history: DialogueHistoryEntry[]): string {
    const lines = ['## 最近对话'];

    for (const entry of history) {
      const roleLabel = entry.role === 'player' ? '玩家' : entry.role === 'npc' ? 'NPC' : '系统';
      const npcLabel = entry.npcId ? `(${entry.npcId})` : '';
      const emotionLabel = entry.emotion ? `[${entry.emotion}]` : '';

      lines.push(`[${roleLabel}]${npcLabel}${emotionLabel}: ${entry.content}`);
    }

    return lines.join('\n');
  }

  /**
   * 格式化任务进度
   */
  private formatQuestProgress(quest: Quest): string | undefined {
    if (!quest.objectives || quest.objectives.length === 0) {
      return undefined;
    }

    const progress = quest.objectives
      .filter(obj => !obj.isCompleted)
      .map(obj => {
        const current = obj.current || 0;
        const target = obj.required || 1;
        return `${obj.description}: ${current}/${target}`;
      });

    return progress.length > 0 ? progress.join('; ') : '已完成所有目标';
  }

  /**
   * 生成历史摘要
   */
  private generateHistorySummary(history: DialogueHistoryEntry[]): string {
    if (history.length === 0) {
      return '';
    }

    // 提取关键信息
    const keyEvents: string[] = [];
    const mentionedNPCs = new Set<string>();
    const mentionedLocations = new Set<string>();

    for (const entry of history) {
      // 提取 NPC
      if (entry.npcId) {
        mentionedNPCs.add(entry.npcId);
      }

      // 简单的关键词提取
      const locationMatch = entry.content.match(/在(.{2,10})[，。]/);
      if (locationMatch) {
        mentionedLocations.add(locationMatch[1]);
      }

      // 标记重要事件
      if (entry.content.includes('任务') || entry.content.includes('战斗')) {
        keyEvents.push(entry.content.substring(0, 50));
      }
    }

    const summaryParts: string[] = [];

    if (keyEvents.length > 0) {
      summaryParts.push(`关键事件: ${keyEvents.slice(0, 3).join('; ')}`);
    }

    if (mentionedNPCs.size > 0) {
      summaryParts.push(`相关NPC: ${Array.from(mentionedNPCs).join(', ')}`);
    }

    if (mentionedLocations.size > 0) {
      summaryParts.push(`涉及地点: ${Array.from(mentionedLocations).join(', ')}`);
    }

    return summaryParts.length > 0
      ? `[历史摘要] ${summaryParts.join('。')}`
      : `[历史摘要] 共 ${history.length} 条对话记录`;
  }

  /**
   * 估算 token 数量
   */
  private estimateTokens(context: Partial<CoreContext>): number {
    const text = JSON.stringify(context);
    // 中文约 1.5 token/字符，英文约 0.25 token/字符
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    const englishChars = text.length - chineseChars;
    return Math.ceil(chineseChars * 1.5 + englishChars * 0.25);
  }

  /**
   * 从缓存获取
   */
  private getFromCache(key: string): CoreContext | null {
    const cached = this.contextCache.get(key);
    if (!cached) {
      return null;
    }

    if (Date.now() - cached.timestamp > this.config.cacheTTL) {
      this.contextCache.delete(key);
      return null;
    }

    return cached.data;
  }

  /**
   * 设置缓存
   */
  private setCache(key: string, data: CoreContext): void {
    this.contextCache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * 清除缓存
   */
  public clearCache(): void {
    this.contextCache.clear();
    gameLog.debug('backend', '上下文缓存已清除');
  }

  /**
   * 获取配置
   */
  public getConfig(): ContextInjectionConfig {
    return { ...this.config };
  }

  /**
   * 更新配置
   */
  public updateConfig(config: Partial<ContextInjectionConfig>): void {
    this.config = { ...this.config, ...config };
    gameLog.debug('backend', '上下文注入服务配置已更新', config);
  }
}

// 单例实例
let contextInjectionServiceInstance: ContextInjectionService | null = null;

/**
 * 获取上下文注入服务实例
 */
export function getContextInjectionService(): ContextInjectionService {
  if (!contextInjectionServiceInstance) {
    contextInjectionServiceInstance = new ContextInjectionService();
  }
  return contextInjectionServiceInstance;
}

/**
 * 重置上下文注入服务实例（用于测试）
 */
export function resetContextInjectionService(): void {
  contextInjectionServiceInstance = null;
}

export default ContextInjectionService;
