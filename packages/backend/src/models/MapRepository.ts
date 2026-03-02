/**
 * 地图仓库
 * 提供世界、区域、地点数据的持久化存储和查询功能
 */

import { BaseRepository, BaseEntity } from './BaseRepository';
import type {
  World,
  Region,
  Location,
  CharacterLocation,
  ExploredArea,
  LocationConnection,
  LocationType,
  MapStatistics,
} from '@ai-rpg/shared';

// ==================== 数据库实体类型 ====================

export interface WorldEntity extends BaseEntity {
  save_id: string;
  name: string;
  description: string;
  type: string;
  regions: string; // JSON
  lore: string;
  history: string;
  rules: string; // JSON
  custom_data: string; // JSON
}

export interface RegionEntity extends BaseEntity {
  world_id: string;
  name: string;
  description: string;
  type: string;
  locations: string; // JSON
  connections: string; // JSON
  climate: string;
  culture: string | null;
  dangers: string; // JSON
  is_discovered: number;
  is_accessible: number;
  custom_data: string; // JSON
}

export interface LocationEntity extends BaseEntity {
  region_id: string;
  name: string;
  description: string;
  type: LocationType;
  environment: string; // JSON
  features: string; // JSON
  events: string; // JSON
  npcs: string; // JSON
  items: string; // JSON
  encounters: string; // JSON
  connections: string; // JSON
  requirements: string | null; // JSON
  danger_level: number;
  population: number | null;
  services: string; // JSON
  tags: string; // JSON
  is_discovered: number;
  is_accessible: number;
  custom_data: string; // JSON
}

export interface CharacterLocationEntity extends BaseEntity {
  character_id: string;
  world_id: string;
  region_id: string;
  location_id: string;
  previous_locations: string; // JSON
  entered_at: number;
  updated_at: number;
}

export interface ExploredAreaEntity extends BaseEntity {
  character_id: string;
  location_id: string;
  discovered_at: number;
  visit_count: number;
  last_visited_at: number;
}

export interface LocationConnectionEntity extends BaseEntity {
  from_location_id: string;
  to_location_id: string;
  type: string;
  travel_time: number;
  requirements: string | null; // JSON
  bidirectional: number;
  discovered: number;
}

// ==================== 地图仓库 ====================

export class MapRepository extends BaseRepository<WorldEntity> {
  private static instance: MapRepository | null = null;

  constructor() {
    super('worlds');
    this.ensureTablesExist();
  }

  public static getInstance(): MapRepository {
    if (!MapRepository.instance) {
      MapRepository.instance = new MapRepository();
    }
    return MapRepository.instance;
  }

