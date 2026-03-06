import React, { useState, useCallback, useMemo } from 'react';
import { Icon } from '../common';
import { MarkdownRenderer } from '../ui/MarkdownRenderer';
import styles from './MarkdownPreviewer.module.css';

interface ComponentInfo {
  name: string;
  syntax: string;
  example: string;
  description: string;
}

const COMPONENTS: ComponentInfo[] = [
  {
    name: '选项按钮',
    syntax: ':::options ... :::',
    example: `:::options
[选项A](action:choose_a) [选项B](action:choose_b)
:::`,
    description: '创建可点击的选项按钮组，点击触发 action 回调',
  },
  {
    name: '进度条',
    syntax: ':::progress{value=75 max=100} :::',
    example: `:::progress{value=75 max=100 label="生命值" color="health"}
:::`,
    description: '显示进度条，支持自定义颜色和标签',
  },
  {
    name: '标签页',
    syntax: ':::tabs ... :::',
    example: `:::tabs
[属性](tab:attributes) [技能](tab:skills)
:::`,
    description: '创建可切换的标签页组件',
  },
  {
    name: '系统通知',
    syntax: ':::system-notify{type=info} ... :::',
    example: `:::system-notify{type=achievement}
## 🏆 成就解锁！
你完成了第一个任务！
:::`,
    description: '显示系统通知框，支持多种类型',
  },
  {
    name: '徽章',
    syntax: ':::badge{color=rare} ... :::',
    example: `:::badge{color=legendary}
传说级
:::`,
    description: '显示徽章标签，用于稀有度等标识',
  },
  {
    name: '悬浮提示',
    syntax: '[文本](tooltip:提示内容)',
    example: `[装备名称](tooltip:这是一件强力装备)`,
    description: '鼠标悬停显示提示文本',
  },
  {
    name: '条件显示',
    syntax: ':::if{condition="..."} ... :::',
    example: `:::if{condition="level >= 10"}
高等级玩家可见内容
:::`,
    description: '根据条件决定是否渲染内容',
  },
  {
    name: '装备强化',
    syntax: ':::enhancement ... :::',
    example: `:::enhancement
## ⚒️ 装备强化
当前装备：精钢长剑 (Lv.3)
成功率：65%
:::`,
    description: '显示装备强化界面',
  },
  {
    name: '仓库管理',
    syntax: ':::warehouse ... :::',
    example: `:::warehouse
## 🏦 仓库管理
**背包空间**: 45/50
:::`,
    description: '显示仓库管理界面',
  },
  {
    name: 'Action 链接',
    syntax: '[文本](action:xxx)',
    example: `[确认](action:confirm) [取消](action:cancel)`,
    description: '创建可点击的 action 链接按钮',
  },
];

const DEFAULT_MARKDOWN = `# Markdown 预览器

这是一个 **Markdown 动态 UI 组件**预览工具。

## 基础语法

支持标准 Markdown 语法：
- 标题、段落、列表
- **粗体**、*斜体*、\`代码\`
- [链接](https://example.com)
- 表格等

## 扩展组件示例

:::progress{value=65 max=100 label="加载进度" color="primary"}
:::

---

:::badge{color=rare}
稀有物品
:::

---

:::options
[确认操作](action:confirm) [取消](action:cancel)
:::
`;

