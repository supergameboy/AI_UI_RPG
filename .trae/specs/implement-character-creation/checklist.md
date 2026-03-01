# Character Creation System Checklist

## 类型定义
- [x] Character 类型包含 appearance 字段
- [x] Character 类型包含 imagePrompt 字段
- [x] Character 类型包含 backstory 字段
- [x] CharacterCreationState 类型定义完整
- [x] GeneratedRaceOption 类型定义完整
- [x] GeneratedClassOption 类型定义完整
- [x] GeneratedBackgroundOption 类型定义完整
- [x] GameSettings 包含 aiRandomGeneration 开关
- [x] GameSettings 包含 generateImagePrompt 开关

## 后端服务
- [x] CharacterGenerationService 实现种族生成
- [x] CharacterGenerationService 实现职业生成
- [x] CharacterGenerationService 实现背景生成
- [x] CharacterGenerationService 实现属性计算
- [x] CharacterGenerationService 实现外观生成
- [x] API 路由 /api/character/generate-races 可用
- [x] API 路由 /api/character/generate-class 可用
- [x] API 路由 /api/character/generate-background 可用
- [x] API 路由 /api/character/finalize 可用

## 前端状态管理
- [x] characterCreationStore 管理当前步骤
- [x] characterCreationStore 存储角色名称
- [x] characterCreationStore 存储选中的种族
- [x] characterCreationStore 存储选中的职业
- [x] characterCreationStore 存储选中的背景
- [x] characterCreationStore 实现下一步操作
- [x] characterCreationStore 实现返回操作
- [x] characterCreationStore 实现重新生成操作

## UI 组件
- [x] CharacterCreation 组件显示步骤指示器
- [x] NameInputStep 组件可输入角色名称
- [x] RaceSelectionStep 组件显示种族选项卡片
- [x] ClassSelectionStep 组件显示职业选项卡片
- [x] BackgroundSelectionStep 组件显示背景选项卡片
- [x] CharacterConfirmStep 组件显示完整角色卡
- [x] OptionCard 组件显示选项详情
- [x] CharacterCard 组件显示属性计算明细
- [x] 选项卡片同时显示预设选项和AI生成选项
- [x] 预设选项和AI生成选项有视觉区分

## 流程集成
- [x] 主菜单"开始新游戏"跳转到模板选择
- [x] 模板选择后跳转到角色创建
- [x] 角色创建完成后初始化游戏状态
- [x] 角色创建完成后跳转到游戏界面

## 设置功能
- [x] 设置界面显示"AI随机生成角色选项"开关
- [x] 设置界面显示"生成文生图提示词"开关
- [x] 设置保存后立即生效
- [x] 设置在角色创建流程中正确应用

## 用户体验
- [x] 每个步骤都可以返回上一步
- [x] 返回时保留之前的选择
- [x] 确认页可以重新生成
- [x] 加载状态显示正确
- [x] 错误提示友好
