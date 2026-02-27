# LLM适配器 Spec

## Why
项目需要统一的LLM调用接口来支持多种AI模型（DeepSeek、GLM、Kimi等）。通过适配器模式，可以灵活切换不同的模型提供商，同时为智能体系统提供标准化的调用方式。

## What Changes
- 创建LLMAdapter统一接口
- 实现DeepSeek适配器
- 实现GLM适配器
- 实现Kimi适配器
- 创建LLM服务管理器
- 添加流式响应支持
- 添加API密钥管理

## Impact
- Affected specs: init-project, setup-database
- Affected code: packages/backend/src/services/llm, packages/shared/src/types

## ADDED Requirements

### Requirement: LLM适配器接口
系统 SHALL 提供统一的LLMAdapter接口。

#### Scenario: 接口定义
- **WHEN** 实现新的LLM适配器
- **THEN** 必须实现以下方法：
  - `initialize(config)`: 初始化配置
  - `chat(messages, options)`: 发送对话请求
  - `chatStream(messages, options)`: 流式响应
  - `getCapabilities()`: 获取模型能力

#### Scenario: 消息格式
- **WHEN** 调用chat方法
- **THEN** 消息格式为：
  ```typescript
  interface Message {
    role: 'system' | 'user' | 'assistant';
    content: string;
  }
  ```

### Requirement: DeepSeek适配器
系统 SHALL 提供DeepSeek API适配器。

#### Scenario: 初始化
- **WHEN** 提供API密钥
- **THEN** 成功初始化DeepSeek适配器
- **AND** 支持模型：deepseek-chat, deepseek-reasoner

#### Scenario: 对话请求
- **WHEN** 调用chat方法
- **THEN** 返回ChatResponse包含：
  - content: 响应内容
  - usage: Token使用量
  - model: 使用的模型
  - finishReason: 完成原因

#### Scenario: 流式响应
- **WHEN** 调用chatStream方法
- **THEN** 返回AsyncIterable<StreamChunk>
- **AND** 每个chunk包含delta内容和done状态

### Requirement: GLM适配器
系统 SHALL 提供智谱GLM API适配器。

#### Scenario: 初始化
- **WHEN** 提供API密钥
- **THEN** 成功初始化GLM适配器
- **AND** 支持模型：glm-4, glm-4-flash

#### Scenario: 长上下文支持
- **WHEN** 使用glm-4模型
- **THEN** 支持128K上下文窗口
- **AND** 适合长篇故事生成

### Requirement: Kimi适配器
系统 SHALL 提供Moonshot Kimi API适配器。

#### Scenario: 初始化
- **WHEN** 提供API密钥
- **THEN** 成功初始化Kimi适配器
- **AND** 支持模型：moonshot-v1-8k, moonshot-v1-32k, moonshot-v1-128k

#### Scenario: 超长上下文
- **WHEN** 使用moonshot-v1-128k模型
- **THEN** 支持128K上下文窗口
- **AND** 适合长篇故事和大量历史对话

### Requirement: LLM服务管理器
系统 SHALL 提供LLMService统一管理多个适配器。

#### Scenario: 适配器注册
- **WHEN** 系统启动时
- **THEN** 自动注册所有已配置的适配器
- **AND** 根据设置选择默认适配器

#### Scenario: 智能体模型分配
- **WHEN** 不同智能体需要使用不同模型
- **THEN** 可为每个智能体指定专用模型
- **AND** 未指定的使用默认模型

#### Scenario: 错误处理
- **WHEN** API调用失败
- **THEN** 返回详细错误信息
- **AND** 支持重试机制

### Requirement: API密钥管理
系统 SHALL 安全管理API密钥。

#### Scenario: 密钥存储
- **WHEN** 用户配置API密钥
- **THEN** 密钥存储在本地设置中
- **AND** 不在日志中明文显示

#### Scenario: 密钥验证
- **WHEN** 初始化适配器
- **THEN** 验证密钥格式和有效性
- **AND** 返回验证结果

### Requirement: 模型能力查询
系统 SHALL 提供模型能力查询功能。

#### Scenario: 能力查询
- **WHEN** 调用getCapabilities方法
- **THEN** 返回：
  - maxTokens: 最大输出Token
  - supportsStreaming: 是否支持流式
  - supportsFunctionCall: 是否支持函数调用
  - supportsVision: 是否支持视觉
  - contextWindow: 上下文窗口大小

### Requirement: Token统计
系统 SHALL 提供Token使用统计。

#### Scenario: 使用统计
- **WHEN** 每次API调用完成
- **THEN** 记录prompt_tokens和completion_tokens
- **AND** 累计到会话统计中
