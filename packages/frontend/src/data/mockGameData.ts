/**
 * 模拟游戏数据
 * 用于前端开发和测试，格式与后端类型定义一致
 */

import type {
  Character,
  Skill,
  StatusEffect,
  InventoryItem,
  Item,
  EquippedItem,
  EquipmentState,
  Quest,
  QuestObjective,
  QuestLogEntry,
  NPC,
  NPCPersonality,
  NPCStatus,
  NPCStats,
  NPCFlags,
  NPCRelationship,
  GameMap,
  MapTile,
  MapLocation,
  MapConnection,
  MapEncounter,
  MapItem,
  CombatUnit,
  CombatUnitStats,
  CombatAction,
  CombatInstanceData,
  GlobalContext,
  DialogueOption,
  JournalEntry,
  DynamicUIData,
} from '@ai-rpg/shared';
import { CombatState, CombatDifficulty, ActionType } from '@ai-rpg/shared';

// ==================== 模拟角色数据 ====================

export const mockCharacter: Character = {
  id: 'char-mock-001',
  name: '艾瑞克',
  race: 'human',
  class: 'warrior',
  level: 5,
  experience: 1250,

  baseAttributes: {
    strength: 16,
    dexterity: 12,
    constitution: 14,
    intelligence: 10,
    wisdom: 8,
    charisma: 10,
  },

  derivedAttributes: {
    maxHp: 120,
    currentHp: 95,
    maxMp: 40,
    currentMp: 35,
    attack: 25,
    defense: 18,
    speed: 10,
    luck: 5,
  },

  skills: [],

  equipment: {
    weapon: 'item-weapon-001',
    body: 'item-armor-001',
    feet: 'item-boots-001',
    accessory: ['item-ring-001'],
  },

  inventory: [],

  currency: {
    gold: 500,
    silver: 250,
  },

  statusEffects: [],

  appearance: '一位身材魁梧的战士，有着棕色的短发和坚毅的眼神。身穿铁甲，手持长剑。',
  imagePrompt: 'A tall warrior with brown short hair, wearing iron armor and holding a longsword, determined eyes, fantasy RPG style',
  personality: '勇敢、正直、有时过于直率',
  backstory: '出生于边境小镇，曾是当地卫队的一员。为了寻找更强的对手和保护更多的人，踏上了冒险之旅。',
  backgroundId: 'soldier', // 背景模板 ID：士兵

  statistics: {
    battlesWon: 15,
    questsCompleted: 8,
    distanceTraveled: 1200,
    itemsCrafted: 5,
    npcsMet: 25,
    playTime: 36000,
  },
};

// ==================== 模拟技能数据 ====================

export const mockSkills: Skill[] = [
  {
    id: 'skill-001',
    name: '猛击',
    description: '用尽全力挥击，造成 150% 武器伤害',
    level: 3,
    maxLevel: 5,
    type: 'active',
    cost: {
      type: 'mp',
      value: 10,
    },
    cooldown: 2,
    effects: [
      { type: 'damage', value: 1.5, condition: 'weapon_damage' },
    ],
    requirements: [
      { type: 'level', value: 1 },
      { type: 'attribute', value: 'strength' },
    ],
  },
  {
    id: 'skill-002',
    name: '盾击',
    description: '用盾牌猛击敌人，造成伤害并有几率眩晕',
    level: 2,
    maxLevel: 5,
    type: 'active',
    cost: {
      type: 'mp',
      value: 8,
    },
    cooldown: 3,
    effects: [
      { type: 'damage', value: 80 },
      { type: 'stun', value: 1, duration: 1 },
    ],
    requirements: [
      { type: 'level', value: 3 },
    ],
  },
  {
    id: 'skill-003',
    name: '战斗怒吼',
    description: '发出震慑敌人的怒吼，提升自身攻击力',
    level: 1,
    maxLevel: 5,
    type: 'active',
    cost: {
      type: 'mp',
      value: 15,
    },
    cooldown: 5,
    effects: [
      { type: 'buff_attack', value: 20, duration: 3 },
    ],
    requirements: [
      { type: 'level', value: 5 },
    ],
  },
  {
    id: 'skill-004',
    name: '坚韧体质',
    description: '被动提升最大生命值 10%',
    level: 2,
    maxLevel: 3,
    type: 'passive',
    cost: {
      type: 'mp',
      value: 0,
    },
    cooldown: 0,
    effects: [
      { type: 'max_hp_bonus', value: 0.1 },
    ],
    requirements: [
      { type: 'attribute', value: 'constitution' },
    ],
  },
  {
    id: 'skill-005',
    name: '反击姿态',
    description: '进入防御姿态，下次受到攻击时进行反击',
    level: 1,
    maxLevel: 5,
    type: 'active',
    cost: {
      type: 'mp',
      value: 12,
    },
    cooldown: 4,
    effects: [
      { type: 'counter', value: 1, duration: 1 },
    ],
    requirements: [
      { type: 'level', value: 4 },
    ],
  },
];

// ==================== 模拟物品数据 ====================

