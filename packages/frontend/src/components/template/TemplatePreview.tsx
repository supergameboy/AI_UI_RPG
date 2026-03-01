import React, { useState, useMemo } from 'react';
import type { StoryTemplate } from '@ai-rpg/shared';
import { Button, Icon } from '../common';
import styles from './TemplatePreview.module.css';

export interface TemplatePreviewProps {
  template: StoryTemplate;
  onClose: () => void;
}

type PreviewTab = 'character' | 'scene';

const RARITY_COLORS: Record<string, string> = {
  common: '#9e9e9e',
  uncommon: '#4caf50',
  rare: '#2196f3',
  epic: '#9c27b0',
  legendary: '#ff9800',
  unique: '#f44336',
};

const ROLE_LABELS: Record<string, string> = {
  merchant: '商人',
  quest_giver: '任务发布者',
  enemy: '敌人',
  ally: '盟友',
  neutral: '中立',
  custom: '自定义',
};

const QUEST_TYPE_LABELS: Record<string, string> = {
  main: '主线',
  side: '支线',
  daily: '日常',
  hidden: '隐藏',
};

const ITEM_TYPE_LABELS: Record<string, string> = {
  weapon: '武器',
  armor: '护甲',
  accessory: '饰品',
  consumable: '消耗品',
  material: '材料',
  quest: '任务物品',
  misc: '杂项',
};

const DEFAULT_SKILL_LABELS: Record<string, string> = {
  firearms: '枪械',
  melee: '近战',
  tactics: '战术',
  intimidation: '威吓',
  netrunning: '网络入侵',
  programming: '编程',
  electronics: '电子学',
  stealth: '潜行',
  medicine: '医疗',
  cybertech: '义体技术',
  chemistry: '化学',
  first_aid: '急救',
  lockpicking: '开锁',
  perception: '感知',
  persuasion: '说服',
  deception: '欺骗',
  streetwise: '街头智慧',
  investigation: '调查',
  survival: '生存',
  improvisation: '即兴发挥',
  corporate_knowledge: '企业知识',
  technology: '技术',
  negotiation: '谈判',
};

