import { Router, Request, Response } from 'express';
import type { Router as RouterType } from 'express';
import { getLLMService } from '../services/llm';
import { gameLog } from '../services/GameLogService';
import type {
  InitialSceneRequest,
  InitialSceneResponse,
  SendDialogueRequest,
  SendDialogueResponse,
  DialogueMessage,
  DialogueOption,
  CombatTrigger,
  EnemyInitData,
  AllyInitData,
} from '@ai-rpg/shared';

const router: RouterType = Router();

const MAX_LOG_LENGTH = 2000;

/**
 * 截断内容用于日志输出
 */
function truncateContent(content: string, maxLength: number = MAX_LOG_LENGTH): string {
  if (content.length <= maxLength) return content;
  return content.substring(0, maxLength) + `... [truncated, total: ${content.length} chars]`;
}

/**
 * 从 LLM 响应中解析战斗触发信息
 * 支持两种格式：
 * 1. [COMBAT_START] 标记后跟 JSON 格式的敌人数据
 * 2. JSON 中的 combatTrigger 字段
 */
function parseCombatTrigger(content: string): CombatTrigger | null {
  // 方式1: 检测 [COMBAT_START] 标记
  const combatStartMatch = content.match(/\[COMBAT_START\]\s*([\s\S]*?)(?=\[\/COMBAT_START\]|$)/);
  if (combatStartMatch) {
    try {
      const combatData = JSON.parse(combatStartMatch[1].trim()) as {
        enemies: EnemyInitData[];
        allies?: AllyInitData[];
        reason?: string;
      };
      return {
        enemies: combatData.enemies,
        allies: combatData.allies,
        reason: combatData.reason,
      };
    } catch (e) {
      console.error('[DialogueRoutes] Failed to parse COMBAT_START data:', e);
    }
  }

  // 方式2: 检测 JSON 格式的战斗指令
  const jsonCombatMatch = content.match(/"combatTrigger"\s*:\s*(\{[\s\S]*?\})/);
  if (jsonCombatMatch) {
    try {
      const combatData = JSON.parse(jsonCombatMatch[1]) as CombatTrigger;
      if (combatData.enemies && combatData.enemies.length > 0) {
        return combatData;
      }
    } catch (e) {
      console.error('[DialogueRoutes] Failed to parse combatTrigger JSON:', e);
    }
  }

  return null;
}

/**
 * 从内容中移除战斗触发标记
 */
function removeCombatMarkers(content: string): string {
  return content
    .replace(/\[COMBAT_START\][\s\S]*?(\[\/COMBAT_START\]|$)/g, '')
    .replace(/"combatTrigger"\s*:\s*\{[\s\S]*?\}/g, '')
    .trim();
}

function formatWorldSetting(worldSetting: unknown): string {
  if (!worldSetting) return '';
  if (typeof worldSetting === 'string') return worldSetting;
  if (typeof worldSetting === 'object') {
    const ws = worldSetting as {
      name?: string;
      description?: string;
      era?: string;
      technologyLevel?: string;
      magicSystem?: string;
      customFields?: Record<string, string>;
    };
    const parts: string[] = [];
    if (ws.name) parts.push(`名称: ${ws.name}`);
    if (ws.era) parts.push(`时代: ${ws.era}`);
    if (ws.technologyLevel) parts.push(`科技水平: ${ws.technologyLevel}`);
    if (ws.magicSystem) parts.push(`魔法系统: ${ws.magicSystem}`);
    if (ws.description) parts.push(`描述: ${ws.description}`);
    if (ws.customFields && Object.keys(ws.customFields).length > 0) {
      for (const [key, value] of Object.entries(ws.customFields)) {
        parts.push(`${key}: ${value}`);
      }
    }
    return parts.join('\n');
  }
  return String(worldSetting);
}

