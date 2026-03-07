/**
 * 自定义奖励服务
 * 提供自定义奖励处理的业务逻辑层，支持脚本式、触发器式等多种奖励类型
 */

import type {
  CustomRewardType,
  CustomRewardDefinition,
  CustomRewardResult,
  ScriptRewardConfig,
  TriggerRewardConfig,
  UnlockRewardConfig,
  FlagRewardConfig,
  BuffRewardConfig,
  TitleRewardConfig,
} from '@ai-rpg/shared';
import { gameLog } from './GameLogService';
import { getEventService } from './EventService';

// ==================== 服务接口 ====================

export interface CustomRewardContext {
  characterId: string;
  saveId: string;
  questId?: string;
  questName?: string;
  additionalData?: Record<string, unknown>;
}

export interface CustomRewardHandler {
  type: CustomRewardType;
  execute: (config: Record<string, unknown>, context: CustomRewardContext) => Promise<CustomRewardResult>;
}

// ==================== 自定义奖励服务类 ====================

class CustomRewardService {
  private static instance: CustomRewardService | null = null;

  // 奖励处理器映射
  private handlers: Map<CustomRewardType, CustomRewardHandler> = new Map();

  // 脚本注册表
  private scripts: Map<string, (context: CustomRewardContext, params: Record<string, unknown>) => Promise<CustomRewardResult>> = new Map();

  // 称号注册表
  private titles: Map<string, { name: string; description: string }> = new Map();

  private constructor() {
    this.initializeDefaultHandlers();
    this.initializeDefaultTitles();
  }

  /**
   * 获取单例实例
   */
  public static getInstance(): CustomRewardService {
    if (!CustomRewardService.instance) {
      CustomRewardService.instance = new CustomRewardService();
    }
    return CustomRewardService.instance;
  }

  /**
   * 初始化默认处理器
   */
  private initializeDefaultHandlers(): void {
    // 脚本式奖励处理器
    this.registerHandler({
      type: 'script',
      execute: async (config, context) => this.executeScriptReward(config as unknown as ScriptRewardConfig, context),
    });

    // 触发器式奖励处理器
    this.registerHandler({
      type: 'trigger',
      execute: async (config, context) => this.executeTriggerReward(config as unknown as TriggerRewardConfig, context),
    });

    // 解锁奖励处理器
    this.registerHandler({
      type: 'unlock',
      execute: async (config, context) => this.executeUnlockReward(config as unknown as UnlockRewardConfig, context),
    });

    // 标记奖励处理器
    this.registerHandler({
      type: 'flag',
      execute: async (config, context) => this.executeFlagReward(config as unknown as FlagRewardConfig, context),
    });

    // 增益效果奖励处理器
    this.registerHandler({
      type: 'buff',
      execute: async (config, context) => this.executeBuffReward(config as unknown as BuffRewardConfig, context),
    });

    // 称号奖励处理器
    this.registerHandler({
      type: 'title',
      execute: async (config, context) => this.executeTitleReward(config as unknown as TitleRewardConfig, context),
    });

    // 成就奖励处理器
    this.registerHandler({
      type: 'achievement',
      execute: async (config, context) => this.executeAchievementReward(config, context),
    });
  }

  /**
   * 初始化默认称号
   */
  private initializeDefaultTitles(): void {
    const defaultTitles = [
      { id: 'hero', name: '英雄', description: '完成主线任务获得的称号' },
      { id: 'explorer', name: '探险家', description: '探索多个区域获得的称号' },
      { id: 'monster_slayer', name: '怪物猎人', description: '击败大量怪物获得的称号' },
      { id: 'treasure_hunter', name: '寻宝者', description: '发现隐藏宝藏获得的称号' },
      { id: 'diplomat', name: '外交官', description: '完成多个阵营任务获得的称号' },
      { id: 'master_crafter', name: '工艺大师', description: '制作大量物品获得的称号' },
      { id: 'legendary', name: '传奇', description: '完成所有成就获得的称号' },
    ];

    for (const title of defaultTitles) {
      this.titles.set(title.id, { name: title.name, description: title.description });
    }
  }

  // ==================== 处理器注册 ====================

  /**
   * 注册奖励处理器
   */
  public registerHandler(handler: CustomRewardHandler): void {
    this.handlers.set(handler.type, handler);
    gameLog.debug('backend', '注册自定义奖励处理器', { type: handler.type });
  }

  /**
   * 注册脚本
   */
  public registerScript(
    scriptId: string,
    executor: (context: CustomRewardContext, params: Record<string, unknown>) => Promise<CustomRewardResult>
  ): void {
    this.scripts.set(scriptId, executor);
    gameLog.debug('backend', '注册奖励脚本', { scriptId });
  }

