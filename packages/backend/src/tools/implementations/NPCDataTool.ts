import type {
  ToolResponse,
  ToolCallContext,
  NPC,
  UpdateRelationshipRequest,
  AddPartyMemberRequest,
  RemovePartyMemberRequest,
  InteractionRequest,
} from '@ai-rpg/shared';
import { ToolType } from '@ai-rpg/shared';
import { ToolBase } from '../ToolBase';
import { getNPCService } from '../../services/NPCService';
import { gameLog } from '../../services/GameLogService';

export class NPCDataTool extends ToolBase {
  protected readonly toolType: ToolType = ToolType.NPC_DATA;
  protected readonly toolDescription = 'NPC数据工具，负责NPC CRUD、关系管理、队伍管理';
  protected readonly toolVersion = '1.0.0';

  protected registerMethods(): void {
    this.registerMethod('getNPC', '获取NPC', true, { npcId: 'string', characterId: 'string?' }, 'GetNPCResponse');
    this.registerMethod('getNPCsBySaveId', '获取存档所有NPC', true, { saveId: 'string' }, 'GetNPCsResponse');
    this.registerMethod('getNPCsByLocation', '获取地点所有NPC', true, { locationId: 'string', saveId: 'string' }, 'NPC[]');
    this.registerMethod('getRelationship', '获取关系', true, { characterId: 'string', npcId: 'string' }, 'GetRelationshipResponse');
    this.registerMethod('getRelationshipsByCharacterId', '获取角色所有关系', true, { characterId: 'string' }, 'NPCRelationship[]');
    this.registerMethod('getParty', '获取队伍', true, { characterId: 'string' }, 'GetPartyResponse');

    this.registerMethod('createNPC', '创建NPC', false, { saveId: 'string', data: 'Partial<NPC>' }, 'NPC');
    this.registerMethod('updateNPC', '更新NPC', false, { npcId: 'string', updates: 'Partial<NPC>' }, 'boolean');
    this.registerMethod('deleteNPC', '删除NPC', false, { npcId: 'string' }, 'boolean');
    this.registerMethod('updateRelationship', '更新关系', false, { request: 'UpdateRelationshipRequest' }, 'UpdateRelationshipResponse');
    this.registerMethod('interact', '与NPC互动', false, { request: 'InteractionRequest' }, 'InteractionResponse');
    this.registerMethod('addPartyMember', '添加队员', false, { request: 'AddPartyMemberRequest' }, 'AddPartyMemberResponse');
    this.registerMethod('removePartyMember', '移除队员', false, { request: 'RemovePartyMemberRequest' }, 'RemovePartyMemberResponse');
  }

  protected async executeMethod<T>(
    method: string,
    params: Record<string, unknown>,
    context: ToolCallContext
  ): Promise<ToolResponse<T>> {
    const service = getNPCService();

    try {
      await service.initialize();

      let result: unknown;

      switch (method) {
        case 'getNPC':
          result = service.getNPC(
            params.npcId as string,
            params.characterId as string | undefined
          );
          break;

        case 'getNPCsBySaveId':
          result = service.getNPCsBySaveId(params.saveId as string);
          break;

        case 'getNPCsByLocation':
          result = service.getNPCsByLocation(
            params.locationId as string,
            params.saveId as string
          );
          break;

        case 'getRelationship':
          result = service.getRelationship(
            params.characterId as string,
            params.npcId as string
          );
          break;

        case 'getRelationshipsByCharacterId':
          result = service.getRelationshipsByCharacterId(params.characterId as string);
          break;

        case 'getParty':
          result = service.getParty(params.characterId as string);
          break;

        case 'createNPC':
          result = service.createNPC(
            params.saveId as string,
            params.data as Partial<NPC>
          );
          this.logWriteOperation(method, params, context);
          break;

        case 'updateNPC':
          result = service.updateNPC(
            params.npcId as string,
            params.updates as Partial<NPC>
          );
          this.logWriteOperation(method, params, context);
          break;

        case 'deleteNPC':
          result = service.deleteNPC(params.npcId as string);
          this.logWriteOperation(method, params, context);
          break;

        case 'updateRelationship':
          result = service.updateRelationship(params.request as UpdateRelationshipRequest);
          this.logWriteOperation(method, params, context);
          break;

        case 'interact':
          result = service.interact(params.request as InteractionRequest);
          this.logWriteOperation(method, params, context);
          break;

        case 'addPartyMember':
          result = service.addPartyMember(params.request as AddPartyMemberRequest);
          this.logWriteOperation(method, params, context);
          break;

        case 'removePartyMember':
          result = service.removePartyMember(params.request as RemovePartyMemberRequest);
          this.logWriteOperation(method, params, context);
          break;

        default:
          return this.createError<T>('METHOD_NOT_FOUND', `Method '${method}' not found in NPCDataTool`);
      }

      return this.createSuccess<T>(result as T);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      gameLog.error('backend', `NPCDataTool error: ${method}`, {
        error: errorMessage,
        params,
        agentId: context.agentId,
      });
      return this.createError<T>('EXECUTION_ERROR', errorMessage, { method, params });
    }
  }

  private logWriteOperation(method: string, params: Record<string, unknown>, context: ToolCallContext): void {
    gameLog.info('backend', `NPCDataTool write operation: ${method}`, {
      agentId: context.agentId,
      requestId: context.requestId,
      permission: context.permission,
      paramsKeys: Object.keys(params),
    });
  }
}
