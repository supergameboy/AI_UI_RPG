import React, { useState, useEffect, useRef } from 'react';
import { Button, Icon, Panel, ConfirmDialog } from '../common';
import { useAgentStore } from '../../stores';
import { bindingService } from '../../services/bindingService';
import { agentService } from '../../services/agentService';
import type { Binding } from '@ai-rpg/shared';
import { BindingEditModal } from './BindingEditModal';
import type { BindingFormData } from './types';
import styles from './BindingConfigPanel.module.css';

export interface BindingConfigPanelProps {
  onClose?: () => void;
}

export const BindingConfigPanel: React.FC<BindingConfigPanelProps> = ({ onClose }) => {
  const {
    bindings,
    bindingsLoading,
    saving,
    error,
    fetchBindings,
    updateBinding,
    toggleBinding,
    clearError,
  } = useAgentStore();

  // 使用 ref 存储 store 方法避免依赖变化
  const storeRef = useRef({ fetchBindings });
  storeRef.current = { fetchBindings };

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingBinding, setEditingBinding] = useState<Binding | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; binding: Binding | null }>({
    open: false,
    binding: null,
  });
  const [localError, setLocalError] = useState<string | null>(null);

  // 初始加载 - 只运行一次
  useEffect(() => {
    storeRef.current.fetchBindings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = () => {
    setEditingBinding(null);
    setEditModalOpen(true);
  };

  const handleEdit = (binding: Binding) => {
    setEditingBinding(binding);
    setEditModalOpen(true);
  };

  const handleDelete = (binding: Binding) => {
    setDeleteConfirm({ open: true, binding });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm.binding) return;

    try {
      await bindingService.deleteBinding(deleteConfirm.binding.id);
      await fetchBindings();
      setDeleteConfirm({ open: false, binding: null });
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : '删除绑定失败');
    }
  };

  const handleToggle = async (binding: Binding) => {
    try {
      await toggleBinding(binding.id, !binding.enabled);
    } catch {
      // Error is handled in store
    }
  };

  const handleSave = async (data: BindingFormData) => {
    try {
      if (editingBinding) {
        // Update existing binding
        await updateBinding(editingBinding.id, {
          agentId: data.agentId,
          match: data.match,
          priority: data.priority,
          enabled: data.enabled,
          description: data.description,
        });
      } else {
        // Create new binding
        await bindingService.createBinding({
          agentId: data.agentId,
          match: data.match,
          priority: data.priority,
          enabled: data.enabled,
          description: data.description,
        });
        await storeRef.current.fetchBindings();
      }
      setEditModalOpen(false);
      setEditingBinding(null);
    } catch (err) {
      throw err;
    }
  };

  const handleMoveUp = async (binding: Binding, index: number) => {
    if (index <= 0) return;
    const updates = [
      { id: binding.id, priority: bindings[index - 1].priority + 1 },
    ];
    try {
      await bindingService.updatePriorities(updates);
      await storeRef.current.fetchBindings();
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : '调整优先级失败');
    }
  };

  const handleMoveDown = async (binding: Binding, index: number) => {
    if (index >= bindings.length - 1) return;
    const updates = [
      { id: binding.id, priority: bindings[index + 1].priority - 1 },
    ];
    try {
      await bindingService.updatePriorities(updates);
      await storeRef.current.fetchBindings();
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : '调整优先级失败');
    }
  };

  const handleReset = async () => {
    try {
      await bindingService.resetBindings();
      await storeRef.current.fetchBindings();
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : '重置绑定失败');
    }
  };

  const getMatchDescription = (binding: Binding): string => {
    const parts: string[] = [];
    
    if (binding.match.messageType) {
      parts.push(`消息类型: ${binding.match.messageType}`);
    }
    
    if (binding.match.context) {
      const contextParts = Object.entries(binding.match.context)
        .map(([key, value]) => `${key}=${String(value)}`);
      if (contextParts.length > 0) {
        parts.push(`上下文: ${contextParts.join(', ')}`);
      }
    }
    
    if (binding.match.custom && binding.match.custom.length > 0) {
      const customParts = binding.match.custom.map(
        (c) => `${c.field} ${c.operator} ${String(c.value)}`
      );
      parts.push(`自定义: ${customParts.join(', ')}`);
    }
    
    return parts.length > 0 ? parts.join(' | ') : '无匹配条件';
  };

  const sortedBindings = [...bindings].sort((a, b) => b.priority - a.priority);

  const displayError = error || localError;

  const handleClearError = () => {
    clearError();
    setLocalError(null);
  };

  if (bindingsLoading && bindings.length === 0) {
    return (
      <Panel className={styles.container}>
        <div className={styles.loading}>
          <Icon name="loading" size={32} />
          <span>加载中...</span>
        </div>
      </Panel>
    );
  }

  return (
    <Panel className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>绑定配置</h2>
        <div className={styles.headerActions}>
          <Button variant="secondary" size="small" onClick={handleReset} disabled={saving}>
            重置默认
          </Button>
          <Button variant="primary" size="small" onClick={handleCreate} disabled={saving}>
            <Icon name="plus" size={16} />
            新建绑定
          </Button>
          {onClose && (
            <button className={styles.closeBtn} onClick={onClose}>
              <Icon name="close" size={20} />
            </button>
          )}
        </div>
      </div>

      {displayError && (
        <div className={styles.error}>
          <span>{displayError}</span>
          <button onClick={handleClearError}>
            <Icon name="close" size={16} />
          </button>
        </div>
      )}

      <div className={styles.content}>
        <div className={styles.tableHeader}>
          <div className={styles.colPriority}>优先级</div>
          <div className={styles.colId}>ID</div>
          <div className={styles.colAgent}>目标 Agent</div>
          <div className={styles.colMatch}>匹配条件</div>
          <div className={styles.colStatus}>状态</div>
          <div className={styles.colActions}>操作</div>
        </div>

        <div className={styles.bindingList}>
          {sortedBindings.map((binding, index) => (
            <div
              key={binding.id}
              className={[styles.bindingRow, !binding.enabled && styles.disabled].filter(Boolean).join(' ')}
            >
              <div className={styles.colPriority}>
                <div className={styles.priorityControls}>
                  <button
                    className={styles.priorityBtn}
                    onClick={() => handleMoveUp(binding, index)}
                    disabled={index === 0 || saving}
                    title="上移"
                  >
                    <Icon name="chevron-up" size={14} />
                  </button>
                  <span className={styles.priorityValue}>{binding.priority}</span>
                  <button
                    className={styles.priorityBtn}
                    onClick={() => handleMoveDown(binding, index)}
                    disabled={index === sortedBindings.length - 1 || saving}
                    title="下移"
                  >
                    <Icon name="chevron-down" size={14} />
                  </button>
                </div>
              </div>

              <div className={styles.colId}>
                <span className={styles.bindingId}>{binding.id}</span>
                {binding.description && (
                  <span className={styles.bindingDesc}>{binding.description}</span>
                )}
              </div>

              <div className={styles.colAgent}>
                <span className={styles.agentBadge}>
                  {agentService.getAgentTypeName(binding.agentId)}
                </span>
                <span className={styles.agentType}>{binding.agentId}</span>
              </div>

              <div className={styles.colMatch}>
                <span className={styles.matchText}>{getMatchDescription(binding)}</span>
              </div>

              <div className={styles.colStatus}>
                <button
                  className={[styles.statusToggle, binding.enabled && styles.enabled].filter(Boolean).join(' ')}
                  onClick={() => handleToggle(binding)}
                  disabled={saving}
                  title={binding.enabled ? '点击禁用' : '点击启用'}
                >
                  {binding.enabled ? '启用' : '禁用'}
                </button>
              </div>

              <div className={styles.colActions}>
                <button
                  className={styles.actionBtn}
                  onClick={() => handleEdit(binding)}
                  title="编辑"
                >
                  <Icon name="edit" size={16} />
                </button>
                <button
                  className={[styles.actionBtn, styles.deleteBtn].join(' ')}
                  onClick={() => handleDelete(binding)}
                  title="删除"
                >
                  <Icon name="delete" size={16} />
                </button>
              </div>
            </div>
          ))}

          {bindings.length === 0 && (
            <div className={styles.empty}>
              <Icon name="info" size={32} />
              <span>暂无绑定配置</span>
              <Button variant="primary" size="small" onClick={handleCreate}>
                创建第一个绑定
              </Button>
            </div>
          )}
        </div>
      </div>

      <BindingEditModal
        open={editModalOpen}
        binding={editingBinding}
        onClose={() => {
          setEditModalOpen(false);
          setEditingBinding(null);
        }}
        onSave={handleSave}
      />

      <ConfirmDialog
        open={deleteConfirm.open}
        title="确认删除"
        message={`确定要删除绑定 "${deleteConfirm.binding?.id}" 吗？此操作不可撤销。`}
        confirmText="删除"
        cancelText="取消"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteConfirm({ open: false, binding: null })}
      />
    </Panel>
  );
};
