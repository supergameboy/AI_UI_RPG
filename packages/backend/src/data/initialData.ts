/**
 * 游戏初始化配置数据
 * 定义角色创建时的初始技能、物品、装备、金币和位置
 */

// ==================== 初始技能配置（按职业）====================

/**
 * 各职业初始技能ID列表
 */
export const INITIAL_SKILLS: Record<string, string[]> = {
  warrior: ['slash', 'defensive_stance', 'power_strike'],
  mage: ['fireball', 'ice_shield', 'mana_regen'],
  rogue: ['backstab', 'stealth', 'poison_blade'],
  cleric: ['heal', 'bless', 'holy_light'],
  ranger: ['aimed_shot', 'trap', 'nature_bond'],
  paladin: ['holy_strike', 'divine_shield', 'lay_on_hands'],
  necromancer: ['summon_undead', 'drain_life', 'bone_armor'],
  bard: ['inspiring_song', 'dissonant_whisper', 'healing_melody'],
  monk: ['flurry_of_blows', 'patient_defense', 'step_of_the_wind'],
  druid: ['wild_shape', 'entangle', 'healing_spirit'],
};

// ==================== 初始物品配置（按背景）====================

/**
 * 初始物品配置接口
 */
export interface InitialItemConfig {
  itemId: string;
  quantity: number;
}

/**
 * 各背景初始物品配置
 */
export const INITIAL_ITEMS: Record<string, InitialItemConfig[]> = {
  noble: [
    { itemId: 'gold_ring', quantity: 1 },
    { itemId: 'fine_clothes', quantity: 1 },
    { itemId: 'signet_ring', quantity: 1 },
    { itemId: 'gold_coin', quantity: 100 },
    { itemId: 'noble_document', quantity: 1 },
  ],
  peasant: [
    { itemId: 'simple_clothes', quantity: 1 },
    { itemId: 'bread', quantity: 5 },
    { itemId: 'water_skin', quantity: 1 },
    { itemId: 'gold_coin', quantity: 10 },
    { itemId: 'tool_set', quantity: 1 },
  ],
  merchant: [
    { itemId: 'merchant_clothes', quantity: 1 },
    { itemId: 'trade_goods', quantity: 3 },
    { itemId: 'merchant_ledger', quantity: 1 },
    { itemId: 'gold_coin', quantity: 50 },
    { itemId: 'traveler_pack', quantity: 1 },
  ],
  soldier: [
    { itemId: 'military_uniform', quantity: 1 },
    { itemId: 'rations', quantity: 5 },
    { itemId: 'whetstone', quantity: 1 },
    { itemId: 'gold_coin', quantity: 25 },
    { itemId: 'military_badge', quantity: 1 },
  ],
  scholar: [
    { itemId: 'scholar_robe', quantity: 1 },
    { itemId: 'book', quantity: 2 },
    { itemId: 'ink_and_quill', quantity: 1 },
    { itemId: 'gold_coin', quantity: 15 },
    { itemId: 'research_notes', quantity: 1 },
  ],
  orphan: [
    { itemId: 'worn_clothes', quantity: 1 },
    { itemId: 'lucky_charm', quantity: 1 },
    { itemId: 'gold_coin', quantity: 5 },
    { itemId: 'stolen_loaf', quantity: 1 },
  ],
  criminal: [
    { itemId: 'dark_clothes', quantity: 1 },
    { itemId: 'lockpick_set', quantity: 1 },
    { itemId: 'hidden_dagger', quantity: 1 },
    { itemId: 'gold_coin', quantity: 20 },
    { itemId: 'fake_documents', quantity: 1 },
  ],
  artisan: [
    { itemId: 'work_clothes', quantity: 1 },
    { itemId: 'crafting_tools', quantity: 1 },
    { itemId: 'raw_materials', quantity: 3 },
    { itemId: 'gold_coin', quantity: 30 },
    { itemId: 'guild_membership', quantity: 1 },
  ],
  acolyte: [
    { itemId: 'priest_vestments', quantity: 1 },
    { itemId: 'prayer_book', quantity: 1 },
    { itemId: 'incense', quantity: 5 },
    { itemId: 'gold_coin', quantity: 15 },
    { itemId: 'holy_symbol', quantity: 1 },
  ],
  outlander: [
    { itemId: 'traveler_clothes', quantity: 1 },
    { itemId: 'hunting_trap', quantity: 1 },
    { itemId: 'herbalism_kit', quantity: 1 },
    { itemId: 'gold_coin', quantity: 10 },
    { itemId: 'regional_map', quantity: 1 },
  ],
};

