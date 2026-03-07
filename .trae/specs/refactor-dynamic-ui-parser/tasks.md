# Tasks

## Batch 1: 核心解析器重构

- [x] Task 1: 创建新的解析器函数 `parseDynamicUIComponents`
  - [x] SubTask 1.1: 定义 `ComponentBlock` 类型
  - [x] SubTask 1.2: 实现递归下降解析器
  - [x] SubTask 1.3: 正确处理嵌套组件
  - [x] SubTask 1.4: 返回结构化的组件块数组

## Batch 2: MarkdownRenderer 重构

- [x] Task 2: 重构 MarkdownRenderer 组件
  - [x] SubTask 2.1: 移除 `rehypeRaw` 依赖
  - [x] SubTask 2.2: 使用新的解析器
  - [x] SubTask 2.3: 实现组件块渲染逻辑
  - [x] SubTask 2.4: 修复组件引用（SystemNotifyComponent）

## Batch 3: 组件接口统一

- [x] Task 3: 统一所有动态 UI 组件接口
  - [x] SubTask 3.1: OptionsComponent
  - [x] SubTask 3.2: TabsComponent
  - [x] SubTask 3.3: SystemNotifyComponent
  - [x] SubTask 3.4: ConditionalComponent
  - [x] SubTask 3.5: EnhancementComponent
  - [x] SubTask 3.6: WarehouseComponent

## Batch 4: 验证测试

- [x] Task 4: 运行类型检查验证修复
  - [x] SubTask 4.1: 运行 frontend 类型检查
  - [x] SubTask 4.2: 修复任何类型错误

# Task Dependencies
- [Task 2] depends on [Task 1]
- [Task 3] depends on [Task 2]
- [Task 4] depends on [Task 3]
