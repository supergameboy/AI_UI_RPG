import type { SkillEffect, SkillRequirement } from './skill';

export interface Character {
  id: string;
  name: string;
  race: string;
  class: string;
  level: number;
  experience: number;
  /** 升级所需经验值 */
  experienceToLevel?: number;

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
  backgroundId?: string; // 背景模板 ID（如 'soldier', 'noble', 'peasant' 等）

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
  /** 技能分类 */
  category?: import('./skill').SkillCategory;
  cost: {
    type: 'mp' | 'hp' | 'item' | 'custom';
    value: number;
  };
  cooldown: number;
  effects: SkillEffect[];
  requirements?: SkillRequirement[];
}

// Re-export SkillEffect and SkillRequirement for backward compatibility
export type { SkillEffect, SkillRequirement } from './skill';

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
  /** 物品类型（从 item.type 复制，便于快速筛选） */
  type?: import('./item').ItemType;
  /** 物品详情（可选） */
  item?: import('./item').Item;
}
