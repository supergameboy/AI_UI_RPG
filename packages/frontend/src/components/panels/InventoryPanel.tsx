import React, { useState, useMemo } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { Button } from '../common';
import type { ItemType, InventoryItem, Item } from '@ai-rpg/shared';
import { RARITY_CONFIG } from '@ai-rpg/shared';
import styles from './InventoryPanel.module.css';

/**
 * 物品类型过滤选项
 */
const FILTER_OPTIONS: { value: ItemType | 'all'; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'weapon', label: '武器' },
  { value: 'armor', label: '防具' },
  { value: 'consumable', label: '消耗品' },
  { value: 'material', label: '材料' },
  { value: 'quest', label: '任务物品' },
];

/**
 * 物品类型图标映射
 */
const ITEM_TYPE_ICONS: Record<ItemType, string> = {
  weapon: '⚔️',
  armor: '🛡️',
  accessory: '💍',
  consumable: '🧪',
  material: '📦',
  quest: '📜',
  misc: '❓',
};

/**
 * 物品类型名称映射
 */
const ITEM_TYPE_NAMES: Record<ItemType, string> = {
  weapon: '武器',
  armor: '防具',
  accessory: '饰品',
  consumable: '消耗品',
  material: '材料',
  quest: '任务物品',
  misc: '其他',
};

/**
 * 背包面板组件
 * 显示物品列表、分类筛选、物品详情
 */
