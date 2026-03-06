import type { ToolType, ToolMethodMetadata } from '@ai-rpg/shared';
import type { ToolBase } from '../tools/ToolBase';
import { getToolRegistry } from '../tools/ToolRegistry';
import { gameLog } from './GameLogService';

/**
 * OpenAI 风格的 Tool Schema 定义
 */
export interface OpenAIToolSchema {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, OpenAIParameterSchema>;
      required: string[];
    };
  };
}

/**
 * OpenAI 参数 Schema 定义
 */
export interface OpenAIParameterSchema {
  type: string;
  description?: string;
  enum?: string[];
  items?: OpenAIParameterSchema;
  properties?: Record<string, OpenAIParameterSchema>;
  required?: string[];
}

/**
 * 参数类型映射结果
 */
interface TypeMappingResult {
  type: string;
  required: boolean;
  enum?: string[];
  items?: OpenAIParameterSchema;
  properties?: Record<string, OpenAIParameterSchema>;
}

/**
 * 方法 Schema 缓存条目
 */
interface MethodSchemaCache {
  schema: OpenAIToolSchema;
  generatedAt: number;
  toolVersion: string;
}

/**
 * Tool Schema 生成器服务
 * 负责将 Tool 方法元数据转换为 OpenAI Function Calling 格式的 Schema
 */
class ToolSchemaGeneratorService {
  /**
   * Schema 缓存
   * Key: `${toolType}.${methodName}` 或 `toolType` (完整工具 Schema)
   */
  private schemaCache: Map<string, MethodSchemaCache> = new Map();

  /**
   * 完整工具 Schema 缓存
   * Key: toolType
   */
  private fullToolSchemaCache: Map<ToolType, OpenAIToolSchema[]> = new Map();

  /**
   * 缓存过期时间（毫秒），默认 5 分钟
   */
  private cacheTTL = 5 * 60 * 1000;

  /**
   * 为单个 Tool 生成完整 Schema（包含所有方法）
   * @param tool Tool 实例
   * @returns OpenAI 风格的 Schema 数组，每个方法一个 Schema
   */
  generateToolSchema(tool: ToolBase): OpenAIToolSchema[] {
    const cacheKey = tool.type;
    const cached = this.fullToolSchemaCache.get(cacheKey);

    // 检查缓存是否有效
    if (cached && this.isCacheValid(tool.type, tool.version)) {
      gameLog.debug('backend', `Using cached schema for tool: ${tool.type}`);
      return cached;
    }

    const methods = tool.getAllMethodMetadata();
    const schemas: OpenAIToolSchema[] = [];

    for (const method of methods) {
      const schema = this.generateMethodSchema(tool, method);
      schemas.push(schema);

      // 缓存单个方法 Schema
      const methodCacheKey = `${tool.type}.${method.name}`;
      this.schemaCache.set(methodCacheKey, {
        schema,
        generatedAt: Date.now(),
        toolVersion: tool.version,
      });
    }

    // 缓存完整工具 Schema
    this.fullToolSchemaCache.set(cacheKey, schemas);

    gameLog.info('backend', `Generated schema for tool: ${tool.type}`, {
      methodCount: schemas.length,
      toolVersion: tool.version,
    });

    return schemas;
  }

  /**
   * 生成所有 Tool 的 Schema
   * @returns 所有 Tool 的 Schema 数组
   */
  generateAllSchemas(): OpenAIToolSchema[] {
    const registry = getToolRegistry();
    const toolTypes = registry.listTools();
    const allSchemas: OpenAIToolSchema[] = [];

    for (const toolType of toolTypes) {
      const tool = registry.getTool(toolType);
      if (tool) {
        const schemas = this.generateToolSchema(tool);
        allSchemas.push(...schemas);
      }
    }

    gameLog.info('backend', 'Generated all tool schemas', {
      toolCount: toolTypes.length,
      totalMethods: allSchemas.length,
    });

    return allSchemas;
  }

  /**
   * 获取单个方法的 Schema
   * @param tool Tool 实例
   * @param methodName 方法名称
   * @returns OpenAI 风格的 Schema
   */
  getMethodSchema(tool: ToolBase, methodName: string): OpenAIToolSchema | null {
    const cacheKey = `${tool.type}.${methodName}`;
    const cached = this.schemaCache.get(cacheKey);

    // 检查缓存是否有效
    if (cached && this.isCacheValid(tool.type, tool.version)) {
      return cached.schema;
    }

    // 从 Tool 获取方法元数据
    const metadata = tool.getMethodMetadata(methodName);
    if (!metadata) {
      gameLog.warn('backend', `Method not found: ${tool.type}.${methodName}`);
      return null;
    }

    // 生成并缓存 Schema
    const schema = this.generateMethodSchema(tool, metadata);
    this.schemaCache.set(cacheKey, {
      schema,
      generatedAt: Date.now(),
      toolVersion: tool.version,
    });

    return schema;
  }

