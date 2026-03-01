# 修复 OptionCard 渲染背景选项错误

## 问题分析

错误发生在 `OptionCard.tsx` 组件渲染背景选项时：
```
The above error occurred in the <span> component
at OptionCard
at BackgroundSelectionStep
```

**根本原因**：
1. AI 生成的背景数据中 `feature` 字段可能是对象（如 `{name: "...", description: "..."}`）而不是字符串
2. 或者 `feature` 可能是 `undefined`
3. 当尝试渲染非字符串值到 `<span>{option.feature}</span>` 时 React 报错

## 修复步骤

### Step 1: 修复 OptionCard 组件
**文件**: `packages/frontend/src/components/character/OptionCard.tsx`

修改背景渲染逻辑，安全处理 `feature` 字段：
```typescript
{isBackground(option) && (
  <>
    <div className={styles.feature}>
      <span className={styles.featureLabel}>特性:</span>
      <span className={styles.featureText}>
        {typeof option.feature === 'string' 
          ? option.feature 
          : option.feature 
            ? JSON.stringify(option.feature) 
            : '无特性'}
      </span>
    </div>
    // ...
  </>
)}
```

### Step 2: 修复后端 AI 生成背景的解析
**文件**: `packages/backend/src/services/AIGenerateService.ts`

确保 `parseBackgroundResponse` 和 `parseBackgroundsResponse` 正确处理 `feature` 字段：
```typescript
feature: typeof item.feature === 'string' 
  ? item.feature 
  : item.feature 
    ? (item.feature.name || item.feature.description || JSON.stringify(item.feature))
    : '',
```

### Step 3: 更新批量生成提示词
**文件**: `packages/backend/src/services/AIGenerateService.ts`

明确 `feature` 字段应该是字符串：
```
- feature: 背景特性描述（字符串格式，描述该背景提供的独特能力）
```

## 验证

1. 类型检查通过
2. 重新测试角色创建流程中的背景选择步骤
3. 确认 AI 生成的背景选项正确显示
