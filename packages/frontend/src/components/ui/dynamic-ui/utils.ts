/**
 * 动态 UI 工具函数
 * 
 * 核心架构：
 * 1. parseDynamicUIComponents - 解析 Markdown 中的动态 UI 组件块
 * 2. 组件块包含：name, attrs, content
 * 3. 支持嵌套组件
 */

/**
 * 组件块类型定义
 */
export interface ComponentBlock {
  type: 'component';
  name: string;
  attrs: Record<string, string>;
  content: string;
}

/**
 * 内容块类型 - 可以是普通文本或组件块
 */
export type ContentBlock = 
  | { type: 'text'; content: string }
  | ComponentBlock;

/**
 * 解析属性字符串为对象
 * 例如: `{value=75 max=100 label="生命值"}` -> { value: '75', max: '100', label: '生命值' }
 */
export function parseAttrs(attrsString: string): Record<string, string> {
  const result: Record<string, string> = {};
  
  if (!attrsString || attrsString.trim() === '') {
    return result;
  }
  
  // 匹配 key=value 或 key="value with spaces" 格式
  const regex = /(\w+)=("(?:[^"\\]|\\.)*"|[^\s}]+)/g;
  let match;
  
  while ((match = regex.exec(attrsString)) !== null) {
    const key = match[1];
    let value = match[2];
    
    // 移除引号
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }
    
    result[key] = value;
  }
  
  return result;
}

/**
 * 解析选项格式 [文本](action:xxx)
 * 支持带连字符的 action ID，如 action:start-game
 */
export function parseOptions(content: string): Array<{ text: string; action: string; disabled?: boolean }> {
  const options: Array<{ text: string; action: string; disabled?: boolean }> = [];
  const regex = /\[([^\]]+)\]\(action:([\w-]+)(?:\s+disabled)?\)/g;
  let match;
  
  while ((match = regex.exec(content)) !== null) {
    options.push({
      text: match[1],
      action: match[2],
      disabled: content.includes('disabled'),
    });
  }
  
  return options;
}

/**
 * 解析标签页格式 [标签名](tab:xxx)
 * 支持带连字符的 tab ID，如 tab:character-info
 */
export function parseTabs(content: string): Array<{ label: string; id: string; content: string }> {
  const tabs: Array<{ label: string; id: string; content: string }> = [];
  const lines = content.split('\n');
  let currentTab: { label: string; id: string; content: string } | null = null;
  let currentContent: string[] = [];
  
  for (const line of lines) {
    const match = line.match(/\[([^\]]+)\]\(tab:([\w-]+)\)/);
    if (match) {
      if (currentTab) {
        currentTab.content = currentContent.join('\n').trim();
        tabs.push(currentTab);
      }
      currentTab = { label: match[1], id: match[2], content: '' };
      currentContent = [];
    } else if (currentTab) {
      currentContent.push(line);
    }
  }
  
  if (currentTab) {
    currentTab.content = currentContent.join('\n').trim();
    tabs.push(currentTab);
  }
  
  return tabs;
}

/**
 * 解析 Markdown 内容中的动态 UI 组件
 * 
 * 使用递归下降解析器，正确处理嵌套组件
 * 
 * @param content 原始 Markdown 内容
 * @returns 内容块数组（文本块和组件块混合）
 */
export function parseDynamicUIComponents(content: string): ContentBlock[] {
  const blocks: ContentBlock[] = [];
  let pos = 0;
  
  while (pos < content.length) {
    // 查找下一个 ::: 组件开始标记
    const componentStart = content.indexOf(':::', pos);
    
    if (componentStart === -1) {
      // 没有更多组件，添加剩余文本
      if (pos < content.length) {
        blocks.push({ type: 'text', content: content.slice(pos) });
      }
      break;
    }
    
    // 添加组件前的文本
    if (componentStart > pos) {
      blocks.push({ type: 'text', content: content.slice(pos, componentStart) });
    }
    
    // 解析组件块
    const result = parseComponentBlock(content, componentStart);
    if (result) {
      blocks.push(result.block);
      pos = result.endPos;
    } else {
      // 解析失败，将 ::: 作为普通文本
      blocks.push({ type: 'text', content: ':::' });
      pos = componentStart + 3;
    }
  }
  
  return blocks;
}

