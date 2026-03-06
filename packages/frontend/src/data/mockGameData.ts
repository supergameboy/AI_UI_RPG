import type {
  Character,
  ExtendedSkill,
  SkillCooldownState,
  InventorySlot,
  EquipmentState,
  EquippedItem,
  Item,
  Quest,
  NPC,
  NPCRelationship,
  JournalEntry,
  GameMap,
  MapLocation,
  DynamicUIData,
  SkillState,
  InventoryGameState,
  QuestState,
  NPCGameState,
  MapGameState,
} from '@ai-rpg/shared';

const now = Date.now();

export const mockCharacter: Character = {
  id: 'char_001',
  name: '艾瑞克',
  race: '人类',
  class: '战士',
  level: 5,
  experience: 2450,

  baseAttributes: {
    strength: 18,
    dexterity: 12,
    constitution: 16,
    intelligence: 10,
    wisdom: 11,
    charisma: 14,
  },

  derivedAttributes: {
    maxHp: 150,
    currentHp: 142,
    maxMp: 40,
    currentMp: 35,
    attack: 45,
    defense: 38,
    speed: 15,
    luck: 8,
  },

  skills: [],

  equipment: {
    weapon: 'item_weapon_001',
    head: undefined,
    body: 'item_armor_001',
    feet: 'item_boots_001',
    accessory: ['item_ring_001'],
  },

  inventory: [],

  currency: {
    gold: 325,
    silver: 50,
  },

  statusEffects: [],

  appearance: '身材魁梧的男性，有着一头黑色短发和坚毅的眼神。左脸颊有一道浅浅的伤疤，据说是从前在王国骑士团服役时留下的。',
  imagePrompt: 'A battle-hardened warrior with short black hair, determined eyes, and a faint scar on his left cheek, wearing iron armor',
  personality: '正直、勇敢、有责任感。虽然已经离开骑士团，但仍然保持着骑士的荣誉准则。',
  backstory: '曾是王国骑士团的一员，在一次边境冲突中因违抗上级命令保护平民而被逐出骑士团。现在作为一名冒险者游历大陆，寻找能够证明自己的机会。',

  statistics: {
    battlesWon: 23,
    questsCompleted: 7,
    distanceTraveled: 450,
    itemsCrafted: 3,
    npcsMet: 12,
    playTime: 7200,
  },
};

export const mockSkills: ExtendedSkill[] = [
  {
    id: 'skill_001',
    name: '基础剑术',
    description: '使用剑类武器进行基础攻击，造成物理伤害。',
    type: 'active',
    category: 'combat',
    costs: [{ type: 'stamina', value: 5 }],
    cooldown: 0,
    effects: [{ type: 'physical_damage', value: 25 }],
    requirements: [{ type: 'level', value: 1 }],
    level: 3,
    maxLevel: 10,
    targetType: 'single_enemy',
    range: { type: 'melee', maxDistance: 1 },
    tags: ['weapon', 'physical', 'basic'],
  },
  {
    id: 'skill_002',
    name: '盾牌防御',
    description: '举起盾牌进行防御，减少受到的伤害。',
    type: 'active',
    category: 'combat',
    costs: [{ type: 'stamina', value: 15 }],
    cooldown: 3,
    effects: [
      { type: 'damage_reduction', value: 50, duration: 2 },
      { type: 'block_chance', value: 25, duration: 2 },
    ],
    requirements: [{ type: 'level', value: 2 }],
    level: 2,
    maxLevel: 10,
    targetType: 'self',
    tags: ['defensive', 'shield'],
  },
  {
    id: 'skill_003',
    name: '冲锋',
    description: '向敌人发起冲锋，造成伤害并使其短暂眩晕。',
    type: 'active',
    category: 'combat',
    costs: [{ type: 'stamina', value: 20 }],
    cooldown: 5,
    effects: [
      { type: 'physical_damage', value: 40 },
      { type: 'stun', value: 1, duration: 1 },
    ],
    requirements: [{ type: 'level', value: 3 }],
    level: 1,
    maxLevel: 10,
    targetType: 'single_enemy',
    range: { type: 'ranged', minDistance: 2, maxDistance: 5 },
    tags: ['movement', 'control', 'physical'],
  },
  {
    id: 'skill_004',
    name: '战吼',
    description: '发出震耳欲聋的战吼，提升自身攻击力并威慑敌人。',
    type: 'active',
    category: 'combat',
    costs: [{ type: 'mana', value: 10 }],
    cooldown: 8,
    effects: [
      { type: 'attack_boost', value: 20, duration: 3 },
      { type: 'fear_chance', value: 30 },
    ],
    requirements: [{ type: 'level', value: 4 }],
    level: 1,
    maxLevel: 5,
    targetType: 'self',
    tags: ['buff', 'debuff', 'mental'],
  },
  {
    id: 'skill_005',
    name: '坚韧体质',
    description: '被动技能：提升最大生命值和生命恢复速度。',
    type: 'passive',
    category: 'combat',
    costs: [],
    cooldown: 0,
    effects: [
      { type: 'max_hp_boost', value: 20 },
      { type: 'hp_regen', value: 2 },
    ],
    requirements: [{ type: 'level', value: 1 }],
    level: 2,
    maxLevel: 5,
    targetType: 'self',
    tags: ['passive', 'survival'],
  },
  {
    id: 'skill_006',
    name: '旋风斩',
    description: '挥舞武器旋转攻击周围所有敌人。',
    type: 'active',
    category: 'combat',
    costs: [{ type: 'stamina', value: 30 }],
    cooldown: 6,
    effects: [{ type: 'physical_damage', value: 35 }],
    requirements: [{ type: 'level', value: 5 }],
    level: 1,
    maxLevel: 10,
    targetType: 'all_enemies',
    range: { type: 'area', areaRadius: 2 },
    tags: ['weapon', 'physical', 'aoe'],
  },
];

