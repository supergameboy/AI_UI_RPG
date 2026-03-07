# 动态 UI 组件语法参考

此模块定义了所有 Markdown 动态 UI 组件的语法规范。

## 组件列表

| 组件 | 语法 | 用途 |
|------|------|------|
| options | :::options{...} | 选项按钮组 |
| progress | :::progress{...} | 进度条 |
| tabs | :::tabs | 标签页 |
| system-notify | :::system-notify{...} | 系统通知 |
| badge | :::badge{...} | 徽章 |
| conditional | :::conditional{...} | 条件显示 |
| enhancement | :::enhancement{...} | 装备强化 |
| warehouse | :::warehouse{...} | 仓库/银行 |

## 通用属性

- id: 组件唯一标识
- class: 自定义 CSS 类名

## Action 格式

- action:name - 触发动作
- tooltip:content - 悬浮提示
- tab:id - 标签页切换
- item:id - 物品引用
