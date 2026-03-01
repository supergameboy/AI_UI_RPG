# Tasks

- [x] Task 1: 扩展后端 AI 生成服务
  - [x] SubTask 1.1: 在 `AIGenerateService.ts` 中添加 `generateRace()` 方法
  - [x] SubTask 1.2: 在 `AIGenerateService.ts` 中添加 `generateClass()` 方法
  - [x] SubTask 1.3: 在 `AIGenerateService.ts` 中添加 `generateBackground()` 方法
  - [x] SubTask 1.4: 在 `AIGenerateService.ts` 中添加 `generateWorldSetting()` 方法
  - [x] SubTask 1.5: 在 `templateRoutes.ts` 中添加生成路由

- [x] Task 2: 创建属性编辑器
  - [x] SubTask 2.1: 创建 `AttributeEditor.tsx` 组件
  - [x] SubTask 2.2: 更新 `CharacterCreationRules` 类型确保 `attributes` 字段正确
  - [x] SubTask 2.3: 更新 `TemplateEditor.tsx` 添加属性编辑器导航项
  - [x] SubTask 2.4: 更新编辑器导出索引

- [x] Task 3: 更新种族编辑器添加 AI 生成
  - [x] SubTask 3.1: 更新 `RaceEditor.tsx` 添加 AI 生成按钮和对话框
  - [x] SubTask 3.2: 连接后端 AI 生成 API

- [x] Task 4: 更新职业编辑器添加 AI 生成
  - [x] SubTask 4.1: 更新 `ClassEditor.tsx` 添加 AI 生成按钮和对话框
  - [x] SubTask 4.2: 连接后端 AI 生成 API

- [x] Task 5: 更新背景编辑器添加 AI 生成
  - [x] SubTask 5.1: 更新 `BackgroundEditor.tsx` 添加 AI 生成按钮和对话框
  - [x] SubTask 5.2: 连接后端 AI 生成 API

- [x] Task 6: 更新世界观编辑器添加 AI 生成
  - [x] SubTask 6.1: 更新 `WorldSettingEditor.tsx` 添加 AI 生成按钮和对话框
  - [x] SubTask 6.2: 连接后端 AI 生成 API

- [x] Task 7: 创建预览测试功能
  - [x] SubTask 7.1: 创建 `TemplatePreview.tsx` 组件
  - [x] SubTask 7.2: 实现角色创建流程预览
  - [x] SubTask 7.3: 实现初始场景预览
  - [x] SubTask 7.4: 更新 `TemplateEditor.tsx` 添加预览按钮

- [x] Task 8: 更新前端 templateService
  - [x] SubTask 8.1: 添加 `generateRace()` API 调用方法
  - [x] SubTask 8.2: 添加 `generateClass()` API 调用方法
  - [x] SubTask 8.3: 添加 `generateBackground()` API 调用方法
  - [x] SubTask 8.4: 添加 `generateWorldSetting()` API 调用方法

- [x] Task 9: 更新默认模板数据
  - [x] SubTask 9.1: 更新 `templateStore.ts` 添加 `attributes` 默认值

- [x] Task 10: 运行类型检查和测试
  - [x] SubTask 10.1: 运行 `pnpm run typecheck` 确保无类型错误
  - [x] SubTask 10.2: 验证所有新功能正常工作

# Task Dependencies
- [Task 2] depends on [Task 1]
- [Task 3] depends on [Task 1, Task 8]
- [Task 4] depends on [Task 1, Task 8]
- [Task 5] depends on [Task 1, Task 8]
- [Task 6] depends on [Task 1, Task 8]
- [Task 7] depends on [Task 2, Task 3, Task 4, Task 5, Task 6]
- [Task 10] depends on [Task 2, Task 3, Task 4, Task 5, Task 6, Task 7, Task 8, Task 9]
