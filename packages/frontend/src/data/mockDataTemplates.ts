/**
 * 数据模拟模板
 * 用于开发者工具面板快速测试各种数据状态
 */

import type {
  GameState,
  Character,
  Skill,
  InventoryItem,
  Quest,
  NPC,
  JournalEntry,
  GameMap,
  DynamicUIData,
  EquipmentState,
} from '@ai-rpg/shared';

// ==================== 类型定义 ====================

export type TemplateType = 'normal' | 'incomplete' | 'error';

export interface MockTemplate {
  id: string;
  name: string;
  type: TemplateType;
  description: string;
  data: Partial<GameState>;
}

// ==================== 角色模板 ====================

export const characterTemplates: MockTemplate[] = [
  {
    id: 'char_normal_1',
    name: '正常角色 - 战士',
    type: 'normal',
    description: '完整的战士角色数据，等级5',
    data: {
      character: {
        id: 'char_001',
        name: '艾瑞克',
        race: 'human',
        class: 'warrior',
        level: 5,
        experience: 450,
        experienceToLevel: 500,
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
          weapon: 'item_weapon_001',
          body: 'item_armor_001',
        },
        inventory: [],
        currency: { gold: 500, silver: 250 },
        statusEffects: [],
        appearance: '一位身材魁梧的战士，有着棕色的短发和坚毅的眼神',
        personality: '勇敢、正直、有时过于直率',
        backstory: '出生于边境小镇，曾是当地卫队的一员',
        backgroundId: 'soldier',
        statistics: {
          battlesWon: 15,
          questsCompleted: 8,
          distanceTraveled: 1200,
          itemsCrafted: 5,
          npcsMet: 25,
          playTime: 36000,
        },
      } as Character,
    },
  },
  {
    id: 'char_normal_2',
    name: '正常角色 - 法师',
    type: 'normal',
    description: '完整的法师角色数据，等级8',
    data: {
      character: {
        id: 'char_002',
        name: '莉娜',
        race: 'elf',
        class: 'mage',
        level: 8,
        experience: 780,
        experienceToLevel: 800,
        baseAttributes: {
          strength: 8,
          dexterity: 14,
          constitution: 10,
          intelligence: 18,
          wisdom: 16,
          charisma: 12,
        },
        derivedAttributes: {
          maxHp: 80,
          currentHp: 80,
          maxMp: 150,
          currentMp: 120,
          attack: 15,
          defense: 8,
          speed: 12,
          luck: 8,
        },
        skills: [],
        equipment: {
          weapon: 'item_staff_001',
          body: 'item_robe_001',
        },
        inventory: [],
        currency: { gold: 800, silver: 500 },
        statusEffects: [],
        appearance: '一位优雅的精灵法师，银色长发，眼中闪烁着智慧的光芒',
        personality: '冷静、睿智、对魔法充满热情',
        backstory: '来自精灵王国的魔法学院，正在寻找失落的古代魔法',
        backgroundId: 'scholar',
        statistics: {
          battlesWon: 25,
          questsCompleted: 12,
          distanceTraveled: 2500,
          itemsCrafted: 30,
          npcsMet: 40,
          playTime: 72000,
        },
      } as Character,
    },
  },
  {
    id: 'char_normal_3',
    name: '正常角色 - 盗贼',
    type: 'normal',
    description: '完整的盗贼角色数据，等级3',
    data: {
      character: {
        id: 'char_003',
        name: '暗影',
        race: 'halfling',
        class: 'rogue',
        level: 3,
        experience: 180,
        experienceToLevel: 300,
        baseAttributes: {
          strength: 10,
          dexterity: 18,
          constitution: 12,
          intelligence: 14,
          wisdom: 10,
          charisma: 14,
        },
        derivedAttributes: {
          maxHp: 70,
          currentHp: 70,
          maxMp: 50,
          currentMp: 50,
          attack: 20,
          defense: 12,
          speed: 18,
          luck: 15,
        },
        skills: [],
        equipment: {
          weapon: 'item_dagger_001',
          body: 'item_leather_001',
        },
        inventory: [],
        currency: { gold: 300, silver: 800 },
        statusEffects: [],
        appearance: '一个身手敏捷的半身人，总是穿着深色的斗篷',
        personality: '机警、谨慎、喜欢独来独往',
        backstory: '曾是城市盗贼公会的成员，现在独自冒险',
        backgroundId: 'criminal',
        statistics: {
          battlesWon: 10,
          questsCompleted: 5,
          distanceTraveled: 800,
          itemsCrafted: 2,
          npcsMet: 15,
          playTime: 18000,
        },
      } as Character,
    },
  },
  {
    id: 'char_incomplete_1',
    name: '不完整角色 - 缺少属性',
    type: 'incomplete',
    description: '角色数据缺少部分属性字段',
    data: {
      character: {
        id: 'char_004',
        name: '测试角色',
        race: 'human',
        class: 'warrior',
        level: 1,
        experience: 0,
        baseAttributes: {
          strength: 10,
          dexterity: 10,
          constitution: 10,
          intelligence: 10,
          wisdom: 10,
          charisma: 10,
        },
        derivedAttributes: {
          maxHp: 100,
          currentHp: 100,
          maxMp: 50,
          currentMp: 50,
          attack: 10,
          defense: 10,
          speed: 10,
          luck: 5,
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
      } as Character,
    },
  },
  {
    id: 'char_error_1',
    name: '错误角色 - 负数值',
    type: 'error',
    description: '角色数据包含负数值，用于测试错误处理',
    data: {
      character: {
        id: 'char_error',
        name: '错误角色',
        race: 'unknown',
        class: 'invalid',
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
      } as Character,
    },
  },
];

