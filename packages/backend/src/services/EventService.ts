/**
 * 事件服务
 * 提供游戏事件管理的业务逻辑层，支持随机事件、剧情事件、地点事件、条件事件
 * 存储策略：内存 + 数据库（活跃事件在内存中，历史触发记录存数据库）
 */

import { DatabaseService } from './DatabaseService';
import { gameLog } from './GameLogService';

// ==================== 类型定义 ====================

export type EventType = 'random' | 'story' | 'location' | 'condition';

export type ConditionType = 'attribute' | 'item' | 'quest' | 'flag' | 'location' | 'time' | 'custom';

export type ConditionOperator = 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'has' | 'not_has';

export type EffectType = 'dialogue' | 'combat' | 'item' | 'quest' | 'teleport' | 'flag' | 'stat' | 'custom';

export interface EventCondition {
  type: ConditionType;
  target: string;
  operator: ConditionOperator;
  value: unknown;
}

export interface EventEffect {
  type: EffectType;
  action: string;
  params: Record<string, unknown>;
}

export interface EventTrigger {
  probability?: number;
  locationId?: string;
  conditions?: EventCondition[];
  storyFlag?: string;
}

export interface EventChain {
  nextEventId: string;
  triggerDelay?: number;
}

export interface EventMetadata {
  priority: number;
  repeatable: boolean;
  cooldown?: number;
  maxTriggers?: number;
}

export interface EventStatus {
  triggerCount: number;
  lastTriggered?: number;
  isActive: boolean;
}

export interface GameEvent {
  id: string;
  saveId: string;
  type: EventType;
  name: string;
  description: string;
  trigger: EventTrigger;
  effects: EventEffect[];
  chain?: EventChain;
  metadata: EventMetadata;
  status: EventStatus;
}

export interface EventTriggerRecord {
  id: string;
  eventId: string;
  saveId: string;
  characterId: string;
  timestamp: number;
  context: {
    location: string;
    previousEvents: string[];
    playerChoices: string[];
  };
  result: {
    success: boolean;
    effects: string[];
  };
}

export interface EventContext {
  saveId: string;
  characterId: string;
  locationId: string;
  characterAttributes: Record<string, number>;
  inventory: string[];
  questFlags: string[];
  storyFlags: Record<string, unknown>;
  currentTime: number;
  previousEvents: string[];
  playerChoices: string[];
}

export interface SerializedEventState {
  events: GameEvent[];
  triggerRecords: EventTriggerRecord[];
}

// ==================== 辅助函数 ====================

