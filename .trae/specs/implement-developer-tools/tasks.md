# Tasks

- [x] Task 1: 创建日志服务
  - [x] SubTask 1.1: 创建前端 logService.ts，支持多级别日志、来源标记、过滤功能
  - [x] SubTask 1.2: 创建后端 LogService.ts，支持日志收集和查询API
  - [x] SubTask 1.3: 创建日志类型定义（LogLevel, LogEntry, LogSource）
  - [x] SubTask 1.4: 后端日志文件写入功能（按日期分割）
  - [x] SubTask 1.5: 前端日志导出功能（JSON/文本格式）

- [x] Task 2: 创建开发者状态管理
  - [x] SubTask 2.1: 创建 developerStore.ts，管理面板显示状态、位置、当前Tab
  - [x] SubTask 2.2: 添加请求记录状态（llmRequests数组）
  - [x] SubTask 2.3: 添加智能体消息记录状态（agentMessages数组）
  - [x] SubTask 2.4: 导出 developerStore 到 stores/index.ts

- [x] Task 3: 创建开发者面板组件
  - [x] SubTask 3.1: 创建 DeveloperPanel 组件目录结构
  - [x] SubTask 3.2: 实现浮动窗口基础功能（拖拽、调整大小、最小化）
  - [x] SubTask 3.3: 创建面板样式文件
  - [x] SubTask 3.4: 实现Tab切换功能

- [x] Task 4: 实现请求监控Tab
  - [x] SubTask 4.1: 创建 RequestMonitor 组件
  - [x] SubTask 4.2: 显示请求列表（时间、智能体、提供商、状态、耗时、Token）
  - [x] SubTask 4.3: 实现请求详情查看功能
  - [x] SubTask 4.4: 添加请求记录到LLM服务调用处

- [x] Task 5: 实现智能体通信Tab
  - [x] SubTask 5.1: 创建 AgentCommunication 组件
  - [x] SubTask 5.2: 显示消息流列表（发送者、接收者、类型、时间）
  - [x] SubTask 5.3: 实现消息详情查看
  - [x] SubTask 5.4: 为AgentBase添加消息日志记录

- [x] Task 6: 实现日志查看Tab
  - [x] SubTask 6.1: 创建 LogViewer 组件
  - [x] SubTask 6.2: 显示日志列表（时间、级别、来源、消息）
  - [x] SubTask 6.3: 实现级别过滤功能
  - [x] SubTask 6.4: 实现来源过滤功能
  - [x] SubTask 6.5: 实现关键词搜索功能

- [x] Task 7: 实现状态检查Tab
  - [x] SubTask 7.1: 创建 StateInspector 组件
  - [x] SubTask 7.2: 显示游戏状态树（角色、任务、背包、场景）
  - [x] SubTask 7.3: 实现节点展开/折叠
  - [x] SubTask 7.4: 实现状态值编辑功能

- [x] Task 8: 集成开发者面板到应用
  - [x] SubTask 8.1: 在GameLayout中根据开发者模式显示面板
  - [x] SubTask 8.2: 连接settingsStore的开发者模式开关
  - [x] SubTask 8.3: 运行类型检查验证

# Task Dependencies
- [Task 3] depends on [Task 2]
- [Task 4] depends on [Task 1, Task 2]
- [Task 5] depends on [Task 1, Task 2]
- [Task 6] depends on [Task 1, Task 2]
- [Task 7] depends on [Task 2]
- [Task 8] depends on [Task 3, Task 4, Task 5, Task 6, Task 7]
