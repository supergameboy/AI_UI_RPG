# 修复模板编辑器问题 Spec

## Why
用户在测试模板编辑器时发现了多个功能缺陷，包括属性删除不联动、战斗规则切换不更新、自定义先攻无反馈、UI主题/布局编辑器图标缺失且更改不保存、界面面板设置不够细化等问题。这些问题影响了模板编辑器的可用性和数据一致性。

## What Changes
- 属性删除时联动清理种族/职业中引用该属性的记录
- 战斗类型切换时自动更新相关配置选项
- 先攻类型选择"自定义"时显示自定义输入框
- 修复UI主题和界面布局编辑器的图标显示
- 修复UI主题和界面布局更改不保存的问题
- 细化界面面板设置，增加更多配置选项

## Impact
- Affected specs: 模板编辑系统
- Affected code: 
  - `packages/frontend/src/components/template/editors/AttributeEditor.tsx`
  - `packages/frontend/src/components/template/editors/RulesEditor.tsx`
  - `packages/frontend/src/components/template/editors/UIThemeEditor.tsx`
  - `packages/frontend/src/components/template/editors/UILayoutEditor.tsx`
  - `packages/frontend/src/components/template/TemplateEditor.tsx`

## ADDED Requirements

### Requirement: 属性删除联动清理
当用户在属性编辑器中删除一个属性时，系统 SHALL 自动清理所有种族和职业中对该属性的引用。

#### Scenario: 删除属性时清理种族主属性
- **WHEN** 用户删除一个属性（如 `attr_1772344004643`）
- **THEN** 系统自动从所有种族的 `primaryAttributes` 数组中移除该属性ID
- **AND** 系统自动从所有职业的 `primaryAttributes` 数组中移除该属性ID

### Requirement: 战斗类型联动更新
当用户更改战斗类型时，系统 SHALL 根据战斗类型自动调整相关配置选项的默认值。

#### Scenario: 切换战斗类型时更新相关配置
- **WHEN** 用户将战斗类型从"回合制"切换为"叙事型"
- **THEN** 系统自动隐藏或调整行动点数设置
- **AND** 系统自动调整先攻类型选项为适合叙事型的默认值
- **WHEN** 用户将战斗类型切换为"实时"
- **THEN** 系统自动调整冷却系统为"时间制"

### Requirement: 自定义先攻类型输入
当用户选择先攻类型为"自定义"时，系统 SHALL 显示一个文本输入框供用户输入自定义先攻规则。

#### Scenario: 选择自定义先攻类型
- **WHEN** 用户在先攻类型下拉框中选择"自定义"
- **THEN** 系统显示一个文本输入框
- **AND** 用户可以在输入框中输入自定义先攻规则描述

### Requirement: UI主题编辑器图标显示
UI主题编辑器的导航项 SHALL 显示正确的图标。

#### Scenario: 显示UI主题图标
- **WHEN** 用户查看模板编辑器导航栏
- **THEN** "UI主题"选项显示调色板图标（palette）

### Requirement: 界面布局编辑器图标显示
界面布局编辑器的导航项 SHALL 显示正确的图标。

#### Scenario: 显示界面布局图标
- **WHEN** 用户查看模板编辑器导航栏
- **THEN** "界面布局"选项显示布局图标（layout）

### Requirement: UI主题和布局更改保存
用户对UI主题和界面布局的更改 SHALL 正确保存到模板数据中。

#### Scenario: 保存UI主题更改
- **WHEN** 用户修改UI主题设置（如主色调、字体）
- **AND** 用户点击保存按钮
- **THEN** 更改正确保存到模板的 `uiTheme` 字段

#### Scenario: 保存界面布局更改
- **WHEN** 用户修改界面布局设置（如启用/禁用面板）
- **AND** 用户点击保存按钮
- **THEN** 更改正确保存到模板的 `uiLayout` 字段

### Requirement: 细化界面面板设置
界面布局编辑器 SHALL 提供更细化的面板配置选项。

#### Scenario: 配置面板位置和大小
- **WHEN** 用户编辑界面布局
- **THEN** 可以配置小地图的位置（左上/右上/左下/右下）
- **AND** 可以配置小地图的大小
- **AND** 可以配置队伍面板的位置
- **AND** 可以配置技能栏的快捷键数量

## MODIFIED Requirements
无

## REMOVED Requirements
无
