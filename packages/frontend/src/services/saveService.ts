const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:6756';

export type GameMode = 'text_adventure' | 'turn_based_rpg' | 'visual_novel' | 'dynamic_combat';

export interface Save {
  id: string;
  name: string;
  template_id: string | null;
  game_mode: GameMode;
  character_id: string | null;
  created_at: number;
  updated_at: number;
  play_time: number;
  current_location: string | null;
  current_scene: string | null;
  game_state: string;
  story_progress: string;
}

export interface SaveSnapshot {
  id: string;
  save_id: string;
  snapshot_type: 'auto' | 'manual' | 'checkpoint';
  context_state: string;
  memory_state: string;
  agent_states: string;
  created_at: number;
}

export interface SaveListResponse {
  saves: Save[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SaveStats {
  total: number;
  byTemplate: Record<string, number>;
  byGameMode: Record<string, number>;
  totalPlayTime: number;
}

export interface CreateSaveData {
  name: string;
  template_id?: string | null;
  game_mode: GameMode;
  character_id?: string | null;
  play_time?: number;
  current_location?: string | null;
  current_scene?: string | null;
  game_state?: string;
  story_progress?: string;
  snapshot?: {
    snapshot_type: 'auto' | 'manual' | 'checkpoint';
    context_state?: string;
    memory_state?: string;
    agent_states?: string;
  };
}

export interface UpdateSaveData {
  name?: string;
  play_time?: number;
  current_location?: string | null;
  current_scene?: string | null;
  game_state?: string;
  story_progress?: string;
}

export interface SaveQueryOptions {
  page?: number;
  limit?: number;
  template_id?: string;
}

class SaveService {
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

    return response.json();
  }

  async getSaves(options: SaveQueryOptions = {}): Promise<SaveListResponse> {
    const params = new URLSearchParams();
    if (options.page) params.set('page', String(options.page));
    if (options.limit) params.set('limit', String(options.limit));
    if (options.template_id) params.set('template_id', options.template_id);
    
    const query = params.toString();
    return this.request<SaveListResponse>(`/api/saves${query ? `?${query}` : ''}`);
  }

  async getSave(id: string): Promise<Save> {
    return this.request<Save>(`/api/saves/${id}`);
  }

  async getStats(): Promise<SaveStats> {
    return this.request<SaveStats>('/api/saves/stats');
  }

  async createSave(data: CreateSaveData): Promise<Save> {
    return this.request<Save>('/api/saves', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateSave(id: string, data: UpdateSaveData): Promise<Save> {
    return this.request<Save>(`/api/saves/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteSave(id: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/api/saves/${id}`, {
      method: 'DELETE',
    });
  }

  async getSnapshots(saveId: string): Promise<SaveSnapshot[]> {
    return this.request<SaveSnapshot[]>(`/api/saves/${saveId}/snapshots`);
  }

  async createSnapshot(saveId: string, data: {
    snapshot_type: 'auto' | 'manual' | 'checkpoint';
    context_state?: string;
    memory_state?: string;
    agent_states?: string;
  }): Promise<SaveSnapshot> {
    return this.request<SaveSnapshot>(`/api/saves/${saveId}/snapshots`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async exportSave(id: string): Promise<void> {
    const save = await this.getSave(id);
    const snapshots = await this.getSnapshots(id);
    
    const exportData = {
      version: '1.0.0',
      exportedAt: Date.now(),
      save,
      snapshots,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${save.name}_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  async importSave(file: File): Promise<Save> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const content = e.target?.result as string;
          const data = JSON.parse(content);
          
          if (!this.validateImportData(data)) {
            throw new Error('Invalid save file format');
          }

          const { save, snapshots } = data;
          
          const newSaveName = `${save.name} (导入)`;
          
          const createdSave = await this.createSave({
            name: newSaveName,
            template_id: save.template_id,
            game_mode: save.game_mode,
            character_id: save.character_id,
            play_time: save.play_time,
            current_location: save.current_location,
            current_scene: save.current_scene,
            game_state: save.game_state,
            story_progress: save.story_progress,
            snapshot: snapshots?.[0] ? {
              snapshot_type: snapshots[0].snapshot_type || 'manual',
              context_state: snapshots[0].context_state,
              memory_state: snapshots[0].memory_state,
              agent_states: snapshots[0].agent_states,
            } : undefined,
          });

          resolve(createdSave);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  private validateImportData(data: unknown): data is {
    version: string;
    save: Save;
    snapshots?: SaveSnapshot[];
  } {
    if (!data || typeof data !== 'object') return false;
    
    const d = data as Record<string, unknown>;
    
    if (typeof d.version !== 'string') return false;
    if (!d.save || typeof d.save !== 'object') return false;
    
    const save = d.save as Record<string, unknown>;
    if (typeof save.name !== 'string') return false;
    if (typeof save.game_mode !== 'string') return false;
    
    return true;
  }

  formatPlayTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}小时${minutes}分钟`;
    }
    if (minutes > 0) {
      return `${minutes}分钟${secs}秒`;
    }
    return `${secs}秒`;
  }

  formatDate(timestamp: number): string {
    return new Date(timestamp * 1000).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}

export const saveService = new SaveService();
