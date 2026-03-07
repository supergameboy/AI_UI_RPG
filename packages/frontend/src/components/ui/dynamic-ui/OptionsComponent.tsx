import React, { useMemo } from 'react';
import type { DynamicUIComponentProps, ParsedOption } from './types';
import { parseOptions } from './utils';
import styles from './OptionsComponent.module.css';

/**
 * 选项按钮组组件
 * 
 * 解析格式: [文本](action:xxx)
 * 
 * 示例:
 * :::options
 * [接受任务](action:accept-quest)
 * [拒绝](action:decline)
 * :::
 */
export const OptionsComponent: React.FC<DynamicUIComponentProps> = ({
  content,
  attrs,
  onAction,
}) => {
  // 解析选项
  const options = useMemo<ParsedOption[]>(() => {
    return parseOptions(content);
  }, [content]);

  // 处理点击
  const handleClick = (option: ParsedOption) => {
    if (option.disabled) return;
    onAction?.({ type: option.action, payload: { text: option.text } });
  };

  // 键盘处理
  const handleKeyDown = (e: React.KeyboardEvent, option: ParsedOption) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick(option);
    }
  };

  if (options.length === 0) {
    return null;
  }

  // 解析布局属性
  const layout = attrs.layout || 'vertical'; // vertical | horizontal | grid
  const align = attrs.align || 'left'; // left | center | right

  return (
    <div 
      className={[
        styles.container,
        styles[layout],
        styles[`align-${align}`],
      ].filter(Boolean).join(' ')}
      role="group"
      aria-label="选项列表"
    >
      {options.map((option, index) => (
        <button
          key={`${option.action}-${index}`}
          type="button"
          className={[
            styles.option,
            option.disabled && styles.disabled,
          ].filter(Boolean).join(' ')}
          onClick={() => handleClick(option)}
          onKeyDown={(e) => handleKeyDown(e, option)}
          disabled={option.disabled}
          aria-disabled={option.disabled}
        >
          <span className={styles.optionText}>{option.text}</span>
        </button>
      ))}
    </div>
  );
};

export default OptionsComponent;
