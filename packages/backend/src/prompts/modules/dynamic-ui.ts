/**
 * 动态 UI 提示词模块
 * 包含 Markdown 动态 UI 组件语法说明
 */

import type { PromptModule } from './types';

export const dynamicUIComponents: PromptModule = {
  name: 'dynamic_ui_components',
  description: 'Markdown 动态 UI 组件语法说明',
  category: 'custom',
  version: '1.0.0',
  content: `# Markdown 动态 UI 组件

动态 UI 使用扩展的 Markdown 语法来创建交互式界面组件。

## 支持的 UI 类型

| 类型 | 用途 | 场景 |
|------|------|------|
| welcome | 欢迎界面 | 游戏初始化、新存档加载 |
| notification | 系统通知 | 成就解锁、系统消息、警告 |
| dialog | 对话框 | NPC对话、剧情对话 |
| enhancement | 装备强化 | 装备升级、附魔界面 |
| warehouse | 仓库/银行 | 物品存储、仓库管理 |
| shop | 商店 | 购买/出售物品 |
| custom | 自定义 | 特殊场景 |

## 组件语法

### 1. 选项按钮 (options)

用于创建可点击的按钮组。

\`\`\`markdown
:::options
[选项A](action:choose_a) [选项B](action:choose_b)
:::
\`\`\`

参数说明：
- \`action:xxx\` - 点击按钮时触发的动作标识
- 支持多个按钮，用空格分隔

### 2. 进度条 (progress)

用于显示进度、属性值等。

\`\`\`markdown
:::progress{value=75 max=100 label="生命值"}
:::
\`\`\`

参数说明：
- \`value\` - 当前值
- \`max\` - 最大值
- \`label\` - 标签文本

### 3. 标签页 (tabs)

用于创建可切换的标签页。

\`\`\`markdown
:::tabs
[属性](tab:attributes) [技能](tab:skills) [装备](tab:equipment)
:::
\`\`\`

### 4. 系统通知 (system-notify)

用于显示带样式的通知框。

\`\`\`markdown
:::system-notify{type=achievement}
## 🏆 成就解锁！

**首次击杀** - 击败了你的第一个敌人

奖励：经验值 +100
:::
\`\`\`

type 参数：
- \`achievement\` - 成就通知
- \`warning\` - 警告通知
- \`info\` - 信息通知
- \`error\` - 错误通知
- \`success\` - 成功通知
- \`welcome\` - 欢迎通知

### 5. 徽章 (badge)

用于显示稀有度、状态等标签。

\`\`\`markdown
:::badge{type=rarity color=gold}
传说级
:::
\`\`\`

color 参数：
- \`common\` - 普通（灰色）
- \`uncommon\` - 优秀（绿色）
- \`rare\` - 稀有（蓝色）
- \`epic\` - 史诗（紫色）
- \`legendary\` - 传说（橙色）
- \`gold\` - 金色

### 6. 悬浮提示 (tooltip)

用于显示悬浮提示文本。

\`\`\`markdown
将鼠标悬停在[这个文本](tooltip:这是提示内容)上查看提示。
\`\`\`

### 7. 条件显示 (if)

根据条件决定是否渲染内容。

\`\`\`markdown
:::if{condition="hasQuest"}
你有一个进行中的任务！
:::
\`\`\`

### 8. 装备强化界面 (enhancement)

用于显示装备强化界面。

\`\`\`markdown
:::enhancement
## ⚒️ 装备强化

当前装备：**精钢长剑** (Lv.3)
成功率：**65%**

| 属性 | 当前 | 强化后 |
|------|------|--------|
| 攻击力 | 25 | 32 |
| 暴击率 | 5% | 8% |

所需材料：
- 强化石 x3 ✓
- 金币 x100 ✓

:::options
[确认强化](action:confirm_enhance) [取消](action:close)
:::
:::
\`\`\`

### 9. 仓库界面 (warehouse)

用于显示仓库管理界面。

\`\`\`markdown
:::warehouse
## 🏦 仓库管理

**背包空间**: 45/50
**仓库空间**: 120/200

:::tabs
[全部](tab:all) [装备](tab:equipment) [材料](tab:material)
:::

| 物品 | 数量 | 操作 |
|------|------|------|
| 强化石 | 15 | [存入](action:deposit:stone) [取出](action:withdraw:stone) |

:::options
[整理仓库](action:organize) [关闭](action:close)
:::
:::
\`\`\`

### 10. 商店界面 (shop)

用于显示商店购买界面。

\`\`\`markdown
:::shop{merchant="铁匠铺"}
## 🛒 铁匠铺

你的金币：**500** 💰

| 物品 | 价格 | 操作 |
|------|------|------|
| 铁剑 | 100 | [购买](action:buy:iron_sword) |
| 钢剑 | 250 | [购买](action:buy:steel_sword) |

:::options
[离开](action:close)
:::
:::
\`\`\`

## Action 链接处理

所有 \`[文本](action:xxx)\` 格式的链接都会渲染为可点击按钮。

点击时：
1. 触发 \`onAction\` 回调
2. 传递 action 字符串（如 \`choose_a\`、\`confirm_enhance\`）
3. 可包含参数：\`action:buy:iron_sword\`（用冒号分隔）

## 变量插值

支持使用 \`{{variable}}\` 语法插入动态内容：

\`\`\`markdown
**{{character.name}}**，欢迎来到游戏！

你的等级：{{character.level}}
当前金币：{{inventory.gold}}
\`\`\`

## 完整示例：欢迎界面

\`\`\`markdown
:::system-notify{type=welcome}
## 🌟 欢迎来到星城市

**{{character.name}}**，你的故事即将开始！

---

### 角色信息
| 属性 | 值 |
|------|-----|
| 种族 | {{character.race}} |
| 职业 | {{character.class}} |
| 背景 | {{character.background}} |

### 初始状态
- 💰 金币: {{inventory.gold}}
- 📦 物品: {{inventory.items.length}} 件
- ⚔️ 技能: {{skills.length}} 个

---

> {{worldSetting.description}}

:::options
[开始冒险](action:start_game) [查看详情](action:view_details)
:::
:::
\`\`\``,
};

