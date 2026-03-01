# Tasks

- [x] Task 1: 修复属性删除联动清理
  - [x] SubTask 1.1: 在AttributeEditor中添加onDelete回调参数，传递被删除的属性ID
  - [x] SubTask 1.2: 在TemplateEditor中实现handleDeleteAttribute函数，清理种族和职业中的属性引用
  - [x] SubTask 1.3: 更新RaceEditor和ClassEditor确保正确处理属性引用

- [x] Task 2: 修复战斗类型联动更新
  - [x] SubTask 2.1: 在RulesEditor中监听combatSystem.type变化
  - [x] SubTask 2.2: 根据战斗类型自动调整actionPoints默认值
  - [x] SubTask 2.3: 根据战斗类型调整先攻类型选项的可见性/默认值
  - [x] SubTask 2.4: 根据战斗类型调整冷却系统默认值

- [x] Task 3: 实现自定义先攻类型输入
  - [x] SubTask 3.1: 在RulesEditor中添加customInitiative状态
  - [x] SubTask 3.2: 当选择"自定义"时显示文本输入框
  - [x] SubTask 3.3: 将自定义先攻规则保存到gameRules.combatSystem.customInitiative

- [x] Task 4: 修复UI主题和布局编辑器图标
  - [x] SubTask 4.1: 检查Icon组件是否支持'palette'和'layout'图标
  - [x] SubTask 4.2: 添加对应的SVG图标
  - [x] SubTask 4.3: 更新NAV_ITEMS中的icon字段

- [x] Task 5: 修复UI主题和布局更改不保存问题
  - [x] SubTask 5.1: 检查handleUpdateUITheme和handleUpdateUILayout回调是否正确触发
  - [x] SubTask 5.2: 确保onUpdate回调正确更新editingTemplate状态
  - [x] SubTask 5.3: 验证保存时uiTheme和uiLayout数据正确包含在请求中

- [x] Task 6: 细化界面面板设置
  - [x] SubTask 6.1: 添加小地图位置配置选项（左上/右上/左下/右下）
  - [x] SubTask 6.2: 添加小地图大小配置选项（小/中/大）
  - [x] SubTask 6.3: 添加队伍面板位置配置选项
  - [x] SubTask 6.4: 添加技能栏快捷键数量配置选项
  - [x] SubTask 6.5: 更新UILayout类型定义以支持新配置项

# Task Dependencies
- [Task 1] 需要先完成才能验证属性删除功能
- [Task 2] 和 [Task 3] 可以并行处理
- [Task 4] 和 [Task 5] 可以并行处理
- [Task 6] 依赖 [Task 5] 完成后验证保存功能
