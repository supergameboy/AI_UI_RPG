import { Router, type Router as RouterType } from 'express';
import type { Binding, BindingTestRequest, AgentType } from '@ai-rpg/shared';
import { getBindingRouter } from '../routing/BindingRouter';
import { sendSuccess, sendError } from '../utils/response';
import { asyncHandler } from '../middleware/errorHandler';
import { gameLog } from '../services/GameLogService';

const router: RouterType = Router();

/**
 * GET /api/bindings - 获取所有 Binding 配置
 */
router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const bindingRouter = getBindingRouter();
    const bindings = bindingRouter.getBindings();
    const stats = bindingRouter.getStats();

    gameLog.debug('backend', '获取所有 Binding 配置', {
      count: bindings.length,
      enabledCount: stats.enabledCount,
    });

    sendSuccess(res, {
      bindings,
      stats,
    });
  })
);

/**
 * POST /api/bindings - 创建新 Binding 配置
 */
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const bindingData = req.body as Partial<Binding>;

    if (!bindingData.id || !bindingData.agentId || !bindingData.match) {
      sendError(
        res,
        'VALIDATION_ERROR',
        '缺少必需字段: id, agentId, match',
        400,
        { required: ['id', 'agentId', 'match'] }
      );
      return;
    }

    const bindingRouter = getBindingRouter();
    const existingBindings = bindingRouter.getBindings();

    if (existingBindings.find((b) => b.id === bindingData.id)) {
      sendError(res, 'CONFLICT', `Binding ID '${bindingData.id}' 已存在`, 409);
      return;
    }

    const now = Date.now();
    const newBinding: Binding = {
      id: bindingData.id,
      agentId: bindingData.agentId,
      match: bindingData.match,
      priority: bindingData.priority ?? 0,
      enabled: bindingData.enabled ?? true,
      description: bindingData.description,
      createdAt: now,
      updatedAt: now,
    };

    bindingRouter.addBinding(newBinding);

    gameLog.info('backend', '创建 Binding 配置', {
      bindingId: newBinding.id,
      agentId: newBinding.agentId,
      priority: newBinding.priority,
    });

    sendSuccess(res, newBinding, 201);
  })
);

/**
 * POST /api/bindings/test - 测试 Binding 匹配
 */
router.post(
  '/test',
  asyncHandler(async (req, res) => {
    const testRequest = req.body as BindingTestRequest;

    if (!testRequest.messageType) {
      sendError(res, 'VALIDATION_ERROR', '缺少必需字段: messageType', 400);
      return;
    }

    const bindingRouter = getBindingRouter();
    const result = bindingRouter.test(testRequest);

    gameLog.debug('backend', '测试 Binding 匹配', {
      messageType: testRequest.messageType,
      matched: result.matched,
      agentId: result.agentId,
    });

    sendSuccess(res, result);
  })
);

/**
 * POST /api/bindings/route - 路由消息到 Agent
 */
router.post(
  '/route',
  asyncHandler(async (req, res) => {
    const { messageType, context } = req.body as {
      messageType: string;
      context?: Record<string, unknown>;
    };

    if (!messageType) {
      sendError(res, 'VALIDATION_ERROR', '缺少必需字段: messageType', 400);
      return;
    }

    const bindingRouter = getBindingRouter();
    const result = bindingRouter.route(messageType, context ?? {});

    gameLog.debug('backend', '路由消息', {
      messageType,
      agentId: result.agentId,
      matched: result.matched,
    });

    sendSuccess(res, result);
  })
);

/**
 * POST /api/bindings/reset - 重置为默认 Binding 配置
 */
router.post(
  '/reset',
  asyncHandler(async (_req, res) => {
    const bindingRouter = getBindingRouter();
    const { DEFAULT_BINDINGS } = await import('@ai-rpg/shared');

    bindingRouter.setBindings([...DEFAULT_BINDINGS]);

    gameLog.info('backend', '重置 Binding 配置为默认值');

    sendSuccess(res, {
      reset: true,
      bindings: bindingRouter.getBindings(),
    });
  })
);

/**
 * PUT /api/bindings/priorities - 批量更新优先级
 */
