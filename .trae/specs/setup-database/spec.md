# 数据库设计 Spec

## Why
项目需要一个轻量级的本地数据库来存储游戏数据，支持多种游戏模式（纯文字冒险、回合制RPG、视觉小说、动态战斗）。SQLite是理想选择，无需额外服务，适合单机游戏。

## What Changes
- 创建SQLite数据库初始化脚本
- 设计并实现所有数据表结构
- 支持多种游戏模式的灵活数据存储
- 创建数据库操作服务层
- 添加数据库迁移机制

## Impact
- Affected specs: init-project (依赖shared类型)
- Affected code: packages/backend/src/models, packages/backend/src/services

## ADDED Requirements

### Requirement: 数据库初始化
系统 SHALL 提供SQLite数据库初始化功能。

#### Scenario: 首次启动
- **WHEN** 应用首次启动时
- **THEN** 自动创建数据库文件和所有表结构
- **AND** 数据库文件存储在用户数据目录下

### Requirement: 存档表设计
系统 SHALL 提供存档表(saves)存储游戏存档元数据。

#### Scenario: 存档表结构
- **WHEN** 查看存档表结构
- **THEN** 应包含以下字段：
  - id: 主键
  - name: 存档名称
  - template_id: 关联模板ID
  - game_mode: 游戏模式(text_adventure/turn_based_rpg/visual_novel/dynamic_combat)
  - character_id: 关联角色ID
  - created_at: 创建时间
  - updated_at: 更新时间
  - play_time: 游戏时长(秒)
  - current_location: 当前位置
  - current_scene: 当前场景标识
  - game_state: 游戏状态JSON(存储模式特定的状态数据)
  - story_progress: 故事进度JSON(章节、分支点等)

### Requirement: 角色表设计
系统 SHALL 提供角色表(characters)存储角色数据，支持多种游戏模式。

#### Scenario: 角色表结构
- **WHEN** 查看角色表结构
- **THEN** 应包含以下字段：
  - id: 主键
  - save_id: 关联存档ID
  - name: 角色名称
  - race: 种族
  - class: 职业
  - level: 等级
  - experience: 经验值
  - base_attributes: 基础属性JSON(通用：力量/敏捷/体质/智力/感知/魅力 + 自定义)
  - derived_attributes: 派生属性JSON(HP/MP/攻击/防御/速度/幸运 + 自定义)
  - equipment: 装备槽位JSON(武器/头部/身体/脚部/饰品 + 自定义槽位)
  - currency: 货币JSON(金币/银币 + 自定义货币)
  - appearance: 外观描述
  - personality: 性格描述
  - backstory: 背景故事
  - statistics: 统计数据JSON(战斗胜利/任务完成/旅行距离等)
  - custom_data: 自定义数据JSON(支持不同游戏模式的特殊属性，如SAN值、义体等)

### Requirement: 任务表设计
系统 SHALL 提供任务表(quests)存储任务数据。

#### Scenario: 任务表结构
- **WHEN** 查看任务表结构
- **THEN** 应包含以下字段：
  - id: 主键
  - save_id: 关联存档ID
  - template_id: 任务模板ID
  - name: 任务名称
  - description: 任务描述
  - type: 任务类型(main/side/daily/hidden)
  - status: 任务状态(locked/available/in_progress/completed/failed)
  - objectives: 目标列表JSON
  - rewards: 奖励列表JSON
  - giver_id: 任务发布者NPC ID
  - location: 任务地点
  - time_limit: 时间限制(可选)
  - created_at: 创建时间
  - updated_at: 更新时间
  - custom_data: 自定义数据JSON

### Requirement: 地图表设计
系统 SHALL 提供地图表(maps)存储地图数据。

#### Scenario: 地图表结构
- **WHEN** 查看地图表结构
- **THEN** 应包含以下字段：
  - id: 主键
  - save_id: 关联存档ID
  - name: 地图名称
  - description: 地图描述
  - type: 地图类型(overworld/dungeon/town/building/custom)
  - size: 地图尺寸JSON
  - tiles: 地图瓦片JSON(可选，回合制RPG用)
  - locations: 地点列表JSON
  - connections: 连接列表JSON
  - discovered: 已发现区域JSON
  - custom_data: 自定义数据JSON

