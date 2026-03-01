import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Button, Icon, ConfirmDialog } from '../common';
import { useTemplateStore } from '../../stores/templateStore';
import { templateService } from '../../services/templateService';
import type { StoryTemplate, RaceDefinition, ClassDefinition, BackgroundDefinition, AttributeDefinition, NumericalComplexity, SpecialRules, WorldSetting } from '@ai-rpg/shared';
import {
  BasicInfoEditor,
  WorldSettingEditor,
  RaceEditor,
  ClassEditor,
  BackgroundEditor,
  RulesEditor,
  AIConstraintsEditor,
  StartingSceneEditor,
  UIThemeEditor,
  UILayoutEditor,
  AttributeEditor,
} from './editors';
import { TemplatePreview } from './TemplatePreview';
import styles from './TemplateEditor.module.css';

export interface TemplateEditorProps {
  onBack: () => void;
}

export type EditorModule = 'basic' | 'world' | 'race' | 'class' | 'background' | 'attributes' | 'rules' | 'ai' | 'scene' | 'uiTheme' | 'uiLayout';

interface NavItem {
  id: EditorModule;
  label: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'basic', label: '基础信息', icon: 'info' },
  { id: 'world', label: '世界观设定', icon: 'map' },
  { id: 'race', label: '种族编辑', icon: 'character' },
  { id: 'class', label: '职业编辑', icon: 'skills' },
  { id: 'background', label: '背景编辑', icon: 'quests' },
  { id: 'attributes', label: '属性编辑', icon: 'skills' },
  { id: 'rules', label: '规则配置', icon: 'settings' },
  { id: 'ai', label: 'AI约束', icon: 'developer' },
  { id: 'scene', label: '初始场景', icon: 'play' },
  { id: 'uiTheme', label: 'UI主题', icon: 'palette' },
  { id: 'uiLayout', label: '界面布局', icon: 'layout' },
];

