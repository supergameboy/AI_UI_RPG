import React from 'react';
import type { InitializationStatus } from '@ai-rpg/shared';
import { InitializationStep } from '@ai-rpg/shared';
import styles from './InitializationProgress.module.css';

interface InitializationProgressProps {
  status: InitializationStatus;
  onRetry?: () => void;
}

/**
 * 初始化步骤配置
 */
const INITIALIZATION_STEPS = [
  { key: InitializationStep.NUMERICAL, label: '数值初始化' },
  { key: InitializationStep.SKILLS, label: '技能初始化' },
  { key: InitializationStep.INVENTORY, label: '背包初始化' },
  { key: InitializationStep.EQUIPMENT, label: '装备初始化' },
  { key: InitializationStep.QUESTS, label: '任务初始化' },
  { key: InitializationStep.MAP, label: '地图初始化' },
  { key: InitializationStep.NPCS, label: 'NPC初始化' },
  { key: InitializationStep.SCENE, label: '场景初始化' },
] as const;

/**
 * 初始化进度组件
 * 显示游戏初始化的进度条和步骤列表
 */
export const InitializationProgress: React.FC<InitializationProgressProps> = ({
  status,
  onRetry,
}) => {
  // 计算进度百分比
  const progress = Math.round(
    (status.completedSteps.length / INITIALIZATION_STEPS.length) * 100
  );

  // 获取步骤状态
  const getStepStatus = (
    stepKey: InitializationStep
  ): 'completed' | 'current' | 'pending' => {
    if (status.completedSteps.includes(stepKey)) {
      return 'completed';
    }
    if (status.currentStep === stepKey) {
      return 'current';
    }
    return 'pending';
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>正在初始化游戏世界...</h2>

      {/* 进度条 */}
      <div className={styles.progressSection}>
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className={styles.progressText}>{progress}%</span>
      </div>

      {/* 步骤列表 */}
      <div className={styles.steps}>
        {INITIALIZATION_STEPS.map((step) => {
          const stepStatus = getStepStatus(step.key);
          return (
            <div
              key={step.key}
              className={`${styles.step} ${styles[stepStatus]}`}
            >
              <span className={styles.stepIcon}>
                {stepStatus === 'completed' && (
                  <svg viewBox="0 0 24 24" className={styles.iconCheck}>
                    <path
                      fill="currentColor"
                      d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"
                    />
                  </svg>
                )}
                {stepStatus === 'current' && (
                  <span className={styles.spinner} />
                )}
                {stepStatus === 'pending' && <span className={styles.circle} />}
              </span>
              <span className={styles.stepLabel}>{step.label}</span>
            </div>
          );
        })}
      </div>

      {/* 错误信息 */}
      {status.failed && (
        <div className={styles.error}>
          <p className={styles.errorText}>
            初始化失败: {status.error || '未知错误'}
          </p>
          {onRetry && (
            <button className={styles.retryButton} onClick={onRetry}>
              重试
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default InitializationProgress;
