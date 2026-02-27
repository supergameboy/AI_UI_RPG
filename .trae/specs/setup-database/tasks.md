# Tasks

- [x] Task 1: 创建数据库配置和连接服务
  - [x] SubTask 1.1: 创建DatabaseService类
  - [x] SubTask 1.2: 配置数据库文件路径(支持用户数据目录)
  - [x] SubTask 1.3: 实现数据库连接逻辑
  - [x] SubTask 1.4: 添加错误处理和日志

- [x] Task 2: 创建核心数据表结构
  - [x] SubTask 2.1: 创建saves表(存档表) - 支持多游戏模式
  - [x] SubTask 2.2: 创建characters表(角色表) - 包含custom_data字段
  - [x] SubTask 2.3: 创建quests表(任务表)
  - [x] SubTask 2.4: 创建maps表(地图表)
  - [x] SubTask 2.5: 创建inventory表(背包表) - 完整物品属性
  - [x] SubTask 2.6: 创建skills表(技能表)
  - [x] SubTask 2.7: 创建npcs表(NPC表) - 支持好感度系统
  - [x] SubTask 2.8: 创建dialogues表(对话表) - 支持会话分组和索引优化
  - [x] SubTask 2.9: 创建templates表(模板表) - 支持多游戏模式
  - [x] SubTask 2.10: 创建settings表(设置表)

- [x] Task 3: 创建游戏模式专用表
  - [x] SubTask 3.1: 创建clues表(线索表) - 文字冒险/克苏鲁模式专用
  - [x] SubTask 3.2: 创建endings表(结局记录表) - 视觉小说模式专用

- [x] Task 4: 创建上下文管理相关表
  - [x] SubTask 4.1: 创建memories表(记忆表) - 4层上下文压缩核心
  - [x] SubTask 4.2: 创建save_snapshots表(存档快照表) - 完整上下文快照
  - [x] SubTask 4.3: 为dialogues表创建索引(save_id, session_id, timestamp)
  - [x] SubTask 4.4: 为dialogues表创建索引(save_id, importance)

- [x] Task 5: 创建数据访问层(Repository)
  - [x] SubTask 5.1: 创建BaseRepository(通用CRUD方法)
  - [x] SubTask 5.2: 创建SaveRepository(含快照操作)
  - [x] SubTask 5.3: 创建CharacterRepository
  - [x] SubTask 5.4: 创建QuestRepository
  - [x] SubTask 5.5: 创建InventoryRepository
  - [x] SubTask 5.6: 创建NPCRepository(含好感度操作)
  - [x] SubTask 5.7: 创建DialogueRepository(含记忆加载)
  - [x] SubTask 5.8: 创建MemoryRepository(4层记忆管理)

- [x] Task 6: 创建数据库初始化脚本
  - [x] SubTask 6.1: 创建schema.sql文件
  - [x] SubTask 6.2: 创建初始化函数
  - [x] SubTask 6.3: 添加种子数据(默认模板、默认设置)
  - [x] SubTask 6.4: 创建内置模板数据(中世纪奇幻/现代恋爱/克苏鲁/赛博朋克)

- [x] Task 7: 创建数据库迁移机制
  - [x] SubTask 7.1: 创建migrations目录结构
  - [x] SubTask 7.2: 创建版本记录表(db_version)
  - [x] SubTask 7.3: 实现迁移执行逻辑

- [x] Task 8: 添加API端点测试数据库
  - [x] SubTask 8.1: 添加数据库状态检查端点(/api/database/status)
  - [x] SubTask 8.2: 添加数据库初始化端点
  - [x] SubTask 8.3: 测试存档快照和记忆加载流程

# Task Dependencies
- [Task 2] depends on [Task 1]
- [Task 3] depends on [Task 1]
- [Task 4] depends on [Task 2]
- [Task 5] depends on [Task 2, Task 3, Task 4]
- [Task 6] depends on [Task 2, Task 3, Task 4]
- [Task 7] depends on [Task 2, Task 3, Task 4]
- [Task 8] depends on [Task 5, Task 6]
