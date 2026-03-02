# Tasks

## 数值系统 (Numerical System)

### Task 1: 定义数值系统共享类型
- [ ] SubTask 1.1: 在 `packages/shared/src/types/numerical.ts` 中定义类型
  - AttributeDefinition 接口（属性定义）
  - DerivedStatDefinition 接口（派生属性定义）
  - DamageFormula 接口（伤害公式）
  - LevelReward 接口（等级奖励）
  - CharacterStats 接口（角色完整属性）

### Task 2: 实现数值服务
- [ ] SubTask 2.1: 创建 `packages/backend/src/services/NumericalService.ts`
  - calculateBaseAttributes() - 计算基础属性
  - calculateDerivedStats() - 计算派生属性
  - calculateDamage() - 计算伤害
  - calculateExpToLevel() - 计算升级所需经验
  - processLevelUp() - 处理升级逻辑

### Task 3: 完善 NumericalAgent
- [ ] SubTask 3.1: 更新 `packages/backend/src/agents/NumericalAgent.ts`
  - 集成 NumericalService
  - 实现属性计算请求处理
  - 实现伤害计算请求处理
  - 实现升级处理

### Task 4: 创建数值 API 路由
- [ ] SubTask 4.1: 创建 `packages/backend/src/routes/numericalRoutes.ts`
  - POST /api/numerical/calculate - 计算角色属性
  - POST /api/numerical/damage - 计算伤害
  - POST /api/numerical/level-up - 处理升级
- [ ] SubTask 4.2: 在后端 index.ts 中注册路由

---

## 背包系统 (Inventory System)

### Task 5: 定义背包系统共享类型
- [ ] SubTask 5.1: 在 `packages/shared/src/types/inventory.ts` 中定义类型
  - Item 接口（物品定义）
  - InventoryItem 接口（背包物品实例）
  - ItemEffect 接口（物品效果）
  - ItemRequirement 接口（使用要求）

### Task 6: 创建物品数据仓库
- [ ] SubTask 6.1: 创建 `packages/backend/src/models/ItemRepository.ts`
  - 数据库表创建（items 表）
  - getItemById() - 获取物品定义
  - getItemsByType() - 按类型获取物品
  - createItem() - 创建物品定义
  - CRUD 操作

### Task 7: 实现背包服务
- [ ] SubTask 7.1: 创建 `packages/backend/src/services/InventoryService.ts`
  - addItem() - 添加物品（处理堆叠）
  - removeItem() - 移除物品
  - useItem() - 使用物品
  - getInventory() - 获取背包内容
  - checkCapacity() - 检查容量

### Task 8: 完善 InventoryAgent
- [ ] SubTask 8.1: 更新 `packages/backend/src/agents/InventoryAgent.ts`
  - 集成 InventoryService
  - 实现物品操作请求处理
  - 实现物品效果应用

### Task 9: 创建背包 API 路由
- [ ] SubTask 9.1: 创建 `packages/backend/src/routes/inventoryRoutes.ts`
  - GET /api/inventory - 获取背包
  - POST /api/inventory/add - 添加物品
  - POST /api/inventory/use - 使用物品
  - DELETE /api/inventory/:itemId - 移除物品
- [ ] SubTask 9.2: 在后端 index.ts 中注册路由

---

## 技能系统 (Skill System)

### Task 10: 定义技能系统共享类型
- [ ] SubTask 10.1: 在 `packages/shared/src/types/skill.ts` 中定义类型
  - Skill 接口（技能定义）
  - SkillEffect 接口（技能效果）
  - SkillCost 接口（技能消耗）
  - SkillCooldown 接口（冷却信息）
  - CharacterSkill 接口（角色已学技能）

### Task 11: 创建技能数据仓库
- [ ] SubTask 11.1: 创建 `packages/backend/src/models/SkillRepository.ts`
  - 数据库表创建（skills 表）
  - getSkillById() - 获取技能定义
  - getSkillsByCategory() - 按类别获取技能
  - createSkill() - 创建技能定义
  - CRUD 操作

### Task 12: 实现技能服务
- [ ] SubTask 12.1: 创建 `packages/backend/src/services/SkillService.ts`
  - learnSkill() - 学习技能
  - upgradeSkill() - 升级技能
  - useSkill() - 使用技能
  - checkCooldown() - 检查冷却
  - calculateEffect() - 计算效果

### Task 13: 完善 SkillAgent
- [ ] SubTask 13.1: 更新 `packages/backend/src/agents/SkillAgent.ts`
  - 集成 SkillService
  - 实现技能学习请求处理
  - 实现技能使用请求处理
  - 实现冷却管理

### Task 14: 创建技能 API 路由
- [ ] SubTask 14.1: 创建 `packages/backend/src/routes/skillRoutes.ts`
  - GET /api/skills - 获取角色技能
  - POST /api/skills/learn - 学习技能
  - POST /api/skills/upgrade - 升级技能
  - POST /api/skills/use - 使用技能
  - GET /api/skills/available - 获取可学技能
- [ ] SubTask 14.2: 在后端 index.ts 中注册路由

---

## 前端面板完善

### Task 15: 完善 CharacterPanel
- [ ] SubTask 15.1: 更新 `packages/frontend/src/components/panels/CharacterPanel.tsx`
  - 显示基础属性和派生属性
  - 显示经验值和等级
  - 属性加点功能（如有可用点数）

### Task 16: 完善 InventoryPanel
- [ ] SubTask 16.1: 更新 `packages/frontend/src/components/panels/InventoryPanel.tsx`
  - 显示物品列表
  - 物品分类筛选
  - 物品详情显示
  - 使用/丢弃按钮

### Task 17: 创建 SkillsPanel
- [ ] SubTask 17.1: 创建 `packages/frontend/src/components/panels/SkillsPanel.tsx`
  - 显示已学技能列表
  - 技能分类标签
  - 技能详情显示
  - 学习/升级按钮

---

## 类型检查与验证

### Task 18: 类型检查
- [ ] SubTask 18.1: 运行前端类型检查 `cd packages/frontend ; npm run typecheck`
- [ ] SubTask 18.2: 运行后端类型检查 `cd packages/backend ; npm run typecheck`

### Task 19: 数据库迁移
- [ ] SubTask 19.1: 更新 DatabaseService 添加新表
  - items 表
  - skills 表
  - character_skills 表（角色已学技能）
  - character_inventory 表（角色背包）

# Task Dependencies

## 并行开发组
以下三组任务可以并行开发（无相互依赖）：
- **数值系统**: Task 1-4
- **背包系统**: Task 5-9
- **技能系统**: Task 10-14

## 顺序依赖
- Task 15 依赖 Task 1-4（需要数值系统类型和服务）
- Task 16 依赖 Task 5-9（需要背包系统类型和服务）
- Task 17 依赖 Task 10-14（需要技能系统类型和服务）
- Task 18-19 依赖所有前置任务
