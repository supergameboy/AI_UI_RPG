/**
 * 任务服务
 * 提供任务管理的业务逻辑层，处理任务接取、完成、进度更新等操作
 */

import type {
  Quest,
  QuestTemplate,
  QuestRewards,
  QuestObjective,
  QuestStatistics,
  AcceptQuestResponse,
  CompleteQuestResponse,
  UpdateProgressResponse,
  AbandonQuestResponse,
  QuestListResponse,
  GetAvailableQuestsResponse,
} from '@ai-rpg/shared';
import { getQuestRepository, QuestRepository } from '../models/QuestRepository';
import { getInventoryService } from './InventoryService';
import { getNumericalService } from './NumericalService';
import { gameLog } from './GameLogService';

// ==================== 服务接口 ====================

export interface CreateQuestData {
  id: string;
  name: string;
  description: string;
  type: Quest['type'];
  objectives: Omit<QuestObjective, 'id' | 'current' | 'isCompleted'>[];
  prerequisites?: string[];
  rewards: QuestRewards;
  timeLimit?: number;
}

// ==================== 任务服务类 ====================

export class QuestService {
  private static instance: QuestService | null = null;
  private questRepository: QuestRepository;
  private initialized: boolean = false;

  // 任务模板缓存
  private questTemplates: Map<string, QuestTemplate> = new Map();

  private constructor() {
    this.questRepository = getQuestRepository();
  }

  /**
   * 获取单例实例
   */
  public static getInstance(): QuestService {
    if (!QuestService.instance) {
      QuestService.instance = new QuestService();
    }
    return QuestService.instance;
  }

  /**
   * 初始化服务
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    // 确保仓库已初始化
    getQuestRepository();

    this.initialized = true;
    console.log('[QuestService] Initialized');
  }

  // ==================== 任务管理 ====================

  /**
   * 接取任务
   */
  public acceptQuest(
    characterId: string,
    questId: string,
    questData?: Quest
  ): AcceptQuestResponse {
    try {
      // 检查任务是否已存在
      if (this.questRepository.questExists(questId, characterId)) {
        const existingQuest = this.questRepository.getQuest(questId, characterId);
        if (existingQuest && existingQuest.status !== 'available') {
          return {
            success: false,
            quest: existingQuest,
            message: '任务已接取',
          };
        }
      }

      // 如果提供了任务数据，使用提供的数据
      let quest: Quest;
      if (questData) {
        quest = {
          ...questData,
          id: questId,
          status: 'in_progress',
          objectives: questData.objectives.map((obj, index) => ({
            ...obj,
            id: obj.id || `obj_${index}`,
            current: obj.current ?? 0,
            isCompleted: obj.isCompleted ?? false,
          })),
          log: [
            {
              timestamp: Date.now(),
              event: '任务接取',
            },
          ],
          characterId,
          createdAt: Math.floor(Date.now() / 1000),
          updatedAt: Math.floor(Date.now() / 1000),
        };
      } else {
        // 尝试从模板获取
        const template = this.questTemplates.get(questId);
        if (!template) {
          return {
            success: false,
            quest: null as unknown as Quest,
            message: '任务不存在',
          };
        }

        quest = this.createQuestFromTemplate(template, characterId);
      }

      // 检查前置条件
      if (!this.checkPrerequisites(characterId, quest)) {
        return {
          success: false,
          quest,
          message: '未满足任务前置条件',
        };
      }

      // 保存任务
      this.questRepository.createQuest(characterId, quest);

      // 记录详细日志
      gameLog.debug('backend', '接受任务详情', {
        questId,
        objectives: quest.objectives.map(o => ({ id: o.id, description: o.description, required: o.required })),
        rewards: quest.rewards,
        type: quest.type,
      });

      return {
        success: true,
        quest,
        message: `成功接取任务: ${quest.name}`,
      };
    } catch (error) {
      console.error('[QuestService] Error accepting quest:', error);
      return {
        success: false,
        quest: null as unknown as Quest,
        message: error instanceof Error ? error.message : '接取任务失败',
      };
    }
  }

