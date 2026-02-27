import express from 'express';
import cors from 'cors';
import { initDatabaseService, DatabaseService } from './services/DatabaseService';
import { databaseInitializer } from './database/initializer';
import { saveRepository } from './models/SaveRepository';

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

app.get('/api/saves', (_req, res) => {
  try {
    const saves = saveRepository.findAll();
    res.json(saves);
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
    const save = saveRepository.create(req.body);
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
}

initializeApp().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
});
