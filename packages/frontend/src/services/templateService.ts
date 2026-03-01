import type { StoryTemplate } from '@ai-rpg/shared';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:6756';

export interface TemplateListResponse {
  templates: StoryTemplate[];
  total: number;
}

export interface TemplateQueryOptions {
  limit?: number;
  offset?: number;
}

export type CreateTemplateData = Omit<StoryTemplate, 'id'>;

export type UpdateTemplateData = Partial<StoryTemplate>;

class TemplateService {
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

    const result = await response.json() as { success: boolean; data: T };
    return result.data;
  }

  async getTemplates(options: TemplateQueryOptions = {}): Promise<TemplateListResponse> {
    const params = new URLSearchParams();
    if (options.limit) params.set('limit', String(options.limit));
    if (options.offset) params.set('offset', String(options.offset));

    const query = params.toString();
    return this.request<TemplateListResponse>(`/api/templates${query ? `?${query}` : ''}`);
  }

  async getTemplateById(id: string): Promise<StoryTemplate> {
    return this.request<StoryTemplate>(`/api/templates/${id}`);
  }

  async createTemplate(template: CreateTemplateData): Promise<StoryTemplate> {
    return this.request<StoryTemplate>('/api/templates', {
      method: 'POST',
      body: JSON.stringify(template),
    });
  }

  async updateTemplate(id: string, template: UpdateTemplateData): Promise<StoryTemplate> {
    return this.request<StoryTemplate>(`/api/templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(template),
    });
  }

  async deleteTemplate(id: string): Promise<void> {
    await this.request<void>(`/api/templates/${id}`, {
      method: 'DELETE',
    });
  }
}

export const templateService = new TemplateService();