### Requirement: 背包表设计
系统 SHALL 提供背包表(inventory)存储物品数据。

#### Scenario: 背包表结构
- **WHEN** 查看背包表结构
- **THEN** 应包含以下字段：
  - id: 主键
  - save_id: 关联存档ID
  - character_id: 关联角色ID
  - item_id: 物品模板ID
  - name: 物品名称(实例化后可自定义)
  - type: 物品类型(weapon/armor/accessory/consumable/material/quest/misc)
  - rarity: 稀有度
  - quantity: 数量
  - equipped: 是否已装备
  - equipment_slot: 装备槽位
  - stats: 属性JSON
  - effects: 效果JSON
  - custom_data: 自定义数据JSON(强化等级、附魔等)
  - obtained_at: 获得时间

### Requirement: 技能表设计
系统 SHALL 提供技能表(skills)存储技能数据。

#### Scenario: 技能表结构
- **WHEN** 查看技能表结构
- **THEN** 应包含以下字段：
  - id: 主键
  - character_id: 关联角色ID
  - skill_id: 技能模板ID
  - name: 技能名称
  - type: 技能类型(active/passive)
  - level: 技能等级
  - max_level: 最大等级
  - cooldown: 冷却时间
  - cost: 消耗JSON
  - effects: 效果JSON
  - unlocked: 是否解锁
  - custom_data: 自定义数据JSON

### Requirement: NPC表设计
系统 SHALL 提供NPC表(npcs)存储NPC数据，支持多种交互模式。

#### Scenario: NPC表结构
- **WHEN** 查看NPC表结构
- **THEN** 应包含以下字段：
  - id: 主键
  - save_id: 关联存档ID
  - template_id: NPC模板ID
  - name: NPC名称
  - type: NPC类型(merchant/quest_giver/enemy/ally/neutral/romance)
  - location: 当前位置
  - disposition: 好感度JSON(支持视觉小说的好感度系统)
  - relationship: 关系状态JSON(朋友/恋人/敌人等)
  - dialogue_history: 对话历史摘要JSON
  - flags: 交互标记JSON(已见面/已交易/已恋爱等)
  - custom_data: 自定义数据JSON

### Requirement: 对话表设计
系统 SHALL 提供对话表(dialogues)存储对话记录。

#### Scenario: 对话表结构
- **WHEN** 查看对话表结构
- **THEN** 应包含以下字段：
  - id: 主键
  - save_id: 关联存档ID
  - session_id: 会话ID(用于分组对话)
  - npc_id: 关联NPC ID(可选)
  - role: 角色(user/assistant/system/narrator)
  - content: 对话内容
  - timestamp: 时间戳
  - importance: 重要性评分(用于上下文压缩)
  - metadata: 元数据JSON(情感标签、分支选择等)

### Requirement: 模板表设计
系统 SHALL 提供模板表(templates)存储故事模板。

#### Scenario: 模板表结构
- **WHEN** 查看模板表结构
- **THEN** 应包含以下字段：
  - id: 主键
  - name: 模板名称
  - description: 模板描述
  - version: 版本号
  - author: 作者
  - tags: 标签JSON
  - game_mode: 游戏模式
  - world_setting: 世界观设定JSON
  - character_creation: 角色创建规则JSON
  - game_rules: 游戏规则JSON
  - ai_constraints: AI约束JSON
  - starting_scene: 初始场景JSON
  - ui_theme: UI主题配置JSON
  - is_builtin: 是否内置模板
  - created_at: 创建时间
  - updated_at: 更新时间

### Requirement: 设置表设计
系统 SHALL 提供设置表(settings)存储游戏设置。

#### Scenario: 设置表结构
- **WHEN** 查看设置表结构
- **THEN** 应包含以下字段：
  - id: 主键
  - category: 设置分类(ai/display/gameplay/developer/audio)
  - key: 设置键
  - value: 设置值JSON
  - description: 设置描述
  - updated_at: 更新时间

### Requirement: 线索表设计(文字冒险专用)
系统 SHALL 提供线索表(clues)存储调查线索数据。

