import React from 'react';
import styles from './StoryDisplay.module.css';

export const StoryDisplay: React.FC = () => {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.narrative}>
          <p className={styles.scene}>
            你走进了一座古老的城堡，石墙上爬满了藤蔓。月光透过破碎的窗户洒在地面上，形成斑驳的光影。
          </p>
          <p className={styles.dialogue}>
            <span className={styles.speaker}>神秘骑士：</span>
            <span className={styles.text}>"欢迎来到艾尔德里克城堡，旅行者。"</span>
          </p>
          <p className={styles.scene}>
            一位身穿银色铠甲的骑士从阴影中走出，他的目光锐利而警惕。
          </p>
        </div>
      </div>
    </div>
  );
};
