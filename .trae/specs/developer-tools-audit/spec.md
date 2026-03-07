# 开发者工具与前端布局审计报告

## Why
用户报告了多个开发者工具问题：
1. 开发者工具中一个请求记录显示三次
2. 开发者工具智能体标签页无记录
3. 开发者工具的工具状态监控无调用记录
4. 日志文件中存在大量错误和警告
5. 前端面板长度影响页面高度，缺乏响应式布局

## What Changes
- 修复 WebSocket 消息重复订阅导致的请求记录重复问题
- 修复智能体消息未正确广播到前端的问题
- 修复工具状态监控数据不更新的问题
- 清理前端 React key 警告错误
- 实现前端响应式布局，固定游戏页面高度

## Impact
- Affected specs: 开发者工具、前端布局
- Affected code:
  - `packages/frontend/src/stores/developerStore.ts`
  - `packages/frontend/src/components/developer/RequestMonitor.tsx`
  - `packages/frontend/src/components/developer/AgentCommunication.tsx`
  - `packages/frontend/src/components/ToolStatusPanel/ToolStatusPanel.tsx`
  - `packages/backend/src/services/DeveloperLogService.ts`
  - `packages/backend/src/services/WebSocketService.ts`
  - `packages/frontend/src/components/layout/GameLayout.module.css`
  - `packages/frontend/src/styles/global.css`

---

## ADDED Requirements

### Requirement: 开发者工具请求记录去重
系统应确保每个 LLM 请求只在前端显示一次。

#### Scenario: 单次请求单次显示
- **WHEN** 后端发起一次 LLM 请求
- **THEN** 前端开发者工具的请求列表中只显示一条记录

### Requirement: 智能体消息正确显示
系统应正确记录并显示智能体之间的通信消息。

#### Scenario: 智能体消息广播
- **WHEN** 智能体发送或接收消息
- **THEN** 消息应通过 WebSocket 广播到前端
- **AND** 前端开发者工具的智能体标签页应显示该消息

### Requirement: 工具状态实时更新
系统应正确跟踪并显示工具的调用状态。

#### Scenario: 工具调用状态更新
- **WHEN** 工具被调用
- **THEN** 工具的 `callCount` 应增加
- **AND** 前端工具状态面板应显示更新后的数据

### Requirement: 前端响应式布局
所有前端界面应具有响应式布局，面板长度不应影响页面整体高度。

#### Scenario: 面板展开不影响页面高度
- **WHEN** 用户展开右侧面板
- **THEN** 游戏页面高度应保持固定
- **AND** 面板内容应可滚动

---

## MODIFIED Requirements

### Requirement: WebSocket 连接管理
WebSocket 连接应正确管理订阅，避免重复订阅。

**原问题**: `developerStore.ts` 中的 `connectWebSocket` 方法可能被多次调用，导致重复订阅。

### Requirement: 日志系统错误处理
前端应正确处理 React 渲染警告，避免控制台错误。

**原问题**: 日志文件显示大量 `warnOnInvalidKey` 错误，表明列表渲染缺少 key 属性。

---

## 审计发现详情

### 1. 请求记录重复问题 (高优先级)

**问题定位**:
- 文件: `packages/frontend/src/stores/developerStore.ts`
- 代码行: 171-186

**根因分析**:
```typescript
connectWebSocket: () => {
  websocketService.subscribe((message) => {
    if (message.type === 'llm_request') {
      const log = message.payload as LLMRequestLog;
      get().addLLMRequest(convertLLMRequestLog(log));
    }
    // ...
  });
  websocketService.connect();
}
```

问题:
1. `subscribe` 方法每次调用都会添加新的监听器
2. 如果 `connectWebSocket` 被多次调用（如组件重新渲染），会创建多个订阅
3. 同一条消息会被多个监听器处理，导致重复记录

**解决方案**:
- 添加订阅状态检查，避免重复订阅
- 或在订阅前取消之前的订阅

### 2. 智能体消息无记录问题 (高优先级)

