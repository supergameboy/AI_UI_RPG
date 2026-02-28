import React from 'react';
import { useUIStore } from '../../stores';
import styles from './MiniMap.module.css';

export const MiniMap: React.FC = () => {
  const { openPanel } = useUIStore();

  const handleWorldMapClick = () => {
    openPanel('map');
  };

  return (
    <div className={styles.miniMap}>
      <div className={styles.mapArea}>
        <div className={styles.placeholder}>
          <span>小地图</span>
        </div>
      </div>
      <button className={styles.worldMapBtn} onClick={handleWorldMapClick}>
        [世界地图]
      </button>
    </div>
  );
};
