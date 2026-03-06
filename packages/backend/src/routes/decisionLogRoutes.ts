import { Router, type Router as RouterType } from 'express';
import type {
  AgentType,
  DecisionLog,
  DecisionLogQuery,
} from '@ai-rpg/shared';
import { getDecisionLogService } from '../services/DecisionLogService';
import { sendSuccess, sendError } from '../utils/response';
import { asyncHandler } from '../middleware/errorHandler';
import { gameLog } from '../services/GameLogService';

const router: RouterType = Router();

/**
 * GET /api/decision-logs/stats - 获取统计信息
 * 注意：此路由必须在 /:id 之前定义
 */
router.get(
  '/stats',
  asyncHandler(async (req, res) => {
    const saveId = req.query.saveId as string | undefined;
    const decisionLogService = getDecisionLogService();

    const stats = decisionLogService.getStats();

    // 获取所有日志并计算详细统计
    const allLogs: DecisionLog[] = [];
    const logsMap = (decisionLogService as unknown as { logs: Map<string, DecisionLog> }).logs;
    if (logsMap) {
      logsMap.forEach((log) => {
        if (!saveId || log.saveId === saveId) {
          allLogs.push(log);
        }
      });
    }

    const successCount = allLogs.filter((l) => l.result.success).length;
    const failureCount = allLogs.filter((l) => !l.result.success).length;
    const conflictCount = allLogs.reduce((sum, l) => sum + l.metadata.conflictCount, 0);
    const totalDuration = allLogs.reduce((sum, l) => sum + l.metadata.totalDuration, 0);
    const averageDuration = allLogs.length > 0 ? totalDuration / allLogs.length : 0;

    // 按 Agent 统计
    const agentStats: Record<string, { count: number; totalDuration: number }> = {};
    for (const log of allLogs) {
      for (const agent of log.agents) {
        if (!agentStats[agent.agentId]) {
          agentStats[agent.agentId] = { count: 0, totalDuration: 0 };
        }
        agentStats[agent.agentId].count++;
        agentStats[agent.agentId].totalDuration += agent.duration;
      }
    }

    const formattedAgentStats: Record<AgentType, { count: number; avgDuration: number }> = {} as Record<AgentType, { count: number; avgDuration: number }>;
    for (const [agentId, data] of Object.entries(agentStats)) {
      formattedAgentStats[agentId as AgentType] = {
        count: data.count,
        avgDuration: data.count > 0 ? data.totalDuration / data.count : 0,
      };
    }

    gameLog.debug('backend', '获取决策日志统计', {
      saveId,
      totalLogs: stats.totalLogs,
    });

    sendSuccess(res, {
      total: allLogs.length,
      successCount,
      failureCount,
      conflictCount,
      averageDuration,
      agentStats: formattedAgentStats,
      storageStats: stats,
    });
  })
);

/**
 * GET /api/decision-logs/summaries - 获取决策日志摘要列表
 * 注意：此路由必须在 /:id 之前定义
 */