// ==================== 技能模板 ====================

export const skillTemplates: MockTemplate[] = [
  {
    id: 'skill_normal_1',
    name: '正常技能组 - 战士',
    type: 'normal',
    description: '战士职业的完整技能组',
    data: {
      skills: [
        {
          id: 'skill_001',
          name: '猛击',
          description: '用尽全力挥击，造成 150% 武器伤害',
          level: 3,
          maxLevel: 5,
          type: 'active',
          category: 'combat',
          cost: { type: 'mp', value: 10 },
          cooldown: 2,
          effects: [{ type: 'damage', value: 1.5, condition: 'weapon_damage' }],
          requirements: [{ type: 'level', value: 1 }],
        },
        {
          id: 'skill_002',
          name: '盾击',
          description: '用盾牌猛击敌人，造成伤害并有几率眩晕',
          level: 2,
          maxLevel: 5,
          type: 'active',
          category: 'combat',
          cost: { type: 'mp', value: 8 },
          cooldown: 3,
          effects: [
            { type: 'damage', value: 80 },
            { type: 'stun', value: 1, duration: 1 },
          ],
          requirements: [{ type: 'level', value: 3 }],
        },
        {
          id: 'skill_003',
          name: '战斗怒吼',
          description: '发出震慑敌人的怒吼，提升自身攻击力',
          level: 1,
          maxLevel: 5,
          type: 'active',
          category: 'combat',
          cost: { type: 'mp', value: 15 },
          cooldown: 5,
          effects: [{ type: 'buff_attack', value: 20, duration: 3 }],
          requirements: [{ type: 'level', value: 5 }],
        },
      ] as Skill[],
    },
  },
  {
    id: 'skill_normal_2',
    name: '正常技能组 - 法师',
    type: 'normal',
    description: '法师职业的完整技能组',
    data: {
      skills: [
        {
          id: 'skill_mage_001',
          name: '火球术',
          description: '发射一个火球，对目标造成火焰伤害',
          level: 4,
          maxLevel: 5,
          type: 'active',
          category: 'magic',
          cost: { type: 'mp', value: 20 },
          cooldown: 1,
          effects: [{ type: 'fire_damage', value: 120 }],
          requirements: [{ type: 'level', value: 1 }],
        },
        {
          id: 'skill_mage_002',
          name: '冰霜护盾',
          description: '为自己创建一个冰霜护盾，吸收伤害',
          level: 3,
          maxLevel: 5,
          type: 'active',
          category: 'magic',
          cost: { type: 'mp', value: 25 },
          cooldown: 8,
          effects: [{ type: 'shield', value: 100, duration: 3 }],
          requirements: [{ type: 'level', value: 5 }],
        },
        {
          id: 'skill_mage_003',
          name: '魔力涌动',
          description: '被动提升最大魔力值 20%',
          level: 2,
          maxLevel: 3,
          type: 'passive',
          category: 'magic',
          cost: { type: 'mp', value: 0 },
          cooldown: 0,
          effects: [{ type: 'max_mp_bonus', value: 0.2 }],
          requirements: [{ type: 'attribute', value: 'intelligence' }],
        },
      ] as Skill[],
    },
  },
  {
    id: 'skill_normal_3',
    name: '正常技能组 - 盗贼',
    type: 'normal',
    description: '盗贼职业的完整技能组',
    data: {
      skills: [
        {
          id: 'skill_rogue_001',
          name: '背刺',
          description: '从背后攻击敌人，造成额外伤害',
          level: 3,
          maxLevel: 5,
          type: 'active',
          category: 'combat',
          cost: { type: 'mp', value: 5 },
          cooldown: 2,
          effects: [{ type: 'damage', value: 2.0, condition: 'from_behind' }],
          requirements: [{ type: 'level', value: 1 }],
        },
        {
          id: 'skill_rogue_002',
          name: '潜行',
          description: '进入隐身状态，降低被发现的几率',
          level: 2,
          maxLevel: 5,
          type: 'active',
          category: 'exploration',
          cost: { type: 'mp', value: 10 },
          cooldown: 10,
          effects: [{ type: 'invisible', value: 1, duration: 5 }],
          requirements: [{ type: 'level', value: 3 }],
        },
        {
          id: 'skill_rogue_003',
          name: '开锁',
          description: '打开锁住的门或宝箱',
          level: 1,
          maxLevel: 3,
          type: 'active',
          category: 'exploration',
          cost: { type: 'mp', value: 0 },
          cooldown: 0,
          effects: [{ type: 'unlock', value: 1 }],
          requirements: [{ type: 'attribute', value: 'dexterity' }],
        },
      ] as Skill[],
    },
  },
  {
    id: 'skill_incomplete_1',
    name: '不完整技能组 - 空数组',
    type: 'incomplete',
    description: '技能数组为空',
    data: {
      skills: [],
    },
  },
];

