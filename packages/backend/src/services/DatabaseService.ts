import initSqlJs, { Database, SqlJsStatic } from 'sql.js';
import path from 'path';
import fs from 'fs';
import { gameLog } from './GameLogService';
import { MigrationRunner } from './DatabaseMigration';

export interface DatabaseConfig {
  dbPath: string;
  dbName: string;
  autoMigrate: boolean;
}

export class DatabaseService {
  private static instance: DatabaseService | null = null;
  private db: Database | null = null;
  private SQL: SqlJsStatic | null = null;
  private config: DatabaseConfig;
  private migrationRunner: MigrationRunner | null = null;

  private constructor(config?: Partial<DatabaseConfig>) {
    this.config = {
      dbPath: config?.dbPath || this.getDefaultDbPath(),
      dbName: config?.dbName || 'ai-rpg.db',
      autoMigrate: config?.autoMigrate ?? true,
    };
  }

  public static async create(config?: Partial<DatabaseConfig>): Promise<DatabaseService> {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService(config);
      await DatabaseService.instance.initSqlJs();
    }
    return DatabaseService.instance;
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      throw new Error('DatabaseService not initialized. Call create() first.');
    }
    return DatabaseService.instance;
  }

  private getDefaultDbPath(): string {
    const gameDataPath = path.join(process.cwd(), 'game_data');

    if (!fs.existsSync(gameDataPath)) {
      fs.mkdirSync(gameDataPath, { recursive: true });
    }

    return gameDataPath;
  }

  private async initSqlJs(): Promise<void> {
    this.SQL = await initSqlJs();
  }

  public connect(): Database {
    if (this.db) {
      return this.db;
    }

    if (!this.SQL) {
      throw new Error('SQL.js not initialized');
    }

    const fullPath = path.join(this.config.dbPath, this.config.dbName);

    try {
      if (fs.existsSync(fullPath)) {
        const buffer = fs.readFileSync(fullPath);
        this.db = new this.SQL.Database(buffer);
      } else {
        this.db = new this.SQL.Database();
      }

      this.db.run('PRAGMA journal_mode = WAL');
      this.db.run('PRAGMA foreign_keys = ON');

      this.migrationRunner = new MigrationRunner(this.db, () => this.save());

      if (this.config.autoMigrate) {
        const result = this.migrationRunner.runMigrations();
        if (result.errors.length > 0) {
          gameLog.error('system', 'Database migration errors', { errors: result.errors });
        } else if (result.applied > 0) {
          gameLog.info('system', 'Database migrations applied', { count: result.applied });
        }
      }

      gameLog.info('system', `Database connected: ${fullPath}`);
      return this.db;
    } catch (error) {
      gameLog.error('system', 'Failed to connect to database', { error });
      throw error;
    }
  }

  public getDb(): Database {
    if (!this.db) {
      return this.connect();
    }
    return this.db;
  }

  public save(): void {
    if (this.db) {
      const data = this.db.export();
      const buffer = Buffer.from(data);
      const fullPath = path.join(this.config.dbPath, this.config.dbName);
      fs.writeFileSync(fullPath, buffer);
    }
  }

  public close(): void {
    if (this.db) {
      this.save();
      this.db.close();
      this.db = null;
      gameLog.info('system', 'Database connection closed');
    }
  }

  public isConnected(): boolean {
    return this.db !== null;
  }

  public getDbPath(): string {
    return path.join(this.config.dbPath, this.config.dbName);
  }

  public exec(sql: string): void {
    this.getDb().run(sql);
    this.save();
  }

  public prepare<T = unknown>(sql: string): Statement<T> {
    return new Statement<T>(this.getDb(), sql, () => this.save());
  }

  public transaction<T>(fn: () => T): T {
    this.getDb().run('BEGIN TRANSACTION');
    try {
      const result = fn();
      this.getDb().run('COMMIT');
      this.save();
      return result;
    } catch (error) {
      this.getDb().run('ROLLBACK');
      throw error;
    }
  }

  public getMigrationRunner(): MigrationRunner {
    if (!this.migrationRunner) {
      throw new Error('Database not connected');
    }
    return this.migrationRunner;
  }

  public getMigrationStatus(): { currentVersion: number; latestVersion: number; pendingCount: number } {
    if (!this.migrationRunner) {
      return { currentVersion: 0, latestVersion: 0, pendingCount: 0 };
    }
    const status = this.migrationRunner.getMigrationStatus();
    return {
      currentVersion: status.currentVersion,
      latestVersion: status.latestVersion,
      pendingCount: status.pendingCount,
    };
  }
}

class Statement<T> {
  private db: Database;
  private sql: string;
  private onSave: () => void;

  constructor(db: Database, sql: string, onSave: () => void) {
    this.db = db;
    this.sql = sql;
    this.onSave = onSave;
  }

  run(...params: unknown[]): { changes: number; lastInsertRowid: number } {
    this.db.run(this.sql, params as Parameters<typeof this.db.run>[1]);
    this.onSave();
    return {
      changes: this.db.getRowsModified(),
      lastInsertRowid: Number(this.db.exec('SELECT last_insert_rowid() as id')[0]?.values[0]?.[0] || 0),
    };
  }

  get(...params: unknown[]): T | undefined {
    const stmt = this.db.prepare(this.sql);
    stmt.bind(params as Parameters<typeof stmt.bind>[0]);
    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return row as T;
    }
    stmt.free();
    return undefined;
  }

  all(...params: unknown[]): T[] {
    const results: T[] = [];
    const stmt = this.db.prepare(this.sql);
    stmt.bind(params as Parameters<typeof stmt.bind>[0]);
    while (stmt.step()) {
      results.push(stmt.getAsObject() as T);
    }
    stmt.free();
    return results;
  }
}

export let databaseService: DatabaseService;

export async function initDatabaseService(): Promise<DatabaseService> {
  databaseService = await DatabaseService.create();
  return databaseService;
}
