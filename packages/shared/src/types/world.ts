import type { MapConnection, MapEncounter } from './map';

export type LocationType = 'city' | 'village' | 'dungeon' | 'wilderness' | 'building' | 'custom';

export type ConnectionType = 'road' | 'portal' | 'hidden' | 'bidirectional' | 'oneway';

export type WorldType = 'overworld' | 'underground' | 'plane' | 'dream' | 'custom';

export interface LocationEnvironment {
  timeOfDay: 'dawn' | 'day' | 'dusk' | 'night';
  weather: 'clear' | 'cloudy' | 'rain' | 'storm' | 'snow' | 'fog';
  atmosphere: 'peaceful' | 'tense' | 'mysterious' | 'dangerous' | 'vibrant' | 'desolate';
  temperature: number;
  visibility: number;
}

export interface LocationFeature {
  id: string;
  name: string;
  description: string;
  type: 'landmark' | 'resource' | 'hazard' | 'secret' | 'custom';
  interactable: boolean;
  data?: Record<string, unknown>;
}

export interface LocationEvent {
  id: string;
  name: string;
  description: string;
  trigger: 'on_enter' | 'on_exit' | 'on_explore' | 'on_time' | 'custom';
  probability: number;
  oneTime: boolean;
  triggered: boolean;
  effects: Record<string, unknown>;
  conditions?: Record<string, unknown>;
}

export interface LocationRequirements {
  level?: number;
  items?: string[];
  quests?: string[];
  skills?: string[];
  custom?: Record<string, unknown>;
}

export interface Location {
  id: string;
  regionId: string;
  name: string;
  description: string;
  type: LocationType;
  
  environment: LocationEnvironment;
  features: LocationFeature[];
  events: LocationEvent[];
  
  npcs: string[];
  items: string[];
  encounters: string[];
  
  connections: string[];
  requirements?: LocationRequirements;
  
  dangerLevel: number;
  population?: number;
  services?: string[];
  tags: string[];
  
  isDiscovered: boolean;
  isAccessible: boolean;
  
  customData?: Record<string, unknown>;
}

export interface Region {
  id: string;
  worldId: string;
  name: string;
  description: string;
  type: WorldType;
  
  locations: Location[];
  connections: MapConnection[];
  
  climate: string;
  culture?: string;
  dangers: string[];
  
  isDiscovered: boolean;
  isAccessible: boolean;
  
  customData?: Record<string, unknown>;
}

export interface World {
  id: string;
  name: string;
  description: string;
  type: WorldType;
  
  regions: Region[];
  
  lore: string;
  history: string;
  rules: Record<string, unknown>;
  
  customData?: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
}

export interface CharacterLocation {
  characterId: string;
  worldId: string;
  regionId: string;
  locationId: string;
  
  previousLocations: {
    worldId: string;
    regionId: string;
    locationId: string;
    leftAt: number;
  }[];
  
  enteredAt: number;
  updatedAt: number;
}

export interface ExploredArea {
  characterId: string;
  locationId: string;
  discoveredAt: number;
  visitCount: number;
  lastVisitedAt: number;
}

export interface LocationConnection {
  id: string;
  fromLocationId: string;
  toLocationId: string;
  type: ConnectionType;
  travelTime: number;
  requirements?: LocationRequirements;
  bidirectional: boolean;
  discovered: boolean;
}

export interface MapState {
  currentWorld: World | null;
  currentRegion: Region | null;
  currentLocation: Location | null;
  
  exploredAreas: ExploredArea[];
  availableConnections: LocationConnection[];
  
  visitedLocations: string[];
  discoveredLocations: string[];
  
  lastUpdated: number;
}

export interface MoveResult {
  success: boolean;
  fromLocation: Location | null;
  toLocation: Location | null;
  travelTime: number;
  triggeredEvents: LocationEvent[];
  encounters: MapEncounter[];
  message: string;
}

export interface ExploreResult {
  success: boolean;
  location: Location;
  discoveredFeatures: LocationFeature[];
  discoveredEvents: LocationEvent[];
  discoveredItems: string[];
  discoveredNpcs: string[];
  message: string;
}

export interface MapFilter {
  worldId?: string;
  regionId?: string;
  type?: LocationType;
  discovered?: boolean;
  accessible?: boolean;
  minDangerLevel?: number;
  maxDangerLevel?: number;
  tags?: string[];
}

export interface MapStatistics {
  totalWorlds: number;
  totalRegions: number;
  totalLocations: number;
  discoveredLocations: number;
  visitedLocations: number;
  explorationPercentage: number;
}

export interface CreateMapRequest {
  saveId: string;
  world: Partial<World>;
  regions?: Partial<Region>[];
}

export interface CreateMapResponse {
  success: boolean;
  world: World;
  message: string;
}

export interface GetMapStateResponse {
  success: boolean;
  mapState: MapState;
  statistics: MapStatistics;
}

export interface MoveRequest {
  characterId: string;
  targetLocationId: string;
  method?: 'walk' | 'teleport' | 'portal' | 'custom';
}

export interface MoveResponse {
  success: boolean;
  result: MoveResult;
}

export interface ExploreRequest {
  characterId: string;
  locationId?: string;
  depth?: 'shallow' | 'normal' | 'deep';
}

export interface ExploreResponse {
  success: boolean;
  result: ExploreResult;
}

export interface GetConnectionsResponse {
  success: boolean;
  connections: LocationConnection[];
  locations: Location[];
}

export interface GetLocationResponse {
  success: boolean;
  location: Location;
  npcs: unknown[];
  items: unknown[];
}