// ==================== 背包物品模板 ====================

export const inventoryTemplates: MockTemplate[] = [
  {
    id: 'inv_normal_1',
    name: '正常背包 - 混合物品',
    type: 'normal',
    description: '包含各种类型物品的背包',
    data: {
      inventory: [
        {
          id: 'inv_001',
          itemId: 'item_potion_hp',
          quantity: 5,
          equipped: false,
          obtainedAt: Date.now() - 3600000,
          type: 'consumable',
        },
        {
          id: 'inv_002',
          itemId: 'item_potion_mp',
          quantity: 3,
          equipped: false,
          obtainedAt: Date.now() - 3600000,
          type: 'consumable',
        },
        {
          id: 'inv_003',
          itemId: 'item_iron_ore',
          quantity: 15,
          equipped: false,
          obtainedAt: Date.now() - 7200000,
          type: 'material',
        },
        {
          id: 'inv_004',
          itemId: 'item_quest_letter',
          quantity: 1,
          equipped: false,
          obtainedAt: Date.now() - 1800000,
          type: 'quest',
        },
      ] as InventoryItem[],
    },
  },
  {
    id: 'inv_normal_2',
    name: '正常背包 - 大量物品',
    type: 'normal',
    description: '包含大量物品的背包，测试滚动和性能',
    data: {
      inventory: Array.from({ length: 30 }, (_, i) => ({
        id: `inv_large_${i}`,
        itemId: `item_${i}`,
        quantity: Math.floor(Math.random() * 10) + 1,
        equipped: false,
        obtainedAt: Date.now() - Math.random() * 86400000,
        type: ['consumable', 'material', 'misc'][i % 3] as InventoryItem['type'],
      })) as InventoryItem[],
    },
  },
  {
    id: 'inv_normal_3',
    name: '正常背包 - 装备物品',
    type: 'normal',
    description: '包含装备类物品的背包',
    data: {
      inventory: [
        {
          id: 'inv_equip_001',
          itemId: 'item_sword_iron',
          quantity: 1,
          equipped: false,
          obtainedAt: Date.now() - 86400000,
          type: 'weapon',
        },
        {
          id: 'inv_equip_002',
          itemId: 'item_armor_leather',
          quantity: 1,
          equipped: false,
          obtainedAt: Date.now() - 86400000,
          type: 'armor',
        },
        {
          id: 'inv_equip_003',
          itemId: 'item_ring_power',
          quantity: 1,
          equipped: false,
          obtainedAt: Date.now() - 43200000,
          type: 'accessory',
        },
      ] as InventoryItem[],
    },
  },
  {
    id: 'inv_incomplete_1',
    name: '不完整背包 - 空背包',
    type: 'incomplete',
    description: '背包为空',
    data: {
      inventory: [],
    },
  },
];

// ==================== 装备模板 ====================

