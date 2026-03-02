import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DatabaseService } from '../services/DatabaseService';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SEED_TEMPLATES = [
  // ==================== 模板 1：中世纪奇幻冒险 ====================
  {
    id: 'template-medieval-fantasy',
    name: '中世纪奇幻冒险',
    description: '经典的中世纪奇幻世界，包含魔法、剑与龙的冒险故事。在这片充满奇迹的大陆上，你将扮演一位英雄，探索古老的遗迹，对抗邪恶势力，书写属于自己的传奇。',
    version: '1.0.0',
    author: 'AI-RPG Engine',
    tags: JSON.stringify(['奇幻', '冒险', 'RPG', '魔法', '中世纪']),
    game_mode: 'turn_based_rpg',
    world_setting: JSON.stringify({
      name: '艾尔德兰大陆',
      description: '一个充满魔法与奇迹的大陆，五大王国各自为政，古老的龙族沉睡于深山，精灵隐居于永恒之森，矮人在地下建造宏伟的城市。黑暗势力正在悄然崛起，预言中的英雄即将觉醒。',
      era: '中世纪',
      magicSystem: '元素魔法 - 火、水、风、土、光、暗六大元素构成魔法的基础，法师通过冥想和咒语引导元素之力',
      technologyLevel: '中世纪 - 铁器时代，城堡与骑士，简单的机械装置',
      customFields: {
        currency: '金币 (Gold)',
        calendar: '艾尔德兰历',
        pantheon: '七神信仰',
      },
    }),
    character_creation: JSON.stringify({
      races: [
        {
          id: 'human',
          name: '人类',
          description: '多才多艺的人类，适应力强，虽然没有天生的魔法亲和，但凭借智慧和毅力在各个领域都有出色表现',
          bonuses: { strength: 1, intelligence: 1, charisma: 1 },
          penalties: {},
          abilities: ['适应力', '学习天赋'],
          availableClasses: ['warrior', 'mage', 'rogue', 'paladin', 'ranger'],
        },
        {
          id: 'elf',
          name: '精灵',
          description: '优雅长寿的精灵族，天生与魔法亲和，拥有敏锐的感知力和超凡的敏捷',
          bonuses: { dexterity: 2, wisdom: 2, intelligence: 1 },
          penalties: { constitution: -1 },
          abilities: ['夜视', '魔法亲和', '精灵感知'],
          availableClasses: ['mage', 'ranger', 'rogue', 'bard'],
        },
        {
          id: 'dwarf',
          name: '矮人',
          description: '坚韧的矮人族，以锻造和矿业闻名，体格健壮，意志坚定',
          bonuses: { constitution: 2, strength: 2, wisdom: 1 },
          penalties: { dexterity: -1, charisma: -1 },
          abilities: ['夜视', '毒素抗性', '石工天赋'],
          availableClasses: ['warrior', 'paladin', 'cleric'],
        },
      ],
      classes: [
        {
          id: 'warrior',
          name: '战士',
          description: '近战专家，擅长使用各种武器和护甲，是队伍的中坚力量',
          primaryAttributes: ['strength', 'constitution'],
          hitDie: 'd10',
          skillProficiencies: [' athletics', 'intimidation', 'survival', 'weapons'],
          startingEquipment: ['长剑', '盾牌', '锁子甲', '探险者背包'],
        },
        {
          id: 'mage',
          name: '法师',
          description: '魔法使用者，能够施展强大的元素法术，但身体较为脆弱',
          primaryAttributes: ['intelligence', 'wisdom'],
          hitDie: 'd6',
          skillProficiencies: ['arcana', 'history', 'insight', 'magic'],
          startingEquipment: ['法杖', '法袍', '魔法书', '施法材料包'],
        },
        {
          id: 'rogue',
          name: '盗贼',
          description: '敏捷的潜行者，擅长潜行、开锁和偷袭，是探索和情报收集的专家',
          primaryAttributes: ['dexterity', 'intelligence'],
          hitDie: 'd8',
          skillProficiencies: ['stealth', 'lockpicking', 'perception', 'deception'],
          startingEquipment: ['短剑', '皮甲', '盗贼工具', '匕首x2'],
        },
        {
          id: 'paladin',
          name: '圣骑士',
          description: '神圣战士，结合了战斗技巧和神圣魔法，是正义的化身',
          primaryAttributes: ['strength', 'charisma', 'wisdom'],
          hitDie: 'd10',
          skillProficiencies: ['religion', 'persuasion', 'medicine', 'divine_magic'],
          startingEquipment: ['双手剑', '板甲', '圣徽', '治疗药水x2'],
        },
        {
          id: 'ranger',
          name: '游侠',
          description: '荒野生存专家，擅长追踪和远程攻击，与自然有着特殊的联系',
          primaryAttributes: ['dexterity', 'wisdom'],
          hitDie: 'd10',
          skillProficiencies: ['survival', 'perception', 'stealth', 'nature'],
          startingEquipment: ['长弓', '箭矢x20', '皮甲', '短剑'],
        },
      ],
      backgrounds: [
        {
          id: 'noble_heir',
          name: '贵族后裔',
          description: '你出生于显赫的贵族家庭，从小接受良好的教育和武术训练。然而，家族的秘密和责任也伴随着你',
          skillProficiencies: ['persuasion', 'history', 'etiquette'],
          languages: ['通用语', '古语'],
          equipment: ['家徽戒指', '贵族服饰', '家传宝剑', '50金币'],
          feature: '贵族身份 - 你可以进入贵族社交圈，获得贵族的待遇和帮助',
        },
        {
          id: 'farmers_child',
          name: '农夫之子',
          description: '你在一个普通的农庄长大，从小帮助父母耕种。虽然生活简朴，但你学会了勤劳和坚韧',
          skillProficiencies: ['survival', 'athletics', 'animal_handling'],
          languages: ['通用语'],
          equipment: ['农具', '简朴衣物', '干粮x7', '10金币'],
          feature: '乡村人脉 - 你熟悉乡村生活，能获得农民的信任和帮助',
        },
        {
          id: 'orphan_wanderer',
          name: '流浪孤儿',
          description: '你从小失去双亲，在街头长大。艰难的生活让你学会了生存的智慧，也让你对弱者有着特殊的同情',
          skillProficiencies: ['stealth', 'deception', 'perception', 'streetwise'],
          languages: ['通用语', '盗贼黑话'],
          equipment: ['破旧斗篷', '匕首', '小偷工具', '5金币'],
          feature: '街头智慧 - 你熟悉城市阴暗面，能获取地下情报',
        },
      ],
      attributes: [
        { id: 'strength', name: '力量', abbreviation: 'STR', description: '角色的身体力量，影响近战伤害和负重能力', defaultValue: 10, minValue: 1, maxValue: 20 },
        { id: 'dexterity', name: '敏捷', abbreviation: 'DEX', description: '角色的灵活性和反应速度，影响闪避和远程攻击', defaultValue: 10, minValue: 1, maxValue: 20 },
        { id: 'constitution', name: '体质', abbreviation: 'CON', description: '角色的健康和耐力，影响生命值和抗性', defaultValue: 10, minValue: 1, maxValue: 20 },
        { id: 'intelligence', name: '智力', abbreviation: 'INT', description: '角色的思维能力和记忆力，影响魔法和学习', defaultValue: 10, minValue: 1, maxValue: 20 },
        { id: 'wisdom', name: '感知', abbreviation: 'WIS', description: '角色的洞察力和判断力，影响直觉和意志', defaultValue: 10, minValue: 1, maxValue: 20 },
        { id: 'charisma', name: '魅力', abbreviation: 'CHA', description: '角色的个人魅力和影响力，影响社交和领导', defaultValue: 10, minValue: 1, maxValue: 20 },
      ],
    }),
    game_rules: JSON.stringify({
      combatSystem: {
        type: 'turn_based',
        initiativeType: 'dexterity',
        actionPoints: 3,
        criticalHit: { threshold: 20, multiplier: 2 },
      },
      skillSystem: {
        maxLevel: 10,
        upgradeCost: { base: 100, multiplier: 1.5 },
        cooldownSystem: 'turn',
      },
      inventorySystem: {
        maxSlots: 50,
        stackSizes: { potion: 10, arrow: 50, food: 20 },
        weightSystem: true,
      },
      questSystem: {
        maxActive: 5,
        failConditions: ['time_limit', 'npc_death'],
        timeSystem: true,
      },
    }),
    ai_constraints: JSON.stringify({
      tone: 'serious',
      contentRating: 'teen',
      prohibitedTopics: [],
      requiredElements: ['魔法元素', '道德选择', '英雄旅程'],
      aiBehavior: {
        responseStyle: 'narrative',
        detailLevel: 'detailed',
        playerAgency: 'balanced',
      },
    }),
    starting_scene: JSON.stringify({
      location: '橡木村 - 村口广场',
      description: '清晨的阳光穿透薄雾，洒在橡木村的石板广场上。村民们开始了一天的劳作，远处传来铁匠铺的打铁声。你站在村口，身后是你熟悉的一切，前方是通往未知的道路。村长正在公告栏前张贴什么，似乎有什么重要的事情发生...',
      npcs: [
        {
          id: 'elder_thomas',
          name: '托马斯村长',
          title: '橡木村村长',
          description: '一位年迈但精神矍铄的老人，白发苍苍，穿着朴素的亚麻长袍。他的眼中透着智慧与忧虑',
          role: 'quest_giver',
          personality: '和蔼可亲，富有智慧，关心村民',
          dialogue: [
            '年轻人，你来得正好。我们村子最近遇到了一些麻烦...',
            '东边的森林里出现了奇怪的生物，已经有几个村民失踪了',
            '如果你愿意帮忙调查，我会给你丰厚的报酬',
          ],
          stats: { level: 5, hp: 30, charisma: 16, wisdom: 18 },
        },
        {
          id: 'blacksmith_gareth',
          name: '加雷斯',
          title: '铁匠铺老板',
          description: '一个身材魁梧的中年男子，肌肉发达，皮肤被炉火熏得黝黑。他的铁匠铺里挂满了各种武器和护甲',
          role: 'merchant',
          personality: '豪爽直率，手艺精湛，喜欢喝酒',
          dialogue: [
            '嘿！看看这些宝贝，都是我亲手打造的！',
            '需要武器还是护甲？我这里应有尽有',
            '如果你能帮我找些精铁矿石，我可以给你打折',
          ],
          stats: { level: 8, hp: 60, strength: 18, constitution: 16 },
          services: ['shop', 'blacksmith'],
        },
        {
          id: 'innkeeper_martha',
          name: '玛莎大妈',
          title: '旅店老板娘',
          description: '一位和蔼的中年妇女，身材微胖，总是带着温暖的笑容。她的旅店是村里最热闹的地方',
          role: 'merchant',
          personality: '热情好客，喜欢八卦，厨艺精湛',
          dialogue: [
            '欢迎欢迎！要住宿还是用餐？',
            '最近村子里发生了一些怪事，你要小心啊',
            '我这里有刚烤好的面包和热腾腾的炖肉',
          ],
          stats: { level: 3, hp: 25, charisma: 14, constitution: 12 },
          services: ['inn', 'shop'],
        },
      ],
      items: [
        {
          id: 'starter_sword',
          name: '新手长剑',
          description: '一把简单但实用的铁剑，适合初学者使用',
          type: 'weapon',
          rarity: 'common',
          stats: { attack: 5, critical: 2 },
          value: { buy: 50, sell: 25, currency: '金币' },
          quantity: 1,
        },
        {
          id: 'health_potion',
          name: '治疗药水',
          description: '一瓶红色的药水，饮用后可以恢复少量生命值',
          type: 'consumable',
          rarity: 'common',
          effects: [{ type: 'heal', value: 20 }],
          value: { buy: 25, sell: 10, currency: '金币' },
          quantity: 3,
        },
      ],
      quests: [
        {
          id: 'main_quest_001',
          name: '消失的村民',
          description: '调查东边森林中出现的奇怪生物，找出村民失踪的真相',
          type: 'main',
          objectives: [
            { id: 'obj_001', description: '与村长托马斯交谈', type: 'talk', target: 'elder_thomas', required: 1 },
            { id: 'obj_002', description: '前往东边森林调查', type: 'explore', target: 'eastern_forest', required: 1 },
            { id: 'obj_003', description: '找到失踪村民的线索', type: 'collect', target: 'clue', required: 3 },
          ],
          rewards: [
            { type: 'experience', value: 200 },
            { type: 'currency', value: 100, quantity: 1 },
            { type: 'item', value: 'iron_shield', quantity: 1 },
          ],
          giver: 'elder_thomas',
        },
      ],
    }),
    ui_theme: JSON.stringify({
      primaryColor: '#8B4513',
      fontFamily: 'Georgia, "Times New Roman", serif',
      backgroundStyle: 'gradient',
      customCSS: `
        .game-container { background: linear-gradient(to bottom, #f4e4bc, #e8d4a8); }
        .text-panel { border: 2px solid #8B4513; background: rgba(255,248,220,0.95); }
        .choice-button { background: #d4a574; border: 1px solid #8B4513; }
        .choice-button:hover { background: #c49464; }
      `,
    }),
    ui_layout: JSON.stringify({
      showMinimap: true,
      showCombatPanel: true,
      showSkillBar: true,
      showPartyPanel: false,
      minimapPosition: 'top-right',
      minimapSize: 'medium',
      partyPanelPosition: 'left',
      skillBarSlots: 4,
    }),
    is_builtin: 1,
  },

  // ==================== 模板 2：现代都市恋爱 ====================
  {
    id: 'template-modern-romance',
    name: '现代都市恋爱',
    description: '现代都市背景的恋爱模拟故事。在繁华的星城市，你将邂逅各种有趣的人物，经历浪漫的爱情故事，在事业与感情之间做出选择。',
    version: '1.0.0',
    author: 'AI-RPG Engine',
    tags: JSON.stringify(['恋爱', '都市', '视觉小说', '现代', '浪漫']),
    game_mode: 'visual_novel',
    world_setting: JSON.stringify({
      name: '星城市',
      description: '一个繁华的现代都市，高楼林立，霓虹闪烁。这里有著名的大学、跨国公司、时尚的购物街和浪漫的约会圣地。每个人都在追逐着自己的梦想和爱情',
      era: '现代',
      technologyLevel: '现代 - 智能手机、社交媒体、现代交通',
      customFields: {
        currency: '人民币 (CNY)',
        setting: '都市校园',
        romance_system: '好感度系统',
      },
    }),
    character_creation: JSON.stringify({
      races: [
        {
          id: 'human',
          name: '人类',
          description: '普通的现代人，有着自己的梦想和追求',
          bonuses: { charisma: 1 },
          penalties: {},
          abilities: [],
          availableClasses: ['student', 'office_worker', 'freelancer', 'artist'],
        },
      ],
      classes: [
        {
          id: 'student',
          name: '大学生',
          description: '在校大学生，充满青春活力，有着无限可能',
          primaryAttributes: ['intelligence', 'charisma'],
          hitDie: 'd6',
          skillProficiencies: ['study', 'social', 'sports'],
          startingEquipment: ['学生证', '智能手机', '背包', '笔记本'],
        },
        {
          id: 'office_worker',
          name: '公司职员',
          description: '在大公司工作的白领，事业心强，成熟稳重',
          primaryAttributes: ['intelligence', 'charisma'],
          hitDie: 'd6',
          skillProficiencies: ['work', 'social', 'finance'],
          startingEquipment: ['工牌', '智能手机', '公文包', '西装'],
        },
        {
          id: 'freelancer',
          name: '自由职业者',
          description: '自由工作者，时间自由，追求独立生活',
          primaryAttributes: ['charisma', 'dexterity'],
          hitDie: 'd6',
          skillProficiencies: ['creative', 'social', 'self_management'],
          startingEquipment: ['笔记本电脑', '智能手机', '相机', '休闲装'],
        },
        {
          id: 'artist',
          name: '艺术工作者',
          description: '追求艺术的创作者，感性而浪漫',
          primaryAttributes: ['charisma', 'intelligence'],
          hitDie: 'd6',
          skillProficiencies: ['art', 'social', 'creative'],
          startingEquipment: ['画具/乐器', '智能手机', '速写本', '艺术装'],
        },
      ],
      backgrounds: [
        {
          id: 'transfer_student',
          name: '转校生',
          description: '你刚刚转学到星城市的一所大学，对这座城市还很陌生，但充满了期待。新的环境意味着新的开始，也意味着新的邂逅',
          skillProficiencies: ['adaptability', 'curiosity', 'fresh_perspective'],
          languages: ['中文', '英语'],
          equipment: ['行李箱', '新手机', '地图APP', '租房合同'],
          feature: '新人光环 - 作为新来者，你更容易引起他人的好奇和关注',
        },
        {
          id: 'childhood_friend',
          name: '青梅竹马',
          description: '你在这座城市长大，有很多童年的回忆和朋友。有人一直默默关注着你，等待合适的时机表达心意',
          skillProficiencies: ['local_knowledge', 'social', 'nostalgia'],
          languages: ['中文'],
          equipment: ['旧照片', '手机', '家乡特产', '老友联系方式'],
          feature: '人脉广泛 - 你熟悉这座城市，认识很多人，容易获得帮助',
        },
        {
          id: 'career_newcomer',
          name: '职场新人',
          description: '你刚刚毕业，进入了一家大公司工作。面对职场的挑战和新的社交圈，你既紧张又兴奋',
          skillProficiencies: ['professional', 'ambition', 'learning'],
          languages: ['中文', '英语'],
          equipment: ['工牌', '职业装', '笔记本', '咖啡卡'],
          feature: '职场潜力 - 你展现出优秀的潜力，容易得到前辈的指导和关注',
        },
      ],
      attributes: [
        { id: 'strength', name: '活力', abbreviation: 'STR', description: '角色的精力和活力，影响日常活动', defaultValue: 10, minValue: 1, maxValue: 20 },
        { id: 'dexterity', name: '魅力', abbreviation: 'DEX', description: '角色的外在魅力和社交能力', defaultValue: 10, minValue: 1, maxValue: 20 },
        { id: 'constitution', name: '韧性', abbreviation: 'CON', description: '角色的心理韧性和抗压能力', defaultValue: 10, minValue: 1, maxValue: 20 },
        { id: 'intelligence', name: '才智', abbreviation: 'INT', description: '角色的学识和思维能力', defaultValue: 10, minValue: 1, maxValue: 20 },
        { id: 'wisdom', name: '情商', abbreviation: 'WIS', description: '角色的情感洞察和人际交往能力', defaultValue: 10, minValue: 1, maxValue: 20 },
        { id: 'charisma', name: '气质', abbreviation: 'CHA', description: '角色的整体气质和吸引力', defaultValue: 10, minValue: 1, maxValue: 20 },
      ],
    }),
    game_rules: JSON.stringify({
      combatSystem: {
        type: 'narrative',
        initiativeType: 'random',
        actionPoints: 1,
        criticalHit: { threshold: 20, multiplier: 1 },
      },
      skillSystem: {
        maxLevel: 5,
        upgradeCost: { base: 50, multiplier: 1.2 },
        cooldownSystem: 'none',
      },
      inventorySystem: {
        maxSlots: 20,
        stackSizes: {},
        weightSystem: false,
      },
      questSystem: {
        maxActive: 3,
        failConditions: [],
        timeSystem: false,
      },
    }),
    ai_constraints: JSON.stringify({
      tone: 'romantic',
      contentRating: 'teen',
      prohibitedTopics: [],
      requiredElements: ['浪漫元素', '情感选择', '好感度变化'],
      aiBehavior: {
        responseStyle: 'narrative',
        detailLevel: 'detailed',
        playerAgency: 'guided',
      },
    }),
    starting_scene: JSON.stringify({
      location: '星城市 - 樱花咖啡馆',
      description: '午后的阳光透过落地窗洒进咖啡馆，空气中弥漫着咖啡和甜点的香气。窗外的樱花正在盛开，粉色的花瓣随风飘落。你坐在靠窗的位置，等待着什么...或者，只是在享受这宁静的时光。突然，门口的风铃响起，有人走了进来',
      npcs: [
        {
          id: 'sakura_barista',
          name: '林小樱',
          title: '咖啡馆店员',
          description: '一位可爱的女孩，扎着马尾辫，穿着咖啡馆的制服。她总是带着温暖的笑容，对每一位客人都很热情',
          role: 'neutral',
          personality: '活泼开朗，喜欢甜食，梦想开自己的甜品店',
          dialogue: [
            '欢迎光临！今天想喝点什么？',
            '我推荐我们的招牌樱花拿铁，很受欢迎哦~',
            '你是新来的吧？我好像没见过你',
          ],
          stats: { level: 1, hp: 10, charisma: 15, wisdom: 12 },
          customData: { affection: 0, relationship: '陌生人' },
        },
        {
          id: 'mysterious_customer',
          name: '苏雨晴',
          title: '神秘顾客',
          description: '一位气质优雅的女性，穿着简约时尚，独自坐在角落看书。她偶尔抬头望向窗外，似乎在思考什么',
          role: 'neutral',
          personality: '知性内敛，喜欢阅读，有些神秘',
          dialogue: [
            '...（专注地看书）',
            '嗯？你也在看这本书吗？',
            '这本书很有意思，作者的视角很独特',
          ],
          stats: { level: 1, hp: 10, intelligence: 16, charisma: 14 },
          customData: { affection: 0, relationship: '陌生人' },
        },
        {
          id: 'cheerful_student',
          name: '陈晓阳',
          title: '大学生',
          description: '一个阳光帅气的男生，背着双肩包，看起来像是附近大学的学生。他正和朋友聊天，笑声朗朗',
          role: 'neutral',
          personality: '热情开朗，喜欢运动，是个乐天派',
          dialogue: [
            '哈哈，真的假的！',
            '诶，那边好像有人注意我们~',
            '要不要一起坐？正好认识一下！',
          ],
          stats: { level: 1, hp: 10, charisma: 15, constitution: 14 },
          customData: { affection: 0, relationship: '陌生人' },
        },
      ],
      items: [
        {
          id: 'smartphone',
          name: '智能手机',
          description: '你的智能手机，里面装着各种社交APP',
          type: 'misc',
          rarity: 'common',
          value: { buy: 0, sell: 0, currency: 'CNY' },
          quantity: 1,
        },
        {
          id: 'coffee_coupon',
          name: '咖啡优惠券',
          description: '一张"买一送一"的咖啡优惠券，可以和别人分享',
          type: 'consumable',
          rarity: 'common',
          value: { buy: 0, sell: 0, currency: 'CNY' },
          quantity: 1,
        },
      ],
      quests: [
        {
          id: 'intro_quest_001',
          name: '新的开始',
          description: '在这座城市开始新的生活，认识新朋友',
          type: 'main',
          objectives: [
            { id: 'obj_001', description: '点一杯咖啡', type: 'custom', target: 'order_coffee', required: 1 },
            { id: 'obj_002', description: '与某人交谈', type: 'talk', target: 'any_npc', required: 1 },
          ],
          rewards: [
            { type: 'experience', value: 50 },
          ],
        },
      ],
    }),
    ui_theme: JSON.stringify({
      primaryColor: '#FFB6C1',
      fontFamily: '"Microsoft YaHei", "PingFang SC", sans-serif',
      backgroundStyle: 'solid',
      customCSS: `
        .game-container { background: linear-gradient(135deg, #fff5f8 0%, #ffe4e9 100%); }
        .text-panel { background: rgba(255,255,255,0.95); border-radius: 15px; }
        .choice-button { 
          background: linear-gradient(135deg, #FFB6C1, #FF69B4); 
          border: none; 
          border-radius: 20px;
          color: white;
        }
        .choice-button:hover { 
          background: linear-gradient(135deg, #FF69B4, #FF1493); 
          transform: scale(1.02);
        }
        .affection-heart { color: #FF69B4; }
      `,
    }),
    ui_layout: JSON.stringify({
      showMinimap: false,
      showCombatPanel: false,
      showSkillBar: false,
      showPartyPanel: false,
      minimapPosition: 'top-right',
      minimapSize: 'small',
      partyPanelPosition: 'right',
      skillBarSlots: 4,
    }),
    is_builtin: 1,
  },

  // ==================== 模板 3：克苏鲁恐怖调查 ====================
  {
    id: 'template-lovecraft-horror',
    name: '克苏鲁恐怖调查',
    description: '克苏鲁神话背景的恐怖调查故事。在1920年代的新英格兰小镇，你将揭开隐藏在日常之下的恐怖真相。理智是脆弱的，而知识可能是致命的。',
    version: '1.0.0',
    author: 'AI-RPG Engine',
    tags: JSON.stringify(['恐怖', '悬疑', '克苏鲁', '调查', '洛夫克拉夫特']),
    game_mode: 'text_adventure',
    world_setting: JSON.stringify({
      name: '阿卡姆镇',
      description: '位于美国马萨诸塞州的一个古老小镇，有着悠久而阴暗的历史。古老的石质建筑、蜿蜒的街道、神秘的密室...这里隐藏着不可名状的秘密。米斯卡塔尼克大学的学者们在此研究禁忌的知识，而某些家族世代守护着可怕的真相',
      era: '1920年代',
      technologyLevel: '工业时代 - 汽车、电话、电报、报纸',
      customFields: {
        currency: '美元 (USD)',
        sanity_system: 'SAN值系统',
        mythos: '克苏鲁神话',
      },
    }),
    character_creation: JSON.stringify({
      races: [
        {
          id: 'human',
          name: '人类',
          description: '普通的人类调查员，面对宇宙的恐怖时显得如此渺小',
          bonuses: {},
          penalties: {},
          abilities: [],
          availableClasses: ['detective', 'archaeologist', 'psychiatrist', 'journalist', 'professor'],
        },
      ],
      classes: [
        {
          id: 'detective',
          name: '私家侦探',
          description: '经验丰富的调查员，擅长搜集线索和推理',
          primaryAttributes: ['intelligence', 'wisdom', 'dexterity'],
          hitDie: 'd8',
          skillProficiencies: ['investigation', 'perception', 'stealth', 'firearms'],
          startingEquipment: ['左轮手枪', '放大镜', '笔记本', '侦探执照'],
        },
        {
          id: 'archaeologist',
          name: '考古学家',
          description: '研究古代文明的学者，对神秘文物有深入了解',
          primaryAttributes: ['intelligence', 'wisdom', 'constitution'],
          hitDie: 'd6',
          skillProficiencies: ['history', 'archaeology', 'languages', 'survival'],
          startingEquipment: ['考古工具', '古文字词典', '手电筒', '探险装备'],
        },
        {
          id: 'psychiatrist',
          name: '精神科医生',
          description: '研究人类心理的专家，对精神异常有独特见解',
          primaryAttributes: ['intelligence', 'wisdom', 'charisma'],
          hitDie: 'd6',
          skillProficiencies: ['psychology', 'medicine', 'persuasion', 'psychoanalysis'],
          startingEquipment: ['医疗包', '精神药物', '病历本', '医生执照'],
        },
        {
          id: 'journalist',
          name: '记者',
          description: '追求真相的新闻工作者，善于挖掘和报道',
          primaryAttributes: ['intelligence', 'charisma', 'dexterity'],
          hitDie: 'd6',
          skillProficiencies: ['investigation', 'persuasion', 'writing', 'photography'],
          startingEquipment: ['相机', '笔记本', '记者证', '打火机'],
        },
        {
          id: 'professor',
          name: '大学教授',
          description: '米斯卡塔尼克大学的学者，知识渊博但可能知道太多',
          primaryAttributes: ['intelligence', 'wisdom', 'charisma'],
          hitDie: 'd4',
          skillProficiencies: ['academics', 'research', 'languages', 'occult'],
          startingEquipment: ['古籍', '大学证件', '手杖', '图书馆借阅证'],
        },
      ],
      backgrounds: [
        {
          id: 'private_detective',
          name: '私家侦探',
          description: '你是一名私家侦探，在波士顿开设事务所。最近，你收到了一封来自阿卡姆的神秘委托信',
          skillProficiencies: ['investigation', 'perception', 'firearms', 'streetwise'],
          languages: ['英语'],
          equipment: ['左轮手枪', '放大镜', '笔记本', '烟盒'],
          feature: '调查直觉 - 你对线索有敏锐的洞察力，能发现常人忽略的细节',
        },
        {
          id: 'field_archaeologist',
          name: '考古学家',
          description: '你曾在世界各地进行考古发掘，见过许多不可思议的事物。最近，你在埃及发现的一件文物似乎与阿卡姆有着神秘的联系',
          skillProficiencies: ['archaeology', 'history', 'languages', 'survival'],
          languages: ['英语', '古埃及语', '拉丁语'],
          equipment: ['考古工具', '古文字词典', '神秘护身符', '探险日记'],
          feature: '古物知识 - 你对古代文物有深入了解，能识别神秘物品的来历',
        },
        {
          id: 'mental_doctor',
          name: '精神科医生',
          description: '你在阿卡姆疯人院工作，见过太多因"不可名状之物"而发疯的病人。你开始怀疑，他们的疯言疯语可能隐藏着某种真相',
          skillProficiencies: ['psychology', 'medicine', 'psychoanalysis', 'persuasion'],
          languages: ['英语', '德语'],
          equipment: ['医疗包', '病历记录', '镇静剂', '怀表'],
          feature: '心理洞察 - 你能分析人的心理状态，判断是否受到精神影响',
        },
      ],
      attributes: [
        { id: 'strength', name: '力量', abbreviation: 'STR', description: '角色的身体力量', defaultValue: 10, minValue: 1, maxValue: 20 },
        { id: 'dexterity', name: '敏捷', abbreviation: 'DEX', description: '角色的灵活性和反应速度', defaultValue: 10, minValue: 1, maxValue: 20 },
        { id: 'constitution', name: '体质', abbreviation: 'CON', description: '角色的健康和耐力', defaultValue: 10, minValue: 1, maxValue: 20 },
        { id: 'intelligence', name: '智力', abbreviation: 'INT', description: '角色的思维能力和记忆力', defaultValue: 10, minValue: 1, maxValue: 20 },
        { id: 'wisdom', name: '感知', abbreviation: 'WIS', description: '角色的洞察力和判断力', defaultValue: 10, minValue: 1, maxValue: 20 },
        { id: 'charisma', name: '魅力', abbreviation: 'CHA', description: '角色的个人魅力和影响力', defaultValue: 10, minValue: 1, maxValue: 20 },
        { id: 'sanity', name: '理智', abbreviation: 'SAN', description: '角色的精神稳定性，面对恐怖时会被消耗。初始值为智力和感知之和的一半', defaultValue: 50, minValue: 0, maxValue: 100 },
      ],
    }),
    game_rules: JSON.stringify({
      combatSystem: {
        type: 'narrative',
        initiativeType: 'dexterity',
        actionPoints: 2,
        criticalHit: { threshold: 20, multiplier: 1.5 },
      },
      skillSystem: {
        maxLevel: 10,
        upgradeCost: { base: 100, multiplier: 1.5 },
        cooldownSystem: 'none',
      },
      inventorySystem: {
        maxSlots: 30,
        stackSizes: { ammo: 20, clue: 99 },
        weightSystem: false,
      },
      questSystem: {
        maxActive: 3,
        failConditions: ['sanity_loss', 'time_limit'],
        timeSystem: true,
      },
    }),
    ai_constraints: JSON.stringify({
      tone: 'dark',
      contentRating: 'mature',
      prohibitedTopics: [],
      requiredElements: ['恐怖氛围', '理智考验', '不可名状的恐惧', '知识代价'],
      aiBehavior: {
        responseStyle: 'narrative',
        detailLevel: 'detailed',
        playerAgency: 'guided',
      },
    }),
    starting_scene: JSON.stringify({
      location: '阿卡姆镇 - 米斯卡塔尼克大学图书馆',
      description: '1926年深秋，阿卡姆镇。你站在米斯卡塔尼克大学图书馆的入口，手中紧握着那封神秘的信件。信中提到了一个失踪的教授、一本禁忌的古籍、以及某些"不应该被提及的事物"。图书馆内灯火昏暗，空气中弥漫着旧书和灰尘的气息。一位戴着眼镜的老管理员正在整理书架，偶尔用怀疑的目光打量着来访者',
      npcs: [
        {
          id: 'librarian_henry',
          name: '亨利·阿米蒂奇',
          title: '图书馆馆长',
          description: '一位年迈的学者，白发苍苍，戴着圆框眼镜。他的眼中透着智慧，但也有深深的忧虑。作为米斯卡塔尼克大学图书馆的馆长，他知道许多不该被知道的秘密',
          role: 'quest_giver',
          personality: '严肃认真，知识渊博，对禁忌知识心存敬畏',
          dialogue: [
            '你是来...调查那件事的？',
            '威尔斯教授已经失踪两周了。他最后被人看到，是在禁书区...',
            '我必须警告你，有些知识是危险的。知道得越多，失去的越多',
            '如果你执意要调查，我可以给你一些帮助...但请务必小心',
          ],
          stats: { level: 10, hp: 20, intelligence: 18, wisdom: 16, sanity: 45 },
          customData: { knowledge: 'high', trust: 0 },
        },
        {
          id: 'professor_wells',
          name: '威尔斯教授',
          title: '失踪的教授',
          description: '一位中年学者，专攻古代文明和神秘学。他的研究笔记中充满了令人不安的图画和符号。目前下落不明',
          role: 'custom',
          personality: '执着于研究，可能已经知道太多',
          dialogue: [],
          stats: { level: 8, hp: 15, intelligence: 17, wisdom: 14, sanity: 25 },
          customData: { status: 'missing', last_location: 'restricted_section' },
        },
        {
          id: 'student_assistant',
          name: '艾丽丝·摩根',
          title: '研究生助理',
          description: '一位年轻的女学生，是威尔斯教授的研究助理。她看起来很担心教授的安危，似乎知道一些内情',
          role: 'neutral',
          personality: '聪明好奇，有些紧张，担心教授',
          dialogue: [
            '你也是来找威尔斯教授的吗？他已经好几天没来学校了...',
            '教授最近一直在研究一本古书，他变得...很奇怪',
            '我听到他在图书馆的禁书区自言自语，说着听不懂的话',
            '请找到他...我很担心',
          ],
          stats: { level: 3, hp: 10, intelligence: 14, wisdom: 12, sanity: 60 },
          customData: { affection: 0, information: 'medium' },
        },
      ],
      items: [
        {
          id: 'mysterious_letter',
          name: '神秘信件',
          description: '一封来自阿卡姆的信件，字迹潦草，内容令人不安。信中提到了威尔斯教授的失踪和一些"不该存在的事物"',
          type: 'quest',
          rarity: 'unique',
          value: { buy: 0, sell: 0, currency: 'USD' },
          quantity: 1,
        },
        {
          id: 'flashlight',
          name: '手电筒',
          description: '一个老式的金属手电筒，电池还有电。在黑暗的地方会派上用场',
          type: 'misc',
          rarity: 'common',
          value: { buy: 5, sell: 2, currency: 'USD' },
          quantity: 1,
        },
        {
          id: 'notebook',
          name: '调查笔记',
          description: '一本空白的笔记本，用于记录调查中发现的信息和线索',
          type: 'misc',
          rarity: 'common',
          value: { buy: 1, sell: 0, currency: 'USD' },
          quantity: 1,
        },
      ],
      quests: [
        {
          id: 'main_quest_001',
          name: '失踪的教授',
          description: '调查威尔斯教授失踪的真相，找出他最后出现的地点和原因',
          type: 'main',
          objectives: [
            { id: 'obj_001', description: '与阿米蒂奇馆长交谈', type: 'talk', target: 'librarian_henry', required: 1 },
            { id: 'obj_002', description: '询问艾丽丝关于教授的近况', type: 'talk', target: 'student_assistant', required: 1 },
            { id: 'obj_003', description: '调查图书馆禁书区', type: 'explore', target: 'restricted_section', required: 1 },
            { id: 'obj_004', description: '找到威尔斯教授的研究笔记', type: 'collect', target: 'wells_notes', required: 1 },
          ],
          rewards: [
            { type: 'experience', value: 100 },
            { type: 'item', value: 'library_key', quantity: 1 },
          ],
          giver: 'librarian_henry',
        },
      ],
    }),
    ui_theme: JSON.stringify({
      primaryColor: '#1a1a2e',
      fontFamily: '"Courier New", "Lucida Console", monospace',
      backgroundStyle: 'solid',
      customCSS: `
        .game-container { 
          background: linear-gradient(180deg, #0a0a0f 0%, #1a1a2e 50%, #16213e 100%); 
          color: #c0c0c0;
        }
        .text-panel { 
          background: rgba(10,10,15,0.95); 
          border: 1px solid #2a2a4a;
          box-shadow: 0 0 20px rgba(0,0,0,0.8);
        }
        .choice-button { 
          background: #16213e; 
          border: 1px solid #2a2a4a; 
          color: #8a8aaa;
        }
        .choice-button:hover { 
          background: #1a1a3e; 
          border-color: #4a4a7a;
          color: #aaaacc;
        }
        .sanity-bar { 
          background: linear-gradient(90deg, #8b0000, #4a0000);
        }
        .horror-text { 
          text-shadow: 0 0 5px #4a0000;
        }
      `,
    }),
    ui_layout: JSON.stringify({
      showMinimap: false,
      showCombatPanel: true,
      showSkillBar: false,
      showPartyPanel: false,
      minimapPosition: 'top-right',
      minimapSize: 'small',
      partyPanelPosition: 'left',
      skillBarSlots: 4,
    }),
    is_builtin: 1,
  },

  // ==================== 模板 4：赛博朋克佣兵 ====================
  {
    id: 'template-cyberpunk-mercenary',
    name: '赛博朋克佣兵',
    description: '赛博朋克风格的未来都市冒险。在2077年的新东京，高科技与低生活并存。你是一名佣兵，在这座霓虹闪烁的城市中接受各种委托，在巨型企业、街头帮派和神秘黑客之间周旋。',
    version: '1.0.0',
    author: 'AI-RPG Engine',
    tags: JSON.stringify(['赛博朋克', '科幻', '动作', '未来', '义体']),
    game_mode: 'dynamic_combat',
    world_setting: JSON.stringify({
      name: '新东京',
      description: '一座垂直建造的巨型都市，上层是巨型企业的高塔和豪宅，下层是拥挤的贫民窟和黑市。全息广告充斥着每个角落，无人机在空中巡逻，而黑客在网络空间中窃取着机密。这里是梦想家的天堂，也是绝望者的地狱',
      era: '2077年',
      technologyLevel: '赛博朋克 - 义体改造、神经接口、人工智能、虚拟现实',
      customFields: {
        currency: '信用点 (Credits)',
        cyberware_system: '义体改造系统',
        netrunning: '网络入侵',
      },
    }),
    character_creation: JSON.stringify({
      races: [
        {
          id: 'human',
          name: '自然人',
          description: '未经过大规模义体改造的人类，保持着原本的肉体，但可能有小型的植入物',
          bonuses: { charisma: 1, wisdom: 1 },
          penalties: {},
          abilities: ['人性保留', '低维护成本'],
          availableClasses: ['mercenary', 'hacker', 'medic', 'negotiator'],
        },
        {
          id: 'augmented',
          name: '改造人',
          description: '经过大量义体改造的人类，身体的一部分已被机械替代，拥有超越常人的能力',
          bonuses: { strength: 2, dexterity: 2, constitution: 1 },
          penalties: { charisma: -1, wisdom: -1 },
          abilities: ['义体强化', '界面接口', '增强感知'],
          availableClasses: ['mercenary', 'enforcer', 'infiltrator'],
        },
        {
          id: 'android',
          name: '仿生人',
          description: '人工智能驱动的人形机器人，外表与人类相似，但本质是机器。在某些方面超越人类，但也受到限制',
          bonuses: { intelligence: 2, dexterity: 2, constitution: 2 },
          penalties: { charisma: -2 },
          abilities: ['数据处理', '系统接口', '不知疲倦'],
          availableClasses: ['hacker', 'infiltrator', 'specialist'],
        },
      ],
      classes: [
        {
          id: 'mercenary',
          name: '佣兵',
          description: '战斗专家，擅长使用各种武器和战术，是街头最可靠的战斗力',
          primaryAttributes: ['strength', 'dexterity', 'constitution'],
          hitDie: 'd10',
          skillProficiencies: ['firearms', 'melee', 'tactics', 'intimidation'],
          startingEquipment: ['突击步枪', '手枪', '战术护甲', '神经接口'],
        },
        {
          id: 'hacker',
          name: '黑客',
          description: '网络入侵专家，能够在虚拟空间中窃取信息、破坏系统',
          primaryAttributes: ['intelligence', 'dexterity', 'wisdom'],
          hitDie: 'd6',
          skillProficiencies: ['netrunning', 'programming', 'electronics', 'stealth'],
          startingEquipment: ['网络接入舱', '高级解码器', '便携终端', '数据芯片'],
        },
        {
          id: 'medic',
          name: '医生',
          description: '医疗支援专家，能够治疗伤员和进行义体维修',
          primaryAttributes: ['intelligence', 'wisdom', 'charisma'],
          hitDie: 'd8',
          skillProficiencies: ['medicine', 'cybertech', 'chemistry', 'first_aid'],
          startingEquipment: ['医疗包', '义体维修工具', '急救喷雾', '诊断仪'],
        },
        {
          id: 'infiltrator',
          name: '潜行者',
          description: '隐秘行动专家，擅长潜入、暗杀和情报窃取',
          primaryAttributes: ['dexterity', 'intelligence', 'wisdom'],
          hitDie: 'd8',
          skillProficiencies: ['stealth', 'lockpicking', 'perception', 'melee'],
          startingEquipment: ['消音手枪', '光学迷彩服', '开锁工具', '侦察无人机'],
        },
        {
          id: 'negotiator',
          name: '谈判专家',
          description: '社交专家，擅长交涉、欺骗和信息收集',
          primaryAttributes: ['charisma', 'intelligence', 'wisdom'],
          hitDie: 'd6',
          skillProficiencies: ['persuasion', 'deception', 'streetwise', 'investigation'],
          startingEquipment: ['高级通讯器', '身份伪造器', '正装', '情报网络接入'],
        },
      ],
      backgrounds: [
        {
          id: 'street_orphan',
          name: '街头孤儿',
          description: '你在新东京下层的贫民窟长大，从小就在街头生存。你学会了如何在这座城市的阴暗面中找到自己的路',
          skillProficiencies: ['streetwise', 'survival', 'stealth', 'improvisation'],
          languages: ['日语', '街头黑话'],
          equipment: ['破旧夹克', '匕首', '假身份证', '少量信用点'],
          feature: '街头人脉 - 你熟悉下层社会，认识各种"灰色"人物',
        },
        {
          id: 'corporate_defector',
          name: '企业叛逃者',
          description: '你曾是某大企业的员工，掌握了大量机密。当你决定离开时，你成了被追猎的目标。现在，你用你的知识和技能在阴影中生存',
          skillProficiencies: ['corporate_knowledge', 'technology', 'deception', 'negotiation'],
          languages: ['日语', '英语', '企业代码'],
          equipment: ['企业终端', '机密数据', '高级身份卡', '隐藏资金'],
          feature: '内部消息 - 你了解企业的运作方式，能获取内部情报',
        },
        {
          id: 'military_veteran',
          name: '退伍军人',
          description: '你曾在军队或私人军事公司服役，经历过真正的战争。现在你退役了，但你的技能在城市中依然有用武之地',
          skillProficiencies: ['firearms', 'tactics', 'survival', 'intimidation'],
          languages: ['日语', '军事术语'],
          equipment: ['军用级义眼', '老兵证件', '战术装备', '退役补偿金'],
          feature: '军事训练 - 你接受过专业战斗训练，在战斗中有优势',
        },
      ],
      attributes: [
        { id: 'strength', name: '力量', abbreviation: 'STR', description: '角色的身体力量，影响近战伤害和负重', defaultValue: 10, minValue: 1, maxValue: 20 },
        { id: 'dexterity', name: '敏捷', abbreviation: 'DEX', description: '角色的灵活性和反应速度，影响闪避和远程攻击', defaultValue: 10, minValue: 1, maxValue: 20 },
        { id: 'constitution', name: '体质', abbreviation: 'CON', description: '角色的健康和耐力，影响生命值和抗性', defaultValue: 10, minValue: 1, maxValue: 20 },
        { id: 'intelligence', name: '智力', abbreviation: 'INT', description: '角色的思维能力和记忆力，影响黑客技术和学习', defaultValue: 10, minValue: 1, maxValue: 20 },
        { id: 'wisdom', name: '感知', abbreviation: 'WIS', description: '角色的洞察力和判断力，影响直觉和意志', defaultValue: 10, minValue: 1, maxValue: 20 },
        { id: 'charisma', name: '魅力', abbreviation: 'CHA', description: '角色的个人魅力和影响力，影响社交和谈判', defaultValue: 10, minValue: 1, maxValue: 20 },
      ],
      customOptions: [
        { id: 'cyberware_level', name: '初始义体等级', type: 'select', options: ['无', '轻度', '中度', '重度'], defaultValue: '轻度' },
        { id: 'neural_interface', name: '神经接口类型', type: 'select', options: ['基础型', '军用型', '黑客型'], defaultValue: '基础型' },
      ],
    }),
    game_rules: JSON.stringify({
      combatSystem: {
        type: 'hybrid',
        initiativeType: 'dexterity',
        actionPoints: 3,
        criticalHit: { threshold: 19, multiplier: 2 },
      },
      skillSystem: {
        maxLevel: 15,
        upgradeCost: { base: 150, multiplier: 1.6 },
        cooldownSystem: 'turn',
      },
      inventorySystem: {
        maxSlots: 40,
        stackSizes: { ammo: 100, consumable: 10, data: 99 },
        weightSystem: false,
      },
      questSystem: {
        maxActive: 5,
        failConditions: ['time_limit', 'target_escape', 'alert_raised'],
        timeSystem: true,
      },
    }),
    ai_constraints: JSON.stringify({
      tone: 'serious',
      contentRating: 'mature',
      prohibitedTopics: [],
      requiredElements: ['赛博朋克元素', '道德选择', '企业阴谋', '义体改造'],
      aiBehavior: {
        responseStyle: 'adaptive',
        detailLevel: 'normal',
        playerAgency: 'freeform',
      },
    }),
    starting_scene: JSON.stringify({
      location: '新东京下层区 - "霓虹之泪"酒吧',
      description: '霓虹灯的紫色光芒穿透烟雾，在潮湿的金属地板上投下斑驳的光影。"霓虹之泪"是下层区最著名的佣兵聚集地，各路人物在此交换情报、接受委托。你坐在吧台边，面前是一杯廉价的合成酒精。酒吧的角落里，一个戴着全息面具的神秘人正在等待...似乎有一份委托要交给你',
      npcs: [
        {
          id: 'fixer_shadow',
          name: '暗影',
          title: '中间人',
          description: '一个神秘的中间人，总是戴着全息面具，没有人见过他的真面目。他掌握着大量的地下情报，是佣兵们获取委托的主要渠道',
          role: 'quest_giver',
          personality: '神秘莫测，精明算计，从不透露多余信息',
          dialogue: [
            '...你来了。我有一份委托，报酬丰厚，但风险也不小',
            '目标是一份企业机密数据，存储在荒坂公司的一个研究设施里',
            '需要潜入、黑客技术、和一点运气。你有兴趣吗？',
            '先别急着回答。去和酒吧老板聊聊，他可能会给你一些有用的信息',
          ],
          stats: { level: 15, hp: 50, intelligence: 18, charisma: 16 },
          customData: { reputation: 'high', trust: 0 },
        },
        {
          id: 'bartender_ryo',
          name: '老亮',
          title: '酒吧老板',
          description: '一个中年男子，左眼是一只红色的义眼。他曾是著名的佣兵，现在经营这家酒吧。他知道下层区发生的所有事情',
          role: 'neutral',
          personality: '老练世故，话不多但句句在理，对年轻人有些照顾',
          dialogue: [
            '新面孔？欢迎来到"霓虹之泪"',
            '想喝点什么？我推荐"电子脉冲"，今晚特调',
            '暗影那个人...他的委托从不简单。但如果你能完成，名声会大涨',
            '需要情报的话，我可以帮你...当然，要有报酬',
          ],
          stats: { level: 20, hp: 80, strength: 16, wisdom: 18 },
          services: ['shop', 'inn'],
          customData: { former_mercenary: true, knowledge: 'high' },
        },
        {
          id: 'hacker_zero',
          name: '零',
          title: '自由黑客',
          description: '一个年轻的女性黑客，头发染成霓虹绿色，戴着增强现实眼镜。她总是在角落里敲打着便携终端',
          role: 'ally',
          personality: '技术宅，有些社交障碍，但在网络空间是无敌的',
          dialogue: [
            '...（专注于终端）',
            '嗯？你是新来的佣兵？',
            '如果你需要黑客支持...我可以帮忙。当然，要收费',
            '暗影的委托...我听说过那个研究设施。安保系统很复杂',
          ],
          stats: { level: 12, hp: 30, intelligence: 19, dexterity: 16 },
          customData: { skill: 'netrunning', available_for_hire: true, cost: 500 },
        },
      ],
      items: [
        {
          id: 'starter_pistol',
          name: '民用脉冲手枪',
          description: '一把基础的能量手枪，虽然不是军用级别，但在街头足够自保',
          type: 'weapon',
          rarity: 'common',
          stats: { attack: 8, critical: 3, energy_damage: 5 },
          value: { buy: 200, sell: 100, currency: '信用点' },
          quantity: 1,
        },
        {
          id: 'neural_interface_basic',
          name: '基础神经接口',
          description: '一个基础的神经接口装置，可以连接各种电子设备和网络',
          type: 'accessory',
          rarity: 'common',
          stats: { hacking_bonus: 2, interface_speed: 1 },
          value: { buy: 500, sell: 250, currency: '信用点' },
          quantity: 1,
        },
        {
          id: 'stim_pack',
          name: '兴奋剂',
          description: '一支军用级兴奋剂，可以快速恢复体力和反应速度',
          type: 'consumable',
          rarity: 'uncommon',
          effects: [{ type: 'restore_ap', value: 2, duration: 3 }],
          value: { buy: 50, sell: 25, currency: '信用点' },
          quantity: 2,
        },
        {
          id: 'credits_card',
          name: '信用点卡',
          description: '一张存有初始资金的信用点卡',
          type: 'misc',
          rarity: 'common',
          value: { buy: 0, sell: 0, currency: '信用点' },
          quantity: 1000,
        },
      ],
      quests: [
        {
          id: 'main_quest_001',
          name: '数据窃取',
          description: '潜入荒坂公司的研究设施，窃取一份机密数据',
          type: 'main',
          objectives: [
            { id: 'obj_001', description: '与暗影交谈，了解委托详情', type: 'talk', target: 'fixer_shadow', required: 1 },
            { id: 'obj_002', description: '收集研究设施的情报', type: 'custom', target: 'gather_intel', required: 1 },
            { id: 'obj_003', description: '找到进入设施的方法', type: 'explore', target: 'facility_entrance', required: 1 },
            { id: 'obj_004', description: '窃取目标数据', type: 'collect', target: 'target_data', required: 1 },
          ],
          rewards: [
            { type: 'experience', value: 300 },
            { type: 'currency', value: 2000, quantity: 1 },
            { type: 'item', value: 'military_cyberware', quantity: 1 },
          ],
          giver: 'fixer_shadow',
          timeLimit: 72,
        },
      ],
    }),
    ui_theme: JSON.stringify({
      primaryColor: '#00ffff',
      fontFamily: '"Orbitron", "Rajdhani", "Share Tech Mono", sans-serif',
      backgroundStyle: 'animated',
      customCSS: `
        .game-container { 
          background: linear-gradient(135deg, #0a0a0f 0%, #1a0a2e 50%, #0a1a2e 100%); 
        }
        .text-panel { 
          background: rgba(10,10,20,0.95); 
          border: 1px solid #00ffff;
          box-shadow: 0 0 20px rgba(0,255,255,0.3), inset 0 0 30px rgba(0,255,255,0.05);
        }
        .choice-button { 
          background: linear-gradient(90deg, #0a1a2e, #1a2a4e); 
          border: 1px solid #00ffff; 
          color: #00ffff;
          text-shadow: 0 0 5px #00ffff;
        }
        .choice-button:hover { 
          background: linear-gradient(90deg, #1a2a4e, #2a3a6e); 
          box-shadow: 0 0 15px rgba(0,255,255,0.5);
        }
        .neon-text { 
          color: #ff00ff;
          text-shadow: 0 0 5px #ff00ff, 0 0 10px #ff00ff;
        }
        .cyber-grid {
          background-image: 
            linear-gradient(rgba(0,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,255,255,0.1) 1px, transparent 1px);
          background-size: 20px 20px;
        }
      `,
    }),
    ui_layout: JSON.stringify({
      showMinimap: true,
      showCombatPanel: true,
      showSkillBar: true,
      showPartyPanel: true,
      minimapPosition: 'top-right',
      minimapSize: 'medium',
      partyPanelPosition: 'left',
      skillBarSlots: 6,
    }),
    is_builtin: 1,
  },
];

