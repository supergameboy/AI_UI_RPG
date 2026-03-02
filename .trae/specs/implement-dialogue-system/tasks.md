# Tasks

## Task 1: 定义共享类型
- [x] SubTask 1.1: 在 `packages/shared/src/types/dialogue.ts` 中定义对话相关类型
  - DialogueMessage 接口
  - DialogueOption 接口
  - InitialSceneRequest 接口
  - InitialSceneResponse 接口
  - SendDialogueRequest 接口
  - SendDialogueResponse 接口

## Task 2: 实现后端对话路由
- [x] SubTask 2.1: 创建 `packages/backend/src/routes/dialogueRoutes.ts`
  - POST /api/dialogue/initial - 生成初始场景
  - POST /api/dialogue/send - 发送玩家输入
  - POST /api/dialogue/options - 获取当前选项
- [x] SubTask 2.2: 在后端 index.ts 中注册路由

## Task 3: 实现前端对话服务
- [x] SubTask 3.1: 创建 `packages/frontend/src/services/dialogueService.ts`
  - generateInitialScene 方法
  - sendPlayerInput 方法
  - getDialogueOptions 方法

## Task 4: 重构前端对话组件
- [x] SubTask 4.1: 重构 `StoryDisplay.tsx`
  - 从 gameStore 读取对话历史
  - 区分消息类型渲染
  - 实现自动滚动
- [x] SubTask 4.2: 重构 `QuickOptions.tsx`
  - 从 gameStore 读取当前选项
  - 点击发送选项内容
  - 显示加载状态
- [x] SubTask 4.3: 重构 `ChatInput.tsx`
  - 调用 dialogueService 发送输入
  - 显示发送中状态
  - 禁用空输入发送

## Task 5: 集成初始场景生成
- [x] SubTask 5.1: 修改 `gameStore.ts` 的 onCharacterCreated
  - 角色创建完成后调用 generateInitialScene
  - 将返回内容添加到 messages
  - 设置初始快速选项

## Task 6: 类型检查与测试
- [x] SubTask 6.1: 运行前端类型检查 `cd packages/frontend && npm run typecheck`
- [x] SubTask 6.2: 运行后端类型检查 `cd packages/backend && npm run typecheck`

# Task Dependencies

- Task 2 依赖 Task 1（需要类型定义）
- Task 3 依赖 Task 1（需要类型定义）
- Task 4 依赖 Task 3（需要服务层）
- Task 5 依赖 Task 3 和 Task 4（需要服务和组件）
- Task 6 依赖所有前置任务
