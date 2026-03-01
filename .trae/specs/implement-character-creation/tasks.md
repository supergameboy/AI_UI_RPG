# Tasks

## Task 1: 扩展类型定义和数据结构
- [x] SubTask 1.1: 扩展 Character 类型定义，添加 appearance、imagePrompt、backstory 字段
- [x] SubTask 1.2: 创建 CharacterCreationState 类型，定义角色创建流程状态
- [x] SubTask 1.3: 创建 GeneratedRaceOption、GeneratedClassOption、GeneratedBackgroundOption 类型
- [x] SubTask 1.4: 更新 GameSettings 类型，添加 aiRandomGeneration 和 generateImagePrompt 开关

## Task 2: 实现后端角色生成服务
- [x] SubTask 2.1: 创建 CharacterGenerationService，实现 AI 生成种族选项
- [x] SubTask 2.2: 实现 AI 生成职业选项（根据种族）
- [x] SubTask 2.3: 实现 AI 生成背景选项（根据种族和职业）
- [x] SubTask 2.4: 实现属性自动计算（基础值 + 加成）
- [x] SubTask 2.5: 实现外观描述和文生图提示词生成
- [x] SubTask 2.6: 创建角色生成相关 API 路由

## Task 3: 实现前端角色创建状态管理
- [x] SubTask 3.1: 创建 characterCreationStore，管理创建流程状态
- [x] SubTask 3.2: 实现步骤导航逻辑（下一步、返回、重新生成）
- [x] SubTask 3.3: 实现角色数据临时存储
- [x] SubTask 3.4: 实现与后端 API 的交互

## Task 4: 实现角色创建 UI 组件
- [x] SubTask 4.1: 创建 CharacterCreation 主容器组件
- [x] SubTask 4.2: 创建 NameInputStep 组件（名称输入步骤）
- [x] SubTask 4.3: 创建 RaceSelectionStep 组件（种族选择步骤）
- [x] SubTask 4.4: 创建 ClassSelectionStep 组件（职业选择步骤）
- [x] SubTask 4.5: 创建 BackgroundSelectionStep 组件（背景选择步骤）
- [x] SubTask 4.6: 创建 CharacterConfirmStep 组件（角色确认步骤）
- [x] SubTask 4.7: 创建 OptionCard 组件（选项卡片，支持预设和AI生成）
- [x] SubTask 4.8: 创建 CharacterCard 组件（角色卡预览）
- [x] SubTask 4.9: 实现选项分组显示（预设选项 + AI生成选项）

## Task 5: 集成到游戏主流程
- [x] SubTask 5.1: 修改主菜单"开始新游戏"按钮逻辑
- [x] SubTask 5.2: 实现模板选择后跳转到角色创建
- [x] SubTask 5.3: 实现角色创建完成后初始化游戏状态
- [x] SubTask 5.4: 实现创建完成后跳转到游戏界面

## Task 6: 添加设置项
- [x] SubTask 6.1: 在设置界面添加"AI随机生成角色选项"开关
- [x] SubTask 6.2: 在设置界面添加"生成文生图提示词"开关
- [x] SubTask 6.3: 实现设置的保存和读取

# Task Dependencies

- [Task 2] depends on [Task 1]
- [Task 3] depends on [Task 1]
- [Task 4] depends on [Task 3]
- [Task 5] depends on [Task 4]
- [Task 6] depends on [Task 1]

# Parallelizable Work

- Task 1 完成后，Task 2 和 Task 3 可以并行进行
- Task 4 的各子任务在 Task 3 完成后可以并行开发