/**
 * 解析单个组件块
 * 
 * @param content 完整内容
 * @param start 组件开始位置
 * @returns 组件块和结束位置，或 null 表示解析失败
 */
function parseComponentBlock(content: string, start: number): { block: ComponentBlock; endPos: number } | null {
  // 匹配 :::component-name{attrs}
  const componentHeaderRegex = /^:::(\w+(?:-\w+)*)\s*(?:\{([^}]*)\})?/;
  const headerMatch = content.slice(start).match(componentHeaderRegex);
  
  if (!headerMatch) {
    return null;
  }
  
  const name = headerMatch[1];
  const attrsString = headerMatch[2] || '';
  const attrs = parseAttrs(attrsString);
  const headerLength = headerMatch[0].length;
  
  // 查找匹配的结束 :::
  const contentStart = start + headerLength;
  const { innerContent, endPos } = findMatchingEndMarker(content, contentStart);
  
  return {
    block: {
      type: 'component',
      name,
      attrs,
      content: innerContent,
    },
    endPos,
  };
}

/**
 * 查找匹配的结束标记
 * 
 * 使用计数器处理嵌套组件
 * 
 * @param content 完整内容
 * @param start 内容开始位置
 * @returns 内部内容和结束位置
 */
function findMatchingEndMarker(content: string, start: number): { innerContent: string; endPos: number } {
  let depth = 1;
  let pos = start;
  
  while (pos < content.length && depth > 0) {
    // 查找下一个 :::
    const nextMarker = content.indexOf(':::', pos);
    
    if (nextMarker === -1) {
      // 没有找到结束标记，返回剩余内容
      return { innerContent: content.slice(start), endPos: content.length };
    }
    
    // 检查是开始标记还是结束标记
    const afterMarker = content.slice(nextMarker + 3);
    const isComponentStart = /^(\w+(?:-\w+)*)\s*(?:\{[^}]*\})?/.test(afterMarker);
    
    if (isComponentStart) {
      // 嵌套组件开始
      depth++;
    } else {
      // 组件结束
      depth--;
      if (depth === 0) {
        // 找到匹配的结束标记
        return { innerContent: content.slice(start, nextMarker), endPos: nextMarker + 3 };
      }
    }
    
    pos = nextMarker + 3;
  }
  
  // 未找到匹配的结束标记
  return { innerContent: content.slice(start), endPos: content.length };
}

/**
 * 条件表达式解析器
 * 
 * 支持的条件类型：
 * - hasItem:item_id - 拥有物品
 * - hasSkill:skill_id - 拥有技能
 * - hasQuest:quest_id - 拥有任务
 * - level >= N - 等级比较
 * - gold >= N - 金币比较
 * - faction:faction_id - 阵营检查
 * - reputation >= N - 声望比较
 * 
 * 支持的比较运算符：>=, <=, >, <, ==, !=
 * 支持的逻辑运算符：AND, OR, NOT
 */

/**
 * 单个条件评估结果
 */
type ConditionResult = {
  success: boolean;
  error?: string;
};

/**
 * 评估单个原子条件（不含逻辑运算符）
 */
