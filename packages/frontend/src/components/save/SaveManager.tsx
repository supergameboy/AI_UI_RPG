import React, { useState, useEffect, useCallback } from 'react';
import { Button, Icon, Panel, ConfirmDialog } from '../common';
import { SaveList } from './SaveList';
import { SaveForm } from './SaveForm';
import { saveService, Save, SaveQueryOptions } from '../../services/saveService';
import styles from './SaveManager.module.css';

export interface SaveManagerProps {
  onClose?: () => void;
  onLoad?: (save: Save) => void;
  onSave?: (name: string) => Promise<void>;
  mode?: 'load' | 'save' | 'manage';
}

const GAME_MODES = [
  { value: '', label: '全部模式' },
  { value: 'text_adventure', label: '文字冒险' },
  { value: 'turn_based_rpg', label: '回合制RPG' },
  { value: 'visual_novel', label: '视觉小说' },
  { value: 'dynamic_combat', label: '动态战斗' },
];

export const SaveManager: React.FC<SaveManagerProps> = ({
  onClose,
  onLoad,
  onSave,
  mode = 'manage',
}) => {
  const [saves, setSaves] = useState<Save[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [selectedSave, setSelectedSave] = useState<Save | null>(null);
  const [filterMode, setFilterMode] = useState('');
  
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showLoadConfirm, setShowLoadConfirm] = useState(false);
  const [saveToDelete, setSaveToDelete] = useState<Save | null>(null);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);

  const fetchSaves = useCallback(async () => {
    setLoading(true);
    try {
      const options: SaveQueryOptions = { page, limit };
      if (filterMode) {
        options.template_id = filterMode;
      }
      const result = await saveService.getSaves(options);
      setSaves(result.saves);
      setTotal(result.total);
    } catch (error) {
      console.error('Failed to fetch saves:', error);
    } finally {
      setLoading(false);
    }
  }, [page, limit, filterMode]);

  useEffect(() => {
    fetchSaves();
  }, [fetchSaves]);

  const handleLoad = (save: Save) => {
    setSelectedSave(save);
    setShowLoadConfirm(true);
  };

  const confirmLoad = () => {
    if (selectedSave && onLoad) {
      onLoad(selectedSave);
    }
    setShowLoadConfirm(false);
    setSelectedSave(null);
  };

  const handleDelete = (save: Save) => {
    setSaveToDelete(save);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!saveToDelete) return;
    
    try {
      await saveService.deleteSave(saveToDelete.id);
      await fetchSaves();
    } catch (error) {
      console.error('Failed to delete save:', error);
    } finally {
      setShowDeleteConfirm(false);
      setSaveToDelete(null);
    }
  };

  const handleExport = async (save: Save) => {
    try {
      await saveService.exportSave(save.id);
    } catch (error) {
      console.error('Failed to export save:', error);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      await saveService.importSave(file);
      await fetchSaves();
    } catch (error) {
      console.error('Failed to import save:', error);
      alert('导入失败：文件格式不正确');
    } finally {
      setImporting(false);
      event.target.value = '';
    }
  };

  const handleSave = async (name: string) => {
    if (!onSave) return;
    
    setSaving(true);
    try {
      await onSave(name);
      setShowSaveForm(false);
      await fetchSaves();
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterMode(e.target.value);
    setPage(1);
  };

  return (
    <Panel className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          {mode === 'load' ? '加载存档' : mode === 'save' ? '保存游戏' : '存档管理'}
        </h2>
        {onClose && (
          <button className={styles.closeBtn} onClick={onClose}>
            <Icon name="close" size={20} />
          </button>
        )}
      </div>

      <div className={styles.toolbar}>
        <select
          className={styles.filter}
          value={filterMode}
          onChange={handleFilterChange}
        >
          {GAME_MODES.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>

        <div className={styles.actions}>
          {mode === 'save' && onSave && (
            <Button
              variant="primary"
              size="small"
              onClick={() => setShowSaveForm(true)}
              icon={<Icon name="save" size={16} />}
            >
              保存
            </Button>
          )}
          
          <label className={styles.importLabel}>
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className={styles.importInput}
              disabled={importing}
            />
            <Button
              variant="secondary"
              size="small"
              as="span"
              icon={<Icon name="upload" size={16} />}
              disabled={importing}
            >
              {importing ? '导入中...' : '导入'}
            </Button>
          </label>
        </div>
      </div>

      <div className={styles.content}>
        <SaveList
          saves={saves}
          total={total}
          page={page}
          limit={limit}
          onPageChange={setPage}
          onLoad={handleLoad}
          onDelete={handleDelete}
          onExport={handleExport}
          selectedId={selectedSave?.id}
          onSelect={setSelectedSave}
          loading={loading}
        />
      </div>

      {showSaveForm && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>保存游戏</h3>
            <SaveForm
              onSubmit={handleSave}
              onCancel={() => setShowSaveForm(false)}
              loading={saving}
            />
          </div>
        </div>
      )}

      <ConfirmDialog
        open={showLoadConfirm}
        title="加载存档"
        message={`确定要加载存档"${selectedSave?.name}"吗？当前未保存的进度将丢失。`}
        confirmText="加载"
        cancelText="取消"
        onConfirm={confirmLoad}
        onCancel={() => {
          setShowLoadConfirm(false);
          setSelectedSave(null);
        }}
      />

      <ConfirmDialog
        open={showDeleteConfirm}
        title="删除存档"
        message={`确定要删除存档"${saveToDelete?.name}"吗？此操作不可撤销。`}
        confirmText="删除"
        cancelText="取消"
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setSaveToDelete(null);
        }}
      />
    </Panel>
  );
};