  /**
   * 获取缓存的 Schema
   * @param toolType Tool 类型
   * @returns 缓存的 Schema 数组，如果不存在或过期则返回 undefined
   */
  getCachedSchema(toolType: ToolType): OpenAIToolSchema[] | undefined {
    const cached = this.fullToolSchemaCache.get(toolType);
    if (!cached) {
      return undefined;
    }

    // 检查缓存是否过期
    const registry = getToolRegistry();
    const tool = registry.getTool(toolType);
    if (tool && this.isCacheValid(toolType, tool.version)) {
      return cached;
    }

    return undefined;
  }

  /**
   * 使缓存失效
   * @param toolType 可选，指定要失效的 Tool 类型。如果不提供，则清除所有缓存
   */
  invalidateCache(toolType?: ToolType): void {
    if (toolType) {
      // 清除指定 Tool 的缓存
      this.fullToolSchemaCache.delete(toolType);

      // 清除该 Tool 所有方法的缓存
      const keysToDelete = Array.from(this.schemaCache.keys()).filter(key => key.startsWith(`${toolType}.`));
      for (const key of keysToDelete) {
        this.schemaCache.delete(key);
      }

      gameLog.info('backend', `Cache invalidated for tool: ${toolType}`);
    } else {
      // 清除所有缓存
      this.fullToolSchemaCache.clear();
      this.schemaCache.clear();

      gameLog.info('backend', 'All schema cache invalidated');
    }
  }

  /**
   * 设置缓存过期时间
   * @param ttl 过期时间（毫秒）
   */
  setCacheTTL(ttl: number): void {
    this.cacheTTL = ttl;
    gameLog.debug('backend', `Schema cache TTL set to ${ttl}ms`);
  }

  /**
   * 获取缓存统计信息
   */
  getCacheStats(): {
    methodCacheSize: number;
    toolCacheSize: number;
    cacheTTL: number;
  } {
    return {
      methodCacheSize: this.schemaCache.size,
      toolCacheSize: this.fullToolSchemaCache.size,
      cacheTTL: this.cacheTTL,
    };
  }

  /**
   * 生成单个方法的 Schema
   * @param tool Tool 实例
   * @param method 方法元数据
   * @returns OpenAI 风格的 Schema
   */
  private generateMethodSchema(tool: ToolBase, method: ToolMethodMetadata): OpenAIToolSchema {
    const { properties, required } = this.parseParameters(method.params);

    const schema: OpenAIToolSchema = {
      type: 'function',
      function: {
        name: `${tool.type}_${method.name}`,
        description: this.buildMethodDescription(tool, method),
        parameters: {
          type: 'object',
          properties,
          required,
        },
      },
    };

    return schema;
  }

  /**
   * 构建方法描述
   * @param tool Tool 实例
   * @param method 方法元数据
   * @returns 完整的方法描述
   */
  private buildMethodDescription(tool: ToolBase, method: ToolMethodMetadata): string {
    const parts = [
      `[${tool.type}] ${method.description}`,
      `返回类型: ${method.returns}`,
    ];

    if (method.isRead) {
      parts.push('(只读操作)');
    } else {
      parts.push('(写操作)');
    }

    return parts.join('\n');
  }

  /**
   * 解析参数定义，生成 OpenAI Schema 格式
   * @param params 参数定义对象 { paramName: 'typeDescription' }
   * @returns OpenAI Schema 格式的属性和必需参数列表
   */
  private parseParameters(params: Record<string, unknown>): {
    properties: Record<string, OpenAIParameterSchema>;
    required: string[];
  } {
    const properties: Record<string, OpenAIParameterSchema> = {};
    const required: string[] = [];

    for (const [paramName, typeDesc] of Object.entries(params)) {
      const typeStr = String(typeDesc);
      const mapping = this.mapTypeToOpenAI(typeStr);

      properties[paramName] = {
        type: mapping.type,
        description: this.generateParamDescription(paramName, typeStr),
      };

      // 添加枚举值
      if (mapping.enum) {
        properties[paramName].enum = mapping.enum;
      }

      // 添加数组项类型
      if (mapping.items) {
        properties[paramName].items = mapping.items;
      }

      // 添加嵌套对象属性
      if (mapping.properties) {
        properties[paramName].properties = mapping.properties;
      }

      // 标记必需参数
      if (mapping.required) {
        required.push(paramName);
      }
    }

    return { properties, required };
  }

