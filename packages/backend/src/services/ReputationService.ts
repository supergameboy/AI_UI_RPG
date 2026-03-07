/**
 * 声望服务
 * 提供声望管理的业务逻辑层，处理声望变更、等级计算、对立声望等
 */

import type {
  ReputationType,
  ReputationRank,
  ReputationDefinition,
  CharacterReputation,
  ReputationChangeRecord,
  ReputationReward,
  ReputationEffect,
  ReputationRankConfig,
} from '@ai-rpg/shared';
import { getReputationRank, getReputationRankConfig } from '@ai-rpg/shared';
import { DatabaseService } from './DatabaseService';
import { gameLog } from './GameLogService';

// ==================== 服务接口 ====================

export interface AddReputationRequest {
  characterId: string;
  reputationId: string;
  value: number;
  reason: string;
  source: ReputationChangeRecord['source'];
  relatedId?: string;
}

export interface GetReputationRequest {
  characterId: string;
  reputationId: string;
}

export interface ReputationServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ==================== 数据库行类型 ====================

interface ReputationRow {
  id: string;
  character_id: string;
  reputation_id: string;
  value: number;
  rank: string;
  last_modified: number;
  history: string;
  created_at: number;
  updated_at: number;
}

// ==================== 声望服务类 ====================

class ReputationService {
  private static instance: ReputationService | null = null;

  // 声望定义缓存
  private reputationDefinitions: Map<string, ReputationDefinition> = new Map();

  // 角色声望缓存
  private characterReputations: Map<string, Map<string, CharacterReputation>> = new Map();

  // 声望效果缓存
  private reputationEffects: Map<string, ReputationEffect[]> = new Map();

  private constructor() {
    this.initializeDefaultDefinitions();
  }

  /**
   * 获取单例实例
   */
  public static getInstance(): ReputationService {
    if (!ReputationService.instance) {
      ReputationService.instance = new ReputationService();
    }
    return ReputationService.instance;
  }

  private getDb(): DatabaseService {
    return DatabaseService.getInstance();
  }

  /**
   * 初始化默认声望定义
   */
  private initializeDefaultDefinitions(): void {
    const defaultDefinitions: ReputationDefinition[] = [
      {
        id: 'kingdom',
        name: '王国声望',
        type: 'faction',
        description: '在王国中的声望和地位',
        icon: 'crown',
        relatedNpc: ['king', 'knight_captain'],
        oppositeReputation: 'rebels',
      },
      {
        id: 'rebels',
        name: '反抗军声望',
        type: 'faction',
        description: '在反抗军中的声望和地位',
        icon: 'sword',
        relatedNpc: ['rebel_leader'],
        oppositeReputation: 'kingdom',
      },
      {
        id: 'merchants_guild',
        name: '商会声望',
        type: 'organization',
        description: '在商会中的声望和地位',
        icon: 'coins',
        relatedNpc: ['merchant_leader'],
      },
      {
        id: 'mages_guild',
        name: '法师公会声望',
        type: 'organization',
        description: '在法师公会中的声望和地位',
        icon: 'magic',
        relatedNpc: ['archmage'],
      },
      {
        id: 'thieves_guild',
        name: '盗贼公会声望',
        type: 'organization',
        description: '在盗贼公会中的声望和地位',
        icon: 'dagger',
        relatedNpc: ['thief_leader'],
      },
      {
        id: 'temple_of_light',
        name: '光明神殿声望',
        type: 'deity',
        description: '对光明之神的信仰度',
        icon: 'sun',
        oppositeReputation: 'dark_cult',
      },
      {
        id: 'dark_cult',
        name: '暗影教派声望',
        type: 'deity',
        description: '对暗影之神的信仰度',
        icon: 'moon',
        oppositeReputation: 'temple_of_light',
      },
    ];

    for (const def of defaultDefinitions) {
      this.reputationDefinitions.set(def.id, def);
    }
  }

  // ==================== 声望定义管理 ====================

  /**
   * 注册声望定义
   */
  public registerDefinition(definition: ReputationDefinition): void {
    this.reputationDefinitions.set(definition.id, definition);
    gameLog.debug('backend', '注册声望定义', { id: definition.id, name: definition.name });
  }

  /**
   * 获取声望定义
   */
  public getDefinition(reputationId: string): ReputationDefinition | undefined {
    return this.reputationDefinitions.get(reputationId);
  }

