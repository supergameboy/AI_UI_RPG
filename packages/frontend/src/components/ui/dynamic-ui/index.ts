/**
 * 动态 UI 组件导出
 */

// 类型导出
export type {
  DynamicUIAction,
  DynamicUIComponentProps,
  ParsedOption,
  ParsedTab,
  NotifyType,
  BadgeType,
  EnhancementItem,
  WarehouseTab,
  WarehouseItem,
  WarehouseSection,
  // 新增组件类型
  SkillNodeStatus,
  SkillNode,
  SkillTreeLayout,
  QuestStatus,
  QuestObjective,
  Quest,
  MinimapMarker,
  CharacterStats,
  DialogueMessage,
} from './types';

// 工具函数导出
export {
  parseAttrs,
  parseOptions,
  parseTabs,
  parseDynamicUIComponents,
  evaluateCondition,
  parseElseBranch,
  // 新增组件解析函数
  parseSkillNodes,
  parseQuests,
  parseMinimapMarkers,
  parseDialogueMessages,
  parseCharacterStats,
} from './utils';

// 组件导出
export { OptionsComponent } from './OptionsComponent';
export { ProgressComponent } from './ProgressComponent';
export { TabsComponent } from './TabsComponent';
export { SystemNotifyComponent } from './SystemNotifyComponent';
export { BadgeComponent } from './BadgeComponent';
export { TooltipComponent } from './TooltipComponent';
export { ConditionalComponent } from './ConditionalComponent';
export { EnhancementComponent } from './EnhancementComponent';
export { WarehouseComponent } from './WarehouseComponent';
// 新增组件导出
export { SkillTreeComponent } from './SkillTreeComponent';
export { QuestTrackerComponent } from './QuestTrackerComponent';
export { MinimapComponent } from './MinimapComponent';
export { CharacterStatusComponent } from './CharacterStatusComponent';
export { DialogueHistoryComponent } from './DialogueHistoryComponent';
