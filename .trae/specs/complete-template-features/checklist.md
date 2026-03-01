# Checklist

## 类型定义
- [x] `AIBehavior` 接口已添加到 `template.ts`，包含 `responseStyle`、`detailLevel`、`playerAgency` 字段
- [x] `UITheme` 接口已添加到 `template.ts`，包含 `primaryColor`、`fontFamily`、`backgroundStyle`、`customCSS` 字段
- [x] `UILayout` 接口已添加到 `template.ts`，包含 `showMinimap`、`showCombatPanel`、`showSkillBar`、`showPartyPanel`、`customLayout` 字段
- [x] `SpecialRules` 接口已添加到 `template.ts`，包含 `hasKP`、`permadeath`、`saveRestriction`、`customRules` 字段
- [x] `NumericalComplexity` 类型已添加到 `template.ts`
- [x] `StoryTemplate` 接口已更新，包含 `uiTheme`、`uiLayout`、`numericalComplexity`、`specialRules` 字段
- [x] `AIConstraints` 接口已更新，包含 `aiBehavior` 字段
- [x] shared 包已重新构建成功

## 前端编辑器
- [x] `UIThemeEditor.tsx` 组件已创建，支持主题颜色、字体、背景样式编辑
- [x] `UILayoutEditor.tsx` 组件已创建，支持界面布局选项编辑
- [x] `AIConstraintsEditor.tsx` 已更新，支持 AI 行为配置（响应风格、详细程度、玩家自由度）
- [x] `RulesEditor.tsx` 已更新，支持特殊规则和数值复杂度配置
- [x] `TemplateEditor.tsx` 已更新，导航栏包含新编辑器入口
- [x] 编辑器组件已正确导出

## 后端服务
- [x] `AIGenerateService.ts` 已更新，根据 `aiBehavior` 配置优化提示词
- [x] AI 生成内容根据 `numericalComplexity` 调整数值复杂度

## 默认数据
- [x] `templateStore.ts` 已更新，新字段有合理的默认值

## 验证
- [x] `pnpm run typecheck` 通过，无类型错误
- [x] 前端编辑器可正常打开和使用
- [x] 新增配置可正常保存和加载
