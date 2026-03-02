# Tasks

## Task 1: 定义初始化类型
- [ ] SubTask 1.1: 在 `packages/shared/src/types/initialization.ts` 中定义初始化相关类型
  - InitializationStep 枚举
  - InitializationStatus 接口
  - InitializationRequest 接口
  - InitializationResponse 接口
  - InitialDataConfig 接口

## Task 2: 创建初始化配置数据
- [ ] SubTask 2.1: 在模板系统中添加初始数据配置
  - 初始技能配置（按职业）
  - 初始物品配置（按背景）
  - 初始装备配置（按职业）
  - 初始金币配置（按背景）
- [ ] SubTask 2.2: 创建默认初始数据配置文件

## Task 3: 实现后端初始化服务
- [ ] SubTask 3.1: 创建 `packages/backend/src/services/InitializationService.ts`
  - initializeNumerical 方法
  - initializeSkills 方法
  - initializeInventory 方法
  - initializeEquipment 方法
  - initializeQuests 方法
  - initializeMap 方法
  - initializeNPCs 方法
  - runFullInitialization 方法（按顺序执行所有步骤）
- [ ] SubTask 3.2: 创建 `packages/backend/src/routes/initializationRoutes.ts`
  - POST /api/initialization/start - 开始初始化
  - GET /api/initialization/status - 获取初始化状态
- [ ] SubTask 3.3: 在后端 index.ts 中注册路由

## Task 4: 实现前端初始化逻辑
- [ ] SubTask 4.1: 创建 `packages/frontend/src/services/initializationService.ts`
  - startInitialization 方法
  - getInitializationStatus 方法
- [ ] SubTask 4.2: 修改 `gameStore.ts`
  - 添加初始化状态管理
  - 添加 startInitialization action
  - 修改 onCharacterCreated 调用初始化流程
- [ ] SubTask 4.3: 创建 `InitializationProgress.tsx` 组件
  - 显示初始化进度条
  - 显示当前步骤
  - 显示错误信息和重试按钮

## Task 5: 集成初始化流程
- [ ] SubTask 5.1: 修改角色创建确认流程
  - 角色确认后调用初始化
  - 显示初始化进度
  - 初始化完成后生成初始场景
- [ ] SubTask 5.2: 添加初始化失败处理
  - 错误提示
  - 重试机制

## Task 6: 类型检查与测试
- [ ] SubTask 6.1: 运行前端类型检查
- [ ] SubTask 6.2: 运行后端类型检查
- [ ] SubTask 6.3: 测试完整初始化流程

# Task Dependencies

- Task 2 依赖 Task 1（需要类型定义）
- Task 3 依赖 Task 1 和 Task 2（需要类型和配置数据）
- Task 4 依赖 Task 3（需要后端服务）
- Task 5 依赖 Task 4（需要前端逻辑）
- Task 6 依赖所有前置任务
