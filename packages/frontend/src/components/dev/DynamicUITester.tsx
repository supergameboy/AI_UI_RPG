import React, { useState, useCallback, useMemo } from 'react';
import { MarkdownRenderer } from '../ui/MarkdownRenderer';
import { DynamicUIPanel } from '../ui/DynamicUIPanel';
import styles from './DynamicUITester.module.css';
import type { DynamicUIType, DynamicUIData } from '@ai-rpg/shared';

interface HistoryEntry {
  id: string;
  timestamp: number;
  type: DynamicUIType;
  description: string;
  markdown: string;
}

const UI_TYPES: { value: DynamicUIType; label: string; icon: string }[] = [
  { value: 'welcome', label: '欢迎界面', icon: '🌟' },
  { value: 'notification', label: '系统通知', icon: '📢' },
  { value: 'dialog', label: '对话框', icon: '💬' },
  { value: 'enhancement', label: '装备强化', icon: '⚒️' },
  { value: 'warehouse', label: '仓库管理', icon: '🏦' },
  { value: 'shop', label: '商店', icon: '🏪' },
  { value: 'custom', label: '自定义', icon: '📋' },
];

const SAMPLE_MARKDOWNS: Record<DynamicUIType, string> = {
  welcome: `:::system-notify{type=welcome}
## 🌟 欢迎来到游戏世界

**勇者**，你的冒险即将开始！

---

### 角色信息
| 属性 | 值 |
|------|-----|
| 种族 | 人类 |
| 职业 | 战士 |
| 等级 | 1 |

### 初始状态
- 💰 金币: 100
- 📦 物品: 3 件
- ⚔️ 技能: 2 个

---

> 这是一个充满魔法与冒险的世界...

:::options
[开始冒险](action:start_game) [查看详情](action:view_details)
:::
:::`,
  notification: `:::system-notify{type=achievement}
## 🏆 成就解锁！

**首次击杀**

你成功击败了第一个敌人！

---

奖励：
- 经验值 +50
- 金币 +20

:::options
[确认](action:close)
:::
:::`,
  dialog: `## 💬 村长对话

"年轻人，欢迎来到我们的村庄。最近村子周围出现了一些奇怪的生物，你能帮助我们调查一下吗？"

---

**村长** 看起来很担忧。

:::options
[接受任务](action:accept_quest:village_investigation) [询问详情](action:ask_details) [婉拒](action:decline)
:::`,
  enhancement: `:::enhancement
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
:::`,
  warehouse: `:::warehouse
## 🏦 仓库管理

**背包空间**: 45/50
**仓库空间**: 120/200

:::tabs
[全部](tab:all) [装备](tab:equipment) [材料](tab:material)
:::

| 物品 | 数量 | 操作 |
|------|------|------|
| 强化石 | 15 | [存入](action:deposit:stone) [取出](action:withdraw:stone) |
| 治疗药水 | 8 | [存入](action:deposit:potion) [取出](action:withdraw:potion) |

:::options
[整理仓库](action:organize) [关闭](action:close)
:::
:::`,
  shop: `## 🏪 武器商店

**你的金币**: 500 💰

| 商品 | 价格 | 操作 |
|------|------|------|
| 铁剑 | 100 💰 | [购买](action:buy:iron_sword) |
| 钢剑 | 250 💰 | [购买](action:buy:steel_sword) |
| 精钢剑 | 500 💰 | [购买](action:buy:fine_steel_sword) |

:::options
[出售物品](action:sell) [离开](action:close)
:::`,
  custom: `## 📋 自定义内容

这是一个自定义的动态 UI 内容示例。

:::progress{value=75 max=100 label="任务进度" color="primary"}
:::

---

:::badge{color=rare}
稀有物品
:::

一些普通文本内容，支持 **粗体**、*斜体* 和 \`代码\`。

:::options
[确认](action:confirm) [取消](action:cancel)
:::`,
};