export const mockSkillCooldowns: SkillCooldownState[] = [
  {
    skillId: 'skill_002',
    remainingTurns: 1,
    totalCooldown: 3,
    lastUsedAt: now - 30000,
  },
];

export const mockSkillPoints = 2;

export const mockSkillState: SkillState = {
  skills: mockSkills,
  cooldowns: mockSkillCooldowns,
  skillPoints: mockSkillPoints,
};

const ironSword: Item = {
  id: 'item_weapon_001',
  name: '铁剑',
  description: '一把普通的铁制长剑，虽然不是什么名贵武器，但胜在结实耐用。',
  type: 'weapon',
  rarity: 'common',
  stats: {
    attack: 12,
    criticalChance: 5,
  },
  effects: [],
  requirements: {
    level: 1,
    class: ['战士', '骑士'],
  },
  value: {
    buy: 50,
    sell: 20,
    currency: 'gold',
  },
  stackable: false,
  maxStack: 1,
};

const leatherArmor: Item = {
  id: 'item_armor_001',
  name: '皮甲',
  description: '由厚实皮革制成的护甲，提供基本的防护能力。',
  type: 'armor',
  rarity: 'common',
  stats: {
    defense: 8,
    maxHp: 10,
  },
  effects: [],
  requirements: {
    level: 1,
  },
  value: {
    buy: 40,
    sell: 15,
    currency: 'gold',
  },
  stackable: false,
  maxStack: 1,
};

const leatherBoots: Item = {
  id: 'item_boots_001',
  name: '皮靴',
  description: '轻便的皮制靴子，适合长途跋涉。',
  type: 'armor',
  rarity: 'common',
  stats: {
    defense: 3,
    speed: 2,
  },
  effects: [],
  requirements: {
    level: 1,
  },
  value: {
    buy: 25,
    sell: 10,
    currency: 'gold',
  },
  stackable: false,
  maxStack: 1,
};

const silverRing: Item = {
  id: 'item_ring_001',
  name: '银戒指',
  description: '一枚简单的银戒指，镶嵌着一颗小小的蓝宝石。',
  type: 'accessory',
  rarity: 'uncommon',
  stats: {
    maxMp: 10,
    wisdom: 2,
  },
  effects: [],
  requirements: {
    level: 1,
  },
  value: {
    buy: 80,
    sell: 30,
    currency: 'gold',
  },
  stackable: false,
  maxStack: 1,
};

const healthPotion: Item = {
  id: 'item_potion_001',
  name: '治疗药水',
  description: '一瓶红色的药水，饮用后可以恢复一定量的生命值。',
  type: 'consumable',
  rarity: 'common',
  stats: {},
  effects: [
    { type: 'heal', value: 50 },
  ],
  requirements: {},
  value: {
    buy: 15,
    sell: 5,
    currency: 'gold',
  },
  stackable: true,
  maxStack: 20,
};

