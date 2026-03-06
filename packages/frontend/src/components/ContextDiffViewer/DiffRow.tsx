import React, { useState, useCallback, useMemo } from 'react';
import type { DiffRowProps } from './types';
import styles from './ContextDiffViewer.module.css';

/**
 * 格式化路径显示，将路径分段并高亮显示
 */
const formatPath = (path: string): React.ReactNode[] => {
  const segments = path.split('.');
  return segments.map((segment, index) => (
    <React.Fragment key={index}>
      {index > 0 && <span className={styles.pathSeparator}>.</span>}
      <span className={styles.pathKey}>{segment}</span>
    </React.Fragment>
  ));
};

/**
 * 格式化值显示
 */
const formatValue = (value: unknown, depth: number = 0): React.ReactNode => {
  const indent = '  '.repeat(depth);
  
  if (value === null) {
    return <span className={styles.valueNull}>null</span>;
  }
  
  if (value === undefined) {
    return <span className={styles.valuePlaceholder}>undefined</span>;
  }
  
  if (typeof value === 'boolean') {
    return <span className={styles.valueBoolean}>{value ? 'true' : 'false'}</span>;
  }
  
  if (typeof value === 'number') {
    return <span className={styles.valueNumber}>{value}</span>;
  }
  
  if (typeof value === 'string') {
    return <span className={styles.valueString}>"{value}"</span>;
  }
  
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span className={styles.valueBracket}>[]</span>;
    }
    
    if (depth > 2) {
      return <span className={styles.valueBracket}>[...{value.length} items]</span>;
    }
    
    return (
      <div className={styles.valueTree}>
        <span className={styles.valueBracket}>[</span>
        {value.map((item, index) => (
          <div key={index} className={styles.treeNode}>
            <span className={styles.treeIndent}>{indent}  </span>
            {formatValue(item, depth + 1)}
            {index < value.length - 1 && <span className={styles.valueComma}>,</span>}
          </div>
        ))}
        <span className={styles.treeIndent}>{indent}</span>
        <span className={styles.valueBracket}>]</span>
      </div>
    );
  }
  
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    
    if (entries.length === 0) {
      return <span className={styles.valueBracket}>{"{}"}</span>;
    }
    
    if (depth > 2) {
      return <span className={styles.valueBracket}>{"{...}"}</span>;
    }
    
    return (
      <div className={styles.valueTree}>
        <span className={styles.valueBracket}>{"{"}</span>
        {entries.map(([key, val], index) => (
          <div key={key} className={styles.treeNode}>
            <span className={styles.treeIndent}>{indent}  </span>
            <span className={styles.treeKey}>{key}</span>
            <span className={styles.treeColon}>:</span>
            <span className={styles.treeValue}>{formatValue(val, depth + 1)}</span>
            {index < entries.length - 1 && <span className={styles.valueComma}>,</span>}
          </div>
        ))}
        <span className={styles.treeIndent}>{indent}</span>
        <span className={styles.valueBracket}>{"}"}</span>
      </div>
    );
  }
  
  return String(value);
};

/**
 * 获取变更类型的显示文本
 */
const getChangeTypeText = (type: string): string => {
  switch (type) {
    case 'added':
      return '新增';
    case 'removed':
      return '删除';
    case 'modified':
      return '修改';
    default:
      return type;
  }
};

/**
 * DiffRow 组件 - 显示单个差异项
 */
export const DiffRow: React.FC<DiffRowProps> = ({
  diff,
  expanded,
  onToggle,
  onResolveConflict,
}) => {
  const [resolutionValue, setResolutionValue] = useState<string>('');
  
  const hasConflict = !!diff.conflict;
  
  const rowClassName = useMemo(() => {
    const classes = [styles.diffRow, styles[diff.changeType]];
    if (hasConflict) {
      classes.push(styles.conflict);
    }
    return classes.join(' ');
  }, [diff.changeType, hasConflict]);
  
  const handleResolve = useCallback(() => {
    if (onResolveConflict && resolutionValue) {
      try {
        const parsed = JSON.parse(resolutionValue);
        onResolveConflict(parsed);
      } catch {
        onResolveConflict(resolutionValue);
      }
      setResolutionValue('');
    }
  }, [onResolveConflict, resolutionValue]);
  
  return (
    <div className={rowClassName}>
      <div className={styles.rowHeader} onClick={onToggle}>
        <span className={`${styles.expandIcon} ${expanded ? styles.expanded : ''}`}>
          ▶
        </span>
        <span className={`${styles.changeTypeBadge} ${styles[diff.changeType]}`}>
          {getChangeTypeText(diff.changeType)}
        </span>
        <span className={styles.pathDisplay}>
          {formatPath(diff.path)}
        </span>
        {hasConflict && (
          <span className={styles.conflictBadge}>
            ⚠ 冲突
          </span>
        )}
      </div>
      
      {expanded && (
        <div className={styles.rowContent}>
          <div className={styles.diffView}>
            <div className={styles.valueColumn}>
              <div className={`${styles.columnHeader} ${styles.old}`}>
                旧值
              </div>
              <div className={styles.valueContent}>
                {diff.oldValue === undefined ? (
                  <span className={styles.valuePlaceholder}>无</span>
                ) : (
                  formatValue(diff.oldValue)
                )}
              </div>
            </div>
            <div className={styles.valueColumn}>
              <div className={`${styles.columnHeader} ${styles.new}`}>
                新值
              </div>
              <div className={styles.valueContent}>
                {diff.newValue === undefined ? (
                  <span className={styles.valuePlaceholder}>无</span>
                ) : (
                  formatValue(diff.newValue)
                )}
              </div>
            </div>
          </div>
          
          {hasConflict && diff.conflict && (
            <div className={styles.conflictSection}>
              <div className={styles.conflictHeader}>
                ⚠ 冲突详情
              </div>
              <div className={styles.conflictMessage}>
                {diff.conflict.message}
              </div>
              
              {diff.conflict.agents && diff.conflict.agents.length > 0 && (
                <div className={styles.conflictAgents}>
                  <span className={styles.resolutionLabel}>涉及智能体:</span>
                  {diff.conflict.agents.map((agent) => (
                    <span key={agent} className={styles.agentTag}>
                      {agent}
                    </span>
                  ))}
                </div>
              )}
              
              {diff.conflict.resolution && (
                <div className={styles.conflictMessage}>
                  <strong>建议解决方案:</strong> {diff.conflict.resolution}
                </div>
              )}
              
              {onResolveConflict && (
                <div className={styles.resolutionSection}>
                  <span className={styles.resolutionLabel}>解决值:</span>
                  <input
                    type="text"
                    className={styles.resolutionInput}
                    value={resolutionValue}
                    onChange={(e) => setResolutionValue(e.target.value)}
                    placeholder="输入解决值 (JSON 或文本)"
                  />
                  <button
                    className={styles.resolutionButton}
                    onClick={handleResolve}
                    disabled={!resolutionValue}
                  >
                    解决冲突
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DiffRow;