function generateId(): string {
  return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generateRecordId(): string {
  return `record_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ==================== 数据库行类型 ====================

interface EventRow {
  id: string;
  save_id: string;
  type: string;
  name: string;
  description: string;
  trigger_config: string;
  effects: string;
  chain: string | null;
  metadata: string;
  status: string;
  created_at: number;
  updated_at: number;
}

interface TriggerRecordRow {
  id: string;
  event_id: string;
  save_id: string;
  character_id: string;
  timestamp: number;
  context: string;
  result: string;
  created_at: number;
}

// ==================== EventService 类 ====================

class EventService {
  private static instance: EventService | null = null;

  // 内存缓存：活跃事件
  private activeEvents: Map<string, GameEvent> = new Map();
  // 按存档ID索引的事件
  private eventsBySaveId: Map<string, Set<string>> = new Map();
  // 触发记录缓存
  private triggerRecordCache: Map<string, EventTriggerRecord[]> = new Map();

  private constructor() {}

  /**
   * 获取单例实例
   */
  public static getInstance(): EventService {
    if (!EventService.instance) {
      EventService.instance = new EventService();
    }
    return EventService.instance;
  }

  private getDb(): DatabaseService {
    return DatabaseService.getInstance();
  }

  // ==================== 事件 CRUD ====================

  /**
   * 创建事件
   */
  public createEvent(eventData: Omit<GameEvent, 'id' | 'status'> & { id?: string; status?: Partial<EventStatus> }): GameEvent {
    const id = eventData.id ?? generateId();
    const now = Math.floor(Date.now() / 1000);

    const event: GameEvent = {
      id,
      saveId: eventData.saveId,
      type: eventData.type,
      name: eventData.name,
      description: eventData.description,
      trigger: eventData.trigger,
      effects: eventData.effects,
      chain: eventData.chain,
      metadata: eventData.metadata,
      status: {
        triggerCount: 0,
        lastTriggered: undefined,
        isActive: true,
        ...eventData.status,
      },
    };

    // 存入数据库
    const db = this.getDb();
    const stmt = db.prepare(`
      INSERT INTO events (id, save_id, type, name, description, trigger_config, effects, chain, metadata, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      event.id,
      event.saveId,
      event.type,
      event.name,
      event.description,
      JSON.stringify(event.trigger),
      JSON.stringify(event.effects),
      event.chain ? JSON.stringify(event.chain) : null,
      JSON.stringify(event.metadata),
      JSON.stringify(event.status),
      now,
      now
    );

    // 更新内存缓存
    this.activeEvents.set(event.id, event);
    if (!this.eventsBySaveId.has(event.saveId)) {
      this.eventsBySaveId.set(event.saveId, new Set());
    }
    this.eventsBySaveId.get(event.saveId)!.add(event.id);

    gameLog.info('backend', '事件创建成功', { eventId: event.id, type: event.type, name: event.name });

    return event;
  }

  /**
   * 获取事件
   */
  public getEvent(eventId: string): GameEvent | undefined {
    // 先查内存缓存
    if (this.activeEvents.has(eventId)) {
      return this.activeEvents.get(eventId);
    }

    // 查数据库
    const db = this.getDb();
    const stmt = db.prepare<EventRow>('SELECT * FROM events WHERE id = ?');
    const row = stmt.get(eventId);

    if (!row) {
      return undefined;
    }

    const event = this.rowToEvent(row);
    // 更新内存缓存
    this.activeEvents.set(eventId, event);
    if (!this.eventsBySaveId.has(event.saveId)) {
      this.eventsBySaveId.set(event.saveId, new Set());
    }
    this.eventsBySaveId.get(event.saveId)!.add(eventId);

    return event;
  }

  /**
   * 列出事件
   */
  public listEvents(options?: {
    saveId?: string;
    type?: EventType;
    isActive?: boolean;
    limit?: number;
  }): GameEvent[] {
    const db = this.getDb();
    let sql = 'SELECT * FROM events WHERE 1=1';
    const params: unknown[] = [];

    if (options?.saveId) {
      sql += ' AND save_id = ?';
      params.push(options.saveId);
    }

    if (options?.type) {
      sql += ' AND type = ?';
      params.push(options.type);
    }

    if (options?.isActive !== undefined) {
      // SQLite 不支持直接查询 JSON，需要在应用层过滤
    }

    sql += ' ORDER BY created_at DESC';

    if (options?.limit) {
      sql += ' LIMIT ?';
      params.push(options.limit);
    }

    const stmt = db.prepare<EventRow>(sql);
    let events = stmt.all(...params).map(row => this.rowToEvent(row));

    // 在应用层过滤 isActive
    if (options?.isActive !== undefined) {
      events = events.filter(e => e.status.isActive === options.isActive);
    }

    return events;
  }

  /**
   * 更新事件
   */
  public updateEvent(eventId: string, updates: Partial<Omit<GameEvent, 'id' | 'saveId'>>): GameEvent | undefined {
    const existing = this.getEvent(eventId);
    if (!existing) {
      gameLog.warn('backend', '更新事件失败：事件不存在', { eventId });
      return undefined;
    }

    const now = Math.floor(Date.now() / 1000);
    const updated: GameEvent = {
      ...existing,
      ...updates,
      status: {
        ...existing.status,
        ...updates.status,
      },
    };

    const db = this.getDb();
    const stmt = db.prepare(`
      UPDATE events
      SET type = ?, name = ?, description = ?, trigger_config = ?, effects = ?, chain = ?, metadata = ?, status = ?, updated_at = ?
      WHERE id = ?
    `);

    stmt.run(
      updated.type,
      updated.name,
      updated.description,
      JSON.stringify(updated.trigger),
      JSON.stringify(updated.effects),
      updated.chain ? JSON.stringify(updated.chain) : null,
      JSON.stringify(updated.metadata),
      JSON.stringify(updated.status),
      now,
      eventId
    );

    // 更新内存缓存
    this.activeEvents.set(eventId, updated);

    gameLog.debug('backend', '事件更新成功', { eventId, updates: Object.keys(updates) });

    return updated;
  }

  /**
   * 删除事件
   */
  public deleteEvent(eventId: string): boolean {
    const event = this.getEvent(eventId);
    if (!event) {
      return false;
    }

    const db = this.getDb();

    // 删除相关的触发记录
    const deleteRecordsStmt = db.prepare('DELETE FROM event_trigger_records WHERE event_id = ?');
    deleteRecordsStmt.run(eventId);

    // 删除事件
    const stmt = db.prepare('DELETE FROM events WHERE id = ?');
    const result = stmt.run(eventId);

    // 更新内存缓存
    this.activeEvents.delete(eventId);
    const saveEvents = this.eventsBySaveId.get(event.saveId);
    if (saveEvents) {
      saveEvents.delete(eventId);
    }
    this.triggerRecordCache.delete(eventId);

    gameLog.info('backend', '事件删除成功', { eventId });

    return result.changes > 0;
  }

  // ==================== 条件检查 ====================

  /**
   * 检查条件是否满足
   */
  public checkConditions(conditions: EventCondition[], context: EventContext): { satisfied: boolean; failedConditions: EventCondition[] } {
    const failedConditions: EventCondition[] = [];

    for (const condition of conditions) {
      if (!this.checkSingleCondition(condition, context)) {
        failedConditions.push(condition);
      }
    }

    return {
      satisfied: failedConditions.length === 0,
      failedConditions,
    };
  }

  /**
   * 检查单个条件
   */
  private checkSingleCondition(condition: EventCondition, context: EventContext): boolean {
    let targetValue: unknown;

    switch (condition.type) {
      case 'attribute':
        targetValue = context.characterAttributes[condition.target];
        break;
      case 'item':
        targetValue = context.inventory;
        break;
      case 'quest':
        targetValue = context.questFlags.includes(condition.target);
        break;
      case 'flag':
        targetValue = context.storyFlags[condition.target];
        break;
      case 'location':
        targetValue = context.locationId;
        break;
      case 'time':
        targetValue = context.currentTime;
        break;
      case 'custom':
        // 自定义条件需要外部处理
        return true;
      default:
        return false;
    }

    return this.compareValues(targetValue, condition.operator, condition.value);
  }

  /**
   * 比较值
   */
  private compareValues(actual: unknown, operator: ConditionOperator, expected: unknown): boolean {
    switch (operator) {
      case 'eq':
        return actual === expected;
      case 'ne':
        return actual !== expected;
      case 'gt':
        return typeof actual === 'number' && typeof expected === 'number' && actual > expected;
      case 'lt':
        return typeof actual === 'number' && typeof expected === 'number' && actual < expected;
      case 'gte':
        return typeof actual === 'number' && typeof expected === 'number' && actual >= expected;
      case 'lte':
        return typeof actual === 'number' && typeof expected === 'number' && actual <= expected;
      case 'has':
        return Array.isArray(actual) && actual.includes(expected as string);
      case 'not_has':
        return Array.isArray(actual) && !actual.includes(expected as string);
      default:
        return false;
    }
  }

  /**
   * 检查地点触发
   */
  public checkLocationTriggers(locationId: string, context: EventContext): GameEvent[] {
    const events = this.listEvents({ saveId: context.saveId, isActive: true });
    const triggeredEvents: GameEvent[] = [];

    for (const event of events) {
      if (event.type !== 'location') continue;
      if (event.trigger.locationId !== locationId) continue;

      // 检查冷却时间
      if (!this.checkCooldown(event)) continue;

      // 检查触发次数限制
      if (!this.checkTriggerLimit(event)) continue;

      // 检查额外条件
      if (event.trigger.conditions && event.trigger.conditions.length > 0) {
        const { satisfied } = this.checkConditions(event.trigger.conditions, context);
        if (!satisfied) continue;
      }

      triggeredEvents.push(event);
    }

    // 按优先级排序
    triggeredEvents.sort((a, b) => b.metadata.priority - a.metadata.priority);

    gameLog.debug('backend', '地点事件检查完成', { locationId, triggeredCount: triggeredEvents.length });

    return triggeredEvents;
  }

  /**
   * 检查条件触发
   */
  public checkConditionTriggers(context: EventContext): GameEvent[] {
    const events = this.listEvents({ saveId: context.saveId, isActive: true });
    const triggeredEvents: GameEvent[] = [];

    for (const event of events) {
      if (event.type !== 'condition') continue;

      // 检查冷却时间
      if (!this.checkCooldown(event)) continue;

      // 检查触发次数限制
      if (!this.checkTriggerLimit(event)) continue;

      // 检查条件
      if (!event.trigger.conditions || event.trigger.conditions.length === 0) continue;

      const { satisfied } = this.checkConditions(event.trigger.conditions, context);
      if (satisfied) {
        triggeredEvents.push(event);
      }
    }

    // 按优先级排序
    triggeredEvents.sort((a, b) => b.metadata.priority - a.metadata.priority);

    gameLog.debug('backend', '条件事件检查完成', { triggeredCount: triggeredEvents.length });

    return triggeredEvents;
  }

  /**
   * 检查冷却时间
   */
  private checkCooldown(event: GameEvent): boolean {
    if (!event.metadata.cooldown) return true;
    if (!event.status.lastTriggered) return true;

    const elapsed = Date.now() - event.status.lastTriggered;
    return elapsed >= event.metadata.cooldown;
  }

  /**
   * 检查触发次数限制
   */
  private checkTriggerLimit(event: GameEvent): boolean {
    if (!event.metadata.maxTriggers) return true;
    return event.status.triggerCount < event.metadata.maxTriggers;
  }

  // ==================== 触发管理 ====================

  /**
   * 触发事件
   */
  public triggerEvent(eventId: string, context: EventContext): {
    success: boolean;
    event?: GameEvent;
    effects?: EventEffect[];
    error?: string;
  } {
    const event = this.getEvent(eventId);
    if (!event) {
      return { success: false, error: '事件不存在' };
    }

    if (!event.status.isActive) {
      return { success: false, error: '事件未激活' };
    }

    // 检查是否可重复触发
    if (!event.metadata.repeatable && event.status.triggerCount > 0) {
      return { success: false, error: '事件不可重复触发' };
    }

    // 检查冷却时间
    if (!this.checkCooldown(event)) {
      return { success: false, error: '事件冷却中' };
    }

    // 检查触发次数限制
    if (!this.checkTriggerLimit(event)) {
      return { success: false, error: '已达到最大触发次数' };
    }

    // 执行效果
    const executedEffects: EventEffect[] = [];
    for (const effect of event.effects) {
      executedEffects.push(effect);
    }

    // 记录触发
    this.recordTrigger(event, context, executedEffects);

    // 更新事件状态
    this.updateEvent(eventId, {
      status: {
        triggerCount: event.status.triggerCount + 1,
        lastTriggered: Date.now(),
        isActive: event.metadata.repeatable || event.status.triggerCount + 1 < (event.metadata.maxTriggers || Infinity),
      },
    });

    gameLog.info('backend', '事件触发成功', {
      eventId,
      eventName: event.name,
      effectsCount: executedEffects.length,
    });

    return {
      success: true,
      event: this.getEvent(eventId),
      effects: executedEffects,
    };
  }

  /**
   * 记录触发
   */
  private recordTrigger(event: GameEvent, context: EventContext, effects: EventEffect[]): EventTriggerRecord {
    const record: EventTriggerRecord = {
      id: generateRecordId(),
      eventId: event.id,
      saveId: context.saveId,
      characterId: context.characterId,
      timestamp: Date.now(),
      context: {
        location: context.locationId,
        previousEvents: context.previousEvents,
        playerChoices: context.playerChoices,
      },
      result: {
        success: true,
        effects: effects.map(e => `${e.type}:${e.action}`),
      },
    };

    // 存入数据库
    const db = this.getDb();
    const stmt = db.prepare(`
      INSERT INTO event_trigger_records (id, event_id, save_id, character_id, timestamp, context, result, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      record.id,
      record.eventId,
      record.saveId,
      record.characterId,
      record.timestamp,
      JSON.stringify(record.context),
      JSON.stringify(record.result),
      Math.floor(Date.now() / 1000)
    );

    // 更新缓存
    if (!this.triggerRecordCache.has(event.id)) {
      this.triggerRecordCache.set(event.id, []);
    }
    this.triggerRecordCache.get(event.id)!.push(record);

    gameLog.debug('backend', '事件触发记录已保存', { recordId: record.id, eventId: event.id });

    return record;
  }

  /**
   * 获取触发历史
   */
  public getTriggerHistory(options: {
    eventId?: string;
    saveId?: string;
    characterId?: string;
    limit?: number;
  }): EventTriggerRecord[] {
    const db = this.getDb();
    let sql = 'SELECT * FROM event_trigger_records WHERE 1=1';
    const params: unknown[] = [];

    if (options.eventId) {
      sql += ' AND event_id = ?';
      params.push(options.eventId);
    }

    if (options.saveId) {
      sql += ' AND save_id = ?';
      params.push(options.saveId);
    }

    if (options.characterId) {
      sql += ' AND character_id = ?';
      params.push(options.characterId);
    }

    sql += ' ORDER BY timestamp DESC';

    const limit = options.limit || 100;
    sql += ' LIMIT ?';
    params.push(limit);

    const stmt = db.prepare<TriggerRecordRow>(sql);
    const rows = stmt.all(...params);

    return rows.map(row => this.rowToTriggerRecord(row));
  }

  // ==================== 事件链 ====================

  /**
   * 获取下一个事件
   */
  public getNextEvent(eventId: string): GameEvent | undefined {
    const event = this.getEvent(eventId);
    if (!event || !event.chain) {
      return undefined;
    }

    return this.getEvent(event.chain.nextEventId);
  }

  /**
   * 获取事件链进度
   */
  public getChainProgress(eventId: string): {
    currentEvent: GameEvent;
    chainEvents: GameEvent[];
    progress: number;
    isComplete: boolean;
  } {
    const currentEvent = this.getEvent(eventId);
    if (!currentEvent) {
      throw new Error('事件不存在');
    }

    const chainEvents: GameEvent[] = [currentEvent];
    let nextEvent = this.getNextEvent(eventId);

    // 追踪事件链
    const visited = new Set<string>([eventId]);
    while (nextEvent && !visited.has(nextEvent.id)) {
      chainEvents.push(nextEvent);
      visited.add(nextEvent.id);
      nextEvent = this.getNextEvent(nextEvent.id);
    }

    // 计算进度
    const triggeredCount = chainEvents.filter(e => e.status.triggerCount > 0).length;
    const progress = triggeredCount / chainEvents.length;
    const isComplete = triggeredCount === chainEvents.length;

    gameLog.debug('backend', '事件链进度查询', {
      eventId,
      chainLength: chainEvents.length,
      triggeredCount,
      progress: progress.toFixed(2),
    });

    return {
      currentEvent,
      chainEvents,
      progress,
      isComplete,
    };
  }

  // ==================== 存读档支持 ====================

  /**
   * 序列化状态
   */
  public serializeState(saveId: string): SerializedEventState {
    const events = this.listEvents({ saveId });
    const triggerRecords = this.getTriggerHistory({ saveId, limit: 1000 });

    gameLog.info('backend', '序列化事件状态', {
      saveId,
      eventsCount: events.length,
      recordsCount: triggerRecords.length,
    });

    return {
      events,
      triggerRecords,
    };
  }

  /**
   * 反序列化状态
   */
  public deserializeState(saveId: string, state: SerializedEventState): void {
    // 清除现有数据
    this.clearSaveEvents(saveId);

    // 恢复事件
    for (const event of state.events) {
      const db = this.getDb();
      const now = Math.floor(Date.now() / 1000);
      const stmt = db.prepare(`
        INSERT INTO events (id, save_id, type, name, description, trigger_config, effects, chain, metadata, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        event.id,
        event.saveId,
        event.type,
        event.name,
        event.description,
        JSON.stringify(event.trigger),
        JSON.stringify(event.effects),
        event.chain ? JSON.stringify(event.chain) : null,
        JSON.stringify(event.metadata),
        JSON.stringify(event.status),
        now,
        now
      );

      // 更新内存缓存
      this.activeEvents.set(event.id, event);
      if (!this.eventsBySaveId.has(event.saveId)) {
        this.eventsBySaveId.set(event.saveId, new Set());
      }
      this.eventsBySaveId.get(event.saveId)!.add(event.id);
    }

    // 恢复触发记录
    for (const record of state.triggerRecords) {
      const db = this.getDb();
      const stmt = db.prepare(`
        INSERT INTO event_trigger_records (id, event_id, save_id, character_id, timestamp, context, result, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        record.id,
        record.eventId,
        record.saveId,
        record.characterId,
        record.timestamp,
        JSON.stringify(record.context),
        JSON.stringify(record.result),
        Math.floor(Date.now() / 1000)
      );
    }

    gameLog.info('backend', '反序列化事件状态完成', {
      saveId,
      eventsCount: state.events.length,
      recordsCount: state.triggerRecords.length,
    });
  }

  /**
   * 清除存档相关事件
   */
  private clearSaveEvents(saveId: string): void {
    const db = this.getDb();

    // 删除触发记录
    const deleteRecordsStmt = db.prepare('DELETE FROM event_trigger_records WHERE save_id = ?');
    deleteRecordsStmt.run(saveId);

    // 删除事件
    const deleteEventsStmt = db.prepare('DELETE FROM events WHERE save_id = ?');
    deleteEventsStmt.run(saveId);

    // 清除内存缓存
    const eventIds = this.eventsBySaveId.get(saveId);
    if (eventIds) {
      for (const eventId of eventIds) {
        this.activeEvents.delete(eventId);
        this.triggerRecordCache.delete(eventId);
      }
      this.eventsBySaveId.delete(saveId);
    }

    gameLog.info('backend', '清除存档事件数据', { saveId });
  }

  // ==================== 随机事件 ====================

  /**
   * 随机事件抽取
   */
  public rollRandomEvent(context: EventContext): GameEvent | undefined {
    const events = this.listEvents({ saveId: context.saveId, type: 'random', isActive: true });

    // 过滤可触发的事件
    const eligibleEvents = events.filter(event => {
      // 检查冷却时间
      if (!this.checkCooldown(event)) return false;

      // 检查触发次数限制
      if (!this.checkTriggerLimit(event)) return false;

      // 检查条件
      if (event.trigger.conditions && event.trigger.conditions.length > 0) {
        const { satisfied } = this.checkConditions(event.trigger.conditions, context);
        if (!satisfied) return false;
      }

      return true;
    });

    if (eligibleEvents.length === 0) {
      return undefined;
    }

    // 按概率抽取
    const roll = Math.random();
    let cumulativeProbability = 0;

    // 按优先级排序
    eligibleEvents.sort((a, b) => b.metadata.priority - a.metadata.priority);

    for (const event of eligibleEvents) {
      const probability = event.trigger.probability || 0.1;
      cumulativeProbability += probability;

      if (roll <= cumulativeProbability) {
        gameLog.debug('backend', '随机事件抽取结果', {
          roll: roll.toFixed(3),
          selectedEvent: event.name,
          probability,
        });
        return event;
      }
    }

    // 如果累计概率未达到1，可能不触发任何事件
    gameLog.debug('backend', '随机事件未触发', { roll: roll.toFixed(3), totalProbability: cumulativeProbability.toFixed(3) });
    return undefined;
  }

  // ==================== 辅助方法 ====================

  /**
   * 数据库行转事件对象
   */
  private rowToEvent(row: EventRow): GameEvent {
    return {
      id: row.id,
      saveId: row.save_id,
      type: row.type as EventType,
      name: row.name,
      description: row.description,
      trigger: JSON.parse(row.trigger_config) as EventTrigger,
      effects: JSON.parse(row.effects) as EventEffect[],
      chain: row.chain ? JSON.parse(row.chain) as EventChain : undefined,
      metadata: JSON.parse(row.metadata) as EventMetadata,
      status: JSON.parse(row.status) as EventStatus,
    };
  }

  /**
   * 数据库行转触发记录对象
   */
  private rowToTriggerRecord(row: TriggerRecordRow): EventTriggerRecord {
    return {
      id: row.id,
      eventId: row.event_id,
      saveId: row.save_id,
      characterId: row.character_id,
      timestamp: row.timestamp,
      context: JSON.parse(row.context) as EventTriggerRecord['context'],
      result: JSON.parse(row.result) as EventTriggerRecord['result'],
    };
  }

  /**
   * 获取事件统计
   */
  public getEventStats(saveId: string): {
    totalEvents: number;
    activeEvents: number;
    triggeredEvents: number;
    byType: Record<EventType, number>;
  } {
    const events = this.listEvents({ saveId });

    const byType: Record<EventType, number> = {
      random: 0,
      story: 0,
      location: 0,
      condition: 0,
    };

    let activeCount = 0;
    let triggeredCount = 0;

    for (const event of events) {
      byType[event.type]++;
      if (event.status.isActive) activeCount++;
      if (event.status.triggerCount > 0) triggeredCount++;
    }

    return {
      totalEvents: events.length,
      activeEvents: activeCount,
      triggeredEvents: triggeredCount,
      byType,
    };
  }

  /**
   * 批量创建事件
   */
  public createEvents(eventsData: Array<Omit<GameEvent, 'id' | 'status'>>): GameEvent[] {
    return eventsData.map(data => this.createEvent(data));
  }

  /**
   * 激活/停用事件
   */
  public setEventActive(eventId: string, isActive: boolean): GameEvent | undefined {
    const event = this.getEvent(eventId);
    if (!event) return undefined;
    
    return this.updateEvent(eventId, {
      status: { ...event.status, isActive },
    });
  }

  /**
   * 重置事件状态
   */
  public resetEvent(eventId: string): GameEvent | undefined {
    return this.updateEvent(eventId, {
      status: {
        triggerCount: 0,
        lastTriggered: undefined,
        isActive: true,
      },
    });
  }
}

// ==================== 单例导出 ====================

let eventServiceInstance: EventService | null = null;

export function getEventService(): EventService {
  if (!eventServiceInstance) {
    eventServiceInstance = EventService.getInstance();
  }
  return eventServiceInstance;
}

export function initializeEventService(): EventService {
  return getEventService();
}

export { EventService };
