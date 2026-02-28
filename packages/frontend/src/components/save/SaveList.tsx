import React from 'react';
import { SaveCard } from './SaveCard';
import { Save } from '../../services/saveService';
import { Icon } from '../common';
import styles from './SaveList.module.css';

export interface SaveListProps {
  saves: Save[];
  total: number;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLoad: (save: Save) => void;
  onDelete: (save: Save) => void;
  onExport: (save: Save) => void;
  selectedId?: string;
  onSelect?: (save: Save) => void;
  loading?: boolean;
}

export const SaveList: React.FC<SaveListProps> = ({
  saves,
  total,
  page,
  limit,
  onPageChange,
  onLoad,
  onDelete,
  onExport,
  selectedId,
  onSelect,
  loading,
}) => {
  const totalPages = Math.ceil(total / limit);

  const handlePrevPage = () => {
    if (page > 1) {
      onPageChange(page - 1);
    }
  };

  const handleNextPage = () => {
    if (page < totalPages) {
      onPageChange(page + 1);
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <Icon name="loading" size={32} />
        <span>加载中...</span>
      </div>
    );
  }

  if (saves.length === 0) {
    return (
      <div className={styles.empty}>
        <Icon name="folder" size={48} />
        <p>暂无存档</p>
        <p className={styles.hint}>开始新游戏后可以保存进度</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.list}>
        {saves.map((save) => (
          <SaveCard
            key={save.id}
            save={save}
            selected={selectedId === save.id}
            onClick={() => onSelect?.(save)}
            onLoad={() => onLoad(save)}
            onDelete={() => onDelete(save)}
            onExport={() => onExport(save)}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            className={styles.pageBtn}
            onClick={handlePrevPage}
            disabled={page <= 1}
          >
            <Icon name="chevron-left" size={16} />
          </button>
          
          <div className={styles.pageInfo}>
            <span>{page}</span>
            <span className={styles.separator}>/</span>
            <span>{totalPages}</span>
          </div>

          <button
            className={styles.pageBtn}
            onClick={handleNextPage}
            disabled={page >= totalPages}
          >
            <Icon name="chevron-right" size={16} />
          </button>

          <span className={styles.total}>
            共 {total} 个存档
          </span>
        </div>
      )}
    </div>
  );
};