router.post('/initial', async (req: Request, res: Response) => {
  try {
    const request = req.body as InitialSceneRequest;

    if (!request.characterId || !request.templateId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: characterId, templateId',
      });
    }

    gameLog.info('dialogue', '收到初始场景请求', { characterId: request.characterId, templateId: request.templateId });

    const llmService = getLLMService();
    const worldSettingStr = formatWorldSetting(request.worldSetting);

    const systemPrompt = `你是一个RPG游戏的叙事者。请为玩家生成一个引人入胜的开场场景。

角色信息：
- 名字: ${request.characterName}
- 种族: ${request.characterRace}
- 职业: ${request.characterClass}
${request.characterBackground ? `- 背景: ${request.characterBackground}` : ''}

${worldSettingStr ? `世界设定:\n${worldSettingStr}` : ''}

请生成开场场景，包含：
1. 场景描述（环境、氛围）
2. 角色的初始处境
3. 欢迎信息
4. 2-5个玩家可以采取的行动选项

返回JSON格式：
{
  "content": "开场叙事内容",
  "location": "初始地点名称",
  "timeOfDay": "时间（早晨/中午/傍晚/夜晚）",
  "weather": "天气描述",
  "atmosphere": "氛围描述",
  "options": [
    {"id": "opt_1", "text": "选项文本", "type": "normal"}
  ]
}`;

    gameLog.debug('dialogue', '初始场景系统提示词', { 
      systemPrompt: truncateContent(systemPrompt) 
    });

    const response = await llmService.chat(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: '请生成开场场景。' },
      ],
      { temperature: 0.8, maxTokens: 1500, agentType: 'dialogue' }
    );

    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    let parsedResult: {
      content: string;
      location: string;
      timeOfDay: string;
      weather?: string;
      atmosphere?: string;
      options: Array<{ id: string; text: string; type: string }>;
    };

    if (jsonMatch) {
      parsedResult = JSON.parse(jsonMatch[0]) as typeof parsedResult;
    } else {
      parsedResult = {
        content: `欢迎，${request.characterName}！你的冒险即将开始...`,
        location: '未知之地',
        timeOfDay: '早晨',
        options: [
          { id: 'opt_1', text: '四处看看', type: 'normal' },
          { id: 'opt_2', text: '检查自己的装备', type: 'normal' },
          { id: 'opt_3', text: '向前走去', type: 'normal' },
        ],
      };
    }

    const message: DialogueMessage = {
      id: `dmsg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      role: 'narrator',
      content: parsedResult.content,
      type: 'system',
      timestamp: Date.now(),
    };

    const options: DialogueOption[] = (parsedResult.options || []).map((opt, index) => ({
      id: opt.id || `opt_${Date.now()}_${index}`,
      text: opt.text,
      type: (opt.type as DialogueOption['type']) || 'normal',
    }));

    const result: InitialSceneResponse = {
      success: true,
      message,
      options,
      context: {
        location: parsedResult.location,
        timeOfDay: parsedResult.timeOfDay,
        weather: parsedResult.weather,
        atmosphere: parsedResult.atmosphere,
      },
    };

    gameLog.debug('dialogue', '初始场景响应', { 
      content: truncateContent(message.content),
      location: parsedResult.location,
      options 
    });

    gameLog.info('dialogue', '初始场景生成成功', { responseLength: message.content.length });

    res.json(result);
  } catch (error) {
    console.error('[DialogueRoutes] Error generating initial scene:', error);
    gameLog.error('dialogue', '初始场景生成失败', { error: error instanceof Error ? error.message : 'Unknown error' });
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.post('/send', async (req: Request, res: Response) => {
  try {
    const request = req.body as SendDialogueRequest;

    if (!request.characterId || !request.message) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: characterId, message',
      });
    }

    gameLog.info('dialogue', '收到玩家输入', { input: request.message.substring(0, 50) });
    gameLog.debug('dialogue', '玩家完整输入', { 
      input: request.message,
      characterId: request.characterId 
    });

    const llmService = getLLMService();

    const contextInfo = request.context?.location
      ? `当前位置: ${request.context.location}`
      : '';

    const recentMessages = request.context?.recentMessages
      ?.slice(-5)
      .map(m => `${m.role}: ${m.content}`)
      .join('\n') || '';

    const systemPrompt = `你是一个RPG游戏的叙事者和游戏主持人。根据玩家的输入推进故事。

${contextInfo}

${recentMessages ? `最近的对话：\n${recentMessages}\n` : ''}

请根据玩家的输入生成响应，并给出2-5个后续行动选项。

如果场景适合触发战斗（如遇到敌人、进入危险区域、触发战斗事件），请在响应中包含战斗触发标记。

返回JSON格式：
{
  "content": "叙事响应内容",
  "stateChanges": {
    "health": 0,
    "mana": 0,
    "gold": 0,
    "experience": 0
  },
  "options": [
    {"id": "opt_1", "text": "选项文本", "type": "normal"}
  ],
  "combatTrigger": {
    "enemies": [
      {
        "id": "enemy_1",
        "name": "哥布林",
        "type": "enemy",
        "level": 1,
        "stats": {
          "maxHp": 50,
          "currentHp": 50,
          "maxMp": 0,
          "currentMp": 0,
          "attack": 10,
          "defense": 5,
          "speed": 8,
          "luck": 5
        },
        "skills": ["attack"]
      }
    ],
    "allies": [],
    "reason": "遭遇敌人"
  }
}

注意：combatTrigger 字段是可选的，只有在需要触发战斗时才包含。`;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: request.message },
    ];
    gameLog.debug('llm', '调用LLM生成对话响应', { messageCount: messages.length });

    const response = await llmService.chat(
      messages,
      { temperature: 0.8, maxTokens: 1000, agentType: 'dialogue' }
    );

    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    let parsedResult: {
      content: string;
      stateChanges?: {
        health?: number;
        mana?: number;
        gold?: number;
        experience?: number;
      };
      options: Array<{ id: string; text: string; type: string }>;
      combatTrigger?: CombatTrigger;
    };

    if (jsonMatch) {
      parsedResult = JSON.parse(jsonMatch[0]) as typeof parsedResult;
    } else {
      parsedResult = {
        content: response.content,
        options: [
          { id: 'opt_1', text: '继续', type: 'normal' },
        ],
      };
    }

    // 检测战斗触发
    let combatTrigger: CombatTrigger | undefined;
    const rawContent = parsedResult.content || response.content;
    
    // 先检查 JSON 中的 combatTrigger
    if (parsedResult.combatTrigger && parsedResult.combatTrigger.enemies?.length > 0) {
      combatTrigger = parsedResult.combatTrigger;
    } else {
      // 再检查文本中的战斗标记
      const triggerFromText = parseCombatTrigger(rawContent);
      if (triggerFromText) {
        combatTrigger = triggerFromText;
      }
    }

    // 战斗触发日志
    if (combatTrigger) {
      gameLog.info('combat', '检测到战斗触发', { enemyCount: combatTrigger.enemies.length });
    }

    // 清理内容中的战斗标记
    const cleanedContent = removeCombatMarkers(rawContent);

    const message: DialogueMessage = {
      id: `dmsg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      role: 'narrator',
      content: cleanedContent,
      type: combatTrigger ? 'combat' : 'normal',
      timestamp: Date.now(),
    };

    const options: DialogueOption[] = (parsedResult.options || []).map((opt, index) => ({
      id: opt.id || `opt_${Date.now()}_${index}`,
      text: opt.text,
      type: (opt.type as DialogueOption['type']) || 'normal',
    }));

    const result: SendDialogueResponse = {
      success: true,
      message,
      options,
      stateChanges: parsedResult.stateChanges,
      combatTrigger,
    };

    gameLog.info('dialogue', '对话响应生成成功', { responseLength: message.content.length });
    gameLog.debug('dialogue', '对话响应内容', { 
      content: truncateContent(message.content),
      options 
    });

    res.json(result);
  } catch (error) {
    console.error('[DialogueRoutes] Error sending dialogue:', error);
    gameLog.error('dialogue', '对话处理失败', { error: error instanceof Error ? error.message : 'Unknown error' });
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.post('/options', async (_req: Request, res: Response) => {
  try {
    const options: DialogueOption[] = [
      { id: `opt_${Date.now()}_1`, text: '四处看看', type: 'normal' },
      { id: `opt_${Date.now()}_2`, text: '继续前进', type: 'normal' },
      { id: `opt_${Date.now()}_3`, text: '休息一下', type: 'normal' },
    ];

    res.json({
      success: true,
      options,
    });
  } catch (error) {
    console.error('[DialogueRoutes] Error getting options:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.get('/history/:characterId', async (_req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      messages: [],
      total: 0,
      hasMore: false,
    });
  } catch (error) {
    console.error('[DialogueRoutes] Error getting history:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
