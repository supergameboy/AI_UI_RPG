# AI-UI-RPG Engine

AI驱动的通用角色扮演游戏引擎

## 项目简介

AI-RPG Engine 是一个基于大语言模型(LLM)的通用RPG游戏框架，支持玩家通过AI动态生成故事内容，提供沉浸式的角色扮演体验。
项目由TRAE IDE开发，采用GLM-5模型作为代码编写模型。

## 技术栈

- **前端**: React 18 + TypeScript + Vite
- **后端**: Node.js + Express + TypeScript
- **数据库**: SQLite
- **AI接口**: DeepSeek / GLM / Kimi (统一适配器)

## 项目结构

```
ai-rpg-engine/
├── packages/
│   ├── frontend/     # React前端项目
│   │   └── src/
│   │       ├── components/   # UI组件
│   │       ├── stores/       # 状态管理 (Zustand)
│   │       └── services/     # API服务
│   ├── backend/      # Node.js后端项目
│   │   └── src/
│   │       ├── agents/       # 智能体系统
│   │       ├── services/     # 业务服务
│   │       └── routes/       # API路由
│   └── shared/       # 共享类型定义
├── docs/             # 项目文档
└── package.json      # 根项目配置
```

## 文档索引

| 文档 | 描述 |
|------|------|
| [项目设计文档](./docs/project_design.md) | 整体架构设计和技术选型 |
| [智能体系统架构](./docs/agent-architecture.md) | 智能体系统详细设计、数据流转、AI调用时机 |
| [开发进度](./docs/development.md) | 已完成功能列表和实现细节 |
| [待办事项](./docs/todo.md) | 开发计划和任务列表 |

## 快速开始

### 环境要求

- Node.js >= 18.0.0
- pnpm >= 8.0.0

### 安装依赖

```bash
pnpm install
```

### 开发模式

```bash
pnpm dev
```

### 构建

```bash
pnpm build
```

## 开发指南

详细的项目设计文档请参阅 [docs/project_design.md](./docs/project_design.md)

## 开源协议

MIT License
