/**
 * Tool 调用示例索引
 * 提供示例加载和格式化功能
 */

import { ToolType } from '@ai-rpg/shared';
import { attackExamples, type ToolCallExample } from './combat/attack';
import { skillExamples } from './combat/skill';
import { dialogueExamples } from './dialogue/talk';
import { emotionExamples } from './dialogue/emotion';
import { equipExamples } from './inventory/equip';
import { useItemExamples } from './inventory/use-item';
import { singleCallExamples } from './common/single-call';
import { batchCallExamples } from './common/batch-call';

/**
 * 示例分类
 */
export type ExampleCategory = 'combat' | 'dialogue' | 'quest' | 'inventory' | 'skill' | 'npc' | 'map' | 'event' | 'common';

/**
 * 所有示例的集合
 */
const allExamples: Map<string, ToolCallExample> = new Map();

/**
 * 分类到示例的映射
 */
const categoryExamples: Map<ExampleCategory, ToolCallExample[]> = new Map();

/**
 * Tool 类型到示例的映射
 */
const toolTypeExamples: Map<ToolType, ToolCallExample[]> = new Map();

/**
 * 初始化示例注册表
 */
function initializeExamples(): void {
  // 注册战斗示例
  for (const example of attackExamples) {
    allExamples.set(example.name, example);
    addToCategory('combat', example);
    addToToolType(ToolType.COMBAT_DATA, example);
    addToToolType(ToolType.NUMERICAL, example);
  }

  for (const example of skillExamples) {
    allExamples.set(example.name, example);
    addToCategory('combat', example);
    addToCategory('skill', example);
    addToToolType(ToolType.SKILL_DATA, example);
    addToToolType(ToolType.COMBAT_DATA, example);
  }

  // 注册对话示例
  for (const example of dialogueExamples) {
    allExamples.set(example.name, example);
    addToCategory('dialogue', example);
    addToToolType(ToolType.DIALOGUE_DATA, example);
    addToToolType(ToolType.NPC_DATA, example);
  }

  for (const example of emotionExamples) {
    allExamples.set(example.name, example);
    addToCategory('dialogue', example);
    addToToolType(ToolType.DIALOGUE_DATA, example);
  }

  // 注册装备示例
  for (const example of equipExamples) {
    allExamples.set(example.name, example);
    addToCategory('inventory', example);
    addToToolType(ToolType.INVENTORY_DATA, example);
    addToToolType(ToolType.NUMERICAL, example);
  }

  // 注册物品使用示例
  for (const example of useItemExamples) {
    allExamples.set(example.name, example);
    addToCategory('inventory', example);
    addToToolType(ToolType.INVENTORY_DATA, example);
  }

  // 注册通用示例
  for (const example of singleCallExamples) {
    allExamples.set(example.name, example);
    addToCategory('common', example);
    // 根据示例中的 toolType 添加到对应的映射
    for (const call of example.toolCalls) {
      addToToolType(call.toolType, example);
    }
  }

  // 注册批量调用示例
  for (const example of batchCallExamples) {
    allExamples.set(example.name, example);
    addToCategory('common', example);
    // 根据示例中的 toolType 添加到对应的映射
    for (const call of example.toolCalls) {
      addToToolType(call.toolType, example);
    }
  }
}

/**
 * 添加示例到分类
 */
function addToCategory(category: ExampleCategory, example: ToolCallExample): void {
  if (!categoryExamples.has(category)) {
    categoryExamples.set(category, []);
  }
  categoryExamples.get(category)!.push(example);
}

/**
 * 添加示例到 Tool 类型
 */
function addToToolType(toolType: ToolType, example: ToolCallExample): void {
  if (!toolTypeExamples.has(toolType)) {
    toolTypeExamples.set(toolType, []);
  }
  toolTypeExamples.get(toolType)!.push(example);
}

// 初始化
initializeExamples();

/**
 * 获取所有示例
 */
export function getAllExamples(): ToolCallExample[] {
  return Array.from(allExamples.values());
}

/**
 * 按名称获取示例
 */
export function getExampleByName(name: string): ToolCallExample | undefined {
  return allExamples.get(name);
}

/**
 * 按分类获取示例
 */
export function getExamplesByCategory(category: ExampleCategory): ToolCallExample[] {
  return categoryExamples.get(category) || [];
}

/**
 * 按 Tool 类型获取示例
 */
export function getExamplesByToolType(toolType: ToolType): ToolCallExample[] {
  return toolTypeExamples.get(toolType) || [];
}

/**
 * 按多个分类获取示例
 */
export function getExamples(categories?: ExampleCategory[]): ToolCallExample[] {
  if (!categories || categories.length === 0) {
    return getAllExamples();
  }

  const result: ToolCallExample[] = [];
  const seen = new Set<string>();

  for (const category of categories) {
    const examples = getExamplesByCategory(category);
    for (const example of examples) {
      if (!seen.has(example.name)) {
        seen.add(example.name);
        result.push(example);
      }
    }
  }

  return result;
}

/**
 * 格式化示例为提示词文本
 */
export function formatExampleAsText(example: ToolCallExample): string {
  const lines: string[] = [];

  lines.push(`### ${example.description}`);
  lines.push('');
  lines.push(`**场景**: ${example.scenario}`);
  lines.push('');
  lines.push('**Tool 调用序列**:');
  lines.push('```json');

  for (const call of example.toolCalls) {
    const callObj = {
      tool: call.toolType,
      method: call.method,
      params: call.params,
      permission: call.permission,
    };
    lines.push(JSON.stringify(callObj, null, 2));
  }

  lines.push('```');
  lines.push('');
  lines.push(`**预期输出**:`);
  lines.push(example.expectedOutput);

  if (example.notes && example.notes.length > 0) {
    lines.push('');
    lines.push('**注意事项**:');
    for (const note of example.notes) {
      lines.push(`- ${note}`);
    }
  }

  return lines.join('\n');
}

/**
 * 格式化多个示例为提示词文本
 */
export function formatExamplesAsText(examples: ToolCallExample[]): string {
  return examples
    .map(formatExampleAsText)
    .join('\n\n---\n\n');
}

/**
 * 获取示例摘要列表
 */
export function getExampleSummaries(): Array<{
  name: string;
  description: string;
  scenario: string;
  categories: ExampleCategory[];
}> {
  const summaries: Array<{
    name: string;
    description: string;
    scenario: string;
    categories: ExampleCategory[];
  }> = [];

  for (const [name, example] of allExamples) {
    const categories: ExampleCategory[] = [];

    for (const [category, examples] of categoryExamples) {
      if (examples.includes(example)) {
        categories.push(category);
      }
    }

    summaries.push({
      name,
      description: example.description,
      scenario: example.scenario,
      categories,
    });
  }

  return summaries;
}

// 导出类型和示例
export { type ToolCallExample, type ToolCall } from './combat/attack';
