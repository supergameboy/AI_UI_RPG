import React from 'react';
import styles from './QuickBar.module.css';

export const QuickBar: React.FC = () => {
  const slots = Array(9).fill(null);

  return (
    <div className={styles.quickBar}>
      <div className={styles.label}>快捷栏</div>
      <div className={styles.slots}>
        {slots.map((_, index) => (
          <div key={index} className={styles.slot}>
            <span className={styles.key}>{index + 1}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