const bread: Item = {
  id: 'item_food_001',
  name: '面包',
  description: '一块新鲜烤制的面包，可以恢复少量生命值。',
  type: 'consumable',
  rarity: 'common',
  stats: {},
  effects: [
    { type: 'heal', value: 10 },
    { type: 'hunger_restore', value: 20 },
  ],
  requirements: {},
  value: {
    buy: 2,
    sell: 1,
    currency: 'gold',
  },
  stackable: true,
  maxStack: 50,
};

const ironOre: Item = {
  id: 'item_material_001',
  name: '铁矿石',
  description: '一块未经提炼的铁矿石，可以用来锻造武器和装备。',
  type: 'material',
  rarity: 'common',
  stats: {},
  effects: [],
  requirements: {},
  value: {
    buy: 5,
    sell: 2,
    currency: 'gold',
  },
  stackable: true,
  maxStack: 100,
};

const rareGem: Item = {
  id: 'item_gem_001',
  name: '蓝宝石',
  description: '一颗闪闪发光的蓝宝石，可以镶嵌在装备上提升属性。',
  type: 'material',
  rarity: 'rare',
  stats: {},
  effects: [],
  requirements: {},
  value: {
    buy: 200,
    sell: 80,
    currency: 'gold',
  },
  stackable: true,
  maxStack: 10,
};

const ancientScroll: Item = {
  id: 'item_quest_001',
  name: '古老的卷轴',
  description: '一份泛黄的古老卷轴，上面记载着某种神秘的知识。',
  type: 'quest',
  rarity: 'unique',
  stats: {},
  effects: [],
  requirements: {},
  value: {
    buy: 0,
    sell: 0,
    currency: 'gold',
  },
  stackable: false,
  maxStack: 1,
};

const steelSword: Item = {
  id: 'item_weapon_002',
  name: '精钢长剑',
  description: '一把由精钢锻造的长剑，锋利无比。',
  type: 'weapon',
  rarity: 'uncommon',
  stats: {
    attack: 20,
    criticalChance: 8,
    criticalDamage: 15,
  },
  effects: [],
  requirements: {
    level: 5,
    class: ['战士', '骑士'],
    attributes: { strength: 15 },
  },
  value: {
    buy: 150,
    sell: 60,
    currency: 'gold',
  },
  stackable: false,
  maxStack: 1,
};

const epicShield: Item = {
  id: 'item_shield_001',
  name: '骑士之盾',
  description: '一面刻有骑士团徽章的重型盾牌，曾经属于一位传奇骑士。',
  type: 'armor',
  rarity: 'epic',
  stats: {
    defense: 25,
    blockChance: 20,
    maxHp: 30,
  },
  effects: [
    { type: 'damage_reduction', value: 10 },
  ],
  requirements: {
    level: 8,
    class: ['战士', '骑士'],
    attributes: { constitution: 14 },
  },
  value: {
    buy: 500,
    sell: 200,
    currency: 'gold',
  },
  stackable: false,
  maxStack: 1,
};

export const mockItems: Record<string, Item> = {
  'item_weapon_001': ironSword,
  'item_weapon_002': steelSword,
  'item_armor_001': leatherArmor,
  'item_boots_001': leatherBoots,
  'item_ring_001': silverRing,
  'item_shield_001': epicShield,
  'item_potion_001': healthPotion,
  'item_food_001': bread,
  'item_material_001': ironOre,
  'item_gem_001': rareGem,
  'item_quest_001': ancientScroll,
};

export const mockInventorySlots: InventorySlot[] = [
  {
    id: 'slot_001',
    slotIndex: 0,
    itemId: 'item_potion_001',
    quantity: 3,
    item: healthPotion,
  },
  {
    id: 'slot_002',
    slotIndex: 1,
    itemId: 'item_food_001',
    quantity: 5,
    item: bread,
  },
  {
    id: 'slot_003',
    slotIndex: 2,
    itemId: 'item_material_001',
    quantity: 8,
    item: ironOre,
  },
  {
    id: 'slot_004',
    slotIndex: 3,
    itemId: 'item_gem_001',
    quantity: 1,
    item: rareGem,
  },
  {
    id: 'slot_005',
    slotIndex: 4,
    itemId: 'item_quest_001',
    quantity: 1,
    item: ancientScroll,
  },
  {
    id: 'slot_006',
    slotIndex: 5,
    itemId: 'item_weapon_002',
    quantity: 1,
    item: steelSword,
  },
];

export const mockInventoryState: InventoryGameState = {
  slots: mockInventorySlots,
  capacity: 50,
  currency: {
    gold: 325,
    silver: 50,
  },
};

