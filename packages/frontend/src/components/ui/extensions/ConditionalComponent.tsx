import React, { useMemo } from 'react';
import styles from './ConditionalComponent.module.css';
import type { ExtensionComponentProps } from './types';

interface ConditionalComponentProps extends ExtensionComponentProps {
  condition?: string;
  children?: React.ReactNode;
}

function evaluateCondition(condition: string, context: Record<string, unknown>): boolean {
  try {
    const func = new Function('ctx', `
      with (ctx) {
        return ${condition};
      }
    `);
    return func(context) === true;
  } catch {
    console.warn(`Failed to evaluate condition: ${condition}`);
    return false;
  }
}

export const ConditionalComponent: React.FC<ConditionalComponentProps> = ({
  condition = 'true',
  context = {},
  children,
}) => {
  const isVisible = useMemo(() => {
    return evaluateCondition(condition, context);
  }, [condition, context]);

  if (!isVisible) {
    return null;
  }

  return (
    <div className={styles.conditionalWrapper}>
      {children}
    </div>
  );
};