export const dynamicUITypes: PromptModule = {
  name: 'dynamic_ui_types',
  description: '动态 UI 类型定义',
  category: 'custom',
  version: '1.0.0',
  content: `# 动态 UI 类型定义

## DynamicUIData 结构

\`\`\`typescript
interface DynamicUIData {
  id: string;           // UI 实例 ID
  type: DynamicUIType;  // UI 类型
  markdown: string;     // Markdown 内容
  context?: Record<string, unknown>;  // 上下文数据
}
\`\`\`

## DynamicUIType 枚举

\`\`\`typescript
type DynamicUIType = 
  | 'welcome'           // 欢迎界面
  | 'notification'      // 系统通知
  | 'dialog'            // 对话框
  | 'enhancement'       // 装备强化
  | 'warehouse'         // 仓库/银行
  | 'shop'              // 商店
  | 'custom';           // 自定义
\`\`\`

## 各类型使用场景

### welcome - 欢迎界面
- 游戏初始化完成时显示
- 展示角色创建结果
- 显示初始状态和背景故事

### notification - 系统通知
- 成就解锁
- 任务完成
- 系统消息
- 警告提示

### dialog - 对话框
- NPC 对话
- 剧情对话
- 选择分支对话

### enhancement - 装备强化
- 装备升级
- 附魔
- 镶嵌宝石

### warehouse - 仓库/银行
- 物品存储
- 仓库管理
- 物品转移

### shop - 商店
- 购买物品
- 出售物品
- 查看商品详情

### custom - 自定义
- 特殊场景
- 自定义交互`,
};

export const generateDynamicUIGuide: PromptModule = {
  name: 'generate_dynamic_ui_guide',
  description: 'generateDynamicUI 方法使用指南',
  category: 'custom',
  version: '1.0.0',
  content: `# generateDynamicUI 方法使用指南

## 方法签名

\`\`\`typescript
async generateDynamicUI(params: {
  type: DynamicUIType;      // UI 类型
  description: string;       // 自然语言描述
  context: Record<string, unknown>;  // 上下文数据
}): Promise<DynamicUIData>
\`\`\`

## 使用流程

1. 接收 CoordinatorAgent 发送的动态 UI 需求
2. 根据 description 和 context 生成 Markdown 内容
3. 返回 DynamicUIData 对象

## 调用示例

### 生成欢迎界面

\`\`\`typescript
const welcomeUI = await generateDynamicUI({
  type: 'welcome',
  description: '为新创建的角色生成欢迎界面，展示角色信息和初始状态',
  context: {
    character: {
      name: '艾瑞克',
      race: '人类',
      class: '战士',
      background: '贵族后裔'
    },
    inventory: {
      gold: 100,
      items: ['铁剑', '皮甲', '生命药水x3']
    },
    skills: ['基础剑术', '防御姿态'],
    worldSetting: {
      description: '这是一个充满魔法与冒险的世界...'
    }
  }
});
\`\`\`

### 生成系统通知

\`\`\`typescript
const notificationUI = await generateDynamicUI({
  type: 'notification',
  description: '生成成就解锁通知',
  context: {
    achievement: {
      name: '首次击杀',
      description: '击败了你的第一个敌人',
      reward: { experience: 100 }
    }
  }
});
\`\`\`

### 生成装备强化界面

\`\`\`typescript
const enhancementUI = await generateDynamicUI({
  type: 'enhancement',
  description: '生成装备强化界面，显示当前装备属性和强化后的变化',
  context: {
    equipment: {
      name: '精钢长剑',
      level: 3,
      currentStats: { attack: 25, critRate: 5 },
      enhancedStats: { attack: 32, critRate: 8 },
      successRate: 65,
      materials: [
        { name: '强化石', required: 3, owned: 5 },
        { name: '金币', required: 100, owned: 500 }
      ]
    }
  }
});
\`\`\`

## 注意事项

1. **内容长度**：生成的 Markdown 应简洁明了，避免过长
2. **变量插值**：使用 \`{{variable}}\` 语法引用 context 中的数据
3. **组件嵌套**：支持组件嵌套，但不要超过 3 层
4. **Action 命名**：使用清晰的 action 名称，如 \`confirm_enhance\`、\`buy:iron_sword\`
5. **样式一致性**：遵循各类型 UI 的标准格式`,
};

export const dynamicUIModules: PromptModule[] = [
  dynamicUIComponents,
  dynamicUITypes,
  generateDynamicUIGuide,
];

export function getDynamicUIModule(name: string): PromptModule | undefined {
  return dynamicUIModules.find(m => m.name === name);
}

export function getAllDynamicUIModules(): PromptModule[] {
  return [...dynamicUIModules];
}
