import type { Database } from 'sql.js';
import { gameLog } from './GameLogService';

export interface Migration {
  version: number;
  name: string;
  up: (db: Database) => void;
  down: (db: Database) => void;
}

const migrations: Migration[] = [
  {
    version: 1,
    name: 'create_decision_logs_table',
    up: (db: Database) => {
      db.run(`
        CREATE TABLE IF NOT EXISTS decision_logs (
          id TEXT PRIMARY KEY,
          timestamp INTEGER NOT NULL,
          request_id TEXT NOT NULL,
          player_id TEXT NOT NULL,
          save_id TEXT NOT NULL,
          player_input TEXT NOT NULL,
          input_type TEXT NOT NULL,
          agents TEXT NOT NULL,
          conflicts TEXT NOT NULL,
          result TEXT NOT NULL,
          metadata TEXT NOT NULL,
          created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
        )
      `);
      db.run('CREATE INDEX IF NOT EXISTS idx_decision_logs_request_id ON decision_logs(request_id)');
      db.run('CREATE INDEX IF NOT EXISTS idx_decision_logs_player_id ON decision_logs(player_id)');
      db.run('CREATE INDEX IF NOT EXISTS idx_decision_logs_save_id ON decision_logs(save_id)');
      db.run('CREATE INDEX IF NOT EXISTS idx_decision_logs_timestamp ON decision_logs(timestamp)');
    },
    down: (db: Database) => {
      db.run('DROP INDEX IF EXISTS idx_decision_logs_timestamp');
      db.run('DROP INDEX IF EXISTS idx_decision_logs_save_id');
      db.run('DROP INDEX IF EXISTS idx_decision_logs_player_id');
      db.run('DROP INDEX IF EXISTS idx_decision_logs_request_id');
      db.run('DROP TABLE IF EXISTS decision_logs');
    },
  },
  {
    version: 2,
    name: 'create_bindings_table',
    up: (db: Database) => {
      db.run(`
        CREATE TABLE IF NOT EXISTS bindings (
          id TEXT PRIMARY KEY,
          agent_id TEXT NOT NULL,
          match TEXT NOT NULL,
          priority INTEGER NOT NULL DEFAULT 0,
          enabled INTEGER NOT NULL DEFAULT 1,
          description TEXT,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        )
      `);
      db.run('CREATE INDEX IF NOT EXISTS idx_bindings_agent_id ON bindings(agent_id)');
      db.run('CREATE INDEX IF NOT EXISTS idx_bindings_priority ON bindings(priority)');
      db.run('CREATE INDEX IF NOT EXISTS idx_bindings_enabled ON bindings(enabled)');
    },
    down: (db: Database) => {
      db.run('DROP INDEX IF EXISTS idx_bindings_enabled');
      db.run('DROP INDEX IF EXISTS idx_bindings_priority');
      db.run('DROP INDEX IF EXISTS idx_bindings_agent_id');
      db.run('DROP TABLE IF EXISTS bindings');
    },
  },
  {
    version: 3,
    name: 'create_agent_contexts_table',
    up: (db: Database) => {
      db.run(`
        CREATE TABLE IF NOT EXISTS agent_contexts (
          id TEXT PRIMARY KEY,
          save_id TEXT NOT NULL,
          agent_id TEXT NOT NULL,
          data TEXT NOT NULL,
          changes TEXT NOT NULL,
          version INTEGER NOT NULL DEFAULT 1,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL,
          UNIQUE(save_id, agent_id)
        )
      `);
      db.run('CREATE INDEX IF NOT EXISTS idx_agent_contexts_save_id ON agent_contexts(save_id)');
      db.run('CREATE INDEX IF NOT EXISTS idx_agent_contexts_agent_id ON agent_contexts(agent_id)');
    },
    down: (db: Database) => {
      db.run('DROP INDEX IF EXISTS idx_agent_contexts_agent_id');
      db.run('DROP INDEX IF EXISTS idx_agent_contexts_save_id');
      db.run('DROP TABLE IF EXISTS agent_contexts');
    },
  },
  {
    version: 4,
    name: 'create_context_snapshots_table',
    up: (db: Database) => {
      db.run(`
        CREATE TABLE IF NOT EXISTS context_snapshots (
          id TEXT PRIMARY KEY,
          save_id TEXT NOT NULL,
          request_id TEXT NOT NULL,
          global_context TEXT NOT NULL,
          agent_contexts TEXT NOT NULL,
          timestamp INTEGER NOT NULL,
          created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
        )
      `);
      db.run('CREATE INDEX IF NOT EXISTS idx_context_snapshots_save_id ON context_snapshots(save_id)');
      db.run('CREATE INDEX IF NOT EXISTS idx_context_snapshots_request_id ON context_snapshots(request_id)');
      db.run('CREATE INDEX IF NOT EXISTS idx_context_snapshots_timestamp ON context_snapshots(timestamp)');
    },
    down: (db: Database) => {
      db.run('DROP INDEX IF EXISTS idx_context_snapshots_timestamp');
      db.run('DROP INDEX IF EXISTS idx_context_snapshots_request_id');
      db.run('DROP INDEX IF EXISTS idx_context_snapshots_save_id');
      db.run('DROP TABLE IF EXISTS context_snapshots');
    },
  },
  {
    version: 5,
    name: 'create_tool_calls_table',
    up: (db: Database) => {
      db.run(`
        CREATE TABLE IF NOT EXISTS tool_calls (
          id TEXT PRIMARY KEY,
          decision_log_id TEXT,
          tool_type TEXT NOT NULL,
          method TEXT NOT NULL,
          params TEXT NOT NULL,
          result TEXT NOT NULL,
          agent_id TEXT NOT NULL,
          is_write INTEGER NOT NULL DEFAULT 0,
          duration INTEGER NOT NULL DEFAULT 0,
          success INTEGER NOT NULL DEFAULT 1,
          error_message TEXT,
          timestamp INTEGER NOT NULL,
          created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
          FOREIGN KEY (decision_log_id) REFERENCES decision_logs(id)
        )
      `);
      db.run('CREATE INDEX IF NOT EXISTS idx_tool_calls_decision_log_id ON tool_calls(decision_log_id)');
      db.run('CREATE INDEX IF NOT EXISTS idx_tool_calls_tool_type ON tool_calls(tool_type)');
      db.run('CREATE INDEX IF NOT EXISTS idx_tool_calls_agent_id ON tool_calls(agent_id)');
      db.run('CREATE INDEX IF NOT EXISTS idx_tool_calls_timestamp ON tool_calls(timestamp)');
    },
    down: (db: Database) => {
      db.run('DROP INDEX IF EXISTS idx_tool_calls_timestamp');
      db.run('DROP INDEX IF EXISTS idx_tool_calls_agent_id');
      db.run('DROP INDEX IF EXISTS idx_tool_calls_tool_type');
      db.run('DROP INDEX IF EXISTS idx_tool_calls_decision_log_id');
      db.run('DROP TABLE IF EXISTS tool_calls');
    },
  },
  {
    version: 6,
    name: 'create_schema_version_table',
    up: (db: Database) => {
      db.run(`
        CREATE TABLE IF NOT EXISTS schema_version (
          version INTEGER PRIMARY KEY,
          name TEXT NOT NULL,
          applied_at INTEGER NOT NULL
        )
      `);
    },
    down: (db: Database) => {
      db.run('DROP TABLE IF EXISTS schema_version');
    },
  },
  {
    version: 7,
    name: 'create_events_table',
    up: (db: Database) => {
      db.run(`
        CREATE TABLE IF NOT EXISTS events (
          id TEXT PRIMARY KEY,
          save_id TEXT NOT NULL,
          type TEXT NOT NULL,
          name TEXT NOT NULL,
          description TEXT NOT NULL,
          trigger_config TEXT NOT NULL,
          effects TEXT NOT NULL,
          chain TEXT,
          metadata TEXT NOT NULL,
          status TEXT NOT NULL,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        )
      `);
      db.run('CREATE INDEX IF NOT EXISTS idx_events_save_id ON events(save_id)');
      db.run('CREATE INDEX IF NOT EXISTS idx_events_type ON events(type)');
      db.run('CREATE INDEX IF NOT EXISTS idx_events_status ON events(status)');
    },
    down: (db: Database) => {
      db.run('DROP INDEX IF EXISTS idx_events_status');
      db.run('DROP INDEX IF EXISTS idx_events_type');
      db.run('DROP INDEX IF EXISTS idx_events_save_id');
      db.run('DROP TABLE IF EXISTS events');
    },
  },
  {
    version: 8,
    name: 'create_event_trigger_records_table',
    up: (db: Database) => {
      db.run(`
        CREATE TABLE IF NOT EXISTS event_trigger_records (
          id TEXT PRIMARY KEY,
          event_id TEXT NOT NULL,
          save_id TEXT NOT NULL,
          character_id TEXT NOT NULL,
          timestamp INTEGER NOT NULL,
          context TEXT NOT NULL,
          result TEXT NOT NULL,
          created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
          FOREIGN KEY (event_id) REFERENCES events(id)
        )
      `);
      db.run('CREATE INDEX IF NOT EXISTS idx_event_trigger_records_event_id ON event_trigger_records(event_id)');
      db.run('CREATE INDEX IF NOT EXISTS idx_event_trigger_records_save_id ON event_trigger_records(save_id)');
      db.run('CREATE INDEX IF NOT EXISTS idx_event_trigger_records_character_id ON event_trigger_records(character_id)');
      db.run('CREATE INDEX IF NOT EXISTS idx_event_trigger_records_timestamp ON event_trigger_records(timestamp)');
    },
    down: (db: Database) => {
      db.run('DROP INDEX IF EXISTS idx_event_trigger_records_timestamp');
      db.run('DROP INDEX IF EXISTS idx_event_trigger_records_character_id');
      db.run('DROP INDEX IF EXISTS idx_event_trigger_records_save_id');
      db.run('DROP INDEX IF EXISTS idx_event_trigger_records_event_id');
      db.run('DROP TABLE IF EXISTS event_trigger_records');
    },
  },
  {
    version: 9,
    name: 'create_character_ui_state_table',
    up: (db: Database) => {
      db.run(`
        CREATE TABLE IF NOT EXISTS character_ui_state (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          save_id TEXT NOT NULL,
          character_id TEXT NOT NULL,
          ui_state TEXT NOT NULL,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL,
          UNIQUE(save_id, character_id)
        )
      `);
      db.run('CREATE INDEX IF NOT EXISTS idx_character_ui_state_save_id ON character_ui_state(save_id)');
      db.run('CREATE INDEX IF NOT EXISTS idx_character_ui_state_character_id ON character_ui_state(character_id)');
    },
    down: (db: Database) => {
      db.run('DROP INDEX IF EXISTS idx_character_ui_state_character_id');
      db.run('DROP INDEX IF EXISTS idx_character_ui_state_save_id');
      db.run('DROP TABLE IF EXISTS character_ui_state');
    },
  },
  {
    version: 10,
    name: 'create_character_reputations_table',
    up: (db: Database) => {
      db.run(`
        CREATE TABLE IF NOT EXISTS character_reputations (
          id TEXT PRIMARY KEY,
          character_id TEXT NOT NULL,
          reputation_id TEXT NOT NULL,
          value INTEGER DEFAULT 0,
          rank TEXT DEFAULT 'neutral' CHECK(rank IN ('hated', 'hostile', 'unfriendly', 'neutral', 'friendly', 'honored', 'revered', 'exalted')),
          history TEXT DEFAULT '[]',
          last_modified INTEGER NOT NULL,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL,
          UNIQUE(character_id, reputation_id)
        )
      `);
      db.run('CREATE INDEX IF NOT EXISTS idx_character_reputations_character ON character_reputations(character_id)');
      db.run('CREATE INDEX IF NOT EXISTS idx_character_reputations_rank ON character_reputations(rank)');
    },
    down: (db: Database) => {
      db.run('DROP INDEX IF EXISTS idx_character_reputations_rank');
      db.run('DROP INDEX IF EXISTS idx_character_reputations_character');
      db.run('DROP TABLE IF EXISTS character_reputations');
    },
  },
];

