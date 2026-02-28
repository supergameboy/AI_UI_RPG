# AI-RPG Engine 待办事项

本文档记录已规划但尚未完成的功能和需要后续集成的任务。

---

## 一、待后续集成

这些功能已经实现了基础框架，但需要在其他系统完成后进行集成。

### 1.1 开发者工具集成

**相关文件**: 
- `packages/frontend/src/components/developer/RequestMonitor.tsx`
- `packages/frontend/src/components/developer/AgentCommunication.tsx`

**待集成任务**:

| 任务 | 描述 | 依赖 |
|------|------|------|
| LLM请求记录 | 在LLM服务调用时记录请求到developerStore | LLM服务运行 |
| 智能体消息日志 | 在AgentBase中添加消息日志记录 | 智能体系统运行 |
| 请求详情展示 | 显示完整的Prompt和Response | LLM请求记录 |

**实现方式**:
```typescript
// 在 LLMService.ts 中添加
import { useDeveloperStore } from './stores';

async chat(messages: LLMMessage[], options?: LLMChatOptions): Promise<LLMChatResponse> {
  const requestId = generateId();
  const startTime = Date.now();
  
  // 记录请求开始
  useDeveloperStore.getState().addLLMRequest({
    id: requestId,
    timestamp: startTime,
    agentType: options?.agentType || 'unknown',
    provider: this.defaultProvider,
    model: options?.model || 'default',
    status: 'pending',
    duration: 0,
    promptTokens: 0,
    completionTokens: 0,
    prompt: JSON.stringify(messages),
  });
  
  try {
    const response = await this.doChat(messages, options);
    
    // 更新请求记录
    useDeveloperStore.getState().updateLLMRequest(requestId, {
      status: 'success',
      duration: Date.now() - startTime,
      promptTokens: response.usage.prompt_tokens,
      completionTokens: response.usage.completion_tokens,
      response: response.content,
    });
    
    return response;
  } catch (error) {
    // 记录错误
    useDeveloperStore.getState().updateLLMRequest(requestId, {
      status: 'error',
      duration: Date.now() - startTime,
      error: error.message,
    });
    throw error;
  }
}
```

---

### 1.2 智能体系统日志集成

**相关文件**: `packages/backend/src/agents/AgentBase.ts`

**待集成任务**:

| 任务 | 描述 | 状态 |
|------|------|------|
| 消息发送日志 | 记录智能体发送的消息 | 待集成 |
| 消息接收日志 | 记录智能体接收的消息 | 待集成 |
| 状态变更日志 | 记录智能体状态变化 | 待集成 |

**实现方式**:
```typescript
// 在 AgentBase.ts 中添加
import { logService } from '../services/logService';
import { useDeveloperStore } from '../../frontend/src/stores';

async sendMessage(to: AgentType, action: string, payload?: unknown): Promise<void> {
  const message: AgentMessage = {
    id: generateId(),
    from: this.type,
    to,
    action,
    payload,
    timestamp: Date.now(),
    status: 'pending',
  };
  
  // 记录日志
  logService.info('agent', `[${this.type}] Sending message to ${to}`, { action, payload });
  
  // 记录到开发者面板
  useDeveloperStore.getState().addAgentMessage({
    ...message,
    status: 'sent',
  });
  
  await agentCommunication.send(message);
}
```

---

## 二、已规划未完成

这些功能已在项目设计文档中规划，但尚未开始实现。

### 2.1 核心玩法系统

**优先级**: 高

| 系统 | 描述 | 设计文档位置 |
|------|------|--------------|
| 角色创建流程 | 角色属性分配、种族/职业选择 | project_design.md |
| 对话系统 | 与NPC的交互对话 | project_design.md |
| 任务系统 | 任务生成、追踪、完成 | project_design.md |
| 背包系统 | 物品管理、使用、丢弃 | project_design.md |
| 装备系统 | 装备穿戴、卸下、属性加成 | project_design.md |
| 数值系统 | 属性计算、伤害公式 | project_design.md |

### 2.2 UI面板实现

**优先级**: 中

| 面板 | 描述 | 状态 |
|------|------|------|
| CharacterPanel | 角色属性面板 | 框架已创建，内容待实现 |
| InventoryPanel | 背包面板 | 框架已创建，内容待实现 |
| QuestPanel | 任务面板 | 框架已创建，内容待实现 |
| SkillsPanel | 技能面板 | 未创建 |
| MapPanel | 地图面板 | 未创建 |

### 2.3 模板系统

**优先级**: 中

| 功能 | 描述 | 状态 |
|------|------|------|
| 模板管理 | 创建、编辑、删除模板 | 未实现 |
| 世界设定 | 模板中的世界背景设定 | 未实现 |
| 游戏规则 | 模板中的游戏规则配置 | 未实现 |
| 模板市场 | 分享和下载模板 | 未实现 |

### 2.4 测试和优化

**优先级**: 低

| 任务 | 描述 | 状态 |
|------|------|------|
| 单元测试 | 核心服务的单元测试 | 未实现 |
| E2E测试 | 关键流程的端到端测试 | 未实现 |
| 性能优化 | 大数据量下的性能优化 | 未实现 |
| 错误监控 | 生产环境错误监控 | 未实现 |

---

## 三、技术债务

需要重构或改进的现有代码。

### 3.1 类型定义整理

**问题**: 部分类型定义分散在多个文件中

**解决方案**: 
- 将共享类型移至 `packages/shared/src/types/`
- 统一导出和引用

### 3.2 错误处理统一

**问题**: 错误处理方式不统一

**解决方案**:
- 创建统一的错误处理中间件
- 定义标准错误类型
- 前端统一错误提示

### 3.3 API响应格式统一

**问题**: API响应格式不完全一致

**解决方案**:
```typescript
interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  meta?: {
    page?: number;
    total?: number;
  };
}
```

---

## 四、下一步计划

按优先级排序的下一步开发任务：

1. **集成开发者工具日志** - 完善开发者工具的日志记录功能
2. **实现角色创建流程** - 让玩家能够创建角色
3. **实现对话系统** - 与NPC交互
4. **实现任务系统** - 任务生成和追踪
5. **实现背包系统** - 物品管理

---

*文档版本: v1.0*
*创建日期: 2026-02-28*
*最后更新: 2026-02-28*
