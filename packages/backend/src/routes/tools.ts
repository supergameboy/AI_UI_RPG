import { Router, type Router as RouterType } from 'express';
import type { ToolType } from '@ai-rpg/shared';
import { getToolRegistry } from '../tools/ToolRegistry';
import { getToolSchemaGenerator, type OpenAIToolSchema } from '../services/ToolSchemaGenerator';
import { sendSuccess, sendError } from '../utils/response';
import { asyncHandler } from '../middleware/errorHandler';
import { gameLog } from '../services/GameLogService';

const router: RouterType = Router();

/**
 * GET /api/tools - 获取所有 Tool 状态
 */
router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const registry = getToolRegistry();
    const toolTypes = registry.listTools();
    const statuses = registry.listToolStatuses();

    gameLog.debug('backend', '获取所有 Tool 状态', {
      count: toolTypes.length,
    });

    sendSuccess(res, {
      tools: statuses,
      count: toolTypes.length,
      activeCalls: registry.getActiveCallCount(),
    });
  })
);

/**
 * GET /api/tools/:toolType - 获取特定 Tool 状态
 */
router.get(
  '/:toolType',
  asyncHandler(async (req, res) => {
    const toolType = req.params.toolType as ToolType;
    const registry = getToolRegistry();

    const tool = registry.getTool(toolType);

    if (!tool) {
      sendError(res, 'NOT_FOUND', `Tool '${toolType}' 不存在`, 404);
      return;
    }

    const status = tool.getStatus();
    const config = tool.getConfig();

    gameLog.debug('backend', '获取 Tool 状态', { toolType });

    sendSuccess(res, {
      status,
      config,
    });
  })
);

/**
 * GET /api/tools/:toolType/methods - 获取 Tool 方法列表
 */
router.get(
  '/:toolType/methods',
  asyncHandler(async (req, res) => {
    const toolType = req.params.toolType as ToolType;
    const registry = getToolRegistry();

    const tool = registry.getTool(toolType);

    if (!tool) {
      sendError(res, 'NOT_FOUND', `Tool '${toolType}' 不存在`, 404);
      return;
    }

    const allMethods = tool.getAllMethodMetadata();
    const readMethods = tool.getReadMethods();
    const writeMethods = tool.getWriteMethods();

    gameLog.debug('backend', '获取 Tool 方法列表', {
      toolType,
      methodCount: allMethods.length,
    });

    sendSuccess(res, {
      toolType,
      methods: allMethods,
      readMethods,
      writeMethods,
      counts: {
        total: allMethods.length,
        read: readMethods.length,
        write: writeMethods.length,
      },
    });
  })
);

/**
 * GET /api/tools/:toolType/schema - 获取 Tool Schema
 */
router.get(
  '/:toolType/schema',
  asyncHandler(async (req, res) => {
    const toolType = req.params.toolType as ToolType;
    const registry = getToolRegistry();
    const schemaGenerator = getToolSchemaGenerator();

    const tool = registry.getTool(toolType);

    if (!tool) {
      sendError(res, 'NOT_FOUND', `Tool '${toolType}' 不存在`, 404);
      return;
    }

    // 检查是否有缓存
    let schemas = schemaGenerator.getCachedSchema(toolType);

    if (!schemas) {
      schemas = schemaGenerator.generateToolSchema(tool);
    }

    gameLog.debug('backend', '获取 Tool Schema', {
      toolType,
      schemaCount: schemas.length,
    });

    sendSuccess(res, {
      toolType,
      schemas,
      count: schemas.length,
    });
  })
);

/**
 * GET /api/tools/:toolType/methods/:methodName - 获取特定方法的元数据
 */
router.get(
  '/:toolType/methods/:methodName',
  asyncHandler(async (req, res) => {
    const toolType = req.params.toolType as ToolType;
    const methodName = req.params.methodName;
    const registry = getToolRegistry();
    const schemaGenerator = getToolSchemaGenerator();

    const tool = registry.getTool(toolType);

    if (!tool) {
      sendError(res, 'NOT_FOUND', `Tool '${toolType}' 不存在`, 404);
      return;
    }

    const metadata = tool.getMethodMetadata(methodName);

    if (!metadata) {
      sendError(
        res,
        'NOT_FOUND',
        `方法 '${methodName}' 在 Tool '${toolType}' 中不存在`,
        404
      );
      return;
    }

    const schema = schemaGenerator.getMethodSchema(tool, methodName);

    gameLog.debug('backend', '获取 Tool 方法元数据', {
      toolType,
      methodName,
    });

    sendSuccess(res, {
      toolType,
      methodName,
      metadata,
      schema,
    });
  })
);

/**
 * POST /api/tools/schemas - 获取所有 Tool 的 Schema
 */
router.post(
  '/schemas',
  asyncHandler(async (req, res) => {
    const { toolTypes } = req.body as { toolTypes?: ToolType[] };
    const registry = getToolRegistry();
    const schemaGenerator = getToolSchemaGenerator();

    let targetTypes: ToolType[];

    if (toolTypes && toolTypes.length > 0) {
      targetTypes = toolTypes;
    } else {
      targetTypes = registry.listTools();
    }

    const allSchemas: OpenAIToolSchema[] = [];
    const results: Array<{
      toolType: ToolType;
      schemas: OpenAIToolSchema[];
      error?: string;
    }> = [];

    for (const toolType of targetTypes) {
      const tool = registry.getTool(toolType);

      if (!tool) {
        results.push({
          toolType,
          schemas: [],
          error: `Tool '${toolType}' 不存在`,
        });
        continue;
      }

      const schemas = schemaGenerator.generateToolSchema(tool);
      allSchemas.push(...schemas);
      results.push({ toolType, schemas });
    }

    gameLog.debug('backend', '获取多个 Tool Schema', {
      requestedCount: targetTypes.length,
      totalSchemaCount: allSchemas.length,
    });

    sendSuccess(res, {
      schemas: allSchemas,
      results,
      counts: {
        toolsRequested: targetTypes.length,
        totalSchemas: allSchemas.length,
      },
    });
  })
);

/**
 * GET /api/tools/stats - 获取 Tool 注册表统计信息
 */
router.get(
  '/stats',
  asyncHandler(async (_req, res) => {
    const registry = getToolRegistry();
    const schemaGenerator = getToolSchemaGenerator();

    const toolCount = registry.getToolCount();
    const activeCalls = registry.getActiveCallCount();
    const cacheStats = schemaGenerator.getCacheStats();

    gameLog.debug('backend', '获取 Tool 统计信息');

    sendSuccess(res, {
      toolCount,
      activeCalls,
      cache: cacheStats,
    });
  })
);

/**
 * POST /api/tools/cache/invalidate - 使 Schema 缓存失效
 */
router.post(
  '/cache/invalidate',
  asyncHandler(async (req, res) => {
    const { toolType } = req.body as { toolType?: ToolType };
    const schemaGenerator = getToolSchemaGenerator();

    schemaGenerator.invalidateCache(toolType);

    gameLog.info('backend', '使 Schema 缓存失效', {
      toolType: toolType ?? 'all',
    });

    sendSuccess(res, {
      invalidated: true,
      toolType: toolType ?? 'all',
    });
  })
);

export default router;
