import React from 'react';
import { Icon } from '../common';
import { Save } from '../../services/saveService';
import styles from './SaveCard.module.css';

export interface SaveCardProps {
  save: Save;
  onClick?: () => void;
  onLoad?: () => void;
  onDelete?: () => void;
  onExport?: () => void;
  selected?: boolean;
}

const GAME_MODE_LABELS: Record<string, string> = {
  text_adventure: '文字冒险',
  turn_based_rpg: '回合制RPG',
  visual_novel: '视觉小说',
  dynamic_combat: '动态战斗',
};

export const SaveCard: React.FC<SaveCardProps> = ({
  save,
  onClick,
  onLoad,
  onDelete,
  onExport,
  selected,
}) => {
  const formatPlayTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}小时${minutes}分钟`;
    }
    if (minutes > 0) {
      return `${minutes}分钟`;
    }
    return `${seconds}秒`;
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleActionClick = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
  };

  return (
    <div
      className={`${styles.card} ${selected ? styles.selected : ''}`}
      onClick={onClick}
    >
      <div className={styles.header}>
        <h3 className={styles.name}>{save.name}</h3>
        <span className={styles.mode}>{GAME_MODE_LABELS[save.game_mode] || save.game_mode}</span>
      </div>

      <div className={styles.info}>
        <div className={styles.infoItem}>
          <Icon name="clock" size={14} />
          <span>{formatPlayTime(save.play_time)}</span>
        </div>
        <div className={styles.infoItem}>
          <Icon name="calendar" size={14} />
          <span>{formatDate(save.updated_at)}</span>
        </div>
      </div>

      {save.current_location && (
        <div className={styles.location}>
          <Icon name="map" size={14} />
          <span>{save.current_location}</span>
        </div>
      )}

      <div className={styles.actions}>
        <button
          className={styles.actionBtn}
          onClick={(e) => handleActionClick(e, onLoad!)}
          disabled={!onLoad}
          title="加载存档"
        >
          <Icon name="load" size={16} />
        </button>
        <button
          className={styles.actionBtn}
          onClick={(e) => handleActionClick(e, onExport!)}
          disabled={!onExport}
          title="导出存档"
        >
          <Icon name="download" size={16} />
        </button>
        <button
          className={`${styles.actionBtn} ${styles.deleteBtn}`}
          onClick={(e) => handleActionClick(e, onDelete!)}
          disabled={!onDelete}
          title="删除存档"
        >
          <Icon name="delete" size={16} />
        </button>
      </div>
    </div>
  );
};
