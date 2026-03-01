import React, { useEffect, useCallback } from 'react';
import { Button, Icon, Panel } from '../common';
import { useTemplateStore } from '../../stores/templateStore';
import { useGameStore } from '../../stores/gameStore';
import type { StoryTemplate } from '@ai-rpg/shared';
import styles from './TemplateSelect.module.css';

const GAME_MODE_LABELS: Record<string, string> = {
  text_adventure: '文字冒险',
  turn_based_rpg: '回合制RPG',
  visual_novel: '视觉小说',
  dynamic_combat: '动态战斗',
};

export const TemplateSelect: React.FC = () => {
  const { templates, isLoading, error, fetchTemplates, selectTemplate } = useTemplateStore();
  const setScreen = useGameStore((state) => state.setScreen);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleSelect = useCallback((template: StoryTemplate) => {
    selectTemplate(template);
    // 选择模板后进入游戏界面
    setScreen('game');
  }, [selectTemplate, setScreen]);

  const handleBack = useCallback(() => {
    setScreen('menu');
  }, [setScreen]);

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
      <span>暂无可用模板</span>
    </div>
  );

  const renderTemplateCard = (template: StoryTemplate) => (
    <div key={template.id} className={styles.card}>
      <div className={styles.cardHeader}>
        <h3 className={styles.cardTitle}>{template.name}</h3>
        <span className={styles.gameMode}>
          {GAME_MODE_LABELS[template.gameMode] || template.gameMode}
        </span>
      </div>
      
      <p className={styles.cardDescription}>{template.description}</p>
      
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
        <Button
          variant="primary"
          size="small"
          onClick={() => handleSelect(template)}
        >
          选择
        </Button>
      </div>
    </div>
  );

  return (
    <Panel className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>选择故事模板</h2>
        <Button
          variant="secondary"
          size="small"
          onClick={handleBack}
          icon={<Icon name="chevron-left" size={16} />}
        >
          返回
        </Button>
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
    </Panel>
  );
};

export default TemplateSelect;
