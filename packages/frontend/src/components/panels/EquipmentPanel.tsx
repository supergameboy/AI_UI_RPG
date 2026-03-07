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

/**
 * 模拟装备数据（用于演示）
 */
const MOCK_EQUIPPED_ITEMS: Record<string, Item> = {
  weapon: {
    id: 'weapon_001',
    name: '精钢长剑',
    description: '一把由精钢锻造的长剑，锋利无比。',
    type: 'weapon',
    rarity: 'rare',
    stats: { attack: 25, speed: 5 },
    effects: [],
    requirements: { level: 5 },
    value: { buy: 500, sell: 250, currency: 'gold' },
    stackable: false,
    maxStack: 1,
  },
  head: {
    id: 'head_001',
    name: '铁头盔',
    description: '坚固的铁头盔，提供基础防护。',
    type: 'armor',
    rarity: 'common',
    stats: { defense: 8 },
    effects: [],
    requirements: { level: 1 },
    value: { buy: 100, sell: 50, currency: 'gold' },
    stackable: false,
    maxStack: 1,
  },
  body: {
    id: 'body_001',
    name: '皮甲',
    description: '轻便的皮革护甲，提供基础防护。',
    type: 'armor',
    rarity: 'uncommon',
    stats: { defense: 15, speed: 2 },
    effects: [],
    requirements: { level: 3 },
    value: { buy: 200, sell: 100, currency: 'gold' },
    stackable: false,
    maxStack: 1,
  },
  feet: {
    id: 'feet_001',
    name: '旅行靴',
    description: '舒适的旅行靴，适合长途跋涉。',
    type: 'armor',
    rarity: 'common',
    stats: { speed: 3 },
    effects: [],
    requirements: { level: 1 },
    value: { buy: 80, sell: 40, currency: 'gold' },
    stackable: false,
    maxStack: 1,
  },
  accessory_0: {
    id: 'accessory_001',
    name: '力量戒指',
    description: '一枚散发着微光的戒指，能增强力量。',
    type: 'accessory',
    rarity: 'uncommon',
    stats: { strength: 5 },
    effects: [],
    requirements: { level: 5 },
    value: { buy: 300, sell: 150, currency: 'gold' },
    stackable: false,
    maxStack: 1,
  },
};

/**
 * 装备面板组件
 * 显示装备槽位、已装备物品、属性加成
 */
export const EquipmentPanel: React.FC = () => {
  const character = useGameStore((state) => state.character);
  const [selectedSlot, setSelectedSlot] = useState<EquipmentSlotType | null>(null);
  const [selectedAccessoryIndex, setSelectedAccessoryIndex] = useState<number | null>(null);

  // 使用模拟数据
  const equippedItems = MOCK_EQUIPPED_ITEMS;

  // 计算属性加成总计
  const totalStats = useMemo(() => {
    const stats: Record<string, number> = {};
    Object.values(equippedItems).forEach((item) => {
      if (item) {
        Object.entries(item.stats).forEach(([key, value]) => {
          stats[key] = (stats[key] || 0) + value;
        });
      }
    });
    return stats;
  }, [equippedItems]);

  // 获取选中物品
  const getSelectedItem = (): { item: Item | null; slot: EquipmentSlotType | null } => {
    if (selectedSlot === 'accessory' && selectedAccessoryIndex !== null) {
      const item = equippedItems[`accessory_${selectedAccessoryIndex}`];
      return { item: item || null, slot: 'accessory' };
    }
    if (selectedSlot) {
      const item = equippedItems[selectedSlot];
      return { item: item || null, slot: selectedSlot };
    }
    return { item: null, slot: null };
  };

  const { item: selectedItem, slot: currentSlot } = getSelectedItem();

  // 卸下装备
  const handleUnequip = (slot: EquipmentSlotType, accessoryIndex?: number) => {
    console.log('卸下装备:', slot, accessoryIndex);
    // TODO: 实现卸下装备逻辑
    setSelectedSlot(null);
    setSelectedAccessoryIndex(null);
  };

  // 获取饰品列表
  const accessories = useMemo(() => {
    const acc: Array<{ index: number; item: Item }> = [];
    let i = 0;
    while (equippedItems[`accessory_${i}`]) {
      const item = equippedItems[`accessory_${i}`];
      if (item) {
        acc.push({ index: i, item });
      }
      i++;
    }
    return acc;
  }, [equippedItems]);

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
            {equippedItems.weapon ? (
              <div
                className={styles.equippedItem}
                style={{ '--rarity-color': RARITY_CONFIG[equippedItems.weapon.rarity].color } as React.CSSProperties}
              >
                <span className={styles.itemName}>{equippedItems.weapon.name}</span>
                <span className={styles.itemRarity} style={{ color: RARITY_CONFIG[equippedItems.weapon.rarity].color }}>
                  {equippedItems.weapon.rarity}
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
            {equippedItems.head ? (
              <div
                className={styles.equippedItem}
                style={{ '--rarity-color': RARITY_CONFIG[equippedItems.head.rarity].color } as React.CSSProperties}
              >
                <span className={styles.itemName}>{equippedItems.head.name}</span>
                <span className={styles.itemRarity} style={{ color: RARITY_CONFIG[equippedItems.head.rarity].color }}>
                  {equippedItems.head.rarity}
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
            {equippedItems.body ? (
              <div
                className={styles.equippedItem}
                style={{ '--rarity-color': RARITY_CONFIG[equippedItems.body.rarity].color } as React.CSSProperties}
              >
                <span className={styles.itemName}>{equippedItems.body.name}</span>
                <span className={styles.itemRarity} style={{ color: RARITY_CONFIG[equippedItems.body.rarity].color }}>
                  {equippedItems.body.rarity}
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
            {equippedItems.feet ? (
              <div
                className={styles.equippedItem}
                style={{ '--rarity-color': RARITY_CONFIG[equippedItems.feet.rarity].color } as React.CSSProperties}
              >
                <span className={styles.itemName}>{equippedItems.feet.name}</span>
                <span className={styles.itemRarity} style={{ color: RARITY_CONFIG[equippedItems.feet.rarity].color }}>
                  {equippedItems.feet.rarity}
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
