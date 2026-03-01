# 属性系统一致性改进计划

## 问题分析

当前存在属性不一致的问题：

1. **硬编码属性列表**：
   - `RaceEditor.tsx` 有硬编码的 `ATTRIBUTES` 数组
   - `ClassEditor.tsx` 有硬编码的 `ATTRIBUTE_OPTIONS` 数组
   - 两者都包含固定的 6 种属性（力量、敏捷、体质、智力、感知、魅力）

2. **自定义属性不生效**：
   - 用户在属性编辑器中添加/修改属性后，种族和职业编辑器不会显示新属性
   - 属性 ID 可能不一致（如 'str' vs 'strength'）

3. **预设模板缺少属性**：
   - 后端预设模板的 `attributes` 字段为空数组
   - 导致编辑预设模板时显示"暂无属性定义"

## 实现步骤

### Step 1: 统一属性 ID 格式 ✅
在 `templateStore.ts` 中统一属性 ID 格式为完整英文单词：
- `str` → `strength`
- `dex` → `dexterity`
- `con` → `constitution`
- `int` → `intelligence`
- `wis` → `wisdom`
- `cha` → `charisma`

### Step 2: 更新 RaceEditor 使用动态属性 ✅
修改 `RaceEditor.tsx`：
- 添加 `attributes: AttributeDefinition[]` prop
- 移除硬编码的 `ATTRIBUTES` 数组
- 使用传入的 `attributes` 生成属性选择列表
- 保持向后兼容（如果没有传入属性，使用默认列表）

### Step 3: 更新 ClassEditor 使用动态属性 ✅
修改 `ClassEditor.tsx`：
- 添加 `attributes: AttributeDefinition[]` prop
- 移除硬编码的 `ATTRIBUTE_OPTIONS` 数组
- 使用传入的 `attributes` 生成属性选择列表
- 保持向后兼容

### Step 4: 更新 TemplateEditor 传递属性 ✅
修改 `TemplateEditor.tsx`：
- 在渲染 RaceEditor 时传递 `attributes={editingTemplate.characterCreation?.attributes || []}`
- 在渲染 ClassEditor 时传递 `attributes={editingTemplate.characterCreation?.attributes || []}`

### Step 5: 为预设模板添加默认属性 ✅
修改 `TemplateService.ts`：
- 为所有 4 个预设模板添加默认的 6 种属性
- 使用统一的属性 ID 格式

### Step 6: 更新 AI 生成服务 ✅
确保 AI 生成种族/职业时使用正确的属性 ID：
- `AIGenerateService.ts` 中的提示词应使用完整英文单词作为属性 ID

### Step 7: 运行类型检查 ✅
确保所有修改无类型错误

## 文件修改清单

| 文件 | 修改内容 | 状态 |
|------|----------|------|
| `templateStore.ts` | 统一属性 ID 格式 | ✅ |
| `RaceEditor.tsx` | 添加 attributes prop，移除硬编码 | ✅ |
| `ClassEditor.tsx` | 添加 attributes prop，移除硬编码 | ✅ |
| `TemplateEditor.tsx` | 传递 attributes prop | ✅ |
| `TemplateService.ts` | 为预设模板添加默认属性 | ✅ |
| `AIGenerateService.ts` | 确保属性 ID 一致性 | ✅ (已验证无需修改) |

## 验证点

- [x] 属性编辑器中添加新属性后，种族编辑器可以选择该属性
- [x] 属性编辑器中添加新属性后，职业编辑器可以选择该属性
- [x] 编辑预设模板时显示默认的 6 种属性
- [x] AI 生成的种族/职业使用正确的属性 ID
- [x] 类型检查通过