export const mockEquippedWeapon: EquippedItem = {
  id: 'equipped_001',
  itemId: 'item_weapon_001',
  slot: 'weapon',
  equippedAt: now - 86400000,
  item: ironSword,
};

export const mockEquippedBody: EquippedItem = {
  id: 'equipped_002',
  itemId: 'item_armor_001',
  slot: 'body',
  equippedAt: now - 86400000,
  item: leatherArmor,
};

export const mockEquippedFeet: EquippedItem = {
  id: 'equipped_003',
  itemId: 'item_boots_001',
  slot: 'feet',
  equippedAt: now - 86400000,
  item: leatherBoots,
};

export const mockEquippedAccessory: EquippedItem = {
  id: 'equipped_004',
  itemId: 'item_ring_001',
  slot: 'accessory',
  equippedAt: now - 43200000,
  item: silverRing,
};

export const mockEquipmentState: EquipmentState = {
  weapon: mockEquippedWeapon,
  head: undefined,
  body: mockEquippedBody,
  feet: mockEquippedFeet,
  accessories: [mockEquippedAccessory],
};

export const mockQuests: Quest[] = [
  {
    id: 'quest_001',
    name: '前往村庄报告',
    description: '前往绿野村向村长报告边境的情况，并寻求帮助。',
    type: 'main',
    status: 'in_progress',
    objectives: [
      {
        id: 'obj_001_1',
        description: '前往绿野村',
        type: 'explore',
        target: 'location_green_village',
        current: 0,
        required: 1,
        isCompleted: false,
      },
      {
        id: 'obj_001_2',
        description: '与村长交谈',
        type: 'talk',
        target: 'npc_village_head',
        current: 0,
        required: 1,
        isCompleted: false,
      },
    ],
    prerequisites: [],
    rewards: {
      experience: 100,
      currency: { gold: 50 },
      items: [{ itemId: 'item_potion_001', quantity: 2 }],
    },
    log: [
      { timestamp: now - 3600000, event: '任务开始：收到来自边境的紧急消息' },
    ],
    characterId: 'char_001',
    createdAt: now - 3600000,
    updatedAt: now - 3600000,
  },
  {
    id: 'quest_002',
    name: '铁匠的请求',
    description: '铁匠需要一些铁矿石来修理村民的工具。',
    type: 'side',
    status: 'in_progress',
    objectives: [
      {
        id: 'obj_002_1',
        description: '收集铁矿石',
        type: 'collect',
        target: 'item_material_001',
        current: 8,
        required: 10,
        isCompleted: false,
      },
      {
        id: 'obj_002_2',
        description: '将铁矿石交给铁匠',
        type: 'talk',
        target: 'npc_blacksmith',
        current: 0,
        required: 1,
        isCompleted: false,
      },
    ],
    prerequisites: [],
    rewards: {
      experience: 50,
      currency: { gold: 30 },
      items: [{ itemId: 'item_weapon_002', quantity: 1 }],
    },
    log: [
      { timestamp: now - 7200000, event: '铁匠请求帮助收集铁矿石' },
      { timestamp: now - 1800000, event: '在附近的山洞发现了铁矿' },
    ],
    characterId: 'char_001',
    createdAt: now - 7200000,
    updatedAt: now - 1800000,
  },
  {
    id: 'quest_003',
    name: '失落的宝藏',
    description: '根据古老的地图，在森林深处似乎隐藏着某个宝藏。',
    type: 'side',
    status: 'available',
    objectives: [
      {
        id: 'obj_003_1',
        description: '探索神秘森林',
        type: 'explore',
        target: 'location_mystery_forest',
        current: 0,
        required: 1,
        isCompleted: false,
      },
      {
        id: 'obj_003_2',
        description: '找到宝藏',
        type: 'explore',
        target: 'location_treasure_chest',
        current: 0,
        required: 1,
        isCompleted: false,
      },
    ],
    prerequisites: [],
    rewards: {
      experience: 200,
      currency: { gold: 100 },
      items: [{ itemId: 'item_gem_001', quantity: 3 }],
    },
    log: [],
    characterId: 'char_001',
    createdAt: now - 86400000,
    updatedAt: now - 86400000,
  },
];

export const mockQuestState: QuestState = {
  activeQuests: mockQuests,
  completedQuestIds: ['quest_tutorial', 'quest_first_blood'],
  failedQuestIds: [],
};

