import React, { useEffect, useRef, useMemo } from 'react';
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
    isLoading,
    error,
  } = useCharacterCreationStore();

  const { settings } = useSettingsStore();
  const openSettings = useGameStore((state) => state.openSettings);

  // 使用 ref 存储稳定的引用
  const storeRef = useRef(useCharacterCreationStore.getState());
  storeRef.current = useCharacterCreationStore.getState();

  const needsConfig = useMemo(() => isConfigurationError(error), [error]);
  const aiRandomGeneration = settings.gameplay.aiRandomGeneration;
  const hasGeneratedRef = useRef(false);
  const isGeneratingRef = useRef(false);

  // 自动生成 AI 种族选项
  // 使用 ref 防止重复生成（hasGeneratedRef 和 isGeneratingRef）
  // storeRef 确保 generateAIRaces 调用始终有效
  useEffect(() => {
    if (aiRandomGeneration && aiGeneratedRaces.length === 0 && !hasGeneratedRef.current && !isLoading && !isGeneratingRef.current) {
      hasGeneratedRef.current = true;
      isGeneratingRef.current = true;
      storeRef.current.clearError();
      storeRef.current.generateAIRaces().finally(() => {
        isGeneratingRef.current = false;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // hasGeneratedRef/isGeneratingRef 是 ref，不会触发重新渲染
    // storeRef.current.generateAIRaces 是稳定的引用
  }, [aiRandomGeneration, aiGeneratedRaces.length, isLoading]);

  const handleRetry = () => {
    hasGeneratedRef.current = false;
    isGeneratingRef.current = true;
    storeRef.current.clearError();
    storeRef.current.generateAIRaces().finally(() => {
      isGeneratingRef.current = false;
    });
  };

  const handleGenerateAIRaces = () => {
    if (isGeneratingRef.current) return;
    isGeneratingRef.current = true;
    storeRef.current.generateAIRaces().finally(() => {
      isGeneratingRef.current = false;
    });
  };

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