export const equipmentTemplates: MockTemplate[] = [
  {
    id: 'equip_normal_1',
    name: '正常装备 - 战士套装',
    type: 'normal',
    description: '战士职业的完整装备',
    data: {
      equipment: {
        weapon: {
          id: 'eq_weapon_001',
          itemId: 'item_sword_steel',
          slot: 'weapon',
          equippedAt: Date.now() - 86400000,
        },
        head: {
          id: 'eq_head_001',
          itemId: 'item_helmet_iron',
          slot: 'head',
          equippedAt: Date.now() - 86400000,
        },
        body: {
          id: 'eq_body_001',
          itemId: 'item_armor_iron',
          slot: 'body',
          equippedAt: Date.now() - 86400000,
        },
        feet: {
          id: 'eq_feet_001',
          itemId: 'item_boots_leather',
          slot: 'feet',
          equippedAt: Date.now() - 86400000,
        },
        accessories: [
          {
            id: 'eq_acc_001',
            itemId: 'item_ring_strength',
            slot: 'accessory',
            equippedAt: Date.now() - 43200000,
          },
        ],
      } as EquipmentState,
    },
  },
  {
    id: 'equip_normal_2',
    name: '正常装备 - 法师套装',
    type: 'normal',
    description: '法师职业的完整装备',
    data: {
      equipment: {
        weapon: {
          id: 'eq_weapon_002',
          itemId: 'item_staff_fire',
          slot: 'weapon',
          equippedAt: Date.now() - 86400000,
        },
        body: {
          id: 'eq_body_002',
          itemId: 'item_robe_mage',
          slot: 'body',
          equippedAt: Date.now() - 86400000,
        },
        accessories: [
          {
            id: 'eq_acc_002',
            itemId: 'item_amulet_mana',
            slot: 'accessory',
            equippedAt: Date.now() - 43200000,
          },
          {
            id: 'eq_acc_003',
            itemId: 'item_ring_intelligence',
            slot: 'accessory',
            equippedAt: Date.now() - 43200000,
          },
        ],
      } as EquipmentState,
    },
  },
  {
    id: 'equip_incomplete_1',
    name: '不完整装备 - 仅武器',
    type: 'incomplete',
    description: '只装备了武器',
    data: {
      equipment: {
        weapon: {
          id: 'eq_weapon_only',
          itemId: 'item_sword_basic',
          slot: 'weapon',
          equippedAt: Date.now(),
        },
        accessories: [],
      } as EquipmentState,
    },
  },
  {
    id: 'equip_incomplete_2',
    name: '不完整装备 - 空装备',
    type: 'incomplete',
    description: '没有任何装备',
    data: {
      equipment: {
        accessories: [],
      } as EquipmentState,
    },
  },
];

// ==================== 任务模板 ====================