export const DynamicUITester: React.FC = () => {
  const [selectedType, setSelectedType] = useState<DynamicUIType>('welcome');
  const [description, setDescription] = useState('');
  const [contextJson, setContextJson] = useState('{}');
  const [generatedMarkdown, setGeneratedMarkdown] = useState('');
  const [previewTab, setPreviewTab] = useState<'markdown' | 'render'>('render');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showPreviewPanel, setShowPreviewPanel] = useState(false);

  const context = useMemo(() => {
    try {
      return JSON.parse(contextJson);
    } catch {
      return {};
    }
  }, [contextJson]);

  const handleGenerate = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const markdown = SAMPLE_MARKDOWNS[selectedType];
      setGeneratedMarkdown(markdown);

      const entry: HistoryEntry = {
        id: `history_${Date.now()}`,
        timestamp: Date.now(),
        type: selectedType,
        description: description || `生成的 ${UI_TYPES.find(t => t.value === selectedType)?.label}`,
        markdown,
      };
      setHistory(prev => [entry, ...prev].slice(0, 20));

    } catch (err) {
      setError(err instanceof Error ? err.message : '生成失败');
    } finally {
      setIsLoading(false);
    }
  }, [selectedType, description]);

  const handleLoadSample = useCallback(() => {
    setGeneratedMarkdown(SAMPLE_MARKDOWNS[selectedType]);
    setError(null);
  }, [selectedType]);

  const handleLoadFromHistory = useCallback((entry: HistoryEntry) => {
    setSelectedType(entry.type);
    setDescription(entry.description);
    setGeneratedMarkdown(entry.markdown);
    setError(null);
  }, []);

  const handleExportMarkdown = useCallback(() => {
    if (!generatedMarkdown) return;
    
    const blob = new Blob([generatedMarkdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dynamic-ui-${selectedType}-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }, [generatedMarkdown, selectedType]);

  const handleAction = useCallback((action: string, data?: unknown) => {
    console.log('[DynamicUITester] Action triggered:', action, data);
    alert(`Action: ${action}\nData: ${JSON.stringify(data, null, 2)}`);
  }, []);

  const dynamicUIData: DynamicUIData | null = useMemo(() => {
    if (!generatedMarkdown) return null;
    return {
      id: `test_${Date.now()}`,
      type: selectedType,
      markdown: generatedMarkdown,
      context,
    };
  }, [generatedMarkdown, selectedType, context]);

  return (
    <div className={styles.dynamicUITester}>
      <div className={styles.header}>
        <span className={styles.title}>动态 UI 测试器</span>
      </div>

      <div className={styles.mainContent}>
        <div className={styles.leftPanel}>
          <div className={styles.typeSelector}>
            {UI_TYPES.map(type => (
              <button
                key={type.value}
                className={`${styles.typeButton} ${selectedType === type.value ? styles.active : ''}`}
                onClick={() => setSelectedType(type.value)}
              >
                {type.icon} {type.label}
              </button>
            ))}
          </div>

          <div className={styles.section} style={{ flex: 1 }}>
            <div className={styles.sectionHeader}>
              <span>描述输入</span>
              <button
                className={styles.actionButton}
                onClick={handleLoadSample}
              >
                加载示例
              </button>
            </div>
            <div className={styles.sectionContent}>
              <textarea
                className={styles.descriptionInput}
                placeholder="输入自然语言描述，描述你想要生成的 UI 内容..."
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <span>上下文数据 (JSON)</span>
            </div>
            <div className={styles.sectionContent}>
              <textarea
                className={styles.contextInput}
                placeholder='{"key": "value"}'
                value={contextJson}
                onChange={e => setContextJson(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.actionButtons}>
            <button
              className={styles.generateButton}
              onClick={handleGenerate}
              disabled={isLoading}
            >
              {isLoading ? '生成中...' : '生成 UI'}
            </button>
          </div>

          {history.length > 0 && (
            <div className={`${styles.section} ${styles.historySection}`}>
              <div className={styles.sectionHeader}>
                <span>历史记录</span>
              </div>
              <div className={styles.sectionContent}>
                <div className={styles.historyList}>
                  {history.map(entry => (
                    <div
                      key={entry.id}
                      className={styles.historyItem}
                      onClick={() => handleLoadFromHistory(entry)}
                    >
                      <span className={styles.historyType}>
                        {UI_TYPES.find(t => t.value === entry.type)?.icon}
                      </span>
                      <span className={styles.historyDesc}>{entry.description}</span>
                      <span className={styles.historyTime}>
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className={styles.rightPanel}>
          <div className={styles.previewTabs}>
            <button
              className={`${styles.previewTab} ${previewTab === 'markdown' ? styles.active : ''}`}
              onClick={() => setPreviewTab('markdown')}
            >
              Markdown 源码
            </button>
            <button
              className={`${styles.previewTab} ${previewTab === 'render' ? styles.active : ''}`}
              onClick={() => setPreviewTab('render')}
            >
              渲染预览
            </button>
          </div>

          {error && (
            <div className={styles.sectionContent}>
              <div className={styles.error}>{error}</div>
            </div>
          )}

          <div className={styles.previewContent}>
            {isLoading ? (
              <div className={styles.loading}>生成中...</div>
            ) : generatedMarkdown ? (
              previewTab === 'markdown' ? (
                <pre className={styles.markdownPreview}>{generatedMarkdown}</pre>
              ) : (
                <div className={styles.renderPreview}>
                  <MarkdownRenderer
                    content={generatedMarkdown}
                    onAction={handleAction}
                    context={context}
                  />
                </div>
              )
            ) : (
              <div className={styles.empty}>
                选择 UI 类型并点击"生成 UI"或"加载示例"开始测试
              </div>
            )}
          </div>

          {generatedMarkdown && (
            <div className={styles.actionButtons}>
              <button
                className={styles.actionButton}
                onClick={handleExportMarkdown}
              >
                导出 Markdown
              </button>
              <button
                className={`${styles.actionButton} ${styles.primary}`}
                onClick={() => setShowPreviewPanel(true)}
              >
                在面板中预览
              </button>
            </div>
          )}
        </div>
      </div>

      {showPreviewPanel && dynamicUIData && (
        <DynamicUIPanel
          data={dynamicUIData}
          onAction={handleAction}
          onClose={() => setShowPreviewPanel(false)}
        />
      )}
    </div>
  );
};