export const mockNPCs: NPC[] = [
  {
    id: 'npc_village_head',
    saveId: 'save_001',
    name: '托马斯',
    title: '绿野村村长',
    race: '人类',
    occupation: '村长',
    appearance: {
      description: '一位年迈但精神矍铄的老人，留着灰白色的胡须，穿着朴素的村民服装。',
      height: '中等',
      build: '瘦削',
      hairColor: '灰白',
      eyeColor: '棕色',
      distinguishingFeatures: ['左眼下方有一颗痣', '走路时略微跛脚'],
      imagePrompt: 'An elderly but spirited village headman with gray beard, wearing simple villager clothes',
    },
    personality: {
      traits: ['睿智', '善良', '谨慎', '有责任感'],
      values: ['村庄安全', '村民福祉', '传统'],
      fears: ['村庄被摧毁', '无法保护村民'],
      desires: ['村庄繁荣', '和平'],
      quirks: ['喜欢在说话时抚摸胡须', '经常引用古老的谚语'],
      speech_style: '温和而有威严，喜欢使用敬语',
    },
    status: {
      health: 80,
      maxHealth: 80,
      mood: 'neutral',
      currentLocation: 'location_village_hall',
      isAvailable: true,
      isAlive: true,
      schedule: [
        {
          id: 'schedule_001',
          startTime: '06:00',
          endTime: '08:00',
          location: 'location_village_hall',
          activity: '处理村务',
          priority: 1,
        },
        {
          id: 'schedule_002',
          startTime: '08:00',
          endTime: '12:00',
          location: 'location_village_square',
          activity: '巡视村庄',
          priority: 2,
        },
      ],
      currentActivity: '处理村务',
      statusEffects: [],
      customData: {},
    },
    stats: {
      level: 10,
      strength: 8,
      dexterity: 6,
      constitution: 10,
      intelligence: 16,
      wisdom: 18,
      charisma: 14,
      attack: 5,
      defense: 8,
      speed: 5,
      customStats: {},
    },
    flags: {
      isCompanion: false,
      isMerchant: false,
      isQuestGiver: true,
      isRomanceable: false,
      isEssential: true,
      isHostile: false,
      isInvulnerable: true,
      canFollow: false,
      canTrade: false,
      canFight: false,
      customFlags: {},
    },
    role: 'quest_giver',
    disposition: 'helpful',
    dialogue: {
      greetings: ['欢迎来到绿野村，旅行者。', '啊，是新来的冒险者吗？'],
      farewells: ['愿风指引你的道路。', '保重，朋友。'],
      idle: ['最近边境不太平啊...', '希望今年的收成会好一些。'],
      combat: [],
      custom: {
        quest: ['关于边境的情况，我正要和你说...'],
      },
    },
    services: [],
    inventory: [],
    quests: ['quest_001'],
    relationships: {},
    backstory: '托马斯曾是王国军队的一名军官，退役后回到家乡绿野村，被村民推选为村长。他用自己的军事经验保护村庄免受野兽和盗贼的侵扰。',
    secrets: ['年轻时曾参与过一场秘密战役', '知道村庄附近某个古代遗迹的位置'],
    customData: {},
    createdAt: now - 86400000 * 30,
    updatedAt: now - 3600000,
  },
  {
    id: 'npc_blacksmith',
    saveId: 'save_001',
    name: '格罗姆',
    title: '铁匠',
    race: '矮人',
    occupation: '铁匠',
    appearance: {
      description: '一位身材矮壮的矮人，有着浓密的红胡子和粗壮的手臂，身上总是沾满煤灰。',
      height: '矮小',
      build: '结实',
      hairColor: '红色',
      eyeColor: '深棕色',
      distinguishingFeatures: ['左臂有一个烧伤的疤痕', '总是戴着皮围裙'],
      imagePrompt: 'A sturdy dwarf blacksmith with thick red beard, muscular arms covered in coal dust, wearing leather apron',
    },
    personality: {
      traits: ['直率', '勤劳', '固执', '热心'],
      values: ['工艺质量', '诚实', '友谊'],
      fears: ['技艺失传', '锻造出劣质武器'],
      desires: ['打造一把传奇武器', '收一个好徒弟'],
      quirks: ['工作时喜欢哼小调', '对金属有独特的嗅觉'],
      speech_style: '粗犷直接，偶尔夹杂矮人语',
    },
    status: {
      health: 120,
      maxHealth: 120,
      mood: 'happy',
      currentLocation: 'location_blacksmith_shop',
      isAvailable: true,
      isAlive: true,
      schedule: [
        {
          id: 'schedule_003',
          startTime: '05:00',
          endTime: '18:00',
          location: 'location_blacksmith_shop',
          activity: '锻造',
          priority: 1,
        },
      ],
      currentActivity: '锻造',
      statusEffects: [],
      customData: {},
    },
    stats: {
      level: 8,
      strength: 18,
      dexterity: 10,
      constitution: 16,
      intelligence: 12,
      wisdom: 10,
      charisma: 8,
      attack: 15,
      defense: 12,
      speed: 6,
      customStats: { crafting: 20 },
    },
    flags: {
      isCompanion: false,
      isMerchant: true,
      isQuestGiver: true,
      isRomanceable: false,
      isEssential: false,
      isHostile: false,
      isInvulnerable: false,
      canFollow: false,
      canTrade: true,
      canFight: true,
      customFlags: {},
    },
    role: 'merchant',
    disposition: 'helpful',
    dialogue: {
      greetings: ['哈！又一个需要武器的冒险者！', '欢迎来到我的铁匠铺！'],
      farewells: ['下次再来，我给你打个折！', '愿你的剑永远锋利！'],
      idle: ['这把剑还需要再打磨一下...', '铁矿石越来越难找了。'],
      combat: ['尝尝我的锤子！', '没人能在我的铁匠铺撒野！'],
      custom: {
        trade: ['看看这些宝贝，都是我亲手打造的！'],
        quest: ['如果你能帮我找些铁矿石，我可以给你打造更好的装备。'],
      },
    },
    services: ['weapon_repair', 'armor_repair', 'weapon_craft', 'armor_craft'],
    inventory: ['item_weapon_001', 'item_weapon_002', 'item_armor_001', 'item_boots_001'],
    quests: ['quest_002'],
    relationships: {},
    backstory: '格罗姆来自北方的矮人王国，年轻时曾是皇家铁匠。因为与王室发生争执而离开家乡，来到绿野村开设了自己的铁匠铺。',
    secrets: ['知道如何锻造附魔武器的方法', '藏有一块罕见的陨铁'],
    customData: {},
    createdAt: now - 86400000 * 60,
    updatedAt: now - 7200000,
  },
  {
    id: 'npc_merchant',
    saveId: 'save_001',
    name: '莉娜',
    title: '旅行商人',
    race: '精灵',
    occupation: '商人',
    appearance: {
      description: '一位优雅的精灵女性，有着银白色的长发和碧绿的眼睛，穿着精致的旅行服装。',
      height: '高挑',
      build: '纤细',
      hairColor: '银白',
      eyeColor: '碧绿',
      distinguishingFeatures: ['耳朵上戴着精致的银饰', '总是带着一个神秘的微笑'],
      imagePrompt: 'An elegant elven merchant woman with silver hair and emerald eyes, wearing fine traveling clothes',
    },
    personality: {
      traits: ['精明', '优雅', '好奇', '神秘'],
      values: ['知识', '财富', '自由'],
      fears: ['被困在一个地方', '失去自由'],
      desires: ['收集世界各地的珍奇物品', '探索未知的土地'],
      quirks: ['喜欢收集各种小道消息', '说话时喜欢用谜语'],
      speech_style: '优雅而神秘，喜欢用隐喻',
    },
    status: {
      health: 60,
      maxHealth: 60,
      mood: 'excited',
      currentLocation: 'location_village_square',
      isAvailable: true,
      isAlive: true,
      schedule: [],
      currentActivity: '摆摊',
      statusEffects: [],
      customData: {},
    },
    stats: {
      level: 5,
      strength: 6,
      dexterity: 14,
      constitution: 8,
      intelligence: 16,
      wisdom: 14,
      charisma: 18,
      attack: 3,
      defense: 5,
      speed: 12,
      customStats: { barter: 15 },
    },
    flags: {
      isCompanion: false,
      isMerchant: true,
      isQuestGiver: false,
      isRomanceable: true,
      isEssential: false,
      isHostile: false,
      isInvulnerable: false,
      canFollow: false,
      canTrade: true,
      canFight: false,
      customFlags: {},
    },
    role: 'merchant',
    disposition: 'helpful',
    dialogue: {
      greetings: ['啊，一位有趣的旅行者。', '看看我的商品吧，也许有你喜欢的东西。'],
      farewells: ['愿星辰指引你的道路。', '下次再见，也许我会有新的宝贝。'],
      idle: ['这个世界真大，还有那么多地方没去过...', '听说北方有座神秘的古城...'],
      combat: [],
      custom: {
        trade: ['这些都是我从各地收集来的珍品。'],
        gossip: ['你想知道些什么？我的消息可不便宜哦。'],
      },
    },
    services: ['trade', 'appraisal', 'information'],
    inventory: ['item_potion_001', 'item_gem_001', 'item_ring_001'],
    quests: [],
    relationships: {},
    backstory: '莉娜是一位来自精灵王国的旅行商人，因为厌倦了精灵社会的刻板而选择流浪。她游历各地，收集珍奇物品和各种有趣的消息。',
    secrets: ['实际上是精灵王国的逃亡公主', '知道一个通往异世界的秘密通道'],
    customData: {},
    createdAt: now - 86400000 * 7,
    updatedAt: now - 1800000,
  },
];

