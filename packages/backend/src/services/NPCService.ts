/**
 * NPC服务
 * 提供NPC管理的业务逻辑层，处理NPC创建、关系管理、队伍管理等操作
 */

import type {
  NPC,
  NPCRelationship,
  PartyState,
  NPCStatistics,
  InteractionResult,
  InteractionRequest,
  InteractionResponse,
  GetNPCResponse,
  GetNPCsResponse,
  GetRelationshipResponse,
  UpdateRelationshipRequest,
  UpdateRelationshipResponse,
  GetPartyResponse,
  AddPartyMemberRequest,
  AddPartyMemberResponse,
  RemovePartyMemberRequest,
  RemovePartyMemberResponse,
} from '@ai-rpg/shared';
import { getNPCRepository, NPCRepository } from '../models/NPCRepository';
import { gameLog } from './GameLogService';

export class NPCService {
  private static instance: NPCService | null = null;
  private npcRepository: NPCRepository;
  private initialized: boolean = false;

  private constructor() {
    this.npcRepository = getNPCRepository();
  }

  public static getInstance(): NPCService {
    if (!NPCService.instance) {
      NPCService.instance = new NPCService();
    }
    return NPCService.instance;
  }

  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    getNPCRepository();
    this.initialized = true;
    gameLog.info('system', 'NPCService initialized');
  }

  // ==================== NPC CRUD ====================

  public createNPC(saveId: string, data: Partial<NPC>): NPC {
    const entity = this.npcRepository.createNPC(saveId, data);
    return this.npcRepository.toNPC(entity);
  }

  public getNPC(npcId: string, characterId?: string): GetNPCResponse {
    try {
      const npc = this.npcRepository.getNPC(npcId);

      if (!npc) {
        return {
          success: false,
          npc: null as unknown as NPC,
          relationship: null,
        };
      }

      let relationship: NPCRelationship | null = null;
      if (characterId) {
        relationship = this.npcRepository.getRelationship(characterId, npcId);
      }

      return {
        success: true,
        npc,
        relationship,
      };
    } catch (error) {
      gameLog.error('system', 'Error getting NPC', { error });
      return {
        success: false,
        npc: null as unknown as NPC,
        relationship: null,
      };
    }
  }

  public getNPCsBySaveId(saveId: string): GetNPCsResponse {
    try {
      const npcs = this.npcRepository.getNPCsBySaveId(saveId);
      const statistics = this.npcRepository.getStatistics(saveId);

      return {
        success: true,
        npcs,
        statistics,
      };
    } catch (error) {
      gameLog.error('system', 'Error getting NPCs', { error });
      return {
        success: false,
        npcs: [],
        statistics: this.getEmptyStatistics(),
      };
    }
  }

  public getNPCsByLocation(locationId: string, saveId: string): NPC[] {
    return this.npcRepository.getNPCsByLocation(locationId, saveId);
  }

  public updateNPC(npcId: string, updates: Partial<NPC>): boolean {
    return this.npcRepository.updateNPC(npcId, updates);
  }

  public deleteNPC(npcId: string): boolean {
    return this.npcRepository.deleteNPC(npcId);
  }

  // ==================== Relationship Management ====================

  public getRelationship(characterId: string, npcId: string): GetRelationshipResponse {
    try {
      const relationship = this.npcRepository.getRelationship(characterId, npcId);

      if (!relationship) {
        const npc = this.npcRepository.getNPC(npcId);
        if (npc) {
          const newRelationship = this.initializeRelationship(characterId, npcId);
          return {
            success: true,
            relationship: newRelationship,
          };
        }

        return {
          success: false,
          relationship: null as unknown as NPCRelationship,
        };
      }

      return {
        success: true,
        relationship,
      };
    } catch (error) {
      gameLog.error('system', 'Error getting relationship', { error });
      return {
        success: false,
        relationship: null as unknown as NPCRelationship,
      };
    }
  }

  public updateRelationship(request: UpdateRelationshipRequest): UpdateRelationshipResponse {
    try {
      const { characterId, npcId, ...changes } = request;

      let relationship = this.npcRepository.getRelationship(characterId, npcId);

      if (!relationship) {
        relationship = this.initializeRelationship(characterId, npcId);
      }

      const updates: Partial<NPCRelationship> = {};

      if (changes.type !== undefined) {
        updates.type = changes.type;
      }

      if (changes.levelChange !== undefined) {
        updates.level = Math.max(-100, Math.min(100, relationship.level + changes.levelChange));
      }

      if (changes.trustChange !== undefined) {
        updates.trustLevel = Math.max(-100, Math.min(100, relationship.trustLevel + changes.trustChange));
      }

      if (changes.respectChange !== undefined) {
        updates.respectLevel = Math.max(-100, Math.min(100, relationship.respectLevel + changes.respectChange));
      }

      if (changes.affectionChange !== undefined) {
        updates.affectionLevel = Math.max(-100, Math.min(100, relationship.affectionLevel + changes.affectionChange));
      }

      if (changes.fearChange !== undefined) {
        updates.fearLevel = Math.max(-100, Math.min(100, relationship.fearLevel + changes.fearChange));
      }

      if (changes.notes !== undefined) {
        updates.notes = [...relationship.notes, changes.notes];
      }

      updates.interactionCount = relationship.interactionCount + 1;
      updates.lastInteractionAt = Math.floor(Date.now() / 1000);

      this.npcRepository.updateRelationship(characterId, npcId, updates);

      const updatedRelationship = this.npcRepository.getRelationship(characterId, npcId)!;

      this.updateNPCDisposition(npcId, updatedRelationship);

      return {
        success: true,
        relationship: updatedRelationship,
        message: '关系更新成功',
      };
    } catch (error) {
      gameLog.error('system', 'Error updating relationship', { error });
      return {
        success: false,
        relationship: null as unknown as NPCRelationship,
        message: error instanceof Error ? error.message : '更新关系失败',
      };
    }
  }

  public getRelationshipsByCharacterId(characterId: string): NPCRelationship[] {
    return this.npcRepository.getRelationshipsByCharacterId(characterId);
  }

  // ==================== Interaction ====================

  public interact(request: InteractionRequest): InteractionResponse {
    try {
      const { characterId, npcId, type, data } = request;

      const npc = this.npcRepository.getNPC(npcId);
      if (!npc) {
        return {
          success: false,
          result: {
            success: false,
            relationship: null as unknown as NPCRelationship,
            dialogueResponse: '',
            effects: {
              relationshipChange: 0,
              trustChange: 0,
              itemsGiven: [],
              itemsReceived: [],
              questsStarted: [],
              questsCompleted: [],
              customEffects: {},
            },
            message: 'NPC不存在',
          },
        };
      }

      let relationship = this.npcRepository.getRelationship(characterId, npcId);
      if (!relationship) {
        relationship = this.initializeRelationship(characterId, npcId);
      }

      const effects: InteractionResult['effects'] = {
        relationshipChange: 0,
        trustChange: 0,
        itemsGiven: [],
        itemsReceived: [],
        questsStarted: [],
        questsCompleted: [],
        customEffects: {},
      };

      let dialogueResponse = '';
      let relationshipChange = 0;
      let trustChange = 0;

      switch (type) {
        case 'talk':
          dialogueResponse = this.generateDialogueResponse(npc, relationship, 'greetings');
          relationshipChange = 1;
          trustChange = 1;
          break;

        case 'trade':
          if (npc.flags.isMerchant) {
            dialogueResponse = '欢迎光临！看看有什么需要的？';
            relationshipChange = 0;
          } else {
            dialogueResponse = '抱歉，我不做交易。';
          }
          break;

        case 'gift':
          if (data?.itemId) {
            dialogueResponse = '谢谢你的礼物！';
            relationshipChange = 5;
            trustChange = 3;
            effects.itemsGiven = [data.itemId as string];
          }
          break;

        case 'quest':
          if (npc.flags.isQuestGiver && npc.quests.length > 0) {
            const availableQuest = npc.quests[0];
            dialogueResponse = `我有一个任务给你：${availableQuest}`;
            relationshipChange = 2;
            effects.questsStarted = [availableQuest];
          } else {
            dialogueResponse = '我现在没有任务给你。';
          }
          break;

        case 'recruit':
          if (npc.flags.canFollow && relationship.level >= 50) {
            const added = this.addPartyMemberInternal(characterId, npcId);
            if (added) {
              dialogueResponse = '好的，我愿意加入你的队伍！';
              relationshipChange = 10;
              trustChange = 5;
            } else {
              dialogueResponse = '你的队伍已满。';
            }
          } else if (!npc.flags.canFollow) {
            dialogueResponse = '抱歉，我不能跟随你。';
          } else {
            dialogueResponse = '我们还不够熟悉，抱歉。';
          }
          break;

        case 'dismiss':
          if (this.npcRepository.isInParty(characterId, npcId)) {
            this.npcRepository.removeFromParty(characterId, npcId);
            dialogueResponse = '好的，我会在这里等你。';
            relationshipChange = -5;
          } else {
            dialogueResponse = '我没有加入你的队伍。';
          }
          break;

        case 'attack':
          dialogueResponse = '你竟敢攻击我！';
          relationshipChange = -30;
          trustChange = -20;
          break;

        default:
          dialogueResponse = '...';
      }

      effects.relationshipChange = relationshipChange;
      effects.trustChange = trustChange;

      const updateResult = this.updateRelationship({
        characterId,
        npcId,
        levelChange: relationshipChange,
        trustChange,
      });

      this.npcRepository.incrementInteraction(characterId, npcId);

      const result: InteractionResult = {
        success: true,
        relationship: updateResult.relationship,
        dialogueResponse,
        effects,
        message: `与 ${npc.name} 互动成功`,
      };

      return {
        success: true,
        result,
      };
    } catch (error) {
      gameLog.error('system', 'Error interacting with NPC', { error });
      return {
        success: false,
        result: {
          success: false,
          relationship: null as unknown as NPCRelationship,
          dialogueResponse: '',
          effects: {
            relationshipChange: 0,
            trustChange: 0,
            itemsGiven: [],
            itemsReceived: [],
            questsStarted: [],
            questsCompleted: [],
            customEffects: {},
          },
          message: error instanceof Error ? error.message : '互动失败',
        },
      };
    }
  }

  // ==================== Party Management ====================

  public getParty(characterId: string): GetPartyResponse {
    try {
      const members = this.npcRepository.getPartyMembers(characterId);
      const npcs: NPC[] = [];

      for (const member of members) {
        const npc = this.npcRepository.getNPC(member.npcId);
        if (npc) {
          npcs.push(npc);
        }
      }

      const party: PartyState = {
        characterId,
        members,
        maxSize: 4,
        formation: 'line',
        customData: {},
      };

      return {
        success: true,
        party,
        npcs,
      };
    } catch (error) {
      gameLog.error('system', 'Error getting party', { error });
      return {
        success: false,
        party: {
          characterId,
          members: [],
          maxSize: 4,
          formation: 'line',
          customData: {},
        },
        npcs: [],
      };
    }
  }

  public addPartyMember(request: AddPartyMemberRequest): AddPartyMemberResponse {
    try {
      const { characterId, npcId, role } = request;

      const npc = this.npcRepository.getNPC(npcId);
      if (!npc) {
        return {
          success: false,
          party: {
            characterId,
            members: [],
            maxSize: 4,
            formation: 'line',
            customData: {},
          },
          npc: null as unknown as NPC,
          message: 'NPC不存在',
        };
      }

      if (!npc.flags.canFollow) {
        return {
          success: false,
          party: {
            characterId,
            members: [],
            maxSize: 4,
            formation: 'line',
            customData: {},
          },
          npc,
          message: '该NPC无法加入队伍',
        };
      }

      const relationship = this.npcRepository.getRelationship(characterId, npcId);
      if (!relationship || relationship.level < 50) {
        return {
          success: false,
          party: {
            characterId,
            members: [],
            maxSize: 4,
            formation: 'line',
            customData: {},
          },
          npc,
          message: '好感度不足，无法招募',
        };
      }

      const currentSize = this.npcRepository.getPartySize(characterId);
      if (currentSize >= 4) {
        return {
          success: false,
          party: {
            characterId,
            members: this.npcRepository.getPartyMembers(characterId),
            maxSize: 4,
            formation: 'line',
            customData: {},
          },
          npc,
          message: '队伍已满',
        };
      }

      const added = this.addPartyMemberInternal(characterId, npcId, role);
      if (!added) {
        return {
          success: false,
          party: {
            characterId,
            members: this.npcRepository.getPartyMembers(characterId),
            maxSize: 4,
            formation: 'line',
            customData: {},
          },
          npc,
          message: '添加队员失败',
        };
      }

      this.npcRepository.updateNPC(npcId, {
        flags: { ...npc.flags, isCompanion: true },
      });

      const party = this.getParty(characterId);

      return {
        success: true,
        party: party.party,
        npc,
        message: `${npc.name} 加入了队伍`,
      };
    } catch (error) {
      gameLog.error('system', 'Error adding party member', { error });
      return {
        success: false,
        party: {
          characterId: request.characterId,
          members: [],
          maxSize: 4,
          formation: 'line',
          customData: {},
        },
        npc: null as unknown as NPC,
        message: error instanceof Error ? error.message : '添加队员失败',
      };
    }
  }

  public removePartyMember(request: RemovePartyMemberRequest): RemovePartyMemberResponse {
    try {
      const { characterId, npcId } = request;

      const npc = this.npcRepository.getNPC(npcId);
      if (!npc) {
        return {
          success: false,
          party: {
            characterId,
            members: [],
            maxSize: 4,
            formation: 'line',
            customData: {},
          },
          message: 'NPC不存在',
        };
      }

      const removed = this.npcRepository.removeFromParty(characterId, npcId);
      if (!removed) {
        return {
          success: false,
          party: {
            characterId,
            members: this.npcRepository.getPartyMembers(characterId),
            maxSize: 4,
            formation: 'line',
            customData: {},
          },
          message: '该NPC不在队伍中',
        };
      }

      this.npcRepository.updateNPC(npcId, {
        flags: { ...npc.flags, isCompanion: false },
      });

      const party = this.getParty(characterId);

      return {
        success: true,
        party: party.party,
        message: `${npc.name} 离开了队伍`,
      };
    } catch (error) {
      gameLog.error('system', 'Error removing party member', { error });
      return {
        success: false,
        party: {
          characterId: request.characterId,
          members: [],
          maxSize: 4,
          formation: 'line',
          customData: {},
        },
        message: error instanceof Error ? error.message : '移除队员失败',
      };
    }
  }

  // ==================== Helper Methods ====================

  private initializeRelationship(characterId: string, npcId: string): NPCRelationship {
    const entity = this.npcRepository.createRelationship(characterId, npcId, {
      type: 'neutral',
      level: 0,
      trustLevel: 0,
      respectLevel: 0,
      affectionLevel: 0,
      fearLevel: 0,
      interactionCount: 0,
      firstMetAt: Math.floor(Date.now() / 1000),
      flags: {
        met: true,
        befriended: false,
        romanced: false,
        betrayed: false,
        killed: false,
        custom: {},
      },
      notes: [],
    });

    return this.npcRepository.toRelationship(entity);
  }

  private addPartyMemberInternal(characterId: string, npcId: string, role: string = 'support'): boolean {
    try {
      this.npcRepository.addToParty(characterId, npcId, role);
      return true;
    } catch {
      return false;
    }
  }

  private generateDialogueResponse(npc: NPC, relationship: NPCRelationship, type: string): string {
    const dialogues = npc.dialogue[type as keyof typeof npc.dialogue];
    if (Array.isArray(dialogues) && dialogues.length > 0) {
      const index = Math.floor(Math.random() * dialogues.length);
      return dialogues[index];
    }

    if (relationship.level > 50) {
      return `${npc.name} 友好地向你打招呼。`;
    } else if (relationship.level < -50) {
      return `${npc.name} 警惕地看着你。`;
    }
    return `${npc.name} 点了点头。`;
  }

  private updateNPCDisposition(npcId: string, relationship: NPCRelationship): void {
    const npc = this.npcRepository.getNPC(npcId);
    if (!npc) return;

    let newDisposition: NPC['disposition'] = 'neutral';

    if (relationship.level >= 50) {
      newDisposition = 'helpful';
    } else if (relationship.level <= -50) {
      newDisposition = 'hostile';
    } else if (relationship.level <= -20) {
      newDisposition = 'unfriendly';
    }

    if (newDisposition !== npc.disposition) {
      this.npcRepository.updateNPC(npcId, { disposition: newDisposition });
    }
  }

  private getEmptyStatistics(): NPCStatistics {
    return {
      total: 0,
      byRole: {
        merchant: 0,
        quest_giver: 0,
        enemy: 0,
        ally: 0,
        neutral: 0,
        romance: 0,
        companion: 0,
        custom: 0,
      },
      byDisposition: {
        helpful: 0,
        neutral: 0,
        unfriendly: 0,
        hostile: 0,
      },
      aliveCount: 0,
      deadCount: 0,
      companionsCount: 0,
      merchantsCount: 0,
      questGiversCount: 0,
    };
  }
}

let npcServiceInstance: NPCService | null = null;

export function getNPCService(): NPCService {
  if (!npcServiceInstance) {
    npcServiceInstance = NPCService.getInstance();
  }
  return npcServiceInstance;
}

export async function initializeNPCService(): Promise<NPCService> {
  const service = getNPCService();
  await service.initialize();
  return service;
}
