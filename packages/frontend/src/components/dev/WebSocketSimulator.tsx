import React, { useState, useCallback, useMemo } from 'react';
import { Icon } from '../common';
import { useGameStore } from '../../stores';
import styles from './WebSocketSimulator.module.css';

interface MessageTemplate {
  name: string;
  type: string;
  payload: Record<string, unknown>;
}

interface HistoryEntry {
  id: string;
  timestamp: number;
  type: 'sent' | 'received' | 'error';
  messageType: string;
  payload: Record<string, unknown>;
  error?: string;
}

const MESSAGE_TEMPLATES: MessageTemplate[] = [
  {
    name: '更新角色状态',
    type: 'game_state_update',
    payload: {
      character: {
        id: 'char_001',
        name: '勇者',
        level: 5,
        health: 100,
        maxHealth: 120,
      },
    },
  },
  {
    name: '更新技能列表',
    type: 'game_state_update',
    payload: {
      skills: {
        skills: [
          { id: 'skill_001', name: '火球术', level: 3 },
          { id: 'skill_002', name: '治愈术', level: 2 },
        ],
        cooldowns: [],
        skillPoints: 2,
      },
    },
  },
  {
    name: '更新背包',
    type: 'game_state_update',
    payload: {
      inventory: {
        slots: [
          { itemId: 'item_001', quantity: 5 },
          { itemId: 'item_002', quantity: 1 },
        ],
        capacity: 50,
        currency: { gold: 500 },
      },
    },
  },
  {
    name: '显示动态UI',
    type: 'game_state_update',
    payload: {
      dynamicUI: {
        id: 'ui_001',
        type: 'notification',
        markdown: ':::system-notify{type=achievement}\n## 🏆 成就解锁！\n\n你完成了第一个任务！\n\n:::options\n[确认](action:close)\n:::\n:::',
        context: {},
      },
    },
  },
  {
    name: 'Agent 消息',
    type: 'agent_message',
    payload: {
      from: 'CoordinatorAgent',
      to: 'UIAgent',
      action: 'generate_dynamic_ui',
      data: {
        uiType: 'welcome',
        description: '生成欢迎界面',
      },
    },
  },
  {
    name: '战斗开始',
    type: 'game_state_update',
    payload: {
      combat: {
        id: 'combat_001',
        enemies: [
          { id: 'enemy_001', name: '哥布林', health: 50, maxHealth: 50 },
        ],
        allies: [],
        turnOrder: ['char_001', 'enemy_001'],
        currentTurnIndex: 0,
      },
    },
  },
  {
    name: '任务更新',
    type: 'game_state_update',
    payload: {
      quests: {
        activeQuests: [
          {
            id: 'quest_001',
            name: '初出茅庐',
            description: '完成新手教程',
            status: 'in_progress',
            objectives: [
              { id: 'obj_001', description: '与村长对话', completed: true },
              { id: 'obj_002', description: '击败第一只怪物', completed: false },
            ],
          },
        ],
        completedQuestIds: [],
        failedQuestIds: [],
      },
    },
  },
  {
    name: 'NPC 关系更新',
    type: 'game_state_update',
    payload: {
      npcs: {
        npcs: [
          { id: 'npc_001', name: '村长', role: 'quest_giver' },
        ],
        relationships: {
          npc_001: { trust: 50, friendship: 30 },
        },
        partyMemberIds: [],
      },
    },
  },
];

