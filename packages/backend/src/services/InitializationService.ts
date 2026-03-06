/**
 * 游戏初始化服务
 * 负责新游戏开始时的各项初始化工作，包括数值、技能、背包、装备、任务、地图、NPC和场景
 */

import type {
  Character,
  GameTemplate,
  InitializationStatus,
  InitializationRequest,
  InitializationResponse,
  StepResult,
  InitializationData,
} from '@ai-rpg/shared';
import { InitializationStep } from '@ai-rpg/shared';
import { gameLog } from './GameLogService';
import { getNumericalService } from './NumericalService';
import { getSkillService } from './SkillService';
import { getInventoryService, initializeInventoryService } from './InventoryService';
import { initializeEquipmentService, getEquipmentService } from './EquipmentService';
import { getQuestService } from './QuestService';
import { getMapService } from './MapService';
import { getNPCService } from './NPCService';

/**
 * 初始化服务
 * 负责游戏初始化流程的编排和状态管理
 */
export class InitializationService {
  private static instance: InitializationService | null = null;
  
  // 存储初始化状态
  private initializationStatuses: Map<string, InitializationStatus> = new Map();

  private constructor() {}

  public static getInstance(): InitializationService {
    if (!InitializationService.instance) {
      InitializationService.instance = new InitializationService();
    }
    return InitializationService.instance;
  }

  /**
   * 获取初始化状态
   */
  public getStatus(saveId: string): InitializationStatus | null {
    return this.initializationStatuses.get(saveId) || null;
  }

  /**
   * 执行完整初始化流程
   */
  public async runFullInitialization(request: InitializationRequest): Promise<InitializationResponse> {
    const { saveId, character, template } = request;
    
    gameLog.info('backend', '开始游戏初始化', { saveId, characterName: character.name });

    // 初始化状态
    const status: InitializationStatus = {
      saveId,
      currentStep: null,
      completedSteps: [],
      failed: false,
      startedAt: Date.now(),
    };
    
    // 收集各步骤数据
    const initializationData: InitializationData = {};
    
    this.initializationStatuses.set(saveId, status);

    // 定义初始化步骤顺序
    const steps: InitializationStep[] = [
      InitializationStep.NUMERICAL,
      InitializationStep.SKILLS,
      InitializationStep.INVENTORY,
      InitializationStep.EQUIPMENT,
      InitializationStep.QUESTS,
      InitializationStep.MAP,
      InitializationStep.NPCS,
      InitializationStep.SCENE,
    ];

    try {
      for (const step of steps) {
        status.currentStep = step;
        this.initializationStatuses.set(saveId, { ...status });

        const result = await this.executeStep(step, saveId, character, template);
        
        if (!result.success) {
          status.failed = true;
          status.error = result.error || `步骤 ${step} 失败`;
          status.currentStep = null;
          this.initializationStatuses.set(saveId, { ...status });
          
          gameLog.error('backend', `初始化步骤失败: ${step}`, { error: status.error });
          
          return {
            success: false,
            status,
            error: status.error,
            data: initializationData,
          };
        }

        // 收集步骤数据
        this.collectStepData(initializationData, step, result.data);
        
        status.completedSteps.push(step);
        this.initializationStatuses.set(saveId, { ...status });
        
        gameLog.info('backend', `初始化步骤完成: ${step}`, { saveId });
      }

      // 所有步骤完成
      status.currentStep = null;
      status.completedAt = Date.now();
      this.initializationStatuses.set(saveId, { ...status });

      gameLog.info('backend', '游戏初始化完成', { 
        saveId, 
        duration: status.completedAt - status.startedAt 
      });

      return {
        success: true,
        status,
        data: initializationData,
      };
    } catch (error) {
      status.failed = true;
      status.error = error instanceof Error ? error.message : String(error);
      status.currentStep = null;
      this.initializationStatuses.set(saveId, { ...status });

      gameLog.error('backend', '初始化过程发生异常', { error: status.error });

      return {
        success: false,
        status,
        error: status.error,
        data: initializationData,
      };
    }
  }