  /**
   * 获取所有声望定义
   */
  public getAllDefinitions(): ReputationDefinition[] {
    return Array.from(this.reputationDefinitions.values());
  }

  /**
   * 按类型获取声望定义
   */
  public getDefinitionsByType(type: ReputationType): ReputationDefinition[] {
    return Array.from(this.reputationDefinitions.values()).filter(d => d.type === type);
  }

  // ==================== 声望值管理 ====================

  /**
   * 添加声望
   */
  public addReputation(request: AddReputationRequest): ReputationServiceResponse<CharacterReputation> {
    const { characterId, reputationId, value, reason, source, relatedId } = request;

    if (!characterId || !reputationId) {
      return { success: false, error: '缺少必需参数：characterId 或 reputationId' };
    }

    const definition = this.reputationDefinitions.get(reputationId);
    if (!definition) {
      return { success: false, error: `声望定义不存在: ${reputationId}` };
    }

    // 获取当前声望
    let currentRep = this.getCharacterReputation(characterId, reputationId);
    const previousValue = currentRep?.value ?? 0;
    const previousRank = currentRep?.rank ?? 'neutral';

    // 计算新值（限制在合理范围内）
    const newValue = Math.max(-999999, Math.min(999999, previousValue + value));
    const newRank = getReputationRank(newValue);

    // 创建变更记录
    const changeRecord: ReputationChangeRecord = {
      timestamp: Date.now(),
      change: value,
      reason,
      source,
      relatedId,
    };

    // 更新或创建声望记录
    const now = Math.floor(Date.now() / 1000);
    const updatedRep: CharacterReputation = {
      reputationId,
      value: newValue,
      rank: newRank,
      lastModified: Date.now(),
      history: [...(currentRep?.history || []), changeRecord].slice(-100), // 保留最近100条记录
    };

    // 保存到数据库
    this.saveReputation(characterId, updatedRep, now);

    // 更新缓存
    this.updateCache(characterId, reputationId, updatedRep);

    // 处理对立声望
    if (definition.oppositeReputation) {
      this.handleOppositeReputation(characterId, definition.oppositeReputation, value, reason, source, relatedId);
    }

    // 检查等级变化
    if (previousRank !== newRank) {
      gameLog.info('backend', '声望等级变化', {
        characterId,
        reputationId,
        previousRank,
        newRank,
        value: newValue,
      });
    }

    gameLog.debug('backend', '声望变更成功', {
      characterId,
      reputationId,
      change: value,
      previousValue,
      newValue,
      rank: newRank,
    });

    return {
      success: true,
      data: updatedRep,
    };
  }

  /**
   * 批量添加声望
   */
  public addReputations(
    characterId: string,
    rewards: ReputationReward[],
    source: ReputationChangeRecord['source'],
    relatedId?: string
  ): ReputationServiceResponse<CharacterReputation[]> {
    const results: CharacterReputation[] = [];
    const errors: string[] = [];

    for (const reward of rewards) {
      const result = this.addReputation({
        characterId,
        reputationId: reward.reputationId,
        value: reward.value,
        reason: reward.reason || `${source}奖励`,
        source,
        relatedId,
      });

      if (result.success && result.data) {
        results.push(result.data);
      } else {
        errors.push(`${reward.reputationId}: ${result.error}`);
      }
    }

    if (errors.length > 0) {
      gameLog.warn('backend', '部分声望奖励发放失败', { errors });
    }

    return {
      success: results.length > 0,
      data: results,
      error: errors.length > 0 ? errors.join('; ') : undefined,
    };
  }

  /**
   * 设置声望值
   */
  public setReputation(
    characterId: string,
    reputationId: string,
    value: number,
    reason: string
  ): ReputationServiceResponse<CharacterReputation> {
    const definition = this.reputationDefinitions.get(reputationId);
    if (!definition) {
      return { success: false, error: `声望定义不存在: ${reputationId}` };
    }

    const currentRep = this.getCharacterReputation(characterId, reputationId);
    const change = value - (currentRep?.value ?? 0);

    return this.addReputation({
      characterId,
      reputationId,
      value: change,
      reason,
      source: 'system',
    });
  }

