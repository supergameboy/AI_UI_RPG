import { Router, type Router as RouterType } from 'express';
import type { AgentType, AgentConfig } from '@ai-rpg/shared';
import { AGENT_DESCRIPTIONS, AGENT_CAPABILITIES, AgentType as AgentTypeEnum } from '@ai-rpg/shared';
import { getAgentService, startAgentService } from '../services/AgentService';
import { getAgentConfigService } from '../services/AgentConfigService';
import { getBindingRouter } from '../routing/BindingRouter';
import { sendSuccess, sendError } from '../utils/response';
import { asyncHandler } from '../middleware/errorHandler';
import { gameLog } from '../services/GameLogService';

const router: RouterType = Router();

/**
 * GET /api/agents - 获取所有 Agent 状态
 */
router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const agentService = getAgentService();
    const statuses = agentService.getAllAgentStatuses();
    const initialized = agentService.isInitialized();
    const started = agentService.isStarted();

    gameLog.debug('backend', '获取所有 Agent 状态', {
      count: statuses.length,
      initialized,
      started,
    });

    sendSuccess(res, {
      initialized,
      started,
      agents: statuses,
      count: statuses.length,
    });
  })
);

/**
 * GET /api/agents/:agentType - 获取特定 Agent 状态
 */
router.get(
  '/:agentType',
  asyncHandler(async (req, res) => {
    const agentType = req.params.agentType as AgentType;
    const agentService = getAgentService();
    const agentConfigService = getAgentConfigService();

    const status = agentService.getAgentStatus(agentType);

    if (!status) {
      sendError(res, 'NOT_FOUND', `Agent '${agentType}' 不存在`, 404);
      return;
    }

    const config = agentConfigService.getConfig(agentType);
    const description = AGENT_DESCRIPTIONS[agentType as AgentTypeEnum];
    const capabilities = AGENT_CAPABILITIES[agentType as AgentTypeEnum];

    gameLog.debug('backend', '获取 Agent 状态', { agentType });

    sendSuccess(res, {
      status,
      config,
      description,
      capabilities,
    });
  })
);

/**
 * GET /api/agents/:agentType/tools - 获取 Agent 依赖的 Tool 列表
 */
router.get(
  '/:agentType/tools',
  asyncHandler(async (req, res) => {
    const agentType = req.params.agentType as AgentType;
    const agentService = getAgentService();

    const agent = agentService.getAgent(agentType);

    if (!agent) {
      sendError(res, 'NOT_FOUND', `Agent '${agentType}' 不存在`, 404);
      return;
    }

    const tools = agent.tools;
    const toolDetails = tools.map((toolType) => ({
      type: toolType,
      description: `Tool: ${toolType}`,
    }));

    gameLog.debug('backend', '获取 Agent 依赖的 Tool 列表', {
      agentType,
      toolCount: tools.length,
    });

    sendSuccess(res, {
      agentType,
      tools: toolDetails,
      count: tools.length,
    });
  })
);

/**
 * GET /api/agents/:agentType/bindings - 获取 Agent 的 Binding 配置
 */
router.get(
  '/:agentType/bindings',
  asyncHandler(async (req, res) => {
    const agentType = req.params.agentType as AgentType;
    const agentService = getAgentService();
    const bindingRouter = getBindingRouter();

    const agent = agentService.getAgent(agentType);

    if (!agent) {
      sendError(res, 'NOT_FOUND', `Agent '${agentType}' 不存在`, 404);
      return;
    }

    // 获取 Agent 内部的绑定配置
    const agentBindings = agent.bindings;

    // 获取 BindingRouter 中指向该 Agent 的路由配置
    const allBindings = bindingRouter.getBindings();
    const routerBindings = allBindings.filter((b) => b.agentId === agentType);

    gameLog.debug('backend', '获取 Agent 的 Binding 配置', {
      agentType,
      agentBindingCount: agentBindings.length,
      routerBindingCount: routerBindings.length,
    });

    sendSuccess(res, {
      agentType,
      agentBindings,
      routerBindings,
      counts: {
        agentBindings: agentBindings.length,
        routerBindings: routerBindings.length,
      },
    });
  })
);

/**
 * GET /api/agents/:agentType/capabilities - 获取 Agent 能力描述
 */
router.get(
  '/:agentType/capabilities',
  asyncHandler(async (req, res) => {
    const agentType = req.params.agentType as AgentType;

    const description = AGENT_DESCRIPTIONS[agentType as AgentTypeEnum];
    const capabilities = AGENT_CAPABILITIES[agentType as AgentTypeEnum];

    if (!description || !capabilities) {
      sendError(res, 'NOT_FOUND', `Agent '${agentType}' 不存在`, 404);
      return;
    }

    gameLog.debug('backend', '获取 Agent 能力描述', { agentType });

    sendSuccess(res, {
      agentType,
      description,
      capabilities,
    });
  })
);

/**
 * GET /api/agents/config - 获取所有 Agent 配置
 */
