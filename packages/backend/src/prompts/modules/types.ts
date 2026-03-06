/**
 * 提示词模块类型定义
 */

export interface PromptModule {
  /** 模块名称 */
  name: string;
  /** 模块描述 */
  description: string;
  /** 模块内容模板 */
  content: string;
  /** 支持的变量列表 */
  variables?: ModuleVariable[];
  /** 模块分类 */
  category?: 'role' | 'tool' | 'context' | 'output' | 'custom';
  /** 模块版本 */
  version?: string;
}

export interface ModuleVariable {
  /** 变量名 */
  name: string;
  /** 变量类型 */
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  /** 是否必需 */
  required: boolean;
  /** 默认值 */
  default?: unknown;
  /** 变量描述 */
  description: string;
  /** 验证规则 */
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    enum?: string[];
  };
}

export interface CompiledModule {
  /** 模块名称 */
  name: string;
  /** 编译后的内容 */
  content: string;
  /** 注入的变量 */
  injectedVariables: Record<string, unknown>;
  /** 编译时间戳 */
  compiledAt: number;
}

export interface ModuleComposition {
  /** 组合名称 */
  name: string;
  /** 包含的模块列表 */
  modules: string[];
  /** 模块间的分隔符 */
  separator?: string;
  /** 组合描述 */
  description?: string;
}

/**
 * 模块注册表接口
 */
export interface ModuleRegistry {
  /** 注册模块 */
  register(module: PromptModule): void;
  /** 获取模块 */
  get(name: string): PromptModule | undefined;
  /** 获取所有模块 */
  getAll(): PromptModule[];
  /** 按分类获取模块 */
  getByCategory(category: PromptModule['category']): PromptModule[];
  /** 检查模块是否存在 */
  has(name: string): boolean;
  /** 移除模块 */
  remove(name: string): boolean;
}

/**
 * 变量注入选项
 */
export interface InjectOptions {
  /** 是否严格模式（缺少必需变量时抛出错误） */
  strict?: boolean;
  /** 是否使用默认值 */
  useDefaults?: boolean;
  /** 自定义变量格式化函数 */
  formatter?: (value: unknown, type: string) => string;
}
