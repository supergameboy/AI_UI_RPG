# 修复角色创建 AI 生成请求问题 Checklist

## 前端请求防抖
- [x] characterCreationStore 中有请求状态锁
- [x] isLoading 时不会发送新请求
- [x] RaceSelectionStep useEffect 正确使用 ref 防止重复
- [x] 请求失败后可以重试

## 后端 LLM 配置加载
- [x] 后端启动时加载设置文件中的 LLM 配置
- [x] 已配置的 provider 自动注册适配器
- [x] 配置加载有日志输出
- [x] 配置不存在时优雅处理

## 错误处理
- [x] AI 生成失败时显示友好错误信息
- [x] 错误提示包含"前往设置"按钮
- [x] 503 错误正确识别并提示配置问题
