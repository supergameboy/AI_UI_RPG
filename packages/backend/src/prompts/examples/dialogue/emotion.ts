/**
 * Tool 调用示例 - 情绪分析示例
 * 展示如何分析情绪并记录
 */

import type { ToolPermission } from '@ai-rpg/shared';
import { ToolType } from '@ai-rpg/shared';

/**
 * Tool 调用结构
 */
export interface ToolCall {
  toolType: ToolType;
  method: string;
  params: Record<string, unknown>;
  permission: ToolPermission;
}

/**
 * 示例定义
 */
export interface ToolCallExample {
  name: string;
  description: string;
  scenario: string;
  toolCalls: ToolCall[];
  expectedOutput: string;
  notes?: string[];
}

/**
 * 情绪记录示例
 * 展示如何记录 NPC 的情绪状态
 */
export const emotionRecordExample: ToolCallExample = {
  name: 'emotion_record',
  description: '情绪记录示例 - 记录 NPC 在对话中的情绪变化',
  scenario: '玩家与 NPC 对话时，NPC 表现出担忧的情绪',
  toolCalls: [
    {
      toolType: ToolType.DIALOGUE_DATA,
      method: 'getEmotionHistory',
      params: {
        characterId: 'player_001',
        npcId: 'npc_village_elder',
      },
      permission: 'read',
    },
    {
      toolType: ToolType.DIALOGUE_DATA,
      method: 'recordEmotion',
      params: {
        characterId: 'player_001',
        npcId: 'npc_village_elder',
        emotion: {
          type: 'worried',
          intensity: 0.7,
          timestamp: Date.now(),
          trigger: 'mention_of_goblins',
          context: 'discussing_village_danger',
          duration: 300000, // 5 分钟
        },
      },
      permission: 'write',
    },
    {
      toolType: ToolType.DIALOGUE_DATA,
      method: 'addHistory',
      params: {
        characterId: 'player_001',
        entry: {
          id: 'dialogue_emotion_001',
          timestamp: Date.now(),
          speaker: 'npc',
          content: '村子东边的森林...最近出现了很多哥布林，我真的很担心村民的安全...',
          type: 'response',
          npcId: 'npc_village_elder',
          emotion: 'worried',
        },
      },
      permission: 'write',
    },
  ],
  expectedOutput: `情绪记录已更新:
NPC: 村庄长老
情绪: 担忧 (强度: 70%)
触发原因: 提及哥布林威胁
持续时间: 5 分钟

对话中 NPC 表现出明显的担忧情绪。`,
  notes: [
    '情绪强度范围 0-1，表示情绪的强烈程度',
    '情绪触发原因用于追踪情绪变化的原因',
    '持续时间用于控制情绪的自然消退',
  ],
};

/**
 * 情绪变化追踪示例
 * 展示如何追踪 NPC 情绪的变化过程
 */
export const emotionTrackingExample: ToolCallExample = {
  name: 'emotion_tracking',
  description: '情绪变化追踪示例 - 追踪对话中情绪的变化',
  scenario: '玩家通过对话改变 NPC 的情绪状态',
  toolCalls: [
    {
      toolType: ToolType.DIALOGUE_DATA,
      method: 'getEmotionHistory',
      params: {
        characterId: 'player_001',
        npcId: 'npc_village_elder',
      },
      permission: 'read',
    },
    {
      toolType: ToolType.DIALOGUE_DATA,
      method: 'recordEmotion',
      params: {
        characterId: 'player_001',
        npcId: 'npc_village_elder',
        emotion: {
          type: 'worried',
          intensity: 0.7,
          timestamp: Date.now(),
          trigger: 'initial_concern',
        },
      },
      permission: 'write',
    },
    {
      toolType: ToolType.DIALOGUE_DATA,
      method: 'addHistory',
      params: {
        characterId: 'player_001',
        entry: {
          id: 'dialogue_emotion_002',
          timestamp: Date.now(),
          speaker: 'player',
          content: '长老请放心，我会帮助村子解决哥布林的问题。',
          type: 'reassurance',
          npcId: 'npc_village_elder',
        },
      },
      permission: 'write',
    },
    {
      toolType: ToolType.DIALOGUE_DATA,
      method: 'recordEmotion',
      params: {
        characterId: 'player_001',
        npcId: 'npc_village_elder',
        emotion: {
          type: 'hopeful',
          intensity: 0.6,
          timestamp: Date.now(),
          trigger: 'player_promise',
          previousEmotion: 'worried',
          transition: 'positive',
        },
      },
      permission: 'write',
    },
    {
      toolType: ToolType.DIALOGUE_DATA,
      method: 'addHistory',
      params: {
        characterId: 'player_001',
        entry: {
          id: 'dialogue_emotion_003',
          timestamp: Date.now(),
          speaker: 'npc',
          content: '真的吗？太好了！有勇士的帮助，村子终于有希望了！',
          type: 'response',
          npcId: 'npc_village_elder',
          emotion: 'hopeful',
        },
      },
      permission: 'write',
    },
  ],
  expectedOutput: `情绪变化追踪:
1. [担忧 70%] - 提及哥布林威胁
2. 玩家承诺帮助
3. [希望 60%] - 情绪正向转变

长老的表情从担忧变得充满希望。`,
  notes: [
    '情绪转变时记录 previousEmotion 便于分析',
    'transition 标记情绪转变方向 (positive/negative/neutral)',
    '玩家行为可以显著影响 NPC 情绪',
  ],
};

