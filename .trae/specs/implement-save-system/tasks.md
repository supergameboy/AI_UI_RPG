# Tasks

- [x] Task 1: 创建存档服务层（前端）
  - [x] SubTask 1.1: 创建 `packages/frontend/src/services/saveService.ts`，封装存档API调用
  - [x] SubTask 1.2: 实现获取存档列表（支持分页、模板筛选）
  - [x] SubTask 1.3: 实现创建、更新、删除存档方法
  - [x] SubTask 1.4: 实现存档导入/导出方法（JSON格式）
  - [x] SubTask 1.5: 添加错误处理和加载状态管理

- [x] Task 2: 扩展后端存档API
  - [x] SubTask 2.1: 添加按模板筛选存档的API端点 `GET /api/saves?template_id=xxx`
  - [x] SubTask 2.2: 添加分页支持 `GET /api/saves?page=1&limit=10`
  - [x] SubTask 2.3: 添加存档统计信息API `GET /api/saves/stats`
  - [x] SubTask 2.4: 完善存档数据包含完整游戏状态快照

- [x] Task 3: 创建上下文管理服务（后端）
  - [x] SubTask 3.1: 创建 `packages/backend/src/services/ContextService.ts`
  - [x] SubTask 3.2: 实现4层上下文压缩机制（Layer 1-4）
  - [x] SubTask 3.3: 实现保存时上下文压缩并持久化到memories表
  - [x] SubTask 3.4: 实现加载时上下文恢复功能
  - [x] SubTask 3.5: 实现智能体状态保存与恢复
  - [x] SubTask 3.6: 添加上下文压缩触发条件（对话轮数、Token阈值、场景切换等）

- [x] Task 4: 创建存档管理组件
  - [x] SubTask 4.1: 创建 `SaveManager.tsx` 主组件
  - [x] SubTask 4.2: 创建 `SaveList.tsx` 存档列表组件（支持分页）
  - [x] SubTask 4.3: 创建 `SaveCard.tsx` 存档卡片组件（显示存档信息）
  - [x] SubTask 4.4: 创建 `SaveDetail.tsx` 存档详情预览组件
  - [x] SubTask 4.5: 创建 `SaveForm.tsx` 存档命名/编辑表单组件

- [x] Task 5: 实现存档操作功能
  - [x] SubTask 5.1: 实现保存游戏功能（游戏中保存按钮）
  - [x] SubTask 5.2: 实现加载存档功能（带确认，含上下文恢复）
  - [x] SubTask 5.3: 实现删除存档功能（带确认对话框）
  - [x] SubTask 5.4: 实现存档导入功能（文件选择+验证+上下文恢复）
  - [x] SubTask 5.5: 实现存档导出功能（JSON下载，含上下文状态）

- [x] Task 6: 实现自动存档机制
  - [x] SubTask 6.1: 在 `gameStore.ts` 中添加自动存档触发器
  - [x] SubTask 6.2: 实现任务完成时自动存档
  - [x] SubTask 6.3: 实现关键选择后自动存档
  - [x] SubTask 6.4: 添加自动存档通知提示
  - [x] SubTask 6.5: 确保自动存档创建为'auto'类型快照

- [x] Task 7: 更新主菜单和游戏界面
  - [x] SubTask 7.1: 更新 `MainMenu.tsx` 集成新的存档管理组件
  - [x] SubTask 7.2: 在游戏界面Header添加保存按钮
  - [x] SubTask 7.3: 添加存档管理入口（TabBar或快捷键）

- [x] Task 8: 添加样式和交互优化
  - [x] SubTask 8.1: 创建存档管理相关CSS模块
  - [x] SubTask 8.2: 添加存档卡片悬停效果
  - [x] SubTask 8.3: 添加加载和保存动画
  - [x] SubTask 8.4: 优化移动端适配

# Task Dependencies
- [Task 3] depends on [Task 2]
- [Task 4] depends on [Task 1]
- [Task 5] depends on [Task 1, Task 3, Task 4]
- [Task 6] depends on [Task 1, Task 3]
- [Task 7] depends on [Task 4, Task 5]
- [Task 8] depends on [Task 4, Task 7]
