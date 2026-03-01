import React, { useEffect, useState, useCallback } from 'react';
import { Button, Icon, Panel, ConfirmDialog } from '../common';
import { useTemplateStore } from '../../stores/templateStore';
import { useGameStore } from '../../stores/gameStore';
import type { StoryTemplate } from '@ai-rpg/shared';
import { TemplateEditor } from './TemplateEditor';
import styles from './TemplateManager.module.css';

const GAME_MODE_LABELS: Record<string, string> = {
  text_adventure: '文字冒险',
  turn_based_rpg: '回合制RPG',
  visual_novel: '视觉小说',
  dynamic_combat: '动态战斗',
};

const PRESET_TEMPLATE_IDS = [
  'template-medieval-fantasy',
  'template-modern-romance',
  'template-lovecraft-horror',
  'template-cyberpunk-mercenary',
];

const isPresetTemplate = (id: string) => PRESET_TEMPLATE_IDS.includes(id);

export const TemplateManager: React.FC = () => {
  const {
    templates,
    isLoading,
    error,
    fetchTemplates,
    createNewTemplate,
    setEditingTemplate,
    duplicateTemplate,
    deleteTemplate,
    isEditing,
    clearEditingTemplate,
  } = useTemplateStore();
  const returnToMenu = useGameStore((state) => state.returnToMenu);

  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    templateId: string | null;
    templateName: string;
  }>({
    open: false,
    templateId: null,
    templateName: '',
  });

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleCreateNew = useCallback(() => {
    createNewTemplate();
  }, [createNewTemplate]);

  const handleView = useCallback((template: StoryTemplate) => {
    setEditingTemplate(template, true);
  }, [setEditingTemplate]);

  const handleEdit = useCallback((template: StoryTemplate) => {
    setEditingTemplate(template, false);
  }, [setEditingTemplate]);

  const handleDuplicate = useCallback(async (template: StoryTemplate) => {
    try {
      await duplicateTemplate(template);
    } catch (err) {
      console.error('Failed to duplicate template:', err);
    }
  }, [duplicateTemplate]);

  const handleDeleteClick = useCallback((template: StoryTemplate) => {
    setDeleteConfirm({
      open: true,
      templateId: template.id,
      templateName: template.name,
    });
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (deleteConfirm.templateId) {
      try {
        await deleteTemplate(deleteConfirm.templateId);
      } catch (err) {
        console.error('Failed to delete template:', err);
      }
    }
    setDeleteConfirm({ open: false, templateId: null, templateName: '' });
  }, [deleteTemplate, deleteConfirm.templateId]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteConfirm({ open: false, templateId: null, templateName: '' });
  }, []);

  const handleBack = useCallback(() => {
    returnToMenu();
  }, [returnToMenu]);

  const handleEditorBack = useCallback(() => {
    clearEditingTemplate();
  }, [clearEditingTemplate]);

  const renderLoading = () => (
    <div className={styles.loading}>
      <div className={styles.spinner} />
      <span>正在加载模板...</span>
    </div>
  );

  const renderError = () => (
    <div className={styles.error}>
      <Icon name="warning" size={32} />
      <span>{error || '加载模板失败'}</span>
      <Button variant="secondary" onClick={fetchTemplates}>
        重试
      </Button>
    </div>
  );

  const renderEmpty = () => (
    <div className={styles.empty}>
      <Icon name="folder" size={48} />
      <span>暂无模板</span>
      <Button variant="primary" onClick={handleCreateNew} icon={<Icon name="plus" size={16} />}>
        创建新模板
      </Button>
    </div>
  );

  const renderTemplateCard = (template: StoryTemplate) => {
    const isPreset = isPresetTemplate(template.id);

    return (
      <div key={template.id} className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.cardTitleRow}>
            <h3 className={styles.cardTitle}>{template.name}</h3>
            <span className={isPreset ? styles.presetBadge : styles.customBadge}>
              {isPreset ? '内置' : '自定义'}
            </span>
          </div>
          <span className={styles.gameMode}>
            {GAME_MODE_LABELS[template.gameMode] || template.gameMode}
          </span>
        </div>

        <p className={styles.cardDescription}>{template.description || '暂无描述'}</p>

        {template.tags.length > 0 && (
          <div className={styles.tags}>
            {template.tags.map((tag) => (
              <span key={tag} className={styles.tag}>
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className={styles.cardFooter}>
          <span className={styles.author}>作者: {template.author}</span>
          <div className={styles.actions}>
            {isPreset ? (
              <>
                <Button
                  variant="ghost"
                  size="small"
                  onClick={() => handleView(template)}
                  icon={<Icon name="eye" size={14} />}
                >
                  查看
                </Button>
                <Button
                  variant="secondary"
                  size="small"
                  onClick={() => handleDuplicate(template)}
                  icon={<Icon name="copy" size={14} />}
                >
                  复制
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="small"
                  onClick={() => handleEdit(template)}
                  icon={<Icon name="edit" size={14} />}
                >
                  编辑
                </Button>
                <Button
                  variant="secondary"
                  size="small"
                  onClick={() => handleDuplicate(template)}
                  icon={<Icon name="copy" size={14} />}
                >
                  复制
                </Button>
                <Button
                  variant="danger"
                  size="small"
                  onClick={() => handleDeleteClick(template)}
                  icon={<Icon name="trash" size={14} />}
                >
                  删除
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (isEditing) {
    return <TemplateEditor onBack={handleEditorBack} />;
  }

  return (
    <Panel className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>模板管理</h2>
        <div className={styles.headerActions}>
          <Button
            variant="primary"
            size="small"
            onClick={handleCreateNew}
            icon={<Icon name="plus" size={16} />}
          >
            新建模板
          </Button>
          <Button
            variant="secondary"
            size="small"
            onClick={handleBack}
            icon={<Icon name="chevron-left" size={16} />}
          >
            返回主菜单
          </Button>
        </div>
      </div>

      <div className={styles.content}>
        {isLoading && renderLoading()}
        {error && !isLoading && renderError()}
        {!isLoading && !error && templates.length === 0 && renderEmpty()}
        {!isLoading && !error && templates.length > 0 && (
          <div className={styles.grid}>
            {templates.map(renderTemplateCard)}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={deleteConfirm.open}
        title="删除模板"
        message={`确定要删除模板"${deleteConfirm.templateName}"吗？此操作不可撤销。`}
        confirmText="删除"
        cancelText="取消"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </Panel>
  );
};

export default TemplateManager;
