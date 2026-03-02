/**
 * 地图服务
 * 提供地图管理的业务逻辑层，处理世界创建、移动、探索等操作
 */

import type {
  World,
  Region,
  Location,
  CharacterLocation,
  MapState,
  MoveResult,
  ExploreResult,
  MapStatistics,
  LocationConnection,
  LocationEvent,
  CreateMapResponse,
  GetMapStateResponse,
  MoveResponse,
  ExploreResponse,
  GetConnectionsResponse,
  GetLocationResponse,
} from '@ai-rpg/shared';
import { getMapRepository, MapRepository } from '../models/MapRepository';

export class MapService {
  private static instance: MapService | null = null;
  private mapRepository: MapRepository;
  private initialized: boolean = false;

  private constructor() {
    this.mapRepository = getMapRepository();
  }

  public static getInstance(): MapService {
    if (!MapService.instance) {
      MapService.instance = new MapService();
    }
    return MapService.instance;
  }

  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    getMapRepository();
    this.initialized = true;
    console.log('[MapService] Initialized');
  }

  // ==================== World Management ====================

  public createWorld(saveId: string, data: Partial<World>): CreateMapResponse {
    try {
      const worldEntity = this.mapRepository.createWorld(saveId, data);
      const world = this.mapRepository.toWorld(worldEntity);

      if (data.regions && data.regions.length > 0) {
        for (const regionData of data.regions) {
          this.createRegion(world.id, regionData);
        }
      }

      return {
        success: true,
        world: this.mapRepository.getWorld(world.id)!,
        message: `世界 "${world.name}" 创建成功`,
      };
    } catch (error) {
      console.error('[MapService] Error creating world:', error);
      return {
        success: false,
        world: null as unknown as World,
        message: error instanceof Error ? error.message : '创建世界失败',
      };
    }
  }

  public getWorld(worldId: string): World | null {
    return this.mapRepository.getWorld(worldId);
  }

  public getWorldsBySaveId(saveId: string): World[] {
    return this.mapRepository.getWorldsBySaveId(saveId);
  }

  // ==================== Region Management ====================

  public createRegion(worldId: string, data: Partial<Region>): Region {
    const regionEntity = this.mapRepository.createRegion(worldId, data);
    return this.mapRepository.toRegion(regionEntity);
  }

  public getRegion(regionId: string): Region | null {
    return this.mapRepository.getRegion(regionId);
  }

  public getRegionsByWorldId(worldId: string): Region[] {
    return this.mapRepository.getRegionsByWorldId(worldId);
  }

  // ==================== Location Management ====================

  public createLocation(regionId: string, data: Partial<Location>): Location {
    const locationEntity = this.mapRepository.createLocation(regionId, data);
    return this.mapRepository.toLocation(locationEntity);
  }

  public getLocation(locationId: string): Location | null {
    return this.mapRepository.getLocation(locationId);
  }

  public getLocationsByRegionId(regionId: string): Location[] {
    return this.mapRepository.getLocationsByRegionId(regionId);
  }

  public updateLocation(locationId: string, updates: Partial<Location>): boolean {
    return this.mapRepository.updateLocation(locationId, updates);
  }

  // ==================== Character Location ====================

  public getCharacterLocation(characterId: string): CharacterLocation | null {
    return this.mapRepository.getCharacterLocation(characterId);
  }

  public setCharacterLocation(characterId: string, location: CharacterLocation): boolean {
    return this.mapRepository.setCharacterLocation(characterId, location);
  }

  // ==================== Movement ====================

  public moveToLocation(characterId: string, targetLocationId: string, method: string = 'walk'): MoveResponse {
    try {
      const currentLocation = this.mapRepository.getCharacterLocation(characterId);
      const targetLocation = this.mapRepository.getLocation(targetLocationId);

      if (!targetLocation) {
        return {
          success: false,
          result: {
            success: false,
            fromLocation: null,
            toLocation: null,
            travelTime: 0,
            triggeredEvents: [],
            encounters: [],
            message: '目标地点不存在',
          },
        };
      }

      if (!targetLocation.isAccessible) {
        return {
          success: false,
          result: {
            success: false,
            fromLocation: null,
            toLocation: targetLocation,
            travelTime: 0,
            triggeredEvents: [],
            encounters: [],
            message: '目标地点不可访问',
          },
        };
      }

      let fromLocation: Location | null = null;
      let travelTime = 0;
      let connections: LocationConnection[] = [];

      if (currentLocation) {
        fromLocation = this.mapRepository.getLocation(currentLocation.locationId);

        if (fromLocation && method === 'walk') {
          connections = this.mapRepository.getConnections(currentLocation.locationId);
          const hasConnection = connections.some(
            c =>
              (c.fromLocationId === currentLocation.locationId && c.toLocationId === targetLocationId) ||
              (c.bidirectional && c.fromLocationId === targetLocationId && c.toLocationId === currentLocation.locationId)
          );

          if (!hasConnection && currentLocation.locationId !== targetLocationId) {
            return {
              success: false,
              result: {
                success: false,
                fromLocation,
                toLocation: targetLocation,
                travelTime: 0,
                triggeredEvents: [],
                encounters: [],
                message: '无法到达目标地点，没有可用路径',
              },
            };
          }

          const connection = connections.find(
            c =>
              (c.fromLocationId === currentLocation.locationId && c.toLocationId === targetLocationId) ||
              (c.bidirectional && c.fromLocationId === targetLocationId && c.toLocationId === currentLocation.locationId)
          );
          travelTime = connection?.travelTime || this.calculateTravelTime(fromLocation, targetLocation);
        }
      }

      const triggeredEvents = this.triggerLocationEvents(targetLocation, 'on_enter');

      const region = this.mapRepository.getRegion(targetLocation.regionId);
      const newCharacterLocation: CharacterLocation = {
        characterId,
        worldId: region?.worldId || currentLocation?.worldId || '',
        regionId: targetLocation.regionId,
        locationId: targetLocationId,
        previousLocations: currentLocation
          ? [
              ...(currentLocation.previousLocations || []),
              {
                worldId: currentLocation.worldId,
                regionId: currentLocation.regionId,
                locationId: currentLocation.locationId,
                leftAt: Math.floor(Date.now() / 1000),
              },
            ].slice(-10)
          : [],
        enteredAt: Math.floor(Date.now() / 1000),
        updatedAt: Math.floor(Date.now() / 1000),
      };

      this.mapRepository.setCharacterLocation(characterId, newCharacterLocation);
      this.mapRepository.addExploredArea(characterId, targetLocationId);

      if (!targetLocation.isDiscovered) {
        this.mapRepository.updateLocation(targetLocationId, { isDiscovered: true });
      }

      const result: MoveResult = {
        success: true,
        fromLocation,
        toLocation: targetLocation,
        travelTime,
        triggeredEvents,
        encounters: [],
        message: fromLocation
          ? `从 ${fromLocation.name} 移动到 ${targetLocation.name}，耗时 ${travelTime} 分钟`
          : `已到达 ${targetLocation.name}`,
      };

      return {
        success: true,
        result,
      };
    } catch (error) {
      console.error('[MapService] Error moving to location:', error);
      return {
        success: false,
        result: {
          success: false,
          fromLocation: null,
          toLocation: null,
          travelTime: 0,
          triggeredEvents: [],
          encounters: [],
          message: error instanceof Error ? error.message : '移动失败',
        },
      };
    }
  }

  // ==================== Exploration ====================

  public exploreArea(characterId: string, locationId?: string, _depth: string = 'normal'): ExploreResponse {
    try {
      const currentLocation = this.mapRepository.getCharacterLocation(characterId);
      const targetLocationId = locationId || currentLocation?.locationId;

      if (!targetLocationId) {
        return {
          success: false,
          result: {
            success: false,
            location: null as unknown as Location,
            discoveredFeatures: [],
            discoveredEvents: [],
            discoveredItems: [],
            discoveredNpcs: [],
            message: '没有当前位置',
          },
        };
      }

      const location = this.mapRepository.getLocation(targetLocationId);
      if (!location) {
        return {
          success: false,
          result: {
            success: false,
            location: null as unknown as Location,
            discoveredFeatures: [],
            discoveredEvents: [],
            discoveredItems: [],
            discoveredNpcs: [],
            message: '地点不存在',
          },
        };
      }

      const discoveredFeatures = location.features.filter(f => !f.interactable || Math.random() > 0.5);
      const discoveredEvents = this.triggerLocationEvents(location, 'on_explore');
      const discoveredItems = location.items.slice(0, Math.ceil(location.items.length * Math.random()));
      const discoveredNpcs = location.npcs.slice(0, Math.ceil(location.npcs.length * Math.random()));

      this.mapRepository.addExploredArea(characterId, targetLocationId);

      const result: ExploreResult = {
        success: true,
        location,
        discoveredFeatures,
        discoveredEvents,
        discoveredItems,
        discoveredNpcs,
        message: `探索 ${location.name} 完成，发现了 ${discoveredFeatures.length} 个特征`,
      };

      return {
        success: true,
        result,
      };
    } catch (error) {
      console.error('[MapService] Error exploring area:', error);
      return {
        success: false,
        result: {
          success: false,
          location: null as unknown as Location,
          discoveredFeatures: [],
          discoveredEvents: [],
          discoveredItems: [],
          discoveredNpcs: [],
          message: error instanceof Error ? error.message : '探索失败',
        },
      };
    }
  }

  // ==================== Connections ====================

  public getAvailableConnections(characterId: string): GetConnectionsResponse {
    try {
      const currentLocation = this.mapRepository.getCharacterLocation(characterId);
      if (!currentLocation) {
        return {
          success: false,
          connections: [],
          locations: [],
        };
      }

      const connections = this.mapRepository.getDiscoveredConnections(characterId, currentLocation.locationId);
      const locationIds = new Set<string>();
      connections.forEach(c => {
        locationIds.add(c.fromLocationId);
        locationIds.add(c.toLocationId);
      });

      const locations: Location[] = [];
      for (const id of locationIds) {
        const loc = this.mapRepository.getLocation(id);
        if (loc) {
          locations.push(loc);
        }
      }

      return {
        success: true,
        connections,
        locations,
      };
    } catch (error) {
      console.error('[MapService] Error getting connections:', error);
      return {
        success: false,
        connections: [],
        locations: [],
      };
    }
  }

  public createConnection(
    fromLocationId: string,
    toLocationId: string,
    type: string = 'road',
    travelTime: number = 60,
    bidirectional: boolean = true
  ): LocationConnection {
    const entity = this.mapRepository.createConnection({
      fromLocationId,
      toLocationId,
      type: type as LocationConnection['type'],
      travelTime,
      bidirectional,
      discovered: true,
    });
    return this.mapRepository.toLocationConnection(entity);
  }

  // ==================== Map State ====================

  public getMapState(characterId: string): GetMapStateResponse {
    try {
      const characterLocation = this.mapRepository.getCharacterLocation(characterId);

      let currentWorld: World | null = null;
      let currentRegion: Region | null = null;
      let currentLocation: Location | null = null;

      if (characterLocation) {
        currentWorld = this.mapRepository.getWorld(characterLocation.worldId);
        currentRegion = this.mapRepository.getRegion(characterLocation.regionId);
        currentLocation = this.mapRepository.getLocation(characterLocation.locationId);
      }

      const exploredAreas = this.mapRepository.getExploredAreas(characterId);
      const availableConnections = currentLocation
        ? this.mapRepository.getConnections(currentLocation.id)
        : [];

      const visitedLocations = exploredAreas.map(e => e.locationId);
      const discoveredLocations = exploredAreas
        .filter(e => this.mapRepository.getLocation(e.locationId)?.isDiscovered)
        .map(e => e.locationId);

      const mapState: MapState = {
        currentWorld,
        currentRegion,
        currentLocation,
        exploredAreas,
        availableConnections: availableConnections.map(c => this.mapRepository.toLocationConnection(c as unknown as import('../models/MapRepository').LocationConnectionEntity)),
        visitedLocations,
        discoveredLocations,
        lastUpdated: Math.floor(Date.now() / 1000),
      };

      const statistics: MapStatistics = currentWorld
        ? this.mapRepository.getStatistics(currentWorld.id)
        : this.getEmptyStatistics();

      return {
        success: true,
        mapState,
        statistics,
      };
    } catch (error) {
      console.error('[MapService] Error getting map state:', error);
      return {
        success: false,
        mapState: {
          currentWorld: null,
          currentRegion: null,
          currentLocation: null,
          exploredAreas: [],
          availableConnections: [],
          visitedLocations: [],
          discoveredLocations: [],
          lastUpdated: 0,
        },
        statistics: this.getEmptyStatistics(),
      };
    }
  }

  public getLocationDetails(locationId: string): GetLocationResponse {
    try {
      const location = this.mapRepository.getLocation(locationId);

      if (!location) {
        return {
          success: false,
          location: null as unknown as Location,
          npcs: [],
          items: [],
        };
      }

      return {
        success: true,
        location,
        npcs: [],
        items: [],
      };
    } catch (error) {
      console.error('[MapService] Error getting location details:', error);
      return {
        success: false,
        location: null as unknown as Location,
        npcs: [],
        items: [],
      };
    }
  }

  // ==================== Helper Methods ====================

  private calculateTravelTime(from: Location, to: Location): number {
    const baseTime = 60;
    const dangerModifier = (from.dangerLevel + to.dangerLevel) * 10;
    return baseTime + dangerModifier;
  }

  private triggerLocationEvents(location: Location, trigger: LocationEvent['trigger']): LocationEvent[] {
    return location.events.filter(event => {
      if (event.trigger !== trigger) return false;
      if (event.oneTime && event.triggered) return false;
      if (Math.random() > event.probability) return false;
      return true;
    });
  }

  private getEmptyStatistics(): MapStatistics {
    return {
      totalWorlds: 0,
      totalRegions: 0,
      totalLocations: 0,
      discoveredLocations: 0,
      visitedLocations: 0,
      explorationPercentage: 0,
    };
  }

  public initializeWorld(saveId: string, template: { name: string; description?: string }): World {
    const worldData: Partial<World> = {
      name: template.name,
      description: template.description || '',
      type: 'overworld',
      regions: [],
    };

    const response = this.createWorld(saveId, worldData);
    return response.world;
  }
}

let mapServiceInstance: MapService | null = null;

export function getMapService(): MapService {
  if (!mapServiceInstance) {
    mapServiceInstance = MapService.getInstance();
  }
  return mapServiceInstance;
}

export async function initializeMapService(): Promise<MapService> {
  const service = getMapService();
  await service.initialize();
  return service;
}