  /**
   * 将类型字符串映射到 OpenAI Schema 类型
   * @param typeStr 类型字符串，如 'string', 'number?', 'ItemType', 'Item[]'
   * @returns 类型映射结果
   */
  private mapTypeToOpenAI(typeStr: string): TypeMappingResult {
    // 检查是否为可选类型
    const isOptional = typeStr.endsWith('?');
    const baseType = isOptional ? typeStr.slice(0, -1) : typeStr;

    // 基础类型映射
    const primitiveTypes: Record<string, string> = {
      string: 'string',
      number: 'number',
      boolean: 'boolean',
      object: 'object',
      any: 'object',
      unknown: 'object',
    };

    // 检查是否为数组类型
    if (baseType.endsWith('[]')) {
      const itemType = baseType.slice(0, -2);
      return {
        type: 'array',
        required: !isOptional,
        items: this.inferItemType(itemType),
      };
    }

    // 检查是否为 Record 类型
    if (baseType.startsWith('Record<')) {
      return {
        type: 'object',
        required: !isOptional,
        properties: {},
      };
    }

    // 检查是否为已知的枚举类型
    const enumType = this.tryGetEnumType(baseType);
    if (enumType) {
      return {
        type: 'string',
        required: !isOptional,
        enum: enumType,
      };
    }

    // 检查是否为原始类型
    if (primitiveTypes[baseType]) {
      return {
        type: primitiveTypes[baseType],
        required: !isOptional,
      };
    }

    // 复杂类型，推断为对象
    return {
      type: 'object',
      required: !isOptional,
      properties: this.inferObjectProperties(baseType),
    };
  }

  /**
   * 尝试获取枚举类型的值列表
   * @param typeName 类型名称
   * @returns 枚举值数组，如果不是枚举类型则返回 null
   */
  private tryGetEnumType(typeName: string): string[] | null {
    // 已知的枚举类型映射
    const enumMappings: Record<string, string[]> = {
      ItemType: ['weapon', 'armor', 'consumable', 'material', 'quest', 'misc'],
      ItemRarity: ['common', 'uncommon', 'rare', 'epic', 'legendary'],
      EquipmentSlotType: ['head', 'chest', 'hands', 'legs', 'feet', 'mainHand', 'offHand', 'accessory'],
      SkillType: ['active', 'passive', 'toggle'],
      DamageType: ['physical', 'magical', 'true'],
      QuestStatus: ['locked', 'available', 'in_progress', 'completed', 'failed'],
      EventType: ['trigger', 'timed', 'conditional', 'chain'],
      NPCType: ['friendly', 'neutral', 'hostile', 'merchant'],
      RelationType: ['friendly', 'neutral', 'hostile'],
    };

    return enumMappings[typeName] || null;
  }

  /**
   * 推断数组项类型的 Schema
   * @param itemType 项类型字符串
   * @returns 项类型的 Schema
   */
  private inferItemType(itemType: string): OpenAIParameterSchema {
    const primitiveTypes: Record<string, string> = {
      string: 'string',
      number: 'number',
      boolean: 'boolean',
    };

    if (primitiveTypes[itemType]) {
      return { type: primitiveTypes[itemType] };
    }

    // 检查是否为枚举类型
    const enumValues = this.tryGetEnumType(itemType);
    if (enumValues) {
      return { type: 'string', enum: enumValues };
    }

    // 复杂类型
    return {
      type: 'object',
      properties: this.inferObjectProperties(itemType),
    };
  }

