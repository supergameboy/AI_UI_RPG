import React, { useState, useMemo } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { Button } from '../common';
import type { SkillCategory, SkillType } from '@ai-rpg/shared';
import styles from './SkillsPanel.module.css';

/**
 * 技能分类选项
 */
const CATEGORY_OPTIONS: { value: SkillCategory | 'all'; label: string; icon: string }[] = [
  { value: 'all', label: '全部', icon: '📚' },
  { value: 'combat', label: '战斗', icon: '⚔️' },
  { value: 'magic', label: '魔法', icon: '🔮' },
  { value: 'craft', label: '工艺', icon: '🔨' },
  { value: 'social', label: '社交', icon: '💬' },
  { value: 'exploration', label: '探索', icon: '🗺️' },
];

/**
 * 技能类型名称映射
 */
const SKILL_TYPE_NAMES: Record<SkillType | 'active' | 'passive', string> = {
  active: '主动',
  passive: '被动',
  toggle: '切换',
};

/**
 * 消耗类型名称映射
 */
const COST_TYPE_NAMES: Record<string, string> = {
  mp: 'MP',
  hp: 'HP',
  mana: 'MP',
  health: 'HP',
  stamina: '体力',
  item: '物品',
  custom: '特殊',
};

/**
 * 技能面板组件
 * 显示已学技能列表、分类筛选、技能详情
 */
export const SkillsPanel: React.FC = () => {
  const skills = useGameStore((state) => state.skills);
  const sendGameAction = useGameStore((state) => state.sendGameAction);
  const [category, setCategory] = useState<SkillCategory | 'all'>('all');
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);

  // 过滤技能
  const filteredSkills = useMemo(() => {
    if (category === 'all') return skills;
    return skills.filter((skill) => skill.category === category);
  }, [skills, category]);

  // 选中的技能
  const selectedSkill = skills.find((skill) => skill.id === selectedSkillId);

  // 使用技能
  const handleUseSkill = async (skillId: string) => {
    await sendGameAction({
      type: 'use_skill',
      payload: { skillId },
    });
  };

  // 按分类统计技能数量
  const skillCounts = useMemo(() => {
    const counts: Record<string, number> = { all: skills.length };
    for (const skill of skills) {
      const cat = skill.category || 'custom';
      counts[cat] = (counts[cat] || 0) + 1;
    }
    return counts;
  }, [skills]);

  // 处理空数据状态
  if (!skills || skills.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>⚔️</div>
        <p>暂无技能数据</p>
        <p className={styles.emptyHint}>获取技能后查看详细信息</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* 技能统计 */}
      <div className={styles.statsBar}>
        <div className={styles.statItem}>
          <span className={styles.statIcon}>📚</span>
          <span className={styles.statLabel}>已学技能</span>
          <span className={styles.statValue}>{skills.length}</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statIcon}>⭐</span>
          <span className={styles.statLabel}>技能等级</span>
          <span className={styles.statValue}>
            {skills.reduce((sum, s) => sum + s.level, 0)}
          </span>
        </div>
      </div>

      {/* 分类标签 */}
      <div className={styles.categoryTabs}>
        {CATEGORY_OPTIONS.map((option) => (
          <button
            key={option.value}
            className={[
              styles.categoryTab,
              category === option.value && styles.categoryTabActive,
            ].filter(Boolean).join(' ')}
            onClick={() => setCategory(option.value)}
          >
            <span className={styles.categoryIcon}>{option.icon}</span>
            <span className={styles.categoryLabel}>{option.label}</span>
            <span className={styles.categoryCount}>
              {skillCounts[option.value] || 0}
            </span>
          </button>
        ))}
      </div>

      {/* 技能列表 */}
      <div className={styles.skillsContainer}>
        {filteredSkills.length === 0 ? (
          <div className={styles.noSkills}>
            <span className={styles.noSkillsIcon}>🔮</span>
            <p>没有技能</p>
          </div>
        ) : (
          <div className={styles.skillsList}>
            {filteredSkills.map((skill) => (
              <div
                key={skill.id}
                className={[
                  styles.skillCard,
                  selectedSkillId === skill.id && styles.skillCardSelected,
                ].filter(Boolean).join(' ')}
                onClick={() => setSelectedSkillId(skill.id)}
              >
                <div className={styles.skillHeader}>
                  <div className={styles.skillIcon}>
                    ⚡
                  </div>
                  <div className={styles.skillInfo}>
                    <h4 className={styles.skillName}>{skill.name}</h4>
                    <div className={styles.skillMeta}>
                      <span className={styles.skillType}>
                        {SKILL_TYPE_NAMES[skill.type] || skill.type}
                      </span>
                      <span className={styles.skillLevel}>
                        Lv.{skill.level}/{skill.maxLevel}
                      </span>
                    </div>
                  </div>
                </div>
                <div className={styles.skillLevelBar}>
                  <div
                    className={styles.skillLevelFill}
                    style={{ width: `${(skill.level / skill.maxLevel) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 技能详情 */}
      {selectedSkill && (
        <div className={styles.skillDetail}>
          <div className={styles.detailHeader}>
            <div className={styles.detailIcon}>
              ⚡
            </div>
            <div className={styles.detailTitle}>
              <h4 className={styles.detailName}>{selectedSkill.name}</h4>
              <span className={styles.detailCategory}>
                {SKILL_TYPE_NAMES[selectedSkill.type] || selectedSkill.type}
              </span>
            </div>
            <button
              className={styles.closeDetail}
              onClick={() => setSelectedSkillId(null)}
            >
              ✕
            </button>
          </div>

          <p className={styles.detailDescription}>{selectedSkill.description}</p>

          <div className={styles.detailStats}>
            {/* 消耗 */}
            {selectedSkill.cost && selectedSkill.cost.value > 0 && (
              <div className={styles.detailStat}>
                <span className={styles.detailStatLabel}>消耗</span>
                <span className={styles.detailStatValue}>
                  {selectedSkill.cost.value} {COST_TYPE_NAMES[selectedSkill.cost.type] || selectedSkill.cost.type}
                </span>
              </div>
            )}
            {/* 冷却 */}
            {selectedSkill.cooldown > 0 && (
              <div className={styles.detailStat}>
                <span className={styles.detailStatLabel}>冷却</span>
                <span className={styles.detailStatValue}>
                  {selectedSkill.cooldown} 回合
                </span>
              </div>
            )}
            {/* 等级 */}
            <div className={styles.detailStat}>
              <span className={styles.detailStatLabel}>等级</span>
              <span className={styles.detailStatValue}>
                {selectedSkill.level} / {selectedSkill.maxLevel}
              </span>
            </div>
          </div>

          {/* 效果 */}
          {selectedSkill.effects && selectedSkill.effects.length > 0 && (
            <div className={styles.detailEffects}>
              <h5 className={styles.effectsTitle}>效果</h5>
              {selectedSkill.effects.map((effect, index) => (
                <div key={index} className={styles.effectItem}>
                  <span className={styles.effectType}>{effect.type}</span>
                  <span className={styles.effectValue}>+{effect.value}%</span>
                </div>
              ))}
            </div>
          )}

          {/* 使用按钮 */}
          {selectedSkill.type === 'active' && (
            <div className={styles.detailActions}>
              <Button
                size="small"
                variant="primary"
                fullWidth
                onClick={() => handleUseSkill(selectedSkill.id)}
              >
                使用技能
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SkillsPanel;