export const WebSocketSimulator: React.FC = () => {
  const gameStore = useGameStore();
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);
  const [messageContent, setMessageContent] = useState<string>('');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<'all' | 'sent' | 'received' | 'error'>('all');
  const [error, setError] = useState<string | null>(null);

  const filteredHistory = useMemo(() => {
    if (filter === 'all') return history;
    return history.filter(entry => entry.type === filter);
  }, [history, filter]);

  const handleSelectTemplate = useCallback((template: MessageTemplate) => {
    setSelectedTemplate(template);
    setMessageContent(JSON.stringify(template.payload, null, 2));
    setError(null);
  }, []);

  const handleSendMessage = useCallback(() => {
    if (!messageContent.trim()) {
      setError('消息内容不能为空');
      return;
    }

    try {
      const payload = JSON.parse(messageContent);
      const template = selectedTemplate || { name: '自定义消息', type: 'game_state_update' };

      const entry: HistoryEntry = {
        id: `msg_${Date.now()}`,
        timestamp: Date.now(),
        type: 'sent',
        messageType: template.type,
        payload,
      };

      setHistory(prev => [entry, ...prev].slice(0, 100));

      if (template.type === 'game_state_update') {
        gameStore.updateGameState(payload as Parameters<typeof gameStore.updateGameState>[0], 'websocket');
      }

      setError(null);
    } catch (err) {
      setError('无效的 JSON 格式');
      
      const errorEntry: HistoryEntry = {
        id: `err_${Date.now()}`,
        timestamp: Date.now(),
        type: 'error',
        messageType: 'parse_error',
        payload: { raw: messageContent },
        error: err instanceof Error ? err.message : '解析失败',
      };
      setHistory(prev => [errorEntry, ...prev].slice(0, 100));
    }
  }, [messageContent, selectedTemplate, gameStore]);

  const handleClearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  const handleClearEditor = useCallback(() => {
    setMessageContent('');
    setSelectedTemplate(null);
    setError(null);
  }, []);

  const toggleExpand = useCallback((id: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const formatTime = (timestamp: number): string => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className={styles.websocketSimulator}>
      <div className={styles.header}>
        <span className={styles.title}>WebSocket 模拟器</span>
        <div className={styles.connectionStatus}>
          <span className={`${styles.statusDot} ${styles.connected}`} />
          <span>模拟模式</span>
        </div>
      </div>

      <div className={styles.mainContent}>
        <div className={styles.leftPanel}>
          <div className={styles.templateSection}>
            <div className={styles.sectionHeader}>
              <span>消息模板</span>
            </div>
            <div className={styles.templateList}>
              {MESSAGE_TEMPLATES.map(template => (
                <button
                  key={template.name}
                  className={`${styles.templateButton} ${selectedTemplate?.name === template.name ? styles.active : ''}`}
                  onClick={() => handleSelectTemplate(template)}
                >
                  {template.name}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.editorSection}>
            <div className={styles.sectionHeader}>
              <span>消息内容 (JSON)</span>
              <span style={{ color: 'var(--color-text-tertiary)' }}>
                {selectedTemplate?.type || '自定义'}
              </span>
            </div>
            <div className={styles.editorContent}>
              <textarea
                className={styles.editorTextarea}
                value={messageContent}
                onChange={e => setMessageContent(e.target.value)}
                placeholder="输入 JSON 格式的消息内容..."
              />
            </div>
            {error && <div className={styles.error}>{error}</div>}
            <div className={styles.editorActions}>
              <button className={styles.clearButton} onClick={handleClearEditor}>
                清空
              </button>
              <button className={styles.sendButton} onClick={handleSendMessage}>
                <Icon name="send" size={14} />
                发送消息
              </button>
            </div>
          </div>
        </div>

        <div className={styles.rightPanel}>
          <div className={styles.historySection}>
            <div className={styles.historyHeader}>
              <span>消息历史 ({filteredHistory.length})</span>
              <button className={styles.clearButton} onClick={handleClearHistory}>
                清空
              </button>
            </div>
            <div className={styles.filterBar}>
              {[
                { key: 'all', label: '全部' },
                { key: 'sent', label: '已发送' },
                { key: 'received', label: '已接收' },
                { key: 'error', label: '错误' },
              ].map(f => (
                <button
                  key={f.key}
                  className={`${styles.filterButton} ${filter === f.key ? styles.active : ''}`}
                  onClick={() => setFilter(f.key as typeof filter)}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className={styles.historyList}>
              {filteredHistory.length > 0 ? (
                filteredHistory.map(entry => (
                  <div key={entry.id} className={styles.historyItem}>
                    <div
                      className={styles.historyItemHeader}
                      onClick={() => toggleExpand(entry.id)}
                    >
                      <Icon
                        name="chevron-right"
                        size={12}
                        className={`${styles.expandIcon} ${expandedItems.has(entry.id) ? styles.expanded : ''}`}
                      />
                      <span className={styles.historyTime}>
                        {formatTime(entry.timestamp)}
                      </span>
                      <span className={`${styles.historyType} ${styles[entry.type]}`}>
                        {entry.type === 'sent' ? '发送' : entry.type === 'received' ? '接收' : '错误'}
                      </span>
                      <span className={styles.historySummary}>
                        {entry.messageType}
                        {entry.error && ` - ${entry.error}`}
                      </span>
                    </div>
                    {expandedItems.has(entry.id) && (
                      <div className={styles.historyContent}>
                        <pre className={styles.historyJson}>
                          {JSON.stringify(entry.payload, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className={styles.empty}>暂无消息历史</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
