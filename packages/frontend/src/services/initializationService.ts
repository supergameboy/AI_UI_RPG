import type {
  InitializationRequest,
  InitializationResponse,
  InitializationStatus,
  Character,
} from '@ai-rpg/shared';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:6756';

/**
 * 获取初始化状态响应类型
 */
export interface GetStatusResponse {
  success: boolean;
  status?: InitializationStatus;
  error?: string;
}

/**
 * 重试初始化请求参数
 */
export interface RetryInitializationParams {
  character: Character;
  templateId: string;
}

class InitializationService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE}${endpoint}`;

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP error ${response.status}`);
    }

    const json = await response.json();
    // 后端返回 { success, data, meta } 格式，需要提取 data
    return json.data !== undefined ? json.data : json;
  }

  /**
   * 开始初始化
   * @param request 初始化请求
   * @returns 初始化响应
   */
  async startInitialization(request: InitializationRequest): Promise<InitializationResponse> {
    return this.request<InitializationResponse>('/api/initialization/start', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * 获取初始化状态
   * @param saveId 存档ID
   * @returns 初始化状态响应
   */
  async getStatus(saveId: string): Promise<GetStatusResponse> {
    return this.request<GetStatusResponse>(`/api/initialization/status/${saveId}`);
  }

  /**
   * 重试初始化
   * @param saveId 存档ID
   * @param params 重试参数
   * @returns 初始化响应
   */
  async retryInitialization(saveId: string, params: RetryInitializationParams): Promise<InitializationResponse> {
    return this.request<InitializationResponse>(`/api/initialization/retry/${saveId}`, {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }
}

export const initializationService = new InitializationService();
