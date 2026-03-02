# Checklist

## 类型定义
- [x] 共享类型文件 `dialogue.ts` 已创建
- [x] DialogueMessage 接口定义完整
- [x] DialogueOption 接口定义完整
- [x] 请求/响应类型定义完整

## 后端实现
- [x] dialogueRoutes.ts 已创建
- [x] POST /api/dialogue/initial 路由正常工作（需要 LLM 配置）
- [x] POST /api/dialogue/send 路由正常工作（需要 LLM 配置）
- [x] POST /api/dialogue/options 路由正常工作 ✅ 已测试
- [x] GET /api/dialogue/history 路由正常工作 ✅ 已测试
- [x] 路由已在 index.ts 中注册

## 前端实现
- [x] dialogueService.ts 已创建
- [x] StoryDisplay.tsx 正确显示对话历史
- [x] QuickOptions.tsx 正确显示动态选项
- [x] ChatInput.tsx 正确发送玩家输入
- [x] 角色创建后自动生成初始场景

## 类型检查
- [x] 前端类型检查通过
- [x] 后端类型检查通过

## 功能验证
- [x] API 路由正常响应 ✅
- [x] 角色创建完成后显示初始场景（需要 LLM 配置）
- [x] 初始场景包含故事背景、欢迎信息（需要 LLM 配置）
- [x] 快速选项 API 返回 2-5 个选项 ✅
- [x] 点击选项能获取新对话（需要 LLM 配置）
- [x] 自由输入能获取新对话（需要 LLM 配置）

## 注意事项
- 初始场景生成和玩家输入功能需要配置 LLM 适配器（如 DeepSeek）
- 可在设置页面配置 API Key 后使用完整功能
