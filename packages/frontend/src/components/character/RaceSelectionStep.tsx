import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import { useCharacterCreationStore, useSettingsStore, useGameStore } from '../../stores';
import { OptionCard } from './OptionCard';
import { Icon } from '../common';
import styles from './SelectionStep.module.css';

const isConfigurationError = (errorMsg: string | null): boolean => {
  if (!errorMsg) return false;
  return errorMsg.includes('AI 服务未配置') || errorMsg.includes('503');
};

export const RaceSelectionStep: React.FC = () => {
  const {
    templateRaces,
    aiGeneratedRaces,
    selectedRace,
    templateAttributes,
    selectRace,
    generateAIRaces,
    isLoading,
    error,
    clearError,
  } = useCharacterCreationStore();

  const { settings } = useSettingsStore();
  const openSettings = useGameStore((state) => state.openSettings);

  const needsConfig = useMemo(() => isConfigurationError(error), [error]);
  const aiRandomGeneration = settings.gameplay.aiRandomGeneration;
  const hasGeneratedRef = useRef(false);
  const isGeneratingRef = useRef(false);

  const handleGenerateAIRaces = useCallback(() => {
    if (isGeneratingRef.current) return;
    isGeneratingRef.current = true;
    hasGeneratedRef.current = true;
    clearError();
    generateAIRaces().finally(() => {
      isGeneratingRef.current = false;
    });
  }, [generateAIRaces, clearError]);

  const handleRetry = useCallback(() => {
    hasGeneratedRef.current = false;
    handleGenerateAIRaces();
  }, [handleGenerateAIRaces]);

  useEffect(() => {
    if (aiRandomGeneration && aiGeneratedRaces.length === 0 && !hasGeneratedRef.current && !isLoading && !isGeneratingRef.current) {
      handleGenerateAIRaces();
    }
  }, [aiRandomGeneration, aiGeneratedRaces.length, isLoading, handleGenerateAIRaces]);

  return (
    <div className={styles.stepContent}>
      <h2 className={styles.stepTitle}>选择你的种族</h2>
      <p className={styles.stepDescription}>
        种族决定了你的天赋和特殊能力
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

      {aiRandomGeneration && aiGeneratedRaces.length === 0 && !error && (
        <button
          className={styles.generateButton}
          onClick={handleGenerateAIRaces}
          disabled={isLoading}
        >
          <Icon name="sparkles" />
          {isLoading ? '生成中...' : '生成更多种族选项'}
        </button>
      )}

      {templateRaces.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>
            <Icon name="book" />
            模板预设
          </h3>
          <div className={styles.optionsGrid}>
            {templateRaces.map((race) => (
              <OptionCard
                key={race.id}
                option={race}
                isSelected={selectedRace?.id === race.id}
                onClick={() => selectRace(race)}
                templateAttributes={templateAttributes}
              />
            ))}
          </div>
        </div>
      )}

      {aiRandomGeneration && aiGeneratedRaces.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>
            <Icon name="sparkles" />
            AI 生成
          </h3>
          <div className={styles.optionsGrid}>
            {aiGeneratedRaces.map((race) => (
              <OptionCard
                key={race.id}
                option={race}
                isSelected={selectedRace?.id === race.id}
                isAIGenerated
                onClick={() => selectRace(race)}
                templateAttributes={templateAttributes}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
