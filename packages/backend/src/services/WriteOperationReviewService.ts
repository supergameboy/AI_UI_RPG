import { ToolType, TOOL_WRITE_METHODS } from '@ai-rpg/shared';
import { gameLog } from './GameLogService';

/**
 * 违规类型
 */
export type ViolationType = 'permission' | 'validation' | 'conflict' | 'constraint';

/**
 * 违规严重程度
 */
export type ViolationSeverity = 'error' | 'warning';

/**
 * 违规信息
 */
export interface Violation {
  type: ViolationType;
  message: string;
  field?: string;
  severity: ViolationSeverity;
}

/**
 * 写操作上下文
 */
export interface WriteOperationContext {
  saveId: string;
  characterId?: string;
  agentId: string;
}

/**
 * 写操作
 */
export interface WriteOperation {
  toolType: ToolType;
  method: string;
  params: Record<string, unknown>;
  context: WriteOperationContext;
}

/**
 * 审核结果
 */
export interface ReviewResult {
  approved: boolean;
  operation: WriteOperation;
  violations: Violation[];
  warnings: string[];
  modifiedParams?: Record<string, unknown>;
}

/**
 * 审核规则
 */
export interface ReviewRule {
  id: string;
  name: string;
  description: string;
  check: (operation: WriteOperation) => boolean | Violation;
  priority: number;
  enabled: boolean;
}

/**
 * 审核日志条目
 */
export interface ReviewLogEntry {
  id: string;
  timestamp: number;
  operation: WriteOperation;
  result: ReviewResult;
  duration: number;
}

/**
 * 数值范围约束配置
 */
interface RangeConstraint {
  min?: number;
  max?: number;
}

/**
 * 字段验证配置
 */
interface FieldValidation {
  required?: boolean;
  type?: string;
  range?: RangeConstraint;
  custom?: (value: unknown, operation: WriteOperation) => boolean | Violation;
}

/**
 * 工具方法验证配置
 */
interface MethodValidation {
  fields: Record<string, FieldValidation>;
}

/**
 * 审核历史查询选项
 */
export interface ReviewHistoryOptions {
  saveId?: string;
  agentId?: string;
  approved?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * 写操作审核服务
 * 负责审核 Agent 发起的写操作请求，确保操作合法、安全
 */
export class WriteOperationReviewService {
  private rules: Map<string, ReviewRule> = new Map();
  private reviewHistory: ReviewLogEntry[] = [];
  private maxHistorySize: number = 1000;
  private methodValidations: Map<ToolType, Map<string, MethodValidation>> = new Map();

  constructor() {
    this.initializeBuiltInRules();
    this.initializeMethodValidations();
  }

  /**
   * 审核单个写操作
   */
  async reviewOperation(operation: WriteOperation): Promise<ReviewResult> {
    const startTime = Date.now();
    const violations: Violation[] = [];
    const warnings: string[] = [];
    let modifiedParams: Record<string, unknown> | undefined;

    // 1. 检查是否为写操作
    if (!this.isWriteOperation(operation.toolType, operation.method)) {
      violations.push({
        type: 'permission',
        message: `方法 ${operation.method} 不是 ${operation.toolType} 的写操作方法`,
        severity: 'error',
      });
    }

    // 2. 执行所有启用的规则检查（按优先级排序）
    const sortedRules = Array.from(this.rules.values())
      .filter((rule) => rule.enabled)
      .sort((a, b) => b.priority - a.priority);

    for (const rule of sortedRules) {
      try {
        const result = rule.check(operation);
        if (result !== true) {
          const violation = typeof result === 'object' ? result : {
            type: 'validation' as ViolationType,
            message: `规则 ${rule.name} 检查失败`,
            severity: 'error' as ViolationSeverity,
          };
          violations.push(violation);
        }
      } catch (error) {
        gameLog.error('backend', `规则 ${rule.name} 执行异常`, {
          error: error instanceof Error ? error.message : String(error),
          ruleId: rule.id,
        });
        warnings.push(`规则 ${rule.name} 执行异常，已跳过`);
      }
    }

    // 3. 执行方法级别的验证
    const methodViolations = this.validateMethodParams(operation);
    violations.push(...methodViolations);

    // 4. 检查参数修改建议
    const paramModifications = this.suggestParamModifications(operation, violations);
    if (Object.keys(paramModifications).length > 0) {
      modifiedParams = { ...operation.params, ...paramModifications };
    }

    // 5. 构建审核结果
    const result: ReviewResult = {
      approved: violations.filter((v) => v.severity === 'error').length === 0,
      operation,
      violations,
      warnings,
      modifiedParams,
    };

    // 6. 记录审核日志
    const duration = Date.now() - startTime;
    this.logReview(operation, result, duration);

    gameLog.debug('backend', '写操作审核完成', {
      toolType: operation.toolType,
      method: operation.method,
      approved: result.approved,
      violationCount: violations.length,
      warningCount: warnings.length,
      duration,
    });

    return result;
  }

