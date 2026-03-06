import type {
  AgentType,
  DecisionLog,
  DecisionLogAgent,
  DecisionLogAgentDecision,
  DecisionLogLLMCall,
  DecisionLogToolCall,
  DecisionLogConflict,
  DecisionLogResult,
  DecisionLogQuery,
  DecisionLogSummary,
  DecisionLogTraceback,
  DecisionLogConfig,
  ContextData,
} from '@ai-rpg/shared';
import { DEFAULT_DECISION_LOG_CONFIG } from '@ai-rpg/shared';
import { gameLog } from '../services/GameLogService';

export class DecisionLogService {
  private config: DecisionLogConfig;
  private logs: Map<string, DecisionLog> = new Map();
  private requestLogMap: Map<string, string> = new Map();
  private currentLog: DecisionLog | null = null;
  private currentAgents: Map<AgentType, DecisionLogAgent> = new Map();

  constructor(config?: Partial<DecisionLogConfig>) {
    this.config = {
      ...DEFAULT_DECISION_LOG_CONFIG,
      ...config,
    };
  }

  startLog(
    requestId: string,
    playerId: string,
    saveId: string,
    playerInput: string,
    inputType: string
  ): DecisionLog {
    const log: DecisionLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      requestId,
      playerId,
      saveId,
      playerInput,
      inputType,
      agents: [],
      conflicts: [],
      result: {
        success: false,
        response: '',
        stateChanges: {},
      },
      metadata: {
        totalTokens: 0,
        totalDuration: 0,
        agentCount: 0,
        toolCallCount: 0,
        conflictCount: 0,
        version: '1.0.0',
      },
    };

    this.currentLog = log;
    this.currentAgents.clear();

    if (this.config.enabled) {
      gameLog.debug('backend', 'Decision log started', { requestId, playerId });
    }