router.get(
  '/config',
  asyncHandler(async (_req, res) => {
    const configService = getAgentConfigService();
    const configs = configService.getAllConfigs();

    gameLog.debug('backend', '获取所有 Agent 配置');

    sendSuccess(res, { configs });
  })
);

/**
 * GET /api/agents/config/:type - 获取特定 Agent 配置
 */
router.get(
  '/config/:type',
  asyncHandler(async (req, res) => {
    const agentType = req.params.type as AgentType;
    const configService = getAgentConfigService();
    const config = configService.getConfig(agentType);

    if (!config) {
      sendError(res, 'NOT_FOUND', `Agent 配置 '${agentType}' 不存在`, 404);
      return;
    }

    gameLog.debug('backend', '获取 Agent 配置', { agentType });

    sendSuccess(res, config);
  })
);

/**
 * PUT /api/agents/config/:type - 更新 Agent 配置
 */
router.put(
  '/config/:type',
  asyncHandler(async (req, res) => {
    const agentType = req.params.type as AgentType;
    const updates = req.body as Partial<AgentConfig> & {
      systemPrompt?: string;
      enabled?: boolean;
    };

    const configService = getAgentConfigService();
    const validation = configService.validateConfig(updates);

    if (!validation.valid) {
      sendError(res, 'VALIDATION_ERROR', '配置验证失败', 400, {
        errors: validation.errors,
      });
      return;
    }

    const config = await configService.updateConfig(agentType, updates);

    if (!config) {
      sendError(res, 'NOT_FOUND', `Agent 配置 '${agentType}' 不存在`, 404);
      return;
    }

    gameLog.info('backend', '更新 Agent 配置', {
      agentType,
      updates: Object.keys(updates),
    });

    sendSuccess(res, config);
  })
);

/**
 * POST /api/agents/config/:type/reset - 重置 Agent 配置
 */
router.post(
  '/config/:type/reset',
  asyncHandler(async (req, res) => {
    const agentType = req.params.type as AgentType;
    const configService = getAgentConfigService();
    const config = await configService.resetConfig(agentType);

    if (!config) {
      sendError(res, 'NOT_FOUND', `Agent 配置 '${agentType}' 不存在`, 404);
      return;
    }

    gameLog.info('backend', '重置 Agent 配置', { agentType });

    sendSuccess(res, config);
  })
);

/**
 * POST /api/agents/start - 启动 Agent 服务
 */
router.post(
  '/start',
  asyncHandler(async (_req, res) => {
    const agentService = await startAgentService();

    gameLog.info('backend', '启动 Agent 服务');

    sendSuccess(res, {
      message: 'Agent 服务已启动',
      started: agentService.isStarted(),
    });
  })
);

/**
 * POST /api/agents/stop - 停止 Agent 服务
 */
router.post(
  '/stop',
  asyncHandler(async (_req, res) => {
    const agentService = getAgentService();
    await agentService.stop();

    gameLog.info('backend', '停止 Agent 服务');

    sendSuccess(res, {
      message: 'Agent 服务已停止',
    });
  })
);

/**
 * GET /api/agents/logs - 获取 Agent 日志
 */
router.get(
  '/logs',
  asyncHandler(async (req, res) => {
    const agentType = req.query.agentType as AgentType | undefined;
    const direction = req.query.direction as 'in' | 'out' | undefined;
    const status = req.query.status as
      | 'pending'
      | 'success'
      | 'error'
      | 'timeout'
      | undefined;
    const limit = req.query.limit
      ? parseInt(req.query.limit as string)
      : 100;

    const agentService = getAgentService();
    const logs = agentService.getLogs({
      agentType,
      direction,
      status,
      limit,
    });

    gameLog.debug('backend', '获取 Agent 日志', {
      agentType,
      direction,
      status,
      limit,
      resultCount: logs.length,
    });

    sendSuccess(res, { logs, count: logs.length });
  })
);

/**
 * DELETE /api/agents/logs - 清除 Agent 日志
 */
router.delete(
  '/logs',
  asyncHandler(async (_req, res) => {
    const agentService = getAgentService();
    agentService.clearLogs();

    gameLog.info('backend', '清除 Agent 日志');

    sendSuccess(res, { message: '日志已清除' });
  })
);

/**
 * POST /api/agents/test - 测试 Agent
 */
router.post(
  '/test',
  asyncHandler(async (req, res) => {
    const { agentType, action, data } = req.body as {
      agentType: AgentType;
      action: string;
      data: Record<string, unknown>;
    };

    if (!agentType || !action) {
      sendError(res, 'VALIDATION_ERROR', '缺少必需字段: agentType, action', 400);
      return;
    }

    const agentService = getAgentService();

    if (!agentService.isStarted()) {
      await agentService.start();
    }

    const agent = agentService.getAgent(agentType);
    if (!agent) {
      sendError(res, 'NOT_FOUND', `Agent '${agentType}' 不存在`, 404);
      return;
    }

    const response = await agent.sendMessage(agentType, action, data, {
      priority: 'high',
      requiresResponse: true,
    });

    gameLog.debug('backend', '测试 Agent', {
      agentType,
      action,
    });

    sendSuccess(res, {
      response,
    });
  })
);

export default router;