**问题定位**:
- 后端: `packages/backend/src/services/DeveloperLogService.ts` (第 38-52 行)
- 前端: `packages/frontend/src/stores/developerStore.ts` (第 179-181 行)

**根因分析**:
后端 `addAgentMessage` 方法正确调用了 `broadcastAgentMessage`，但前端可能未正确处理：

```typescript
// 前端 developerStore.ts
} else if (message.type === 'agent_message') {
  const log = message.payload as AgentMessageLog;
  get().addAgentMessage(convertAgentMessageLog(log));
}
```

可能原因:
1. WebSocket 连接未建立或已断开
2. 消息类型不匹配
3. 转换函数 `convertAgentMessageLog` 有问题

**需要验证**:
- 检查 WebSocket 连接状态
- 检查消息格式是否匹配

### 3. 工具状态监控无调用记录 (中优先级)

**问题定位**:
- 后端: `packages/backend/src/tools/ToolBase.ts` (第 172-186 行)
- 前端: `packages/frontend/src/components/ToolStatusPanel/ToolStatusPanel.tsx`
- API: `packages/backend/src/routes/tools.ts`

**根因分析**:
后端 `ToolBase.updateStatus` 方法正确更新了 `callCount`：
```typescript
protected updateStatus(success: boolean, duration: number): void {
  this.status.lastCall = Date.now();
  this.status.callCount++;
  // ...
}
```

前端通过轮询获取状态：
```typescript
// ToolStatusPanel.tsx
useEffect(() => {
  if (autoRefresh) {
    intervalRef.current = setInterval(() => {
      storeRef.current.fetchTools();
    }, refreshInterval);
  }
}, [autoRefresh, refreshInterval]);
```

可能原因:
1. 工具未被调用（业务逻辑问题）
2. 轮询间隔过长
3. API 返回数据格式问题

### 4. 日志错误和警告 (中优先级)

**问题定位**:
- 日志文件: `localhost-1772902483743.log`
- 错误模式: `error @ chunk-FDCL5M4P.js` 和 `warnOnInvalidKey`

**根因分析**:
这是 React 的 key 警告，通常由以下代码模式引起：
```tsx
// 错误示例
{items.map((item) => <div>{item.name}</div>)}

// 正确示例
{items.map((item) => <div key={item.id}>{item.name}</div>)}
```

**需要检查的文件**:
- `RequestMonitor.tsx` - 请求列表渲染
- `AgentCommunication.tsx` - 消息列表渲染
- 其他使用 `.map()` 的组件

### 5. 前端响应式布局问题 (中优先级)

**问题定位**:
- `packages/frontend/src/components/layout/GameLayout.module.css`
- `packages/frontend/src/styles/global.css`

**根因分析**:
```css
/* GameLayout.module.css */
.layout {
  min-height: 100vh;  /* 问题：使用 min-height 会随内容增长 */
}

/* PanelContainer.module.css */
.container {
  flex-shrink: 0;  /* 问题：面板不收缩，可能撑大容器 */
}
```

**解决方案**:
- 使用 `height: 100vh` 替代 `min-height: 100vh`
- 为 `.main` 区域设置 `overflow: hidden`
- 为面板内容设置 `overflow: auto`

---

## 技术债务清单

### 高优先级
1. **WebSocket 重复订阅** - 导致请求记录重复
2. **智能体消息广播** - 可能存在消息丢失

### 中优先级
3. **React key 警告** - 多个列表渲染缺少 key
4. **响应式布局** - 面板影响页面高度
5. **工具状态轮询** - 可能需要更频繁的更新

### 低优先级
6. **console.log 使用** - 应统一使用 gameLog
7. **魔法数字** - 轮询间隔等应提取为常量

---

## 异常设计识别

1. **WebSocket 订阅模式**: 当前设计允许无限添加订阅者，应限制为单例模式
2. **状态同步**: 前端依赖轮询获取工具状态，可考虑使用 WebSocket 推送
3. **日志格式**: 前端日志和后端日志格式不完全一致

---

## 占位符/模拟逻辑识别

暂未发现明显的占位符或模拟逻辑实现。
