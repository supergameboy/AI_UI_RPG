import React, { useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { MarkdownRenderer } from '../ui/MarkdownRenderer';
import styles from './MockDynamicUIPanel.module.css';

const PRESET_TEMPLATES: Record<string, { name: string; markdown: string }> = {
  welcome: {
    name: '欢迎界面',
    markdown: `:::system-notify{type=welcome}
## 欢迎来到游戏世界！

你的冒险即将开始...

[开始冒险](action:start_game)
:::`,
  },
  notification: {
    name: '系统通知',
    markdown: `:::system-notify{type=achievement}
## 成就解锁！

"初次冒险" - 完成你的第一个任务

[确认](action:close)
:::`,
  },
  dialog: {
    name: '对话界面',
    markdown: `**神秘商人**

"你好，旅行者！我有一些稀有物品想要出售..."

:::options{layout=vertical}
[查看商品](action:open_shop)
[离开](action:close)
:::`,
  },
  enhancement: {
    name: '装备强化',
    markdown: `:::enhancement{name="铁剑" currentLevel=5 maxLevel=10 successRate=75}
[强化石](material:enhance-stone required=3 owned=5)
:::`,
  },
  warehouse: {
    name: '仓库/银行',
    markdown: `:::warehouse{maxSlots=100}
[背包](tab:inventory maxSlots=50 usedSlots=30)
[铁剑](item:iron-sword qty=1 rarity=common)
[生命药水](item:health-potion qty=10 rarity=common)
:::`,
  },
  shop: {
    name: '商店界面',
    markdown: `**武器商店**

| 物品 | 价格 | 操作 |
|------|------|------|
| 铁剑 | 100金 | [购买](action:buy_iron_sword) |
| 钢剑 | 250金 | [购买](action:buy_steel_sword) |

[离开](action:close)`,
  },
  progress: {
    name: '进度条示例',
    markdown: `**角色状态**

:::progress{value=75 max=100 label="生命值" color=red}
:::

:::progress{value=50 max=100 label="魔法值" color=blue}
:::

:::progress{value=1200 max=2000 label="经验值" color=green}
:::`,
  },
  tabs: {
    name: '标签页示例',
    markdown: `:::tabs{default=info}
[信息](tab:info active)
这是基本信息标签页的内容。

[属性](tab:attributes)
力量: 10
敏捷: 15
智力: 12

[技能](tab:skills)
- 火球术
- 治疗术
:::`,
  },
  badge: {
    name: '徽章示例',
    markdown: `**物品列表**

- [铁剑](item:iron-sword) :::badge{type=rarity color=common}普通:::
- [精钢剑](item:steel-sword) :::badge{type=rarity color=rare}稀有:::
- [龙牙剑](item:dragon-sword) :::badge{type=rarity color=epic}史诗:::
- [圣光剑](item:holy-sword) :::badge{type=rarity color=legendary}传说:::
:::`,
  },
  conditional: {
    name: '条件渲染',
    markdown: `**任务奖励**

:::conditional{condition="hasItem:quest_token"}
你已经完成了任务！
[领取奖励](action:claim_reward)
:::

:::conditional{condition="!hasItem:quest_token"}
你还没有完成任务所需的物品。
[查看任务详情](action:quest_details)
:::`,
  },
};

export const MockDynamicUIPanel: React.FC = () => {
  const updateGameState = useGameStore((state) => state.updateGameState);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('welcome');
  const [markdown, setMarkdown] = useState(PRESET_TEMPLATES.welcome.markdown);
  const [showPreview, setShowPreview] = useState(true);

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    setMarkdown(PRESET_TEMPLATES[templateId].markdown);
  };

  const handleGenerate = () => {
    updateGameState({
      dynamicUI: {
        id: `mock-ui-${Date.now()}`,
        markdown,
        context: { source: 'mock-dynamic-ui-panel' },
      },
    });
  };

  const handleClear = () => {
    updateGameState({
      dynamicUI: null,
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.templateSection}>
        <label className={styles.label}>选择模板</label>
        <div className={styles.templateGrid}>
          {Object.entries(PRESET_TEMPLATES).map(([id, template]) => (
            <button
              key={id}
              className={[
                styles.templateButton,
                selectedTemplate === id && styles.templateButtonActive,
              ].filter(Boolean).join(' ')}
              onClick={() => handleTemplateChange(id)}
            >
              {template.name}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.editorSection}>
        <div className={styles.editorHeader}>
          <label className={styles.label}>Markdown 编辑器</label>
          <button
            className={styles.toggleButton}
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? '隐藏预览' : '显示预览'}
          </button>
        </div>
        <textarea
          className={styles.editor}
          value={markdown}
          onChange={(e) => setMarkdown(e.target.value)}
          rows={10}
          spellCheck={false}
        />
      </div>

      {showPreview && (
        <div className={styles.previewSection}>
          <label className={styles.label}>预览</label>
          <div className={styles.preview}>
            <MarkdownRenderer content={markdown} />
          </div>
        </div>
      )}

      <div className={styles.actionsSection}>
        <button className={styles.generateButton} onClick={handleGenerate}>
          生成动态 UI
        </button>
        <button className={styles.clearButton} onClick={handleClear}>
          清除动态 UI
        </button>
      </div>
    </div>
  );
};