  /**
   * 获取角色声望
   */
  public getCharacterReputation(characterId: string, reputationId: string): CharacterReputation | undefined {
    // 先查缓存
    const charReps = this.characterReputations.get(characterId);
    if (charReps?.has(reputationId)) {
      return charReps.get(reputationId);
    }

    // 查数据库
    const db = this.getDb();
    const stmt = db.prepare<ReputationRow>(
      'SELECT * FROM character_reputations WHERE character_id = ? AND reputation_id = ?'
    );
    const row = stmt.get(characterId, reputationId);

    if (!row) {
      return undefined;
    }

    const rep = this.rowToReputation(row);
    this.updateCache(characterId, reputationId, rep);
    return rep;
  }

  /**
   * 获取角色所有声望
   */
  public getAllCharacterReputations(characterId: string): CharacterReputation[] {
    // 先查缓存
    const cached = this.characterReputations.get(characterId);
    if (cached && cached.size > 0) {
      return Array.from(cached.values());
    }

    // 查数据库
    const db = this.getDb();
    const stmt = db.prepare<ReputationRow>(
      'SELECT * FROM character_reputations WHERE character_id = ?'
    );
    const rows = stmt.all(characterId);

    const reputations = rows.map(row => {
      const rep = this.rowToReputation(row);
      this.updateCache(characterId, rep.reputationId, rep);
      return rep;
    });

    return reputations;
  }

  /**
   * 获取声望等级
   */
  public getReputationRank(characterId: string, reputationId: string): ReputationRank {
    const rep = this.getCharacterReputation(characterId, reputationId);
    return rep?.rank ?? 'neutral';
  }

  /**
   * 获取声望等级配置
   */
  public getRankConfig(rank: ReputationRank): ReputationRankConfig {
    return getReputationRankConfig(rank);
  }

  /**
   * 检查声望是否达到要求
   */
  public checkReputationRequirement(
    characterId: string,
    reputationId: string,
    requiredRank: ReputationRank
  ): boolean {
    const currentRank = this.getReputationRank(characterId, reputationId);
    const rankOrder: ReputationRank[] = [
      'hated', 'hostile', 'unfriendly', 'neutral', 'friendly', 'honored', 'revered', 'exalted'
    ];
    return rankOrder.indexOf(currentRank) >= rankOrder.indexOf(requiredRank);
  }

  // ==================== 对立声望处理 ====================

  /**
   * 处理对立声望
   */
  private handleOppositeReputation(
    characterId: string,
    oppositeId: string,
    value: number,
    reason: string,
    source: ReputationChangeRecord['source'],
    relatedId?: string
  ): void {
    // 对立声望反向变化（幅度减半）
    const oppositeChange = -Math.floor(value * 0.5);

    if (oppositeChange !== 0) {
      this.addReputation({
        characterId,
        reputationId: oppositeId,
        value: oppositeChange,
        reason: `对立声望变化: ${reason}`,
        source,
        relatedId,
      });

      gameLog.debug('backend', '对立声望变化', {
        characterId,
        oppositeId,
        change: oppositeChange,
        reason,
      });
    }
  }

  // ==================== 声望效果 ====================

  /**
   * 注册声望效果
   */
  public registerEffect(effect: ReputationEffect): void {
    if (!this.reputationEffects.has(effect.reputationId)) {
      this.reputationEffects.set(effect.reputationId, []);
    }
    this.reputationEffects.get(effect.reputationId)!.push(effect);
  }

  /**
   * 获取角色可用的声望效果
   */
  public getActiveEffects(characterId: string): ReputationEffect[] {
    const activeEffects: ReputationEffect[] = [];

    for (const [reputationId, effects] of this.reputationEffects) {
      for (const effect of effects) {
        if (this.checkReputationRequirement(characterId, reputationId, effect.minRank)) {
          activeEffects.push(effect);
        }
      }
    }

    return activeEffects;
  }

  /**
   * 计算折扣（基于声望）
   */
  public calculateDiscount(characterId: string, reputationId: string): number {
    const rank = this.getReputationRank(characterId, reputationId);
    const discounts: Record<ReputationRank, number> = {
      hated: 0,
      hostile: 0,
      unfriendly: 0,
      neutral: 0,
      friendly: 5,
      honored: 10,
      revered: 15,
      exalted: 20,
    };
    return discounts[rank];
  }

  // ==================== 数据持久化 ====================