const SEED_SETTINGS = [
  { id: 'setting-ai-model', category: 'ai', key: 'model', value: JSON.stringify({ provider: 'deepseek', model: 'deepseek-chat' }), description: 'AI模型配置' },
  { id: 'setting-ai-temperature', category: 'ai', key: 'temperature', value: JSON.stringify({ value: 0.7 }), description: '生成温度' },
  { id: 'setting-ai-max-tokens', category: 'ai', key: 'maxTokens', value: JSON.stringify({ value: 4096 }), description: '最大Token数' },
  { id: 'setting-display-theme', category: 'display', key: 'theme', value: JSON.stringify({ mode: 'dark' }), description: '显示主题' },
  { id: 'setting-display-font-size', category: 'display', key: 'fontSize', value: JSON.stringify({ value: 14 }), description: '字体大小' },
  { id: 'setting-gameplay-auto-save', category: 'gameplay', key: 'autoSave', value: JSON.stringify({ enabled: true, interval: 300 }), description: '自动保存' },
  { id: 'setting-gameplay-text-speed', category: 'gameplay', key: 'textSpeed', value: JSON.stringify({ value: 50 }), description: '文字显示速度' },
  { id: 'setting-developer-show-agent', category: 'developer', key: 'showAgentComm', value: JSON.stringify({ enabled: false }), description: '显示智能体通信' },
  { id: 'setting-developer-debug-mode', category: 'developer', key: 'debugMode', value: JSON.stringify({ enabled: false }), description: '调试模式' },
];

