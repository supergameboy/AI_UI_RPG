import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import { useCharacterCreationStore, useSettingsStore, useGameStore } from '../../stores';
import { OptionCard } from './OptionCard';
import { Icon } from '../common';
import styles from './SelectionStep.module.css';

const isConfigurationError = (errorMsg: string | null): boolean => {
  if (!errorMsg) return false;
  return errorMsg.includes('AI 服务未配置') || errorMsg.includes('503');
};

export const BackgroundSelectionStep: React.FC = () => {
  const {
    templateBackgrounds,
    aiGeneratedBackgrounds,
    selectedBackground,
    templateAttributes,
    selectBackground,
    generateAIBackgrounds,
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

  const handleGenerateAIBackgrounds = useCallback(() => {
    if (isGeneratingRef.current) return;
    isGeneratingRef.current = true;
    hasGeneratedRef.current = true;
    clearError();
    generateAIBackgrounds().finally(() => {
      isGeneratingRef.current = false;
    });
  }, [generateAIBackgrounds, clearError]);

  const handleRetry = useCallback(() => {
    hasGeneratedRef.current = false;
    handleGenerateAIBackgrounds();
  }, [handleGenerateAIBackgrounds]);

  useEffect(() => {
    if (aiRandomGeneration && aiGeneratedBackgrounds.length === 0 && !hasGeneratedRef.current && !isLoading && !isGeneratingRef.current) {
      handleGenerateAIBackgrounds();
    }
  }, [aiRandomGeneration, aiGeneratedBackgrounds.length, isLoading, handleGenerateAIBackgrounds]);

  return (
    <div className={styles.stepContent}>
      <h2 className={styles.stepTitle}>选择你的背景</h2>
      <p className={styles.stepDescription}>
        背景决定了你的过去和独特能力
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

      {aiRandomGeneration && aiGeneratedBackgrounds.length === 0 && !error && (
        <button
          className={styles.generateButton}
          onClick={handleGenerateAIBackgrounds}
          disabled={isLoading}
        >
          <Icon name="sparkles" />
          {isLoading ? '生成中...' : '生成更多背景选项'}
        </button>
      )}

      {templateBackgrounds.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>
            <Icon name="book" />
            模板预设
          </h3>
          <div className={styles.optionsGrid}>
            {templateBackgrounds.map((bg) => (
              <OptionCard
                key={bg.id}
                option={bg}
                isSelected={selectedBackground?.id === bg.id}
                onClick={() => selectBackground(bg)}
                templateAttributes={templateAttributes}
              />
            ))}
          </div>
        </div>
      )}

      {aiRandomGeneration && aiGeneratedBackgrounds.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>
            <Icon name="sparkles" />
            AI 生成
          </h3>
          <div className={styles.optionsGrid}>
            {aiGeneratedBackgrounds.map((bg) => (
              <OptionCard
                key={bg.id}
                option={bg}
                isSelected={selectedBackground?.id === bg.id}
                isAIGenerated
                onClick={() => selectBackground(bg)}
                templateAttributes={templateAttributes}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
