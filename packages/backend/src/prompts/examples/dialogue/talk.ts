/**
 * Tool 调用示例 - 对话示例
 * 展示如何调用 DialogueDataTool 和 NPCDataTool 进行对话交互
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
 * 基础对话示例
 * 展示玩家与 NPC 进行对话的完整流程
 */
export const basicDialogueExample: ToolCallExample = {
  name: 'basic_dialogue',
  description: '基础对话示例 - 玩家与 NPC 进行对话',
  scenario: '玩家与村庄长老进行对话，询问任务信息',
  toolCalls: [
    {
      toolType: ToolType.NPC_DATA,
      method: 'getNPC',
      params: {
        npcId: 'npc_village_elder',
        characterId: 'player_001',
      },
      permission: 'read',
    },
    {
      toolType: ToolType.DIALOGUE_DATA,
      method: 'getHistory',
      params: {
        characterId: 'player_001',
        limit: 10,
      },
      permission: 'read',
    },
    {
      toolType: ToolType.DIALOGUE_DATA,
      method: 'getContext',
      params: {
        characterId: 'player_001',
      },
      permission: 'read',
    },
    {
      toolType: ToolType.DIALOGUE_DATA,
      method: 'addHistory',
      params: {
        characterId: 'player_001',
        entry: {
          id: 'dialogue_001',
          timestamp: Date.now(),
          speaker: 'player',
          content: '长老，请问村子附近有什么需要帮助的事情吗？',
          type: 'question',
          npcId: 'npc_village_elder',
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
          id: 'dialogue_002',
          timestamp: Date.now(),
          speaker: 'npc',
          content: '勇士啊，村子东边的森林里最近出现了很多哥布林，村民们都不敢进山砍柴了...',
          type: 'response',
          npcId: 'npc_village_elder',
          emotion: 'worried',
        },
      },
      permission: 'write',
    },
    {
      toolType: ToolType.NPC_DATA,
      method: 'updateRelationship',
      params: {
        request: {
          characterId: 'player_001',
          npcId: 'npc_village_elder',
          trustChange: 5,
          interactionType: 'positive_dialogue',
        },
      },
      permission: 'write',
    },
  ],
  expectedOutput: `与村庄长老的对话:
[玩家] 长老，请问村子附近有什么需要帮助的事情吗？
[长老] 勇士啊，村子东边的森林里最近出现了很多哥布林，村民们都不敢进山砍柴了...

关系变化: 信任度 +5`,
  notes: [
    '对话前获取 NPC 信息了解角色背景',
    '对话历史用于保持上下文连贯性',
    '每次对话后应更新关系值',
    '对话记录包含说话者、内容、情绪等信息',
  ],
};

/**
 * 分支对话示例
 * 展示根据玩家选择触发不同对话分支
 */
export const branchingDialogueExample: ToolCallExample = {
  name: 'branching_dialogue',
  description: '分支对话示例 - 根据玩家选择触发不同对话分支',
  scenario: '玩家面对选择，不同选择影响对话走向和关系',
  toolCalls: [
    {
      toolType: ToolType.DIALOGUE_DATA,
      method: 'getHistory',
      params: {
        characterId: 'player_001',
        limit: 5,
      },
      permission: 'read',
    },
    {
      toolType: ToolType.NPC_DATA,
      method: 'getRelationship',
      params: {
        characterId: 'player_001',
        npcId: 'npc_merchant',
      },
      permission: 'read',
    },
    {
      toolType: ToolType.DIALOGUE_DATA,
      method: 'addHistory',
      params: {
        characterId: 'player_001',
        entry: {
          id: 'dialogue_003',
          timestamp: Date.now(),
          speaker: 'player',
          content: '我选择帮助你解决商队被劫的问题。',
          type: 'choice',
          npcId: 'npc_merchant',
          choiceId: 'choice_help_merchant',
        },
      },
      permission: 'write',
    },
    {
      toolType: ToolType.NPC_DATA,
      method: 'updateRelationship',
      params: {
        request: {
          characterId: 'player_001',
          npcId: 'npc_merchant',
          trustChange: 15,
          respectChange: 10,
          interactionType: 'accept_quest',
        },
      },
      permission: 'write',
    },
    {
      toolType: ToolType.NPC_DATA,
      method: 'interact',
      params: {
        request: {
          characterId: 'player_001',
          npcId: 'npc_merchant',
          interactionType: 'quest_accept',
          data: {
            questId: 'quest_caravan_rescue',
          },
        },
      },
      permission: 'write',
    },
  ],
  expectedOutput: `商人感激地看着你:
"太好了！我就知道你是个可靠的人。商队在西边的山谷被劫，请务必帮我们找回货物！"

关系变化:
- 信任度 +15
- 尊敬度 +10
- 解锁任务: 商队救援`,
  notes: [
    '分支选择会影响 NPC 关系',
    '不同选择可能解锁不同任务',
    '关系值变化幅度根据选择重要性调整',
  ],
};

/**
 * 队伍对话示例
 * 展示与队伍成员的特殊对话
 */
export const partyDialogueExample: ToolCallExample = {
  name: 'party_dialogue',
  description: '队伍对话示例 - 与队伍成员的特殊对话',
  scenario: '玩家与队伍中的同伴进行深入对话',
  toolCalls: [
    {
      toolType: ToolType.NPC_DATA,
      method: 'getParty',
      params: {
        characterId: 'player_001',
      },
      permission: 'read',
    },
    {
      toolType: ToolType.NPC_DATA,
      method: 'getRelationship',
      params: {
        characterId: 'player_001',
        npcId: 'npc_companion_warrior',
      },
      permission: 'read',
    },
    {
      toolType: ToolType.DIALOGUE_DATA,
      method: 'addHistory',
      params: {
        characterId: 'player_001',
        entry: {
          id: 'dialogue_004',
          timestamp: Date.now(),
          speaker: 'player',
          content: '你为什么选择跟随我冒险？',
          type: 'question',
          npcId: 'npc_companion_warrior',
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
          id: 'dialogue_005',
          timestamp: Date.now(),
          speaker: 'npc',
          content: '因为我相信你的领导能力。在之前的战斗中，你总是把队友的安全放在第一位...',
          type: 'response',
          npcId: 'npc_companion_warrior',
          emotion: 'sincere',
          isPartyMember: true,
        },
      },
      permission: 'write',
    },
  ],
  expectedOutput: `[战士同伴] 因为我相信你的领导能力。在之前的战斗中，你总是把队友的安全放在第一位...

当前关系:
- 信任度: 75/100
- 尊敬度: 60/100
- 友谊度: 45/100`,
  notes: [
    '队伍成员有额外的友谊度属性',
    '深入对话可以解锁同伴的个人任务',
    '高友谊度会触发特殊事件',
  ],
};

/**
 * 导出所有对话示例
 */
export const dialogueExamples: ToolCallExample[] = [
  basicDialogueExample,
  branchingDialogueExample,
  partyDialogueExample,
];
