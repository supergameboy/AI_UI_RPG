import type {
  ToolType,
  ToolConfig,
  ToolResponse,
  ToolMethodMetadata,
  ToolStatus,
  ToolCallContext,
} from '@ai-rpg/shared';

export abstract class ToolBase {
  protected abstract readonly toolType: ToolType;
  protected abstract readonly toolDescription: string;
  protected abstract readonly toolVersion: string;

  private _config: ToolConfig | null = null;
  private _status: ToolStatus | null = null;
  protected methodMetadata: Map<string, ToolMethodMetadata> = new Map();
  private initialized = false;

  get type(): ToolType {
    return this.toolType;
  }

  get description(): string {
    return this.toolDescription;
  }

  get version(): string {
    return this.toolVersion;
  }

  protected get config(): ToolConfig {
    if (!this._config) {
      this._config = {
        id: this.toolType,
        name: this.toolType,
        description: this.toolDescription,
        version: this.toolVersion,
      };
    }
    return this._config;
  }

  protected get status(): ToolStatus {
    if (!this._status) {
      this._status = {
        type: this.toolType,
        name: this.config.name,
        status: 'idle',
        lastCall: 0,
        callCount: 0,
        errorCount: 0,
        averageDuration: 0,
      };
    }
    return this._status;
  }

  protected abstract registerMethods(): void;

  protected abstract executeMethod<T>(
    method: string,
    params: Record<string, unknown>,
    context: ToolCallContext
  ): Promise<ToolResponse<T>>;

  protected registerMethod(
    name: string,
    description: string,
    isRead: boolean,
    params: Record<string, unknown>,
    returns: string
  ): void {
    this.methodMetadata.set(name, {
      name,
      description,
      isRead,
      params,
      returns,
    });
  }

  getMethodMetadata(name: string): ToolMethodMetadata | undefined {
    return this.methodMetadata.get(name);
  }

  getAllMethodMetadata(): ToolMethodMetadata[] {
    return Array.from(this.methodMetadata.values());
  }

  getReadMethods(): string[] {
    return Array.from(this.methodMetadata.values())
      .filter((m) => m.isRead)
      .map((m) => m.name);
  }

  getWriteMethods(): string[] {
    return Array.from(this.methodMetadata.values())
      .filter((m) => !m.isRead)
      .map((m) => m.name);
  }

  isReadMethod(method: string): boolean {
    const metadata = this.methodMetadata.get(method);
    return metadata?.isRead ?? false;
  }

  isWriteMethod(method: string): boolean {
    const metadata = this.methodMetadata.get(method);
    return metadata !== undefined && !metadata.isRead;
  }

  async execute<T = unknown>(
    method: string,
    params: Record<string, unknown>,
    context: ToolCallContext
  ): Promise<ToolResponse<T>> {
    const startTime = Date.now();
    this.status.status = 'busy';

    try {
      if (!this.methodMetadata.has(method)) {
        return this.createError<T>(
          'METHOD_NOT_FOUND',
          `Method '${method}' not found in tool '${this.toolType}'`
        );
      }

      const result = await this.executeMethod<T>(method, params, context);
      
      this.updateStatus(true, Date.now() - startTime);
      return result;
    } catch (error) {
      this.status.status = 'error';
      this.updateStatus(false, Date.now() - startTime);
      
      return this.createError<T>(
        'EXECUTION_ERROR',
        error instanceof Error ? error.message : 'Unknown error occurred',
        { method, params, error }
      );
    }
  }

  protected createSuccess<T>(data: T, metadata?: Record<string, unknown>): ToolResponse<T> {
    return {
      success: true,
      data,
      metadata: {
        duration: 0,
        cached: false,
        ...metadata,
      },
    };
  }

  protected createError<T>(
    code: string,
    message: string,
    details?: unknown
  ): ToolResponse<T> {
    return {
      success: false,
      error: {
        code,
        message,
        details,
      },
    };
  }

  protected updateStatus(success: boolean, duration: number): void {
    this.status.lastCall = Date.now();
    this.status.callCount++;
    
    if (!success) {
      this.status.errorCount++;
    }

    const totalDuration = this.status.averageDuration * (this.status.callCount - 1) + duration;
    this.status.averageDuration = totalDuration / this.status.callCount;

    if (success) {
      this.status.status = 'idle';
    }
  }

  getStatus(): ToolStatus {
    return { ...this.status };
  }

  getConfig(): ToolConfig {
    return { ...this.config };
  }

  async initialize(): Promise<void> {
    if (!this.initialized) {
      this.registerMethods();
      this.initialized = true;
    }
    this.status.status = 'idle';
  }

  async dispose(): Promise<void> {
    this.status.status = 'idle';
    this.status.callCount = 0;
    this.status.errorCount = 0;
    this.status.averageDuration = 0;
    this.initialized = false;
  }
}
