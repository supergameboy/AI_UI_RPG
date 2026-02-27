-- AI-RPG Engine Database Schema
-- Version: 1.0.0

-- ============================================
-- 核心数据表
-- ============================================

-- 存档表
CREATE TABLE IF NOT EXISTS saves (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  template_id TEXT,
  game_mode TEXT NOT NULL DEFAULT 'text_adventure' CHECK(game_mode IN ('text_adventure', 'turn_based_rpg', 'visual_novel', 'dynamic_combat')),
  character_id TEXT,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  play_time INTEGER DEFAULT 0,
  current_location TEXT,
  current_scene TEXT,
  game_state TEXT DEFAULT '{}',
  story_progress TEXT DEFAULT '{}'
);

-- 角色表
CREATE TABLE IF NOT EXISTS characters (
  id TEXT PRIMARY KEY,
  save_id TEXT NOT NULL,
  name TEXT NOT NULL,
  race TEXT,
  class TEXT,
  level INTEGER DEFAULT 1,
  experience INTEGER DEFAULT 0,
  base_attributes TEXT DEFAULT '{}',
  derived_attributes TEXT DEFAULT '{}',
  equipment TEXT DEFAULT '{}',
  currency TEXT DEFAULT '{}',
  appearance TEXT,
  personality TEXT,
  backstory TEXT,
  statistics TEXT DEFAULT '{}',
  custom_data TEXT DEFAULT '{}',
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (save_id) REFERENCES saves(id) ON DELETE CASCADE
);

-- 任务表
CREATE TABLE IF NOT EXISTS quests (
  id TEXT PRIMARY KEY,
  save_id TEXT NOT NULL,
  template_id TEXT,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'side' CHECK(type IN ('main', 'side', 'daily', 'hidden')),
  status TEXT DEFAULT 'available' CHECK(status IN ('locked', 'available', 'in_progress', 'completed', 'failed')),
  objectives TEXT DEFAULT '[]',
  rewards TEXT DEFAULT '[]',
  giver_id TEXT,
  location TEXT,
  time_limit INTEGER,
  custom_data TEXT DEFAULT '{}',
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (save_id) REFERENCES saves(id) ON DELETE CASCADE
);

-- 地图表
CREATE TABLE IF NOT EXISTS maps (
  id TEXT PRIMARY KEY,
  save_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'overworld' CHECK(type IN ('overworld', 'dungeon', 'town', 'building', 'custom')),
  size TEXT DEFAULT '{}',
  tiles TEXT,
  locations TEXT DEFAULT '[]',
  connections TEXT DEFAULT '[]',
  discovered TEXT DEFAULT '[]',
  custom_data TEXT DEFAULT '{}',
  FOREIGN KEY (save_id) REFERENCES saves(id) ON DELETE CASCADE
);

-- 背包表
CREATE TABLE IF NOT EXISTS inventory (
  id TEXT PRIMARY KEY,
  save_id TEXT NOT NULL,
  character_id TEXT NOT NULL,
  item_id TEXT,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'misc' CHECK(type IN ('weapon', 'armor', 'accessory', 'consumable', 'material', 'quest', 'misc')),
  rarity TEXT DEFAULT 'common' CHECK(rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary', 'unique')),
  quantity INTEGER DEFAULT 1,
  equipped INTEGER DEFAULT 0,
  equipment_slot TEXT,
  stats TEXT DEFAULT '{}',
  effects TEXT DEFAULT '[]',
  custom_data TEXT DEFAULT '{}',
  obtained_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (save_id) REFERENCES saves(id) ON DELETE CASCADE,
  FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
);

-- 技能表
CREATE TABLE IF NOT EXISTS skills (
  id TEXT PRIMARY KEY,
  character_id TEXT NOT NULL,
  skill_id TEXT,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'active' CHECK(type IN ('active', 'passive')),
  level INTEGER DEFAULT 1,
  max_level INTEGER DEFAULT 10,
  cooldown INTEGER DEFAULT 0,
  cost TEXT DEFAULT '{}',
  effects TEXT DEFAULT '[]',
  unlocked INTEGER DEFAULT 0,
  custom_data TEXT DEFAULT '{}',
  FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
);

-- NPC表
CREATE TABLE IF NOT EXISTS npcs (
  id TEXT PRIMARY KEY,
  save_id TEXT NOT NULL,
  template_id TEXT,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'neutral' CHECK(type IN ('merchant', 'quest_giver', 'enemy', 'ally', 'neutral', 'romance')),
  location TEXT,
  disposition TEXT DEFAULT '{}',
  relationship TEXT DEFAULT '{}',
  dialogue_history TEXT DEFAULT '[]',
  flags TEXT DEFAULT '{}',
  custom_data TEXT DEFAULT '{}',
  FOREIGN KEY (save_id) REFERENCES saves(id) ON DELETE CASCADE
);

-- 对话表
CREATE TABLE IF NOT EXISTS dialogues (
  id TEXT PRIMARY KEY,
  save_id TEXT NOT NULL,
  session_id TEXT,
  npc_id TEXT,
  role TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'system', 'narrator')),
  content TEXT NOT NULL,
  timestamp INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  importance INTEGER DEFAULT 5,
  metadata TEXT DEFAULT '{}',
  FOREIGN KEY (save_id) REFERENCES saves(id) ON DELETE CASCADE,
  FOREIGN KEY (npc_id) REFERENCES npcs(id) ON DELETE SET NULL
);

