# Tasks

- [x] Task 1: 扩展类型定义
  - [x] SubTask 1.1: 在 `template.ts` 中添加 `AIBehavior` 接口定义
  - [x] SubTask 1.2: 在 `template.ts` 中添加 `UITheme` 接口定义
  - [x] SubTask 1.3: 在 `template.ts` 中添加 `UILayout` 接口定义
  - [x] SubTask 1.4: 在 `template.ts` 中添加 `SpecialRules` 接口定义
  - [x] SubTask 1.5: 在 `template.ts` 中添加 `NumericalComplexity` 类型定义
  - [x] SubTask 1.6: 更新 `StoryTemplate` 接口添加新字段
  - [x] SubTask 1.7: 更新 `AIConstraints` 接口添加 `aiBehavior` 字段
  - [x] SubTask 1.8: 重新构建 shared 包

- [x] Task 2: 更新前端编辑器组件
  - [x] SubTask 2.1: 创建 `UIThemeEditor.tsx` 组件
  - [x] SubTask 2.2: 创建 `UILayoutEditor.tsx` 组件
  - [x] SubTask 2.3: 更新 `AIConstraintsEditor.tsx` 添加 AI 行为配置
  - [x] SubTask 2.4: 更新 `RulesEditor.tsx` 添加特殊规则和数值复杂度配置
  - [x] SubTask 2.5: 更新 `TemplateEditor.tsx` 添加新编辑器导航项
  - [x] SubTask 2.6: 更新编辑器导出索引

- [x] Task 3: 更新后端 AI 生成服务
  - [x] SubTask 3.1: 更新 `AIGenerateService.ts` 使用 `aiBehavior` 配置优化提示词
  - [x] SubTask 3.2: 根据 `numericalComplexity` 调整生成内容的数值复杂度

- [x] Task 4: 更新默认模板数据
  - [x] SubTask 4.1: 更新 `templateStore.ts` 添加新字段的默认值

- [x] Task 5: 运行类型检查和测试
  - [x] SubTask 5.1: 运行 `pnpm run typecheck` 确保无类型错误
  - [x] SubTask 5.2: 验证前端编辑器功能正常

# Task Dependencies
- [Task 2] depends on [Task 1]
- [Task 3] depends on [Task 1]
- [Task 4] depends on [Task 1]
- [Task 5] depends on [Task 2, Task 3, Task 4]
