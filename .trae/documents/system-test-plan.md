# AI-RPG Engine 系统测试计划

## 测试目标

启动服务器，系统测试当前游戏所有已实现功能，对照设计文档撰写测试报告，并升级版本号。

---

## 一、测试环境准备

### 1.1 安装依赖
```bash
pnpm install
```

### 1.2 构建共享包
```bash
cd packages/shared ;; pnpm run build
```

### 1.3 启动后端服务
```bash
cd packages/backend ;; pnpm run dev
```

### 1.4 启动前端服务
```bash
cd packages/frontend ;; pnpm run dev
```

---

## 二、功能测试清单

### 2.1 基础架构测试

| 测试项 | 测试内容 | 预期结果 | 状态 |
|--------|----------|----------|------|
| 后端启动 | 启动后端服务 | 服务在 6756 端口运行，数据库初始化成功 | ⬜ |
| 前端启动 | 启动前端服务 | Vite 开发服务器运行，页面可访问 | ⬜ |
| 健康检查 | GET /api/health | 返回 `{ status: 'ok' }` | ⬜ |
| 数据库状态 | GET /api/database/status | 返回数据库连接信息 | ⬜ |

### 2.2 存档系统测试

| 测试项 | 测试内容 | 预期结果 | 状态 |
|--------|----------|----------|------|
| 创建存档 | POST /api/saves | 创建成功，返回存档 ID | ⬜ |
| 获取存档列表 | GET /api/saves | 返回分页存档列表 | ⬜ |
| 获取单个存档 | GET /api/saves/:id | 返回存档详情 | ⬜ |
| 更新存档 | PUT /api/saves/:id | 更新成功 | ⬜ |
| 删除存档 | DELETE /api/saves/:id | 删除成功 | ⬜ |
| 存档统计 | GET /api/saves/stats | 返回存档统计数据 | ⬜ |
| 最近存档 | GET /api/saves/recent | 返回最近存档列表 | ⬜ |
| 创建快照 | POST /api/saves/:id/snapshots | 快照创建成功 | ⬜ |
| 获取快照列表 | GET /api/saves/:id/snapshots | 返回快照列表 | ⬜ |

### 2.3 LLM 服务测试

| 测试项 | 测试内容 | 预期结果 | 状态 |
|--------|----------|----------|------|
| 获取 LLM 配置 | GET /api/llm/config | 返回当前配置信息 | ⬜ |
| 获取模型列表 | GET /api/llm/models | 返回可用模型能力 | ⬜ |
| 更新提供商配置 | PUT /api/llm/config | 配置更新成功 | ⬜ |
| 测试连接 | POST /api/llm/test | 测试连接成功（需 API Key） | ⬜ |
| 聊天请求 | POST /api/llm/chat | 返回 AI 响应（需 API Key） | ⬜ |
| 流式聊天 | POST /api/llm/chat/stream | 返回 SSE 流（需 API Key） | ⬜ |

### 2.4 智能体系统测试

| 测试项 | 测试内容 | 预期结果 | 状态 |
|--------|----------|----------|------|
| 获取智能体状态 | GET /api/agents/status | 返回所有智能体状态 | ⬜ |
| 获取智能体配置 | GET /api/agents/config | 返回智能体配置列表 | ⬜ |
| 更新智能体配置 | PUT /api/agents/config/:agentType | 配置更新成功 | ⬜ |
| 智能体初始化 | 检查 12 个智能体是否初始化 | 所有智能体已注册 | ⬜ |

### 2.5 提示词工程测试

| 测试项 | 测试内容 | 预期结果 | 状态 |
|--------|----------|----------|------|
| 获取提示词模板 | GET /api/prompts/:agentType | 返回模板内容 | ⬜ |
| 更新提示词模板 | PUT /api/prompts/:agentType | 更新成功 | ⬜ |
| 测试提示词 | POST /api/prompts/test | 返回测试结果 | ⬜ |
| 获取版本历史 | GET /api/prompts/:agentType/versions | 返回版本列表 | ⬜ |
| 回滚版本 | POST /api/prompts/:agentType/rollback/:version | 回滚成功 | ⬜ |

### 2.6 设置系统测试

| 测试项 | 测试内容 | 预期结果 | 状态 |
|--------|----------|----------|------|
| 获取设置 | GET /api/settings | 返回所有设置 | ⬜ |
| 更新设置 | PUT /api/settings | 设置更新成功 | ⬜ |

### 2.7 前端 UI 测试

