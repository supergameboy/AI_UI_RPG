# 基础UI框架 Spec

## Why
游戏需要一个完整的主界面布局和主题系统，为后续的游戏面板、对话系统和各种交互组件提供统一的UI基础。良好的UI框架是用户体验的核心，也是后续所有功能模块的基础。

## What Changes
- 创建主菜单界面（开始游戏、继续游戏、设置、退出）
- 创建主界面布局组件（Header、Main、Footer）
- 实现主题系统（亮色/暗色/自定义主题）
- 创建基础UI组件库（Button、Input、Panel、ProgressBar等）
- 实现响应式布局和CSS变量系统
- 创建全局状态管理（主题、UI状态、游戏状态）

## Impact
- Affected specs: 无（新模块）
- Affected code: 
  - `packages/frontend/src/` - 全部前端代码
  - 需要新增大量组件和样式文件

## ADDED Requirements

### Requirement: 主菜单界面
系统应提供游戏启动时的主菜单界面：

#### Scenario: 主菜单显示
- **WHEN** 用户打开游戏
- **THEN** 显示主菜单界面，包含：
  - 游戏标题和Logo
  - 开始新游戏按钮
  - 继续游戏按钮（有存档时可用）
  - 设置按钮
  - 退出按钮

#### Scenario: 开始新游戏
- **WHEN** 用户点击"开始新游戏"
- **THEN** 进入模板选择界面或角色创建流程

#### Scenario: 继续游戏
- **WHEN** 用户点击"继续游戏"
- **THEN** 显示存档列表供用户选择

#### Scenario: 无存档时
- **WHEN** 没有任何存档
- **THEN** "继续游戏"按钮显示为禁用状态

### Requirement: 主界面布局
系统应提供完整的主界面布局，包含以下区域：

#### Scenario: 主界面结构
- **WHEN** 用户打开游戏
- **THEN** 显示完整的主界面布局：
  - 顶部：标题栏（菜单、存档、设置、开发者按钮）
  - 中间：主游戏区域（故事显示、选项、输入框）
  - 底部：功能面板标签栏（角色、技能、装备、背包、任务、地图）
  - 底部信息栏：小地图、队伍状态、快捷栏

### Requirement: 主题系统
系统应支持多主题切换和自定义主题：

#### Scenario: 主题切换
- **WHEN** 用户在设置中切换主题
- **THEN** 整个界面立即应用新主题，无需刷新

#### Scenario: 自定义主题
- **WHEN** 用户选择自定义主题
- **THEN** 可以自定义颜色、字体、边框效果等

### Requirement: 基础UI组件
系统应提供统一的基础UI组件：

#### Scenario: 按钮组件
- **WHEN** 使用Button组件
- **THEN** 支持多种变体（primary、secondary、ghost、danger）和尺寸（small、medium、large）

#### Scenario: 输入框组件
- **WHEN** 使用Input组件
- **THEN** 支持单行、多行、带图标等变体

#### Scenario: 面板组件
- **WHEN** 使用Panel组件
- **THEN** 支持标题栏、可折叠、可关闭等功能

#### Scenario: 进度条组件
- **WHEN** 使用ProgressBar组件
- **THEN** 支持不同颜色、动画效果、显示文本

### Requirement: 响应式布局
系统应支持不同屏幕尺寸：

#### Scenario: 最小分辨率
- **WHEN** 屏幕宽度小于1280px
- **THEN** 显示滚动条，确保功能可用

#### Scenario: 推荐分辨率
- **WHEN** 屏幕宽度大于等于1920px
- **THEN** 充分利用屏幕空间，显示更丰富的信息

### Requirement: 全局状态管理
系统应使用Zustand管理UI相关状态：

#### Scenario: 主题状态
- **WHEN** 应用启动
- **THEN** 从本地存储加载用户主题偏好

#### Scenario: 面板状态
- **WHEN** 用户打开/关闭面板
- **THEN** 面板状态被正确管理

## MODIFIED Requirements
无

## REMOVED Requirements
无
