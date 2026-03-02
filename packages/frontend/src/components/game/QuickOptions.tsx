import React from 'react';
import { Button } from '../common';
import { useGameStore } from '../../stores';
import styles from './QuickOptions.module.css';

export const QuickOptions: React.FC = () => {
  const dialogueOptions = useGameStore((state) => state.dialogueOptions);
  const isLoading = useGameStore((state) => state.isLoadingDialogue);
  const sendPlayerInput = useGameStore((state) => state.sendPlayerInput);

  if (dialogueOptions.length === 0) {
    return null;
  }

  const handleOptionClick = (option: { id: string; text: string }) => {
    if (isLoading) return;
    sendPlayerInput(option.text, option.id);
  };

  return (
    <div className={styles.container}>
      <div className={styles.label}>快速选项：</div>
      <div className={styles.options}>
        {dialogueOptions.map((option) => (
          <Button
            key={option.id}
            variant="secondary"
            size="small"
            className={styles.option}
            onClick={() => handleOptionClick(option)}
            disabled={isLoading || option.disabled}
          >
            {option.text}
            {option.disabled && option.disabledReason && (
              <span className={styles.disabledReason}> ({option.disabledReason})</span>
            )}
          </Button>
        ))}
      </div>
    </div>
  );
};
