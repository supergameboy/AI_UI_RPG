import React from 'react';
import { Button } from '../common';
import styles from './QuickOptions.module.css';

const mockOptions = [
  '询问城堡的历史',
  '询问骑士的身份',
  '观察周围环境',
  '自定义回复...',
];

export const QuickOptions: React.FC = () => {
  return (
    <div className={styles.container}>
      <div className={styles.label}>快速选项：</div>
      <div className={styles.options}>
        {mockOptions.map((option, index) => (
          <Button 
            key={index}
            variant="secondary" 
            size="small"
            className={styles.option}
          >
            {option}
          </Button>
        ))}
      </div>
    </div>
  );
};