  /**
   * 批量审核
   */
  async reviewBatch(operations: WriteOperation[]): Promise<ReviewResult[]> {
    const results: ReviewResult[] = [];

    for (const operation of operations) {
      const result = await this.reviewOperation(operation);
      results.push(result);
    }

    gameLog.info('backend', '批量审核完成', {
      total: operations.length,
      approved: results.filter((r) => r.approved).length,
      rejected: results.filter((r) => !r.approved).length,
    });

    return results;
  }

  /**
   * 添加审核规则
   */
  addRule(rule: ReviewRule): void {
    if (this.rules.has(rule.id)) {
      gameLog.warn('backend', `规则 ${rule.id} 已存在，将被覆盖`, {
        ruleId: rule.id,
        ruleName: rule.name,
      });
    }
    this.rules.set(rule.id, rule);
    gameLog.info('backend', `添加审核规则: ${rule.name}`, {
      ruleId: rule.id,
      priority: rule.priority,
    });
  }

  /**
   * 移除规则
   */
  removeRule(ruleId: string): void {
    const rule = this.rules.get(ruleId);
    if (rule) {
      this.rules.delete(ruleId);
      gameLog.info('backend', `移除审核规则: ${rule.name}`, { ruleId });
    } else {
      gameLog.warn('backend', `规则 ${ruleId} 不存在`, { ruleId });
    }
  }

  /**
   * 获取所有规则
   */
  getRules(): ReviewRule[] {
    return Array.from(this.rules.values());
  }

  /**
   * 获取规则
   */
  getRule(ruleId: string): ReviewRule | undefined {
    return this.rules.get(ruleId);
  }

  /**
   * 启用/禁用规则
   */
  setRuleEnabled(ruleId: string, enabled: boolean): void {
    const rule = this.rules.get(ruleId);
    if (rule) {
      rule.enabled = enabled;
      gameLog.info('backend', `${enabled ? '启用' : '禁用'}规则: ${rule.name}`, {
        ruleId,
        enabled,
      });
    }
  }

  /**
   * 查询审核历史
   */
  getReviewHistory(options: ReviewHistoryOptions = {}): ReviewLogEntry[] {
    let filtered = [...this.reviewHistory];

    if (options.saveId) {
      filtered = filtered.filter(
        (entry) => entry.operation.context.saveId === options.saveId
      );
    }

    if (options.agentId) {
      filtered = filtered.filter(
        (entry) => entry.operation.context.agentId === options.agentId
      );
    }

    if (options.approved !== undefined) {
      filtered = filtered.filter((entry) => entry.result.approved === options.approved);
    }

    // 按时间倒序
    filtered.sort((a, b) => b.timestamp - a.timestamp);

    const offset = options.offset || 0;
    const limit = options.limit || 100;

    return filtered.slice(offset, offset + limit);
  }

