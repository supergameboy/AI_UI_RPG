import React, { useState, useMemo } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { Button } from '../common';
import type { SkillCategory, SkillType, CostType } from '@ai-rpg/shared';
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
const SKILL_TYPE_NAMES: Record<SkillType, string> = {
  active: '主动',
  passive: '被动',
  toggle: '切换',
};

/**
 * 消耗类型名称映射
 */
const COST_TYPE_NAMES: Record<CostType, string> = {
  mana: 'MP',
  health: 'HP',
  stamina: '体力',
  custom: '特殊',
};

/**
 * 模拟技能数据（用于演示）
 */
const MOCK_SKILLS: Array<{
  id: string;
  name: string;
  description: string;
  type: SkillType;
  category: SkillCategory;
  level: number;
  maxLevel: number;
  cost: { type: CostType; value: number };
  cooldown: number;
  effects: Array<{ type: string; value: number }>;
}> = [
  {
    id: 'skill_001',
    name: '猛击',
    description: '用武器猛烈攻击敌人，造成150%攻击力伤害。',
    type: 'active',
    category: 'combat',
    level: 3,
    maxLevel: 10,
    cost: { type: 'stamina', value: 15 },
    cooldown: 2,
    effects: [{ type: 'damage', value: 150 }],
  },
  {
    id: 'skill_002',
    name: '火球术',
    description: '发射一颗火球，对目标造成魔法伤害并有几率点燃。',
    type: 'active',
    category: 'magic',
    level: 5,
    maxLevel: 10,
    cost: { type: 'mana', value: 30 },
    cooldown: 3,
    effects: [{ type: 'magic_damage', value: 80 }, { type: 'burn_chance', value: 20 }],
  },
  {
    id: 'skill_003',
    name: '铁壁',
    description: '提升自身防御力20%，持续3回合。',
    type: 'active',
    category: 'combat',
    level: 2,
    maxLevel: 5,
    cost: { type: 'stamina', value: 10 },
    cooldown: 4,
    effects: [{ type: 'defense_boost', value: 20 }],
  },
  {
    id: 'skill_004',
    name: '武器精通',
    description: '被动提升武器攻击力10%。',
    type: 'passive',
    category: 'combat',
    level: 4,
    maxLevel: 5,
    cost: { type: 'mana', value: 0 },
    cooldown: 0,
    effects: [{ type: 'attack_boost', value: 10 }],
  },
  {
    id: 'skill_005',
    name: '治疗术',
    description: '恢复目标30%最大生命值。',
    type: 'active',
    category: 'magic',
    level: 3,
    maxLevel: 10,
    cost: { type: 'mana', value: 40 },
    cooldown: 5,
    effects: [{ type: 'heal', value: 30 }],
  },
  {
    id: 'skill_006',
    name: '锻造',
    description: '可以锻造和修理金属装备。',
    type: 'passive',
    category: 'craft',
    level: 2,
    maxLevel: 5,
    cost: { type: 'mana', value: 0 },
    cooldown: 0,
    effects: [{ type: 'craft_ability', value: 1 }],
  },
  {
    id: 'skill_007',
    name: '说服',
    description: '在对话中更容易说服NPC。',
    type: 'passive',
    category: 'social',
    level: 1,
    maxLevel: 5,
    cost: { type: 'mana', value: 0 },
    cooldown: 0,
    effects: [{ type: 'persuasion', value: 15 }],
  },
  {
    id: 'skill_008',
    name: '追踪',
    description: '可以追踪野兽和敌人的踪迹。',
    type: 'passive',
    category: 'exploration',
    level: 2,
    maxLevel: 5,
    cost: { type: 'mana', value: 0 },
    cooldown: 0,
    effects: [{ type: 'tracking', value: 1 }],
  },
];

/**
 * 技能面板组件
 * 显示已学技能列表、分类筛选、技能详情
 */
export const SkillsPanel: React.FC = () => {
  const character = useGameStore((state) => state.character);
  const [category, setCategory] = useState<SkillCategory | 'all'>('all');
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);

  // 使用模拟数据
  const skills = MOCK_SKILLS;

  // 过滤技能
  const filteredSkills = useMemo(() => {
    if (category === 'all') return skills;
    return skills.filter((skill) => skill.category === category);
  }, [skills, category]);

  // 选中的技能
  const selectedSkill = skills.find((skill) => skill.id === selectedSkillId);

  // 使用技能
  const handleUseSkill = (skillId: string) => {
    console.log('使用技能:', skillId);
    // TODO: 实现使用技能逻辑
  };

  // 按分类统计技能数量
  const skillCounts = useMemo(() => {
    const counts: Record<string, number> = { all: skills.length };
    skills.forEach((skill) => {
      counts[skill.category] = (counts[skill.category] || 0) + 1;
    });
    return counts;
  }, [skills]);

  if (!character.id) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>⚡</div>
        <p>暂无技能数据</p>
        <p className={styles.emptyHint}>创建角色后查看技能</p>
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
                    {CATEGORY_OPTIONS.find((c) => c.value === skill.category)?.icon || '⚡'}
                  </div>
                  <div className={styles.skillInfo}>
                    <h4 className={styles.skillName}>{skill.name}</h4>
                    <div className={styles.skillMeta}>
                      <span className={styles.skillType}>
                        {SKILL_TYPE_NAMES[skill.type]}
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
              {CATEGORY_OPTIONS.find((c) => c.value === selectedSkill.category)?.icon || '⚡'}
            </div>
            <div className={styles.detailTitle}>
              <h4 className={styles.detailName}>{selectedSkill.name}</h4>
              <span className={styles.detailCategory}>
                {CATEGORY_OPTIONS.find((c) => c.value === selectedSkill.category)?.label} · 
                {SKILL_TYPE_NAMES[selectedSkill.type]}
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
            {selectedSkill.cost.value > 0 && (
              <div className={styles.detailStat}>
                <span className={styles.detailStatLabel}>消耗</span>
                <span className={styles.detailStatValue}>
                  {selectedSkill.cost.value} {COST_TYPE_NAMES[selectedSkill.cost.type]}
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
          {selectedSkill.effects.length > 0 && (
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
