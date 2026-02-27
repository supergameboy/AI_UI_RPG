export interface Item {
  id: string;
  name: string;
  description: string;
  type: 'weapon' | 'armor' | 'accessory' | 'consumable' | 'material' | 'quest' | 'misc';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'unique';

  stats: Record<string, number>;

  effects: ItemEffect[];

  requirements: ItemRequirements;

  value: {
    buy: number;
    sell: number;
    currency: string;
  };

  stackable: boolean;
  maxStack: number;

  imagePrompt?: string;
  generatedImage?: string;
}

export interface ItemEffect {
  type: string;
  value: number;
  duration?: number;
  condition?: string;
}

export interface ItemRequirements {
  level?: number;
  class?: string[];
  attributes?: Record<string, number>;
  custom?: string[];
}

export type EquipmentSlotType = 'weapon' | 'head' | 'body' | 'feet' | 'accessory' | string;