function evaluateAtomicCondition(condition: string, context: Record<string, unknown>): ConditionResult {
  const trimmed = condition.trim();
  
  // 1. 检查 hasItem:item_id 条件
  const hasItemMatch = trimmed.match(/^hasItem:(\w+)$/);
  if (hasItemMatch) {
    const itemId = hasItemMatch[1];
    const items = context.items as string[] | undefined;
    return { success: items ? items.includes(itemId) : false };
  }
  
  // 2. 检查 hasSkill:skill_id 条件
  const hasSkillMatch = trimmed.match(/^hasSkill:(\w+)$/);
  if (hasSkillMatch) {
    const skillId = hasSkillMatch[1];
    const skills = context.skills as string[] | undefined;
    return { success: skills ? skills.includes(skillId) : false };
  }
  
  // 3. 检查 hasQuest:quest_id 条件
  const hasQuestMatch = trimmed.match(/^hasQuest:(\w+)$/);
  if (hasQuestMatch) {
    const questId = hasQuestMatch[1];
    const quests = context.quests as string[] | undefined;
    return { success: quests ? quests.includes(questId) : false };
  }
  
  // 4. 检查 faction:faction_id 条件
  const factionMatch = trimmed.match(/^faction:(\w+)$/);
  if (factionMatch) {
    const factionId = factionMatch[1];
    const currentFaction = context.faction as string | undefined;
    return { success: currentFaction === factionId };
  }
  
  // 5. 检查数值比较条件 (>=, <=, >, <, ==, !=)
  const compareMatch = trimmed.match(/^(\w+)\s*(>=|<=|>|<|==|!=)\s*(\d+)$/);
  if (compareMatch) {
    const fieldName = compareMatch[1];
    const op = compareMatch[2];
    const target = Number(compareMatch[3]);
    
    const fieldValue = context[fieldName];
    if (fieldValue === undefined) {
      return { success: false, error: `Field '${fieldName}' not found in context` };
    }
    
    const value = Number(fieldValue);
    if (isNaN(value)) {
      return { success: false, error: `Field '${fieldName}' is not a number` };
    }
    
    let result: boolean;
    switch (op) {
      case '>=': result = value >= target; break;
      case '<=': result = value <= target; break;
      case '>': result = value > target; break;
      case '<': result = value < target; break;
      case '==': result = value === target; break;
      case '!=': result = value !== target; break;
      default: result = false;
    }
    
    return { success: result };
  }
  
  // 6. 检查布尔值条件
  const boolMatch = trimmed.match(/^(\w+)$/);
  if (boolMatch) {
    const fieldName = boolMatch[1];
    const fieldValue = context[fieldName];
    return { success: Boolean(fieldValue) };
  }
  
  // 未知条件类型
  return { success: false, error: `Unknown condition format: ${trimmed}` };
}

/**
 * 条件表达式词法分析
 * 将条件字符串分解为 token 数组
 */
type Token = {
  type: 'condition' | 'AND' | 'OR' | 'NOT' | 'LPAREN' | 'RPAREN';
  value: string;
};

function tokenizeCondition(condition: string): Token[] {
  const tokens: Token[] = [];
  let pos = 0;
  
  while (pos < condition.length) {
    // 跳过空白
    while (pos < condition.length && /\s/.test(condition[pos])) {
      pos++;
    }
    
    if (pos >= condition.length) break;
    
    // 检查括号
    if (condition[pos] === '(') {
      tokens.push({ type: 'LPAREN', value: '(' });
      pos++;
      continue;
    }
    if (condition[pos] === ')') {
      tokens.push({ type: 'RPAREN', value: ')' });
      pos++;
      continue;
    }
    
    // 检查逻辑运算符
    const remaining = condition.slice(pos);
    
    // 检查 AND (支持 AND 和 &&)
    if (/^(AND|&&)\b/i.test(remaining)) {
      tokens.push({ type: 'AND', value: 'AND' });
      pos += remaining.match(/^(AND|&&)/i)![0].length;
      continue;
    }
    
    // 检查 OR (支持 OR 和 ||)
    if (/^(OR|\|\|)\b/i.test(remaining)) {
      tokens.push({ type: 'OR', value: 'OR' });
      pos += remaining.match(/^(OR|\|\|)/i)![0].length;
      continue;
    }
    
    // 检查 NOT (支持 NOT 和 !)
    if (/^(NOT|!)\b/i.test(remaining)) {
      tokens.push({ type: 'NOT', value: 'NOT' });
      pos += remaining.match(/^(NOT|!)/i)![0].length;
      continue;
    }
    
    // 解析条件表达式
    // 条件可以是: hasItem:xxx, hasSkill:xxx, field>=10, field<=10 等
    // 条件以空格、括号或逻辑运算符结束
    let conditionEnd = pos;
    while (conditionEnd < condition.length) {
      const char = condition[conditionEnd];
      const rest = condition.slice(conditionEnd);
      
      // 检查是否遇到分隔符
      if (/\s/.test(char) || char === '(' || char === ')') {
        break;
      }
      
      // 检查是否遇到逻辑运算符
      if (/^(AND|OR|NOT|&&|\|\||!)\b/i.test(rest)) {
        break;
      }
      
      conditionEnd++;
    }
    
    const conditionValue = condition.slice(pos, conditionEnd).trim();
    if (conditionValue) {
      tokens.push({ type: 'condition', value: conditionValue });
    }
    pos = conditionEnd;
  }
  
  return tokens;
}

