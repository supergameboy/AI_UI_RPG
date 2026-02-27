import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DatabaseService } from '../services/DatabaseService';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SEED_TEMPLATES = [
  {
    id: 'template-medieval-fantasy',
    name: '中世纪奇幻冒险',
    description: '经典的中世纪奇幻世界，包含魔法、剑与龙的冒险故事',
    version: '1.0.0',
    author: 'AI-RPG Engine',
    tags: JSON.stringify(['奇幻', '冒险', 'RPG', '魔法']),
    game_mode: 'turn_based_rpg',
    world_setting: JSON.stringify({
      name: '艾尔德兰大陆',
      description: '一个充满魔法与奇迹的大陆',
      era: '中世纪',
      magicSystem: '元素魔法',
      technologyLevel: '中世纪',
    }),
    character_creation: JSON.stringify({
      races: [
        { id: 'human', name: '人类', bonuses: { strength: 1, intelligence: 1 } },
        { id: 'elf', name: '精灵', bonuses: { dexterity: 2, wisdom: 1 } },
        { id: 'dwarf', name: '矮人', bonuses: { constitution: 2, strength: 1 } },
      ],
      classes: [
        { id: 'warrior', name: '战士', primaryAttributes: ['strength', 'constitution'] },
        { id: 'mage', name: '法师', primaryAttributes: ['intelligence', 'wisdom'] },
        { id: 'rogue', name: '盗贼', primaryAttributes: ['dexterity', 'luck'] },
      ],
    }),
    game_rules: JSON.stringify({
      combatSystem: { type: 'turn_based', actionPoints: 3 },
      skillSystem: { maxLevel: 10 },
      inventorySystem: { maxSlots: 50 },
    }),
    ai_constraints: JSON.stringify({
      tone: 'serious',
      contentRating: 'teen',
      prohibitedTopics: [],
    }),
    starting_scene: JSON.stringify({
      location: '新手村',
      description: '你在一个宁静的小村庄醒来...',
    }),
    ui_theme: JSON.stringify({
      primaryColor: '#8B4513',
      fontFamily: 'serif',
    }),
    is_builtin: 1,
  },
  {
    id: 'template-modern-romance',
    name: '现代都市恋爱',
    description: '现代都市背景的恋爱模拟故事',
    version: '1.0.0',
    author: 'AI-RPG Engine',
    tags: JSON.stringify(['恋爱', '都市', '视觉小说', '现代']),
    game_mode: 'visual_novel',
    world_setting: JSON.stringify({
      name: '星城市',
      description: '一个繁华的现代都市',
      era: '现代',
      technologyLevel: '现代',
    }),
    character_creation: JSON.stringify({
      races: [{ id: 'human', name: '人类' }],
      classes: [
        { id: 'student', name: '学生' },
        { id: 'office_worker', name: '上班族' },
        { id: 'freelancer', name: '自由职业者' },
      ],
    }),
    game_rules: JSON.stringify({
      skillSystem: { maxLevel: 5 },
      inventorySystem: { maxSlots: 20 },
    }),
    ai_constraints: JSON.stringify({
      tone: 'romantic',
      contentRating: 'teen',
    }),
    starting_scene: JSON.stringify({
      location: '咖啡厅',
      description: '一个阳光明媚的下午，你在咖啡厅里...',
    }),
    ui_theme: JSON.stringify({
      primaryColor: '#FF69B4',
      fontFamily: 'sans-serif',
    }),
    is_builtin: 1,
  },
  {
    id: 'template-lovecraft-horror',
    name: '克苏鲁恐怖调查',
    description: '克苏鲁神话背景的恐怖调查故事',
    version: '1.0.0',
    author: 'AI-RPG Engine',
    tags: JSON.stringify(['恐怖', '悬疑', '克苏鲁', '调查']),
    game_mode: 'text_adventure',
    world_setting: JSON.stringify({
      name: '阿卡姆镇',
      description: '一个充满神秘事件的小镇',
      era: '1920年代',
      technologyLevel: '工业时代',
    }),
    character_creation: JSON.stringify({
      races: [{ id: 'human', name: '人类' }],
      classes: [
        { id: 'detective', name: '侦探' },
        { id: 'journalist', name: '记者' },
        { id: 'scholar', name: '学者' },
      ],
    }),
    game_rules: JSON.stringify({
      skillSystem: { maxLevel: 10 },
      inventorySystem: { maxSlots: 30 },
    }),
    ai_constraints: JSON.stringify({
      tone: 'dark',
      contentRating: 'mature',
    }),
    starting_scene: JSON.stringify({
      location: '阿卡姆图书馆',
      description: '你收到了一封神秘的信件...',
    }),
    ui_theme: JSON.stringify({
      primaryColor: '#2F4F4F',
      fontFamily: 'serif',
    }),
    is_builtin: 1,
  },
  {
    id: 'template-cyberpunk-mercenary',
    name: '赛博朋克佣兵',
    description: '赛博朋克风格的未来都市冒险',
    version: '1.0.0',
    author: 'AI-RPG Engine',
    tags: JSON.stringify(['赛博朋克', '科幻', '动作', '未来']),
    game_mode: 'dynamic_combat',
    world_setting: JSON.stringify({
      name: '新东京',
      description: '一个高科技与低生活并存的未来都市',
      era: '2077年',
      technologyLevel: '赛博朋克',
    }),
    character_creation: JSON.stringify({
      races: [
        { id: 'human', name: '自然人' },
        { id: 'augmented', name: '改造人' },
        { id: 'android', name: '仿生人' },
      ],
      classes: [
        { id: 'hacker', name: '黑客' },
        { id: 'mercenary', name: '佣兵' },
        { id: 'medic', name: '医生' },
      ],
    }),
    game_rules: JSON.stringify({
      combatSystem: { type: 'real_time' },
      skillSystem: { maxLevel: 15 },
      inventorySystem: { maxSlots: 40 },
    }),
    ai_constraints: JSON.stringify({
      tone: 'serious',
      contentRating: 'mature',
    }),
    starting_scene: JSON.stringify({
      location: '地下酒吧',
      description: '霓虹灯闪烁的地下酒吧里，一个神秘人走向你...',
    }),
    ui_theme: JSON.stringify({
      primaryColor: '#00FFFF',
      fontFamily: 'monospace',
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

  private seedData(): void {
    this.seedTemplates();
    this.seedSettings();
  }

  private seedTemplates(): void {
    const db = this.getDb();
    const stmt = db.prepare(`
      INSERT OR IGNORE INTO templates (
        id, name, description, version, author, tags, game_mode,
        world_setting, character_creation, game_rules, ai_constraints,
        starting_scene, ui_theme, is_builtin
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?
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
