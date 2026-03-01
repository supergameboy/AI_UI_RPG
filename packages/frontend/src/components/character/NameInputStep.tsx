import React from 'react';
import { useCharacterCreationStore } from '../../stores';
import styles from './NameInputStep.module.css';

export const NameInputStep: React.FC = () => {
  const { characterName, setCharacterName, template } = useCharacterCreationStore();

  return (
    <div className={styles.stepContent}>
      <h2 className={styles.stepTitle}>为你的角色命名</h2>
      <p className={styles.stepDescription}>
        在 {template?.worldSetting?.name || '这个世界'} 中，你的名字将被铭记
      </p>

      <div className={styles.inputGroup}>
        <label className={styles.label}>角色名称</label>
        <input
          type="text"
          className={styles.input}
          value={characterName}
          onChange={(e) => setCharacterName(e.target.value)}
          placeholder="输入角色名称..."
          maxLength={20}
          autoFocus
        />
        <p className={styles.hint}>名称长度 1-20 个字符</p>
      </div>
    </div>
  );
};