  /**
   * 获取违规统计
   */
  getViolationStats(): {
    total: number;
    byType: Record<ViolationType, number>;
    bySeverity: Record<ViolationSeverity, number>;
  } {
    const stats = {
      total: 0,
      byType: {
        permission: 0,
        validation: 0,
        conflict: 0,
        constraint: 0,
      } as Record<ViolationType, number>,
      bySeverity: {
        error: 0,
        warning: 0,
      } as Record<ViolationSeverity, number>,
    };

    for (const entry of this.reviewHistory) {
      for (const violation of entry.result.violations) {
        stats.total++;
        stats.byType[violation.type]++;
        stats.bySeverity[violation.severity]++;
      }
    }

    return stats;
  }

  /**
   * 清除审核历史
   */
  clearHistory(): void {
    this.reviewHistory = [];
    gameLog.info('backend', '审核历史已清除');
  }

  /**
   * 检查是否为写操作
   */
  private isWriteOperation(toolType: ToolType, method: string): boolean {
    const writeMethods = TOOL_WRITE_METHODS[toolType];
    return writeMethods ? writeMethods.includes(method) : false;
  }

  /**
   * 初始化内置规则
   */
  private initializeBuiltInRules(): void {
    // 规则1: 必需字段验证
    this.addRule({
      id: 'required-fields',
      name: '必需字段验证',
      description: '检查操作是否包含所有必需字段',
      priority: 100,
      enabled: true,
      check: (operation) => {
        if (!operation.context.saveId) {
          return {
            type: 'validation',
            message: '缺少必需字段: saveId',
            field: 'context.saveId',
            severity: 'error',
          };
        }
        if (!operation.context.agentId) {
          return {
            type: 'validation',
            message: '缺少必需字段: agentId',
            field: 'context.agentId',
            severity: 'error',
          };
        }
        return true;
      },
    });

    // 规则2: 数值范围验证
    this.addRule({
      id: 'numeric-range',
      name: '数值范围验证',
      description: '检查数值是否在合理范围内',
      priority: 90,
      enabled: true,
      check: (operation) => {
        const numericParams = ['amount', 'value', 'quantity', 'count', 'hp', 'mp', 'exp', 'gold', 'level'];
        
        for (const param of numericParams) {
          if (param in operation.params) {
            const value = operation.params[param];
            if (typeof value === 'number') {
              if (!Number.isFinite(value)) {
                return {
                  type: 'validation',
                  message: `参数 ${param} 不是有效数字`,
                  field: param,
                  severity: 'error',
                };
              }
              // 检查极端值
              if (Math.abs(value) > Number.MAX_SAFE_INTEGER / 1000) {
                return {
                  type: 'validation',
                  message: `参数 ${param} 数值过大`,
                  field: param,
                  severity: 'error',
                };
              }
            }
          }
        }
        return true;
      },
    });

    // 规则3: 金钱不能为负
    this.addRule({
      id: 'non-negative-gold',
      name: '金钱非负验证',
      description: '确保金钱相关操作不会导致负值',
      priority: 95,
      enabled: true,
      check: (operation) => {
        const goldParams = ['gold', 'money', 'coins', 'amount'];
        
        for (const param of goldParams) {
          if (param in operation.params) {
            const value = operation.params[param];
            if (typeof value === 'number' && value < 0) {
              return {
                type: 'constraint',
                message: `${param} 不能为负数`,
                field: param,
                severity: 'error',
              };
            }
          }
        }
        return true;
      },
    });

    // 规则4: 字符串长度验证
    this.addRule({
      id: 'string-length',
      name: '字符串长度验证',
      description: '检查字符串参数长度是否合理',
      priority: 80,
      enabled: true,
      check: (operation) => {
        const maxLength = 10000; // 最大字符串长度
        
        for (const [key, value] of Object.entries(operation.params)) {
          if (typeof value === 'string' && value.length > maxLength) {
            return {
              type: 'validation',
              message: `参数 ${key} 字符串过长 (${value.length} > ${maxLength})`,
              field: key,
              severity: 'error',
            };
          }
        }
        return true;
      },
    });

    // 规则5: ID格式验证
    this.addRule({
      id: 'id-format',
      name: 'ID格式验证',
      description: '检查ID参数格式是否正确',
      priority: 85,
      enabled: true,
      check: (operation) => {
        const idParams = ['id', 'itemId', 'skillId', 'questId', 'npcId', 'eventId', 'characterId'];
        const idPattern = /^[a-zA-Z0-9_-]+$/;
        
        for (const param of idParams) {
          if (param in operation.params) {
            const value = operation.params[param];
            if (typeof value === 'string' && !idPattern.test(value)) {
              return {
                type: 'validation',
                message: `参数 ${param} 格式无效，只允许字母、数字、下划线和连字符`,
                field: param,
                severity: 'error',
              };
            }
          }
        }
        return true;
      },
    });

    // 规则6: 数组参数验证
    this.addRule({
      id: 'array-size',
      name: '数组大小验证',
      description: '检查数组参数大小是否合理',
      priority: 75,
      enabled: true,
      check: (operation) => {
        const maxArraySize = 1000;
        
        for (const [key, value] of Object.entries(operation.params)) {
          if (Array.isArray(value) && value.length > maxArraySize) {
            return {
              type: 'validation',
              message: `参数 ${key} 数组过大 (${value.length} > ${maxArraySize})`,
              field: key,
              severity: 'error',
            };
          }
        }
        return true;
      },
    });

    // 规则7: 属性值范围验证
    this.addRule({
      id: 'attribute-range',
      name: '属性值范围验证',
      description: '检查角色属性值是否在合理范围内',
      priority: 90,
      enabled: true,
      check: (operation) => {
        const attributeParams = ['hp', 'mp', 'stamina', 'strength', 'agility', 'intelligence', 'luck'];
        const maxAttributeValue = 99999;
        
        for (const param of attributeParams) {
          if (param in operation.params) {
            const value = operation.params[param];
            if (typeof value === 'number') {
              if (value < 0) {
                return {
                  type: 'constraint',
                  message: `属性 ${param} 不能为负数`,
                  field: param,
                  severity: 'error',
                };
              }
              if (value > maxAttributeValue) {
                return {
                  type: 'constraint',
                  message: `属性 ${param} 超过最大值 ${maxAttributeValue}`,
                  field: param,
                  severity: 'warning',
                };
              }
            }
          }
        }
        return true;
      },
    });

    // 规则8: 等级范围验证
    this.addRule({
      id: 'level-range',
      name: '等级范围验证',
      description: '检查等级是否在合理范围内',
      priority: 90,
      enabled: true,
      check: (operation) => {
        const levelParams = ['level', 'skillLevel', 'requiredLevel'];
        const minLevel = 1;
        const maxLevel = 100;
        
        for (const param of levelParams) {
          if (param in operation.params) {
            const value = operation.params[param];
            if (typeof value === 'number') {
              if (value < minLevel || value > maxLevel) {
                return {
                  type: 'constraint',
                  message: `${param} 必须在 ${minLevel}-${maxLevel} 之间`,
                  field: param,
                  severity: 'error',
                };
              }
            }
          }
        }
        return true;
      },
    });

    gameLog.info('backend', '内置审核规则初始化完成', {
      ruleCount: this.rules.size,
    });
  }

