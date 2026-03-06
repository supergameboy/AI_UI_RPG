import React, { useEffect, useRef } from 'react';
import { useCharacterCreationStore, useSettingsStore } from '../../stores';
import styles from './CharacterConfirmStep.module.css';

export const CharacterConfirmStep: React.FC = () => {
  const {
    characterName,
    selectedRace,
    selectedClass,
    selectedBackground,
    templateAttributes,
    calculatedAttributes,
    generatedAppearance,
    generatedImagePrompt,
    generatedBackstory,
  } = useCharacterCreationStore();

  const { settings } = useSettingsStore();
  
  // 使用 ref 存储稳定的引用
  const storeRef = useRef(useCharacterCreationStore.getState());
  storeRef.current = useCharacterCreationStore.getState();
  
  const hasCalculatedRef = useRef(false);

  useEffect(() => {
    // 只在首次渲染且未计算时执行
    if (!hasCalculatedRef.current) {
      const state = storeRef.current;
      if (Object.keys(state.calculatedAttributes).length === 0 && state.selectedRace && state.selectedClass && state.selectedBackground) {
        hasCalculatedRef.current = true;
        state.calculateAttributes();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 空依赖数组，只在挂载时执行一次

  const getAttributeName = (attrId: string): string => {
    const attr = templateAttributes.find((a) => a.id === attrId);
    return attr?.name || attrId;
  };

  if (!selectedRace || !selectedClass || !selectedBackground) {
    return null;
  }

  return (
    <div className={styles.confirmContent}>
      <h2 className={styles.stepTitle}>确认你的角色</h2>

      <div className={styles.characterCard}>
        <div className={styles.cardHeader}>
          <h3 className={styles.characterName}>{characterName}</h3>
          <p className={styles.characterInfo}>
            {selectedRace.name} · {selectedClass.name} · {selectedBackground.name}
          </p>
        </div>

        <div className={styles.cardBody}>
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>选择详情</h4>
            <div className={styles.selections}>
              <div className={styles.selectionItem}>
                <div className={styles.selectionLabel}>种族</div>
                <div className={styles.selectionValue}>{selectedRace.name}</div>
              </div>
              <div className={styles.selectionItem}>
                <div className={styles.selectionLabel}>职业</div>
                <div className={styles.selectionValue}>{selectedClass.name}</div>
              </div>
              <div className={styles.selectionItem}>
                <div className={styles.selectionLabel}>背景</div>
                <div className={styles.selectionValue}>{selectedBackground.name}</div>
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>属性</h4>
            <div className={styles.attributesGrid}>
              {Object.entries(calculatedAttributes).map(([attrId, calc]) => (
                <div key={attrId} className={styles.attributeItem}>
                  <div className={styles.attributeName}>{getAttributeName(attrId)}</div>
                  <div className={styles.attributeValue}>{calc.finalValue}</div>
                  <div className={styles.attributeBreakdown}>
                    {calc.baseValue}
                    {calc.raceBonus !== 0 && ` ${calc.raceBonus > 0 ? '+' : ''}${calc.raceBonus}(种族)`}
                    {calc.classBonus !== 0 && ` +${calc.classBonus}(职业)`}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {generatedAppearance && (
            <div className={styles.section}>
              <h4 className={styles.sectionTitle}>外观</h4>
              <p className={styles.description}>{generatedAppearance}</p>
            </div>
          )}

          {settings.gameplay.generateImagePrompt && generatedImagePrompt && (
            <div className={styles.section}>
              <h4 className={styles.sectionTitle}>图像提示词</h4>
              <pre className={styles.imagePrompt}>{generatedImagePrompt}</pre>
            </div>
          )}

          {generatedBackstory && (
            <div className={styles.section}>
              <h4 className={styles.sectionTitle}>背景故事</h4>
              <p className={styles.description}>{generatedBackstory}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
