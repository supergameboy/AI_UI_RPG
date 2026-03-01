export interface Character {
  id: string;
  name: string;
  race: string;
  class: string;
  level: number;
  experience: number;

  baseAttributes: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
    customStats?: Record<string, number>;
  };

  derivedAttributes: {
    maxHp: number;
    currentHp: number;
    maxMp: number;
    currentMp: number;
    attack: number;
    defense: number;
    speed: number;
    luck: number;
    customStats?: Record<string, number>;
  };

  skills: Skill[];

  equipment: {
    weapon?: string;
    head?: string;
    body?: string;
    feet?: string;
    accessory?: string[];
    customSlots?: Record<string, string>;
  };

  inventory: InventoryItem[];

  currency: Record<string, number>;

  statusEffects: StatusEffect[];

  appearance: string;
  imagePrompt?: string;
  personality: string;
  backstory: string;

  statistics: {
    battlesWon: number;
    questsCompleted: number;
    distanceTraveled: number;
    itemsCrafted: number;
    npcsMet: number;
    playTime: number;
  };
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  level: number;
  maxLevel: number;
  type: 'active' | 'passive';
  cost: {
    type: 'mp' | 'hp' | 'item' | 'custom';
    value: number;
  };
  cooldown: number;
  effects: SkillEffect[];
  requirements?: SkillRequirement[];
}

export interface SkillEffect {
  type: string;
  value: number;
  duration?: number;
  condition?: string;
}

export interface SkillRequirement {
  type: 'level' | 'attribute' | 'skill' | 'item';
  value: number | string;
}

export interface StatusEffect {
  id: string;
  name: string;
  type: 'buff' | 'debuff' | 'neutral';
  duration: number;
  remainingTurns: number;
  effects: {
    attribute: string;
    modifier: number;
    type: 'flat' | 'percent';
  }[];
}

export interface InventoryItem {
  id: string;
  itemId: string;
  quantity: number;
  equipped: boolean;
  equipmentSlot?: string;
  obtainedAt: number;
  customData?: Record<string, unknown>;
}
