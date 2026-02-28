# Tasks

- [x] Task 1: 创建提示词类型定义
  - [x] SubTask 1.1: 在 shared 包中创建 prompt.ts 类型文件
  - [x] SubTask 1.2: 定义 PromptTemplate 接口
  - [x] SubTask 1.3: 定义 PromptVariable 接口
  - [x] SubTask 1.4: 定义 PromptVersion 接口
  - [x] SubTask 1.5: 定义 PromptTestResult 接口

- [x] Task 2: 创建提示词模板文件
  - [x] SubTask 2.1: 创建 prompts 目录结构
  - [x] SubTask 2.2: 创建 coordinator.md 提示词模板
  - [x] SubTask 2.3: 创建 story_context.md 提示词模板
  - [x] SubTask 2.4: 创建 dialogue.md 提示词模板
  - [x] SubTask 2.5: 创建 quest.md 提示词模板
  - [x] SubTask 2.6: 创建 combat.md 提示词模板
  - [x] SubTask 2.7: 创建 map.md 提示词模板
  - [x] SubTask 2.8: 创建 npc_party.md 提示词模板
  - [x] SubTask 2.9: 创建 numerical.md 提示词模板
  - [x] SubTask 2.10: 创建 inventory.md 提示词模板
  - [x] SubTask 2.11: 创建 skill.md 提示词模板
  - [x] SubTask 2.12: 创建 ui.md 提示词模板
  - [x] SubTask 2.13: 创建 event.md 提示词模板

- [x] Task 3: 创建提示词数据库表
  - [x] SubTask 3.1: 在 schema.sql 中添加 prompt_templates 表
  - [x] SubTask 3.2: 添加 prompt_versions 表
  - [x] SubTask 3.3: 添加 prompt_test_results 表

- [x] Task 4: 实现 PromptRepository
  - [x] SubTask 4.1: 创建 PromptRepository.ts
  - [x] SubTask 4.2: 实现 CRUD 操作
  - [x] SubTask 4.3: 实现版本管理方法
  - [x] SubTask 4.4: 实现测试结果存储方法

- [x] Task 5: 实现 PromptService
  - [x] SubTask 5.1: 创建 PromptService.ts
  - [x] SubTask 5.2: 实现模板加载功能
  - [x] SubTask 5.3: 实现变量注入功能
  - [x] SubTask 5.4: 实现上下文构建功能
  - [x] SubTask 5.5: 实现版本管理功能
  - [x] SubTask 5.6: 实现测试执行功能

- [x] Task 6: 更新 AgentConfigService
  - [x] SubTask 6.1: 集成 PromptService
  - [x] SubTask 6.2: 修改 getDefaultSystemPrompt 方法
  - [x] SubTask 6.3: 添加提示词更新接口

- [x] Task 7: 更新智能体基类
  - [x] SubTask 7.1: 修改 AgentBase 的 systemPrompt 处理
  - [x] SubTask 7.2: 添加动态提示词加载支持
  - [x] SubTask 7.3: 添加上下文注入支持

- [x] Task 8: 创建提示词管理API
  - [x] SubTask 8.1: 创建 promptRoutes.ts
  - [x] SubTask 8.2: 实现获取提示词列表接口
  - [x] SubTask 8.3: 实现获取单个提示词接口
  - [x] SubTask 8.4: 实现更新提示词接口
  - [x] SubTask 8.5: 实现版本管理接口
  - [x] SubTask 8.6: 实现测试接口

- [x] Task 9: 创建前端提示词管理界面
  - [x] SubTask 9.1: 创建 PromptEditor 组件
  - [x] SubTask 9.2: 创建 PromptVariables 预览组件
  - [x] SubTask 9.3: 创建 PromptTest 组件
  - [x] SubTask 9.4: 创建 PromptVersionHistory 组件
  - [x] SubTask 9.5: 集成到开发者面板

- [x] Task 10: 编写测试用例
  - [x] SubTask 10.1: 编写 PromptService 单元测试
  - [x] SubTask 10.2: 编写变量注入测试
  - [x] SubTask 10.3: 编写版本管理测试

# Task Dependencies

- [Task 3] depends on [Task 1]
- [Task 4] depends on [Task 1, Task 3]
- [Task 5] depends on [Task 1, Task 4]
- [Task 6] depends on [Task 5]
- [Task 7] depends on [Task 5]
- [Task 8] depends on [Task 5]
- [Task 9] depends on [Task 8]
- [Task 10] depends on [Task 5, Task 6, Task 7]