export const InventoryPanel: React.FC = () => {
  const inventory = useGameStore((state) => state.inventory);
  const sendGameAction = useGameStore((state) => state.sendGameAction);
  const [filter, setFilter] = useState<ItemType | 'all'>('all');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // 背包容量
  const maxCapacity = 20;
  const usedSlots = inventory.length;

  // 过滤物品
  const filteredItems = useMemo(() => {
    if (filter === 'all') return inventory;
    return inventory.filter((invItem) => {
      // 优先使用 InventoryItem 上的 type 字段，否则从 item 属性获取
      const itemType = invItem.type || invItem.item?.type;
      return itemType === filter;
    });
  }, [inventory, filter]);

  // 选中的物品
  const selectedItem = inventory.find((item) => item.id === selectedItemId);

  // 使用物品
  const handleUseItem = async (itemId: string) => {
    await sendGameAction({
      type: 'use_item',
      payload: { itemId },
    });
  };

  // 丢弃物品
  const handleDropItem = async (itemId: string, quantity: number = 1) => {
    await sendGameAction({
      type: 'drop_item',
      payload: { itemId, quantity },
    });
  };

  // 处理空数据状态
  if (!inventory || inventory.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>🎒</div>
        <p>背包空空如也</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* 背包容量 */}
      <div className={styles.capacityBar}>
        <span className={styles.capacityIcon}>🎒</span>
        <div className={styles.capacityInfo}>
          <span className={styles.capacityLabel}>背包容量</span>
          <span className={styles.capacityValue}>
            {usedSlots} / {maxCapacity}
          </span>
        </div>
        <div className={styles.capacityProgress}>
          <div
            className={styles.capacityProgressFill}
            style={{ width: `${(usedSlots / maxCapacity) * 100}%` }}
          />
        </div>
      </div>

      {/* 过滤器和视图切换 */}
      <div className={styles.toolbar}>
        <div className={styles.filterTabs}>
          {FILTER_OPTIONS.map((option) => (
            <button
              key={option.value}
              className={[styles.filterTab, filter === option.value && styles.filterTabActive].filter(Boolean).join(' ')}
              onClick={() => setFilter(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className={styles.viewToggle}>
          <button
            className={[styles.viewButton, viewMode === 'grid' && styles.viewButtonActive].filter(Boolean).join(' ')}
            onClick={() => setViewMode('grid')}
            title="网格视图"
          >
            ⊞
          </button>
          <button
            className={[styles.viewButton, viewMode === 'list' && styles.viewButtonActive].filter(Boolean).join(' ')}
            onClick={() => setViewMode('list')}
            title="列表视图"
          >
            ☰
          </button>
        </div>
      </div>

      {/* 物品列表 */}
      <div className={styles.itemsContainer}>
        {filteredItems.length === 0 ? (
          <div className={styles.noItems}>
            <span className={styles.noItemsIcon}>📦</span>
            <p>没有物品</p>
          </div>
        ) : (
          <div className={[styles.itemsList, viewMode === 'grid' ? styles.gridView : styles.listView].join(' ')}>
            {filteredItems.map((invItem) => {
              // InventoryItem 可能包含 item 属性来获取完整物品信息
              const item = (invItem as InventoryItem & { item?: Item }).item;
              const itemType = item?.type || 'misc';
              const itemRarity = item?.rarity || 'common';
              const itemName = item?.name || invItem.itemId;
              
              return (
                <div
                  key={invItem.id}
                  className={[
                    styles.itemSlot,
                    selectedItemId === invItem.id && styles.itemSlotSelected,
                  ].filter(Boolean).join(' ')}
                  onClick={() => setSelectedItemId(invItem.id)}
                  style={{ '--rarity-color': RARITY_CONFIG[itemRarity]?.color || '#9E9E9E' } as React.CSSProperties}
                >
                  <div className={styles.itemIcon}>
                    {ITEM_TYPE_ICONS[itemType]}
                  </div>
                  {viewMode === 'list' && (
                    <div className={styles.itemInfo}>
                      <span className={styles.itemName}>{itemName}</span>
                      <span className={styles.itemType}>{ITEM_TYPE_NAMES[itemType]}</span>
                    </div>
                  )}
                  {invItem.quantity > 1 && (
                    <span className={styles.itemQuantity}>×{invItem.quantity}</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 物品详情 */}
      {selectedItem && (
        <div className={styles.itemDetail}>
          <div className={styles.detailHeader}>
            <span className={styles.detailIcon}>
              {ITEM_TYPE_ICONS[(selectedItem as InventoryItem & { item?: Item }).item?.type || 'misc']}
            </span>
            <div className={styles.detailTitle}>
              <h4
                className={styles.detailName}
                style={{ color: RARITY_CONFIG[(selectedItem as InventoryItem & { item?: Item }).item?.rarity || 'common']?.color || '#9E9E9E' }}
              >
                {(selectedItem as InventoryItem & { item?: Item }).item?.name || selectedItem.itemId}
              </h4>
              <span className={styles.detailType}>
                {ITEM_TYPE_NAMES[(selectedItem as InventoryItem & { item?: Item }).item?.type || 'misc']} · {(selectedItem as InventoryItem & { item?: Item }).item?.rarity || 'common'}
              </span>
            </div>
            <button
              className={styles.closeDetail}
              onClick={() => setSelectedItemId(null)}
            >
              ✕
            </button>
          </div>
          <p className={styles.detailDescription}>
            {(selectedItem as InventoryItem & { item?: Item }).item?.description || '暂无描述'}
          </p>
          {(selectedItem as InventoryItem & { item?: Item }).item?.stats && Object.keys((selectedItem as InventoryItem & { item?: Item }).item!.stats).length > 0 && (
            <div className={styles.detailStats}>
              {Object.entries((selectedItem as InventoryItem & { item?: Item }).item!.stats).map(([key, value]) => (
                <div key={key} className={styles.statItem}>
                  <span className={styles.statName}>{key}</span>
                  <span className={styles.statValue}>+{value}</span>
                </div>
              ))}
            </div>
          )}
          <div className={styles.detailActions}>
            {(selectedItem as InventoryItem & { item?: Item }).item?.type === 'consumable' && (
              <Button
                size="small"
                variant="primary"
                onClick={() => handleUseItem(selectedItem.id)}
              >
                使用
              </Button>
            )}
            {(selectedItem as InventoryItem & { item?: Item }).item?.type !== 'quest' && (
              <Button
                size="small"
                variant="ghost"
                onClick={() => handleDropItem(selectedItem.id)}
              >
                丢弃
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryPanel;
