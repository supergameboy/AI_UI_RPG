import type { Binding, AgentType, BindingMatch } from '@ai-rpg/shared';

export type { Binding, AgentType, BindingMatch };

export interface BindingFormData {
  id?: string;
  agentId: AgentType;
  match: BindingMatch;
  priority: number;
  enabled: boolean;
  description?: string;
}

export interface BindingEditModalProps {
  open: boolean;
  binding: Binding | null;
  onClose: () => void;
  onSave: (data: BindingFormData) => Promise<void>;
}

export interface BindingConfigPanelProps {
  onClose?: () => void;
}
