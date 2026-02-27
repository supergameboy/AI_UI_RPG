import { DatabaseService } from '../services/DatabaseService';

export interface BaseEntity {
  id: string;
  created_at?: number;
  updated_at?: number;
}

export abstract class BaseRepository<T extends BaseEntity> {
  protected db: DatabaseService;
  protected tableName: string;

  constructor(tableName: string) {
    this.db = DatabaseService.getInstance();
    this.tableName = tableName;
  }

  public findById(id: string): T | undefined {
    const stmt = this.db.prepare<T>(`SELECT * FROM ${this.tableName} WHERE id = ?`);
    return stmt.get(id);
  }

  public findAll(): T[] {
    const stmt = this.db.prepare<T>(`SELECT * FROM ${this.tableName}`);
    return stmt.all();
  }

  public deleteById(id: string): boolean {
    const stmt = this.db.prepare(`DELETE FROM ${this.tableName} WHERE id = ?`);
    const result = stmt.run(id);
    return result.changes > 0;
  }

  public exists(id: string): boolean {
    const stmt = this.db.prepare<{ count: number }>(`SELECT COUNT(*) as count FROM ${this.tableName} WHERE id = ?`);
    const result = stmt.get(id);
    return result ? result.count > 0 : false;
  }

  public count(): number {
    const stmt = this.db.prepare<{ count: number }>(`SELECT COUNT(*) as count FROM ${this.tableName}`);
    const result = stmt.get();
    return result ? result.count : 0;
  }

  protected updateTimestamp(id: string): void {
    const stmt = this.db.prepare(
      `UPDATE ${this.tableName} SET updated_at = strftime('%s', 'now') WHERE id = ?`
    );
    stmt.run(id);
  }

  protected generateId(): string {
    return `${this.tableName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
