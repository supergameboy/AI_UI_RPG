import React, { useMemo, useCallback } from 'react';
import type { DynamicUIComponentProps, SkillNode, SkillTreeLayout } from './types';
import styles from './SkillTreeComponent.module.css';

/**
 * 技能树组件
 * 
 * 解析格式:
 * {name="战士技能树" currentSkillPoints=5 maxSkillPoints=10 layout="tree"}
 * 
 * 示例:
 * :::skill-tree{name="战士技能树" currentSkillPoints=5 maxSkillPoints=10 layout="tree"}
 * [基础攻击](skill:basic-attack level=1 maxLevel=5 status=unlocked x=0 y=0)
 * [强力斩击](skill:power-slash level=0 maxLevel=3 status=available x=1 y=1 prereq=basic-attack cost=1)
 * [旋风斩](skill:whirlwind level=0 maxLevel=3 status=locked x=2 y=2 prereq=power-slash cost=2)
 * :::
 */
export const SkillTreeComponent: React.FC<DynamicUIComponentProps> = ({
  content,
  attrs,
  onAction,
}) => {
  // 解析属性
  const name = attrs.name || '技能树';
  const currentSkillPoints = useMemo(() => {
    const v = parseInt(attrs.currentSkillPoints || '0', 10);
    return isNaN(v) ? 0 : v;
  }, [attrs.currentSkillPoints]);

  const maxSkillPoints = useMemo(() => {
    const v = parseInt(attrs.maxSkillPoints || '10', 10);
    return isNaN(v) ? 10 : v;
  }, [attrs.maxSkillPoints]);

  const layout = (attrs.layout as SkillTreeLayout) || 'tree';

  // 解析技能节点
  // 支持带连字符的技能 ID，如 basic-attack
  const skillNodes = useMemo<SkillNode[]>(() => {
    const nodes: SkillNode[] = [];
    // 格式: [名称](skill:id level=N maxLevel=N status=xxx x=N y=N [prereq=id] [cost=N])
    const regex = /\[([^\]]+)\]\(skill:([\w-]+)\s+level=(\d+)\s+maxLevel=(\d+)\s+status=(\w+)\s+x=(-?\d+)\s+y=(-?\d+)(?:\s+prereq=([\w-]+))?(?:\s+cost=(\d+))?\)/g;
    let match;

    while ((match = regex.exec(content)) !== null) {
      nodes.push({
        id: match[2],
        name: match[1],
        level: parseInt(match[3], 10),
        maxLevel: parseInt(match[4], 10),
        status: match[5] as SkillNode['status'],
        position: { x: parseInt(match[6], 10), y: parseInt(match[7], 10) },
        prerequisites: match[8] ? [match[8]] : undefined,
        cost: match[9] ? parseInt(match[9], 10) : undefined,
      });
    }

    return nodes;
  }, [content]);

  // 计算连接线
  const connections = useMemo(() => {
    const lines: Array<{ from: SkillNode; to: SkillNode }> = [];
    
    skillNodes.forEach(node => {
      if (node.prerequisites) {
        node.prerequisites.forEach(prereqId => {
          const prereqNode = skillNodes.find(n => n.id === prereqId);
          if (prereqNode) {
            lines.push({ from: prereqNode, to: node });
          }
        });
      }
    });

    return lines;
  }, [skillNodes]);

  // 点击技能节点
  const handleNodeClick = useCallback((node: SkillNode) => {
    if (node.status === 'locked' || node.status === 'maxed') return;
    if (node.cost && node.cost > currentSkillPoints) return;

    onAction?.({
      type: 'select-skill',
      payload: {
        skillId: node.id,
        currentLevel: node.level,
        cost: node.cost || 1,
      },
    });
  }, [onAction, currentSkillPoints]);

  // 计算网格大小
  const gridSize = useMemo(() => {
    if (skillNodes.length === 0) return { width: 1, height: 1, offsetX: 0, offsetY: 0 };
    
    const maxX = Math.max(...skillNodes.map(n => n.position.x));
    const maxY = Math.max(...skillNodes.map(n => n.position.y));
    const minX = Math.min(...skillNodes.map(n => n.position.x));
    const minY = Math.min(...skillNodes.map(n => n.position.y));
    
    return {
      width: maxX - minX + 1,
      height: maxY - minY + 1,
      offsetX: -minX,
      offsetY: -minY,
    };
  }, [skillNodes]);

  return (
    <div className={styles.container} role="region" aria-label={name}>
      {/* 标题栏 */}
      <div className={styles.header}>
        <h3 className={styles.title}>{name}</h3>
        <div className={styles.points}>
          <span className={styles.pointsLabel}>技能点</span>
          <span className={styles.pointsValue}>
            <span className={styles.currentPoints}>{currentSkillPoints}</span>
            <span className={styles.pointsSeparator}>/</span>
            <span className={styles.maxPoints}>{maxSkillPoints}</span>
          </span>
        </div>
      </div>

      {/* 技能树区域 */}
      <div className={[styles.treeContainer, styles[layout]].filter(Boolean).join(' ')}>
        <svg
          className={styles.connections}
          viewBox={`0 0 ${gridSize.width * 100} ${gridSize.height * 100}`}
          preserveAspectRatio="xMidYMid meet"
        >
          {connections.map(({ from, to }, index) => {
            const fromX = (from.position.x + gridSize.offsetX) * 100 + 50;
            const fromY = (from.position.y + gridSize.offsetY) * 100 + 50;
            const toX = (to.position.x + gridSize.offsetX) * 100 + 50;
            const toY = (to.position.y + gridSize.offsetY) * 100 + 50;
            
            const isActive = from.status === 'unlocked' || from.status === 'maxed';
            
            return (
              <line
                key={`connection-${index}`}
                x1={fromX}
                y1={fromY}
                x2={toX}
                y2={toY}
                className={[styles.connectionLine, isActive && styles.activeLine].filter(Boolean).join(' ')}
              />
            );
          })}
        </svg>

        <div
          className={styles.nodesGrid}
          style={{
            gridTemplateColumns: `repeat(${gridSize.width}, 80px)`,
            gridTemplateRows: `repeat(${gridSize.height}, 80px)`,
          }}
        >
          {skillNodes.map(node => (
            <div
              key={node.id}
              className={[
                styles.nodeWrapper,
                styles[node.status],
              ].filter(Boolean).join(' ')}
              style={{
                gridColumn: node.position.x + gridSize.offsetX + 1,
                gridRow: node.position.y + gridSize.offsetY + 1,
              }}
            >
              <button
                type="button"
                className={styles.node}
                onClick={() => handleNodeClick(node)}
                disabled={node.status === 'locked'}
                title={node.description || node.name}
              >
                <div className={styles.nodeIcon}>
                  {node.icon || node.name.charAt(0)}
                </div>
                <div className={styles.nodeLevel}>
                  {node.level}/{node.maxLevel}
                </div>
                {node.cost && node.status === 'available' && (
                  <div className={styles.nodeCost}>{node.cost}</div>
                )}
              </button>
              <span className={styles.nodeName}>{node.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SkillTreeComponent;
