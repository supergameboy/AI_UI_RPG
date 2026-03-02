/**
 * NPC API 路由
 * 提供NPC管理的 RESTful API 接口
 */

import { Router, Request, Response } from 'express';
import type { Router as RouterType } from 'express';
import { getNPCService } from '../services/NPCService';
import type { NPC, InteractionRequest, AddPartyMemberRequest, RemovePartyMemberRequest, UpdateRelationshipRequest } from '@ai-rpg/shared';

const router: RouterType = Router();

interface CreateNPCRequest {
  saveId: string;
  npc: Partial<NPC>;
}

router.get('/:characterId', async (req: Request, res: Response) => {
  try {
    const npcService = getNPCService();
    const { saveId } = req.query;

    if (!saveId) {
      return res.status(400).json({
        success: false,
        message: '缺少必需参数: saveId',
      });
    }

    const result = npcService.getNPCsBySaveId(saveId as string);

    res.json(result);
  } catch (error) {
    console.error('[NPCRoutes] Error getting NPCs:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取NPC列表失败',
    });
  }
});

router.get('/:characterId/:npcId', async (req: Request, res: Response) => {
  try {
    const npcService = getNPCService();
    const { characterId, npcId } = req.params;

    const result = npcService.getNPC(npcId, characterId);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('[NPCRoutes] Error getting NPC:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取NPC详情失败',
    });
  }
});

router.get('/:characterId/:npcId/relationship', async (req: Request, res: Response) => {
  try {
    const npcService = getNPCService();
    const { characterId, npcId } = req.params;

    const result = npcService.getRelationship(characterId, npcId);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('[NPCRoutes] Error getting relationship:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取关系失败',
    });
  }
});

router.post('/:characterId/:npcId/interact', async (req: Request, res: Response) => {
  try {
    const npcService = getNPCService();
    const { characterId, npcId } = req.params;
    const { type, data } = req.body;

    if (!type) {
      return res.status(400).json({
        success: false,
        message: '缺少必需参数: type',
      });
    }

    const request: InteractionRequest = {
      characterId,
      npcId,
      type,
      data,
    };

    const result = npcService.interact(request);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('[NPCRoutes] Error interacting with NPC:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '互动失败',
    });
  }
});

router.patch('/:characterId/:npcId/relationship', async (req: Request, res: Response) => {
  try {
    const npcService = getNPCService();
    const { characterId, npcId } = req.params;
    const updates = req.body;

    const request: UpdateRelationshipRequest = {
      characterId,
      npcId,
      ...updates,
    };

    const result = npcService.updateRelationship(request);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('[NPCRoutes] Error updating relationship:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '更新关系失败',
    });
  }
});

router.get('/:characterId/party', async (req: Request, res: Response) => {
  try {
    const npcService = getNPCService();
    const { characterId } = req.params;

    const result = npcService.getParty(characterId);

    res.json(result);
  } catch (error) {
    console.error('[NPCRoutes] Error getting party:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取队伍失败',
    });
  }
});

router.post('/:characterId/party/add', async (req: Request, res: Response) => {
  try {
    const npcService = getNPCService();
    const { characterId } = req.params;
    const { npcId, role } = req.body;

    if (!npcId) {
      return res.status(400).json({
        success: false,
        message: '缺少必需参数: npcId',
      });
    }

    const request: AddPartyMemberRequest = {
      characterId,
      npcId,
      role,
    };

    const result = npcService.addPartyMember(request);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('[NPCRoutes] Error adding party member:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '添加队员失败',
    });
  }
});

router.post('/:characterId/party/remove', async (req: Request, res: Response) => {
  try {
    const npcService = getNPCService();
    const { characterId } = req.params;
    const { npcId } = req.body;

    if (!npcId) {
      return res.status(400).json({
        success: false,
        message: '缺少必需参数: npcId',
      });
    }

    const request: RemovePartyMemberRequest = {
      characterId,
      npcId,
    };

    const result = npcService.removePartyMember(request);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('[NPCRoutes] Error removing party member:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '移除队员失败',
    });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const npcService = getNPCService();
    const { saveId, npc } = req.body as CreateNPCRequest;

    if (!saveId || !npc) {
      return res.status(400).json({
        success: false,
        message: '缺少必需参数: saveId, npc',
      });
    }

    const result = npcService.createNPC(saveId, npc);

    res.status(201).json({
      success: true,
      npc: result,
    });
  } catch (error) {
    console.error('[NPCRoutes] Error creating NPC:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '创建NPC失败',
    });
  }
});

router.put('/:npcId', async (req: Request, res: Response) => {
  try {
    const npcService = getNPCService();
    const { npcId } = req.params;
    const updates = req.body as Partial<NPC>;

    const result = npcService.updateNPC(npcId, updates);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'NPC不存在',
      });
    }

    res.json({
      success: true,
      message: 'NPC更新成功',
    });
  } catch (error) {
    console.error('[NPCRoutes] Error updating NPC:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '更新NPC失败',
    });
  }
});

router.delete('/:npcId', async (req: Request, res: Response) => {
  try {
    const npcService = getNPCService();
    const { npcId } = req.params;

    const result = npcService.deleteNPC(npcId);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'NPC不存在',
      });
    }

    res.json({
      success: true,
      message: 'NPC删除成功',
    });
  } catch (error) {
    console.error('[NPCRoutes] Error deleting NPC:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '删除NPC失败',
    });
  }
});

router.get('/location/:locationId', async (req: Request, res: Response) => {
  try {
    const npcService = getNPCService();
    const { locationId } = req.params;
    const { saveId } = req.query;

    if (!saveId) {
      return res.status(400).json({
        success: false,
        message: '缺少必需参数: saveId',
      });
    }

    const npcs = npcService.getNPCsByLocation(locationId, saveId as string);

    res.json({
      success: true,
      npcs,
    });
  } catch (error) {
    console.error('[NPCRoutes] Error getting NPCs by location:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取地点NPC失败',
    });
  }
});

export default router;