export class DatabaseInitializer {
  private getDb(): DatabaseService {
    return DatabaseService.getInstance();
  }

  public initialize(): void {
    console.log('Initializing database...');
    
    this.createTables();
    this.runMigrations();
    this.seedData();
    
    console.log('Database initialization complete.');
  }

  private createTables(): void {
    const db = this.getDb();
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    
    db.exec(schema);
    
    console.log('Tables created successfully.');
  }

  private runMigrations(): void {
    const db = this.getDb();
    
    try {
      const result = db.prepare<{ name: string }>("SELECT name FROM pragma_table_info('templates') WHERE name = 'ui_layout'").get();
      if (!result) {
        console.log('Running migration: Adding ui_layout column to templates...');
        db.exec('ALTER TABLE templates ADD COLUMN ui_layout TEXT DEFAULT "{}"');
        console.log('Migration completed: ui_layout column added');
      }
    } catch (error) {
      console.log('Migration check skipped (table may not exist yet)');
    }

    try {
      const skillsCheck = db.prepare<{ name: string }>("SELECT name FROM pragma_table_info('skills') WHERE name = 'created_at'").get();
      if (!skillsCheck) {
        console.log('Running migration: Rebuilding skills table with full schema...');
        db.exec(`
          DROP TABLE IF EXISTS skills;
          CREATE TABLE IF NOT EXISTS skills (
            id TEXT PRIMARY KEY,
            character_id TEXT NOT NULL,
            skill_id TEXT,
            name TEXT NOT NULL,
            description TEXT,
            type TEXT DEFAULT 'active' CHECK(type IN ('active', 'passive', 'toggle')),
            category TEXT DEFAULT 'combat' CHECK(category IN ('combat', 'magic', 'craft', 'social', 'exploration', 'custom')),
            level INTEGER DEFAULT 1,
            max_level INTEGER DEFAULT 10,
            cooldown INTEGER DEFAULT 0,
            costs TEXT DEFAULT '[]',
            effects TEXT DEFAULT '[]',
            requirements TEXT DEFAULT '[]',
            target_type TEXT DEFAULT 'single_enemy',
            range TEXT DEFAULT '{}',
            cast_time INTEGER,
            channel_time INTEGER,
            is_toggle_on INTEGER DEFAULT 0,
            tags TEXT DEFAULT '[]',
            unlocked INTEGER DEFAULT 1,
            custom_data TEXT DEFAULT '{}',
            created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
            updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
            FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
          );
        `);
        console.log('Migration completed: skills table rebuilt');
      }
    } catch (error) {
      console.log('Skills migration check skipped (table may not exist yet)');
    }

    try {
      const cooldownsCheck = db.prepare<{ name: string }>("SELECT name FROM sqlite_master WHERE type='table' AND name='skill_cooldowns'").get();
      if (!cooldownsCheck) {
        console.log('Running migration: Creating skill_cooldowns table...');
        db.exec(`
          CREATE TABLE IF NOT EXISTS skill_cooldowns (
            id TEXT PRIMARY KEY,
            character_id TEXT NOT NULL,
            skill_id TEXT NOT NULL,
            remaining_turns INTEGER DEFAULT 0,
            total_cooldown INTEGER DEFAULT 0,
            last_used_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
            created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
            updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
            FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE,
            UNIQUE(character_id, skill_id)
          );
        `);
        console.log('Migration completed: skill_cooldowns table created');
      }
    } catch (error) {
      console.log('Skill cooldowns migration check skipped');
    }

    try {
      const templatesCheck = db.prepare<{ name: string }>("SELECT name FROM sqlite_master WHERE type='table' AND name='skill_templates'").get();
      if (!templatesCheck) {
        console.log('Running migration: Creating skill_templates table...');
        db.exec(`
          CREATE TABLE IF NOT EXISTS skill_templates (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL UNIQUE,
            description TEXT,
            type TEXT DEFAULT 'active' CHECK(type IN ('active', 'passive', 'toggle')),
            category TEXT DEFAULT 'combat' CHECK(category IN ('combat', 'magic', 'craft', 'social', 'exploration', 'custom')),
            base_costs TEXT DEFAULT '[]',
            base_cooldown INTEGER DEFAULT 0,
            base_effects TEXT DEFAULT '[]',
            requirements TEXT DEFAULT '[]',
            max_level INTEGER DEFAULT 10,
            scaling_per_level TEXT DEFAULT '{}',
            created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
            updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
          );
        `);
        console.log('Migration completed: skill_templates table created');
      }
    } catch (error) {
      console.log('Skill templates migration check skipped');
    }

    // ==================== 任务表迁移 ====================
    // 迁移 5: 更新 quests 表结构以支持完整任务系统
    try {
      const questsTableCheck = db.prepare<{ name: string }>("SELECT name FROM sqlite_master WHERE type='table' AND name='quests'").get();
      if (questsTableCheck) {
        // 检查是否有 character_id 列（新结构）
        const characterIdCheck = db.prepare<{ name: string }>("SELECT name FROM pragma_table_info('quests') WHERE name = 'character_id'").get();
        const saveIdCheck = db.prepare<{ name: string }>("SELECT name FROM pragma_table_info('quests') WHERE name = 'save_id'").get();
        
        // 如果有 save_id 但没有 character_id，需要重建表
        if (saveIdCheck && !characterIdCheck) {
          console.log('Running migration: Rebuilding quests table with new schema...');
          db.exec(`
            DROP TABLE IF EXISTS quests;
            CREATE TABLE IF NOT EXISTS quests (
              id TEXT PRIMARY KEY,
              character_id TEXT NOT NULL,
              quest_id TEXT NOT NULL,
              name TEXT NOT NULL,
              description TEXT,
              type TEXT DEFAULT 'side' CHECK(type IN ('main', 'side', 'daily', 'hidden', 'chain')),
              status TEXT DEFAULT 'available' CHECK(status IN ('locked', 'available', 'in_progress', 'completed', 'failed')),
              objectives TEXT DEFAULT '[]',
              prerequisites TEXT DEFAULT '[]',
              rewards TEXT DEFAULT '{}',
              time_limit INTEGER,
              log TEXT DEFAULT '[]',
              created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
              updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
              UNIQUE(character_id, quest_id)
            );
            CREATE INDEX IF NOT EXISTS idx_quests_character ON quests(character_id);
            CREATE INDEX IF NOT EXISTS idx_quests_status ON quests(status);
            CREATE INDEX IF NOT EXISTS idx_quests_type ON quests(type);
          `);
          console.log('Migration completed: quests table rebuilt with new schema');
        } else {
          // 检查是否缺少其他列
          const prerequisitesCheck = db.prepare<{ name: string }>("SELECT name FROM pragma_table_info('quests') WHERE name = 'prerequisites'").get();
          if (!prerequisitesCheck) {
            console.log('Running migration: Adding prerequisites column to quests...');
            db.exec('ALTER TABLE quests ADD COLUMN prerequisites TEXT DEFAULT "[]"');
            console.log('Migration completed: prerequisites column added');
          }

          const logCheck = db.prepare<{ name: string }>("SELECT name FROM pragma_table_info('quests') WHERE name = 'log'").get();
          if (!logCheck) {
            console.log('Running migration: Adding log column to quests...');
            db.exec('ALTER TABLE quests ADD COLUMN log TEXT DEFAULT "[]"');
            console.log('Migration completed: log column added');
          }
        }
      }
    } catch (error) {
      console.log('Quests migration check skipped:', error);
    }
  }

