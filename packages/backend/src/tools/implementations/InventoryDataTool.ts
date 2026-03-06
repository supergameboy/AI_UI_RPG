import type {
  ToolResponse,
  ToolCallContext,
  Item,
  ItemType,
  ItemRarity,
  EquipmentSlotType,
  InventorySlot,
} from '@ai-rpg/shared';
import { ToolType } from '@ai-rpg/shared';
import { ToolBase } from '../ToolBase';
import { getInventoryService } from '../../services/InventoryService';
import { gameLog } from '../../services/GameLogService';

export class InventoryDataTool extends ToolBase {
  protected readonly toolType: ToolType = ToolType.INVENTORY_DATA;
  protected readonly toolDescription = '背包数据工具，负责物品管理、装备系统、交易处理';
  protected readonly toolVersion = '1.0.0';

  protected registerMethods(): void {
    this.registerMethod('getInventory', '获取背包状态', true, { saveId: 'string', characterId: 'string' }, 'InventoryState');
    this.registerMethod('getItem', '获取物品', true, { saveId: 'string', characterId: 'string', itemId: 'string', slotIndex: 'number?' }, 'InventorySlot');
    this.registerMethod('listItems', '列出所有物品', true, { saveId: 'string', characterId: 'string' }, 'InventorySlot[]');
    this.registerMethod('getEquipment', '获取装备信息', true, { saveId: 'string', characterId: 'string', slot: 'EquipmentSlotType?' }, 'EquippedItem[]');
    this.registerMethod('checkEquipRequirements', '检查装备需求', true, { item: 'Item', playerStats: 'object?' }, 'RequirementCheckResult');
    this.registerMethod('calculateStats', '计算属性加成', true, { saveId: 'string', characterId: 'string', baseStats: 'object' }, 'StatBonus');
    this.registerMethod('getStatistics', '获取统计数据', true, { saveId: 'string', characterId: 'string' }, 'InventoryStatistics');
    this.registerMethod('getCurrency', '获取货币余额', true, { saveId: 'string', characterId: 'string', currency: 'string' }, 'number');
    this.registerMethod('getAllCurrency', '获取所有货币', true, { saveId: 'string', characterId: 'string' }, 'Record<string, number>');

    this.registerMethod('addItem', '添加物品', false, { saveId: 'string', characterId: 'string', item: 'Item', quantity: 'number?', slotIndex: 'number?' }, 'AddItemResponse');
    this.registerMethod('removeItem', '移除物品', false, { saveId: 'string', characterId: 'string', itemId: 'string', quantity: 'number?', slotIndex: 'number?' }, 'RemoveItemResponse');
    this.registerMethod('useItem', '使用物品', false, { saveId: 'string', characterId: 'string', itemId: 'string', slotIndex: 'number?', targetId: 'string?' }, 'UseItemResponse');
    this.registerMethod('equipItem', '装备物品', false, { saveId: 'string', characterId: 'string', itemId: 'string', slotIndex: 'number?', targetSlot: 'EquipmentSlotType?', playerStats: 'object?' }, 'EquipResult');
    this.registerMethod('unequipItem', '卸下装备', false, { saveId: 'string', characterId: 'string', slot: 'EquipmentSlotType' }, 'UnequipResult');
    this.registerMethod('splitStack', '拆分堆叠', false, { saveId: 'string', characterId: 'string', slotIndex: 'number', quantity: 'number' }, 'SplitStackResult');
    this.registerMethod('mergeStacks', '合并堆叠', false, { saveId: 'string', characterId: 'string', sourceSlotIndex: 'number', targetSlotIndex: 'number' }, 'MergeStackResult');
    this.registerMethod('buyItem', '购买物品', false, { saveId: 'string', characterId: 'string', item: 'Item', quantity: 'number?', priceMultiplier: 'number?' }, 'TradeResult');
    this.registerMethod('sellItem', '出售物品', false, { saveId: 'string', characterId: 'string', itemId: 'string', quantity: 'number?', priceMultiplier: 'number?' }, 'TradeResult');
    this.registerMethod('expandCapacity', '扩展背包容量', false, { saveId: 'string', characterId: 'string', amount: 'number', cost: 'number?' }, 'ExpandCapacityResponse');
    this.registerMethod('sortInventory', '整理背包', false, { saveId: 'string', characterId: 'string', sortBy: 'string?', ascending: 'boolean?' }, 'SortResult');
    this.registerMethod('addCurrency', '增加货币', false, { saveId: 'string', characterId: 'string', currency: 'string', amount: 'number' }, 'number');
    this.registerMethod('createItem', '创建物品', false, { name: 'string', type: 'ItemType', rarity: 'ItemRarity?', options: 'object?' }, 'Item');
  }

