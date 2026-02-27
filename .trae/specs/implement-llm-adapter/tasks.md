# Tasks

- [x] Task 1: 创建LLM类型定义
  - [x] SubTask 1.1: 创建Message接口
  - [x] SubTask 1.2: 创建ChatOptions和ChatResponse接口
  - [x] SubTask 1.3: 创建ModelCapabilities接口
  - [x] SubTask 1.4: 创建LLMAdapter接口
  - [x] SubTask 1.5: 导出类型到shared包

- [x] Task 2: 创建LLMAdapter基类
  - [x] SubTask 2.1: 创建BaseLLMAdapter抽象类
  - [x] SubTask 2.2: 实现通用错误处理
  - [x] SubTask 2.3: 实现重试机制
  - [x] SubTask 2.4: 实现Token统计

- [x] Task 3: 实现DeepSeek适配器
  - [x] SubTask 3.1: 创建DeepSeekAdapter类
  - [x] SubTask 3.2: 实现initialize方法
  - [x] SubTask 3.3: 实现chat方法
  - [x] SubTask 3.4: 实现chatStream流式响应
  - [x] SubTask 3.5: 实现getCapabilities方法

- [x] Task 4: 实现GLM适配器
  - [x] SubTask 4.1: 创建GLMAdapter类
  - [x] SubTask 4.2: 实现initialize方法
  - [x] SubTask 4.3: 实现chat方法
  - [x] SubTask 4.4: 实现chatStream流式响应
  - [x] SubTask 4.5: 实现getCapabilities方法

- [x] Task 5: 实现Kimi适配器
  - [x] SubTask 5.1: 创建KimiAdapter类
  - [x] SubTask 5.2: 实现initialize方法
  - [x] SubTask 5.3: 实现chat方法
  - [x] SubTask 5.4: 实现chatStream流式响应
  - [x] SubTask 5.5: 实现getCapabilities方法

- [x] Task 6: 创建LLM服务管理器
  - [x] SubTask 6.1: 创建LLMService类
  - [x] SubTask 6.2: 实现适配器注册和获取
  - [x] SubTask 6.3: 实现默认适配器设置
  - [x] SubTask 6.4: 实现智能体模型分配
  - [x] SubTask 6.5: 实现Token使用统计

- [x] Task 7: 添加API端点
  - [x] SubTask 7.1: 创建LLM配置端点(/api/llm/config)
  - [x] SubTask 7.2: 创建模型列表端点(/api/llm/models)
  - [x] SubTask 7.3: 创建测试连接端点(/api/llm/test)
  - [x] SubTask 7.4: 创建对话端点(/api/llm/chat)

- [x] Task 8: 测试验证
  - [x] SubTask 8.1: 测试各适配器初始化
  - [x] SubTask 8.2: 测试API端点响应

# Task Dependencies
- [Task 2] depends on [Task 1]
- [Task 3] depends on [Task 2]
- [Task 4] depends on [Task 2]
- [Task 5] depends on [Task 2]
- [Task 6] depends on [Task 3, Task 4, Task 5]
- [Task 7] depends on [Task 6]
- [Task 8] depends on [Task 7]