  private ensureTablesExist(): void {
    this.db.prepare(`
      CREATE TABLE IF NOT EXISTS worlds (
        id TEXT PRIMARY KEY,
        save_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        type TEXT NOT NULL DEFAULT 'overworld',
        regions TEXT DEFAULT '[]',
        lore TEXT,
        history TEXT,
        rules TEXT DEFAULT '{}',
        custom_data TEXT DEFAULT '{}',
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY (save_id) REFERENCES saves(id) ON DELETE CASCADE
      )
    `).run();

    this.db.prepare(`
      CREATE TABLE IF NOT EXISTS regions (
        id TEXT PRIMARY KEY,
        world_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        type TEXT NOT NULL DEFAULT 'overworld',
        locations TEXT DEFAULT '[]',
        connections TEXT DEFAULT '[]',
        climate TEXT,
        culture TEXT,
        dangers TEXT DEFAULT '[]',
        is_discovered INTEGER DEFAULT 0,
        is_accessible INTEGER DEFAULT 1,
        custom_data TEXT DEFAULT '{}',
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY (world_id) REFERENCES worlds(id) ON DELETE CASCADE
      )
    `).run();

    this.db.prepare(`
      CREATE TABLE IF NOT EXISTS locations (
        id TEXT PRIMARY KEY,
        region_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        type TEXT NOT NULL DEFAULT 'wilderness',
        environment TEXT DEFAULT '{}',
        features TEXT DEFAULT '[]',
        events TEXT DEFAULT '[]',
        npcs TEXT DEFAULT '[]',
        items TEXT DEFAULT '[]',
        encounters TEXT DEFAULT '[]',
        connections TEXT DEFAULT '[]',
        requirements TEXT,
        danger_level INTEGER DEFAULT 1,
        population INTEGER,
        services TEXT DEFAULT '[]',
        tags TEXT DEFAULT '[]',
        is_discovered INTEGER DEFAULT 0,
        is_accessible INTEGER DEFAULT 1,
        custom_data TEXT DEFAULT '{}',
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY (region_id) REFERENCES regions(id) ON DELETE CASCADE
      )
    `).run();

    this.db.prepare(`
      CREATE TABLE IF NOT EXISTS character_locations (
        id TEXT PRIMARY KEY,
        character_id TEXT NOT NULL UNIQUE,
        world_id TEXT NOT NULL,
        region_id TEXT NOT NULL,
        location_id TEXT NOT NULL,
        previous_locations TEXT DEFAULT '[]',
        entered_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
      )
    `).run();

    this.db.prepare(`
      CREATE TABLE IF NOT EXISTS explored_areas (
        id TEXT PRIMARY KEY,
        character_id TEXT NOT NULL,
        location_id TEXT NOT NULL,
        discovered_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        visit_count INTEGER DEFAULT 1,
        last_visited_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        UNIQUE(character_id, location_id)
      )
    `).run();

    this.db.prepare(`
      CREATE TABLE IF NOT EXISTS location_connections (
        id TEXT PRIMARY KEY,
        from_location_id TEXT NOT NULL,
        to_location_id TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'road',
        travel_time INTEGER DEFAULT 60,
        requirements TEXT,
        bidirectional INTEGER DEFAULT 1,
        discovered INTEGER DEFAULT 0
      )
    `).run();

    this.db.prepare(`CREATE INDEX IF NOT EXISTS idx_regions_world ON regions(world_id)`).run();
    this.db.prepare(`CREATE INDEX IF NOT EXISTS idx_locations_region ON locations(region_id)`).run();
    this.db.prepare(`CREATE INDEX IF NOT EXISTS idx_character_locations_character ON character_locations(character_id)`).run();
    this.db.prepare(`CREATE INDEX IF NOT EXISTS idx_explored_areas_character ON explored_areas(character_id)`).run();
    this.db.prepare(`CREATE INDEX IF NOT EXISTS idx_location_connections_from ON location_connections(from_location_id)`).run();
    this.db.prepare(`CREATE INDEX IF NOT EXISTS idx_location_connections_to ON location_connections(to_location_id)`).run();
  }

  // ==================== World CRUD ====================