/**
 * 条件表达式解析器（递归下降解析）
 * 
 * 语法:
 *   expr     -> orExpr
 *   orExpr   -> andExpr (OR andExpr)*
 *   andExpr  -> notExpr (AND notExpr)*
 *   notExpr  -> NOT notExpr | primary
 *   primary  -> '(' expr ')' | condition
 */
class ConditionParser {
  private tokens: Token[];
  private pos: number = 0;
  private context: Record<string, unknown>;
  
  constructor(tokens: Token[], context: Record<string, unknown>) {
    this.tokens = tokens;
    this.context = context;
  }
  
  parse(): boolean {
    if (this.tokens.length === 0) {
      return true;
    }
    return this.parseOrExpr();
  }
  
  private current(): Token | null {
    return this.pos < this.tokens.length ? this.tokens[this.pos] : null;
  }
  
  private advance(): Token | null {
    return this.tokens[this.pos++];
  }
  
  private parseOrExpr(): boolean {
    let result = this.parseAndExpr();
    
    while (this.current()?.type === 'OR') {
      this.advance(); // 消耗 OR
      const right = this.parseAndExpr();
      result = result || right;
    }
    
    return result;
  }
  
  private parseAndExpr(): boolean {
    let result = this.parseNotExpr();
    
    while (this.current()?.type === 'AND') {
      this.advance(); // 消耗 AND
      const right = this.parseNotExpr();
      result = result && right;
    }
    
    return result;
  }
  
  private parseNotExpr(): boolean {
    if (this.current()?.type === 'NOT') {
      this.advance(); // 消耗 NOT
      return !this.parseNotExpr();
    }
    return this.parsePrimary();
  }
  
  private parsePrimary(): boolean {
    const token = this.current();
    
    if (!token) {
      return true;
    }
    
    if (token.type === 'LPAREN') {
      this.advance(); // 消耗 (
      const result = this.parseOrExpr();
      if (this.current()?.type === 'RPAREN') {
        this.advance(); // 消耗 )
      }
      return result;
    }
    
    if (token.type === 'condition') {
      this.advance(); // 消耗条件
      return evaluateAtomicCondition(token.value, this.context).success;
    }
    
    // 未知 token，跳过
    this.advance();
    return true;
  }
}

/**
 * 检查条件表达式
 * 
 * @param condition 条件表达式字符串
 * @param context 上下文对象，包含玩家状态等信息
 * @returns 条件是否满足
 * 
 * @example
 * // 简单条件
 * evaluateCondition('hasItem:magic-key', { items: ['magic-key', 'sword'] })
 * evaluateCondition('level >= 10', { level: 15 })
 * 
 * // 逻辑运算
 * evaluateCondition('hasItem:key AND hasSkill:lockpick', context)
 * evaluateCondition('hasItem:key OR hasQuest:quest1', context)
 * evaluateCondition('NOT hasItem:cursed_item', context)
 * 
 * // 复合条件
 * evaluateCondition('(level >= 10 AND gold >= 100) OR hasItem:vip_pass', context)
 */
export function evaluateCondition(condition: string, context?: Record<string, unknown>): boolean {
  if (!condition || condition.trim() === '') {
    return true;
  }
  
  if (!context) {
    return true;
  }
  
  try {
    const tokens = tokenizeCondition(condition);
    
    // 如果只有一个条件，直接评估
    if (tokens.length === 1 && tokens[0].type === 'condition') {
      return evaluateAtomicCondition(tokens[0].value, context).success;
    }
    
    // 使用解析器处理复杂表达式
    const parser = new ConditionParser(tokens, context);
    return parser.parse();
  } catch {
    // 解析出错时默认返回 true，避免阻塞内容显示
    return true;
  }
}

/**
 * 解析条件内容中的 else 分支
 * 
 * 格式:
 * :::conditional{condition="..."}
 * 条件满足时显示的内容
 * :::else:
 * 条件不满足时显示的内容
 * :::
 * 
 * @param content 组件内容
 * @returns { trueContent, elseContent } - 条件内容和 else 内容
 */
