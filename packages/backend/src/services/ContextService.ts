import { DatabaseService } from './DatabaseService';

export interface Memory {
  id: string;
  save_id: string;
  layer: 1 | 2 | 3 | 4;
  summary: string;
  key_info: string;
  token_count: number;
  compression_ratio: number;
  scene_id: string | null;
  quest_id: string | null;
  created_at: number;
  updated_at: number;
}

export interface CompressionResult {
  summary: string;
  keyInfo: {
    decisions: Array<{ id: string; choice: string; consequence: string }>;
    events: Array<{ id: string; description: string; significance: string }>;
    npcs: string[];
    items: string[];
    locations: string[];
  };
  stats: {
    originalTokens: number;
    compressedTokens: number;
    compressionRatio: number;
  };
}

export interface ContextState {
  layer1: {
    messages: Array<{ role: string; content: string }>;
  };
  layer2: {
    summary: string;
    keyEvents: string[];
  };
  layer3: {
    summary: string;
    mainPlot: string[];
  };
  layer4: {
    worldState: Record<string, unknown>;
    characterGrowth: Record<string, unknown>;
    majorEvents: Array<{ timestamp: number; description: string }>;
  };
}

export interface AgentState {
  agentId: string;
  agentType: string;
  memory: Record<string, unknown>;
  lastAction: string | null;
  context: Record<string, unknown>;
}

const LAYER_CONFIG = {
  1: { name: 'realtime', maxMessages: 10, description: '实时上下文' },
  2: { name: 'shortTerm', maxMessages: 50, description: '短期记忆' },
  3: { name: 'midTerm', maxMessages: 200, description: '中期记忆' },
  4: { name: 'longTerm', maxMessages: Infinity, description: '长期记忆' },
};

class ContextService {
  private getDb(): DatabaseService {
    return DatabaseService.getInstance();
  }

  public async compressContext(
    messages: Array<{ role: string; content: string }>,
    level: 'short' | 'medium' | 'long'
  ): Promise<CompressionResult> {
    const keyInfo = this.extractKeyInformation(messages);
    const summary = this.generateSummary(messages, level, keyInfo);
    const stats = this.calculateStats(messages, summary);

    return {
      summary,
      keyInfo,
      stats,
    };
  }