export const mockNPCRelationships: Record<string, NPCRelationship> = {
  'npc_village_head': {
    characterId: 'char_001',
    npcId: 'npc_village_head',
    type: 'friendly',
    level: 35,
    trustLevel: 40,
    respectLevel: 50,
    affectionLevel: 20,
    fearLevel: 0,
    interactionCount: 5,
    lastInteractionAt: now - 3600000,
    firstMetAt: now - 86400000,
    flags: {
      met: true,
      befriended: false,
      romanced: false,
      betrayed: false,
      killed: false,
      custom: {},
    },
    notes: ['村长似乎对边境的情况很担忧'],
    customData: {},
  },
  'npc_blacksmith': {
    characterId: 'char_001',
    npcId: 'npc_blacksmith',
    type: 'friendly',
    level: 25,
    trustLevel: 30,
    respectLevel: 35,
    affectionLevel: 15,
    fearLevel: 0,
    interactionCount: 8,
    lastInteractionAt: now - 7200000,
    firstMetAt: now - 86400000 * 3,
    flags: {
      met: true,
      befriended: false,
      romanced: false,
      betrayed: false,
      killed: false,
      custom: {},
    },
    notes: ['格罗姆是个好铁匠，但需要铁矿石'],
    customData: {},
  },
  'npc_merchant': {
    characterId: 'char_001',
    npcId: 'npc_merchant',
    type: 'neutral',
    level: 10,
    trustLevel: 15,
    respectLevel: 10,
    affectionLevel: 5,
    fearLevel: 0,
    interactionCount: 2,
    lastInteractionAt: now - 1800000,
    firstMetAt: now - 86400000,
    flags: {
      met: true,
      befriended: false,
      romanced: false,
      betrayed: false,
      killed: false,
      custom: {},
    },
    notes: ['莉娜是个神秘的商人，似乎知道很多秘密'],
    customData: {},
  },
};

