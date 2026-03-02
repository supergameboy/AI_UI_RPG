/**
 * 地图 API 路由
 * 提供地图管理的 RESTful API 接口
 */

import { Router, Request, Response } from 'express';
import type { Router as RouterType } from 'express';
import { getMapService } from '../services/MapService';
import type { World, Region, Location } from '@ai-rpg/shared';

const router: RouterType = Router();

interface CreateWorldRequest {
  saveId: string;
  world: Partial<World>;
  regions?: Partial<Region>[];
}

interface MoveRequest {
  targetLocationId: string;
  method?: 'walk' | 'teleport' | 'portal' | 'custom';
}

interface ExploreRequest {
  locationId?: string;
  depth?: 'shallow' | 'normal' | 'deep';
}

interface CreateLocationRequest {
  regionId: string;
  location: Partial<Location>;
}

interface CreateConnectionRequest {
  fromLocationId: string;
  toLocationId: string;
  type?: string;
  travelTime?: number;
  bidirectional?: boolean;
}

router.get('/:characterId', async (req: Request, res: Response) => {
  try {
    const mapService = getMapService();
    const { characterId } = req.params;

    const result = mapService.getMapState(characterId);

    res.json(result);
  } catch (error) {
    console.error('[MapRoutes] Error getting map state:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取地图状态失败',
    });
  }
});

router.get('/:characterId/location', async (req: Request, res: Response) => {
  try {
    const mapService = getMapService();
    const { characterId } = req.params;

    const characterLocation = mapService.getCharacterLocation(characterId);

    if (!characterLocation) {
      return res.status(404).json({
        success: false,
        message: '角色位置未设置',
      });
    }

    const location = mapService.getLocation(characterLocation.locationId);

    res.json({
      success: true,
      characterLocation,
      location,
    });
  } catch (error) {
    console.error('[MapRoutes] Error getting current location:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取当前位置失败',
    });
  }
});

router.post('/:characterId/move', async (req: Request, res: Response) => {
  try {
    const mapService = getMapService();
    const { characterId } = req.params;
    const { targetLocationId, method } = req.body as MoveRequest;

    if (!targetLocationId) {
      return res.status(400).json({
        success: false,
        message: '缺少必需参数: targetLocationId',
      });
    }

    const result = mapService.moveToLocation(characterId, targetLocationId, method);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('[MapRoutes] Error moving to location:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '移动失败',
    });
  }
});

router.post('/:characterId/explore', async (req: Request, res: Response) => {
  try {
    const mapService = getMapService();
    const { characterId } = req.params;
    const { locationId, depth } = req.body as ExploreRequest;

    const result = mapService.exploreArea(characterId, locationId, depth);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('[MapRoutes] Error exploring area:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '探索失败',
    });
  }
});

router.get('/:characterId/connections', async (req: Request, res: Response) => {
  try {
    const mapService = getMapService();
    const { characterId } = req.params;

    const result = mapService.getAvailableConnections(characterId);

    res.json(result);
  } catch (error) {
    console.error('[MapRoutes] Error getting connections:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取连接失败',
    });
  }
});

router.get('/locations/:locationId', async (req: Request, res: Response) => {
  try {
    const mapService = getMapService();
    const { locationId } = req.params;

    const result = mapService.getLocationDetails(locationId);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('[MapRoutes] Error getting location details:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取地点详情失败',
    });
  }
});

router.post('/worlds', async (req: Request, res: Response) => {
  try {
    const mapService = getMapService();
    const { saveId, world } = req.body as CreateWorldRequest;

    if (!saveId || !world) {
      return res.status(400).json({
        success: false,
        message: '缺少必需参数: saveId, world',
      });
    }

    const result = mapService.createWorld(saveId, world);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json(result);
  } catch (error) {
    console.error('[MapRoutes] Error creating world:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '创建世界失败',
    });
  }
});

router.get('/worlds/:worldId', async (req: Request, res: Response) => {
  try {
    const mapService = getMapService();
    const { worldId } = req.params;

    const world = mapService.getWorld(worldId);

    if (!world) {
      return res.status(404).json({
        success: false,
        message: '世界不存在',
      });
    }

    res.json({
      success: true,
      world,
    });
  } catch (error) {
    console.error('[MapRoutes] Error getting world:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取世界失败',
    });
  }
});

router.get('/worlds/:worldId/regions', async (req: Request, res: Response) => {
  try {
    const mapService = getMapService();
    const { worldId } = req.params;

    const regions = mapService.getRegionsByWorldId(worldId);

    res.json({
      success: true,
      regions,
    });
  } catch (error) {
    console.error('[MapRoutes] Error getting regions:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取区域失败',
    });
  }
});

router.post('/regions', async (req: Request, res: Response) => {
  try {
    const mapService = getMapService();
    const { worldId, region } = req.body as { worldId: string; region: Partial<Region> };

    if (!worldId || !region) {
      return res.status(400).json({
        success: false,
        message: '缺少必需参数: worldId, region',
      });
    }

    const result = mapService.createRegion(worldId, region);

    res.status(201).json({
      success: true,
      region: result,
    });
  } catch (error) {
    console.error('[MapRoutes] Error creating region:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '创建区域失败',
    });
  }
});

router.get('/regions/:regionId/locations', async (req: Request, res: Response) => {
  try {
    const mapService = getMapService();
    const { regionId } = req.params;

    const locations = mapService.getLocationsByRegionId(regionId);

    res.json({
      success: true,
      locations,
    });
  } catch (error) {
    console.error('[MapRoutes] Error getting locations:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取地点失败',
    });
  }
});

router.post('/locations', async (req: Request, res: Response) => {
  try {
    const mapService = getMapService();
    const { regionId, location } = req.body as CreateLocationRequest;

    if (!regionId || !location) {
      return res.status(400).json({
        success: false,
        message: '缺少必需参数: regionId, location',
      });
    }

    const result = mapService.createLocation(regionId, location);

    res.status(201).json({
      success: true,
      location: result,
    });
  } catch (error) {
    console.error('[MapRoutes] Error creating location:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '创建地点失败',
    });
  }
});

router.post('/connections', async (req: Request, res: Response) => {
  try {
    const mapService = getMapService();
    const { fromLocationId, toLocationId, type, travelTime, bidirectional } = req.body as CreateConnectionRequest;

    if (!fromLocationId || !toLocationId) {
      return res.status(400).json({
        success: false,
        message: '缺少必需参数: fromLocationId, toLocationId',
      });
    }

    const result = mapService.createConnection(
      fromLocationId,
      toLocationId,
      type,
      travelTime,
      bidirectional
    );

    res.status(201).json({
      success: true,
      connection: result,
    });
  } catch (error) {
    console.error('[MapRoutes] Error creating connection:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '创建连接失败',
    });
  }
});

router.post('/initialize', async (req: Request, res: Response) => {
  try {
    const mapService = getMapService();
    const { saveId, template } = req.body as {
      saveId: string;
      template: { name: string; description?: string };
    };

    if (!saveId || !template) {
      return res.status(400).json({
        success: false,
        message: '缺少必需参数: saveId, template',
      });
    }

    const world = mapService.initializeWorld(saveId, template);

    res.status(201).json({
      success: true,
      world,
    });
  } catch (error) {
    console.error('[MapRoutes] Error initializing world:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '初始化世界失败',
    });
  }
});

export default router;