  /**
   * 初始化方法验证配置
   */
  private initializeMethodValidations(): void {
    // 角色创建验证
    this.addMethodValidation(ToolType.INVENTORY_DATA, 'createCharacter', {
      fields: {
        character: { required: true, type: 'object' },
      },
    });

    // 背包相关验证
    this.addMethodValidation(ToolType.INVENTORY_DATA, 'createItem', {
      fields: {
        name: { required: true, type: 'string' },
        type: { required: true, type: 'string' },
        quantity: { type: 'number', range: { min: 1, max: 999 } },
      },
    });

    this.addMethodValidation(ToolType.INVENTORY_DATA, 'updateItem', {
      fields: {
        itemId: { required: true, type: 'string' },
      },
    });

    this.addMethodValidation(ToolType.INVENTORY_DATA, 'equipItem', {
      fields: {
        itemId: { required: true, type: 'string' },
        slot: { required: true, type: 'string' },
      },
    });

    // 技能相关验证
    this.addMethodValidation(ToolType.SKILL_DATA, 'createSkill', {
      fields: {
        name: { required: true, type: 'string' },
        type: { required: true, type: 'string' },
      },
    });

    this.addMethodValidation(ToolType.SKILL_DATA, 'startCooldown', {
      fields: {
        skillId: { required: true, type: 'string' },
        duration: { required: true, type: 'number', range: { min: 0 } },
      },
    });

    // 任务相关验证
    this.addMethodValidation(ToolType.QUEST_DATA, 'createQuest', {
      fields: {
        title: { required: true, type: 'string' },
        description: { required: true, type: 'string' },
      },
    });

    this.addMethodValidation(ToolType.QUEST_DATA, 'updateProgress', {
      fields: {
        questId: { required: true, type: 'string' },
        progress: { required: true, type: 'number', range: { min: 0, max: 100 } },
      },
    });

    // NPC相关验证
    this.addMethodValidation(ToolType.NPC_DATA, 'createNPC', {
      fields: {
        name: { required: true, type: 'string' },
        type: { required: true, type: 'string' },
      },
    });

    this.addMethodValidation(ToolType.NPC_DATA, 'updateRelationship', {
      fields: {
        npcId: { required: true, type: 'string' },
        value: { required: true, type: 'number', range: { min: -100, max: 100 } },
      },
    });

    // 战斗相关验证
    this.addMethodValidation(ToolType.COMBAT_DATA, 'applyEffect', {
      fields: {
        targetId: { required: true, type: 'string' },
        effectType: { required: true, type: 'string' },
      },
    });

    // 地图相关验证
    this.addMethodValidation(ToolType.MAP_DATA, 'updateLocation', {
      fields: {
        characterId: { required: true, type: 'string' },
        locationId: { required: true, type: 'string' },
      },
    });

    // 事件相关验证
    this.addMethodValidation(ToolType.EVENT_DATA, 'createEvent', {
      fields: {
        name: { required: true, type: 'string' },
        type: { required: true, type: 'string' },
      },
    });

    // 对话相关验证
    this.addMethodValidation(ToolType.DIALOGUE_DATA, 'addHistory', {
      fields: {
        content: { required: true, type: 'string' },
        speaker: { required: true, type: 'string' },
      },
    });

    // 故事相关验证
    this.addMethodValidation(ToolType.STORY_DATA, 'addNode', {
      fields: {
        title: { required: true, type: 'string' },
        content: { required: true, type: 'string' },
      },
    });

    // UI相关验证
    this.addMethodValidation(ToolType.UI_DATA, 'queueInstruction', {
      fields: {
        type: { required: true, type: 'string' },
      },
    });
  }

