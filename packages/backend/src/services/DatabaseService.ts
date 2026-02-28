import initSqlJs, { Database, SqlJsStatic } from 'sql.js';
import path from 'path';
import fs from 'fs';
import os from 'os';

export interface DatabaseConfig {
  dbPath: string;
  dbName: string;
}

export class DatabaseService {
  private static instance: DatabaseService | null = null;
  private db: Database | null = null;
  private SQL: SqlJsStatic | null = null;
  private config: DatabaseConfig;

  private constructor(config?: Partial<DatabaseConfig>) {
    this.config = {
      dbPath: config?.dbPath || this.getDefaultDbPath(),
      dbName: config?.dbName || 'ai-rpg.db',
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
    const platform = process.platform;
    let baseDir: string;

    if (platform === 'win32') {
      baseDir = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
    } else if (platform === 'darwin') {
      baseDir = path.join(os.homedir(), 'Library', 'Application Support');
    } else {
      baseDir = process.env.XDG_DATA_HOME || path.join(os.homedir(), '.local', 'share');
    }

    const appDataPath = path.join(baseDir, 'ai-rpg-engine');

    if (!fs.existsSync(appDataPath)) {
      fs.mkdirSync(appDataPath, { recursive: true });
    }

    return appDataPath;
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

      console.log(`Database connected: ${fullPath}`);
      return this.db;
    } catch (error) {
      console.error('Failed to connect to database:', error);
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
      console.log('Database connection closed');
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