  /**
   * 收集步骤数据到初始化数据集合
   */
  private collectStepData(
    data: InitializationData,
    step: InitializationStep,
    stepData: unknown
  ): void {
    switch (step) {
      case InitializationStep.NUMERICAL:
        data.numerical = stepData as InitializationData['numerical'];
        break;
      case InitializationStep.SKILLS:
        data.skills = stepData as InitializationData['skills'];
        break;
      case InitializationStep.INVENTORY:
        data.inventory = stepData as InitializationData['inventory'];
        break;
      case InitializationStep.EQUIPMENT:
        data.equipment = stepData as InitializationData['equipment'];
        break;
      case InitializationStep.QUESTS:
        data.quests = stepData as InitializationData['quests'];
        break;
      case InitializationStep.MAP:
        data.map = stepData as InitializationData['map'];
        break;
      case InitializationStep.NPCS:
        data.npcs = stepData as InitializationData['npcs'];
        break;
      case InitializationStep.SCENE:
        data.scene = stepData as InitializationData['scene'];
        break;
    }
  }

  /**
   * 重试初始化
   */
  public async retryInitialization(
    saveId: string,
    character: Character,
    template: GameTemplate
  ): Promise<InitializationResponse> {
    const existingStatus = this.initializationStatuses.get(saveId);
    
    if (!existingStatus) {
      return {
        success: false,
        status: {
          saveId,
          currentStep: null,
          completedSteps: [],
          failed: true,
          error: '未找到初始化记录',
          startedAt: Date.now(),
        },
        error: '未找到初始化记录',
      };
    }

    // 清除旧状态，重新开始
    this.initializationStatuses.delete(saveId);
    
    return this.runFullInitialization({ saveId, character, template });
  }

  /**
   * 执行单个步骤
   */
  private async executeStep(
    step: InitializationStep,
    saveId: string,
    character: Character,
    template: GameTemplate
  ): Promise<StepResult> {
    switch (step) {
      case InitializationStep.NUMERICAL:
        return this.executeNumericalStep(saveId, character, template);
      case InitializationStep.SKILLS:
        return this.executeSkillsStep(saveId, character, template);
      case InitializationStep.INVENTORY:
        return this.executeInventoryStep(saveId, character, template);
      case InitializationStep.EQUIPMENT:
        return this.executeEquipmentStep(saveId, character, template);
      case InitializationStep.QUESTS:
        return this.executeQuestsStep(saveId, character, template);
      case InitializationStep.MAP:
        return this.executeMapStep(saveId, character, template);
      case InitializationStep.NPCS:
        return this.executeNPCsStep(saveId, character, template);
      case InitializationStep.SCENE:
        return this.executeSceneStep(saveId, character, template);
      default:
        return {
          step,
          success: false,
          error: `未知步骤: ${step}`,
        };
    }
  }

  // ==================== 步骤执行器 ====================

