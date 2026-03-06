import type {
  DialogueHistoryEntry,
  EmotionRecord,
  DialogueContext,
} from '@ai-rpg/shared';
import { DatabaseService } from './DatabaseService';
import { gameLog } from './GameLogService';

/**
 * 对话数据库实体
 */
interface DialogueEntity {
  id: string;
  save_id: string;
  session_id: string | null;
  npc_id: string | null;
  role: string;
  content: string;
  timestamp: number;
  importance: number;
  metadata: string;
}

/**
 * 对话服务
 * 负责对话历史管理、上下文构建、情绪记录
 */
class DialogueService {
  // 内存缓存：角色对话历史
  private historyCache: Map<string, DialogueHistoryEntry[]> = new Map();

  // 内存缓存：角色情绪记录
  private emotionCache: Map<string, EmotionRecord[]> = new Map();

  // 最大历史记录数
  private readonly MAX_HISTORY_SIZE = 100;

  // 最大情绪记录数
  private readonly MAX_EMOTION_SIZE = 50;

  private getDb(): DatabaseService {
    return DatabaseService.getInstance();
  }

  // ==================== 对话历史管理 ====================

  /**
   * 获取对话历史
   * @param characterId 角色ID
   * @param limit 限制数量，默认返回全部
   */
  public getHistory(characterId: string, limit?: number): DialogueHistoryEntry[] {
    const history = this.historyCache.get(characterId) || [];

    if (limit !== undefined && limit > 0) {
      return history.slice(-limit);
    }

    return history;
  }

  /**
   * 获取对话上下文
   * @param characterId 角色ID
   */
  public getContext(characterId: string): DialogueContext {
    const history = this.historyCache.get(characterId) || [];
    const emotions = this.emotionCache.get(characterId) || [];

    // 获取最近交互的 NPC
    const lastEntry = history[history.length - 1];
    const currentNpcId = lastEntry?.npcId;

    // 获取最后交互时间
    const lastInteraction = lastEntry?.timestamp;

    // 生成摘要（最近5条对话）
    const recentHistory = history.slice(-5);
    const summary = recentHistory.length > 0
      ? recentHistory.map(h => `[${h.role}]: ${h.content.substring(0, 50)}...`).join('\n')
      : undefined;

    return {
      characterId,
      history,
      emotions,
      currentNpcId,
      lastInteraction,
      summary,
    };
  }

  /**
   * 添加对话历史
   * @param characterId 角色ID
   * @param entry 对话历史条目
   */
  public addHistory(characterId: string, entry: DialogueHistoryEntry): DialogueHistoryEntry {
    let history = this.historyCache.get(characterId) || [];

    // 添加新条目
    history.push({
      ...entry,
      id: entry.id || `dh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: entry.timestamp || Date.now(),
    });

    // 限制历史大小
    if (history.length > this.MAX_HISTORY_SIZE) {
      history = history.slice(-this.MAX_HISTORY_SIZE);
    }

    this.historyCache.set(characterId, history);

    gameLog.debug('dialogue', '添加对话历史', {
      characterId,
      entryId: entry.id,
      role: entry.role,
      contentLength: entry.content.length,
    });

    return entry;
  }

  /**
   * 清空对话历史
   * @param characterId 角色ID
   */
  public clearHistory(characterId: string): boolean {
    this.historyCache.delete(characterId);
    this.emotionCache.delete(characterId);

    gameLog.info('dialogue', '清空对话历史', { characterId });

    return true;
  }

  // ==================== 情绪记录管理 ====================

  /**
   * 获取情绪历史
   * @param characterId 角色ID
   * @param npcId NPC ID（可选，不传则返回所有）
   */
  public getEmotionHistory(characterId: string, npcId?: string): EmotionRecord[] {
    const emotions = this.emotionCache.get(characterId) || [];

    if (npcId) {
      return emotions.filter(e => e.npcId === npcId);
    }

    return emotions;
  }

  /**
   * 记录情绪
   * @param characterId 角色ID
   * @param npcId NPC ID
   * @param emotion 情绪记录
   */
  public recordEmotion(
    characterId: string,
    npcId: string,
    emotion: EmotionRecord
  ): EmotionRecord {
    let emotions = this.emotionCache.get(characterId) || [];

    const newEmotion: EmotionRecord = {
      ...emotion,
      npcId,
      timestamp: emotion.timestamp || Date.now(),
    };

    emotions.push(newEmotion);

    // 限制情绪记录大小
    if (emotions.length > this.MAX_EMOTION_SIZE) {
      emotions = emotions.slice(-this.MAX_EMOTION_SIZE);
    }

    this.emotionCache.set(characterId, emotions);

    gameLog.debug('dialogue', '记录情绪', {
      characterId,
      npcId,
      emotion: emotion.emotion,
      intensity: emotion.intensity,
    });

    return newEmotion;
  }

  // ==================== 数据库持久化 ====================

  /**
   * 从数据库加载对话历史
   * @param saveId 存档ID
   * @param characterId 角色ID
   */
  public loadFromDatabase(saveId: string, characterId: string): void {
    try {
      const db = this.getDb();
      const stmt = db.prepare<DialogueEntity>(
        'SELECT * FROM dialogues WHERE save_id = ? ORDER BY timestamp ASC'
      );
      const rows = stmt.all(saveId);

      const history: DialogueHistoryEntry[] = rows.map(row => ({
        id: row.id,
        characterId,
        npcId: row.npc_id || undefined,
        role: this.mapRole(row.role),
        content: row.content,
        timestamp: row.timestamp * 1000, // 转换为毫秒
      }));

      this.historyCache.set(characterId, history);

      gameLog.info('dialogue', '从数据库加载对话历史', {
        saveId,
        characterId,
        count: history.length,
      });
    } catch (error) {
      gameLog.error('dialogue', '加载对话历史失败', {
        error: error instanceof Error ? error.message : 'Unknown error',
        saveId,
        characterId,
      });
    }
  }

  /**
   * 保存对话历史到数据库
   * @param saveId 存档ID
   * @param characterId 角色ID
   */
  public saveToDatabase(saveId: string, characterId: string): void {
    try {
      const history = this.historyCache.get(characterId) || [];
      const db = this.getDb();

      // 清除旧数据
      db.prepare('DELETE FROM dialogues WHERE save_id = ?').run(saveId);

      // 插入新数据
      const stmt = db.prepare(`
        INSERT INTO dialogues (id, save_id, session_id, npc_id, role, content, timestamp, importance, metadata)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const entry of history) {
        stmt.run(
          entry.id,
          saveId,
          null, // session_id
          entry.npcId || null,
          this.reverseMapRole(entry.role),
          entry.content,
          Math.floor(entry.timestamp / 1000), // 转换为秒
          5, // 默认重要性
          JSON.stringify({ emotion: entry.emotion })
        );
      }

      gameLog.info('dialogue', '保存对话历史到数据库', {
        saveId,
        characterId,
        count: history.length,
      });
    } catch (error) {
      gameLog.error('dialogue', '保存对话历史失败', {
        error: error instanceof Error ? error.message : 'Unknown error',
        saveId,
        characterId,
      });
    }
  }

