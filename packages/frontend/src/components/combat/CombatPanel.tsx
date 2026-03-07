import React, { useState, useMemo } from 'react';
import { ActionType, type CombatInstanceData, type CombatUnit, type CombatState } from '@ai-rpg/shared';
import { CombatUnitCard } from './CombatUnitCard';
import { ActionMenu } from './ActionMenu';
import { CombatLog } from './CombatLog';
import { TurnOrder } from './TurnOrder';
import { useGameStore } from '../../stores/gameStore';
import styles from './CombatPanel.module.css';

/**
 * 战斗面板组件属性
 */
export interface CombatPanelProps {
  combat: CombatInstanceData;
  onAction: (action: ActionType, targetId?: string, skillId?: string, itemId?: string) => void;
  onEndCombat: () => void;
}

/**
 * 战斗状态映射
 */
const COMBAT_STATE_LABELS: Record<CombatState, string> = {
  preparing: '准备中',
  in_progress: '战斗中',
  player_turn: '玩家回合',
  enemy_turn: '敌方回合',
  ended: '战斗结束',
};

/**
 * 战斗主面板组件
 * 整合所有战斗相关组件，显示完整的战斗界面
 */
export const CombatPanel: React.FC<CombatPanelProps> = ({
  combat,
  onAction,
  onEndCombat,
}) => {
  const [targetMode, setTargetMode] = useState(false);
  const [pendingAction, setPendingAction] = useState<ActionType | null>(null);

  // 从 store 获取玩家技能和物品
  const skills = useGameStore((state) => state.skills);
  const inventory = useGameStore((state) => state.inventory);

  // 将 units 数组转换为 Map
  const unitsMap = useMemo(() => {
    return new Map<string, CombatUnit>(combat.units);
  }, [combat.units]);

  // 获取所有单位列表
  const allUnits = useMemo(() => {
    return Array.from(unitsMap.values());
  }, [unitsMap]);

  // 获取当前回合单位
  const currentUnitId = combat.turnOrder[combat.currentTurnIndex];
  const currentUnit = unitsMap.get(currentUnitId);

  // 判断是否为玩家回合
  const isPlayerTurn = currentUnit?.type === 'player' && combat.state !== 'ended';

  // 分离敌人和玩家/盟友
  const enemies = useMemo(() => {
    return allUnits.filter((unit) => unit.type === 'enemy');
  }, [allUnits]);

  const allies = useMemo(() => {
    return allUnits.filter((unit) => unit.type === 'player' || unit.type === 'ally');
  }, [allUnits]);

  // 获取所有战斗日志
  const combatActions = useMemo(() => {
    return combat.turnHistory.flatMap((turn) => turn.actions);
  }, [combat.turnHistory]);

  // 处理行动
  const handleAction = (
    action: ActionType,
    targetId?: string,
    skillId?: string,
    itemId?: string
  ) => {
    // 如果是攻击且没有目标，进入目标选择模式
    if (action === ActionType.ATTACK && !targetId && !targetMode) {
      setTargetMode(true);
      setPendingAction(action);
      return;
    }

    // 如果在目标选择模式且有目标
    if (targetMode && targetId) {
      setTargetMode(false);
      setPendingAction(null);
      onAction(pendingAction || action, targetId, skillId, itemId);
      return;
    }

    // 取消目标选择模式
    if (targetMode && !targetId) {
      setTargetMode(false);
      setPendingAction(null);
      return;
    }

    // 其他情况直接执行
    onAction(action, targetId, skillId, itemId);
  };

  // 获取可选择的单位（用于目标选择）
  const getTargetableUnits = (): CombatUnit[] => {
    return allUnits.filter((unit) => unit.isAlive);
  };

  // 战斗结束显示
  if (combat.state === 'ended' && combat.result) {
    return (
      <div className={styles.container}>
        <div className={styles.resultOverlay}>
          <div className={styles.resultCard}>
            <div className={styles.resultIcon}>
              {combat.result.victory ? '🏆' : '💀'}
            </div>
            <h2 className={styles.resultTitle}>
              {combat.result.victory ? '战斗胜利！' : '战斗失败...'}
            </h2>
            {combat.result.fled && (
              <p className={styles.resultSubtitle}>成功逃脱</p>
            )}
            <div className={styles.resultStats}>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>总回合数</span>
                <span className={styles.statValue}>{combat.result.totalTurns}</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>战斗时长</span>
                <span className={styles.statValue}>
                  {Math.floor(combat.result.duration / 1000)}秒
                </span>
              </div>
              {combat.result.rewards && (
                <>
                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>经验值</span>
                    <span className={styles.statValue}>+{combat.result.rewards.experience}</span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>金币</span>
                    <span className={styles.statValue}>+{combat.result.rewards.gold}</span>
                  </div>
                </>
              )}
            </div>
            <button className={styles.endButton} onClick={onEndCombat}>
              确认
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* 回合顺序条 */}
      <div className={styles.turnOrderSection}>
        <TurnOrder
          turnOrder={combat.turnOrder}
          units={allUnits}
          currentIndex={combat.currentTurnIndex}
        />
      </div>

      {/* 主战斗区域 */}
      <div className={styles.mainArea}>
        {/* 敌人区域 */}
        <div className={styles.enemyArea}>
          <div className={styles.areaHeader}>
            <span className={styles.areaIcon}>👹</span>
            <span className={styles.areaTitle}>敌方</span>
            <span className={styles.unitCount}>
              {enemies.filter((u) => u.isAlive).length} / {enemies.length}
            </span>
          </div>
          <div className={styles.unitsGrid}>
            {enemies.map((unit) => (
              <CombatUnitCard
                key={unit.id}
                unit={unit}
                isCurrentTurn={currentUnitId === unit.id}
                isTargetable={targetMode && unit.isAlive}
                onSelect={() => handleAction(ActionType.ATTACK, unit.id)}
              />
            ))}
          </div>
        </div>

        {/* 玩家/盟友区域 */}
        <div className={styles.allyArea}>
          <div className={styles.areaHeader}>
            <span className={styles.areaIcon}>👥</span>
            <span className={styles.areaTitle}>我方</span>
            <span className={styles.unitCount}>
              {allies.filter((u) => u.isAlive).length} / {allies.length}
            </span>
          </div>
          <div className={styles.unitsGrid}>
            {allies.map((unit) => (
              <CombatUnitCard
                key={unit.id}
                unit={unit}
                isCurrentTurn={currentUnitId === unit.id}
                isTargetable={false}
              />
            ))}
          </div>
        </div>
      </div>

      {/* 底部区域 */}
      <div className={styles.bottomArea}>
        {/* 行动菜单 */}
        <div className={styles.actionSection}>
          <ActionMenu
            onAction={handleAction}
            skills={skills}
            items={inventory}
            isPlayerTurn={isPlayerTurn}
            targetMode={targetMode}
            availableTargets={getTargetableUnits()}
          />
        </div>

        {/* 战斗日志 */}
        <div className={styles.logSection}>
          <CombatLog messages={combatActions} />
        </div>
      </div>

      {/* 战斗状态指示器 */}
      <div className={styles.statusIndicator}>
        <span className={styles.statusText}>
          {COMBAT_STATE_LABELS[combat.state]}
        </span>
        {currentUnit && (
          <span className={styles.currentTurnUnit}>
            当前: {currentUnit.name}
          </span>
        )}
      </div>
    </div>
  );
};

export default CombatPanel;
