import React, { useMemo } from 'react';
import styles from './OptionsComponent.module.css';
import type { ExtensionComponentProps } from './types';

interface ParsedOption {
  text: string;
  action: string;
  data?: unknown;
}

interface OptionsComponentProps extends ExtensionComponentProps {
  rawContent?: string;
}

function parseOptionsFromContent(content: string): ParsedOption[] {
  const options: ParsedOption[] = [];
  const linkRegex = /\[([^\]]+)\]\(action:([^)\s]+)(?:\s+data:([^)]*))?\)/g;
  let match;
  
  while ((match = linkRegex.exec(content)) !== null) {
    options.push({
      text: match[1],
      action: match[2],
      data: match[3] ? JSON.parse(match[3]) : undefined,
    });
  }
  
  return options;
}

export const OptionsComponent: React.FC<OptionsComponentProps> = ({
  rawContent = '',
  onAction,
  context,
}) => {
  const options = useMemo(() => parseOptionsFromContent(rawContent), [rawContent]);

  const handleClick = (option: ParsedOption) => {
    onAction?.(option.action, { ...context, data: option.data });
  };

  if (options.length === 0) {
    return null;
  }

  return (
    <div className={styles.optionsContainer}>
      {options.map((option, index) => (
        <button
          key={index}
          className={`${styles.optionButton} ${index > 0 ? styles.secondary : ''}`}
          onClick={() => handleClick(option)}
        >
          {option.text}
        </button>
      ))}
    </div>
  );
};
