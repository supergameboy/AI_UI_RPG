import React, { useState } from 'react';
import { Button, Icon } from '../common';
import { useGameStore } from '../../stores';
import styles from './ChatInput.module.css';

export const ChatInput: React.FC = () => {
  const [input, setInput] = useState('');
  const isLoading = useGameStore((state) => state.isLoadingDialogue);
  const sendPlayerInput = useGameStore((state) => state.sendPlayerInput);

  const handleSend = () => {
    if (input.trim() && !isLoading) {
      sendPlayerInput(input.trim());
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.inputWrapper}>
        <textarea
          className={styles.input}
          placeholder="输入你的行动..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          disabled={isLoading}
        />
        <Button
          variant="primary"
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          icon={<Icon name="send" size={18} />}
        >
          发送
        </Button>
      </div>
    </div>
  );
};
