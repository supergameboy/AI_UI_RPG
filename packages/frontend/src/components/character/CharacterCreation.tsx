import React, { useEffect } from 'react';
import { Button, Icon } from '../common';
import { useCharacterCreationStore, useSettingsStore } from '../../stores';
import { NameInputStep } from './NameInputStep';
import { RaceSelectionStep } from './RaceSelectionStep';
import { ClassSelectionStep } from './ClassSelectionStep';
import { BackgroundSelectionStep } from './BackgroundSelectionStep';
import { CharacterConfirmStep } from './CharacterConfirmStep';
import type { StoryTemplate, Character } from '@ai-rpg/shared';
import styles from './CharacterCreation.module.css';

interface CharacterCreationProps {
  template: StoryTemplate;
  onComplete: (character: Character) => void;
  onCancel: () => void;
}

const STEP_LABELS: Record<string, string> = {
  name: '角色名称',
  race: '选择种族',
  class: '选择职业',
  background: '选择背景',
  confirm: '确认角色',
};

export const CharacterCreation: React.FC<CharacterCreationProps> = ({
  template,
  onComplete,
  onCancel,
}) => {
  const {
    currentStep,
    characterName,
    selectedRace,
    selectedClass,
    selectedBackground,
    finalizedCharacter,
    isLoading,
    loadingMessage,
    error,
    initFromTemplate,
    goToNextStep,
    goToPreviousStep,
    clearError,
    finalizeCharacter,
  } = useCharacterCreationStore();

  const { settings } = useSettingsStore();

  useEffect(() => {
    initFromTemplate(template);
  }, [template, initFromTemplate]);

  useEffect(() => {
    if (finalizedCharacter) {
      onComplete(finalizedCharacter);
    }
  }, [finalizedCharacter, onComplete]);

  const canProceed = () => {
    switch (currentStep) {
      case 'name':
        return characterName.trim().length >= 1;
      case 'race':
        return selectedRace !== null;
      case 'class':
        return selectedClass !== null;
      case 'background':
        return selectedBackground !== null;
      case 'confirm':
        return true;
      default:
        return false;
    }
  };

  const handleNext = async () => {
    if (currentStep === 'confirm') {
      await finalizeCharacter(settings.gameplay.generateImagePrompt);
    } else {
      goToNextStep();
    }
  };

  const currentIndex = ['name', 'race', 'class', 'background', 'confirm'].indexOf(currentStep);

  return (
    <div className={styles.characterCreation}>
      <header className={styles.header}>
        <h1 className={styles.title}>创建角色 - {template.name}</h1>
        <div className={styles.stepIndicator}>
          {Object.entries(STEP_LABELS).map(([step, label], index) => (
            <div
              key={step}
              className={`${styles.step} ${
                currentStep === step ? styles.active : index < currentIndex ? styles.completed : ''
              }`}
            >
              <span className={styles.stepNumber}>
                {index < currentIndex ? '✓' : index + 1}
              </span>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </header>

      <main className={styles.content}>
        {error && (
          <div className={styles.error}>
            <span>{error}</span>
            <button className={styles.errorClose} onClick={clearError}>
              ×
            </button>
          </div>
        )}

        {isLoading && (
          <div className={styles.loading}>
            <div className={styles.loadingSpinner} />
            <span>{loadingMessage}</span>
          </div>
        )}

        {!isLoading && currentStep === 'name' && <NameInputStep />}
        {!isLoading && currentStep === 'race' && <RaceSelectionStep />}
        {!isLoading && currentStep === 'class' && <ClassSelectionStep />}
        {!isLoading && currentStep === 'background' && <BackgroundSelectionStep />}
        {!isLoading && currentStep === 'confirm' && <CharacterConfirmStep />}
      </main>

      <footer className={styles.footer}>
        <Button
          variant="secondary"
          onClick={currentStep === 'name' ? onCancel : goToPreviousStep}
          disabled={isLoading}
        >
          <Icon name="arrow-left" />
          {currentStep === 'name' ? '取消' : '上一步'}
        </Button>

        <Button
          variant="primary"
          onClick={handleNext}
          disabled={!canProceed() || isLoading}
        >
          {currentStep === 'confirm' ? '开始游戏' : '下一步'}
          <Icon name="arrow-right" />
        </Button>
      </footer>
    </div>
  );
};
