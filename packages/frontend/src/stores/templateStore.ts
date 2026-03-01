import { create } from 'zustand';
import type { StoryTemplate } from '@ai-rpg/shared';
import { templateService } from '../services/templateService';
import { useGameStore } from './gameStore';

const createEmptyTemplate = (): StoryTemplate => ({
  id: '',
  name: '新模板',
  description: '',
  version: '1.0.0',
  author: '用户',
  tags: [],
  gameMode: 'text_adventure',
  worldSetting: {
    name: '',
    description: '',
    era: '',
    technologyLevel: 'medieval',
    customFields: {},
  },
  characterCreation: {
    races: [],
    classes: [],
    backgrounds: [],
    attributes: [],
  },
  gameRules: {
    combatSystem: {
      type: 'turn_based',
      initiativeType: 'dexterity',
      actionPoints: 3,
      criticalHit: { threshold: 20, multiplier: 2 },
    },
    skillSystem: {
      maxLevel: 10,
      upgradeCost: { base: 1, multiplier: 1.5 },
      cooldownSystem: 'turn',
    },
    inventorySystem: {
      maxSlots: 50,
      stackSizes: {},
      weightSystem: false,
    },
    questSystem: {
      maxActive: 10,
      failConditions: [],
      timeSystem: false,
    },
  },
  aiConstraints: {
    tone: 'serious',
    contentRating: 'everyone',
    prohibitedTopics: [],
    requiredElements: [],
  },
  startingScene: {
    location: '',
    description: '',
    npcs: [],
    items: [],
    quests: [],
  },
});

export interface TemplateState {
  templates: StoryTemplate[];
  selectedTemplate: StoryTemplate | null;
  isLoading: boolean;
  error: string | null;
  editingTemplate: StoryTemplate | null;
  isEditing: boolean;
  isReadOnly: boolean;

  fetchTemplates: () => Promise<void>;
  selectTemplate: (template: StoryTemplate) => void;
  clearSelection: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  createNewTemplate: () => void;
  setEditingTemplate: (template: StoryTemplate, readOnly?: boolean) => void;
  updateEditingTemplate: (updates: Partial<StoryTemplate>) => void;
  clearEditingTemplate: () => void;
  saveTemplate: () => Promise<void>;
  duplicateTemplate: (template: StoryTemplate) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
}

export const useTemplateStore = create<TemplateState>((set, get) => ({
  templates: [],
  selectedTemplate: null,
  isLoading: false,
  error: null,
  editingTemplate: null,
  isEditing: false,
  isReadOnly: false,

  fetchTemplates: async () => {
    set({ isLoading: true, error: null });
    try {
      const result = await templateService.getTemplates();
      set({ templates: result.templates, isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取模板列表失败';
      set({ error: errorMessage, isLoading: false });
      console.error('Failed to fetch templates:', error);
    }
  },

  selectTemplate: (template: StoryTemplate) => {
    set({ selectedTemplate: template });
    useGameStore.getState().setTemplate(template.id, template.gameMode);
  },

  clearSelection: () => {
    set({ selectedTemplate: null });
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  setError: (error: string | null) => {
    set({ error });
  },

  createNewTemplate: () => {
    const emptyTemplate = createEmptyTemplate();
    set({
      editingTemplate: emptyTemplate,
      isEditing: true,
      isReadOnly: false,
    });
  },

  setEditingTemplate: (template: StoryTemplate, readOnly: boolean = false) => {
    set({
      editingTemplate: { ...template },
      isEditing: true,
      isReadOnly: readOnly,
    });
  },

  updateEditingTemplate: (updates: Partial<StoryTemplate>) => {
    const { editingTemplate } = get();
    if (editingTemplate) {
      set({
        editingTemplate: { ...editingTemplate, ...updates },
      });
    }
  },

  clearEditingTemplate: () => {
    set({
      editingTemplate: null,
      isEditing: false,
      isReadOnly: false,
    });
  },

  saveTemplate: async () => {
    const { editingTemplate, templates } = get();
    if (!editingTemplate) {
      set({ error: '没有正在编辑的模板' });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const isNewTemplate = !editingTemplate.id || editingTemplate.id === '';
      let savedTemplate: StoryTemplate;

      if (isNewTemplate) {
        const { id, ...templateData } = editingTemplate;
        savedTemplate = await templateService.createTemplate(templateData);
        set({
          templates: [...templates, savedTemplate],
          editingTemplate: savedTemplate,
          isLoading: false,
        });
      } else {
        savedTemplate = await templateService.updateTemplate(editingTemplate.id, editingTemplate);
        set({
          templates: templates.map((t) =>
            t.id === savedTemplate.id ? savedTemplate : t
          ),
          editingTemplate: savedTemplate,
          isLoading: false,
        });
      }

      const { selectedTemplate } = get();
      if (selectedTemplate && selectedTemplate.id === savedTemplate.id) {
        set({ selectedTemplate: savedTemplate });
        useGameStore.getState().setTemplate(savedTemplate.id, savedTemplate.gameMode);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '保存模板失败';
      set({ error: errorMessage, isLoading: false });
      console.error('Failed to save template:', error);
      throw error;
    }
  },

  duplicateTemplate: async (template: StoryTemplate) => {
    set({ isLoading: true, error: null });
    try {
      const { id, ...templateData } = template;
      const duplicatedTemplate = await templateService.createTemplate({
        ...templateData,
        name: `${template.name} (副本)`,
      });
      set((state) => ({
        templates: [...state.templates, duplicatedTemplate],
        isLoading: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '复制模板失败';
      set({ error: errorMessage, isLoading: false });
      console.error('Failed to duplicate template:', error);
      throw error;
    }
  },

  deleteTemplate: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await templateService.deleteTemplate(id);
      set((state) => {
        const newTemplates = state.templates.filter((t) => t.id !== id);
        const newSelectedTemplate =
          state.selectedTemplate?.id === id ? null : state.selectedTemplate;
        const newEditingTemplate =
          state.editingTemplate?.id === id ? null : state.editingTemplate;
        const newIsEditing =
          state.editingTemplate?.id === id ? false : state.isEditing;

        return {
          templates: newTemplates,
          selectedTemplate: newSelectedTemplate,
          editingTemplate: newEditingTemplate,
          isEditing: newIsEditing,
          isLoading: false,
        };
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '删除模板失败';
      set({ error: errorMessage, isLoading: false });
      console.error('Failed to delete template:', error);
      throw error;
    }
  },
}));
