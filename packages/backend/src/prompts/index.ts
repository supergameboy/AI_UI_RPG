/**
 * 提示词模块系统
 * 
 * 提供模块化的提示词管理功能，包括：
 * - 角色定义模块
 * - Tool Schema 模块
 * - 上下文模板模块
 * - 输出格式模块
 * 
 * @example
 * ```typescript
 * import {
 *   loadModule,
 *   compileModule,
 *   combineModules,
 *   buildSystemPrompt
 * } from './prompts';
 * 
 * // 加载单个模块
 * const roleModule = loadModule('role_coordinator');
 * 
 * // 编译模块（注入变量）
 * const compiled = compileModule(roleModule!, {
 *   agentName: 'Coordinator',
 *   role: '核心统筹智能体',
 *   capabilities: ['意图分析', '任务分配']
 * });
 * 
 * // 组合多个模块
 * const combined = combineModules([roleModule, contextModule, outputModule]);
 * 
 * // 构建完整系统提示词
 * const systemPrompt = buildSystemPrompt({
 *   roleModule: 'role_coordinator',
 *   contextModules: ['context_player', 'context_scene'],
 *   outputModule: 'output_json_format',
 *   variables: { playerName: 'Hero' }
 * });
 * ```
 */

// 导出类型定义
export type {
  PromptModule,
  ModuleVariable,
  CompiledModule,
  ModuleRegistry,
  InjectOptions,
  ModuleComposition,
} from './modules/types';

// 导出核心功能
export {
  // 模块管理
  getModuleRegistry,
  loadModule,
  compileModule,
  combineModules,
  combineAndCompile,
  buildSystemPrompt,
  injectVariables,
  
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
} from './modules';

// 导出具体模块（可选，方便直接导入）
export { gameMasterRole, narratorRole, coordinatorRole, dialogueRole, combatRole } from './modules/role';
export { toolListTemplate, toolCallFormat, toolErrorHandling } from './modules/toolSchema';
export { playerContextTemplate, sceneContextTemplate, historyContextTemplate } from './modules/context';
export { jsonOutputFormat, thinkingFormat, structuredResponseFormat } from './modules/output';
