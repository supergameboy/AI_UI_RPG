import React, { useState, useMemo } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { Button } from '../common';
import type { ItemType } from '@ai-rpg/shared';
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

export const InventoryPanel: React.FC = () => {
  const character = useGameStore((state) => state.character);
  const inventory = useGameStore((state) => state.inventory);
  const [filter, setFilter] = useState<ItemType | 'all'>('all');
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const items = inventory.slots;
  const maxCapacity = inventory.capacity;
  const usedSlots = items.length;

  const filteredItems = useMemo(() => {
    if (filter === 'all') return items;
    return items.filter((slot) => slot.item?.type === filter);
  }, [items, filter]);

  const selectedSlot = items.find((slot) => slot.id === selectedSlotId);
  const selectedItem = selectedSlot?.item;

  // 使用物品
  const handleUseItem = (itemId: string) => {
    console.log('使用物品:', itemId);
    // TODO: 实现使用物品逻辑
  };

  // 丢弃物品
  const handleDropItem = (itemId: string) => {
    console.log('丢弃物品:', itemId);
    // TODO: 实现丢弃物品逻辑
  };

  if (!character.id) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>🎒</div>
        <p>暂无背包数据</p>
        <p className={styles.emptyHint}>创建角色后查看背包</p>
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
            {filteredItems.map((slot) => {
              const item = slot.item;
              if (!item) return null;
              return (
                <div
                  key={slot.id}
                  className={[
                    styles.itemSlot,
                    selectedSlotId === slot.id && styles.itemSlotSelected,
                  ].filter(Boolean).join(' ')}
                  onClick={() => setSelectedSlotId(slot.id)}
                  style={{ '--rarity-color': RARITY_CONFIG[item.rarity].color } as React.CSSProperties}
                >
                  <div className={styles.itemIcon}>
                    {ITEM_TYPE_ICONS[item.type]}
                  </div>
                  {viewMode === 'list' && (
                    <div className={styles.itemInfo}>
                      <span className={styles.itemName}>{item.name}</span>
                      <span className={styles.itemType}>{ITEM_TYPE_NAMES[item.type]}</span>
                    </div>
                  )}
                  {slot.quantity > 1 && (
                    <span className={styles.itemQuantity}>×{slot.quantity}</span>
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
              {ITEM_TYPE_ICONS[selectedItem.type]}
            </span>
            <div className={styles.detailTitle}>
              <h4
                className={styles.detailName}
                style={{ color: RARITY_CONFIG[selectedItem.rarity].color }}
              >
                {selectedItem.name}
              </h4>
              <span className={styles.detailType}>
                {ITEM_TYPE_NAMES[selectedItem.type]} · {selectedItem.rarity}
              </span>
            </div>
            <button
              className={styles.closeDetail}
              onClick={() => setSelectedSlotId(null)}
            >
              ✕
            </button>
          </div>
          <p className={styles.detailDescription}>{selectedItem.description}</p>
          {Object.keys(selectedItem.stats).length > 0 && (
            <div className={styles.detailStats}>
              {Object.entries(selectedItem.stats).map(([key, value]) => (
                <div key={key} className={styles.statItem}>
                  <span className={styles.statName}>{key}</span>
                  <span className={styles.statValue}>+{value}</span>
                </div>
              ))}
            </div>
          )}
          <div className={styles.detailActions}>
            {selectedItem.type === 'consumable' && (
              <Button
                size="small"
                variant="primary"
                onClick={() => handleUseItem(selectedItem.id)}
              >
                使用
              </Button>
            )}
            {selectedItem.type !== 'quest' && (
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
