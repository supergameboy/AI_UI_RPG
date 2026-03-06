import { getToolRegistry } from './ToolRegistry';
import { InventoryDataTool } from './implementations/InventoryDataTool';
import { SkillDataTool } from './implementations/SkillDataTool';
import { MapDataTool } from './implementations/MapDataTool';
import { QuestDataTool } from './implementations/QuestDataTool';
import { NPCDataTool } from './implementations/NPCDataTool';
import { EventDataTool } from './implementations/EventDataTool';
import { StoryDataTool } from './implementations/StoryDataTool';
import { UIDataTool } from './implementations/UIDataTool';
import { DialogueDataTool } from './implementations/DialogueDataTool';
import { CombatDataTool } from './implementations/CombatDataTool';
import { NumericalTool } from './implementations/NumericalTool';

export function initializeTools(): void {
  const registry = getToolRegistry();

  // 注册所有 Tool
  registry.registerTool(new InventoryDataTool());
  registry.registerTool(new SkillDataTool());
  registry.registerTool(new MapDataTool());
  registry.registerTool(new QuestDataTool());
  registry.registerTool(new NPCDataTool());
  registry.registerTool(new EventDataTool());
  registry.registerTool(new StoryDataTool());
  registry.registerTool(new UIDataTool());
  registry.registerTool(new DialogueDataTool());
  registry.registerTool(new CombatDataTool());
  registry.registerTool(new NumericalTool());

  console.log(`[ToolRegistry] Registered ${registry.getToolCount()} tools`);
}