  private async executeNumericalStep(
    _saveId: string,
    character: Character,
    _template: GameTemplate
  ): Promise<StepResult> {
    try {
      const numericalService = getNumericalService();
      
      // 初始化角色的数值属性
      const result = numericalService.calculateBaseAttributes({
        level: character.level || 1,
        race: character.race,
        class: character.class,
      });

      if (!result.success) {
        return {
          step: InitializationStep.NUMERICAL,
          success: false,
          error: result.error || '数值计算失败',
        };
      }

      gameLog.debug('backend', '数值初始化完成', { attributes: result.data });

      return {
        step: InitializationStep.NUMERICAL,
        success: true,
        data: result.data,
      };
    } catch (error) {
      return {
        step: InitializationStep.NUMERICAL,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private async executeSkillsStep(
    saveId: string,
    character: Character,
    template: GameTemplate
  ): Promise<StepResult> {
    try {
      const skillService = getSkillService();
      
      // 根据职业获取初始技能
      const classId = character.class || 'warrior';
      const initialSkills = template.initialData?.skills?.[classId] || [];
      
      const learnedSkills: string[] = [];
      const failedSkills: string[] = [];
      
      // 为角色添加初始技能
      for (const skillId of initialSkills) {
        try {
          const result = await skillService.learnSkill({
            characterId: character.id,
            skillId,
            source: 'level_up',
          });
          
          if (result.success) {
            learnedSkills.push(skillId);
          } else {
            failedSkills.push(skillId);
          }
        } catch (err) {
          failedSkills.push(skillId);
          gameLog.warn('backend', `学习技能失败: ${skillId}`, { error: err });
        }
      }

      gameLog.debug('backend', '技能初始化完成', { saveId, learnedSkills: learnedSkills.length, failedSkills: failedSkills.length });

      return {
        step: InitializationStep.SKILLS,
        success: true,
        data: { learnedSkills, failedSkills },
      };
    } catch (error) {
      return {
        step: InitializationStep.SKILLS,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private async executeInventoryStep(
    saveId: string,
    character: Character,
    template: GameTemplate
  ): Promise<StepResult> {
    try {
      // 确保背包服务初始化
      initializeInventoryService();
      const inventoryService = getInventoryService();
      
      // 获取或创建角色背包
      inventoryService.getInventory(saveId, character.id);
      
      // 优先使用 startingScene.items，如果没有再使用 initialData
      const backgroundId = character.backstory || 'commoner';
      const initialItems = template.startingScene?.items?.map(item => ({
        itemId: item.id,
        quantity: item.quantity || 1,
      })) || template.initialData?.items?.[backgroundId] || [];
      
      const addedItems: Array<{ itemId: string; quantity: number }> = [];
      const failedItems: string[] = [];
      
      for (const item of initialItems) {
        try {
          // 创建物品实例
          const itemInstance = inventoryService.createItem(
            item.itemId,
            'material',
            'common',
            {
              description: `初始物品: ${item.itemId}`,
              stackable: true,
              maxStack: 99,
            }
          );
          
          const result = inventoryService.addItem(saveId, character.id, itemInstance, item.quantity);
          
          if (result.success) {
            addedItems.push({ itemId: item.itemId, quantity: item.quantity });
          } else {
            failedItems.push(item.itemId);
          }
        } catch (err) {
          failedItems.push(item.itemId);
          gameLog.warn('backend', `添加物品失败: ${item.itemId}`, { error: err });
        }
      }

      // 添加初始金币
      const initialGold = template.initialData?.gold?.[backgroundId] || 100;
      inventoryService.addCurrency(saveId, character.id, 'gold', initialGold);

      gameLog.debug('backend', '背包初始化完成', { 
        saveId, 
        addedItems: addedItems.length,
        failedItems: failedItems.length,
        gold: initialGold 
      });

      return {
        step: InitializationStep.INVENTORY,
        success: true,
        data: { addedItems, failedItems, initialGold },
      };
    } catch (error) {
      return {
        step: InitializationStep.INVENTORY,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private async executeEquipmentStep(
    saveId: string,
    character: Character,
    template: GameTemplate
  ): Promise<StepResult> {
    try {
      // 确保装备服务初始化
      initializeEquipmentService();
      const equipmentService = getEquipmentService();
      const inventoryService = getInventoryService();
      
      // 根据职业获取初始装备
      const classId = typeof character.class === 'string' ? character.class : 'warrior';
      const initialEquipment = template.initialData?.equipment?.[classId] || {};
      
      const equippedItems: Array<{ slot: string; itemId: string }> = [];
      const failedEquips: string[] = [];
      
      // 获取角色属性用于需求检查
      const playerStats = {
        level: 1,
        attributes: {
          strength: character.baseAttributes?.strength || 10,
          dexterity: character.baseAttributes?.dexterity || 10,
          constitution: character.baseAttributes?.constitution || 10,
          intelligence: character.baseAttributes?.intelligence || 10,
          wisdom: character.baseAttributes?.wisdom || 10,
          charisma: character.baseAttributes?.charisma || 10,
        } as Record<string, number>,
        class: classId,
      };
      
      // 装备初始装备
      for (const [slot, itemId] of Object.entries(initialEquipment)) {
        if (!itemId) continue;
        
        try {
          // 创建装备物品
          const item = inventoryService.createItem(
            itemId,
            slot === 'weapon' || slot === 'mainHand' ? 'weapon' : 'armor',
            'common',
            {
              stats: {},
              requirements: {},
            }
          );
          
          // 先添加到背包
          inventoryService.addItem(saveId, character.id, item, 1);
          
          // 然后穿戴
          const characterId = `${saveId}:${character.id}`;
          const result = equipmentService.equipItem(
            characterId,
            itemId,
            slot as 'weapon' | 'head' | 'body' | 'feet' | 'accessory',
            playerStats
          );
          
          if (result.success) {
            equippedItems.push({ slot, itemId });
          } else {
            failedEquips.push(itemId);
          }
        } catch (err) {
          failedEquips.push(itemId);
          gameLog.warn('backend', `装备物品失败: ${itemId}`, { slot, error: err });
        }
      }

      gameLog.debug('backend', '装备初始化完成', { saveId, equippedItems: equippedItems.length, failedEquips: failedEquips.length });

      return {
        step: InitializationStep.EQUIPMENT,
        success: true,
        data: { equippedItems, failedEquips },
      };
    } catch (error) {
      return {
        step: InitializationStep.EQUIPMENT,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private async executeQuestsStep(
    saveId: string,
    character: Character,
    template: GameTemplate
  ): Promise<StepResult> {
    try {
      const questService = getQuestService();
      
      // 添加初始任务
      const initialQuests = template.initialQuests || [];
      const createdQuests: string[] = [];
      const failedQuests: string[] = [];
      
      for (const questDef of initialQuests) {
        try {
          const currencyReward = questDef.rewards?.find(r => r.type === 'currency')?.value;
          const questData = {
            id: questDef.id,
            name: questDef.name,
            description: questDef.description,
            type: questDef.type as 'main' | 'side' | 'hidden' | 'daily',
            status: 'in_progress' as const,
            objectives: questDef.objectives.map((obj, index) => ({
              id: obj.id || `obj_${index}`,
              description: obj.description,
              type: obj.type as 'kill' | 'collect' | 'talk' | 'explore' | 'custom',
              target: obj.target,
              current: 0,
              required: obj.required,
              isCompleted: false,
            })),
            prerequisites: [],
            rewards: {
              experience: questDef.rewards?.find(r => r.type === 'experience')?.value as number || 0,
              currency: typeof currencyReward === 'number' ? { gold: currencyReward } : undefined,
              items: questDef.rewards
                ?.filter(r => r.type === 'item')
                .map(r => ({ itemId: String(r.value), quantity: r.quantity || 1 })) || [],
            },
            characterId: character.id,
            createdAt: Math.floor(Date.now() / 1000),
            updatedAt: Math.floor(Date.now() / 1000),
            log: [{ timestamp: Date.now(), event: '任务开始' }],
          };
          
          const result = await questService.acceptQuest(character.id, questDef.id, questData);
          
          if (result.success) {
            createdQuests.push(questDef.id);
          } else {
            failedQuests.push(questDef.id);
          }
        } catch (err) {
          failedQuests.push(questDef.id);
          gameLog.warn('backend', `创建任务失败: ${questDef.name}`, { error: err });
        }
      }

      gameLog.debug('backend', '任务初始化完成', { saveId, createdQuests: createdQuests.length, failedQuests: failedQuests.length });

      return {
        step: InitializationStep.QUESTS,
        success: true,
        data: { createdQuests, failedQuests },
      };
    } catch (error) {
      return {
        step: InitializationStep.QUESTS,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private async executeMapStep(
    saveId: string,
    _character: Character,
    template: GameTemplate
  ): Promise<StepResult> {
    try {
      const mapService = getMapService();
      
      // 创建初始世界
      const worldConfig = template.worldConfig || {
        name: template.worldSetting?.name || '艾泽拉斯',
        description: template.worldSetting?.description || '一个充满魔法与冒险的世界',
      };
      
      const result = mapService.createWorld(saveId, worldConfig);

      if (!result.success) {
        return {
          step: InitializationStep.MAP,
          success: false,
          error: result.message || '地图创建失败',
        };
      }

      gameLog.debug('backend', '地图初始化完成', { saveId, worldId: result.world.id });

      return {
        step: InitializationStep.MAP,
        success: true,
        data: { world: result.world },
      };
    } catch (error) {
      return {
        step: InitializationStep.MAP,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private async executeNPCsStep(
    saveId: string,
    _character: Character,
    template: GameTemplate
  ): Promise<StepResult> {
    try {
      const npcService = getNPCService();
      
      // 创建初始 NPC
      const initialNPCs = template.initialNPCs || [];
      const createdNPCs: string[] = [];
      const failedNPCs: string[] = [];
      
      for (const npcDef of initialNPCs) {
        try {
          const npcData = {
            id: npcDef.id,
            name: npcDef.name,
            title: npcDef.title || '',
            race: 'human',
            occupation: npcDef.role,
            appearance: {
              description: npcDef.description,
              height: '中等',
              build: '普通',
              hairColor: '黑色',
              eyeColor: '棕色',
              distinguishingFeatures: [],
            },
            personality: {
              traits: [],
              values: [],
              fears: [],
              desires: [],
              quirks: [],
              speech_style: 'normal',
            },
            status: {
              health: 100,
              maxHealth: 100,
              mood: 'neutral' as const,
              currentLocation: template.startingScene?.location || '',
              isAvailable: true,
              isAlive: true,
              schedule: [],
              currentActivity: null,
              statusEffects: [],
              customData: {},
            },
            stats: {
              level: npcDef.stats?.level || 1,
              strength: 10,
              dexterity: 10,
              constitution: 10,
              intelligence: 10,
              wisdom: 10,
              charisma: 10,
              attack: npcDef.stats?.attack || 10,
              defense: npcDef.stats?.defense || 5,
              speed: 100,
              customStats: {},
            },
            flags: {
              isCompanion: false,
              isMerchant: npcDef.services?.includes('shop') || false,
              isQuestGiver: npcDef.role === 'quest_giver',
              isRomanceable: false,
              isEssential: false,
              isHostile: npcDef.role === 'enemy',
              isInvulnerable: false,
              canFollow: false,
              canTrade: npcDef.services?.includes('shop') || false,
              canFight: npcDef.role === 'enemy',
              customFlags: {},
            },
            role: npcDef.role,
            disposition: 'neutral' as const,
            dialogue: {
              greetings: npcDef.dialogue || ['你好，旅行者。'],
              farewells: ['再见。'],
              idle: ['...'],
              combat: [],
              custom: {},
            },
            services: npcDef.services || [],
            inventory: [],
            quests: [],
            relationships: {},
            backstory: '',
            secrets: [],
            customData: npcDef.customData || {},
          };
          
          const npc = npcService.createNPC(saveId, npcData);
          createdNPCs.push(npc.id);
        } catch (err) {
          failedNPCs.push(npcDef.id);
          gameLog.warn('backend', `创建NPC失败`, { error: err });
        }
      }

      gameLog.debug('backend', 'NPC初始化完成', { saveId, createdNPCs: createdNPCs.length, failedNPCs: failedNPCs.length });

      return {
        step: InitializationStep.NPCS,
        success: true,
        data: { npcIds: createdNPCs },
      };
    } catch (error) {
      return {
        step: InitializationStep.NPCS,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private async executeSceneStep(
    _saveId: string,
    character: Character,
    template: GameTemplate
  ): Promise<StepResult> {
    try {
      // 场景初始化 - 使用模板的 startingScene 配置
      const startingLocation = {
        name: template.startingScene?.location || template.worldSetting?.name || '未知地点',
        description: template.startingScene?.description || '',
      };

      gameLog.debug('backend', '场景初始化完成', { 
        location: startingLocation.name,
        characterName: character.name 
      });

      return {
        step: InitializationStep.SCENE,
        success: true,
        data: { 
          location: startingLocation,
          characterName: character.name,
        },
      };
    } catch (error) {
      return {
        step: InitializationStep.SCENE,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}

// ==================== 单例导出 ====================

let initializationServiceInstance: InitializationService | null = null;

export function getInitializationService(): InitializationService {
  if (!initializationServiceInstance) {
    initializationServiceInstance = InitializationService.getInstance();
  }
  return initializationServiceInstance;
}

export function initializeInitializationService(): InitializationService {
  return getInitializationService();
}