// ==================== 初始装备配置（按职业）====================

/**
 * 初始装备配置接口
 */
export interface InitialEquipmentConfig {
  weapon?: string;
  head?: string;
  body?: string;
  feet?: string;
  accessory?: string;
}

/**
 * 各职业初始装备配置
 */
export const INITIAL_EQUIPMENT: Record<string, InitialEquipmentConfig> = {
  warrior: {
    weapon: 'iron_sword',
    body: 'leather_armor',
    feet: 'iron_boots',
  },
  mage: {
    weapon: 'wooden_staff',
    body: 'mage_robe',
    accessory: 'mana_crystal',
  },
  rogue: {
    weapon: 'dagger',
    body: 'leather_vest',
    feet: 'soft_boots',
  },
  cleric: {
    weapon: 'mace',
    body: 'priest_robe',
    accessory: 'holy_symbol',
  },
  ranger: {
    weapon: 'hunting_bow',
    body: 'hunter_gear',
    feet: 'traveler_boots',
  },
  paladin: {
    weapon: 'longsword',
    body: 'chain_mail',
    accessory: 'divine_symbol',
  },
  necromancer: {
    weapon: 'death_staff',
    body: 'dark_robe',
    accessory: 'soul_gem',
  },
  bard: {
    weapon: 'lute',
    body: 'performer_outfit',
    accessory: 'lucky_coin',
  },
  monk: {
    weapon: 'quarterstaff',
    body: 'monk_robe',
    feet: 'cloth_wraps',
  },
  druid: {
    weapon: 'druid_staff',
    body: 'nature_robe',
    accessory: 'nature_amulet',
  },
};

// ==================== 初始金币配置（按背景）====================

/**
 * 各背景初始金币数量
 */
export const INITIAL_GOLD: Record<string, number> = {
  noble: 100,
  merchant: 50,
  artisan: 30,
  soldier: 25,
  criminal: 20,
  scholar: 15,
  acolyte: 15,
  peasant: 10,
  outlander: 10,
  orphan: 5,
};

// ==================== 初始位置配置 ====================

/**
 * 初始位置配置接口
 */
export interface InitialLocationConfig {
  worldId: string;
  regionId: string;
  locationId: string;
}

/**
 * 默认初始位置
 */
export const INITIAL_LOCATION: InitialLocationConfig = {
  worldId: 'starting_world',
  regionId: 'starting_region',
  locationId: 'starting_town',
};

// ==================== 初始属性配置 ====================

/**
 * 基础属性名称类型
 */
export type AttributeName = 'strength' | 'dexterity' | 'constitution' | 'intelligence' | 'wisdom' | 'charisma';

/**
 * 基础属性默认值
 */
export const BASE_ATTRIBUTE_VALUES: Record<AttributeName, number> = {
  strength: 10,
  dexterity: 10,
  constitution: 10,
  intelligence: 10,
  wisdom: 10,
  charisma: 10,
};

/**
 * 各种族属性加成
 */
export const RACE_ATTRIBUTE_BONUSES: Record<string, Record<string, number>> = {
  human: { strength: 1, dexterity: 1, constitution: 1, intelligence: 1, wisdom: 1, charisma: 1 },
  elf: { dexterity: 2, intelligence: 2, constitution: -2 },
  dwarf: { constitution: 2, wisdom: 2, charisma: -2 },
  halfling: { dexterity: 2, charisma: 2, strength: -2 },
  orc: { strength: 3, constitution: 1, intelligence: -2, charisma: -2 },
  gnome: { intelligence: 2, wisdom: 1, strength: -2 },
  tiefling: { intelligence: 1, charisma: 2, wisdom: 1 },
  dragonborn: { strength: 2, charisma: 1, dexterity: -1 },
};