  /**
   * 完成任务
   */
  public completeQuest(characterId: string, questId: string): CompleteQuestResponse {
    try {
      const quest = this.questRepository.getQuest(questId, characterId);

      if (!quest) {
        return {
          success: false,
          quest: null as unknown as Quest,
          rewards: {},
          message: '任务不存在',
        };
      }

      if (quest.status !== 'in_progress') {
        return {
          success: false,
          quest,
          rewards: {},
          message: '任务状态不正确',
        };
      }

      // 检查所有目标是否完成
      const allObjectivesCompleted = quest.objectives.every(obj => obj.isCompleted);
      if (!allObjectivesCompleted) {
        return {
          success: false,
          quest,
          rewards: {},
          message: '任务目标未全部完成',
        };
      }

      // 更新任务状态
      this.questRepository.updateQuestStatus(questId, characterId, 'completed');
      this.questRepository.addLogEntry(questId, characterId, '任务完成');

      // 发放奖励
      this.grantRewards(characterId, quest.rewards);

      // 获取更新后的任务
      const completedQuest = this.questRepository.getQuest(questId, characterId)!;

      // 记录详细日志
      gameLog.debug('backend', '完成任务详情', {
        questId,
        completedObjectives: quest.objectives.filter(o => o.isCompleted).map(o => ({ id: o.id, description: o.description })),
        rewardsClaimed: quest.rewards,
        questName: quest.name,
      });

      return {
        success: true,
        quest: completedQuest,
        rewards: quest.rewards,
        message: `任务完成: ${quest.name}`,
      };
    } catch (error) {
      console.error('[QuestService] Error completing quest:', error);
      return {
        success: false,
        quest: null as unknown as Quest,
        rewards: {},
        message: error instanceof Error ? error.message : '完成任务失败',
      };
    }
  }

  /**
   * 更新任务进度
   */
  public updateProgress(
    characterId: string,
    questId: string,
    objectiveId: string,
    progress: number
  ): UpdateProgressResponse {
    try {
      const quest = this.questRepository.getQuest(questId, characterId);

      if (!quest) {
        return {
          success: false,
          quest: null as unknown as Quest,
          objective: null as unknown as QuestObjective,
          questCompleted: false,
        };
      }

      if (quest.status !== 'in_progress') {
        return {
          success: false,
          quest,
          objective: null as unknown as QuestObjective,
          questCompleted: false,
        };
      }

      // 更新目标进度
      const updatedQuest = this.questRepository.updateObjectiveProgress(
        questId,
        characterId,
        objectiveId,
        progress
      );

      if (!updatedQuest) {
        return {
          success: false,
          quest,
          objective: null as unknown as QuestObjective,
          questCompleted: false,
        };
      }

      // 找到更新的目标
      const objective = updatedQuest.objectives.find(obj => obj.id === objectiveId)!;

      // 记录日志
      gameLog.debug('backend', '更新任务进度', { questId, objectiveId, progress });

      // 添加日志
      if (objective.isCompleted) {
        this.questRepository.addLogEntry(questId, characterId, `目标完成: ${objective.description}`);
      } else {
        this.questRepository.addLogEntry(
          questId,
          characterId,
          `进度更新: ${objective.description} (${objective.current}/${objective.required})`
        );
      }

      // 检查任务是否完成
      const questCompleted = updatedQuest.objectives.every(obj => obj.isCompleted);

      if (questCompleted) {
        this.questRepository.addLogEntry(questId, characterId, '所有目标已完成，可以提交任务');
      }

      return {
        success: true,
        quest: updatedQuest,
        objective,
        questCompleted,
      };
    } catch (error) {
      console.error('[QuestService] Error updating progress:', error);
      return {
        success: false,
        quest: null as unknown as Quest,
        objective: null as unknown as QuestObjective,
        questCompleted: false,
      };
    }
  }

  /**
   * 增加任务进度
   */
  public incrementProgress(
    characterId: string,
    questId: string,
    objectiveId: string,
    increment: number
  ): UpdateProgressResponse {
    const quest = this.questRepository.getQuest(questId, characterId);
    if (!quest) {
      return {
        success: false,
        quest: null as unknown as Quest,
        objective: null as unknown as QuestObjective,
        questCompleted: false,
      };
    }

    const objective = quest.objectives.find(obj => obj.id === objectiveId);
    if (!objective) {
      return {
        success: false,
        quest,
        objective: null as unknown as QuestObjective,
        questCompleted: false,
      };
    }

    return this.updateProgress(
      characterId,
      questId,
      objectiveId,
      objective.current + increment
    );
  }

