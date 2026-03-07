import type {
  AgentType,
  AgentMessage,
  AgentResponse,
  GameMap,
  MapLocation,
  MapConnection,
  MapEncounter,
  MapTile,
  AgentBinding,
  ToolType,
  InitializationContext,
  InitializationResult,
} from '@ai-rpg/shared';
import { AgentType as AT, ToolType as ToolTypeEnum } from '@ai-rpg/shared';
import { AgentBase } from './AgentBase';
import { gameLog } from '../services/GameLogService';

// 地点类型
export enum LocationType {
  CITY = 'city',
  VILLAGE = 'village',
  DUNGEON = 'dungeon',
  WILDERNESS = 'wilderness',
  BUILDING = 'building',
  CUSTOM = 'custom',
}

// 环境时间段
export enum TimeOfDay {
  DAWN = 'dawn',
  DAY = 'day',
  DUSK = 'dusk',
  NIGHT = 'night',
}

// 天气类型
export enum WeatherType {
  CLEAR = 'clear',
  CLOUDY = 'cloudy',
  RAIN = 'rain',
  STORM = 'storm',
  SNOW = 'snow',
  FOG = 'fog',
}

// 氛围类型
export enum AtmosphereType {
  PEACEFUL = 'peaceful',
  TENSE = 'tense',
  MYSTERIOUS = 'mysterious',
  DANGEROUS = 'dangerous',
  VIBRANT = 'vibrant',
  DESOLATE = 'desolate',
}

// 环境状态
export interface EnvironmentState {
  timeOfDay: TimeOfDay;
  weather: WeatherType;
  atmosphere: AtmosphereType;
  temperature: number;
  visibility: number;
}

// 扩展地点信息
export interface ExtendedLocation extends MapLocation {
  type: LocationType;
  environment: EnvironmentState;
  connections: string[];
  npcs: string[];
  items: string[];
  encounters: string[];
  isDiscovered: boolean;
  isAccessible: boolean;
  accessRequirements?: string[];
  dangerLevel: number;
  population?: number;
  services?: string[];
  tags: string[];
}

// 移动结果
export interface MovementResult {
  success: boolean;
  fromLocation: string;
  toLocation: string;
  travelTime: number;
  encounters: MapEncounter[];
  events: string[];
  newEnvironment?: EnvironmentState;
}

// 探索进度
export interface ExplorationProgress {
  totalLocations: number;
  discoveredLocations: number;
  visitedLocations: number;
  explorationPercentage: number;
  undiscoveredLocations: string[];
}

// 地图状态
export interface MapState {
  currentMap: GameMap | null;
  currentLocationId: string | null;
  locations: Map<string, ExtendedLocation>;
  connections: MapConnection[];
  visitedLocations: Set<string>;
  environmentHistory: EnvironmentState[];
  lastUpdated: number;
}

// 地点生成配置
export interface LocationGenerationConfig {
  type: LocationType;
  name?: string;
  position?: { x: number; y: number };
  dangerLevel?: number;
  connectedTo?: string[];
  environment?: Partial<EnvironmentState>;
  tags?: string[];
}

/**
 * 地图管理智能体
 * 负责管理游戏世界地图、生成区域、处理玩家移动、追踪探索进度
 */
export class MapAgent extends AgentBase {
  readonly type: AgentType = AT.MAP;

  // 依赖的 Tool 类型
  readonly tools: ToolType[] = [
    ToolTypeEnum.MAP_DATA,
    ToolTypeEnum.NPC_DATA,
    ToolTypeEnum.EVENT_DATA,
    ToolTypeEnum.QUEST_DATA,
  ];

  // 可调用的 Agent 绑定配置
  readonly bindings: AgentBinding[] = [
    { agentType: AT.COORDINATOR, enabled: true },
    { agentType: AT.STORY_CONTEXT, enabled: true },
    { agentType: AT.NPC_PARTY, enabled: true },
    { agentType: AT.QUEST, enabled: true },
  ];

  private mapState: MapState;

  constructor() {
    super({
      temperature: 0.6,
      maxTokens: 4096,
    });

    this.mapState = {
      currentMap: null,
      currentLocationId: null,
      locations: new Map(),
      connections: [],
      visitedLocations: new Set(),
      environmentHistory: [],
      lastUpdated: Date.now(),
    };
  }

  protected getAgentName(): string {
    return 'Map Agent';
  }

  protected getAgentDescription(): string {
    return '地图管理智能体，负责管理游戏世界地图、生成区域、处理玩家移动、追踪探索进度';
  }

