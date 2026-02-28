import express from 'express';
import cors from 'cors';
import { initDatabaseService, DatabaseService } from './services/DatabaseService';
import { databaseInitializer } from './database/initializer';
import { saveRepository } from './models/SaveRepository';
import { initializeLLMService, getLLMService } from './services/llm';
import { initializeAgentService } from './services/AgentService';
import agentRoutes from './routes/agentRoutes';
import type { Message, ChatOptions } from '@ai-rpg/shared';

const app = express();
const PORT = process.env.PORT || 6756;

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'AI-RPG Backend is running' });
});

app.get('/api', (_req, res) => {
  res.json({
    name: 'AI-RPG Engine API',
    version: '0.1.0',
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

    // 创建存档
    const save = saveRepository.create(saveData);

    // 如果提供了快照数据，自动创建初始快照
    if (snapshot) {
      saveRepository.createSnapshot({
        save_id: save.id,
        snapshot_type: snapshot.snapshot_type || 'manual',
        context_state: snapshot.context_state || '{}',
        memory_state: snapshot.memory_state || '{}',
        agent_states: snapshot.agent_states || '{}',
      });
    } else if (saveData.game_state) {
      // 如果没有提供快照但有游戏状态，自动创建一个初始快照
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
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
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

app.put('/api/llm/config', (req, res) => {
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
      llmService.registerProvider(provider, {
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
    const { provider } = req.body;
    const llmService = getLLMService();

    if (!llmService.isProviderConfigured(provider)) {
      res.status(400).json({
        success: false,
        error: `Provider ${provider} is not configured`,
      });
      return;
    }

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

async function initializeApp() {
  console.log('Initializing application...');

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
  } catch (error) {
    console.error('Failed to initialize LLM service:', error);
  }

  try {
    await initializeAgentService();
    console.log('Agent Service initialized');
  } catch (error) {
    console.error('Failed to initialize Agent service:', error);
  }
}

initializeApp().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
});
