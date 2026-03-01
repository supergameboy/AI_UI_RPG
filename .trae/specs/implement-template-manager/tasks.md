# Tasks

- [x] Task 1: 扩展 gameStore 添加模板管理屏幕
  - [x] SubTask 1.1: 在 GameScreen 类型中添加 'template-manager'
  - [x] SubTask 1.2: 添加 openTemplateManager action
  - [x] SubTask 1.3: 在 App.tsx 中添加模板管理屏幕的路由

- [x] Task 2: 在主菜单添加模板管理入口
  - [x] SubTask 2.1: 在 MainMenu.tsx 添加「模板管理」按钮
  - [x] SubTask 2.2: 点击按钮调用 openTemplateManager

- [x] Task 3: 扩展 templateStore 添加编辑功能
  - [x] SubTask 3.1: 添加 editingTemplate 和 isEditing 状态
  - [x] SubTask 3.2: 添加 createTemplate action
  - [x] SubTask 3.3: 添加 updateTemplate action
  - [x] SubTask 3.4: 添加 duplicateTemplate action
  - [x] SubTask 3.5: 添加 deleteTemplate action
  - [x] SubTask 3.6: 添加 setEditingTemplate 和 clearEditingTemplate actions

- [x] Task 4: 扩展 templateService 添加 API 方法
  - [x] SubTask 4.1: 确保 createTemplate 方法正确实现
  - [x] SubTask 4.2: 确保 updateTemplate 方法正确实现
  - [x] SubTask 4.3: 确保 deleteTemplate 方法正确实现

- [x] Task 5: 创建模板管理界面组件
  - [x] SubTask 5.1: 创建 TemplateManager.tsx 主组件
  - [x] SubTask 5.2: 实现模板列表展示（卡片布局）
  - [x] SubTask 5.3: 区分内置模板和自定义模板（显示标记）
  - [x] SubTask 5.4: 实现新建模板按钮
  - [x] SubTask 5.5: 实现编辑/查看按钮（根据模板类型）
  - [x] SubTask 5.6: 实现复制模板功能
  - [x] SubTask 5.7: 实现删除模板功能（仅自定义模板）
  - [x] SubTask 5.8: 创建 TemplateManager.module.css 样式文件

- [x] Task 6: 创建模板编辑器主组件
  - [x] SubTask 6.1: 创建 TemplateEditor.tsx 主组件
  - [x] SubTask 6.2: 实现左侧导航（模块切换）
  - [x] SubTask 6.3: 实现保存/取消按钮
  - [x] SubTask 6.4: 实现只读模式（内置模板查看）
  - [x] SubTask 6.5: 创建 TemplateEditor.module.css 样式文件

- [x] Task 7: 创建基础信息编辑器
  - [x] SubTask 7.1: 创建 BasicInfoEditor.tsx
  - [x] SubTask 7.2: 实现名称、描述、版本、作者输入
  - [x] SubTask 7.3: 实现标签管理（添加/删除标签）
  - [x] SubTask 7.4: 实现游戏模式选择下拉框

- [x] Task 8: 创建世界观构建器
  - [x] SubTask 8.1: 创建 WorldSettingEditor.tsx
  - [x] SubTask 8.2: 实现世界名称、描述、时代背景输入
  - [x] SubTask 8.3: 实现魔法系统（可选）输入
  - [x] SubTask 8.4: 实现科技水平输入
  - [x] SubTask 8.5: 实现自定义字段管理（键值对）

- [x] Task 9: 创建种族编辑器
  - [x] SubTask 9.1: 创建 RaceEditor.tsx
  - [x] SubTask 9.2: 实现种族列表展示
  - [x] SubTask 9.3: 实现添加/编辑种族表单
  - [x] SubTask 9.4: 实现属性加成/惩罚编辑
  - [x] SubTask 9.5: 实现特殊能力编辑
  - [x] SubTask 9.6: 实现可用职业选择

- [x] Task 10: 创建职业编辑器
  - [x] SubTask 10.1: 创建 ClassEditor.tsx
  - [x] SubTask 10.2: 实现职业列表展示
  - [x] SubTask 10.3: 实现添加/编辑职业表单
  - [x] SubTask 10.4: 实现主属性选择
  - [x] SubTask 10.5: 实现技能熟练编辑
  - [x] SubTask 10.6: 实现初始装备编辑

- [x] Task 11: 创建背景编辑器
  - [x] SubTask 11.1: 创建 BackgroundEditor.tsx
  - [x] SubTask 11.2: 实现背景列表展示
  - [x] SubTask 11.3: 实现添加/编辑背景表单
  - [x] SubTask 11.4: 实现技能熟练、语言、装备编辑
  - [x] SubTask 11.5: 实现特性描述编辑

- [x] Task 12: 创建规则配置器
  - [x] SubTask 12.1: 创建 RulesEditor.tsx
  - [x] SubTask 12.2: 创建战斗规则配置子组件
  - [x] SubTask 12.3: 创建技能规则配置子组件
  - [x] SubTask 12.4: 创建背包规则配置子组件
  - [x] SubTask 12.5: 创建任务规则配置子组件

- [x] Task 13: 创建AI约束设置
  - [x] SubTask 13.1: 创建 AIConstraintsEditor.tsx
  - [x] SubTask 13.2: 实现AI基调选择
  - [x] SubTask 13.3: 实现内容分级选择
  - [x] SubTask 13.4: 实现禁止话题列表管理
  - [x] SubTask 13.5: 实现必需元素列表管理

- [x] Task 14: 创建初始场景设计器
  - [x] SubTask 14.1: 创建 StartingSceneEditor.tsx
  - [x] SubTask 14.2: 实现起始地点、场景描述输入
  - [x] SubTask 14.3: 实现初始NPC列表管理
  - [x] SubTask 14.4: 实现初始物品列表管理
  - [x] SubTask 14.5: 实现初始任务列表管理

- [x] Task 15: 创建模板编辑器样式
  - [x] SubTask 15.1: 创建 editors 目录下的共享样式
  - [x] SubTask 15.2: 确保暗色/亮色主题兼容

- [x] Task 16: 类型检查和测试
  - [x] SubTask 16.1: 运行前端 typecheck
  - [x] SubTask 16.2: 运行后端 typecheck
  - [x] SubTask 16.3: 测试模板创建流程
  - [x] SubTask 16.4: 测试模板编辑流程
  - [x] SubTask 16.5: 测试模板复制流程
  - [x] SubTask 16.6: 测试内置模板只读保护

# Task Dependencies

- [Task 2] depends on [Task 1]
- [Task 3] depends on [Task 4]
- [Task 5] depends on [Task 1, Task 3]
- [Task 6] depends on [Task 3]
- [Task 7] depends on [Task 6]
- [Task 8] depends on [Task 6]
- [Task 9] depends on [Task 6]
- [Task 10] depends on [Task 6]
- [Task 11] depends on [Task 6]
- [Task 12] depends on [Task 6]
- [Task 13] depends on [Task 6]
- [Task 14] depends on [Task 6]
- [Task 15] depends on [Task 6, Task 7, Task 8, Task 9, Task 10, Task 11, Task 12, Task 13, Task 14]
- [Task 16] depends on [Task 5, Task 6, Task 15]
