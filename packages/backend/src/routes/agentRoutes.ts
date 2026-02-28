import { Router, type Router as RouterType } from 'express';
import type { AgentType, AgentConfig } from '@ai-rpg/shared';
import { getAgentService, startAgentService } from '../services/AgentService';
import { getAgentConfigService } from '../services/AgentConfigService';

const router: RouterType = Router();

router.get('/config', async (_req, res) => {
  try {
    const configService = getAgentConfigService();
    const configs = configService.getAllConfigs();
    res.json({ configs });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.get('/config/:type', (req, res) => {
  try {
    const agentType = req.params.type as AgentType;
    const configService = getAgentConfigService();
    const config = configService.getConfig(agentType);

    if (!config) {
      res.status(404).json({ error: `Agent config not found: ${agentType}` });
      return;
    }

    res.json(config);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.put('/config/:type', async (req, res) => {
  try {
    const agentType = req.params.type as AgentType;
    const updates = req.body as Partial<AgentConfig> & { systemPrompt?: string; enabled?: boolean };

    const configService = getAgentConfigService();
    const validation = configService.validateConfig(updates);

    if (!validation.valid) {
      res.status(400).json({ errors: validation.errors });
      return;
    }

    const config = await configService.updateConfig(agentType, updates);

    if (!config) {
      res.status(404).json({ error: `Agent config not found: ${agentType}` });
      return;
    }

    res.json(config);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.post('/config/:type/reset', async (req, res) => {
  try {
    const agentType = req.params.type as AgentType;
    const configService = getAgentConfigService();
    const config = await configService.resetConfig(agentType);

    if (!config) {
      res.status(404).json({ error: `Agent config not found: ${agentType}` });
      return;
    }

    res.json(config);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.get('/status', (_req, res) => {
  try {
    const agentService = getAgentService();
    const statuses = agentService.getAllAgentStatuses();
    const initialized = agentService.isInitialized();
    const started = agentService.isStarted();

    res.json({
      initialized,
      started,
      agents: statuses,
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.get('/status/:type', (req, res) => {
  try {
    const agentType = req.params.type as AgentType;
    const agentService = getAgentService();
    const status = agentService.getAgentStatus(agentType);

    if (!status) {
      res.status(404).json({ error: `Agent not found: ${agentType}` });
      return;
    }

    res.json(status);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.post('/start', async (_req, res) => {
  try {
    const agentService = await startAgentService();
    res.json({
      success: true,
      message: 'Agent service started',
      started: agentService.isStarted(),
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.post('/stop', async (_req, res) => {
  try {
    const agentService = getAgentService();
    await agentService.stop();
    res.json({
      success: true,
      message: 'Agent service stopped',
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.get('/logs', (req, res) => {
  try {
    const agentType = req.query.agentType as AgentType | undefined;
    const direction = req.query.direction as 'in' | 'out' | undefined;
    const status = req.query.status as 'pending' | 'success' | 'error' | 'timeout' | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;

    const agentService = getAgentService();
    const logs = agentService.getLogs({
      agentType,
      direction,
      status,
      limit,
    });

    res.json({ logs });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.delete('/logs', (_req, res) => {
  try {
    const agentService = getAgentService();
    agentService.clearLogs();
    res.json({ success: true, message: 'Logs cleared' });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.post('/test', async (req, res) => {
  try {
    const { agentType, action, data } = req.body as {
      agentType: AgentType;
      action: string;
      data: Record<string, unknown>;
    };

    if (!agentType || !action) {
      res.status(400).json({ error: 'agentType and action are required' });
      return;
    }

    const agentService = getAgentService();

    if (!agentService.isStarted()) {
      await agentService.start();
    }

    const agent = agentService.getAgent(agentType);
    if (!agent) {
      res.status(404).json({ error: `Agent not found: ${agentType}` });
      return;
    }

    const response = await agent.sendMessage(
      agentType,
      action,
      data,
      { priority: 'high', requiresResponse: true }
    );

    res.json({
      success: true,
      response,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
