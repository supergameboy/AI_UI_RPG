// ==================== 基础任务类型 ====================

/**
 * 任务类型
 */
export type QuestType = 'main' | 'side' | 'hidden' | 'daily' | 'chain';

/**
 * 任务状态
 */
export type QuestStatus = 'locked' | 'available' | 'in_progress' | 'completed' | 'failed';

/**
 * 目标类型
 */
export type ObjectiveType = 'kill' | 'collect' | 'talk' | 'explore' | 'custom';

// ==================== 任务目标类型 ====================

/**
 * 任务目标
 */
export interface QuestObjective {
  id: string;
  description: string;
  type: ObjectiveType;
  target: string;
  current: number;
  required: number;
  isCompleted: boolean;
}

// ==================== 任务奖励类型 ====================

/**
 * 任务奖励
 */
export interface QuestRewards {
  experience?: number;
  currency?: Record<string, number>;
  items?: { itemId: string; quantity: number }[];
  reputation?: Record<string, number>;
  custom?: Record<string, unknown>;
}

// ==================== 任务日志类型 ====================

/**
 * 任务日志条目
 */
export interface QuestLogEntry {
  timestamp: number;
  event: string;
}

// ==================== 任务定义 ====================

/**
 * 任务定义
 */
export interface Quest {
  id: string;
  name: string;
  description: string;
  type: QuestType;
  status: QuestStatus;
  objectives: QuestObjective[];
  prerequisites: string[];
  rewards: QuestRewards;
  timeLimit?: number;
  log: QuestLogEntry[];
  characterId?: string;
  createdAt: number;
  updatedAt: number;
}

// ==================== 任务模板类型 ====================

/**
 * 任务模板（用于创建任务的模板）
 */
export interface QuestTemplate {
  id: string;
  name: string;
  description: string;
  type: QuestType;
  objectives: Omit<QuestObjective, 'id' | 'current' | 'isCompleted'>[];
  prerequisites: string[];
  rewards: QuestRewards;
  timeLimit?: number;
  giver?: string;
  location?: string;
  level?: number;
  repeatable?: boolean;
}

// ==================== 任务状态快照 ====================

/**
 * 任务状态快照
 */
export interface QuestStateSnapshot {
  questId: string;
  status: QuestStatus;
  objectives: QuestObjective[];
  startedAt?: number;
  completedAt?: number;
  timeRemaining?: number;
}

// ==================== 任务进度更新 ====================

/**
 * 目标进度更新
 */
export interface ObjectiveProgress {
  objectiveId: string;
  increment: number;
}

// ==================== 任务过滤器 ====================

/**
 * 任务过滤器
 */
export interface QuestFilter {
  type?: QuestType;
  status?: QuestStatus;
  characterId?: string;
  location?: string;
}

// ==================== 任务统计 ====================

/**
 * 任务统计
 */
export interface QuestStatistics {
  total: number;
  byType: Record<QuestType, number>;
  byStatus: Record<QuestStatus, number>;
  completedCount: number;
  inProgressCount: number;
  availableCount: number;
}

// ==================== API 请求/响应类型 ====================

/**
 * 接受任务请求
 */
export interface AcceptQuestRequest {
  saveId: string;
  characterId: string;
  questId: string;
}

/**
 * 接受任务响应
 */
export interface AcceptQuestResponse {
  success: boolean;
  quest: Quest;
  message: string;
}

/**
 * 放弃任务请求
 */
export interface AbandonQuestRequest {
  saveId: string;
  characterId: string;
  questId: string;
}

/**
 * 放弃任务响应
 */
export interface AbandonQuestResponse {
  success: boolean;
  questId: string;
  message: string;
}

/**
 * 完成任务响应
 */
export interface CompleteQuestResponse {
  success: boolean;
  quest: Quest;
  rewards: QuestRewards;
  message: string;
}

/**
 * 更新进度请求
 */
export interface UpdateProgressRequest {
  saveId: string;
  characterId: string;
  questId: string;
  objectiveId: string;
  increment: number;
}

/**
 * 更新进度响应
 */
export interface UpdateProgressResponse {
  success: boolean;
  quest: Quest;
  objective: QuestObjective;
  questCompleted: boolean;
}

/**
 * 任务列表响应
 */
export interface QuestListResponse {
  success: boolean;
  quests: Quest[];
  statistics: QuestStatistics;
}

/**
 * 任务详情请求
 */
export interface GetQuestRequest {
  saveId: string;
  characterId: string;
  questId: string;
}

/**
 * 任务详情响应
 */
export interface GetQuestResponse {
  success: boolean;
  quest: Quest;
}

/**
 * 可用任务列表请求
 */
export interface GetAvailableQuestsRequest {
  saveId: string;
  characterId: string;
  location?: string;
}

/**
 * 可用任务列表响应
 */
export interface GetAvailableQuestsResponse {
  success: boolean;
  quests: QuestTemplate[];
  unlockedCount: number;
  lockedCount: number;
}

/**
 * 任务进度事件
 */
export interface QuestProgressEvent {
  type: 'objective_completed' | 'quest_completed' | 'quest_failed' | 'quest_updated';
  questId: string;
  objectiveId?: string;
  timestamp: number;
  data?: Record<string, unknown>;
}

// ==================== 任务链类型 ====================

/**
 * 任务链定义
 */
export interface QuestChain {
  id: string;
  name: string;
  description: string;
  quests: string[]; // 任务ID列表，按顺序
  currentQuestIndex: number;
  isCompleted: boolean;
  chainRewards?: QuestRewards;
}

/**
 * 任务链状态
 */
export interface QuestChainState {
  chainId: string;
  currentQuestId: string;
  currentQuestIndex: number;
  completedQuestIds: string[];
  isCompleted: boolean;
}

// ==================== 每日任务类型 ====================

/**
 * 每日任务状态
 */
export interface DailyQuestState {
  lastResetTime: number;
  completedToday: string[];
  availableToday: string[];
}

/**
 * 每日任务配置
 */
export interface DailyQuestConfig {
  maxDailyQuests: number;
  resetHour: number; // 重置时间（小时，0-23）
  refreshCost?: number;
}

// ==================== 任务条件类型 ====================

/**
 * 任务解锁条件
 */
export interface QuestUnlockCondition {
  type: 'level' | 'quest' | 'item' | 'location' | 'reputation' | 'skill' | 'custom';
  target: string;
  value: number | string;
  comparison?: 'eq' | 'gt' | 'lt' | 'gte' | 'lte';
}

/**
 * 任务失败条件
 */
export interface QuestFailCondition {
  type: 'time' | 'death' | 'item_lost' | 'reputation' | 'custom';
  target?: string;
  value?: number | string;
}

// ==================== 任务提示类型 ====================

/**
 * 任务提示
 */
export interface QuestHint {
  questId: string;
  objectiveId: string;
  hint: string;
  location?: string;
  npcName?: string;
}
