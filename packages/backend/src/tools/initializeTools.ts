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
import { gameLog } from '../services/GameLogService';

export async function initializeTools(): Promise<void> {
  const registry = getToolRegistry();

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

  await registry.initializeAll();

  gameLog.info('backend', `Registered and initialized ${registry.getToolCount()} tools`);
}