export const questTemplates: MockTemplate[] = [
  {
    id: 'quest_normal_1',
    name: '正常任务 - 进行中',
    type: 'normal',
    description: '包含多个进行中和已完成任务',
    data: {
      quests: [
        {
          id: 'quest_001',
          name: '拯救村庄',
          description: '村长请求你清除威胁村庄安全的狼群',
          type: 'main',
          status: 'in_progress',
          objectives: [
            {
              id: 'obj_001_1',
              description: '前往村庄东边的森林',
              type: 'explore',
              target: 'forest_east',
              current: 1,
              required: 1,
              isCompleted: true,
            },
            {
              id: 'obj_001_2',
              description: '击败森林中的狼群',
              type: 'kill',
              target: 'wolf',
              current: 2,
              required: 5,
              isCompleted: false,
            },
            {
              id: 'obj_001_3',
              description: '返回村长处报告',
              type: 'talk',
              target: 'npc_village_chief',
              current: 0,
              required: 1,
              isCompleted: false,
            },
          ],
          prerequisites: [],
          rewards: {
            experience: 200,
            currency: { gold: 100 },
            items: [{ itemId: 'item_potion_hp', quantity: 3 }],
          },
          log: [
            { timestamp: Date.now() - 86400000, event: '接受了村长的委托' },
            { timestamp: Date.now() - 43200000, event: '进入森林探索' },
          ],
          createdAt: Date.now() - 86400000,
          updatedAt: Date.now() - 3600000,
        } as Quest,
        {
          id: 'quest_002',
          name: '铁匠的请求',
          description: '帮助铁匠收集铁矿石',
          type: 'side',
          status: 'in_progress',
          objectives: [
            {
              id: 'obj_002_1',
              description: '收集 10 个铁矿石',
              type: 'collect',
              target: 'item_iron_ore',
              current: 10,
              required: 10,
              isCompleted: true,
            },
          ],
          prerequisites: [],
          rewards: { experience: 50, currency: { gold: 50 } },
          log: [],
          createdAt: Date.now() - 172800000,
          updatedAt: Date.now() - 86400000,
        } as Quest,
      ],
    },
  },
  {
    id: 'quest_normal_2',
    name: '正常任务 - 已完成',
    type: 'normal',
    description: '所有任务都已完成',
    data: {
      quests: [
        {
          id: 'quest_003',
          name: '洞穴探险',
          description: '探索神秘洞穴并寻找宝藏',
          type: 'side',
          status: 'completed',
          objectives: [
            {
              id: 'obj_003_1',
              description: '调查神秘洞穴',
              type: 'explore',
              target: 'mysterious_cave',
              current: 1,
              required: 1,
              isCompleted: true,
            },
            {
              id: 'obj_003_2',
              description: '击败洞穴深处的怪物',
              type: 'kill',
              target: 'cave_monster',
              current: 1,
              required: 1,
              isCompleted: true,
            },
          ],
          prerequisites: [],
          rewards: { experience: 150, currency: { gold: 200 } },
          log: [{ timestamp: Date.now() - 259200000, event: '任务完成！' }],
          createdAt: Date.now() - 259200000,
          updatedAt: Date.now() - 259200000,
        } as Quest,
      ],
    },
  },
  {
    id: 'quest_normal_3',
    name: '正常任务 - 锁定任务',
    type: 'normal',
    description: '包含锁定的主线任务',
    data: {
      quests: [
        {
          id: 'quest_004',
          name: '失落的神器',
          description: '传说中有一件神器散落在远古遗迹中...',
          type: 'main',
          status: 'locked',
          objectives: [
            {
              id: 'obj_004_1',
              description: '达到 10 级',
              type: 'custom',
              target: 'level',
              current: 5,
              required: 10,
              isCompleted: false,
            },
          ],
          prerequisites: ['quest_001'],
          rewards: { experience: 500, currency: { gold: 500 } },
          log: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        } as Quest,
      ],
    },
  },
  {
    id: 'quest_incomplete_1',
    name: '不完整任务 - 空列表',
    type: 'incomplete',
    description: '没有任何任务',
    data: {
      quests: [],
    },
  },
];

// ==================== NPC 模板 ====================

