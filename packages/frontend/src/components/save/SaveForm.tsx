import React, { useState, useEffect } from 'react';
import { Button, Input } from '../common';
import styles from './SaveForm.module.css';

export interface SaveFormProps {
  initialName?: string;
  onSubmit: (name: string) => void;
  onCancel: () => void;
  loading?: boolean;
}

export const SaveForm: React.FC<SaveFormProps> = ({
  initialName = '',
  onSubmit,
  onCancel,
  loading,
}) => {
  const [name, setName] = useState(initialName);

  useEffect(() => {
    setName(initialName);
  }, [initialName]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(name.trim());
    }
  };

  const generateDefaultName = () => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
    });
    const timeStr = now.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    });
    return `存档 ${dateStr} ${timeStr}`;
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.field}>
        <label className={styles.label}>存档名称</label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={generateDefaultName()}
          autoFocus
          disabled={loading}
        />
      </div>

      <div className={styles.actions}>
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={loading}
        >
          取消
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={loading}
        >
          {loading ? '保存中...' : '保存'}
        </Button>
      </div>
    </form>
  );
};
