export interface StoryTemplate {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  tags: string[];

  gameMode: 'text_adventure' | 'turn_based_rpg' | 'visual_novel' | 'dynamic_combat';

  worldSetting: WorldSetting;

  characterCreation: CharacterCreationRules;

  gameRules: GameRules;

  aiConstraints: AIConstraints;

  startingScene: StartingScene;
}

export interface WorldSetting {
  name: string;
  description: string;
  era: string;
  magicSystem?: string;
  technologyLevel: string;
  customFields: Record<string, string>;
}

export interface CharacterCreationRules {
  races: RaceDefinition[];
  classes: ClassDefinition[];
  backgrounds: BackgroundDefinition[];
  attributes: AttributeDefinition[];
  customOptions?: CustomOption[];
}

export interface RaceDefinition {
  id: string;
  name: string;
  description: string;
  bonuses: Record<string, number>;
  penalties: Record<string, number>;
  abilities: string[];
  availableClasses: string[];
}

export interface ClassDefinition {
  id: string;
  name: string;
  description: string;
  primaryAttributes: string[];
  hitDie: string;
  skillProficiencies: string[];
  startingEquipment: string[];
}

export interface BackgroundDefinition {
  id: string;
  name: string;
  description: string;
  skillProficiencies: string[];
  languages: string[];
  equipment: string[];
  feature: string;
}

export interface AttributeDefinition {
  id: string;
  name: string;
  abbreviation: string;
  description: string;
  defaultValue: number;
  minValue: number;
  maxValue: number;
}

export interface CustomOption {
  id: string;
  name: string;
  type: 'select' | 'text' | 'number' | 'boolean';
  options?: string[];
  defaultValue: string | number | boolean;
}

export interface GameRules {
  combatSystem: CombatRuleSet;
  skillSystem: SkillRuleSet;
  inventorySystem: InventoryRuleSet;
  questSystem: QuestRuleSet;
  customRules?: CustomRule[];
}

export interface CombatRuleSet {
  type: 'turn_based' | 'real_time' | 'hybrid';
  initiativeType: 'dexterity' | 'random' | 'custom';
  actionPoints: number;
  criticalHit: {
    threshold: number;
    multiplier: number;
  };
}

export interface SkillRuleSet {
  maxLevel: number;
  upgradeCost: {
    base: number;
    multiplier: number;
  };
  cooldownSystem: 'turn' | 'time' | 'none';
}

export interface InventoryRuleSet {
  maxSlots: number;
  stackSizes: Record<string, number>;
  weightSystem: boolean;
}

export interface QuestRuleSet {
  maxActive: number;
  failConditions: string[];
  timeSystem: boolean;
}

export interface CustomRule {
  id: string;
  name: string;
  description: string;
  value: unknown;
}

export interface AIConstraints {
  tone: 'serious' | 'humorous' | 'dark' | 'romantic' | 'custom';
  contentRating: 'everyone' | 'teen' | 'mature';
  prohibitedTopics: string[];
  requiredElements: string[];
}

export interface StartingScene {
  location: string;
  description: string;
  npcs: NPCDefinition[];
  items: ItemDefinition[];
  quests: QuestDefinition[];
}

export interface NPCDefinition {
  id: string;
  name: string;
  title?: string;
  description: string;
  role: 'merchant' | 'quest_giver' | 'enemy' | 'ally' | 'neutral' | 'custom';
  personality?: string;
  dialogue?: string[];
  stats?: {
    level?: number;
    hp?: number;
    attack?: number;
    defense?: number;
    [key: string]: number | undefined;
  };
  services?: ('shop' | 'inn' | 'blacksmith' | 'healer' | 'training')[];
  customData?: Record<string, unknown>;
}

export interface ItemDefinition {
  id: string;
  name: string;
  description: string;
  type: 'weapon' | 'armor' | 'accessory' | 'consumable' | 'material' | 'quest' | 'misc';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'unique';
  stats?: Record<string, number>;
  effects?: {
    type: string;
    value: number;
    duration?: number;
  }[];
  value?: {
    buy: number;
    sell: number;
    currency: string;
  };
  quantity?: number;
  customData?: Record<string, unknown>;
}

export interface QuestDefinition {
  id: string;
  name: string;
  description: string;
  type: 'main' | 'side' | 'daily' | 'hidden';
  objectives: {
    id: string;
    description: string;
    type: 'kill' | 'collect' | 'talk' | 'explore' | 'custom';
    target: string;
    required: number;
  }[];
  rewards?: {
    type: 'experience' | 'currency' | 'item' | 'skill' | 'reputation' | 'custom';
    value: number | string;
    quantity?: number;
  }[];
  giver?: string;
  timeLimit?: number;
  customData?: Record<string, unknown>;
}