  protected async executeMethod<T>(
    method: string,
    params: Record<string, unknown>,
    context: ToolCallContext
  ): Promise<ToolResponse<T>> {
    const service = getInventoryService();

    try {
      let result: unknown;

      switch (method) {
        case 'getInventory':
          result = service.getInventory(
            params.saveId as string,
            params.characterId as string
          );
          break;

        case 'getItem': {
          const slot = this.findItemSlot(
            service,
            params.saveId as string,
            params.characterId as string,
            params.itemId as string,
            params.slotIndex as number | undefined
          );
          result = slot;
          break;
        }

        case 'listItems': {
          const inventory = service.getInventory(
            params.saveId as string,
            params.characterId as string
          );
          result = inventory.slots;
          break;
        }

        case 'getEquipment':
          result = service.getEquipment(
            params.saveId as string,
            params.characterId as string,
            params.slot as EquipmentSlotType | undefined
          );
          break;

        case 'checkEquipRequirements':
          result = service.checkEquipRequirements(
            params.item as Item,
            params.playerStats as Record<string, number> | undefined
          );
          break;

        case 'calculateStats':
          result = service.calculateStats(
            params.saveId as string,
            params.characterId as string,
            params.baseStats as Record<string, number>
          );
          break;

        case 'getStatistics':
          result = service.getStatistics(
            params.saveId as string,
            params.characterId as string
          );
          break;

        case 'getCurrency':
          result = service.getCurrency(
            params.saveId as string,
            params.characterId as string,
            params.currency as string
          );
          break;

        case 'getAllCurrency':
          result = service.getAllCurrency(
            params.saveId as string,
            params.characterId as string
          );
          break;

        case 'addItem':
          result = service.addItem(
            params.saveId as string,
            params.characterId as string,
            params.item as Item,
            params.quantity as number | undefined,
            params.slotIndex as number | undefined
          );
          this.logWriteOperation(method, params, context);
          break;

        case 'removeItem':
          result = service.removeItem(
            params.saveId as string,
            params.characterId as string,
            params.itemId as string,
            params.quantity as number | undefined,
            params.slotIndex as number | undefined
          );
          this.logWriteOperation(method, params, context);
          break;

        case 'useItem':
          result = service.useItem(
            params.saveId as string,
            params.characterId as string,
            params.itemId as string,
            params.slotIndex as number | undefined,
            params.targetId as string | undefined
          );
          this.logWriteOperation(method, params, context);
          break;

        case 'equipItem':
          result = service.equipItem(
            params.saveId as string,
            params.characterId as string,
            params.itemId as string,
            params.slotIndex as number | undefined,
            params.targetSlot as EquipmentSlotType | undefined,
            params.playerStats as Record<string, number> | undefined
          );
          this.logWriteOperation(method, params, context);
          break;

        case 'unequipItem':
          result = service.unequipItem(
            params.saveId as string,
            params.characterId as string,
            params.slot as EquipmentSlotType
          );
          this.logWriteOperation(method, params, context);
          break;

        case 'splitStack':
          result = service.splitStack(
            params.saveId as string,
            params.characterId as string,
            params.slotIndex as number,
            params.quantity as number
          );
          this.logWriteOperation(method, params, context);
          break;

        case 'mergeStacks':
          result = service.mergeStacks(
            params.saveId as string,
            params.characterId as string,
            params.sourceSlotIndex as number,
            params.targetSlotIndex as number
          );
          this.logWriteOperation(method, params, context);
          break;

        case 'buyItem':
          result = service.buyItem(
            params.saveId as string,
            params.characterId as string,
            params.item as Item,
            params.quantity as number | undefined,
            params.priceMultiplier as number | undefined
          );
          this.logWriteOperation(method, params, context);
          break;

        case 'sellItem':
          result = service.sellItem(
            params.saveId as string,
            params.characterId as string,
            params.itemId as string,
            params.quantity as number | undefined,
            params.priceMultiplier as number | undefined
          );
          this.logWriteOperation(method, params, context);
          break;

        case 'expandCapacity':
          result = service.expandCapacity(
            params.saveId as string,
            params.characterId as string,
            params.amount as number,
            params.cost as number | undefined
          );
          this.logWriteOperation(method, params, context);
          break;

        case 'sortInventory':
          result = service.sortInventory(
            params.saveId as string,
            params.characterId as string,
            params.sortBy as 'type' | 'rarity' | 'name' | 'value' | undefined,
            params.ascending as boolean | undefined
          );
          this.logWriteOperation(method, params, context);
          break;

        case 'addCurrency':
          result = service.addCurrency(
            params.saveId as string,
            params.characterId as string,
            params.currency as string,
            params.amount as number
          );
          this.logWriteOperation(method, params, context);
          break;

        case 'createItem':
          result = service.createItem(
            params.name as string,
            params.type as ItemType,
            params.rarity as ItemRarity | undefined,
            params.options as {
              stats?: Record<string, number>;
              effects?: Item['effects'];
              requirements?: Item['requirements'];
              value?: Item['value'];
              stackable?: boolean;
              maxStack?: number;
              description?: string;
            } | undefined
          );
          this.logWriteOperation(method, params, context);
          break;

        default:
          return this.createError<T>('METHOD_NOT_FOUND', `Method '${method}' not found in InventoryDataTool`);
      }

      return this.createSuccess<T>(result as T);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      gameLog.error('backend', `InventoryDataTool error: ${method}`, {
        error: errorMessage,
        params,
        agentId: context.agentId,
      });
      return this.createError<T>('EXECUTION_ERROR', errorMessage, { method, params });
    }
  }

  private findItemSlot(
    service: ReturnType<typeof getInventoryService>,
    saveId: string,
    characterId: string,
    itemId: string,
    slotIndex?: number
  ): InventorySlot | null {
    const inventory = service.getInventory(saveId, characterId);

    if (slotIndex !== undefined) {
      const slot = inventory.slots.find((s) => s.slotIndex === slotIndex);
      return slot || null;
    }

    const slot = inventory.slots.find((s) => s.item?.id === itemId);
    return slot || null;
  }

  private logWriteOperation(method: string, params: Record<string, unknown>, context: ToolCallContext): void {
    gameLog.info('backend', `InventoryDataTool write operation: ${method}`, {
      agentId: context.agentId,
      requestId: context.requestId,
      permission: context.permission,
      paramsKeys: Object.keys(params),
    });
  }
}