  // ==================== 辅助方法 ====================

  /**
   * 映射数据库角色到 Tool 角色
   */
  private mapRole(dbRole: string): 'player' | 'npc' | 'system' {
    switch (dbRole) {
      case 'user':
        return 'player';
      case 'assistant':
      case 'narrator':
        return 'npc';
      case 'system':
      default:
        return 'system';
    }
  }

  /**
   * 映射 Tool 角色到数据库角色
   */
  private reverseMapRole(role: 'player' | 'npc' | 'system'): string {
    switch (role) {
      case 'player':
        return 'user';
      case 'npc':
        return 'assistant';
      case 'system':
      default:
        return 'system';
    }
  }

  /**
   * 获取最近 N 条对话摘要
   * @param characterId 角色ID
   * @param count 数量
   */
  public getRecentSummary(characterId: string, count: number = 5): string {
    const history = this.getHistory(characterId, count);
    return history
      .map(h => `[${h.role}]${h.npcId ? `(${h.npcId})` : ''}: ${h.content.substring(0, 100)}`)
      .join('\n');
  }

  /**
   * 获取与特定 NPC 的对话历史
   * @param characterId 角色ID
   * @param npcId NPC ID
   * @param limit 限制数量
   */
  public getHistoryWithNPC(characterId: string, npcId: string, limit?: number): DialogueHistoryEntry[] {
    const history = this.getHistory(characterId);
    const npcHistory = history.filter(h => h.npcId === npcId);

    if (limit !== undefined && limit > 0) {
      return npcHistory.slice(-limit);
    }

    return npcHistory;
  }

  /**
   * 获取角色的当前情绪状态
   * @param characterId 角色ID
   * @param npcId NPC ID
   */
  public getCurrentEmotion(characterId: string, npcId: string): EmotionRecord | null {
    const emotions = this.getEmotionHistory(characterId, npcId);
    return emotions.length > 0 ? emotions[emotions.length - 1] : null;
  }
}

// 单例实例
let dialogueServiceInstance: DialogueService | null = null;

/**
 * 获取对话服务实例
 */
export function getDialogueService(): DialogueService {
  if (!dialogueServiceInstance) {
    dialogueServiceInstance = new DialogueService();
  }
  return dialogueServiceInstance;
}

/**
 * 重置对话服务实例（用于测试）
 */
export function resetDialogueService(): void {
  dialogueServiceInstance = null;
}