/**
 * 各职业主要属性
 */
export const CLASS_PRIMARY_ATTRIBUTES: Record<string, string[]> = {
  warrior: ['strength', 'constitution'],
  mage: ['intelligence', 'wisdom'],
  rogue: ['dexterity', 'charisma'],
  cleric: ['wisdom', 'charisma'],
  ranger: ['dexterity', 'wisdom'],
  paladin: ['strength', 'charisma'],
  necromancer: ['intelligence', 'wisdom'],
  bard: ['charisma', 'dexterity'],
  monk: ['dexterity', 'wisdom'],
  druid: ['wisdom', 'intelligence'],
};

// ==================== 初始生命值和魔法值配置 ====================

/**
 * 各职业生命骰（决定最大HP）
 */
export const CLASS_HIT_DICE: Record<string, string> = {
  warrior: 'd12',
  paladin: 'd10',
  ranger: 'd10',
  monk: 'd8',
  rogue: 'd8',
  bard: 'd8',
  cleric: 'd8',
  druid: 'd8',
  mage: 'd6',
  necromancer: 'd6',
};

/**
 * 根据生命骰计算基础HP
 */
export const HIT_DICE_BASE_HP: Record<string, number> = {
  d4: 4,
  d6: 6,
  d8: 8,
  d10: 10,
  d12: 12,
};

/**
 * 各职业基础魔法值
 */
export const CLASS_BASE_MP: Record<string, number> = {
  mage: 20,
  necromancer: 18,
  cleric: 15,
  druid: 15,
  bard: 12,
  paladin: 10,
  ranger: 8,
  monk: 6,
  rogue: 4,
  warrior: 0,
};

// ==================== 初始状态效果 ====================

/**
 * 初始状态效果（通常为空）
 */
export const INITIAL_STATUS_EFFECTS: never[] = [];

// ==================== 辅助函数 ====================

/**
 * 获取职业初始技能
 */
export function getInitialSkills(classId: string): string[] {
  return INITIAL_SKILLS[classId] || [];
}

/**
 * 获取背景初始物品
 */
export function getInitialItems(backgroundId: string): InitialItemConfig[] {
  return INITIAL_ITEMS[backgroundId] || [];
}

/**
 * 获取职业初始装备
 */
export function getInitialEquipment(classId: string): InitialEquipmentConfig {
  return INITIAL_EQUIPMENT[classId] || {};
}

/**
 * 获取背景初始金币
 */
export function getInitialGold(backgroundId: string): number {
  return INITIAL_GOLD[backgroundId] || 10;
}

/**
 * 计算初始属性值
 * @param raceId 种族ID
 * @param _classId 职业ID（预留扩展）
 * @param _backgroundId 背景ID（预留扩展）
 */
export function calculateInitialAttributes(
  raceId: string,
  _classId: string,
  _backgroundId: string
): Record<string, number> {
  const baseAttributes: Record<string, number> = { ...BASE_ATTRIBUTE_VALUES };
  const raceBonuses = RACE_ATTRIBUTE_BONUSES[raceId] || {};

  // 应用种族加成
  for (const [attr, bonus] of Object.entries(raceBonuses)) {
    baseAttributes[attr] = (baseAttributes[attr] || 10) + bonus;
  }

  return baseAttributes;
}

/**
 * 计算初始HP
 */
export function calculateInitialHP(classId: string, constitution: number): number {
  const hitDice = CLASS_HIT_DICE[classId] || 'd8';
  const baseHP = HIT_DICE_BASE_HP[hitDice] || 8;
  const conModifier = Math.floor((constitution - 10) / 2);
  return baseHP + conModifier;
}

/**
 * 计算初始MP
 */
export function calculateInitialMP(classId: string, intelligence: number, wisdom: number): number {
  const baseMP = CLASS_BASE_MP[classId] || 0;
  const intModifier = Math.floor((intelligence - 10) / 2);
  const wisModifier = Math.floor((wisdom - 10) / 2);
  return Math.max(0, baseMP + intModifier + wisModifier);
}