-- 模板表
CREATE TABLE IF NOT EXISTS templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  version TEXT DEFAULT '1.0.0',
  author TEXT DEFAULT 'AI-RPG Engine',
  tags TEXT DEFAULT '[]',
  game_mode TEXT NOT NULL DEFAULT 'text_adventure' CHECK(game_mode IN ('text_adventure', 'turn_based_rpg', 'visual_novel', 'dynamic_combat')),
  world_setting TEXT DEFAULT '{}',
  character_creation TEXT DEFAULT '{}',
  game_rules TEXT DEFAULT '{}',
  ai_constraints TEXT DEFAULT '{}',
  starting_scene TEXT DEFAULT '{}',
  ui_theme TEXT DEFAULT '{}',
  is_builtin INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

-- 设置表
CREATE TABLE IF NOT EXISTS settings (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL CHECK(category IN ('ai', 'display', 'gameplay', 'developer', 'audio')),
  key TEXT NOT NULL,
  value TEXT DEFAULT '{}',
  description TEXT,
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  UNIQUE(category, key)
);

-- ============================================
-- 游戏模式专用表
-- ============================================

-- 线索表 (文字冒险/克苏鲁模式专用)
CREATE TABLE IF NOT EXISTS clues (
  id TEXT PRIMARY KEY,
  save_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'item' CHECK(type IN ('item', 'testimony', 'location', 'event')),
  source TEXT DEFAULT '{}',
  discovered_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  related_clues TEXT DEFAULT '[]',
  custom_data TEXT DEFAULT '{}',
  FOREIGN KEY (save_id) REFERENCES saves(id) ON DELETE CASCADE
);

-- 结局记录表 (视觉小说模式专用)
CREATE TABLE IF NOT EXISTS endings (
  id TEXT PRIMARY KEY,
  save_id TEXT NOT NULL,
  ending_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'normal' CHECK(type IN ('good', 'normal', 'bad', 'secret')),
  achieved_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  conditions TEXT DEFAULT '{}',
  FOREIGN KEY (save_id) REFERENCES saves(id) ON DELETE CASCADE
);

-- ============================================
-- 上下文管理表
-- ============================================

-- 记忆表 (4层上下文压缩)
CREATE TABLE IF NOT EXISTS memories (
  id TEXT PRIMARY KEY,
  save_id TEXT NOT NULL,
  layer INTEGER NOT NULL CHECK(layer BETWEEN 1 AND 4),
  summary TEXT,
  key_info TEXT DEFAULT '{}',
  token_count INTEGER DEFAULT 0,
  compression_ratio REAL DEFAULT 1.0,
  scene_id TEXT,
  quest_id TEXT,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (save_id) REFERENCES saves(id) ON DELETE CASCADE
);

-- 存档快照表
CREATE TABLE IF NOT EXISTS save_snapshots (
  id TEXT PRIMARY KEY,
  save_id TEXT NOT NULL,
  snapshot_type TEXT DEFAULT 'manual' CHECK(snapshot_type IN ('auto', 'manual', 'checkpoint')),
  context_state TEXT DEFAULT '{}',
  memory_state TEXT DEFAULT '{}',
  agent_states TEXT DEFAULT '{}',
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (save_id) REFERENCES saves(id) ON DELETE CASCADE
);

-- ============================================
-- 索引
-- ============================================

-- 对话表索引
CREATE INDEX IF NOT EXISTS idx_dialogues_save_session ON dialogues(save_id, session_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_dialogues_importance ON dialogues(save_id, importance);

-- 记忆表索引
CREATE INDEX IF NOT EXISTS idx_memories_save_layer ON memories(save_id, layer);

-- 背包表索引
CREATE INDEX IF NOT EXISTS idx_inventory_character ON inventory(character_id);
CREATE INDEX IF NOT EXISTS idx_inventory_equipped ON inventory(character_id, equipped);

-- 任务表索引
CREATE INDEX IF NOT EXISTS idx_quests_status ON quests(save_id, status);

-- ============================================
-- 数据库版本表
-- ============================================

CREATE TABLE IF NOT EXISTS db_version (
  version INTEGER PRIMARY KEY,
  applied_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  description TEXT
);

-- 初始版本记录
INSERT OR IGNORE INTO db_version (version, description) VALUES (1, 'Initial schema');
