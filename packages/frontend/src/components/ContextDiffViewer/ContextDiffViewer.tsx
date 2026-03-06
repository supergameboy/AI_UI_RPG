import React, { useState, useMemo, useCallback } from 'react';
import { Icon } from '../common';
import { DiffRow } from './DiffRow';
import type { ContextDiffViewerProps, DiffItem, ChangeType } from './types';
import styles from './ContextDiffViewer.module.css';

/**
 * ContextDiffViewer 组件 - 显示上下文变更前后对比
 * 
 * 功能：
 * 1. 显示上下文变更前后对比（左侧旧值，右侧新值）
 * 2. 高亮显示差异（绿色新增、红色删除、黄色修改）
 * 3. 支持冲突显示和解决
 * 4. 支持筛选和搜索
 */
export const ContextDiffViewer: React.FC<ContextDiffViewerProps> = ({
  diffs,
  conflicts = [],
  onResolveConflict,
  loading = false,
  maxHeight,
  showTimestamp = false,
}) => {
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [filterType, setFilterType] = useState<ChangeType | 'all' | 'conflict'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  /**
   * 转换 ContextDiff 到 DiffItem
   */
  const diffItems: DiffItem[] = useMemo(() => {
    return diffs.map((diff) => {
      const conflict = conflicts.find((c) => c.path === diff.path);
      return {
        path: diff.path,
        oldValue: diff.oldValue,
        newValue: diff.newValue,
        changeType: diff.type,
        conflict: conflict ? {
          type: conflict.resolution,
          message: `多个智能体对 ${diff.path} 产生了冲突`,
          resolution: conflict.resolvedValue ? `已解决为: ${JSON.stringify(conflict.resolvedValue)}` : undefined,
          agents: conflict.agents,
        } : undefined,
      };
    });
  }, [diffs, conflicts]);
  
  /**
   * 筛选差异项
   */
  const filteredDiffs = useMemo(() => {
    return diffItems.filter((diff) => {
      // 类型筛选
      if (filterType !== 'all' && filterType !== 'conflict') {
        if (diff.changeType !== filterType) {
          return false;
        }
      }
      
      // 冲突筛选
      if (filterType === 'conflict' && !diff.conflict) {
        return false;
      }
      
      // 搜索筛选
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const pathMatch = diff.path.toLowerCase().includes(query);
        const oldValueMatch = String(diff.oldValue).toLowerCase().includes(query);
        const newValueMatch = String(diff.newValue).toLowerCase().includes(query);
        if (!pathMatch && !oldValueMatch && !newValueMatch) {
          return false;
        }
      }
      
      return true;
    });
  }, [diffItems, filterType, searchQuery]);
  
  /**
   * 统计信息
   */
  const stats = useMemo(() => {
    const added = diffItems.filter((d) => d.changeType === 'added').length;
    const removed = diffItems.filter((d) => d.changeType === 'removed').length;
    const modified = diffItems.filter((d) => d.changeType === 'modified').length;
    const conflictCount = diffItems.filter((d) => d.conflict).length;
    
    return { added, removed, modified, conflictCount, total: diffItems.length };
  }, [diffItems]);
  
  /**
   * 切换展开状态
   */
  const toggleExpand = useCallback((path: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);
  
  /**
   * 展开全部
   */
  const expandAll = useCallback(() => {
    setExpandedPaths(new Set(filteredDiffs.map((d) => d.path)));
  }, [filteredDiffs]);
  
  /**
   * 折叠全部
   */
  const collapseAll = useCallback(() => {
    setExpandedPaths(new Set());
  }, []);
  
  /**
   * 解决冲突
   */
  const handleResolveConflict = useCallback((diff: DiffItem, resolution: unknown) => {
    const conflict = conflicts.find((c) => c.path === diff.path);
    if (conflict && onResolveConflict) {
      onResolveConflict(conflict.id, resolution);
    }
  }, [conflicts, onResolveConflict]);
  
  /**
   * 渲染筛选按钮
   */
  const renderFilterButton = (
    type: ChangeType | 'all' | 'conflict',
    label: string,
    count: number
  ) => (
    <button
      key={type}
      className={`${styles.filterButton} ${filterType === type ? styles.active : ''}`}
      onClick={() => setFilterType(type)}
    >
      {label} ({count})
    </button>
  );
  
  if (loading) {
    return (
      <div className={styles.container} style={{ maxHeight }}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <span>加载中...</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className={styles.container} style={{ maxHeight }}>
      <div className={styles.header}>
        <div className={styles.title}>
          <Icon name="git-diff" size={16} />
          <span>上下文变更</span>
        </div>
        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={`${styles.statBadge} ${styles.added}`}>+{stats.added}</span>
          </div>
          <div className={styles.stat}>
            <span className={`${styles.statBadge} ${styles.removed}`}>-{stats.removed}</span>
          </div>
          <div className={styles.stat}>
            <span className={`${styles.statBadge} ${styles.modified}`}>~{stats.modified}</span>
          </div>
          {stats.conflictCount > 0 && (
            <div className={styles.stat}>
              <span className={`${styles.statBadge} ${styles.conflict}`}>⚠ {stats.conflictCount}</span>
            </div>
          )}
          <div className={styles.stat}>
            <span>共 {stats.total}</span>
          </div>
        </div>
      </div>
      
      <div className={styles.toolbar}>
        {renderFilterButton('all', '全部', stats.total)}
        {renderFilterButton('added', '新增', stats.added)}
        {renderFilterButton('removed', '删除', stats.removed)}
        {renderFilterButton('modified', '修改', stats.modified)}
        {stats.conflictCount > 0 && renderFilterButton('conflict', '冲突', stats.conflictCount)}
        
        <input
          type="text"
          className={styles.searchInput}
          placeholder="搜索路径或值..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        
        <button
          className={styles.filterButton}
          onClick={expandAll}
          title="展开全部"
        >
          <Icon name="expand" size={12} />
        </button>
        <button
          className={styles.filterButton}
          onClick={collapseAll}
          title="折叠全部"
        >
          <Icon name="collapse" size={12} />
        </button>
      </div>
      
      <div className={styles.content}>
        {filteredDiffs.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>📋</div>
            <div>
              {searchQuery ? '未找到匹配的差异' : '暂无变更记录'}
            </div>
          </div>
        ) : (
          <div className={styles.diffList}>
            {filteredDiffs.map((diff) => (
              <DiffRow
                key={diff.path}
                diff={diff}
                expanded={expandedPaths.has(diff.path)}
                onToggle={() => toggleExpand(diff.path)}
                onResolveConflict={(resolution) => handleResolveConflict(diff, resolution)}
                showTimestamp={showTimestamp}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ContextDiffViewer;
