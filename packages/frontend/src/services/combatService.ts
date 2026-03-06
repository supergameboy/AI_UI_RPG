import type {
  CombatInitParams,
  CombatInstanceData,
  CombatAction,
  CombatResult,
  ActionType,
} from '@ai-rpg/shared';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:6756';

class CombatService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE}${endpoint}`;

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP error ${response.status}`);
    }

    const json = await response.json();
    // 后端返回 { success, data, meta } 格式，需要提取 data
    return json.data !== undefined ? json.data : json;
  }

  /**
   * 初始化战斗
   */
  async initiateCombat(params: CombatInitParams): Promise<{ combatId: string; combat: CombatInstanceData }> {
    return this.request<{ combatId: string; combat: CombatInstanceData }>('/api/combat/initiate', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * 开始战斗
   */
  async startCombat(combatId: string): Promise<{ combat: CombatInstanceData; currentUnit: string; phase: string }> {
    return this.request<{ combat: CombatInstanceData; currentUnit: string; phase: string }>('/api/combat/start', {
      method: 'POST',
      body: JSON.stringify({ combatId }),
    });
  }

  /**
   * 执行行动
   */
  async executeAction(
    combatId: string,
    actorId: string,
    action: ActionType,
    targetId?: string,
    skillId?: string,
    itemId?: string
  ): Promise<{ action: CombatAction; combat: CombatInstanceData }> {
    return this.request<{ action: CombatAction; combat: CombatInstanceData }>('/api/combat/action', {
      method: 'POST',
      body: JSON.stringify({ combatId, actorId, action, targetId, skillId, itemId }),
    });
  }

  /**
   * 执行AI回合
   */
  async executeAITurn(combatId: string): Promise<{ action: CombatAction; combat: CombatInstanceData }> {
    return this.request<{ action: CombatAction; combat: CombatInstanceData }>('/api/combat/ai-turn', {
      method: 'POST',
      body: JSON.stringify({ combatId }),
    });
  }

  /**
   * 获取战斗状态
   */
  async getCombatState(combatId: string): Promise<CombatInstanceData> {
    return this.request<CombatInstanceData>(`/api/combat/${combatId}`);
  }

  /**
   * 获取玩家当前战斗
   */
  async getPlayerCombat(playerId: string): Promise<{ inCombat: boolean; combatId?: string; combat?: CombatInstanceData }> {
    return this.request<{ inCombat: boolean; combatId?: string; combat?: CombatInstanceData }>(`/api/combat/player/${playerId}`);
  }

  /**
   * 结束战斗
   */
  async endCombat(combatId: string, victory?: boolean, fled?: boolean): Promise<CombatResult> {
    return this.request<CombatResult>('/api/combat/end', {
      method: 'POST',
      body: JSON.stringify({ combatId, victory, fled }),
    });
  }
}

export const combatService = new CombatService();
