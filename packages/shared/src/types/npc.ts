export type RelationshipType = 'neutral' | 'friendly' | 'hostile' | 'romantic' | 'custom';

export type NPCRole = 'merchant' | 'quest_giver' | 'enemy' | 'ally' | 'neutral' | 'romance' | 'companion' | 'custom';

export type NPCDisposition = 'helpful' | 'neutral' | 'unfriendly' | 'hostile';

export interface NPCPersonality {
  traits: string[];
  values: string[];
  fears: string[];
  desires: string[];
  quirks: string[];
  speech_style: string;
}

export interface NPCRelationship {
  characterId: string;
  npcId: string;
  type: RelationshipType;
  level: number;
  trustLevel: number;
  respectLevel: number;
  affectionLevel: number;
  fearLevel: number;
  
  interactionCount: number;
  lastInteractionAt: number | null;
  firstMetAt: number;
  
  flags: {
    met: boolean;
    befriended: boolean;
    romanced: boolean;
    betrayed: boolean;
    killed: boolean;
    custom: Record<string, boolean>;
  };
  
  notes: string[];
  customData: Record<string, unknown>;
}

export interface NPCStatus {
  health: number;
  maxHealth: number;
  mood: 'happy' | 'neutral' | 'sad' | 'angry' | 'fearful' | 'excited';
  currentLocation: string;
  isAvailable: boolean;
  isAlive: boolean;
  
  schedule: NPCSchedule[];
  currentActivity: string | null;
  
  statusEffects: string[];
  customData: Record<string, unknown>;
}

export interface NPCSchedule {
  id: string;
  dayOfWeek?: number[];
  startTime: string;
  endTime: string;
  location: string;
  activity: string;
  priority: number;
}

export interface NPCFlags {
  isCompanion: boolean;
  isMerchant: boolean;
  isQuestGiver: boolean;
  isRomanceable: boolean;
  isEssential: boolean;
  isHostile: boolean;
  isInvulnerable: boolean;
  canFollow: boolean;
  canTrade: boolean;
  canFight: boolean;
  customFlags: Record<string, boolean>;
}

export interface NPCStats {
  level: number;
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
  
  attack: number;
  defense: number;
  speed: number;
  
  customStats: Record<string, number>;
}

export interface NPC {
  id: string;
  saveId: string;
  
  name: string;
  title: string;
  race: string;
  occupation: string;
  
  appearance: {
    description: string;
    height: string;
    build: string;
    hairColor: string;
    eyeColor: string;
    distinguishingFeatures: string[];
    imagePrompt?: string;
  };
  
  personality: NPCPersonality;
  status: NPCStatus;
  stats: NPCStats;
  flags: NPCFlags;
  
  role: NPCRole;
  disposition: NPCDisposition;
  
  dialogue: {
    greetings: string[];
    farewells: string[];
    idle: string[];
    combat: string[];
    custom: Record<string, string[]>;
  };
  
  services: string[];
  inventory: string[];
  quests: string[];
  
  relationships: Record<string, NPCRelationship>;
  
  backstory: string;
  secrets: string[];
  
  customData: Record<string, unknown>;
  
  createdAt: number;
  updatedAt: number;
}

export interface PartyMember {
  npcId: string;
  characterId: string;
  joinedAt: number;
  
  role: 'tank' | 'dps' | 'healer' | 'support' | 'custom';
  position: number;
  
  orders: {
    followDistance: 'close' | 'normal' | 'far';
    combatBehavior: 'aggressive' | 'defensive' | 'passive';
    autoUseSkills: boolean;
    autoHeal: boolean;
  };
  
  customData: Record<string, unknown>;
}

export interface PartyState {
  characterId: string;
  members: PartyMember[];
  maxSize: number;
  formation: 'line' | 'column' | 'spread' | 'custom';
  customData: Record<string, unknown>;
}

export interface InteractionResult {
  success: boolean;
  relationship: NPCRelationship;
  dialogueResponse: string;
  effects: {
    relationshipChange: number;
    trustChange: number;
    itemsGiven: string[];
    itemsReceived: string[];
    questsStarted: string[];
    questsCompleted: string[];
    customEffects: Record<string, unknown>;
  };
  message: string;
}

export interface InteractionRequest {
  characterId: string;
  npcId: string;
  type: 'talk' | 'trade' | 'gift' | 'quest' | 'recruit' | 'dismiss' | 'romance' | 'attack' | 'custom';
  data?: Record<string, unknown>;
}

export interface InteractionResponse {
  success: boolean;
  result: InteractionResult;
}

export interface NPCFilter {
  saveId?: string;
  locationId?: string;
  role?: NPCRole;
  race?: string;
  isAlive?: boolean;
  isCompanion?: boolean;
  isMerchant?: boolean;
  isQuestGiver?: boolean;
  relationshipType?: RelationshipType;
  minRelationshipLevel?: number;
  maxRelationshipLevel?: number;
}

export interface NPCStatistics {
  total: number;
  byRole: Record<NPCRole, number>;
  byDisposition: Record<NPCDisposition, number>;
  aliveCount: number;
  deadCount: number;
  companionsCount: number;
  merchantsCount: number;
  questGiversCount: number;
}

export interface GetNPCResponse {
  success: boolean;
  npc: NPC;
  relationship: NPCRelationship | null;
}

export interface GetNPCsResponse {
  success: boolean;
  npcs: NPC[];
  statistics: NPCStatistics;
}

export interface GetRelationshipResponse {
  success: boolean;
  relationship: NPCRelationship;
}

export interface UpdateRelationshipRequest {
  characterId: string;
  npcId: string;
  type?: RelationshipType;
  levelChange?: number;
  trustChange?: number;
  respectChange?: number;
  affectionChange?: number;
  fearChange?: number;
  notes?: string;
}

export interface UpdateRelationshipResponse {
  success: boolean;
  relationship: NPCRelationship;
  message: string;
}

export interface GetPartyResponse {
  success: boolean;
  party: PartyState;
  npcs: NPC[];
}

export interface AddPartyMemberRequest {
  characterId: string;
  npcId: string;
  role?: PartyMember['role'];
}

export interface AddPartyMemberResponse {
  success: boolean;
  party: PartyState;
  npc: NPC;
  message: string;
}

export interface RemovePartyMemberRequest {
  characterId: string;
  npcId: string;
}

export interface RemovePartyMemberResponse {
  success: boolean;
  party: PartyState;
  message: string;
}

export interface NPCTemplate {
  id: string;
  name: string;
  race: string;
  occupation: string;
  role: NPCRole;
  
  baseStats: Partial<NPCStats>;
  personality: Partial<NPCPersonality>;
  appearance: Partial<NPC['appearance']>;
  
  dialogue: Partial<NPC['dialogue']>;
  services: string[];
  
  isUnique: boolean;
  spawnLocations: string[];
  spawnConditions: Record<string, unknown>;
  
  customData: Record<string, unknown>;
}