  /**
   * 添加方法验证配置
   */
  private addMethodValidation(
    toolType: ToolType,
    method: string,
    validation: MethodValidation
  ): void {
    if (!this.methodValidations.has(toolType)) {
      this.methodValidations.set(toolType, new Map());
    }
    this.methodValidations.get(toolType)!.set(method, validation);
  }

  /**
   * 验证方法参数
   */
  private validateMethodParams(operation: WriteOperation): Violation[] {
    const violations: Violation[] = [];
    
    const toolValidations = this.methodValidations.get(operation.toolType);
    if (!toolValidations) {
      return violations;
    }

    const methodValidation = toolValidations.get(operation.method);
    if (!methodValidation) {
      return violations;
    }

    for (const [fieldName, fieldConfig] of Object.entries(methodValidation.fields)) {
      const value = operation.params[fieldName];

      // 必需字段检查
      if (fieldConfig.required && (value === undefined || value === null)) {
        violations.push({
          type: 'validation',
          message: `缺少必需字段: ${fieldName}`,
          field: fieldName,
          severity: 'error',
        });
        continue;
      }

      // 如果值不存在，跳过后续检查
      if (value === undefined || value === null) {
        continue;
      }

      // 类型检查
      if (fieldConfig.type) {
        const actualType = typeof value;
        if (actualType !== fieldConfig.type) {
          violations.push({
            type: 'validation',
            message: `字段 ${fieldName} 类型错误，期望 ${fieldConfig.type}，实际 ${actualType}`,
            field: fieldName,
            severity: 'error',
          });
          continue;
        }
      }

      // 范围检查（仅数字类型）
      if (fieldConfig.range && typeof value === 'number') {
        if (fieldConfig.range.min !== undefined && value < fieldConfig.range.min) {
          violations.push({
            type: 'constraint',
            message: `字段 ${fieldName} 值 ${value} 小于最小值 ${fieldConfig.range.min}`,
            field: fieldName,
            severity: 'error',
          });
        }
        if (fieldConfig.range.max !== undefined && value > fieldConfig.range.max) {
          violations.push({
            type: 'constraint',
            message: `字段 ${fieldName} 值 ${value} 大于最大值 ${fieldConfig.range.max}`,
            field: fieldName,
            severity: 'error',
          });
        }
      }

      // 自定义验证
      if (fieldConfig.custom) {
        const customResult = fieldConfig.custom(value, operation);
        if (customResult !== true) {
          const violation = typeof customResult === 'object' ? customResult : {
            type: 'validation' as ViolationType,
            message: `字段 ${fieldName} 自定义验证失败`,
            field: fieldName,
            severity: 'error' as ViolationSeverity,
          };
          violations.push(violation);
        }
      }
    }

    return violations;
  }

