import React, { useState, useCallback, useMemo } from 'react';
import { useGameStore } from '../../stores/gameStore';
import {
  allTemplates,
  type TemplateCategory,
  type TemplateType,
  type MockTemplate,
  getCategoryLabel,
  getTypeLabel,
  getTypeColor,
  filterTemplatesByType,
} from '../../data/mockDataTemplates';
import type { GameState as SharedGameState } from '@ai-rpg/shared';
import styles from './DataSimulatorPanel.module.css';

type Mode = 'single' | 'combined';

/**
 * 简单的日志工具
 */
const gameLog = {
  debug: (category: string, message: string, data?: unknown) => {
    if (import.meta.env.DEV) {
      console.debug(`[${category}] ${message}`, data ?? '');
    }
  },
  info: (category: string, message: string, data?: unknown) => {
    if (import.meta.env.DEV) {
      console.log(`[${category}] ${message}`, data ?? '');
    }
  },
  warn: (category: string, message: string, data?: unknown) => {
    console.warn(`[${category}] ${message}`, data ?? '');
  },
  error: (category: string, message: string, data?: unknown) => {
    console.error(`[${category}] ${message}`, data ?? '');
  },
};

/**
 * 数据模拟面板
 * 用于开发者快速测试各种数据状态
 */
export const DataSimulatorPanel: React.FC = () => {
  const updateGameState = useGameStore((state) => state.updateGameState);

  // 模式状态
  const [mode, setMode] = useState<Mode>('single');

  // 单面板模式状态
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory>('character');
  const [selectedType, setSelectedType] = useState<TemplateType>('normal');
  const [selectedTemplate, setSelectedTemplate] = useState<MockTemplate | null>(null);

  // 组合模式状态
  const [selectedTemplates, setSelectedTemplates] = useState<MockTemplate[]>([]);

  // 编辑器状态
  const [editData, setEditData] = useState<string>('');

  // 历史记录
  const [history, setHistory] = useState<Array<{ data: Partial<SharedGameState>; timestamp: number }>>([]);

  // 获取当前分类的模板列表
  const currentTemplates = useMemo(() => {
    return allTemplates[selectedCategory] || [];
  }, [selectedCategory]);

  // 根据类型筛选的模板
  const filteredTemplates = useMemo(() => {
    return filterTemplatesByType(currentTemplates, selectedType);
  }, [currentTemplates, selectedType]);

  // 发送数据到游戏状态
  const handleSend = useCallback(() => {
    let data: Partial<SharedGameState> = {};

    if (mode === 'single' && selectedTemplate) {
      data = { ...selectedTemplate.data };
    } else if (mode === 'combined' && selectedTemplates.length > 0) {
      // 合并所有选中的模板数据
      selectedTemplates.forEach((template) => {
        data = { ...data, ...template.data };
      });
    }

    // 如果有编辑器数据，合并覆盖
    if (editData.trim()) {
      try {
        const editedData = JSON.parse(editData) as Partial<SharedGameState>;
        data = { ...data, ...editedData };
      } catch (e) {
        gameLog.error('frontend', 'Invalid JSON in editor', { error: e instanceof Error ? e.message : String(e) });
        alert('JSON 格式错误，请检查编辑器内容');
        return;
      }
    }

    // 更新游戏状态
    // 使用类型断言，因为 gameStore 的 GameState 与 shared 的 GameState 类型不同
    updateGameState(data as Parameters<typeof updateGameState>[0]);

    // 添加到历史记录
    setHistory((prev) => [...prev.slice(-9), { data, timestamp: Date.now() }]);
  }, [mode, selectedTemplate, selectedTemplates, editData, updateGameState]);

  // 从历史记录加载数据
  const handleHistoryClick = useCallback((historicalData: Partial<SharedGameState>) => {
    setEditData(JSON.stringify(historicalData, null, 2));
  }, []);

  // 切换模板选择（组合模式）
  const toggleTemplateSelection = useCallback((template: MockTemplate) => {
    setSelectedTemplates((prev) => {
      const isSelected = prev.some((t) => t.id === template.id);
      if (isSelected) {
        return prev.filter((t) => t.id !== template.id);
      } else {
        return [...prev, template];
      }
    });
  }, []);

  // 清空选择
  const clearSelection = useCallback(() => {
    setSelectedTemplate(null);
    setSelectedTemplates([]);
    setEditData('');
  }, []);

  // 快速加载组合模板
  const handleQuickLoad = useCallback((template: MockTemplate) => {
    // 使用类型断言
    updateGameState(template.data as Parameters<typeof updateGameState>[0]);
    setHistory((prev) => [...prev.slice(-9), { data: template.data, timestamp: Date.now() }]);
  }, [updateGameState]);

  return (
    <div className={styles.container}>
      {/* 模式切换 */}
      <div className={styles.modeSection}>
        <button
          className={`${styles.modeButton} ${mode === 'single' ? styles.modeButtonActive : ''}`}
          onClick={() => {
            setMode('single');
            clearSelection();
          }}
        >
          单面板模式
        </button>
        <button
          className={`${styles.modeButton} ${mode === 'combined' ? styles.modeButtonActive : ''}`}
          onClick={() => {
            setMode('combined');
            clearSelection();
          }}
        >
          自由组合模式
        </button>
      </div>

      {/* 单面板模式 */}
      {mode === 'single' && (
        <div className={styles.singleModeSection}>
          {/* 分类选择 */}
          <div className={styles.categorySection}>
            <label className={styles.label}>数据分类</label>
            <div className={styles.categoryList}>
              {(Object.keys(allTemplates) as TemplateCategory[]).map((category) => (
                <button
                  key={category}
                  className={`${styles.categoryButton} ${selectedCategory === category ? styles.categoryButtonActive : ''}`}
                  onClick={() => {
                    setSelectedCategory(category);
                    setSelectedTemplate(null);
                  }}
                >
                  {getCategoryLabel(category)}
                </button>
              ))}
            </div>
          </div>

          {/* 类型筛选 */}
          <div className={styles.typeSection}>
            <label className={styles.label}>数据类型</label>
            <div className={styles.typeList}>
              {(['normal', 'incomplete', 'error'] as TemplateType[]).map((type) => (
                <button
                  key={type}
                  className={`${styles.typeButton} ${selectedType === type ? styles.typeButtonActive : ''}`}
                  style={{ '--type-color': getTypeColor(type) } as React.CSSProperties}
                  onClick={() => {
                    setSelectedType(type);
                    setSelectedTemplate(null);
                  }}
                >
                  {getTypeLabel(type)}
                </button>
              ))}
            </div>
          </div>

          {/* 模板列表 */}
          <div className={styles.templateSection}>
            <label className={styles.label}>
              选择模板 ({filteredTemplates.length})
            </label>
            <div className={styles.templateList}>
              {filteredTemplates.length === 0 ? (
                <div className={styles.emptyMessage}>没有匹配的模板</div>
              ) : (
                filteredTemplates.map((template) => (
                  <div
                    key={template.id}
                    className={`${styles.templateItem} ${selectedTemplate?.id === template.id ? styles.templateItemSelected : ''}`}
                    onClick={() => setSelectedTemplate(template)}
                  >
                    <div className={styles.templateHeader}>
                      <span className={styles.templateName}>{template.name}</span>
                      <span
                        className={styles.templateType}
                        style={{ color: getTypeColor(template.type) }}
                      >
                        {getTypeLabel(template.type)}
                      </span>
                    </div>
                    <div className={styles.templateDescription}>{template.description}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 组合模式 */}
      {mode === 'combined' && (
        <div className={styles.combinedModeSection}>
          {/* 快速加载组合模板 */}
          <div className={styles.quickLoadSection}>
            <label className={styles.label}>快速加载预设</label>
            <div className={styles.quickLoadList}>
              {allTemplates.combined.map((template) => (
                <button
                  key={template.id}
                  className={styles.quickLoadButton}
                  onClick={() => handleQuickLoad(template)}
                >
                  {template.name}
                </button>
              ))}
            </div>
          </div>

          {/* 多选组合器 */}
          <div className={styles.multiSelectSection}>
            <label className={styles.label}>
              自由组合 ({selectedTemplates.length} 已选)
            </label>
            {(Object.keys(allTemplates) as TemplateCategory[])
              .filter((cat) => cat !== 'combined')
              .map((category) => {
                const categoryTemplates = allTemplates[category];
                return (
                  <div key={category} className={styles.categoryGroup}>
                    <div className={styles.categoryGroupHeader}>
                      {getCategoryLabel(category)}
                    </div>
                    <div className={styles.categoryTemplateList}>
                      {categoryTemplates.map((template) => {
                        const isSelected = selectedTemplates.some((t) => t.id === template.id);
                        return (
                          <button
                            key={template.id}
                            className={`${styles.multiSelectButton} ${isSelected ? styles.multiSelectButtonActive : ''}`}
                            onClick={() => toggleTemplateSelection(template)}
                            title={template.description}
                          >
                            {template.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* JSON 编辑器 */}
      <div className={styles.editorSection}>
        <div className={styles.editorHeader}>
          <label className={styles.label}>数据编辑器 (JSON)</label>
          <button
            className={styles.clearButton}
            onClick={() => setEditData('')}
          >
            清空
          </button>
        </div>
        <textarea
          className={styles.editor}
          value={editData}
          onChange={(e) => setEditData(e.target.value)}
          placeholder="输入 JSON 数据覆盖模板数据...&#10;例如: { 'character': { 'name': '新名字' } }"
          rows={8}
          spellCheck={false}
        />
      </div>

      {/* 操作按钮 */}
      <div className={styles.actionSection}>
        <button
          className={styles.sendButton}
          onClick={handleSend}
          disabled={
            (mode === 'single' && !selectedTemplate) ||
            (mode === 'combined' && selectedTemplates.length === 0 && !editData.trim())
          }
        >
          发送数据
        </button>
        <button
          className={styles.clearAllButton}
          onClick={clearSelection}
        >
          清空选择
        </button>
      </div>

      {/* 发送历史 */}
      {history.length > 0 && (
        <div className={styles.historySection}>
          <label className={styles.label}>发送历史</label>
          <div className={styles.historyList}>
            {history.map((item, index) => (
              <button
                key={index}
                className={styles.historyItem}
                onClick={() => handleHistoryClick(item.data)}
                title={new Date(item.timestamp).toLocaleString()}
              >
                <span className={styles.historyIndex}>#{index + 1}</span>
                <span className={styles.historyTime}>
                  {new Date(item.timestamp).toLocaleTimeString()}
                </span>
                <span className={styles.historyKeys}>
                  {Object.keys(item.data).join(', ')}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DataSimulatorPanel;