router.get(
  '/summaries',
  asyncHandler(async (req, res) => {
    const query: DecisionLogQuery = {
      requestId: req.query.requestId as string | undefined,
      playerId: req.query.playerId as string | undefined,
      saveId: req.query.saveId as string | undefined,
      startTime: req.query.startTime ? parseInt(req.query.startTime as string) : undefined,
      endTime: req.query.endTime ? parseInt(req.query.endTime as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
      offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
    };

    const decisionLogService = getDecisionLogService();
    const summaries = decisionLogService.queryLogs(query);

    // 获取总数
    const allSummaries = decisionLogService.queryLogs({ ...query, limit: undefined, offset: undefined });
    const total = allSummaries.length;

    gameLog.debug('backend', '获取决策日志摘要列表', {
      query,
      resultCount: summaries.length,
      total,
    });

    sendSuccess(res, {
      logs: summaries,
      total,
    });
  })
);

/**
 * GET /api/decision-logs/time-range - 按时间范围获取决策日志
 * 注意：此路由必须在 /:id 之前定义
 */
router.get(
  '/time-range',
  asyncHandler(async (req, res) => {
    const startTime = req.query.startTime ? parseInt(req.query.startTime as string) : undefined;
    const endTime = req.query.endTime ? parseInt(req.query.endTime as string) : undefined;

    if (!startTime || !endTime) {
      sendError(res, 'VALIDATION_ERROR', '缺少必需参数: startTime, endTime', 400);
      return;
    }

    const decisionLogService = getDecisionLogService();
    const summaries = decisionLogService.queryLogs({ startTime, endTime, limit: 1000 });

    // 获取完整日志
    const logs: DecisionLog[] = [];
    const logsMap = (decisionLogService as unknown as { logs: Map<string, DecisionLog> }).logs;
    if (logsMap) {
      summaries.forEach((summary) => {
        const log = logsMap.get(summary.id);
        if (log) {
          logs.push(log);
        }
      });
    }

    gameLog.debug('backend', '按时间范围获取决策日志', {
      startTime,
      endTime,
      resultCount: logs.length,
    });

    sendSuccess(res, logs);
  })
);

/**
 * GET /api/decision-logs/export - 导出决策日志
 * 注意：此路由必须在 /:id 之前定义
 */
router.get(
  '/export',
  asyncHandler(async (req, res) => {
    const saveId = req.query.saveId as string | undefined;
    const startTime = req.query.startTime ? parseInt(req.query.startTime as string) : undefined;
    const endTime = req.query.endTime ? parseInt(req.query.endTime as string) : undefined;

    const decisionLogService = getDecisionLogService();
    const summaries = decisionLogService.queryLogs({
      saveId,
      startTime,
      endTime,
      limit: 10000,
    });

    // 获取完整日志
    const logs: DecisionLog[] = [];
    const logsMap = (decisionLogService as unknown as { logs: Map<string, DecisionLog> }).logs;
    if (logsMap) {
      summaries.forEach((summary) => {
        const log = logsMap.get(summary.id);
        if (log) {
          logs.push(log);
        }
      });
    }

    // 设置响应头为 JSON 文件下载
    const filename = `decision-logs-${Date.now()}.json`;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    gameLog.info('backend', '导出决策日志', {
      saveId,
      startTime,
      endTime,
      exportCount: logs.length,
    });

    res.json(logs);
  })
);

/**
 * GET /api/decision-logs/traceback/:requestId - 追溯问题
 * 获取相关日志和状态变化
 */
router.get(
  '/traceback/:requestId',
  asyncHandler(async (req, res) => {
    const requestId = req.params.requestId;

    const decisionLogService = getDecisionLogService();
    const log = decisionLogService.getLogByRequestId(requestId);

    if (!log) {
      sendError(res, 'NOT_FOUND', `未找到 requestId 为 '${requestId}' 的决策日志`, 404);
      return;
    }

    const traceback = decisionLogService.traceback(log.id);

    if (!traceback) {
      sendError(res, 'NOT_FOUND', `无法追溯日志 '${log.id}'`, 404);
      return;
    }

    gameLog.debug('backend', '追溯问题', {
      requestId,
      logId: log.id,
      previousLogsCount: traceback.previousLogs.length,
      relatedLogsCount: traceback.relatedLogs.length,
    });

    sendSuccess(res, traceback);
  })
);

/**
 * GET /api/decision-logs/request/:requestId - 按 requestId 获取决策日志
 */
router.get(
  '/request/:requestId',
  asyncHandler(async (req, res) => {
    const requestId = req.params.requestId;

    const decisionLogService = getDecisionLogService();
    const log = decisionLogService.getLogByRequestId(requestId);

    if (!log) {
      sendError(res, 'NOT_FOUND', `未找到 requestId 为 '${requestId}' 的决策日志`, 404);
      return;
    }

    gameLog.debug('backend', '按 requestId 获取决策日志', {
      requestId,
      logId: log.id,
    });

    sendSuccess(res, log);
  })
);

/**
 * GET /api/decision-logs/:id - 获取单个决策日志详情
 */
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = req.params.id;

    const decisionLogService = getDecisionLogService();
    const log = decisionLogService.getLog(id);

    if (!log) {
      sendError(res, 'NOT_FOUND', `未找到决策日志 '${id}'`, 404);
      return;
    }

    gameLog.debug('backend', '获取决策日志详情', { id });

    sendSuccess(res, log);
  })
);

