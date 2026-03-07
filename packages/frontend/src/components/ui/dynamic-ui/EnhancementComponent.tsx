import React, { useMemo, useCallback } from 'react';
import type { DynamicUIComponentProps, EnhancementItem } from './types';
import styles from './EnhancementComponent.module.css';

/**
 * 装备强化组件
 * 
 * 解析格式:
 * {name="火焰之剑" currentLevel=5 maxLevel=10 successRate=75}
 * 
 * 示例:
 * :::enhancement{name="火焰之剑" currentLevel=5 maxLevel=10 successRate=75}
 * [强化石](material:enhance-stone required=3 owned=5)
 * [金币](material:gold required=1000 owned=2500)
 * :::
 */
export const EnhancementComponent: React.FC<DynamicUIComponentProps> = ({
  content,
  attrs,
  onAction,
}) => {
  // 解析装备信息
  const item = useMemo<EnhancementItem>(() => {
    return {
      id: attrs.id || 'unknown',
      name: attrs.name || '未知装备',
      icon: attrs.icon,
      currentLevel: parseInt(attrs.currentLevel || '0', 10),
      maxLevel: parseInt(attrs.maxLevel || '10', 10),
      successRate: parseInt(attrs.successRate || '0', 10),
      materials: [],
    };
  }, [attrs]);

  // 解析材料需求
  const materials = useMemo(() => {
    const result: Array<{ name: string; required: number; owned: number }> = [];
    const regex = /\[([^\]]+)\]\(material:(\w+)\s+required=(\d+)\s+owned=(\d+)\)/g;
    let match;

    while ((match = regex.exec(content)) !== null) {
      result.push({
        name: match[1],
        required: parseInt(match[3], 10),
        owned: parseInt(match[4], 10),
      });
    }

    return result;
  }, [content]);

  // 检查是否可以强化
  const canEnhance = useMemo(() => {
    if (item.currentLevel >= item.maxLevel) return false;
    return materials.every(m => m.owned >= m.required);
  }, [item, materials]);

  // 确认强化
  const handleEnhance = useCallback(() => {
    if (!canEnhance) return;
    onAction?.({
      type: 'enhance',
      payload: {
        itemId: item.id,
        currentLevel: item.currentLevel,
        materials: materials.map(m => ({ name: m.name, required: m.required })),
      },
    });
  }, [canEnhance, onAction, item, materials]);

  // 取消
  const handleCancel = useCallback(() => {
    onAction?.({ type: 'cancel-enhancement' });
  }, [onAction]);

  return (
    <div className={styles.container} role="dialog" aria-label="装备强化">
      {/* 装备信息 */}
      <div className={styles.header}>
        {item.icon && <span className={styles.icon}>{item.icon}</span>}
        <div className={styles.info}>
          <h3 className={styles.name}>{item.name}</h3>
          <div className={styles.level}>
            <span>强化等级: </span>
            <span className={styles.currentLevel}>+{item.currentLevel}</span>
            <span className={styles.levelSeparator}>/</span>
            <span className={styles.maxLevel}>+{item.maxLevel}</span>
          </div>
        </div>
      </div>

      {/* 成功率 */}
      <div className={styles.successRate}>
        <span className={styles.rateLabel}>成功率</span>
        <div className={styles.rateBar}>
          <div
            className={styles.rateFill}
            style={{ width: `${item.successRate}%` }}
          />
        </div>
        <span className={styles.rateValue}>{item.successRate}%</span>
      </div>

      {/* 材料需求 */}
      <div className={styles.materials}>
        <h4 className={styles.materialsTitle}>所需材料</h4>
        <div className={styles.materialList}>
          {materials.map((material, index) => {
            const isEnough = material.owned >= material.required;
            return (
              <div
                key={`${material.name}-${index}`}
                className={[styles.materialItem, !isEnough && styles.insufficient].filter(Boolean).join(' ')}
              >
                <span className={styles.materialName}>{material.name}</span>
                <span className={styles.materialCount}>
                  <span className={isEnough ? styles.owned : styles.needed}>
                    {material.owned}
                  </span>
                  <span className={styles.separator}>/</span>
                  <span>{material.required}</span>
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 警告信息 */}
      {item.currentLevel >= item.maxLevel && (
        <div className={styles.warning}>
          该装备已达到最高强化等级
        </div>
      )}

      {/* 操作按钮 */}
      <div className={styles.actions}>
        <button
          type="button"
          className={[styles.button, styles.confirm, !canEnhance && styles.disabled].filter(Boolean).join(' ')}
          onClick={handleEnhance}
          disabled={!canEnhance}
        >
          确认强化
        </button>
        <button
          type="button"
          className={[styles.button, styles.cancel].filter(Boolean).join(' ')}
          onClick={handleCancel}
        >
          取消
        </button>
      </div>
    </div>
  );
};

export default EnhancementComponent;
