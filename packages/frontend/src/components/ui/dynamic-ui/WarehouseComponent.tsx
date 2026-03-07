import React, { useState, useMemo, useCallback } from 'react';
import type { DynamicUIComponentProps, WarehouseTab, WarehouseItem } from './types';
import styles from './WarehouseComponent.module.css';

/**
 * 仓库/银行组件
 * 
 * 解析格式:
 * {maxSlots=100 usedSlots=45}
 * 
 * 示例:
 * :::warehouse{maxSlots=100}
 * [背包](tab:inventory maxSlots=50 usedSlots=30)
 * [生命药水](item:health-potion qty=5 rarity=common)
 * [魔法药水](item:mana-potion qty=3 rarity=common)
 * [仓库](tab:bank maxSlots=50 usedSlots=15)
 * [金币](item:gold qty=1000)
 * :::
 */
export const WarehouseComponent: React.FC<DynamicUIComponentProps> = ({
  content,
  attrs,
  onAction,
}) => {
  // 当前选中的标签
  const [activeTab, setActiveTab] = useState<WarehouseTab>('inventory');

  // 解析内容
  // 支持带连字符的 ID，如 iron-sword, health-potion
  const { tabs, items } = useMemo(() => {
    const parsedTabs: Array<{ id: WarehouseTab; label: string; maxSlots: number; usedSlots: number }> = [];
    const parsedItems: Record<string, WarehouseItem[]> = {
      inventory: [],
      bank: [],
      equipment: [],
    };

    const lines = content.split('\n');
    let currentTabId: WarehouseTab = 'inventory';

    for (const line of lines) {
      // 解析标签 - 使用 [\w-]+ 支持连字符
      const tabMatch = line.match(/\[([^\]]+)\]\(tab:([\w-]+)\s+maxSlots=(\d+)\s+usedSlots=(\d+)\)/);
      if (tabMatch) {
        const tabId = tabMatch[2] as WarehouseTab;
        currentTabId = tabId;
        parsedTabs.push({
          id: tabId,
          label: tabMatch[1],
          maxSlots: parseInt(tabMatch[3], 10),
          usedSlots: parseInt(tabMatch[4], 10),
        });
        continue;
      }

      // 解析物品 - 使用 [\w-]+ 支持连字符
      const itemMatch = line.match(/\[([^\]]+)\]\(item:([\w-]+)\s+qty=(\d+)(?:\s+rarity=(\w+))?\)/);
      if (itemMatch) {
        parsedItems[currentTabId].push({
          id: itemMatch[2],
          name: itemMatch[1],
          quantity: parseInt(itemMatch[3], 10),
          rarity: itemMatch[4],
        });
      }
    }

    return { tabs: parsedTabs, items: parsedItems };
  }, [content]);

  // 获取当前标签数据
  const currentTabData = useMemo(() => {
    return tabs.find(t => t.id === activeTab);
  }, [tabs, activeTab]);

  // 获取当前物品列表
  const currentItems = useMemo(() => {
    return items[activeTab] || [];
  }, [items, activeTab]);

  // 处理标签切换
  const handleTabChange = useCallback((tabId: WarehouseTab) => {
    setActiveTab(tabId);
    onAction?.({ type: 'warehouse-tab-change', payload: { tabId } });
  }, [onAction]);

  // 处理物品点击
  const handleItemClick = useCallback((item: WarehouseItem) => {
    onAction?.({ type: 'warehouse-item-click', payload: { item } });
  }, [onAction]);

  // 处理物品使用
  const handleItemUse = useCallback((item: WarehouseItem) => {
    onAction?.({ type: 'warehouse-item-use', payload: { item } });
  }, [onAction]);

  // 总容量
  const totalMaxSlots = parseInt(attrs.maxSlots || '100', 10);
  const totalUsedSlots = tabs.reduce((sum, tab) => sum + tab.usedSlots, 0);

  return (
    <div className={styles.container} role="region" aria-label="仓库">
      {/* 标签页 */}
      <div className={styles.tabs} role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={[styles.tab, activeTab === tab.id && styles.active].filter(Boolean).join(' ')}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => handleTabChange(tab.id)}
          >
            <span className={styles.tabLabel}>{tab.label}</span>
            <span className={styles.tabCount}>
              {tab.usedSlots}/{tab.maxSlots}
            </span>
          </button>
        ))}
      </div>

      {/* 容量显示 */}
      <div className={styles.capacity}>
        <div className={styles.capacityBar}>
          <div
            className={styles.capacityFill}
            style={{ width: `${(totalUsedSlots / totalMaxSlots) * 100}%` }}
          />
        </div>
        <span className={styles.capacityText}>
          总容量: {totalUsedSlots}/{totalMaxSlots}
        </span>
      </div>

      {/* 当前标签容量 */}
      {currentTabData && (
        <div className={styles.tabCapacity}>
          <span>{currentTabData.label}容量: </span>
          <span className={styles.used}>{currentTabData.usedSlots}</span>
          <span>/</span>
          <span>{currentTabData.maxSlots}</span>
        </div>
      )}

      {/* 物品列表 */}
      <div className={styles.itemGrid} role="list">
        {currentItems.length === 0 ? (
          <div className={styles.empty}>暂无物品</div>
        ) : (
          currentItems.map((item) => (
            <div
              key={item.id}
              className={[styles.itemSlot, item.rarity && styles[item.rarity]].filter(Boolean).join(' ')}
              role="listitem"
              onClick={() => handleItemClick(item)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleItemClick(item);
                }
              }}
              tabIndex={0}
            >
              <div className={styles.itemIcon}>📦</div>
              <div className={styles.itemInfo}>
                <span className={styles.itemName}>{item.name}</span>
                <span className={styles.itemQty}>x{item.quantity}</span>
              </div>
              <button
                type="button"
                className={styles.useButton}
                onClick={(e) => {
                  e.stopPropagation();
                  handleItemUse(item);
                }}
                aria-label={`使用 ${item.name}`}
              >
                使用
              </button>
            </div>
          ))
        )}
      </div>

      {/* 操作按钮 */}
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.actionButton}
          onClick={() => onAction?.({ type: 'warehouse-sort' })}
        >
          整理
        </button>
        <button
          type="button"
          className={styles.actionButton}
          onClick={() => onAction?.({ type: 'warehouse-close' })}
        >
          关闭
        </button>
      </div>
    </div>
  );
};

export default WarehouseComponent;
