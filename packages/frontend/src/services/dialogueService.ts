import type {
  InitialSceneRequest,
  InitialSceneResponse,
  SendDialogueRequest,
  SendDialogueResponse,
  GetOptionsRequest,
  GetOptionsResponse,
  DialogueHistoryRequest,
  DialogueHistoryResponse,
  DialogueMessage,
  DialogueOption,
} from '@ai-rpg/shared';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:6756';

class DialogueService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
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

    return response.json();
  }

  async generateInitialScene(
    request: InitialSceneRequest
  ): Promise<InitialSceneResponse> {
    return this.request<InitialSceneResponse>('/api/dialogue/initial', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async sendPlayerInput(
    request: SendDialogueRequest
  ): Promise<SendDialogueResponse> {
    return this.request<SendDialogueResponse>('/api/dialogue/send', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getDialogueOptions(
    request: GetOptionsRequest
  ): Promise<GetOptionsResponse> {
    return this.request<GetOptionsResponse>('/api/dialogue/options', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getDialogueHistory(
    request: DialogueHistoryRequest
  ): Promise<DialogueHistoryResponse> {
    const params = new URLSearchParams();
    if (request.npcId) params.set('npcId', request.npcId);
    if (request.limit) params.set('limit', String(request.limit));
    if (request.offset) params.set('offset', String(request.offset));

    const queryString = params.toString();
    const endpoint = `/api/dialogue/history/${request.characterId}${queryString ? `?${queryString}` : ''}`;

    return this.request<DialogueHistoryResponse>(endpoint);
  }
}

export const dialogueService = new DialogueService();
export type { DialogueMessage, DialogueOption };
