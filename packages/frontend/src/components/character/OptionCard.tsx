import React from 'react';
import type { RaceDefinition, ClassDefinition, BackgroundDefinition } from '@ai-rpg/shared';
import styles from './OptionCard.module.css';

type OptionType = RaceDefinition | ClassDefinition | BackgroundDefinition;

interface OptionCardProps {
  option: OptionType;
  isSelected: boolean;
  isAIGenerated?: boolean;
  onClick: () => void;
  templateAttributes?: { id: string; name: string; abbreviation: string }[];
}

export const OptionCard: React.FC<OptionCardProps> = ({
  option,
  isSelected,
  isAIGenerated = false,
  onClick,
  templateAttributes = [],
}) => {
  const getAttributeName = (attrId: string): string => {
    const attr = templateAttributes.find((a) => a.id === attrId || a.abbreviation === attrId);
    return attr?.name || attrId;
  };

  const isRace = (opt: OptionType): opt is RaceDefinition => 'bonuses' in opt;
  const isClass = (opt: OptionType): opt is ClassDefinition => 'hitDie' in opt;
  const isBackground = (opt: OptionType): opt is BackgroundDefinition => 'feature' in opt;

  return (
    <div
      className={`${styles.optionCard} ${isSelected ? styles.selected : ''} ${isAIGenerated ? styles.aiGenerated : ''}`}
      onClick={onClick}
    >
      <div className={styles.cardHeader}>
        <h3 className={styles.cardTitle}>
          {option.name}
          {isClass(option) && <span className={styles.cardBadge}>HD: {option.hitDie}</span>}
        </h3>
      </div>

      <p className={styles.cardDescription}>{option.description}</p>

      {isRace(option) && (
        <>
          {Object.keys(option.bonuses).length > 0 && (
            <div className={styles.cardTags}>
              <span className={styles.tagLabel}>加成:</span>
              {Object.entries(option.bonuses).map(([attr, value]) => (
                <span key={attr} className={`${styles.tag} ${styles.tagPositive}`}>
                  {getAttributeName(attr)} +{value}
                </span>
              ))}
            </div>
          )}
          {option.abilities.length > 0 && (
            <div className={styles.cardTags}>
              <span className={styles.tagLabel}>特性:</span>
              {option.abilities.map((ability) => (
                <span key={ability} className={styles.tag}>
                  {ability}
                </span>
              ))}
            </div>
          )}
        </>
      )}

      {isClass(option) && (
        <>
          {option.primaryAttributes.length > 0 && (
            <div className={styles.cardTags}>
              <span className={styles.tagLabel}>主属性:</span>
              {option.primaryAttributes.map((attr) => (
                <span key={attr} className={`${styles.tag} ${styles.tagPrimary}`}>
                  {getAttributeName(attr)}
                </span>
              ))}
            </div>
          )}
          {option.skillProficiencies.length > 0 && (
            <div className={styles.cardTags}>
              <span className={styles.tagLabel}>技能:</span>
              {option.skillProficiencies.slice(0, 4).map((skill) => (
                <span key={skill} className={styles.tag}>
                  {skill}
                </span>
              ))}
            </div>
          )}
        </>
      )}

      {isBackground(option) && (
        <>
          <div className={styles.feature}>
            <span className={styles.featureLabel}>特性:</span>
            <span className={styles.featureText}>
              {option.feature || '无特性'}
            </span>
          </div>
          {option.skillProficiencies && option.skillProficiencies.length > 0 && (
            <div className={styles.cardTags} style={{ marginTop: 'var(--spacing-sm)' }}>
              <span className={styles.tagLabel}>技能:</span>
              {option.skillProficiencies.map((skill) => (
                <span key={skill} className={styles.tag}>
                  {skill}
                </span>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