export const mockNPCState: NPCGameState = {
  npcs: mockNPCs,
  relationships: mockNPCRelationships,
  partyMemberIds: [],
};

export const mockMapLocations: MapLocation[] = [
  {
    id: 'location_green_village',
    name: '绿野村',
    type: 'town',
    position: { x: 100, y: 100 },
    description: '一个宁静的小村庄，坐落在翠绿的平原上。村民们过着简单而幸福的生活。',
    discovered: true,
  },
  {
    id: 'location_village_hall',
    name: '村政厅',
    type: 'building',
    position: { x: 105, y: 102 },
    description: '村庄的中心建筑，村长托马斯在这里处理村务。',
    discovered: true,
  },
  {
    id: 'location_blacksmith_shop',
    name: '铁匠铺',
    type: 'building',
    position: { x: 98, y: 105 },
    description: '格罗姆的铁匠铺，炉火日夜不息，锤声不绝于耳。',
    discovered: true,
  },
  {
    id: 'location_village_square',
    name: '村庄广场',
    type: 'landmark',
    position: { x: 100, y: 100 },
    description: '村庄的中心广场，商人们在这里摆摊，村民们在这里交流。',
    discovered: true,
  },
  {
    id: 'location_mystery_forest',
    name: '神秘森林',
    type: 'wilderness',
    position: { x: 150, y: 80 },
    description: '一片古老的森林，据说深处隐藏着某种秘密。',
    discovered: false,
  },
  {
    id: 'location_iron_mine',
    name: '铁矿洞',
    type: 'dungeon',
    position: { x: 80, y: 130 },
    description: '一个废弃的铁矿洞，现在偶尔还有矿工来采集矿石。',
    discovered: true,
  },
];

