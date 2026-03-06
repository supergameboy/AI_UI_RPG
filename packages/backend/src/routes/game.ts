import { Router, type Router as RouterType } from 'express';
import { getAgentService, startAgentService } from '../services/AgentService';
import { getAgentConfigService } from '../services/AgentConfigService';
import { getBindingRouter } from '../routing/BindingRouter';
import { getToolRegistry } from '../tools/ToolRegistry';
import { getToolSchemaGenerator } from '../services/ToolSchemaGenerator';
import { sendSuccess } from '../utils/response';
import { asyncHandler } from '../middleware/errorHandler';
import { gameLog } from '../services/GameLogService';

const router: RouterType = Router();

/**
 * POST /api/game/initialize - 初始化新游戏
 * 返回：初始状态、Agent 配置、Tool 状态
 */
router.post(
  '/initialize',
  asyncHandler(async (req, res) => {
    const { saveId, templateId } = req.body as {
      saveId?: string;
      templateId?: string;
    };

    gameLog.info('backend', '开始初始化游戏', { saveId, templateId });

    // 1. 确保 Agent 服务已启动
    const agentService = getAgentService();
    if (!agentService.isStarted()) {
      await startAgentService();
    }

    // 2. 获取所有 Agent 状态
    const agentStatuses = agentService.getAllAgentStatuses();

    // 3. 获取 Agent 配置
    const agentConfigService = getAgentConfigService();
    const agentConfigs = agentConfigService.getAllConfigs();

    // 4. 获取 Binding 配置
    const bindingRouter = getBindingRouter();
    const bindings = bindingRouter.getBindings();
    const bindingStats = bindingRouter.getStats();

    // 5. 获取 Tool 状态
    const toolRegistry = getToolRegistry();
    const toolStatuses = toolRegistry.listToolStatuses();
    const toolTypes = toolRegistry.listTools();

    // 6. 获取 Tool Schemas
    const schemaGenerator = getToolSchemaGenerator();
    const toolSchemas = schemaGenerator.generateAllSchemas();

    // 7. 构建初始化响应
    const initialState = {
      // 游戏基本信息
      saveId: saveId || null,
      templateId: templateId || null,
      initializedAt: Date.now(),

      // Agent 相关
      agents: {
        initialized: agentService.isInitialized(),
        started: agentService.isStarted(),
        count: agentStatuses.length,
        statuses: agentStatuses,
        configs: agentConfigs,
      },

      // Binding 相关
      bindings: {
        count: bindings.length,
        enabledCount: bindingStats.enabledCount,
        items: bindings,
      },

      // Tool 相关
      tools: {
        count: toolTypes.length,
        activeCalls: toolRegistry.getActiveCallCount(),
        statuses: toolStatuses,
        schemas: toolSchemas,
      },
    };

    gameLog.info('backend', '游戏初始化完成', {
      agentCount: agentStatuses.length,
      bindingCount: bindings.length,
      toolCount: toolTypes.length,
      schemaCount: toolSchemas.length,
    });

    sendSuccess(res, initialState);
  })
);

/**
 * GET /api/game/state - 获取当前游戏状态
 */
router.get(
  '/state',
  asyncHandler(async (_req, res) => {
    const agentService = getAgentService();
    const bindingRouter = getBindingRouter();
    const toolRegistry = getToolRegistry();

    const agentStatuses = agentService.getAllAgentStatuses();
    const bindings = bindingRouter.getBindings();
    const toolStatuses = toolRegistry.listToolStatuses();

    gameLog.debug('backend', '获取游戏状态');

    sendSuccess(res, {
      timestamp: Date.now(),
      agents: {
        initialized: agentService.isInitialized(),
        started: agentService.isStarted(),
        count: agentStatuses.length,
        statuses: agentStatuses,
      },
      bindings: {
        count: bindings.length,
        items: bindings,
      },
      tools: {
        count: toolStatuses.length,
        activeCalls: toolRegistry.getActiveCallCount(),
        statuses: toolStatuses,
      },
    });
  })
);

/**
 * GET /api/game/summary - 获取游戏摘要信息
 */
router.get(
  '/summary',
  asyncHandler(async (_req, res) => {
    const agentService = getAgentService();
    const bindingRouter = getBindingRouter();
    const toolRegistry = getToolRegistry();

    const agentCount = agentService.getAllAgentStatuses().length;
    const bindingStats = bindingRouter.getStats();
    const toolCount = toolRegistry.getToolCount();

    gameLog.debug('backend', '获取游戏摘要');

    sendSuccess(res, {
      timestamp: Date.now(),
      summary: {
        agents: {
          count: agentCount,
          initialized: agentService.isInitialized(),
          started: agentService.isStarted(),
        },
        bindings: {
          count: bindingStats.bindingCount,
          enabledCount: bindingStats.enabledCount,
          cacheSize: bindingStats.cacheSize,
        },
        tools: {
          count: toolCount,
          activeCalls: toolRegistry.getActiveCallCount(),
        },
      },
    });
  })
);

/**
 * POST /api/game/reset - 重置游戏状态
 */
router.post(
  '/reset',
  asyncHandler(async (req, res) => {
    const { resetAgents, resetBindings, resetTools } = req.body as {
      resetAgents?: boolean;
      resetBindings?: boolean;
      resetTools?: boolean;
    };

    gameLog.info('backend', '重置游戏状态', {
      resetAgents,
      resetBindings,
      resetTools,
    });

    const results: {
      agents?: { reset: boolean; message: string };
      bindings?: { reset: boolean; message: string };
      tools?: { reset: boolean; message: string };
    } = {};

    // 重置 Agents
    if (resetAgents) {
      const agentService = getAgentService();
      await agentService.stop();
      await agentService.start();
      results.agents = {
        reset: true,
        message: 'Agent 服务已重置',
      };
    }

    // 重置 Bindings
    if (resetBindings) {
      const bindingRouter = getBindingRouter();
      const { DEFAULT_BINDINGS } = await import('@ai-rpg/shared');
      bindingRouter.setBindings([...DEFAULT_BINDINGS]);
      results.bindings = {
        reset: true,
        message: 'Binding 配置已重置为默认值',
      };
    }

    // 重置 Tools
    if (resetTools) {
      const schemaGenerator = getToolSchemaGenerator();
      schemaGenerator.invalidateCache();
      results.tools = {
        reset: true,
        message: 'Tool Schema 缓存已清除',
      };
    }

    sendSuccess(res, {
      reset: true,
      results,
    });
  })
);

/**
 * GET /api/game/health - 健康检查
 */
router.get(
  '/health',
  asyncHandler(async (_req, res) => {
    const agentService = getAgentService();
    const toolRegistry = getToolRegistry();
    const bindingRouter = getBindingRouter();

    const health = {
      status: 'healthy',
      timestamp: Date.now(),
      components: {
        agents: {
          status: agentService.isStarted() ? 'running' : 'stopped',
          initialized: agentService.isInitialized(),
          started: agentService.isStarted(),
        },
        tools: {
          status: 'available',
          count: toolRegistry.getToolCount(),
          activeCalls: toolRegistry.getActiveCallCount(),
        },
        bindings: {
          status: 'configured',
          count: bindingRouter.getStats().bindingCount,
        },
      },
    };

    // 检查是否有任何组件不健康
    if (!agentService.isInitialized()) {
      health.status = 'degraded';
    }

    gameLog.debug('backend', '健康检查', { status: health.status });

    sendSuccess(res, health);
  })
);

export default router;
