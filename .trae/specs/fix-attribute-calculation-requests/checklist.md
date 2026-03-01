# 修复角色创建属性计算和请求防抖问题 Checklist

## 前端请求防抖
- [x] characterCreationStore.calculateAttributes 开头检查 isLoading
- [x] CharacterConfirmStep 使用 ref 防止重复调用
- [x] 有计算结果缓存时不重复请求

## 后端路由
- [x] /api/character/calculate-attributes 路由正确注册
- [x] 路由只接受 POST 请求
- [x] 路由有调试日志

## 验证
- [ ] 进入角色确认界面只发送一次请求
- [ ] 快速切换不会产生多个请求
- [ ] 属性计算结果正确显示
