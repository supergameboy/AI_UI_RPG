# Checklist

## 类型定义
- [ ] 共享类型文件 `initialization.ts` 已创建
- [ ] InitializationStep 枚举定义完整
- [ ] InitializationStatus 接口定义完整
- [ ] 请求/响应类型定义完整

## 初始数据配置
- [ ] 初始技能配置（按职业）已创建
- [ ] 初始物品配置（按背景）已创建
- [ ] 初始装备配置（按职业）已创建
- [ ] 初始金币配置（按背景）已创建

## 后端实现
- [ ] InitializationService.ts 已创建
- [ ] initializeNumerical 方法正常工作
- [ ] initializeSkills 方法正常工作
- [ ] initializeInventory 方法正常工作
- [ ] initializeEquipment 方法正常工作
- [ ] initializeQuests 方法正常工作
- [ ] initializeMap 方法正常工作
- [ ] initializeNPCs 方法正常工作
- [ ] runFullInitialization 方法正常工作
- [ ] initializationRoutes.ts 已创建
- [ ] 路由已在 index.ts 中注册

## 前端实现
- [ ] initializationService.ts 已创建
- [ ] gameStore 初始化状态管理已添加
- [ ] InitializationProgress.tsx 组件已创建
- [ ] 角色创建后自动触发初始化

## 类型检查
- [ ] 前端类型检查通过
- [ ] 后端类型检查通过

## 功能验证
- [ ] 创建新角色后初始化流程正常执行
- [ ] 各系统数据正确初始化
- [ ] 初始化进度正确显示
- [ ] 初始化失败时显示错误信息
- [ ] 重试功能正常工作
- [ ] 初始化完成后正确进入游戏
