# Checklist

## 数值系统

### 类型定义
- [ ] `packages/shared/src/types/numerical.ts` 已创建
- [ ] AttributeDefinition 接口定义完整
- [ ] DerivedStatDefinition 接口定义完整
- [ ] DamageFormula 接口定义完整
- [ ] CharacterStats 接口定义完整

### 后端实现
- [ ] `packages/backend/src/services/NumericalService.ts` 已创建
- [ ] calculateBaseAttributes() 方法正常工作
- [ ] calculateDerivedStats() 方法正常工作
- [ ] calculateDamage() 方法正常工作
- [ ] processLevelUp() 方法正常工作
- [ ] NumericalAgent 已更新集成服务
- [ ] `packages/backend/src/routes/numericalRoutes.ts` 已创建
- [ ] 路由已在 index.ts 中注册

### 功能验证
- [ ] 属性计算正确（基础+种族+职业+装备）
- [ ] 派生属性计算正确
- [ ] 伤害公式计算正确
- [ ] 升级逻辑正常工作

---

## 背包系统

### 类型定义
- [ ] `packages/shared/src/types/inventory.ts` 已创建
- [ ] Item 接口定义完整
- [ ] InventoryItem 接口定义完整
- [ ] ItemEffect 接口定义完整

### 后端实现
- [ ] `packages/backend/src/models/ItemRepository.ts` 已创建
- [ ] items 表已创建
- [ ] ItemRepository CRUD 操作正常
- [ ] `packages/backend/src/services/InventoryService.ts` 已创建
- [ ] addItem() 方法正常工作（含堆叠逻辑）
- [ ] removeItem() 方法正常工作
- [ ] useItem() 方法正常工作
- [ ] InventoryAgent 已更新集成服务
- [ ] `packages/backend/src/routes/inventoryRoutes.ts` 已创建
- [ ] 路由已在 index.ts 中注册

### 功能验证
- [ ] 物品添加正常（含堆叠）
- [ ] 物品使用正常
- [ ] 物品丢弃正常
- [ ] 背包容量限制正常

---

## 技能系统

### 类型定义
- [ ] `packages/shared/src/types/skill.ts` 已创建
- [ ] Skill 接口定义完整
- [ ] SkillEffect 接口定义完整
- [ ] CharacterSkill 接口定义完整

### 后端实现
- [ ] `packages/backend/src/models/SkillRepository.ts` 已创建
- [ ] skills 表已创建
- [ ] character_skills 表已创建
- [ ] SkillRepository CRUD 操作正常
- [ ] `packages/backend/src/services/SkillService.ts` 已创建
- [ ] learnSkill() 方法正常工作
- [ ] upgradeSkill() 方法正常工作
- [ ] useSkill() 方法正常工作
- [ ] checkCooldown() 方法正常工作
- [ ] SkillAgent 已更新集成服务
- [ ] `packages/backend/src/routes/skillRoutes.ts` 已创建
- [ ] 路由已在 index.ts 中注册

### 功能验证
- [ ] 技能学习正常（条件检查、技能点消耗）
- [ ] 技能升级正常
- [ ] 技能使用正常
- [ ] 冷却管理正常

---

## 前端面板

### CharacterPanel
- [ ] 基础属性显示正确
- [ ] 派生属性显示正确
- [ ] 经验值/等级显示正确
- [ ] 属性加点功能正常（如有）

### InventoryPanel
- [ ] 物品列表显示正确
- [ ] 物品分类筛选正常
- [ ] 物品详情显示正确
- [ ] 使用/丢弃按钮正常

### SkillsPanel
- [ ] 已创建 `packages/frontend/src/components/panels/SkillsPanel.tsx`
- [ ] 技能列表显示正确
- [ ] 技能分类标签正常
- [ ] 技能详情显示正确
- [ ] 学习/升级按钮正常

---

## 类型检查
- [ ] 前端类型检查通过
- [ ] 后端类型检查通过

## 数据库
- [ ] items 表已创建
- [ ] skills 表已创建
- [ ] character_skills 表已创建
- [ ] character_inventory 表已创建