  /**
   * 放弃任务
   */
  public abandonQuest(characterId: string, questId: string): AbandonQuestResponse {
    try {
      const quest = this.questRepository.getQuest(questId, characterId);

      if (!quest) {
        return {
          success: false,
          questId,
          message: '任务不存在',
        };
      }

      if (quest.status === 'completed') {
        return {
          success: false,
          questId,
          message: '已完成的任务无法放弃',
        };
      }

      // 删除任务
      const deleted = this.questRepository.deleteQuest(questId, characterId);

      if (!deleted) {
        return {
          success: false,
          questId,
          message: '放弃任务失败',
        };
      }

      return {
        success: true,
        questId,
        message: `已放弃任务: ${quest.name}`,
      };
    } catch (error) {
      console.error('[QuestService] Error abandoning quest:', error);
      return {
        success: false,
        questId,
        message: error instanceof Error ? error.message : '放弃任务失败',
      };
    }
  }

  /**
   * 获取角色任务列表
   */
  public getCharacterQuests(characterId: string): QuestListResponse {
    try {
      const quests = this.questRepository.getCharacterQuests(characterId);
      const statistics = this.questRepository.getStatistics(characterId);

      return {
        success: true,
        quests,
        statistics,
      };
    } catch (error) {
      console.error('[QuestService] Error getting character quests:', error);
      return {
        success: false,
        quests: [],
        statistics: this.getEmptyStatistics(),
      };
    }
  }

  /**
   * 获取任务详情
   */
  public getQuest(characterId: string, questId: string): {
    success: boolean;
    quest: Quest | null;
    message?: string;
  } {
    try {
      const quest = this.questRepository.getQuest(questId, characterId);

      if (!quest) {
        return {
          success: false,
          quest: null,
          message: '任务不存在',
        };
      }

      return {
        success: true,
        quest,
      };
    } catch (error) {
      console.error('[QuestService] Error getting quest:', error);
      return {
        success: false,
        quest: null,
        message: error instanceof Error ? error.message : '获取任务失败',
      };
    }
  }

  /**
   * 获取可接取的任务
   */
  public getAvailableQuests(characterId: string): GetAvailableQuestsResponse {
    try {
      const templates = Array.from(this.questTemplates.values());
      const completedQuestIds = this.questRepository
        .getCompletedQuests(characterId)
        .map(q => q.id);

      const availableQuests: QuestTemplate[] = [];
      let unlockedCount = 0;
      let lockedCount = 0;

      for (const template of templates) {
        // 跳过已完成的任务（非重复任务）
        if (completedQuestIds.includes(template.id) && !template.repeatable) {
          continue;
        }

        // 检查是否已接取
        const existingQuest = this.questRepository.getQuest(template.id, characterId);
        if (existingQuest && existingQuest.status === 'in_progress') {
          continue;
        }

        availableQuests.push(template);

        // 检查前置条件
        const prerequisitesMet = this.checkTemplatePrerequisites(characterId, template);
        if (prerequisitesMet) {
          unlockedCount++;
        } else {
          lockedCount++;
        }
      }

      return {
        success: true,
        quests: availableQuests,
        unlockedCount,
        lockedCount,
      };
    } catch (error) {
      console.error('[QuestService] Error getting available quests:', error);
      return {
        success: false,
        quests: [],
        unlockedCount: 0,
        lockedCount: 0,
      };
    }
  }

  // ==================== 前置条件检查 ====================

  /**
   * 检查任务前置条件
   */
  public checkPrerequisites(characterId: string, quest: Quest): boolean {
    if (!quest.prerequisites || quest.prerequisites.length === 0) {
      return true;
    }

    const completedQuestIds = this.questRepository
      .getCompletedQuests(characterId)
      .map(q => q.id);

    return quest.prerequisites.every(prereqId => completedQuestIds.includes(prereqId));
  }

  /**
   * 检查模板前置条件
   */
  private checkTemplatePrerequisites(characterId: string, template: QuestTemplate): boolean {
    if (!template.prerequisites || template.prerequisites.length === 0) {
      return true;
    }

    const completedQuestIds = this.questRepository
      .getCompletedQuests(characterId)
      .map(q => q.id);

    return template.prerequisites.every(prereqId => completedQuestIds.includes(prereqId));
  }

  // ==================== 奖励发放 ====================

