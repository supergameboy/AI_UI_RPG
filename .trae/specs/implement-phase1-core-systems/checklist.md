# Checklist

## 数值系统

### 类型定义
- [x] `packages/shared/src/types/numerical.ts` 已创建
- [x] AttributeDefinition 接口定义完整
- [x] DerivedStatDefinition 接口定义完整
- [x] DamageFormula 接口定义完整
- [x] CharacterStats 接口定义完整

### 后端实现
- [x] `packages/backend/src/services/NumericalService.ts` 已创建
- [x] calculateBaseAttributes() 方法正常工作
- [x] calculateDerivedStats() 方法正常工作
- [x] calculateDamage() 方法正常工作
- [x] processLevelUp() 方法正常工作
- [x] NumericalAgent 已更新集成服务
- [x] `packages/backend/src/routes/numericalRoutes.ts` 已创建
- [x] 路由已在 index.ts 中注册

### 功能验证
- [x] 属性计算正确（基础+种族+职业+装备）
- [x] 派生属性计算正确
- [x] 伤害公式计算正确
- [x] 升级逻辑正常工作

---

## 背包系统

### 类型定义
- [x] `packages/shared/src/types/inventory.ts` 已创建
- [x] Item 接口定义完整
- [x] InventoryItem 接口定义完整
- [x] ItemEffect 接口定义完整

### 后端实现
- [x] `packages/backend/src/models/ItemRepository.ts` 已创建
- [x] items 表已创建
- [x] ItemRepository CRUD 操作正常
- [x] `packages/backend/src/services/InventoryService.ts` 已创建
- [x] addItem() 方法正常工作（含堆叠逻辑）
- [x] removeItem() 方法正常工作
- [x] useItem() 方法正常工作
- [x] InventoryAgent 已更新集成服务
- [x] `packages/backend/src/routes/inventoryRoutes.ts` 已创建
- [x] 路由已在 index.ts 中注册

### 功能验证
- [x] 物品添加正常（含堆叠）
- [x] 物品使用正常
- [x] 物品丢弃正常
- [x] 背包容量限制正常

---

## 技能系统

### 类型定义
- [x] `packages/shared/src/types/skill.ts` 已创建
- [x] Skill 接口定义完整
- [x] SkillEffect 接口定义完整
- [x] CharacterSkill 接口定义完整

### 后端实现
- [x] `packages/backend/src/models/SkillRepository.ts` 已创建
- [x] skills 表已创建
- [x] character_skills 表已创建
- [x] SkillRepository CRUD 操作正常
- [x] `packages/backend/src/services/SkillService.ts` 已创建
- [x] learnSkill() 方法正常工作
- [x] upgradeSkill() 方法正常工作
- [x] useSkill() 方法正常工作
- [x] checkCooldown() 方法正常工作
- [x] SkillAgent 已更新集成服务
- [x] `packages/backend/src/routes/skillRoutes.ts` 已创建
- [x] 路由已在 index.ts 中注册

### 功能验证
- [x] 技能学习正常（条件检查、技能点消耗）
- [x] 技能升级正常
- [x] 技能使用正常
- [x] 冷却管理正常

---

## 前端面板

### CharacterPanel
- [x] 基础属性显示正确
- [x] 派生属性显示正确
- [x] 经验值/等级显示正确
- [x] 属性加点功能正常（如有）

### InventoryPanel
- [x] 物品列表显示正确
- [x] 物品分类筛选正常
- [x] 物品详情显示正确
- [x] 使用/丢弃按钮正常

### SkillsPanel
- [x] 已创建 `packages/frontend/src/components/panels/SkillsPanel.tsx`
- [x] 技能列表显示正确
- [x] 技能分类标签正常
- [x] 技能详情显示正确
- [x] 学习/升级按钮正常

---

## 类型检查
- [x] 前端类型检查通过
- [x] 后端类型检查通过

## 数据库
- [x] items 表已创建
- [x] skills 表已创建
- [x] character_skills 表已创建
- [x] character_inventory 表已创建
