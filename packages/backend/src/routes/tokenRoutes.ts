import { Router, Request, Response } from 'express';
import type { Router as RouterType } from 'express';
import { getTokenUsageService } from '../services/TokenUsageService';
import type { TokenUsageQuery, TokenPricing } from '@ai-rpg/shared';

const router: RouterType = Router();

// GET /api/token/usage - 获取使用记录
router.get('/usage', (req: Request, res: Response) => {
  try {
    const service = getTokenUsageService();
    const query: TokenUsageQuery = {
      startTime: req.query.startTime ? Number(req.query.startTime) : undefined,
      endTime: req.query.endTime ? Number(req.query.endTime) : undefined,
      agentType: req.query.agentType as string,
      provider: req.query.provider as string,
      limit: req.query.limit ? Number(req.query.limit) : 100,
    };
    const records = service.getRecords(query);
    res.json({ success: true, data: records });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取Token使用记录失败' });
  }
});

// GET /api/token/statistics - 获取统计信息
router.get('/statistics', (req: Request, res: Response) => {
  try {
    const service = getTokenUsageService();
    const query: TokenUsageQuery = {
      startTime: req.query.startTime ? Number(req.query.startTime) : undefined,
      endTime: req.query.endTime ? Number(req.query.endTime) : undefined,
      agentType: req.query.agentType as string,
      provider: req.query.provider as string,
    };
    const stats = service.getStatistics(query);
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取Token统计失败' });
  }
});

// GET /api/token/pricing - 获取价格配置
router.get('/pricing', (_req: Request, res: Response) => {
  try {
    const service = getTokenUsageService();
    const pricing = service.getPricing();
    res.json({ success: true, data: pricing });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取价格配置失败' });
  }
});

// POST /api/token/pricing - 更新价格配置
router.post('/pricing', (req: Request, res: Response) => {
  try {
    const { provider, model, pricing } = req.body as {
      provider: string;
      model: string;
      pricing: TokenPricing;
    };
    if (!provider || !model || !pricing) {
      return res.status(400).json({ success: false, error: '缺少必需参数' });
    }
    getTokenUsageService().updatePricing(provider, model, pricing);
    res.json({ success: true, message: '价格配置已更新' });
  } catch (error) {
    res.status(500).json({ success: false, error: '更新价格配置失败' });
  }
});

// POST /api/token/reset - 重置统计
router.post('/reset', (_req: Request, res: Response) => {
  try {
    getTokenUsageService().reset();
    res.json({ success: true, message: '统计已重置' });
  } catch (error) {
    res.status(500).json({ success: false, error: '重置统计失败' });
  }
});

export default router;