export function parseElseBranch(content: string): { trueContent: string; elseContent: string | null } {
  const elseMarker = ':::else:';
  const elseIndex = content.indexOf(elseMarker);
  
  if (elseIndex === -1) {
    return { trueContent: content, elseContent: null };
  }
  
  const trueContent = content.slice(0, elseIndex).trim();
  const elseContent = content.slice(elseIndex + elseMarker.length).trim();
  
  return { trueContent, elseContent };
}

// ============ 新增组件解析函数 ============

/**
 * 解析技能节点
 * 
 * 格式: [名称](skill:id level=N maxLevel=N status=xxx x=N y=N [prereq=id] [cost=N])
 */
export function parseSkillNodes(content: string): Array<{
  id: string;
  name: string;
  level: number;
  maxLevel: number;
  status: string;
  position: { x: number; y: number };
  prerequisites?: string[];
  cost?: number;
}> {
  const nodes: Array<{
    id: string;
    name: string;
    level: number;
    maxLevel: number;
    status: string;
    position: { x: number; y: number };
    prerequisites?: string[];
    cost?: number;
  }> = [];
  
  const regex = /\[([^\]]+)\]\(skill:([\w-]+)\s+level=(\d+)\s+maxLevel=(\d+)\s+status=(\w+)\s+x=(-?\d+)\s+y=(-?\d+)(?:\s+prereq=([\w-]+))?(?:\s+cost=(\d+))?\)/g;
  let match;
  
  while ((match = regex.exec(content)) !== null) {
    nodes.push({
      id: match[2],
      name: match[1],
      level: parseInt(match[3], 10),
      maxLevel: parseInt(match[4], 10),
      status: match[5],
      position: { x: parseInt(match[6], 10), y: parseInt(match[7], 10) },
      prerequisites: match[8] ? [match[8]] : undefined,
      cost: match[9] ? parseInt(match[9], 10) : undefined,
    });
  }
  
  return nodes;
}

/**
 * 解析任务列表
 * 
 * 格式:
 * [任务名](quest:id status=xxx priority=xxx)
 * - [目标描述](obj:id current=N target=N)
 */
export function parseQuests(content: string): Array<{
  id: string;
  name: string;
  status: string;
  priority?: string;
  objectives: Array<{
    id: string;
    description: string;
    current: number;
    target: number;
    completed: boolean;
  }>;
}> {
  const result: Array<{
    id: string;
    name: string;
    status: string;
    priority?: string;
    objectives: Array<{
      id: string;
      description: string;
      current: number;
      target: number;
      completed: boolean;
    }>;
  }> = [];
  
  const lines = content.split('\n');
  let currentQuest: {
    id: string;
    name: string;
    status: string;
    priority?: string;
    objectives: Array<{
      id: string;
      description: string;
      current: number;
      target: number;
      completed: boolean;
    }>;
  } | null = null;
  
  for (const line of lines) {
    const questMatch = line.match(/\[([^\]]+)\]\(quest:([\w-]+)\s+status=(\w+)(?:\s+priority=(\w+))?\)/);
    if (questMatch) {
      if (currentQuest) {
        result.push(currentQuest);
      }
      currentQuest = {
        id: questMatch[2],
        name: questMatch[1],
        status: questMatch[3],
        priority: questMatch[4],
        objectives: [],
      };
      continue;
    }
    
    const objMatch = line.match(/-\s+\[([^\]]+)\]\(obj:([\w-]+)\s+current=(\d+)\s+target=(\d+)\)/);
    if (objMatch && currentQuest) {
      currentQuest.objectives.push({
        id: objMatch[2],
        description: objMatch[1],
        current: parseInt(objMatch[3], 10),
        target: parseInt(objMatch[4], 10),
        completed: parseInt(objMatch[3], 10) >= parseInt(objMatch[4], 10),
      });
    }
  }
  
  if (currentQuest) {
    result.push(currentQuest);
  }
  
  return result;
}

/**
 * 解析小地图标记
 * 
 * 格式: [名称](marker:id type=xxx x=N y=N)
 */
