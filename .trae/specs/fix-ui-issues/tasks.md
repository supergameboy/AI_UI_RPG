# Tasks

- [x] Task 1: 修复设置弹窗滚动问题
  - [x] SubTask 1.1: 修改Settings.module.css，为sections添加滚动样式
  - [x] SubTask 1.2: 确保各设置面板完整显示

- [x] Task 2: 添加返回确认弹窗
  - [x] SubTask 2.1: 创建ConfirmDialog组件
  - [x] SubTask 2.2: 在Header中添加确认弹窗逻辑
  - [x] SubTask 2.3: 点击返回时显示确认弹窗

- [x] Task 3: 修复游戏中设置行为
  - [x] SubTask 3.1: 修改gameStore，添加previousScreen状态
  - [x] SubTask 3.2: 修改设置打开逻辑，记录之前的界面
  - [x] SubTask 3.3: 关闭设置时恢复之前的界面
  - [x] SubTask 3.4: 修改Settings组件，支持作为弹窗覆盖显示

- [x] Task 4: 信息栏移至左侧
  - [x] SubTask 4.1: 创建LeftSidebar组件（包含小地图、队伍状态、快捷栏）
  - [x] SubTask 4.2: 修改GameLayout布局，添加左侧栏
  - [x] SubTask 4.3: 修改Footer，移除infoBar部分
  - [x] SubTask 4.4: 调整样式确保左右对称

- [x] Task 5: 添加NPC和记录面板
  - [x] SubTask 5.1: 在TabBar中添加NPC标签
  - [x] SubTask 5.2: 在TabBar中添加记录标签
  - [x] SubTask 5.3: 在PanelContainer中添加NPC面板内容
  - [x] SubTask 5.4: 在PanelContainer中添加记录面板内容
  - [x] SubTask 5.5: 更新uiStore的PanelType类型

- [x] Task 6: 世界地图按钮功能
  - [x] SubTask 6.1: 修改MiniMap组件，添加onClick事件
  - [x] SubTask 6.2: 点击世界地图按钮时打开地图面板

# Task Dependencies
- [Task 2] depends on [Task 1]
- [Task 4] depends on [Task 3]
- [Task 5] depends on [Task 4]
- [Task 6] depends on [Task 4]
