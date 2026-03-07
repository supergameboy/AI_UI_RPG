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
 * 模拟地图数据（用于演示）
 */
const MOCK_LOCATIONS: MapLocation[] = [
  {
    id: 'loc_start',
    name: '新手村',
    type: 'village',
    position: { x: 50, y: 50 },
    description: '一个宁静的小村庄，是许多冒险者的起点。',
    discovered: true,
  },
  {
    id: 'loc_forest',
    name: '迷雾森林',
    type: 'wilderness',
    position: { x: 30, y: 35 },
    description: '一片神秘的森林，据说隐藏着古老的秘密。',
    discovered: true,
  },
  {
    id: 'loc_dungeon',
    name: '废弃矿坑',
    type: 'dungeon',
    position: { x: 70, y: 25 },
    description: '曾经繁荣的矿坑，现在充满了危险。',
    discovered: true,
  },
  {
    id: 'loc_city',
    name: '王都艾尔文',
    type: 'city',
    position: { x: 75, y: 60 },
    description: '繁华的王都，贸易和冒险的中心。',
    discovered: true,
  },
  {
    id: 'loc_lake',
    name: '月光湖',
    type: 'wilderness',
    position: { x: 25, y: 70 },
    description: '美丽的湖泊，夜晚月光倒映格外迷人。',
    discovered: false,
  },
  {
    id: 'loc_mountain',
    name: '龙脊山脉',
    type: 'wilderness',
    position: { x: 85, y: 15 },
    description: '险峻的山脉，传说有巨龙栖息。',
    discovered: false,
  },
  {
    id: 'loc_ruins',
    name: '古代遗迹',
    type: 'dungeon',
    position: { x: 45, y: 80 },
    description: '神秘的古代遗迹，等待探索。',
    discovered: false,
  },
  {
    id: 'loc_tower',
    name: '法师塔',
    type: 'building',
    position: { x: 60, y: 40 },
    description: '高耸的法师塔，魔法能量充沛。',
    discovered: true,
  },
];

/**
 * 模拟连接数据
 */
const MOCK_CONNECTIONS: LocationConnection[] = [
  {
    id: 'conn_1',
    fromLocationId: 'loc_start',
    toLocationId: 'loc_forest',
    type: 'road',
    travelTime: 30,
    bidirectional: true,
    discovered: true,
  },
  {
    id: 'conn_2',
    fromLocationId: 'loc_start',
    toLocationId: 'loc_city',
    type: 'road',
    travelTime: 60,
    bidirectional: true,
    discovered: true,
  },
  {
    id: 'conn_3',
    fromLocationId: 'loc_forest',
    toLocationId: 'loc_dungeon',
    type: 'road',
    travelTime: 45,
    bidirectional: true,
    discovered: true,
  },
  {
    id: 'conn_4',
    fromLocationId: 'loc_city',
    toLocationId: 'loc_tower',
    type: 'road',
    travelTime: 20,
    bidirectional: true,
    discovered: true,
  },
  {
    id: 'conn_5',
    fromLocationId: 'loc_tower',
    toLocationId: 'loc_dungeon',
    type: 'portal',
    travelTime: 5,
    bidirectional: true,
    discovered: true,
  },
  {
    id: 'conn_6',
    fromLocationId: 'loc_start',
    toLocationId: 'loc_lake',
    type: 'road',
    travelTime: 40,
    bidirectional: true,
    discovered: false,
  },
  {
    id: 'conn_7',
    fromLocationId: 'loc_city',
    toLocationId: 'loc_mountain',
    type: 'road',
    travelTime: 90,
    bidirectional: true,
    discovered: false,
  },
  {
    id: 'conn_8',
    fromLocationId: 'loc_lake',
    toLocationId: 'loc_ruins',
    type: 'hidden',
    travelTime: 60,
    bidirectional: true,
    discovered: false,
  },
];

/**
 * 地图面板组件
 * 显示世界地图、当前位置和可前往的地点列表
 */
export const MapPanel: React.FC = () => {
  const character = useGameStore((state) => state.character);
  const currentLocation = useGameStore((state) => state.currentLocation);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');

  // 使用模拟数据
  const locations = MOCK_LOCATIONS;
  const connections = MOCK_CONNECTIONS;

  // 当前位置ID（模拟）
  const currentLocationId = currentLocation ? 'loc_start' : 'loc_start';

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
                  const connection = getConnection(currentLocationId, location.id);
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