export class MigrationRunner {
  private db: Database;
  private saveCallback: () => void;

  constructor(db: Database, saveCallback: () => void) {
    this.db = db;
    this.saveCallback = saveCallback;
  }

  getCurrentVersion(): number {
    try {
      const result = this.db.exec('SELECT MAX(version) as version FROM schema_version');
      if (result.length > 0 && result[0].values.length > 0) {
        const version = result[0].values[0][0];
        return version ? Number(version) : 0;
      }
      return 0;
    } catch {
      return 0;
    }
  }

  getPendingMigrations(): Migration[] {
    const currentVersion = this.getCurrentVersion();
    return migrations.filter((m) => m.version > currentVersion).sort((a, b) => a.version - b.version);
  }

  runMigrations(): { applied: number; errors: string[] } {
    const pending = this.getPendingMigrations();
    const errors: string[] = [];
    let applied = 0;

    for (const migration of pending) {
      try {
        gameLog.info('system', `Running migration: ${migration.name}`, { version: migration.version });

        migration.up(this.db);

        this.db.run(
          'INSERT INTO schema_version (version, name, applied_at) VALUES (?, ?, ?)',
          [migration.version, migration.name, Date.now()]
        );

        this.saveCallback();
        applied++;

        gameLog.info('system', `Migration completed: ${migration.name}`, { version: migration.version });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        errors.push(`Migration ${migration.name} (v${migration.version}) failed: ${errorMessage}`);
        gameLog.error('system', `Migration failed: ${migration.name}`, {
          version: migration.version,
          error: errorMessage,
        });
        break;
      }
    }

    return { applied, errors };
  }

