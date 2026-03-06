import React, { useState, useMemo } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { Button } from '../common';
import type { EquipmentSlotType, Item } from '@ai-rpg/shared';
import { RARITY_CONFIG } from '@ai-rpg/shared';
import styles from './EquipmentPanel.module.css';

/**
 * 槽位图标映射
 */
const SLOT_ICONS: Record<EquipmentSlotType, string> = {
  weapon: '⚔️',
  head: '🪖',
  body: '🛡️',
  feet: '👢',
  accessory: '💍',
};

/**
 * 槽位名称映射
 */
const SLOT_NAMES: Record<EquipmentSlotType, string> = {
  weapon: '武器',
  head: '头部',
  body: '身体',
  feet: '脚部',
  accessory: '饰品',
};

/**
 * 属性名称映射
 */
const STAT_NAMES: Record<string, string> = {
  attack: '攻击力',
  defense: '防御力',
  maxHp: '生命值',
  maxMp: '魔法值',
  speed: '速度',
  luck: '幸运',
  strength: '力量',
  dexterity: '敏捷',
  constitution: '体质',
  intelligence: '智力',
  wisdom: '智慧',
  charisma: '魅力',
};

export const EquipmentPanel: React.FC = () => {
  const character = useGameStore((state) => state.character);
  const equipment = useGameStore((state) => state.equipment);
  const [selectedSlot, setSelectedSlot] = useState<EquipmentSlotType | null>(null);
  const [selectedAccessoryIndex, setSelectedAccessoryIndex] = useState<number | null>(null);

  const getEquippedItem = (slot: EquipmentSlotType, index?: number): Item | null => {
    if (slot === 'accessory' && index !== undefined) {
      return equipment.accessories[index]?.item || null;
    }
    if (slot === 'weapon') return equipment.weapon?.item || null;
    if (slot === 'head') return equipment.head?.item || null;
    if (slot === 'body') return equipment.body?.item || null;
    if (slot === 'feet') return equipment.feet?.item || null;
    return null;
  };

  const totalStats = useMemo(() => {
    const stats: Record<string, number> = {};
    const allItems: (Item | undefined)[] = [
      equipment.weapon?.item,
      equipment.head?.item,
      equipment.body?.item,
      equipment.feet?.item,
      ...equipment.accessories.map(a => a.item),
    ];
    allItems.forEach((item) => {
      if (item?.stats) {
        Object.entries(item.stats).forEach(([key, value]) => {
          stats[key] = (stats[key] || 0) + value;
        });
      }
    });
    return stats;
  }, [equipment]);

  const getSelectedItem = (): { item: Item | null; slot: EquipmentSlotType | null } => {
    if (selectedSlot === 'accessory' && selectedAccessoryIndex !== null) {
      const item = getEquippedItem('accessory', selectedAccessoryIndex);
      return { item, slot: 'accessory' };
    }
    if (selectedSlot) {
      const item = getEquippedItem(selectedSlot);
      return { item, slot: selectedSlot };
    }
    return { item: null, slot: null };
  };

  const { item: selectedItem, slot: currentSlot } = getSelectedItem();

  const handleUnequip = (slot: EquipmentSlotType, accessoryIndex?: number) => {
    console.log('卸下装备:', slot, accessoryIndex);
    setSelectedSlot(null);
    setSelectedAccessoryIndex(null);
  };

  const accessories = useMemo(() => {
    return equipment.accessories
      .map((eq, index) => ({ index, item: eq.item }))
      .filter((a): a is { index: number; item: Item } => a.item !== undefined);
  }, [equipment.accessories]);

  if (!character.id) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>🛡️</div>
        <p>暂无装备数据</p>
        <p className={styles.emptyHint}>创建角色后查看装备</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* 属性加成总计 */}
      <div className={styles.statsPanel}>
        <h4 className={styles.statsTitle}>
          <span className={styles.statsIcon}>📊</span>
          属性加成
        </h4>
        <div className={styles.statsGrid}>
          {Object.entries(totalStats).map(([key, value]) => (
            <div key={key} className={styles.statItem}>
              <span className={styles.statName}>
                {STAT_NAMES[key] || key}
              </span>
              <span className={styles.statValue}>+{value}</span>
            </div>
          ))}
          {Object.keys(totalStats).length === 0 && (
            <div className={styles.noStats}>暂无属性加成</div>
          )}
        </div>
      </div>

      {/* 装备槽位布局 */}
      <div className={styles.equipmentLayout}>
        {/* 左侧：武器、头部 */}
        <div className={styles.leftColumn}>
          <div
            className={[
              styles.slotCard,
              selectedSlot === 'weapon' && styles.slotCardSelected,
            ].filter(Boolean).join(' ')}
            onClick={() => {
              setSelectedSlot('weapon');
              setSelectedAccessoryIndex(null);
            }}
          >
            <div className={styles.slotHeader}>
              <span className={styles.slotIcon}>{SLOT_ICONS.weapon}</span>
              <span className={styles.slotLabel}>{SLOT_NAMES.weapon}</span>
            </div>
            {getEquippedItem('weapon') ? (
              <div
                className={styles.equippedItem}
                style={{ '--rarity-color': RARITY_CONFIG[getEquippedItem('weapon')!.rarity].color } as React.CSSProperties}
              >
                <span className={styles.itemName}>{getEquippedItem('weapon')!.name}</span>
                <span className={styles.itemRarity} style={{ color: RARITY_CONFIG[getEquippedItem('weapon')!.rarity].color }}>
                  {getEquippedItem('weapon')!.rarity}
                </span>
              </div>
            ) : (
              <div className={styles.emptySlot}>
                <span className={styles.emptyText}>未装备</span>
              </div>
            )}
          </div>

          <div
            className={[
              styles.slotCard,
              selectedSlot === 'head' && styles.slotCardSelected,
            ].filter(Boolean).join(' ')}
            onClick={() => {
              setSelectedSlot('head');
              setSelectedAccessoryIndex(null);
            }}
          >
            <div className={styles.slotHeader}>
              <span className={styles.slotIcon}>{SLOT_ICONS.head}</span>
              <span className={styles.slotLabel}>{SLOT_NAMES.head}</span>
            </div>
            {getEquippedItem('head') ? (
              <div
                className={styles.equippedItem}
                style={{ '--rarity-color': RARITY_CONFIG[getEquippedItem('head')!.rarity].color } as React.CSSProperties}
              >
                <span className={styles.itemName}>{getEquippedItem('head')!.name}</span>
                <span className={styles.itemRarity} style={{ color: RARITY_CONFIG[getEquippedItem('head')!.rarity].color }}>
                  {getEquippedItem('head')!.rarity}
                </span>
              </div>
            ) : (
              <div className={styles.emptySlot}>
                <span className={styles.emptyText}>未装备</span>
              </div>
            )}
          </div>
        </div>

        {/* 中间：身体 */}
        <div className={styles.centerColumn}>
          <div
            className={[
              styles.slotCard,
              styles.bodySlot,
              selectedSlot === 'body' && styles.slotCardSelected,
            ].filter(Boolean).join(' ')}
            onClick={() => {
              setSelectedSlot('body');
              setSelectedAccessoryIndex(null);
            }}
          >
            <div className={styles.slotHeader}>
              <span className={styles.slotIcon}>{SLOT_ICONS.body}</span>
              <span className={styles.slotLabel}>{SLOT_NAMES.body}</span>
            </div>
            {getEquippedItem('body') ? (
              <div
                className={styles.equippedItem}
                style={{ '--rarity-color': RARITY_CONFIG[getEquippedItem('body')!.rarity].color } as React.CSSProperties}
              >
                <span className={styles.itemName}>{getEquippedItem('body')!.name}</span>
                <span className={styles.itemRarity} style={{ color: RARITY_CONFIG[getEquippedItem('body')!.rarity].color }}>
                  {getEquippedItem('body')!.rarity}
                </span>
              </div>
            ) : (
              <div className={styles.emptySlot}>
                <span className={styles.emptyText}>未装备</span>
              </div>
            )}
          </div>
        </div>

        {/* 右侧：脚部、饰品 */}
        <div className={styles.rightColumn}>
          <div
            className={[
              styles.slotCard,
              selectedSlot === 'feet' && styles.slotCardSelected,
            ].filter(Boolean).join(' ')}
            onClick={() => {
              setSelectedSlot('feet');
              setSelectedAccessoryIndex(null);
            }}
          >
            <div className={styles.slotHeader}>
              <span className={styles.slotIcon}>{SLOT_ICONS.feet}</span>
              <span className={styles.slotLabel}>{SLOT_NAMES.feet}</span>
            </div>
            {getEquippedItem('feet') ? (
              <div
                className={styles.equippedItem}
                style={{ '--rarity-color': RARITY_CONFIG[getEquippedItem('feet')!.rarity].color } as React.CSSProperties}
              >
                <span className={styles.itemName}>{getEquippedItem('feet')!.name}</span>
                <span className={styles.itemRarity} style={{ color: RARITY_CONFIG[getEquippedItem('feet')!.rarity].color }}>
                  {getEquippedItem('feet')!.rarity}
                </span>
              </div>
            ) : (
              <div className={styles.emptySlot}>
                <span className={styles.emptyText}>未装备</span>
              </div>
            )}
          </div>

          {/* 饰品槽位（支持多个） */}
          <div className={styles.accessorySlots}>
            <div className={styles.accessoryHeader}>
              <span className={styles.slotIcon}>{SLOT_ICONS.accessory}</span>
              <span className={styles.slotLabel}>{SLOT_NAMES.accessory}</span>
            </div>
            <div className={styles.accessoryList}>
              {accessories.length > 0 ? (
                accessories.map(({ index, item }) => (
                  <div
                    key={index}
                    className={[
                      styles.accessoryItem,
                      selectedSlot === 'accessory' && selectedAccessoryIndex === index && styles.accessoryItemSelected,
                    ].filter(Boolean).join(' ')}
                    onClick={() => {
                      setSelectedSlot('accessory');
                      setSelectedAccessoryIndex(index);
                    }}
                    style={{ '--rarity-color': RARITY_CONFIG[item.rarity].color } as React.CSSProperties}
                  >
                    <span className={styles.accessoryName}>{item.name}</span>
                  </div>
                ))
              ) : (
                <div className={styles.emptyAccessory}>
                  <span className={styles.emptyText}>未装备</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 物品详情 */}
      {selectedItem && currentSlot && (
        <div className={styles.itemDetail}>
          <div className={styles.detailHeader}>
            <span className={styles.detailIcon}>
              {SLOT_ICONS[currentSlot]}
            </span>
            <div className={styles.detailTitle}>
              <h4
                className={styles.detailName}
                style={{ color: RARITY_CONFIG[selectedItem.rarity].color }}
              >
                {selectedItem.name}
              </h4>
              <span className={styles.detailSlot}>
                {SLOT_NAMES[currentSlot]} · {selectedItem.rarity}
              </span>
            </div>
            <button
              className={styles.closeDetail}
              onClick={() => {
                setSelectedSlot(null);
                setSelectedAccessoryIndex(null);
              }}
            >
              ✕
            </button>
          </div>

          <p className={styles.detailDescription}>{selectedItem.description}</p>

          {/* 属性加成 */}
          {Object.keys(selectedItem.stats).length > 0 && (
            <div className={styles.detailStats}>
              <h5 className={styles.statsSectionTitle}>属性加成</h5>
              <div className={styles.statsList}>
                {Object.entries(selectedItem.stats).map(([key, value]) => (
                  <div key={key} className={styles.detailStatItem}>
                    <span className={styles.detailStatName}>
                      {STAT_NAMES[key] || key}
                    </span>
                    <span className={styles.detailStatValue}>+{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 需求 */}
          {selectedItem.requirements.level && (
            <div className={styles.detailRequirements}>
              <h5 className={styles.statsSectionTitle}>装备需求</h5>
              <div className={styles.requirementItem}>
                <span className={styles.requirementLabel}>等级</span>
                <span className={styles.requirementValue}>
                  Lv.{selectedItem.requirements.level}
                </span>
              </div>
            </div>
          )}

          {/* 操作按钮 */}
          <div className={styles.detailActions}>
            <Button
              size="small"
              variant="ghost"
              onClick={() => handleUnequip(currentSlot, selectedAccessoryIndex ?? undefined)}
            >
              卸下装备
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EquipmentPanel;