#### Scenario: 线索表结构
- **WHEN** 查看线索表结构
- **THEN** 应包含以下字段：
  - id: 主键
  - save_id: 关联存档ID
  - name: 线索名称
  - description: 线索描述
  - type: 线索类型(item/testimony/location/event)
  - source: 来源JSON
  - discovered_at: 发现时间
  - related_clues: 关联线索ID列表JSON
  - custom_data: 自定义数据JSON

### Requirement: 结局记录表设计(视觉小说专用)
系统 SHALL 提供结局记录表(endings)存储已达成结局。

#### Scenario: 结局记录表结构
- **WHEN** 查看结局记录表结构
- **THEN** 应包含以下字段：
  - id: 主键
  - save_id: 关联存档ID
  - ending_id: 结局标识
  - name: 结局名称
  - description: 结局描述
  - type: 结局类型(good/normal/bad/secret)
  - achieved_at: 达成时间
  - conditions: 达成条件JSON

### Requirement: 记忆表设计(上下文压缩核心)
系统 SHALL 提供记忆表(memories)存储压缩后的各层级记忆，支持4层上下文压缩机制。

#### Scenario: 记忆表结构
- **WHEN** 查看记忆表结构
- **THEN** 应包含以下字段：
  - id: 主键
  - save_id: 关联存档ID
  - layer: 记忆层级(1=实时/2=短期/3=中期/4=长期)
  - summary: 压缩后的摘要文本
  - key_info: 关键信息JSON(decisions/events/npcs/items/locations)
  - token_count: Token数量
  - compression_ratio: 压缩比率
  - scene_id: 关联场景ID(可选)
  - quest_id: 关联任务ID(可选)
  - created_at: 创建时间
  - updated_at: 更新时间

#### Scenario: 加载存档时的记忆恢复
- **WHEN** 玩家加载存档
- **THEN** 系统从save_snapshots表读取最近的快照
- **AND** 直接恢复context_state和memory_state
- **AND** 从dialogues表加载快照时间点之后的新对话(如果有)
- **AND** 组装成完整的上下文发送给LLM

#### Scenario: 快照优先策略
- **WHEN** 存档快照存在
- **THEN** 优先使用快照恢复上下文(快速加载)
- **AND** 避免每次加载时重新压缩(节省Token和时间)

### Requirement: 存档快照机制
系统 SHALL 支持存档时保存完整的上下文快照。

#### Scenario: 存档快照表结构
- **WHEN** 查看存档快照表(save_snapshots)结构
- **THEN** 应包含以下字段：
  - id: 主键
  - save_id: 关联存档ID
  - snapshot_type: 快照类型(auto/manual/checkpoint)
  - context_state: 完整上下文状态JSON
  - memory_state: 记忆状态JSON(各层级的最后状态)
  - agent_states: 智能体状态JSON
  - created_at: 创建时间

#### Scenario: 存档时创建快照
- **WHEN** 玩家保存游戏
- **THEN** 系统执行以下操作：
  - 触发全量上下文压缩
  - 将压缩结果存入memories表
  - 创建存档快照记录
  - 更新存档元数据

### Requirement: 对话表优化(支持高效加载)
系统 SHALL 优化对话表设计以支持高效的存档加载。

#### Scenario: 对话索引优化
- **WHEN** 加载存档时查询对话
- **THEN** 支持以下高效查询：
  - 按save_id + session_id查询最近对话
  - 按importance筛选重要对话
  - 按timestamp范围查询
- **AND** 建立复合索引(save_id, session_id, timestamp)
- **AND** 建立索引(save_id, importance)

### Requirement: 数据库服务层
系统 SHALL 提供数据库操作服务层。

#### Scenario: 数据库服务
- **WHEN** 需要操作数据库时
- **THEN** 通过DatabaseService类进行操作
- **AND** 支持CRUD基本操作
- **AND** 支持事务处理
- **AND** 支持JSON字段查询

### Requirement: 数据库迁移
系统 SHALL 支持数据库版本迁移。

#### Scenario: 版本升级
- **WHEN** 数据库结构需要变更时
- **THEN** 通过迁移脚本自动更新
- **AND** 保留现有数据
