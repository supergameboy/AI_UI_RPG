import React, { useState, useMemo } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { ProgressBar } from '../common';
import type { NPCRole, NPCDisposition } from '@ai-rpg/shared';
import styles from './NPCPanel.module.css';

/**
 * NPC 角色类型映射
 */
const NPC_ROLE_NAMES: Record<NPCRole, string> = {
  merchant: '商人',
  quest_giver: '任务发布者',
  enemy: '敌人',
  ally: '盟友',
  neutral: '中立',
  romance: '可恋爱对象',
  companion: '同伴',
  custom: '其他',
};

/**
 * NPC 角色图标映射
 */
const NPC_ROLE_ICONS: Record<NPCRole, string> = {
  merchant: '🏪',
  quest_giver: '📜',
  enemy: '⚔️',
  ally: '🤝',
  neutral: '👤',
  romance: '💕',
  companion: '👥',
  custom: '❓',
};

/**
 * NPC 态度映射
 */
const NPC_DISPOSITION_NAMES: Record<NPCDisposition, string> = {
  helpful: '乐于助人',
  neutral: '中立',
  unfriendly: '不友好',
  hostile: '敌对',
};

/**
 * NPC 态度颜色映射
 */
const NPC_DISPOSITION_COLORS: Record<NPCDisposition, string> = {
  helpful: '#4CAF50',
  neutral: '#9E9E9E',
  unfriendly: '#FF9800',
  hostile: '#F44336',
};

/**
 * 关系类型映射
 */
const RELATIONSHIP_TYPE_NAMES: Record<string, string> = {
  neutral: '中立',
  friendly: '友好',
  hostile: '敌对',
  romantic: '恋爱',
  custom: '特殊',
};

/**
 * 心情映射
 */
const MOOD_NAMES: Record<string, string> = {
  happy: '开心',
  neutral: '平静',
  sad: '悲伤',
  angry: '愤怒',
  fearful: '恐惧',
  excited: '兴奋',
};

/**
 * 心情图标映射
 */
const MOOD_ICONS: Record<string, string> = {
  happy: '😊',
  neutral: '😐',
  sad: '😢',
  angry: '😠',
  fearful: '😨',
  excited: '🤩',
};

/**
 * NPC 面板组件
 * 显示已遇到的 NPC 列表和详细信息
 */
