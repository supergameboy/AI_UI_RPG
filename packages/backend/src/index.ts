import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { initDatabaseService, DatabaseService } from './services/DatabaseService';
import { databaseInitializer } from './database/initializer';
import { saveRepository } from './models/SaveRepository';
import { initializeLLMService, getLLMService } from './services/llm';
import { initializeAgentService, getAgentService } from './services/AgentService';
import { initializePromptService } from './services/PromptService';
import { getWebSocketService } from './services/WebSocketService';
import { getDeveloperLogService } from './services/DeveloperLogService';
import { initializeGameLogService, getGameLogService } from './services/GameLogService';
import { getTemplateService } from './services/TemplateService';
import { initializeAIGenerateService } from './services/AIGenerateService';
import { initializeCharacterGenerationService } from './services/CharacterGenerationService';
import { getSettingsService, initializeSettingsService } from './services/SettingsService';
import { initializeSkillService } from './services/SkillService';
import { initializeNumericalService } from './services/NumericalService';
import { initializeQuestService } from './services/QuestService';
import { initializeMapService } from './services/MapService';
import { initializeNPCService } from './services/NPCService';
import { initializeCombatService } from './services/CombatService';
import { initializeTools } from './tools';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import agentRoutes from './routes/agentRoutes';
import questRoutes from './routes/questRoutes';
import settingsRoutes from './routes/settingsRoutes';
import promptRoutes from './routes/promptRoutes';
import templateRoutes from './routes/templateRoutes';
import characterRoutes from './routes/characterRoutes';
import inventoryRoutes from './routes/inventoryRoutes';
import skillRoutes from './routes/skillRoutes';
import numericalRoutes from './routes/numericalRoutes';
import equipmentRoutes from './routes/equipmentRoutes';
import mapRoutes from './routes/mapRoutes';
import npcRoutes from './routes/npcRoutes';
import dialogueRoutes from './routes/dialogueRoutes';
import combatRoutes from './routes/combatRoutes';
import tokenRoutes from './routes/tokenRoutes';
import bindingsRoutes from './routes/bindings';
import toolsRoutes from './routes/tools';
import gameRoutes from './routes/game';
import initializationRoutes from './routes/initializationRoutes';
import contextRoutes from './routes/contextRoutes';
import decisionLogRoutes from './routes/decisionLogRoutes';
import type { Message, ChatOptions } from '@ai-rpg/shared';
import type { LogLevel, LogSource } from './services/GameLogService';

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 6756;

app.use(cors());
app.use(express.json());
app.use(requestLogger());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'AI-RPG Backend is running' });
});

app.get('/api', (_req, res) => {
  res.json({
    name: 'AI-RPG Engine API',
    version: '0.2.0',
  });
});