export const TemplatePreview: React.FC<TemplatePreviewProps> = ({ template, onClose }) => {
  const [activeTab, setActiveTab] = useState<PreviewTab>('character');

  const { characterCreation, startingScene } = template;
  const { races, classes, backgrounds, attributes } = characterCreation;
  const { npcs, items, quests } = startingScene;

  const attributeNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    attributes.forEach(attr => {
      map[attr.id] = attr.name;
      if (attr.abbreviation) {
        map[attr.abbreviation] = attr.name;
      }
    });
    return map;
  }, [attributes]);

  const getAttributeName = (attrId: string): string => {
    return attributeNameMap[attrId] || attrId;
  };

  const getSkillName = (skillId: string): string => {
    return DEFAULT_SKILL_LABELS[skillId] || skillId;
  };

  const getStatName = (statId: string): string => {
    const statLabels: Record<string, string> = {
      attack: '攻击',
      critical: '暴击',
      energy_damage: '能量伤害',
      hacking_bonus: '黑客加成',
      interface_speed: '接口速度',
      ...attributeNameMap,
    };
    return statLabels[statId] || statId;
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>模板预览测试</h2>
          <Button
            variant="ghost"
            size="small"
            onClick={onClose}
            icon={<Icon name="close" size={18} />}
          >
            关闭
          </Button>
        </div>

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'character' ? styles.active : ''}`}
            onClick={() => setActiveTab('character')}
          >
            <Icon name="character" size={18} />
            <span>角色创建预览</span>
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'scene' ? styles.active : ''}`}
            onClick={() => setActiveTab('scene')}
          >
            <Icon name="map" size={18} />
            <span>初始场景预览</span>
          </button>
        </div>

        <div className={styles.content}>
          {activeTab === 'character' && (
            <div className={styles.characterPreview}>
              {/* 种族列表 */}
              <section className={styles.section}>
                <h3 className={styles.sectionTitle}>
                  <Icon name="character" size={20} />
                  种族 ({races.length})
                </h3>
                {races.length === 0 ? (
                  <p className={styles.emptyText}>暂无种族定义</p>
                ) : (
                  <div className={styles.cardGrid}>
                    {races.map((race) => (
                      <div key={race.id} className={styles.card}>
                        <div className={styles.cardHeader}>
                          <h4 className={styles.cardTitle}>{race.name}</h4>
                        </div>
                        <p className={styles.cardDescription}>{race.description}</p>
                        {Object.keys(race.bonuses).length > 0 && (
                          <div className={styles.cardTags}>
                            <span className={styles.tagLabel}>加成:</span>
                            {Object.entries(race.bonuses).map(([attr, value]) => (
                              <span key={attr} className={`${styles.tag} ${styles.tagPositive}`}>
                                {getAttributeName(attr)} +{value}
                              </span>
                            ))}
                          </div>
                        )}
                        {race.abilities.length > 0 && (
                          <div className={styles.cardTags}>
                            <span className={styles.tagLabel}>特性:</span>
                            {race.abilities.map((ability) => (
                              <span key={ability} className={styles.tag}>
                                {ability}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* 职业列表 */}
              <section className={styles.section}>
                <h3 className={styles.sectionTitle}>
                  <Icon name="skills" size={20} />
                  职业 ({classes.length})
                </h3>
                {classes.length === 0 ? (
                  <p className={styles.emptyText}>暂无职业定义</p>
                ) : (
                  <div className={styles.cardGrid}>
                    {classes.map((cls) => (
                      <div key={cls.id} className={styles.card}>
                        <div className={styles.cardHeader}>
                          <h4 className={styles.cardTitle}>{cls.name}</h4>
                          <span className={styles.cardBadge}>HD: {cls.hitDie}</span>
                        </div>
                        <p className={styles.cardDescription}>{cls.description}</p>
                        {cls.primaryAttributes.length > 0 && (
                          <div className={styles.cardTags}>
                            <span className={styles.tagLabel}>主属性:</span>
                            {cls.primaryAttributes.map((attr) => (
                              <span key={attr} className={`${styles.tag} ${styles.tagPrimary}`}>
                                {getAttributeName(attr)}
                              </span>
                            ))}
                          </div>
                        )}
                        {cls.skillProficiencies.length > 0 && (
                          <div className={styles.cardTags}>
                            <span className={styles.tagLabel}>技能:</span>
                            {cls.skillProficiencies.slice(0, 4).map((skill) => (
                              <span key={skill} className={styles.tag}>
                                {getSkillName(skill)}
                              </span>
                            ))}
                            {cls.skillProficiencies.length > 4 && (
                              <span className={styles.tag}>+{cls.skillProficiencies.length - 4}</span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* 背景列表 */}
              <section className={styles.section}>
                <h3 className={styles.sectionTitle}>
                  <Icon name="quests" size={20} />
                  背景 ({backgrounds.length})
                </h3>
                {backgrounds.length === 0 ? (
                  <p className={styles.emptyText}>暂无背景定义</p>
                ) : (
                  <div className={styles.cardGrid}>
                    {backgrounds.map((bg) => (
                      <div key={bg.id} className={styles.card}>
                        <div className={styles.cardHeader}>
                          <h4 className={styles.cardTitle}>{bg.name}</h4>
                        </div>
                        <p className={styles.cardDescription}>{bg.description}</p>
                        {bg.feature && (
                          <div className={styles.feature}>
                            <span className={styles.featureLabel}>特性:</span>
                            <span className={styles.featureText}>{bg.feature}</span>
                          </div>
                        )}
                        {bg.skillProficiencies.length > 0 && (
                          <div className={styles.cardTags}>
                            <span className={styles.tagLabel}>技能:</span>
                            {bg.skillProficiencies.map((skill) => (
                              <span key={skill} className={styles.tag}>
                                {getSkillName(skill)}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}

          {activeTab === 'scene' && (
            <div className={styles.scenePreview}>
              {/* 地点信息 */}
              <section className={styles.section}>
                <h3 className={styles.sectionTitle}>
                  <Icon name="map" size={20} />
                  起始地点
                </h3>
                <div className={styles.locationCard}>
                  <h4 className={styles.locationName}>{startingScene.location || '未设置'}</h4>
                  <p className={styles.locationDescription}>
                    {startingScene.description || '暂无描述'}
                  </p>
                </div>
              </section>

              {/* NPC 列表 */}
              <section className={styles.section}>
                <h3 className={styles.sectionTitle}>
                  <Icon name="character" size={20} />
                  NPC ({npcs.length})
                </h3>
                {npcs.length === 0 ? (
                  <p className={styles.emptyText}>暂无 NPC</p>
                ) : (
                  <div className={styles.list}>
                    {npcs.map((npc) => (
                      <div key={npc.id} className={styles.listItem}>
                        <div className={styles.listItemHeader}>
                          <span className={styles.listItemName}>{npc.name}</span>
                          {npc.title && <span className={styles.listItemSubtitle}>{npc.title}</span>}
                          <span
                            className={styles.roleBadge}
                            style={{
                              background: npc.role === 'enemy' ? 'rgba(244, 67, 54, 0.15)' :
                                npc.role === 'ally' ? 'rgba(76, 175, 80, 0.15)' :
                                  'rgba(33, 150, 243, 0.15)',
                              color: npc.role === 'enemy' ? '#f44336' :
                                npc.role === 'ally' ? '#4caf50' :
                                  '#2196f3',
                            }}
                          >
                            {ROLE_LABELS[npc.role] || npc.role}
                          </span>
                        </div>
                        <p className={styles.listItemDescription}>{npc.description}</p>
                        {npc.stats && Object.keys(npc.stats).length > 0 && (
                          <div className={styles.statsRow}>
                            {npc.stats.level !== undefined && (
                              <span className={styles.stat}>Lv.{npc.stats.level}</span>
                            )}
                            {npc.stats.hp !== undefined && (
                              <span className={styles.stat}>HP: {npc.stats.hp}</span>
                            )}
                            {npc.stats.attack !== undefined && (
                              <span className={styles.stat}>ATK: {npc.stats.attack}</span>
                            )}
                            {npc.stats.defense !== undefined && (
                              <span className={styles.stat}>DEF: {npc.stats.defense}</span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* 物品列表 */}
              <section className={styles.section}>
                <h3 className={styles.sectionTitle}>
                  <Icon name="inventory" size={20} />
                  物品 ({items.length})
                </h3>
                {items.length === 0 ? (
                  <p className={styles.emptyText}>暂无物品</p>
                ) : (
                  <div className={styles.list}>
                    {items.map((item) => (
                      <div key={item.id} className={styles.listItem}>
                        <div className={styles.listItemHeader}>
                          <span
                            className={styles.listItemName}
                            style={{ color: RARITY_COLORS[item.rarity] || 'inherit' }}
                          >
                            {item.name}
                          </span>
                          <span className={styles.typeBadge}>{ITEM_TYPE_LABELS[item.type] || item.type}</span>
                          <span
                            className={styles.rarityBadge}
                            style={{
                              background: `${RARITY_COLORS[item.rarity]}20`,
                              color: RARITY_COLORS[item.rarity],
                            }}
                          >
                            {item.rarity}
                          </span>
                        </div>
                        <p className={styles.listItemDescription}>{item.description}</p>
                        {item.stats && Object.keys(item.stats).length > 0 && (
                          <div className={styles.statsRow}>
                            {Object.entries(item.stats).map(([stat, value]) => (
                              <span key={stat} className={`${styles.stat} ${styles.statPositive}`}>
                                {getStatName(stat)} +{value}
                              </span>
                            ))}
                          </div>
                        )}
                        {item.quantity !== undefined && item.quantity > 1 && (
                          <span className={styles.quantity}>x{item.quantity}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* 任务列表 */}
              <section className={styles.section}>
                <h3 className={styles.sectionTitle}>
                  <Icon name="quests" size={20} />
                  任务 ({quests.length})
                </h3>
                {quests.length === 0 ? (
                  <p className={styles.emptyText}>暂无任务</p>
                ) : (
                  <div className={styles.list}>
                    {quests.map((quest) => (
                      <div key={quest.id} className={styles.listItem}>
                        <div className={styles.listItemHeader}>
                          <span className={styles.listItemName}>{quest.name}</span>
                          <span
                            className={styles.questTypeBadge}
                            style={{
                              background: quest.type === 'main' ? 'rgba(255, 152, 0, 0.15)' :
                                quest.type === 'hidden' ? 'rgba(156, 39, 176, 0.15)' :
                                  'rgba(33, 150, 243, 0.15)',
                              color: quest.type === 'main' ? '#ff9800' :
                                quest.type === 'hidden' ? '#9c27b0' :
                                  '#2196f3',
                            }}
                          >
                            {QUEST_TYPE_LABELS[quest.type] || quest.type}
                          </span>
                        </div>
                        <p className={styles.listItemDescription}>{quest.description}</p>
                        {quest.objectives.length > 0 && (
                          <div className={styles.objectives}>
                            <span className={styles.objectivesLabel}>目标:</span>
                            <ul className={styles.objectivesList}>
                              {quest.objectives.map((obj) => (
                                <li key={obj.id}>
                                  {obj.description} ({obj.required})
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {quest.rewards && quest.rewards.length > 0 && (
                          <div className={styles.rewards}>
                            <span className={styles.rewardsLabel}>奖励:</span>
                            {quest.rewards.map((reward, idx) => (
                              <span key={idx} className={styles.reward}>
                                {reward.type === 'experience' ? `${reward.value} 经验` :
                                  reward.type === 'currency' ? `${reward.value} 金币` :
                                    reward.type === 'item' ? `${reward.value}${reward.quantity ? ` x${reward.quantity}` : ''}` :
                                      `${reward.value}`}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TemplatePreview;
