import { Router, type Router as RouterType } from 'express';
import { getSettingsService } from '../services/SettingsService';
import type { GameSettings } from '../services/SettingsService';
import { getLLMService } from '../services/llm';

const router: RouterType = Router();

router.get('/', (_req, res) => {
  try {
    const service = getSettingsService();
    const settings = service.getSettings();
    res.json(settings);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.put('/', async (req, res) => {
  try {
    const service = getSettingsService();
    const updates = req.body as Partial<GameSettings>;
    const settings = service.updateSettings(updates);
    
    // 同步 LLM 配置到 LLMService
    if (updates.ai?.providers) {
      const llmService = getLLMService();
      for (const [provider, config] of Object.entries(updates.ai.providers)) {
        if (config.apiKey) {
          try {
            await llmService.registerProvider(provider, {
              provider,
              apiKey: config.apiKey,
              baseURL: config.baseURL,
              defaultModel: config.defaultModel,
              models: [],
            });
            console.log(`[Settings] Registered LLM provider: ${provider}`);
          } catch (err) {
            console.error(`[Settings] Failed to register provider ${provider}:`, err);
          }
        }
      }
      
      // 更新默认 provider
      if (updates.ai.defaultProvider) {
        llmService.setDefaultProvider(updates.ai.defaultProvider);
      }
    }
    
    res.json(settings);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
