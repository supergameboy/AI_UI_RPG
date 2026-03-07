import React, { useMemo } from 'react';
import type { DynamicUIComponentProps } from './types';
import { evaluateCondition } from './utils';

/**
 * 条件显示组件
 * 
 * 解析格式: {condition="..."}
 * 
 * 示例:
 * :::conditional{condition="hasItem:magic-key"}
 * 你使用魔法钥匙打开了宝箱！
 * :::
 * 
 * :::conditional{condition="level>=10"}
 * 你已达到足够等级，可以进入地下城。
 * :::
 */
export const ConditionalComponent: React.FC<DynamicUIComponentProps & {
  context?: Record<string, unknown>;
}> = ({
  content,
  attrs,
  context = {},
}) => {
  // 评估条件
  const shouldShow = useMemo(() => {
    const condition = attrs.condition || '';
    return evaluateCondition(condition, context);
  }, [attrs.condition, context]);

  // 如果条件不满足，不渲染任何内容
  if (!shouldShow) {
    return null;
  }

  // 渲染条件内容
  return (
    <div className="conditional-content">
      {content.trim()}
    </div>
  );
};

export default ConditionalComponent;
