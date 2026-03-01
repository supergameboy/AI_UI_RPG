# Tasks

## Task 1: 修复前端重复请求问题
- [x] SubTask 1.1: 在 characterCreationStore 中添加请求状态锁，防止重复请求
- [x] SubTask 1.2: 在 RaceSelectionStep 中优化 useEffect 依赖，避免不必要的触发
- [x] SubTask 1.3: 添加请求失败后的重试功能

## Task 2: 修复后端 LLM 配置加载
- [x] SubTask 2.1: 在后端启动时从设置文件加载 LLM 配置
- [x] SubTask 2.2: 自动注册已配置的 LLM 适配器
- [x] SubTask 2.3: 添加配置加载日志

## Task 3: 改进错误处理
- [x] SubTask 3.1: 在前端显示友好的错误提示
- [x] SubTask 3.2: 添加"前往设置"按钮引导用户配置 LLM

# Task Dependencies

- [Task 3] depends on [Task 1]
- [Task 2] 独立进行

# Parallelizable Work

- Task 1 和 Task 2 可以并行进行
