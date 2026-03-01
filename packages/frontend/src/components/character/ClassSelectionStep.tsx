import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import { useCharacterCreationStore, useSettingsStore, useGameStore } from '../../stores';
import { OptionCard } from './OptionCard';
import { Icon } from '../common';
import styles from './SelectionStep.module.css';

const isConfigurationError = (errorMsg: string | null): boolean => {
  if (!errorMsg) return false;
  return errorMsg.includes('AI 服务未配置') || errorMsg.includes('503');
};

export const ClassSelectionStep: React.FC = () => {
  const {
    templateClasses,
    aiGeneratedClasses,
    selectedClass,
    templateAttributes,
    selectClass,
    generateAIClasses,
    isLoading,
    error,
    clearError,
  } = useCharacterCreationStore();

  const { settings } = useSettingsStore();
  const openSettings = useGameStore((state) => state.openSettings);

  const aiRandomGeneration = settings.gameplay.aiRandomGeneration;
  const hasGeneratedRef = useRef(false);
  const isGeneratingRef = useRef(false);

  const needsConfig = useMemo(() => isConfigurationError(error), [error]);

  const handleGenerateAIClasses = useCallback(() => {
    if (isGeneratingRef.current) return;
    isGeneratingRef.current = true;
    hasGeneratedRef.current = true;
    clearError();
    generateAIClasses().finally(() => {
      isGeneratingRef.current = false;
    });
  }, [generateAIClasses, clearError]);

  const handleRetry = useCallback(() => {
    hasGeneratedRef.current = false;
    handleGenerateAIClasses();
  }, [handleGenerateAIClasses]);

  useEffect(() => {
    if (aiRandomGeneration && aiGeneratedClasses.length === 0 && !hasGeneratedRef.current && !isLoading && !isGeneratingRef.current) {
      handleGenerateAIClasses();
    }
  }, [aiRandomGeneration, aiGeneratedClasses.length, isLoading, handleGenerateAIClasses]);

  return (
    <div className={styles.stepContent}>
      <h2 className={styles.stepTitle}>选择你的职业</h2>
      <p className={styles.stepDescription}>
        职业决定了你的战斗风格和技能
      </p>

      {error && (
        <div className={styles.errorContainer}>
          <p className={styles.errorMessage}>{error}</p>
          <div className={styles.errorButtons}>
            <button
              className={styles.retryButton}
              onClick={handleRetry}
              disabled={isLoading}
            >
              <Icon name="refresh" />
              重试
            </button>
            {needsConfig && (
              <button
                className={styles.settingsButton}
                onClick={openSettings}
                disabled={isLoading}
              >
                <Icon name="settings" />
                前往设置
              </button>
            )}
          </div>
        </div>
      )}

      {aiRandomGeneration && aiGeneratedClasses.length === 0 && !error && (
        <button
          className={styles.generateButton}
          onClick={handleGenerateAIClasses}
          disabled={isLoading}
        >
          <Icon name="sparkles" />
          {isLoading ? '生成中...' : '生成更多职业选项'}
        </button>
      )}

      {templateClasses.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>
            <Icon name="book" />
            模板预设
          </h3>
          <div className={styles.optionsGrid}>
            {templateClasses.map((cls) => (
              <OptionCard
                key={cls.id}
                option={cls}
                isSelected={selectedClass?.id === cls.id}
                onClick={() => selectClass(cls)}
                templateAttributes={templateAttributes}
              />
            ))}
          </div>
        </div>
      )}

      {aiRandomGeneration && aiGeneratedClasses.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>
            <Icon name="sparkles" />
            AI 生成
          </h3>
          <div className={styles.optionsGrid}>
            {aiGeneratedClasses.map((cls) => (
              <OptionCard
                key={cls.id}
                option={cls}
                isSelected={selectedClass?.id === cls.id}
                isAIGenerated
                onClick={() => selectClass(cls)}
                templateAttributes={templateAttributes}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