  rollback(steps: number = 1): { rolledBack: number; errors: string[] } {
    const currentVersion = this.getCurrentVersion();
    const errors: string[] = [];
    let rolledBack = 0;

    const applicableMigrations = migrations
      .filter((m) => m.version <= currentVersion)
      .sort((a, b) => b.version - a.version)
      .slice(0, steps);

    for (const migration of applicableMigrations) {
      try {
        gameLog.info('system', `Rolling back migration: ${migration.name}`, { version: migration.version });

        migration.down(this.db);

        this.db.run('DELETE FROM schema_version WHERE version = ?', [migration.version]);

        this.saveCallback();
        rolledBack++;

        gameLog.info('system', `Rollback completed: ${migration.name}`, { version: migration.version });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        errors.push(`Rollback ${migration.name} (v${migration.version}) failed: ${errorMessage}`);
        gameLog.error('system', `Rollback failed: ${migration.name}`, {
          version: migration.version,
          error: errorMessage,
        });
        break;
      }
    }

    return { rolledBack, errors };
  }

  getMigrationStatus(): {
    currentVersion: number;
    latestVersion: number;
    pendingCount: number;
    appliedMigrations: { version: number; name: string; appliedAt: number }[];
  } {
    const currentVersion = this.getCurrentVersion();
    const latestVersion = Math.max(...migrations.map((m) => m.version));
    const pending = this.getPendingMigrations();

    let appliedMigrations: { version: number; name: string; appliedAt: number }[] = [];
    try {
      const result = this.db.exec('SELECT version, name, applied_at FROM schema_version ORDER BY version');
      appliedMigrations = result[0]?.values.map((row) => ({
        version: Number(row[0]),
        name: String(row[1]),
        appliedAt: Number(row[2]),
      })) ?? [];
    } catch {
      appliedMigrations = [];
    }

    return {
      currentVersion,
      latestVersion,
      pendingCount: pending.length,
      appliedMigrations,
    };
  }
}

export function getMigrations(): Migration[] {
  return [...migrations];
}