/**
 * GET /api/decision-logs - 获取决策日志列表
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const query: DecisionLogQuery = {
      requestId: req.query.requestId as string | undefined,
      playerId: req.query.playerId as string | undefined,
      saveId: req.query.saveId as string | undefined,
      startTime: req.query.startTime ? parseInt(req.query.startTime as string) : undefined,
      endTime: req.query.endTime ? parseInt(req.query.endTime as string) : undefined,
      agentId: req.query.agentId as AgentType | undefined,
      hasConflicts: req.query.hasConflicts === 'true' ? true : req.query.hasConflicts === 'false' ? false : undefined,
      success: req.query.success === 'true' ? true : req.query.success === 'false' ? false : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
      offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
    };

    const decisionLogService = getDecisionLogService();
    const summaries = decisionLogService.queryLogs(query);

    // 获取完整日志
    const logs: DecisionLog[] = [];
    const logsMap = (decisionLogService as unknown as { logs: Map<string, DecisionLog> }).logs;
    if (logsMap) {
      summaries.forEach((summary) => {
        const log = logsMap.get(summary.id);
        if (log) {
          logs.push(log);
        }
      });
    }

    // 获取总数
    const allSummaries = decisionLogService.queryLogs({ ...query, limit: undefined, offset: undefined });
    const total = allSummaries.length;
    const hasMore = query.offset !== undefined && query.limit !== undefined
      ? query.offset + query.limit < total
      : false;

    gameLog.debug('backend', '获取决策日志列表', {
      query,
      resultCount: logs.length,
      total,
      hasMore,
    });

    sendSuccess(res, {
      logs,
      total,
      hasMore,
    });
  })
);

/**
 * DELETE /api/decision-logs/:id - 删除决策日志
 */
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = req.params.id;

    const decisionLogService = getDecisionLogService();
    const log = decisionLogService.getLog(id);

    if (!log) {
      sendError(res, 'NOT_FOUND', `未找到决策日志 '${id}'`, 404);
      return;
    }

    // 从内存中删除
    const logsMap = (decisionLogService as unknown as { logs: Map<string, DecisionLog> });
    const requestLogMap = (decisionLogService as unknown as { requestLogMap: Map<string, string> });

    if (logsMap.logs && requestLogMap.requestLogMap) {
      logsMap.logs.delete(id);
      requestLogMap.requestLogMap.delete(log.requestId);
    }

    gameLog.info('backend', '删除决策日志', { id, requestId: log.requestId });

    sendSuccess(res, {
      success: true,
      message: `决策日志 '${id}' 已删除`,
    });
  })
);

/**
 * POST /api/decision-logs/cleanup - 清理过期日志
 */
router.post(
  '/cleanup',
  asyncHandler(async (req, res) => {
    const { olderThanDays } = req.body as { olderThanDays?: number };

    const days = olderThanDays ?? 30;

    if (typeof days !== 'number' || days < 1) {
      sendError(res, 'VALIDATION_ERROR', 'olderThanDays 必须是大于 0 的数字', 400);
      return;
    }

    const decisionLogService = getDecisionLogService();
    const deletedCount = decisionLogService.cleanup(days);

    gameLog.info('backend', '清理过期决策日志', {
      olderThanDays: days,
      deletedCount,
    });

    sendSuccess(res, {
      success: true,
      deletedCount,
    });
  })
);

export default router;
