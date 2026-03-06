/**
 * 上下文模板模块
 * 包含玩家信息、场景信息、历史记录等上下文相关的提示词模板
 */

import type { PromptModule } from './types';

/**
 * 玩家信息上下文模板
 */
export const playerContextTemplate: PromptModule = {
  name: 'context_player',
  description: '玩家信息上下文模板',
  category: 'context',
  version: '1.0.0',
  variables: [
    {
      name: 'playerName',
      type: 'string',
      required: false,
      default: '冒险者',
      description: '玩家名称',
    },
    {
      name: 'playerClass',
      type: 'string',
      required: false,
      default: '战士',
      description: '玩家职业',
    },
    {
      name: 'playerLevel',
      type: 'number',
      required: false,
      default: 1,
      description: '玩家等级',
    },
    {
      name: 'playerAttributes',
      type: 'object',
      required: false,
      default: {},
      description: '玩家属性',
    },
    {
      name: 'playerStats',
      type: 'object',
      required: false,
      default: {},
      description: '玩家状态',
    },
  ],
  content: `# 玩家信息

## 基本信息

- **名称**: {{playerName}}
- **职业**: {{playerClass}}
- **等级**: {{playerLevel}}

## 属性

{{#if playerAttributes}}
{{#each playerAttributes}}
- **{{@key}}**: {{this}}
{{/each}}
{{else}}
暂无属性信息
{{/if}}

## 状态

{{#if playerStats}}
{{#each playerStats}}
- **{{@key}}**: {{this}}
{{/each}}
{{else}}
暂无状态信息
{{/if}}`,
};

/**
 * 场景信息上下文模板
 */
export const sceneContextTemplate: PromptModule = {
  name: 'context_scene',
  description: '场景信息上下文模板',
  category: 'context',
  version: '1.0.0',
  variables: [
    {
      name: 'locationName',
      type: 'string',
      required: false,
      default: '未知地点',
      description: '当前位置名称',
    },
    {
      name: 'locationType',
      type: 'string',
      required: false,
      default: '区域',
      description: '位置类型',
    },
    {
      name: 'description',
      type: 'string',
      required: false,
      default: '',
      description: '场景描述',
    },
    {
      name: 'features',
      type: 'array',
      required: false,
      default: [],
      description: '场景特征',
    },
    {
      name: 'exits',
      type: 'array',
      required: false,
      default: [],
      description: '出口列表',
    },
    {
      name: 'npcs',
      type: 'array',
      required: false,
      default: [],
      description: '场景中的NPC',
    },
    {
      name: 'items',
      type: 'array',
      required: false,
      default: [],
      description: '场景中的物品',
    },
  ],
  content: `# 场景信息

## 当前位置

**{{locationName}}** ({{locationType}})

## 场景描述

{{description}}

{{#if features}}
## 场景特征

{{#each features}}
- {{this}}
{{/each}}
{{/if}}

{{#if exits}}
## 可用出口

{{#each exits}}
- **{{this.direction}}**: {{this.destination}}
{{/each}}
{{/if}}

{{#if npcs}}
## 在场NPC

{{#each npcs}}
- **{{this.name}}**: {{this.description}}
{{/each}}
{{/if}}

{{#if items}}
## 可见物品

{{#each items}}
- **{{this.name}}**: {{this.description}}
{{/each}}
{{/if}}`,
};

/**
 * 历史记录上下文模板
 */
export const historyContextTemplate: PromptModule = {
  name: 'context_history',
  description: '历史记录上下文模板',
  category: 'context',
  version: '1.0.0',
  variables: [
    {
      name: 'recentHistory',
      type: 'array',
      required: false,
      default: [],
      description: '最近的历史记录',
    },
    {
      name: 'maxItems',
      type: 'number',
      required: false,
      default: 10,
      description: '最大显示条数',
    },
    {
      name: 'includeTimestamps',
      type: 'boolean',
      required: false,
      default: false,
      description: '是否包含时间戳',
    },
  ],
  content: `# 历史记录

以下是最近的对话和事件记录：

{{#if recentHistory}}
{{#each recentHistory}}
{{#if ../includeTimestamps}}
**[{{this.timestamp}}]**
{{/if}}
{{#eq this.role 'user'}}
**玩家**: {{this.content}}
{{else}}
**系统**: {{this.content}}
{{/eq}}

{{/each}}
{{else}}
暂无历史记录
{{/if}}`,
};

/**
 * 任务上下文模板
 */
