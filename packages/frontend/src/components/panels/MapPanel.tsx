import React, { useState, useMemo } from 'react';
import { useGameStore } from '../../stores/gameStore';
import type { MapLocation, LocationConnection } from '@ai-rpg/shared';
import styles from './MapPanel.module.css';

/**
 * 地点类型名称映射
 */
const LOCATION_TYPE_NAMES: Record<string, string> = {
  city: '城市',
  village: '村庄',
  dungeon: '地下城',
  wilderness: '荒野',
  building: '建筑',
  custom: '特殊地点',
};

/**
 * 地点类型图标映射
 */
const LOCATION_TYPE_ICONS: Record<string, string> = {
  city: '🏰',
  village: '🏘️',
  dungeon: '⚔️',
  wilderness: '🌲',
  building: '🏠',
  custom: '✨',
};

/**
 * 连接类型名称映射
 */
const CONNECTION_TYPE_NAMES: Record<string, string> = {
  road: '道路',
  portal: '传送门',
  hidden: '隐藏路径',
  bidirectional: '双向通道',
  oneway: '单向通道',
};

/**
 * 地图面板组件
 * 显示世界地图、当前位置和可前往的地点列表
 */
export const MapPanel: React.FC = () => {
  // 从 gameStore 获取地图数据
  const mapData = useGameStore((state) => state.mapData);
  const character = useGameStore((state) => state.character);
  const currentLocation = useGameStore((state) => state.currentLocation);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');

  // 从 mapData 获取位置和连接数据
  const locations: MapLocation[] = mapData?.locations || [];
  const connections: LocationConnection[] = mapData?.connections || [];

  // 当前位置ID
  const currentLocationId = useMemo(() => {
    // 尝试匹配 currentLocation 名称
    if (currentLocation) {
      const matchedLocation = locations.find(loc => loc.name === currentLocation);
      if (matchedLocation) {
        return matchedLocation.id;
      }
    }
    // 默认返回第一个已发现的地点
    const firstDiscovered = locations.find(loc => loc.discovered);
    return firstDiscovered?.id || null;
  }, [currentLocation, locations]);

  // 已探索的地点
  const discoveredLocations = useMemo(() => {
    return locations.filter((loc) => loc.discovered);
  }, [locations]);

  // 未探索的地点
  const undiscoveredLocations = useMemo(() => {
    return locations.filter((loc) => !loc.discovered);
  }, [locations]);

  // 当前位置详情
  const currentLocationData = locations.find((loc) => loc.id === currentLocationId);

  // 选中的地点详情
  const selectedLocation = locations.find((loc) => loc.id === selectedLocationId);

  // 可前往的地点（从当前位置出发）
  const availableDestinations = useMemo(() => {
    const availableConnectionIds = connections
      .filter(
        (conn) =>
          conn.discovered &&
          ((conn.fromLocationId === currentLocationId && conn.bidirectional) ||
            (conn.toLocationId === currentLocationId && conn.bidirectional) ||
            conn.fromLocationId === currentLocationId)
      )
      .map((conn) => (conn.fromLocationId === currentLocationId ? conn.toLocationId : conn.fromLocationId));

    return locations.filter(
      (loc) => availableConnectionIds.includes(loc.id) && loc.discovered
    );
  }, [connections, currentLocationId, locations]);

  // 获取两个地点之间的连接
  const getConnection = (fromId: string, toId: string): LocationConnection | undefined => {
    return connections.find(
      (conn) =>
        (conn.fromLocationId === fromId && conn.toLocationId === toId) ||
        (conn.bidirectional && conn.fromLocationId === toId && conn.toLocationId === fromId)
    );
  };

  // 计算地点在地图上的位置样式
  const getLocationStyle = (location: MapLocation) => {
    return {
      left: `${location.position.x}%`,
      top: `${location.position.y}%`,
    };
  };

  // 前往地点
  const handleTravel = (locationId: string) => {
    if (!currentLocationId) return;
    const connection = getConnection(currentLocationId, locationId);
    if (connection) {
      console.log('前往地点:', locationId, '预计时间:', connection.travelTime, '分钟');
      // TODO: 实现移动逻辑
    }
  };

  // 格式化旅行时间
  const formatTravelTime = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes}分钟`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`;
  };

  // 空数据状态处理
  if (!mapData || locations.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>🗺️</div>
        <p>暂无地图数据</p>
        <p className={styles.emptyHint}>开始冒险后查看地图</p>
      </div>
    );
  }

  if (!character.id) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>🗺️</div>
        <p>暂无地图数据</p>
        <p className={styles.emptyHint}>创建角色后查看地图</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* 当前位置信息 */}
      <div className={styles.currentLocation}>
        <div className={styles.currentLocationHeader}>
          <span className={styles.currentLocationIcon}>
            {currentLocationData ? LOCATION_TYPE_ICONS[currentLocationData.type] : '📍'}
          </span>
          <div className={styles.currentLocationInfo}>
            <span className={styles.currentLocationLabel}>当前位置</span>
            <h3 className={styles.currentLocationName}>
              {currentLocationData?.name || currentLocation || '未知地点'}
            </h3>
          </div>
        </div>
        {currentLocationData && (
          <p className={styles.currentLocationDesc}>{currentLocationData.description}</p>
        )}
      </div>

      {/* 视图切换 */}
      <div className={styles.viewToggle}>
        <button
          className={[styles.toggleBtn, viewMode === 'map' && styles.toggleBtnActive].filter(Boolean).join(' ')}
          onClick={() => setViewMode('map')}
        >
          🗺️ 地图
        </button>
        <button
          className={[styles.toggleBtn, viewMode === 'list' && styles.toggleBtnActive].filter(Boolean).join(' ')}
          onClick={() => setViewMode('list')}
        >
          📋 列表
        </button>
      </div>

      {/* 地图视图 */}
      {viewMode === 'map' && (
        <div className={styles.mapContainer}>
          <div className={styles.mapCanvas}>
            {/* 地图背景 */}
            <div className={styles.mapBackground}>
              <div className={styles.mapGrid} />
            </div>

            {/* 连接线 */}
            <svg className={styles.connectionsLayer} viewBox="0 0 100 100" preserveAspectRatio="none">
              {connections
                .filter((conn) => conn.discovered)
                .map((conn) => {
                  const fromLoc = locations.find((l) => l.id === conn.fromLocationId);
                  const toLoc = locations.find((l) => l.id === conn.toLocationId);
                  if (!fromLoc || !toLoc) return null;

                  const isHighlighted =
                    conn.fromLocationId === currentLocationId || conn.toLocationId === currentLocationId;

                  return (
                    <line
                      key={conn.id}
                      x1={fromLoc.position.x}
                      y1={fromLoc.position.y}
                      x2={toLoc.position.x}
                      y2={toLoc.position.y}
                      className={[
                        styles.connectionLine,
                        conn.type === 'portal' && styles.connectionPortal,
                        isHighlighted && styles.connectionHighlighted,
                      ].filter(Boolean).join(' ')}
                    />
                  );
                })}
            </svg>

            {/* 地点标记 */}
            {locations.map((location) => {
              const isCurrentLocation = location.id === currentLocationId;
              const isSelected = location.id === selectedLocationId;
              const isAvailable = availableDestinations.some((dest) => dest.id === location.id);

              return (
                <button
                  key={location.id}
                  className={[
                    styles.locationMarker,
                    !location.discovered && styles.locationUndiscovered,
                    isCurrentLocation && styles.locationCurrent,
                    isSelected && styles.locationSelected,
                    isAvailable && styles.locationAvailable,
                  ].filter(Boolean).join(' ')}
                  style={getLocationStyle(location)}
                  onClick={() => setSelectedLocationId(location.id)}
                  disabled={!location.discovered}
                >
                  <span className={styles.markerIcon}>
                    {location.discovered ? LOCATION_TYPE_ICONS[location.type] : '❓'}
                  </span>
                  {location.discovered && (
                    <span className={styles.markerLabel}>{location.name}</span>
                  )}
                  {isCurrentLocation && <span className={styles.currentIndicator} />}
                </button>
              );
            })}
          </div>

          {/* 地图图例 */}
          <div className={styles.mapLegend}>
            <div className={styles.legendItem}>
              <span className={styles.legendIcon}>📍</span>
              <span className={styles.legendText}>当前位置</span>
            </div>
            <div className={styles.legendItem}>
              <span className={styles.legendIcon}>✨</span>
              <span className={styles.legendText}>可前往</span>
            </div>
            <div className={styles.legendItem}>
              <span className={styles.legendIcon}>❓</span>
              <span className={styles.legendText}>未探索</span>
            </div>
          </div>
        </div>
      )}

      {/* 列表视图 */}
      {viewMode === 'list' && (
        <div className={styles.listContainer}>
          {/* 可前往地点 */}
          <div className={styles.locationSection}>
            <h4 className={styles.sectionTitle}>
              <span className={styles.sectionIcon}>🚀</span>
              可前往的地点
            </h4>
            <div className={styles.locationList}>
              {availableDestinations.length === 0 ? (
                <div className={styles.emptyList}>
                  <span>暂无可前往的地点</span>
                </div>
              ) : (
                availableDestinations.map((location) => {
                  const connection = currentLocationId ? getConnection(currentLocationId, location.id) : undefined;
                  return (
                    <div
                      key={location.id}
                      className={[styles.locationCard, styles.locationCardAvailable].join(' ')}
                      onClick={() => setSelectedLocationId(location.id)}
                    >
                      <div className={styles.cardHeader}>
                        <span className={styles.cardIcon}>
                          {LOCATION_TYPE_ICONS[location.type]}
                        </span>
                        <div className={styles.cardInfo}>
                          <span className={styles.cardName}>{location.name}</span>
                          <span className={styles.cardType}>
                            {LOCATION_TYPE_NAMES[location.type] || location.type}
                          </span>
                        </div>
                        <div className={styles.travelInfo}>
                          <span className={styles.travelTime}>
                            {connection && formatTravelTime(connection.travelTime)}
                          </span>
                          <span className={styles.travelType}>
                            {connection && CONNECTION_TYPE_NAMES[connection.type]}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* 已探索地点 */}
          <div className={styles.locationSection}>
            <h4 className={styles.sectionTitle}>
              <span className={styles.sectionIcon}>✅</span>
              已探索地点 ({discoveredLocations.length})
            </h4>
            <div className={styles.locationList}>
              {discoveredLocations
                .filter((loc) => !availableDestinations.includes(loc))
                .map((location) => (
                  <div
                    key={location.id}
                    className={[
                      styles.locationCard,
                      location.id === currentLocationId && styles.locationCardCurrent,
                    ].filter(Boolean).join(' ')}
                    onClick={() => setSelectedLocationId(location.id)}
                  >
                    <div className={styles.cardHeader}>
                      <span className={styles.cardIcon}>
                        {LOCATION_TYPE_ICONS[location.type]}
                      </span>
                      <div className={styles.cardInfo}>
                        <span className={styles.cardName}>{location.name}</span>
                        <span className={styles.cardType}>
                          {LOCATION_TYPE_NAMES[location.type] || location.type}
                        </span>
                      </div>
                      {location.id === currentLocationId && (
                        <span className={styles.currentBadge}>当前位置</span>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* 未探索地点 */}
          <div className={styles.locationSection}>
            <h4 className={styles.sectionTitle}>
              <span className={styles.sectionIcon}>❓</span>
              未探索区域 ({undiscoveredLocations.length})
            </h4>
            <div className={styles.locationList}>
              {undiscoveredLocations.map((location) => (
                <div key={location.id} className={[styles.locationCard, styles.locationCardLocked].join(' ')}>
                  <div className={styles.cardHeader}>
                    <span className={styles.cardIcon}>❓</span>
                    <div className={styles.cardInfo}>
                      <span className={styles.cardName}>未知区域</span>
                      <span className={styles.cardType}>等待探索</span>
                    </div>
                    <span className={styles.lockedBadge}>🔒 未发现</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 地点详情面板 */}
      {selectedLocation && (
        <div className={styles.detailPanel}>
          <div className={styles.detailHeader}>
            <span className={styles.detailIcon}>
              {LOCATION_TYPE_ICONS[selectedLocation.type]}
            </span>
            <div className={styles.detailTitle}>
              <h4 className={styles.detailName}>{selectedLocation.name}</h4>
              <span className={styles.detailType}>
                {LOCATION_TYPE_NAMES[selectedLocation.type] || selectedLocation.type}
              </span>
            </div>
            <button className={styles.closeDetail} onClick={() => setSelectedLocationId(null)}>
              ✕
            </button>
          </div>

          <p className={styles.detailDescription}>{selectedLocation.description}</p>

          {/* 位置信息 */}
          <div className={styles.detailInfo}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>坐标</span>
              <span className={styles.infoValue}>
                ({selectedLocation.position.x}, {selectedLocation.position.y})
              </span>
            </div>
          </div>

          {/* 操作按钮 */}
          {availableDestinations.some((dest) => dest.id === selectedLocation.id) && (
            <div className={styles.detailActions}>
              <button
                className={styles.travelBtn}
                onClick={() => handleTravel(selectedLocation.id)}
              >
                🚀 前往此地
              </button>
            </div>
          )}

          {selectedLocation.id === currentLocationId && (
            <div className={styles.detailActions}>
              <span className={styles.alreadyHere}>📍 你已在此地</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MapPanel;