router.put(
  '/priorities',
  asyncHandler(async (req, res) => {
    const { updates } = req.body as { updates: Array<{ id: string; priority: number }> };

    if (!Array.isArray(updates) || updates.length === 0) {
      sendError(res, 'VALIDATION_ERROR', '无效的更新数据', 400);
      return;
    }

    const bindingRouter = getBindingRouter();
    const bindings = bindingRouter.getBindings();
    let updatedCount = 0;

    for (const update of updates) {
      const existingBinding = bindings.find((b) => b.id === update.id);
      if (existingBinding) {
        const updatedBinding: Binding = {
          ...existingBinding,
          priority: update.priority,
          updatedAt: Date.now(),
        };
        bindingRouter.addBinding(updatedBinding);
        updatedCount++;
      }
    }

    gameLog.info('backend', '批量更新 Binding 优先级', { updatedCount });

    sendSuccess(res, { updated: updatedCount });
  })
);

/**
 * GET /api/bindings/agent/:agentId - 获取特定 Agent 的 Binding 配置
 */
router.get(
  '/agent/:agentId',
  asyncHandler(async (req, res) => {
    const agentId = req.params.agentId as AgentType;
    const bindingRouter = getBindingRouter();
    const allBindings = bindingRouter.getBindings();

    const bindings = allBindings.filter((b) => b.agentId === agentId);

    if (bindings.length === 0) {
      sendError(res, 'NOT_FOUND', `未找到 Agent '${agentId}' 的 Binding 配置`, 404);
      return;
    }

    gameLog.debug('backend', '获取 Agent 的 Binding 配置', {
      agentId,
      count: bindings.length,
    });

    sendSuccess(res, {
      agentId,
      bindings,
    });
  })
);

/**
 * GET /api/bindings/:bindingId - 获取单个 Binding 配置
 */
router.get(
  '/:bindingId',
  asyncHandler(async (req, res) => {
    const bindingId = req.params.bindingId;
    const bindingRouter = getBindingRouter();
    const bindings = bindingRouter.getBindings();
    const binding = bindings.find((b) => b.id === bindingId);

    if (!binding) {
      sendError(res, 'NOT_FOUND', `Binding '${bindingId}' 不存在`, 404);
      return;
    }

    sendSuccess(res, { bindings: [binding] });
  })
);

/**
 * PUT /api/bindings/:bindingId - 更新 Binding 配置
 */
router.put(
  '/:bindingId',
  asyncHandler(async (req, res) => {
    const bindingId = req.params.bindingId;
    const updates = req.body as Partial<Binding>;

    const bindingRouter = getBindingRouter();
    const bindings = bindingRouter.getBindings();
    const existingBinding = bindings.find((b) => b.id === bindingId);

    if (!existingBinding) {
      sendError(res, 'NOT_FOUND', `Binding '${bindingId}' 不存在`, 404);
      return;
    }

    const { id, createdAt, ...allowedUpdates } = updates;

    const updatedBinding: Binding = {
      ...existingBinding,
      ...allowedUpdates,
      updatedAt: Date.now(),
    };

    bindingRouter.addBinding(updatedBinding);

    gameLog.info('backend', '更新 Binding 配置', {
      bindingId,
      updates: Object.keys(allowedUpdates),
    });

    sendSuccess(res, updatedBinding);
  })
);

/**
 * DELETE /api/bindings/:bindingId - 删除 Binding 配置
 */
router.delete(
  '/:bindingId',
  asyncHandler(async (req, res) => {
    const bindingId = req.params.bindingId;
    const bindingRouter = getBindingRouter();

    const deleted = bindingRouter.removeBinding(bindingId);

    if (!deleted) {
      sendError(res, 'NOT_FOUND', `Binding '${bindingId}' 不存在`, 404);
      return;
    }

    gameLog.info('backend', '删除 Binding 配置', { bindingId });

    sendSuccess(res, { deleted: true, bindingId });
  })
);

/**
 * POST /api/bindings/:bindingId/toggle - 切换启用/禁用
 */
router.post(
  '/:bindingId/toggle',
  asyncHandler(async (req, res) => {
    const bindingId = req.params.bindingId;
    const { enabled } = req.body as { enabled: boolean };

    const bindingRouter = getBindingRouter();
    const bindings = bindingRouter.getBindings();
    const existingBinding = bindings.find((b) => b.id === bindingId);

    if (!existingBinding) {
      sendError(res, 'NOT_FOUND', `Binding '${bindingId}' 不存在`, 404);
      return;
    }

    const updatedBinding: Binding = {
      ...existingBinding,
      enabled: enabled ?? !existingBinding.enabled,
      updatedAt: Date.now(),
    };

    bindingRouter.addBinding(updatedBinding);

    gameLog.info('backend', '切换 Binding 状态', {
      bindingId,
      enabled: updatedBinding.enabled,
    });

    sendSuccess(res, updatedBinding);
  })
);

export default router;