  private extractKeyInformation(messages: Array<{ role: string; content: string }>): CompressionResult['keyInfo'] {
    const decisions: CompressionResult['keyInfo']['decisions'] = [];
    const events: CompressionResult['keyInfo']['events'] = [];
    const npcs = new Set<string>();
    const items = new Set<string>();
    const locations = new Set<string>();

    const decisionKeywords = ['选择', '决定', '选了', '决定要', '选择了'];
    const eventKeywords = ['发生了', '出现了', '遇到了', '完成了', '获得了'];

    for (const msg of messages) {
      const content = msg.content;

      for (const keyword of decisionKeywords) {
        if (content.includes(keyword)) {
          decisions.push({
            id: `decision_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            choice: content.substring(0, 100),
            consequence: '',
          });
          break;
        }
      }

      for (const keyword of eventKeywords) {
        if (content.includes(keyword)) {
          events.push({
            id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            description: content.substring(0, 100),
            significance: 'minor',
          });
          break;
        }
      }

      const npcMatches = content.match(/(?:NPC|npc|角色|人物)[：:]\s*([^\s，。！？]+)/g);
      if (npcMatches) {
        npcMatches.forEach((m) => {
          const name = m.replace(/(?:NPC|npc|角色|人物)[：:]\s*/, '');
          npcs.add(name);
        });
      }

      const itemMatches = content.match(/(?:物品|道具|装备)[：:]\s*([^\s，。！？]+)/g);
      if (itemMatches) {
        itemMatches.forEach((m) => {
          const name = m.replace(/(?:物品|道具|装备)[：:]\s*/, '');
          items.add(name);
        });
      }

      const locationMatches = content.match(/(?:地点|位置|场景)[：:]\s*([^\s，。！？]+)/g);
      if (locationMatches) {
        locationMatches.forEach((m) => {
          const name = m.replace(/(?:地点|位置|场景)[：:]\s*/, '');
          locations.add(name);
        });
      }
    }

    return {
      decisions: decisions.slice(-10),
      events: events.slice(-20),
      npcs: Array.from(npcs),
      items: Array.from(items),
      locations: Array.from(locations),
    };
  }

  private generateSummary(
    messages: Array<{ role: string; content: string }>,
    level: 'short' | 'medium' | 'long',
    keyInfo: CompressionResult['keyInfo']
  ): string {
    const levelConfig = {
      short: { maxSentences: 5, includeDetails: true },
      medium: { maxSentences: 10, includeDetails: false },
      long: { maxSentences: 20, includeDetails: false },
    };

    const config = levelConfig[level];
    const summaries: string[] = [];

    if (keyInfo.decisions.length > 0) {
      summaries.push(`关键决策: ${keyInfo.decisions.map((d) => d.choice).join('; ')}`);
    }

    if (keyInfo.events.length > 0) {
      summaries.push(`重要事件: ${keyInfo.events.map((e) => e.description).join('; ')}`);
    }

    if (keyInfo.npcs.length > 0) {
      summaries.push(`相关NPC: ${keyInfo.npcs.join(', ')}`);
    }

    if (keyInfo.locations.length > 0) {
      summaries.push(`涉及地点: ${keyInfo.locations.join(', ')}`);
    }

    const recentMessages = messages.slice(-config.maxSentences * 2);
    const messageSummary = recentMessages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .slice(-config.maxSentences)
      .map((m) => `${m.role === 'user' ? '玩家' : 'AI'}: ${m.content.substring(0, 50)}...`)
      .join('\n');

    if (messageSummary && config.includeDetails) {
      summaries.push(`\n最近对话:\n${messageSummary}`);
    }

    return summaries.join('\n');
  }

  private calculateStats(
    messages: Array<{ role: string; content: string }>,
    summary: string
  ): CompressionResult['stats'] {
    const originalTokens = messages.reduce((sum, m) => sum + this.estimateTokens(m.content), 0);
    const compressedTokens = this.estimateTokens(summary);

    return {
      originalTokens,
      compressedTokens,
      compressionRatio: originalTokens > 0 ? compressedTokens / originalTokens : 0,
    };
  }

  private estimateTokens(text: string): number {
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    const englishWords = (text.match(/[a-zA-Z]+/g) || []).length;
    const otherChars = text.length - chineseChars - englishWords * 2;

    return Math.ceil(chineseChars * 1.5 + englishWords + otherChars * 0.5);
  }

  public async saveMemory(
    saveId: string,
    layer: 1 | 2 | 3 | 4,
    data: {
      summary: string;
      keyInfo: CompressionResult['keyInfo'];
      sceneId?: string;
      questId?: string;
    }
  ): Promise<Memory> {
    const db = this.getDb();
    const id = `memory_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = Math.floor(Date.now() / 1000);

    const tokenCount = this.estimateTokens(data.summary);
    const compressionRatio = data.keyInfo.decisions.length > 0 ? 0.3 : 1.0;

    const stmt = db.prepare(`
      INSERT INTO memories (id, save_id, layer, summary, key_info, token_count, compression_ratio, scene_id, quest_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      saveId,
      layer,
      data.summary,
      JSON.stringify(data.keyInfo),
      tokenCount,
      compressionRatio,
      data.sceneId || null,
      data.questId || null,
      now,
      now
    );

    return this.getMemory(id)!;
  }

  public getMemory(id: string): Memory | undefined {
    const db = this.getDb();
    const stmt = db.prepare<Memory>('SELECT * FROM memories WHERE id = ?');
    return stmt.get(id);
  }

  public getMemoriesBySaveId(saveId: string, layer?: 1 | 2 | 3 | 4): Memory[] {
    const db = this.getDb();
    if (layer) {
      const stmt = db.prepare<Memory>('SELECT * FROM memories WHERE save_id = ? AND layer = ? ORDER BY created_at DESC');
      return stmt.all(saveId, layer);
    }
    const stmt = db.prepare<Memory>('SELECT * FROM memories WHERE save_id = ? ORDER BY layer, created_at DESC');
    return stmt.all(saveId);
  }

  public async saveContextState(
    saveId: string,
    contextState: ContextState,
    agentStates: AgentState[]
  ): Promise<void> {
    const db = this.getDb();

    await this.saveMemory(saveId, 1, {
      summary: JSON.stringify(contextState.layer1.messages.slice(-10)),
      keyInfo: { decisions: [], events: [], npcs: [], items: [], locations: [] },
    });

    await this.saveMemory(saveId, 2, {
      summary: contextState.layer2.summary,
      keyInfo: {
        decisions: [],
        events: contextState.layer2.keyEvents.map((e) => ({ id: '', description: e, significance: 'minor' })),
        npcs: [],
        items: [],
        locations: [],
      },
    });

    await this.saveMemory(saveId, 3, {
      summary: contextState.layer3.summary,
      keyInfo: {
        decisions: [],
        events: contextState.layer3.mainPlot.map((p) => ({ id: '', description: p, significance: 'major' })),
        npcs: [],
        items: [],
        locations: [],
      },
    });

    await this.saveMemory(saveId, 4, {
      summary: JSON.stringify({
        worldState: contextState.layer4.worldState,
        characterGrowth: contextState.layer4.characterGrowth,
      }),
      keyInfo: {
        decisions: [],
        events: contextState.layer4.majorEvents.map((e) => ({
          id: '',
          description: e.description,
          significance: 'critical',
        })),
        npcs: [],
        items: [],
        locations: [],
      },
    });

    const snapshotStmt = db.prepare(`
      INSERT INTO save_snapshots (id, save_id, snapshot_type, context_state, memory_state, agent_states, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const snapshotId = `snapshot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = Math.floor(Date.now() / 1000);

    snapshotStmt.run(
      snapshotId,
      saveId,
      'manual',
      JSON.stringify(contextState),
      JSON.stringify(this.getMemoriesBySaveId(saveId)),
      JSON.stringify(agentStates),
      now
    );
  }

  public loadContextState(saveId: string): { contextState: ContextState | null; agentStates: AgentState[] } {
    const db = this.getDb();
    const stmt = db.prepare<{
      context_state: string;
      agent_states: string;
    }>(`
      SELECT context_state, agent_states 
      FROM save_snapshots 
      WHERE save_id = ? 
      ORDER BY created_at DESC 
      LIMIT 1
    `);

    const result = stmt.get(saveId);

    if (!result) {
      return { contextState: null, agentStates: [] };
    }

    let contextState: ContextState | null = null;
    try {
      contextState = JSON.parse(result.context_state);
    } catch {
      contextState = null;
    }

    let agentStates: AgentState[] = [];
    try {
      agentStates = JSON.parse(result.agent_states);
    } catch {
      agentStates = [];
    }

    return { contextState, agentStates };
  }

  public shouldCompress(messages: Array<{ role: string; content: string }>): {
    needed: boolean;
    reason: string;
    targetLayer: 1 | 2 | 3 | 4;
  } {
    const tokenCount = messages.reduce((sum, m) => sum + this.estimateTokens(m.content), 0);

    if (messages.length > LAYER_CONFIG[1].maxMessages) {
      return { needed: true, reason: '对话轮数超过实时上下文限制', targetLayer: 2 };
    }

    if (tokenCount > 4000 * 0.8) {
      return { needed: true, reason: 'Token数量超过阈值80%', targetLayer: 2 };
    }

    if (messages.length > LAYER_CONFIG[2].maxMessages) {
      return { needed: true, reason: '对话轮数超过短期记忆限制', targetLayer: 3 };
    }

    if (messages.length > LAYER_CONFIG[3].maxMessages) {
      return { needed: true, reason: '对话轮数超过中期记忆限制', targetLayer: 4 };
    }

    return { needed: false, reason: '', targetLayer: 1 };
  }

  public deleteMemoriesBySaveId(saveId: string): number {
    const db = this.getDb();
    const stmt = db.prepare('DELETE FROM memories WHERE save_id = ?');
    const result = stmt.run(saveId);
    return result.changes;
  }
}

export const contextService = new ContextService();