  public createWorld(saveId: string, world: Partial<World>): WorldEntity {
    const id = this.generateId();
    const now = Math.floor(Date.now() / 1000);

    const stmt = this.db.prepare(`
      INSERT INTO worlds (
        id, save_id, name, description, type, regions,
        lore, history, rules, custom_data,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      saveId,
      world.name || 'New World',
      world.description || '',
      world.type || 'overworld',
      JSON.stringify(world.regions || []),
      world.lore || '',
      world.history || '',
      JSON.stringify(world.rules || {}),
      JSON.stringify(world.customData || {}),
      now,
      now
    );

    return this.findById(id)!;
  }

  public getWorld(worldId: string): World | null {
    const stmt = this.db.prepare<WorldEntity>(`SELECT * FROM worlds WHERE id = ?`);
    const entity = stmt.get(worldId);

    if (!entity) {
      return null;
    }

    return this.toWorld(entity);
  }

  public getWorldsBySaveId(saveId: string): World[] {
    const stmt = this.db.prepare<WorldEntity>(`SELECT * FROM worlds WHERE save_id = ?`);
    const entities = stmt.all(saveId);

    return entities.map(e => this.toWorld(e));
  }

  // ==================== Region CRUD ====================

  public createRegion(worldId: string, region: Partial<Region>): RegionEntity {
    const id = this.generateId();
    const now = Math.floor(Date.now() / 1000);

    const stmt = this.db.prepare(`
      INSERT INTO regions (
        id, world_id, name, description, type, locations, connections,
        climate, culture, dangers, is_discovered, is_accessible, custom_data,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      worldId,
      region.name || 'New Region',
      region.description || '',
      region.type || 'overworld',
      JSON.stringify(region.locations || []),
      JSON.stringify(region.connections || []),
      region.climate || 'temperate',
      region.culture || null,
      JSON.stringify(region.dangers || []),
      region.isDiscovered ? 1 : 0,
      region.isAccessible ? 1 : 1,
      JSON.stringify(region.customData || {}),
      now,
      now
    );

    return this.db.prepare<RegionEntity>(`SELECT * FROM regions WHERE id = ?`).get(id)!;
  }

  public getRegion(regionId: string): Region | null {
    const stmt = this.db.prepare<RegionEntity>(`SELECT * FROM regions WHERE id = ?`);
    const entity = stmt.get(regionId);

    if (!entity) {
      return null;
    }

    return this.toRegion(entity);
  }

  public getRegionsByWorldId(worldId: string): Region[] {
    const stmt = this.db.prepare<RegionEntity>(`SELECT * FROM regions WHERE world_id = ?`);
    const entities = stmt.all(worldId);

    return entities.map(e => this.toRegion(e));
  }

  // ==================== Location CRUD ====================

  public createLocation(regionId: string, location: Partial<Location>): LocationEntity {
    const id = this.generateId();
    const now = Math.floor(Date.now() / 1000);

    const stmt = this.db.prepare(`
      INSERT INTO locations (
        id, region_id, name, description, type, environment, features, events,
        npcs, items, encounters, connections, requirements, danger_level,
        population, services, tags, is_discovered, is_accessible, custom_data,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      regionId,
      location.name || 'New Location',
      location.description || '',
      location.type || 'wilderness',
      JSON.stringify(location.environment || {}),
      JSON.stringify(location.features || []),
      JSON.stringify(location.events || []),
      JSON.stringify(location.npcs || []),
      JSON.stringify(location.items || []),
      JSON.stringify(location.encounters || []),
      JSON.stringify(location.connections || []),
      location.requirements ? JSON.stringify(location.requirements) : null,
      location.dangerLevel ?? 1,
      location.population ?? null,
      JSON.stringify(location.services || []),
      JSON.stringify(location.tags || []),
      location.isDiscovered ? 1 : 0,
      location.isAccessible ? 1 : 1,
      JSON.stringify(location.customData || {}),
      now,
      now
    );

    return this.db.prepare<LocationEntity>(`SELECT * FROM locations WHERE id = ?`).get(id)!;
  }

  public getLocation(locationId: string): Location | null {
    const stmt = this.db.prepare<LocationEntity>(`SELECT * FROM locations WHERE id = ?`);
    const entity = stmt.get(locationId);

    if (!entity) {
      return null;
    }

    return this.toLocation(entity);
  }

  public getLocationsByRegionId(regionId: string): Location[] {
    const stmt = this.db.prepare<LocationEntity>(`SELECT * FROM locations WHERE region_id = ?`);
    const entities = stmt.all(regionId);

    return entities.map(e => this.toLocation(e));
  }

  public updateLocation(locationId: string, updates: Partial<Location>): boolean {
    const fields: string[] = [];
    const values: unknown[] = [];

    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.description !== undefined) {
      fields.push('description = ?');
      values.push(updates.description);
    }
    if (updates.isDiscovered !== undefined) {
      fields.push('is_discovered = ?');
      values.push(updates.isDiscovered ? 1 : 0);
    }
    if (updates.isAccessible !== undefined) {
      fields.push('is_accessible = ?');
      values.push(updates.isAccessible ? 1 : 0);
    }
    if (updates.environment !== undefined) {
      fields.push('environment = ?');
      values.push(JSON.stringify(updates.environment));
    }
    if (updates.npcs !== undefined) {
      fields.push('npcs = ?');
      values.push(JSON.stringify(updates.npcs));
    }
    if (updates.items !== undefined) {
      fields.push('items = ?');
      values.push(JSON.stringify(updates.items));
    }

    if (fields.length === 0) {
      return false;
    }

    fields.push('updated_at = strftime("%s", "now")');
    values.push(locationId);

    const stmt = this.db.prepare(`
      UPDATE locations SET ${fields.join(', ')} WHERE id = ?
    `);
    const result = stmt.run(...values);

    return result.changes > 0;
  }

  // ==================== Character Location ====================

  public getCharacterLocation(characterId: string): CharacterLocation | null {
    const stmt = this.db.prepare<CharacterLocationEntity>(
      `SELECT * FROM character_locations WHERE character_id = ?`
    );
    const entity = stmt.get(characterId);

    if (!entity) {
      return null;
    }

    return this.toCharacterLocation(entity);
  }

  public setCharacterLocation(characterId: string, location: CharacterLocation): boolean {
    const now = Math.floor(Date.now() / 1000);

    const stmt = this.db.prepare(`
      INSERT INTO character_locations (
        id, character_id, world_id, region_id, location_id,
        previous_locations, entered_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(character_id) DO UPDATE SET
        world_id = excluded.world_id,
        region_id = excluded.region_id,
        location_id = excluded.location_id,
        previous_locations = excluded.previous_locations,
        entered_at = excluded.entered_at,
        updated_at = excluded.updated_at
    `);

    const id = this.generateId();
    const result = stmt.run(
      id,
      characterId,
      location.worldId,
      location.regionId,
      location.locationId,
      JSON.stringify(location.previousLocations || []),
      location.enteredAt || now,
      now
    );

    return result.changes > 0;
  }

  // ==================== Explored Areas ====================

  public addExploredArea(characterId: string, locationId: string): ExploredArea {
    const now = Math.floor(Date.now() / 1000);

    const stmt = this.db.prepare(`
      INSERT INTO explored_areas (id, character_id, location_id, discovered_at, visit_count, last_visited_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(character_id, location_id) DO UPDATE SET
        visit_count = visit_count + 1,
        last_visited_at = excluded.last_visited_at
    `);

    const id = this.generateId();
    stmt.run(id, characterId, locationId, now, 1, now);

    const entity = this.db.prepare<ExploredAreaEntity>(
      `SELECT * FROM explored_areas WHERE character_id = ? AND location_id = ?`
    ).get(characterId, locationId)!;
    return this.toExploredArea(entity);
  }

  public getExploredAreas(characterId: string): ExploredArea[] {
    const stmt = this.db.prepare<ExploredAreaEntity>(
      `SELECT * FROM explored_areas WHERE character_id = ? ORDER BY discovered_at DESC`
    );
    const entities = stmt.all(characterId);

    return entities.map(e => this.toExploredArea(e));
  }

  public isExplored(characterId: string, locationId: string): boolean {
    const stmt = this.db.prepare<{ count: number }>(
      `SELECT COUNT(*) as count FROM explored_areas WHERE character_id = ? AND location_id = ?`
    );
    const result = stmt.get(characterId, locationId);

    return result ? result.count > 0 : false;
  }

  // ==================== Location Connections ====================

  public createConnection(connection: Partial<LocationConnection>): LocationConnectionEntity {
    const id = this.generateId();

    const stmt = this.db.prepare(`
      INSERT INTO location_connections (
        id, from_location_id, to_location_id, type, travel_time,
        requirements, bidirectional, discovered
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      connection.fromLocationId,
      connection.toLocationId,
      connection.type || 'road',
      connection.travelTime || 60,
      connection.requirements ? JSON.stringify(connection.requirements) : null,
      connection.bidirectional ? 1 : 0,
      connection.discovered ? 1 : 0
    );

    return this.db.prepare<LocationConnectionEntity>(`SELECT * FROM location_connections WHERE id = ?`).get(id)!;
  }

  public getConnections(locationId: string): LocationConnection[] {
    const stmt = this.db.prepare<LocationConnectionEntity>(
      `SELECT * FROM location_connections WHERE from_location_id = ? OR to_location_id = ?`
    );
    const entities = stmt.all(locationId, locationId);

    return entities.map(e => this.toLocationConnection(e));
  }

  public getDiscoveredConnections(characterId: string, locationId: string): LocationConnection[] {
    const explored = this.getExploredAreas(characterId);
    const exploredIds = new Set(explored.map(e => e.locationId));

    const stmt = this.db.prepare<LocationConnectionEntity>(
      `SELECT * FROM location_connections WHERE from_location_id = ? OR to_location_id = ?`
    );
    const entities = stmt.all(locationId, locationId);

    return entities
      .map(e => this.toLocationConnection(e))
      .filter(c => exploredIds.has(c.fromLocationId) && exploredIds.has(c.toLocationId));
  }

  // ==================== Statistics ====================

  public getStatistics(saveId: string): MapStatistics {
    const worlds = this.getWorldsBySaveId(saveId);
    const regions = worlds.flatMap(w => this.getRegionsByWorldId(w.id));
    const locations = regions.flatMap(r => this.getLocationsByRegionId(r.id));

    return {
      totalWorlds: worlds.length,
      totalRegions: regions.length,
      totalLocations: locations.length,
      discoveredLocations: locations.filter(l => l.isDiscovered).length,
      visitedLocations: 0,
      explorationPercentage: locations.length > 0
        ? Math.round((locations.filter(l => l.isDiscovered).length / locations.length) * 100)
        : 0,
    };
  }

  // ==================== Entity Conversion ====================

  public toWorld(entity: WorldEntity): World {
    return {
      id: entity.id,
      name: entity.name,
      description: entity.description,
      type: entity.type as World['type'],
      regions: JSON.parse(entity.regions || '[]') as Region[],
      lore: entity.lore,
      history: entity.history,
      rules: JSON.parse(entity.rules || '{}') as Record<string, unknown>,
      customData: JSON.parse(entity.custom_data || '{}') as Record<string, unknown>,
      createdAt: entity.created_at ?? Math.floor(Date.now() / 1000),
      updatedAt: entity.updated_at ?? Math.floor(Date.now() / 1000),
    };
  }

  public toRegion(entity: RegionEntity): Region {
    return {
      id: entity.id,
      worldId: entity.world_id,
      name: entity.name,
      description: entity.description,
      type: entity.type as Region['type'],
      locations: JSON.parse(entity.locations || '[]') as Location[],
      connections: JSON.parse(entity.connections || '[]'),
      climate: entity.climate,
      culture: entity.culture ?? undefined,
      dangers: JSON.parse(entity.dangers || '[]') as string[],
      isDiscovered: entity.is_discovered === 1,
      isAccessible: entity.is_accessible === 1,
      customData: JSON.parse(entity.custom_data || '{}') as Record<string, unknown>,
    };
  }

  public toLocation(entity: LocationEntity): Location {
    return {
      id: entity.id,
      regionId: entity.region_id,
      name: entity.name,
      description: entity.description,
      type: entity.type,
      environment: JSON.parse(entity.environment || '{}') as Location['environment'],
      features: JSON.parse(entity.features || '[]') as Location['features'],
      events: JSON.parse(entity.events || '[]') as Location['events'],
      npcs: JSON.parse(entity.npcs || '[]') as string[],
      items: JSON.parse(entity.items || '[]') as string[],
      encounters: JSON.parse(entity.encounters || '[]') as string[],
      connections: JSON.parse(entity.connections || '[]') as string[],
      requirements: entity.requirements ? JSON.parse(entity.requirements) as Location['requirements'] : undefined,
      dangerLevel: entity.danger_level,
      population: entity.population ?? undefined,
      services: JSON.parse(entity.services || '[]') as string[],
      tags: JSON.parse(entity.tags || '[]') as string[],
      isDiscovered: entity.is_discovered === 1,
      isAccessible: entity.is_accessible === 1,
      customData: JSON.parse(entity.custom_data || '{}') as Record<string, unknown>,
    };
  }

  public toCharacterLocation(entity: CharacterLocationEntity): CharacterLocation {
    return {
      characterId: entity.character_id,
      worldId: entity.world_id,
      regionId: entity.region_id,
      locationId: entity.location_id,
      previousLocations: JSON.parse(entity.previous_locations || '[]') as CharacterLocation['previousLocations'],
      enteredAt: entity.entered_at,
      updatedAt: entity.updated_at,
    };
  }

  public toExploredArea(entity: ExploredAreaEntity): ExploredArea {
    return {
      characterId: entity.character_id,
      locationId: entity.location_id,
      discoveredAt: entity.discovered_at,
      visitCount: entity.visit_count,
      lastVisitedAt: entity.last_visited_at,
    };
  }

  public toLocationConnection(entity: LocationConnectionEntity): LocationConnection {
    return {
      id: entity.id,
      fromLocationId: entity.from_location_id,
      toLocationId: entity.to_location_id,
      type: entity.type as LocationConnection['type'],
      travelTime: entity.travel_time,
      requirements: entity.requirements ? JSON.parse(entity.requirements) as LocationConnection['requirements'] : undefined,
      bidirectional: entity.bidirectional === 1,
      discovered: entity.discovered === 1,
    };
  }
}

let _mapRepository: MapRepository | null = null;

export function getMapRepository(): MapRepository {
  if (!_mapRepository) {
    _mapRepository = MapRepository.getInstance();
  }
  return _mapRepository;
}

export const mapRepository = {
  get instance() {
    return getMapRepository();
  },
};