export const npcTemplates: MockTemplate[] = [
  {
    id: 'npc_normal_1',
    name: '正常NPC - 村民',
    type: 'normal',
    description: '包含多个村民NPC',
    data: {
      npcs: [
        {
          id: 'npc_001',
          saveId: 'save_001',
          name: '村长霍华德',
          title: '绿荫村村长',
          race: 'human',
          occupation: '村长',
          appearance: {
            description: '一位年迈但精神矍铄的老人',
            height: '中等',
            build: '瘦削',
            hairColor: '白色',
            eyeColor: '棕色',
            distinguishingFeatures: ['左眼有一道浅浅的疤痕'],
          },
          personality: {
            traits: ['友善', '热心', '有责任感'],
            values: ['正义', '和平', '社区'],
            fears: ['失去村民的信任'],
            desires: ['村庄繁荣'],
            quirks: ['喜欢在说话时摸胡子'],
            speech_style: '正式但亲切',
          },
          status: {
            health: 100,
            maxHealth: 100,
            mood: 'happy',
            currentLocation: 'village_chief_house',
            isAvailable: true,
            isAlive: true,
            schedule: [],
            currentActivity: '办公',
            statusEffects: [],
            customData: {},
          },
          stats: {
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
          },
          flags: {
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
          },
          role: 'quest_giver',
          disposition: 'helpful',
          dialogue: {
            greetings: ['欢迎来到绿荫村，旅行者。'],
            farewells: ['愿神明保佑你的旅程。'],
            idle: ['最近森林里的狼群越来越多了...'],
            combat: [],
            custom: {},
          },
          services: [],
          inventory: [],
          quests: ['quest_001'],
          relationships: {},
          backstory: '霍华德年轻时曾是一名冒险者',
          secrets: ['年轻时曾是皇家骑士团的一员'],
          customData: {},
          createdAt: Date.now() - 2592000000,
          updatedAt: Date.now() - 3600000,
        } as NPC,
      ],
    },
  },
  {
    id: 'npc_normal_2',
    name: '正常NPC - 商人',
    type: 'normal',
    description: '包含商人NPC',
    data: {
      npcs: [
        {
          id: 'npc_002',
          saveId: 'save_001',
          name: '铁匠马库斯',
          title: '绿荫村铁匠',
          race: 'human',
          occupation: '铁匠',
          appearance: {
            description: '一个身材魁梧的中年男子',
            height: '高大',
            build: '健壮',
            hairColor: '黑色',
            eyeColor: '深棕色',
            distinguishingFeatures: ['右臂上有一个火焰纹身'],
          },
          personality: {
            traits: ['直率', '勤劳', '技艺精湛'],
            values: ['工匠精神', '诚实', '质量'],
            fears: ['技艺失传'],
            desires: ['打造传世之作'],
            quirks: ['工作时喜欢哼小曲'],
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
            level: 8,
            strength: 18,
            dexterity: 12,
            constitution: 16,
            intelligence: 12,
            wisdom: 10,
            charisma: 10,
            attack: 20,
            defense: 15,
            speed: 8,
            customStats: {},
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
            canFight: false,
            customFlags: {},
          },
          role: 'merchant',
          disposition: 'neutral',
          dialogue: {
            greetings: ['需要修理装备吗？'],
            farewells: ['下次再来。'],
            idle: ['这块铁还需要多打几遍...'],
            combat: [],
            custom: { trade: ['这是我的商品列表。'] },
          },
          services: ['repair', 'craft', 'trade'],
          inventory: ['item_sword_steel', 'item_armor_iron'],
          quests: ['quest_002'],
          relationships: {},
          backstory: '马库斯从小跟随父亲学习锻造',
          secrets: ['其实他年轻时曾是皇家武器匠'],
          customData: {},
          createdAt: Date.now() - 2592000000,
          updatedAt: Date.now() - 86400000,
        } as NPC,
      ],
    },
  },
  {
    id: 'npc_normal_3',
    name: '正常NPC - 敌人',
    type: 'normal',
    description: '包含敌对NPC',
    data: {
      npcs: [
        {
          id: 'npc_enemy_001',
          saveId: 'save_001',
          name: '森林狼',
          title: '野生狼群',
          race: 'wolf',
          occupation: '野兽',
          appearance: {
            description: '一只凶猛的灰狼',
            height: '中等',
            build: '健壮',
            hairColor: '灰色',
            eyeColor: '黄色',
            distinguishingFeatures: [],
          },
          personality: {
            traits: ['凶猛', '群居', '领地意识强'],
            values: [],
            fears: ['火'],
            desires: ['食物'],
            quirks: [],
            speech_style: '',
          },
          status: {
            health: 60,
            maxHealth: 60,
            mood: 'angry',
            currentLocation: 'forest_east',
            isAvailable: true,
            isAlive: true,
            schedule: [],
            currentActivity: '巡逻',
            statusEffects: [],
            customData: {},
          },
          stats: {
            level: 4,
            strength: 14,
            dexterity: 16,
            constitution: 12,
            intelligence: 4,
            wisdom: 8,
            charisma: 2,
            attack: 18,
            defense: 8,
            speed: 14,
            customStats: {},
          },
          flags: {
            isCompanion: false,
            isMerchant: false,
            isQuestGiver: false,
            isRomanceable: false,
            isEssential: false,
            isHostile: true,
            isInvulnerable: false,
            canFollow: false,
            canTrade: false,
            canFight: true,
            customFlags: {},
          },
          role: 'enemy',
          disposition: 'hostile',
          dialogue: {
            greetings: [],
            farewells: [],
            idle: [],
            combat: ['*低吼*'],
            custom: {},
          },
          services: [],
          inventory: [],
          quests: [],
          relationships: {},
          backstory: '',
          secrets: [],
          customData: {},
          createdAt: Date.now(),
          updatedAt: Date.now(),
        } as NPC,
      ],
    },
  },
  {
    id: 'npc_incomplete_1',
    name: '不完整NPC - 空列表',
    type: 'incomplete',
    description: '没有任何NPC',
    data: {
      npcs: [],
    },
  },
];

// ==================== 地图模板 ====================

