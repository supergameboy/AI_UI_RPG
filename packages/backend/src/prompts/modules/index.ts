/**
 * 提示词模块系统
 * 提供模块加载、编译、组合和变量注入功能
 */

import type {
  PromptModule,
  ModuleVariable,
  CompiledModule,
  ModuleRegistry,
  InjectOptions,
} from './types';
import {
  roleModules,
  getRoleModule,
  getAllRoleModules,
} from './role';
import {
  toolSchemaModules,
  getToolSchemaModule,
  getAllToolSchemaModules,
} from './toolSchema';
import {
  contextModules,
  getContextModule,
  getAllContextModules,
} from './context';
import {
  outputModules,
  getOutputModule,
  getAllOutputModules,
} from './output';
import {
  dynamicUIModules,
  getDynamicUIModule,
  getAllDynamicUIModules,
} from './dynamic-ui';

/**
 * 变量模式匹配正则
 */
const VARIABLE_PATTERN = /\{\{(\w+)\}\}/g;
const CONDITIONAL_PATTERN = /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g;
const EACH_PATTERN = /\{\{#each\s+(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g;

/**
 * 模块注册表
 */
class ModuleRegistryImpl implements ModuleRegistry {
  private modules: Map<string, PromptModule> = new Map();

  constructor() {
    // 注册所有内置模块
    this.registerBuiltinModules();
  }

  private registerBuiltinModules(): void {
    // 注册角色模块
    for (const module of roleModules) {
      this.modules.set(module.name, module);
    }
    // 注册 Tool Schema 模块
    for (const module of toolSchemaModules) {
      this.modules.set(module.name, module);
    }
    // 注册上下文模块
    for (const module of contextModules) {
      this.modules.set(module.name, module);
    }
    // 注册输出格式模块
    for (const module of outputModules) {
      this.modules.set(module.name, module);
    }
    // 注册动态 UI 模块
    for (const module of dynamicUIModules) {
      this.modules.set(module.name, module);
    }
  }

  register(module: PromptModule): void {
    if (this.modules.has(module.name)) {
      console.warn(`[ModuleRegistry] Module '${module.name}' already exists, overwriting`);
    }
    this.modules.set(module.name, module);
  }

  get(name: string): PromptModule | undefined {
    return this.modules.get(name);
  }

  getAll(): PromptModule[] {
    return Array.from(this.modules.values());
  }

  getByCategory(category: PromptModule['category']): PromptModule[] {
    return this.getAll().filter(m => m.category === category);
  }

  has(name: string): boolean {
    return this.modules.has(name);
  }

  remove(name: string): boolean {
    return this.modules.delete(name);
  }
}

/**
 * 全局模块注册表实例
 */
let globalRegistry: ModuleRegistryImpl | null = null;

/**
 * 获取模块注册表实例
 */
export function getModuleRegistry(): ModuleRegistry {
  if (!globalRegistry) {
    globalRegistry = new ModuleRegistryImpl();
  }
  return globalRegistry;
}

/**
 * 加载模块
 * @param name 模块名称
 * @returns 模块对象，不存在则返回 undefined
 */
export function loadModule(name: string): PromptModule | undefined {
  const registry = getModuleRegistry();
  return registry.get(name);
}

/**
 * 注入变量到内容中
 * @param content 内容模板
 * @param variables 变量对象
 * @param options 注入选项
 * @returns 注入变量后的内容
 */
export function injectVariables(
  content: string,
  variables: Record<string, unknown>,
  options: InjectOptions = {}
): string {
  const { strict = false, formatter } = options;
  let result = content;

  // 处理条件块 {{#if variable}}...{{/if}}
  result = processConditionals(result, variables);

  // 处理循环块 {{#each variable}}...{{/each}}
  result = processEach(result, variables);

  // 处理简单变量 {{variable}}
  result = result.replace(VARIABLE_PATTERN, (match, varName) => {
    const value = variables[varName];

    if (value === undefined || value === null) {
      if (strict) {
        throw new Error(`Required variable '${varName}' is missing`);
      }
      return match; // 保留原始占位符
    }

    return formatValue(value, formatter);
  });

  return result;
}

/**
 * 处理条件块
 */
function processConditionals(
  content: string,
  variables: Record<string, unknown>
): string {
  return content.replace(CONDITIONAL_PATTERN, (_match: string, varName: string, innerContent: string) => {
    const value = variables[varName];
    const isTruthy = Boolean(value) && 
      (Array.isArray(value) ? value.length > 0 : true);

    if (isTruthy) {
      // 移除 {{else}} 之后的内容（如果有）
      return innerContent.split(/\{\{else\}\}/)[0];
    } else {
      // 如果有 {{else}}，返回 else 部分
      const parts = innerContent.split(/\{\{else\}\}/);
      return parts.length > 1 ? parts[1] : '';
    }
  });
}

/**
 * 处理循环块
 */
function processEach(
  content: string,
  variables: Record<string, unknown>
): string {
  return content.replace(EACH_PATTERN, (_match: string, varName: string, innerContent: string) => {
    const value = variables[varName];

    if (!Array.isArray(value)) {
      return '';
    }

    return value.map((item, index) => {
      let itemContent = innerContent;

      // 处理 {{this}} 引用
      itemContent = itemContent.replace(/\{\{this\}\}/g, formatValue(item));

      // 处理 {{this.property}} 引用
      if (typeof item === 'object' && item !== null) {
        itemContent = itemContent.replace(
          /\{\{this\.(\w+)\}\}/g,
          (_: string, prop: string) => formatValue((item as Record<string, unknown>)[prop])
        );
      }

      // 处理 {{@index}} 引用
      itemContent = itemContent.replace(/\{\{@index\}\}/g, String(index));

      // 处理 {{@key}} 引用（用于对象）
      itemContent = itemContent.replace(/\{\{@key\}\}/g, String(index));

      // 处理 {{@last}} 条件
      const isLast = index === value.length - 1;
      itemContent = itemContent.replace(
        /\{\{#unless\s+@last\}\}([\s\S]*?)\{\{\/unless\}\}/g,
        (_: string, inner: string) => isLast ? '' : inner
      );

      return itemContent;
    }).join('');
  });
}

/**
 * 格式化值
 */
function formatValue(
  value: unknown,
  formatter?: (value: unknown, type: string) => string
): string {
  if (formatter) {
    const type = Array.isArray(value) ? 'array' : typeof value;
    return formatter(value, type);
  }

  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2);
  }

  return String(value);
}

/**
 * 编译模块
 * @param module 模块对象
 * @param variables 变量对象
 * @param options 注入选项
 * @returns 编译后的模块
 */
export function compileModule(
  module: PromptModule,
  variables: Record<string, unknown>,
  options: InjectOptions = {}
): CompiledModule {
  // 合并默认值
  const mergedVariables = { ...variables };

  if (module.variables) {
    for (const varDef of module.variables) {
      if (mergedVariables[varDef.name] === undefined && varDef.default !== undefined && options.useDefaults !== false) {
        mergedVariables[varDef.name] = varDef.default;
      }

      // 验证必需变量
      if (varDef.required && mergedVariables[varDef.name] === undefined) {
        if (options.strict !== false) {
          throw new Error(`Required variable '${varDef.name}' is missing for module '${module.name}'`);
        }
      }
    }
  }

  const content = injectVariables(module.content, mergedVariables, options);

  return {
    name: module.name,
    content,
    injectedVariables: mergedVariables,
    compiledAt: Date.now(),
  };
}

/**
 * 组合多个模块
 * @param modules 模块列表
 * @param separator 模块间的分隔符
 * @returns 组合后的内容
 */
export function combineModules(
  modules: PromptModule[],
  separator: string = '\n\n---\n\n'
): string {
  return modules
    .map(m => m.content)
    .filter(content => content.trim().length > 0)
    .join(separator);
}

/**
 * 组合并编译多个模块
 * @param moduleNames 模块名称列表
 * @param variables 变量对象
 * @param options 选项
 * @returns 编译后的内容
 */
export function combineAndCompile(
  moduleNames: string[],
  variables: Record<string, unknown> = {},
  options: {
    separator?: string;
    injectOptions?: InjectOptions;
  } = {}
): string {
  const registry = getModuleRegistry();
  const compiledModules: CompiledModule[] = [];

  for (const name of moduleNames) {
    const module = registry.get(name);
    if (!module) {
      console.warn(`[combineAndCompile] Module '${name}' not found, skipping`);
      continue;
    }

    const compiled = compileModule(module, variables, options.injectOptions);
    compiledModules.push(compiled);
  }

  return compiledModules
    .map(m => m.content)
    .filter(content => content.trim().length > 0)
    .join(options.separator ?? '\n\n---\n\n');
}

/**
 * 构建完整的系统提示词
 * @param config 配置对象
 * @returns 完整的系统提示词
 */
export function buildSystemPrompt(config: {
  roleModule?: string;
  toolModules?: string[];
  contextModules?: string[];
  outputModule?: string;
  variables?: Record<string, unknown>;
  customContent?: string;
}): string {
  const parts: string[] = [];

  // 添加角色模块
  if (config.roleModule) {
    const module = loadModule(config.roleModule);
    if (module) {
      const compiled = compileModule(module, config.variables ?? {});
      parts.push(compiled.content);
    }
  }

  // 添加上下文模块
  if (config.contextModules && config.contextModules.length > 0) {
    const contextContent = combineAndCompile(
      config.contextModules,
      config.variables ?? {}
    );
    if (contextContent) {
      parts.push(contextContent);
    }
  }

  // 添加 Tool 模块
  if (config.toolModules && config.toolModules.length > 0) {
    const toolContent = combineAndCompile(
      config.toolModules,
      config.variables ?? {}
    );
    if (toolContent) {
      parts.push(toolContent);
    }
  }

  // 添加输出格式模块
  if (config.outputModule) {
    const module = loadModule(config.outputModule);
    if (module) {
      const compiled = compileModule(module, config.variables ?? {});
      parts.push(compiled.content);
    }
  }

  // 添加自定义内容
  if (config.customContent) {
    parts.push(config.customContent);
  }

  return parts.join('\n\n---\n\n');
}

// 导出所有模块和函数
export {
  // 类型
  type PromptModule,
  type ModuleVariable,
  type CompiledModule,
  type ModuleRegistry,
  type InjectOptions,
  // 角色模块
  roleModules,
  getRoleModule,
  getAllRoleModules,
  // Tool Schema 模块
  toolSchemaModules,
  getToolSchemaModule,
  getAllToolSchemaModules,
  // 上下文模块
  contextModules,
  getContextModule,
  getAllContextModules,
  // 输出格式模块
  outputModules,
  getOutputModule,
  getAllOutputModules,
  // 动态 UI 模块
  dynamicUIModules,
  getDynamicUIModule,
  getAllDynamicUIModules,
};
