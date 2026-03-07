import type { LocationConnection } from './world';

export interface GameMap {
  id: string;
  name: string;
  description: string;
  type: 'overworld' | 'dungeon' | 'town' | 'building' | 'custom';

  size: {
    width: number;
    height: number;
  };

  tiles: MapTile[][];

  locations: MapLocation[];

  connections: LocationConnection[];

  encounters: MapEncounter[];

  npcs: string[];

  items: MapItem[];
}

export interface MapTile {
  type: string;
  walkable: boolean;
  properties: Record<string, unknown>;
}

export interface MapLocation {
  id: string;
  name: string;
  type: string;
  position: {
    x: number;
    y: number;
  };
  description: string;
  discovered: boolean;
}

export interface MapConnection {
  from: string;
  to: string;
  type: 'bidirectional' | 'oneway';
  requirements?: string[];
}

export interface MapEncounter {
  id: string;
  type: 'combat' | 'event' | 'treasure';
  position: {
    x: number;
    y: number;
  };
  trigger: 'step' | 'interact' | 'random';
  probability: number;
  data: Record<string, unknown>;
}

export interface MapItem {
  itemId: string;
  position: {
    x: number;
    y: number;
  };
  quantity: number;
  hidden: boolean;
}