export const mockGameMap: GameMap = {
  id: 'map_001',
  name: '绿野平原',
  description: '一片广阔的平原，散布着小村庄和农田，远处是连绵的山脉。',
  type: 'overworld',
  size: { width: 200, height: 200 },
  tiles: [],
  locations: mockMapLocations,
  connections: [
    { from: 'location_green_village', to: 'location_village_hall', type: 'bidirectional' },
    { from: 'location_green_village', to: 'location_blacksmith_shop', type: 'bidirectional' },
    { from: 'location_green_village', to: 'location_village_square', type: 'bidirectional' },
    { from: 'location_green_village', to: 'location_iron_mine', type: 'bidirectional' },
    { from: 'location_green_village', to: 'location_mystery_forest', type: 'bidirectional' },
  ],
  encounters: [
    {
      id: 'encounter_001',
      type: 'combat',
      position: { x: 120, y: 90 },
      trigger: 'random',
      probability: 0.2,
      data: { enemies: ['goblin', 'wolf'] },
    },
  ],
  npcs: ['npc_village_head', 'npc_blacksmith', 'npc_merchant'],
  items: [],
};

export const mockMapState: MapGameState = {
  currentMapId: 'map_001',
  currentLocationId: 'location_green_village',
  visitedLocations: [
    'location_green_village',
    'location_village_hall',
    'location_blacksmith_shop',
    'location_village_square',
    'location_iron_mine',
  ],
  discoveredAreas: ['location_green_village', 'location_iron_mine'],
  mapData: mockGameMap,
};

export const mockJournalEntries: JournalEntry[] = [
  {
    id: 'journal_001',
    timestamp: now - 86400000,
    type: 'story',
    title: '旅程的开始',
    content: '我离开了熟悉的边境哨所，踏上了前往绿野村的旅程。村长托马斯应该能给我一些建议。',
    tags: ['主线', '开始'],
    relatedQuestId: 'quest_001',
  },
  {
    id: 'journal_002',
    timestamp: now - 7200000,
    type: 'dialogue',
    title: '与格罗姆的对话',
    content: '铁匠格罗姆需要铁矿石来修理村民的工具。我答应帮他收集一些。他说附近有个废弃的铁矿洞。',
    tags: ['支线', '铁匠'],
    relatedQuestId: 'quest_002',
    relatedNpcId: 'npc_blacksmith',
  },
  {
    id: 'journal_003',
    timestamp: now - 3600000,
    type: 'discovery',
    title: '发现铁矿洞',
    content: '在村庄西北方向发现了一个废弃的铁矿洞。洞口有些坍塌，但应该还能进去。我在里面找到了一些铁矿石。',
    tags: ['探索', '资源'],
    relatedLocationId: 'location_iron_mine',
  },
  {
    id: 'journal_004',
    timestamp: now - 1800000,
    type: 'combat',
    title: '遭遇野狼',
    content: '在前往铁矿洞的路上遭遇了一群野狼。经过一番激战，我成功击退了它们，但也受了一些轻伤。',
    tags: ['战斗', '野兽'],
  },
  {
    id: 'journal_005',
    timestamp: now - 900000,
    type: 'system',
    title: '等级提升',
    content: '经过不断的历练，我的实力有所提升。等级从4级提升到了5级！',
    tags: ['系统', '成长'],
  },
];

export const mockDynamicUI: DynamicUIData = {
  id: 'dynamic_ui_001',
  type: 'welcome',
  markdown: `:::system-notify{type=welcome}
## 🌟 欢迎来到绿野平原

**艾瑞克**，你的冒险即将开始！

---

### 角色信息
| 属性 | 值 |
|------|-----|
| 种族 | 人类 |
| 职业 | 战士 |
| 等级 | 5 |
| 背景 | 前王国骑士 |

### 当前状态
- 💰 金币: 325
- 📦 物品: 6 种
- ⚔️ 技能: 6 个
- 📜 任务: 2 个进行中

---

> 你曾是王国骑士团的一员，在一次边境冲突中因违抗上级命令保护平民而被逐出骑士团。现在作为一名冒险者游历大陆，寻找能够证明自己的机会。

:::options
[开始冒险](action:start_game) [查看详情](action:view_details)
:::
:::`,
  context: {
    characterName: '艾瑞克',
    location: '绿野村',
  },
};
