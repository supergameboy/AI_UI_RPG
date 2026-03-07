import React, { useMemo } from 'react';
import type { DynamicUIComponentProps } from './types';
import { evaluateCondition, parseElseBranch } from './utils';
import { MarkdownRenderer } from '../MarkdownRenderer';
import styles from './ConditionalComponent.module.css';

/**
 * 条件显示组件
 * 
 * 解析格式: {condition="..."}
 * 
 * 支持的条件类型:
 * - hasItem:item_id - 拥有物品
 * - hasSkill:skill_id - 拥有技能
 * - hasQuest:quest_id - 拥有任务
 * - level >= N - 等级比较
 * - gold >= N - 金币比较
 * - faction:faction_id - 阵营检查
 * - reputation >= N - 声望比较
 * 
 * 支持的比较运算符：>=, <=, >, <, ==, !=
 * 支持的逻辑运算符：AND, OR, NOT (也支持 &&, ||, !)
 * 
 * 示例:
 * :::conditional{condition="hasItem:magic-key"}
 * 你使用魔法钥匙打开了宝箱！
 * :::
 * 
 * :::conditional{condition="level>=10"}
 * 你已达到足够等级，可以进入地下城。
 * :::
 * 
 * :::conditional{condition="hasItem:key AND hasSkill:lockpick"}
 * 你成功撬开了锁！
 * :::else:
 * 锁太复杂了，你需要钥匙和撬锁技能。
 * :::
 * 
 * :::conditional{condition="level >= 10 AND gold >= 100"}
 * 你购买了高级装备！
 * :::else:
 * 你需要等级 10 和 100 金币才能购买。
 * :::
 */
export const ConditionalComponent: React.FC<DynamicUIComponentProps> = ({
  content,
  attrs,
  context = {},
  onAction,
}) => {
  // 解析 else 分支
  const { trueContent, elseContent } = useMemo(() => {
    return parseElseBranch(content);
  }, [content]);

  // 评估条件
  const shouldShow = useMemo(() => {
    const condition = attrs.condition || '';
    return evaluateCondition(condition, context);
  }, [attrs.condition, context]);

  // 条件满足时渲染 true 内容
  if (shouldShow) {
    return (
      <div className={styles.conditionalContent}>
        <MarkdownRenderer content={trueContent.trim()} onAction={onAction} context={context} />
      </div>
    );
  }

  // 条件不满足时，如果有 else 分支则渲染 else 内容
  if (elseContent) {
    return (
      <div className={styles.conditionalContent}>
        <MarkdownRenderer content={elseContent.trim()} onAction={onAction} context={context} />
      </div>
    );
  }

  // 条件不满足且没有 else 分支，不渲染任何内容
  return null;
};

export default ConditionalComponent;
