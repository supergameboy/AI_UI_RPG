# Checklist

## 类型定义
- [ ] 共享类型文件 `dialogue.ts` 已创建
- [ ] DialogueMessage 接口定义完整
- [ ] DialogueOption 接口定义完整
- [ ] 请求/响应类型定义完整

## 后端实现
- [ ] dialogueRoutes.ts 已创建
- [ ] POST /api/dialogue/initial 路由正常工作
- [ ] POST /api/dialogue/send 路由正常工作
- [ ] 路由已在 index.ts 中注册

## 前端实现
- [ ] dialogueService.ts 已创建
- [ ] StoryDisplay.tsx 正确显示对话历史
- [ ] QuickOptions.tsx 正确显示动态选项
- [ ] ChatInput.tsx 正确发送玩家输入
- [ ] 角色创建后自动生成初始场景

## 类型检查
- [ ] 前端类型检查通过
- [ ] 后端类型检查通过

## 功能验证
- [ ] 角色创建完成后显示初始场景
- [ ] 初始场景包含故事背景、欢迎信息
- [ ] 快速选项显示 2-5 个
- [ ] 点击选项能获取新对话
- [ ] 自由输入能获取新对话