  /**
   * 保存声望到数据库
   */
  private saveReputation(characterId: string, reputation: CharacterReputation, timestamp: number): void {
    const db = this.getDb();

    // 检查是否存在
    const existing = db.prepare(
      'SELECT id FROM character_reputations WHERE character_id = ? AND reputation_id = ?'
    ).get(characterId, reputation.reputationId);

    if (existing) {
      // 更新
      const stmt = db.prepare(`
        UPDATE character_reputations
        SET value = ?, rank = ?, history = ?, last_modified = ?, updated_at = ?
        WHERE character_id = ? AND reputation_id = ?
      `);
      stmt.run(
        reputation.value,
        reputation.rank,
        JSON.stringify(reputation.history),
        reputation.lastModified,
        timestamp,
        characterId,
        reputation.reputationId
      );
    } else {
      // 插入
      const id = `rep_${characterId}_${reputation.reputationId}`;
      const stmt = db.prepare(`
        INSERT INTO character_reputations
        (id, character_id, reputation_id, value, rank, history, last_modified, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        id,
        characterId,
        reputation.reputationId,
        reputation.value,
        reputation.rank,
        JSON.stringify(reputation.history),
        reputation.lastModified,
        timestamp,
        timestamp
      );
    }
  }

  /**
   * 更新缓存
   */
  private updateCache(characterId: string, reputationId: string, reputation: CharacterReputation): void {
    if (!this.characterReputations.has(characterId)) {
      this.characterReputations.set(characterId, new Map());
    }
    this.characterReputations.get(characterId)!.set(reputationId, reputation);
  }

  /**
   * 数据库行转对象
   */
  private rowToReputation(row: ReputationRow): CharacterReputation {
    return {
      reputationId: row.reputation_id,
      value: row.value,
      rank: row.rank as ReputationRank,
      lastModified: row.last_modified,
      history: JSON.parse(row.history) as ReputationChangeRecord[],
    };
  }

  // ==================== 存档支持 ====================

  /**
   * 序列化角色声望状态
   */
  public serializeState(characterId: string): CharacterReputation[] {
    return this.getAllCharacterReputations(characterId);
  }

  /**
   * 反序列化角色声望状态
   */
  public deserializeState(characterId: string, reputations: CharacterReputation[]): void {
    // 清除现有缓存
    this.characterReputations.delete(characterId);

    const now = Math.floor(Date.now() / 1000);
    for (const rep of reputations) {
      this.saveReputation(characterId, rep, now);
      this.updateCache(characterId, rep.reputationId, rep);
    }

    gameLog.info('backend', '声望状态恢复完成', {
      characterId,
      count: reputations.length,
    });
  }

  /**
   * 清除角色声望数据
   */
  public clearCharacterReputations(characterId: string): void {
    const db = this.getDb();
    db.prepare('DELETE FROM character_reputations WHERE character_id = ?').run(characterId);
    this.characterReputations.delete(characterId);

    gameLog.info('backend', '角色声望数据已清除', { characterId });
  }

  // ==================== 统计与查询 ====================

  /**
   * 获取声望统计
   */
  public getReputationStats(characterId: string): {
    total: number;
    byType: Record<ReputationType, number>;
    byRank: Record<ReputationRank, number>;
    highest: { reputationId: string; value: number } | null;
    lowest: { reputationId: string; value: number } | null;
  } {
    const reputations = this.getAllCharacterReputations(characterId);

    const byType: Record<ReputationType, number> = {
      faction: 0,
      npc: 0,
      organization: 0,
      deity: 0,
    };

    const byRank: Record<ReputationRank, number> = {
      hated: 0,
      hostile: 0,
      unfriendly: 0,
      neutral: 0,
      friendly: 0,
      honored: 0,
      revered: 0,
      exalted: 0,
    };

    let highest: { reputationId: string; value: number } | null = null;
    let lowest: { reputationId: string; value: number } | null = null;

    for (const rep of reputations) {
      const definition = this.getDefinition(rep.reputationId);
      if (definition) {
        byType[definition.type]++;
      }
      byRank[rep.rank]++;

      if (!highest || rep.value > highest.value) {
        highest = { reputationId: rep.reputationId, value: rep.value };
      }
      if (!lowest || rep.value < lowest.value) {
        lowest = { reputationId: rep.reputationId, value: rep.value };
      }
    }

    return {
      total: reputations.length,
      byType,
      byRank,
      highest,
      lowest,
    };
  }
}

// ==================== 单例导出 ====================

let reputationServiceInstance: ReputationService | null = null;

export function getReputationService(): ReputationService {
  if (!reputationServiceInstance) {
    reputationServiceInstance = ReputationService.getInstance();
  }
  return reputationServiceInstance;
}

export function initializeReputationService(): ReputationService {
  return getReputationService();
}

export { ReputationService };