  private seedData(): void {
    this.seedTemplates();
    this.seedSettings();
  }

  private seedTemplates(): void {
    const db = this.getDb();
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO templates (
        id, name, description, version, author, tags, game_mode,
        world_setting, character_creation, game_rules, ai_constraints,
        starting_scene, ui_theme, ui_layout, is_builtin
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?
      )
    `);

    for (const template of SEED_TEMPLATES) {
      stmt.run(
        template.id,
        template.name,
        template.description,
        template.version,
        template.author,
        template.tags,
        template.game_mode,
        template.world_setting,
        template.character_creation,
        template.game_rules,
        template.ai_constraints,
        template.starting_scene,
        template.ui_theme,
        template.ui_layout,
        template.is_builtin
      );
    }

    console.log(`Seeded ${SEED_TEMPLATES.length} templates.`);
  }

  private seedSettings(): void {
    const db = this.getDb();
    const stmt = db.prepare(`
      INSERT OR IGNORE INTO settings (id, category, key, value, description)
      VALUES (?, ?, ?, ?, ?)
    `);

    for (const setting of SEED_SETTINGS) {
      stmt.run(setting.id, setting.category, setting.key, setting.value, setting.description);
    }

    console.log(`Seeded ${SEED_SETTINGS.length} settings.`);
  }

  public isInitialized(): boolean {
    try {
      const db = this.getDb();
      const result = db.prepare<{ count: number }>('SELECT COUNT(*) as count FROM db_version').get();
      return result ? result.count > 0 : false;
    } catch {
      return false;
    }
  }

  public getVersion(): number {
    try {
      const db = this.getDb();
      const result = db.prepare<{ version: number }>('SELECT MAX(version) as version FROM db_version').get();
      return result?.version || 0;
    } catch {
      return 0;
    }
  }
}

export const databaseInitializer = new DatabaseInitializer();
