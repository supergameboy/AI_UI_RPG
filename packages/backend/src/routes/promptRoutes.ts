import { Router, Request, Response } from 'express';
import type { Router as RouterType } from 'express';
import { AgentType } from '@ai-rpg/shared';
import { initializePromptService } from '../services/PromptService';

const router: RouterType = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    const promptService = await initializePromptService();
    const templates = promptService.getAllTemplates();
    
    res.json({
      success: true,
      data: templates,
    });
  } catch (error) {
    console.error('[PromptRoutes] Error getting templates:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get templates',
    });
  }
});

router.get('/:agentType', async (req: Request, res: Response) => {
  try {
    const { agentType } = req.params;
    
    if (!Object.values(AgentType).includes(agentType as AgentType)) {
      return res.status(400).json({
        success: false,
        error: `Invalid agent type: ${agentType}`,
      });
    }

    const promptService = await initializePromptService();
    const template = promptService.getTemplate(agentType as AgentType);
    
    if (!template) {
      return res.status(404).json({
        success: false,
        error: `Template not found for agent type: ${agentType}`,
      });
    }
    
    res.json({
      success: true,
      data: template,
    });
  } catch (error) {
    console.error('[PromptRoutes] Error getting template:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get template',
    });
  }
});

router.put('/:agentType', async (req: Request, res: Response) => {
  try {
    const { agentType } = req.params;
    const { content, name, description } = req.body;
    
    if (!Object.values(AgentType).includes(agentType as AgentType)) {
      return res.status(400).json({
        success: false,
        error: `Invalid agent type: ${agentType}`,
      });
    }

    if (!content && !name && !description) {
      return res.status(400).json({
        success: false,
        error: 'At least one field (content, name, description) must be provided',
      });
    }

    const promptService = await initializePromptService();
    const updated = await promptService.updateTemplate(agentType as AgentType, {
      content,
      name,
      description,
    });
    
    if (!updated) {
      return res.status(404).json({
        success: false,
        error: `Template not found for agent type: ${agentType}`,
      });
    }
    
    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error('[PromptRoutes] Error updating template:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update template',
    });
  }
});

router.post('/:agentType/reset', async (req: Request, res: Response) => {
  try {
    const { agentType } = req.params;
    
    if (!Object.values(AgentType).includes(agentType as AgentType)) {
      return res.status(400).json({
        success: false,
        error: `Invalid agent type: ${agentType}`,
      });
    }

    const promptService = await initializePromptService();
    const reset = promptService.resetTemplate(agentType as AgentType);
    
    if (!reset) {
      return res.status(404).json({
        success: false,
        error: `Cannot reset template for agent type: ${agentType}`,
      });
    }
    
    res.json({
      success: true,
      data: reset,
    });
  } catch (error) {
    console.error('[PromptRoutes] Error resetting template:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reset template',
    });
  }
});

router.get('/:agentType/versions', async (req: Request, res: Response) => {
  try {
    const { agentType } = req.params;
    
    if (!Object.values(AgentType).includes(agentType as AgentType)) {
      return res.status(400).json({
        success: false,
        error: `Invalid agent type: ${agentType}`,
      });
    }

    const promptService = await initializePromptService();
    const versions = promptService.getVersions(agentType as AgentType);
    
    res.json({
      success: true,
      data: versions,
    });
  } catch (error) {
    console.error('[PromptRoutes] Error getting versions:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get versions',
    });
  }
});

router.get('/:agentType/versions/:version', async (req: Request, res: Response) => {
  try {
    const { agentType, version } = req.params;
    const versionNum = parseInt(version, 10);
    
    if (!Object.values(AgentType).includes(agentType as AgentType)) {
      return res.status(400).json({
        success: false,
        error: `Invalid agent type: ${agentType}`,
      });
    }

    if (isNaN(versionNum) || versionNum < 1) {
      return res.status(400).json({
        success: false,
        error: 'Version must be a positive integer',
      });
    }

    const promptService = await initializePromptService();
    const versionData = promptService.getVersion(agentType as AgentType, versionNum);
    
    if (!versionData) {
      return res.status(404).json({
        success: false,
        error: `Version ${version} not found for agent type: ${agentType}`,
      });
    }
    
    res.json({
      success: true,
      data: versionData,
    });
  } catch (error) {
    console.error('[PromptRoutes] Error getting version:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get version',
    });
  }
});

router.post('/:agentType/rollback/:version', async (req: Request, res: Response) => {
  try {
    const { agentType, version } = req.params;
    const versionNum = parseInt(version, 10);
    
    if (!Object.values(AgentType).includes(agentType as AgentType)) {
      return res.status(400).json({
        success: false,
        error: `Invalid agent type: ${agentType}`,
      });
    }

    if (isNaN(versionNum) || versionNum < 1) {
      return res.status(400).json({
        success: false,
        error: 'Version must be a positive integer',
      });
    }

    const promptService = await initializePromptService();
    const rolledBack = promptService.rollbackToVersion(agentType as AgentType, versionNum);
    
    if (!rolledBack) {
      return res.status(404).json({
        success: false,
        error: `Cannot rollback to version ${version} for agent type: ${agentType}`,
      });
    }
    
    res.json({
      success: true,
      data: rolledBack,
    });
  } catch (error) {
    console.error('[PromptRoutes] Error rolling back:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to rollback',
    });
  }
});

router.post('/:agentType/test', async (req: Request, res: Response) => {
  try {
    const { agentType } = req.params;
    const { testInput, context } = req.body;
    
    if (!Object.values(AgentType).includes(agentType as AgentType)) {
      return res.status(400).json({
        success: false,
        error: `Invalid agent type: ${agentType}`,
      });
    }

    if (!testInput || typeof testInput !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'testInput is required and must be a string',
      });
    }

    const promptService = await initializePromptService();
    const result = await promptService.executeTest(
      agentType as AgentType,
      testInput,
      context
    );
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('[PromptRoutes] Error executing test:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to execute test',
    });
  }
});

router.get('/:agentType/test-results', async (req: Request, res: Response) => {
  try {
    const { agentType } = req.params;
    const limit = parseInt(req.query.limit as string, 10) || 50;
    
    if (!Object.values(AgentType).includes(agentType as AgentType)) {
      return res.status(400).json({
        success: false,
        error: `Invalid agent type: ${agentType}`,
      });
    }

    const promptService = await initializePromptService();
    const results = promptService.getTestResults(agentType as AgentType, limit);
    
    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('[PromptRoutes] Error getting test results:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get test results',
    });
  }
});

export default router;
