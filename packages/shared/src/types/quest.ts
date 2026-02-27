export interface Quest {
  id: string;
  name: string;
  description: string;
  type: 'main' | 'side' | 'daily' | 'hidden';

  status: 'locked' | 'available' | 'in_progress' | 'completed' | 'failed';

  objectives: QuestObjective[];

  rewards: QuestReward[];

  prerequisites?: string[];

  timeLimit?: number;

  giver?: string;
  location?: string;
}

export interface QuestObjective {
  id: string;
  description: string;
  type: 'kill' | 'collect' | 'talk' | 'explore' | 'custom';
  target: string;
  current: number;
  required: number;
  completed: boolean;
}

export interface QuestReward {
  type: 'experience' | 'currency' | 'item' | 'skill' | 'reputation' | 'custom';
  value: number | string;
  quantity?: number;
}