  /**
   * 发放任务奖励
   */
  public grantRewards(characterId: string, rewards: QuestRewards): void {
    try {
      // 发放经验值
      if (rewards.experience && rewards.experience > 0) {
        const numericalService = getNumericalService();
        numericalService.addExperience({
          characterId,
          amount: rewards.experience,
          source: 'quest_reward',
        });
      }

      // 发放货币
      if (rewards.currency) {
        const inventoryService = getInventoryService();
        for (const [currency, amount] of Object.entries(rewards.currency)) {
          if (amount > 0) {
            // 使用 saveId 作为 characterId（简化处理）
            inventoryService.addCurrency(characterId, characterId, currency, amount);
          }
        }
      }

      // 发放物品
      if (rewards.items && rewards.items.length > 0) {
        const inventoryService = getInventoryService();
        for (const itemReward of rewards.items) {
          // 创建物品并添加到背包
          const item = inventoryService.createItem(
            itemReward.itemId,
            'material',
            'common',
            {
              description: `任务奖励物品: ${itemReward.itemId}`,
            }
          );

          // 使用 saveId 作为 characterId（简化处理）
          inventoryService.addItem(characterId, characterId, item, itemReward.quantity);
        }
      }

      // TODO: 发放声望奖励
      // TODO: 发放自定义奖励

      console.log(`[QuestService] Rewards granted to character ${characterId}:`, rewards);
    } catch (error) {
      console.error('[QuestService] Error granting rewards:', error);
    }
  }

  // ==================== 任务模板管理 ====================

  /**
   * 注册任务模板
   */
  public registerTemplate(template: QuestTemplate): void {
    this.questTemplates.set(template.id, template);
  }

  /**
   * 批量注册任务模板
   */
  public registerTemplates(templates: QuestTemplate[]): void {
    for (const template of templates) {
      this.registerTemplate(template);
    }
  }

  /**
   * 获取任务模板
   */
  public getTemplate(templateId: string): QuestTemplate | undefined {
    return this.questTemplates.get(templateId);
  }

  /**
   * 从模板创建任务
   */
  private createQuestFromTemplate(template: QuestTemplate, characterId: string): Quest {
    const now = Math.floor(Date.now() / 1000);

    return {
      id: template.id,
      name: template.name,
      description: template.description,
      type: template.type,
      status: 'in_progress',
      objectives: template.objectives.map((obj, index) => ({
        id: `obj_${index}`,
        description: obj.description,
        type: obj.type,
        target: obj.target,
        current: 0,
        required: obj.required,
        isCompleted: false,
      })),
      prerequisites: template.prerequisites,
      rewards: template.rewards,
      timeLimit: template.timeLimit,
      log: [
        {
          timestamp: Date.now(),
          event: '任务接取',
        },
      ],
      characterId,
      createdAt: now,
      updatedAt: now,
    };
  }

  // ==================== 辅助方法 ====================

  /**
   * 获取空统计数据
   */
  private getEmptyStatistics(): QuestStatistics {
    return {
      total: 0,
      byType: {
        main: 0,
        side: 0,
        hidden: 0,
        daily: 0,
        chain: 0,
      },
      byStatus: {
        locked: 0,
        available: 0,
        in_progress: 0,
        completed: 0,
        failed: 0,
      },
      completedCount: 0,
      inProgressCount: 0,
      availableCount: 0,
    };
  }

  /**
   * 根据目标类型更新进度
   * 用于自动追踪任务进度
   */
  public updateProgressByType(
    characterId: string,
    objectiveType: QuestObjective['type'],
    target: string,
    increment: number = 1
  ): UpdateProgressResponse[] {
    const results: UpdateProgressResponse[] = [];
    const inProgressQuests = this.questRepository.getInProgressQuests(characterId);

    for (const quest of inProgressQuests) {
      for (const objective of quest.objectives) {
        if (objective.type === objectiveType && objective.target === target && !objective.isCompleted) {
          const result = this.incrementProgress(
            characterId,
            quest.id,
            objective.id,
            increment
          );
          results.push(result);
        }
      }
    }

    return results;
  }

  /**
   * 检查并自动完成任务
   */
  public autoCompleteQuests(characterId: string): CompleteQuestResponse[] {
    const results: CompleteQuestResponse[] = [];
    const inProgressQuests = this.questRepository.getInProgressQuests(characterId);

    for (const quest of inProgressQuests) {
      const allCompleted = quest.objectives.every(obj => obj.isCompleted);
      if (allCompleted) {
        const result = this.completeQuest(characterId, quest.id);
        results.push(result);
      }
    }

    return results;
  }
}

// ==================== 单例导出 ====================

let questServiceInstance: QuestService | null = null;

export function getQuestService(): QuestService {
  if (!questServiceInstance) {
    questServiceInstance = QuestService.getInstance();
  }
  return questServiceInstance;
}

export async function initializeQuestService(): Promise<QuestService> {
  const service = getQuestService();
  await service.initialize();
  return service;
}