| 测试项 | 测试内容 | 预期结果 | 状态 |
|--------|----------|----------|------|
| 主菜单显示 | 访问首页 | 显示主菜单界面 | ⬜ |
| 存档管理器 | 打开存档管理 | 显示存档列表 | ⬜ |
| 设置面板 | 打开设置 | 显示设置选项 | ⬜ |
| LLM 配置弹窗 | 打开 LLM 配置 | 显示配置表单 | ⬜ |
| 开发者面板 | 启用开发者模式 | 显示开发者面板 | ⬜ |
| 请求监控 Tab | 切换到请求监控 | 显示请求列表 | ⬜ |
| 智能体通信 Tab | 切换到智能体通信 | 显示消息流 | ⬜ |
| 日志查看 Tab | 切换到日志查看 | 显示日志列表 | ⬜ |
| 状态检查 Tab | 切换到状态检查 | 显示游戏状态 | ⬜ |
| 提示词编辑器 Tab | 切换到提示词编辑器 | 显示编辑界面 | ⬜ |

---

## 三、对照设计文档检查

### 3.1 已实现功能对照

根据 `development.md` 和 `project_design.md` 对照检查：

#### 第一阶段：基础架构 ✅
- [x] Monorepo 项目结构
- [x] TypeScript 配置
- [x] SQLite 数据库 (sql.js)
- [x] LLM 适配器系统 (DeepSeek, GLM, Kimi, OpenAI)
- [x] 前端 UI 框架 (React 18 + Vite + Zustand)
- [x] 存档系统

#### 第二阶段：智能体系统 ✅
- [x] 智能体基类 (AgentBase)
- [x] 12 个智能体实现
  - [x] CoordinatorAgent (统筹)
  - [x] StoryContextAgent (故事上下文)
  - [x] UIAgent (UI管理)
  - [x] QuestAgent (任务)
  - [x] MapAgent (地图)
  - [x] NPCAgent (NPC/队伍)
  - [x] NumericalAgent (数值)
  - [x] InventoryAgent (背包)
  - [x] SkillAgent (技能)
  - [x] CombatAgent (战斗)
  - [x] DialogueAgent (对话)
  - [x] EventAgent (事件)
- [x] AgentService 服务
- [x] 智能体通信协议
- [x] 智能体配置管理

#### 第三阶段：开发者工具 ✅
- [x] 开发者面板组件
- [x] 请求监控
- [x] 智能体通信监控
- [x] 日志查看
- [x] 状态检查
- [x] 提示词编辑器

#### 提示词工程系统 ✅
- [x] 提示词类型定义
- [x] 12 个提示词模板文件
- [x] 数据库表 (prompt_templates, prompt_versions, prompt_test_results)
- [x] PromptRepository
- [x] PromptService
- [x] API 路由
- [x] 前端编辑器组件

### 3.2 待实现功能

根据设计文档，以下功能尚未实现：

#### 核心玩法 (第三阶段)
- [ ] 角色创建流程
- [ ] 对话系统交互
- [ ] 任务生成和追踪
- [ ] 背包系统 UI
- [ ] 装备系统 UI
- [ ] 数值系统 UI

#### 模板系统
- [ ] 故事模板编辑器
- [ ] 模板解析服务
- [ ] 预设模板

#### 上下文压缩
- [ ] 四层上下文压缩机制
- [ ] 记忆管理优化

#### 其他面板
- [ ] 角色面板
- [ ] 技能面板
- [ ] 装备面板
- [ ] 背包面板
- [ ] 任务面板
- [ ] 地图面板
- [ ] 小地图
- [ ] 队伍状态

---

## 四、测试执行步骤

### 步骤 1: 环境准备
1. 安装依赖: `pnpm install`
2. 构建共享包: `cd packages/shared && pnpm run build`

### 步骤 2: 启动服务
1. 启动后端: `cd packages/backend && pnpm run dev`
2. 启动前端: `cd packages/frontend && pnpm run dev`

### 步骤 3: API 测试
使用 Playwright MCP 工具或 curl 测试各 API 端点

### 步骤 4: UI 测试
使用 Playwright MCP 工具访问前端页面，测试各组件

### 步骤 5: 功能验证
对照设计文档，验证已实现功能的完整性

### 步骤 6: 撰写报告
整理测试结果，撰写测试报告

### 步骤 7: 版本升级
根据测试结果，更新版本号

---

## 五、版本升级建议

当前版本: `0.1.0`

建议升级到: `0.2.0`

理由:
- 完成了智能体系统 (12 个智能体)
- 完成了开发者工具系统
- 完成了提示词工程系统
- 数据库结构已完善
- API 路由已完善

---

## 六、测试报告模板

测试完成后将生成以下报告:

1. **测试概览**: 测试时间、环境、范围
2. **测试结果**: 各功能模块测试通过/失败情况
3. **问题清单**: 发现的问题及严重程度
4. **功能完成度**: 对照设计文档的完成百分比
5. **版本建议**: 版本号升级建议
6. **下一步计划**: 待实现功能优先级

---

*计划创建时间: 2026-02-28*