export const mockItems: Item[] = [
  {
    id: 'item-weapon-001',
    name: '精钢长剑',
    description: '一把精心锻造的长剑，剑身泛着寒光',
    type: 'weapon',
    rarity: 'uncommon',
    stats: {
      attack: 15,
      criticalRate: 5,
    },
    effects: [],
    requirements: {
      level: 3,
      class: ['warrior', 'paladin'],
    },
    value: {
      buy: 200,
      sell: 80,
      currency: 'gold',
    },
    stackable: false,
    maxStack: 1,
  },
  {
    id: 'item-armor-001',
    name: '铁制胸甲',
    description: '坚固的铁制胸甲，提供良好的防护',
    type: 'armor',
    rarity: 'common',
    stats: {
      defense: 12,
      maxHp: 20,
    },
    effects: [],
    requirements: {
      level: 1,
      class: ['warrior', 'paladin'],
    },
    value: {
      buy: 150,
      sell: 60,
      currency: 'gold',
    },
    stackable: false,
    maxStack: 1,
  },
  {
    id: 'item-boots-001',
    name: '皮靴',
    description: '舒适的皮靴，适合长途跋涉',
    type: 'armor',
    rarity: 'common',
    stats: {
      defense: 3,
      speed: 2,
    },
    effects: [],
    requirements: {},
    value: {
      buy: 50,
      sell: 20,
      currency: 'gold',
    },
    stackable: false,
    maxStack: 1,
  },
  {
    id: 'item-ring-001',
    name: '力量戒指',
    description: '一枚散发着微弱光芒的戒指',
    type: 'accessory',
    rarity: 'uncommon',
    stats: {
      strength: 2,
    },
    effects: [],
    requirements: {
      level: 1,
    },
    value: {
      buy: 100,
      sell: 40,
      currency: 'gold',
    },
    stackable: false,
    maxStack: 1,
  },
  {
    id: 'item-potion-001',
    name: '治疗药水',
    description: '恢复 50 点生命值',
    type: 'consumable',
    rarity: 'common',
    stats: {},
    effects: [
      { type: 'heal', value: 50 },
    ],
    requirements: {},
    value: {
      buy: 25,
      sell: 10,
      currency: 'gold',
    },
    stackable: true,
    maxStack: 99,
  },
  {
    id: 'item-potion-002',
    name: '魔力药水',
    description: '恢复 30 点魔力值',
    type: 'consumable',
    rarity: 'common',
    stats: {},
    effects: [
      { type: 'restore_mp', value: 30 },
    ],
    requirements: {},
    value: {
      buy: 30,
      sell: 12,
      currency: 'gold',
    },
    stackable: true,
    maxStack: 99,
  },
  {
    id: 'item-material-001',
    name: '铁矿石',
    description: '用于锻造的原材料',
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
    maxStack: 999,
  },
  {
    id: 'item-quest-001',
    name: '神秘的信件',
    description: '一封来自未知寄件人的信件，上面有着奇怪的印章',
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
  },
];

// ==================== 模拟装备数据 ====================

export const mockEquippedItems: EquippedItem[] = [
  {
    id: 'equipped-001',
    itemId: 'item-weapon-001',
    slot: 'weapon',
    equippedAt: Date.now() - 86400000,
    item: mockItems[0],
  },
  {
    id: 'equipped-002',
    itemId: 'item-armor-001',
    slot: 'body',
    equippedAt: Date.now() - 86400000,
    item: mockItems[1],
  },
  {
    id: 'equipped-003',
    itemId: 'item-boots-001',
    slot: 'feet',
    equippedAt: Date.now() - 86400000,
    item: mockItems[2],
  },
  {
    id: 'equipped-004',
    itemId: 'item-ring-001',
    slot: 'accessory',
    equippedAt: Date.now() - 43200000,
    item: mockItems[3],
  },
];

export const mockEquipmentState: EquipmentState = {
  weapon: mockEquippedItems[0],
  head: undefined,
  body: mockEquippedItems[1],
  feet: mockEquippedItems[2],
  accessories: [mockEquippedItems[3]],
};

// ==================== 模拟背包数据 ====================

export const mockInventoryItems: InventoryItem[] = [
  {
    id: 'inv-001',
    itemId: 'item-potion-001',
    quantity: 5,
    equipped: false,
    obtainedAt: Date.now() - 3600000,
  },
  {
    id: 'inv-002',
    itemId: 'item-potion-002',
    quantity: 3,
    equipped: false,
    obtainedAt: Date.now() - 3600000,
  },
  {
    id: 'inv-003',
    itemId: 'item-material-001',
    quantity: 15,
    equipped: false,
    obtainedAt: Date.now() - 7200000,
  },
  {
    id: 'inv-004',
    itemId: 'item-quest-001',
    quantity: 1,
    equipped: false,
    obtainedAt: Date.now() - 1800000,
  },
];

// ==================== 模拟任务数据 ====================