export const MarkdownPreviewer: React.FC = () => {
  const [markdown, setMarkdown] = useState(DEFAULT_MARKDOWN);
  const [selectedComponent, setSelectedComponent] = useState<ComponentInfo | null>(null);
  const [actionLog, setActionLog] = useState<string | null>(null);

  const handleAction = useCallback((action: string, data?: unknown) => {
    const message = `Action: ${action}${data ? ` | Data: ${JSON.stringify(data)}` : ''}`;
    setActionLog(message);
    setTimeout(() => setActionLog(null), 3000);
  }, []);

  const handleInsertComponent = useCallback((component: ComponentInfo) => {
    setMarkdown(prev => {
      const newLine = prev.endsWith('\n') ? '' : '\n';
      return prev + newLine + '\n' + component.example + '\n';
    });
  }, []);

  const handleClear = useCallback(() => {
    setMarkdown('');
  }, []);

  const handleReset = useCallback(() => {
    setMarkdown(DEFAULT_MARKDOWN);
  }, []);

  const context = useMemo(() => ({}), []);

  return (
    <div className={styles.markdownPreviewer}>
      <div className={styles.header}>
        <span className={styles.title}>Markdown 组件预览器</span>
      </div>

      <div className={styles.mainContent}>
        <div className={styles.leftPanel}>
          <div className={styles.editorSection}>
            <div className={styles.editorHeader}>
              <span>Markdown 输入</span>
              <span style={{ color: 'var(--color-text-tertiary)' }}>
                {markdown.length} 字符
              </span>
            </div>
            <div className={styles.editorContent}>
              <textarea
                className={styles.editorTextarea}
                value={markdown}
                onChange={e => setMarkdown(e.target.value)}
                placeholder="输入 Markdown 内容..."
              />
            </div>
            <div className={styles.quickActions}>
              <button className={styles.actionButton} onClick={handleClear}>
                清空
              </button>
              <button className={styles.actionButton} onClick={handleReset}>
                重置示例
              </button>
            </div>
          </div>

          <div className={styles.componentsSection}>
            <div className={styles.componentsHeader}>
              <span>扩展组件 ({COMPONENTS.length})</span>
              <button
                className={styles.actionButton}
                onClick={() => setSelectedComponent(COMPONENTS[0])}
              >
                查看全部
              </button>
            </div>
            <div className={styles.componentsList}>
              {COMPONENTS.slice(0, 6).map(comp => (
                <div
                  key={comp.name}
                  className={styles.componentCard}
                  onClick={() => handleInsertComponent(comp)}
                  title={comp.description}
                >
                  <div className={styles.componentName}>{comp.name}</div>
                  <div className={styles.componentSyntax}>{comp.syntax}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.rightPanel}>
          <div className={styles.previewSection}>
            <div className={styles.previewHeader}>
              <span>渲染预览</span>
            </div>
            <div className={styles.previewContent}>
              {markdown ? (
                <div className={styles.renderPreview}>
                  <MarkdownRenderer
                    content={markdown}
                    onAction={handleAction}
                    context={context}
                  />
                </div>
              ) : (
                <div className={styles.empty}>
                  输入 Markdown 内容查看渲染效果
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {selectedComponent && (
        <div className={styles.syntaxModal} onClick={() => setSelectedComponent(null)}>
          <div className={styles.syntaxDialogContent} onClick={e => e.stopPropagation()}>
            <div className={styles.syntaxDialogHeader}>
              <span className={styles.syntaxDialogTitle}>扩展组件语法参考</span>
              <div
                className={styles.syntaxDialogClose}
                onClick={() => setSelectedComponent(null)}
              >
                <Icon name="close" size={16} />
              </div>
            </div>
            <div className={styles.syntaxDialogBody}>
              {COMPONENTS.map(comp => (
                <div key={comp.name} className={styles.syntaxExample}>
                  <div className={styles.syntaxExampleTitle}>
                    {comp.name}
                    <button
                      className={styles.actionButton}
                      style={{ marginLeft: 'var(--spacing-sm)', fontSize: '10px' }}
                      onClick={() => handleInsertComponent(comp)}
                    >
                      插入
                    </button>
                  </div>
                  <pre className={styles.syntaxExampleCode}>{comp.example}</pre>
                  <div className={styles.syntaxExampleDesc}>{comp.description}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {actionLog && (
        <div className={styles.actionLog}>
          <div className={styles.actionLogText}>{actionLog}</div>
        </div>
      )}
    </div>
  );
};
