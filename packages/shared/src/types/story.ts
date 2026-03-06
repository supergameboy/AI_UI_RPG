// ==================== 故事节点类型 ====================

/**
 * 故事节点类型
 */
export type StoryNodeType = 'chapter' | 'scene' | 'choice' | 'convergence';

/**
 * 节点重要性级别
 */
export type NodeImportance = 'minor' | 'major' | 'critical';

/**
 * 对话片段
 */
export interface DialogueSnippet {
  speaker: string;
  content: string;
  emotion?: string;
}

/**
 * 故事效果
 */
export interface StoryEffect {
  type: 'attribute' | 'item' | 'quest' | 'relationship' | 'flag' | 'custom';
  target: string;
  value: number | string | boolean;
  description?: string;
}

/**
 * 故事条件
 */
export interface StoryCondition {
  type: 'attribute' | 'item' | 'quest' | 'relationship' | 'flag' | 'custom';
  target: string;
  operator: 'eq' | 'gt' | 'lt' | 'gte' | 'lte' | 'neq';
  value: number | string | boolean;
}

/**
 * 故事选择
 */
export interface StoryChoice {
  id: string;
  text: string;
  effects: StoryEffect[];
  targetNodeId?: string;
  conditions?: StoryCondition[];
  flags?: Record<string, boolean>;
}

/**
 * 节点状态
 */
export interface NodeStatus {
  isVisited: boolean;
  visitedAt?: number;
  selectedChoice?: string;
}

/**
 * 节点元数据
 */
export interface NodeMetadata {
  chapter: number;
  importance: NodeImportance;
  tags: string[];
  createdAt: number;
}

/**
 * 节点内容
 */
export interface NodeContent {
  narrative: string;
  dialogues?: DialogueSnippet[];
  effects?: StoryEffect[];
}

/**
 * 故事节点
 */
export interface StoryNode {
  id: string;
  saveId: string;
  title: string;
  description: string;
  type: StoryNodeType;
  content: NodeContent;
  choices: StoryChoice[];
  parentId?: string;
  convergencePoint?: boolean;
  convergingBranches?: string[];
  metadata: NodeMetadata;
  status: NodeStatus;
}

// ==================== 决策记录类型 ====================

/**
 * 决策记录
 */
export interface DecisionRecord {
  nodeId: string;
  choiceId: string;
  choiceText: string;
  timestamp: number;
  consequences?: string[];
}

// ==================== 摘要类型 ====================

/**
 * 短期摘要
 */
export interface ShortTermSummary {
  content: string;
  nodeIds: string[];
  lastUpdated: number;
}

/**
 * 中期摘要
 */
export interface MidTermSummary {
  content: string;
  nodeIds: string[];
  lastUpdated: number;
}

/**
 * 长期摘要
 */
export interface LongTermSummary {
  content: string;
  keyDecisions: DecisionRecord[];
  lastUpdated: number;
}

/**
 * 故事摘要
 */
export interface StorySummary {
  id: string;
  characterId: string;
  shortTerm: ShortTermSummary;
  midTerm: MidTermSummary;
  longTerm: LongTermSummary;
  currentNodeId: string;
  activeBranches: string[];
}

// ==================== 剧情点类型 ====================

/**
 * 剧情点类型
 */
export type PlotPointType = 'revelation' | 'twist' | 'climax' | 'resolution' | 'foreshadowing';

/**
 * 剧情点
 */
export interface PlotPoint {
  id: string;
  characterId: string;
  type: PlotPointType;
  title: string;
  description: string;
  relatedNodes: string[];
  importance: number;
  timestamp: number;
}

// ==================== 分支类型 ====================

/**
 * 故事分支
 */
export interface StoryBranch {
  id: string;
  saveId: string;
  name: string;
  startNodeId: string;
  endNodeId?: string;
  nodes: string[];
  isActive: boolean;
  createdAt: number;
  mergedAt?: number;
}

// ==================== 序列化类型 ====================

/**
 * 故事状态快照
 */
export interface StoryStateSnapshot {
  nodes: StoryNode[];
  summaries: StorySummary[];
  plotPoints: PlotPoint[];
  branches: StoryBranch[];
  currentNodeId: string;
  choiceHistory: DecisionRecord[];
}

// ==================== API 响应类型 ====================

/**
 * 创建节点请求
 */
export interface CreateNodeRequest {
  saveId: string;
  title: string;
  description: string;
  type: StoryNodeType;
  content: NodeContent;
  choices?: Omit<StoryChoice, 'id'>[];
  parentId?: string;
  metadata?: Partial<NodeMetadata>;
}

/**
 * 创建节点响应
 */
export interface CreateNodeResponse {
  success: boolean;
  node: StoryNode;
  message?: string;
}

/**
 * 记录选择请求
 */
export interface RecordChoiceRequest {
  saveId: string;
  nodeId: string;
  choiceId: string;
}

/**
 * 记录选择响应
 */
export interface RecordChoiceResponse {
  success: boolean;
  node: StoryNode;
  nextNodeId?: string;
  message?: string;
}

/**
 * 生成摘要请求
 */
export interface GenerateSummaryRequest {
  saveId: string;
  level: 'short' | 'mid' | 'long';
  forceRegenerate?: boolean;
}

/**
 * 生成摘要响应
 */
export interface GenerateSummaryResponse {
  success: boolean;
  summary: StorySummary;
  message?: string;
}

/**
 * 故事路径响应
 */
export interface StoryPathResponse {
  success: boolean;
  path: StoryNode[];
  totalNodes: number;
  message?: string;
}