export const mockQuestObjectives: Record<string, QuestObjective[]> = {
  'quest-001': [
    {
      id: 'obj-001-1',
      description: '前往村庄东边的森林',
      type: 'explore',
      target: 'forest_east',
      current: 0,
      required: 1,
      isCompleted: false,
    },
    {
      id: 'obj-001-2',
      description: '击败森林中的狼群',
      type: 'kill',
      target: 'wolf',
      current: 2,
      required: 5,
      isCompleted: false,
    },
    {
      id: 'obj-001-3',
      description: '返回村长处报告',
      type: 'talk',
      target: 'npc_village_chief',
      current: 0,
      required: 1,
      isCompleted: false,
    },
  ],
  'quest-002': [
    {
      id: 'obj-002-1',
      description: '收集 10 个铁矿石',
      type: 'collect',
      target: 'item-material-001',
      current: 10,
      required: 10,
      isCompleted: true,
    },
    {
      id: 'obj-002-2',
      description: '将铁矿石交给铁匠',
      type: 'talk',
      target: 'npc_blacksmith',
      current: 0,
      required: 1,
      isCompleted: false,
    },
  ],
  'quest-003': [
    {
      id: 'obj-003-1',
      description: '调查神秘洞穴',
      type: 'explore',
      target: 'mysterious_cave',
      current: 1,
      required: 1,
      isCompleted: true,
    },
    {
      id: 'obj-003-2',
      description: '击败洞穴深处的怪物',
      type: 'kill',
      target: 'cave_monster',
      current: 1,
      required: 1,
      isCompleted: true,
    },
    {
      id: 'obj-003-3',
      description: '找到宝藏',
      type: 'collect',
      target: 'treasure_chest',
      current: 1,
      required: 1,
      isCompleted: true,
    },
  ],
};

export const mockQuestLogEntries: Record<string, QuestLogEntry[]> = {
  'quest-001': [
    { timestamp: Date.now() - 86400000, event: '接受了村长的委托' },
    { timestamp: Date.now() - 43200000, event: '进入森林探索' },
    { timestamp: Date.now() - 3600000, event: '击败了 2 只狼' },
  ],
  'quest-002': [
    { timestamp: Date.now() - 172800000, event: '铁匠请求帮助收集材料' },
    { timestamp: Date.now() - 86400000, event: '收集完成所有铁矿石' },
  ],
  'quest-003': [
    { timestamp: Date.now() - 259200000, event: '发现了神秘洞穴的入口' },
    { timestamp: Date.now() - 259200000, event: '击败了洞穴怪物' },
    { timestamp: Date.now() - 259200000, event: '找到了隐藏的宝藏' },
    { timestamp: Date.now() - 259200000, event: '任务完成！' },
  ],
};