  protected getAgentCapabilities(): string[] {
    return [
      'location_generation',
      'movement_handling',
      'connection_management',
      'exploration_tracking',
      'environment_simulation',
      'encounter_generation',
    ];
  }

  /**
   * 初始化方法
   * 用于游戏开始时初始化地图和起始位置
   */
  async initialize(context: InitializationContext): Promise<InitializationResult> {
    try {
      const { character, template } = context;
      
      const createdLocations: string[] = [];
      
      // 1. 从模板获取初始地图配置
      if (template.startingScene) {
        // 创建起始位置
        const startingLocation = this.createStartingLocation(template.startingScene);
        this.mapState.locations.set(startingLocation.id, startingLocation);
        this.mapState.currentLocationId = startingLocation.id;
        this.mapState.visitedLocations.add(startingLocation.id);
        createdLocations.push(startingLocation.id);
      }
      
      // 2. 如果没有模板配置，创建默认起始位置
      if (createdLocations.length === 0) {
        const defaultLocation = this.createDefaultStartingLocation(character);
        this.mapState.locations.set(defaultLocation.id, defaultLocation);
        this.mapState.currentLocationId = defaultLocation.id;
        this.mapState.visitedLocations.add(defaultLocation.id);
        createdLocations.push(defaultLocation.id);
      }
      
      this.addMemory(
        `Initialized map for character: ${character.name}. Locations: ${createdLocations.length}`,
        'assistant',
        7,
        { characterId: character.id, createdLocations }
      );
      
      return {
        success: true,
        data: {
          createdLocations,
          startingLocationId: this.mapState.currentLocationId,
          totalLocations: createdLocations.length,
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during map initialization';
      gameLog.error('agent', `Initialization failed: ${errorMessage}`, {
        agentType: this.type,
        characterId: context.character?.id,
        saveId: context.saveId,
        stack: error instanceof Error ? error.stack : undefined,
      });
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * 创建起始位置
   */
  private createStartingLocation(sceneDef: { id?: string; name?: string; description?: string; type?: string }): ExtendedLocation {
    return {
      id: sceneDef.id || `start_${Date.now()}`,
      name: sceneDef.name || '起始点',
      description: sceneDef.description || '你的冒险从这里开始。',
      type: (sceneDef.type as LocationType) || LocationType.VILLAGE,
      position: { x: 0, y: 0 },
      environment: {
        timeOfDay: TimeOfDay.DAY,
        weather: WeatherType.CLEAR,
        atmosphere: AtmosphereType.PEACEFUL,
        temperature: 20,
        visibility: 100,
      },
      connections: [],
      npcs: [],
      items: [],
      encounters: [],
      isDiscovered: true,
      discovered: true,
      isAccessible: true,
      dangerLevel: 0,
      tags: ['starting', 'safe'],
    };
  }

  /**
   * 创建默认起始位置
   */
  private createDefaultStartingLocation(character: { name: string; class: string }): ExtendedLocation {
    const startingLocations: Record<string, { name: string; description: string; type: LocationType }> = {
      'warrior': { name: '训练营', description: '一个充满汗水与钢铁气息的训练场，战士们在这里磨练技艺。', type: LocationType.BUILDING },
      'mage': { name: '法师塔大厅', description: '高耸的法师塔底层，空气中弥漫着魔力的气息。', type: LocationType.BUILDING },
      'rogue': { name: '暗影小巷', description: '城市中隐秘的角落，阴影中似乎有人在注视着你。', type: LocationType.BUILDING },
      'cleric': { name: '神殿入口', description: '神圣的光芒从神殿中透出，信徒们在此祈祷。', type: LocationType.BUILDING },
      'ranger': { name: '森林边缘', description: '茂密的森林边缘，远处传来鸟鸣声。', type: LocationType.WILDERNESS },
      'paladin': { name: '圣骑士大厅', description: '庄严的大厅，圣骑士们在此接受神圣使命。', type: LocationType.BUILDING },
      'necromancer': { name: '废弃墓地', description: '荒凉的墓地，死亡的气息弥漫在空气中。', type: LocationType.WILDERNESS },
      'bard': { name: '酒馆舞台', description: '热闹的酒馆，吟游诗人的歌声回荡。', type: LocationType.BUILDING },
      'monk': { name: '寺院庭院', description: '宁静的寺院庭院，僧侣们在此修行。', type: LocationType.BUILDING },
      'druid': { name: '神圣橡树', description: '古老的橡树下，自然的力量在此汇聚。', type: LocationType.WILDERNESS },
    };
    
    const locationInfo = startingLocations[character.class] || { name: '村庄广场', description: '一个宁静的村庄广场，你的冒险从这里开始。', type: LocationType.VILLAGE };
    
    return {
      id: `start_${character.class}_${Date.now()}`,
      name: locationInfo.name,
      description: locationInfo.description,
      type: locationInfo.type,
      position: { x: 0, y: 0 },
      environment: {
        timeOfDay: TimeOfDay.DAY,
        weather: WeatherType.CLEAR,
        atmosphere: AtmosphereType.PEACEFUL,
        temperature: 20,
        visibility: 100,
      },
      connections: [],
      npcs: [],
      items: [],
      encounters: [],
      isDiscovered: true,
      discovered: true,
      isAccessible: true,
      dangerLevel: 0,
      tags: ['starting', 'safe'],
    };
  }

  /**
   * 处理消息
   */
  async processMessage(message: AgentMessage): Promise<AgentResponse> {
    const action = message.payload.action;
    const data = message.payload.data as Record<string, unknown>;

    try {
      switch (action) {
        case 'generate_location':
          return this.handleGenerateLocation(data);
        case 'update_location':
          return this.handleUpdateLocation(data);
        case 'get_location':
          return this.handleGetLocation(data);
        case 'get_current_location':
          return this.handleGetCurrentLocation();
        case 'move_player':
          return this.handleMovePlayer(data);
        case 'create_connection':
          return this.handleCreateConnection(data);
        case 'remove_connection':
          return this.handleRemoveConnection(data);
        case 'get_connections':
          return this.handleGetConnections(data);
        case 'discover_location':
          return this.handleDiscoverLocation(data);
        case 'get_exploration_progress':
          return this.handleGetExplorationProgress();
        case 'get_nearby_locations':
          return this.handleGetNearbyLocations(data);
        case 'update_environment':
          return this.handleUpdateEnvironment(data);
        case 'get_environment':
          return this.handleGetEnvironment();
        case 'initialize_map':
          return this.handleInitializeMap(data);
        case 'get_map_state':
          return this.handleGetMapState();
        case 'generate_encounter':
          return this.handleGenerateEncounter(data);
        default:
          return {
            success: false,
            error: `Unknown action: ${action}`,
          };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error in MapAgent',
      };
    }
  }

  // ==================== 地点生成 ====================

  /**
   * 生成地点
   */
  private handleGenerateLocation(data: Record<string, unknown>): AgentResponse {
    const config = data as unknown as LocationGenerationConfig;

    if (!config.type) {
      return {
        success: false,
        error: 'Missing required field: type',
      };
    }

    const location: ExtendedLocation = {
      id: this.generateLocationId(),
      name: config.name || this.generateLocationName(config.type),
      type: config.type,
      position: config.position || this.generateRandomPosition(),
      description: this.generateLocationDescription(config.type),
      discovered: false,
      isDiscovered: false,
      isAccessible: true,
      environment: this.generateEnvironment(config.type, config.environment),
      connections: config.connectedTo || [],
      npcs: [],
      items: [],
      encounters: [],
      accessRequirements: [],
      dangerLevel: config.dangerLevel ?? this.calculateDangerLevel(config.type),
      tags: config.tags || [],
    };

    this.mapState.locations.set(location.id, location);
    this.mapState.lastUpdated = Date.now();

    // 创建连接
    if (config.connectedTo && config.connectedTo.length > 0) {
      for (const targetId of config.connectedTo) {
        this.createConnection(location.id, targetId, 'bidirectional');
      }
    }

    this.addMemory(
      `Generated location: ${location.name} (${location.type})`,
      'assistant',
      6,
      { locationId: location.id, type: location.type }
    );

    return {
      success: true,
      data: { location },
    };
  }

  /**
   * 更新地点
   */
  private handleUpdateLocation(data: Record<string, unknown>): AgentResponse {
    const updateData = data as {
      locationId: string;
      updates: Partial<ExtendedLocation>;
    };

    const location = this.mapState.locations.get(updateData.locationId);
    if (!location) {
      return {
        success: false,
        error: `Location not found: ${updateData.locationId}`,
      };
    }

    const updatedLocation: ExtendedLocation = {
      ...location,
      ...updateData.updates,
    };

    this.mapState.locations.set(updateData.locationId, updatedLocation);
    this.mapState.lastUpdated = Date.now();

    this.addMemory(
      `Updated location: ${location.name}`,
      'assistant',
      5,
      { locationId: updateData.locationId, changes: updateData.updates }
    );

    return {
      success: true,
      data: { location: updatedLocation },
    };
  }

  /**
   * 获取地点
   */
  private handleGetLocation(data: Record<string, unknown>): AgentResponse {
    const locationData = data as { locationId: string };
    const location = this.mapState.locations.get(locationData.locationId);

    if (!location) {
      return {
        success: false,
        error: `Location not found: ${locationData.locationId}`,
      };
    }

    return {
      success: true,
      data: { location },
    };
  }

  /**
   * 获取当前地点
   */
  private handleGetCurrentLocation(): AgentResponse {
    if (!this.mapState.currentLocationId) {
      return {
        success: false,
        error: 'No current location set',
      };
    }

    const location = this.mapState.locations.get(this.mapState.currentLocationId);
    if (!location) {
      return {
        success: false,
        error: `Current location not found: ${this.mapState.currentLocationId}`,
      };
    }

    return {
      success: true,
      data: { location },
    };
  }

  // ==================== 玩家移动处理 ====================

  /**
   * 处理玩家移动
   */
  private handleMovePlayer(data: Record<string, unknown>): AgentResponse {
    const moveData = data as {
      targetLocationId: string;
      travelMethod?: string;
    };

    if (!moveData.targetLocationId) {
      return {
        success: false,
        error: 'Missing required field: targetLocationId',
      };
    }

    const targetLocation = this.mapState.locations.get(moveData.targetLocationId);
    if (!targetLocation) {
      return {
        success: false,
        error: `Target location not found: ${moveData.targetLocationId}`,
      };
    }

    if (!targetLocation.isAccessible) {
      return {
        success: false,
        error: `Location ${targetLocation.name} is not accessible`,
      };
    }

    const fromLocationId = this.mapState.currentLocationId;
    const fromLocation = fromLocationId
      ? this.mapState.locations.get(fromLocationId) ?? null
      : null;

    // 检查连接
    if (fromLocation && fromLocationId && !this.hasConnection(fromLocationId, moveData.targetLocationId)) {
      return {
        success: false,
        error: `No path from ${fromLocation.name} to ${targetLocation.name}`,
      };
    }

    // 计算旅行时间
    const travelTime = this.calculateTravelTime(fromLocation, targetLocation);

    // 生成遭遇
    const encounters = this.generateTravelEncounters(fromLocation, targetLocation);

    // 更新位置
    this.mapState.currentLocationId = moveData.targetLocationId;
    this.mapState.visitedLocations.add(moveData.targetLocationId);
    targetLocation.discovered = true;
    targetLocation.isDiscovered = true;

    // 更新环境
    const newEnvironment = targetLocation.environment;
    this.mapState.environmentHistory.push(newEnvironment);
    this.mapState.lastUpdated = Date.now();

    const result: MovementResult = {
      success: true,
      fromLocation: fromLocationId || 'unknown',
      toLocation: moveData.targetLocationId,
      travelTime,
      encounters,
      events: this.generateTravelEvents(encounters),
      newEnvironment,
    };

    this.addMemory(
      `Player moved from ${fromLocation?.name || 'unknown'} to ${targetLocation.name}`,
      'assistant',
      7,
      { from: fromLocationId, to: moveData.targetLocationId, travelTime }
    );

    return {
      success: true,
      data: result,
    };
  }

  // ==================== 地点连接管理 ====================

  /**
   * 创建连接
   */
  private handleCreateConnection(data: Record<string, unknown>): AgentResponse {
    const connectionData = data as {
      from: string;
      to: string;
      type?: 'bidirectional' | 'oneway';
      requirements?: string[];
    };

    if (!connectionData.from || !connectionData.to) {
      return {
        success: false,
        error: 'Missing required fields: from, to',
      };
    }

    const fromLocation = this.mapState.locations.get(connectionData.from);
    const toLocation = this.mapState.locations.get(connectionData.to);

    if (!fromLocation || !toLocation) {
      return {
        success: false,
        error: 'One or both locations not found',
      };
    }

    this.createConnection(
      connectionData.from,
      connectionData.to,
      connectionData.type || 'bidirectional',
      connectionData.requirements
    );

    return {
      success: true,
      data: {
        from: connectionData.from,
        to: connectionData.to,
        type: connectionData.type || 'bidirectional',
      },
    };
  }

  /**
   * 创建连接（内部方法）
   */
  private createConnection(
    from: string,
    to: string,
    type: 'bidirectional' | 'oneway',
    requirements?: string[]
  ): void {
    const connection: MapConnection = {
      from,
      to,
      type,
      requirements,
    };

    this.mapState.connections.push(connection);

    // 更新地点的连接列表
    const fromLocation = this.mapState.locations.get(from);
    const toLocation = this.mapState.locations.get(to);

    if (fromLocation && !fromLocation.connections.includes(to)) {
      fromLocation.connections.push(to);
    }

    if (type === 'bidirectional' && toLocation && !toLocation.connections.includes(from)) {
      toLocation.connections.push(from);
    }
  }

  /**
   * 移除连接
   */
  private handleRemoveConnection(data: Record<string, unknown>): AgentResponse {
    const connectionData = data as { from: string; to: string };

    const index = this.mapState.connections.findIndex(
      c => c.from === connectionData.from && c.to === connectionData.to
    );

    if (index === -1) {
      return {
        success: false,
        error: 'Connection not found',
      };
    }

    this.mapState.connections.splice(index, 1);

    // 更新地点的连接列表
    const fromLocation = this.mapState.locations.get(connectionData.from);
    const toLocation = this.mapState.locations.get(connectionData.to);

    if (fromLocation) {
      fromLocation.connections = fromLocation.connections.filter(id => id !== connectionData.to);
    }

    if (toLocation) {
      toLocation.connections = toLocation.connections.filter(id => id !== connectionData.from);
    }

    this.mapState.lastUpdated = Date.now();

    return {
      success: true,
      data: { removed: true },
    };
  }

  /**
   * 获取连接
   */
  private handleGetConnections(data: Record<string, unknown>): AgentResponse {
    const locationData = data as { locationId?: string };

    if (locationData.locationId) {
      const connections = this.mapState.connections.filter(
        c => c.from === locationData.locationId || c.to === locationData.locationId
      );
      return {
        success: true,
        data: { connections },
      };
    }

    return {
      success: true,
      data: { connections: this.mapState.connections },
    };
  }

  /**
   * 检查是否有连接
   */
  private hasConnection(from: string, to: string): boolean {
    return this.mapState.connections.some(
      c => (c.from === from && c.to === to) ||
           (c.type === 'bidirectional' && c.from === to && c.to === from)
    );
  }

  // ==================== 探索追踪 ====================

  /**
   * 发现地点
   */
  private handleDiscoverLocation(data: Record<string, unknown>): AgentResponse {
    const discoverData = data as { locationId: string };

    const location = this.mapState.locations.get(discoverData.locationId);
    if (!location) {
      return {
        success: false,
        error: `Location not found: ${discoverData.locationId}`,
      };
    }

    location.discovered = true;
    location.isDiscovered = true;
    this.mapState.lastUpdated = Date.now();

    this.addMemory(
      `Discovered location: ${location.name}`,
      'assistant',
      5,
      { locationId: discoverData.locationId }
    );

    return {
      success: true,
      data: { location },
    };
  }

  /**
   * 获取探索进度
   */
  private handleGetExplorationProgress(): AgentResponse {
    const totalLocations = this.mapState.locations.size;
    const discoveredLocations = Array.from(this.mapState.locations.values())
      .filter(l => l.isDiscovered).length;
    const visitedLocations = this.mapState.visitedLocations.size;

    const undiscoveredLocations = Array.from(this.mapState.locations.values())
      .filter(l => !l.isDiscovered)
      .map(l => l.id);

    const progress: ExplorationProgress = {
      totalLocations,
      discoveredLocations,
      visitedLocations,
      explorationPercentage: totalLocations > 0
        ? Math.round((discoveredLocations / totalLocations) * 100)
        : 0,
      undiscoveredLocations,
    };

    return {
      success: true,
      data: progress,
    };
  }

  /**
   * 获取附近地点
   */
  private handleGetNearbyLocations(data: Record<string, unknown>): AgentResponse {
    const nearbyData = data as {
      locationId?: string;
      radius?: number;
    };

    const centerId = nearbyData.locationId || this.mapState.currentLocationId;
    if (!centerId) {
      return {
        success: false,
        error: 'No location specified and no current location set',
      };
    }

    const centerLocation = this.mapState.locations.get(centerId);
    if (!centerLocation) {
      return {
        success: false,
        error: `Location not found: ${centerId}`,
      };
    }

    const radius = nearbyData.radius ?? 3;

    const nearbyLocations = Array.from(this.mapState.locations.values())
      .filter(l => {
        if (l.id === centerId) return false;
        const distance = this.calculateDistance(centerLocation.position, l.position);
        return distance <= radius;
      });

    return {
      success: true,
      data: {
        center: centerLocation,
        nearby: nearbyLocations,
        radius,
      },
    };
  }

  // ==================== 环境管理 ====================

  /**
   * 更新环境
   */
  private handleUpdateEnvironment(data: Record<string, unknown>): AgentResponse {
    const envData = data as {
      locationId?: string;
      environment: Partial<EnvironmentState>;
    };

    const locationId = envData.locationId || this.mapState.currentLocationId;
    if (!locationId) {
      return {
        success: false,
        error: 'No location specified and no current location set',
      };
    }

    const location = this.mapState.locations.get(locationId);
    if (!location) {
      return {
        success: false,
        error: `Location not found: ${locationId}`,
      };
    }

    location.environment = {
      ...location.environment,
      ...envData.environment,
    };

    this.mapState.lastUpdated = Date.now();

    return {
      success: true,
      data: { environment: location.environment },
    };
  }

  /**
   * 获取环境状态
   */
  private handleGetEnvironment(): AgentResponse {
    if (!this.mapState.currentLocationId) {
      return {
        success: false,
        error: 'No current location set',
      };
    }

    const location = this.mapState.locations.get(this.mapState.currentLocationId);
    if (!location) {
      return {
        success: false,
        error: `Current location not found: ${this.mapState.currentLocationId}`,
      };
    }

    return {
      success: true,
      data: { environment: location.environment },
    };
  }

  // ==================== 地图初始化 ====================

  /**
   * 初始化地图
   */
  private handleInitializeMap(data: Record<string, unknown>): AgentResponse {
    const mapData = data as {
      name: string;
      description?: string;
      type?: 'overworld' | 'dungeon' | 'town' | 'building' | 'custom';
      size?: { width: number; height: number };
      startingLocationId?: string;
    };

    if (!mapData.name) {
      return {
        success: false,
        error: 'Missing required field: name',
      };
    }

    const gameMap: GameMap = {
      id: this.generateMapId(),
      name: mapData.name,
      description: mapData.description || '',
      type: mapData.type || 'overworld',
      size: mapData.size || { width: 100, height: 100 },
      tiles: this.generateEmptyTiles(mapData.size || { width: 100, height: 100 }),
      locations: [],
      connections: [],
      encounters: [],
      npcs: [],
      items: [],
    };

    this.mapState.currentMap = gameMap;
    this.mapState.currentLocationId = mapData.startingLocationId || null;
    this.mapState.lastUpdated = Date.now();

    this.addMemory(
      `Initialized map: ${gameMap.name}`,
      'assistant',
      8,
      { mapId: gameMap.id, type: gameMap.type }
    );

    return {
      success: true,
      data: { map: gameMap },
    };
  }

  /**
   * 获取地图状态
   */
  private handleGetMapState(): AgentResponse {
    return {
      success: true,
      data: {
        currentMap: this.mapState.currentMap,
        currentLocationId: this.mapState.currentLocationId,
        locationsCount: this.mapState.locations.size,
        connectionsCount: this.mapState.connections.length,
        visitedCount: this.mapState.visitedLocations.size,
        lastUpdated: this.mapState.lastUpdated,
      },
    };
  }

  // ==================== 遭遇生成 ====================

  /**
   * 生成遭遇
   */
  private handleGenerateEncounter(data: Record<string, unknown>): AgentResponse {
    const encounterData = data as {
      locationId?: string;
      type?: 'combat' | 'event' | 'treasure';
    };

    const locationId = encounterData.locationId || this.mapState.currentLocationId;
    if (!locationId) {
      return {
        success: false,
        error: 'No location specified and no current location set',
      };
    }

    const location = this.mapState.locations.get(locationId);
    if (!location) {
      return {
        success: false,
        error: `Location not found: ${locationId}`,
      };
    }

    const encounter: MapEncounter = {
      id: this.generateEncounterId(),
      type: encounterData.type || this.randomEncounterType(),
      position: location.position,
      trigger: 'random',
      probability: this.calculateEncounterProbability(location),
      data: {
        locationType: location.type,
        dangerLevel: location.dangerLevel,
      },
    };

    location.encounters.push(encounter.id);

    return {
      success: true,
      data: { encounter },
    };
  }

  // ==================== 辅助方法 ====================

  /**
   * 生成地点ID
   */
  private generateLocationId(): string {
    return `loc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 生成地图ID
   */
  private generateMapId(): string {
    return `map_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 生成遭遇ID
   */
  private generateEncounterId(): string {
    return `enc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 生成地点名称
   */
  private generateLocationName(type: LocationType): string {
    const prefixes: Record<LocationType, string[]> = {
      [LocationType.CITY]: ['New', 'Old', 'Fort', 'Port', 'Royal'],
      [LocationType.VILLAGE]: ['Small', 'Quiet', 'Hidden', 'Ancient', 'Peaceful'],
      [LocationType.DUNGEON]: ['Dark', 'Forgotten', 'Cursed', 'Ancient', 'Doomed'],
      [LocationType.WILDERNESS]: ['Wild', 'Untamed', 'Forbidden', 'Mystic', 'Lost'],
      [LocationType.BUILDING]: ['Abandoned', 'Haunted', 'Grand', 'Old', 'Mysterious'],
      [LocationType.CUSTOM]: ['Unknown', 'Strange', 'Mysterious', 'Hidden', 'Secret'],
    };

    const suffixes: Record<LocationType, string[]> = {
      [LocationType.CITY]: ['City', 'Town', 'Citadel', 'Stronghold', 'Capital'],
      [LocationType.VILLAGE]: ['Village', 'Hamlet', 'Settlement', 'Outpost', 'Camp'],
      [LocationType.DUNGEON]: ['Dungeon', 'Crypt', 'Cave', 'Ruins', 'Lair'],
      [LocationType.WILDERNESS]: ['Forest', 'Plains', 'Mountains', 'Swamp', 'Desert'],
      [LocationType.BUILDING]: ['Manor', 'Tower', 'Temple', 'Inn', 'Shop'],
      [LocationType.CUSTOM]: ['Place', 'Area', 'Zone', 'Region', 'Domain'],
    };

    const prefix = prefixes[type][Math.floor(Math.random() * prefixes[type].length)];
    const suffix = suffixes[type][Math.floor(Math.random() * suffixes[type].length)];

    return `${prefix} ${suffix}`;
  }

  /**
   * 生成地点描述
   */
  private generateLocationDescription(type: LocationType): string {
    const descriptions: Record<LocationType, string[]> = {
      [LocationType.CITY]: [
        'A bustling city filled with merchants and adventurers.',
        'A grand city with towering spires and busy markets.',
        'An ancient city with a rich history and many secrets.',
      ],
      [LocationType.VILLAGE]: [
        'A quiet village nestled in the countryside.',
        'A small settlement with friendly inhabitants.',
        'A humble village with simple but hardworking folk.',
      ],
      [LocationType.DUNGEON]: [
        'A dark dungeon filled with dangers and treasures.',
        'An ancient crypt with untold secrets.',
        'A treacherous cave system with unknown depths.',
      ],
      [LocationType.WILDERNESS]: [
        'A wild area with untamed nature.',
        'A vast wilderness with hidden dangers.',
        'An unexplored region full of mystery.',
      ],
      [LocationType.BUILDING]: [
        'An old building with a story to tell.',
        'A mysterious structure with unknown purpose.',
        'A well-maintained establishment.',
      ],
      [LocationType.CUSTOM]: [
        'A unique location with special properties.',
        'An unusual place unlike any other.',
        'A mysterious area waiting to be explored.',
      ],
    };

    const typeDescriptions = descriptions[type];
    return typeDescriptions[Math.floor(Math.random() * typeDescriptions.length)];
  }

  /**
   * 生成随机位置
   */
  private generateRandomPosition(): { x: number; y: number } {
    const mapSize = this.mapState.currentMap?.size || { width: 100, height: 100 };
    return {
      x: Math.floor(Math.random() * mapSize.width),
      y: Math.floor(Math.random() * mapSize.height),
    };
  }

  /**
   * 生成环境状态
   */
  private generateEnvironment(
    locationType: LocationType,
    partial?: Partial<EnvironmentState>
  ): EnvironmentState {
    const baseEnvironment = this.getBaseEnvironment(locationType);
    return {
      ...baseEnvironment,
      ...partial,
    };
  }

  /**
   * 获取基础环境
   */
  private getBaseEnvironment(locationType: LocationType): EnvironmentState {
    const environments: Record<LocationType, EnvironmentState> = {
      [LocationType.CITY]: {
        timeOfDay: TimeOfDay.DAY,
        weather: WeatherType.CLEAR,
        atmosphere: AtmosphereType.VIBRANT,
        temperature: 20,
        visibility: 100,
      },
      [LocationType.VILLAGE]: {
        timeOfDay: TimeOfDay.DAY,
        weather: WeatherType.CLEAR,
        atmosphere: AtmosphereType.PEACEFUL,
        temperature: 18,
        visibility: 90,
      },
      [LocationType.DUNGEON]: {
        timeOfDay: TimeOfDay.NIGHT,
        weather: WeatherType.CLEAR,
        atmosphere: AtmosphereType.DANGEROUS,
        temperature: 10,
        visibility: 30,
      },
      [LocationType.WILDERNESS]: {
        timeOfDay: TimeOfDay.DAY,
        weather: WeatherType.CLOUDY,
        atmosphere: AtmosphereType.MYSTERIOUS,
        temperature: 15,
        visibility: 70,
      },
      [LocationType.BUILDING]: {
        timeOfDay: TimeOfDay.DAY,
        weather: WeatherType.CLEAR,
        atmosphere: AtmosphereType.PEACEFUL,
        temperature: 20,
        visibility: 100,
      },
      [LocationType.CUSTOM]: {
        timeOfDay: TimeOfDay.DAY,
        weather: WeatherType.CLEAR,
        atmosphere: AtmosphereType.MYSTERIOUS,
        temperature: 18,
        visibility: 80,
      },
    };

    return environments[locationType];
  }

  /**
   * 计算危险等级
   */
  private calculateDangerLevel(locationType: LocationType): number {
    const dangerLevels: Record<LocationType, number> = {
      [LocationType.CITY]: 1,
      [LocationType.VILLAGE]: 2,
      [LocationType.BUILDING]: 3,
      [LocationType.WILDERNESS]: 4,
      [LocationType.DUNGEON]: 5,
      [LocationType.CUSTOM]: 3,
    };

    return dangerLevels[locationType];
  }

  /**
   * 计算旅行时间
   */
  private calculateTravelTime(
    from: ExtendedLocation | null,
    to: ExtendedLocation
  ): number {
    if (!from) return 0;

    const distance = this.calculateDistance(from.position, to.position);
    const baseTime = distance * 10; // 10 units per distance

    // 根据地点类型调整
    const terrainModifier = this.getTerrainModifier(to.type);

    return Math.round(baseTime * terrainModifier);
  }

  /**
   * 计算距离
   */
  private calculateDistance(
    from: { x: number; y: number },
    to: { x: number; y: number }
  ): number {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * 获取地形修正
   */
  private getTerrainModifier(locationType: LocationType): number {
    const modifiers: Record<LocationType, number> = {
      [LocationType.CITY]: 0.8,
      [LocationType.VILLAGE]: 1.0,
      [LocationType.BUILDING]: 0.5,
      [LocationType.WILDERNESS]: 1.5,
      [LocationType.DUNGEON]: 2.0,
      [LocationType.CUSTOM]: 1.0,
    };

    return modifiers[locationType];
  }

  /**
   * 生成旅行遭遇
   */
  private generateTravelEncounters(
    from: ExtendedLocation | null,
    to: ExtendedLocation
  ): MapEncounter[] {
    const encounters: MapEncounter[] = [];

    // 根据危险等级决定是否生成遭遇
    const encounterChance = (to.dangerLevel * 0.1) + (from ? from.dangerLevel * 0.05 : 0);

    if (Math.random() < encounterChance) {
      encounters.push({
        id: this.generateEncounterId(),
        type: this.randomEncounterType(),
        position: to.position,
        trigger: 'random',
        probability: encounterChance,
        data: {
          locationType: to.type,
          dangerLevel: to.dangerLevel,
        },
      });
    }

    return encounters;
  }

  /**
   * 生成旅行事件
   */
  private generateTravelEvents(encounters: MapEncounter[]): string[] {
    const events: string[] = [];

    for (const encounter of encounters) {
      switch (encounter.type) {
        case 'combat':
          events.push('Encountered hostile creatures during travel.');
          break;
        case 'event':
          events.push('Discovered an interesting event along the way.');
          break;
        case 'treasure':
          events.push('Found hidden treasure during the journey.');
          break;
      }
    }

    return events;
  }

  /**
   * 随机遭遇类型
   */
  private randomEncounterType(): 'combat' | 'event' | 'treasure' {
    const types: ('combat' | 'event' | 'treasure')[] = ['combat', 'event', 'treasure'];
    const weights = [0.5, 0.35, 0.15];

    const random = Math.random();
    let cumulative = 0;

    for (let i = 0; i < types.length; i++) {
      cumulative += weights[i];
      if (random < cumulative) {
        return types[i];
      }
    }

    return 'combat';
  }

  /**
   * 计算遭遇概率
   */
  private calculateEncounterProbability(location: ExtendedLocation): number {
    const baseProbability = 0.1;
    const dangerModifier = location.dangerLevel * 0.05;
    const atmosphereModifier = location.environment.atmosphere === AtmosphereType.DANGEROUS ? 0.1 : 0;

    return Math.min(baseProbability + dangerModifier + atmosphereModifier, 1);
  }

  /**
   * 生成空白瓦片
   */
  private generateEmptyTiles(size: { width: number; height: number }): MapTile[][] {
    const tiles: MapTile[][] = [];

    for (let y = 0; y < size.height; y++) {
      const row: MapTile[] = [];
      for (let x = 0; x < size.width; x++) {
        row.push({
          type: 'empty',
          walkable: true,
          properties: {},
        });
      }
      tiles.push(row);
    }

    return tiles;
  }
}

export default MapAgent;