    return log;
  }

  startAgentLog(
    agentId: AgentType,
    contextSnapshot: Record<string, unknown>
  ): void {
    if (!this.currentLog || !this.config.enabled) return;

    const agentLog: DecisionLogAgent = {
      agentId,
      contextSnapshot,
      decisions: [],
      contextChanges: [],
      duration: 0,
    };

    this.currentAgents.set(agentId, { ...agentLog, duration: Date.now() });
  }

  endAgentLog(agentId: AgentType): void {
    if (!this.currentLog || !this.config.enabled) return;

    const agentLog = this.currentAgents.get(agentId);
    if (agentLog) {
      agentLog.duration = Date.now() - (agentLog.duration as unknown as number);
      this.currentLog.agents.push(agentLog);
      this.currentAgents.delete(agentId);
    }
  }

  addDecision(
    agentId: AgentType,
    decision: Omit<DecisionLogAgentDecision, 'toolCalls'> & { toolCalls?: DecisionLogToolCall[] }
  ): void {
    if (!this.currentLog || !this.config.enabled) return;

    const agentLog = this.currentAgents.get(agentId);
    if (agentLog) {
      agentLog.decisions.push({
        ...decision,
        toolCalls: decision.toolCalls ?? [],
      });
    }
  }

  addLLMCall(agentId: AgentType, llmCall: DecisionLogLLMCall): void {
    if (!this.currentLog || !this.config.enabled || !this.config.logLLMCalls) return;

    const agentLog = this.currentAgents.get(agentId);
    if (agentLog && agentLog.decisions.length > 0) {
      const lastDecision = agentLog.decisions[agentLog.decisions.length - 1];
      lastDecision.llmCall = llmCall;
      this.currentLog.metadata.totalTokens += llmCall.tokens.total;
    }
  }

  addToolCall(agentId: AgentType, toolCall: DecisionLogToolCall): void {
    if (!this.currentLog || !this.config.enabled || !this.config.logToolCalls) return;

    const agentLog = this.currentAgents.get(agentId);
    if (agentLog && agentLog.decisions.length > 0) {
      const lastDecision = agentLog.decisions[agentLog.decisions.length - 1];
      lastDecision.toolCalls.push(toolCall);
      this.currentLog.metadata.toolCallCount++;
    }
  }

  addContextChange(agentId: AgentType, change: ContextData): void {
    if (!this.currentLog || !this.config.enabled || !this.config.logContextChanges) return;

    const agentLog = this.currentAgents.get(agentId);
    if (agentLog) {
      agentLog.contextChanges.push(change);
    }
  }

  addConflict(conflict: DecisionLogConflict): void {
    if (!this.currentLog || !this.config.enabled) return;

    this.currentLog.conflicts.push(conflict);
    this.currentLog.metadata.conflictCount++;
  }

  setResult(result: DecisionLogResult): void {
    if (!this.currentLog) return;

    this.currentLog.result = result;
  }

  endLog(): DecisionLog | null {
    if (!this.currentLog) return null;

    this.currentLog.metadata.agentCount = this.currentLog.agents.length;
    this.currentLog.metadata.totalDuration = Date.now() - this.currentLog.timestamp;

    if (this.config.persistToDatabase) {
      this.logs.set(this.currentLog.id, this.currentLog);
      this.requestLogMap.set(this.currentLog.requestId, this.currentLog.id);
    }

    const completedLog = this.currentLog;
    this.currentLog = null;
    this.currentAgents.clear();

    if (this.config.enabled) {
      gameLog.debug('backend', 'Decision log completed', {
        logId: completedLog.id,
        agentCount: completedLog.metadata.agentCount,
        duration: completedLog.metadata.totalDuration,
      });
    }

    return completedLog;
  }

  getLog(logId: string): DecisionLog | undefined {
    return this.logs.get(logId);
  }

  getLogByRequestId(requestId: string): DecisionLog | undefined {
    const logId = this.requestLogMap.get(requestId);
    return logId ? this.logs.get(logId) : undefined;
  }

  queryLogs(query: DecisionLogQuery): DecisionLogSummary[] {
    let results: DecisionLog[] = Array.from(this.logs.values());

    if (query.id) {
      results = results.filter((l) => l.id === query.id);
    }
    if (query.requestId) {
      results = results.filter((l) => l.requestId === query.requestId);
    }
    if (query.playerId) {
      results = results.filter((l) => l.playerId === query.playerId);
    }
    if (query.saveId) {
      results = results.filter((l) => l.saveId === query.saveId);
    }
    if (query.startTime) {
      results = results.filter((l) => l.timestamp >= query.startTime!);
    }
    if (query.endTime) {
      results = results.filter((l) => l.timestamp <= query.endTime!);
    }
    if (query.agentId) {
      results = results.filter((l) => l.agents.some((a) => a.agentId === query.agentId));
    }
    if (query.hasConflicts !== undefined) {
      results = results.filter((l) =>
        query.hasConflicts ? l.conflicts.length > 0 : l.conflicts.length === 0
      );
    }
    if (query.success !== undefined) {
      results = results.filter((l) => l.result.success === query.success);
    }

    results.sort((a, b) => b.timestamp - a.timestamp);

    const offset = query.offset ?? 0;
    const limit = query.limit ?? 50;
    results = results.slice(offset, offset + limit);

    return results.map((l) => ({
      id: l.id,
      timestamp: l.timestamp,
      playerInput: l.playerInput,
      success: l.result.success,
      agentCount: l.metadata.agentCount,
      conflictCount: l.metadata.conflictCount,
      duration: l.metadata.totalDuration,
    }));
  }

  traceback(logId: string): DecisionLogTraceback | null {
    const log = this.logs.get(logId);
    if (!log) return null;

    const previousLogs = Array.from(this.logs.values())
      .filter((l) => l.saveId === log.saveId && l.timestamp < log.timestamp)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10)
      .map((l) => ({
        id: l.id,
        timestamp: l.timestamp,
        playerInput: l.playerInput,
        success: l.result.success,
        agentCount: l.metadata.agentCount,
        conflictCount: l.metadata.conflictCount,
        duration: l.metadata.totalDuration,
      }));

    const relatedLogs = Array.from(this.logs.values())
      .filter(
        (l) =>
          l.id !== logId &&
          (l.requestId === log.requestId || l.playerId === log.playerId)
      )
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 5)
      .map((l) => ({
        id: l.id,
        timestamp: l.timestamp,
        playerInput: l.playerInput,
        success: l.result.success,
        agentCount: l.metadata.agentCount,
        conflictCount: l.metadata.conflictCount,
        duration: l.metadata.totalDuration,
      }));

    const stateBefore: Record<string, unknown> = {};
    const stateAfter: Record<string, unknown> = log.result.stateChanges;

    for (const agent of log.agents) {
      if (agent.contextSnapshot) {
        Object.assign(stateBefore, agent.contextSnapshot);
      }
    }

    const diff = this.computeDiff(stateBefore, stateAfter);

    return {
      log,
      previousLogs,
      relatedLogs,
      stateBefore,
      stateAfter,
      diff,
    };
  }

  private computeDiff(
    before: Record<string, unknown>,
    after: Record<string, unknown>
  ): DecisionLogTraceback['diff'] {
    const diffs: DecisionLogTraceback['diff'] = [];
    const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);

    for (const key of allKeys) {
      if (!(key in before)) {
        diffs.push({
          path: key,
          type: 'added',
          oldValue: undefined,
          newValue: after[key],
        });
      } else if (!(key in after)) {
        diffs.push({
          path: key,
          type: 'removed',
          oldValue: before[key],
          newValue: undefined,
        });
      } else if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
        diffs.push({
          path: key,
          type: 'modified',
          oldValue: before[key],
          newValue: after[key],
        });
      }
    }

    return diffs;
  }

  cleanup(retentionDays?: number): number {
    const days = retentionDays ?? this.config.retentionDays;
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    let removed = 0;

    for (const [id, log] of this.logs) {
      if (log.timestamp < cutoff) {
        this.logs.delete(id);
        this.requestLogMap.delete(log.requestId);
        removed++;
      }
    }

    if (removed > 0) {
      gameLog.info('backend', 'Decision logs cleaned up', { removed, retentionDays: days });
    }

    return removed;
  }

  getStats(): {
    totalLogs: number;
    totalSize: number;
    oldestTimestamp: number | null;
    newestTimestamp: number | null;
  } {
    const logs = Array.from(this.logs.values());
    return {
      totalLogs: logs.length,
      totalSize: JSON.stringify(logs).length,
      oldestTimestamp: logs.length > 0 ? Math.min(...logs.map((l) => l.timestamp)) : null,
      newestTimestamp: logs.length > 0 ? Math.max(...logs.map((l) => l.timestamp)) : null,
    };
  }
}

let globalDecisionLogService: DecisionLogService | null = null;

export function getDecisionLogService(config?: Partial<DecisionLogConfig>): DecisionLogService {
  if (!globalDecisionLogService) {
    globalDecisionLogService = new DecisionLogService(config);
  }
  return globalDecisionLogService;
}

export function resetDecisionLogService(): void {
  globalDecisionLogService = null;
}
