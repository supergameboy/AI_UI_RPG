import React, { useState, useMemo } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { Button } from '../common';
import type { EquipmentSlotType, Item, EquippedItem } from '@ai-rpg/shared';
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

/**
 * 装备面板组件
 * 显示装备槽位、已装备物品、属性加成
 */
export const EquipmentPanel: React.FC = () => {
  const equipment = useGameStore((state) => state.equipment);
  const sendGameAction = useGameStore((state) => state.sendGameAction);
  const [selectedSlot, setSelectedSlot] = useState<EquipmentSlotType | null>(null);
  const [selectedAccessoryIndex, setSelectedAccessoryIndex] = useState<number | null>(null);

  // 辅助函数：获取单个槽位的装备
  const getSingleSlotItem = (slot: 'weapon' | 'head' | 'body' | 'feet'): EquippedItem | undefined => {
    return equipment[slot];
  };

  // 计算属性加成总计
  const totalStats = useMemo(() => {
    const stats: Record<string, number> = {};
    
    // 遍历所有装备槽位
    const slots: ('weapon' | 'head' | 'body' | 'feet')[] = ['weapon', 'head', 'body', 'feet'];
    slots.forEach((slot) => {
      const equippedItem = getSingleSlotItem(slot);
      if (equippedItem?.item?.stats) {
        Object.entries(equippedItem.item.stats).forEach(([key, value]) => {
          stats[key] = (stats[key] || 0) + value;
        });
      }
    });
    
    // 遍历饰品
    equipment.accessories?.forEach((acc) => {
      if (acc.item?.stats) {
        Object.entries(acc.item.stats).forEach(([key, value]) => {
          stats[key] = (stats[key] || 0) + value;
        });
      }
    });
    
    return stats;
  }, [equipment]);

  // 获取选中物品
  const getSelectedItem = (): { item: Item | null; slot: EquipmentSlotType | null } => {
    if (selectedSlot === 'accessory' && selectedAccessoryIndex !== null) {
      const equippedItem = equipment.accessories?.[selectedAccessoryIndex];
      return { item: equippedItem?.item || null, slot: 'accessory' };
    }
    if (selectedSlot && selectedSlot !== 'accessory') {
      const equippedItem = getSingleSlotItem(selectedSlot as 'weapon' | 'head' | 'body' | 'feet');
      if (equippedItem) {
        return { item: equippedItem.item || null, slot: selectedSlot };
      }
    }
    return { item: null, slot: null };
  };

  const { item: selectedItem, slot: currentSlot } = getSelectedItem();

  // 卸下装备
  const handleUnequip = async (slot: EquipmentSlotType, accessoryIndex?: number) => {
    await sendGameAction({
      type: 'unequip_item',
      payload: { slot, accessoryIndex },
    });
    setSelectedSlot(null);
    setSelectedAccessoryIndex(null);
  };

  // 获取饰品列表
  const accessories = useMemo(() => {
    return (equipment.accessories || []).map((acc, index) => ({
      index,
      item: acc.item,
    })).filter((acc) => acc.item);
  }, [equipment.accessories]);

  // 检查是否有任何装备
  const hasAnyEquipment = useMemo(() => {
    return !!(equipment.weapon || equipment.head || equipment.body || equipment.feet || 
      (equipment.accessories && equipment.accessories.length > 0));
  }, [equipment]);

  // 处理空数据状态
  if (!hasAnyEquipment) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>🛡️</div>
        <p>暂无装备数据</p>
      </div>
    );
  }

  // 辅助函数：获取槽位物品
  const getSlotItem = (slot: 'weapon' | 'head' | 'body' | 'feet'): Item | null => {
    const equippedItem = getSingleSlotItem(slot);
    return equippedItem?.item || null;
  };

  // 辅助函数：渲染槽位卡片
  const renderSlotCard = (slot: 'weapon' | 'head' | 'body' | 'feet') => {
    const item = getSlotItem(slot);
    const isSelected = selectedSlot === slot;
    
    return (
      <div
        className={[
          styles.slotCard,
          slot === 'body' && styles.bodySlot,
          isSelected && styles.slotCardSelected,
        ].filter(Boolean).join(' ')}
        onClick={() => {
          setSelectedSlot(slot);
          setSelectedAccessoryIndex(null);
        }}
      >
        <div className={styles.slotHeader}>
          <span className={styles.slotIcon}>{SLOT_ICONS[slot]}</span>
          <span className={styles.slotLabel}>{SLOT_NAMES[slot]}</span>
        </div>
        {item ? (
          <div
            className={styles.equippedItem}
            style={{ '--rarity-color': RARITY_CONFIG[item.rarity]?.color || '#9E9E9E' } as React.CSSProperties}
          >
            <span className={styles.itemName}>{item.name}</span>
            <span className={styles.itemRarity} style={{ color: RARITY_CONFIG[item.rarity]?.color || '#9E9E9E' }}>
              {item.rarity}
            </span>
          </div>
        ) : (
          <div className={styles.emptySlot}>
            <span className={styles.emptyText}>未装备</span>
          </div>
        )}
      </div>
    );
  };

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
          {renderSlotCard('weapon')}
          {renderSlotCard('head')}
        </div>

        {/* 中间：身体 */}
        <div className={styles.centerColumn}>
          {renderSlotCard('body')}
        </div>

        {/* 右侧：脚部、饰品 */}
        <div className={styles.rightColumn}>
          {renderSlotCard('feet')}

          {/* 饰品槽位（支持多个） */}
          <div className={styles.accessorySlots}>
            <div className={styles.accessoryHeader}>
              <span className={styles.slotIcon}>{SLOT_ICONS.accessory}</span>
              <span className={styles.slotLabel}>{SLOT_NAMES.accessory}</span>
            </div>
            <div className={styles.accessoryList}>
              {accessories.length > 0 ? (
                accessories.map(({ index, item }) => (
                  item && (
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
                      style={{ '--rarity-color': RARITY_CONFIG[item.rarity]?.color || '#9E9E9E' } as React.CSSProperties}
                    >
                      <span className={styles.accessoryName}>{item.name}</span>
                    </div>
                  )
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
                style={{ color: RARITY_CONFIG[selectedItem.rarity]?.color || '#9E9E9E' }}
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
          {selectedItem.stats && Object.keys(selectedItem.stats).length > 0 && (
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
          {selectedItem.requirements?.level && (
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