/**
 * 复杂情绪分析示例
 * 展示分析复杂情绪组合
 */
export const complexEmotionExample: ToolCallExample = {
  name: 'complex_emotion',
  description: '复杂情绪分析示例 - 分析混合情绪状态',
  scenario: 'NPC 同时表现出多种情绪',
  toolCalls: [
    {
      toolType: ToolType.DIALOGUE_DATA,
      method: 'getEmotionHistory',
      params: {
        characterId: 'player_001',
        npcId: 'npc_betrayed_knight',
      },
      permission: 'read',
    },
    {
      toolType: ToolType.DIALOGUE_DATA,
      method: 'recordEmotion',
      params: {
        characterId: 'player_001',
        npcId: 'npc_betrayed_knight',
        emotion: {
          type: 'mixed',
          intensity: 0.8,
          timestamp: Date.now(),
          components: [
            { type: 'anger', intensity: 0.6, reason: 'betrayal' },
            { type: 'sadness', intensity: 0.5, reason: 'lost_trust' },
            { type: 'confusion', intensity: 0.3, reason: 'unexpected_betrayal' },
          ],
          dominantEmotion: 'anger',
          trigger: 'discovery_of_betrayal',
        },
      },
      permission: 'write',
    },
    {
      toolType: ToolType.DIALOGUE_DATA,
      method: 'addHistory',
      params: {
        characterId: 'player_001',
        entry: {
          id: 'dialogue_emotion_004',
          timestamp: Date.now(),
          speaker: 'npc',
          content: '我...我没想到你会这样做...为什么？',
          type: 'response',
          npcId: 'npc_betrayed_knight',
          emotion: 'mixed',
          emotionDetails: {
            dominant: 'anger',
            secondary: ['sadness', 'confusion'],
          },
        },
      },
      permission: 'write',
    },
  ],
  expectedOutput: `复杂情绪分析:
主导情绪: 愤怒 (60%)
次要情绪:
- 悲伤 (50%) - 失去信任
- 困惑 (30%) - 意料之外的背叛

NPC 表现出愤怒与悲伤交织的复杂情绪。`,
  notes: [
    '复杂情绪使用 components 数组记录多个情绪成分',
    'dominantEmotion 标记主要情绪用于显示',
    '情绪分析有助于生成更真实的 NPC 反应',
  ],
};

/**
 * 情绪影响对话示例
 * 展示情绪如何影响对话选项和结果
 */
export const emotionInfluenceExample: ToolCallExample = {
  name: 'emotion_influence',
  description: '情绪影响对话示例 - 情绪状态影响对话结果',
  scenario: 'NPC 的情绪状态影响其对玩家请求的反应',
  toolCalls: [
    {
      toolType: ToolType.DIALOGUE_DATA,
      method: 'getEmotionHistory',
      params: {
        characterId: 'player_001',
        npcId: 'npc_blacksmith',
      },
      permission: 'read',
    },
    {
      toolType: ToolType.NPC_DATA,
      method: 'getRelationship',
      params: {
        characterId: 'player_001',
        npcId: 'npc_blacksmith',
      },
      permission: 'read',
    },
    {
      toolType: ToolType.DIALOGUE_DATA,
      method: 'recordEmotion',
      params: {
        characterId: 'player_001',
        npcId: 'npc_blacksmith',
        emotion: {
          type: 'grateful',
          intensity: 0.8,
          timestamp: Date.now(),
          trigger: 'player_helped_with_supplies',
        },
      },
      permission: 'write',
    },
    {
      toolType: ToolType.DIALOGUE_DATA,
      method: 'addHistory',
      params: {
        characterId: 'player_001',
        entry: {
          id: 'dialogue_emotion_005',
          timestamp: Date.now(),
          speaker: 'player',
          content: '铁匠大师，能帮我修理这把剑吗？',
          type: 'request',
          npcId: 'npc_blacksmith',
        },
      },
      permission: 'write',
    },
    {
      toolType: ToolType.DIALOGUE_DATA,
      method: 'addHistory',
      params: {
        characterId: 'player_001',
        entry: {
          id: 'dialogue_emotion_006',
          timestamp: Date.now(),
          speaker: 'npc',
          content: '当然！你帮了我大忙，这次修理免费！而且我会用最好的材料！',
          type: 'response',
          npcId: 'npc_blacksmith',
          emotion: 'grateful',
          specialOffer: {
            type: 'free_service',
            quality: 'premium',
          },
        },
      },
      permission: 'write',
    },
  ],
  expectedOutput: `铁匠的情绪状态: 感激 (80%)
原因: 玩家帮助解决了材料供应问题

特殊效果:
- 修理服务免费
- 使用优质材料
- 完成时间减半

NPC 因为感激情绪提供了额外优惠。`,
  notes: [
    '正面情绪可以解锁特殊对话选项和优惠',
    '情绪强度影响优惠的程度',
    '记录情绪触发原因便于后续分析',
  ],
};

/**
 * 导出所有情绪示例
 */
export const emotionExamples: ToolCallExample[] = [
  emotionRecordExample,
  emotionTrackingExample,
  complexEmotionExample,
  emotionInfluenceExample,
];