export const mapTemplates: MockTemplate[] = [
  {
    id: 'map_normal_1',
    name: '正常地图 - 村庄',
    type: 'normal',
    description: '包含村庄及周边区域的地图',
    data: {
      mapData: {
        id: 'map_001',
        name: '绿荫村及周边',
        description: '一个宁静的小村庄，周围环绕着森林、湖泊和山脉',
        type: 'overworld',
        size: { width: 20, height: 15 },
        tiles: [],
        locations: [
          {
            id: 'loc_001',
            name: '绿荫村',
            type: 'village',
            position: { x: 9, y: 7 },
            description: '一个宁静的小村庄',
            discovered: true,
          },
          {
            id: 'loc_002',
            name: '东部森林',
            type: 'forest',
            position: { x: 16, y: 3 },
            description: '一片茂密的森林',
            discovered: true,
          },
        ],
        connections: [],
        encounters: [],
        npcs: ['npc_001', 'npc_002'],
        items: [],
      } as GameMap,
    },
  },
  {
    id: 'map_normal_2',
    name: '正常地图 - 地下城',
    type: 'normal',
    description: '地下城地图',
    data: {
      mapData: {
        id: 'map_002',
        name: '神秘洞穴',
        description: '一个充满危险的地下洞穴',
        type: 'dungeon',
        size: { width: 30, height: 30 },
        tiles: [],
        locations: [
          {
            id: 'loc_dungeon_001',
            name: '入口',
            type: 'entrance',
            position: { x: 15, y: 1 },
            description: '洞穴入口',
            discovered: true,
          },
          {
            id: 'loc_dungeon_002',
            name: '宝藏室',
            type: 'treasure',
            position: { x: 15, y: 28 },
            description: '藏有宝藏的密室',
            discovered: false,
          },
        ],
        connections: [],
        encounters: [],
        npcs: [],
        items: [],
      } as GameMap,
    },
  },
  {
    id: 'map_incomplete_1',
    name: '不完整地图 - 无地图',
    type: 'incomplete',
    description: '没有地图数据',
    data: {
      mapData: null,
    },
  },
];

// ==================== 日志模板 ====================

export const journalTemplates: MockTemplate[] = [
  {
    id: 'journal_normal_1',
    name: '正常日志 - 混合类型',
    type: 'normal',
    description: '包含各种类型日志条目',
    data: {
      journalEntries: [
        {
          id: 'journal_001',
          timestamp: Date.now() - 86400000,
          type: 'quest',
          content: '接受了村长的委托，前往东部森林清除狼群',
        },
        {
          id: 'journal_002',
          timestamp: Date.now() - 43200000,
          type: 'discovery',
          content: '进入了东部森林，发现了狼群的踪迹',
        },
        {
          id: 'journal_003',
          timestamp: Date.now() - 3600000,
          type: 'combat',
          content: '与森林狼战斗，击败了 2 只狼',
        },
        {
          id: 'journal_004',
          timestamp: Date.now() - 7200000,
          type: 'dialog',
          content: '与村长霍华德交谈，了解了更多关于村庄的历史',
        },
        {
          id: 'journal_005',
          timestamp: Date.now() - 1800000,
          type: 'trade',
          content: '在铁匠铺购买了精钢长剑',
        },
      ] as JournalEntry[],
    },
  },
  {
    id: 'journal_normal_2',
    name: '正常日志 - 大量条目',
    type: 'normal',
    description: '包含大量日志条目，测试滚动',
    data: {
      journalEntries: Array.from({ length: 50 }, (_, i) => ({
        id: `journal_large_${i}`,
        timestamp: Date.now() - i * 3600000,
        type: ['quest', 'combat', 'discovery', 'dialog', 'trade', 'system'][i % 6] as JournalEntry['type'],
        content: `日志条目 #${i + 1}: 这是一个测试日志条目`,
      })) as JournalEntry[],
    },
  },
  {
    id: 'journal_incomplete_1',
    name: '不完整日志 - 空列表',
    type: 'incomplete',
    description: '没有任何日志',
    data: {
      journalEntries: [],
    },
  },
];

// ==================== 动态 UI 模板 ====================