export const mockQuests: Quest[] = [
  {
    id: 'quest-001',
    name: '拯救村庄',
    description: '村长请求你清除威胁村庄安全的狼群',
    type: 'main',
    status: 'in_progress',
    objectives: mockQuestObjectives['quest-001'],
    prerequisites: [],
    rewards: {
      experience: 200,
      currency: { gold: 100 },
      items: [{ itemId: 'item-potion-001', quantity: 3 }],
    },
    log: mockQuestLogEntries['quest-001'],
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 3600000,
  },
  {
    id: 'quest-002',
    name: '铁匠的请求',
    description: '帮助铁匠收集铁矿石以锻造新装备',
    type: 'side',
    status: 'in_progress',
    objectives: mockQuestObjectives['quest-002'],
    prerequisites: [],
    rewards: {
      experience: 50,
      currency: { gold: 50 },
      items: [{ itemId: 'item-armor-001', quantity: 1 }],
    },
    log: mockQuestLogEntries['quest-002'],
    createdAt: Date.now() - 172800000,
    updatedAt: Date.now() - 86400000,
  },
  {
    id: 'quest-003',
    name: '洞穴探险',
    description: '探索神秘洞穴并寻找宝藏',
    type: 'side',
    status: 'completed',
    objectives: mockQuestObjectives['quest-003'],
    prerequisites: [],
    rewards: {
      experience: 150,
      currency: { gold: 200 },
      items: [{ itemId: 'item-ring-001', quantity: 1 }],
    },
    log: mockQuestLogEntries['quest-003'],
    createdAt: Date.now() - 259200000,
    updatedAt: Date.now() - 259200000,
  },
  {
    id: 'quest-004',
    name: '失落的神器',
    description: '传说中有一件神器散落在远古遗迹中...',
    type: 'main',
    status: 'locked',
    objectives: [
      {
        id: 'obj-004-1',
        description: '达到 10 级',
        type: 'custom',
        target: 'level',
        current: 5,
        required: 10,
        isCompleted: false,
      },
    ],
    prerequisites: ['quest-001'],
    rewards: {
      experience: 500,
      currency: { gold: 500 },
    },
    log: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

// ==================== 模拟 NPC 数据 ====================

const mockNpcPersonality: NPCPersonality = {
  traits: ['友善', '热心', '有责任感'],
  values: ['正义', '和平', '社区'],
  fears: ['失去村民的信任', '怪物入侵'],
  desires: ['村庄繁荣', '村民安全'],
  quirks: ['喜欢在说话时摸胡子', '总是随身带着烟斗'],
  speech_style: '正式但亲切',
};

const mockNpcStats: NPCStats = {
  level: 10,
  strength: 12,
  dexterity: 10,
  constitution: 14,
  intelligence: 16,
  wisdom: 14,
  charisma: 15,
  attack: 15,
  defense: 12,
  speed: 8,
  customStats: {},
};

const mockNpcFlags: NPCFlags = {
  isCompanion: false,
  isMerchant: false,
  isQuestGiver: true,
  isRomanceable: false,
  isEssential: true,
  isHostile: false,
  isInvulnerable: false,
  canFollow: false,
  canTrade: false,
  canFight: false,
  customFlags: {},
};

const mockNpcStatus: NPCStatus = {
  health: 100,
  maxHealth: 100,
  mood: 'happy',
  currentLocation: 'village_chief_house',
  isAvailable: true,
  isAlive: true,
  schedule: [
    {
      id: 'schedule-001',
      dayOfWeek: [0, 1, 2, 3, 4, 5, 6],
      startTime: '06:00',
      endTime: '12:00',
      location: 'village_chief_house',
      activity: '办公',
      priority: 1,
    },
    {
      id: 'schedule-002',
      dayOfWeek: [0, 1, 2, 3, 4, 5, 6],
      startTime: '12:00',
      endTime: '14:00',
      location: 'village_square',
      activity: '午休散步',
      priority: 2,
    },
    {
      id: 'schedule-003',
      dayOfWeek: [0, 1, 2, 3, 4, 5, 6],
      startTime: '14:00',
      endTime: '20:00',
      location: 'village_chief_house',
      activity: '办公',
      priority: 1,
    },
  ],
  currentActivity: '办公',
  statusEffects: [],
  customData: {},
};

export const mockNpcRelationships: Record<string, NPCRelationship> = {
  'npc-001': {
    characterId: 'char-mock-001',
    npcId: 'npc-001',
    type: 'friendly',
    level: 45,
    trustLevel: 50,
    respectLevel: 60,
    affectionLevel: 30,
    fearLevel: 0,
    interactionCount: 5,
    lastInteractionAt: Date.now() - 3600000,
    firstMetAt: Date.now() - 86400000,
    flags: {
      met: true,
      befriended: false,
      romanced: false,
      betrayed: false,
      killed: false,
      custom: {},
    },
    notes: ['帮助解决了狼群问题'],
    customData: {},
  },
  'npc-002': {
    characterId: 'char-mock-001',
    npcId: 'npc-002',
    type: 'neutral',
    level: 20,
    trustLevel: 25,
    respectLevel: 20,
    affectionLevel: 10,
    fearLevel: 0,
    interactionCount: 2,
    lastInteractionAt: Date.now() - 86400000,
    firstMetAt: Date.now() - 172800000,
    flags: {
      met: true,
      befriended: false,
      romanced: false,
      betrayed: false,
      killed: false,
      custom: {},
    },
    notes: [],
    customData: {},
  },
};

export const mockNPCs: NPC[] = [
  {
    id: 'npc-001',
    saveId: 'save-mock-001',
    name: '村长霍华德',
    title: '绿荫村村长',
    race: 'human',
    occupation: '村长',
    appearance: {
      description: '一位年迈但精神矍铄的老人，留着白色的胡须',
      height: '中等',
      build: '瘦削',
      hairColor: '白色',
      eyeColor: '棕色',
      distinguishingFeatures: ['左眼有一道浅浅的疤痕'],
      imagePrompt: 'An elderly village chief with white beard, kind eyes, wearing simple robes, fantasy RPG style',
    },
    personality: mockNpcPersonality,
    status: mockNpcStatus,
    stats: mockNpcStats,
    flags: mockNpcFlags,
    role: 'quest_giver',
    disposition: 'helpful',
    dialogue: {
      greetings: ['欢迎来到绿荫村，旅行者。', '有什么我可以帮助你的吗？'],
      farewells: ['愿神明保佑你的旅程。', '随时欢迎回来。'],
      idle: ['最近森林里的狼群越来越多了...', '希望今年能有个好收成。'],
      combat: [],
      custom: {
        quest: ['关于那些狼群...', '你愿意帮助我们吗？'],
      },
    },
    services: [],
    inventory: [],
    quests: ['quest-001'],
    relationships: { 'char-mock-001': mockNpcRelationships['npc-001'] },
    backstory: '霍华德年轻时曾是一名冒险者，后来定居在这个村庄并成为了村长。他一直致力于保护村民的安全。',
    secrets: ['年轻时曾是皇家骑士团的一员'],
    customData: {},
    createdAt: Date.now() - 2592000000,
    updatedAt: Date.now() - 3600000,
  },
  {
    id: 'npc-002',
    saveId: 'save-mock-001',
    name: '铁匠马库斯',
    title: '绿荫村铁匠',
    race: 'human',
    occupation: '铁匠',
    appearance: {
      description: '一个身材魁梧的中年男子，手臂上有着明显的肌肉线条',
      height: '高大',
      build: '健壮',
      hairColor: '黑色',
      eyeColor: '深棕色',
      distinguishingFeatures: ['右臂上有一个火焰纹身'],
      imagePrompt: 'A muscular blacksmith with black hair, soot-stained apron, working at a forge, fantasy RPG style',
    },
    personality: {
      traits: ['直率', '勤劳', '技艺精湛'],
      values: ['工匠精神', '诚实', '质量'],
      fears: ['技艺失传', '无法完成订单'],
      desires: ['打造传世之作', '培养徒弟'],
      quirks: ['工作时喜欢哼小曲', '对武器有独特的见解'],
      speech_style: '直接、简洁',
    },
    status: {
      health: 100,
      maxHealth: 100,
      mood: 'neutral',
      currentLocation: 'village_blacksmith',
      isAvailable: true,
      isAlive: true,
      schedule: [],
      currentActivity: '锻造',
      statusEffects: [],
      customData: {},
    },
    stats: {
      ...mockNpcStats,
      strength: 18,
      intelligence: 12,
      level: 8,
    },
    flags: {
      ...mockNpcFlags,
      isQuestGiver: true,
      isMerchant: true,
      isEssential: false,
      canTrade: true,
    },
    role: 'merchant',
    disposition: 'neutral',
    dialogue: {
      greetings: ['需要修理装备吗？', '看看有什么你需要的。'],
      farewells: ['下次再来。', '愿你的剑永远锋利。'],
      idle: ['这块铁还需要多打几遍...', '最近矿石质量越来越差了。'],
      combat: [],
      custom: {
        trade: ['这是我的商品列表。', '好眼光，这是上等货。'],
      },
    },
    services: ['repair', 'craft', 'trade'],
    inventory: ['item-weapon-001', 'item-armor-001'],
    quests: ['quest-002'],
    relationships: { 'char-mock-001': mockNpcRelationships['npc-002'] },
    backstory: '马库斯从小跟随父亲学习锻造，后来成为了村里最好的铁匠。他的作品在附近几个村庄都很有名。',
    secrets: ['其实他年轻时曾是皇家武器匠'],
    customData: {},
    createdAt: Date.now() - 2592000000,
    updatedAt: Date.now() - 86400000,
  },
  {
    id: 'npc-003',
    saveId: 'save-mock-001',
    name: '旅店老板娘玛丽',
    title: '绿荫村旅店老板',
    race: 'human',
    occupation: '旅店老板',
    appearance: {
      description: '一位和蔼可亲的中年女性，总是带着温暖的微笑',
      height: '中等',
      build: '丰满',
      hairColor: '棕色',
      eyeColor: '绿色',
      distinguishingFeatures: ['脖子上戴着一条精致的项链'],
      imagePrompt: 'A friendly middle-aged innkeeper woman with brown hair, warm smile, wearing an apron, fantasy RPG style',
    },
    personality: {
      traits: ['热情', '健谈', '善良'],
      values: ['家庭', '友情', '美食'],
      fears: ['旅店生意不好', '儿子在外面出事'],
      desires: ['旅店生意兴隆', '儿子平安归来'],
      quirks: ['喜欢给客人推荐特色菜', '总是记得常客的喜好'],
      speech_style: '亲切、热情',
    },
    status: {
      health: 80,
      maxHealth: 80,
      mood: 'happy',
      currentLocation: 'village_inn',
      isAvailable: true,
      isAlive: true,
      schedule: [],
      currentActivity: '招待客人',
      statusEffects: [],
      customData: {},
    },
    stats: {
      ...mockNpcStats,
      charisma: 18,
      strength: 8,
      level: 5,
    },
    flags: {
      ...mockNpcFlags,
      isQuestGiver: false,
      isMerchant: true,
      isEssential: false,
      canTrade: true,
    },
    role: 'merchant',
    disposition: 'helpful',
    dialogue: {
      greetings: ['欢迎光临！需要住宿还是用餐？', '哎呀，又见面了！'],
      farewells: ['欢迎下次再来！', '祝你旅途愉快！'],
      idle: ['今天的炖肉特别香...', '最近客人越来越多了。'],
      combat: [],
      custom: {
        rest: ['需要休息吗？一晚只要 10 金币。', '房间已经为你准备好了。'],
      },
    },
    services: ['rest', 'food', 'drink'],
    inventory: [],
    quests: [],
    relationships: {},
    backstory: '玛丽的丈夫几年前去世了，她独自经营着这家旅店。她的儿子现在是一名冒险者，正在远方旅行。',
    secrets: ['她其实知道很多旅行者带来的秘密'],
    customData: {},
    createdAt: Date.now() - 2592000000,
    updatedAt: Date.now() - 86400000,
  },
];

// ==================== 模拟地图数据 ====================

const generateMockTiles = (): MapTile[][] => {
  const tiles: MapTile[][] = [];
  for (let y = 0; y < 15; y++) {
    const row: MapTile[] = [];
    for (let x = 0; x < 20; x++) {
      // 创建一个简单的地图布局
      let type = 'grass';
      let walkable = true;

      // 边界是墙
      if (x === 0 || x === 19 || y === 0 || y === 14) {
        type = 'wall';
        walkable = false;
      }
      // 中心区域是村庄
      else if (x >= 8 && x <= 11 && y >= 6 && y <= 8) {
        type = 'village';
      }
      // 一些水域
      else if (x >= 2 && x <= 4 && y >= 10 && y <= 12) {
        type = 'water';
        walkable = false;
      }
      // 森林区域
      else if (x >= 14 && x <= 17 && y >= 2 && y <= 5) {
        type = 'forest';
      }
      // 山地
      else if (x >= 15 && x <= 18 && y >= 10 && y <= 13) {
        type = 'mountain';
        walkable = false;
      }

      row.push({
        type,
        walkable,
        properties: {},
      });
    }
    tiles.push(row);
  }
  return tiles;
};

export const mockMapLocations: MapLocation[] = [
  {
    id: 'loc-001',
    name: '绿荫村',
    type: 'village',
    position: { x: 9, y: 7 },
    description: '一个宁静的小村庄，周围环绕着茂密的森林。',
    discovered: true,
  },
  {
    id: 'loc-002',
    name: '村长家',
    type: 'building',
    position: { x: 10, y: 6 },
    description: '村长霍华德的住所，也是村庄的行政中心。',
    discovered: true,
  },
  {
    id: 'loc-003',
    name: '铁匠铺',
    type: 'building',
    position: { x: 8, y: 7 },
    description: '马库斯的铁匠铺，可以修理和购买装备。',
    discovered: true,
  },
  {
    id: 'loc-004',
    name: '旅店',
    type: 'building',
    position: { x: 11, y: 7 },
    description: '玛丽经营的旅店，提供住宿和餐饮服务。',
    discovered: true,
  },
  {
    id: 'loc-005',
    name: '东部森林',
    type: 'forest',
    position: { x: 16, y: 3 },
    description: '一片茂密的森林，据说有狼群出没。',
    discovered: true,
  },
  {
    id: 'loc-006',
    name: '小湖',
    type: 'water',
    position: { x: 3, y: 11 },
    description: '一个清澈的小湖，适合钓鱼。',
    discovered: true,
  },
  {
    id: 'loc-007',
    name: '矿山',
    type: 'mountain',
    position: { x: 17, y: 12 },
    description: '一座废弃的矿山，传说深处有宝藏。',
    discovered: false,
  },
];

export const mockMapConnections: MapConnection[] = [
  { from: 'loc-001', to: 'loc-002', type: 'bidirectional' },
  { from: 'loc-001', to: 'loc-003', type: 'bidirectional' },
  { from: 'loc-001', to: 'loc-004', type: 'bidirectional' },
  { from: 'loc-001', to: 'loc-005', type: 'bidirectional' },
  { from: 'loc-001', to: 'loc-006', type: 'bidirectional' },
  { from: 'loc-005', to: 'loc-007', type: 'oneway', requirements: ['quest-001'] },
];

export const mockMapEncounters: MapEncounter[] = [
  {
    id: 'encounter-001',
    type: 'combat',
    position: { x: 16, y: 3 },
    trigger: 'random',
    probability: 0.3,
    data: {
      enemies: ['wolf', 'wolf'],
      minLevel: 3,
      maxLevel: 5,
    },
  },
  {
    id: 'encounter-002',
    type: 'treasure',
    position: { x: 17, y: 12 },
    trigger: 'interact',
    probability: 1,
    data: {
      items: ['item-ring-001'],
      gold: 100,
    },
  },
];

export const mockMapItems: MapItem[] = [
  {
    itemId: 'item-material-001',
    position: { x: 15, y: 4 },
    quantity: 3,
    hidden: false,
  },
  {
    itemId: 'item-potion-001',
    position: { x: 4, y: 10 },
    quantity: 2,
    hidden: true,
  },
];

export const mockGameMap: GameMap = {
  id: 'map-001',
  name: '绿荫村及周边',
  description: '一个宁静的小村庄，周围环绕着森林、湖泊和山脉。',
  type: 'overworld',
  size: {
    width: 20,
    height: 15,
  },
  tiles: generateMockTiles(),
  locations: mockMapLocations,
  connections: mockMapConnections,
  encounters: mockMapEncounters,
  npcs: ['npc-001', 'npc-002', 'npc-003'],
  items: mockMapItems,
};

// ==================== 模拟战斗数据 ====================

export const mockCombatUnitStats: CombatUnitStats = {
  maxHp: 120,
  currentHp: 95,
  maxMp: 40,
  currentMp: 35,
  attack: 25,
  defense: 18,
  speed: 10,
  luck: 5,
};

export const mockCombatUnits: CombatUnit[] = [
  {
    id: 'char-mock-001',
    name: '艾瑞克',
    type: 'player',
    level: 5,
    stats: mockCombatUnitStats,
    skills: ['skill-001', 'skill-002', 'skill-003'],
    statusEffects: [],
    isDefending: false,
    isAlive: true,
    position: { x: 2, y: 2 },
  },
  {
    id: 'enemy-001',
    name: '森林狼',
    type: 'enemy',
    level: 4,
    stats: {
      maxHp: 60,
      currentHp: 60,
      maxMp: 0,
      currentMp: 0,
      attack: 18,
      defense: 8,
      speed: 12,
      luck: 3,
    },
    skills: ['bite', 'howl'],
    statusEffects: [],
    isDefending: false,
    isAlive: true,
    position: { x: 4, y: 3 },
  },
  {
    id: 'enemy-002',
    name: '森林狼',
    type: 'enemy',
    level: 3,
    stats: {
      maxHp: 50,
      currentHp: 50,
      maxMp: 0,
      currentMp: 0,
      attack: 15,
      defense: 6,
      speed: 11,
      luck: 2,
    },
    skills: ['bite'],
    statusEffects: [],
    isDefending: false,
    isAlive: true,
    position: { x: 5, y: 2 },
  },
];

export const mockCombatActions: CombatAction[] = [
  {
    id: 'action-001',
    actorId: 'char-mock-001',
    type: ActionType.ATTACK,
    targetId: 'enemy-001',
    damage: 22,
    success: true,
    message: '艾瑞克 攻击了 森林狼，造成 22 点伤害！',
    timestamp: Date.now() - 60000,
  },
  {
    id: 'action-002',
    actorId: 'enemy-001',
    type: ActionType.ATTACK,
    targetId: 'char-mock-001',
    damage: 12,
    success: true,
    message: '森林狼 咬伤了 艾瑞克，造成 12 点伤害！',
    timestamp: Date.now() - 55000,
  },
  {
    id: 'action-003',
    actorId: 'enemy-002',
    type: ActionType.ATTACK,
    targetId: 'char-mock-001',
    damage: 8,
    success: true,
    message: '森林狼 攻击了 艾瑞克，造成 8 点伤害！',
    timestamp: Date.now() - 50000,
  },
  {
    id: 'action-004',
    actorId: 'char-mock-001',
    type: ActionType.SKILL,
    targetId: 'enemy-001',
    skillId: 'skill-001',
    damage: 35,
    success: true,
    message: '艾瑞克 使用了 猛击，对 森林狼 造成 35 点伤害！',
    timestamp: Date.now() - 45000,
  },
];

export const mockCombatInstance: CombatInstanceData = {
  id: 'combat-mock-001',
  state: CombatState.IN_PROGRESS,
  difficulty: CombatDifficulty.NORMAL,
  turnOrder: ['char-mock-001', 'enemy-001', 'enemy-002'],
  currentTurnIndex: 0,
  turnNumber: 2,
  units: mockCombatUnits.map((unit) => [unit.id, unit]),
  turnHistory: [
    {
      turnNumber: 1,
      phase: 'player',
      actions: mockCombatActions.slice(0, 1),
      timestamp: Date.now() - 60000,
    },
    {
      turnNumber: 1,
      phase: 'enemy',
      actions: mockCombatActions.slice(1, 3),
      timestamp: Date.now() - 55000,
    },
  ],
  startTime: Date.now() - 120000,
  environment: {
    terrain: 'forest',
    weather: 'clear',
    modifiers: { speed: -1 },
  },
};

// ==================== 模拟状态效果 ====================

export const mockStatusEffects: StatusEffect[] = [
  {
    id: 'status-001',
    name: '攻击提升',
    type: 'buff',
    duration: 3,
    remainingTurns: 2,
    effects: [
      { attribute: 'attack', modifier: 10, type: 'flat' },
    ],
  },
  {
    id: 'status-002',
    name: '中毒',
    type: 'debuff',
    duration: 5,
    remainingTurns: 3,
    effects: [
      { attribute: 'currentHp', modifier: -5, type: 'flat' },
    ],
  },
];

// ==================== 模拟全局上下文 ====================

export const mockGlobalContext: GlobalContext = {
  player: {
    id: 'char-mock-001',
    name: '艾瑞克',
    race: 'human',
    class: 'warrior',
    background: 'soldier',
    level: 5,
    experience: 1250,
    attributes: {
      strength: 16,
      dexterity: 12,
      constitution: 14,
      intelligence: 10,
      wisdom: 8,
      charisma: 10,
    },
    health: 95,
    maxHealth: 120,
    mana: 35,
    maxMana: 40,
    location: '绿荫村',
  },
  world: {
    id: 'world-001',
    name: '艾尔德兰大陆',
    currentTime: Date.now(),
    weather: '晴朗',
    exploredAreas: ['绿荫村', '东部森林', '小湖'],
    worldState: {
      dayCount: 7,
      season: 'spring',
    },
  },
  combat: null,
  inventory: {
    items: mockInventoryItems,
    equipment: mockEquipmentState as unknown as Record<string, unknown>,
    currency: { gold: 500, silver: 250 },
  },
  quests: {
    active: mockQuests.filter((q) => q.status === 'in_progress').map((q) => q.id),
    completed: mockQuests.filter((q) => q.status === 'completed').map((q) => q.id),
    failed: [],
  },
  npcs: {
    met: mockNPCs.map((npc) => npc.id),
    relationships: Object.fromEntries(
      Object.entries(mockNpcRelationships).map(([id, rel]) => [id, rel.level])
    ),
    party: [],
  },
  story: {
    currentNode: 'node-001',
    choices: [],
    plotPoints: [],
  },
  dialogue: {
    history: [],
    currentNpc: undefined,
  },
  metadata: {
    createdAt: Date.now() - 259200000,
    updatedAt: Date.now() - 3600,
    saveVersion: '1.0.0',
    templateId: 'template-fantasy-001',
    gameMode: 'turn_based_rpg',
  },
};

// ==================== 模拟对话选项 ====================

export const mockDialogueOptions: DialogueOption[] = [
  { id: 'opt-001', text: '询问关于狼群的情况', type: 'normal' },
  { id: 'opt-002', text: '接受任务', type: 'quest' },
  { id: 'opt-003', text: '拒绝任务', type: 'normal' },
  { id: 'opt-004', text: '询问其他村民的看法', type: 'normal' },
  { id: 'opt-005', text: '离开', type: 'system' },
];

// ==================== 模拟日志数据 ====================

/**
 * 扩展的日志条目类型（添加 relatedId 字段）
 */
export interface MockJournalEntry extends JournalEntry {
  relatedId?: string;
}

export const mockJournalEntries: MockJournalEntry[] = [
  {
    id: 'journal-001',
    timestamp: Date.now() - 86400000,
    type: 'quest',
    content: '接受了村长的委托，前往东部森林清除狼群',
    relatedId: 'quest-001',
  },
  {
    id: 'journal-002',
    timestamp: Date.now() - 43200000,
    type: 'discovery',
    content: '进入了东部森林，发现了狼群的踪迹',
  },
  {
    id: 'journal-003',
    timestamp: Date.now() - 3600000,
    type: 'combat',
    content: '与森林狼战斗，击败了 2 只狼',
  },
  {
    id: 'journal-004',
    timestamp: Date.now() - 172800000,
    type: 'quest',
    content: '帮助铁匠收集了 10 个铁矿石',
    relatedId: 'quest-002',
  },
  {
    id: 'journal-005',
    timestamp: Date.now() - 259200000,
    type: 'discovery',
    content: '发现了神秘洞穴的入口',
  },
  {
    id: 'journal-006',
    timestamp: Date.now() - 259200000,
    type: 'combat',
    content: '击败了洞穴深处的怪物，找到了宝藏',
  },
  {
    id: 'journal-007',
    timestamp: Date.now() - 259200000,
    type: 'quest',
    content: '完成了洞穴探险任务',
    relatedId: 'quest-003',
  },
  {
    id: 'journal-008',
    timestamp: Date.now() - 7200000,
    type: 'dialog',
    content: '与村长霍华德交谈，了解了更多关于村庄的历史',
    relatedId: 'npc-001',
  },
];

// ==================== 动态 UI 数据 ====================

export const mockDynamicUI: DynamicUIData = {
  id: 'dynamic-ui-mock',
  markdown: `:::system-notify{type=welcome}
## 🌟 欢迎来到绿荫村

**艾瑞克**，你的冒险即将开始！

当前任务：拯救村庄
- 前往村庄东边的森林
- 击败森林中的狼群
- 返回村长处报告

:::options
[查看任务详情](action:view_quest)
[打开地图](action:open_map)
[继续探索](action:explore)
:::
:::`,
  context: { characterId: 'char-mock-001', location: '绿荫村' },
};

// ==================== 完整模拟游戏状态 ====================

export interface MockGameState {
  character: Character;
  skills: Skill[];
  items: Item[];
  equipment: EquipmentState;
  inventory: InventoryItem[];
  quests: Quest[];
  npcs: NPC[];
  npcRelationships: Record<string, NPCRelationship>;
  map: GameMap;
  combat: CombatInstanceData | null;
  statusEffects: StatusEffect[];
  globalContext: GlobalContext;
  dialogueOptions: DialogueOption[];
  journalEntries: MockJournalEntry[];
  dynamicUI: DynamicUIData;
}

export const mockGameState: MockGameState = {
  character: mockCharacter,
  skills: mockSkills,
  items: mockItems,
  equipment: mockEquipmentState,
  inventory: mockInventoryItems,
  quests: mockQuests,
  npcs: mockNPCs,
  npcRelationships: mockNpcRelationships,
  map: mockGameMap,
  combat: null,
  statusEffects: mockStatusEffects,
  globalContext: mockGlobalContext,
  dialogueOptions: mockDialogueOptions,
  journalEntries: mockJournalEntries,
  dynamicUI: mockDynamicUI,
};

// ==================== 边界情况数据 ====================

/**
 * 空数据状态，用于测试边界情况
 */
export const emptyMockData = {
  character: null,
  skills: [],
  items: [],
  equipment: {
    weapon: undefined,
    head: undefined,
    body: undefined,
    feet: undefined,
    accessories: [],
  },
  inventory: [],
  quests: [],
  npcs: [],
  npcRelationships: {},
  map: null,
  combat: null,
  statusEffects: [],
  globalContext: null,
  dialogueOptions: [],
  journalEntries: [],
};

/**
 * 异常数据状态，用于测试错误处理
 */
export const invalidMockData = {
  character: {
    id: '',
    name: '',
    race: 'invalid_race',
    class: 'invalid_class',
    level: -1,
    experience: -100,
    baseAttributes: {
      strength: -5,
      dexterity: 0,
      constitution: 0,
      intelligence: 0,
      wisdom: 0,
      charisma: 0,
    },
    derivedAttributes: {
      maxHp: 0,
      currentHp: -10,
      maxMp: 0,
      currentMp: 0,
      attack: 0,
      defense: 0,
      speed: 0,
      luck: 0,
    },
    skills: [],
    equipment: {},
    inventory: [],
    currency: {},
    statusEffects: [],
    appearance: '',
    personality: '',
    backstory: '',
    statistics: {
      battlesWon: 0,
      questsCompleted: 0,
      distanceTraveled: 0,
      itemsCrafted: 0,
      npcsMet: 0,
      playTime: 0,
    },
  },
  skills: [],
  items: [],
  equipment: {},
  inventory: [],
  quests: [],
  npcs: [],
  npcRelationships: {},
  map: null,
  combat: null,
  statusEffects: [],
  globalContext: null,
  dialogueOptions: [],
  journalEntries: [],
};
