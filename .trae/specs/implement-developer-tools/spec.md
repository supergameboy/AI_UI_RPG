# 开发者工具系统 Spec

## Why
开发者工具是调试和监控AI RPG游戏运行状态的关键功能。当前系统缺乏对LLM请求、智能体通信、系统日志的监控能力，导致问题排查困难。需要实现一个浮动窗口式的开发者面板，提供请求监控、智能体通信、日志查看和状态检查功能。

## What Changes
- 创建开发者面板组件（浮动窗口，可拖拽）
- 实现请求监控Tab（LLM API请求/响应记录）
- 实现智能体通信Tab（智能体消息流）
- 实现日志查看Tab（系统日志，支持过滤）
- 实现状态检查Tab（游戏状态查看/修改）
- 创建日志服务，统一管理前端日志
- 为智能体系统添加日志记录
- 创建开发者模式状态管理

## Impact
- Affected specs: 开发者工具系统
- Affected code:
  - `packages/frontend/src/components/developer/` - 新增开发者面板组件
  - `packages/frontend/src/stores/developerStore.ts` - 开发者状态管理
  - `packages/frontend/src/services/logService.ts` - 日志服务
  - `packages/backend/src/services/LogService.ts` - 后端日志服务
  - `packages/backend/src/agents/*.ts` - 添加日志记录

## ADDED Requirements

### Requirement: 开发者面板UI
系统 SHALL 提供浮动窗口式的开发者面板，具备以下特性：
- 可拖拽移动位置
- 可调整窗口大小
- 可最小化/展开
- 仅在开发者模式启用时显示

#### Scenario: 打开开发者面板
- **WHEN** 用户开启开发者模式
- **THEN** 显示开发者面板浮动窗口
- **AND** 面板默认位置在右下角

#### Scenario: 拖拽面板
- **WHEN** 用户拖拽面板标题栏
- **THEN** 面板跟随鼠标移动
- **AND** 面板不会移出屏幕边界

### Requirement: 请求监控
系统 SHALL 记录并显示所有LLM API请求和响应，包括：
- 请求时间戳
- 请求的智能体名称
- 目标提供商和模型
- 请求状态（成功/失败）
- 响应时间
- Token消耗（输入/输出）

#### Scenario: 记录LLM请求
- **WHEN** 系统发送LLM API请求
- **THEN** 请求信息记录到日志
- **AND** 在请求监控Tab中实时显示

#### Scenario: 查看请求详情
- **WHEN** 用户点击某条请求记录
- **THEN** 显示完整的请求Prompt和响应内容

### Requirement: 智能体通信监控
系统 SHALL 实时显示智能体之间的消息流，包括：
- 消息发送者和接收者
- 消息类型和动作
- 消息时间戳
- 消息状态

#### Scenario: 显示智能体消息
- **WHEN** 智能体发送或接收消息
- **THEN** 消息信息实时显示在智能体通信Tab
- **AND** 按时间顺序排列

### Requirement: 日志查看
系统 SHALL 提供统一的日志查看功能，支持：
- 多级别日志（DEBUG、INFO、WARN、ERROR）
- 日志来源过滤（前端、后端、智能体）
- 关键词搜索
- 时间范围筛选
- 日志导出（JSON/文本格式）
- 后端日志自动写入文件

#### Scenario: 记录系统日志
- **WHEN** 系统组件执行操作
- **THEN** 操作日志记录到日志服务
- **AND** 包含时间戳、级别、来源、消息

#### Scenario: 过滤日志
- **WHEN** 用户选择日志级别或来源
- **THEN** 只显示符合条件的日志条目

#### Scenario: 导出日志
- **WHEN** 用户点击导出按钮
- **THEN** 日志导出为JSON或文本文件
- **AND** 文件名包含导出时间戳

#### Scenario: 后端日志文件记录
- **WHEN** 后端系统产生日志
- **THEN** 日志自动写入到logs目录下的日志文件
- **AND** 支持按日期分割日志文件

### Requirement: 状态检查
系统 SHALL 提供游戏状态查看和修改功能，包括：
- 角色状态查看/编辑
- 任务列表查看
- 背包物品查看
- 当前场景信息

#### Scenario: 查看游戏状态
- **WHEN** 用户打开状态检查Tab
- **THEN** 显示当前游戏状态树
- **AND** 支持展开/折叠节点

#### Scenario: 修改游戏状态
- **WHEN** 用户编辑某个状态值
- **THEN** 状态更新到对应Store
- **AND** 显示修改成功提示

### Requirement: 智能体日志集成
系统 SHALL 为所有智能体添加日志记录功能

#### Scenario: 智能体操作日志
- **WHEN** 智能体执行初始化、处理消息、发送消息等操作
- **THEN** 记录操作日志到日志服务
- **AND** 包含智能体类型、操作类型、相关数据

## MODIFIED Requirements
无

## REMOVED Requirements
无