export const questContextTemplate: PromptModule = {
  name: 'context_quest',
  description: '任务上下文模板',
  category: 'context',
  version: '1.0.0',
  variables: [
    {
      name: 'activeQuests',
      type: 'array',
      required: false,
      default: [],
      description: '进行中的任务',
    },
    {
      name: 'completedQuests',
      type: 'array',
      required: false,
      default: [],
      description: '已完成的任务',
    },
    {
      name: 'failedQuests',
      type: 'array',
      required: false,
      default: [],
      description: '失败的任务',
    },
  ],
  content: `# 任务信息

## 进行中的任务

{{#if activeQuests}}
{{#each activeQuests}}
### {{this.name}}

**描述**: {{this.description}}

**进度**: {{this.progress}}%

{{#if this.objectives}}
**目标**:
{{#each this.objectives}}
- [{{#if this.completed}}x{{else}} {{/if}}] {{this.description}}
{{/each}}
{{/if}}

{{/each}}
{{else}}
暂无进行中的任务
{{/if}}

## 已完成的任务

{{#if completedQuests}}
{{#each completedQuests}}
- **{{this.name}}**: 完成于 {{this.completedAt}}
{{/each}}
{{else}}
暂无已完成的任务
{{/if}}`,
};

/**
 * 世界信息上下文模板
 */
export const worldContextTemplate: PromptModule = {
  name: 'context_world',
  description: '世界信息上下文模板',
  category: 'context',
  version: '1.0.0',
  variables: [
    {
      name: 'worldName',
      type: 'string',
      required: false,
      default: '未知世界',
      description: '世界名称',
    },
    {
      name: 'worldEra',
      type: 'string',
      required: false,
      default: '未知时代',
      description: '时代背景',
    },
    {
      name: 'magicSystem',
      type: 'string',
      required: false,
      default: '无',
      description: '魔法系统',
    },
    {
      name: 'currentChapter',
      type: 'number',
      required: false,
      default: 1,
      description: '当前章节',
    },
    {
      name: 'gameTime',
      type: 'string',
      required: false,
      default: '未知',
      description: '游戏内时间',
    },
    {
      name: 'customSettings',
      type: 'object',
      required: false,
      default: {},
      description: '自定义设定',
    },
  ],
  content: `# 世界信息

## 基本信息

- **世界名称**: {{worldName}}
- **时代背景**: {{worldEra}}
- **魔法系统**: {{magicSystem}}

## 游戏进度

- **当前章节**: {{currentChapter}}
- **游戏时间**: {{gameTime}}

{{#if customSettings}}
## 自定义设定

{{#each customSettings}}
- **{{@key}}**: {{this}}
{{/each}}
{{/if}}`,
};

/**
 * 战斗上下文模板
 */
export const combatContextTemplate: PromptModule = {
  name: 'context_combat',
  description: '战斗上下文模板',
  category: 'context',
  version: '1.0.0',
  variables: [
    {
      name: 'inCombat',
      type: 'boolean',
      required: false,
      default: false,
      description: '是否在战斗中',
    },
    {
      name: 'turnOrder',
      type: 'array',
      required: false,
      default: [],
      description: '行动顺序',
    },
    {
      name: 'currentTurn',
      type: 'number',
      required: false,
      default: 0,
      description: '当前回合',
    },
    {
      name: 'enemies',
      type: 'array',
      required: false,
      default: [],
      description: '敌人列表',
    },
    {
      name: 'allies',
      type: 'array',
      required: false,
      default: [],
      description: '盟友列表',
    },
  ],
  content: `# 战斗信息

{{#if inCombat}}
## 战斗状态

**当前回合**: {{currentTurn}}

### 行动顺序

{{#each turnOrder}}
{{@index}}. {{this.name}} ({{this.type}})
{{/each}}

### 敌人

{{#each enemies}}
- **{{this.name}}**: HP {{this.currentHp}}/{{this.maxHp}}
{{/each}}

### 盟友

{{#each allies}}
- **{{this.name}}**: HP {{this.currentHp}}/{{this.maxHp}}
{{/each}}
{{else}}
当前不在战斗中
{{/if}}`,
};

/**
 * 完整游戏状态上下文模板
 */
export const fullGameContextTemplate: PromptModule = {
  name: 'context_full_game',
  description: '完整游戏状态上下文模板',
  category: 'context',
  version: '1.0.0',
  variables: [
    {
      name: 'gameState',
      type: 'object',
      required: true,
      description: '完整游戏状态对象',
    },
  ],
  content: `# 当前游戏状态

\`\`\`json
{{json gameState}}
\`\`\`

## 状态摘要

- **玩家**: {{gameState.player.name}} (Lv.{{gameState.player.level}})
- **位置**: {{gameState.location.name}}
- **章节**: {{gameState.chapter}}
- **战斗状态**: {{#if gameState.inCombat}}战斗中{{else}}非战斗{{/if}}`,
};

/**
 * 所有上下文模块列表
 */
export const contextModules: PromptModule[] = [
  playerContextTemplate,
  sceneContextTemplate,
  historyContextTemplate,
  questContextTemplate,
  worldContextTemplate,
  combatContextTemplate,
  fullGameContextTemplate,
];

/**
 * 根据名称获取上下文模块
 */
export function getContextModule(name: string): PromptModule | undefined {
  return contextModules.find(m => m.name === name);
}

/**
 * 获取所有上下文模块
 */
export function getAllContextModules(): PromptModule[] {
  return [...contextModules];
}