export const TemplateEditor: React.FC<TemplateEditorProps> = ({ onBack }) => {
  const [activeModule, setActiveModule] = useState<EditorModule>('basic');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const originalTemplateRef = useRef<string>('');

  const {
    editingTemplate,
    isEditing,
    isReadOnly,
    saveTemplate,
    clearEditingTemplate,
    updateEditingTemplate,
  } = useTemplateStore();

  useEffect(() => {
    if (editingTemplate) {
      originalTemplateRef.current = JSON.stringify(editingTemplate);
    }
  }, []);

  const hasUnsavedChanges = useCallback(() => {
    if (!editingTemplate) return false;
    return JSON.stringify(editingTemplate) !== originalTemplateRef.current;
  }, [editingTemplate]);

  const handleSave = useCallback(async () => {
    if (!editingTemplate || isReadOnly) return;

    setIsSaving(true);
    try {
      await saveTemplate();
      originalTemplateRef.current = JSON.stringify(editingTemplate);
      clearEditingTemplate();
      onBack();
    } catch (error) {
      console.error('Failed to save template:', error);
    } finally {
      setIsSaving(false);
    }
  }, [editingTemplate, isReadOnly, saveTemplate, clearEditingTemplate, onBack]);

  const handleCancel = useCallback(() => {
    if (hasUnsavedChanges() && !isReadOnly) {
      setShowConfirmDialog(true);
    } else {
      clearEditingTemplate();
      onBack();
    }
  }, [hasUnsavedChanges, isReadOnly, clearEditingTemplate, onBack]);

  const handleConfirmDiscard = useCallback(() => {
    setShowConfirmDialog(false);
    clearEditingTemplate();
    onBack();
  }, [clearEditingTemplate, onBack]);

  const handleCancelDiscard = useCallback(() => {
    setShowConfirmDialog(false);
  }, []);

  const handleNavClick = useCallback((module: EditorModule) => {
    setActiveModule(module);
  }, []);

  const handleUpdateTemplate = useCallback(
    (updates: Partial<StoryTemplate>) => {
      updateEditingTemplate(updates);
    },
    [updateEditingTemplate]
  );

  const handleUpdateWorldSetting = useCallback(
    (updates: Partial<StoryTemplate['worldSetting']>) => {
      updateEditingTemplate({
        worldSetting: { ...useTemplateStore.getState().editingTemplate!.worldSetting, ...updates },
      });
    },
    [updateEditingTemplate]
  );

  const handleUpdateRaces = useCallback(
    (races: RaceDefinition[]) => {
      const template = useTemplateStore.getState().editingTemplate;
      if (!template) return;
      updateEditingTemplate({
        characterCreation: { ...template.characterCreation, races },
      });
    },
    [updateEditingTemplate]
  );

  const handleUpdateClasses = useCallback(
    (classes: ClassDefinition[]) => {
      const template = useTemplateStore.getState().editingTemplate;
      if (!template) return;
      updateEditingTemplate({
        characterCreation: { ...template.characterCreation, classes },
      });
    },
    [updateEditingTemplate]
  );

  const handleUpdateBackgrounds = useCallback(
    (backgrounds: BackgroundDefinition[]) => {
      const template = useTemplateStore.getState().editingTemplate;
      if (!template) return;
      updateEditingTemplate({
        characterCreation: { ...template.characterCreation, backgrounds },
      });
    },
    [updateEditingTemplate]
  );

  const handleUpdateAttributes = useCallback(
    (attributes: AttributeDefinition[]) => {
      const template = useTemplateStore.getState().editingTemplate;
      if (!template) return;
      updateEditingTemplate({
        characterCreation: { ...template.characterCreation, attributes },
      });
    },
    [updateEditingTemplate]
  );

  const handleUpdateRules = useCallback(
    (updates: Partial<StoryTemplate['gameRules']>) => {
      const template = useTemplateStore.getState().editingTemplate;
      if (!template) return;
      updateEditingTemplate({
        gameRules: { ...template.gameRules, ...updates },
      });
    },
    [updateEditingTemplate]
  );

  const handleUpdateAIConstraints = useCallback(
    (updates: Partial<StoryTemplate['aiConstraints']>) => {
      const template = useTemplateStore.getState().editingTemplate;
      if (!template) return;
      updateEditingTemplate({
        aiConstraints: { ...template.aiConstraints, ...updates },
      });
    },
    [updateEditingTemplate]
  );

  const handleUpdateStartingScene = useCallback(
    (updates: Partial<StoryTemplate['startingScene']>) => {
      const template = useTemplateStore.getState().editingTemplate;
      if (!template) return;
      updateEditingTemplate({
        startingScene: { ...template.startingScene, ...updates },
      });
    },
    [updateEditingTemplate]
  );

  const handleUpdateUITheme = useCallback(
    (updates: Partial<StoryTemplate['uiTheme']>) => {
      const template = useTemplateStore.getState().editingTemplate;
      if (!template) return;
      updateEditingTemplate({
        uiTheme: { ...template.uiTheme, ...updates },
      });
    },
    [updateEditingTemplate]
  );

  const handleUpdateUILayout = useCallback(
    (updates: Partial<StoryTemplate['uiLayout']>) => {
      const template = useTemplateStore.getState().editingTemplate;
      if (!template) return;
      updateEditingTemplate({
        uiLayout: { ...template.uiLayout, ...updates },
      });
    },
    [updateEditingTemplate]
  );

  const handleUpdateNumericalComplexity = useCallback(
    (value: NumericalComplexity) => {
      updateEditingTemplate({ numericalComplexity: value });
    },
    [updateEditingTemplate]
  );

  const handleUpdateSpecialRules = useCallback(
    (updates: Partial<SpecialRules>) => {
      const template = useTemplateStore.getState().editingTemplate;
      if (!template) return;
      updateEditingTemplate({
        specialRules: { ...template.specialRules, ...updates },
      });
    },
    [updateEditingTemplate]
  );

  const handleGenerateRace = useCallback(async (prompt: string): Promise<RaceDefinition | null> => {
    if (!editingTemplate) return null;
    try {
      return await templateService.generateRace({ template: editingTemplate, prompt });
    } catch (error) {
      console.error('Failed to generate race:', error);
      return null;
    }
  }, [editingTemplate]);

  const handleGenerateClass = useCallback(async (prompt: string): Promise<ClassDefinition | null> => {
    if (!editingTemplate) return null;
    try {
      return await templateService.generateClass({ template: editingTemplate, prompt });
    } catch (error) {
      console.error('Failed to generate class:', error);
      return null;
    }
  }, [editingTemplate]);

  const handleGenerateBackground = useCallback(async (prompt: string): Promise<BackgroundDefinition | null> => {
    if (!editingTemplate) return null;
    try {
      return await templateService.generateBackground({ template: editingTemplate, prompt });
    } catch (error) {
      console.error('Failed to generate background:', error);
      return null;
    }
  }, [editingTemplate]);

  const handleGenerateWorldSetting = useCallback(async (prompt: string): Promise<WorldSetting | null> => {
    if (!editingTemplate) return null;
    try {
      return await templateService.generateWorldSetting({ template: editingTemplate, prompt });
    } catch (error) {
      console.error('Failed to generate world setting:', error);
      return null;
    }
  }, [editingTemplate]);

  const renderContent = () => {
    if (!editingTemplate) {
      return (
        <div className={styles.noTemplate}>
          <Icon name="warning" size={48} />
          <p>没有正在编辑的模板</p>
        </div>
      );
    }

    switch (activeModule) {
      case 'basic':
        return (
          <BasicInfoEditor
            template={editingTemplate}
            readOnly={isReadOnly}
            onUpdate={handleUpdateTemplate}
          />
        );
      case 'world':
        return (
          <WorldSettingEditor
            worldSetting={editingTemplate.worldSetting}
            readOnly={isReadOnly}
            onUpdate={handleUpdateWorldSetting}
            onAIGenerate={handleGenerateWorldSetting}
          />
        );
      case 'race':
        return (
          <RaceEditor
            races={editingTemplate.characterCreation.races}
            classes={editingTemplate.characterCreation.classes}
            attributes={editingTemplate.characterCreation?.attributes}
            readOnly={isReadOnly}
            onUpdate={handleUpdateRaces}
            template={editingTemplate}
            onAIGenerate={handleGenerateRace}
          />
        );
      case 'class':
        return (
          <ClassEditor
            classes={editingTemplate.characterCreation.classes}
            attributes={editingTemplate.characterCreation?.attributes}
            readOnly={isReadOnly}
            onUpdate={handleUpdateClasses}
            template={editingTemplate}
            onAIGenerate={handleGenerateClass}
          />
        );
      case 'background':
        return (
          <BackgroundEditor
            backgrounds={editingTemplate.characterCreation.backgrounds}
            readOnly={isReadOnly}
            onUpdate={handleUpdateBackgrounds}
            template={editingTemplate}
            onAIGenerate={handleGenerateBackground}
          />
        );
      case 'attributes':
        return (
          <AttributeEditor
            attributes={editingTemplate.characterCreation?.attributes || []}
            readOnly={isReadOnly}
            onUpdate={handleUpdateAttributes}
          />
        );
      case 'rules':
        return (
          <RulesEditor
            gameRules={editingTemplate.gameRules}
            numericalComplexity={editingTemplate.numericalComplexity}
            specialRules={editingTemplate.specialRules}
            readOnly={isReadOnly}
            onUpdate={handleUpdateRules}
            onUpdateNumericalComplexity={handleUpdateNumericalComplexity}
            onUpdateSpecialRules={handleUpdateSpecialRules}
          />
        );
      case 'ai':
        return (
          <AIConstraintsEditor
            aiConstraints={editingTemplate.aiConstraints}
            readOnly={isReadOnly}
            onUpdate={handleUpdateAIConstraints}
          />
        );
      case 'scene':
        return (
          <StartingSceneEditor
            startingScene={editingTemplate.startingScene}
            readOnly={isReadOnly}
            onUpdate={handleUpdateStartingScene}
            template={editingTemplate}
          />
        );
      case 'uiTheme':
        return (
          <UIThemeEditor
            uiTheme={editingTemplate.uiTheme}
            readOnly={isReadOnly}
            onUpdate={handleUpdateUITheme}
          />
        );
      case 'uiLayout':
        return (
          <UILayoutEditor
            uiLayout={editingTemplate.uiLayout}
            readOnly={isReadOnly}
            onUpdate={handleUpdateUILayout}
          />
        );
      default:
        return (
          <div className={styles.noTemplate}>
            <Icon name="warning" size={48} />
            <p>未知编辑模块</p>
          </div>
        );
    }
  };

  if (!isEditing || !editingTemplate) {
    return (
      <div className={styles.container}>
        <div className={styles.noTemplate}>
          <Icon name="warning" size={48} />
          <p>没有正在编辑的模板</p>
          <Button variant="primary" onClick={onBack}>
            返回管理界面
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h2 className={styles.templateName}>{editingTemplate.name || '未命名模板'}</h2>
          {isReadOnly && (
            <span className={styles.readOnlyBadge}>
              <Icon name="info" size={14} />
              查看模式
            </span>
          )}
        </div>
        <div className={styles.headerRight}>
          <Button
            variant="secondary"
            onClick={() => setShowPreview(true)}
            icon={<Icon name="play" size={16} />}
          >
            预览测试
          </Button>
          {!isReadOnly && (
            <Button
              variant="primary"
              onClick={handleSave}
              loading={isSaving}
              icon={<Icon name="save" size={16} />}
            >
              保存
            </Button>
          )}
          <Button
            variant="secondary"
            onClick={handleCancel}
            icon={<Icon name="close" size={16} />}
          >
            {isReadOnly ? '关闭' : '取消'}
          </Button>
        </div>
      </div>

      <div className={styles.body}>
        <nav className={styles.sidebar}>
          <ul className={styles.navList}>
            {NAV_ITEMS.map((item) => (
              <li key={item.id}>
                <button
                  className={`${styles.navItem} ${activeModule === item.id ? styles.active : ''}`}
                  onClick={() => handleNavClick(item.id)}
                >
                  <Icon name={item.icon as any} size={20} />
                  <span>{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <main className={styles.content}>
          {renderContent()}
        </main>
      </div>

      <ConfirmDialog
        open={showConfirmDialog}
        title="放弃更改"
        message="您有未保存的更改，确定要放弃吗？"
        confirmText="放弃"
        cancelText="继续编辑"
        onConfirm={handleConfirmDiscard}
        onCancel={handleCancelDiscard}
      />

      {showPreview && editingTemplate && (
        <TemplatePreview
          template={editingTemplate}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
};

export default TemplateEditor;