export const dynamicUITemplates: MockTemplate[] = [
  {
    id: 'dynamic_ui_normal_1',
    name: '正常动态UI - 欢迎界面',
    type: 'normal',
    description: '游戏开始时的欢迎界面',
    data: {
      dynamicUI: {
        id: 'dynamic_ui_welcome',
        markdown: `:::system-notify{type=welcome}
## 欢迎来到绿荫村

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
        context: { characterId: 'char_001', location: '绿荫村' },
      } as DynamicUIData,
    },
  },
  {
    id: 'dynamic_ui_normal_2',
    name: '正常动态UI - 战斗提示',
    type: 'normal',
    description: '战斗相关的动态UI',
    data: {
      dynamicUI: {
        id: 'dynamic_ui_combat',
        markdown: `:::system-notify{type=warning}
## 战斗警告！

你遭遇了 **森林狼群**！

敌人数量：3
推荐等级：3-5

:::options
[准备战斗](action:start_combat)
[尝试逃跑](action:flee)
[使用物品](action:use_item)
:::
:::`,
        context: { encounterId: 'encounter_001', enemies: ['wolf', 'wolf', 'wolf'] },
      } as DynamicUIData,
    },
  },
  {
    id: 'dynamic_ui_normal_3',
    name: '正常动态UI - 商店界面',
    type: 'normal',
    description: '商店购物界面',
    data: {
      dynamicUI: {
        id: 'dynamic_ui_shop',
        markdown: `:::warehouse
## 铁匠马库斯的商店

### 武器
| 名称 | 价格 | 属性 |
|------|------|------|
| 精钢长剑 | 200金 | 攻击+15 |
| 铁制盾牌 | 150金 | 防御+10 |

### 防具
| 名称 | 价格 | 属性 |
|------|------|------|
| 铁制胸甲 | 150金 | 防御+12 |
| 皮靴 | 50金 | 防御+3, 速度+2 |

当前金币：500
:::`,
        context: { shopId: 'shop_blacksmith', items: ['item_sword_steel', 'item_shield_iron'] },
      } as DynamicUIData,
    },
  },
  {
    id: 'dynamic_ui_incomplete_1',
    name: '不完整动态UI - 无UI',
    type: 'incomplete',
    description: '没有动态UI数据',
    data: {
      dynamicUI: null,
    },
  },
];

// ==================== 组合模板 ====================

export const combinedTemplates: MockTemplate[] = [
  {
    id: 'combined_new_game',
    name: '新游戏状态',
    type: 'normal',
    description: '新游戏开始时的完整状态',
    data: {
      character: characterTemplates[0].data.character,
      skills: skillTemplates[0].data.skills,
      inventory: [],
      equipment: { accessories: [] } as EquipmentState,
      quests: [],
      npcs: [],
      mapData: null,
      journalEntries: [],
      dynamicUI: dynamicUITemplates[0].data.dynamicUI,
    },
  },
  {
    id: 'combined_mid_game',
    name: '中期游戏状态',
    type: 'normal',
    description: '游戏进行中的完整状态',
    data: {
      character: characterTemplates[1].data.character,
      skills: skillTemplates[1].data.skills,
      inventory: inventoryTemplates[0].data.inventory,
      equipment: equipmentTemplates[0].data.equipment,
      quests: questTemplates[0].data.quests,
      npcs: npcTemplates[0].data.npcs,
      mapData: mapTemplates[0].data.mapData,
      journalEntries: journalTemplates[0].data.journalEntries,
      dynamicUI: null,
    },
  },
  {
    id: 'combined_empty',
    name: '空游戏状态',
    type: 'incomplete',
    description: '所有数据都为空的初始状态',
    data: {
      character: null,
      skills: [],
      inventory: [],
      equipment: { accessories: [] } as EquipmentState,
      quests: [],
      npcs: [],
      mapData: null,
      journalEntries: [],
      dynamicUI: null,
    },
  },
];

// ==================== 导出所有模板 ====================

export const allTemplates = {
  character: characterTemplates,
  skills: skillTemplates,
  inventory: inventoryTemplates,
  equipment: equipmentTemplates,
  quests: questTemplates,
  npcs: npcTemplates,
  mapData: mapTemplates,
  journalEntries: journalTemplates,
  dynamicUI: dynamicUITemplates,
  combined: combinedTemplates,
};

export type TemplateCategory = keyof typeof allTemplates;

// ==================== 工具函数 ====================

/**
 * 根据类型筛选模板
 */
export function filterTemplatesByType(
  templates: MockTemplate[],
  type: TemplateType
): MockTemplate[] {
  return templates.filter((t) => t.type === type);
}

/**
 * 获取模板分类的显示名称
 */
export function getCategoryLabel(category: TemplateCategory): string {
  const labels: Record<TemplateCategory, string> = {
    character: '角色',
    skills: '技能',
    inventory: '背包',
    equipment: '装备',
    quests: '任务',
    npcs: 'NPC',
    mapData: '地图',
    journalEntries: '日志',
    dynamicUI: '动态UI',
    combined: '组合',
  };
  return labels[category];
}

/**
 * 获取模板类型的显示名称
 */
export function getTypeLabel(type: TemplateType): string {
  const labels: Record<TemplateType, string> = {
    normal: '正常',
    incomplete: '不完整',
    error: '错误',
  };
  return labels[type];
}

/**
 * 获取模板类型的颜色
 */
export function getTypeColor(type: TemplateType): string {
  const colors: Record<TemplateType, string> = {
    normal: 'var(--color-success)',
    incomplete: 'var(--color-warning)',
    error: 'var(--color-error)',
  };
  return colors[type];
}
