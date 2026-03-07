import type { Item, ItemType, ItemRarity, AddItemResponse, InventoryState } from '@ai-rpg/shared';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:6756';

/**
 * 创建物品请求
 */
export interface CreateItemRequest {
  name: string;
  type: ItemType;
  rarity?: ItemRarity;
  stats?: Record<string, number>;
  description?: string;
}

/**
 * 添加物品请求
 */
export interface AddItemRequest {
  item: Item;
  quantity?: number;
  slotIndex?: number;
}

class InventoryService {
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
   * 获取背包状态
   */
  async getInventory(saveId: string, characterId: string): Promise<InventoryState> {
    return this.request<InventoryState>(`/api/inventory/${saveId}/${characterId}`);
  }

  /**
   * 创建物品
   */
  async createItem(request: CreateItemRequest): Promise<{ item: Item }> {
    return this.request<{ item: Item }>('/api/inventory/items/create', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * 添加物品到背包
   */
  async addItem(
    saveId: string,
    characterId: string,
    request: AddItemRequest
  ): Promise<AddItemResponse> {
    return this.request<AddItemResponse>(`/api/inventory/${saveId}/${characterId}/items`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * 创建并添加物品到背包（便捷方法）
   * 用于战斗奖励等场景，根据物品名称创建物品并添加到背包
   */
  async createAndAddItem(
    saveId: string,
    characterId: string,
    itemName: string,
    options?: {
      type?: ItemType;
      rarity?: ItemRarity;
      quantity?: number;
      description?: string;
    }
  ): Promise<AddItemResponse> {
    // 先创建物品
    const { item } = await this.createItem({
      name: itemName,
      type: options?.type || 'material',
      rarity: options?.rarity || 'common',
      description: options?.description || `战斗奖励: ${itemName}`,
    });

    // 然后添加到背包
    return this.addItem(saveId, characterId, {
      item,
      quantity: options?.quantity || 1,
    });
  }

  /**
   * 批量添加物品
   */
  async addItems(
    saveId: string,
    characterId: string,
    items: Array<{ itemName: string; quantity?: number }>
  ): Promise<AddItemResponse[]> {
    const results: AddItemResponse[] = [];
    
    for (const itemData of items) {
      try {
        const result = await this.createAndAddItem(
          saveId,
          characterId,
          itemData.itemName,
          { quantity: itemData.quantity }
        );
        results.push(result);
      } catch (error) {
        console.error(`[InventoryService] Failed to add item ${itemData.itemName}:`, error);
      }
    }
    
    return results;
  }

  /**
   * 增加货币
   */
  async addCurrency(
    saveId: string,
    characterId: string,
    currency: string,
    amount: number
  ): Promise<{ currency: string; previousAmount: number; addedAmount: number; newAmount: number }> {
    return this.request<{ currency: string; previousAmount: number; addedAmount: number; newAmount: number }>(
      `/api/inventory/${saveId}/${characterId}/currency`,
      {
        method: 'POST',
        body: JSON.stringify({ currency, amount }),
      }
    );
  }
}

export const inventoryService = new InventoryService();