  /**
   * 注册称号
   */
  public registerTitle(id: string, name: string, description: string): void {
    this.titles.set(id, { name, description });
    gameLog.debug('backend', '注册称号', { id, name });
  }

  // ==================== 奖励执行 ====================

  /**
   * 执行自定义奖励
   */
  public async executeReward(
    reward: CustomRewardDefinition,
    context: CustomRewardContext
  ): Promise<CustomRewardResult> {
    const handler = this.handlers.get(reward.type);

    if (!handler) {
      gameLog.warn('backend', '未知的奖励类型', { type: reward.type });
      return {
        success: false,
        type: reward.type,
        error: `未知的奖励类型: ${reward.type}`,
      };
    }

    try {
      const result = await handler.execute(reward.config, context);

      gameLog.debug('backend', '自定义奖励执行完成', {
        type: reward.type,
        characterId: context.characterId,
        success: result.success,
        message: result.message,
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      gameLog.error('backend', '自定义奖励执行失败', {
        type: reward.type,
        characterId: context.characterId,
        error: errorMessage,
      });

      return {
        success: false,
        type: reward.type,
        error: errorMessage,
      };
    }
  }

  /**
   * 批量执行自定义奖励
   */
  public async executeRewards(
    rewards: CustomRewardDefinition[],
    context: CustomRewardContext
  ): Promise<CustomRewardResult[]> {
    const results: CustomRewardResult[] = [];

    for (const reward of rewards) {
      const result = await this.executeReward(reward, context);
      results.push(result);
    }

    return results;
  }

  // ==================== 具体奖励类型处理 ====================

  /**
   * 执行脚本奖励
   */
  private async executeScriptReward(
    config: ScriptRewardConfig,
    context: CustomRewardContext
  ): Promise<CustomRewardResult> {
    const { scriptId, params } = config;
    const script = this.scripts.get(scriptId);

    if (!script) {
      return {
        success: false,
        type: 'script',
        error: `脚本不存在: ${scriptId}`,
      };
    }

    try {
      const result = await script(context, params || {});
      return {
        ...result,
        type: 'script',
        data: { scriptId, params },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        type: 'script',
        error: `脚本执行失败: ${errorMessage}`,
      };
    }
  }

  /**
   * 执行触发器奖励
   */
  private async executeTriggerReward(
    config: TriggerRewardConfig,
    context: CustomRewardContext
  ): Promise<CustomRewardResult> {
    const { eventType, eventData, delay } = config;

    try {
      const eventService = getEventService();

      // 创建触发事件
      const event = eventService.createEvent({
        id: `reward_event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        saveId: context.saveId,
        type: 'condition',
        name: `奖励事件: ${eventType}`,
        description: '任务奖励触发的事件',
        trigger: {
          conditions: [],
        },
        effects: [
          {
            type: 'custom',
            action: eventType,
            params: eventData,
          },
        ],
        metadata: {
          priority: 100,
          repeatable: false,
        },
      });

      // 如果有延迟，设置定时触发
      if (delay && delay > 0) {
        setTimeout(() => {
          eventService.triggerEvent(event.id, {
            saveId: context.saveId,
            characterId: context.characterId,
            locationId: '',
            characterAttributes: {},
            inventory: [],
            questFlags: [],
            storyFlags: {},
            currentTime: Date.now(),
            previousEvents: [],
            playerChoices: [],
          });
        }, delay);
      } else {
        // 立即触发
        eventService.triggerEvent(event.id, {
          saveId: context.saveId,
          characterId: context.characterId,
          locationId: '',
          characterAttributes: {},
          inventory: [],
          questFlags: [],
          storyFlags: {},
          currentTime: Date.now(),
          previousEvents: [],
          playerChoices: [],
        });
      }

      return {
        success: true,
        type: 'trigger',
        message: `触发器事件已创建: ${eventType}`,
        data: { eventId: event.id, eventType, delay },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        type: 'trigger',
        error: `触发器创建失败: ${errorMessage}`,
      };
    }
  }

  /**
   * 执行解锁奖励
   */
  private async executeUnlockReward(
    config: UnlockRewardConfig,
    context: CustomRewardContext
  ): Promise<CustomRewardResult> {
    const { unlockType, targetId, permanent } = config;

    // 这里需要与其他服务集成
    // 目前先记录日志，实际解锁逻辑需要根据 unlockType 调用相应服务
    gameLog.info('backend', '解锁奖励', {
      characterId: context.characterId,
      unlockType,
      targetId,
      permanent,
      questId: context.questId,
    });

    // TODO: 根据解锁类型调用相应的服务
    // - skill: 调用 SkillService 解锁技能
    // - map: 调用 MapService 解锁地图
    // - feature: 设置功能标记
    // - quest: 解锁新任务
    // - item: 解锁物品配方或使用权

    return {
      success: true,
      type: 'unlock',
      message: `已解锁${unlockType}: ${targetId}`,
      data: { unlockType, targetId, permanent },
    };
  }

  /**
   * 执行标记奖励
   */
  private async executeFlagReward(
    config: FlagRewardConfig,
    context: CustomRewardContext
  ): Promise<CustomRewardResult> {
    const { flagName, value } = config;

    // 设置游戏标记
    // 这里需要与存档服务集成
    gameLog.info('backend', '标记奖励', {
      characterId: context.characterId,
      flagName,
      value,
      questId: context.questId,
    });

    // TODO: 与存档服务集成，设置 storyFlags

    return {
      success: true,
      type: 'flag',
      message: `已设置标记: ${flagName}`,
      data: { flagName, value },
    };
  }

  /**
   * 执行增益效果奖励
   */
  private async executeBuffReward(
    config: BuffRewardConfig,
    context: CustomRewardContext
  ): Promise<CustomRewardResult> {
    const { buffId, duration, stacks } = config;

    // 这里需要与 NumericalService 或状态效果服务集成
    gameLog.info('backend', '增益效果奖励', {
      characterId: context.characterId,
      buffId,
      duration,
      stacks,
      questId: context.questId,
    });

    // TODO: 与 NumericalService 集成，添加状态效果

    return {
      success: true,
      type: 'buff',
      message: `已添加增益效果: ${buffId}`,
      data: { buffId, duration, stacks },
    };
  }

  /**
   * 执行称号奖励
   */
  private async executeTitleReward(
    config: TitleRewardConfig,
    context: CustomRewardContext
  ): Promise<CustomRewardResult> {
    const { titleId, titleName, description } = config;

    // 获取或创建称号信息
    const titleInfo = this.titles.get(titleId) || {
      name: titleName || titleId,
      description: description || '',
    };

    // 这里需要与角色服务集成，添加称号
    gameLog.info('backend', '称号奖励', {
      characterId: context.characterId,
      titleId,
      titleName: titleInfo.name,
      description: titleInfo.description,
      questId: context.questId,
    });

    // TODO: 与角色服务集成，添加称号到角色数据

    return {
      success: true,
      type: 'title',
      message: `获得称号: ${titleInfo.name}`,
      data: { titleId, titleName: titleInfo.name, description: titleInfo.description },
    };
  }

  /**
   * 执行成就奖励
   */
  private async executeAchievementReward(
    config: Record<string, unknown>,
    context: CustomRewardContext
  ): Promise<CustomRewardResult> {
    const achievementId = config.achievementId as string | undefined;

    if (!achievementId) {
      return {
        success: false,
        type: 'achievement',
        error: '缺少成就ID',
      };
    }

    // 这里需要与成就系统服务集成
    gameLog.info('backend', '成就奖励', {
      characterId: context.characterId,
      achievementId,
      questId: context.questId,
    });

    // TODO: 与成就系统服务集成，解锁成就

    return {
      success: true,
      type: 'achievement',
      message: `解锁成就: ${achievementId}`,
      data: { achievementId },
    };
  }

  // ==================== 辅助方法 ====================

  /**
   * 获取称号信息
   */
  public getTitleInfo(titleId: string): { name: string; description: string } | undefined {
    return this.titles.get(titleId);
  }

  /**
   * 获取所有称号
   */
  public getAllTitles(): Map<string, { name: string; description: string }> {
    return new Map(this.titles);
  }

  /**
   * 检查奖励类型是否支持
   */
  public isSupportedType(type: CustomRewardType): boolean {
    return this.handlers.has(type);
  }

  /**
   * 获取支持的奖励类型
   */
  public getSupportedTypes(): CustomRewardType[] {
    return Array.from(this.handlers.keys());
  }
}

// ==================== 单例导出 ====================

let customRewardServiceInstance: CustomRewardService | null = null;

export function getCustomRewardService(): CustomRewardService {
  if (!customRewardServiceInstance) {
    customRewardServiceInstance = CustomRewardService.getInstance();
  }
  return customRewardServiceInstance;
}

export function initializeCustomRewardService(): CustomRewardService {
  return getCustomRewardService();
}

export { CustomRewardService };