  /**
   * 推断对象类型的属性
   * @param typeName 类型名称
   * @returns 推断的属性 Schema
   */
  private inferObjectProperties(typeName: string): Record<string, OpenAIParameterSchema> {
    // 已知的复杂类型属性推断
    const typeProperties: Record<string, Record<string, OpenAIParameterSchema>> = {
      Item: {
        id: { type: 'string', description: '物品唯一标识' },
        name: { type: 'string', description: '物品名称' },
        type: { type: 'string', description: '物品类型', enum: ['weapon', 'armor', 'consumable', 'material', 'quest', 'misc'] },
        rarity: { type: 'string', description: '物品稀有度', enum: ['common', 'uncommon', 'rare', 'epic', 'legendary'] },
        description: { type: 'string', description: '物品描述' },
        value: { type: 'number', description: '物品价值' },
        stackable: { type: 'boolean', description: '是否可堆叠' },
      },
      InventorySlot: {
        slotIndex: { type: 'number', description: '槽位索引' },
        item: { type: 'object', description: '槽位中的物品' },
        quantity: { type: 'number', description: '物品数量' },
      },
      NPC: {
        id: { type: 'string', description: 'NPC 唯一标识' },
        name: { type: 'string', description: 'NPC 名称' },
        type: { type: 'string', description: 'NPC 类型', enum: ['friendly', 'neutral', 'hostile', 'merchant'] },
        location: { type: 'string', description: 'NPC 位置' },
      },
      Quest: {
        id: { type: 'string', description: '任务唯一标识' },
        name: { type: 'string', description: '任务名称' },
        description: { type: 'string', description: '任务描述' },
        status: { type: 'string', description: '任务状态', enum: ['locked', 'available', 'in_progress', 'completed', 'failed'] },
      },
      Skill: {
        id: { type: 'string', description: '技能唯一标识' },
        name: { type: 'string', description: '技能名称' },
        type: { type: 'string', description: '技能类型', enum: ['active', 'passive', 'toggle'] },
        cooldown: { type: 'number', description: '冷却时间（秒）' },
      },
    };

    return typeProperties[typeName] || {};
  }

  /**
   * 生成参数描述
   * @param paramName 参数名称
   * @param typeStr 类型字符串
   * @returns 参数描述
   */
  private generateParamDescription(paramName: string, typeStr: string): string {
    // 参数名称到描述的映射
    const paramDescriptions: Record<string, string> = {
      saveId: '存档 ID',
      characterId: '角色 ID',
      itemId: '物品 ID',
      slotIndex: '槽位索引',
      quantity: '数量',
      name: '名称',
      type: '类型',
      rarity: '稀有度',
      description: '描述',
      value: '价值',
      stats: '属性',
      effects: '效果',
      requirements: '需求条件',
      targetId: '目标 ID',
      targetSlot: '目标槽位',
      slot: '槽位',
      sortBy: '排序方式',
      ascending: '是否升序',
      currency: '货币类型',
      amount: '金额',
      priceMultiplier: '价格倍率',
      cost: '成本',
      options: '选项配置',
      baseStats: '基础属性',
      playerStats: '玩家属性',
      item: '物品数据',
    };

    const baseDesc = paramDescriptions[paramName] || paramName;

    // 添加类型信息
    const isOptional = typeStr.endsWith('?');
    const typeInfo = isOptional ? ` (可选, 类型: ${typeStr})` : ` (类型: ${typeStr})`;

    return baseDesc + typeInfo;
  }

  /**
   * 检查缓存是否有效
   * @param toolType Tool 类型
   * @param toolVersion Tool 版本
   * @returns 缓存是否有效
   */
  private isCacheValid(toolType: ToolType, toolVersion: string): boolean {
    // 查找该 Tool 的任意缓存条目来检查时间
    const entries = Array.from(this.schemaCache.entries());
    for (const [key, cache] of entries) {
      if (key.startsWith(`${toolType}.`)) {
        // 检查版本是否匹配
        if (cache.toolVersion !== toolVersion) {
          return false;
        }
        // 检查是否过期
        if (Date.now() - cache.generatedAt > this.cacheTTL) {
          return false;
        }
        return true;
      }
    }

    // 没有找到缓存条目
    return false;
  }
}

// 单例实例
let schemaGeneratorInstance: ToolSchemaGeneratorService | null = null;

/**
 * 获取 Tool Schema 生成器实例
 * @returns ToolSchemaGeneratorService 实例
 */
export function getToolSchemaGenerator(): ToolSchemaGeneratorService {
  if (!schemaGeneratorInstance) {
    schemaGeneratorInstance = new ToolSchemaGeneratorService();
  }
  return schemaGeneratorInstance;
}

/**
 * 重置 Tool Schema 生成器实例
 */
export function resetToolSchemaGenerator(): void {
  if (schemaGeneratorInstance) {
    schemaGeneratorInstance.invalidateCache();
    schemaGeneratorInstance = null;
  }
}

// 导出便捷方法
export const toolSchemaGenerator = {
  generateToolSchema: (tool: ToolBase) => getToolSchemaGenerator().generateToolSchema(tool),
  generateAllSchemas: () => getToolSchemaGenerator().generateAllSchemas(),
  getMethodSchema: (tool: ToolBase, method: string) => getToolSchemaGenerator().getMethodSchema(tool, method),
  getCachedSchema: (toolType: ToolType) => getToolSchemaGenerator().getCachedSchema(toolType),
  invalidateCache: (toolType?: ToolType) => getToolSchemaGenerator().invalidateCache(toolType),
};
