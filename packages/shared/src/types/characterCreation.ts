import type { RaceDefinition, ClassDefinition, BackgroundDefinition, AttributeDefinition } from './template';

export type CharacterCreationStep = 'name' | 'race' | 'class' | 'background' | 'confirm';

export interface GeneratedRaceOption extends RaceDefinition {
  isAIGenerated: true;
}

export interface GeneratedClassOption extends ClassDefinition {
  isAIGenerated: true;
}

export interface GeneratedBackgroundOption extends BackgroundDefinition {
  isAIGenerated: true;
}

export interface CharacterCreationState {
  currentStep: CharacterCreationStep;
  characterName: string;
  selectedRace: RaceDefinition | GeneratedRaceOption | null;
  selectedClass: ClassDefinition | GeneratedClassOption | null;
  selectedBackground: BackgroundDefinition | GeneratedBackgroundOption | null;
  
  templateRaces: RaceDefinition[];
  templateClasses: ClassDefinition[];
  templateBackgrounds: BackgroundDefinition[];
  templateAttributes: AttributeDefinition[];
  
  aiGeneratedRaces: GeneratedRaceOption[];
  aiGeneratedClasses: GeneratedClassOption[];
  aiGeneratedBackgrounds: GeneratedBackgroundOption[];
  
  calculatedAttributes: Record<string, number>;
  generatedAppearance: string;
  generatedImagePrompt: string;
  generatedBackstory: string;
  
  isLoading: boolean;
  loadingMessage: string;
  error: string | null;
}

export interface CharacterCreationOptions {
  aiRandomGeneration: boolean;
  generateImagePrompt: boolean;
}

export interface AttributeCalculation {
  baseValue: number;
  raceBonus: number;
  classBonus: number;
  backgroundBonus: number;
  finalValue: number;
}

export interface AttributeCalculationResult {
  [attributeId: string]: AttributeCalculation;
}