app.get('/api/database/status', (_req, res) => {
  try {
    const db = DatabaseService.getInstance();
    const isConnected = db.isConnected();
    const dbPath = db.getDbPath();
    const version = databaseInitializer.getVersion();

    res.json({
      connected: isConnected,
      path: dbPath,
      version: version,
      initialized: databaseInitializer.isInitialized(),
    });
  } catch (error) {
    res.status(500).json({
      error: 'Database not initialized',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.post('/api/database/init', async (_req, res) => {
  try {
    await initDatabaseService();
    DatabaseService.getInstance().connect();
    databaseInitializer.initialize();

    res.json({
      success: true,
      message: 'Database initialized successfully',
      version: databaseInitializer.getVersion(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.get('/api/saves', (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const template_id = req.query.template_id as string | undefined;

    const result = saveRepository.findWithPagination({
      page,
      limit,
      template_id,
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.get('/api/saves/stats', (_req, res) => {
  try {
    const stats = saveRepository.getStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.get('/api/saves/recent', (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const saves = saveRepository.findRecent(limit);
    res.json(saves);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.get('/api/saves/:id', (req, res) => {
  try {
    const save = saveRepository.findById(req.params.id);
    if (!save) {
      res.status(404).json({ error: 'Save not found' });
      return;
    }
    res.json(save);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.post('/api/saves', (req, res) => {
  try {
    const { snapshot, ...saveData } = req.body;

    console.log('[API] Creating save with data:', saveData);

    const save = saveRepository.create(saveData);

    if (snapshot) {
      saveRepository.createSnapshot({
        save_id: save.id,
        snapshot_type: snapshot.snapshot_type || 'manual',
        context_state: snapshot.context_state || '{}',
        memory_state: snapshot.memory_state || '{}',
        agent_states: snapshot.agent_states || '{}',
      });
    } else if (saveData.game_state) {
      saveRepository.createSnapshot({
        save_id: save.id,
        snapshot_type: 'manual',
        context_state: '{}',
        memory_state: '{}',
        agent_states: saveData.game_state,
      });
    }

    res.status(201).json(save);
  } catch (error) {
    console.error('[API] Error creating save:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

app.put('/api/saves/:id', (req, res) => {
  try {
    const save = saveRepository.update(req.params.id, req.body);
    if (!save) {
      res.status(404).json({ error: 'Save not found' });
      return;
    }
    res.json(save);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.delete('/api/saves/:id', (req, res) => {
  try {
    const deleted = saveRepository.deleteById(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: 'Save not found' });
      return;
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.get('/api/saves/:id/snapshots', (req, res) => {
  try {
    const snapshots = saveRepository.findSnapshotsBySaveId(req.params.id);
    res.json(snapshots);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.post('/api/saves/:id/snapshots', (req, res) => {
  try {
    const snapshot = saveRepository.createSnapshot({
      save_id: req.params.id,
      ...req.body,
    });
    res.status(201).json(snapshot);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.get('/api/llm/config', (_req, res) => {
  try {
    const llmService = getLLMService();
    const config = llmService.getConfig();
    const providers = Object.keys(config.providers).map((key) => ({
      name: key,
      configured: llmService.isProviderConfigured(key),
      defaultModel: config.providers[key]?.defaultModel,
    }));

    res.json({
      defaultProvider: config.defaultProvider,
      defaultModel: config.defaultModel,
      providers,
      availableProviders: llmService.getAvailableProviders(),
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.put('/api/llm/config', async (req, res) => {
  try {
    const llmService = getLLMService();
    const { provider, apiKey, baseURL, defaultModel } = req.body;

    if (!provider) {
      res.status(400).json({ error: 'Provider is required' });
      return;
    }

    llmService.updateProviderConfig(provider, {
      apiKey,
      baseURL,
      defaultModel,
    });

    if (apiKey) {
      await llmService.registerProvider(provider, {
        provider,
        apiKey,
        baseURL,
        defaultModel,
        models: [],
      });
    }

    res.json({
      success: true,
      message: `Provider ${provider} configured successfully`,
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.get('/api/llm/models', (_req, res) => {
  try {
    const llmService = getLLMService();
    const capabilities = llmService.getAllCapabilities();

    res.json({
      models: capabilities,
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.post('/api/llm/test', async (req, res) => {
  try {
    const { provider, apiKey, baseURL } = req.body;
    
    if (!apiKey) {
      res.status(400).json({
        success: false,
        error: 'API Key is required',
      });
      return;
    }

    const llmService = getLLMService();
    
    const testConfig = {
      provider,
      apiKey,
      baseURL: baseURL || undefined,
      models: [],
    };
    
    const existingAdapter = llmService.getAvailableProviders().includes(provider);
    
    if (!existingAdapter) {
      await llmService.registerProvider(provider, testConfig);
    }
    
    try {
      const adapter = llmService.getAdapter(provider);
      const capabilities = adapter.getCapabilities();

      const testMessage: Message = {
        role: 'user',
        content: 'Hello, this is a test message. Please respond with "Connection successful."',
      };

      const response = await adapter.chat([testMessage], {
        maxTokens: 50,
        temperature: 0.1,
      });

      res.json({
        success: true,
        provider,
        model: capabilities.model,
        response: response.content.substring(0, 100),
        usage: response.usage,
      });
    } finally {
      if (!existingAdapter) {
        llmService.removeProvider(provider);
      }
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.post('/api/llm/chat', async (req, res) => {
  try {
    const { messages, options, provider } = req.body as {
      messages: Message[];
      options?: ChatOptions;
      provider?: string;
    };

    const llmService = getLLMService();
    const response = await llmService.chat(messages, { ...options, provider });

    res.json(response);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.post('/api/llm/chat/stream', async (req, res) => {
  try {
    const { messages, options, provider } = req.body as {
      messages: Message[];
      options?: ChatOptions;
      provider?: string;
    };

    const llmService = getLLMService();

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    for await (const chunk of llmService.chatStream(messages, { ...options, provider })) {
      res.write(`data: ${JSON.stringify(chunk)}\n\n`);
    }

    res.end();
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.use('/api/agents', agentRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/prompts', promptRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/character', characterRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/numerical', numericalRoutes);
app.use('/api/quests', questRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/map', mapRoutes);
app.use('/api/npc', npcRoutes);
app.use('/api/dialogue', dialogueRoutes);
app.use('/api/combat', combatRoutes);
app.use('/api/token', tokenRoutes);
app.use('/api/bindings', bindingsRoutes);
app.use('/api/tools', toolsRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/initialization', initializationRoutes);
app.use('/api/context', contextRoutes);
app.use('/api/decision-logs', decisionLogRoutes);

app.get('/api/logs/llm', (_req, res) => {
  try {
    const logService = getDeveloperLogService();
    const logs = logService.getLLMRequests();
    res.json({ logs });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.get('/api/logs/agents', (_req, res) => {
  try {
    const logService = getDeveloperLogService();
    const logs = logService.getAgentMessages();
    res.json({ logs });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.delete('/api/logs/llm', (_req, res) => {
  try {
    const logService = getDeveloperLogService();
    logService.clearLLMRequests();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.delete('/api/logs/agents', (_req, res) => {
  try {
    const logService = getDeveloperLogService();
    logService.clearAgentMessages();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.get('/api/logs/game', (req, res) => {
  try {
    const gameLogService = getGameLogService();
    const level = req.query.level as LogLevel | undefined;
    const source = req.query.source as LogSource | undefined;
    const search = req.query.search as string | undefined;
    const limit = parseInt(req.query.limit as string) || 100;

    const logs = gameLogService.getFilteredLogs({ level, source, search, limit });
    res.json({ logs });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.get('/api/logs/game/file', (_req, res) => {
  try {
    const gameLogService = getGameLogService();
    const logPath = gameLogService.getLogFilePath();
    res.json({ path: logPath });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.delete('/api/logs/game', (_req, res) => {
  try {
    const gameLogService = getGameLogService();
    gameLogService.clearLogs();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Developer test routes
app.post('/api/developer/test-ui-agent', async (req, res) => {
  try {
    const { description } = req.body as { description: string };
    
    if (!description) {
      res.status(400).json({
        success: false,
        error: 'Description is required',
      });
      return;
    }

    const agentService = getAgentService();
    const { AgentType } = await import('@ai-rpg/shared');
    const uiAgent = agentService.getAgent(AgentType.UI);
    
    if (!uiAgent) {
      res.status(500).json({
        success: false,
        error: 'UIAgent not initialized',
      });
      return;
    }

    // 使用 UIAgent 的 generateDynamicUI 方法
    const { UIAgent } = await import('./agents/UIAgent') as { UIAgent: typeof import('./agents/UIAgent').UIAgent };
    const dynamicUI = await (uiAgent as InstanceType<typeof UIAgent>).generateDynamicUI(description);
    
    res.json({
      success: true,
      dynamicUI,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.use(notFoundHandler);
app.use(errorHandler);

async function initializeApp() {
  console.log('Initializing application...');

  // 初始化 Tools
  try {
    initializeTools();
    console.log('Tools initialized');
  } catch (error) {
    console.error('Failed to initialize tools:', error);
  }

  try {
    await initDatabaseService();
    DatabaseService.getInstance().connect();
    databaseInitializer.initialize();
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
  }

  try {
    await initializeLLMService({
      defaultProvider: 'deepseek',
      defaultModel: 'deepseek-chat',
      providers: {},
    });
    console.log('LLM Service initialized');
    
    initializeSettingsService();
    const settingsService = getSettingsService();
    const settings = settingsService.getSettings();
    console.log('[Startup] Loading saved LLM configuration...');
    
    const llmService = getLLMService();
    const { ai } = settings;
    
    for (const [provider, config] of Object.entries(ai.providers)) {
      if (config.apiKey) {
        try {
          await llmService.registerProvider(provider, {
            provider,
            apiKey: config.apiKey,
            baseURL: config.baseURL,
            defaultModel: config.defaultModel,
            models: [],
          });
          console.log(`[Startup] Registered LLM provider from saved config: ${provider}`);
        } catch (err) {
          console.error(`[Startup] Failed to register provider ${provider}:`, err);
        }
      }
    }
    
    if (ai.defaultProvider && llmService.getAvailableProviders().includes(ai.defaultProvider)) {
      llmService.setDefaultProvider(ai.defaultProvider);
      console.log(`[Startup] Set default provider to: ${ai.defaultProvider}`);
    }
    
    initializeAIGenerateService(getLLMService());
    console.log('AI Generate Service initialized');
    
    const { getAIGenerateService } = await import('./services/AIGenerateService');
    initializeCharacterGenerationService(getLLMService(), getAIGenerateService()!);
    console.log('Character Generation Service initialized');
  } catch (error) {
    console.error('Failed to initialize LLM service:', error);
  }

  try {
    await initializePromptService();
    console.log('Prompt Service initialized');
  } catch (error) {
    console.error('Failed to initialize Prompt service:', error);
  }

  try {
    await initializeAgentService();
    console.log('Agent Service initialized');
  } catch (error) {
    console.error('Failed to initialize Agent service:', error);
  }

  try {
    await initializeSkillService();
    console.log('Skill Service initialized');
  } catch (error) {
    console.error('Failed to initialize Skill service:', error);
  }

  try {
    await initializeNumericalService();
    console.log('Numerical Service initialized');
  } catch (error) {
    console.error('Failed to initialize Numerical service:', error);
  }

  try {
    await initializeQuestService();
    console.log('Quest Service initialized');
  } catch (error) {
    console.error('Failed to initialize Quest service:', error);
  }

  try {
    await initializeMapService();
    console.log('Map Service initialized');
  } catch (error) {
    console.error('Failed to initialize Map service:', error);
  }

  try {
    await initializeNPCService();
    console.log('NPC Service initialized');
  } catch (error) {
    console.error('Failed to initialize NPC service:', error);
  }

  try {
    await initializeCombatService();
    console.log('Combat Service initialized');
  } catch (error) {
    console.error('Failed to initialize Combat service:', error);
  }

  getWebSocketService().initialize(server);
  console.log('WebSocket Service initialized');
  
  getDeveloperLogService();
  console.log('Developer Log Service initialized');
  
  initializeGameLogService();
  console.log('Game Log Service initialized');

  try {
    const templateService = getTemplateService();
    await templateService.initializePresetTemplates();
    console.log('Preset templates initialized');
  } catch (error) {
    console.error('Failed to initialize preset templates:', error);
  }
}

initializeApp().then(() => {
  server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
});