export const NPCPanel: React.FC = () => {
  const npcs = useGameStore((state) => state.npcs);
  const relationships = useGameStore((state) => state.npcRelationships);
  
  const [selectedNpcId, setSelectedNpcId] = useState<string | null>(null);
  const [filterRole, setFilterRole] = useState<NPCRole | 'all'>('all');

  // 过滤 NPC
  const filteredNpcs = useMemo(() => {
    return npcs.filter((npc) => {
      if (filterRole !== 'all' && npc.role !== filterRole) return false;
      // 只显示已遇到的 NPC
      const relationship = relationships[npc.id];
      return relationship?.flags.met !== false;
    });
  }, [npcs, filterRole, relationships]);

  // 选中的 NPC
  const selectedNpc = npcs.find((npc) => npc.id === selectedNpcId);
  const selectedRelationship = selectedNpcId ? relationships[selectedNpcId] : null;

  // NPC 统计
  const npcStats = useMemo(() => {
    const metNpcs = npcs.filter((npc) => relationships[npc.id]?.flags.met);
    return {
      total: metNpcs.length,
      friendly: metNpcs.filter((npc) => relationships[npc.id]?.type === 'friendly').length,
      hostile: metNpcs.filter((npc) => relationships[npc.id]?.type === 'hostile').length,
      companions: metNpcs.filter((npc) => npc.flags.isCompanion).length,
    };
  }, [npcs, relationships]);

  // 获取关系等级描述
  const getRelationshipLevelDesc = (level: number): string => {
    if (level >= 90) return '挚友';
    if (level >= 75) return '亲密';
    if (level >= 60) return '友好';
    if (level >= 40) return '中立';
    if (level >= 20) return '疏远';
    return '陌生';
  };

  // 获取关系等级颜色
  const getRelationshipLevelColor = (level: number): string => {
    if (level >= 75) return '#4CAF50';
    if (level >= 50) return '#8BC34A';
    if (level >= 25) return '#FFC107';
    return '#FF5722';
  };

  // 格式化最后互动时间
  const formatLastInteraction = (timestamp: number | null): string => {
    if (!timestamp) return '从未';
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    return `${days}天前`;
  };

  // 处理空数据状态
  if (!npcs || npcs.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>👥</div>
        <p>附近没有NPC</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* 统计栏 */}
      <div className={styles.statsBar}>
        <div className={styles.statItem}>
          <span className={styles.statIcon}>👥</span>
          <span className={styles.statLabel}>已遇</span>
          <span className={styles.statValue}>{npcStats.total}</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statIcon}>💚</span>
          <span className={styles.statLabel}>友好</span>
          <span className={styles.statValue}>{npcStats.friendly}</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statIcon}>❤️</span>
          <span className={styles.statLabel}>敌对</span>
          <span className={styles.statValue}>{npcStats.hostile}</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statIcon}>🤝</span>
          <span className={styles.statLabel}>同伴</span>
          <span className={styles.statValue}>{npcStats.companions}</span>
        </div>
      </div>

      {/* 筛选栏 */}
      <div className={styles.filterBar}>
        <span className={styles.filterLabel}>角色类型</span>
        <div className={styles.filterTabs}>
          <button
            className={[styles.filterTab, filterRole === 'all' && styles.filterTabActive].filter(Boolean).join(' ')}
            onClick={() => setFilterRole('all')}
          >
            全部
          </button>
          {Object.entries(NPC_ROLE_NAMES).map(([key, name]) => (
            <button
              key={key}
              className={[styles.filterTab, filterRole === key && styles.filterTabActive].filter(Boolean).join(' ')}
              onClick={() => setFilterRole(key as NPCRole)}
            >
              {NPC_ROLE_ICONS[key as NPCRole]} {name}
            </button>
          ))}
        </div>
      </div>

      {/* NPC 列表 */}
      <div className={styles.npcsContainer}>
        {filteredNpcs.length === 0 ? (
          <div className={styles.noNpcs}>
            <span className={styles.noNpcsIcon}>👥</span>
            <p>没有符合条件的 NPC</p>
          </div>
        ) : (
          <div className={styles.npcsList}>
            {filteredNpcs.map((npc) => {
              const relationship = relationships[npc.id];
              return (
                <div
                  key={npc.id}
                  className={[
                    styles.npcCard,
                    selectedNpcId === npc.id && styles.npcCardSelected,
                  ].filter(Boolean).join(' ')}
                  onClick={() => setSelectedNpcId(npc.id)}
                >
                  <div className={styles.npcHeader}>
                    <div className={styles.npcAvatar}>
                      <span className={styles.npcAvatarIcon}>
                        {NPC_ROLE_ICONS[npc.role]}
                      </span>
                    </div>
                    <div className={styles.npcInfo}>
                      <h4 className={styles.npcName}>{npc.name}</h4>
                      <div className={styles.npcMeta}>
                        <span className={styles.npcTitle}>{npc.title}</span>
                        <span className={styles.npcSeparator}>|</span>
                        <span className={styles.npcRace}>{npc.race}</span>
                      </div>
                    </div>
                    {relationship && (
                      <div className={styles.npcRelationship}>
                        <span
                          className={styles.relationshipLevel}
                          style={{ color: getRelationshipLevelColor(relationship.level) }}
                        >
                          {getRelationshipLevelDesc(relationship.level)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* 关系进度条 */}
                  {relationship && (
                    <div className={styles.relationshipBar}>
                      <ProgressBar
                        value={relationship.level}
                        max={100}
                        color="primary"
                        size="small"
                      />
                    </div>
                  )}

                  {/* 状态标签 */}
                  <div className={styles.npcTags}>
                    {npc.flags.isCompanion && (
                      <span className={styles.tagCompanion}>同伴</span>
                    )}
                    {npc.flags.isMerchant && (
                      <span className={styles.tagMerchant}>商人</span>
                    )}
                    {npc.flags.isQuestGiver && (
                      <span className={styles.tagQuest}>任务</span>
                    )}
                    {!npc.status.isAlive && (
                      <span className={styles.tagDead}>已死亡</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* NPC 详情 */}
      {selectedNpc && (
        <div className={styles.npcDetail}>
          <div className={styles.detailHeader}>
            <div className={styles.detailAvatar}>
              <span className={styles.detailAvatarIcon}>
                {NPC_ROLE_ICONS[selectedNpc.role]}
              </span>
            </div>
            <div className={styles.detailTitle}>
              <h4 className={styles.detailName}>{selectedNpc.name}</h4>
              <div className={styles.detailMeta}>
                <span className={styles.detailTitle}>{selectedNpc.title}</span>
                <span className={styles.detailSeparator}>|</span>
                <span className={styles.detailRace}>{selectedNpc.race}</span>
              </div>
            </div>
            <button
              className={styles.closeDetail}
              onClick={() => setSelectedNpcId(null)}
            >
              x
            </button>
          </div>

          {/* 基本信息 */}
          <div className={styles.detailSection}>
            <h5 className={styles.sectionTitle}>基本信息</h5>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>职业</span>
                <span className={styles.infoValue}>{selectedNpc.occupation}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>角色</span>
                <span className={styles.infoValue}>
                  {NPC_ROLE_NAMES[selectedNpc.role]}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>态度</span>
                <span
                  className={styles.infoValue}
                  style={{ color: NPC_DISPOSITION_COLORS[selectedNpc.disposition] }}
                >
                  {NPC_DISPOSITION_NAMES[selectedNpc.disposition]}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>等级</span>
                <span className={styles.infoValue}>Lv.{selectedNpc.stats.level}</span>
              </div>
            </div>
          </div>

          {/* 外貌描述 */}
          <div className={styles.detailSection}>
            <h5 className={styles.sectionTitle}>外貌</h5>
            <p className={styles.descriptionText}>
              {selectedNpc.appearance.description}
            </p>
            <div className={styles.appearanceTags}>
              <span className={styles.appearanceTag}>{selectedNpc.appearance.height}身高</span>
              <span className={styles.appearanceTag}>{selectedNpc.appearance.build}体型</span>
              <span className={styles.appearanceTag}>{selectedNpc.appearance.hairColor}头发</span>
              <span className={styles.appearanceTag}>{selectedNpc.appearance.eyeColor}眼睛</span>
            </div>
          </div>

          {/* 当前状态 */}
          <div className={styles.detailSection}>
            <h5 className={styles.sectionTitle}>当前状态</h5>
            <div className={styles.statusGrid}>
              <div className={styles.statusItem}>
                <span className={styles.statusIcon}>❤️</span>
                <div className={styles.statusInfo}>
                  <span className={styles.statusLabel}>生命值</span>
                  <span className={styles.statusValue}>
                    {selectedNpc.status.health}/{selectedNpc.status.maxHealth}
                  </span>
                </div>
                <ProgressBar
                  value={selectedNpc.status.health}
                  max={selectedNpc.status.maxHealth}
                  color="health"
                  size="small"
                />
              </div>
              <div className={styles.statusItem}>
                <span className={styles.statusIcon}>
                  {MOOD_ICONS[selectedNpc.status.mood] || '😐'}
                </span>
                <div className={styles.statusInfo}>
                  <span className={styles.statusLabel}>心情</span>
                  <span className={styles.statusValue}>
                    {MOOD_NAMES[selectedNpc.status.mood] || '未知'}
                  </span>
                </div>
              </div>
              <div className={styles.statusItem}>
                <span className={styles.statusIcon}>📍</span>
                <div className={styles.statusInfo}>
                  <span className={styles.statusLabel}>位置</span>
                  <span className={styles.statusValue}>
                    {selectedNpc.status.currentLocation}
                  </span>
                </div>
              </div>
              <div className={styles.statusItem}>
                <span className={styles.statusIcon}>🎭</span>
                <div className={styles.statusInfo}>
                  <span className={styles.statusLabel}>活动</span>
                  <span className={styles.statusValue}>
                    {selectedNpc.status.currentActivity || '空闲'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 关系信息 */}
          {selectedRelationship && (
            <div className={styles.detailSection}>
              <h5 className={styles.sectionTitle}>与你的关系</h5>
              <div className={styles.relationshipGrid}>
                <div className={styles.relationshipMain}>
                  <div className={styles.relationshipHeader}>
                    <span
                      className={styles.relationshipType}
                      style={{ color: getRelationshipLevelColor(selectedRelationship.level) }}
                    >
                      {RELATIONSHIP_TYPE_NAMES[selectedRelationship.type]}
                    </span>
                    <span className={styles.relationshipLevelText}>
                      {getRelationshipLevelDesc(selectedRelationship.level)} ({selectedRelationship.level})
                    </span>
                  </div>
                  <ProgressBar
                    value={selectedRelationship.level}
                    max={100}
                    color="primary"
                    size="medium"
                  />
                </div>
                
                <div className={styles.relationshipDetails}>
                  <div className={styles.relationshipDetailItem}>
                    <span className={styles.relationshipDetailLabel}>信任</span>
                    <ProgressBar
                      value={selectedRelationship.trustLevel}
                      max={100}
                      color="primary"
                      size="small"
                    />
                    <span className={styles.relationshipDetailValue}>
                      {selectedRelationship.trustLevel}
                    </span>
                  </div>
                  <div className={styles.relationshipDetailItem}>
                    <span className={styles.relationshipDetailLabel}>尊敬</span>
                    <ProgressBar
                      value={selectedRelationship.respectLevel}
                      max={100}
                      color="primary"
                      size="small"
                    />
                    <span className={styles.relationshipDetailValue}>
                      {selectedRelationship.respectLevel}
                    </span>
                  </div>
                  <div className={styles.relationshipDetailItem}>
                    <span className={styles.relationshipDetailLabel}>好感</span>
                    <ProgressBar
                      value={selectedRelationship.affectionLevel}
                      max={100}
                      color="primary"
                      size="small"
                    />
                    <span className={styles.relationshipDetailValue}>
                      {selectedRelationship.affectionLevel}
                    </span>
                  </div>
                </div>

                <div className={styles.relationshipStats}>
                  <span className={styles.relationshipStat}>
                    互动次数: {selectedRelationship.interactionCount}
                  </span>
                  <span className={styles.relationshipStat}>
                    最后互动: {formatLastInteraction(selectedRelationship.lastInteractionAt)}
                  </span>
                </div>

                {selectedRelationship.notes.length > 0 && (
                  <div className={styles.relationshipNotes}>
                    <span className={styles.notesLabel}>备注:</span>
                    <ul className={styles.notesList}>
                      {selectedRelationship.notes.map((note, index) => (
                        <li key={index} className={styles.noteItem}>{note}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 服务 */}
          {selectedNpc.services.length > 0 && (
            <div className={styles.detailSection}>
              <h5 className={styles.sectionTitle}>提供服务</h5>
              <div className={styles.servicesList}>
                {selectedNpc.services.map((service, index) => (
                  <span key={index} className={styles.serviceTag}>
                    {service}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 性格特点 */}
          <div className={styles.detailSection}>
            <h5 className={styles.sectionTitle}>性格特点</h5>
            <div className={styles.personalityTags}>
              {selectedNpc.personality.traits.map((trait, index) => (
                <span key={index} className={styles.personalityTag}>
                  {trait}
                </span>
              ))}
            </div>
          </div>

          {/* 背景 */}
          <div className={styles.detailSection}>
            <h5 className={styles.sectionTitle}>背景故事</h5>
            <p className={styles.descriptionText}>{selectedNpc.backstory}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default NPCPanel;
