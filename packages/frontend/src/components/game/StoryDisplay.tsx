import React, { useRef, useEffect } from 'react';
import { useGameStore } from '../../stores';
import styles from './StoryDisplay.module.css';

export const StoryDisplay: React.FC = () => {
  const messages = useGameStore((state) => state.messages);
  const isLoading = useGameStore((state) => state.isLoadingDialogue);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0 && !isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.empty}>
            <p>冒险即将开始...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.narrative}>
          {messages.map((msg, index) => (
            <div 
              key={`${msg.timestamp}-${index}`} 
              className={`${styles.message} ${styles[msg.role] || styles.narrator}`}
            >
              {msg.role === 'user' ? (
                <p className={styles.userAction}>
                  <span className={styles.actionLabel}>【你的行动】</span>
                  {msg.content}
                </p>
              ) : msg.role === 'narrator' ? (
                <p className={styles.scene}>{msg.content}</p>
              ) : (
                <p className={styles.dialogue}>
                  <span className={styles.speaker}>
                    {msg.role === 'assistant' ? '叙事者' : msg.role}：
                  </span>
                  <span className={styles.text}>{msg.content}</span>
                </p>
              )}
            </div>
          ))}
          {isLoading && (
            <div className={styles.loading}>
              <span className={styles.loadingDots}>...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
    </div>
  );
};
