# Checklist

## 日志服务
- [x] 前端 logService.ts 存在
- [x] 后端 LogService.ts 存在
- [x] 支持 DEBUG、INFO、WARN、ERROR 级别
- [x] 支持来源标记（frontend、backend、agent）
- [x] 支持日志过滤和搜索
- [x] 后端日志自动写入文件
- [x] 支持按日期分割日志文件
- [x] 前端支持导出日志（JSON/文本格式）

## 开发者状态管理
- [x] developerStore.ts 存在
- [x] 管理面板显示/隐藏状态
- [x] 管理面板位置和大小
- [x] 存储LLM请求记录
- [x] 存储智能体消息记录
- [x] 在 stores/index.ts 导出

## 开发者面板UI
- [x] DeveloperPanel 组件存在
- [x] 浮动窗口可拖拽移动
- [x] 浮动窗口可调整大小
- [x] 支持最小化/展开
- [x] Tab切换功能正常

## 请求监控Tab
- [x] RequestMonitor 组件存在
- [x] 显示请求列表
- [x] 显示请求详情
- [ ] LLM服务调用时记录请求（需要后续集成）

## 智能体通信Tab
- [x] AgentCommunication 组件存在
- [x] 显示消息流列表
- [x] 显示消息详情
- [ ] AgentBase 记录消息日志（需要后续集成）

## 日志查看Tab
- [x] LogViewer 组件存在
- [x] 显示日志列表
- [x] 级别过滤功能
- [x] 来源过滤功能
- [x] 关键词搜索功能

## 状态检查Tab
- [x] StateInspector 组件存在
- [x] 显示游戏状态树
- [x] 节点展开/折叠
- [x] 状态值编辑功能

## 集成验证
- [x] 开发者模式开关控制面板显示
- [x] 面板在GameLayout中正确渲染
- [x] 前端 typecheck 通过
- [x] 后端 typecheck 通过