export function parseMinimapMarkers(content: string): Array<{
  id: string;
  type: string;
  position: { x: number; y: number };
  label?: string;
}> {
  const markers: Array<{
    id: string;
    type: string;
    position: { x: number; y: number };
    label?: string;
  }> = [];
  
  const regex = /\[([^\]]+)\]\(marker:([\w-]+)(?:\s+type=(\w+))?\s+x=(-?\d+)\s+y=(-?\d+)\)/g;
  let match;
  
  while ((match = regex.exec(content)) !== null) {
    markers.push({
      id: match[2],
      type: match[3] || 'player',
      position: { x: parseInt(match[4], 10), y: parseInt(match[5], 10) },
      label: match[1],
    });
  }
  
  return markers;
}

/**
 * 解析对话消息
 * 
 * 格式:
 * [说话者](speaker:type time=timestamp)
 * 消息内容
 */
export function parseDialogueMessages(content: string, maxMessages = 50): Array<{
  id: string;
  speaker: string;
  content: string;
  timestamp?: number;
  type: 'npc' | 'player' | 'system';
}> {
  const result: Array<{
    id: string;
    speaker: string;
    content: string;
    timestamp?: number;
    type: 'npc' | 'player' | 'system';
  }> = [];
  
  const lines = content.split('\n');
  let currentMessage: Partial<{
    id: string;
    speaker: string;
    content: string;
    timestamp?: number;
    type: 'npc' | 'player' | 'system';
  }> | null = null;
  let contentLines: string[] = [];
  
  for (const line of lines) {
    const speakerMatch = line.match(/\[([^\]]+)\]\(speaker:(\w+)(?:\s+time=(\d+))?\)/);
    if (speakerMatch) {
      if (currentMessage && currentMessage.id && currentMessage.speaker && currentMessage.type) {
        result.push({
          id: currentMessage.id,
          speaker: currentMessage.speaker,
          content: contentLines.join('\n').trim(),
          timestamp: currentMessage.timestamp,
          type: currentMessage.type,
        });
      }
      
      currentMessage = {
        id: `msg-${result.length}`,
        speaker: speakerMatch[1],
        type: speakerMatch[2] as 'npc' | 'player' | 'system',
        timestamp: speakerMatch[3] ? parseInt(speakerMatch[3], 10) : undefined,
      };
      contentLines = [];
      continue;
    }
    
    if (currentMessage) {
      contentLines.push(line);
    }
  }
  
  if (currentMessage && currentMessage.id && currentMessage.speaker && currentMessage.type) {
    result.push({
      id: currentMessage.id,
      speaker: currentMessage.speaker,
      content: contentLines.join('\n').trim(),
      timestamp: currentMessage.timestamp,
      type: currentMessage.type,
    });
  }
  
  return result.slice(-maxMessages);
}

/**
 * 解析角色状态属性
 * 
 * 格式: health=75/100 mana=50/80 exp=1200/2000
 */
export function parseCharacterStats(content: string, attrs: Record<string, string>): {
  name: string;
  level: number;
  class: string;
  health: { current: number; max: number };
  mana: { current: number; max: number };
  exp: { current: number; max: number };
  avatar?: string;
  title?: string;
} {
  const name = attrs.name || '未知角色';
  const level = parseInt(attrs.level || '1', 10);
  const className = attrs.class || '冒险者';
  const title = attrs.title;
  const avatar = attrs.avatar;
  
  const healthMatch = content.match(/health=(\d+)\/(\d+)/) || 
                      (attrs.health ? attrs.health.match(/(\d+)\/(\d+)/) : null);
  const health = healthMatch ? {
    current: parseInt(healthMatch[1], 10),
    max: parseInt(healthMatch[2], 10),
  } : { current: 100, max: 100 };
  
  const manaMatch = content.match(/mana=(\d+)\/(\d+)/) ||
                    (attrs.mana ? attrs.mana.match(/(\d+)\/(\d+)/) : null);
  const mana = manaMatch ? {
    current: parseInt(manaMatch[1], 10),
    max: parseInt(manaMatch[2], 10),
  } : { current: 50, max: 50 };
  
  const expMatch = content.match(/exp=(\d+)\/(\d+)/) ||
                   (attrs.exp ? attrs.exp.match(/(\d+)\/(\d+)/) : null);
  const exp = expMatch ? {
    current: parseInt(expMatch[1], 10),
    max: parseInt(expMatch[2], 10),
  } : { current: 0, max: 100 };
  
  return { name, level, class: className, health, mana, exp, avatar, title };
}
