import React, { useState, useMemo } from 'react';
import { useGameStore } from '../../stores/gameStore';
import type { MapLocation, GameMap } from '@ai-rpg/shared';
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
  town: '城镇',
  landmark: '地标',
  shop: '商店',
  inn: '旅店',
  quest: '任务地点',
  other: '其他',
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
  town: '🏘️',
  landmark: '🏔️',
  shop: '🏪',
  inn: '🏨',
  quest: '❗',
  other: '📍',
};

export const MapPanel: React.FC = () => {
  const character = useGameStore((state) => state.character);
  const mapState = useGameStore((state) => state.map);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');

  const currentMap: GameMap | null = mapState.mapData;
  const locations: MapLocation[] = currentMap?.locations || [];
  const connections = currentMap?.connections || [];

  const currentLocationId = mapState.currentLocationId;

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

  const availableDestinations = useMemo(() => {
    if (!currentLocationId) return [];
    
    const availableConnectionIds = connections
      .filter((conn) => {
        const isFromCurrent = conn.from === currentLocationId;
        const isToCurrent = conn.to === currentLocationId;
        const isBidirectional = conn.type === 'bidirectional';
        return isFromCurrent || (isToCurrent && isBidirectional);
      })
      .map((conn) => conn.from === currentLocationId ? conn.to : conn.from);

    return locations.filter(
      (loc) => availableConnectionIds.includes(loc.id) && loc.discovered
    );
  }, [connections, currentLocationId, locations]);

  const handleTravel = (locationId: string) => {
    console.log('前往地点:', locationId);
    setSelectedLocationId(null);
  };

  const getLocationStyle = (location: MapLocation) => {
    return {
      left: `${location.position.x}%`,
      top: `${location.position.y}%`,
    };
  };

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
              {currentLocationData?.name || '未知地点'}
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
              {connections.map((conn, index) => {
                const fromLoc = locations.find((l) => l.id === conn.from);
                const toLoc = locations.find((l) => l.id === conn.to);
                if (!fromLoc || !toLoc) return null;

                const isHighlighted =
                  conn.from === currentLocationId || conn.to === currentLocationId;

                return (
                  <line
                    key={`conn_${index}`}
                    x1={fromLoc.position.x}
                    y1={fromLoc.position.y}
                    x2={toLoc.position.x}
                    y2={toLoc.position.y}
                    className={[
                      styles.connectionLine,
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
                availableDestinations.map((location) => (
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
                    </div>
                  </div>
                ))
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