  /**
   * 建议参数修改
   */
  private suggestParamModifications(
    operation: WriteOperation,
    violations: Violation[]
  ): Record<string, unknown> {
    const modifications: Record<string, unknown> = {};

    // 对于超出范围的数值，自动修正到边界值
    for (const violation of violations) {
      if (violation.type === 'constraint' && violation.field) {
        const field = violation.field;
        const value = operation.params[field];

        if (typeof value === 'number') {
          // 检查是否是范围约束违规
          const toolValidations = this.methodValidations.get(operation.toolType);
          if (toolValidations) {
            const methodValidation = toolValidations.get(operation.method);
            if (methodValidation && methodValidation.fields[field]?.range) {
              const range = methodValidation.fields[field].range!;
              let modified = false;
              let newValue = value;

              if (range.min !== undefined && value < range.min) {
                newValue = range.min;
                modified = true;
              }
              if (range.max !== undefined && value > range.max) {
                newValue = range.max;
                modified = true;
              }

              if (modified) {
                modifications[field] = newValue;
              }
            }
          }
        }
      }
    }

    return modifications;
  }

  /**
   * 记录审核日志
   */
  private logReview(
    operation: WriteOperation,
    result: ReviewResult,
    duration: number
  ): void {
    const entry: ReviewLogEntry = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      operation,
      result,
      duration,
    };

    this.reviewHistory.push(entry);

    // 限制历史记录大小
    if (this.reviewHistory.length > this.maxHistorySize) {
      this.reviewHistory = this.reviewHistory.slice(-this.maxHistorySize);
    }

    // 如果是拒绝的操作，记录警告日志
    if (!result.approved) {
      gameLog.warn('backend', '写操作被拒绝', {
        toolType: operation.toolType,
        method: operation.method,
        agentId: operation.context.agentId,
        violations: result.violations.map((v) => v.message),
      });
    }
  }
}

// 单例实例
let writeOperationReviewService: WriteOperationReviewService | null = null;

/**
 * 获取写操作审核服务实例
 */
export function getWriteOperationReviewService(): WriteOperationReviewService {
  if (!writeOperationReviewService) {
    writeOperationReviewService = new WriteOperationReviewService();
  }
  return writeOperationReviewService;
}

/**
 * 初始化写操作审核服务
 */
export function initializeWriteOperationReviewService(): WriteOperationReviewService {
  return getWriteOperationReviewService();
}
