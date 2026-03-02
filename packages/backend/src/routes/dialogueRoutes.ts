import { Router, Request, Response } from 'express';
import type { Router as RouterType } from 'express';
import { getLLMService } from '../services/llm';
import type {
  InitialSceneRequest,
  InitialSceneResponse,
  SendDialogueRequest,
  SendDialogueResponse,
  DialogueMessage,
  DialogueOption,
} from '@ai-rpg/shared';

const router: RouterType = Router();

router.post('/initial', async (req: Request, res: Response) => {
  try {
    const request = req.body as InitialSceneRequest;

    if (!request.characterId || !request.templateId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: characterId, templateId',
      });
    }

    const llmService = getLLMService();

    const systemPrompt = `你是一个RPG游戏的叙事者。请为玩家生成一个引人入胜的开场场景。

角色信息：
- 名字: ${request.characterName}
- 种族: ${request.characterRace}
- 职业: ${request.characterClass}
${request.characterBackground ? `- 背景: ${request.characterBackground}` : ''}

${request.worldSetting ? `世界设定: ${request.worldSetting}` : ''}

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

    res.json(result);
  } catch (error) {
    console.error('[DialogueRoutes] Error generating initial scene:', error);
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
  ]
}`;

    const response = await llmService.chat(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: request.message },
      ],
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

    const message: DialogueMessage = {
      id: `dmsg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      role: 'narrator',
      content: parsedResult.content,
      type: 'normal',
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
    };

    res.json(result);
  } catch (error) {
    console.error('[DialogueRoutes] Error sending dialogue:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.post('/options', async (req: Request, res: Response) => {
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

router.get('/history/:characterId', async (req: Request, res: Response) => {
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
