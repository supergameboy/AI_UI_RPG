# 存档系统 Spec

## Why
存档系统是RPG游戏的核心功能，需要支持玩家保存/加载游戏进度、自动存档、存档导入导出等功能。当前后端已有基础的存档API，但前端缺少完整的存档管理界面和与后端的完整集成。同时，存档系统需要与上下文管理机制紧密配合，确保AI对话上下文的正确保存和恢复。

## What Changes
- 创建完整的存档管理界面（SaveManager组件）
- 实现存档列表展示（无限存档、分页、模板筛选）
- 实现存档详情预览和加载功能
- 实现存档创建和保存功能
- 实现存档删除功能（带确认对话框）
- 实现存档导入/导出功能（JSON格式）
- 实现自动存档机制（任务完成时、关键选择后）
- **实现上下文状态的保存与恢复**
- 完善前后端API集成

## Impact
- Affected specs: 游戏状态管理、UI组件、上下文管理
- Affected code: 
  - `packages/frontend/src/stores/gameStore.ts`
  - `packages/frontend/src/components/menu/MainMenu.tsx`
  - `packages/backend/src/index.ts` (API扩展)
  - `packages/backend/src/models/SaveRepository.ts`
  - `packages/backend/src/services/` (新增上下文管理服务)

## ADDED Requirements

### Requirement: 存档管理界面
系统应提供完整的存档管理界面，支持创建、加载、删除存档。

#### Scenario: 查看存档列表
- **WHEN** 玩家点击"继续游戏"或进入存档管理界面
- **THEN** 显示所有存档列表，支持分页浏览和按模板筛选

#### Scenario: 创建新存档
- **WHEN** 玩家在游戏中选择保存
- **THEN** 弹出存档命名对话框，保存当前游戏状态

#### Scenario: 加载存档
- **WHEN** 玩家选择一个存档并点击加载
- **THEN** 显示存档详情预览，确认后恢复游戏状态

#### Scenario: 删除存档
- **WHEN** 玩家选择删除存档
- **THEN** 显示确认对话框，确认后删除存档

### Requirement: 存档数据结构
存档应包含完整的游戏状态快照。

#### Scenario: 存档内容完整性
- **WHEN** 创建存档时
- **THEN** 存档包含角色数据、任务进度、地图状态、背包物品、NPC关系、故事进度

#### Scenario: 存档元数据
- **WHEN** 显示存档列表时
- **THEN** 显示存档名称、创建时间、游戏时长、当前章节、位置、等级、模板信息

### Requirement: 上下文状态保存与恢复
存档系统应与4层上下文压缩机制配合，确保AI对话上下文的正确保存和恢复。

#### Scenario: 保存时上下文压缩
- **WHEN** 创建存档时
- **THEN** 执行全量上下文压缩，将当前对话历史压缩为摘要，保存到memories表

#### Scenario: 保存上下文层级数据
- **WHEN** 创建存档时
- **THEN** 保存4层记忆状态：
  - Layer 1: 实时上下文（最近5-10轮完整对话）
  - Layer 2: 短期记忆（最近20-50轮摘要）
  - Layer 3: 中期记忆（最近100-200轮高度压缩摘要）
  - Layer 4: 长期记忆（世界状态快照、角色成长记录）

#### Scenario: 加载时上下文恢复
- **WHEN** 加载存档时
- **THEN** 从save_snapshots表恢复上下文状态，重建AI对话上下文

#### Scenario: 智能体状态恢复
- **WHEN** 加载存档时
- **THEN** 恢复各智能体的记忆状态，确保AI能继续之前的剧情逻辑

### Requirement: 自动存档
系统应在关键时机自动保存游戏进度。

#### Scenario: 任务完成时自动存档
- **WHEN** 玩家完成任务
- **THEN** 系统自动创建存档快照，并压缩任务相关对话

#### Scenario: 关键选择后自动存档
- **WHEN** 玩家做出影响剧情的关键选择
- **THEN** 系统自动创建存档快照

#### Scenario: 自动存档与手动存档分离
- **WHEN** 自动存档触发时
- **THEN** 创建标记为'auto'类型的快照，不覆盖手动存档

### Requirement: 存档导入导出
系统应支持存档的导入和导出功能。

#### Scenario: 导出存档
- **WHEN** 玩家选择导出存档
- **THEN** 将存档数据（含上下文状态）导出为JSON文件下载

#### Scenario: 导入存档
- **WHEN** 玩家选择导入存档文件
- **THEN** 解析JSON文件并验证格式，成功后添加到存档列表并恢复上下文状态

### Requirement: 存档筛选和搜索
系统应支持存档的筛选和搜索功能。

#### Scenario: 按模板筛选
- **WHEN** 玩家选择特定游戏模板
- **THEN** 只显示该模板的存档

#### Scenario: 分页浏览
- **WHEN** 存档数量超过每页显示数量
- **THEN** 支持分页浏览，每页显示10个存档
