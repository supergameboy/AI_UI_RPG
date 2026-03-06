import type {
  ToolResponse,
  ToolCallContext,
  World,
  Region,
  Location,
  CharacterLocation,
} from '@ai-rpg/shared';
import { ToolType } from '@ai-rpg/shared';
import { ToolBase } from '../ToolBase';
import { getMapService } from '../../services/MapService';
import { gameLog } from '../../services/GameLogService';

export class MapDataTool extends ToolBase {
  protected readonly toolType: ToolType = ToolType.MAP_DATA;
  protected readonly toolDescription = '地图管理工具，负责世界、区域、地点的管理以及角色移动和探索';
  protected readonly toolVersion = '1.0.0';

  protected registerMethods(): void {
    this.registerMethod('getWorld', '获取世界', true, { worldId: 'string' }, 'World');
    this.registerMethod('getWorldsBySaveId', '获取存档所有世界', true, { saveId: 'string' }, 'World[]');
    this.registerMethod('getRegion', '获取区域', true, { regionId: 'string' }, 'Region');
    this.registerMethod('getRegionsByWorldId', '获取世界所有区域', true, { worldId: 'string' }, 'Region[]');
    this.registerMethod('getLocation', '获取地点', true, { locationId: 'string' }, 'Location');
    this.registerMethod('getLocationsByRegionId', '获取区域所有地点', true, { regionId: 'string' }, 'Location[]');
    this.registerMethod('getCharacterLocation', '获取角色当前位置', true, { characterId: 'string' }, 'CharacterLocation');
    this.registerMethod('getMapState', '获取地图状态', true, { characterId: 'string' }, 'GetMapStateResponse');
    this.registerMethod('getAvailableConnections', '获取可用连接', true, { characterId: 'string' }, 'GetConnectionsResponse');
    this.registerMethod('getLocationDetails', '获取地点详情', true, { locationId: 'string' }, 'GetLocationResponse');

    this.registerMethod('createWorld', '创建世界', false, { saveId: 'string', data: 'Partial<World>' }, 'CreateMapResponse');
    this.registerMethod('createRegion', '创建区域', false, { worldId: 'string', data: 'Partial<Region>' }, 'Region');
    this.registerMethod('createLocation', '创建地点', false, { regionId: 'string', data: 'Partial<Location>' }, 'Location');
    this.registerMethod('updateLocation', '更新地点', false, { locationId: 'string', updates: 'Partial<Location>' }, 'boolean');
    this.registerMethod('setCharacterLocation', '设置角色位置', false, { characterId: 'string', location: 'CharacterLocation' }, 'boolean');
    this.registerMethod('moveToLocation', '移动到地点', false, { characterId: 'string', targetLocationId: 'string', method: 'string?' }, 'MoveResponse');
    this.registerMethod('exploreArea', '探索区域', false, { characterId: 'string', locationId: 'string?', depth: 'string?' }, 'ExploreResponse');
    this.registerMethod('createConnection', '创建连接', false, { fromLocationId: 'string', toLocationId: 'string', type: 'string?', travelTime: 'number?', bidirectional: 'boolean?' }, 'LocationConnection');
    this.registerMethod('initializeWorld', '初始化世界', false, { saveId: 'string', template: 'object' }, 'World');
  }

  protected async executeMethod<T>(
    method: string,
    params: Record<string, unknown>,
    context: ToolCallContext
  ): Promise<ToolResponse<T>> {
    const service = getMapService();

    try {
      let result: unknown;

      switch (method) {
        case 'getWorld':
          result = service.getWorld(params.worldId as string);
          if (!result) {
            return this.createError<T>('WORLD_NOT_FOUND', `World not found: ${params.worldId}`);
          }
          break;

        case 'getWorldsBySaveId':
          result = service.getWorldsBySaveId(params.saveId as string);
          break;

        case 'getRegion':
          result = service.getRegion(params.regionId as string);
          if (!result) {
            return this.createError<T>('REGION_NOT_FOUND', `Region not found: ${params.regionId}`);
          }
          break;

        case 'getRegionsByWorldId':
          result = service.getRegionsByWorldId(params.worldId as string);
          break;

        case 'getLocation':
          result = service.getLocation(params.locationId as string);
          if (!result) {
            return this.createError<T>('LOCATION_NOT_FOUND', `Location not found: ${params.locationId}`);
          }
          break;

        case 'getLocationsByRegionId':
          result = service.getLocationsByRegionId(params.regionId as string);
          break;

        case 'getCharacterLocation':
          result = service.getCharacterLocation(params.characterId as string);
          break;

        case 'getMapState':
          result = service.getMapState(params.characterId as string);
          break;

        case 'getAvailableConnections':
          result = service.getAvailableConnections(params.characterId as string);
          break;

        case 'getLocationDetails':
          result = service.getLocationDetails(params.locationId as string);
          break;

        case 'createWorld':
          result = service.createWorld(params.saveId as string, params.data as Partial<World>);
          this.logWriteOperation(method, params, context);
          break;

        case 'createRegion':
          result = service.createRegion(params.worldId as string, params.data as Partial<Region>);
          this.logWriteOperation(method, params, context);
          break;

        case 'createLocation':
          result = service.createLocation(params.regionId as string, params.data as Partial<Location>);
          this.logWriteOperation(method, params, context);
          break;

        case 'updateLocation':
          result = service.updateLocation(params.locationId as string, params.updates as Partial<Location>);
          this.logWriteOperation(method, params, context);
          break;

        case 'setCharacterLocation':
          result = service.setCharacterLocation(params.characterId as string, params.location as CharacterLocation);
          this.logWriteOperation(method, params, context);
          break;

        case 'moveToLocation':
          result = service.moveToLocation(
            params.characterId as string,
            params.targetLocationId as string,
            params.method as string | undefined
          );
          this.logWriteOperation(method, params, context);
          break;

        case 'exploreArea':
          result = service.exploreArea(
            params.characterId as string,
            params.locationId as string | undefined,
            params.depth as string | undefined
          );
          this.logWriteOperation(method, params, context);
          break;

        case 'createConnection':
          result = service.createConnection(
            params.fromLocationId as string,
            params.toLocationId as string,
            params.type as string | undefined,
            params.travelTime as number | undefined,
            params.bidirectional as boolean | undefined
          );
          this.logWriteOperation(method, params, context);
          break;

        case 'initializeWorld':
          result = service.initializeWorld(
            params.saveId as string,
            params.template as { name: string; description?: string }
          );
          this.logWriteOperation(method, params, context);
          break;

        default:
          return this.createError<T>('METHOD_NOT_FOUND', `Method '${method}' not found in MapDataTool`);
      }

      return this.createSuccess<T>(result as T);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      gameLog.error('backend', `MapDataTool error: ${method}`, {
        error: errorMessage,
        params,
        agentId: context.agentId,
      });
      return this.createError<T>('EXECUTION_ERROR', errorMessage, { method, params });
    }
  }

  private logWriteOperation(method: string, params: Record<string, unknown>, context: ToolCallContext): void {
    gameLog.info('backend', `MapDataTool write operation: ${method}`, {
      agentId: context.agentId,
      requestId: context.requestId,
      permission: context.permission,
      paramsKeys: Object.keys(params),
    });
  }
}
