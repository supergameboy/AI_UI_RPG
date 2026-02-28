import { Router, type Router as RouterType } from 'express';
import { getSettingsService } from '../services/SettingsService';
import type { GameSettings } from '../services/SettingsService';

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

router.put('/', (req, res) => {
  try {
    const service = getSettingsService();
    const updates = req.body as Partial<GameSettings>;
    const settings = service.updateSettings(updates);
    res.json(settings);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
