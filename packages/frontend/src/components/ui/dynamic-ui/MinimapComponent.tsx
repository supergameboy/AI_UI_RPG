import React, { useMemo, useCallback } from 'react';
import type { DynamicUIComponentProps, MinimapMarker } from './types';
import styles from './MinimapComponent.module.css';

/**
 * 小地图组件
 * 
 * 解析格式:
 * {location="幽暗森林" width=200 height=200 showPlayer=true}
 * 
 * 示例:
 * :::minimap{location="幽暗森林" width=200 height=200 showPlayer=true}
 * [玩家](marker:player x=50 y=50)
 * [商人NPC](marker:npc-1 type=npc x=30 y=40)
 * [哥布林](marker:enemy-1 type=enemy x=70 y=60)
 * [宝箱](marker:item-1 type=item x=20 y=80)
 * [传送门](marker:portal-1 type=portal x=90 y=30)
 * :::
 */
export const MinimapComponent: React.FC<DynamicUIComponentProps> = ({
  content,
  attrs,
  onAction,
}) => {
  // 解析属性
  const location = attrs.location || '未知区域';
  const width = useMemo(() => {
    const v = parseInt(attrs.width || '200', 10);
    return isNaN(v) ? 200 : Math.min(400, Math.max(100, v));
  }, [attrs.width]);

  const height = useMemo(() => {
    const v = parseInt(attrs.height || '200', 10);
    return isNaN(v) ? 200 : Math.min(400, Math.max(100, v));
  }, [attrs.height]);

  const showPlayer = attrs.showPlayer !== 'false';

  // 解析标记点
  const markers = useMemo<MinimapMarker[]>(() => {
    const result: MinimapMarker[] = [];
    // 格式: [名称](marker:id type=xxx x=N y=N)
    const regex = /\[([^\]]+)\]\(marker:([\w-]+)(?:\s+type=(\w+))?\s+x=(-?\d+)\s+y=(-?\d+)\)/g;
    let match;

    while ((match = regex.exec(content)) !== null) {
      const markerType = (match[3] as MinimapMarker['type']) || 'player';
      result.push({
        id: match[2],
        type: markerType,
        position: { x: parseInt(match[4], 10), y: parseInt(match[5], 10) },
        label: match[1],
      });
    }

    return result;
  }, [content]);

  // 点击标记
  const handleMarkerClick = useCallback((marker: MinimapMarker) => {
    onAction?.({
      type: 'select-marker',
      payload: { markerId: marker.id, markerType: marker.type },
    });
  }, [onAction]);

  // 获取标记颜色
  const getMarkerColor = useCallback((type: MinimapMarker['type']) => {
    const colors: Record<MinimapMarker['type'], string> = {
      player: '#3b82f6',
      npc: '#22c55e',
      enemy: '#ef4444',
      item: '#fbbf24',
      portal: '#a855f7',
      quest: '#06b6d4',
    };
    return colors[type] || '#6b7280';
  }, []);

  // 获取标记图标
  const getMarkerIcon = useCallback((type: MinimapMarker['type']) => {
    const icons: Record<MinimapMarker['type'], string> = {
      player: '●',
      npc: '◆',
      enemy: '▲',
      item: '★',
      portal: '◎',
      quest: '?',
    };
    return icons[type] || '●';
  }, []);

  return (
    <div className={styles.container} role="region" aria-label={`小地图 - ${location}`}>
      <div className={styles.header}>
        <span className={styles.location}>{location}</span>
      </div>

      <div
        className={styles.mapArea}
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        {/* 网格背景 */}
        <div className={styles.grid}>
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={`h-${i}`} className={styles.gridLineH} style={{ top: `${i * 10}%` }} />
          ))}
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={`v-${i}`} className={styles.gridLineV} style={{ left: `${i * 10}%` }} />
          ))}
        </div>

        {/* 标记点 */}
        {markers.map(marker => {
          // 确保玩家标记在最上层
          if (marker.type === 'player' && !showPlayer) return null;
          
          return (
            <button
              key={marker.id}
              type="button"
              className={[
                styles.marker,
                styles[marker.type],
                marker.type === 'player' && styles.playerMarker,
              ].filter(Boolean).join(' ')}
              style={{
                left: `${Math.max(0, Math.min(100, marker.position.x))}%`,
                top: `${Math.max(0, Math.min(100, marker.position.y))}%`,
                color: getMarkerColor(marker.type),
              }}
              onClick={() => handleMarkerClick(marker)}
              title={marker.label}
              aria-label={marker.label}
            >
              <span className={styles.markerIcon}>{getMarkerIcon(marker.type)}</span>
              {marker.type !== 'player' && marker.label && (
                <span className={styles.markerLabel}>{marker.label}</span>
              )}
            </button>
          );
        })}

        {/* 玩家标记（始终显示在最上层） */}
        {showPlayer && markers.filter(m => m.type === 'player').map(marker => (
          <div
            key={`player-display-${marker.id}`}
            className={styles.playerDisplay}
            style={{
              left: `${Math.max(0, Math.min(100, marker.position.x))}%`,
              top: `${Math.max(0, Math.min(100, marker.position.y))}%`,
            }}
          >
            <div className={styles.playerPulse} />
          </div>
        ))}
      </div>

      {/* 图例 */}
      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <span className={styles.legendIcon} style={{ color: getMarkerColor('player') }}>●</span>
          <span>玩家</span>
        </div>
        <div className={styles.legendItem}>
          <span className={styles.legendIcon} style={{ color: getMarkerColor('npc') }}>◆</span>
          <span>NPC</span>
        </div>
        <div className={styles.legendItem}>
          <span className={styles.legendIcon} style={{ color: getMarkerColor('enemy') }}>▲</span>
          <span>敌人</span>
        </div>
        <div className={styles.legendItem}>
          <span className={styles.legendIcon} style={{ color: getMarkerColor('item') }}>★</span>
          <span>物品</span>
        </div>
        <div className={styles.legendItem}>
          <span className={styles.legendIcon} style={{ color: getMarkerColor('portal') }}>◎</span>
          <span>传送</span>
        </div>
      </div>
    </div>
  );
};

export default MinimapComponent;
